/**
 * Universal POS Pole Display & Customer Display Engine
 * Supports Single-Line 8-Digit Price Displays (ESC Q A) and 2x20 VFD/LCD Character Pole Displays.
 * Full WebSerial API driver compatible with Chrome 89+ (Windows 7 Chrome 109, Windows 10/11)
 * and Local Hardware Print Bridge (node-print daemon on 127.0.0.1:18181).
 */

import { CustomerDisplayState } from './hardware.service';

export type PoleDisplayProtocol = 'PRICE_DISPLAY' | 'CD5220' | 'ESCPOS' | 'UTC' | 'AEDEX';
export type PoleDisplayTransport = 'WEBSERIAL' | 'BRIDGE';
export type PoleDisplayMode = 'VFD_2X20' | 'DUAL_SCREEN' | 'BOTH' | 'DISABLED';

export interface WebSerialPortItem {
  id: string; // e.g. "port-0"
  label: string; // e.g. "Port 1 built-in / Bluetooth"
  port: any;
}

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
  transport: 'WEBSERIAL',
  port: 'Port 1 built-in / Bluetooth',
  baudRate: 2400,
  protocol: 'PRICE_DISPLAY',
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
   * Retrieves all granted WebSerial ports with user-friendly hardware labels.
   * Format: "Port 1 built-in / Bluetooth" for standard RS-232 / COM headers.
   */
  async getAvailableWebSerialPorts(): Promise<WebSerialPortItem[]> {
    if (!this.isWebSerialSupported()) return [];
    try {
      const ports = await (navigator as any).serial.getPorts();
      return ports.map((port: any, idx: number) => {
        const info = port.getInfo ? port.getInfo() : {};
        let label = `Port ${idx + 1} built-in / Bluetooth`;
        if (info.usbVendorId) {
          const vidHex = info.usbVendorId.toString(16).padStart(4, '0');
          const pidHex = (info.usbProductId || 0).toString(16).padStart(4, '0');
          let vendorName = 'USB-Serial';
          if (info.usbVendorId === 0x1a86) vendorName = 'CH340';
          else if (info.usbVendorId === 0x067b) vendorName = 'Prolific';
          else if (info.usbVendorId === 0x0403) vendorName = 'FTDI';
          else if (info.usbVendorId === 0x10c4) vendorName = 'CP210x';
          label = `Port ${idx + 1} (${vendorName} 0x${vidHex}:0x${pidHex})`;
        }
        return {
          id: `port-${idx}`,
          label,
          port,
        };
      });
    } catch (e) {
      console.warn('Failed to enumerate WebSerial ports:', e);
      return [];
    }
  }

  /**
   * Prompts user with native browser modal to authorize a new Serial port ("Add port").
   */
  async requestNewWebSerialPort(): Promise<WebSerialPortItem | null> {
    if (!this.isWebSerialSupported()) {
      throw new Error('WebSerial API is not supported in this browser. Use Google Chrome or Microsoft Edge.');
    }
    try {
      const port = await (navigator as any).serial.requestPort();
      const ports = await this.getAvailableWebSerialPorts();
      const found = ports.find((p) => p.port === port);
      return found || (ports.length > 0 ? ports[ports.length - 1] : null);
    } catch (err: any) {
      if (err.name !== 'NotFoundError') {
        console.error('Request port error:', err);
      }
      return null;
    }
  }

  /**
   * Connects to a specific WebSerial port instance.
   */
  async connectToWebSerialPort(portInstance: any, customBaudRate?: number): Promise<boolean> {
    if (!this.isWebSerialSupported()) {
      throw new Error('WebSerial API is not supported in this browser. Use Chrome or Edge.');
    }

    try {
      const baudRate = customBaudRate || this.config.baudRate || 2400;

      // Safely close existing connection before reopening
      await this.disconnectWebSerial();

      // Open port if not already opened
      if (!portInstance.readable && !portInstance.writable) {
        await portInstance.open({
          baudRate,
          dataBits: 8,
          stopBits: 1,
          parity: 'none',
          flowControl: 'none',
        });
      }

      this.serialPort = portInstance;
      this.writer = portInstance.writable.getWriter();
      this.isConnected = true;

      // Send initial reset frame
      if (this.config.protocol === 'PRICE_DISPLAY') {
        await this.sendPriceDisplay('0.00', 'NONE');
      } else {
        const welcome = this.formatIdle(this.config.storeName, this.config.welcomeMessage);
        await this.sendLinesDirect(welcome.line1, welcome.line2);
      }

      return true;
    } catch (err: any) {
      await this.disconnectWebSerial();
      console.error('WebSerial connect error:', err);
      throw err;
    }
  }

  /**
   * Connects to a port using standard WebSerial dialog or auto-detects first available.
   */
  async connectWebSerial(customBaudRate?: number): Promise<boolean> {
    if (!this.isWebSerialSupported()) {
      throw new Error('WebSerial API is not supported in this browser. Use Chrome or Edge.');
    }

    try {
      const baudRate = customBaudRate || this.config.baudRate || 2400;
      let portToUse: any = null;

      const existingPorts = await this.getAvailableWebSerialPorts();
      if (existingPorts.length > 0) {
        // Match configured port or pick first
        const matched = existingPorts.find(
          (p) => p.id === this.config.port || p.label === this.config.port
        );
        portToUse = matched ? matched.port : existingPorts[0].port;
      } else {
        portToUse = await (navigator as any).serial.requestPort();
      }

      return await this.connectToWebSerialPort(portToUse, baudRate);
    } catch (err: any) {
      if (err.name !== 'NotFoundError') {
        console.error('WebSerial connection error:', err);
      }
      return false;
    }
  }

  /**
   * Silently auto-reconnects to previously granted WebSerial port on POS register startup.
   */
  async autoConnectSavedPort(): Promise<boolean> {
    if (!this.isWebSerialSupported() || (this.isConnected && this.writer)) {
      return this.isConnected;
    }

    try {
      const ports = await this.getAvailableWebSerialPorts();
      if (ports.length === 0) return false;

      let target = ports[0];
      if (this.config.port) {
        const found = ports.find(
          (p) => p.id === this.config.port || p.label.includes(this.config.port)
        );
        if (found) target = found;
      }

      return await this.connectToWebSerialPort(target.port, this.config.baudRate || 2400);
    } catch (e) {
      console.warn('Auto-reconnect to saved pole display failed:', e);
      return false;
    }
  }

  /**
   * Safely releases locks and closes WebSerial port.
   */
  async disconnectWebSerial(): Promise<void> {
    try {
      if (this.writer) {
        try {
          this.writer.releaseLock();
        } catch (e) {
          console.warn('Error releasing writer lock:', e);
        }
        this.writer = null;
      }
      if (this.serialPort) {
        try {
          await this.serialPort.close();
        } catch (e) {
          console.warn('Error closing WebSerial port:', e);
        }
        this.serialPort = null;
      }
    } finally {
      this.isConnected = false;
    }
  }

  /**
   * Sends diagnostic test frames to every port at every speed.
   * Helps cashier identify COM port and baud rate when display lights up.
   */
  async runAutoDetect(
    onProgress?: (message: string) => void
  ): Promise<{ portLabel: string; baudRate: number } | null> {
    if (!this.isWebSerialSupported()) {
      throw new Error('WebSerial API is not supported in this browser.');
    }

    let ports = await this.getAvailableWebSerialPorts();
    if (ports.length === 0) {
      if (onProgress) onProgress("No ports authorized yet. Click 'Add port' first!");
      return null;
    }

    const testSpeeds = [2400, 9600, 4800, 19200];
    const testBytes = this.buildPriceDisplayBuffer('8888.88', 'PRICE');

    for (const p of ports) {
      for (const speed of testSpeeds) {
        if (onProgress) {
          onProgress(`Sending test frame to ${p.label} at ${speed} baud...`);
        }
        try {
          await this.disconnectWebSerial();
          await p.port.open({
            baudRate: speed,
            dataBits: 8,
            stopBits: 1,
            parity: 'none',
            flowControl: 'none',
          });
          const writer = p.port.writable.getWriter();
          await writer.write(testBytes);
          writer.releaseLock();
          await new Promise((resolve) => setTimeout(resolve, 350));
          await p.port.close();
        } catch (err) {
          console.warn(`Auto-detect failed on ${p.label} @ ${speed}:`, err);
        }
      }
    }

    if (onProgress) {
      onProgress('Auto-detect cycle complete. Select the port and speed that lit up your display!');
    }
    return null;
  }

  /**
   * Formats a string to exactly `width` characters with ASCII cleaning.
   */
  formatLine(text: string, width = 20): string {
    const clean = (text || '')
      .replace(/[^\x20-\x7E]/g, '')
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
    const proto = protocol || this.config.protocol || 'PRICE_DISPLAY';
    const l1 = this.formatLine(line1, 20);
    const l2 = this.formatLine(line2, 20);
    const encoder = new TextEncoder();
    const parts: number[] = [];

    switch (proto) {
      case 'PRICE_DISPLAY': {
        const combined = `${line1} ${line2}`;
        const noCommas = combined.replace(/,/g, '');
        let indicator: 'NONE' | 'PRICE' | 'TOTAL' | 'COLLECT' | 'CHANGE' = 'NONE';
        let amountStr = '0.00';

        if (/change/i.test(noCommas)) {
          indicator = 'CHANGE';
          const m = noCommas.match(/\bchange(?:\s+due)?[:\s]+(?:rs\.?\s*)?(\d+(?:\.\d+)?)/i);
          amountStr = (m && m[1]) || (noCommas.match(/-?\d+(?:\.\d+)?/)?.[0] || '0.00');
        } else if (/\btotal|subtotal|due/i.test(noCommas)) {
          indicator = 'TOTAL';
          const m =
            noCommas.match(/\btotal(?:\s+due)?[:\s]+(?:rs\.?\s*)?(\d+(?:\.\d+)?)/i) ||
            noCommas.match(/\bsubtotal[:\s]+(?:rs\.?\s*)?(\d+(?:\.\d+)?)/i);
          amountStr = (m && m[1]) || (noCommas.match(/-?\d+(?:\.\d+)?/)?.[0] || '0.00');
        } else if (/paid|cash|collect/i.test(noCommas)) {
          indicator = 'COLLECT';
          const m = noCommas.match(/\b(?:paid|cash|collect)[:\s]+(?:rs\.?\s*)?(\d+(?:\.\d+)?)/i);
          amountStr = (m && m[1]) || (noCommas.match(/-?\d+(?:\.\d+)?/)?.[0] || '0.00');
        } else if (/qty|price|item|\d+\.\d{2}/i.test(noCommas)) {
          indicator = 'PRICE';
          const m = noCommas.match(/\b(?:price|sub)?[:\s]+(?:rs\.?\s*)?(\d+(?:\.\d+)?)/i);
          amountStr = (m && m[1]) || (noCommas.match(/-?\d+(?:\.\d+)?/)?.[0] || '0.00');
        } else {
          const m = noCommas.match(/-?\d+(?:\.\d+)?/);
          amountStr = (m && m[0]) || '0.00';
        }

        return this.buildPriceDisplayBuffer(amountStr, indicator);
      }

      case 'CD5220': {
        // Posiflex / DSP800 / E-POS / Standard Asian generic VFD
        parts.push(0x1b, 0x40); // ESC @
        parts.push(0x0c); // CLR
        parts.push(0x1b, 0x51, 0x41); // ESC Q A
        parts.push(...encoder.encode(l1));
        parts.push(0x0d);
        parts.push(0x1b, 0x51, 0x42); // ESC Q B
        parts.push(...encoder.encode(l2));
        parts.push(0x0d);
        break;
      }

      case 'ESCPOS': {
        // Epson DM-D110/D210, Bixolon, Citizen
        parts.push(0x1b, 0x40);
        parts.push(0x0c);
        parts.push(0x1f, 0x24, 0x01, 0x01);
        parts.push(...encoder.encode(l1));
        parts.push(0x1f, 0x24, 0x01, 0x02);
        parts.push(...encoder.encode(l2));
        break;
      }

      case 'UTC': {
        parts.push(0x0c);
        parts.push(0x0b);
        parts.push(...encoder.encode(l1));
        parts.push(0x1f, 0x42);
        parts.push(...encoder.encode(l2));
        break;
      }

      case 'AEDEX': {
        parts.push(0x21, 0x23, 0x31);
        parts.push(...encoder.encode(l1));
        parts.push(0x0d);
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
    if (!this.writer) {
      const autoOk = await this.autoConnectSavedPort();
      if (!autoOk || !this.writer) return false;
    }
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

    if (this.config.mode === 'DUAL_SCREEN') {
      return true;
    }

    // Direct WebSerial
    if (this.config.transport === 'WEBSERIAL') {
      return await this.sendLinesDirect(line1, line2);
    }

    // Local Hardware Bridge
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
      if (this.isWebSerialConnected() || (await this.autoConnectSavedPort())) {
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
      NONE: 0x30, // 0 = Off
      PRICE: 0x31, // 1 = Price
      TOTAL: 0x32, // 2 = Total
      COLLECT: 0x33, // 3 = Collect
      CHANGE: 0x34, // 4 = Change
    };

    let numStr = '0.00';
    if (typeof amount === 'number') {
      numStr = amount.toFixed(2);
    } else {
      const cleaned = String(amount || '')
        .replace(/,/g, '')
        .replace(/[^0-9.-]/g, '');
      const match = cleaned.match(/-?\d+(?:\.\d+)?/);
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
   * Direct dispatch for single-line price displays (WebSerial or Local Bridge).
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
      if (!this.writer) {
        const autoOk = await this.autoConnectSavedPort();
        if (!autoOk || !this.writer) return false;
      }
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
      if (this.isWebSerialConnected() || (await this.autoConnectSavedPort())) {
        try {
          if (this.writer) {
            await this.writer.write(bytes);
            return true;
          }
        } catch {
          return false;
        }
      }
      return false;
    }
  }

  /**
   * Dispatches diagnostic test frame (e.g. 8888.88 for price display or Welcome for VFD).
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
