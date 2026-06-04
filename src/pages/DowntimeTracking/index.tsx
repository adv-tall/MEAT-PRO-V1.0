import React, { useState, useEffect, useMemo } from 'react';
import * as Icons from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { DraggableModal } from '../../components/shared/DraggableModal';
import KpiCard from '../../components/shared/KpiCard';
import { UserGuidePanel } from '../../components/shared/UserGuidePanel';
import UserGuideButton from '../../components/shared/UserGuideButton';
import { useCollection } from '../../services/useFirestore';

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
  { id: 'EQ-MIX-01', name: 'Vacuum Mixer 500L', department: 'Mixing Zone' },
  { id: 'EQ-MIX-02', name: 'Bowl Cutter 200L', department: 'Mixing Zone' },
  { id: 'EQ-FRM-01', name: 'Twist Linker A', department: 'Forming Zone' },
  { id: 'EQ-FRM-02', name: 'Clipper Direct B', department: 'Forming Zone' },
  { id: 'EQ-OVK-01', name: 'Smoke House 6T', department: 'Oven Zone' },
  { id: 'EQ-PAC-01', name: 'Thermoformer X1', department: 'Packing Zone' },
];

const MOCK_CATEGORIES = [
  { id: 'MCH', name: 'Mechanical Breakdown', color: '#932c2e', desc: 'เครื่องจักรชำรุดเชิงกล เช่น มอเตอร์เสียหาย ใบมีดแตก สายพานขาด' },
  { id: 'ELC', name: 'Electrical & Sensor', color: '#a94228', desc: 'ระบบไฟฟ้าและระบบวัดควบคุม เช่น พลแอลซีบอร์ด ระบบจ่ายกระแสขัดข้อง' },
  { id: 'CHO', name: 'Changeover & Setup', color: '#b58c4f', desc: 'การปรับเปลี่ยนพาร์ทหรือทำความสะอาดระหว่างรุ่นสินค้า (Clean-in-place)' },
  { id: 'UTL', name: 'Utilities Failure', color: '#2d2c4a', desc: 'ระบบแรงดันไอน้ำ ลม แอร์ พาวเวอร์ หรือไฟฟ้าหลักขัดข้อง' },
  { id: 'OPR', name: 'Operational Delay', color: '#3f809e', desc: 'การเตรียมและรอวัตถุดิบ ขาดพนักงาน หรือไม่มีน้ำยาทำความสะอาดสำรอง' }
];

const INITIAL_DOWNTIMES = [
  { id: 'DW-260501', date: '2026-05-28', machineId: 'EQ-MIX-01', machineName: 'Vacuum Mixer 500L', categoryId: 'MCH', problem: 'Hydraulic leak detected in bowl hinge', durationMinutes: 45, status: 'Resolved', reportedBy: 'Operator SOMCHAI', supervisorSig: 'SUDA QUALITY' },
  { id: 'DW-260502', date: '2026-05-29', machineId: 'EQ-FRM-01', machineName: 'Twist Linker A', categoryId: 'ELC', problem: 'Encoder error on continuous speed feed', durationMinutes: 25, status: 'Resolved', reportedBy: 'Tech PHICHAMON', supervisorSig: 'SUDA QUALITY' },
  { id: 'DW-260503', date: '2026-05-30', machineId: 'EQ-OVK-01', machineName: 'Smoke House 6T', categoryId: 'UTL', problem: 'Boiler steam pipeline pressure drop', durationMinutes: 120, status: 'Open', reportedBy: 'Tech PHICHAMON', supervisorSig: '' },
  { id: 'DW-260504', date: '2026-05-31', machineId: 'EQ-PAC-01', machineName: 'Thermoformer X1', categoryId: 'CHO', problem: 'Forming tool swap and seal block clean', durationMinutes: 60, status: 'Resolved', reportedBy: 'Operator SOMCHAI', supervisorSig: 'SOMCHAI WORKER' },
  { id: 'DW-260505', date: '2026-06-01', machineId: 'EQ-MIX-02', machineName: 'Bowl Cutter 200L', categoryId: 'OPR', problem: 'Ingredient batch delay from staging area', durationMinutes: 15, status: 'Open', reportedBy: 'Operator SOMCHAI', supervisorSig: '' }
];

// --- HELPER COMPONENTS ---
const kebabToPascal = (str: string) => str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
const LucideIcon = ({ name, size = 16, className = "", color, style, strokeWidth = 2.5 }: any) => {
    if (!name) return null;
    if (typeof name !== 'string') {
        const IconComponent = name;
        return <IconComponent size={size} className={className} style={{...style, color: color}} strokeWidth={strokeWidth} />;
    }
    const pascalName = kebabToPascal(name);
    const IconComponent = (Icons as any)[pascalName] || Icons.CircleHelp;
    if (!IconComponent) return null;
    return <IconComponent size={size} className={className} style={{...style, color: color}} strokeWidth={strokeWidth} />;
};

