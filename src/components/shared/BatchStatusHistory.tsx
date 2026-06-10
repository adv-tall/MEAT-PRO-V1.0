import React from 'react';
import { useCollection } from '../../services/useFirestore';
import { Clock, CheckCircle, Navigation, Info } from 'lucide-react';

export const BatchStatusHistory = ({ batchId }: { batchId: string }) => {
    const { data: logs, loading } = useCollection<any>('SystemLogs');

    const statusChanges = logs.filter(
        log => log.module === 'Orders_Production' && 
        log.action === 'STATUS_CHANGE' && 
        log.details.includes(batchId)
    ).sort((a, b) => new Date(b.timestamp || b.createdAt || 0).getTime() - new Date(a.timestamp || a.createdAt || 0).getTime());

    return (
        <div className="bg-white rounded-xl shadow-sm border border-[#eaeaec] p-4 flex flex-col mt-4">
            <h3 className="text-xs font-black text-[#212c46] uppercase tracking-widest flex items-center gap-2 mb-4 border-b pb-2">
                <Clock size={14} className="text-[#a94228]" />
                Status Change History
            </h3>
            {loading ? (
                <div className="text-center py-4 text-xs font-bold text-slate-400">Loading history...</div>
            ) : statusChanges.length === 0 ? (
                <div className="text-center py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex flex-col items-center">
                    <Info size={20} className="mb-2 text-slate-300" />
                    No manual status changes tracked for this batch yet.
                </div>
            ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                    {statusChanges.map((log, idx) => {
                        const dateObj = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.createdAt || log.timestamp);
                        const isLatest = idx === 0;
                        return (
                            <div key={log.id || idx} className={`flex items-start gap-3 p-3 rounded-lg border ${isLatest ? 'bg-slate-50 border-[#212c46]/20' : 'bg-white border-[#eaeaec]'}`}>
                                <div className={`shrink-0 mt-0.5 ${isLatest ? 'text-[#2e7d32]' : 'text-slate-400'}`}>
                                    {isLatest ? <CheckCircle size={14} /> : <Navigation size={14} className="transform rotate-90" />}
                                </div>
                                <div>
                                    <p className={`text-[11px] font-bold ${isLatest ? 'text-[#212c46]' : 'text-slate-600'}`}>
                                        {log.details}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                        <span className="bg-slate-100 px-1.5 py-0.5 rounded">{log.name} ({log.role})</span>
                                        <span>•</span>
                                        <span>{dateObj.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
};
