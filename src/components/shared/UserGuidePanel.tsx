import React from 'react';
import { createPortal } from 'react-dom';
import * as Icons from 'lucide-react';

export const UserGuidePanel = ({ isOpen, onClose, title = "GUIDELINES", subtitle = "System Manual", children }: any) => {
    if (!isOpen || typeof document === 'undefined') return null;
    return createPortal(
        <>
            <div className="fixed inset-0 z-[190] bg-[#212c46]/60 backdrop-blur-sm transition-opacity duration-500 animate-fadeIn" onClick={onClose}/>
            <div className={`fixed inset-y-0 right-0 z-[200] w-full md:w-[500px] bg-white shadow-2xl transform transition-transform duration-500 ease-in-out flex flex-col border-l-2 border-[#b7a159] translate-x-0`}>
                <div className="flex justify-between items-center p-5 px-6 border-b-2 border-[#b7a159] bg-[#212c46] text-white shrink-0">
                    <div>
                        <h3 className="font-black flex items-center gap-3 uppercase tracking-widest text-lg"><Icons.BookOpen size={22} className="text-[#b7a159]"/> {title}</h3>
                        <p className="text-[12px] font-bold text-[#d7d7d7] uppercase tracking-widest mt-1.5">{subtitle}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-white/50 hover:text-[#932c2e] hover:bg-white/10 rounded-xl transition-colors"><Icons.X size={24}/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-8 text-[#414757] text-[12px] leading-relaxed custom-scrollbar bg-white font-mono">
                    {React.Children.count(children) > 0 ? children : (
                        <div className="flex flex-col items-center justify-center h-full opacity-50 space-y-4">
                            <Icons.Wrench size={48} className="text-[#212c46]" />
                            <p className="text-center font-bold uppercase tracking-widest text-sm">
                                คู่มือหน้านี้กำลังอยู่ระหว่างการจัดทำ
                                <br/>
                                <span className="text-[10px] text-gray-500">Documentation is currently being updated</span>
                            </p>
                        </div>
                    )}
                </div>
                <div className="p-4 bg-[#f8f9fa] border-t border-[#eaeaec] flex justify-end shrink-0">
                    <button onClick={onClose} className="px-8 py-2.5 bg-[#212c46] text-white font-black rounded-xl uppercase text-[12px] hover:bg-[#414757] hover:text-white transition-all shadow-md tracking-[0.1em]">เข้าใจแล้ว (Got it)</button>
                </div>
            </div>
        </>, document.body
    );
};
