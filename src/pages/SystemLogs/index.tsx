import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Activity, ShieldAlert, Clock, UserCheck, Search, Filter, Download, 
  Eye, X, FileText, AlertTriangle, CheckCircle, Server, Database, 
  ChevronLeft, ChevronRight, HelpCircle, ChevronDown, MapPin
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { useCollection } from '../../services/useFirestore';

const THEME = {
  bgMain: '#f3f3f1',
  bgGradient: 'transparent',
  sidebarBg: 'linear-gradient(180deg, #1d2636 0%, #0F172A 100%)',
  glassWhite: 'rgba(255, 255, 255, 0.88)',
  primary: '#212c46',
  primaryLight: '#4d87a8',
  accent: '#a94228',
  gold: '#b58c4f',
  brightGold: '#b7a159',
  success: '#657f4d',
  danger: '#932c2e',
  skyBlue: '#3f809e',
  dustyBlue: '#7a8b95',
  indigo: '#414757',
  softPurple: '#ab7d82',
  deepPurple: '#2d2c4a',
  pinkAccent: '#a54f6b',
  mutedSlate: '#606a5f',
  darkSlate: '#2f2926',
  silver: '#d7d7d7',
  deepNavy: '#212c46',
  brownGold: '#b58c4f',
  vibrantPurple: '#2d2c4a',
  burntOrange: '#d96245',
  slateBlue: '#748ea1',
  coolGray: '#eaeaec'
};

import KpiCard from '../../components/shared/KpiCard';
import { UserGuidePanel } from '../../components/shared/UserGuidePanel';


