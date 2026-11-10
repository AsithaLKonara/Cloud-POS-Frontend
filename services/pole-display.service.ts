/**
 * Universal POS Pole Display & Customer Display Engine
 * Supports 2x20 VFD/LCD Character Pole Displays and Dual-Screen Graphic Monitors.
 * Compatible with Windows 7 (Chrome 109 / Serial) and Windows 10/11.
 */

import { CustomerDisplayState } from './hardware.service';

export type PoleDisplayProtocol = 'PRICE_DISPLAY' | 'CD5220' | 'ESCPOS' | 'UTC' | 'AEDEX';
export type PoleDisplayTransport = 'BRIDGE' | 'WEBSERIAL';
export type PoleDisplayMode = 'VFD_2X20' | 'DUAL_SCREEN' | 'BOTH' | 'DISABLED';

export interface PoleDisplayConfig {
  enabled: boolean;
  mode: PoleDisplayMode;
  transport: PoleDisplayTransport;
  port: string;
  baudRate: number;
  protocol: PoleDisplayProtocol;
  storeName: string;
  welcomeMessage: string;
  changeDisplayTimeoutSeconds: number;
}

export const DEFAULT_POLE_DISPLAY_CONFIG: PoleDisplayConfig = {
  enabled: true,
  mode: 'BOTH',
  transport: 'BRIDGE',
  port: 'COM3',
  baudRate: 9600,
  protocol: 'CD5220',
  storeName: 'XONIT POS',
  welcomeMessage: 'WELCOME! PLEASE PAY',
  changeDisplayTimeoutSeconds: 7,
};

const STORAGE_KEY = 'xonit_pos_pole_display_config';

export class PoleDisplayService {
  private config: PoleDisplayConfig = { ...DEFAULT_POLE_DISPLAY_CONFIG };
  private serialPort: any = null;
  private writer: any = null;
  private isConnected = false;
  private revertTimer: any = null;

  constructor() {
    this.loadConfig();
  }

