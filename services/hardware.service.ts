/**
 * Standard Native Thermal Printing & Hardware Client
 * Zero external dependencies. Communicates with standard local thermal print daemons
 * (127.0.0.1:18181 or local network print servers) and supports native browser print.
 */

export interface PrintJobPayload {
  printer?: string;
  type: 'raw' | 'text';
  data: string; // Base64 ESC/POS payload
}

export class ThermalPrintBridgeClient {
  private url: string;

  constructor(options: { url?: string } = {}) {
    this.url = options.url || 'http://127.0.0.1:18181';
  }

  async listPrinters(): Promise<Array<{ name: string; isDefault?: boolean }>> {
    const res = await fetch(`${this.url}/printers`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) throw new Error(`Bridge returned HTTP ${res.status}`);
    const body = await res.json();
    return body.data || body.printers || [];
  }

  async print(payload: PrintJobPayload): Promise<{ success: boolean; message?: string }> {
    const res = await fetch(`${this.url}/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`Print failed with HTTP ${res.status}`);
    return await res.json();
  }

  async openDrawer(pin: 2 | 5 = 2): Promise<{ success: boolean }> {
    const res = await fetch(`${this.url}/cash-drawer/open`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error(`Cash drawer kick failed`);
    return await res.json();
  }
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPriceLkr: number;
  totalLkr: number;
  variant?: string;
  isWeighed?: boolean;
}

export interface ReceiptData {
  companyName: string;
  companyAddress?: string;
  phone?: string;
  taxNumber?: string;
  orderNumber: string;
  cashierName: string;
  date: string;
  items: ReceiptItem[];
  subtotalLkr: number;
  discountLkr: number;
  taxLkr: number;
  totalLkr: number;
  paymentMethod: string;
  amountPaidLkr?: number;
  changeDueLkr?: number;
  lankaQrPayload?: string;
  footerMessage?: string;
}

export interface ProductLabelData {
  productName: string;
  sku: string;
  barcode: string;
  priceLkr: number;
  variantName?: string;
  companyName?: string;
  widthMm?: number;
  heightMm?: number;
}

export interface ScaleReading {
  weight: number;
  unit: 'kg' | 'g' | 'lb';
  isStable: boolean;
  raw: string;
}

export interface CustomerDisplayState {
  storeName: string;
  cashier: string;
  lastScannedItem?: {
    name: string;
    qty: number;
    priceLkr: number;
  };
  itemCount: number;
  subtotalLkr: number;
  discountLkr: number;
  totalLkr: number;
  amountPaidLkr?: number;
  changeDueLkr?: number;
  lankaQrCode?: string;
  status: 'IDLE' | 'SCANNING' | 'PAYMENT' | 'COMPLETED';
}

class HardwareService {
  private client: ThermalPrintBridgeClient;
  private bridgeUrl: string = 'http://127.0.0.1:18181';
  private displayChannel: BroadcastChannel | null = null;

  constructor() {
    this.client = new ThermalPrintBridgeClient({ url: this.bridgeUrl });
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.displayChannel = new BroadcastChannel('xonit_pos_customer_display');
    }
  }

  setBridgeUrl(url: string) {
    this.bridgeUrl = url;
    this.client = new ThermalPrintBridgeClient({ url });
  }

  /**
   * Checks if local hardware print bridge is running on 127.0.0.1:18181
   */
  async checkBridgeHealth(): Promise<{ online: boolean; printers: string[]; latencyMs: number }> {
    const start = Date.now();
    try {
      const printers = await this.client.listPrinters();
      return {
        online: true,
        printers: printers.map((p) => p.name || 'Thermal Printer'),
        latencyMs: Date.now() - start,
      };
    } catch {
      return {
        online: false,
        printers: [],
        latencyMs: Date.now() - start,
      };
    }
  }

  /**
   * Generates ESC/POS byte sequence for 80mm thermal receipt
   */
  buildEscPosReceipt(data: ReceiptData, paperWidthMm: 80 | 58 = 80): Uint8Array {
    const charsPerLine = paperWidthMm === 80 ? 48 : 32;
    const encoder = new TextEncoder();
    const parts: number[] = [];

    // ESC @ (Initialize)
    parts.push(0x1b, 0x40);

    // ESC a 1 (Center Align)
    parts.push(0x1b, 0x61, 0x01);

    // Double Height + Double Width for Store Name
    parts.push(0x1d, 0x21, 0x11);
    parts.push(...encoder.encode(`${data.companyName}\n`));

    // Reset Normal Font
    parts.push(0x1d, 0x21, 0x00);
    if (data.companyAddress) parts.push(...encoder.encode(`${data.companyAddress}\n`));
    if (data.phone) parts.push(...encoder.encode(`Tel: ${data.phone}\n`));
    if (data.taxNumber) parts.push(...encoder.encode(`VAT Reg: ${data.taxNumber}\n`));

    parts.push(...encoder.encode('='.repeat(charsPerLine) + '\n'));

    // Left Align Header details
    parts.push(0x1b, 0x61, 0x00);
    parts.push(...encoder.encode(`Receipt: #${data.orderNumber}\n`));
    parts.push(...encoder.encode(`Date   : ${data.date}\n`));
    parts.push(...encoder.encode(`Cashier: ${data.cashierName}\n`));
    parts.push(...encoder.encode('-'.repeat(charsPerLine) + '\n'));

    // Itemized table header
    const colNameWidth = paperWidthMm === 80 ? 24 : 14;
    const colQtyWidth = paperWidthMm === 80 ? 6 : 4;
    const colPriceWidth = paperWidthMm === 80 ? 8 : 6;
    const colTotalWidth = charsPerLine - colNameWidth - colQtyWidth - colPriceWidth;

    parts.push(
      ...encoder.encode(
        'ITEM'.padEnd(colNameWidth) +
          'QTY'.padStart(colQtyWidth) +
          'PRICE'.padStart(colPriceWidth) +
          'TOTAL'.padStart(colTotalWidth) +
          '\n'
      )
    );
    parts.push(...encoder.encode('-'.repeat(charsPerLine) + '\n'));

    // Items
    for (const item of data.items) {
      let displayName = item.name;
      if (item.variant) displayName += ` (${item.variant})`;
      if (displayName.length > colNameWidth) {
        displayName = displayName.substring(0, colNameWidth - 1) + '…';
      }

      const qtyStr = item.isWeighed ? item.quantity.toFixed(3) : item.quantity.toString();
      const line =
        displayName.padEnd(colNameWidth) +
        qtyStr.padStart(colQtyWidth) +
        item.unitPriceLkr.toFixed(0).padStart(colPriceWidth) +
        item.totalLkr.toFixed(0).padStart(colTotalWidth);

      parts.push(...encoder.encode(line + '\n'));
    }

    parts.push(...encoder.encode('-'.repeat(charsPerLine) + '\n'));

    // Totals Section (Right Align)
    parts.push(0x1b, 0x61, 0x02);
    parts.push(...encoder.encode(`Subtotal: Rs. ${data.subtotalLkr.toLocaleString()}\n`));
    if (data.discountLkr > 0) {
      parts.push(...encoder.encode(`Discount: -Rs. ${data.discountLkr.toLocaleString()}\n`));
    }
    if (data.taxLkr > 0) {
      parts.push(...encoder.encode(`Tax/VAT: Rs. ${data.taxLkr.toLocaleString()}\n`));
    }

    // Bold Big Total
    parts.push(0x1b, 0x45, 0x01); // Bold ON
    parts.push(0x1d, 0x21, 0x01); // Double Height
    parts.push(...encoder.encode(`TOTAL: Rs. ${data.totalLkr.toLocaleString()}\n`));
    parts.push(0x1d, 0x21, 0x00); // Normal
    parts.push(0x1b, 0x45, 0x00); // Bold OFF

    parts.push(...encoder.encode(`Paid (${data.paymentMethod}): Rs. ${(data.amountPaidLkr || data.totalLkr).toLocaleString()}\n`));
    if (data.changeDueLkr !== undefined && data.changeDueLkr > 0) {
      parts.push(...encoder.encode(`Change Due: Rs. ${data.changeDueLkr.toLocaleString()}\n`));
    }

    // Center Align Footer
    parts.push(0x1b, 0x61, 0x01);
    parts.push(...encoder.encode('\n' + (data.footerMessage || 'Thank you for your business!') + '\n'));
    parts.push(...encoder.encode('Powered by XONIT Enterprise POS\n\n\n\n'));

    // GS V 65 0 (Full Paper Cut)
    parts.push(0x1d, 0x56, 0x41, 0x10);

    return new Uint8Array(parts);
  }

  /**
   * Direct silent zero-click print to 80mm thermal receipt printer via bridge
   */
  async printThermalReceipt(data: ReceiptData, options: { printerName?: string; paperWidth?: 80 | 58 } = {}): Promise<boolean> {
    const bytes = this.buildEscPosReceipt(data, options.paperWidth || 80);
    // Base64 encode for bridge transmission
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64Data = typeof btoa !== 'undefined' ? btoa(binary) : Buffer.from(bytes).toString('base64');

    try {
      await this.client.print({
        printer: options.printerName,
        type: 'raw',
        data: base64Data,
      } as any);
      return true;
    } catch (err) {
      console.warn('Node-print bridge unreachable. Fallback to browser print recommended.', err);
      return false;
    }
  }

  /**
   * Kicks the electronic cash drawer connected via RJ11 to receipt printer
   */
  async kickCashDrawer(pin: 2 | 5 = 2): Promise<boolean> {
    try {
      await this.client.openDrawer(pin);
      return true;
    } catch {
      // Fallback pulse payload: ESC p m t1 t2
      const pulseBytes = new Uint8Array([0x1b, 0x70, pin === 5 ? 1 : 0, 25, 250]);
      let binary = '';
      for (let i = 0; i < pulseBytes.byteLength; i++) {
        binary += String.fromCharCode(pulseBytes[i]);
      }
      const base64Data = typeof btoa !== 'undefined' ? btoa(binary) : Buffer.from(pulseBytes).toString('base64');

      try {
        await this.client.print({
          type: 'raw',
          data: base64Data,
        });
        return true;
      } catch {
        return false;
      }
    }
  }

  /**
   * Continuous / polled RS-232 weighing scale stream parser
   * Handles CAS, Toledo, ACOM, and Avery Berkel protocols.
   */
  parseScaleStream(rawBuffer: string): ScaleReading {
    const clean = rawBuffer.trim();

    // Protocol 1: CAS PD-II format: "ST,GS,+  1.450kg" or "US,GS,+  0.820kg"
    const casMatch = clean.match(/(ST|US),\s*(GS|NT),\s*([+-]?\s*\d+\.?\d*)\s*(kg|g|lb)/i);
    if (casMatch) {
      const isStable = casMatch[1].toUpperCase() === 'ST';
      const weight = parseFloat(casMatch[3].replace(/\s+/g, ''));
      const unit = casMatch[4].toLowerCase() as 'kg' | 'g' | 'lb';
      return { weight: isNaN(weight) ? 0 : weight, unit, isStable, raw: clean };
    }

    // Protocol 2: Toledo / Avery format: "W:  1.450kg" or "NET  1.450 kg"
    const toledoMatch = clean.match(/(?:W:|NET|WT:)\s*([+-]?\d+\.?\d*)\s*(kg|g|lb)/i);
    if (toledoMatch) {
      const weight = parseFloat(toledoMatch[1]);
      const unit = toledoMatch[2].toLowerCase() as 'kg' | 'g' | 'lb';
      return { weight: isNaN(weight) ? 0 : weight, unit, isStable: true, raw: clean };
    }

    // Protocol 3: Raw numeric stream with unit: "+01.450kg"
    const rawMatch = clean.match(/([+-]?\d+\.?\d*)\s*(kg|g|lb)?/i);
    if (rawMatch) {
      const weight = parseFloat(rawMatch[1]);
      const unit = (rawMatch[2]?.toLowerCase() || 'kg') as 'kg' | 'g' | 'lb';
      return { weight: isNaN(weight) ? 0 : weight, unit, isStable: true, raw: clean };
    }

    return { weight: 0, unit: 'kg', isStable: false, raw: clean };
  }

  /**
   * Generates TSPL command string for TSC / Xprinter / Gprinter thermal label printers (50mm x 25mm)
   */
  generateTsplLabel(label: ProductLabelData): string {
    const width = label.widthMm || 50;
    const height = label.heightMm || 25;

    const displaySku = label.barcode || label.sku;
    const priceStr = `Rs. ${label.priceLkr.toLocaleString()}`;

    return [
      `SIZE ${width} mm, ${height} mm`,
      'GAP 2 mm, 0 mm',
      'DIRECTION 1',
      'CLS',
      `TEXT 20,20,"0",0,1,1,"${label.companyName || 'XONIT POS'}"`,
      `TEXT 20,45,"TSS24.BF2",0,1,1,"${label.productName.substring(0, 22)}"`,
      label.variantName ? `TEXT 20,75,"0",0,1,1,"Var: ${label.variantName}"` : '',
      `BARCODE 20,95,"128",45,1,0,2,2,"${displaySku}"`,
      `TEXT 20,150,"0",0,1,1,"${displaySku}"`,
      `TEXT 200,145,"0",0,2,2,"${priceStr}"`,
      'PRINT 1,1',
      '',
    ]
      .filter(Boolean)
      .join('\r\n');
  }

  /**
   * Generates ZPL-II command string for Zebra label printers
   */
  generateZplLabel(label: ProductLabelData): string {
    const displaySku = label.barcode || label.sku;
    const priceStr = `Rs. ${label.priceLkr.toLocaleString()}`;

    return [
      '^XA',
      '^PW400',
      '^LL200',
      `^FO20,20^A0N,20,20^FD${label.companyName || 'XONIT POS'}^FS`,
      `^FO20,45^A0N,25,25^FD${label.productName.substring(0, 24)}^FS`,
      label.variantName ? `^FO20,75^A0N,18,18^FD${label.variantName}^FS` : '',
      `^FO20,100^BY2,2,40^BCN,40,Y,N,N^FD${displaySku}^FS`,
      `^FO220,105^A0N,30,30^FD${priceStr}^FS`,
      '^XZ',
    ]
      .filter(Boolean)
      .join('\n');
  }

  /**
   * Broadcasts active order and state to secondary Customer-Facing Display window
   */
  updateCustomerDisplay(state: CustomerDisplayState) {
    if (this.displayChannel) {
      this.displayChannel.postMessage(state);
    }
  }

  /**
   * Opens / focuses the standalone Customer-Facing Display screen in a secondary monitor
   */
  openCustomerDisplayWindow() {
    if (typeof window !== 'undefined') {
      window.open('/customer-display', 'XONIT_Customer_Display', 'width=1024,height=768');
    }
  }
}

export const hardwareService = new HardwareService();
