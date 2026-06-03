import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, Download, Sparkles, Send, Tag, AlertCircle } from 'lucide-react';

interface BatchQrTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onSimulateScan: (id: string) => void;
}

export function BatchQrTagModal({ isOpen, onClose, order, onSimulateScan }: BatchQrTagModalProps) {
  if (!isOpen || !order) return null;

  return (
    <div id="qr-tag-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        id="qr-tag-card"
        className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-[#212c46] text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-[#b58c4f] animate-pulse" />
            <span className="text-[11px] font-black tracking-widest uppercase">MEAT PRO BATCH TRAVELLER TAG</span>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>

        {/* Card Body - Styled like a High-end Industrial Sticker */}
        <div className="p-6 bg-[#edece8] flex-1 flex flex-col items-center justify-center">
          <div className="w-full max-w-xs bg-white border-2 border-dashed border-slate-400 rounded-lg p-5 shadow-inner flex flex-col items-center relative overflow-hidden">
            {/* Stamp ornament */}
            <div className="absolute top-2 right-2 text-[7px] font-black text-slate-400 border border-slate-300 rounded px-1 uppercase tracking-wider">
              LINE-PASS
            </div>

            {/* Title / Logo */}
            <div className="text-center pb-3 border-b border-slate-200 w-full">
              <h2 className="text-[12px] font-black text-[#212c46] tracking-widest uppercase">MEAT PRO FOOD GROUP</h2>
              <p className="text-[8px] text-[#7a8b95] font-bold tracking-widest uppercase">PRODUCTION STICKER LABEL</p>
            </div>

            {/* QR Wrapper */}
            <div className="my-5 bg-white p-3 rounded-lg border border-slate-200/50 shadow-md flex items-center justify-center">
              <QRCodeSVG 
                value={order.id}
                size={140}
                bgColor="#ffffff"
                fgColor="#212c46"
                level="Q"
                includeMargin={true}
              />
            </div>

            {/* Batch specs details */}
            <div className="w-full space-y-1.5 text-left text-slate-800 border-t border-dashed border-slate-200 pt-3">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-[#7a8b95] font-black uppercase tracking-wider">BATCH ID (QR DATA):</span>
                <span className="font-mono font-black text-[#212c46] bg-slate-50 border px-1.5 py-0.5 rounded text-[11px]">
                  {order.id}
                </span>
              </div>
              <div className="flex flex-col text-[10px] gap-0.5 pt-1">
                <span className="text-[#7a8b95] font-black uppercase tracking-wider">PRODUCT NAME:</span>
                <span className="font-bold text-[#212c46] line-clamp-1">
                  {order.name}
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] pt-1 border-t border-slate-100">
                <span className="text-[#7a8b95] font-black uppercase tracking-wider">SKU:</span>
                <span className="font-mono font-bold text-[#212c46]">{order.sku || order.id}</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-[#7a8b95] font-black uppercase tracking-wider">TARGET BATCHES:</span>
                <span className="font-mono font-black text-[#a94228] bg-red-50 border border-red-100 px-1.5 py-0.2 rounded">
                  {order.target || order.qty} BATCHES
                </span>
              </div>
              {order.customer && (
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-[#7a8b95] font-black uppercase tracking-wider">WORK SHIFT:</span>
                  <span className="font-bold text-slate-700">{order.customer}</span>
                </div>
              )}
            </div>

            {/* Scanner Instruction bar */}
            <div className="mt-3 bg-blue-50/80 border border-blue-100 p-2 rounded w-full flex items-start gap-1 text-[8px] text-blue-700 leading-normal">
              <AlertCircle size={10} className="shrink-0 mt-0.5" />
              <span>ติดป้ายบัตรนี้ที่ตัวลังพาเลท (Pallet Bin Batch Traveler) เพื่อให้พนักงานตามจุดสแกนอัปเกรดสถานะออเดอร์</span>
            </div>
          </div>
        </div>

        {/* Quick Toolbar */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex flex-col gap-2.5">
          {/* Action trigger button */}
          <button
            onClick={() => onSimulateScan(order.id)}
            className="w-full bg-[#2e7d32] hover:bg-[#2c6e49] text-white font-black text-[12px] uppercase tracking-widest py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer relative overflow-hidden group active:scale-95"
          >
            <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <Sparkles size={14} className="text-amber-300 animate-pulse" />
            ส่งไปจำลองสแกนทันที (Emulate QR Scan)
          </button>

          <div className="grid grid-cols-2 gap-2 text-[10px] font-black uppercase tracking-widest">
            <button
              onClick={() => window.print()}
              className="border border-slate-200 bg-white text-[#212c46] hover:bg-slate-50 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer size={12} /> Print PDF
            </button>
            <button
              onClick={() => alert('ดาวน์โหลดป้ายอุตสาหกรรมในเครื่องคอมพิวเตอร์ของคุณสำเร็จ')}
              className="border border-slate-200 bg-white text-[#212c46] hover:bg-slate-50 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download size={12} /> Save Sticker
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
