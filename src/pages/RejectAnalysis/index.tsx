import React, { useState, useEffect, useMemo } from 'react';
import * as Icons from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Cell, PieChart, Pie } from 'recharts';
import { DraggableModal } from '../../components/shared/DraggableModal';
import KpiCard from '../../components/shared/KpiCard';
import { UserGuidePanel } from '../../components/shared/UserGuidePanel';
import UserGuideButton from '../../components/shared/UserGuideButton';
import { useCollection } from '../../services/useFirestore';

// --- THEME PALETTE ---
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

// --- REJECT CATS ---
const REJECT_TYPES = [
  { id: 'SUR', name: 'Surface & Casing Defect', color: '#ab7d82', desc: 'ความบกพร่องทางกายภาพภายนอก ไส้บาง/แตก รูปร่างภายนอกเสียหายหรือไม่เป็นชิ้นเดียวกัน', unit: 'packs' },
  { id: 'WGT', name: 'Weight Out of Spec', color: '#b58c4f', desc: 'ปัญหาน้ำหนักแปรปรวน แตกต่างจากมาตรฐานสินค้าอาหารแปรรูปเกินปริมาณกำหนดคลาดเคลื่อนขั้นต่ำ', unit: 'packs' },
  { id: 'CHM', name: 'Chemical / pH Level', color: '#657f4d', desc: 'การวัดผลทางเคมีผิดแผก ค่าความเป็นกรด-ด่าง ประเมินสารคงค้างไม่ตอบสนองมาตรฐานโครงสร้างอาหาร', unit: 'packs' },
  { id: 'CON', name: 'Assumed Contamination', color: '#a94228', desc: 'ตรวจพบสิ่งปะปน สิ่งแปลกปลอม หรือกลุ่มสปอร์แบคทีเรีย ยืนยันอันตรายทางชีวภาพและกายภาพที่อันตราย', unit: 'packs' },
  { id: 'MET', name: 'Metal Detector Alert', color: '#932c2e', desc: 'กลไกเครื่องตัดป้อนโลหะส่งตรวจจับพบอนุภาคโลหะ เศษลวดพุ่มหรือข้อชำรุดเสียหายจากโมลด์จักรเหล็ก', unit: 'packs' },
  { id: 'SEL', name: 'Seal & Vacuum Loss', color: '#3f809e', desc: 'รอยซีลขอบถุงฉีกขาด รอยกดแนบลมไม่สนิท ทำให้อากาศความชื้นภายนอกรั่วไหลผ่านขัดขวางอายุการเก็บรักษา', unit: 'packs' }
];

const INITIAL_REJECT_LOGS = [
  { id: 'REJ-260101', date: '2026-05-28', batchId: 'BT-SGB-2605A', productName: 'Smoked Garlic Bologna 1kg', rejectTypeId: 'SUR', quantity: 45, severity: 'Medium', status: 'Disposed', inspectedBy: 'QC SUDA', approvedBy: 'SUDA QUALITY', cause: 'Casing rupture due to sealing machine temperature spike from line 2 guide' },
  { id: 'REJ-260102', date: '2026-05-29', batchId: 'BT-CSW-2605B', productName: 'Cheese Sausage 200g', rejectTypeId: 'WGT', quantity: 120, severity: 'Low', status: 'Re-work', inspectedBy: 'QC SUDA', approvedBy: 'SUDA QUALITY', cause: 'Filler pump pressure drop causing underweight packs under standard dev' },
  { id: 'REJ-260103', date: '2026-05-30', batchId: 'BT-HSW-2605C', productName: 'Hotdog Sausage 150g', rejectTypeId: 'MET', quantity: 350, severity: 'Critical', status: 'Scrapped', inspectedBy: 'QC NARONG', approvedBy: 'NARONG SUPER', cause: 'Metal detector alarm activated on Line 3. Suspicious batch isolated' },
  { id: 'REJ-260104', date: '2026-05-31', batchId: 'BT-VHB-2605D', productName: 'Vienna Ham 2kg', rejectTypeId: 'SEL', quantity: 15, severity: 'Low', status: 'Re-work', inspectedBy: 'QC SUDA', approvedBy: 'SUDA QUALITY', cause: 'Vacuum sealing bar misalignment on thermoforming packaging unit' },
  { id: 'REJ-260105', date: '2026-06-01', batchId: 'BT-FCS-2606A', productName: 'Frankfurter Chicken Sausage 500g', rejectTypeId: 'CON', quantity: 80, severity: 'Critical', status: 'Scrapped', inspectedBy: 'QC NARONG', approvedBy: 'NARONG SUPER', cause: 'Microbiological swab test presumptive out of spec under safety protocol' }
];

