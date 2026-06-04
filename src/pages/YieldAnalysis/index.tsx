import React, { useState, useMemo } from 'react';
import * as Icons from 'lucide-react';
import Swal from 'sweetalert2';
import { DraggableModal } from '../../components/shared/DraggableModal';
import KpiCard from '../../components/shared/KpiCard';
import { UserGuidePanel } from '../../components/shared/UserGuidePanel';
import UserGuideButton from '../../components/shared/UserGuideButton';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';

// --- SYSTEM COLOR PALETTE (Aligned with Main Home Theme & Dashboard Colors) ---
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

// --- MOCK BATCHES YIELD DATA (100% PRESERVED & INSPIRED BY FOOD MES PROCESS) ---
const INITIAL_YIELD_BATCHES = [
  {
    batchId: 'BAT-SMC-01',
    product: 'Smoked Sausage SFG',
    category: 'Sausage',
    rawInputKg: 1500,
    cookedOutputKg: 1350, // 90% (process shrink)
    finalPackedKg: 1327, // 88.5% total yield
    line: 'Line A',
    status: 'Optimal'
  },
  {
    batchId: 'BAT-MTB-02',
    product: 'Pork Meatball SFG',
    category: 'Meatball',
    rawInputKg: 1000,
    cookedOutputKg: 970, // 97%
    finalPackedKg: 950, // 95% total yield
    line: 'Line B',
    status: 'Optimal'
  },
  {
    batchId: 'BAT-BOL-04',
    product: 'Bologna SFG',
    category: 'Bologna',
    rawInputKg: 2000,
    cookedOutputKg: 1880, // 94%
    finalPackedKg: 1840, // 92% total yield
    line: 'Line C',
    status: 'Optimal'
  },
  {
    batchId: 'BAT-CHE-09',
    product: 'Cheese Sausage SFG',
    category: 'Sausage',
    rawInputKg: 1200,
    cookedOutputKg: 1092, // 91%
    finalPackedKg: 1068, // 89% total yield
    line: 'Line A',
    status: 'Warning' // low raw-to-final
  },
  {
    batchId: 'BAT-SND-20',
    product: 'Sandwich Ham SFG',
    category: 'Ham',
    rawInputKg: 1800,
    cookedOutputKg: 1782, // 99%
    finalPackedKg: 1764, // 98% total yield
    line: 'Line D',
    status: 'Optimal'
  }
];

// Graph Trend Data (Yield Analysis Trend over past week)
const INITIAL_YIELD_TREND_DATA = [
  { name: 'Mon', averageYield: 91.2, sausageYield: 88.2, meatballYield: 94.5, hamYield: 97.4, target: 92.0 },
  { name: 'Tue', averageYield: 92.5, sausageYield: 89.1, meatballYield: 95.0, hamYield: 97.8, target: 92.0 },
  { name: 'Wed', averageYield: 91.8, sausageYield: 88.0, meatballYield: 94.8, hamYield: 98.1, target: 92.0 },
  { name: 'Thu', averageYield: 93.4, sausageYield: 89.5, meatballYield: 95.8, hamYield: 98.0, target: 92.0 },
  { name: 'Fri', averageYield: 90.5, sausageYield: 87.2, meatballYield: 91.2, hamYield: 97.6, target: 92.0 },
  { name: 'Sat', averageYield: 94.1, sausageYield: 90.8, meatballYield: 96.2, hamYield: 98.5, target: 92.0 },
  { name: 'Sun', averageYield: 92.6, sausageYield: 88.5, meatballYield: 95.1, hamYield: 97.9, target: 92.0 }
];

