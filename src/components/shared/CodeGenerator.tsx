import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import { Download } from 'lucide-react';

interface CodeGeneratorProps {
  value: string;
  type: 'qr' | 'barcode';
  label?: string;
  size?: number;
}

export function CodeGenerator({ value, type, label, size = 128 }: CodeGeneratorProps) {
  const downloadCode = () => {
    const svg = document.getElementById(`code-${value}`) as unknown as SVGElement;
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `${type}-${value}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm group">
      <div id={`code-${value}`} className="bg-white p-2 rounded-xl">
        {type === 'qr' ? (
          <QRCodeSVG value={value} size={size} />
        ) : (
          <Barcode 
            value={value} 
            width={1.5} 
            height={50} 
            fontSize={12} 
            background="transparent"
          />
        )}
      </div>
      
      <div className="text-center">
        <p className="text-[10px] font-black text-primary uppercase tracking-widest">{value}</p>
        {label && <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">{label}</p>}
      </div>

      <button 
        onClick={downloadCode}
        className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-[9px] font-black text-accent uppercase tracking-widest"
      >
        <Download size={12} />
        Download PNG
      </button>
    </div>
  );
}
