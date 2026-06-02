import React, { useState, useEffect, useMemo } from 'react';
import * as Icons from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
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
const MOCK_TEST_TYPES = [
  { id: 'WGT', name: 'Weight & Pack Check', color: '#3f809e', desc: 'ตรวจสอบความถูกต้องและค่าเบี่ยงเบนของน้ำหนักผลิตภัณฑ์สุทธิเพื่อป้องกันการปรับระดับต่ำกว่ามาตรฐาน', unit: 'g' },
  { id: 'CHM', name: 'Chemical & pH level', color: '#657f4d', desc: 'วัดค่าความเป็นกรด-ด่าง (pH) ประเมินสารอาหารและปริมาณสารคงเหลือตามสิทธิบัตรรสชาติ', unit: 'pH' },
  { id: 'VIS', name: 'Visual & Sensory', color: '#b58c4f', desc: 'ตรวจจับคุณสมบัติทางกายภาพภายนอก สี ตะกอน รอยไหม้ หรือส่วนเกินที่ไม่พึงประสงค์', unit: 'Index' },
  { id: 'TEM', name: 'Temperature Guard', color: '#a94228', desc: 'บันทึกอุณหภูมิจุดวิกฤต (CCP) เพื่อยืนยันขั้นตอนการปรุงสุกและการลดอุณหภูมิที่สมบูรณ์', unit: '°C' },
  { id: 'SEL', name: 'Seal & Package Integrity', color: '#932c2e', desc: 'ควบคุมแรงดันและการรั่วซึมของบรรจุภัณฑ์อาหารเพื่อขจัดฝุ่นละอองและแบคทีเรียภายนอก', unit: 'psi' }
];

const INITIAL_QUALITY_LOGS = [
  { id: 'QA-260101', date: '2026-05-28', batchId: 'BT-SGB-2605A', productName: 'Smoked Garlic Bologna 1kg', testTypeId: 'WGT', valueMeasured: '998g', status: 'Passed', inspectedBy: 'QC SUDA', supervisorSig: 'SUDA QUALITY', remarks: 'Under controlled deviation range (995-1005g)' },
  { id: 'QA-260102', date: '2026-05-29', batchId: 'BT-CSW-2605B', productName: 'Cheese Sausage 200g', testTypeId: 'CHM', valueMeasured: 'pH 5.9', status: 'Passed', inspectedBy: 'QC SUDA', supervisorSig: 'SUDA QUALITY', remarks: 'pH level within acceptable benchmark (5.8 - 6.2)' },
  { id: 'QA-260103', date: '2026-05-30', batchId: 'BT-HSW-2605C', productName: 'Hotdog Sausage 150g', testTypeId: 'TEM', valueMeasured: '62.0°C', status: 'Re-work', inspectedBy: 'QC NARONG', supervisorSig: '', remarks: 'Core cooking temperature dropped below critical CCP target limits' },
  { id: 'QA-260104', date: '2026-05-31', batchId: 'BT-VHB-2605D', productName: 'Vienna Ham 2kg', testTypeId: 'SEL', valueMeasured: '3.1 psi', status: 'Passed', inspectedBy: 'QC SUDA', supervisorSig: 'SUDA QUALITY', remarks: 'Sealing vacuum limit passed standard pressure bounds' },
  { id: 'QA-260105', date: '2026-06-01', batchId: 'BT-FCS-2606A', productName: 'Frankfurter Chicken Sausage 500g', testTypeId: 'VIS', valueMeasured: '3% defects', status: 'Scrapped', inspectedBy: 'QC NARONG', supervisorSig: 'SUDA QUALITY', remarks: 'Severe visual casing rupture. Material discarded immediately' }
];

