import React, { useState, useEffect, useMemo } from 'react';
import * as Icons from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
  PieChart,
  Pie,
  ComposedChart,
  Area
} from 'recharts';
import { DraggableModal } from '../../components/shared/DraggableModal';
import KpiCard from '../../components/shared/KpiCard';
import { UserGuidePanel } from '../../components/shared/UserGuidePanel';
import UserGuideButton from '../../components/shared/UserGuideButton';
import { useCollection } from '../../services/useFirestore';

// --- System Theme Configuration ---
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
  coolGray: '#eaeaec'
};

// --- Preset Lists ---
const SHIFTS = ['Shift A (Day)', 'Shift B (Night)'];
const LINES = ['Line 1 (Processing)', 'Line 2 (Forming)', 'Line 3 (Packaging)'];
const PRODUCTS = [
  'Smoked Garlic Bologna 1kg',
  'Cheese Sausage 200g',
  'Hotdog Sausage 150g',
  'Vienna Ham 2kg',
  'Frankfurter Chicken Sausage 500g'
];

const INITIAL_REPORTS_LEDGER = [
  {
    id: 'REP-260601-01',
    date: '2026-06-01',
    shift: 'Shift A (Day)',
    lineId: 'Line 1 (Processing)',
    productName: 'Smoked Garlic Bologna 1kg',
    targetQty: 5000,
    actualQty: 4940,
    defectQty: 30,
    downtimeMin: 15,
    status: 'Approved',
    supervisor: 'QC SUDA',
    remarks: 'Smooth operation, minor blade adjustment downtime on slicing loop.',
    yieldRate: 98.8,
    oee: 88.5
  },
  {
    id: 'REP-260531-02',
    date: '2026-05-31',
    shift: 'Shift B (Night)',
    lineId: 'Line 2 (Forming)',
    productName: 'Cheese Sausage 200g',
    targetQty: 12000,
    actualQty: 11800,
    defectQty: 120,
    downtimeMin: 45,
    status: 'Approved',
    supervisor: 'QC NARONG',
    remarks: 'Slight delay during casing shift. Product meets all sensory specs.',
    yieldRate: 98.3,
    oee: 84.0
  },
  {
    id: 'REP-260531-01',
    date: '2026-05-31',
    shift: 'Shift A (Day)',
    lineId: 'Line 1 (Processing)',
    productName: 'Hotdog Sausage 150g',
    targetQty: 8000,
    actualQty: 7850,
    defectQty: 80,
    downtimeMin: 30,
    status: 'Approved',
    supervisor: 'QC SUDA',
    remarks: 'Routine hygiene rinse delay. Meat formulation pH within strict limits.',
    yieldRate: 98.1,
    oee: 86.2
  },
  {
    id: 'REP-260530-02',
    date: '2026-05-30',
    shift: 'Shift B (Night)',
    lineId: 'Line 3 (Packaging)',
    productName: 'Smoked Garlic Bologna 1kg',
    targetQty: 5000,
    actualQty: 4350,
    defectQty: 350,
    downtimeMin: 110,
    status: 'Flagged',
    supervisor: 'QC NARONG',
    remarks: 'Critical pressure valve failure on thermoforming line. Secondary seal audit was triggered.',
    yieldRate: 87.0,
    oee: 62.5
  },
  {
    id: 'REP-260530-01',
    date: '2026-05-30',
    shift: 'Shift A (Day)',
    lineId: 'Line 2 (Forming)',
    productName: 'Vienna Ham 2kg',
    targetQty: 3000,
    actualQty: 2985,
    defectQty: 10,
    downtimeMin: 12,
    status: 'Approved',
    supervisor: 'QC SUDA',
    remarks: 'Exceptional consistency. Minimal downtime for raw material loader.',
    yieldRate: 99.5,
    oee: 92.4
  },
  {
    id: 'REP-260529-01',
    date: '2026-05-29',
    shift: 'Shift A (Day)',
    lineId: 'Line 3 (Packaging)',
    productName: 'Frankfurter Chicken Sausage 500g',
    targetQty: 6000,
    actualQty: 5920,
    defectQty: 65,
    downtimeMin: 22,
    status: 'Approved',
    supervisor: 'QC NARONG',
    remarks: 'Label alignment test completed, minimal waste accounted for.',
    yieldRate: 98.6,
    oee: 87.1
  }
];