export default function DowntimeTracking() {
  const [activeTab, setActiveTab] = useState('list_mode'); // list_mode | analytics_mode
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Target Configurations (Synced config matching User Permissions format)
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configStep, setConfigStep] = useState(0);
  
  // Settings values
  const [settings, setSettings] = useState({
    maxAllowedDowntimeMins: 45,
    targetMttrMins: 30,
    targetMtbfHours: 120,
    scheduledMaintenanceMins: 240,
    requireSigForLongEvents: true,
    autoEscalateProductionLead: true,
    enforceLockouts: true,
    restrictGeneralOperators: false,
    alertNotificationLevel: 'High',
    dispatchChannel: 'SMS & Webhook'
  });

  // Action / Incident Modals
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [editingIncident, setEditingIncident] = useState<any>(null);
  const [incidentStep, setIncidentStep] = useState(0);

  // Form Fields for editing/adding incidents
  const [formDate, setFormDate] = useState('2026-06-01');
  const [formMachineId, setFormMachineId] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('MCH');
  const [formProblem, setFormProblem] = useState('');
  const [formDuration, setFormDuration] = useState(15);
  const [formStatus, setFormStatus] = useState('Open');
  const [formReportedBy, setFormReportedBy] = useState('Operator SOMCHAI');
  const [formSupervisorSig, setFormSupervisorSig] = useState('');

  // Firestore & local fallback integration
  const { data: fbDowntimes, add: addDowntime, update: updateDowntime } = useCollection<any>('Machine_Downtime', INITIAL_DOWNTIMES);
  
  const downtimes = fbDowntimes && fbDowntimes.length > 0 ? fbDowntimes : INITIAL_DOWNTIMES;

  const filteredDowntimes = useMemo(() => {
    return downtimes.filter(dw => {
      const q = search.toLowerCase();
      return (
        dw.machineName.toLowerCase().includes(q) ||
        dw.problem.toLowerCase().includes(q) ||
        dw.reportedBy.toLowerCase().includes(q) ||
        dw.id.toLowerCase().includes(q)
      );
    });
  }, [downtimes, search]);

  const currentData = useMemo(() => {
    return filteredDowntimes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredDowntimes, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredDowntimes.length / itemsPerPage) || 1;

  // Calculators & KPIs
  const totalDowntimeMins = useMemo(() => {
    return downtimes.reduce((sum, item) => sum + (Number(item.durationMinutes) || 0), 0);
  }, [downtimes]);

  const activeIncidentsCount = useMemo(() => {
    return downtimes.filter(item => item.status === 'Open').length;
  }, [downtimes]);

  const mttrMins = useMemo(() => {
    const resolvedItems = downtimes.filter(item => item.status === 'Resolved' || item.durationMinutes > 0);
    if (resolvedItems.length === 0) return 0;
    return Math.round(totalDowntimeMins / resolvedItems.length);
  }, [downtimes, totalDowntimeMins]);

  const mtbfHours = useMemo(() => {
    const events = downtimes.length;
    if (events === 0) return settings.targetMtbfHours;
    // Assume 720 operating hours per period divided by fail rate
    return Math.round(720 / events);
  }, [downtimes, settings.targetMtbfHours]);

  // Analytics helper charts data
  const chartDataByCategory = useMemo(() => {
    return MOCK_CATEGORIES.map(cat => {
      const sum = downtimes
        .filter(dw => dw.categoryId === cat.id)
        .reduce((sum, item) => sum + (Number(item.durationMinutes) || 0), 0);
      return {
        name: cat.name,
        minutes: sum,
        color: cat.color
      };
    }).sort((a, b) => b.minutes - a.minutes);
  }, [downtimes]);

  const chartDataByTrend = useMemo(() => {
    const dates = Array.from(new Set(downtimes.map(dw => dw.date))).sort();
    return dates.map(dt => {
      const sum = downtimes
        .filter(dw => dw.date === dt)
        .reduce((sum, item) => sum + (Number(item.durationMinutes) || 0), 0);
      return {
        date: dt,
        Minutes: sum
      };
    });
  }, [downtimes]);

  // Save Config handler
  const handleSaveConfig = () => {
    setShowConfigModal(false);
  };

  // Modify / Save Incident handler
  const handleSaveIncident = async () => {
    const selectedMachine = MOCK_EQUIPMENT.find(m => m.id === formMachineId) || MOCK_EQUIPMENT[0];
    const dataObj = {
      date: formDate,
      machineId: formMachineId || selectedMachine.id,
      machineName: selectedMachine.name,
      categoryId: formCategoryId,
      problem: formProblem || 'Mechanical checkup',
      durationMinutes: Number(formDuration) || 15,
      status: formStatus,
      reportedBy: formReportedBy,
      supervisorSig: formSupervisorSig
    };

    if (editingIncident) {
      await updateDowntime(editingIncident.id, dataObj);
    } else {
      const newId = `DW-${Date.now().toString().slice(-6)}`;
      await addDowntime({ id: newId, ...dataObj });
    }
    setShowIncidentModal(false);
    setEditingIncident(null);
  };

  const openAddModal = () => {
    setEditingIncident(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormMachineId(MOCK_EQUIPMENT[0].id);
    setFormCategoryId('MCH');
    setFormProblem('');
    setFormDuration(30);
    setFormStatus('Open');
    setFormReportedBy('Operator SOMCHAI');
    setFormSupervisorSig('');
    setIncidentStep(0);
    setShowIncidentModal(true);
  };

  const openEditModal = (inc: any) => {
    setEditingIncident(inc);
    setFormDate(inc.date);
    setFormMachineId(inc.machineId);
    setFormCategoryId(inc.categoryId);
    setFormProblem(inc.problem);
    setFormDuration(inc.durationMinutes);
    setFormStatus(inc.status);
    setFormReportedBy(inc.reportedBy);
    setFormSupervisorSig(inc.supervisorSig || '');
    setIncidentStep(0);
    setShowIncidentModal(true);
  };

  return (
    <div className="flex flex-1 w-full flex-col animate-fadeIn bg-transparent space-y-4">
      {/* USER GUIDE FLOATING BUTTON & PANEL */}
      <UserGuideButton onClick={() => setIsGuideOpen(true)} />

      <UserGuidePanel isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} title="DOWNTIME TRACKING GUIDE" subtitle="คู่มือติดตามและลดความสูญเสียจากเครื่องจักรหยุดทำงาน">
        <div className="space-y-8 font-sans">
            <div>
                <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                    <Icons.Clock size={16} className="text-[#3f809e]" /> 1. ภาพรวมการติดตาม Downtime
                </h3>
                <p className="mb-4 text-[#414757]">
                    โมดูลนี้ใช้เพื่อแสดงภาพรวมของเวลาที่เครื่องจักรหยุดทำงานทั้งหมดในกะปัจจุบัน (Accumulated Downtime) เพื่อเฝ้าระวังไม่ให้เกิดการสูญเสียทางการผลิต (Production Deficit) เกินเกณฑ์มาตรฐานที่ยอมรับได้
                </p>
                <div className="p-4 bg-[#f8f9fa] border border-[#eaeaec] flex items-start gap-4 rounded-xl text-[12px]">
                    <div className="bg-[#a94228] text-white p-2 rounded-lg shrink-0"><Icons.ShieldAlert size={16} /></div>
                    <div>
                        <strong className="text-[#212c46]">Downtime KPI Alert</strong>
                        <p className="text-[#7a8b95]">เป้าหมายจำกัดเวลาสูญเสียสูงสุด (Max Downtime Alert Limit) ถูกตั้งไว้ที่ <strong>{settings.maxDowntimeAlertLimit} นาที</strong> หากผลรวมของกะทะลุเกณฑ์นี้ จะต้องให้ผู้บริหารอนุมัติความเสียหาย</p>
                    </div>
                </div>
            </div>

            <div className="h-px bg-[#eaeaec] w-full" />

            <div>
                <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                    <Icons.PieChart size={16} className="text-[#b58c4f]" /> 2. การวิเคราะห์สาเหตุ (ROOT CAUSE ANALYSIS)
                </h3>
                <p className="mb-4 text-[#414757]">
                    ระบบจะทำการแบ่งหมวดหมู่สาเหตุ (Classification) โดยอัตโนมัติ ตามมาตรฐาน TPM (Total Productive Maintenance) ออกเป็น 5 ปัจจัยหลัก:
                </p>
                <div className="space-y-3 relative pb-2 border-l-2 border-[#eaeaec] ml-2 pl-4">
                    <div className="relative">
                        <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-[#a94228] border-2 border-white"></div>
                        <strong className="text-[#a94228] block text-[12px]">Mechanical Breakdown (ขัดข้องด้านโครงสร้าง):</strong>
                        <p className="text-[#7a8b95] text-[11px] mt-0.5">สายพานขาด, ลูกปืนแตก, มอเตอร์ไหม้</p>
                    </div>
                    <div className="relative mt-4">
                        <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-[#b58c4f] border-2 border-white"></div>
                        <strong className="text-[#b58c4f] block text-[12px]">Electrical & Sensor (ขัดข้องระบบไฟ/เซ็นเซอร์):</strong>
                        <p className="text-[#7a8b95] text-[11px] mt-0.5">ระบบควบคุมเออเร่อ, เบรกเกอร์ตัด, เซ็นเซอร์อ่านพลาด</p>
                    </div>
                    <div className="relative mt-4">
                        <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-[#3f809e] border-2 border-white"></div>
                        <strong className="text-[#3f809e] block text-[12px]">Changeover & Setup (เปลี่ยนโมลด์ตั้งค่า):</strong>
                        <p className="text-[#7a8b95] text-[11px] mt-0.5">ช่างใช้เวลาล้างเครื่องหรือเปลี่ยนฟิล์มแพ็คเกินมาตรฐาน</p>
                    </div>
                </div>
            </div>

            <div className="h-px bg-[#eaeaec] w-full" />

            <div>
                <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                    <Icons.TrendingDown size={16} className="text-[#688a58]" /> 3. ค่าชี้วัดความทนทาน (MTBF / MTTR)
                </h3>
                <ul className="list-decimal pl-5 space-y-2 text-[#414757] text-[12px]">
                    <li><strong>MTBF (Mean Time Between Failures):</strong> การวัดว่าเครื่องจักรเดินได้เฉลี่ยกี่ชั่วโมงก่อนจะพังอีกรอบ (ยิ่งค่านี้นาน ยิ่งดี)</li>
                    <li><strong>MTTR (Mean Time To Repair):</strong> ช่างใช้เวลาซ่อมเฉลี่ยกี่นาทีต่อการพังหนึ่งครั้ง (ยิ่งค่านี้น้อย ยิ่งดี)</li>
                </ul>
            </div>
        </div>
      </UserGuidePanel>

      {/* HEADER NODES */}
      <div className="h-14 px-4 sm:px-8 flex flex-row items-center justify-between gap-4 z-20 shrink-0">
        <div className="flex items-center gap-5">
          <div className="relative flex items-center justify-center group cursor-default shrink-0">
            <div className="absolute inset-0 bg-[#a94228] blur-[15px] opacity-20 rounded-full group-hover:opacity-60 transition-all duration-700"></div>
            <div className="relative z-10 p-1.5 border border-[#a94228]/40 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm">
              <Icons.Activity size={28} strokeWidth={2.5} className="text-[#a94228]" />
            </div>
          </div>
          <div>
            <h3 className="font-black text-[#212c46] uppercase tracking-tighter leading-none font-exception-header text-[24px]">
              DOWNTIME <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a94228] to-[#b58c4f]">TRACKING</span> NODE
            </h3>
            <p className="text-[11px] font-bold text-[#4d5a44] uppercase tracking-[0.2em] mt-0.5 opacity-80 leading-none">
              EQUIPMENT AVAILABILITY & EXPLOITATION CONTROLLER
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-white/50 p-1.5 rounded-xl border border-white/60 shadow-inner flex flex-wrap items-center gap-1">
            <button onClick={() => setActiveTab('list_mode')} className={`px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'list_mode' ? 'bg-[#212c46] text-white shadow-md' : 'text-[#7a8b95] hover:text-[#a94228]'}`}>
              <Icons.LayoutList size={16} /> Incidents Log
            </button>
            <button onClick={() => setActiveTab('analytics_mode')} className={`px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'analytics_mode' ? 'bg-[#212c46] text-white shadow-md' : 'text-[#7a8b95] hover:text-[#a94228]'}`}>
              <Icons.BarChart2 size={16} /> Analytics Pareto
            </button>
          </div>
          <button onClick={() => setShowConfigModal(true)} className="bg-white border border-[#eaeaec] text-[#212c46] hover:text-[#a94228] hover:border-[#a94228] p-2.5 rounded-xl shadow-sm hover:shadow-md active:scale-95 transition-all">
            <Icons.Settings size={18} />
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="mx-auto px-4 sm:px-8 w-full mt-[2px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 shrink-0">
          <KpiCard label="Downtime Minutes" value={`${totalDowntimeMins} min`} icon="clock" colorAccent={THEME.accent} colorValue={THEME.primary} desc={`vs Target ${settings.maxAllowedDowntimeMins} min Limit`} />
          <KpiCard label="MTTR (Mean Repair Time)" value={`${mttrMins} min`} icon="wrench" colorAccent={THEME.primaryLight} colorValue={THEME.primary} desc={`Target: < ${settings.targetMttrMins} Mins`} />
          <KpiCard label="MTBF (Mean Fail Gap)" value={`${mtbfHours} hrs`} icon="shield-alert" colorAccent={THEME.gold} colorValue={THEME.primary} desc={`Target: > ${settings.targetMtbfHours} Hours`} />
          <KpiCard label="Active Incidents" value={activeIncidentsCount} icon="alert-triangle" colorAccent={activeIncidentsCount > 0 ? THEME.danger : THEME.success} colorValue={activeIncidentsCount > 0 ? THEME.danger : THEME.success} desc={activeIncidentsCount > 0 ? 'Requires LOTO Check' : 'All Systems Running'} />
        </div>

        {/* LIST VIEW TAB */}
        {activeTab === 'list_mode' ? (
          <div className="bg-white rounded-xl shadow-lg border border-[#eaeaec] overflow-hidden flex flex-col animate-fadeIn">
            {/* SEARCH AND CONTROLS HEADER */}
            <div className="px-4 py-4 border-b border-[#eaeaec] bg-white flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-black text-[#7a8b95] uppercase tracking-widest bg-white border border-[#eaeaec] px-4 py-2 rounded-xl shadow-sm">
                  Filter Category Status
                </span>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                  <Icons.Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#7a8b95]" />
                  <input type="text" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} placeholder="Search code, problem or reporter..." className="w-full pl-12 pr-6 py-2.5 text-[12px] border border-[#eaeaec] rounded-full font-bold outline-none focus:border-[#a94228] bg-white shadow-sm text-[#212c46]" />
                </div>
                <button onClick={openAddModal} className="bg-[#212c46] hover:bg-[#a94228] text-white px-6 py-2.5 rounded-full font-black text-[12px] uppercase tracking-widest shadow-md transition-all flex items-center gap-2 shrink-0">
                  <Icons.PlusSquare size={16} /> Log Incident
                </button>
              </div>
            </div>

            {/* MAIN DATA TABLE */}
            <div className="overflow-auto custom-scrollbar">
              <table className="w-full text-left border-collapse table-font">
                <thead className="sys-table-header [#b7a159] ">
                    <tr>
                    <th className="font-black uppercase tracking-widest whitespace-nowrap   ">ID / Date</th>
                    <th className="font-black uppercase tracking-widest whitespace-nowrap   ">Machine / Line</th>
                    <th className="font-black uppercase tracking-widest whitespace-nowrap   ">Category Root Cause</th>
                    <th className="font-black uppercase tracking-widest whitespace-nowrap   ">Description of Problem</th>
                    <th className="font-black uppercase tracking-widest text-center whitespace-nowrap   ">Duration</th>
                    <th className="font-black uppercase tracking-widest text-center whitespace-nowrap   ">Supervisor Sig</th>
                    <th className="font-black uppercase tracking-widest text-center   ">Status</th>
                    <th className="font-black uppercase tracking-widest text-center   ">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#eaeaec]">
                  {currentData.length === 0 ? (
                    <tr>
                      <td className="text-center text-[#7a8b95] uppercase font-black tracking-widest text-[12px] py-2.5 px-4">No tracked downtime records located</td>
                    </tr>
                  ) : (
                    currentData.map(inc => {
                      const category = MOCK_CATEGORIES.find(c => c.id === inc.categoryId) || MOCK_CATEGORIES[0];
                      const isHighDowntime = inc.durationMinutes > settings.maxAllowedDowntimeMins;
                      const requiresSignature = settings.requireSigForLongEvents && isHighDowntime && !inc.supervisorSig;

                      return (
                        <tr key={inc.id} className="hover:bg-[#f8f9fa] transition-colors group">
                          <td className="sys-table-td font-mono font-black text-[#212c46] py-2.5 px-4">
                            <div className="flex flex-col">
                              <span>{inc.id}</span>
                              <span className="text-[10px] text-[#7a8b95] font-bold">{inc.date}</span>
                            </div>
                          </td>
                          <td className="sys-table-td py-2.5 px-4">
                            <div className="flex flex-col">
                              <span className="font-black uppercase text-[#212c46] text-[12px]">{inc.machineName}</span>
                              <span className="text-[10px] text-[#3f809e] font-bold tracking-wider uppercase">{inc.machineId}</span>
                            </div>
                          </td>
                          <td className="sys-table-td py-2.5 px-4">
                            <span className="inline-flex items-center gap-[1px] px-3 py-1 rounded-full text-[10px] font-black uppercase text-white shadow-sm" style={{ backgroundColor: category.color }}>
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                              {category.name}
                            </span>
                          </td>
                          <td className="sys-table-td font-bold text-[#414757] text-[12px] max-w-sm truncate py-2.5 px-4" title={inc.problem}>
                            {inc.problem}
                          </td>
                          <td className={`sys-table-td text-center font-black ${isHighDowntime ? 'text-[#932c2e] bg-[#932c2e]/5' : 'text-[#657f4d]'}`}>
                            <div className="flex flex-col items-center">
                              <span>{inc.durationMinutes} Mins</span>
                              {isHighDowntime && <span className="text-[9px] uppercase tracking-widest font-black text-[#932c2e]">LIMIT EXCEEDED</span>}
                            </div>
                          </td>
                          <td className="sys-table-td text-center font-black py-2.5 px-4">
                            {inc.supervisorSig ? (
                              <span className="inline-flex items-center gap-[1px] text-[#657f4d] text-[11px] font-black bg-[#657f4d]/10 px-2.5 py-1 rounded-lg border border-[#657f4d]/20 uppercase tracking-widest">
                                <Icons.CheckCircle size={12} /> {inc.supervisorSig}
                              </span>
                            ) : requiresSignature ? (
                              <span className="inline-flex items-center gap-[1px] text-[#932c2e] text-[10px] font-black bg-[#932c2e]/10 px-2 py-1 rounded-lg border border-[#932c2e]/30 uppercase tracking-widest animate-pulse">
                                <Icons.AlertCircle size={10} /> Pending Sig
                              </span>
                            ) : (
                              <span className="text-[#aaeaec] opacity-40 text-[13px] font-bold">-</span>
                            )}
                          </td>
                          <td className="sys-table-td text-center py-2.5 px-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${inc.status === 'Resolved' ? 'bg-[#657f4d]/20 text-[#657f4d] border border-[#657f4d]/30' : 'bg-[#932c2e]/10 text-[#d96245] border border-[#932c2e]/30'}`}>
                              {inc.status}
                            </span>
                          </td>
                          <td className="sys-table-td text-center py-2.5 px-4">
                            <div className="flex justify-center items-center gap-[1px]">
                              <button onClick={() => openEditModal(inc)} className="sys-table-action-btn w-8 h-8 text-[#4d87a8] hover:bg-[#4d87a8]/10 border-transparent transition-all">
                                <Icons.Edit3 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION PANEL */}
            <div className="px-8 py-3 bg-[#f8f9fa] border-t border-[#eaeaec] flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
              <div className="flex items-center gap-6 text-[11px] font-black text-[#7a8b95] uppercase tracking-widest">
                <div className="flex items-center gap-3">
                  <span>Display Rows:</span>
                  <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="bg-white border border-[#eaeaec] rounded-lg px-3 py-1.5 outline-none font-black text-[#212c46] cursor-pointer shadow-sm">
                    {[5, 10, 20, 50].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <p className="bg-white px-4 py-2 rounded-xl border border-[#eaeaec] shadow-sm">Total: {filteredDowntimes.length} incidents</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className={`w-10 h-10 border border-[#eaeaec] bg-white rounded-xl flex items-center justify-center transition-all ${currentPage === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#212c46] hover:text-white shadow-md active:scale-90'}`}>
                  <Icons.ChevronLeft size={18} />
                </button>
                <div className="bg-[#212c46] text-white px-8 py-2.5 rounded-xl shadow-md font-black text-[11px] min-w-[140px] text-center uppercase tracking-widest">
                  Page {currentPage} / {totalPages}
                </div>
                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className={`w-10 h-10 border border-[#eaeaec] bg-white rounded-xl flex items-center justify-center transition-all ${currentPage === totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#212c46] hover:text-white shadow-md active:scale-90'}`}>
                  <Icons.ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ANALYTICS TAB */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
            {/* PARETO CATEGORY BARS */}
            <div className="lg:col-span-6 bg-white p-6 rounded-xl shadow-lg border border-[#eaeaec]">
              <div className="border-b-2 border-[#b7a159] pb-4 mb-6">
                <h4 className="text-[14px] font-black uppercase text-[#212c46] tracking-widest flex items-center gap-3">
                  <Icons.BarChart2 size={20} className="text-[#a94228]" /> Downtime Pareto Distribution (Minutes)
                </h4>
                <p className="text-[11px] font-bold text-[#7a8b95] uppercase tracking-widest mt-1">วิเคราะห์สัดส่วนการหยุดแยกตามประเภทสาเหตุเพื่อระบุปัญหาจุดวิกฤต</p>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataByCategory} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaec" />
                    <XAxis dataKey="name" stroke="#7a8b95" fontSize={10} tickLine={false} />
                    <YAxis stroke="#7a8b95" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#212c46', borderRadius: '16px', border: 'none', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }} />
                    <Bar dataKey="minutes" fill="#a94228" radius={[8, 8, 0, 0]}>
                      {chartDataByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* TREND LINE */}
            <div className="lg:col-span-6 bg-white p-6 rounded-xl shadow-lg border border-[#eaeaec]">
              <div className="border-b-2 border-[#b7a159] pb-4 mb-6">
                <h4 className="text-[14px] font-black uppercase text-[#212c46] tracking-widest flex items-center gap-3">
                  <Icons.TrendingUp size={20} className="text-[#3f809e]" /> Daily Downtime Trend Line
                </h4>
                <p className="text-[11px] font-bold text-[#7a8b95] uppercase tracking-widest mt-1">แนวโน้มเวลารวมของเครื่องจักรบกพร่องตามวันประเมินความเสี่ยง</p>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartDataByTrend} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaec" />
                    <XAxis dataKey="date" stroke="#7a8b95" fontSize={10} tickLine={false} />
                    <YAxis stroke="#7a8b95" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#212c46', borderRadius: '16px', border: 'none', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }} />
                    <Line type="monotone" dataKey="Minutes" stroke="#3f809e" strokeWidth={3} dot={{ stroke: '#3f809e', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DRAGGABLE CONFIG MODAL (Matching UserPermissions style exactly) */}
      <DraggableModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        width="max-w-[850px]"
        customHeader={
          <div className="bg-[#212c46] px-4 py-3 flex justify-between items-center shrink-0 border-b-2 border-[#b7a159]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/20 shadow-sm">
                <Icons.Sliders size={20} className="text-[#b7a159]" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#d7d7d7] uppercase tracking-widest leading-none">Downtime Targets Configuration</h3>
                <p className="text-[10px] font-bold text-[#d7d7d7]/70 uppercase tracking-widest mt-1">ระบบตั้งค่าเป้าหมายเชิงกลยุทธ์และความปลอดภัย</p>
              </div>
            </div>
            <button onClick={() => setShowConfigModal(false)} className="text-white/60 hover:text-white p-1 rounded-lg transition-colors"><Icons.X size={20} /></button>
          </div>
        }
      >
        <div className="flex flex-col md:flex-row h-[420px] bg-white text-[#414757]">
          {/* Modal Sidebar Tabs */}
          <div className="w-full md:w-[240px] bg-[#f8f9fa] border-r border-[#eaeaec] flex flex-col p-3 shrink-0 uppercase tracking-widest font-black text-[10px] space-y-1">
            <button onClick={() => setConfigStep(0)} className={`p-3 rounded-xl text-left font-black tracking-widest flex items-center gap-2.5 transition-all ${configStep === 0 ? 'bg-[#212c46] text-white shadow-sm' : 'text-[#7a8b95] hover:bg-[#d7d7d7]/30 hover:text-[#212c46]'}`}>
              <Icons.Target size={14} /> Targets & Limits
            </button>
            <button onClick={() => setConfigStep(1)} className={`p-3 rounded-xl text-left font-black tracking-widest flex items-center gap-2.5 transition-all ${configStep === 1 ? 'bg-[#212c46] text-white shadow-sm' : 'text-[#7a8b95] hover:bg-[#d7d7d7]/30 hover:text-[#212c46]'}`}>
              <Icons.ShieldAlert size={14} /> Safety Safeguards
            </button>
            <button onClick={() => setConfigStep(2)} className={`p-3 rounded-xl text-left font-black tracking-widest flex items-center gap-2.5 transition-all ${configStep === 2 ? 'bg-[#212c46] text-white shadow-sm' : 'text-[#7a8b95] hover:bg-[#d7d7d7]/30 hover:text-[#212c46]'}`}>
              <Icons.Radio size={14} /> Dispatch & Alert
            </button>
          </div>

          {/* Modal Body Content */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            {configStep === 0 && (
              <div className="space-y-4">
                <div className="border-b border-[#eaeaec] pb-2 mb-4">
                  <h4 className="text-[12px] font-black text-[#212c46] uppercase tracking-widest">Step 1: Metric Targets & Thresholds</h4>
                  <p className="text-[10px] text-[#7a8b95] uppercase font-bold mt-0.5">กำหนดขีดจำกัดสูงสุดและเป้าหมาย MTTR / MTBF</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Max Allowed Event Downtime (Min)</label>
                    <input type="number" value={settings.maxAllowedDowntimeMins} onChange={e => setSettings({ ...settings, maxAllowedDowntimeMins: Number(e.target.value) })} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none focus:border-[#a94228]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">MTTR Target limit (Min)</label>
                    <input type="number" value={settings.targetMttrMins} onChange={e => setSettings({ ...settings, targetMttrMins: Number(e.target.value) })} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none focus:border-[#a94228]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">MTBF Target (Hours)</label>
                    <input type="number" value={settings.targetMtbfHours} onChange={e => setSettings({ ...settings, targetMtbfHours: Number(e.target.value) })} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none focus:border-[#a94228]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Scheduled Maintenance allowance</label>
                    <input type="number" value={settings.scheduledMaintenanceMins} onChange={e => setSettings({ ...settings, scheduledMaintenanceMins: Number(e.target.value) })} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none focus:border-[#a94228]" />
                  </div>
                </div>
              </div>
            )}

            {configStep === 1 && (
              <div className="space-y-4">
                <div className="border-b border-[#eaeaec] pb-2 mb-4">
                  <h4 className="text-[12px] font-black text-[#212c46] uppercase tracking-widest">Step 2: Controls & Safety Rules</h4>
                  <p className="text-[10px] text-[#7a8b95] uppercase font-bold mt-0.5">ระเบียบอนุมัติทางความปลอดภัยและสิทธิเข้าถึงข้อมูล</p>
                </div>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 bg-[#f8f9fa] border border-[#eaeaec] rounded-xl cursor-pointer hover:border-[#a94228] transition-colors">
                    <input type="checkbox" checked={settings.requireSigForLongEvents} onChange={e => setSettings({ ...settings, requireSigForLongEvents: e.target.checked })} className="w-4 h-4 accent-[#212c46]" />
                    <div>
                      <span className="block text-[11px] font-black text-[#212c46] uppercase tracking-wider">Require Supervisor Signature for High Events</span>
                      <span className="block text-[9px] text-[#7a8b95] font-bold mt-0.5">ต้องลงลายมือชื่อควบคุมหากหยุดพาร์ทมากกว่าเวลาที่กำหนด</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-[#f8f9fa] border border-[#eaeaec] rounded-xl cursor-pointer hover:border-[#a94228] transition-colors">
                    <input type="checkbox" checked={settings.autoEscalateProductionLead} onChange={e => setSettings({ ...settings, autoEscalateProductionLead: e.target.checked })} className="w-4 h-4 accent-[#212c46]" />
                    <div>
                      <span className="block text-[11px] font-black text-[#212c46] uppercase tracking-wider">Auto-escalate Incident status to Production Lead</span>
                      <span className="block text-[9px] text-[#7a8b95] font-bold mt-0.5">เลื่อนระดับการแจ้งเตือนไปที่หัวหน้าฝ่ายผลิตพึงระวังสถานการณ์</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-[#f8f9fa] border border-[#eaeaec] rounded-xl cursor-pointer hover:border-[#a94228] transition-colors">
                    <input type="checkbox" checked={settings.enforceLockouts} onChange={e => setSettings({ ...settings, enforceLockouts: e.target.checked })} className="w-4 h-4 accent-[#212c46]" />
                    <div>
                      <span className="block text-[11px] font-black text-[#212c46] uppercase tracking-wider">Enforce LOTO (Lockout/Tagout) Safeguards Check</span>
                      <span className="block text-[9px] text-[#7a8b95] font-bold mt-0.5">บังคับตรวจสอบระบบความปลอดภัยก่อนปล่อยฝากงานเข้าซ่อมบำรุง</span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {configStep === 2 && (
              <div className="space-y-4">
                <div className="border-b border-[#eaeaec] pb-2 mb-4">
                  <h4 className="text-[12px] font-black text-[#212c46] uppercase tracking-widest">Step 3: Alert Notification Parameters</h4>
                  <p className="text-[10px] text-[#7a8b95] uppercase font-bold mt-0.5">ตั้งค่าระดับความเร่งด่วนและช่องทางแจ้งเตือนหลัก</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Alert Notification Urgency</label>
                    <select value={settings.alertNotificationLevel} onChange={e => setSettings({ ...settings, alertNotificationLevel: e.target.value })} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none">
                      <option value="Critical">Critical Issue Alert Only</option>
                      <option value="High">High Priority warning & metrics</option>
                      <option value="Muted">Muted / Soft logging logs</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Default Dispatch Channels</label>
                    <input type="text" value={settings.dispatchChannel} onChange={e => setSettings({ ...settings, dispatchChannel: e.target.value })} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Config Footer */}
        <div className="px-6 py-3 bg-[#f8f9fa] border-t border-[#eaeaec] flex justify-end gap-3 shrink-0">
          <button onClick={() => setShowConfigModal(false)} className="px-5 py-2 bg-white border border-[#eaeaec] text-[#414757] rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-[#d7d7d7]/30 transition-all">Cancel</button>
          <button onClick={handleSaveConfig} className="bg-[#212c46] hover:bg-[#a94228] text-white px-6 py-2 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-md transition-all flex items-center gap-2"><Icons.Save size={14} /> Update Policy Settings</button>
        </div>
      </DraggableModal>

      {/* DRAGGABLE INCIDENT ADD/EDIT MODAL */}
      <DraggableModal
        isOpen={showIncidentModal}
        onClose={() => setShowIncidentModal(false)}
        width="max-w-[750px]"
        customHeader={
          <div className="bg-[#212c46] px-4 py-3 flex justify-between items-center shrink-0 border-b-2 border-[#b7a159]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/20 shadow-sm">
                <Icons.AlertOctagon size={20} className="text-[#b7a159]" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#d7d7d7] uppercase tracking-widest leading-none">{editingIncident ? 'Edit Tracked Incident' : 'Log New Downtime Incident'}</h3>
                <p className="text-[10px] font-bold text-[#d7d7d7]/70 uppercase tracking-widest mt-1">ฟอร์มบันทึกสาเหตุขัดข้องและเวลาประเมินหน้างานจริง</p>
              </div>
            </div>
            <button onClick={() => setShowIncidentModal(false)} className="text-white/60 hover:text-white p-1 rounded-lg transition-colors"><Icons.X size={20} /></button>
          </div>
        }
      >
        <div className="p-6 space-y-4 text-[#414757]">
          {/* Step Wizards Header */}
          <div className="flex items-center gap-2 border-b border-[#eaeaec] pb-3 mb-4 shrink-0 justify-between">
            <span className="text-[11px] font-black text-[#212c46] uppercase tracking-widest">
              Incident Phase Progress
            </span>
            <div className="flex bg-[#f8f9fa] p-0.5 rounded-full border border-[#eaeaec] shadow-sm">
              <button onClick={() => setIncidentStep(0)} className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full transition-all ${incidentStep === 0 ? 'bg-[#212c46] text-white' : 'text-[#7a8b95]'}`}>Step 1: Core Details</button>
              <button onClick={() => setIncidentStep(1)} className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full transition-all ${incidentStep === 1 ? 'bg-[#212c46] text-white' : 'text-[#7a8b95]'}`}>Step 2: Sign-Off</button>
            </div>
          </div>

          {incidentStep === 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Downtime Date</label>
                  <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Machine / Equipment Node</label>
                  <select value={formMachineId} onChange={e => setFormMachineId(e.target.value)} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none">
                    {MOCK_EQUIPMENT.map(m => m.id && <option key={m.id} value={m.id}>{m.name} ({m.department})</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Root Cause Category</label>
                  <select value={formCategoryId} onChange={e => setFormCategoryId(e.target.value)} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none">
                    {MOCK_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Downtime Duration (Mins)</label>
                  <input type="number" value={formDuration} onChange={e => setFormDuration(Number(e.target.value))} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Description of Problem & Root Cause</label>
                <textarea value={formProblem} onChange={e => setFormProblem(e.target.value)} placeholder="e.g. Hydraulic pressure loss in conveyor belt feed rollers" className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none min-h-[100px]" />
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Reported By (Operator)</label>
                  <input type="text" value={formReportedBy} onChange={e => setFormReportedBy(e.target.value)} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Supervisor Validation Signature</label>
                  <input type="text" value={formSupervisorSig} onChange={e => setFormSupervisorSig(e.target.value)} placeholder="Co-signature required if high incident" className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none placeholder:text-[#7a8b95]/50" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Incident Resolution Status</label>
                <div className="flex bg-[#f8f9fa] border border-[#eaeaec] p-1.5 rounded-xl gap-2 w-full">
                  <button type="button" onClick={() => setFormStatus('Open')} className={`flex-1 py-2 text-[11px] font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 transition-all ${formStatus === 'Open' ? 'bg-[#932c2e] text-white shadow-sm' : 'text-[#7a8b95]'}`}>
                    <Icons.XCircle size={14} /> Open (Unresolved)
                  </button>
                  <button type="button" onClick={() => setFormStatus('Resolved')} className={`flex-1 py-2 text-[11px] font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 transition-all ${formStatus === 'Resolved' ? 'bg-[#657f4d] text-white shadow-sm' : 'text-[#7a8b95]'}`}>
                    <Icons.CheckCircle size={14} /> Resolved (Normal state)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-3 bg-[#f8f9fa] border-t border-[#eaeaec] flex justify-end gap-3 shrink-0">
          <button onClick={() => setShowIncidentModal(false)} className="px-5 py-2 bg-white border border-[#eaeaec] text-[#414757] rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-[#d7d7d7]/30 transition-all">Cancel</button>
          <button onClick={handleSaveIncident} className="bg-[#212c46] hover:bg-[#a94228] text-white px-6 py-2 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-md transition-all flex items-center gap-2">
            <Icons.CheckSquare size={14} /> Commit Incident Log
          </button>
        </div>
      </DraggableModal>

    </div>
  );
}
