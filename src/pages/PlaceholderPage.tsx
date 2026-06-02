import React from 'react';
import { Construction } from 'lucide-react';
import { motion } from 'motion/react';
import KpiCard from '../components/shared/KpiCard';

interface PlaceholderPageProps {
  title: string;
}

export default function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className="flex flex-1 w-full flex-col animate-fadeIn bg-transparent space-y-4">
        <div className="h-14 px-8 flex flex-row items-center justify-between gap-4 z-20 shrink-0">
            <div className="flex items-center gap-5">
                <div className="relative flex items-center justify-center group cursor-default shrink-0">
                    <div className="absolute inset-0 bg-[#212c46] blur-[15px] opacity-20 rounded-full group-hover:opacity-60 transition-all duration-700"></div>
                    <div className="relative z-10 p-1.5 border border-[#212c46]/40 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm">
                        <Construction size={28} strokeWidth={2.5} className="text-[#212c46]" />
                    </div>
                </div>
                <div>
                    <h3 className="font-black text-[#212c46] uppercase tracking-tighter leading-none font-exception-header" style={{ fontSize: '24px' }}>
                        {title}
                    </h3>
                    <p className="text-[11px] font-bold text-[#7a8b95] uppercase tracking-[0.2em] mt-0.5 opacity-80 leading-none">
                        SYSTEM CORE MODULE
                    </p>
                </div>
            </div>
        </div>

        <div className="mx-auto px-4 sm:px-8 w-full mt-[2px]">
            {/* KPI STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 shrink-0">
                <KpiCard label="Module Status" value="Pending" icon="clock" colorAccent="#4d87a8" colorValue="#212c46" desc="Construction Phase" />
                <KpiCard label="Data Records" value="0" icon="database" colorAccent="#2e7d32" colorValue="#212c46" desc="Empty Database" />
                <KpiCard label="Active Users" value="-" icon="users" colorAccent="#d96245" colorValue="#212c46" desc="No Access Yet" />
                <KpiCard label="Security" value="Locked" icon="shield" colorAccent="#f59e0b" colorValue="#212c46" desc="Pending Review" />
            </div>

            <div className="w-full flex-1 flex flex-col min-h-[500px]">
                <div className="sys-table-card border-[#eaeaec] flex flex-col items-center justify-center flex-1 shadow-lg bg-white/50 overflow-hidden rounded-3xl border-2 border-dashed">
                    <Construction className="mb-4 h-16 w-16 text-[#b7a159]" />
                    <h1 className="text-2xl font-black uppercase tracking-widest text-[#212c46]">{title}</h1>
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-widest max-w-md text-center text-[#7a8b95]">
                        This module is currently under construction. 
                        Data and functionality will be implemented in the next phase.
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
}
