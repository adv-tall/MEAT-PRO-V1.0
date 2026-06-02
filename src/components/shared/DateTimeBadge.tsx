import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const DateTimeBadge = () => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="hidden sm:flex items-center gap-4 bg-white/70 rounded-2xl pl-5 pr-1 py-1.5 border border-primary/10 backdrop-blur-sm shadow-sm transition-all duration-300">
            <div className="flex flex-col items-end leading-none">
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest leading-none">
                    {currentTime.toLocaleDateString('en-GB', { weekday: 'long' })}
                </span>
                <span className="text-xs font-bold text-primary/80 mt-0.5 whitespace-nowrap">
                    {currentTime.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
            </div>
            <div className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm shadow-inner tracking-widest font-bold border border-white/10">
                <Clock size={14} className="animate-pulse text-accent" />
                <span className="font-mono">
                    {currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
        </div>
    );
};

export default DateTimeBadge;