export default function RejectAnalysis() {
  const [activeTab, setActiveTab] = useState('list_mode'); // list_mode | charts_mode
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // High standard state settings matching User Permissions Page (Config Modules)
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configStep, setConfigStep] = useState(0);
  const [settings, setSettings] = useState({
    maxRejectQtyLimit: 200,        // Max allowed reject quantity per incident
    enableAutoEmailAlert: true,    // Send alert email to supervisor
    requireDoubleSignature: true,  // Require dual signature for Critical incidents
    autoIsolateBatchOnCritical: true, // Trigger automated isolation order in warehouse
    minimumReinspectionSec: 1800,  // Minimum quarantine re-inspection delay
    allowedReworkCountMax: 2,       // Maximum re-work allowance before force metal scrap
    escCategoryAlert: 'Critical & High Only',
    reportDispatchGateway: 'Standard API & GAS Gateway Integration'
  });

  // Action Add/Edit Log Entry State Machine
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [entryStep, setEntryStep] = useState(0);

  // Form Fields
  const [formDate, setFormDate] = useState('2026-06-01');
  const [formBatchId, setFormBatchId] = useState('');
  const [formProductName, setFormProductName] = useState('Smoked Garlic Bologna 1kg');
  const [formRejectTypeId, setFormRejectTypeId] = useState('SUR');
  const [formQuantity, setFormQuantity] = useState(10);
  const [formSeverity, setFormSeverity] = useState('Medium'); // Low, Medium, Critical
  const [formStatus, setFormStatus] = useState('Disposed'); // Disposed, Scrapped, Re-work
  const [formInspectedBy, setFormInspectedBy] = useState('QC SUDA');
  const [formApprovedBy, setFormApprovedBy] = useState('');
  const [formCause, setFormCause] = useState('');

  // UseCollection firebase database integration or local system mock fallback
  const { data: fbRejectLogs, add: addRejectLog, update: updateRejectLog } = useCollection<any>('reject_logs_database', INITIAL_REJECT_LOGS);
  
  const logs = fbRejectLogs && fbRejectLogs.length > 0 ? fbRejectLogs.sort((a, b) => b.date.localeCompare(a.date)) : INITIAL_REJECT_LOGS.sort((a, b) => b.date.localeCompare(a.date));

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const q = search.toLowerCase();
      return (
        log.batchId.toLowerCase().includes(q) ||
        log.productName.toLowerCase().includes(q) ||
        log.inspectedBy.toLowerCase().includes(q) ||
        log.id.toLowerCase().includes(q) ||
        (log.cause && log.cause.toLowerCase().includes(q))
      );
    });
  }, [logs, search]);

  const currentData = useMemo(() => {
    return filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;

  // Calculators & Advanced Metrics
  const totalRejectCount = useMemo(() => {
    return logs.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  }, [logs]);

  const criticalIncidentCount = useMemo(() => {
    return logs.filter(item => item.severity === 'Critical').length;
  }, [logs]);

  const reworkCount = useMemo(() => {
    return logs.filter(item => item.status === 'Re-work').length;
  }, [logs]);

  const scrappedCount = useMemo(() => {
    return logs.filter(item => item.status === 'Scrapped' || item.status === 'Disposed').length;
  }, [logs]);

  const reworkRate = useMemo(() => {
    if (logs.length === 0) return 0;
    return Number(((reworkCount / logs.length) * 100).toFixed(1));
  }, [reworkCount, logs]);

  // Analytics components charts generators
  const chartDataByCategory = useMemo(() => {
    return REJECT_TYPES.map(type => {
      const samples = logs.filter(log => log.rejectTypeId === type.id);
      const totalQty = samples.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
      return {
        name: type.name,
        quantity: totalQty,
        color: type.color
      };
    }).sort((a, b) => b.quantity - a.quantity);
  }, [logs]);

  const chartDataByTrend = useMemo(() => {
    const dates = Array.from(new Set(logs.map(log => log.date))).sort();
    return dates.map(dt => {
      const items = logs.filter(log => log.date === dt);
      const rejectsCount = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
      return {
        date: dt,
        'Reject Qty': rejectsCount,
      };
    });
  }, [logs]);

  const openAddModal = () => {
    setEditingEntry(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormBatchId('');
    setFormProductName('Smoked Garlic Bologna 1kg');
    setFormRejectTypeId('SUR');
    setFormQuantity(15);
    setFormSeverity('Medium');
    setFormStatus('Re-work');
    setFormInspectedBy('QC SUDA');
    setFormApprovedBy('');
    setFormCause('');
    setEntryStep(0);
    setShowEntryModal(true);
  };

  const openEditModal = (entry: any) => {
    setEditingEntry(entry);
    setFormDate(entry.date);
    setFormBatchId(entry.batchId);
    setFormProductName(entry.productName);
    setFormRejectTypeId(entry.rejectTypeId);
    setFormQuantity(entry.quantity);
    setFormSeverity(entry.severity);
    setFormStatus(entry.status);
    setFormInspectedBy(entry.inspectedBy);
    setFormApprovedBy(entry.approvedBy || '');
    setFormCause(entry.cause || '');
    setEntryStep(0);
    setShowEntryModal(true);
  };

  const handleSaveEntry = async () => {
    const dataObj = {
      date: formDate,
      batchId: formBatchId || 'BT-' + Date.now().toString().slice(-6),
      productName: formProductName,
      rejectTypeId: formRejectTypeId,
      quantity: Number(formQuantity),
      severity: formSeverity,
      status: formStatus,
      inspectedBy: formInspectedBy,
      approvedBy: formApprovedBy,
      cause: formCause || 'Investigation pending'
    };

    if (editingEntry) {
      await updateRejectLog(editingEntry.id, dataObj);
    } else {
      const newId = `REJ-${Date.now().toString().slice(-6)}`;
      await addRejectLog({ id: newId, ...dataObj });
    }
    setShowEntryModal(false);
    setEditingEntry(null);
  };

  return (
    <div className="flex flex-1 w-full flex-col animate-fadeIn bg-transparent space-y-4">
      {/* USER GUIDE FLOATING SYSTEM PANEL */}
      <UserGuideButton onClick={() => setIsGuideOpen(true)} />

      <UserGuidePanel isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} title="REJECT GUIDE" subtitle="REJECT ANALYSIS MANUAL">
        <div className="space-y-8 font-sans">
            <div>
                <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                    <Icons.ShieldAlert size={16} className="text-[#a94228]" /> 1. กฎและมาตรการความปลอดภัย (SAFETY RULES)
                </h3>
                <p className="mb-4 text-[#414757]">
                    ระบบนี้ยึดแนวทางมาตรฐาน ISO 9001, HACCP และ Food Safety อย่างเคร่งครัด:
                </p>
                <div className="space-y-3">
                    <div className="p-3 bg-[#f8f9fa] border border-[#eaeaec] flex items-start gap-4 rounded-xl text-[12px]">
                        <div className="bg-[#a94228] text-white p-2 rounded-lg shrink-0"><Icons.AlertTriangle size={16} /></div>
                        <div>
                            <strong className="text-[#212c46]">สถานะวิกฤติ (Critical Severity)</strong>
                            <p className="text-[#7a8b95]">เมื่อบันทึกระดับ Critical เช่น พบเศษเหล็ก/โลหะ คลังสินค้าจะถูกล็อค ห้ามส่งออก และกักกัน (Quarantine) ทันที</p>
                        </div>
                    </div>
                    <div className="p-3 bg-[#f8f9fa] border border-[#eaeaec] flex items-start gap-4 rounded-xl text-[12px]">
                        <div className="bg-[#b58c4f] text-white p-2 rounded-lg shrink-0"><Icons.PenTool size={16} /></div>
                        <div>
                            <strong className="text-[#212c46]">การอนุมัติแบบคู่ (Dual Signature)</strong>
                            <p className="text-[#7a8b95]">หากของเสียสูงเกินเกณฑ์เปอร์เซ็นต์ที่ยอมรับ จะต้องมีลายเซ็นวิศวกรควบคุมอนุมัติเสมอเพื่อทำลายทิ้ง</p>
                        </div>
                    </div>
                    <div className="p-3 bg-[#f8f9fa] border border-[#eaeaec] flex items-start gap-4 rounded-xl text-[12px]">
                        <div className="bg-[#3f809e] text-white p-2 rounded-lg shrink-0"><Icons.Trash2 size={16} /></div>
                        <div>
                            <strong className="text-[#212c46]">หลีกเลี่ยงเหตุการณ์สูญเสียยอดสะสมสูงกว่ากำหนด</strong>
                            <p className="text-[#7a8b95]">เป้าหมายจำกัดปริมาณสูญเสียถูกตั้งไว้ที่ {settings.maxRejectQtyLimit} ชิ้น / แบทช์</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-px bg-[#eaeaec] w-full" />

            <div>
                <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                    <Icons.Recycle size={16} className="text-[#688a58]" /> 2. โครงสร้างการจัดการและสถานะของการคัดทิ้ง (REJECT STATES)
                </h3>
                <div className="space-y-3">
                    <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-[#b58c4f]"></div><span className="text-[#414757] text-[12px]"><strong className="text-[#212c46]">Re-work (ซ่อมแซมได้)</strong> - สินค้าต้องถูกส่งไปตรวจชั่ง/แพ็ค/ล้าง ใหม่ภายใน 1,800 วินาที เพื่อนำกลับมาผลิตต่อ</span></div>
                    <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-[#a94228]"></div><span className="text-[#414757] text-[12px]"><strong className="text-[#212c46]">Scrapped (ทำลายทิ้ง)</strong> - ขยะอุตสาหกรรม ต้องลงระบบเพื่อทำลาย ห้ามกลับเข้าไลน์เด็ดขาด</span></div>
                </div>
            </div>

            <div className="h-px bg-[#eaeaec] w-full" />

            <div>
                <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                    <Icons.FileText size={16} className="text-[#3f809e]" /> 3. ขั้นตอนสืบข้อมูลเบื้องต้นสำหรับ QC
                </h3>
                <div className="p-4 bg-[#fdf2f2] border border-[#f5c6cb] rounded-xl text-[#414757]">
                    <ul className="list-decimal pl-5 space-y-2 text-[12px]">
                        <li>กด NEW REPORT เพื่อสร้างรายงาน แจ้งรหัสสินค้าและสาเหตุ</li>
                        <li>หากเป็นปัญหาใหญ่ที่หาสาเหตุไม่ได้ แจ้งสถานะความรุนแรงระดับ Critical</li>
                        <li>ดูกราฟ Pareto Chart ด้านบนเพื่อวิเคราะห์ว่าสาเหตุใดเกิดบ่อยที่สุดและควรแก้ไขด่วน</li>
                    </ul>
                </div>
            </div>
        </div>
      </UserGuidePanel>

      {/* HEADER SECTION */}
      <div className="h-14 px-4 sm:px-8 flex flex-row items-center justify-between gap-4 z-20 shrink-0">
        <div className="flex items-center gap-5">
          <div className="relative flex items-center justify-center group cursor-default shrink-0">
            <div className="absolute inset-0 bg-[#932c2e] blur-[15px] opacity-20 rounded-full group-hover:opacity-60 transition-all duration-700"></div>
            <div className="relative z-10 p-1.5 border border-[#932c2e]/40 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm">
              <Icons.Activity size={28} strokeWidth={2.5} className="text-[#932c2e]" />
            </div>
          </div>
          <div>
            <h3 className="font-black text-[#212c46] uppercase tracking-tighter leading-none font-exception-header text-[24px]">
              REJECT <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#932c2e] to-[#a94228]">ANALYSIS</span> STATION
            </h3>
            <p className="text-[11px] font-bold text-[#4d5a44] uppercase tracking-[0.2em] mt-0.5 opacity-80 leading-none">
              PROCESS WASTAGE & CONTAMINATED MATERIALS AUDITING HUB
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-white/50 p-1.5 rounded-xl border border-white/60 shadow-inner flex flex-wrap items-center gap-1">
            <button onClick={() => setActiveTab('list_mode')} className={`px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'list_mode' ? 'bg-[#212c46] text-white shadow-md' : 'text-[#7a8b95] hover:text-[#932c2e] hover:bg-[#d7d7d7]/30'}`}>
              <Icons.ShieldAlert size={16} /> REJECT RECORDS
            </button>
            <button onClick={() => setActiveTab('charts_mode')} className={`px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'charts_mode' ? 'bg-[#212c46] text-white shadow-md' : 'text-[#7a8b95] hover:text-[#932c2e] hover:bg-[#d7d7d7]/30'}`}>
              <Icons.TrendingUp size={16} /> PARETO METRICS
            </button>
          </div>
          <button onClick={() => { setConfigStep(0); setShowConfigModal(true); }} className="bg-white border border-[#eaeaec] text-[#212c46] hover:text-[#932c2e] hover:border-[#932c2e] p-2.5 rounded-xl shadow-sm hover:shadow-md active:scale-95 transition-all">
            <Icons.Settings size={18} />
          </button>
        </div>
      </div>

      {/* KPI METRICS BLOCK */}
      <div className="mx-auto px-4 sm:px-8 w-full mt-[2px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 shrink-0">
          <KpiCard label="Total Rejected Qty" value={`${totalRejectCount} Pcs`} icon="trending-down" colorAccent={THEME.danger} colorValue={THEME.primary} desc="Loss accumulation of food material" />
          <KpiCard label="Rework Efficiency" value={`${reworkRate}%`} icon="percent" colorAccent={THEME.success} colorValue={THEME.primary} desc={`${reworkCount} rework batches back to line`} />
          <KpiCard label="Critical Incidents" value={`${criticalIncidentCount} Logs`} icon="alert-octagon" colorAccent={criticalIncidentCount > 0 ? THEME.danger : THEME.gold} colorValue={THEME.primary} desc="Severe chemical/metal alarms" />
          <KpiCard label="Warehouse Segreg" value="QUARANTINED" icon="shield-check" colorAccent={THEME.success} colorValue={THEME.success} desc="Containment rules verified" />
        </div>

        {/* LIST MODE VIEW */}
        {activeTab === 'list_mode' ? (
          <div className="bg-white rounded-xl shadow-lg border border-[#eaeaec] overflow-hidden flex flex-col animate-fadeIn">
            {/* ACTION & SECTIONS HEADER */}
            <div className="px-4 py-4 border-b border-[#eaeaec] bg-white flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-black text-[#7a8b95] uppercase tracking-widest bg-white border border-[#eaeaec] px-4 py-2 rounded-xl shadow-sm">
                  PROCESS LOSS SECURITY COMPLIANCE
                </span>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                  <Icons.Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#7a8b95]" />
                  <input type="text" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} placeholder="Search batch, product, cause, inspectors..." className="w-full pl-12 pr-6 py-2.5 text-[12px] border border-[#eaeaec] rounded-full font-bold outline-none focus:border-[#932c2e] bg-white shadow-sm text-[#212c46]" />
                </div>
                <button onClick={openAddModal} className="bg-[#212c46] hover:bg-[#932c2e] text-white px-6 py-2.5 rounded-full font-black text-[12px] uppercase tracking-widest shadow-md transition-all flex items-center gap-2 shrink-0 border border-[#212c46]">
                  <Icons.PlusCircle size={16} /> Log Defect Incident
                </button>
              </div>
            </div>

            {/* TABLE GRID */}
            <div className="overflow-auto custom-scrollbar">
              <table className="w-full text-left border-collapse table-font">
                <thead className="sys-table-header [#b7a159] ">
                    <tr>
                    <th className="font-black uppercase tracking-widest whitespace-nowrap   ">Incident ID / Date</th>
                    <th className="font-black uppercase tracking-widest whitespace-nowrap   ">Batch / Product Name</th>
                    <th className="font-black uppercase tracking-widest whitespace-nowrap   ">Reject Category</th>
                    <th className="font-black uppercase tracking-widest text-center   ">Loss Quantity</th>
                    <th className="font-black uppercase tracking-widest   ">Root Cause Summary</th>
                    <th className="font-black uppercase tracking-widest text-center   ">Severity</th>
                    <th className="font-black uppercase tracking-widest text-center   ">Disposition Status</th>
                    <th className="font-black uppercase tracking-widest text-center   ">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#eaeaec]">
                  {currentData.length === 0 ? (
                    <tr>
                      <td className="text-center text-[#7a8b95] uppercase font-black tracking-widest text-[12px] py-2.5 px-4">No tracked reject logs available in database</td>
                    </tr>
                  ) : (
                    currentData.map(log => {
                      const rType = REJECT_TYPES.find(t => t.id === log.rejectTypeId) || REJECT_TYPES[0];
                      const isCritical = log.severity === 'Critical';
                      const isExceeding = log.quantity > settings.maxRejectQtyLimit;
                      
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
                              <span className="text-[10px] text-[#4d87a8] font-bold tracking-wider uppercase">{log.batchId}</span>
                            </div>
                          </td>
                          <td className="sys-table-td py-2.5 px-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase text-white shadow-sm" style={{ backgroundColor: rType.color }}>
                              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                              {rType.name}
                            </span>
                          </td>
                          <td className="sys-table-td text-center py-2.5 px-4">
                            <div className="flex flex-col items-center">
                              <span className={`text-[12px] font-black ${isExceeding ? 'text-[#932c2e] font-black' : 'text-[#212c46]'}`}>{log.quantity} pcs</span>
                              {isExceeding && (
                                <span className="text-[9px] text-[#932c2e] font-bold uppercase tracking-tighter bg-[#932c2e]/10 px-1.5 rounded mt-0.5">Exceeds Cap!</span>
                              )}
                            </div>
                          </td>
                          <td className="sys-table-td py-2.5 px-4">
                            <div className="flex flex-col max-w-[325px]">
                              <p className="text-[11px] font-bold text-[#414757] leading-tight truncate-2-lines">{log.cause || 'No cause specified'}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] uppercase font-bold text-[#7a8b95] tracking-widest bg-white border px-2 py-0.5 rounded-md">Operator: {log.inspectedBy}</span>
                                {log.approvedBy && (
                                  <span className="text-[9px] uppercase font-black text-[#657f4d] tracking-widest bg-[#657f4d]/10 px-2 py-0.5 rounded-md">Audited: {log.approvedBy}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="sys-table-td text-center py-2.5 px-4">
                            <span className={`inline-flex items-center gap-[1px] px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border tracking-widest ${isCritical ? 'bg-[#932c2e]/10 text-[#d96245] border-[#932c2e]/25 animate-pulse' : log.severity === 'Medium' ? 'bg-[#b58c4f]/10 text-[#b58c4f] border-[#b58c4f]/25' : 'bg-[#657f4d]/10 text-[#657f4d] border-[#657f4d]/25'}`}>
                              {log.severity}
                            </span>
                          </td>
                          <td className="sys-table-td text-center py-2.5 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${log.status === 'Re-work' ? 'bg-[#b58c4f]/20 text-[#b58c4f] border border-[#b58c4f]/30' : log.status === 'Scrapped' ? 'bg-[#932c2e]/10 text-[#d96245] border border-[#932c2e]/20' : 'bg-[#eaeaec] text-[#414757] border border-[#d7d7d7]'}`}>
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

            {/* LOWER PAGINATION CONTAINER */}
            <div className="px-8 py-3 bg-[#f8f9fa] border-t border-[#eaeaec] flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
              <div className="flex items-center gap-6 text-[11px] font-black text-[#7a8b95] uppercase tracking-widest">
                <div className="flex items-center gap-3">
                  <span>Display Rows:</span>
                  <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="bg-white border border-[#eaeaec] rounded-lg px-3 py-1.5 outline-none font-black text-[#212c46] cursor-pointer shadow-sm">
                    {[5, 10, 20, 50].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <p className="bg-white px-4 py-2 rounded-xl border border-[#eaeaec] shadow-sm">Total: {filteredLogs.length} incidents logged</p>
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
          /* ANALYTICS CHARTS PARETO */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
            {/* PARETO PROCESS FAILURES DISTRIBUTION (PIE + BARS) */}
            <div className="lg:col-span-4 bg-white p-6 rounded-xl shadow-lg border border-[#eaeaec] flex flex-col justify-between">
              <div className="border-b-2 border-[#b7a159] pb-4 mb-2">
                <h4 className="text-[14px] font-black uppercase text-[#212c46] tracking-widest flex items-center gap-3">
                  <Icons.PieChart size={20} className="text-[#a94228]" /> Loss Ratio Distribution
                </h4>
                <p className="text-[11px] font-bold text-[#7a8b95] uppercase tracking-widest mt-1">สัดส่วนสูญเสียรวมแยกจำแนกสัญญานเตือนภัย</p>
              </div>
              <div className="h-64 w-full flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartDataByCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={84} paddingAngle={4} dataKey="quantity" nameKey="name" labelLine={false}>
                      {chartDataByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#212c46', border: 'none', color: '#fff', borderRadius: '12px', fontSize: '11px', fontFamily: 'monospace' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5">
                {chartDataByCategory.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[10px] font-bold border-b border-[#eaeaec]/60 pb-1 uppercase">
                    <span className="flex items-center gap-1.5 text-[#212c46]">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.name}
                    </span>
                    <span className="font-black text-[#212c46]">{item.quantity} pcs</span>
                  </div>
                ))}
              </div>
            </div>

            {/* BAR CHART PARETO DETAILS */}
            <div className="lg:col-span-5 bg-white p-6 rounded-xl shadow-lg border border-[#eaeaec]">
              <div className="border-b-2 border-[#b7a159] pb-4 mb-6">
                <h4 className="text-[14px] font-black uppercase text-[#212c46] tracking-widest flex items-center gap-3">
                  <Icons.BarChart3 size={20} className="text-[#657f4d]" /> Reject Quantity Pareto Analysis
                </h4>
                <p className="text-[11px] font-bold text-[#7a8b95] uppercase tracking-widest mt-1">การเปรียบเทียบอันดับสาเหตุที่ทำให้วัสดุประเภทแปรสภาพเสียหายสูงสุด</p>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataByCategory} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaec" />
                    <XAxis dataKey="name" stroke="#7a8b95" fontSize={8} tickLine={false} />
                    <YAxis stroke="#7a8b95" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#212c46', border: 'none', color: '#fff', borderRadius: '16px', fontSize: '11px', fontFamily: 'monospace' }} />
                    <Bar dataKey="quantity" fill="#212c46" radius={[4, 4, 0, 0]}>
                      {chartDataByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* DAILY VOLUME TRENDS */}
            <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-lg border border-[#eaeaec]">
              <div className="border-b-2 border-[#b7a159] pb-4 mb-6">
                <h4 className="text-[14px] font-black uppercase text-[#212c46] tracking-widest flex items-center gap-3">
                  <Icons.LineChart size={20} className="text-[#b58c4f]" /> Waste Trends
                </h4>
                <p className="text-[11px] font-bold text-[#7a8b95] uppercase tracking-widest mt-1">วิถีความสูญเสียในสายการแปรรูปรายวัน</p>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartDataByTrend} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaec" />
                    <XAxis dataKey="date" stroke="#7a8b95" fontSize={8} tickLine={false} />
                    <YAxis stroke="#7a8b95" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#212c46', border: 'none', color: '#fff', borderRadius: '16px', fontSize: '11px', fontFamily: 'monospace' }} />
                    <Line type="monotone" dataKey="Reject Qty" stroke="#932c2e" strokeWidth={3.5} dot={{ stroke: '#932c2e', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DRAGGABLE CONFIGURATION MODAL (Strict standard matching User Permissions Left Side Menu step tabs & visual headers) */}
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
                <h3 className="text-sm font-black text-[#d7d7d7] uppercase tracking-widest leading-none">Reject Policy & Control Standards</h3>
                <p className="text-[10px] font-bold text-[#d7d7d7]/70 uppercase tracking-widest mt-1">ระเบียบและเงื่อนไขเกณฑ์ควบคุมสิ่งสูญเสีย (Reject Standards Config Node)</p>
              </div>
            </div>
            <button onClick={() => setShowConfigModal(false)} className="text-white/60 hover:text-white p-1 rounded-lg transition-colors"><Icons.X size={20} /></button>
          </div>
        }
      >
        <div className="flex flex-col md:flex-row h-[420px] bg-white text-[#414757]">
          {/* Modal Sidebar Navigation styled perfectly like UserPermissions */}
          <div className="w-full md:w-[240px] bg-[#f8f9fa] border-r border-[#eaeaec] flex flex-col p-3 shrink-0 uppercase tracking-widest font-black text-[10px] space-y-1">
            <button onClick={() => setConfigStep(0)} className={`p-3 rounded-xl text-left font-black tracking-widest flex items-center gap-2.5 transition-all ${configStep === 0 ? 'bg-[#212c46] text-white shadow-sm' : 'text-[#7a8b95] hover:bg-[#d7d7d7]/30 hover:text-[#212c46]'}`}>
              <Icons.Target size={14} /> Metric Targets
            </button>
            <button onClick={() => setConfigStep(1)} className={`p-3 rounded-xl text-left font-black tracking-widest flex items-center gap-2.5 transition-all ${configStep === 1 ? 'bg-[#212c46] text-white shadow-sm' : 'text-[#7a8b95] hover:bg-[#d7d7d7]/30 hover:text-[#212c46]'}`}>
              <Icons.ShieldAlert size={14} /> Isolation Rules
            </button>
            <button onClick={() => setConfigStep(2)} className={`p-3 rounded-xl text-left font-black tracking-widest flex items-center gap-2.5 transition-all ${configStep === 2 ? 'bg-[#212c46] text-white shadow-sm' : 'text-[#7a8b95] hover:bg-[#d7d7d7]/30 hover:text-[#212c46]'}`}>
              <Icons.Bell size={14} /> Dispatch & Alert
            </button>
          </div>

          {/* Modal Tab Body */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            {configStep === 0 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="border-b border-[#eaeaec] pb-2 mb-4">
                  <h4 className="text-[12px] font-black text-[#212c46] uppercase tracking-widest">Step 1: Defect Quantity Targets</h4>
                  <p className="text-[10px] text-[#7a8b95] uppercase font-bold mt-0.5">ระบุเพดานปริมาณสูญเสียสูงสุดต่อครั้งและขีดจำกัดการซ่อมบำรุง</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Max allowed scrap/reject per batch (Pcs)</label>
                    <input type="number" value={settings.maxRejectQtyLimit} onChange={e => setSettings({ ...settings, maxRejectQtyLimit: Number(e.target.value) })} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none focus:border-[#a94228]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Max allowed Rework cycles per pack</label>
                    <input type="number" value={settings.allowedReworkCountMax} onChange={e => setSettings({ ...settings, allowedReworkCountMax: Number(e.target.value) })} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none focus:border-[#a94228]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Quarantine Reinspection delay (seconds)</label>
                    <input type="number" value={settings.minimumReinspectionSec} onChange={e => setSettings({ ...settings, minimumReinspectionSec: Number(e.target.value) })} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none focus:border-[#a94228]" />
                  </div>
                </div>
              </div>
            )}

            {configStep === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="border-b border-[#eaeaec] pb-2 mb-4">
                  <h4 className="text-[12px] font-black text-[#212c46] uppercase tracking-widest">Step 2: Safe Isolation & Dual Approvals</h4>
                  <p className="text-[10px] text-[#7a8b95] uppercase font-bold mt-0.5">กติกากักคลังสินค้าควบคุมความมั่งคั่งและรักษามาตรฐานความปลอดภัยปนเปื้อน</p>
                </div>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 bg-[#f8f9fa] border border-[#eaeaec] rounded-xl cursor-pointer hover:border-[#932c2e] transition-colors">
                    <input type="checkbox" checked={settings.enableAutoEmailAlert} onChange={e => setSettings({ ...settings, enableAutoEmailAlert: e.target.checked })} className="w-4 h-4 accent-[#212c46]" />
                    <div>
                      <span className="block text-[11px] font-black text-[#212c46] uppercase tracking-wider">Email automatic notify to Board Directors</span>
                      <span className="block text-[9px] text-[#7a8b95] font-bold mt-0.5">ระบบจะส่งสัญญานเตือนภัยเข้ากล่องจดหมายผู้บริหารหน้างานทันที</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-[#f8f9fa] border border-[#eaeaec] rounded-xl cursor-pointer hover:border-[#932c2e] transition-colors">
                    <input type="checkbox" checked={settings.requireDoubleSignature} onChange={e => setSettings({ ...settings, requireDoubleSignature: e.target.checked })} className="w-4 h-4 accent-[#212c46]" />
                    <div>
                      <span className="block text-[11px] font-black text-[#212c46] uppercase tracking-wider">Require Double Signature for Critical Severity</span>
                      <span className="block text-[9px] text-[#7a8b95] font-bold mt-0.5">ต้องได้รับการตรวจลายเซ็นคู่ขนานทั้งผู้ตรวจคัดประเมินและวิศวกรผู้ควบคุม</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-[#f8f9fa] border border-[#eaeaec] rounded-xl cursor-pointer hover:border-[#932c2e] transition-colors">
                    <input type="checkbox" checked={settings.autoIsolateBatchOnCritical} onChange={e => setSettings({ ...settings, autoIsolateBatchOnCritical: e.target.checked })} className="w-4 h-4 accent-[#212c46]" />
                    <div>
                      <span className="block text-[11px] font-black text-[#212c46] uppercase tracking-wider">Automated physical isolation order in Warehouse ERP</span>
                      <span className="block text-[9px] text-[#7a8b95] font-bold mt-0.5">สั่งระงับการจัดส่งแบทช์ออกจากคลังสินค้าเป้าหมายทันทีในฐานระบบ</span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {configStep === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="border-b border-[#eaeaec] pb-2 mb-4">
                  <h4 className="text-[12px] font-black text-[#212c46] uppercase tracking-widest">Step 3: Notification Dispatch Channels</h4>
                  <p className="text-[10px] text-[#7a8b95] uppercase font-bold mt-0.5">ตั้งค่าช่องทางเบี่ยงเบนภัยแอปพลิเคชันระบบหลัก</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Incident Severity Escalate Level</label>
                    <select value={settings.escCategoryAlert} onChange={e => setSettings({ ...settings, escCategoryAlert: e.target.value })} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none">
                      <option value="Critical & High Only">Critical & High (Contaminants / Exceeding Loss Cap Only)</option>
                      <option value="All Levels Including Low">All Inbound Defects Log Alert Notify</option>
                      <option value="Muted Mode">Silent Audit Trace Only (Local persistence active)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Primary Integration Channel</label>
                    <input type="text" value={settings.reportDispatchGateway} onChange={e => setSettings({ ...settings, reportDispatchGateway: e.target.value })} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none focus:border-[#932c2e]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Configuration Footer matched perfectly */}
        <div className="px-6 py-3 bg-[#f8f9fa] border-t border-[#eaeaec] flex justify-end gap-3 shrink-0">
          <button onClick={() => setShowConfigModal(false)} className="px-5 py-2 bg-white border border-[#eaeaec] text-[#414757] rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-[#d7d7d7]/30 transition-all">Cancel</button>
          <button onClick={() => setShowConfigModal(false)} className="bg-[#212c46] hover:bg-[#932c2e] text-white px-6 py-2 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-md transition-all flex items-center gap-2"><Icons.Save size={14} /> Update Policy Settings</button>
        </div>
      </DraggableModal>

      {/* DRAGGABLE ADD / EDIT MULTI-STEP INCIDENT FORM MODAL */}
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
                <h3 className="text-sm font-black text-[#d7d7d7] uppercase tracking-widest leading-none">{editingEntry ? 'Edit Incident Log' : 'New wastage incident log'}</h3>
                <p className="text-[10px] font-bold text-[#d7d7d7]/70 uppercase tracking-widest mt-1">บันทึกสถิติสิ่งสูญเสียพ้นเกณฑ์หน้าโรงงานแปรรูปอาหาร</p>
              </div>
            </div>
            <button onClick={() => setShowEntryModal(false)} className="text-white/60 hover:text-white p-1 rounded-lg transition-colors"><Icons.X size={20} /></button>
          </div>
        }
      >
        <div className="p-6 space-y-4 text-[#414757]">
          {/* Step Wizards Navigation */}
          <div className="flex items-center gap-2 border-b border-[#eaeaec] pb-3 mb-4 shrink-0 justify-between">
            <span className="text-[11px] font-black text-[#212c46] uppercase tracking-widest">Multi-Step Validation Wizard</span>
            <div className="flex items-center gap-1">
              {[0, 1].map(sIdx => (
                <button key={sIdx} onClick={() => setEntryStep(sIdx)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${entryStep === sIdx ? 'bg-[#212c46] text-white' : 'bg-[#f8f9fa] text-[#7a8b95]'}`}>
                  Step {sIdx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Wizard Content Pages */}
          {entryStep === 0 ? (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1">Inspected Date</label>
                  <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2 text-[12px] font-bold text-[#212c46] outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1">Batch ID</label>
                  <input type="text" value={formBatchId} onChange={e => setFormBatchId(e.target.value)} placeholder="e.g. BT-SGB-2605A" className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2 text-[12px] font-bold text-[#212c46] outline-none focus:border-[#932c2e]" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1">Product Description</label>
                <select value={formProductName} onChange={e => setFormProductName(e.target.value)} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2 text-[12px] font-bold text-[#212c46] outline-none">
                  <option value="Smoked Garlic Bologna 1kg">Smoked Garlic Bologna 1kg</option>
                  <option value="Cheese Sausage 200g">Cheese Sausage 200g</option>
                  <option value="Hotdog Sausage 150g">Hotdog Sausage 150g</option>
                  <option value="Vienna Ham 2kg">Vienna Ham 2kg</option>
                  <option value="Frankfurter Chicken Sausage 500g">Frankfurter Chicken Sausage 500g</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1">Reject Type Category</label>
                  <select value={formRejectTypeId} onChange={e => setFormRejectTypeId(e.target.value)} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2 text-[12px] font-bold text-[#212c46] outline-none">
                    {REJECT_TYPES.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1">Loss Quantity (Packs)</label>
                  <input type="number" value={formQuantity} onChange={e => setFormQuantity(Number(e.target.value))} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2 text-[12px] font-bold text-[#212c46] outline-none" />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1">Severity / Urgency</label>
                  <select value={formSeverity} onChange={e => setFormSeverity(e.target.value)} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2 text-[12px] font-bold text-[#212c46] outline-none">
                    <option value="Low">Low - Minor cosmetic issue</option>
                    <option value="Medium">Medium - Standard process issue</option>
                    <option value="Critical">Critical - High risk isolated food loss</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1">Disposition Action</label>
                  <select value={formStatus} onChange={e => setFormStatus(e.target.value)} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2 text-[12px] font-bold text-[#212c46] outline-none">
                    <option value="Re-work">Re-work / Corrective Action</option>
                    <option value="Scrapped">Scrapped / Scrap metal collector</option>
                    <option value="Disposed">Disposed / Bio-waste incinerator</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1">Inspector Name</label>
                  <input type="text" value={formInspectedBy} onChange={e => setFormInspectedBy(e.target.value)} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2 text-[12px] font-bold text-[#212c46] outline-none focus:border-[#932c2e]" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1">Quarantine Supervisor Signature / Initials</label>
                  <input type="text" value={formApprovedBy} onChange={e => setFormApprovedBy(e.target.value)} placeholder="e.g. SUDA QUALITY" className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2 text-[12px] font-bold text-[#212c46] outline-none focus:border-[#932c2e]" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1">Root Cause Explanation</label>
                <textarea rows={3} value={formCause} onChange={e => setFormCause(e.target.value)} placeholder="Please detail the specific machine faults, temperature failures or casing defects found..." className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl p-3 text-[12px] font-bold text-[#212c46] outline-none focus:border-[#932c2e] resize-none" />
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="flex justify-between items-center pt-4 border-t-[1.5px] border-[#eaeaec] shrink-0 mt-4">
            <div>
              {entryStep > 0 ? (
                <button onClick={() => setEntryStep(prev => prev - 1)} className="px-5 py-2.5 bg-[#f8f9fa] hover:bg-[#d7d7d7]/30 border border-[#eaeaec] text-[#414757] rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all">Previous Step</button>
              ) : (
                <button onClick={() => setShowEntryModal(false)} className="px-5 py-2.5 bg-white border border-[#eaeaec] text-[#414757] rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-[#d7d7d7]/30 transition-all">Cancel</button>
              )}
            </div>
            <div className="flex gap-2">
              {entryStep < 1 ? (
                <button onClick={() => setEntryStep(prev => prev + 1)} className="bg-[#212c46] hover:bg-[#932c2e] text-white px-6 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-md transition-all">Next Step</button>
              ) : (
                <button onClick={handleSaveEntry} className="bg-[#212c46] hover:bg-[#657f4d] text-white px-6 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg transition-all flex items-center gap-2"><Icons.Save size={14} /> Commit Event Verification</button>
              )}
            </div>
          </div>
        </div>
      </DraggableModal>
    </div>
  );
}
