'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Keyboard } from 'lucide-react';

interface QRScannerProps {
  onScan: (result: string) => void;
  onClose?: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState('');

  const startScanner = useCallback(async () => {
    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          scanner.stop().catch(() => {});
          setIsScanning(false);
          onScan(decodedText);
        },
        () => {} // ignore scan failures
      );

      setIsScanning(true);
      setError('');
    } catch (err) {
      setError('Camera access denied or unavailable. Use manual entry instead.');
      console.error('Scanner error:', err);
    }
  }, [onScan]);

  useEffect(() => {
    if (!showManualInput) {
      startScanner();
    }
    return () => {
      scannerRef.current?.stop().catch(() => {});
    };
  }, [showManualInput, startScanner]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div className="relative flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-lg font-semibold text-white">Scan QR / Barcode</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowManualInput(!showManualInput)}
              className="rounded-lg bg-white/20 p-2 text-white"
            >
              {showManualInput ? <Camera className="h-5 w-5" /> : <Keyboard className="h-5 w-5" />}
            </button>
            {onClose && (
              <button onClick={onClose} className="rounded-lg bg-white/20 p-2 text-white">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Scanner or Manual Input */}
        {showManualInput ? (
          <div className="flex flex-1 items-center justify-center px-4">
            <form onSubmit={handleManualSubmit} className="w-full max-w-sm space-y-4">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Enter code manually"
                autoFocus
                className="w-full rounded-lg border border-white/30 bg-white/10 px-4 py-3 text-white placeholder-white/50 focus:border-white focus:outline-none"
              />
              <button
                type="submit"
                className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white"
              >
                Look Up
              </button>
            </form>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div id="qr-reader" className="w-full max-w-sm" />
            {error && (
              <div className="absolute bottom-20 left-4 right-4 rounded-lg bg-red-500/90 px-4 py-3 text-sm text-white">
                {error}
              </div>
            )}
            {isScanning && (
              <div className="absolute bottom-20 left-4 right-4 text-center text-sm text-white/70">
                Point camera at a QR code or barcode
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
