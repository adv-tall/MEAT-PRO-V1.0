import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, X } from 'lucide-react';

interface ScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  title?: string;
}

export function Scanner({ onScan, onClose, title = "Scan QR / Barcode" }: ScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scannerRef.current.render(
      (decodedText) => {
        onScan(decodedText);
        if (scannerRef.current) {
          scannerRef.current.clear();
        }
      },
      (error) => {
        // Silently handle scan errors (common during scanning)
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-white rounded-[32px] overflow-hidden w-full max-w-md shadow-2xl">
        <div className="bg-primary p-6 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <Camera size={20} className="text-accent" />
            <h3 className="text-sm font-black uppercase tracking-widest">{title}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <div id="reader" className="overflow-hidden rounded-2xl border-2 border-slate-100"></div>
          <p className="mt-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Position the code within the frame to scan
          </p>
        </div>
      </div>
    </div>
  );
}
