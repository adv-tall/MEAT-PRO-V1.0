import React, { useState, useEffect, useMemo } from 'react';
import * as Icons from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { DraggableModal } from '../../components/shared/DraggableModal';
import KpiCard from '../../components/shared/KpiCard';
import { UserGuidePanel } from '../../components/shared/UserGuidePanel';
import UserGuideButton from '../../components/shared/UserGuideButton';
import Swal from 'sweetalert2';

// --- THEME ---
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

// --- MOCK DATABASE ---
const MOCK_EQUIPMENT = [
    { id: 'EQ-MIX-01', name: 'Vacuum Mixer 500L', type: 'Mixing', step: '1' },
    { id: 'EQ-MIX-02', name: 'Bowl Cutter 200L', type: 'Mixing', step: '1' },
    { id: 'EQ-FRM-01', name: 'Twist Linker A', type: 'Forming', step: '2' },
    { id: 'EQ-FRM-02', name: 'Clipper Direct B', type: 'Forming', step: '2' },
    { id: 'EQ-OVK-01', name: 'Smoke House 6T', type: 'Cooking', step: '3' },
    { id: 'EQ-OVK-02', name: 'Steam Oven 4T', type: 'Cooking', step: '3' },
    { id: 'EQ-PAC-01', name: 'Thermoformer X1', type: 'Packing', step: '7' },
];

const INITIAL_BREAKDOWNS = [
    { id: 'BD-260401', date: '04/04/2026', machineId: 'EQ-MIX-01', machineName: 'Vacuum Mixer 500L', problem: 'Motor Overheating (Temp > 85c)', actionTaken: '', downtimeMinutes: 45, status: 'Open', reportedBy: 'Operator A' },
    { id: 'BD-260402', date: '03/04/2026', machineId: 'EQ-FRM-01', machineName: 'Twist Linker A', problem: 'Casing Jammed / Tearing', actionTaken: 'Replaced linking nozzle and recalibrated speed', downtimeMinutes: 20, status: 'Resolved', reportedBy: 'Tech Lead' },
    { id: 'BD-260403', date: '01/04/2026', machineId: 'EQ-OVK-01', machineName: 'Smoke House 6T', problem: 'Steam Valve Leak', actionTaken: 'Tightened valve and replaced gasket seal', downtimeMinutes: 120, status: 'Resolved', reportedBy: 'Maintenance' },
    { id: 'BD-260329', date: '29/03/2026', machineId: 'EQ-PAC-01', machineName: 'Thermoformer X1', problem: 'Vacuum Pump Failure', actionTaken: 'Swapped backup pump unit', downtimeMinutes: 90, status: 'Resolved', reportedBy: 'Maintenance' },
    { id: 'BD-260328', date: '28/03/2026', machineId: 'EQ-MIX-02', machineName: 'Bowl Cutter 200L', problem: 'Blade sensor error', actionTaken: '', downtimeMinutes: 15, status: 'Open', reportedBy: 'Operator B' },
];

// --- HELPER COMPONENTS ---
const kebabToPascal = (str: string) => str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
const LucideIcon = ({ name, size = 16, className = "", color, style }: any) => {
    if (!name) return <Icons.HelpCircle size={size} className={className} style={style} />;
    const pascalName = kebabToPascal(name);
    const IconComponent = (Icons as any)[pascalName] || (Icons as any)[`${pascalName}Icon`] || Icons.CircleHelp;
    if (!IconComponent) return null;
    return <IconComponent size={size} className={className} style={{...style, color: color}} strokeWidth={2.2} />;
};

