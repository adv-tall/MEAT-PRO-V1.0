import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Box, Target, Bell, QrCode } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import NotificationCenter from './NotificationCenter';
import { BatchTraceabilityModal } from './shared/BatchTraceabilityModal';

export default function Header() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { unreadCount } = useNotifications();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isTraceModalOpen, setIsTraceModalOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(date);
  };

  return (
    <header className="h-24 px-8 flex flex-row items-center justify-between z-10 shrink-0 bg-transparent w-full">
      <div className="flex items-center gap-6">
        <div className="flex items-center justify-center shrink-0">
          <svg width="0" height="0" className="absolute">
            <linearGradient id="themeGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop stopColor="#d4af37" offset="0%" />
              <stop stopColor="#f59e0b" offset="50%" />
              <stop stopColor="#dc2626" offset="100%" />
            </linearGradient>
          </svg>
          <Target size={42} stroke="url(#themeGrad)" strokeWidth={2.6} className="drop-shadow-sm" />
        </div>
        <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 font-exception-header">
                <span className="font-black text-[#4b5563] text-[25px] tracking-wide uppercase leading-none">AUTENTIC & VARIETIES</span>
                <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-[#b91c1c] to-[#dc2626] text-[25px] tracking-wide uppercase leading-none">MEAT PRODUCT</span>
                <span className="bg-[#b91c1c] hidden xl:block text-white text-[10px] font-black uppercase px-2 py-0.5 rounded ml-2 tracking-wider">MES ENGINE</span>
            </div>
            <div className="flex items-center gap-3 mt-0.5 font-exception-header">
                <div className="w-10 h-[2px] bg-[#b91c1c]"></div>
                <span className="text-[10px] font-bold text-[#7a8b95] uppercase tracking-[0.2em] leading-none">HIGH QUALITY AND SAFETY STANDARD FOR CONSUMPTION</span>
            </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
          <div className="flex items-center bg-white rounded-full shadow-sm p-1 pr-1.5 pl-6 gap-5 border border-[#cdd0db]/50 h-11">
              <div className="flex flex-col justify-center items-center">
                  <span className="text-[9px] font-black text-[#5f7ab7] uppercase tracking-[0.1em] leading-none mb-0.5">{currentTime.toLocaleDateString('en-US', { weekday: 'long' })}</span>
                  <span className="text-[11px] font-black text-transparent bg-clip-text bg-gradient-to-r from-[#022d41] to-[#214573] leading-none">{currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <div className="bg-[#212c46] text-white px-4 py-1.5 rounded-full flex items-center gap-2 shadow-inner h-full">
                  <Clock size={14} className="text-[#b58c4f]" strokeWidth={2.5} />
                  <span className="text-[12px] font-black font-mono tracking-widest mt-0.5">
                      {currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
              </div>
          </div>
          {/* Quick Batch Scan Button */}
          <button 
              onClick={() => setIsTraceModalOpen(true)}
              className="w-11 h-11 rounded-full bg-white shadow-sm flex items-center justify-center text-[#a94228] hover:bg-[#f8f9fa] transition-all group border border-[#cdd0db]/50 hover:scale-105 shrink-0 cursor-pointer"
              title="Quick Batch Traceability"
          >
              <QrCode size={18} className="group-hover:scale-110 transition-transform" />
          </button>

          <div className="relative">
              <button 
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="relative w-11 h-11 rounded-full bg-white shadow-sm flex items-center justify-center text-[#3f809e] hover:bg-[#f8f9fa] transition-all group border border-[#cdd0db]/50 hover:scale-105 shrink-0 hidden md:flex cursor-pointer"
              >
                  <Bell size={18} className="group-hover:rotate-12 transition-transform" strokeWidth={2} />
                  {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 bg-[#932c2e] rounded-full text-white text-[9px] font-black flex items-center justify-center px-1 border-2 border-white shadow-sm">
                          {unreadCount}
                      </span>
                  )}
              </button>
              <NotificationCenter isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
          </div>
      </div>
      <BatchTraceabilityModal isOpen={isTraceModalOpen} onClose={() => setIsTraceModalOpen(false)} />
    </header>
  );
}