function LogDetailsModal({ isOpen, onClose, log }: any) {
    if (!isOpen || !log) return null;

    const getStatusStyle = (status: string) => {
        switch(status) {
            case 'Success': return 'text-[#657f4d] bg-[#657f4d]/10 border-[#657f4d]/20';
            case 'Failed': return 'text-[#932c2e] bg-[#932c2e]/10 border-[#932c2e]/20';
            case 'Warning': return 'text-[#d96245] bg-[#d96245]/10 border-[#d96245]/20';
            default: return 'text-[#7a8b95] bg-[#f8f9fa] border-[#eaeaec]';
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-[#212c46]/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-3xl rounded-[28px] shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden border border-[#eaeaec]/50">
                <div className="bg-[#212c46] px-8 py-4 flex justify-between items-center text-[#b7a159] shrink-0 border-b border-[#414757]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white shadow-inner border border-white/20"><FileText size={24} strokeWidth={2.5} /></div>
                        <div>
                            <h3 className="text-lg font-black uppercase tracking-widest leading-none mb-1.5 drop-shadow-sm text-white">LOG DETAILS</h3>
                            <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest flex items-center gap-2 drop-shadow-sm"><Activity size={12} className="text-[#b7a159]" /> System Event Inspector</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all text-white/70 hover:text-[#932c2e]"><X size={24} /></button>
                </div>

                <div className="p-8 flex flex-col gap-6 bg-[#f8f9fa] overflow-y-auto custom-scrollbar"> 
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-black text-[#212c46] font-mono tracking-tighter">{log.id}</h2>
                            <p className="text-[11px] font-bold text-[#7a8b95] mt-1 uppercase tracking-widest">{log.timestamp}</p>
                        </div>
                        <span className={`px-4 py-1.5 rounded-full border-2 font-black text-[12px] uppercase tracking-widest ${getStatusStyle(log.status)}`}>
                            {log.status}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-5 rounded-xl border border-[#eaeaec] shadow-sm space-y-4">
                            <h4 className="text-[11px] font-black text-[#212c46] uppercase tracking-widest border-b border-[#d7d7d7] pb-2 flex items-center gap-2"><UserCheck size={14} className="text-[#4d87a8]"/> User Identity</h4>
                            <div className="space-y-3">
                                <div><p className="text-[9px] font-black text-[#7a8b95] uppercase tracking-widest">Username / ID</p><p className="text-[13px] font-black text-[#212c46] font-mono">{log.user}</p></div>
                                <div><p className="text-[9px] font-black text-[#7a8b95] uppercase tracking-widest">Access Role</p><p className="text-[12px] font-bold text-[#b7a159]">{log.role}</p></div>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-[#eaeaec] shadow-sm space-y-4">
                            <h4 className="text-[11px] font-black text-[#212c46] uppercase tracking-widest border-b border-[#d7d7d7] pb-2 flex items-center gap-2"><Server size={14} className="text-[#4d87a8]"/> Network & Device</h4>
                            <div className="space-y-3">
                                <div><p className="text-[9px] font-black text-[#7a8b95] uppercase tracking-widest">IP Address</p><p className="text-[13px] font-black text-[#3f809e] font-mono">{log.ip}</p></div>
                                <div><p className="text-[9px] font-black text-[#7a8b95] uppercase tracking-widest">User Agent</p><p className="text-[11px] font-medium text-[#414757] truncate" title={log.userAgent}>{log.userAgent}</p></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-[#eaeaec] shadow-sm space-y-4">
                        <h4 className="text-[11px] font-black text-[#212c46] uppercase tracking-widest border-b border-[#d7d7d7] pb-2 flex items-center gap-2"><Database size={14} className="text-[#4d87a8]"/> Action Payload</h4>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div><p className="text-[9px] font-black text-[#7a8b95] uppercase tracking-widest">Target Module</p><p className="text-[12px] font-bold text-[#212c46]">{log.module}</p></div>
                            <div><p className="text-[9px] font-black text-[#7a8b95] uppercase tracking-widest">Action Performed</p><p className="text-[12px] font-black text-[#4d87a8] uppercase font-mono">{log.action}</p></div>
                        </div>
                        <div className="bg-[#d7d7d7] p-4 rounded-xl border border-[#eaeaec] font-mono text-[11px] text-[#414757]">
                            <span className="text-[#932c2e] font-bold">"Message"</span>: "{log.details}"
                        </div>
                    </div>
                </div>

                <div className="px-8 py-4 bg-white border-t border-[#eaeaec] flex justify-end items-center shrink-0">
                    <button onClick={onClose} className="px-10 py-3 bg-[#212c46] text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-md hover:bg-[#414757] hover:text-white transition-all border border-[#212c46]">
                        Close Details
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default function AccessLogs() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState<any>(null);
    const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
    
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(15);
    
    // Fetch real-time data from Firestore 'accessLogs' collection
    const { data: firebaseLogs, loading } = useCollection<any>('accessLogs');

    const logs = useMemo(() => {
        return firebaseLogs.map(log => ({
            id: log.id,
            timestamp: log.timestamp ? (log.timestamp.toDate ? log.timestamp.toDate().toISOString().replace('T', ' ').substring(0, 19) : new Date(log.timestamp).toISOString().replace('T', ' ').substring(0, 19)) : new Date().toISOString().replace('T', ' ').substring(0, 19),
            user: log.name || 'UNKNOWN_USER',
            role: log.role || '-',
            ip: log.ip || 'Unknown IP',
            module: log.module || 'System',
            action: log.action || 'UNKNOWN',
            status: log.status || 'Success',
            details: log.details || 'System activity logged successfully.',
            userAgent: log.userAgent || ''
        })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [firebaseLogs]);

    const totalLogs = logs.length;
    const failedLogs = logs.filter(l => l.status === 'Failed').length;
    const successLogs = logs.filter(l => l.status === 'Success').length;
    const uniqueUsers = new Set(logs.map(l => l.user)).size;

    const filteredLogs = useMemo(() => {
        let res = logs;
        if (statusFilter !== 'All') {
            res = res.filter(l => l.status === statusFilter);
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            res = res.filter(l => 
                l.user.toLowerCase().includes(q) || 
                l.module.toLowerCase().includes(q) || 
                l.action.toLowerCase().includes(q) ||
                l.ip.includes(q)
            );
        }
        return res;
    }, [logs, statusFilter, searchQuery]);

    const paginatedLogs = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredLogs.slice(start, start + itemsPerPage);
    }, [filteredLogs, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;

    useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter, itemsPerPage]);

    const getStatusStyle = (status: string) => {
        switch(status) {
            case 'Success': return 'text-[#657f4d] bg-[#657f4d]/10 border-[#657f4d]/20';
            case 'Failed': return 'text-[#932c2e] bg-[#932c2e]/10 border-[#932c2e]/20';
            case 'Warning': return 'text-[#d96245] bg-[#d96245]/10 border-[#d96245]/20';
            default: return 'text-[#7a8b95] bg-[#f8f9fa] border-[#eaeaec]';
        }
    };

    return (
        <div className="flex flex-1 w-full flex-col animate-fadeIn bg-transparent space-y-4">
            
            <button onClick={() => setIsGuideOpen(true)} className="fixed right-0 top-[80px] bg-[#f8f9fa] border border-[#eaeaec] border-r-0 text-[#212c46] py-8 px-1.5 rounded-l-xl shadow-md hover:bg-[#932c2e] hover:text-white hover:border-[#932c2e] transition-all duration-500 z-[100] flex flex-col items-center gap-4 group">
          <HelpCircle size={18} className="shrink-0 group-hover:rotate-12 transition-transform text-[#7a8b95] group-hover:text-white" />
          <span className="font-black tracking-[0.3em] [writing-mode:vertical-rl] rotate-180 whitespace-nowrap uppercase text-[11px]">USER GUIDE</span>
      </button>

            <UserGuidePanel isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} title="AUDIT GUIDE" subtitle="คู่มือการตรวจสอบบันทึกการใช้งาน">
                <div className="space-y-8">
                    <div>
                        <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                            <Icons.Activity size={16} className="text-[#b7a159]" /> 1. PURPOSE OF ACCESS LOGS
                        </h3>
                        <div className="p-4 bg-[#f8f9fa] border border-[#eaeaec] rounded-xl">
                            <p className="mb-4">หน้าต่าง Access Logs ใช้สำหรับการตรวจสอบความเคลื่อนไหวและประวัติการเข้าถึงระบบทั้งหมด เพื่อให้สอดคล้องกับมาตรฐานความปลอดภัย (Security Audit)</p>
                            <ul className="space-y-3 list-disc pl-5">
                                <li>เก็บบันทึกการเข้าสู่ระบบ (Login) ทั้งสำเร็จและล้มเหลว</li>
                                <li>ติดตามการแก้ไขข้อมูลสำคัญ (Create, Update, Delete)</li>
                                <li>บันทึกหมายเลข IP และอุปกรณ์ที่ใช้เข้าถึง</li>
                            </ul>
                        </div>
                    </div>

                    <div className="h-px bg-[#eaeaec] w-full" />

                    <div>
                        <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                            <Icons.Filter size={16} className="text-[#3f809e]" /> 2. STATUS INDICATORS
                        </h3>
                        <div className="p-4 bg-[#f8f9fa] border border-[#eaeaec] rounded-xl space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="px-3 py-1 bg-[#eef5e9] border border-[#cfdfc3] text-[#688a58] rounded text-[10px] font-black shrink-0">SUCCESS</div>
                                <div>การทำงานเสร็จสมบูรณ์ ไม่มีข้อผิดพลาด</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="px-3 py-1 bg-[#fdf2f2] border border-[#f5c6cb] text-[#d55a6d] rounded text-[10px] font-black shrink-0">WARNING</div>
                                <div>การเข้าถึงที่ควรจับตามอง เช่น สิทธิ์ไม่เพียงพอ</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="px-3 py-1 bg-[#fcf4f5] border border-[#e8c6cb] text-[#932c2e] rounded text-[10px] font-black shrink-0">FAILED</div>
                                <div>การทำงานล้มเหลว หรือการพยายามเจาะระบบ</div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="h-px bg-[#eaeaec] w-full" />

                    <div>
                        <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                            <Icons.Download size={16} className="text-[#688a58]" /> 3. DATA EXPORT
                        </h3>
                        <p>ผู้ดูแลระบบสามารถกดปุ่ม <span className="font-bold">EXPORT LOGS</span> เพื่อดาวน์โหลดข้อมูลเป็นไฟล์ CSV สำหรับนำไปวิเคราะห์ต่อในระบบภายนอก หรือเก็บเป็นหลักฐานรายงาน (Audit Report)</p>
                    </div>
                </div>
            </UserGuidePanel>
            <LogDetailsModal isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} log={selectedLog} />

            <div className="h-14 px-4 sm:px-8 flex flex-row items-center justify-between gap-4 z-20 shrink-0">
                <div className="flex items-center gap-5">
                    <div className="relative flex items-center justify-center group cursor-default shrink-0">
                        <div className="absolute inset-0 bg-[#3f809e] blur-[15px] opacity-20 rounded-full group-hover:opacity-60 transition-all duration-700"></div>
                  <div className="relative z-10 p-1.5 border border-[#3f809e]/40 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm">
                      <ShieldAlert size={28} strokeWidth={2.5} className="text-[#3f809e]" />
                  </div>
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3 font-exception-header">
                            <h3 className="font-black text-[#212c46] uppercase tracking-widest text-[24px] flex items-center gap-2 leading-none">
                                SYSTEM <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3f809e] to-[#b58c4f] drop-shadow-sm">ACCESS LOGS</span>
                            </h3>
                        </div>
                        <p className="text-[11px] font-bold text-[#4d5a44] uppercase tracking-[0.2em] mt-0.5 opacity-80 leading-none">
                            SECURITY AUDIT & ACTIVITY TRACKING
                        </p>
                    </div>
                </div>
            </div>

            <div className="mx-auto px-4 sm:px-8 w-full mt-[2px]">
                <div className="w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-5 shrink-0">
                        <KpiCard label="Total Requests" value={totalLogs.toLocaleString()} icon={Activity} colorAccent={THEME.primaryLight} colorValue={THEME.primary} desc="All Logged Events" />
                        <KpiCard label="Successful Actions" value={successLogs.toLocaleString()} icon={CheckCircle} colorAccent={THEME.success} colorValue={THEME.success} desc="Authorized Operations" />
                        <KpiCard label="Failed Attempts" value={failedLogs.toLocaleString()} icon={AlertTriangle} colorAccent={THEME.danger} colorValue={THEME.danger} desc="Requires Attention" />
                        <KpiCard label="Unique Users" value={uniqueUsers} icon={UserCheck} colorAccent={THEME.accent} colorValue={THEME.primary} desc="Active Identities" />
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-[#eaeaec]/60 overflow-hidden flex flex-col animate-fadeIn">
                        
                        <div className="px-4 py-4 border-b border-[#eaeaec] bg-white flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <div className="relative">
                                    <button onClick={() => setFilterDropdownOpen(!filterDropdownOpen)} className="flex items-center gap-3 bg-[#f8f9fa] px-4 py-2.5 rounded-xl border border-[#eaeaec] shadow-sm hover:border-[#b7a159] hover:bg-white transition-all min-w-[180px]">
                                        <Filter size={16} className="text-[#b7a159]" />
                                        <span className="text-[11px] font-black uppercase text-[#212c46]">{statusFilter === 'All' ? 'All Statuses' : statusFilter}</span>
                                        <ChevronDown size={14} className={`text-[#7a8b95] ml-auto transition-transform ${filterDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    {filterDropdownOpen && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setFilterDropdownOpen(false)}></div>
                                            <div className="absolute top-[110%] left-0 w-full bg-white border border-[#eaeaec] shadow-2xl rounded-xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                                                {['All', 'Success', 'Failed', 'Warning'].map(status => (
                                                    <button key={status} onClick={() => { setStatusFilter(status); setFilterDropdownOpen(false); }} className={`w-full flex items-center p-3 rounded-xl transition-all ${statusFilter === status ? 'bg-[#f8f9fa] text-[#212c46]' : 'hover:bg-[#f8f9fa] text-[#7a8b95]'}`}>
                                                        <span className="text-[11px] font-black uppercase tracking-wider">{status === 'All' ? 'All Statuses' : status}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="relative flex-1 md:w-80">
                                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a8b95]" />
                                    <input type="text" value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} placeholder="Search user, IP, or module..." className="w-full pl-12 pr-4 py-2.5 text-[12px] font-bold rounded-xl border border-[#eaeaec] focus:outline-none focus:border-[#b7a159] bg-[#f8f9fa] focus:bg-white shadow-sm text-[#212c46] transition-all" />
                                </div>
                            </div>
                            <div className="flex gap-3 shrink-0 w-full md:w-auto">
                                <button className="w-full md:w-auto px-6 py-2.5 bg-gradient-to-r from-[#212c46] to-[#414757] text-white rounded-xl text-[11px] font-black tracking-widest uppercase shadow-md hover:scale-105 transition-all flex items-center justify-center gap-2 border border-[#212c46]">
                                    <Download size={16} /> EXPORT LOGS
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto custom-scrollbar bg-[#f8f9fa]">
                            <table className="w-full text-left border-collapse table-font">
                                <thead className="sys-table-header sticky top-0 z-10 [#b7a159] ">
                    <tr>
                                        <th className="font-black uppercase tracking-widest  whitespace-nowrap">Date / Time</th>
                                        <th className="font-black uppercase tracking-widest  whitespace-nowrap">User Identity</th>
                                        <th className="font-black uppercase tracking-widest  whitespace-nowrap">IP Address</th>
                                        <th className="font-black uppercase tracking-widest  whitespace-nowrap">Module & Action</th>
                                        <th className="font-black uppercase tracking-widest  text-center whitespace-nowrap">Status</th>
                                        <th className="font-black uppercase tracking-widest  text-center whitespace-nowrap">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#eaeaec] bg-white">
                                    {paginatedLogs.length > 0 ? paginatedLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-[#f8f9fa] transition-colors group">
                                            <td className="px-4 text-[12px] py-2.5">
                                                <div className="flex items-center gap-2 font-mono text-[#7a8b95]">
                                                    <Clock size={14}/> <span>{log.timestamp}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <div className="flex flex-col">
                                                    <span className={`font-black text-[12px] font-mono tracking-tight ${log.user === 'UNKNOWN_USER' ? 'text-[#932c2e]' : 'text-[#212c46]'}`}>{log.user}</span>
                                                    <span className="text-[10px] font-bold text-[#7a8b95] mt-0.5 uppercase tracking-wider">{log.role}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 font-mono text-[12px] font-bold text-[#4d87a8] py-2.5">
                                                <div className="flex items-center gap-1.5"><MapPin size={12} className="text-[#7a8b95]"/> {log.ip}</div>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-[12px] text-[#212c46]">{log.module}</span>
                                                    <span className="font-mono text-[10px] font-black text-[#b7a159] mt-0.5 tracking-tight">{log.action}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 text-center py-2.5">
                                                <span className={`px-3 py-1 rounded-full border font-black text-[11px] uppercase tracking-widest whitespace-nowrap ${getStatusStyle(log.status)}`}>
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td className="px-4 text-center py-2.5">
                                                <div className="flex justify-center items-center gap-[1px]">
                                                    <button onClick={() => setSelectedLog(log)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-[#eaeaec] text-[#4d87a8] hover:bg-[#d7d7d7] hover:border-[#4d87a8] transition-all active:scale-90" title="View Details">
                                                        <Eye size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td className="text-center text-[#7a8b95] font-bold text-[12px] py-2.5 px-4">
                                                No logs found matching your criteria.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="px-8 py-3 bg-[#f8f9fa] border-t-[1.5px] border-slate-300 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
                            <div className="flex items-center gap-6 text-[11px] font-black text-[#7a8b95] uppercase tracking-widest">
                                <div className="flex items-center gap-3">
                                    <span>Display Rows:</span>
                                    <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="bg-white border border-[#eaeaec] rounded-lg px-3 py-1.5 outline-none font-black text-[#212c46] cursor-pointer shadow-sm focus:border-[#b7a159]">
                                        {[15, 30, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
                                    </select>
                                </div>
                                <p className="bg-white px-4 py-1.5 rounded-lg border border-[#eaeaec] shadow-sm text-[#212c46]">Total Records: {filteredLogs.length}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className={`w-9 h-9 border border-[#eaeaec] bg-white rounded-lg flex items-center justify-center transition-all ${currentPage === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#d7d7d7] text-[#4d87a8] shadow-sm active:scale-90'}`}>
                                    <ChevronLeft size={16}/>
                                </button>
                                <div className="bg-white text-[#212c46] px-6 py-2 rounded-lg font-black text-[11px] min-w-[120px] text-center uppercase tracking-widest border border-[#eaeaec] shadow-sm">
                                    Page {currentPage} / {totalPages || 1}
                                </div>
                                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className={`w-9 h-9 border border-[#eaeaec] bg-white rounded-lg flex items-center justify-center transition-all ${currentPage === totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#d7d7d7] text-[#4d87a8] shadow-sm active:scale-90'}`}>
                                    <ChevronRight size={16}/>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
