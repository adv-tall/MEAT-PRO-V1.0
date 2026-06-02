import React from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle } from 'lucide-react';

interface UserGuideButtonProps {
    onClick: () => void;
    className?: string;
    iconClassName?: string;
    textClassName?: string;
}

export default function UserGuideButton({ 
    onClick, 
    className = "bg-[#f8f9fa] border border-[#eaeaec] border-r-0 text-[#212c46] hover:bg-[#932c2e] hover:text-white hover:border-[#932c2e]",
    iconClassName = "text-[#7a8b95] group-hover:text-white",
    textClassName = ""
}: UserGuideButtonProps) {
    if (typeof document === 'undefined') return null;

    return (
        <button 
            onClick={onClick} 
            className={`fixed right-0 top-[80px] py-8 px-1.5 rounded-l-xl shadow-md z-[100] flex flex-col items-center gap-4 group transition-all duration-500 hover:-translate-x-1 ${className}`}
        >
            <HelpCircle size={18} className={`shrink-0 group-hover:rotate-12 transition-transform ${iconClassName}`} />
            <span 
                className={`font-black tracking-[0.3em] [writing-mode:vertical-rl] rotate-180 whitespace-nowrap uppercase text-[11px] ${textClassName}`}
            >
                USER GUIDE
            </span>
        </button>
    );
}
