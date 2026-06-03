import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from "react-router-dom";
import * as Icons from 'lucide-react';
import { UserGuidePanel } from '@/src/components/shared/UserGuidePanel';
import UserGuideButton from '@/src/components/shared/UserGuideButton';
import KpiCard from '@/src/components/shared/KpiCard';
import { createPortal } from 'react-dom';
import { CsvUpload } from '@/src/components/shared/CsvUpload';
import { CsvExport } from '@/src/components/shared/CsvExport';
import { useSharedOrders } from '@/src/store/ordersStore';
import { FG_DATABASE, MOCK_ORDERS } from '@/src/data/mockOrders';

const SHIFTS = [
    { id: 'Morning', icon: 'sun', activeColor: 'bg-[#4d87a8] text-white shadow-md border-[#4d87a8]' },
    { id: 'Afternoon', icon: 'sunset', activeColor: 'bg-[#932c2e] text-white shadow-md border-[#932c2e]' },
    { id: 'Night', icon: 'moon', activeColor: 'bg-[#212c46] text-white shadow-md border-[#212c46]' },
    { id: 'All Day', icon: 'layers', activeColor: 'bg-[#7a8b95] text-white shadow-md border-[#7a8b95]' }
];

const THEME = {
    primary: '#212c46',
    secondary: '#414757',
    warning: '#f59e0b',
    success: '#2e7d32',
    info: '#4d87a8',
    accent: '#932c2e',
    muted: '#7a8b95'
};

// --- HELPER COMPONENTS ---
const kebabToPascal = (str: string) => str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
const LucideIcon = ({ name, size = 16, className = "", color, style }: any) => {
    if (!name) return <Icons.HelpCircle size={size} className={className} style={style} />;
    const pascalName = kebabToPascal(name);
    const IconComponent = (Icons as any)[pascalName] || (Icons as any)[`${pascalName}Icon`] || Icons.CircleHelp || Icons.Activity;
    if (!IconComponent) return null;
    return <IconComponent size={size} className={className} style={{...style, color: color}} strokeWidth={2} />;
};



const MACHINE_CAPACITIES = [
    { id: 'M1', name: 'Mixer A', type: 'Mixing', capacity: 30000, allocated: 25500, status: 'In Use' },
    { id: 'M2', name: 'Mixer B', type: 'Mixing', capacity: 25000, allocated: 0, status: 'Idle' },
    { id: 'F1', name: 'Forming Line 1', type: 'Forming', capacity: 40000, allocated: 38000, status: 'Online' },
    { id: 'F2', name: 'Forming Line 2', type: 'Forming', capacity: 40000, allocated: 0, status: 'Under Maintenance' },
    { id: 'P1', name: 'Packing Line 1', type: 'Packing', capacity: 50000, allocated: 42000, status: 'In Use' },
    { id: 'P2', name: 'Packing Line 2', type: 'Packing', capacity: 30000, allocated: 12000, status: 'Online' },
];

const MachineCapacityBar = ({ name, type, capacity, allocated, status }: any) => {
    const percentage = Math.min(100, Math.round((allocated / capacity) * 100));
    let colorClass = 'bg-[#2e7d32]';
    let textColor = 'text-[#2e7d32]';
    let bgLight = 'bg-stone-50 text-[#2e7d32] border-[#2e7d32]/20';
    
    if (percentage > 90) {
        colorClass = 'bg-[#932c2e]';
        textColor = 'text-[#932c2e]';
        bgLight = 'bg-rose-50 text-[#932c2e] border-rose-200';
    } else if (percentage > 75) {
        colorClass = 'bg-[#f59e0b]';
        textColor = 'text-[#f59e0b]';
        bgLight = 'bg-amber-50 text-[#f59e0b] border-amber-200';
    }

    if (status === 'Under Maintenance' || status === 'Maintenance') {
        colorClass = 'bg-[#932c2e]/60';
        textColor = 'text-[#932c2e]';
        bgLight = 'bg-[#f8f9fa] border-[#eaeaec]';
    }

    const getStatusConfig = (s: string) => {
        switch(s) {
            case 'Online': return { color: 'bg-[#2e7d32]', label: 'Online' };
            case 'Idle': return { color: 'bg-[#f59e0b]', label: 'Idle' };
            case 'In Use': return { color: 'bg-[#4d87a8]', label: 'In Use' };
            case 'Under Maintenance':
            case 'Maintenance': return { color: 'bg-[#932c2e]', label: 'Maintenance' };
            default: return { color: 'bg-[#7a8b95]', label: s };
        }
    };

    const statusConfig = getStatusConfig(status);

    return (
        <div className="flex flex-col gap-2 relative">
            {(status === 'Under Maintenance' || status === 'Maintenance') && (
                <div className="absolute inset-x-0 -top-1 -bottom-1 bg-white/40 z-10 rounded-xl" />
            )}
            <div className="flex justify-between items-end">
                <div>
                     <div className="flex items-center gap-2 mb-1">
                        <div className="text-[10px] font-black text-[#7a8b95] uppercase tracking-widest leading-none">{type}</div>
                        <div className="flex items-center gap-1 bg-white border border-[#eaeaec] rounded-md px-1.5 py-0.5 shadow-sm">
                            <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.color} animate-pulse shadow-[0_0_5px_rgba(0,0,0,0.1)]`}></div>
                            <span className="text-[8px] font-black uppercase text-[#414757] tracking-widest">{statusConfig.label}</span>
                        </div>
                     </div>
                     <div className={`text-[13px] font-black text-[#212c46] leading-none truncate max-w-[150px]`} title={name}>{name}</div>
                </div>
                <div className="text-right flex flex-col items-end">
                    <span className={`text-[14px] font-black ${textColor} font-mono leading-none`}>{percentage}%</span>
                    <div className="text-[10px] font-bold text-[#7a8b95] font-mono mt-1 leading-none uppercase tracking-widest">{(allocated/1000).toFixed(1)}k / {(capacity/1000).toFixed(1)}k Kg</div>
                </div>
            </div>
            <div className={`h-2.5 w-full bg-[#eaeaec]/50 rounded-full overflow-hidden border-none shadow-inner mt-1`}>
                <div 
                    className={`h-full ${colorClass} transition-all duration-1000 ease-out relative`} 
                    style={{ width: `${(status === 'Under Maintenance' || status === 'Maintenance') ? 100 : percentage}%`, opacity: (status === 'Under Maintenance' || status === 'Maintenance') ? 0.4 : 1 }}
                >
                </div>
            </div>
        </div>
    );
};

