import { useState, useEffect, useCallback, useRef } from 'react';
import {
  hardwareService,
  ReceiptData,
  ProductLabelData,
  ScaleReading,
  CustomerDisplayState,
} from '@/services/hardware.service';
import { PoleDisplayConfig, poleDisplayService } from '@/services/pole-display.service';
import { globalDialog } from '@/store/dialog.store';

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

  // Pole Display State
  const [poleConfig, setPoleConfig] = useState<PoleDisplayConfig>(() =>
    hardwareService.getPoleDisplayConfig()
  );
  const [isPoleSerialConnected, setIsPoleSerialConnected] = useState(false);
  const [availablePorts, setAvailablePorts] = useState<string[]>([
    'COM1',
    'COM2',
    'COM3',
    'COM4',
    'COM5',
  ]);

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
      globalDialog.alert('WebSerial API is not supported in this browser. Please use Chrome or Edge.', 'Browser Incompatible', { variant: 'warning' });
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

  // Customer Display & Pole Display
  const broadcastDisplay = useCallback((state: CustomerDisplayState) => {
    hardwareService.updateCustomerDisplay(state);
  }, []);

  const launchCustomerDisplay = useCallback(() => {
    hardwareService.openCustomerDisplayWindow();
  }, []);

  const updatePoleConfig = useCallback((newCfg: Partial<PoleDisplayConfig>) => {
    const updated = hardwareService.savePoleDisplayConfig(newCfg);
    setPoleConfig(updated);
  }, []);

  const refreshSerialPorts = useCallback(async () => {
    const ports = await hardwareService.listSerialPorts();
    if (ports && ports.length > 0) {
      setAvailablePorts(ports);
    }
  }, []);

  const connectPoleSerial = useCallback(async () => {
    try {
      const ok = await hardwareService.connectPoleDisplaySerial(poleConfig.baudRate);
      setIsPoleSerialConnected(ok);
      return ok;
    } catch (err: any) {
      globalDialog.alert(err.message || 'Failed to connect to pole display port.', 'Serial Port Error', {
        variant: 'danger',
      });
      setIsPoleSerialConnected(false);
      return false;
    }
  }, [poleConfig.baudRate]);

  const disconnectPoleSerial = useCallback(async () => {
    await hardwareService.disconnectPoleDisplaySerial();
    setIsPoleSerialConnected(false);
  }, []);

  const sendPoleText = useCallback(async (line1: string, line2: string): Promise<boolean> => {
    return await hardwareService.sendPoleDisplayText(line1, line2);
  }, []);

  const clearPole = useCallback(async (): Promise<boolean> => {
    return await hardwareService.clearPoleDisplay();
  }, []);

  const sendPolePrice = useCallback(
    async (
      amount: number | string,
      indicator: 'NONE' | 'PRICE' | 'TOTAL' | 'COLLECT' | 'CHANGE' = 'NONE'
    ): Promise<boolean> => {
      return await hardwareService.sendPolePriceDisplay(amount, indicator);
    },
    []
  );

  const sendDiagnosticTest = useCallback(async (): Promise<boolean> => {
    return await hardwareService.sendPoleDiagnosticTest();
  }, []);

  const testPoleScreen = useCallback(
    async (mode: 'welcome' | 'item' | 'payment' | 'completed') => {
      if (poleConfig.protocol === 'PRICE_DISPLAY') {
        switch (mode) {
          case 'welcome':
            return await sendPolePrice('8888.88', 'NONE');
          case 'item':
            return await sendPolePrice('750.00', 'PRICE');
          case 'payment':
            return await sendPolePrice('2200.00', 'TOTAL');
          case 'completed':
            return await sendPolePrice('2800.00', 'CHANGE');
        }
      }

      switch (mode) {
        case 'welcome': {
          const welcome = poleDisplayService.formatIdle(
            poleConfig.storeName || 'XONIT POS',
            poleConfig.welcomeMessage || 'WELCOME! READY'
          );
          return await sendPoleText(welcome.line1, welcome.line2);
        }
        case 'item': {
          const item = poleDisplayService.formatItem('Ceylon Black Tea', 750.0, 2, 1500.0);
          return await sendPoleText(item.line1, item.line2);
        }
        case 'payment': {
          const pay = poleDisplayService.formatPayment(2450, 2200);
          return await sendPoleText(pay.line1, pay.line2);
        }
        case 'completed': {
          const done = poleDisplayService.formatCompleted(5000, 2800);
          return await sendPoleText(done.line1, done.line2);
        }
      }
    },
    [poleConfig, sendPoleText, sendPolePrice]
  );

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
    poleConfig,
    updatePoleConfig,
    isPoleSerialConnected,
    connectPoleSerial,
    disconnectPoleSerial,
    availablePorts,
    refreshSerialPorts,
    sendPoleText,
    sendPolePrice,
    sendDiagnosticTest,
    clearPole,
    testPoleScreen,
    isWebSerialSupported: hardwareService.isWebSerialSupported(),
    generateTsplLabel: hardwareService.generateTsplLabel.bind(hardwareService),
    generateZplLabel: hardwareService.generateZplLabel.bind(hardwareService),
    buildEscPosReceipt: hardwareService.buildEscPosReceipt.bind(hardwareService),
  };
}