export default function QualityMetrics() {
  const [activeTab, setActiveTab] = useState('list_mode'); // list_mode | analytics_mode
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Target Configurations (Synced with standard pattern from User Permissions)
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configStep, setConfigStep] = useState(0);
  
  // Settings values (Standard layout configuration)
  const [settings, setSettings] = useState({
    maxDefectRateLimit: 2.0,      // % Maximum defect rate
    minFtqTargetLimit: 97.5,      // % First-Time-Quality Target
    criticalTempCCP: 74.0,        // °C minimum chicken/meat cooking temp
    allowedWeightDevMins: -10,     // g allowable under-weight margin
    requireSigForRejectScrap: true, // Auto-escalated control
    autoEscalateQualityAuditor: true,
    enforceHaccpCompliant: true,
    alertNotificationLevel: 'Critical & High',
    dispatchChannel: 'E-Mail & ERP Gateway'
  });

  // Action / Quality Entry Modals
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [entryStep, setEntryStep] = useState(0);

  // Form Fields for editing/adding quality incidents
  const [formDate, setFormDate] = useState('2026-06-01');
  const [formBatchId, setFormBatchId] = useState('');
  const [formProductName, setFormProductName] = useState('Smoked Garlic Bologna 1kg');
  const [formTestTypeId, setFormTestTypeId] = useState('WGT');
  const [formValueMeasured, setFormValueMeasured] = useState('');
  const [formStatus, setFormStatus] = useState('Passed');
  const [formInspectedBy, setFormInspectedBy] = useState('QC SUDA');
  const [formSupervisorSig, setFormSupervisorSig] = useState('');
  const [formRemarks, setFormRemarks] = useState('');

  // Firestore & local fallback integration
  const { data: fbQualityLogs, add: addQualityLog, update: updateQualityLog } = useCollection<any>('quality_metrics');
  const [localQualityLogs, setLocalQualityLogs] = useState(INITIAL_QUALITY_LOGS);

  const qualityLogs = useMemo(() => {
    const merged = [...fbQualityLogs];
    localQualityLogs.forEach(lq => {
      if (!merged.find(m => m.id === lq.id)) merged.push(lq);
    });
    return merged;
  }, [fbQualityLogs, localQualityLogs]);

  const filteredLogs = useMemo(() => {
    return qualityLogs.filter(qLog => {
      const q = search.toLowerCase();
      return (
        qLog.batchId.toLowerCase().includes(q) ||
        qLog.productName.toLowerCase().includes(q) ||
        qLog.inspectedBy.toLowerCase().includes(q) ||
        qLog.id.toLowerCase().includes(q) ||
        (qLog.remarks && qLog.remarks.toLowerCase().includes(q))
      );
    });
  }, [qualityLogs, search]);

  const currentData = useMemo(() => {
    return filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;

  // Calculators & KPIs
  const totalTestedBatches = useMemo(() => {
    return qualityLogs.length;
  }, [qualityLogs]);

  const rejectScrapCount = useMemo(() => {
    return qualityLogs.filter(item => item.status === 'Re-work' || item.status === 'Scrapped').length;
  }, [qualityLogs]);

  const defectRate = useMemo(() => {
    if (totalTestedBatches === 0) return 0;
    return Number(((rejectScrapCount / totalTestedBatches) * 100).toFixed(2));
  }, [totalTestedBatches, rejectScrapCount]);

  const ftqPercentage = useMemo(() => {
    if (totalTestedBatches === 0) return 100;
    const passes = qualityLogs.filter(item => item.status === 'Passed').length;
    return Number(((passes / totalTestedBatches) * 100).toFixed(1));
  }, [qualityLogs, totalTestedBatches]);

  // Analytics helper charts data
  const chartDataByTestType = useMemo(() => {
    return MOCK_TEST_TYPES.map(type => {
      const occurrences = qualityLogs.filter(log => log.testTypeId === type.id).length;
      const defects = qualityLogs.filter(log => log.testTypeId === type.id && (log.status === 'Re-work' || log.status === 'Scrapped')).length;
      return {
        name: type.name,
        'Tested Samples': occurrences,
        'Defects Detected': defects,
        color: type.color
      };
    }).sort((a, b) => b['Tested Samples'] - a['Tested Samples']);
  }, [qualityLogs]);

  const chartDataByTrend = useMemo(() => {
    const dates = Array.from(new Set(qualityLogs.map(log => log.date))).sort();
    return dates.map(dt => {
      const samples = qualityLogs.filter(log => log.date === dt).length;
      const defects = qualityLogs.filter(log => log.date === dt && (log.status === 'Re-work' || log.status === 'Scrapped')).length;
      const passRate = samples > 0 ? Number((((samples - defects) / samples) * 100).toFixed(1)) : 100;
      return {
        date: dt,
        'Pass Rate (%)': passRate,
      };
    });
  }, [qualityLogs]);

  // Close & Save policy Handler
  const handleSaveConfig = () => {
    setShowConfigModal(false);
  };

  // Modify / Save Incident log entry handler
  const handleSaveEntry = async () => {
    const dataObj = {
      date: formDate,
      batchId: formBatchId || 'BT-' + Date.now().toString().slice(-6),
      productName: formProductName,
      testTypeId: formTestTypeId,
      valueMeasured: formValueMeasured || 'Not Assessed',
      status: formStatus,
      inspectedBy: formInspectedBy,
      supervisorSig: formSupervisorSig,
      remarks: formRemarks || 'Standard verification complete'
    };

    if (editingEntry) {
      if (typeof editingEntry.id === 'string' && editingEntry.id.length > 10) {
        await updateQualityLog(editingEntry.id, dataObj);
      } else {
        setLocalQualityLogs(prev => prev.map(item => item.id === editingEntry.id ? { ...item, ...dataObj } : item));
      }
    } else {
      const newId = `QA-${Date.now().toString().slice(-6)}`;
      try {
        await addQualityLog({ id: newId, ...dataObj });
      } catch (e) {
        setLocalQualityLogs(prev => [{ id: newId, ...dataObj }, ...prev]);
      }
    }
    setShowEntryModal(false);
    setEditingEntry(null);
  };

  const openAddModal = () => {
    setEditingEntry(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormBatchId('');
    setFormProductName('Smoked Garlic Bologna 1kg');
    setFormTestTypeId('WGT');
    setFormValueMeasured('');
    setFormStatus('Passed');
    setFormInspectedBy('QC SUDA');
    setFormSupervisorSig('');
    setFormRemarks('');
    setEntryStep(0);
    setShowEntryModal(true);
  };

  const openEditModal = (entry: any) => {
    setEditingEntry(entry);
    setFormDate(entry.date);
    setFormBatchId(entry.batchId);
    setFormProductName(entry.productName);
    setFormTestTypeId(entry.testTypeId);
    setFormValueMeasured(entry.valueMeasured);
    setFormStatus(entry.status);
    setFormInspectedBy(entry.inspectedBy);
    setFormSupervisorSig(entry.supervisorSig || '');
    setFormRemarks(entry.remarks || '');
    setEntryStep(0);
    setShowEntryModal(true);
  };

  return (
    <div className="flex flex-1 w-full flex-col animate-fadeIn bg-transparent space-y-4">
      {/* USER GUIDE FLOATING BUTTON & PANEL */}
      <UserGuideButton onClick={() => setIsGuideOpen(true)} />

      <UserGuidePanel isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} title="QUALITY METRICS GUIDE" subtitle="QUALITY CONTROL & STANDARDS MANUAL">
        <div className="space-y-8 font-sans">
            <div>
                <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                    <Icons.FileCheck size={16} className="text-[#3f809e]" /> 1. ภาพรวมการควบคุมคุณภาพ (QUALITY OVERVIEW)
                </h3>
                <p className="mb-4 text-[#414757]">
                    โมดูลนี้ใช้เพื่อบันทึกและประเมินคุณภาพของกระบวนการผลิต (Quality Audit) ข้อมูลที่ป้อนเข้ามาจะถูกนำไปใช้วิเคราะห์คุณภาพสินค้าโดยรวม และเชื่อมโยงกับการแจ้งเตือนหากค่าทะลุเกณฑ์ (Limit Alert)
                </p>
                <div className="p-4 bg-[#f8f9fa] border border-[#eaeaec] rounded-xl text-[#414757] text-[12px]">
                    <strong>Note:</strong> เป้าหมายหลักของโรงงานคือ <strong>FTQ (First Time Quality)</strong> ต้อง {'>'}= {settings.minFtqTargetLimit}% และ <strong>Defect Rate</strong> ต้อง {'<'}= {settings.maxDefectRateLimit}% ตามมาตรฐาน ISO 22000
                </div>
            </div>

            <div className="h-px bg-[#eaeaec] w-full" />

            <div>
                <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                    <Icons.ShieldAlert size={16} className="text-[#b58c4f]" /> 2. หมวดหมู่การสุ่มตรวจ (TESTING CATEGORIES)
                </h3>
                <div className="space-y-3">
                    <div className="flex items-center gap-3"><div className="p-1 border border-[#eaeaec] rounded bg-[#f8f9fa] text-[10px] font-bold text-[#b58c4f]">Microbio</div><span className="text-[#414757] text-[12px]">การตรวจเชื้อจุลินทรีย์ และ Food Safety (ผล Lab)</span></div>
                    <div className="flex items-center gap-3"><div className="p-1 border border-[#eaeaec] rounded bg-[#f8f9fa] text-[10px] font-bold text-[#3f809e]">Physical</div><span className="text-[#414757] text-[12px]">รอยแตก, สี, กลิ่น, รูปร่างภายนอก</span></div>
                    <div className="flex items-center gap-3"><div className="p-1 border border-[#eaeaec] rounded bg-[#f8f9fa] text-[10px] font-bold text-[#a94228]">Chemical</div><span className="text-[#414757] text-[12px]">ค่า pH, ความชื้น, ปริมาณเกลือ/โซเดียม</span></div>
                    <div className="flex items-center gap-3"><div className="p-1 border border-[#eaeaec] rounded bg-[#f8f9fa] text-[10px] font-bold text-[#688a58]">Temp (CCP)</div><span className="text-[#414757] text-[12px]">อุณหภูมิสุกจุดกึ่งกลาง (Core Temp.) ขั้นต่ำต้องได้ {settings.criticalTempCCP}°C</span></div>
                </div>
            </div>

            <div className="h-px bg-[#eaeaec] w-full" />

            <div>
                <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                    <Icons.AlertTriangle size={16} className="text-[#a94228]" /> 3. สถานะของผลิตภัณฑ์ที่ตรวจสอบ (STATUS LOGS)
                </h3>
                <p className="mb-4 text-[#414757]">
                    เวลาบันทึกรายการ Audit ผู้ตรวจต้องระบุสถานะปลายทางไว้ 3 แบบ:
                </p>
                <ul className="list-decimal pl-5 space-y-2 text-[#414757] text-[12px]">
                    <li><strong className="text-[#688a58]">Passed:</strong> ผ่านเกณฑ์คุณภาพทั้งหมด ปล่อยผ่านไปขั้นตอนถัดไปได้ทันที</li>
                    <li><strong className="text-[#b58c4f]">Rework:</strong> ไม่ผ่านเกณฑ์มาตรฐาน แต่ยังสามารถนำกลับไปทำการแก้ไขใหม่ได้ (เช่น ปรุงรสเพิ่ม หรือซีลถุงใหม่)</li>
                    <li><strong className="text-[#a94228]">Scrapped:</strong> สินค้ามีปัญหาปนเปื้อน หรือวิกฤตความปลอดภัย ต้องทิ้งหรือทำลายสถานเดียว (ห้ามกลับมาใช้ใหม่)</li>
                </ul>
            </div>
        </div>
      </UserGuidePanel>

      {/* HEADER SECTION */}
      <div className="h-14 px-4 sm:px-8 flex flex-row items-center justify-between gap-4 z-20 shrink-0">
        <div className="flex items-center gap-5">
          <div className="relative flex items-center justify-center group cursor-default shrink-0">
            <div className="absolute inset-0 bg-[#657f4d] blur-[15px] opacity-20 rounded-full group-hover:opacity-60 transition-all duration-700"></div>
            <div className="relative z-10 p-1.5 border border-[#657f4d]/40 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm">
              <Icons.Award size={28} strokeWidth={2.5} className="text-[#657f4d]" />
            </div>
          </div>
          <div>
            <h3 className="font-black text-[#212c46] uppercase tracking-tighter leading-none font-exception-header text-[24px]">
              QUALITY <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#657f4d] to-[#b58c4f]">METRICS</span> STATION
            </h3>
            <p className="text-[11px] font-bold text-[#4d5a44] uppercase tracking-[0.2em] mt-0.5 opacity-80 leading-none">
              HACCP CONTROL POINTS & FIRST TIME QUALITY HUB
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-white/50 p-1.5 rounded-xl border border-white/60 shadow-inner flex flex-wrap items-center gap-1">
            <button onClick={() => setActiveTab('list_mode')} className={`px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'list_mode' ? 'bg-[#212c46] text-white shadow-md' : 'text-[#7a8b95] hover:text-[#657f4d]'}`}>
              <Icons.ClipboardCheck size={16} /> Inspection log
            </button>
            <button onClick={() => setActiveTab('analytics_mode')} className={`px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'analytics_mode' ? 'bg-[#212c46] text-white shadow-md' : 'text-[#7a8b95] hover:text-[#657f4d]'}`}>
              <Icons.LineChart size={16} /> Quality Pareto
            </button>
          </div>
          <button onClick={() => setShowConfigModal(true)} className="bg-white border border-[#eaeaec] text-[#212c46] hover:text-[#657f4d] hover:border-[#657f4d] p-2.5 rounded-xl shadow-sm hover:shadow-md active:scale-95 transition-all">
            <Icons.Settings size={18} />
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="mx-auto px-4 sm:px-8 w-full mt-[2px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 shrink-0">
          <KpiCard label="Defect Rate (%)" value={`${defectRate}%`} icon="percent" colorAccent={defectRate > settings.maxDefectRateLimit ? THEME.danger : THEME.success} colorValue={THEME.primary} desc={`Target max: < ${settings.maxDefectRateLimit}%`} />
          <KpiCard label="FTQ Quality Index" value={`${ftqPercentage}%`} icon="award" colorAccent={ftqPercentage >= settings.minFtqTargetLimit ? THEME.success : THEME.gold} colorValue={THEME.primary} desc={`Target pass: > ${settings.minFtqTargetLimit}%`} />
          <KpiCard label="Active Reject/Scrap" value={`${rejectScrapCount} Batches`} icon="alert-octagon" colorAccent={rejectScrapCount > 0 ? THEME.danger : THEME.success} colorValue={THEME.primary} desc="Requires supervisor audit action" />
          <KpiCard label="HACCP Compliance" value="VERIFIED" icon="shield-check" colorAccent={THEME.success} colorValue={THEME.success} desc="Under strict safe bounds" />
        </div>

        {/* LIST VIEW TAB */}
        {activeTab === 'list_mode' ? (
          <div className="bg-white rounded-xl shadow-lg border border-[#eaeaec] overflow-hidden flex flex-col animate-fadeIn">
            {/* SEARCH AND CONTROLS HEADER */}
            <div className="px-4 py-4 border-b border-[#eaeaec] bg-white flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-black text-[#7a8b95] uppercase tracking-widest bg-white border border-[#eaeaec] px-4 py-2 rounded-xl shadow-sm">
                  Filter Compliance Levels
                </span>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                  <Icons.Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#7a8b95]" />
                  <input type="text" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} placeholder="Search batch, product or inspectors..." className="w-full pl-12 pr-6 py-2.5 text-[12px] border border-[#eaeaec] rounded-full font-bold outline-none focus:border-[#657f4d] bg-white shadow-sm text-[#212c46]" />
                </div>
                <button onClick={openAddModal} className="bg-[#212c46] hover:bg-[#657f4d] text-white px-6 py-2.5 rounded-full font-black text-[12px] uppercase tracking-widest shadow-md transition-all flex items-center gap-2 shrink-0 border border-[#212c46]">
                  <Icons.CheckSquare size={16} /> Log Verification
                </button>
              </div>
            </div>

            {/* MAIN DATA TABLE */}
            <div className="overflow-auto custom-scrollbar">
              <table className="w-full text-left border-collapse table-font">
                <thead className="sys-table-header [#b7a159] ">
                    <tr>
                    <th className="font-black uppercase tracking-widest whitespace-nowrap   ">ID / Date</th>
                    <th className="font-black uppercase tracking-widest whitespace-nowrap   ">Batch ID / Product</th>
                    <th className="font-black uppercase tracking-widest whitespace-nowrap   ">Inspection Category</th>
                    <th className="font-black uppercase tracking-widest whitespace-nowrap   ">Measured Value</th>
                    <th className="font-black uppercase tracking-widest text-center whitespace-nowrap   ">Inspector</th>
                    <th className="font-black uppercase tracking-widest text-center whitespace-nowrap   ">QA Supervisor Sig</th>
                    <th className="font-black uppercase tracking-widest text-center   ">Status</th>
                    <th className="font-black uppercase tracking-widest text-center   ">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#eaeaec]">
                  {currentData.length === 0 ? (
                    <tr>
                      <td className="text-center text-[#7a8b95] uppercase font-black tracking-widest text-[12px] py-2.5 px-4">No tracked quality inspection logs located</td>
                    </tr>
                  ) : (
                    currentData.map(log => {
                      const testType = MOCK_TEST_TYPES.find(t => t.id === log.testTypeId) || MOCK_TEST_TYPES[0];
                      const isDefected = log.status === 'Re-work' || log.status === 'Scrapped';
                      const requiresSignature = settings.requireSigForRejectScrap && isDefected && !log.supervisorSig;

                      return (
                        <tr key={log.id} className="hover:bg-[#f8f9fa] transition-colors group">
                          <td className="sys-table-td font-mono font-black text-[#212c46] py-2.5 px-4">
                            <div className="flex flex-col">
                              <span>{log.id}</span>
                              <span className="text-[10px] text-[#7a8b95] font-bold">{log.date}</span>
                            </div>
                          </td>
                          <td className="sys-table-td py-2.5 px-4">
                            <div className="flex flex-col">
                              <span className="font-black uppercase text-[#212c46] text-[12px]">{log.productName}</span>
                              <span className="text-[10px] text-[#3f809e] font-bold tracking-wider uppercase">{log.batchId}</span>
                            </div>
                          </td>
                          <td className="sys-table-td py-2.5 px-4">
                            <span className="inline-flex items-center gap-[1px] px-3 py-1 rounded-full text-[10px] font-black uppercase text-white shadow-sm" style={{ backgroundColor: testType.color }}>
                              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                              {testType.name}
                            </span>
                          </td>
                          <td className="sys-table-td py-2.5 px-4">
                            <div className="flex flex-col">
                              <span className="font-black text-[#212c46] text-[12px]">{log.valueMeasured}</span>
                              <span className="text-[10px] text-[#7a8b95] font-bold max-w-[200px] truncate" title={log.remarks}>{log.remarks}</span>
                            </div>
                          </td>
                          <td className="sys-table-td text-center font-bold text-[#414757] text-[12px] py-2.5 px-4">
                            {log.inspectedBy}
                          </td>
                          <td className="sys-table-td text-center font-black py-2.5 px-4">
                            {log.supervisorSig ? (
                              <span className="inline-flex items-center gap-[1px] text-[#657f4d] text-[11px] font-black bg-[#657f4d]/10 px-2.5 py-1 rounded-lg border border-[#657f4d]/20 uppercase tracking-widest">
                                <Icons.CheckCircle size={12} /> {log.supervisorSig}
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
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${log.status === 'Passed' ? 'bg-[#657f4d]/20 text-[#657f4d] border border-[#657f4d]/30' : log.status === 'Re-work' ? 'bg-[#b58c4f]/20 text-[#b58c4f] border border-[#b58c4f]/30' : 'bg-[#932c2e]/10 text-[#d96245] border border-[#932c2e]/30'}`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="sys-table-td text-center py-2.5 px-4">
                            <div className="flex justify-center items-center gap-[1px]">
                              <button onClick={() => openEditModal(log)} className="sys-table-action-btn w-8 h-8 text-[#4d87a8] hover:bg-[#4d87a8]/10 border-transparent transition-all">
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
                <p className="bg-white px-4 py-2 rounded-xl border border-[#eaeaec] shadow-sm">Total: {filteredLogs.length} inspections</p>
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
            {/* QUALITY PARETO BARS */}
            <div className="lg:col-span-6 bg-white p-6 rounded-xl shadow-lg border border-[#eaeaec]">
              <div className="border-b-2 border-[#b7a159] pb-4 mb-6">
                <h4 className="text-[14px] font-black uppercase text-[#212c46] tracking-widest flex items-center gap-3">
                  <Icons.BarChart3 size={20} className="text-[#657f4d]" /> Inspection Category Distribution & Defects
                </h4>
                <p className="text-[11px] font-bold text-[#7a8b95] uppercase tracking-widest mt-1">เปรียบเทียบสัดส่วนและปริมาณของเสียที่ตรวจพบจำแนกตามประเภทกิจกรรมการดําเนินงาน</p>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataByTestType} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaec" />
                    <XAxis dataKey="name" stroke="#7a8b95" fontSize={9} tickLine={false} />
                    <YAxis stroke="#7a8b95" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#212c46', borderRadius: '16px', border: 'none', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }} />
                    <Legend wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }} />
                    <Bar dataKey="Tested Samples" fill="#3f809e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Defects Detected" fill="#932c2e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* PASS RATE TREND LINE */}
            <div className="lg:col-span-6 bg-white p-6 rounded-xl shadow-lg border border-[#eaeaec]">
              <div className="border-b-2 border-[#b7a159] pb-4 mb-6">
                <h4 className="text-[14px] font-black uppercase text-[#212c46] tracking-widest flex items-center gap-3">
                  <Icons.TrendingUp size={20} className="text-[#b58c4f]" /> Daily Quality Pass Rate Trend (%)
                </h4>
                <p className="text-[11px] font-bold text-[#7a8b95] uppercase tracking-widest mt-1">ดัชนีผ่านเกณฑ์การตรวจสอบสินค้าเฉลี่ยตามวันปฏิทินส่งสัญญานเตือน</p>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartDataByTrend} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaec" />
                    <XAxis dataKey="date" stroke="#7a8b95" fontSize={10} tickLine={false} />
                    <YAxis stroke="#7a8b95" fontSize={10} tickLine={false} domain={[90, 100]} />
                    <Tooltip contentStyle={{ background: '#212c46', borderRadius: '16px', border: 'none', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }} />
                    <Line type="monotone" dataKey="Pass Rate (%)" stroke="#657f4d" strokeWidth={3} dot={{ stroke: '#657f4d', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DRAGGABLE CONFIG MODAL (Exactly matching UserPermissions styling and multi-step left tabs standard) */}
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
                <h3 className="text-sm font-black text-[#d7d7d7] uppercase tracking-widest leading-none">Quality Targets Configuration</h3>
                <p className="text-[10px] font-bold text-[#d7d7d7]/70 uppercase tracking-widest mt-1">ระบบตั้งค่าเป้าหมายและกำหนดขีดจำกัดคุณภาพอาหารแปรรูป</p>
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
              <Icons.Target size={14} /> Metric Targets
            </button>
            <button onClick={() => setConfigStep(1)} className={`p-3 rounded-xl text-left font-black tracking-widest flex items-center gap-2.5 transition-all ${configStep === 1 ? 'bg-[#212c46] text-white shadow-sm' : 'text-[#7a8b95] hover:bg-[#d7d7d7]/30 hover:text-[#212c46]'}`}>
              <Icons.ShieldCheck size={14} /> HACCP Guidelines
            </button>
            <button onClick={() => setConfigStep(2)} className={`p-3 rounded-xl text-left font-black tracking-widest flex items-center gap-2.5 transition-all ${configStep === 2 ? 'bg-[#212c46] text-white shadow-sm' : 'text-[#7a8b95] hover:bg-[#d7d7d7]/30 hover:text-[#212c46]'}`}>
              <Icons.Bell size={14} /> Dispatch & ERP
            </button>
          </div>

          {/* Modal Body Content */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            {configStep === 0 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="border-b border-[#eaeaec] pb-2 mb-4">
                  <h4 className="text-[12px] font-black text-[#212c46] uppercase tracking-widest">Step 1: Metric Targets & Control Thresholds</h4>
                  <p className="text-[10px] text-[#7a8b95] uppercase font-bold mt-0.5">ระบุดัชนีเป้าหมายความคลาดเคลื่อนและอัตราของเสียระดับจำกัด</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Max Allowed Defect Rate (%)</label>
                    <input type="number" step="0.1" value={settings.maxDefectRateLimit} onChange={e => setSettings({ ...settings, maxDefectRateLimit: Number(e.target.value) })} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none focus:border-[#657f4d]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Min First Time Quality FTQ (%)</label>
                    <input type="number" step="0.1" value={settings.minFtqTargetLimit} onChange={e => setSettings({ ...settings, minFtqTargetLimit: Number(e.target.value) })} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none focus:border-[#657f4d]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">CCP Critical Cooking Temp (°C)</label>
                    <input type="number" step="0.5" value={settings.criticalTempCCP} onChange={e => setSettings({ ...settings, criticalTempCCP: Number(e.target.value) })} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none focus:border-[#657f4d]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Allowed Underweight Deviation (g)</label>
                    <input type="number" value={settings.allowedWeightDevMins} onChange={e => setSettings({ ...settings, allowedWeightDevMins: Number(e.target.value) })} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none focus:border-[#657f4d]" />
                  </div>
                </div>
              </div>
            )}

            {configStep === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="border-b border-[#eaeaec] pb-2 mb-4">
                  <h4 className="text-[12px] font-black text-[#212c46] uppercase tracking-widest">Step 2: HACCP Safeguards & Controls</h4>
                  <p className="text-[10px] text-[#7a8b95] uppercase font-bold mt-0.5">กฎเกณฑ์ความปลอดภัยเพื่อบังคับการทำงานให้สอดคล้องกัน</p>
                </div>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 bg-[#f8f9fa] border border-[#eaeaec] rounded-xl cursor-pointer hover:border-[#657f4d] transition-colors">
                    <input type="checkbox" checked={settings.requireSigForRejectScrap} onChange={e => setSettings({ ...settings, requireSigForRejectScrap: e.target.checked })} className="w-4 h-4 accent-[#212c46]" />
                    <div>
                      <span className="block text-[11px] font-black text-[#212c46] uppercase tracking-wider">Require Supervisor Signature for Rejects/Scraps</span>
                      <span className="block text-[9px] text-[#7a8b95] font-bold mt-0.5">ต้องลงลายมือชื่อกำกับความเสี่ยงทุกครั้งหากระบุของเสียคัดแยก</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-[#f8f9fa] border border-[#eaeaec] rounded-xl cursor-pointer hover:border-[#657f4d] transition-colors">
                    <input type="checkbox" checked={settings.autoEscalateQualityAuditor} onChange={e => setSettings({ ...settings, autoEscalateQualityAuditor: e.target.checked })} className="w-4 h-4 accent-[#212c46]" />
                    <div>
                      <span className="block text-[11px] font-black text-[#212c46] uppercase tracking-wider">Auto-escalate Critical QA defects to Manager</span>
                      <span className="block text-[9px] text-[#7a8b95] font-bold mt-0.5">ส่งเรื่องเตือนไปยังผู้จัดการฝ่ายตรวจสอบทันทีหากเกินเป้าหมายจำกัด</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-[#f8f9fa] border border-[#eaeaec] rounded-xl cursor-pointer hover:border-[#657f4d] transition-colors">
                    <input type="checkbox" checked={settings.enforceHaccpCompliant} onChange={e => setSettings({ ...settings, enforceHaccpCompliant: e.target.checked })} className="w-4 h-4 accent-[#212c46]" />
                    <div>
                      <span className="block text-[11px] font-black text-[#212c46] uppercase tracking-wider">Enforce Regulatory HACCP Parameters Verification</span>
                      <span className="block text-[9px] text-[#7a8b95] font-bold mt-0.5">ระงับหรือเตือนภัยเมื่อระบบบันทึกไม่เป็นไปตามแนวทาง HACCP มาตรฐาน</span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {configStep === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="border-b border-[#eaeaec] pb-2 mb-4">
                  <h4 className="text-[12px] font-black text-[#212c46] uppercase tracking-widest">Step 3: Dispatch & ERP Parameters</h4>
                  <p className="text-[10px] text-[#7a8b95] uppercase font-bold mt-0.5">ตั้งค่าระดับความด่วนและอินเตอร์เฟสประมวลผลข้อมูล</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Alert Dispatch Level</label>
                    <select value={settings.alertNotificationLevel} onChange={e => setSettings({ ...settings, alertNotificationLevel: e.target.value })} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none">
                      <option value="Critical & High">Only Warning (CCP / High Level Reject)</option>
                      <option value="All Levels">All Events Logged Notification</option>
                      <option value="Muted">Muted Logging / Local database storage</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5 font-bold">Primary Dispatch Channels</label>
                    <input type="text" value={settings.dispatchChannel} onChange={e => setSettings({ ...settings, dispatchChannel: e.target.value })} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none focus:border-[#657f4d]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Config Footer */}
        <div className="px-6 py-3 bg-[#f8f9fa] border-t border-[#eaeaec] flex justify-end gap-3 shrink-0">
          <button onClick={() => setShowConfigModal(false)} className="px-5 py-2 bg-white border border-[#eaeaec] text-[#414757] rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-[#d7d7d7]/30 transition-all">Cancel</button>
          <button onClick={handleSaveConfig} className="bg-[#212c46] hover:bg-[#657f4d] text-white px-6 py-2 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-md transition-all flex items-center gap-2"><Icons.Save size={14} /> Update Policy Settings</button>
        </div>
      </DraggableModal>

      {/* DRAGGABLE QUALITY INCIDENT ADD/EDIT FORM MODAL */}
      <DraggableModal
        isOpen={showEntryModal}
        onClose={() => setShowEntryModal(false)}
        width="max-w-[750px]"
        customHeader={
          <div className="bg-[#212c46] px-4 py-3 flex justify-between items-center shrink-0 border-b-2 border-[#b7a159]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/20 shadow-sm">
                <Icons.Layers size={20} className="text-[#b7a159]" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#d7d7d7] uppercase tracking-widest leading-none">{editingEntry ? 'Edit Inspection Entry' : 'Log New Quality Inspection'}</h3>
                <p className="text-[10px] font-bold text-[#d7d7d7]/70 uppercase tracking-widest mt-1">บันทึกแผนงานสุ่มตรวจสอบคุณภาพการผลิตหน้างานจริง</p>
              </div>
            </div>
            <button onClick={() => setShowEntryModal(false)} className="text-white/60 hover:text-white p-1 rounded-lg transition-colors"><Icons.X size={20} /></button>
          </div>
        }
      >
        <div className="p-6 space-y-4 text-[#414757]">
          {/* Step Wizards Header */}
          <div className="flex items-center gap-2 border-b border-[#eaeaec] pb-3 mb-4 shrink-0 justify-between">
            <span className="text-[11px] font-black text-[#212c46] uppercase tracking-widest">
              Quality Incident Wizard Phase
            </span>
            <div className="flex bg-[#f8f9fa] p-0.5 rounded-full border border-[#eaeaec] shadow-sm">
              <button onClick={() => setEntryStep(0)} className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full transition-all ${entryStep === 0 ? 'bg-[#212c46] text-white' : 'text-[#7a8b95]'}`}>Step 1: Metric Data</button>
              <button onClick={() => setEntryStep(1)} className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full transition-all ${entryStep === 1 ? 'bg-[#212c46] text-white' : 'text-[#7a8b95]'}`}>Step 2: Remarks & Sig</button>
            </div>
          </div>

          {entryStep === 0 ? (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Verification Date</label>
                  <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Batch ID</label>
                  <input type="text" placeholder="e.g. BT-FCS-2606A" value={formBatchId} onChange={e => setFormBatchId(e.target.value)} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Product Name</label>
                <input type="text" value={formProductName} onChange={e => setFormProductName(e.target.value)} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Inspection Category</label>
                  <select value={formTestTypeId} onChange={e => setFormTestTypeId(e.target.value)} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none">
                    {MOCK_TEST_TYPES.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Measured Value / Readout</label>
                  <input type="text" placeholder="e.g. 74.5°C, 998g, pH 6.0" value={formValueMeasured} onChange={e => setFormValueMeasured(e.target.value)} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none" />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Inspection Status</label>
                  <select value={formStatus} onChange={e => setFormStatus(e.target.value)} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none">
                    <option value="Passed">Passed (ผ่านเกณฑ์สากล)</option>
                    <option value="Re-work">Re-work (กักแยกเพื่อปรับปรุง)</option>
                    <option value="Scrapped">Scrapped (ทิ้งวัสดุทันที)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">QC Inspector Name</label>
                  <input type="text" value={formInspectedBy} onChange={e => setFormInspectedBy(e.target.value)} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Auditor Supervisor Signature (Reject/Scrap limit requirement)</label>
                <input type="text" placeholder="e.g. SUDA QUALITY" value={formSupervisorSig} onChange={e => setFormSupervisorSig(e.target.value)} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none focus:border-[#657f4d] placeholder-[#4d87a8]/30 font-black tracking-widest" />
                <p className="text-[9px] text-[#7a8b95] font-bold tracking-wider uppercase mt-1">ต้องกรอกผู้มีอำนาจเซ็นรับรองสถานการณ์ เมื่อเลือก Re-work หรือ Scrapped ตามกฎระเบียบ HACCP</p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Analysis Remarks / Deviation Reasons</label>
                <textarea rows={3} placeholder="ระบุเหตุผลและผลกระทบเชิงระบบเพื่อการวิเคราะห์ทาง CAPA..." value={formRemarks} onChange={e => setFormRemarks(e.target.value)} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none resize-none" />
              </div>
            </div>
          )}
        </div>

        {/* Modal Entry footer */}
        <div className="px-6 py-3 bg-[#f8f9fa] border-t border-[#eaeaec] flex justify-between shrink-0">
          <div>
            {entryStep === 1 && (
              <button onClick={() => setEntryStep(0)} className="px-5 py-2 bg-white border border-[#eaeaec] text-[#414757] rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-[#d7d7d7]/30 transition-all flex items-center gap-1.5"><Icons.ArrowLeft size={14} /> Back</button>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowEntryModal(false)} className="px-5 py-2 bg-white border border-[#eaeaec] text-[#414757] rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-[#d7d7d7]/30 transition-all">Cancel</button>
            {entryStep === 0 ? (
              <button onClick={() => setEntryStep(1)} className="bg-[#212c46] hover:bg-[#657f4d] text-white px-6 py-2 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-md transition-all flex items-center gap-1.5">Next Page <Icons.ArrowRight size={14} /></button>
            ) : (
              <button onClick={handleSaveEntry} className="bg-[#212c46] hover:bg-[#657f4d] text-white px-6 py-2 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-md transition-all flex items-center gap-1.5"><Icons.Save size={14} /> Save Quality Entry</button>
            )}
          </div>
        </div>
      </DraggableModal>
    </div>
  );
}