export default function YieldAnalysis() {
  const [batches, setBatches] = useState(INITIAL_YIELD_BATCHES);
  const [trendData, setTrendData] = useState(INITIAL_YIELD_TREND_DATA);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsStep, setSettingsStep] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Edit batch calculation states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);

  // Configuration Settings (Standard Multi-Step matching UserPermissions layout)
  const [activeSettings, setActiveSettings] = useState({
    globalTargetYield: 92.0,
    sausageTargetYield: 89.0,
    meatballTargetYield: 95.0,
    bolognaTargetYield: 92.0,
    hamTargetYield: 97.5,
    warningYieldThreshold: 90.0,
    requireEscalationBelow: 88.0,
    autoFlagAnomalies: true,
    moistureAdjustmentCoeff: 1.02,
    yieldCalculationFormula: 'mass-balance', // mass-balance | hydration-adjusted
    logLossBreakdown: true,
    notificationDispatch: 'bell-sound'
  });

  const [tempSettings, setTempSettings] = useState({ ...activeSettings });

  // Calculate customized batch parameters dynamically based on current values
  const calculatedBatches = useMemo(() => {
    return batches.map(b => {
      // Total Yield = (finalPackedKg / rawInputKg) * 100
      const totalYield = b.rawInputKg > 0 ? (b.finalPackedKg / b.rawInputKg) * 100 : 0;
      
      // Cooking Yield = (cookedOutputKg / rawInputKg) * 100
      const cookingYield = b.rawInputKg > 0 ? (b.cookedOutputKg / b.rawInputKg) * 100 : 0;
      
      // Packaging Yield = (finalPackedKg / cookedOutputKg) * 100
      const packagingYield = b.cookedOutputKg > 0 ? (b.finalPackedKg / b.cookedOutputKg) * 100 : 0;
      
      // Material Loss sum
      const totalLossKg = Math.max(0, b.rawInputKg - b.finalPackedKg);

      // Determine Category standard from active settings
      let target = activeSettings.globalTargetYield;
      if (b.category === 'Sausage') target = activeSettings.sausageTargetYield;
      else if (b.category === 'Meatball') target = activeSettings.meatballTargetYield;
      else if (b.category === 'Bologna') target = activeSettings.bolognaTargetYield;
      else if (b.category === 'Ham') target = activeSettings.hamTargetYield;

      // Status assessment based on target vs actual yield
      let status = 'Optimal';
      if (totalYield < activeSettings.requireEscalationBelow) {
        status = 'Critical';
      } else if (totalYield < target) {
        status = 'Warning';
      }

      return {
        ...b,
        totalYield,
        cookingYield,
        packagingYield,
        totalLossKg,
        target,
        status
      };
    });
  }, [batches, activeSettings]);

  // General Average Plant Yield Summary
  const overallMetrics = useMemo(() => {
    if (calculatedBatches.length === 0) return { avgYield: 0, totalInput: 0, totalOutput: 0, totalLoss: 0 };
    
    const totalInput = calculatedBatches.reduce((sum, b) => sum + b.rawInputKg, 0);
    const totalOutput = calculatedBatches.reduce((sum, b) => sum + b.finalPackedKg, 0);
    const totalLoss = totalInput - totalOutput;
    const avgYield = totalInput > 0 ? (totalOutput / totalInput) * 100 : 0;

    return {
      avgYield,
      totalInput,
      totalOutput,
      totalLoss
    };
  }, [calculatedBatches]);

  // Filter batches based on search bar
  const filteredBatches = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return calculatedBatches;
    return calculatedBatches.filter(
      b => b.batchId.toLowerCase().includes(q) ||
           b.product.toLowerCase().includes(q) ||
           b.category.toLowerCase().includes(q) ||
           b.line.toLowerCase().includes(q) ||
           b.status.toLowerCase().includes(q)
    );
  }, [calculatedBatches, searchTerm]);

  // Save modified parameters of batch details
  const handleSaveBatchDetails = (updatedData: any) => {
    setBatches(prev => prev.map(b => b.batchId === updatedData.batchId ? {
      ...b,
      rawInputKg: Number(updatedData.rawInputKg),
      cookedOutputKg: Number(updatedData.cookedOutputKg),
      finalPackedKg: Number(updatedData.finalPackedKg),
      product: updatedData.product,
      category: updatedData.category,
      line: updatedData.line
    } : b));
    setIsEditOpen(false);

    // Apply sweet Alert confirming changes
    Swal.fire({
      icon: 'success',
      title: 'ข้อมูล Yield สำเร็จ!',
      text: `ทำการอัปเดตและคำนวณอัตราสุทธิของชุดผลิต ${updatedData.batchId} เรียบร้อย`,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      confirmButtonColor: THEME.primary
    });
  };

  // Sync / Configure wizard settings actions
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
      title: 'บันทึกการตั้งค่า Yield สำเร็จ!',
      text: 'ข้อกำหนดมาตรฐาน Yield และอัตราการความเสี่ยงแบบกำหนดฝ่ายอุตสาหกรรมได้รับการบันทึก',
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

      {/* DETAILED USER MANUAL (Thai & English - Aligning strictly with UserPermissions detailed format) */}
      <UserGuidePanel
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        title="YIELD ANALYSIS GUIDE"
        subtitle="PRODUCTION YIELD & LOSS MANUAL"
      >
        <div className="space-y-8 font-sans">
            <div>
                <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                    <Icons.Scale size={16} className="text-[#3f809e]" /> 1. ภาพรวมการวิเคราะห์ค่า Yield (OVERVIEW)
                </h3>
                <p className="mb-4 text-[#414757]">
                    โมดูลนี้ใช้เพื่อตรวจวัดและรายงาน <strong>Yield (เปอร์เซ็นต์ผลผลิตดี)</strong> ซึ่งเป็นตัวชี้วัดสำคัญที่สุดในการบอกถึง "ความคุ้มค่าและความสูญเสีย" ของเนื้อวัตถุดิบตั้งแต่กระบวนการผสมจนถึงการแพ็ค โดยแบ่งออกเป็น 2 ช่วงหลักคือ:
                </p>
                <div className="space-y-3">
                    <div className="p-3 bg-[#f8f9fa] border border-[#eaeaec] flex items-start gap-4 rounded-xl text-[12px]">
                        <div className="bg-[#b58c4f] text-white p-2 rounded-lg shrink-0"><Icons.Thermometer size={16} /></div>
                        <div>
                            <strong className="text-[#212c46]">Cooking Yield (หลังต้ม/อบ/รมควัน)</strong>
                            <p className="text-[#7a8b95]">น้ำหนักที่ได้หลังต้มเสร็จ เทียบกับ น้ำหนักของเหลวตอนผสม (บอกถึงประสิทธิภาพสูตรและคอลลาเจน)</p>
                        </div>
                    </div>
                    <div className="p-3 bg-[#f8f9fa] border border-[#eaeaec] flex items-start gap-4 rounded-xl text-[12px]">
                        <div className="bg-[#a94228] text-white p-2 rounded-lg shrink-0"><Icons.Package size={16} /></div>
                        <div>
                            <strong className="text-[#212c46]">Packaging Yield (การแพ็คบรรจุ)</strong>
                            <p className="text-[#7a8b95]">น้ำหนักที่บรรจุถุงรอขาย เทียบกับ น้ำหนักตอนเนื้อแช่เย็น (วัดการหั่นตัดเศษหัวท้าย)</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-px bg-[#eaeaec] w-full" />

            <div>
                <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                    <Icons.AlertTriangle size={16} className="text-[#b58c4f]" /> 2. การแจ้งเตือนและระเบียบเกณฑ์ Yield (ALERT LOGIC)
                </h3>
                <p className="mb-4 text-[#414757]">
                    เพื่อให้มาตรฐานเป็นไปตามที่แต่ละประเภทสินค้าตั้งไว้ จะมีการแบ่งเงื่อนไขสีต่างๆ ดังนี้:
                </p>
                <ul className="list-decimal pl-5 space-y-2 text-[#414757] text-[12px]">
                    <li><strong className="text-[#688a58]">Optimal (สีเขียว):</strong> Yield ≥ Target (ได้สัดส่วนตรงตามเป้าหมายของบริษัท) ปล่อยผ่านได้ทันที</li>
                    <li><strong className="text-[#b58c4f]">Warning (สีเหลือง):</strong> Yield ตกจากเป้าหมายเล็กน้อย ระบบจะแจ้งให้ทีมวิเคราะห์ค้นหาสาเหตุของการคลาดเคลื่อนไปจากสูตร</li>
                    <li><strong className="text-[#a94228]">Critical (สีแดง):</strong> เกิดของเสียผิดปกติและ Yield ร่วงเกินเส้นวิกฤติ ระบบจะห้ามผ่าน และต้องเรียก Supervisor มาอนุมัติเป็นกรณีพิเศษ</li>
                </ul>
            </div>
        </div>
      </UserGuidePanel>

      {/* DISTINCT UNIFIED HEADER */}
      <div className="h-14 px-4 sm:px-8 flex flex-row items-center justify-between gap-4 z-20 shrink-0">
        <div className="flex items-center gap-5">
          <div className="relative flex items-center justify-center group cursor-default shrink-0">
            <div className="absolute inset-0 bg-[#212c46] blur-[15px] opacity-20 rounded-full group-hover:opacity-60 transition-all duration-700"></div>
            <div className="relative z-10 p-1.5 border border-[#212c46]/40 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm">
              <Icons.LineChart size={28} strokeWidth={2.5} className="text-[#212c46]" />
            </div>
          </div>
          <div>
            <h3 className="font-black text-[#212c46] uppercase tracking-tighter leading-none font-exception-header" style={{ fontSize: '24px' }}>
              YIELD <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#212c46] to-[#b58c4f]">ANALYSIS</span>
            </h3>
            <p className="text-[11px] font-bold text-[#7a8b95] uppercase tracking-[0.2em] mt-0.5 opacity-80 leading-none">
              MATERIAL COOKING ENHANCEMENT & MASS BALANCE YIELD RECOVERY
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
              <Icons.Scale size={12} className="text-[#a94228]" />
              ENGINE {activeSettings.yieldCalculationFormula.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="mx-auto px-4 sm:px-8 w-full mt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard 
            label="Plant Average Yield" 
            value={`${overallMetrics.avgYield.toFixed(1)} %`} 
            icon="line-chart" 
            colorAccent={overallMetrics.avgYield >= activeSettings.globalTargetYield ? THEME.success : THEME.accent} 
            colorValue={THEME.primary} 
            desc={`Global Target Standard: ${activeSettings.globalTargetYield}%`} 
          />
          <KpiCard 
            label="Total Raw Materials In" 
            value={`${(overallMetrics?.totalInput || 0).toLocaleString()} Kg`} 
            icon="truck" 
            colorAccent={THEME.skyBlue} 
            colorValue={THEME.primary} 
            desc="Cutter input formula mass" 
          />
          <KpiCard 
            label="Packed Yield Weight out" 
            value={`${(overallMetrics?.totalOutput || 0).toLocaleString()} Kg`} 
            icon="package" 
            colorAccent={THEME.gold} 
            colorValue={THEME.primary} 
            desc="Finished stock inventory" 
          />
          <KpiCard 
            label="Operational shrink Loss" 
            value={`${(overallMetrics?.totalLoss || 0).toLocaleString()} Kg`} 
            icon="trending-down" 
            colorAccent="#ec4899" 
            colorValue="#db2777" 
            desc={`Scraprefined cooking shrinks`} 
          />
        </div>

        {/* DOUBLE COLUMN CHARTS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          
          {/* Left Column Yield Trend over 7 days */}
          <div className="lg:col-span-8 bg-white rounded-xl border border-[#eaeaec] p-6 shadow-lg flex flex-col min-h-[400px]">
            <h3 className="font-black text-[#212c46] flex items-center gap-2 uppercase tracking-widest text-xs mb-6 pb-3 border-b border-slate-100">
              <Icons.TrendingUp size={16} className="text-[#a94228]" /> Standard Multi-stage Product Group Yield Trends (7 Days)
            </h3>
            <div className="flex-1 w-full min-h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaec" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#7a8b95', fontWeight: 'bold' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#7a8b95', fontWeight: 'bold' }} domain={[80, 100]} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #eaeaec', fontSize: '11px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }} />
                  <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '15px' }} />
                  <Line type="monotone" dataKey="averageYield" name="Aggregate Average %" stroke={THEME.primary} strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'white' }} activeDot={{ r: 6, fill: THEME.primary, stroke: 'white' }} />
                  <Line type="monotone" dataKey="sausageYield" name="Sausage average %" stroke={THEME.accent} strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="meatballYield" name="Meatball average %" stroke={THEME.success} strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="target" name={`Standard Target (${activeSettings.globalTargetYield}%)`} stroke="#db2777" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Column Target Comparison per batch */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-[#eaeaec] p-6 shadow-lg flex flex-col min-h-[400px]">
            <h3 className="font-black text-[#212c46] flex items-center gap-2 uppercase tracking-widest text-xs mb-6 pb-3 border-b border-slate-100">
              <Icons.BarChart3 size={16} className="text-[#a94228]" /> Yield Performance Matrix
            </h3>
            <div className="flex-1 w-full min-h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={calculatedBatches} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eaeaec" />
                  <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#7a8b95', fontWeight: 'bold' }} />
                  <YAxis type="category" dataKey="batchId" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#212c46', fontWeight: 'bold' }} width={80} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #eaeaec', fontSize: '11px' }} />
                  <Bar dataKey="totalYield" name="Total Yield %" fill={THEME.primaryLight} radius={[0, 8, 8, 0]} barSize={16} />
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
                placeholder="Search Batch ID, Product, Department, Status..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 bg-[#f8f9fa] border border-[#eaeaec] rounded-xl text-xs font-bold text-[#212c46] outline-none focus:border-[#b7a159] shadow-inner transition-colors placeholder-slate-400" 
              />
            </div>
            
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              ACTIVE MANUFACTURING RECORDS: {filteredBatches.length} BATCHES RUNNING
            </span>
          </div>

          <div className="overflow-x-auto custom-scrollbar bg-slate-50">
            <table className="w-full text-left min-w-[1100px] border-collapse bg-white table-font">
              <thead className="sys-table-header">
                <tr className="bg-[#212c46] text-[#d7d7d7]  [#b7a159]">
                  <th className="font-black uppercase tracking-widest ">Batch ID</th>
                  <th className="font-black uppercase tracking-widest ">Product Description</th>
                  <th className="font-black uppercase tracking-widest  text-center">Batch Line</th>
                  <th className="font-black uppercase tracking-widest  text-right">Raw Input weight</th>
                  <th className="font-black uppercase tracking-widest  text-right">Cooking Yield %</th>
                  <th className="font-black uppercase tracking-widest  text-right">Packaging Yield %</th>
                  <th className="font-black uppercase tracking-widest  text-center">Gross Material yield</th>
                  <th className="font-black uppercase tracking-widest  text-center">Status</th>
                  <th className="font-black uppercase tracking-widest text-center">Calibrate Raw</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeaec]">
                {filteredBatches.length > 0 ? (
                  filteredBatches.map(b => {
                    const isOptimal = b.status === 'Optimal';
                    const isWarning = b.status === 'Warning';
                    
                    return (
                      <tr key={b.batchId} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-4 font-mono font-black text-[#a94228] text-xs py-2.5">{b.batchId}</td>
                        <td className="px-4 text-xs text-[#212c46] py-2.5">
                          <p className="font-black uppercase">{b.product}</p>
                          <p className="text-[10px] text-slate-400 font-bold tracking-wider mt-0.5">{b.category} Matrix Standard</p>
                        </td>
                        <td className="px-4 text-center text-xs font-black text-slate-600 uppercase tracking-tight py-2.5">{b.line}</td>
                        <td className="px-4 text-right font-mono text-xs font-black text-[#212c46] py-2.5">
                          {(b.rawInputKg || 0).toLocaleString()} <span className="text-[9px] text-slate-400">Kg</span>
                        </td>
                        <td className="px-4 text-right font-mono text-xs font-black text-[#212c46] py-2.5">
                          <span className="font-bold text-slate-500 mr-2">({b.cookedOutputKg} Kg)</span>
                          {b.cookingYield.toFixed(1)} %
                        </td>
                        <td className="px-4 text-right font-mono text-xs font-black text-[#212c46] py-2.5">
                          <span className="font-bold text-slate-500 mr-2">({b.finalPackedKg} Kg)</span>
                          {b.packagingYield.toFixed(1)} %
                        </td>
                        <td className="px-4 text-center py-2.5">
                          <div className="flex flex-col items-center justify-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-black font-mono border ${
                              isOptimal 
                                ? 'bg-emerald-50/70 text-emerald-600 border-emerald-200' 
                                : isWarning
                                ? 'bg-amber-50 text-amber-600 border-amber-200'
                                : 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse'
                            }`}>
                              {b.totalYield.toFixed(1)} %
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold mt-1">Loss: -{b.totalLossKg} Kg</span>
                          </div>
                        </td>
                        <td className="px-4 text-center py-2.5">
                          <span className={`px-2.5 py-1 rounded text-[9.5px] font-black uppercase tracking-wider border ${
                            isOptimal 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                              : isWarning
                              ? 'bg-amber-50 text-amber-600 border-amber-100'
                              : 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="px-4 text-center py-2.5">
                          <button 
                            onClick={() => {
                              setSelectedBatch({ ...b });
                              setIsEditOpen(true);
                            }}
                            className="bg-[#212c46]/10 hover:bg-[#212c46] text-[#212c46] hover:text-white p-2 rounded-lg transition-all inline-flex items-center justify-center active:scale-95"
                            title="Calibrate Batch weights"
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
                      No registered batch records found matching search
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* PARAMETERS BATCH MASS EDITS MODAL */}
      {isEditOpen && selectedBatch && (
        <DraggableModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          title="CALIBRATE RECIPE BATCH WEIGHTS"
          width="500px"
          customHeader={
            <div className="bg-[#212c46] px-6 py-4 flex justify-between items-center shrink-0 border-b-2 border-[#b7a159] modal-handle cursor-move w-full select-none">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/20 shadow-sm">
                  <Icons.SlidersHorizontal size={18} className="text-[#b7a159]" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-[#d7d7d7] uppercase tracking-widest leading-none">Calibrate Batch Mass</h3>
                  <p className="text-[10px] font-bold text-[#b7a159] uppercase tracking-widest mt-1.5">{selectedBatch.batchId} &bull; {selectedBatch.product}</p>
                </div>
              </div>
              <button onClick={() => setIsEditOpen(false)} className="text-white/50 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-1.5 rounded-lg outline-none">
                <Icons.X size={16} />
              </button>
            </div>
          }
        >
          <div className="p-6 space-y-4 font-sans">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Configure Product SKU</label>
              <input 
                type="text" 
                value={selectedBatch.product}
                onChange={e => setSelectedBatch({ ...selectedBatch, product: e.target.value })}
                className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-xs font-bold text-[#212c46] outline-none focus:border-[#b7a159]" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Machine Batch Line</label>
                <input 
                  type="text" 
                  value={selectedBatch.line}
                  onChange={e => setSelectedBatch({ ...selectedBatch, line: e.target.value })}
                  className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-xs font-bold text-[#212c46] outline-none" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Raw Material In (Kg)</label>
                <input 
                  type="number" 
                  value={selectedBatch.rawInputKg}
                  onChange={e => setSelectedBatch({ ...selectedBatch, rawInputKg: Number(e.target.value) })}
                  className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-xs font-mono font-black text-[#212c46] outline-none focus:border-[#b7a159]" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Cooked Mass Out (Kg)</label>
                <input 
                  type="number" 
                  value={selectedBatch.cookedOutputKg}
                  onChange={e => setSelectedBatch({ ...selectedBatch, cookedOutputKg: Number(e.target.value) })}
                  className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-xs font-mono font-black text-[#212c46] outline-none focus:border-[#b7a159]" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5 font-bold">Packed Mass Out (Kg)</label>
                <input 
                  type="number" 
                  value={selectedBatch.finalPackedKg}
                  onChange={e => setSelectedBatch({ ...selectedBatch, finalPackedKg: Number(e.target.value) })}
                  className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-xs font-mono font-black text-[#212c46] outline-none focus:border-[#b7a159]" 
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 mt-6">
              <button 
                className="bg-slate-50 border border-[#eaeaec] hover:bg-slate-100 text-slate-500 px-5 py-2.5 rounded-xl font-bold text-[10.5px] uppercase tracking-wider transition-colors active:scale-95" 
                onClick={() => setIsEditOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="bg-[#212c46] hover:bg-[#a94228] text-white px-6 py-2.5 rounded-xl font-black text-[10.5px] uppercase tracking-widest transition-all active:scale-95" 
                onClick={() => handleSaveBatchDetails(selectedBatch)}
              >
                Apply Parameters
              </button>
            </div>
          </div>
        </DraggableModal>
      )}

      {/* CONFIGURATOR WIZARD MODAL (100% matched design layout of UserPermissions) */}
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
                    <h3 className="text-sm font-black text-[#d7d7d7] uppercase tracking-widest leading-none">Configure Yield Analytical Rules</h3>
                    <p className="text-[10px] font-bold text-[#b7a159] uppercase tracking-widest mt-1.5">Define category specifics, safety triggers, and balance equations</p>
                  </div>
                </div>
                <button onClick={() => setIsSettingsOpen(false)} className="text-white/50 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-1.5 rounded-lg active:scale-90 outline-none">
                  <Icons.X size={18} />
                </button>
              </div>
            }
          >
            <div className="flex flex-col md:flex-row overflow-hidden bg-[#f8f9fa] h-[460px] font-sans">
              
              {/* Wizard Sidebar Menu Navigation */}
              <div className="w-full md:w-56 bg-white border-b md:border-b-0 md:border-r border-[#eaeaec] flex flex-row md:flex-col shrink-0 text-left select-none">
                <div className="hidden md:block px-5 py-4 text-[10px] font-black text-[#7a8b95] uppercase tracking-widest border-b border-[#eaeaec] bg-[#f8f9fa]">
                  Yield Rules Menu
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
                      STEP {step + 1}: {step === 0 ? 'Yield Values' : step === 1 ? 'Escalations' : 'Balance Engines'}
                    </span>
                  </button>
                ))}
              </div>

              {/* Wizard dynamic step form */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white select-none">
                
                {/* STEP 1: SPECIFIC SECTOR TARGETS */}
                {settingsStep === 0 && (
                  <div className="space-y-4 animate-fadeIn">
                    <h4 className="text-[12px] font-black text-[#212c46] uppercase border-b-2 border-slate-100 pb-2.5 tracking-wider">Step 1: Category Specific Targets</h4>
                    
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[10px] font-black text-[#7a8b95] uppercase tracking-widest">Global Aggregate Target %</label>
                        <span className="text-xs font-mono font-black text-[#657f4d] bg-green-50 border border-green-100 px-2 py-0.5 rounded">{tempSettings.globalTargetYield}%</span>
                      </div>
                      <input
                        type="range"
                        min="80"
                        max="98"
                        value={tempSettings.globalTargetYield}
                        onChange={e => setTempSettings({ ...tempSettings, globalTargetYield: Number(e.target.value) })}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#212c46]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-[9px] font-black text-[#7a8b95] uppercase tracking-wider mb-1">Sausage Target %</label>
                        <input
                          type="number"
                          value={tempSettings.sausageTargetYield}
                          onChange={e => setTempSettings({ ...tempSettings, sausageTargetYield: Number(e.target.value) })}
                          className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-lg p-2.5 text-center text-xs font-bold font-mono text-[#212c46] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-[#7a8b95] uppercase tracking-wider mb-1">Meatball Target %</label>
                        <input
                          type="number"
                          value={tempSettings.meatballTargetYield}
                          onChange={e => setTempSettings({ ...tempSettings, meatballTargetYield: Number(e.target.value) })}
                          className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-lg p-2.5 text-center text-xs font-bold font-mono text-[#212c46] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-[#7a8b95] uppercase tracking-wider mb-1">Bologna Target %</label>
                        <input
                          type="number"
                          value={tempSettings.bolognaTargetYield}
                          onChange={e => setTempSettings({ ...tempSettings, bolognaTargetYield: Number(e.target.value) })}
                          className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-lg p-2.5 text-center text-xs font-bold font-mono text-[#212c46] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-[#7a8b95] uppercase tracking-wider mb-1">Ham Target %</label>
                        <input
                          type="number"
                          value={tempSettings.hamTargetYield}
                          onChange={e => setTempSettings({ ...tempSettings, hamTargetYield: Number(e.target.value) })}
                          className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-lg p-2.5 text-center text-xs font-bold font-mono text-[#212c46] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: SAFETY ESCALATION CRITERIA */}
                {settingsStep === 1 && (
                  <div className="space-y-4 animate-fadeIn">
                    <h4 className="text-[12px] font-black text-[#212c46] uppercase border-b-2 border-slate-100 pb-2.5 tracking-wider">Step 2: Escalations & Guardrails</h4>
                    
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <div>
                        <span className="text-xs font-black text-[#212c46] block uppercase tracking-tight">Auto Flag Low Yield Anomalies</span>
                        <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">แจ้งเตือนระบบเมื่อ Yield ผิดสเปคเฉลี่ยร่วมนัยยะสำคัญ</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={tempSettings.autoFlagAnomalies}
                        onChange={e => setTempSettings({ ...tempSettings, autoFlagAnomalies: e.target.checked })}
                        className="w-4 h-4 text-[#212c46] border-[#eaeaec] rounded accent-[#212c46] cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <div>
                        <span className="text-xs font-black text-[#212c46] block uppercase tracking-tight">Critical Escalation Threshold</span>
                        <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">ขีดจำกัดล่างสุดก่อนระบบประเมินค่าล็อกสีแดง</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={tempSettings.requireEscalationBelow}
                          onChange={e => setTempSettings({ ...tempSettings, requireEscalationBelow: Number(e.target.value) })}
                          className="w-16 bg-white border border-[#eaeaec] rounded-lg px-2.5 py-1 text-center font-bold text-xs font-mono text-[#a94228]"
                        />
                        <span className="text-xs font-bold text-slate-400">%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <div>
                        <span className="text-xs font-black text-[#212c46] block uppercase tracking-tight">Warning Flag Boundary</span>
                        <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">ขีดจำกัดแจ้งไฟเหลือง</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={tempSettings.warningYieldThreshold}
                          onChange={e => setTempSettings({ ...tempSettings, warningYieldThreshold: Number(e.target.value) })}
                          className="w-16 bg-white border border-[#eaeaec] rounded-lg px-2.5 py-1 text-center font-bold text-xs font-mono text-amber-500"
                        />
                        <span className="text-xs font-bold text-slate-400">%</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: EQUATION MODES & NOTIFICATION CHANNELS */}
                {settingsStep === 2 && (
                  <div className="space-y-4 animate-fadeIn">
                    <h4 className="text-[12px] font-black text-[#212c46] uppercase border-b-2 border-slate-100 pb-2.5 tracking-wider">Step 3: Yield Balancing Methods</h4>
                    
                    <div>
                      <label className="block text-[10px] font-black text-[#7a8b95] uppercase tracking-widest mb-1.5">Yield Calculation Models</label>
                      <div className="grid grid-cols-2 gap-3.5">
                        {[
                          { val: 'mass-balance', label: 'Mass Balance Equation', desc: 'Direct raw inputs mapped directly via product package sheets.' },
                          { val: 'hydration-adjusted', label: 'Moisture Compensated', desc: 'Adjust for smokehouse continuous drying & moistures.' },
                        ].map(alg => (
                          <div
                            key={alg.val}
                            onClick={() => setTempSettings({ ...tempSettings, yieldCalculationFormula: alg.val })}
                            className={`p-4 border rounded-xl cursor-pointer transition-all flex flex-col text-left ${
                              tempSettings.yieldCalculationFormula === alg.val
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

                    <div className="border-t border-slate-100 pt-3.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-[10px] font-black text-[#7a8b95] uppercase tracking-widest">Moisture Adjustment Coefficient</label>
                          <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">ตัวคูณคำนวณการสูญเสียของความชื้นหน้าเตา</span>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          value={tempSettings.moistureAdjustmentCoeff}
                          onChange={e => setTempSettings({ ...tempSettings, moistureAdjustmentCoeff: Number(e.target.value) })}
                          className="w-18 bg-[#f8f9fa] border border-[#eaeaec] rounded px-2.5 py-1 text-center font-bold text-xs text-[#212c46] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Save Action Bar */}
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