export default function DailyProdReport() {
  const [activeTab, setActiveTab] = useState('list_mode'); // list_mode | charts_mode
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // --- Theme Synced Configuration Setting Node (Matched with User Permissions) ---
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configStep, setConfigStep] = useState(0);
  const [settings, setSettings] = useState({
    minAcceptableYield: 98.0,      // Minimum yield percentage before alerts are triggered
    targetOeeLevel: 85,            // Target Overal Equipment Effectiveness percentage
    maxDowntimeMin: 60,            // Max allowable downtime mins per shift
    requireDoubleReview: true,     // Require verifier signature when state fails parameters
    autoFlagAlert: true,           // Flag reports with failure trends automatically
    lockDurationHr: 24,            // Automatic edit lock limit hours
    summaryTimeZone: 'GMT+7 (Indochina Time)',
    primaryGateway: 'SAP ERP & Google Workspace Spreadsheet Hook'
  });

  // --- Add/Edit Report Logs Action Modal ---
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [entryStep, setEntryStep] = useState(0);

  // Form Fields State
  const [formDate, setFormDate] = useState('2026-06-01');
  const [formShift, setFormShift] = useState('Shift A (Day)');
  const [formLineId, setFormLineId] = useState('Line 1 (Processing)');
  const [formProductName, setFormProductName] = useState('Smoked Garlic Bologna 1kg');
  const [formTargetQty, setFormTargetQty] = useState(5000);
  const [formActualQty, setFormActualQty] = useState(4900);
  const [formDefectQty, setFormDefectQty] = useState(25);
  const [formDowntimeMin, setFormDowntimeMin] = useState(15);
  const [formStatus, setFormStatus] = useState('Approved'); // Approved, Flagged, Draft
  const [formSupervisor, setFormSupervisor] = useState('QC SUDA');
  const [formRemarks, setFormRemarks] = useState('');

  // Firestore integration with local mock state fallback
  const { data: dbReports, add: addReport, update: updateReport } = useCollection<any>('daily_production_reports');
  const [localReports, setLocalReports] = useState<any[]>(INITIAL_REPORTS_LEDGER);

  // Sync merged collection
  const reports = useMemo(() => {
    const merged = [...dbReports];
    localReports.forEach(loc => {
      if (!merged.find(m => m.id === loc.id)) {
        merged.push(loc);
      }
    });
    return merged.sort((a, b) => b.date.localeCompare(a.date));
  }, [dbReports, localReports]);

  // Filtering System
  const filteredReports = useMemo(() => {
    return reports.filter(rep => {
      const q = search.toLowerCase();
      return (
        rep.id.toLowerCase().includes(q) ||
        rep.productName.toLowerCase().includes(q) ||
        rep.shift.toLowerCase().includes(q) ||
        rep.lineId.toLowerCase().includes(q) ||
        rep.supervisor.toLowerCase().includes(q) ||
        (rep.remarks && rep.remarks.toLowerCase().includes(q))
      );
    });
  }, [reports, search]);

  // Pagination calculation
  const currentData = useMemo(() => {
    return filteredReports.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredReports, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage) || 1;

  // Real-time Calculators
  const totalActualOutput = useMemo(() => {
    return reports.reduce((sum, item) => sum + Number(item.actualQty || 0), 0);
  }, [reports]);

  const totalPlannedTarget = useMemo(() => {
    return reports.reduce((sum, item) => sum + Number(item.targetQty || 0), 0);
  }, [reports]);

  const totalDefectQty = useMemo(() => {
    return reports.reduce((sum, item) => sum + Number(item.defectQty || 0), 0);
  }, [reports]);

  const totalDowntimeMin = useMemo(() => {
    return reports.reduce((sum, item) => sum + Number(item.downtimeMin || 0), 0);
  }, [reports]);

  const averageOee = useMemo(() => {
    if (reports.length === 0) return 0;
    const sum = reports.reduce((s, item) => s + Number(item.oee || 0), 0);
    return Number((sum / reports.length).toFixed(1));
  }, [reports]);

  const averageYield = useMemo(() => {
    if (reports.length === 0) return 0;
    const sum = reports.reduce((s, item) => s + Number(item.yieldRate || 0), 0);
    return Number((sum / reports.length).toFixed(2));
  }, [reports]);

  const flaggedReportsCount = useMemo(() => {
    return reports.filter(item => item.status === 'Flagged' || item.yieldRate < settings.minAcceptableYield).length;
  }, [reports, settings.minAcceptableYield]);

  // Recharts structured bindings
  const chartDailyTargetVsActual = useMemo(() => {
    const dates = Array.from(new Set(reports.map(r => r.date))).sort();
    return dates.map(dt => {
      const records = reports.filter(r => r.date === dt);
      const planned = records.reduce((s, x) => s + Number(x.targetQty), 0);
      const actual = records.reduce((s, x) => s + Number(x.actualQty), 0);
      return {
        date: dt,
        Planned: planned,
        Actual: actual
      };
    });
  }, [reports]);

  const chartOeeAndYieldCorrelation = useMemo(() => {
    return reports.map(r => ({
      name: `${r.date} - ${r.shift.split(' ')[1]}`,
      OEE: r.oee,
      Yield: r.yieldRate,
      Downtime: r.downtimeMin
    })).reverse();
  }, [reports]);

  const chartProductLossPie = useMemo(() => {
    const map: { [key: string]: number } = {};
    reports.forEach(r => {
      map[r.productName] = (map[r.productName] || 0) + Number(r.defectQty || 0);
    });
    return Object.entries(map).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value);
  }, [reports]);

  // Modal Handlers
  const handleOpenAdd = () => {
    setEditingEntry(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormShift('Shift A (Day)');
    setFormLineId('Line 1 (Processing)');
    setFormProductName('Smoked Garlic Bologna 1kg');
    setFormTargetQty(5000);
    setFormActualQty(4920);
    setFormDefectQty(15);
    setFormDowntimeMin(10);
    setFormStatus('Approved');
    setFormSupervisor('QC SUDA');
    setFormRemarks('');
    setEntryStep(0);
    setShowEntryModal(true);
  };

  const handleOpenEdit = (entry: any) => {
    setEditingEntry(entry);
    setFormDate(entry.date);
    setFormShift(entry.shift);
    setFormLineId(entry.lineId);
    setFormProductName(entry.productName);
    setFormTargetQty(entry.targetQty);
    setFormActualQty(entry.actualQty);
    setFormDefectQty(entry.defectQty);
    setFormDowntimeMin(entry.downtimeMin);
    setFormStatus(entry.status);
    setFormSupervisor(entry.supervisor);
    setFormRemarks(entry.remarks || '');
    setEntryStep(0);
    setShowEntryModal(true);
  };

  const handleSaveReport = async () => {
    // Dynamic math evaluations
    const totalProduced = Number(formActualQty) + Number(formDefectQty);
    const calculatedYieldRate = Number(((Number(formActualQty) / (totalProduced || 1)) * 100).toFixed(2));
    
    // Standard OEE math model: (Availability * Performance * Quality)
    // Here we deduce a reasonable OEE estimate derived from planned vs. actual output and downtime
    const idealProductionTimeMin = 480; // 8 hours shift
    const runtime = idealProductionTimeMin - Number(formDowntimeMin);
    const availabilityRate = runtime / idealProductionTimeMin;
    const speedRatio = Number(formActualQty) / Number(formTargetQty);
    const performanceRate = Math.min(1.0, speedRatio > 0 ? speedRatio : 0.95);
    const qualityRate = calculatedYieldRate / 100;
    
    let calculatedOee = Math.round(availabilityRate * performanceRate * qualityRate * 100);
    if (calculatedOee > 100) calculatedOee = 98;
    if (calculatedOee < 30) calculatedOee = 30;

    const finalStatus = (calculatedYieldRate < settings.minAcceptableYield || Number(formDowntimeMin) > settings.maxDowntimeMin) && settings.autoFlagAlert
      ? 'Flagged'
      : formStatus;

    const dataObj = {
      date: formDate,
      shift: formShift,
      lineId: formLineId,
      productName: formProductName,
      targetQty: Number(formTargetQty),
      actualQty: Number(formActualQty),
      defectQty: Number(formDefectQty),
      downtimeMin: Number(formDowntimeMin),
      status: finalStatus,
      supervisor: formSupervisor,
      remarks: formRemarks || 'Standard verification batch parameters confirmed.',
      yieldRate: calculatedYieldRate,
      oee: calculatedOee
    };

    if (editingEntry) {
      if (typeof editingEntry.id === 'string' && editingEntry.id.length > 10) {
        await updateReport(editingEntry.id, dataObj);
      } else {
        setLocalReports(prev => prev.map(item => item.id === editingEntry.id ? { ...item, ...dataObj } : item));
      }
    } else {
      const generatedId = `REP-${formDate.replace(/-/g, '').slice(2)}-${formShift === 'Shift A (Day)' ? 'A' : 'B'}-${formLineId.match(/\d+/) ? formLineId.match(/\d+/)![0] : '1'}`;
      try {
        await addReport({ id: generatedId, ...dataObj });
      } catch (err) {
        setLocalReports(prev => [{ id: generatedId, ...dataObj }, ...prev]);
      }
    }

    setShowEntryModal(false);
    setEditingEntry(null);
  };

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Report ID,Date,Shift,Line,Product,Target Qty,Actual Qty,Defects,Downtime (Mins),Yield Rate (%),OEE (%),Supervisor,Remarks,Status\n';
    
    reports.forEach(r => {
      const row = [
        r.id, r.date, r.shift, r.lineId, `"${r.productName}"`, r.targetQty, r.actualQty, r.defectQty, r.downtimeMin, r.yieldRate, r.oee, `"${r.supervisor}"`, `"${(r.remarks || '').replace(/"/g, '""')}"`, r.status
      ].join(',');
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Daily_Production_Report_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-1 w-full flex-col animate-fadeIn bg-transparent space-y-4">
      {/* GLOBAL USER GUIDE PANEL (Synced with User Permissions spec) */}
      <UserGuideButton onClick={() => setIsGuideOpen(true)} />

      <UserGuidePanel
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        title="DAILY PRODUCTION REPORT GUIDE"
        subtitle="PRODUCTION & OEE MONITORING MANUAL"
      >
        <div className="space-y-8 font-sans">
            <div>
                <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                    <Icons.FileBarChart size={16} className="text-[#3f809e]" /> 1. ภาพรวมการรายงานผลผลิต (OVERVIEW)
                </h3>
                <p className="mb-4 text-[#414757]">
                    โมดูลรายงานการผลิตรายวัน ใช้สำหรับรวบรวมยอดผลิตเสร็จสมบูรณ์ต่อกะเทียบกับเป้าหมายที่ตั้งไว้ (Target vs Actual) รวมไปถึงการประเมิน <strong>OEE (Overall Equipment Effectiveness)</strong> เพื่อให้รู้ว่าวันนี้เราสูญเสียเวลาไปกับ Downtime หรือของเสียไปเท่าไร
                </p>
                <div className="p-4 bg-[#f8f9fa] border border-[#eaeaec] flex items-start gap-4 rounded-xl text-[12px]">
                    <div className="bg-[#a94228] text-white p-2 rounded-lg shrink-0"><Icons.ShieldAlert size={16} /></div>
                    <div>
                        <strong className="text-[#212c46]">System Safety Logic</strong>
                        <p className="text-[#7a8b95]">ถ้า Yield (เปอร์เซ็นต์ผลผลิตดี) ออกมาต่ำกว่า {settings.minAcceptableYield}% ระบบจะทำการขึ้นประทับตรา <strong>FLAGGED</strong> (เฝ้าระวังสีแดง) ในรายงานตัวท็อปทันที เพื่อแจ้งเตือนผู้อำนวยการโรงงาน</p>
                    </div>
                </div>
            </div>

            <div className="h-px bg-[#eaeaec] w-full" />

            <div>
                <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                    <Icons.TrendingUp size={16} className="text-[#b58c4f]" /> 2. การวัดผล OEE (OEE BASELINES)
                </h3>
                <ul className="list-decimal pl-5 space-y-2 text-[#414757] text-[12px]">
                    <li><strong>เป้าหมายหลัก:</strong> แผนกผลิตจะต้องรักษาระดับผลลัพธ์ OEE ให้อยู่เหนือ {settings.targetOeeLevel}% เป็นเกณฑ์ขั้นต่ำตามนโยบายบริษัท</li>
                    <li><strong>Downtime Containment Guard:</strong> ใน 1 กะอนุญาตให้มีการหยุดเครื่องแบบพึ่งระวังไม่เกิน {settings.maxDowntimeMin} นาที หากเกินขีดจำกัด ผู้ควบคุมไลน์ (Supervisor) จำเป็นต้องระบุหมายเหตุ/สาเหตุลงช่อง Remarks เสมอ</li>
                </ul>
            </div>

            <div className="h-px bg-[#eaeaec] w-full" />

            <div>
                <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                    <Icons.CheckCircle size={16} className="text-[#688a58]" /> 3. ขั้นตอนการลงรายงานสำหรับเจ้าหน้าที่ (OPERATORS)
                </h3>
                <div className="space-y-2 text-[#414757] text-[12px]">
                    <p>1. กดปุ่ม <strong className="text-[#212c46]">+ NEW REPORT ENTRY</strong> เพื่อเปิดแผ่นบันทึกสำหรับกะนั้นๆ</p>
                    <p>2. กรอกตัวเลขเป้าหมาย <strong>(Target)</strong> เทียบกับ ตัวเลขที่แพ็คเสร็จนับเข้าคลังจริง <strong>(Actual)</strong> ของสินค้านั้น</p>
                    <p>3. หากเกิดเครื่องจักรขัดข้อง ให้ระบุเวลา <strong>Downtime (Min)</strong> อย่างซื่อตรง เพื่อให้ระบบแม่นยำ</p>
                    <p>4. เมื่อเซฟแล้วหากยังไม่สมบูรณ์ข้อมูลจะถูกตั้งเป็น ดราฟท์ ไว้ก่อน และสามารถกด Approve เพื่อยืนยันเข้าที่ประชุมลีดเดอร์ได้</p>
                </div>
            </div>
        </div>
      </UserGuidePanel>

      {/* HEADER NODE CONTAINER */}
      <div className="h-14 px-4 sm:px-8 flex flex-row items-center justify-between gap-4 z-20 shrink-0">
        <div className="flex items-center gap-5">
          <div className="relative flex items-center justify-center group cursor-default shrink-0">
            <div className="absolute inset-0 bg-[#3f809e] blur-[15px] opacity-25 rounded-full group-hover:opacity-70 transition-all duration-700"></div>
            <div className="relative z-10 p-1.5 border border-[#3f809e]/40 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm">
              <Icons.FileBarChart size={28} strokeWidth={2.5} className="text-[#3f809e]" />
            </div>
          </div>
          <div>
            <h3 className="font-black text-[#212c46] uppercase tracking-tighter leading-none font-exception-header text-[24px]">
              DAILY PROD. <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3f809e] to-[#b58c4f]">REPORT</span> CENTER
            </h3>
            <p className="text-[11px] font-bold text-[#4d5a44] uppercase tracking-[0.2em] mt-0.5 opacity-80 leading-none">
              ISO 9001 COMPLIANT PRODUCTION EFFICIENCY & OEE MONITORS
            </p>
          </div>
        </div>

        {/* TOP LEVEL CONTROLS */}
        <div className="flex items-center gap-4">
          <div className="bg-white/50 p-1.5 rounded-xl border border-white/60 shadow-inner flex flex-wrap items-center gap-1">
            <button
              onClick={() => setActiveTab('list_mode')}
              className={`px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'list_mode' ? 'bg-[#212c46] text-white shadow-md' : 'text-[#7a8b95] hover:text-[#3f809e] hover:bg-[#d7d7d7]/20'}`}
            >
              <Icons.ListCollapse size={16} /> Ledger Records
            </button>
            <button
              onClick={() => setActiveTab('charts_mode')}
              className={`px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'charts_mode' ? 'bg-[#212c46] text-white shadow-md' : 'text-[#7a8b95] hover:text-[#3f809e] hover:bg-[#d7d7d7]/20'}`}
            >
              <Icons.BarChart3 size={16} /> Visual Analytics
            </button>
          </div>
          
          {/* Policy Settings Node Trigger */}
          <button
            onClick={() => { setConfigStep(0); setShowConfigModal(true); }}
            className="bg-white border border-[#eaeaec] text-[#212c46] hover:text-[#3f809e] hover:border-[#3f809e] p-2.5 rounded-xl shadow-sm hover:shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Icons.Settings size={18} />
          </button>
        </div>
      </div>

      {/* SYSTEM KPI MODULES GRID */}
      <div className="mx-auto px-4 sm:px-8 w-full mt-[2px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 shrink-0">
          <KpiCard
            label="Actual Yield Rate"
            value={`${averageYield}%`}
            icon="target"
            colorAccent={averageYield < settings.minAcceptableYield ? THEME.danger : THEME.success}
            colorValue={THEME.primary}
            desc={`Acceptable baseline: ${settings.minAcceptableYield}%`}
          />
          <KpiCard
            label="Avg OEE Rating"
            value={`${averageOee}%`}
            icon="zap"
            colorAccent={averageOee < settings.targetOeeLevel ? THEME.gold : THEME.success}
            colorValue={THEME.primary}
            desc={`Target threshold: ${settings.targetOeeLevel}%`}
          />
          <KpiCard
            label="Cumulative Downtime"
            value={`${totalDowntimeMin} Mins`}
            icon="clock"
            colorAccent={THEME.primaryLight}
            colorValue={THEME.primary}
            desc="Total across active shifts"
          />
          <KpiCard
            label="Incidents / Flagged"
            value={`${flaggedReportsCount} Reports`}
            icon="shield-alert"
            colorAccent={flaggedReportsCount > 0 ? THEME.danger : THEME.success}
            colorValue={flaggedReportsCount > 0 ? THEME.danger : THEME.success}
            desc="Requiring secondary audits"
          />
        </div>

        {/* SCREEN VIEWS */}
        {activeTab === 'list_mode' ? (
          <div className="bg-white rounded-xl shadow-lg border border-[#eaeaec] overflow-hidden flex flex-col animate-fadeIn">
            
            {/* SUB-HEADER FILTERS & ACTIONS */}
            <div className="px-8 py-4 border-b border-[#eaeaec] bg-[#f8f9fa] flex flex-col lg:flex-row justify-between items-center gap-4 shrink-0">
              <span className="text-[11px] font-black text-[#7a8b95] uppercase tracking-widest bg-white border border-[#eaeaec] px-4 py-2 rounded-xl shadow-sm">
                DAILY SHIFT LOGS AUDIT TRAIL
              </span>
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
                <div className="relative w-full sm:w-80">
                  <Icons.Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#7a8b95]" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                    placeholder="Search Shift, Line, Product, Supervisor..."
                    className="w-full pl-12 pr-6 py-2.5 text-[12px] border border-[#eaeaec] rounded-full font-bold outline-none focus:border-[#3f809e] bg-white shadow-sm text-[#212c46]"
                  />
                </div>
                
                {/* Export Data Hook */}
                <button
                  onClick={handleExportCSV}
                  className="bg-white border border-[#eaeaec] hover:border-[#b58c4f] hover:text-[#b58c4f] text-[#212c46] px-5 py-2.5 rounded-full font-black text-[11px] uppercase tracking-widest shadow-sm hover:shadow-md transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
                >
                  <Icons.Download size={15} /> Export Ledger
                </button>

                {/* Log Entry Button */}
                <button
                  onClick={handleOpenAdd}
                  className="bg-[#212c46] hover:bg-[#3f809e] text-white px-6 py-2.5 rounded-full font-black text-[11px] uppercase tracking-widest shadow-md hover:shadow-lg transition-all flex items-center gap-2 border border-[#212c46] active:scale-95 cursor-pointer"
                >
                  <Icons.Plus size={16} /> Log Daily Performance
                </button>
              </div>
            </div>

            {/* LEDGER GRID TABLE */}
            <div className="overflow-auto custom-scrollbar">
              <table className="w-full text-left border-collapse table-font">
                <thead className="sys-table-header [#b58c4f] ">
                    <tr>
                    <th className="font-black uppercase tracking-widest whitespace-nowrap">Report ID / Date</th>
                    <th className="font-black uppercase tracking-widest whitespace-nowrap">Shift Node / Line</th>
                    <th className="font-black uppercase tracking-widest whitespace-nowrap w-[150px] max-w-[150px]">Target Product Name</th>
                    <th className="font-black uppercase tracking-widest text-center whitespace-nowrap w-[130px]">Output</th>
                    <th className="font-black uppercase tracking-widest text-center whitespace-nowrap">Yield Rate</th>
                    <th className="font-black uppercase tracking-widest text-center whitespace-nowrap">OEE Efficiency</th>
                    <th className="font-black uppercase tracking-widest text-center whitespace-nowrap">Downtime</th>
                    <th className="font-black uppercase tracking-widest whitespace-nowrap">Auditor Remarks</th>
                    <th className="font-black uppercase tracking-widest text-center whitespace-nowrap">Compliance</th>
                    <th className="font-black uppercase tracking-widest text-center whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#eaeaec]">
                  {currentData.length === 0 ? (
                    <tr>
                      <td className="text-center text-[#7a8b95] uppercase font-black tracking-widest text-[12px] py-2.5 px-4">
                        No recorded production shift logs found in the archives.
                      </td>
                    </tr>
                  ) : (
                    currentData.map((rep) => {
                      const isLowYield = rep.yieldRate < settings.minAcceptableYield;
                      const isLowOee = rep.oee < settings.targetOeeLevel;
                      
                      return (
                        <tr key={rep.id} className="hover:bg-[#f8f9fa] transition-colors group">
                          <td className="px-4 whitespace-nowrap font-mono font-black text-[#212c46] py-2.5">
                            <div className="flex flex-col">
                              <span className="text-[12px]">{rep.id}</span>
                              <span className="text-[9px] text-[#7a8b95] font-bold mt-0.5">{rep.date}</span>
                            </div>
                          </td>
                          <td className="px-4 whitespace-nowrap py-2.5">
                            <div className="flex flex-col">
                              <span className="font-extrabold uppercase text-[#212c46] text-[11px]">{rep.shift}</span>
                              <span className="text-[10px] text-[#3f809e] font-bold uppercase mt-0.5">{rep.lineId}</span>
                            </div>
                          </td>
                          <td className="px-4 whitespace-nowrap w-[150px] max-w-[150px] py-2.5" title={rep.productName}>
                            <span className="font-black text-[#212c46] uppercase text-[12px] tracking-tight block truncate">{rep.productName}</span>
                          </td>
                          <td className="px-4 whitespace-nowrap text-center w-[130px] py-2.5">
                            <div className="flex flex-col items-center">
                              <span className="text-[12px] font-black text-[#212c46]">
                                {rep.actualQty.toLocaleString()} / <span className="text-[#7a8b95] font-semibold">{rep.targetQty.toLocaleString()}</span> Packs
                              </span>
                              <div className="w-24 bg-[#eaeaec] h-1.5 rounded-full overflow-hidden mt-1 flex">
                                <div
                                  className={`h-full rounded-full ${isLowYield ? 'bg-[#932c2e]' : 'bg-[#657f4d]'}`}
                                  style={{ width: `${Math.min(100, (rep.actualQty / rep.targetQty) * 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 whitespace-nowrap text-center py-2.5">
                            <span className={`text-[12px] font-black inline-flex items-center gap-1 ${isLowYield ? 'text-[#932c2e]' : 'text-[#657f4d]'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isLowYield ? 'bg-[#932c2e]' : 'bg-[#657f4d]'}`} />
                              {rep.yieldRate}%
                            </span>
                          </td>
                          <td className="px-4 whitespace-nowrap text-center py-2.5">
                            <div className="inline-flex flex-col items-center">
                              <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-black border text-center ${isLowOee ? 'bg-[#b58c4f]/10 text-[#b58c4f] border-[#b58c4f]/20' : 'bg-[#657f4d]/10 text-[#657f4d] border-[#657f4d]/20'}`}>
                                {rep.oee}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 whitespace-nowrap text-center py-2.5">
                            <span className={`text-[11px] font-bold ${rep.downtimeMin > settings.maxDowntimeMin ? 'text-[#932c2e] font-black' : 'text-[#414757]'}`}>
                              {rep.downtimeMin} Mins
                            </span>
                          </td>
                          <td className="px-4 w-[350px] max-w-[350px] py-2.5">
                            <div className="w-full relative group" title={rep.remarks || '-'}>
                              <p className="text-[11px] font-bold text-[#414757] leading-tight truncate">{rep.remarks || '-'}</p>
                              <span className="text-[9px] uppercase font-bold text-[#7a8b95] mt-0.5 block truncate">Supervisor: {rep.supervisor}</span>
                            </div>
                          </td>
                          <td className="px-4 whitespace-nowrap text-center py-2.5">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase border tracking-wider shadow-sm ${rep.status === 'Approved' ? 'bg-[#657f4d]/15 text-[#657f4d] border-[#657f4d]/30' : 'bg-[#932c2e]/10 text-[#a94228] border-[#a94228]/35 animate-pulse'}`}>
                              {rep.status === 'Approved' ? <Icons.CheckSquare size={10}/> : <Icons.AlertTriangle size={10}/>}
                              {rep.status}
                            </span>
                          </td>
                          <td className="px-4 whitespace-nowrap text-center py-2.5">
                            <button
                              onClick={() => handleOpenEdit(rep)}
                              className="p-2 text-[#4d87a8] hover:bg-[#4d87a8]/10 rounded-xl border border-transparent hover:border-[#4d87a8]/30 transition-all cursor-pointer"
                            >
                              <Icons.Edit3 size={15} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* LOWER PAGINATION COMPONENT */}
            <div className="px-8 py-3 bg-[#f8f9fa] border-t border-[#eaeaec] flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
              <div className="flex items-center gap-6 text-[11px] font-black text-[#7a8b95] uppercase tracking-widest">
                <div className="flex items-center gap-3">
                  <span>Show Rows:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="bg-white border border-[#eaeaec] rounded-lg px-3 py-1.5 outline-none font-black text-[#212c46] cursor-pointer shadow-sm focus:border-[#3f809e]"
                  >
                    {[5, 10, 20, 50].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <p className="bg-white px-4 py-2 rounded-xl border border-[#eaeaec] shadow-sm">Total Record Count: {filteredReports.length}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`w-10 h-10 border border-[#eaeaec] bg-white rounded-xl flex items-center justify-center transition-all ${currentPage === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#212c46] hover:text-white shadow-md active:scale-90 cursor-pointer'}`}
                >
                  <Icons.ChevronLeft size={18} />
                </button>
                <div className="bg-[#212c46] text-white px-8 py-2.5 rounded-xl shadow-md font-black text-[11px] min-w-[140px] text-center uppercase tracking-widest">
                  Page {currentPage} / {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`w-10 h-10 border border-[#eaeaec] bg-white rounded-xl flex items-center justify-center transition-all ${currentPage === totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#212c46] hover:text-white shadow-md active:scale-90 cursor-pointer'}`}
                >
                  <Icons.ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* CHARTS MODE VIEW */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
            {/* GRAPH ONE: Target Volume compare */}
            <div className="lg:col-span-8 bg-white p-6 rounded-xl shadow-lg border border-[#eaeaec] flex flex-col justify-between">
              <div className="border-b-2 border-[#b58c4f] pb-4 mb-4">
                <h4 className="text-[14px] font-black uppercase text-[#212c46] tracking-widest flex items-center gap-3">
                  <Icons.TrendingUp size={20} className="text-[#3f809e]" /> Daily Output Integrity Profile
                </h4>
                <p className="text-[11px] font-bold text-[#7a8b95] uppercase tracking-widest mt-1">เปรียบเทียบค่าความคาดเคลื่อนระหว่างเป้าหมายจัดงานและขอบเขตชิ้นงานจริงรายวัน</p>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartDailyTargetVsActual} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaec" />
                    <XAxis dataKey="date" stroke="#7a8b95" fontSize={10} tickLine={false} />
                    <YAxis stroke="#7a8b95" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#212c46', border: 'none', color: '#fff', borderRadius: '12px', fontSize: '11px', fontFamily: 'monospace' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
                    <Bar dataKey="Planned" name="Target Plan (Packs)" fill="#7a8b95" radius={[4, 4, 0, 0]} opacity={0.65} barSize={35} />
                    <Area type="monotone" dataKey="Actual" name="Actual Produced (Packs)" fill="#3f809e" stroke="#3f809e" strokeWidth={2} fillOpacity={0.15} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* GRAPH TWO: Loss Distribution Share */}
            <div className="lg:col-span-4 bg-white p-6 rounded-xl shadow-lg border border-[#eaeaec] flex flex-col justify-between">
              <div className="border-b-2 border-[#b58c4f] pb-4 mb-4">
                <h4 className="text-[14px] font-black uppercase text-[#212c46] tracking-widest flex items-center gap-3">
                  <Icons.PieChart size={20} className="text-[#a94228]" /> Defect Share Analysis
                </h4>
                <p className="text-[11px] font-bold text-[#7a8b95] uppercase tracking-widest mt-1">สัดส่วนความสูญเสียในแบบจำลองสินค้าแต่ละช่วงเวลากะ</p>
              </div>
              <div className="h-64 w-full flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartProductLossPie}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      nameKey="name"
                      labelLine={false}
                    >
                      {chartProductLossPie.map((entry, index) => {
                        const colors = ['#a94228', '#b58c4f', '#3f809e', '#657f4d', '#7a8b95'];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#212c46', border: 'none', color: '#fff', borderRadius: '12px', fontSize: '11px', fontFamily: 'monospace' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5">
                {chartProductLossPie.slice(0, 4).map((item, idx) => {
                  const colors = ['#a94228', '#b58c4f', '#3f809e', '#657f4d', '#7a8b95'];
                  return (
                    <div key={idx} className="flex justify-between items-center text-[10px] font-bold border-b border-[#eaeaec]/60 pb-1 uppercase">
                      <span className="flex items-center gap-1.5 text-[#212c46]">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }} />
                        <span className="truncate max-w-[180px]">{item.name}</span>
                      </span>
                      <span className="font-black text-[#212c46]">{item.value.toLocaleString()} Pcs ({((item.value / (totalDefectQty || 1)) * 100).toFixed(1)}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* GRAPH THREE: Correlation Trends */}
            <div className="lg:col-span-12 bg-white p-6 rounded-xl shadow-lg border border-[#eaeaec]">
              <div className="border-b-2 border-[#b58c4f] pb-4 mb-4">
                <h4 className="text-[14px] font-black uppercase text-[#212c46] tracking-widest flex items-center gap-3">
                  <Icons.Activity size={20} className="text-[#657f4d]" /> OEE % & Yield % Correlation Matrix
                </h4>
                <p className="text-[11px] font-bold text-[#7a8b95] uppercase tracking-widest mt-1">เปรียบเทียบแนวโน้มระหว่างดัชนีประสิทธิภาพเครื่องจักรความเสถียร (OEE) และอัตราสูญเสียของวัตถุดิบ (Yield Rate)</p>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartOeeAndYieldCorrelation} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaec" />
                    <XAxis dataKey="name" stroke="#7a8b95" fontSize={9} tickLine={false} />
                    <YAxis stroke="#7a8b95" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#212c46', border: 'none', color: '#fff', borderRadius: '12px', fontSize: '11px', fontFamily: 'monospace' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="OEE" name="OEE Efficiency (%)" stroke="#657f4d" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="Yield" name="Material Yield Rate (%)" stroke="#932c2e" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- ADD/EDIT MODAL WITH ENTRY STEP FLOW MACHINE --- */}
      <DraggableModal
        isOpen={showEntryModal}
        onClose={() => setShowEntryModal(false)}
        width="max-w-[700px]"
        customHeader={
          <div className="bg-[#212c46] px-5 py-4 flex justify-between items-center border-b-2 border-[#b58c4f] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/20 shadow-sm">
                <Icons.FileBarChart size={20} className="text-[#b58c4f]" />
              </div>
              <div>
                <h3 className="text-[13px] font-black text-[#d7d7d7] uppercase tracking-widest leading-none">
                  {editingEntry ? 'Revise Production Audit Log' : 'Create Daily Performance Entry'}
                </h3>
                <p className="text-[10px] font-bold text-[#d7d7d7]/70 uppercase tracking-widest mt-1">แบบฟอร์มบันทึกออดิตผลงานรายหน้าร้าน (Active Log Node)</p>
              </div>
            </div>
            <button onClick={() => setShowEntryModal(false)} className="text-white/60 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"><Icons.X size={20} /></button>
          </div>
        }
      >
        <div className="bg-white text-[#414757]">
          {/* Form Step Headers */}
          <div className="flex border-b border-[#eaeaec] bg-[#f8f9fa] px-6 py-3 justify-between items-center shrink-0 uppercase tracking-widest text-[9px] font-black">
            <button onClick={() => setEntryStep(0)} className={`flex items-center gap-2 pb-1 transition-all ${entryStep === 0 ? 'text-[#212c46] border-b-2 border-[#212c46]' : 'text-[#7a8b95]'}`}>
              <span className="w-4 h-4 rounded-full bg-[#212c46] text-white flex items-center justify-center font-mono">1</span> Metadata
            </button>
            <button onClick={() => setEntryStep(1)} className={`flex items-center gap-2 pb-1 transition-all ${entryStep === 1 ? 'text-[#212c46] border-b-2 border-[#212c46]' : 'text-[#7a8b95]'}`}>
              <span className="w-4 h-4 rounded-full bg-[#212c46] text-white flex items-center justify-center font-mono">2</span> Efficiencies
            </button>
            <button onClick={() => setEntryStep(2)} className={`flex items-center gap-2 pb-1 transition-all ${entryStep === 2 ? 'text-[#212c46] border-b-2 border-[#212c46]' : 'text-[#7a8b95]'}`}>
              <span className="w-4 h-4 rounded-full bg-[#212c46] text-white flex items-center justify-center font-mono">3</span> Authorization
            </button>
          </div>

          <div className="p-6 space-y-4 max-h-[360px] overflow-y-auto custom-scrollbar">
            {entryStep === 0 && (
              <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                <div>
                  <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Production Date</label>
                  <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-extrabold text-[#212c46] outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Assigned Shift</label>
                  <select value={formShift} onChange={e => setFormShift(e.target.value)} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-semibold text-[#212c46] outline-none">
                    {SHIFTS.map(sh => <option key={sh} value={sh}>{sh}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Processing Pipeline Line ID</label>
                  <select value={formLineId} onChange={e => setFormLineId(e.target.value)} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-semibold text-[#212c46] outline-none">
                    {LINES.map(ln => <option key={ln} value={ln}>{ln}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Main Target Product Name</label>
                  <select value={formProductName} onChange={e => setFormProductName(e.target.value)} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-semibold text-[#212c46] outline-none">
                    {PRODUCTS.map(pr => <option key={pr} value={pr}>{pr}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Standard Target Quantity Plan (Packs)</label>
                  <input type="number" value={formTargetQty} onChange={e => setFormTargetQty(Number(e.target.value))} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-extrabold text-[#212c46] outline-none" />
                </div>
              </div>
            )}

            {entryStep === 1 && (
              <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                <div>
                  <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Actual Produced Quantity (Packs)</label>
                  <input type="number" value={formActualQty} onChange={e => setFormActualQty(Number(e.target.value))} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-extrabold text-[#212c46] outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Defect / Reject Loss Quantity (Packs)</label>
                  <input type="number" value={formDefectQty} onChange={e => setFormDefectQty(Number(e.target.value))} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-extrabold text-[#212c46] outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Total System Downtime Duration (Mins)</label>
                  <input type="number" value={formDowntimeMin} onChange={e => setFormDowntimeMin(Number(e.target.value))} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-extrabold text-[#212c46] outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Delay & Downtime Causes (Root Cause Transcript)</label>
                  <textarea value={formRemarks} onChange={e => setFormRemarks(e.target.value)} placeholder="Explain the primary causes or machine codes activated during production downtime..." className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-semibold text-[#212c46] outline-none h-16 resize-none" />
                </div>
              </div>
            )}

            {entryStep === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Shift Supervisor Auditor Name</label>
                  <input type="text" value={formSupervisor} onChange={e => setFormSupervisor(e.target.value)} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-extrabold text-[#212c46] outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Default Submission Security State</label>
                  <select value={formStatus} onChange={e => setFormStatus(e.target.value)} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-semibold text-[#212c46] outline-none">
                    <option value="Approved">Approved for ERP Release (Passing baseline tests)</option>
                    <option value="Flagged">Flagged (Quarantined secondary chemical review)</option>
                    <option value="Draft">Draft (Local sandboxed record)</option>
                  </select>
                </div>
                
                <div className="p-4 bg-[#657f4d]/5 border border-[#657f4d]/30 rounded-xl">
                  <h4 className="font-extrabold uppercase text-[10px] text-[#657f4d] flex items-center gap-1">
                    <Icons.ShieldCheck size={14} /> Verification Protocol Signature Hook
                  </h4>
                  <p className="text-[11px] text-[#212c46] mt-1 font-bold">
                    By submitting, the Inspector certifies under pain of ISO-22000 code that the meat raw ingredients and sealing boundaries complied with designated temperature curves.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 bg-[#f8f9fa] border-t border-[#eaeaec] flex justify-between items-center shrink-0">
            <div>
              {entryStep > 0 && (
                <button
                  type="button"
                  onClick={() => setEntryStep(prev => prev - 1)}
                  className="px-5 py-2.5 bg-white border border-[#eaeaec] text-[#212c46] hover:bg-[#d7d7d7]/20 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all cursor-pointer"
                >
                  Previous
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowEntryModal(false)}
                className="px-5 py-2.5 bg-white border border-[#eaeaec] text-[#414757] rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-[#d7d7d7]/20 transition-all cursor-pointer"
              >
                Cancel
              </button>
              {entryStep < 2 ? (
                <button
                  type="button"
                  onClick={() => setEntryStep(prev => prev + 1)}
                  className="bg-[#212c46] hover:bg-[#3f809e] text-white px-6 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all cursor-pointer"
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveReport}
                  className="bg-[#657f4d] hover:bg-[#212c46] text-white px-6 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all cursor-pointer"
                >
                  Commit Log Entry
                </button>
              )}
            </div>
          </div>
        </div>
      </DraggableModal>

      {/* --- HIGH STANDARD CONFIGURATION POLICY DEVIATION MODAL (Replicating User Permissions layout) --- */}
      <DraggableModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        width="max-w-[850px]"
        customHeader={
          <div className="bg-[#212c46] px-5 py-4 flex justify-between items-center border-b-2 border-[#b58c4f] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/20 shadow-sm">
                <Icons.Sliders size={20} className="text-[#b58c4f]" />
              </div>
              <div>
                <h3 className="text-[13px] font-black text-[#d7d7d7] uppercase tracking-widest leading-none">Production Rules & Audit Configuration</h3>
                <p className="text-[10px] font-bold text-[#d7d7d7]/70 uppercase tracking-widest mt-1">เกณฑ์ทางสถิติความเบี่ยงเบนประสิทธิภาพผลผลิตหลัก (Global Standard Config Control)</p>
              </div>
            </div>
            <button onClick={() => setShowConfigModal(false)} className="text-white/60 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"><Icons.X size={20} /></button>
          </div>
        }
      >
        <div className="flex flex-col md:flex-row h-[420px] bg-white text-[#414757]">
          {/* Modal Left Sidebar Selector */}
          <div className="w-full md:w-[240px] bg-[#f8f9fa] border-r border-[#eaeaec] flex flex-col p-3 shrink-0 uppercase tracking-widest font-black text-[10px] space-y-1.5">
            <button
              type="button"
              onClick={() => setConfigStep(0)}
              className={`p-3.5 rounded-xl text-left font-black tracking-widest flex items-center gap-3 transition-all ${configStep === 0 ? 'bg-[#212c46] text-white shadow-sm' : 'text-[#7a8b95] hover:bg-[#d7d7d7]/30 hover:text-[#212c46] cursor-pointer'}`}
            >
              <Icons.Target size={14} /> Performance Baselines
            </button>
            <button
              type="button"
              onClick={() => setConfigStep(1)}
              className={`p-3.5 rounded-xl text-left font-black tracking-widest flex items-center gap-3 transition-all ${configStep === 1 ? 'bg-[#212c46] text-white shadow-sm' : 'text-[#7a8b95] hover:bg-[#d7d7d7]/30 hover:text-[#212c46] cursor-pointer'}`}
            >
              <Icons.ShieldAlert size={14} /> Escalation Rules
            </button>
            <button
              type="button"
              onClick={() => setConfigStep(2)}
              className={`p-3.5 rounded-xl text-left font-black tracking-widest flex items-center gap-3 transition-all ${configStep === 2 ? 'bg-[#212c46] text-white shadow-sm' : 'text-[#7a8b95] hover:bg-[#d7d7d7]/30 hover:text-[#212c46] cursor-pointer'}`}
            >
              <Icons.Lock size={14} /> Compliance & Locks
            </button>
          </div>

          {/* Modal Tab Container */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            {configStep === 0 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="border-b border-[#eaeaec] pb-2 mb-4">
                  <h4 className="text-[12px] font-black text-[#212c46] uppercase tracking-widest">Step 1: Yield & Equipment Effectiveness Baselines</h4>
                  <p className="text-[10px] text-[#7a8b95] uppercase font-bold mt-0.5">ระบุค่ามาตรฐาน OEE สะสมของกะและขอบเขตปริมาณงานยอมรับได้สูงสุด</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Minimum Yield Target Ratio (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={settings.minAcceptableYield}
                      onChange={e => setSettings({ ...settings, minAcceptableYield: Number(e.target.value) })}
                      className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-extrabold text-[#212c46] outline-none focus:border-[#3f809e]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Target OEE Level (%)</label>
                    <input
                      type="number"
                      value={settings.targetOeeLevel}
                      onChange={e => setSettings({ ...settings, targetOeeLevel: Number(e.target.value) })}
                      className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-extrabold text-[#212c46] outline-none focus:border-[#3f809e]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Max Allowable Downtime (Minutes/Shift)</label>
                  <input
                    type="number"
                    value={settings.maxDowntimeMin}
                    onChange={e => setSettings({ ...settings, maxDowntimeMin: Number(e.target.value) })}
                    className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-extrabold text-[#212c46] outline-none focus:border-[#3f809e]"
                  />
                </div>
              </div>
            )}

            {configStep === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="border-b border-[#eaeaec] pb-2 mb-4">
                  <h4 className="text-[12px] font-black text-[#212c46] uppercase tracking-widest">Step 2: Escalations & Real-Time Security Rules</h4>
                  <p className="text-[10px] text-[#7a8b95] uppercase font-bold mt-0.5">การทวนสอบขั้นที่สองและการระบุสถานภาพผิดปกติโดยอัตราส่วนออโตเมติก</p>
                </div>
                <div className="space-y-3">
                  <label className="flex items-center gap-3.5 p-3.5 bg-[#f8f9fa] border border-[#eaeaec] rounded-xl cursor-pointer hover:border-[#3f809e] transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.requireDoubleReview}
                      onChange={e => setSettings({ ...settings, requireDoubleReview: e.target.checked })}
                      className="w-4 h-4 accent-[#212c46]"
                    />
                    <div>
                      <span className="block text-[11px] font-black text-[#212c46] uppercase tracking-wider">Require Senior Supervisor Signatures on failing baseline</span>
                      <span className="block text-[9px] text-[#7a8b95] font-bold mt-0.5">กระตุ้นกระบวนการประเมินร่วมหากสัดส่วนที่บันทึกแปรเป็น Flagged</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3.5 p-3.5 bg-[#f8f9fa] border border-[#eaeaec] rounded-xl cursor-pointer hover:border-[#3f809e] transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.autoFlagAlert}
                      onChange={e => setSettings({ ...settings, autoFlagAlert: e.target.checked })}
                      className="w-4 h-4 accent-[#212c46]"
                    />
                    <div>
                      <span className="block text-[11px] font-black text-[#212c46] uppercase tracking-wider">Automatically flag reports with lower Yield Rates</span>
                      <span className="block text-[9px] text-[#7a8b95] font-bold mt-0.5">สถานะแปรสภาพเป็นคุมเข้มทันทีเมื่อสัดส่วนต่ำกว่าค่าควบคุมหลักที่กำหนด</span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {configStep === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="border-b border-[#eaeaec] pb-2 mb-4">
                  <h4 className="text-[12px] font-black text-[#212c46] uppercase tracking-widest">Step 3: Temporal Protection and Compliance Locks</h4>
                  <p className="text-[10px] text-[#7a8b95] uppercase font-bold mt-0.5">กำหนดช่วงกรอบหน้าต่างการแก้ไขข้อมูลและเป้าหมายการสื่อสารหลัก</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Edit Lock Limit Duration (Hours)</label>
                    <input
                      type="number"
                      value={settings.lockDurationHr}
                      onChange={e => setSettings({ ...settings, lockDurationHr: Number(e.target.value) })}
                      className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-extrabold text-[#212c46] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">ERP Primary API Data Gateway Sync Location</label>
                    <input
                      type="text"
                      value={settings.primaryGateway}
                      onChange={e => setSettings({ ...settings, primaryGateway: e.target.value })}
                      className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-extrabold text-[#212c46] outline-none focus:border-[#3f809e]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Configuration Footer */}
        <div className="px-6 py-4 bg-[#f8f9fa] border-t border-[#eaeaec] flex justify-end gap-3 shrink-0">
          <button onClick={() => setShowConfigModal(false)} className="px-5 py-2.5 bg-white border border-[#eaeaec] text-[#414757] rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-[#d7d7d7]/20 transition-all cursor-pointer">Cancel settings</button>
          <button onClick={() => setShowConfigModal(false)} className="bg-[#212c46] hover:bg-[#3f809e] text-white px-6 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest hover:shadow-md transition-all active:scale-95 cursor-pointer">Apply modifications</button>
        </div>
      </DraggableModal>
    </div>
  );
}
