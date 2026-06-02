import React, { useState, useMemo, useEffect } from 'react';
import * as Icons from 'lucide-react';
import Swal from 'sweetalert2';
import { DraggableModal } from '../../components/shared/DraggableModal';
import KpiCard from '../../components/shared/KpiCard';
import { UserGuidePanel } from '../../components/shared/UserGuidePanel';
import UserGuideButton from '../../components/shared/UserGuideButton';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';

// --- SYSTEM COLOR PALETTE (Matched with Main Home Theme) ---
const THEME = {
  bgMain: '#f3f3f1',
  primary: '#212c46',         // Navy Primary
  primaryLight: '#4d87a8',    // Light Blue
  accent: '#a94228',         // Crimson Red
  gold: '#b58c4f',           // Gold Accent
  brightGold: '#b7a159',     // Amber Gold
  success: '#657f4d',        // Sage Green
  danger: '#932c2e',         // Dark Red
  skyBlue: '#3f809e',        // Sky Blue
  dustyBlue: '#7a8b95',      // Slate Muted
  indigo: '#414757',         // Tech Slate
  coolGray: '#eaeaec'
};

// --- MOCK MACHINES DATA (OEE SPECIFIC - 100% PRESERVED & DETAILED) ---
const INITIAL_MACHINES_DATA = [
  {
    id: 'VCM-101',
    name: 'Vacuum Stuffing Machine 1',
    line: 'Sausage Line A',
    status: 'Running',
    operatingMins: 420,
    plannedMins: 480,
    idealCycleTime: 0.12, // mins per kg
    actualOutput: 3100, // kg
    defectOutput: 45, // kg
  },
  {
    id: 'SMK-201',
    name: 'Smokehouse Chamber 1',
    line: 'Sausage Line A',
    status: 'Running',
    operatingMins: 390,
    plannedMins: 480,
    idealCycleTime: 0.25, // mins per kg
    actualOutput: 1480, // kg
    defectOutput: 15, // kg
  },
  {
    id: 'MIX-301',
    name: 'Mixing & Bowl Cutter',
    line: 'Prep Line X',
    status: 'Idle',
    operatingMins: 310,
    plannedMins: 480,
    idealCycleTime: 0.08, // mins per kg
    actualOutput: 3450, // kg
    defectOutput: 20, // kg
  },
  {
    id: 'PKG-401',
    name: 'Multihead Weigher Packer',
    line: 'Packing Line 1',
    status: 'Stopped',
    operatingMins: 240,
    plannedMins: 480,
    idealCycleTime: 0.05, // mins per pack
    actualOutput: 4120, // packs
    defectOutput: 110, // packs
  },
  {
    id: 'MTD-501',
    name: 'Metal Detector System',
    line: 'Packing Line 1',
    status: 'Running',
    operatingMins: 450,
    plannedMins: 480,
    idealCycleTime: 0.01,
    actualOutput: 4200,
    defectOutput: 5,
  }
];

// Graph Trend Data (Original trend from Equipment registry - preserved 100%)
const INITIAL_TREND_DATA = [
  { name: 'Mon', oee: 75, availability: 82, performance: 90, quality: 98, target: 85 },
  { name: 'Tue', oee: 78, availability: 84, performance: 91, quality: 98.2, target: 85 },
  { name: 'Wed', oee: 82, availability: 86, performance: 92, quality: 98.5, target: 85 },
  { name: 'Thu', oee: 76, availability: 81, performance: 89, quality: 97.8, target: 85 },
  { name: 'Fri', oee: 79, availability: 83, performance: 90, quality: 98.1, target: 85 },
  { name: 'Sat', oee: 84, availability: 88, performance: 91, quality: 98.8, target: 85 },
  { name: 'Sun', oee: 78, availability: 82, performance: 90, quality: 98.0, target: 85 }
];

// Helper to determine Lucide Icons inside code easily
const LucideIcon = ({ name, size = 16, className = "", color, style }: any) => {
  if (!name) return null;
  const kebabToPascal = (str: string) => str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
  const pascalName = kebabToPascal(name);
  const IconComponent = (Icons as any)[pascalName] || Icons.CircleHelp;
  return <IconComponent size={size} className={className} style={{...style, color: color}} />;
};

