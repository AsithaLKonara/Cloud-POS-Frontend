import { useState, useEffect, useCallback, useRef } from 'react';
import {
  hardwareService,
  ReceiptData,
  ProductLabelData,
  ScaleReading,
  CustomerDisplayState,
} from '@/services/hardware.service';

export function useHardware() {
  const [bridgeStatus, setBridgeStatus] = useState<{
    online: boolean;
    printers: string[];
    latencyMs: number;
    checking: boolean;
  }>({
    online: false,
    printers: [],
    latencyMs: 0,
    checking: true,
  });

  const [scaleReading, setScaleReading] = useState<ScaleReading>({
    weight: 0,
    unit: 'kg',
    isStable: true,
    raw: '',
  });

  const [isScaleConnected, setIsScaleConnected] = useState(false);
  const serialPortRef = useRef<any>(null);
  const readerRef = useRef<any>(null);

  // Check node-print bridge health
  const refreshBridge = useCallback(async () => {
    setBridgeStatus((prev) => ({ ...prev, checking: true }));
    const health = await hardwareService.checkBridgeHealth();
    setBridgeStatus({
      online: health.online,
      printers: health.printers,
      latencyMs: health.latencyMs,
      checking: false,
    });
  }, []);

  useEffect(() => {
    refreshBridge();
    const interval = setInterval(refreshBridge, 30000);
    return () => clearInterval(interval);
  }, [refreshBridge]);

  // Zero-click thermal receipt print
  const printReceipt = useCallback(
    async (receiptData: ReceiptData, paperWidth: 80 | 58 = 80): Promise<boolean> => {
      return await hardwareService.printThermalReceipt(receiptData, { paperWidth });
    },
    []
  );

  // Cash drawer kick
  const openCashDrawer = useCallback(async (pin: 2 | 5 = 2): Promise<boolean> => {
    return await hardwareService.kickCashDrawer(pin);
  }, []);

  // WebSerial Weighing Scale Connection
  const connectScale = useCallback(async () => {
    if (typeof window === 'undefined' || !('serial' in navigator)) {
      alert('WebSerial API is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    try {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 9600, dataBits: 8, stopBits: 1, parity: 'none' });
      serialPortRef.current = port;
      setIsScaleConnected(true);

      const textDecoder = new TextDecoderStream();
      port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();
      readerRef.current = reader;

      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split(/[\r\n]+/);
        if (lines.length > 1) {
          const lastCompleteLine = lines[lines.length - 2];
          buffer = lines[lines.length - 1];
          const parsed = hardwareService.parseScaleStream(lastCompleteLine);
          setScaleReading(parsed);
        }
      }
    } catch (err: any) {
      if (err.name !== 'NotFoundError') {
        console.error('Scale connection error:', err);
      }
      setIsScaleConnected(false);
    }
  }, []);

  const disconnectScale = useCallback(async () => {
    try {
      if (readerRef.current) {
        await readerRef.current.cancel();
        readerRef.current = null;
      }
      if (serialPortRef.current) {
        await serialPortRef.current.close();
        serialPortRef.current = null;
      }
    } catch (e) {
      console.warn('Error disconnecting scale:', e);
    } finally {
      setIsScaleConnected(false);
      setScaleReading({ weight: 0, unit: 'kg', isStable: true, raw: '' });
    }
  }, []);

  // Customer Display
  const broadcastDisplay = useCallback((state: CustomerDisplayState) => {
    hardwareService.updateCustomerDisplay(state);
  }, []);

  const launchCustomerDisplay = useCallback(() => {
    hardwareService.openCustomerDisplayWindow();
  }, []);

  return {
    bridgeStatus,
    refreshBridge,
    printReceipt,
    openCashDrawer,
    scaleReading,
    isScaleConnected,
    connectScale,
    disconnectScale,
    broadcastDisplay,
    launchCustomerDisplay,
    generateTsplLabel: hardwareService.generateTsplLabel.bind(hardwareService),
    generateZplLabel: hardwareService.generateZplLabel.bind(hardwareService),
    buildEscPosReceipt: hardwareService.buildEscPosReceipt.bind(hardwareService),
  };
}