const StandardModalWrapper = ({ children, className }: any) => (
    <div className={`relative ${className}`} onClick={e => e.stopPropagation()}>
        {children}
    </div>
);

// --- MAIN APPLICATION ---
export default function ProductionPlanning() {
    const navigate = useNavigate();
    const [activeMainTab, setActiveMainTab] = useState('Entry');
    const [activeShift, setActiveShift] = useState('All Day');
    const [orders, setOrders] = useSharedOrders();
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isTabDropdownOpen, setIsTabDropdownOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(15);
    const [activeModuleTab, setActiveModuleTab] = useState('PRODUCTION PLANNING');
    
    const [pendingIAReplans, setPendingIAReplans] = useState([
        { id: '260416-N123.rep.1', product: 'Pork Meatball', lossKg: 20, refPrb: '260416-N123', status: 'Pending Approval' }
    ]);

    const handleAIGenerate = () => {
        const newOrders = [
            {
                id: `260416-AI-${String(Math.floor(Math.random()*1000)).padStart(3, '0')}`,
                sku: FG_DATABASE[0].sku, name: FG_DATABASE[0].name, qty: 5000, fgKg: 5000 * FG_DATABASE[0].weight, sfgKg: 5000 * FG_DATABASE[0].weight, batterKg: Number((5000 * FG_DATABASE[0].weight * 1.1).toFixed(2)),
                deadline: '16:00', startTime: 'TBD', status: 'PLANNED', isReplacement: false,
                shift: 'Afternoon', currentStep: 'Entry', refPL: 'PL-2605-AUTO'
            },
            {
                id: `260416-AI-${String(Math.floor(Math.random()*1000)).padStart(3, '0')}`,
                sku: FG_DATABASE[1].sku, name: FG_DATABASE[1].name, qty: 2500, fgKg: 2500 * FG_DATABASE[1].weight, sfgKg: 2500 * FG_DATABASE[1].weight, batterKg: Number((2500 * FG_DATABASE[1].weight * 1.1).toFixed(2)),
                deadline: '24:00', startTime: 'TBD', status: 'PLANNED', isReplacement: false,
                shift: 'Night', currentStep: 'Entry', refPL: 'PL-2605-AUTO'
            }
        ];
        setOrders(prev => [...newOrders, ...prev]);
    };

    const handleApproveReplan = (replan: any) => {
        const fg = FG_DATABASE.find(f => f.name === replan.product) || FG_DATABASE[0];
        const newOrder = {
            id: replan.id, // e.g. 260416-N123.rep.1
            sku: fg.sku, name: fg.name, qty: Math.ceil(replan.lossKg / fg.weight), fgKg: replan.lossKg, sfgKg: replan.lossKg, batterKg: Number((replan.lossKg * 1.1).toFixed(2)),
            deadline: 'TBD', startTime: 'TBD', status: 'DRAFT', isReplacement: true,
            shift: 'All Day', currentStep: 'Entry',
            refPL: 'PL-2606-0001' // Mocking Ref PL NO from PLANNING (PL)
        };
        setOrders([newOrder, ...orders]);
        setPendingIAReplans(pendingIAReplans.filter(p => p.id !== replan.id));
    };

    const handleCloseIncomplete = (replan: any) => {
        setPendingIAReplans(pendingIAReplans.filter(p => p.id !== replan.id));
    };
    const globalStyles = `
      @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700;800&family=Noto+Sans+Thai:wght@300;400;500;600;700;800&display=swap');
      
      .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(33, 44, 70, 0.1); border-radius: 10px; }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(147, 44, 46, 0.5); }
      
      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
      .font-exception-header { font-family: 'JetBrains Mono', 'Noto Sans Thai', sans-serif; }
    `;

    const [newItem, setNewItem] = useState({ date: new Date().toISOString().split('T')[0], time: '12:00', jobType: 'Normal', sku: '', quantity: '' });

    useEffect(() => {
        setTimeout(() => setLoading(false), 600);
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const handleAddOrder = () => {
        if (!newItem.sku || !newItem.quantity) return;
        const fg = FG_DATABASE.find(f => f.sku === newItem.sku);
        const qtyNum = Number(newItem.quantity);
        const fgKg = qtyNum * (fg?.weight || 1);
        const shift = newItem.time === '12:00' ? 'Morning' : (newItem.time === '16:00' ? 'Afternoon' : 'Night');

        const newOrder = {
            id: `260416-N${String(Math.floor(Math.random()*1000)).padStart(3, '0')}`,
            sku: newItem.sku, name: fg?.name || 'Unknown', qty: qtyNum, fgKg, sfgKg: fgKg, batterKg: Number((fgKg * 1.1).toFixed(2)),
            deadline: newItem.time, startTime: 'TBD', status: 'DRAFT', isReplacement: newItem.jobType === 'Replacement',
            shift, currentStep: 'Entry'
        };
        setOrders([newOrder, ...orders]);
        setNewItem({ ...newItem, sku: '', quantity: '' });
        setIsAddModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this order?')) {
            setOrders(orders.filter(p => p.id !== id));
        }
    };

    const totalSummary = useMemo(() => {
        return orders.reduce((acc, curr) => ({ fg: acc.fg + curr.fgKg, sfg: acc.sfg + curr.sfgKg, batter: acc.batter + curr.batterKg }), { fg: 0, sfg: 0, batter: 0 });
    }, [orders]);

    const getAlarmStatus = (deadline: string, status: string) => {
        if (status === 'COMPLETED') return { color: 'bg-stone-50 text-[#2e7d32] border-[#2e7d32]/20', label: 'COMPLETED', blink: false };
        const [dh, dm] = (deadline || '23:59').split(':').map(Number);
        const deadlineDate = new Date(); deadlineDate.setHours(dh, dm, 0, 0);
        if (currentTime > deadlineDate) return { color: 'bg-rose-50 border-rose-200 text-[#932c2e] shadow-sm', label: 'DELAYED', blink: true };
        const diffMs = deadlineDate.getTime() - currentTime.getTime();
        if (diffMs <= 2 * 60 * 60 * 1000) return { color: 'bg-amber-50 text-[#f59e0b] border-amber-200', label: 'URGENT', blink: false };
        return { color: 'bg-[#f8f9fa] text-[#7a8b95] border-[#eaeaec]', label: 'ON PLAN', blink: false };
    };

    const filteredOrders = useMemo(() => {
        let filtered = orders;
        if (activeShift !== 'All Day') filtered = filtered.filter(o => o.shift === activeShift);
        if (activeMainTab === 'Entry') filtered = filtered.filter(o => ['DRAFT', 'APPROVED', 'PLANNED'].includes(o.status) && o.currentStep === 'Entry');
        else filtered = filtered.filter(o => o.currentStep === activeMainTab);
        
        if (searchTerm) {
            filtered = filtered.filter(o => 
                o.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                o.sku.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return filtered;
    }, [orders, activeShift, activeMainTab, searchTerm]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

    useEffect(() => { setCurrentPage(1); }, [searchTerm, activeShift, activeMainTab, itemsPerPage]);

    if (loading) return (
        <div className="flex h-full w-full items-center justify-center bg-transparent">
            <div className="flex flex-col items-center gap-4">
                <Icons.Loader2 size={48} className="animate-spin text-[#212c46]" />
                <span className="text-[#212c46] font-black uppercase tracking-widest text-sm animate-pulse">Loading Planning Data...</span>
            </div>
        </div>
    );

    return (
        <div className="flex flex-1 w-full flex-col animate-fadeIn bg-transparent space-y-4">
            <style>{globalStyles}</style>

            <UserGuideButton onClick={() => setIsGuideOpen(true)} />
            <UserGuidePanel isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} title="PRODUCTION GUIDE">
                <div className="space-y-8">
                    <div>
                        <p className="mb-4">
                            <span className="font-bold text-[#212c46]">หน้าที่หลัก: </span> 
                            ใช้สำหรับบริหารจัดการและจัดคิวการผลิตในฝั่งฝ่ายผลิต (Plan By Production) โดยรับข้อมูลออเดอร์มาจากฝ่ายวางแผน (Planning) เพื่อนำมาจัดสรรลงกระบวนการและแผนกต่างๆ อย่างละเอียด
                        </p>
                        <ul className="space-y-3 list-disc pl-5 text-[#414757]">
                            <li><span className="font-bold text-[#212c46]">ENTRY:</span> ออเดอร์ที่เพิ่งรับเข้ามาใหม่ รอการประเมินและจัดคิวลงสายการผลิต</li>
                            <li><span className="font-bold text-[#212c46]">QUEUE:</span> ออเดอร์ที่ถูกจัดเรียงลำดับการผลิตเรียบร้อยแล้ว รอดำเนินการเข้าเครื่องจักร</li>
                            <li><span className="font-bold text-[#212c46]">MIXING / PACKING:</span> แท็บเฉพาะสำหรับติดตามสถานะออเดอร์ที่กำลังอยู่ในขั้นตอนการผลิตจริงในแต่ละแผนก</li>
                        </ul>
                    </div>

                    <div className="h-px bg-[#eaeaec] w-full" />

                    <div>
                        <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                            <Icons.HeartPulse size={16} className="text-[#d55a6d] mt-0.5 shrink-0" /> PLAN HEALTH
                        </h3>
                        <p className="mb-4 text-[#414757]">ระบบแจ้งเตือนสถานะความเสี่ยงของออเดอร์ คำนวณแบบ Real-time โดยเทียบเวลาปัจจุบันกับกำหนดส่งมอบ (Deadline):</p>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="bg-[#f0f2f5] text-[#212c46] font-bold text-[10px] uppercase tracking-widest px-2 py-1 rounded w-[80px] text-center mt-1 shrink-0">ON PLAN</div>
                                <div className="text-[#414757]">อยู่ในแผนงานปกติ มีเวลาดำเนินการเพียงพอ (มากกว่า 2 ชั่วโมงก่อนกำหนด)</div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="bg-[#fff9e6] border border-[#ffdb7d] text-[#ce870a] font-bold text-[10px] uppercase tracking-widest px-2 py-1 rounded w-[80px] text-center mt-1 shrink-0">URGENT</div>
                                <div className="text-[#414757]">ออเดอร์เร่งด่วน ใกล้ถึงกำหนดส่งมอบ (เหลือเวลา &le; 2 ชั่วโมง)</div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="bg-[#fdf2f2] border border-[#f5c6cb] text-[#d55a6d] font-bold text-[10px] uppercase tracking-widest px-2 py-1 rounded w-[80px] text-center mt-1 shrink-0">DELAYED</div>
                                <div className="text-[#414757]">ออเดอร์ล่าช้าเกินกำหนดส่งมอบ ต้องเร่งติดตามและจัดการทันที หรือเป็นออเดอร์ฉุกเฉิน (Replacement)</div>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-[#eaeaec] w-full" />

                    <div>
                        <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                            <Icons.AlertTriangle size={16} className="text-[#d55a6d] mt-0.5 shrink-0" /> REPLACEMENT ORDERS
                        </h3>
                        <p className="font-bold text-[#212c46] mb-2">การจัดการออเดอร์ทดแทน (Replacement):</p>
                        <p className="text-[#414757]">
                            เมื่อเกิดความสูญเสีย (Loss/Waste) ระหว่างกระบวนการผลิต ฝ่ายผลิตสามารถสร้าง "ออเดอร์ทดแทน" ผ่านปุ่ม Add New Order โดยระบุ Job Type เป็น "Replacement" ระบบจะไฮไลท์และแจ้งเตือนในสถานะ DELAYED สีแดงทันที เพื่อให้ความสำคัญระดับสูงสุดและผลิตทันกำหนดเวลา
                        </p>
                    </div>
                </div>
            </UserGuidePanel>
            
            {/* Header Area synced with other modules */}
            <div className="h-14 px-4 sm:px-8 flex flex-row items-center justify-between gap-4 z-20 shrink-0">
                <div className="flex items-center gap-5">
                    <div className="relative flex items-center justify-center group cursor-default shrink-0">
                        <div className="absolute inset-0 bg-[#212c46] blur-[15px] opacity-20 rounded-full group-hover:opacity-60 transition-all duration-700"></div>
                        <div className="relative z-10 p-1.5 border border-[#212c46]/40 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm">
                            <Icons.Calendar size={28} strokeWidth={2.5} className="text-[#212c46]" />
                        </div>
                    </div>
                    <div>
                        <h3 className="font-black text-[#212c46] uppercase tracking-tighter leading-none font-exception-header flex gap-2" style={{ fontSize: '24px' }}>
                            <span>PRODUCTION</span>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#212c46] to-[#4d87a8]">PLANNING</span>
                        </h3>
                        <p className="text-[11px] font-bold text-[#7a8b95] uppercase tracking-[0.2em] mt-0.5 opacity-80 leading-none">
                            Managing active production orders & execution
                        </p>
                    </div>
                </div>
                
                {/* Main Tabs */}
                <div className="flex items-center gap-4">
                    <div className="bg-white/50 p-1.5 rounded-xl border border-white/60 shadow-inner flex flex-wrap items-center gap-1">
                        {['PLANNING (PL)', 'PRODUCTION PLANNING', 'AI PLANNER ASST.'].map(t => (
                            <button 
                                key={t} 
                                onClick={() => {
                                    setActiveModuleTab(t);
                                    if (t === "PLANNING (PL)") navigate("/planning/pl");
                                    if (t === "PRODUCTION PLANNING") navigate("/planning/production");
                                    if (t === "AI PLANNER ASST.") navigate("/planning/ai");
                                }} 
                                className={`px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                                    activeModuleTab === t ? 'bg-[#212c46] text-white shadow-md' : 'text-[#7a8b95] hover:text-[#a94228]'
                                }`}
                            >
                                {t === 'PLANNING (PL)' && <Icons.FileSpreadsheet size={16} />}
                                {t === 'PRODUCTION PLANNING' && <Icons.Factory size={16} />}
                                {t === 'AI PLANNER ASST.' && <Icons.Cpu size={16} />}
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mx-auto px-4 sm:px-8 w-full mt-[2px]">
                {pendingIAReplans.length > 0 && (
                    <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 shadow-sm animate-fadeIn">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#932c2e]/10 flex items-center justify-center text-[#932c2e] shrink-0">
                                <Icons.Bot size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-[#932c2e] text-sm flex items-center gap-2">
                                    <span className="relative flex h-2.5 w-2.5">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                                    </span>
                                    ACCIDENT ALERT: FG SHORTAGE
                                </h3>
                                <p className="text-xs text-[#932c2e] font-medium mt-1">There are {pendingIAReplans.length} incomplete orders from DAILY PROBLEM waiting to be addressed.</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 w-full md:w-auto">
                            {pendingIAReplans.map(rp => (
                                <div key={rp.id} className="bg-white px-4 py-2 border border-rose-100 rounded-xl flex items-center justify-between gap-6 shadow-sm">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-[#7a8b95] font-bold uppercase tracking-widest">{rp.refPrb}</span>
                                        <span className="font-bold text-sm text-[#212c46]">{rp.product} <span className="text-[#932c2e]">(-{rp.lossKg} Kg)</span></span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleCloseIncomplete(rp)} className="bg-white border text-[#932c2e] border-rose-200 hover:bg-rose-50 rounded-lg text-[10px] uppercase font-black tracking-widest px-4 py-2 transition-colors h-auto shadow-sm">Force Close</button>
                                        <button onClick={() => handleApproveReplan(rp)} className="bg-[#212c46] hover:bg-[#414757] text-white rounded-lg text-[10px] uppercase font-black tracking-widest px-4 py-2 transition-colors h-auto shadow-md">Rework/Reproduce</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* KPI STATS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 shrink-0">
                    <KpiCard title="Total FG Required" val={totalSummary.fg.toLocaleString()} unit="Kg" color={THEME.primary} icon="package-check" desc="Output" />
                    <KpiCard title="Flagship AFM" val={(50000).toLocaleString()} unit="Kg" color={THEME.accent} icon="award" desc="Target 50T" />
                    <KpiCard title="SFG Buffer" val={totalSummary.sfg.toLocaleString()} unit="Kg" color={THEME.warning} icon="layers" desc="WIP" />
                    <KpiCard title="Daily Batter" val={(Math.ceil(totalSummary.batter)).toLocaleString()} unit="Kg" color={THEME.success} icon="chef-hat" desc="Mixing" />
                </div>

                <div className="bg-white border-[#eaeaec] flex flex-col flex-1 shadow-lg rounded-xl border mb-4 p-5 shrink-0">
                     <div className="flex items-center justify-between mb-4">
                         <h3 className="text-sm font-black text-[#212c46] uppercase tracking-widest flex items-center gap-2">
                              <Icons.Activity size={16} className="text-[#4d87a8]" /> Machine Load Allocation
                         </h3>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                        {MACHINE_CAPACITIES.map(mc => (
                            <MachineCapacityBar key={mc.id} {...mc} />
                        ))}
                     </div>
                </div>

                         {/* TOOLBAR */}
                        <div className="px-4 py-4 border-b border-[#eaeaec] flex flex-col md:flex-row justify-between items-center bg-white shrink-0 gap-4">
                             <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="relative group min-w-[200px]">
                                    <div 
                                        className="w-full pl-4 pr-10 py-2.5 bg-[#f8f9fa] border border-[#eaeaec] rounded-xl text-[12px] font-black text-[#212c46] uppercase tracking-widest cursor-pointer shadow-sm flex items-center justify-between"
                                        onClick={() => setIsTabDropdownOpen(!isTabDropdownOpen)}
                                    >
                                        <span>{activeMainTab}</span>
                                        <Icons.ChevronDown size={16} className={`text-[#7a8b95] transition-transform ${isTabDropdownOpen ? 'rotate-180' : ''}`} />
                                    </div>
                                    {isTabDropdownOpen && (
                                        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-[#eaeaec] rounded-xl shadow-lg z-50 py-2">
                                            {['Entry', 'Queue', 'Mixing', 'Packing'].map(tab => {
                                                const count = orders.filter(o => tab === 'Entry' ? ['DRAFT', 'APPROVED', 'PLANNED'].includes(o.status) && o.currentStep === 'Entry' : o.currentStep === tab).length;
                                                return (
                                                    <div 
                                                        key={tab} 
                                                        className={`px-4 py-2 text-[12px] font-black uppercase tracking-widest cursor-pointer flex justify-between items-center hover:bg-slate-50 transition-colors ${activeMainTab === tab ? 'text-[#4d87a8] bg-[#f8f9fa]' : 'text-[#212c46]'}`}
                                                        onClick={() => { setActiveMainTab(tab); setIsTabDropdownOpen(false); }}
                                                    >
                                                        <span>{tab}</span>
                                                        <span className="bg-[#eaeaec] text-[#7a8b95] px-2 py-0.5 rounded-full text-[11px]">{count}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                             </div>

                             <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
                                <div className="flex items-center gap-1.5 bg-[#f8f9fa] border border-[#eaeaec] p-1.5 rounded-xl shadow-sm overflow-x-auto">
                                    {SHIFTS.map(shift => (
                                        <button key={shift.id} onClick={() => setActiveShift(shift.id)} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${activeShift === shift.id ? shift.activeColor : 'bg-transparent text-[#7a8b95] hover:bg-white'}`}><LucideIcon name={shift.icon} size={14} /> <span className="hidden sm:inline">{shift.id}</span></button>
                                    ))}
                                </div>
                                <div className="relative flex-1 min-w-[150px] md:w-48 group">
                                    <Icons.Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a8b95]"/>
                                    <input 
                                        type="text" 
                                        placeholder="Search Order, SKU..." 
                                        className="w-full pl-10 pr-4 py-2 border border-[#eaeaec] rounded-xl text-[12px] font-bold focus:outline-none focus:border-[#4d87a8] bg-[#f8f9fa] focus:bg-white shadow-sm text-[#212c46] h-10 transition-all"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <button onClick={() => setIsUploadModalOpen(true)} className="bg-white border border-[#eaeaec] hover:border-[#4d87a8] hover:text-[#4d87a8] text-[#7a8b95] px-4 py-2 rounded-xl font-bold text-[12px] uppercase tracking-widest flex items-center gap-2 shadow-sm transition-colors md:flex h-10 shrink-0">
                                   <Icons.Upload size={14} /> BULK UPLOAD
                                </button>
                                
                                <CsvExport 
                                    data={filteredOrders} 
                                    filename="production_orders.csv"
                                    label="EXPORT"
                                    className="!h-10 !rounded-xl !bg-white !text-[#7a8b95] !border !border-[#eaeaec] hover:!border-[#4d87a8] hover:!text-[#4d87a8] !shadow-sm !font-bold !text-[12px]" 
                                />

                                <button onClick={handleAIGenerate} className="bg-gradient-to-r from-[#4d87a8] to-[#3f809e] hover:from-[#3f809e] hover:to-[#2b5a7a] text-white px-5 py-2 rounded-xl font-black text-[12px] uppercase tracking-widest shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap shrink-0 h-10 border border-[#3f809e]">
                                    <Icons.Sparkles size={14} /> AI GENERATE
                                </button>

                                <button onClick={() => setIsAddModalOpen(true)} className="bg-[#212c46] hover:bg-[#414757] text-white px-5 py-2 rounded-xl font-black text-[12px] uppercase tracking-widest shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap shrink-0 h-10 border border-[#212c46]">
                                    <Icons.Plus size={14} /> MANUAL ENTRY
                                </button>
                            </div>
                        </div>

                        {/* TABLE */}
                        <div className="flex-1 overflow-auto custom-scrollbar bg-slate-50/50">
                            <table className="w-full text-left min-w-[1100px] border-collapse bg-white table-font">
                                <thead className={`sys-table-header sticky top-0 z-10 font-bold uppercase tracking-widest ${activeShift !== 'All Day' ? (SHIFTS.find(s => s.id === activeShift)?.activeColor.split(' ')[0] + ' text-white') : 'bg-[#f8f9fa] text-[#7a8b95]'} border-b border-[#eaeaec]`}>
                                    <tr>
                                        <th className="pl-8 w-[12%] align-middle font-black shadow-sm whitespace-nowrap ">Plan ID / Ref PL</th>
                                        <th className="text-center w-[12%] align-middle font-black shadow-sm whitespace-nowrap ">Shift</th>
                                        <th className="text-center w-[12%] align-middle font-black shadow-sm whitespace-nowrap ">Plan Health</th>
                                        <th className="w-auto align-middle font-black shadow-sm whitespace-nowrap ">Product</th>
                                        <th className="text-center w-[12%] align-middle font-black shadow-sm whitespace-nowrap ">Order Qty</th>
                                        <th className="text-center w-[12%] align-middle font-black shadow-sm whitespace-nowrap ">Weight (Kg)</th>
                                        <th className="text-center w-[10%] align-middle font-black shadow-sm whitespace-nowrap ">Deadline</th>
                                        <th className="text-center w-[10%] align-middle font-black shadow-sm whitespace-nowrap ">Status</th>
                                        <th className="text-right w-32 align-middle font-black shadow-sm pr-8 whitespace-nowrap ">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.map(o => {
                                        const alarm = getAlarmStatus(o.deadline, o.status);
                                        return (
                                            <tr key={o.id} className="hover:bg-slate-50 transition-colors group border-b border-[#eaeaec]">
                                                <td className="px-4 pl-8 align-middle py-2.5">
                                                    <div className="flex flex-col items-start gap-1 mt-0.5">
                                                        <span className="font-black text-[#212c46] text-[12px] font-mono tracking-tight leading-none">{o.id}</span>
                                                        <span className="text-[9px] text-[#7a8b95] font-black uppercase tracking-widest leading-none">{(o as any).refPL || `PL-2605-${String(Math.floor(Math.random()*1000)).padStart(4, '0')}`}</span>
                                                        {o.isReplacement && <span className="text-[9px] bg-rose-50 text-[#932c2e] px-1.5 py-0.5 rounded-md uppercase font-black tracking-widest border border-rose-200 leading-none">Replacement</span>}
                                                    </div>
                                                </td>
                                                <td className="px-4 align-middle text-center py-2.5">
                                                    <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded-md border text-white ${SHIFTS.find(s => s.id === o.shift)?.activeColor.split(' ')[0] || 'bg-gray-400'} shadow-sm`}>{o.shift}</span>
                                                </td>
                                                <td className="px-4 align-middle text-center py-2.5">
                                                    <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border shadow-sm transition-all ${alarm.color} ${alarm.blink ? 'opacity-80' : ''}`}>{alarm.label}</span>
                                                </td>
                                                <td className="px-4 align-middle py-2.5">
                                                    <div className="font-black text-[#414757] text-[12px] leading-tight max-w-[200px] truncate" title={o.name}>{o.name}</div>
                                                    <div className="text-[10px] text-[#4d87a8] font-mono font-bold mt-1 uppercase tracking-widest">{o.sku}</div>
                                                </td>
                                                <td className="px-4 align-middle text-center font-mono font-black text-[#212c46] text-[12px] py-2.5">
                                                    {o.qty.toLocaleString()} <span className="text-[9px] font-normal text-[#7a8b95] ml-0.5">Pks</span>
                                                </td>
                                                <td className="px-4 align-middle text-center font-mono text-[#414757] font-black text-[12px] py-2.5">
                                                    {o.fgKg.toLocaleString()} <span className="text-[9px] font-normal text-[#7a8b95] ml-0.5">Kg</span>
                                                </td>
                                                <td className="px-4 align-middle text-center font-mono font-black text-[#932c2e] text-[12px] py-2.5">
                                                    {o.deadline}
                                                </td>
                                                <td className="px-4 align-middle text-center py-2.5">
                                                    <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border shadow-sm ${o.status === 'PLANNED' || o.status === 'IN PROGRESS' ? 'bg-[#2e7d32]/10 text-[#2e7d32] border-[#2e7d32]/20' : 'bg-[#f8f9fa] text-[#7a8b95] border-[#eaeaec]'}`}>{o.status}</span>
                                                </td>
                                                <td className="px-4 text-right pr-8 align-middle py-2.5">
                                                    <div className="flex items-center justify-end gap-[1px] transition-opacity">
                                                        <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#eaeaec] text-[#4d87a8] hover:border-[#212c46] hover:text-[#a94228] hover:bg-[#212c46]/5 transition-all shadow-sm bg-white active:scale-90" title="Edit"><Icons.Pencil size={16} /></button>
                                                        <button onClick={() => handleDelete(o.id)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#eaeaec] text-[#932c2e] hover:border-[#932c2e] hover:bg-[#932c2e]/10 transition-all shadow-sm bg-white active:scale-90" title="Delete"><Icons.Trash2 size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {currentItems.length === 0 && (
                                        <tr>
                                            <td className="text-center py-2.5 px-4">
                                                <div className="flex flex-col items-center justify-center gap-[1px]">
                                                    <div className="w-12 h-12 bg-[#f8f9fa] border border-[#eaeaec] rounded-full flex items-center justify-center text-[#7a8b95] mb-2">
                                                        <Icons.SearchX size={24} />
                                                    </div>
                                                    <p className="text-[12px] font-bold text-[#7a8b95] uppercase tracking-widest">No Orders Found</p>
                                                    <button 
                                                        onClick={() => { setSearchTerm(''); setActiveShift('All Day'); }}
                                                        className="text-[10px] font-black uppercase tracking-widest text-[#4d87a8] mt-2 underline"
                                                    >
                                                        Clear Filters
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="p-4 border-t border-[#eaeaec] flex justify-between items-center bg-white shrink-0">
                            <div className="flex items-center gap-3">
                                <span className="font-mono font-bold text-[10px] text-[#7a8b95] uppercase tracking-widest">SHOW:</span>
                                <select 
                                    className="bg-[#f8f9fa] border border-[#eaeaec] rounded-lg px-3 py-1.5 text-[11px] font-black text-[#212c46] outline-none focus:border-[#4d87a8] cursor-pointer appearance-none text-center min-w-[60px]"
                                    value={itemsPerPage}
                                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                >
                                    <option value={10}>10</option>
                                    <option value={15}>15</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                                <span className="font-mono font-bold text-[10px] text-[#7a8b95] uppercase tracking-widest shrink-0 ml-2">TOTAL {filteredOrders.length} RECORDS</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className={"w-8 h-8 rounded-lg flex items-center justify-center border transition-all " + (currentPage === 1 ? 'bg-[#f8f9fa] border-[#eaeaec] text-[#d7d7d7] cursor-not-allowed' : 'bg-white border-[#eaeaec] text-[#212c46] hover:border-[#4d87a8] hover:text-[#4d87a8] shadow-sm')}
                                >
                                    <Icons.ChevronLeft size={16} />
                                </button>
                                <span className="font-mono font-black text-[11px] text-[#212c46] uppercase tracking-widest min-w-[120px] text-center bg-[#f8f9fa] py-1.5 px-3 rounded-lg border border-[#eaeaec]">
                                    PAGE {currentPage} OF {totalPages || 1}
                                </span>
                                <button 
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className={"w-8 h-8 rounded-lg flex items-center justify-center border transition-all " + (currentPage === totalPages || totalPages === 0 ? 'bg-[#f8f9fa] border-[#eaeaec] text-[#d7d7d7] cursor-not-allowed' : 'bg-white border-[#eaeaec] text-[#212c46] hover:border-[#4d87a8] hover:text-[#4d87a8] shadow-sm')}
                                >
                                    <Icons.ChevronRight size={16} />
                                </button>
                            </div>
                        </div>

            {isAddModalOpen && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#212c46]/60 backdrop-blur-sm p-4 animate-fadeIn font-sans">
                    <StandardModalWrapper className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden relative border border-white/40 max-h-[90vh]">
                        <div className="bg-[#212c46] px-8 py-5 flex justify-between items-center shrink-0 border-b border-[#212c46] border-b-2 border-[#b7a159]">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/20"><Icons.Plus size={20} className="text-[#b7a159]" /></div>
                                <div><h3 className="text-sm font-black text-white uppercase tracking-widest leading-none">Add New Production Order</h3><p className="text-[10px] font-bold text-[#d7d7d7] uppercase tracking-widest mt-1.5">Direct Entry to Queue</p></div>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-white/50 hover:text-[#932c2e] transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full"><Icons.X size={20} /></button>
                        </div>
                        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-8 bg-[#f8f9fa]">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2 md:col-span-1">
                                    <label className="text-[11px] font-black text-[#212c46] uppercase mb-3 block tracking-widest">1. Delivery Deadline <span className="text-[#932c2e]">*</span></label>
                                    <div className="flex gap-2 bg-white p-2 rounded-xl border border-[#eaeaec]">
                                        {['12:00', '16:00', '24:00'].map(t => (
                                            <button key={t} onClick={()=>setNewItem({...newItem, time: t})} className={"flex-1 py-2.5 rounded-lg text-[11px] font-black transition-all font-mono uppercase " + (newItem.time === t ? 'bg-[#212c46] text-white shadow-md' : 'bg-transparent text-[#7a8b95] hover:text-[#212c46] hover:bg-slate-50')}>{t}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="text-[11px] font-black text-[#212c46] uppercase mb-3 block tracking-widest">2. Job Type <span className="text-[#932c2e]">*</span></label>
                                    <div className="flex gap-2 bg-white p-2 rounded-xl border border-[#eaeaec]">
                                        <button onClick={()=>setNewItem({...newItem, jobType: 'Normal'})} className={"flex-1 py-2.5 rounded-lg text-[11px] font-black uppercase transition-all " + (newItem.jobType === 'Normal' ? 'bg-[#212c46] text-white shadow-md' : 'text-[#7a8b95] hover:text-[#212c46] hover:bg-slate-50')}>Normal</button>
                                        <button onClick={()=>setNewItem({...newItem, jobType: 'Replacement'})} className={"flex-1 py-2.5 rounded-lg text-[11px] font-black uppercase transition-all " + (newItem.jobType === 'Replacement' ? 'bg-[#932c2e] text-white shadow-md' : 'text-[#7a8b95] hover:text-[#932c2e] hover:bg-rose-50')}>Replacement</button>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-[#eaeaec] shadow-sm">
                                <label className="text-[11px] font-black text-[#212c46] uppercase mb-4 block tracking-widest">3. Finished Goods (FG) <span className="text-[#932c2e]">*</span></label>
                                <select value={newItem.sku} onChange={e => setNewItem({...newItem, sku: e.target.value})} className="w-full px-4 py-3 border border-[#eaeaec] rounded-xl text-[12px] font-bold focus:outline-none focus:border-[#4d87a8] bg-[#f8f9fa] focus:bg-white shadow-sm text-[#212c46] cursor-pointer">
                                    <option value="" disabled>-- SELECT PRODUCT --</option>
                                    {FG_DATABASE.map(f => <option key={f.sku} value={f.sku}>{f.sku} : {f.name}</option>)}
                                </select>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-[#eaeaec] shadow-sm">
                                <label className="text-[11px] font-black text-[#212c46] uppercase mb-4 block tracking-widest">4. Quantity (Packs) <span className="text-[#932c2e]">*</span></label>
                                <div className="relative">
                                    <input type="number" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: e.target.value})} className="w-full px-4 py-3 border border-[#eaeaec] rounded-xl text-[24px] font-mono font-black focus:outline-none focus:border-[#4d87a8] bg-[#f8f9fa] focus:bg-white shadow-sm text-[#4d87a8] pr-16" placeholder="0" />
                                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[12px] font-black text-[#7a8b95] uppercase tracking-widest font-mono">PCK</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-5 bg-white border-t border-[#eaeaec] flex justify-end gap-3 shrink-0">
                            <button onClick={() => setIsAddModalOpen(false)} className="px-6 py-2.5 bg-white border border-[#eaeaec] text-[#414757] rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-[#d7d7d7]/30 transition-all">Cancel</button>
                            <button onClick={handleAddOrder} className="bg-[#212c46] text-white px-6 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-md hover:bg-[#414757] hover:text-white transition-all flex items-center gap-2"><Icons.PlusCircle size={16} /> Add to Production Queue</button>
                        </div>
                    </StandardModalWrapper>
                </div>
            )}
            
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#212c46]/60 backdrop-blur-sm p-4 animate-fadeIn font-sans">
                    <StandardModalWrapper className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden relative border border-white/40 max-h-[90vh]">
                        <div className="bg-[#212c46] px-8 py-5 flex justify-between items-center shrink-0 border-b-2 border-[#4d87a8]">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/20"><Icons.Upload size={20} className="text-[#4d87a8]" /></div>
                                <div><h3 className="text-sm font-black text-white uppercase tracking-widest leading-none">Bulk Upload Plans</h3><p className="text-[10px] font-bold text-[#d7d7d7] uppercase tracking-widest mt-1.5">Import from CSV / Excel</p></div>
                            </div>
                            <button onClick={() => setIsUploadModalOpen(false)} className="text-white/50 hover:text-[#932c2e] transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full"><Icons.X size={20} /></button>
                        </div>
                        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar bg-[#f8f9fa]">
                            <div className="bg-white p-6 rounded-xl border border-[#eaeaec] shadow-sm">
                                <CsvUpload 
                                    requiredHeaders={['sku', 'name', 'qty', 'deadline', 'shift']}
                                    onUpload={(data) => {
                                        const newBatch = data.map(row => {
                                            const qtyNum = Number(row.qty);
                                            const fg = FG_DATABASE.find(f => f.sku === row.sku) || FG_DATABASE[0];
                                            const fgKg = qtyNum * (fg.weight || 1);
                                            return {
                                                id: `260416-U${String(Math.floor(Math.random()*1000)).padStart(3, '0')}`,
                                                sku: row.sku, name: row.name || fg.name, qty: qtyNum, fgKg, sfgKg: fgKg, batterKg: Number((fgKg * 1.1).toFixed(2)),
                                                deadline: row.deadline, startTime: 'TBD', status: 'DRAFT', isReplacement: false,
                                                shift: row.shift, currentStep: 'Entry'
                                            };
                                        });
                                        setOrders([...newBatch, ...orders]);
                                        alert(`Successfully uploaded ${newBatch.length} orders.`);
                                        setIsUploadModalOpen(false);
                                    }}
                                />
                            </div>
                        </div>
                    </StandardModalWrapper>
                </div>
            )}
        </div>
        </div>
    );
}