export default function OeeMonitoring() {
  const [machines, setMachines] = useState(INITIAL_MACHINES_DATA);
  const [trendData, setTrendData] = useState(INITIAL_TREND_DATA);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsStep, setSettingsStep] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Edit / Manual Override Modal State (Interactive Actions)
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<any>(null);

  // OEE Configuration Settings (Step-by-step dynamic matching UserPermissions standards)
  const [activeSettings, setActiveSettings] = useState({
    targetOee: 85.0,
    targetAvailability: 90.0,
    targetPerformance: 95.0,
    targetQuality: 98.5,
    autoLogDowntime: true,
    warningThreshold: 75.0,
    supervisorSignature: true,
    allowAutoCalculations: true,
    shiftDurationHours: 8,
    formulaEngine: 'standard-semi',
    alertNotificationChannel: 'email-buzz'
  });

  const [tempSettings, setTempSettings] = useState({ ...activeSettings });

  // Recalculating OEE metrics dynamically based on current values and setting rules
  const calculatedMachines = useMemo(() => {
    return machines.map(m => {
      // 1. Availability = Operating / Planned
      const availability = m.plannedMins > 0 ? (m.operatingMins / m.plannedMins) * 100 : 0;
      
      // 2. Performance = (Ideal Run Time * Total Output) / Operating Time
      // Total output = Actual output (which is good + bad or just good depending on formula)
      const performance = m.operatingMins > 0 ? ((m.idealCycleTime * m.actualOutput) / m.operatingMins) * 100 : 0;
      
      // 3. Quality = (Good Output / Total Output) * 100
      // Ideal output has actualOutput. Good Output = actualOutput - defectOutput
      const goodOutput = Math.max(0, m.actualOutput - m.defectOutput);
      const quality = m.actualOutput > 0 ? (goodOutput / m.actualOutput) * 100 : 100;
      
      // Cap at 100% for realistic metrics representation
      const av = Math.min(100, Math.max(0, availability));
      const pe = Math.min(100, Math.max(0, performance));
      const qu = Math.min(100, Math.max(0, quality));
      
      // 4. OEE = A * P * Q
      const oee = (av / 100) * (pe / 100) * (qu / 100) * 100;

      return {
        ...m,
        availability: av,
        performance: pe,
        quality: qu,
        oee: oee,
        goodOutput: goodOutput
      };
    });
  }, [machines]);

  // Overall Plant Averages
  const plantMetrics = useMemo(() => {
    if (calculatedMachines.length === 0) return { oee: 0, availability: 0, performance: 0, quality: 0 };
    const avgA = calculatedMachines.reduce((sum, m) => sum + m.availability, 0) / calculatedMachines.length;
    const avgP = calculatedMachines.reduce((sum, m) => sum + m.performance, 0) / calculatedMachines.length;
    const avgQ = calculatedMachines.reduce((sum, m) => sum + m.quality, 0) / calculatedMachines.length;
    const avgOEE = (avgA / 100) * (avgP / 100) * (avgQ / 100) * 100;
    
    return {
      oee: avgOEE,
      availability: avgA,
      performance: avgP,
      quality: avgQ
    };
  }, [calculatedMachines]);

  // Filter machines based on search query
  const filteredMachines = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return calculatedMachines;
    return calculatedMachines.filter(
      m => m.id.toLowerCase().includes(q) ||
           m.name.toLowerCase().includes(q) ||
           m.line.toLowerCase().includes(q) ||
           m.status.toLowerCase().includes(q)
    );
  }, [calculatedMachines, searchTerm]);

  // Handle saving the simulated machine parameter override
  const handleSaveOverride = (updatedData: any) => {
    setMachines(prev => prev.map(m => m.id === updatedData.id ? { ...m, ...updatedData } : m));
    setIsOverrideOpen(false);

    Swal.fire({
      icon: 'success',
      title: 'Machine Parameters Updated',
      text: `${updatedData.name} values have been reprogrammed successfully.`,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      confirmButtonColor: THEME.primary
    });
  };

  // Sync settings actions
  const openSettingsModal = () => {
    setTempSettings({ ...activeSettings });
    setSettingsStep(0);
    setIsSettingsOpen(true);
  };

  const saveSettingsConfig = () => {
    setActiveSettings({ ...tempSettings });
    setIsSettingsOpen(false);
    Swal.fire({
      icon: 'success',
      title: 'บันทึกการตั้งค่า OEE สำเร็จ!',
      text: 'เป้าหมายมาตรฐาน (World Class Targets) และสูตรประมวลผลได้รับการยืนยันแล้ว',
      confirmButtonColor: THEME.primary,
      timer: 2000,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
    });
  };

  return (
    <div className="flex flex-1 w-full flex-col animate-fadeIn bg-transparent space-y-4 relative font-sans">
      
      {/* FLOATING MANUAL BUTTON */}
      <UserGuideButton onClick={() => setIsGuideOpen(true)} />

      {/* DETAILED USER MANUAL (Thai & English - Matches UserPermissions Standards) */}
      <UserGuidePanel
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        title="OEE MONITORING GUIDE"
        subtitle="OVERALL EQUIPMENT EFFECTIVENESS MANUAL"
      >
        <div className="space-y-8 font-sans">
            <div>
                <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                    <Icons.Activity size={16} className="text-[#3f809e]" /> 1. ดัชนีวัดประสิทธิภาพหลัก (THREE PILLARS OF OEE)
                </h3>
                <p className="mb-4 text-[#414757]">
                    OEE คือมาตรฐานระดับโลกที่ใช้วัดและประมวลผลสมรรถภาพของเครื่องจักร ว่าทำงานได้เต็มประสิทธิภาพมากน้อยเพียงใด โดยแบ่งออกเป็น 3 ปัจจัยหลัก (Pillars) ดังนี้:
                </p>
                <div className="space-y-3">
                    <div className="p-3 bg-[#f8f9fa] border border-[#eaeaec] rounded-xl flex items-start gap-4 text-[12px]">
                        <div className="p-2 bg-[#d55a6d] text-white rounded-lg"><Icons.Clock size={16} /></div>
                        <div>
                            <strong className="text-[#212c46]">Availability (A) - ความพร้อมใช้งาน</strong>
                            <p className="text-[#7a8b95]">เปรียบเทียบเวลาที่เครื่องจักรทำงานได้จริง กับเวลาที่วางแผนไว้ (หักลบเวลาเสีย, รอซ่อม, และสลับรุ่น)</p>
                        </div>
                    </div>
                    <div className="p-3 bg-[#f8f9fa] border border-[#eaeaec] rounded-xl flex items-start gap-4 text-[12px]">
                        <div className="p-2 bg-[#3f809e] text-white rounded-lg"><Icons.Gauge size={16} /></div>
                        <div>
                            <strong className="text-[#212c46]">Performance (P) - ประสิทธิภาพเดินเครื่อง</strong>
                            <p className="text-[#7a8b95]">เปรียบเทียบความเร็วในการผลิตจริง กับความเร็วมาตรฐานสูงสุดของเครื่องจักร (Ideal Run Rate)</p>
                        </div>
                    </div>
                    <div className="p-3 bg-[#f8f9fa] border border-[#eaeaec] rounded-xl flex items-start gap-4 text-[12px]">
                        <div className="p-2 bg-[#688a58] text-white rounded-lg"><Icons.CheckCircle2 size={16} /></div>
                        <div>
                            <strong className="text-[#212c46]">Quality (Q) - คุณภาพผลผลิต</strong>
                            <p className="text-[#7a8b95]">เปรียบเทียบยอดสินค้าดี (Good Parts) กับปริมาณของที่ผลิตออกมาทั้งหมด (Total Output) หักลบของเสีย/คัดทิ้งทั้งหมด</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-px bg-[#eaeaec] w-full" />

            <div>
                <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                    <Icons.Award size={16} className="text-[#b58c4f]" /> 2. เกณฑ์วัดระดับมาตรฐานสากล (TARGETS)
                </h3>
                <div className="space-y-3">
                    <div className="p-4 bg-[#f1f0ee] border border-[#eaeaec] flex items-start gap-4 rounded-xl">
                        <div className="bg-[#688a58] text-white p-2 rounded-lg shrink-0"><Icons.Trophy size={16} /></div>
                        <div>
                            <div className="font-bold text-[#688a58] mb-1">WORLD CLASS: OEE &ge; 85%</div>
                            <div className="text-[#414757] text-[12px]">ถือเป็นจุดมุ่งหมายสูงสุดของโรงงาน โดยมาจากเป้า Availability 90%, Performance 95%, Quality 99.9%</div>
                        </div>
                    </div>
                    <div className="p-4 bg-[#fdf2f2] border border-[#f5c6cb] flex items-start gap-4 rounded-xl">
                        <div className="bg-[#a94228] text-white p-2 rounded-lg shrink-0"><Icons.AlertTriangle size={16} /></div>
                        <div>
                            <div className="font-bold text-[#a94228] mb-1">CRITICAL ALERT: OEE &lt; 75%</div>
                            <div className="text-[#414757] text-[12px]">หากค่า OEE รวมต่ำกว่า 75% ระบบจะขึ้นไฟเตือนและสถานะ Critical พร้อมแจ้งเตือนไปยังผู้จัดการโรงงาน</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-px bg-[#eaeaec] w-full" />

            <div>
                <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                    <Icons.Settings size={16} className="text-[#b58c4f]" /> 3. การตั้งค่าระบบ (SETTINGS)
                </h3>
                <p className="mb-4 text-[#414757]">
                    ปุ่ม Settings ทางขวาบน ใช้ปรับแต่งพารามิเตอร์ของบอร์ด:
                </p>
                <div className="space-y-3">
                    <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-[#3f809e]"></div><span className="text-[#414757] text-[12px]"><strong className="text-[#212c46]">Target Thresholds</strong> - ตั้งเป้าหมาย OEE/A/P/Q ของโรงงานประจำปี</span></div>
                    <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-[#d55a6d]"></div><span className="text-[#414757] text-[12px]"><strong className="text-[#212c46]">Control Safeguards</strong> - เปิดระบบล็อคเวลา Breakdown ย้อนหลัง หรือแจ้งเตือนความผิดปกติ</span></div>
                </div>
            </div>
        </div>
      </UserGuidePanel>

      {/* DISTINCT UNIFIED HEADER */}
      <div className="h-14 px-4 sm:px-8 flex flex-row items-center justify-between gap-4 z-20 shrink-0">
        <div className="flex items-center gap-5">
          <div className="relative flex items-center justify-center group cursor-default shrink-0">
            <div className="absolute inset-0 bg-[#212c46] blur-[15px] opacity-20 rounded-full group-hover:opacity-60 transition-all duration-700"></div>
            <div className="relative z-10 p-1.5 border border-[#212c46]/40 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm">
              <Icons.Activity size={28} strokeWidth={2.5} className="text-[#212c46]" />
            </div>
          </div>
          <div>
            <h3 className="font-black text-[#212c46] uppercase tracking-tighter leading-none font-exception-header" style={{ fontSize: '24px' }}>
              OEE <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#212c46] to-[#b58c4f]">MONITORING</span>
            </h3>
            <p className="text-[11px] font-bold text-[#7a8b95] uppercase tracking-[0.2em] mt-0.5 opacity-80 leading-none">
              OVERALL EQUIPMENT EFFECTIVENESS & PRODUCTION AVAILABILITY METRICS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex gap-2 p-1 bg-white/50 border border-[#eaeaec] rounded-xl shadow-sm">
            <button
              onClick={openSettingsModal}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-[#212c46] px-4 py-2 rounded-lg font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-2 outline-none active:scale-95"
            >
              <Icons.Settings size={14} className="text-[#b7a159]" /> Configure Settings (ตั้งค่า)
            </button>
            <span className="text-[10px] font-black bg-[#212c46]/10 text-[#212c46] px-3.5 py-2 rounded-lg border border-[#212c46]/20 shadow-inner flex items-center gap-1.5 font-mono">
              <Icons.Layers size={12} className="text-[#a94228]" />
              FORMULA {activeSettings.formulaEngine === 'standard-semi' ? 'SEMI COMPLIANT' : 'CUSTOM MES'}
            </span>
          </div>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="mx-auto px-4 sm:px-8 w-full mt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard 
            label="Plant OEE Index" 
            value={`${plantMetrics.oee.toFixed(1)} %`} 
            icon="activity" 
            colorAccent={plantMetrics.oee >= activeSettings.targetOee ? THEME.success : plantMetrics.oee >= activeSettings.warningThreshold ? '#eab308' : THEME.accent} 
            colorValue={THEME.primary} 
            desc={`Target Limit Threshold: ${activeSettings.targetOee}%`} 
          />
          <KpiCard 
            label="Average Availability" 
            value={`${plantMetrics.availability.toFixed(1)} %`} 
            icon="clock" 
            colorAccent={THEME.skyBlue} 
            colorValue={THEME.primary} 
            desc={`Equipment uptime: ${plantMetrics.availability >= activeSettings.targetAvailability ? 'Optimal' : 'Slight Loss'}`} 
          />
          <KpiCard 
            label="Average Performance" 
            value={`${plantMetrics.performance.toFixed(1)} %`} 
            icon="zap" 
            colorAccent={THEME.gold} 
            colorValue={THEME.primary} 
            desc={`Engineering speed capacity`} 
          />
          <KpiCard 
            label="Average Quality Rate" 
            value={`${plantMetrics.quality.toFixed(1)} %`} 
            icon="shield-check" 
            colorAccent="#34d399" 
            colorValue="#059669" 
            desc={`Defective margins tracked`} 
          />
        </div>

        {/* DOUBLE COLUMN CHARTS & SUMMARY */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          
          {/* Trend Chart - Left Column */}
          <div className="lg:col-span-8 bg-white rounded-xl border border-[#eaeaec] p-6 shadow-lg flex flex-col min-h-[400px]">
            <h3 className="font-black text-[#212c46] flex items-center gap-2 uppercase tracking-widest text-xs mb-6 pb-3 border-b border-slate-100">
              <Icons.TrendingUp size={16} className="text-[#a94228]" /> Overall OEE Trend (Last 7 Days)
            </h3>
            <div className="flex-1 w-full min-h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaec" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#7a8b95', fontWeight: 'bold' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#7a8b95', fontWeight: 'bold' }} domain={[65, 100]} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #eaeaec', fontSize: '11px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }} />
                  <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '15px' }} />
                  <Line type="monotone" dataKey="oee" name="OEE Index %" stroke={THEME.primary} strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'white' }} activeDot={{ r: 6, fill: THEME.primary, stroke: 'white' }} />
                  <Line type="monotone" dataKey="availability" name="Availability %" stroke={THEME.skyBlue} strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="performance" name="Performance %" stroke={THEME.gold} strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="target" name={`Target (${activeSettings.targetOee}%)`} stroke="#db2777" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Machine Comparison Chart - Right Column */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-[#eaeaec] p-6 shadow-lg flex flex-col min-h-[400px]">
            <h3 className="font-black text-[#212c46] flex items-center gap-2 uppercase tracking-widest text-xs mb-6 pb-3 border-b border-slate-100">
              <Icons.BarChart3 size={16} className="text-[#a94228]" /> OEE Rating by Machinery
            </h3>
            <div className="flex-1 w-full min-h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={calculatedMachines} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eaeaec" />
                  <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#7a8b95', fontWeight: 'bold' }} />
                  <YAxis type="category" dataKey="id" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#212c46', fontWeight: 'bold' }} width={60} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #eaeaec', fontSize: '11px' }} />
                  <Bar dataKey="oee" name="OEE %" fill={THEME.primaryLight} radius={[0, 8, 8, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* DETAILS TABLE CARD */}
        <div className="bg-white rounded-xl border border-[#eaeaec] shadow-lg overflow-hidden flex flex-col">
          
          <div className="p-6 border-b border-[#eaeaec] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white">
            <div className="relative w-full sm:w-96">
              <Icons.Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search Machinery, Line name, Code ID..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 bg-[#f8f9fa] border border-[#eaeaec] rounded-xl text-xs font-bold text-[#212c46] outline-none focus:border-[#b7a159] shadow-inner transition-colors placeholder-slate-400" 
              />
            </div>
            
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              TOTAL RECORD COUNT: {filteredMachines.length} UNIT(S)
            </span>
          </div>

          <div className="overflow-x-auto custom-scrollbar bg-slate-50">
            <table className="w-full text-left min-w-[1000px] border-collapse bg-white table-font">
              <thead className="sys-table-header">
                <tr className="bg-[#212c46] text-[#d7d7d7]  [#b7a159]">
                  <th className="font-black uppercase tracking-widest ">Equip ID</th>
                  <th className="font-black uppercase tracking-widest ">Machine Name</th>
                  <th className="font-black uppercase tracking-widest  text-center">Status</th>
                  <th className="font-black uppercase tracking-widest  text-center">Availability</th>
                  <th className="font-black uppercase tracking-widest  text-center">Performance</th>
                  <th className="font-black uppercase tracking-widest  text-center">Quality</th>
                  <th className="font-black uppercase tracking-widest  text-center">Calculated OEE</th>
                  <th className="font-black uppercase tracking-widest text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeaec]">
                {filteredMachines.length > 0 ? (
                  filteredMachines.map(m => {
                    const oeePass = m.oee >= activeSettings.targetOee;
                    const oeeFail = m.oee < activeSettings.warningThreshold;
                    
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-4 font-mono font-black text-[#a94228] text-xs py-2.5">{m.id}</td>
                        <td className="px-4 text-xs text-[#212c46] py-2.5">
                          <p className="font-black uppercase">{m.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold tracking-wider mt-0.5">{m.line}</p>
                        </td>
                        <td className="px-4 text-center py-2.5">
                          <span className={`px-2.5 py-1 rounded text-[9.5px] font-black uppercase tracking-wider border ${
                            m.status === 'Running' 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                              : m.status === 'Idle'
                              ? 'bg-amber-50 text-amber-600 border-amber-100'
                              : 'bg-rose-50 text-rose-600 border-rose-100'
                          }`}>
                            {m.status}
                          </span>
                        </td>
                        <td className="px-4 text-center py-2.5">
                          <p className="font-mono text-xs font-black text-[#212c46]">{m.availability.toFixed(1)} %</p>
                          <p className="text-[9px] text-slate-400 font-bold">{m.operatingMins} / {m.plannedMins} min</p>
                        </td>
                        <td className="px-4 text-center py-2.5">
                          <p className="font-mono text-xs font-black text-[#212c46]">{m.performance.toFixed(1)} %</p>
                          <p className="text-[9px] text-slate-400 font-bold">ideal: {m.idealCycleTime} min/unit</p>
                        </td>
                        <td className="px-4 text-center py-2.5">
                          <p className="font-mono text-xs font-black text-[#212c46]">{m.quality.toFixed(1)} %</p>
                          <p className="text-[9px] text-slate-400 font-bold">defects: {m.defectOutput} / total: {m.actualOutput}</p>
                        </td>
                        <td className="px-4 text-center py-2.5">
                          <div className="flex flex-col items-center justify-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-black font-mono border ${
                              oeePass 
                                ? 'bg-emerald-50/70 text-emerald-600 border-emerald-200' 
                                : oeeFail
                                ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse'
                                : 'bg-amber-50 text-amber-600 border-amber-200'
                            }`}>
                              {m.oee.toFixed(1)} %
                            </span>
                          </div>
                        </td>
                        <td className="px-4 text-center py-2.5">
                          <button 
                            onClick={() => {
                              setSelectedMachine({ ...m });
                              setIsOverrideOpen(true);
                            }}
                            className="bg-[#212c46]/10 hover:bg-[#212c46] text-[#212c46] hover:text-white p-2 rounded-lg transition-all inline-flex items-center justify-center active:scale-95"
                            title="Override Parameters"
                          >
                            <Icons.SlidersHorizontal size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className="text-center text-xs font-black text-slate-400 uppercase tracking-widest py-2.5 px-4">
                      <Icons.Database className="mx-auto text-slate-300 mb-2" size={32} />
                      No equipment records found matching query
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* PARAMETERS OVERRIDE MODAL */}
      {isOverrideOpen && selectedMachine && (
        <DraggableModal
          isOpen={isOverrideOpen}
          onClose={() => setIsOverrideOpen(false)}
          title="SIMULATE MACHINE OVERRIDES"
          width="500px"
          customHeader={
            <div className="bg-[#212c46] px-6 py-4 flex justify-between items-center shrink-0 border-b-2 border-[#b7a159] modal-handle cursor-move w-full select-none">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/20 shadow-sm">
                  <Icons.SlidersHorizontal size={18} className="text-[#b7a159]" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-[#d7d7d7] uppercase tracking-widest leading-none">Simulate Machine Override</h3>
                  <p className="text-[10px] font-bold text-[#b7a159] uppercase tracking-widest mt-1.5">{selectedMachine.id} &bull; {selectedMachine.name}</p>
                </div>
              </div>
              <button onClick={() => setIsOverrideOpen(false)} className="text-white/50 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-1.5 rounded-lg outline-none">
                <Icons.X size={16} />
              </button>
            </div>
          }
        >
          <div className="p-6 space-y-4 font-sans">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Machine Work Status</label>
              <select 
                value={selectedMachine.status}
                onChange={e => setSelectedMachine({ ...selectedMachine, status: e.target.value })}
                className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-xs font-bold text-[#212c46] outline-none focus:border-[#b7a159] cursor-pointer"
              >
                <option value="Running">Running (ทำงานปกติ)</option>
                <option value="Idle">Idle (สแตนบายไม่มีพาร์ต)</option>
                <option value="Stopped">Stopped (หยุดฉุกเฉิน/ชำรุด)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Operating Mins (นาทีทำงานจริง)</label>
                <input 
                  type="number" 
                  value={selectedMachine.operatingMins}
                  onChange={e => setSelectedMachine({ ...selectedMachine, operatingMins: Number(e.target.value) })}
                  className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-xs font-mono font-black text-[#212c46] outline-none focus:border-[#b7a159]" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Planned Mins (เวลากำหนดในแผน)</label>
                <input 
                  type="number" 
                  value={selectedMachine.plannedMins}
                  onChange={e => setSelectedMachine({ ...selectedMachine, plannedMins: Number(e.target.value) })}
                  className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-xs font-mono font-black text-[#212c46] outline-none focus:border-[#b7a159]" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Ideal Cycle Time (วิ/ชิ้น)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={selectedMachine.idealCycleTime}
                  onChange={e => setSelectedMachine({ ...selectedMachine, idealCycleTime: Number(e.target.value) })}
                  className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-xs font-mono font-black text-[#212c46] outline-none focus:border-[#b7a159]" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5 font-bold">Actual Total Output</label>
                <input 
                  type="number" 
                  value={selectedMachine.actualOutput}
                  onChange={e => setSelectedMachine({ ...selectedMachine, actualOutput: Number(e.target.value) })}
                  className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-xs font-mono font-black text-[#212c46] outline-none focus:border-[#b7a159]" 
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Defect / Waste Output (นับชิ้นเสียสูญเสีย)</label>
              <input 
                type="number" 
                value={selectedMachine.defectOutput}
                onChange={e => setSelectedMachine({ ...selectedMachine, defectOutput: Number(e.target.value) })}
                className="w-full bg-red-50/50 border border-red-100 rounded-xl px-4 py-2.5 text-xs font-mono font-black text-[#932c2e] outline-none focus:border-red-300" 
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 mt-6">
              <button 
                className="bg-slate-50 border border-[#eaeaec] hover:bg-slate-100 text-slate-500 px-5 py-2.5 rounded-xl font-bold text-[10.5px] uppercase tracking-wider transition-colors active:scale-95" 
                onClick={() => setIsOverrideOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="bg-[#212c46] hover:bg-[#a94228] text-white px-6 py-2.5 rounded-xl font-black text-[10.5px] uppercase tracking-widest transition-all active:scale-95" 
                onClick={() => handleSaveOverride(selectedMachine)}
              >
                Apply Parameters
              </button>
            </div>
          </div>
        </DraggableModal>
      )}

      {/* CONFIGURATOR WIZARD MODAL (Standardized 100% with UserPermissions specs) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#212c46]/60 backdrop-blur-sm p-4 animate-fadeIn">
          <DraggableModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            width="max-w-[850px]"
            customHeader={
              <div className="bg-[#212c46] px-6 py-4 flex justify-between items-center shrink-0 border-b-2 border-[#b7a159] modal-handle cursor-move w-full select-none">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/20 shadow-sm shrink-0">
                    <Icons.Settings size={20} className="text-[#b7a159]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#d7d7d7] uppercase tracking-widest leading-none">Configure OEE Analytical Standards</h3>
                    <p className="text-[10px] font-bold text-[#b7a159] uppercase tracking-widest mt-1.5">Define world class targets, formulas, and alert parameters</p>
                  </div>
                </div>
                <button onClick={() => setIsSettingsOpen(false)} className="text-white/50 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-1.5 rounded-lg active:scale-90 outline-none">
                  <Icons.X size={18} />
                </button>
              </div>
            }
          >
            <div className="flex flex-col md:flex-row overflow-hidden bg-[#f8f9fa] h-[460px] font-sans">
              
              {/* Wizard Nav Menu Column */}
              <div className="w-full md:w-56 bg-white border-b md:border-b-0 md:border-r border-[#eaeaec] flex flex-row md:flex-col shrink-0 text-left select-none">
                <div className="hidden md:block px-5 py-4 text-[10px] font-black text-[#7a8b95] uppercase tracking-widest border-b border-[#eaeaec] bg-[#f8f9fa]">
                  OEE Variables Menu
                </div>
                
                {[0, 1, 2].map(step => (
                  <button
                    key={step}
                    onClick={() => setSettingsStep(step)}
                    className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 px-5 py-4 text-left transition-all md:border-l-4 outline-none ${
                      settingsStep === step 
                        ? 'border-b-4 md:border-b-0 border-[#b7a159] bg-[#f8f9fa] text-[#212c46]' 
                        : 'border-transparent text-[#7a8b95] hover:bg-[#f8f9fa]/50'
                    }`}
                  >
                    {step === 0 && <Icons.Target size={14} className={settingsStep === step ? 'text-[#b7a159]' : 'text-[#7a8b95]'} />}
                    {step === 1 && <Icons.ShieldAlert size={14} className={settingsStep === step ? 'text-[#b7a159]' : 'text-[#7a8b95]'} />}
                    {step === 2 && <Icons.Cpu size={14} className={settingsStep === step ? 'text-[#b7a159]' : 'text-[#7a8b95]'} />}
                    <span className="text-[10.5px] font-black uppercase tracking-widest font-mono">
                      STEP {step + 1}: {step === 0 ? 'Targets' : step === 1 ? 'Safeguards' : 'Formula Engines'}
                    </span>
                  </button>
                ))}
              </div>

              {/* Wizard step contents */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white select-none">
                
                {/* STEP 1: TARGET THRESHOLDS */}
                {settingsStep === 0 && (
                  <div className="space-y-5 animate-fadeIn">
                    <h4 className="text-[12px] font-black text-[#212c46] uppercase border-b-2 border-slate-100 pb-2.5 tracking-wider">Step 1: OEE World Class Targets</h4>
                    
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[10px] font-black text-[#7a8b95] uppercase tracking-widest">Global OEE Target (เกณฑ์ระดับสากล)</label>
                        <span className="text-xs font-mono font-black text-[#657f4d] bg-green-50 border border-green-100 px-2 py-0.5 rounded">{tempSettings.targetOee}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="95"
                        value={tempSettings.targetOee}
                        onChange={e => setTempSettings({ ...tempSettings, targetOee: Number(e.target.value) })}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#212c46]"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[9px] font-black text-[#7a8b95] uppercase tracking-wider mb-1">Availability %</label>
                        <input
                          type="number"
                          value={tempSettings.targetAvailability}
                          onChange={e => setTempSettings({ ...tempSettings, targetAvailability: Number(e.target.value) })}
                          className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-lg p-2 text-center text-xs font-bold font-mono text-[#212c46]"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-[#7a8b95] uppercase tracking-wider mb-1">Performance %</label>
                        <input
                          type="number"
                          value={tempSettings.targetPerformance}
                          onChange={e => setTempSettings({ ...tempSettings, targetPerformance: Number(e.target.value) })}
                          className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-lg p-2 text-center text-xs font-bold font-mono text-[#212c46]"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-[#7a8b95] uppercase tracking-wider mb-1">Quality %</label>
                        <input
                          type="number"
                          value={tempSettings.targetQuality}
                          onChange={e => setTempSettings({ ...tempSettings, targetQuality: Number(e.target.value) })}
                          className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-lg p-2 text-center text-xs font-bold font-mono text-[#212c46]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: SAFEGUARDS */}
                {settingsStep === 1 && (
                  <div className="space-y-4 animate-fadeIn">
                    <h4 className="text-[12px] font-black text-[#212c46] uppercase border-b-2 border-slate-100 pb-2.5 tracking-wider">Step 2: Controls & Safety Rules</h4>
                    
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <div>
                        <span className="text-xs font-black text-[#212c46] block uppercase tracking-tight">Supervisor Signature Over Low OEE</span>
                        <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">ต้องการลายมือเซ็นหัวหน้าเมื่อค่าสัมประสิทธิ์ต่ำกว่าขั้นระบุ</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={tempSettings.supervisorSignature}
                        onChange={e => setTempSettings({ ...tempSettings, supervisorSignature: e.target.checked })}
                        className="w-4 h-4 text-[#212c46] border-[#eaeaec] rounded accent-[#212c46] cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <div>
                        <span className="text-xs font-black text-[#212c46] block uppercase tracking-tight">Warning Trigger Limit</span>
                        <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">ขีดจำกัดแจ้งไฟระดับเหลืองเสื่อมคุณภาพ</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={tempSettings.warningThreshold}
                          onChange={e => setTempSettings({ ...tempSettings, warningThreshold: Number(e.target.value) })}
                          className="w-14 bg-white border border-[#eaeaec] rounded px-2 py-1 text-center font-bold text-xs font-mono text-[#a94228]"
                        />
                        <span className="text-xs font-bold text-slate-400">%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <div>
                        <span className="text-xs font-black text-[#212c46] block uppercase tracking-tight">Standard Shift Hours</span>
                        <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">เวลาทำงานต่อกะมาตรฐานชั่วโมง</span>
                      </div>
                      <select
                        value={tempSettings.shiftDurationHours}
                        onChange={e => setTempSettings({ ...tempSettings, shiftDurationHours: Number(e.target.value) })}
                        className="bg-white border border-[#eaeaec] rounded px-2 py-1 font-bold text-xs text-[#212c46]"
                      >
                        <option value={8}>8 Hours Standard Shift</option>
                        <option value={12}>12 Hours Extended Shift</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* STEP 3: ENGINES */}
                {settingsStep === 2 && (
                  <div className="space-y-4 animate-fadeIn">
                    <h4 className="text-[12px] font-black text-[#212c46] uppercase border-b-2 border-slate-100 pb-2.5 tracking-wider">Step 3: Analytical Engine & Dispatch</h4>
                    
                    <div>
                      <label className="block text-[10px] font-black text-[#7a8b95] uppercase tracking-widest mb-1.5">Calculation Standards</label>
                      <div className="grid grid-cols-2 gap-3.5">
                        {[
                          { val: 'standard-semi', label: 'SEMI Standard Compliant', desc: 'Global semiconductor and MES engineering guidelines' },
                          { val: 'custom-mes', label: 'Custom MES Algorithm', desc: 'Modified for custom batch weight variances' },
                        ].map(alg => (
                          <div
                            key={alg.val}
                            onClick={() => setTempSettings({ ...tempSettings, formulaEngine: alg.val })}
                            className={`p-4 border rounded-xl cursor-pointer transition-all ${
                              tempSettings.formulaEngine === alg.val
                                ? 'border-[#b7a159] bg-[#b7a159]/5'
                                : 'border-[#eaeaec] bg-white hover:border-[#b7a159]'
                            }`}
                          >
                            <span className="text-xs font-black text-[#212c46] block uppercase tracking-tight">{alg.label}</span>
                            <span className="text-[10px] text-slate-400 font-semibold block mt-1 leading-normal">{alg.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Save bar */}
            <div className="bg-slate-50 border-t border-[#eaeaec] flex justify-end gap-3 px-8 py-4.5 shrink-0 select-none">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="bg-white border border-[#eaeaec] hover:bg-slate-100 px-5 py-2.5 rounded-xl font-bold text-[10.5px] uppercase tracking-wider transition-colors active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveSettingsConfig}
                className="bg-[#212c46] hover:bg-[#3f809e] text-white px-6 py-2.5 rounded-xl font-black text-[10.5px] uppercase tracking-widest shadow-md transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Icons.Save size={13} className="text-[#b7a159]" /> Save Settings
              </button>
            </div>
          </DraggableModal>
        </div>
      )}

    </div>
  );
}