// --- MAIN APPLICATION ---
export default function MachineBreakdown() {
    const [activeTab, setActiveTab] = useState('breakdown_list');
    const [breakdowns, setBreakdowns] = useState<any[]>(INITIAL_BREAKDOWNS);
    const [equipment] = useState<any[]>(MOCK_EQUIPMENT);
    const [showGuide, setShowGuide] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [modalStep, setModalStep] = useState(0);

    // Form inputs state
    const [formMachineId, setFormMachineId] = useState('');
    const [formProblem, setFormProblem] = useState('');
    const [formAction, setFormAction] = useState('');
    const [formDowntime, setFormDowntime] = useState(0);
    const [formStatus, setFormStatus] = useState('Open');
    const [formReportedBy, setFormReportedBy] = useState('Operator A');

    const filteredData = useMemo(() => {
        return breakdowns.filter(item => {
            const matchSearch = item.machineName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                item.problem.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                item.reportedBy.toLowerCase().includes(searchTerm.toLowerCase());
            return matchSearch;
        });
    }, [searchTerm, breakdowns]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const paginatedData = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    useEffect(() => { setCurrentPage(1); }, [searchTerm]);

    const handleOpenModal = (item: any = null) => {
        setModalStep(0);
        if (item && item.id) {
            setEditingItem(item);
            setFormMachineId(item.machineId);
            setFormProblem(item.problem);
            setFormAction(item.actionTaken);
            setFormDowntime(item.downtimeMinutes);
            setFormStatus(item.status);
            setFormReportedBy(item.reportedBy);
        } else {
            setEditingItem(null);
            setFormMachineId('');
            setFormProblem('');
            setFormAction('');
            setFormDowntime(0);
            setFormStatus('Open');
            setFormReportedBy('Current Operator');
        }
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!formMachineId) {
            Swal.fire({
                icon: 'warning',
                title: 'โปรดเลือกเครื่องจักร',
                text: 'กรุณาระบุสายการผลิตหรือเครื่องจักรที่ได้รับผลกระทบ',
                confirmButtonColor: THEME.primary
            });
            return;
        }
        if (!formProblem) {
            Swal.fire({
                icon: 'warning',
                title: 'โปรดระบุปัญหา',
                text: 'กรุณากรอกอาการขัดข้องเพื่อใช้วิเคราะห์ประเมินผล',
                confirmButtonColor: THEME.primary
            });
            return;
        }

        const selectedMachine = equipment.find(e => e.id === formMachineId);
        const machineName = selectedMachine ? selectedMachine.name : formMachineId;

        const newItem = {
            id: editingItem ? editingItem.id : `BD-${Date.now().toString().slice(-6)}`,
            date: editingItem ? editingItem.date : new Date().toLocaleDateString('en-GB'),
            machineId: formMachineId,
            machineName,
            problem: formProblem,
            actionTaken: formAction,
            downtimeMinutes: formDowntime,
            status: formStatus,
            reportedBy: formReportedBy
        };

        if (editingItem) {
            setBreakdowns(prev => prev.map(b => b.id === newItem.id ? newItem : b));
        } else {
            setBreakdowns(prev => [newItem, ...prev]);
        }

        setIsModalOpen(false);
        Swal.fire({ 
          icon: 'success', 
          title: editingItem ? 'อัปเดตข้อมูลสำเร็จ' : 'บันทึกแจ้งซ่อมสำเร็จ', 
          showConfirmButton: false, 
          timer: 1200,
          toast: true,
          position: 'top-end'
        });
    };

    const handleDelete = (id: string) => {
        Swal.fire({ 
            title: 'ยืนยันการลบรายการ?', 
            text: `ต้องการลบรหัสประวัติแจ้งซ่อม ${id} ออกจากระบบถาวรหรือไม่?`, 
            icon: 'warning', 
            showCancelButton: true, 
            confirmButtonColor: THEME.danger, 
            cancelButtonColor: THEME.dustyBlue,
            confirmButtonText: 'ใช่, ฉันต้องการลบ',
            cancelButtonText: 'ยกเลิก'
        }).then((result: any) => { 
            if (result.isConfirmed) { 
                setBreakdowns(prev => prev.filter(item => item.id !== id)); 
                Swal.fire({
                    icon: 'success', 
                    title: 'ลบล็อกสำเร็จแล้ว', 
                    timer: 1000, 
                    showConfirmButton: false,
                    toast: true,
                    position: 'top-end'
                }); 
            } 
        });
    };

    const totalDowntime = breakdowns.reduce((sum, b) => sum + b.downtimeMinutes, 0);
    const openIssues = breakdowns.filter(b => b.status === 'Open').length;
    const resolvedIssues = breakdowns.filter(b => b.status === 'Resolved').length;

    // OEE Metrics & Availability Calculation
    const totalAvailableTime = equipment.length * 8 * 60; // total production block
    const availability = totalAvailableTime > 0 ? ((totalAvailableTime - totalDowntime) / totalAvailableTime) * 100 : 100;

    return (
        <div className="flex flex-1 w-full flex-col animate-fadeIn bg-transparent space-y-4 relative font-sans">
            <UserGuideButton onClick={() => setShowGuide(true)} />
            
            {/* RICH USER GUIDE PANEL (UserPermissions Detailed Style) */}
            <UserGuidePanel
                isOpen={showGuide}
                onClose={() => setShowGuide(false)}
                title="MACHINE BREAKDOWN GUIDE"
                subtitle="MAINTENANCE & DOWNTIME MANUAL"
            >
                <div className="space-y-8 font-sans">
                    <div>
                        <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                            <Icons.Wrench size={16} className="text-[#3f809e]" /> 1. ภาพรวมระบบแจ้งซ่อมเครื่องจักร
                        </h3>
                        <p className="mb-4 text-[#414757]">
                            ระบบนี้ใช้สำหรับบันทึกประวัติการเสียและติดตามสถานะการซ่อมของเครื่องจักร (Breakdown Logs) เพื่อนำข้อมูลเวลา <strong>Downtime</strong> ไปเชื่อมโยงกับระบบคำนวณ OEE อัตโนมัติ:
                        </p>
                        <div className="p-4 bg-[#fdf2f2] border border-[#f5c6cb] rounded-xl text-[#414757] text-[12px]">
                            <strong>สำคัญ:</strong> การปล่อยให้สถานะค้างอยู่ที่ Pending นานเกินไปโดยไม่เข้าตรวจสอบ จะทำให้เวลา Downtime ในระบบบานปลาย และดึงค่าประสิทธิภาพ (OEE) ของกะนั้นลงอย่างหนัก
                        </div>
                    </div>

                    <div className="h-px bg-[#eaeaec] w-full" />

                    <div>
                        <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                            <Icons.Activity size={16} className="text-[#b58c4f]" /> 2. การระบุสถานะงานซ่อม (MAINTENANCE STATUS)
                        </h3>
                        <div className="space-y-3 relative pb-2 border-l-2 border-[#eaeaec] ml-2 pl-4">
                            <div className="relative">
                                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-[#a94228] border-2 border-white"></div>
                                <strong className="text-[#a94228] block text-[12px]">PENDING (รอดำเนินการ):</strong>
                                <p className="text-[#7a8b95] text-[11px] mt-0.5">เปิดแจ้งซ่อมแล้ว แต่ช่างยังไม่เข้าหน้างาน เครื่องจักรยังถือว่าสูญเสียเวลาเดินเครื่อง</p>
                            </div>
                            <div className="relative mt-4">
                                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-[#b58c4f] border-2 border-white"></div>
                                <strong className="text-[#b58c4f] block text-[12px]">IN PROGRESS (กำลังซ่อม):</strong>
                                <p className="text-[#7a8b95] text-[11px] mt-0.5">ช่างกำลังปฏิบัติงานซ่อม เปลี่ยนอะไหล่ หรือตั้งค่าระบบใหม่</p>
                            </div>
                            <div className="relative mt-4">
                                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-[#688a58] border-2 border-white"></div>
                                <strong className="text-[#688a58] block text-[12px]">RESOLVED (แก้ไขเสร็จสิ้น):</strong>
                                <p className="text-[#7a8b95] text-[11px] mt-0.5">ส่งมอบเครื่องคืนฝ่ายผลิต ระบบนับเวลา Downtime สิ้นสุดทันที</p>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-[#eaeaec] w-full" />

                    <div>
                        <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                            <Icons.PlusCircle size={16} className="text-[#688a58]" /> 3. ขั้นตอนการเปิดตั๋วแจ้งซ่อม (HOW TO LOG)
                        </h3>
                        <ul className="list-decimal pl-5 space-y-2 text-[#414757] text-[12px]">
                            <li>กดปุ่ม <strong>[ + NEW BREAKDOWN REPORT ]</strong> ที่มุมขวาบน</li>
                            <li><strong>STEP 1:</strong> เลือกเครื่องจักรที่เกิดปัญหา พร้อมระบุผู้พบเห็นหรือหัวหน้ากะ</li>
                            <li><strong>STEP 2:</strong> อธิบายอาการเสียให้ชัดเจน (เช่น มอเตอร์ไหม้, สายพานขาด, เซ็นเซอร์ไม่ทำงาน)</li>
                            <li><strong>STEP 3:</strong> เลือกระดับความรุนแรงและป้อนนาทีที่สูญเสียไป (หากทราบ) จากนั้นกดบันทึก</li>
                        </ul>
                    </div>
                </div>
            </UserGuidePanel>

            {/* UNIFIED MES COHERENT HEADER */}
            <div className="h-14 px-4 sm:px-8 flex flex-row items-center justify-between gap-4 z-20 shrink-0">
                <div className="flex items-center gap-5">
                    <div className="relative flex items-center justify-center group cursor-default shrink-0">
                        <div className="absolute inset-0 bg-[#3f809e] blur-[15px] opacity-20 rounded-full group-hover:opacity-60 transition-all duration-700"></div>
                        <div className="relative z-10 p-1.5 border border-[#3f809e]/40 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm">
                            <Icons.Wrench size={28} strokeWidth={2.5} className="text-[#3f809e]" />
                        </div>
                    </div>
                    <div>
                        <h3 className="font-black text-[#212c46] uppercase tracking-tighter leading-none font-exception-header" style={{ fontSize: '24px' }}>
                            MACHINE <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3f809e] to-[#b58c4f]">BREAKDOWN</span> REGISTER
                        </h3>
                        <p className="text-[11px] font-bold text-[#7a8b95] uppercase tracking-[0.2em] mt-0.5 opacity-80 leading-none">
                            MAINTENANCE CAPABILITY & OEE PERFORMANCE REGISTER
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 shrink-0">
                    <div className="flex gap-1.5 bg-white/50 p-1.5 rounded-xl border border-[#eaeaec] shadow-inner">
                        <button onClick={() => setActiveTab('breakdown_list')} className={`px-5 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'breakdown_list' ? 'bg-[#212c46] text-[#d7d7d7] shadow-md' : 'text-[#7a8b95] hover:text-[#a94228]'}`}>
                            <Icons.List size={14} /> Breakdown Logs
                        </button>
                        <button onClick={() => setActiveTab('oee')} className={`px-5 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'oee' ? 'bg-[#212c46] text-[#d7d7d7] shadow-md' : 'text-[#7a8b95] hover:text-[#a94228]'}`}>
                            <Icons.Activity size={14} /> OEE Metrics
                        </button>
                        <button onClick={() => setActiveTab('dashboard')} className={`px-5 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-[#212c46] text-[#d7d7d7] shadow-md' : 'text-[#7a8b95] hover:text-[#a94228]'}`}>
                            <Icons.PieChart size={14} /> Dashboard Analytics
                        </button>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT AREA - Standardized like UserPermissions */}
            <div className="mx-auto px-4 sm:px-8 w-full mt-[2px] transition-all">
                
                {/* SYSTEM STATS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 shrink-0">
                    <KpiCard label="Total Downtime" value={`${totalDowntime} Min`} icon="clock" colorAccent={THEME.accent} colorValue={THEME.accent} desc="Across all machines" />
                    <KpiCard label="Open Tickets" value={openIssues} icon="alert-triangle" colorAccent={THEME.gold} colorValue={THEME.gold} desc="Awaiting Maintenance" />
                    <KpiCard label="Resolved Actions" value={resolvedIssues} icon="check-circle" colorAccent={THEME.success} colorValue={THEME.success} desc="Operationalized Units" />
                    <KpiCard label="Avg Availability" value={`${availability.toFixed(1)} %`} icon="activity" colorAccent={THEME.skyBlue} colorValue={THEME.skyBlue} desc="Estimated Total OEE" />
                </div>

                {activeTab === 'breakdown_list' && (
                    <div className="bg-white rounded-xl shadow-lg border border-[#eaeaec] overflow-hidden flex flex-col animate-fadeIn">
                        
                        {/* TOOLBAR */}
                        <div className="p-6 flex flex-row justify-between items-center bg-[#f8f9fa] border-b border-[#eaeaec] shrink-0 gap-4">
                            <div className="flex items-center gap-3 text-sm font-black text-[#212c46] uppercase tracking-widest">
                                <Icons.Layers size={20} className="text-[#b7a159]" /> Machine Breakdown History
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto justify-end">
                                <div className="relative w-64">
                                    <Icons.Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                                    <input type="text" placeholder="ค้นหา รหัสบอร์ด / ข้อมูล..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-lg pl-10 pr-4 py-2 text-[12px] font-bold text-[#212c46] outline-none focus:border-[#b7a159] shadow-inner" />
                                </div>
                                <button onClick={() => handleOpenModal()} className="bg-[#212c46] text-white px-5 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-md hover:bg-[#3f809e] transition-all flex items-center gap-2 border border-[#212c46]">
                                    <Icons.Plus size={14} /> Report Issue (แจ้งซ่อม)
                                </button>
                            </div>
                        </div>

                        {/* DATA GRID */}
                        <div className="overflow-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse table-font">
                                <thead className="sys-table-header [#b7a159] ">
                    <tr>
                                        <th className="font-black uppercase tracking-widest whitespace-nowrap pl-8  w-[14%]">Report Info</th>
                                        <th className="font-black uppercase tracking-widest whitespace-nowrap  w-[22%]">Machine Name</th>
                                        <th className="font-black uppercase tracking-widest whitespace-nowrap  w-[26%]">Problem details</th>
                                        <th className="font-black uppercase tracking-widest whitespace-nowrap  w-[20%]">Solutions log</th>
                                        <th className="font-black uppercase tracking-widest text-center whitespace-nowrap  w-[10%]">Downtime</th>
                                        <th className="font-black uppercase tracking-widest text-center whitespace-nowrap  w-[10%]">State</th>
                                        <th className="font-black uppercase tracking-widest text-center whitespace-nowrap pr-8  w-[8%]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-[#eaeaec]">
                                    {paginatedData.map(item => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 font-sans">
                                            <td className="px-4 pl-8 py-2.5">
                                                <div className="flex flex-col">
                                                    <span className="font-mono font-black text-[#a94228] text-[12.5px] leading-none">{item.id}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono font-bold mt-1.5">{item.date}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <div className="font-extrabold text-[#212c46] text-[12.5px] uppercase tracking-tight">{item.machineName}</div>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mt-0.5">Machine Node ID: {item.machineId}</span>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <p className="font-semibold text-slate-700 text-[12px] leading-relaxed break-words max-w-[280px]" title={item.problem}>{item.problem}</p>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 block">Reported By: {item.reportedBy}</span>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                {item.actionTaken ? (
                                                    <p className="font-medium text-slate-500 text-[11.5px] leading-relaxed break-words max-w-[220px]" title={item.actionTaken}>{item.actionTaken}</p>
                                                ) : (
                                                    <span className="text-slate-300 italic font-mono text-[11px]">Pending maintenance work...</span>
                                                )}
                                            </td>
                                            <td className="px-4 text-center py-2.5">
                                                <div className="flex items-baseline justify-center gap-[1px]">
                                                    <span className="font-mono font-black text-[#a94228] text-[13px]">{item.downtimeMinutes}</span>
                                                    <span className="text-[9.5px] text-slate-400 font-black uppercase">Min</span>
                                                </div>
                                            </td>
                                            <td className="px-4 text-center py-2.5">
                                                <span className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest border shadow-inner ${
                                                    item.status === 'Resolved' ? 'bg-[#657f4d]/10 text-[#657f4d] border-[#657f4d]/30' :
                                                    'bg-[#E3624A]/10 text-[#E3624A] border-[#E3624A]/30 animate-pulse'
                                                }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-4 pr-8 text-center py-2.5">
                                                <div className="flex items-center justify-center gap-[1px]">
                                                    <button onClick={() => handleOpenModal(item)} className="p-1.5 hover:bg-slate-50 border border-transparent hover:border-[#eaeaec] rounded-lg transition-all text-[#212c46]" title="แก้ไขข้อมูล">
                                                        <Icons.Pencil size={15} />
                                                    </button>
                                                    <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-all text-[#932c2e]" title="ลบล็อกแจ้งความ">
                                                        <Icons.Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {paginatedData.length === 0 && (
                                        <tr>
                                            <td className="text-center text-slate-400 font-black uppercase tracking-widest text-xs opacity-70 py-2.5 px-4">
                                                No breakdown records found matches filtering
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* PAGINATION */}
                        <div className="sys-pagination-container shrink-0 bg-white border-t border-[#eaeaec] p-4 flex flex-col sm:flex-row justify-between items-center">
                            <div className="flex items-center gap-3">
                                <span className="sys-pagination-text text-slate-400 font-bold text-[10px]">ROWS:</span>
                                <select 
                                    value={itemsPerPage} 
                                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} 
                                    className="sys-pagination-select border border-slate-200 rounded px-2 py-1 text-[11px] font-bold text-slate-600 focus:outline-none"
                                >
                                    {[5, 10, 20, 50].map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Total {filteredData.length} records found</span>
                            </div>
                            <div className="flex items-center gap-4 mt-3 sm:mt-0 font-bold text-[11px]">
                                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="sys-pagination-btn disabled:opacity-30"><Icons.ChevronLeft size={16}/></button>
                                <div className="sys-pagination-text bg-slate-50 border border-slate-200 px-5 py-1.5 rounded-lg text-slate-500 font-mono font-black uppercase max-h-8 flex items-center">PAGE {currentPage} OF {totalPages || 1}</div>
                                <button onClick={() => setCurrentPage(prev => Math.max(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="sys-pagination-btn disabled:opacity-30"><Icons.ChevronRight size={16}/></button>
                            </div>
                        </div>

                    </div>
                )}

                {activeTab === 'oee' && (
                    <div className="flex flex-col gap-6 animate-fadeIn">
                        
                        {/* Overall Equipment Effectiveness Dashboard */}
                        <div className="bg-white rounded-xl p-8 border border-[#eaeaec] shadow-lg shrink-0">
                            <h3 className="font-black text-[#212c46] flex items-center gap-2.5 uppercase tracking-widest mb-8 text-sm border-b-2 border-[#b7a159]/20 pb-4">
                                <Icons.Activity size={20} className="text-[#a94228]" /> Overall Equipment Effectiveness (OEE) KPI Analysis
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                
                                {/* Overall OEE */}
                                <div className="flex flex-col items-center justify-center p-8 bg-[#212c46]/5 rounded-xl border border-[#212c46]/10 shadow-inner">
                                    <h4 className="text-[11px] font-black text-[#212c46] uppercase tracking-widest mb-6">Overall OEE Rate</h4>
                                    <div className="relative w-44 h-44 flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90 drop-shadow-md" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="8.5" />
                                            <circle cx="50" cy="50" r="40" fill="transparent" stroke={THEME.primary} strokeWidth="8.5" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * 78) / 100} strokeLinecap="round" className="transition-all duration-1000" />
                                        </svg>
                                        <div className="absolute flex flex-col items-center justify-center">
                                            <span className="text-4xl font-black text-[#212c46] font-mono leading-none">78<span className="text-xl text-slate-400">%</span></span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-6 text-center font-black uppercase tracking-widest bg-white px-4 py-1.5 rounded-lg border border-[#eaeaec] shadow-sm">Target World Class OEE: 85%</p>
                                </div>

                                {/* Availability */}
                                <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl border border-[#eaeaec] shadow-sm">
                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Line Availability</h4>
                                    <div className="relative w-44 h-44 flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90 drop-shadow-md" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="8.5" />
                                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#3f809e" strokeWidth="8.5" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * availability) / 100} strokeLinecap="round" className="transition-all duration-1000" />
                                        </svg>
                                        <div className="absolute flex flex-col items-center justify-center">
                                            <span className="text-4xl font-black text-[#3f809e] font-mono leading-none">{availability.toFixed(1)}<span className="text-xl text-slate-400">%</span></span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-6 text-center font-extrabold uppercase tracking-widest">Performance uptime</p>
                                </div>

                                {/* Quality */}
                                <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl border border-[#eaeaec] shadow-sm">
                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Quality standard</h4>
                                    <div className="relative w-44 h-44 flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90 drop-shadow-md" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="8.5" />
                                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#657f4d" strokeWidth="8.5" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * 98.5) / 100} strokeLinecap="round" className="transition-all duration-1000" />
                                        </svg>
                                        <div className="absolute flex flex-col items-center justify-center">
                                            <span className="text-4xl font-black text-[#657f4d] font-mono leading-none">98.5<span className="text-xl text-slate-400">%</span></span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-6 text-center font-extrabold uppercase tracking-widest">Good piece multiplier</p>
                                </div>

                            </div>
                        </div>

                        {/* TREND ANALYSIS CHART */}
                        <div className="bg-white rounded-xl p-8 border border-[#eaeaec] shadow-lg flex-1">
                            <h3 className="font-black text-[#212c46] flex items-center gap-2.5 uppercase tracking-widest mb-6 text-sm border-b-2 border-[#b7a159]/20 pb-4">
                                <Icons.TrendingUp size={20} className="text-[#a94228]" /> Combined Production OEE Trend (Last 7 Days)
                            </h3>
                            <div className="h-72 w-full select-none">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={[
                                        { name: 'Monday', oee: 75, target: 85 }, { name: 'Tuesday', oee: 78, target: 85 },
                                        { name: 'Wednesday', oee: 82, target: 85 }, { name: 'Thursday', oee: 76, target: 85 },
                                        { name: 'Friday', oee: 79, target: 85 }, { name: 'Saturday', oee: 84, target: 85 },
                                        { name: 'Sunday', oee: 78, target: 85 }
                                    ]}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'JetBrains Mono', fontWeight: 'bold' }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'JetBrains Mono', fontWeight: 'bold' }} domain={[60, 100]} />
                                        <Tooltip contentStyle={{ borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)' }} />
                                        <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '20px', fontWeight: 'bold', color: '#111f42' }} />
                                        <Line type="monotone" dataKey="oee" name="Actual KPI Value %" stroke={THEME.primary} strokeWidth={3} dot={{ r: 5, strokeWidth: 2, fill: 'white' }} activeDot={{ r: 7, fill: THEME.primary, stroke: 'white' }} />
                                        <Line type="monotone" dataKey="target" name="Benchmark Std target (85%)" stroke="#94a3b8" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                    </div>
                )}

                {activeTab === 'dashboard' && (
                    <div className="flex flex-col gap-6 animate-fadeIn">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            
                            {/* Downtime by Machine */}
                            <div className="bg-white rounded-xl p-8 border border-[#eaeaec] shadow-lg">
                                <h3 className="font-black text-[#212c46] flex items-center gap-2.5 uppercase tracking-widest mb-6 text-sm border-b-2 border-[#b7a159]/20 pb-4">
                                    <Icons.BarChart2 size={20} className="text-[#a94228]" /> Total Accumulated Downtime by Machine
                                </h3>
                                <div className="h-72 w-full select-none">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={
                                            Object.values(breakdowns.reduce((acc, curr) => {
                                                if (!acc[curr.machineName]) acc[curr.machineName] = { name: curr.machineName, downtime: 0 };
                                                acc[curr.machineName].downtime += curr.downtimeMinutes;
                                                return acc;
                                            }, {} as any)).sort((a: any, b: any) => b.downtime - a.downtime).slice(0, 5)
                                        } layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'JetBrains Mono', fontWeight: 'bold' }} />
                                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#111f42', fontWeight: 'black' }} width={120} />
                                            <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)' }} />
                                            <Bar dataKey="downtime" name="Cumulative downtime (Min)" fill={THEME.primary} radius={[0, 4, 4, 0]} barSize={18} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Top Problem Distributions */}
                            <div className="bg-white rounded-xl p-8 border border-[#eaeaec] shadow-lg">
                                <h3 className="font-black text-[#212c46] flex items-center gap-2.5 uppercase tracking-widest mb-6 text-sm border-b-2 border-[#b7a159]/20 pb-4">
                                    <Icons.PieChart size={20} className="text-[#a94228]" /> Critical Problem Occurrences Distribution
                                </h3>
                                <div className="h-72 w-full flex items-center justify-center select-none">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={
                                                    Object.values(breakdowns.reduce((acc, curr) => {
                                                        const prob = curr.problem.substring(0, 24) + (curr.problem.length > 24 ? '...' : '');
                                                        if (!acc[prob]) acc[prob] = { name: prob, value: 0 };
                                                        acc[prob].value += 1;
                                                        return acc;
                                                    }, {} as any)).sort((a: any, b: any) => b.value - a.value).slice(0, 4)
                                                }
                                                cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value"
                                            >
                                                {
                                                    [THEME.primary, THEME.gold, THEME.skyBlue, THEME.success].map((color, index) => (
                                                        <Cell key={`cell-${index}`} fill={color} stroke="none" />
                                                    ))
                                                }
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)' }} />
                                            <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#111f42' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                        </div>
                    </div>
                )}

            </div>

            {/* HIGH-END STEP WIZARD DIALOG (Synced with UserPermissions & Settings modal standard) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#212c46]/60 backdrop-blur-sm p-4 animate-fadeIn font-sans">
                    <DraggableModal 
                        isOpen={isModalOpen} 
                        onClose={() => setIsModalOpen(false)} 
                        width="max-w-[750px]"
                        customHeader={
                            <div className="bg-[#212c46] px-6 py-4 flex justify-between items-center shrink-0 border-b-2 border-[#b7a159] modal-handle cursor-move w-full">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/20 shadow-sm">
                                        <LucideIcon name={editingItem ? "edit-3" : "plus-circle"} size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-[#d7d7d7] uppercase tracking-widest leading-none">{editingItem ? 'Edit Maintenance Record' : 'Create Maintenance Job Notification'}</h3>
                                        <p className="text-[10px] font-bold text-[#b7a159] uppercase tracking-widest mt-1.5">{editingItem ? editingItem.id : 'Report new machine breakdown event'}</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="text-white/50 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-1.5 rounded-lg"><Icons.X size={18} /></button>
                            </div>
                        }
                    >
                        <div className="flex flex-col md:flex-row overflow-hidden bg-[#f8f9fa] h-[480px]">
                            
                            {/* Step Wizard Selection Column (UserPermissions standard) */}
                            <div className="w-full md:w-52 bg-white border-b md:border-b-0 md:border-r border-[#eaeaec] flex flex-row md:flex-col shrink-0">
                                <div className="hidden md:block px-4 py-4 text-[10px] font-black text-[#7a8b95] uppercase tracking-widest border-b border-[#eaeaec] bg-[#f8f9fa]">Setup Nodes</div>
                                {[0, 1, 2].map(step => (
                                    <button key={step} onClick={()=>setModalStep(step)} className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 px-4 py-3 text-left transition-all md:border-l-4 ${modalStep===step ? 'border-b-4 md:border-b-0 border-[#b7a159] bg-[#f8f9fa] text-[#212c46]' : 'border-transparent text-[#7a8b95] hover:bg-[#f8f9fa]/50'}`}>
                                        <LucideIcon name={step===0 ? 'User' : step===1 ? 'AlertTriangle' : 'Clock'} size={15} color={modalStep===step ? THEME.brightGold : undefined} />
                                        <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest">STEP {step+1}: {step===0 ? 'Profile' : step===1 ? 'Issue Logs' : 'Downtime'}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Setup Panel Content */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-white flex flex-col justify-between text-[12px]">
                                <div className="space-y-4">
                                    
                                    {modalStep === 0 && (
                                        <div className="space-y-4 animate-fadeIn">
                                            <h4 className="text-[12px] font-black text-[#212c46] uppercase tracking-wider mb-2 pb-1.5 border-b border-[#eaeaec]">Machine & Reporter Profile</h4>
                                            <div>
                                                <label className="block text-[11px] font-black text-[#7a8b95] uppercase tracking-widest mb-1.5">Machine Target (บาร์โค้ดเครื่องจักร)</label>
                                                <select 
                                                    value={formMachineId} 
                                                    onChange={(e) => setFormMachineId(e.target.value)}
                                                    className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-lg px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none focus:border-[#b7a159] cursor-pointer"
                                                >
                                                    <option value="">-- Select Target Machine --</option>
                                                    {equipment.map(eq => (
                                                        <option key={eq.id} value={eq.id}>{eq.name} ({eq.type})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-black text-[#7a8b95] uppercase tracking-widest mb-1.5">Opened By (ผู้รายงาน)</label>
                                                <input 
                                                    type="text" 
                                                    value={formReportedBy} 
                                                    onChange={e => setFormReportedBy(e.target.value)} 
                                                    className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-lg px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none focus:border-[#b7a159]" 
                                                    placeholder="Operator name / Maintenance staff ID"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {modalStep === 1 && (
                                        <div className="space-y-4 animate-fadeIn">
                                            <h4 className="text-[12px] font-black text-[#212c46] uppercase tracking-wider mb-2 pb-1.5 border-b border-[#eaeaec]">Issue & Solutions Logs</h4>
                                            <div>
                                                <label className="block text-[11px] font-black text-[#7a8b95] uppercase tracking-widest mb-1.5">Problem details (อาการของอุปกรณ์ขัดข้อง)</label>
                                                <textarea 
                                                    value={formProblem} 
                                                    onChange={(e) => setFormProblem(e.target.value)}
                                                    className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-lg px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none focus:border-[#b7a159] min-h-[90px]"
                                                    placeholder="Specify the breakdown root causes (e.g., sensor failure, belt snap)..."
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-black text-[#7a8b95] uppercase tracking-widest mb-1.5">Corrective Action logs (การดำเนินการแก้ไข)</label>
                                                <textarea 
                                                    value={formAction} 
                                                    onChange={(e) => setFormAction(e.target.value)}
                                                    className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-lg px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none focus:border-[#b7a159] min-h-[90px]"
                                                    placeholder="Describe structural fix or replaced spare parts (Leave empty if still in analysis)..."
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {modalStep === 2 && (
                                        <div className="space-y-4 animate-fadeIn">
                                            <h4 className="text-[12px] font-black text-[#212c46] uppercase tracking-wider mb-2 pb-1.5 border-b border-[#eaeaec]">Downtime & State Management</h4>
                                            <div>
                                                <label className="block text-[11px] font-black text-[#7a8b95] uppercase tracking-widest mb-1.5">Machine Downtime (เวลาหยุดเครื่องสะสม)</label>
                                                <div className="relative">
                                                    <input 
                                                        type="number" 
                                                        min="0"
                                                        value={formDowntime} 
                                                        onChange={(e) => setFormDowntime(Number(e.target.value))}
                                                        className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-lg px-4 py-2.5 pr-14 text-[12px] font-mono font-black text-[#a94228] outline-none focus:border-[#b7a159] text-right"
                                                    />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">MINUTES</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-black text-[#7a8b95] uppercase tracking-widest mb-1.5">Notification Status State (สถานะบอร์ดแจ้งแผล)</label>
                                                <select 
                                                    value={formStatus} 
                                                    onChange={(e) => setFormStatus(e.target.value)}
                                                    className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-lg px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none focus:border-[#b7a159] cursor-pointer"
                                                >
                                                    <option value="Open">🔴 Open (กำลังดำเนินการวิเคราะห์)</option>
                                                    <option value="Resolved">🟢 Resolved (ซ่อมบำรุงปิดหน้างานเรียบร้อย)</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                </div>

                                {/* Wizard Controls Footer */}
                                <div className="border-t border-[#eaeaec] pt-4 mt-6 flex justify-between items-center shrink-0">
                                    <button 
                                        type="button"
                                        onClick={() => setModalStep(prev => Math.max(0, prev - 1))}
                                        disabled={modalStep === 0}
                                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg uppercase text-[10px] tracking-wider transition-colors disabled:opacity-30"
                                    >
                                        Previous
                                    </button>
                                    
                                    <div className="flex gap-2">
                                        {modalStep < 2 ? (
                                            <button 
                                                type="button"
                                                onClick={() => setModalStep(prev => prev + 1)}
                                                className="px-5 py-2 bg-[#212c46] hover:bg-[#3f809e] text-white font-bold rounded-lg uppercase text-[10px] tracking-wider transition-colors"
                                            >
                                                Next Step
                                            </button>
                                        ) : (
                                            <button 
                                                type="button"
                                                onClick={handleSave}
                                                className="px-5 py-2 bg-[#657f4d] hover:bg-[#657f4d]/80 text-white font-bold rounded-lg uppercase text-[10px] tracking-wider transition-all shadow-md flex items-center gap-1.5"
                                            >
                                                <Icons.Save size={13}/> Save Changes
                                            </button>
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>
                    </DraggableModal>
                </div>
            )}
        </div>
    );
}