  loadConfig(): PoleDisplayConfig {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          this.config = { ...DEFAULT_POLE_DISPLAY_CONFIG, ...JSON.parse(stored) };
        }
      } catch (e) {
        console.warn('Failed to parse stored pole display config:', e);
      }
    }
    return this.config;
  }

  saveConfig(newConfig: Partial<PoleDisplayConfig>): PoleDisplayConfig {
    this.config = { ...this.config, ...newConfig };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
      } catch (e) {
        console.warn('Failed to save pole display config to localStorage:', e);
      }
    }
    return this.config;
  }

  getConfig(): PoleDisplayConfig {
    return { ...this.config };
  }

  isWebSerialSupported(): boolean {
    return typeof window !== 'undefined' && 'serial' in navigator;
  }

  isWebSerialConnected(): boolean {
    return this.isConnected && this.writer !== null;
  }

  /**
   * Connects to a physical or USB-to-Serial COM port using the browser's WebSerial API.
   * Works on Chrome 89+ on Windows 7 (Chrome 109) and Windows 10/11.
   */
  async connectWebSerial(customBaudRate?: number): Promise<boolean> {
    if (!this.isWebSerialSupported()) {
      throw new Error('WebSerial API is not supported in this browser. Use Chrome or Edge.');
    }

    try {
      const baudRate = customBaudRate || this.config.baudRate || 9600;
      const port = await (navigator as any).serial.requestPort();
      await port.open({
        baudRate,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none',
      });

      this.serialPort = port;
      this.writer = port.writable.getWriter();
      this.isConnected = true;

      // Send initial welcome message or price reset
      if (this.config.protocol === 'PRICE_DISPLAY') {
        await this.sendPriceDisplay('0.00', 'NONE');
      } else {
        const welcome = this.formatIdle(this.config.storeName, this.config.welcomeMessage);
        await this.sendLinesDirect(welcome.line1, welcome.line2);
      }

      return true;
    } catch (err: any) {
      this.isConnected = false;
      this.writer = null;
      this.serialPort = null;
      if (err.name !== 'NotFoundError') {
        console.error('WebSerial connection error:', err);
      }
      return false;
    }
  }

  async disconnectWebSerial(): Promise<void> {
    try {
      if (this.writer) {
        await this.writer.close();
        this.writer = null;
      }
      if (this.serialPort) {
        await this.serialPort.close();
        this.serialPort = null;
      }
    } catch (e) {
      console.warn('Error closing WebSerial port:', e);
    } finally {
      this.isConnected = false;
    }
  }

  /**
   * Formats a string to exactly `width` characters with ASCII cleaning.
   */
  formatLine(text: string, width = 20): string {
    const clean = (text || '')
      .replace(/[^\x20-\x7E]/g, '') // Only printable standard ASCII
      .trim();
    if (clean.length > width) {
      return clean.substring(0, width);
    }
    return clean.padEnd(width, ' ');
  }

  /**
   * Centers text within `width` characters.
   */
  centerText(text: string, width = 20): string {
    const clean = (text || '').replace(/[^\x20-\x7E]/g, '').trim();
    if (clean.length >= width) return clean.substring(0, width);
    const leftPad = Math.floor((width - clean.length) / 2);
    const rightPad = width - clean.length - leftPad;
    return ' '.repeat(leftPad) + clean + ' '.repeat(rightPad);
  }

  /**
   * Creates a two-column 20-character line (left aligned + right aligned).
   */
  makeTwoColumnLine(left: string, right: string, width = 20): string {
    const cleanRight = (right || '').replace(/[^\x20-\x7E]/g, '').trim();
    const availableForLeft = Math.max(0, width - cleanRight.length - 1);
    const cleanLeft = (left || '').replace(/[^\x20-\x7E]/g, '').trim().substring(0, availableForLeft);
    const spaces = Math.max(1, width - cleanLeft.length - cleanRight.length);
    return cleanLeft + ' '.repeat(spaces) + cleanRight;
  }

  formatIdle(storeName = 'XONIT POS', greeting = 'WELCOME! PLEASE PAY'): { line1: string; line2: string } {
    return {
      line1: this.centerText(storeName, 20),
      line2: this.centerText(greeting, 20),
    };
  }

  formatItem(name: string, price: number, qty = 1, subtotal?: number): { line1: string; line2: string } {
    const priceStr = price.toFixed(2);
    const line1 = this.makeTwoColumnLine(name, priceStr, 20);

    const calcSubtotal = subtotal !== undefined ? subtotal : price * qty;
    const subStr = `SUB:${calcSubtotal.toFixed(0)}`;
    const qtyStr = `QTY:${qty}`;
    const line2 = this.makeTwoColumnLine(qtyStr, subStr, 20);

    return { line1, line2 };
  }

  formatPayment(subtotal: number, totalDue: number): { line1: string; line2: string } {
    return {
      line1: this.makeTwoColumnLine('SUBTOTAL:', `Rs.${subtotal.toLocaleString()}`, 20),
      line2: this.makeTwoColumnLine('TOTAL DUE:', `Rs.${totalDue.toLocaleString()}`, 20),
    };
  }

  formatCompleted(amountPaid: number, changeDue: number): { line1: string; line2: string } {
    return {
      line1: this.makeTwoColumnLine('PAID CASH:', `Rs.${amountPaid.toLocaleString()}`, 20),
      line2: this.makeTwoColumnLine('CHANGE DUE:', `Rs.${changeDue.toLocaleString()}`, 20),
    };
  }

  /**
   * Generates protocol binary commands as a Uint8Array.
   */
  buildBuffer(line1: string, line2: string, protocol?: PoleDisplayProtocol): Uint8Array {
    const proto = protocol || this.config.protocol || 'CD5220';
    const l1 = this.formatLine(line1, 20);
    const l2 = this.formatLine(line2, 20);
    const encoder = new TextEncoder();
    const parts: number[] = [];

    switch (proto) {
      case 'PRICE_DISPLAY': {
        // Single-line 8-digit LED / VFD Price Display (ESC Q A protocol, e.g. LED8 / LED8N / DSP-840)
        // Command sequence:
        // 1. CLR (0x0C)
        // 2. Set Status Lamp: ESC s <n> (0x1B, 0x73, 0x30 + indicator: 0=All Off, 1=Price, 2=Total, 3=Collect, 4=Change)
        // 3. Display Data: ESC Q A <numeric digits> CR (0x1B, 0x51, 0x41, ..., 0x0D)
        const combined = `${line1} ${line2}`;
        const noCommas = combined.replace(/,/g, '');
        let indicator = 0; // 0=None, 1=Price, 2=Total, 3=Collect, 4=Change
        let amountStr = '0.00';

        if (/change/i.test(noCommas)) {
          indicator = 4; // Change lamp
          const m = noCommas.match(/\bchange(?:\s+due)?[:\s]+(?:rs\.?\s*)?(\d+(?:\.\d+)?)/i);
          amountStr = (m && m[1]) || (noCommas.match(/-?\d+(?:\.\d+)?/)?.[0] || '0.00');
        } else if (/\btotal|subtotal|due/i.test(noCommas)) {
          indicator = 2; // Total lamp
          const m = noCommas.match(/\btotal(?:\s+due)?[:\s]+(?:rs\.?\s*)?(\d+(?:\.\d+)?)/i) ||
                    noCommas.match(/\bsubtotal[:\s]+(?:rs\.?\s*)?(\d+(?:\.\d+)?)/i);
          amountStr = (m && m[1]) || (noCommas.match(/-?\d+(?:\.\d+)?/)?.[0] || '0.00');
        } else if (/paid|cash|collect/i.test(noCommas)) {
          indicator = 3; // Collect lamp
          const m = noCommas.match(/\b(?:paid|cash|collect)[:\s]+(?:rs\.?\s*)?(\d+(?:\.\d+)?)/i);
          amountStr = (m && m[1]) || (noCommas.match(/-?\d+(?:\.\d+)?/)?.[0] || '0.00');
        } else if (/qty|price|item|\d+\.\d{2}/i.test(noCommas)) {
          indicator = 1; // Price lamp
          const m = noCommas.match(/\b(?:price|sub)?[:\s]+(?:rs\.?\s*)?(\d+(?:\.\d+)?)/i);
          amountStr = (m && m[1]) || (noCommas.match(/-?\d+(?:\.\d+)?/)?.[0] || '0.00');
        } else {
          const m = noCommas.match(/-?\d+(?:\.\d+)?/);
          amountStr = (m && m[0]) || '0.00';
        }

        const cleanAmount = amountStr.substring(0, 10);

        parts.push(0x0c);
        parts.push(0x1b, 0x73, 0x30 + indicator);
        parts.push(0x1b, 0x51, 0x41);
        parts.push(...encoder.encode(cleanAmount));
        parts.push(0x0d);
        break;
      }

      case 'CD5220': {
        // Posiflex / DSP800 / E-POS / Standard Asian generic VFD
        // ESC @ (Init)
        parts.push(0x1b, 0x40);
        // Clear (0x0C)
        parts.push(0x0c);
        // Overwrite Line 1: ESC Q A <text> CR
        parts.push(0x1b, 0x51, 0x41);
        parts.push(...encoder.encode(l1));
        parts.push(0x0d);
        // Overwrite Line 2: ESC Q B <text> CR
        parts.push(0x1b, 0x51, 0x42);
        parts.push(...encoder.encode(l2));
        parts.push(0x0d);
        break;
      }

      case 'ESCPOS': {
        // Epson DM-D110/D210, Bixolon, Citizen
        // ESC @
        parts.push(0x1b, 0x40);
        // Clear
        parts.push(0x0c);
        // Move to Line 1: US $ 1 1
        parts.push(0x1f, 0x24, 0x01, 0x01);
        parts.push(...encoder.encode(l1));
        // Move to Line 2: US $ 1 2
        parts.push(0x1f, 0x24, 0x01, 0x02);
        parts.push(...encoder.encode(l2));
        break;
      }

      case 'UTC': {
        // UTC Standard / Enhanced
        // Clear (0x0C)
        parts.push(0x0c);
        // Line 1: Cursor Home (0x0B)
        parts.push(0x0b);
        parts.push(...encoder.encode(l1));
        // Line 2: (0x1F, 0x42)
        parts.push(0x1f, 0x42);
        parts.push(...encoder.encode(l2));
        break;
      }

      case 'AEDEX': {
        // AEDEX protocol
        // Line 1: ! # 1 <text> CR
        parts.push(0x21, 0x23, 0x31);
        parts.push(...encoder.encode(l1));
        parts.push(0x0d);
        // Line 2: ! # 2 <text> CR
        parts.push(0x21, 0x23, 0x32);
        parts.push(...encoder.encode(l2));
        parts.push(0x0d);
        break;
      }

      default: {
        parts.push(...encoder.encode(`${l1}\r\n${l2}`));
        break;
      }
    }

    return new Uint8Array(parts);
  }

  /**
   * Writes raw bytes directly to WebSerial port.
   */
  private async sendLinesDirect(line1: string, line2: string): Promise<boolean> {
    if (!this.writer) return false;
    try {
      const bytes = this.buildBuffer(line1, line2);
      await this.writer.write(bytes);
      return true;
    } catch (e) {
      console.warn('Failed to write to WebSerial port:', e);
      return false;
    }
  }

  /**
   * Dispatches 2x20 lines via configured transport (Local Bridge or WebSerial).
   */
  async sendLines(
    line1: string,
    line2: string,
    options: { bridgeUrl?: string; customProtocol?: PoleDisplayProtocol } = {}
  ): Promise<boolean> {
    if (!this.config.enabled || this.config.mode === 'DISABLED') {
      return true;
    }

    // If configured solely for secondary monitor, character pole display is bypassed
    if (this.config.mode === 'DUAL_SCREEN') {
      return true;
    }

    // Transport A: Direct In-Browser WebSerial
    if (this.config.transport === 'WEBSERIAL') {
      return await this.sendLinesDirect(line1, line2);
    }

    // Transport B: Local Hardware Bridge (127.0.0.1:18181)
    const bytes = this.buildBuffer(line1, line2, options.customProtocol || this.config.protocol);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const rawBase64 = typeof btoa !== 'undefined' ? btoa(binary) : '';

    try {
      const url = options.bridgeUrl || 'http://127.0.0.1:18181';
      const res = await fetch(`${url}/pole-display`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          port: this.config.port,
          baudRate: this.config.baudRate,
          protocol: this.config.protocol,
          line1,
          line2,
          data: rawBase64,
        }),
        signal: AbortSignal.timeout(3000),
      });
      return res.ok;
    } catch (err) {
      // Bridge unreachable - fallback to WebSerial if connected
      if (this.isWebSerialConnected()) {
        return await this.sendLinesDirect(line1, line2);
      }
      return false;
    }
  }

  /**
   * Builds an exact Price Display binary packet:
   * CLR (0x0C) + ESC s <indicator> + ESC Q A <amount> CR
   */
  buildPriceDisplayBuffer(
    amount: number | string,
    indicator: 'NONE' | 'PRICE' | 'TOTAL' | 'COLLECT' | 'CHANGE' = 'NONE'
  ): Uint8Array {
    const encoder = new TextEncoder();
    const parts: number[] = [];

    const indicatorMap: Record<string, number> = {
      NONE: 0x30,
      PRICE: 0x31,
      TOTAL: 0x32,
      COLLECT: 0x33,
      CHANGE: 0x34,
    };

    let numStr = '0.00';
    if (typeof amount === 'number') {
      numStr = amount.toFixed(2);
    } else {
      const match = (amount || '').match(/-?\d+(?:\.\d+)?/);
      numStr = match ? match[0] : '0.00';
    }

    // 1. CLR
    parts.push(0x0c);
    // 2. Set Status Light (ESC s n)
    parts.push(0x1b, 0x73, indicatorMap[indicator] || 0x30);
    // 3. Display Data: ESC Q A <number> CR
    parts.push(0x1b, 0x51, 0x41);
    parts.push(...encoder.encode(numStr.substring(0, 10)));
    parts.push(0x0d);

    return new Uint8Array(parts);
  }

  /**
   * Direct dispatch for single-line price displays (WebSerial or Local Bridge)
   */
  async sendPriceDisplay(
    amount: number | string,
    indicator: 'NONE' | 'PRICE' | 'TOTAL' | 'COLLECT' | 'CHANGE' = 'NONE',
    bridgeUrl?: string
  ): Promise<boolean> {
    if (!this.config.enabled || this.config.mode === 'DISABLED' || this.config.mode === 'DUAL_SCREEN') {
      return true;
    }

    const bytes = this.buildPriceDisplayBuffer(amount, indicator);

    if (this.config.transport === 'WEBSERIAL') {
      if (!this.writer) return false;
      try {
        await this.writer.write(bytes);
        return true;
      } catch (e) {
        console.warn('Failed to write Price Display to WebSerial:', e);
        return false;
      }
    }

    // Bridge transport
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const rawBase64 = typeof btoa !== 'undefined' ? btoa(binary) : '';

    try {
      const url = bridgeUrl || 'http://127.0.0.1:18181';
      const res = await fetch(`${url}/pole-display`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          port: this.config.port,
          baudRate: this.config.baudRate,
          protocol: 'PRICE_DISPLAY',
          data: rawBase64,
        }),
        signal: AbortSignal.timeout(3000),
      });
      return res.ok;
    } catch {
      if (this.isWebSerialConnected() && this.writer) {
        try {
          await this.writer.write(bytes);
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }
  }

  /**
   * Dispatches diagnostic test frame (e.g. 8888.88 for price display or Welcome for VFD)
   */
  async sendDiagnosticTestFrame(bridgeUrl?: string): Promise<boolean> {
    if (this.config.protocol === 'PRICE_DISPLAY') {
      return await this.sendPriceDisplay('8888.88', 'PRICE', bridgeUrl);
    }
    const welcome = this.formatIdle(this.config.storeName, 'DISPLAY TEST OK');
    return await this.sendLines(welcome.line1, welcome.line2, { bridgeUrl });
  }

  /**
   * Clears the pole display screen.
   */
  async clearDisplay(bridgeUrl?: string): Promise<boolean> {
    if (this.config.protocol === 'PRICE_DISPLAY') {
      return await this.sendPriceDisplay('0.00', 'NONE', bridgeUrl);
    }
    return await this.sendLines('                    ', '                    ', { bridgeUrl });
  }

  /**
   * Synchronizes the pole display with dynamic POS state changes.
   */
  async syncWithCustomerDisplayState(state: CustomerDisplayState, bridgeUrl?: string): Promise<void> {
    if (this.revertTimer) {
      clearTimeout(this.revertTimer);
      this.revertTimer = null;
    }

    if (!this.config.enabled || this.config.mode === 'DISABLED' || this.config.mode === 'DUAL_SCREEN') {
      return;
    }

    // Branch A: Single-Line Price Display (ESC Q A) Mode
    if (this.config.protocol === 'PRICE_DISPLAY') {
      switch (state.status) {
        case 'IDLE': {
          await this.sendPriceDisplay('0.00', 'NONE', bridgeUrl);
          break;
        }

        case 'SCANNING': {
          const price = state.lastScannedItem ? state.lastScannedItem.priceLkr : state.subtotalLkr;
          await this.sendPriceDisplay(price, 'PRICE', bridgeUrl);
          break;
        }

        case 'PAYMENT': {
          await this.sendPriceDisplay(state.totalLkr, 'TOTAL', bridgeUrl);
          break;
        }

        case 'COMPLETED': {
          const change = state.changeDueLkr || 0;
          if (change > 0) {
            await this.sendPriceDisplay(change, 'CHANGE', bridgeUrl);
          } else {
            const paid = state.amountPaidLkr || state.totalLkr;
            await this.sendPriceDisplay(paid, 'COLLECT', bridgeUrl);
          }

          // Return to IDLE 0.00 after timeout
          const timeoutMs = (this.config.changeDisplayTimeoutSeconds || 7) * 1000;
          this.revertTimer = setTimeout(async () => {
            await this.sendPriceDisplay('0.00', 'NONE', bridgeUrl);
          }, timeoutMs);
          break;
        }
      }
      return;
    }

    // Branch B: 2x20 VFD Character Display Mode

    switch (state.status) {
      case 'IDLE': {
        const idle = this.formatIdle(
          state.storeName || this.config.storeName,
          this.config.welcomeMessage
        );
        await this.sendLines(idle.line1, idle.line2, { bridgeUrl });
        break;
      }

      case 'SCANNING': {
        if (state.lastScannedItem) {
          const item = this.formatItem(
            state.lastScannedItem.name,
            state.lastScannedItem.priceLkr,
            state.lastScannedItem.qty,
            state.subtotalLkr
          );
          await this.sendLines(item.line1, item.line2, { bridgeUrl });
        } else {
          const line1 = this.makeTwoColumnLine('ITEMS IN CART:', `${state.itemCount}`, 20);
          const line2 = this.makeTwoColumnLine('SUBTOTAL:', `Rs.${state.subtotalLkr.toFixed(0)}`, 20);
          await this.sendLines(line1, line2, { bridgeUrl });
        }
        break;
      }

      case 'PAYMENT': {
        const payment = this.formatPayment(state.subtotalLkr, state.totalLkr);
        await this.sendLines(payment.line1, payment.line2, { bridgeUrl });
        break;
      }

      case 'COMPLETED': {
        const completed = this.formatCompleted(
          state.amountPaidLkr || state.totalLkr,
          state.changeDueLkr || 0
        );
        await this.sendLines(completed.line1, completed.line2, { bridgeUrl });

        // Schedule return to IDLE / Welcome screen after timeout
        const timeoutMs = (this.config.changeDisplayTimeoutSeconds || 7) * 1000;
        this.revertTimer = setTimeout(async () => {
          const idle = this.formatIdle(
            state.storeName || this.config.storeName,
            this.config.welcomeMessage
          );
          await this.sendLines(idle.line1, idle.line2, { bridgeUrl });
        }, timeoutMs);
        break;
      }
    }
  }
}

export const poleDisplayService = new PoleDisplayService();

