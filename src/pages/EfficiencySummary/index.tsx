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
  Area,
  ScatterChart,
  Scatter
} from 'recharts';
import { DraggableModal } from '../../components/shared/DraggableModal';
import KpiCard from '../../components/shared/KpiCard';
import { UserGuidePanel } from '../../components/shared/UserGuidePanel';
import UserGuideButton from '../../components/shared/UserGuideButton';
import { useCollection } from '../../services/useFirestore';

// --- Theme Configuration (Synced with Home Palette) ---
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

// --- Static Presets ---
const SHIFTS = ['Shift A (Day)', 'Shift B (Night)'];
const LINES = ['Line 1 (Processing)', 'Line 2 (Forming)', 'Line 3 (Packaging)'];
const PRODUCTS = [
  'Smoked Garlic Bologna 1kg',
  'Cheese Sausage 200g',
  'Hotdog Sausage 150g',
  'Vienna Ham 2kg',
  'Frankfurter Chicken Sausage 500g'
];

const INITIAL_EFFICIENCY_LEDGER = [
  {
    id: 'EFF-260601-01',
    date: '2026-06-01',
    shift: 'Shift A (Day)',
    lineId: 'Line 1 (Processing)',
    productName: 'Smoked Garlic Bologna 1kg',
    volumeKg: 4500,
    laborCount: 8,
    runMinutes: 440,
    downtimeMin: 15,
    electricityKwh: 380,
    waterM3: 4.5,
    supervisor: 'QC SUDA',
    oee: 89.5,
    laborProd: 76.7, // Kg / man-hour
    sec: 84.4,     // kWh / Ton of output
    status: 'Optimal',
    remarks: 'Peak throughput reached on filling machine. Specific energy consumption within acceptable limits.'
  },
  {
    id: 'EFF-260531-02',
    date: '2026-05-31',
    shift: 'Shift B (Night)',
    lineId: 'Line 2 (Forming)',
    productName: 'Cheese Sausage 200g',
    volumeKg: 6200,
    laborCount: 12,
    runMinutes: 420,
    downtimeMin: 45,
    electricityKwh: 650,
    waterM3: 8.2,
    supervisor: 'QC NARONG',
    oee: 82.1,
    laborProd: 73.8,
    sec: 104.8,
    status: 'Optimal',
    remarks: 'Minor boiler temperature fluctuations. Compensated by elevated speed settings on downstream linkers.'
  },
  {
    id: 'EFF-260531-01',
    date: '2026-05-31',
    shift: 'Shift A (Day)',
    lineId: 'Line 3 (Packaging)',
    productName: 'Hotdog Sausage 150g',
    volumeKg: 5100,
    laborCount: 10,
    runMinutes: 410,
    downtimeMin: 30,
    electricityKwh: 410,
    waterM3: 5.0,
    supervisor: 'QC SUDA',
    oee: 84.6,
    laborProd: 74.6,
    sec: 80.4,
    status: 'Optimal',
    remarks: 'Standard cleaning routine occurred at mid-shift. Packaging speed matched baseline.'
  },
  {
    id: 'EFF-260530-02',
    date: '2026-05-30',
    shift: 'Shift B (Night)',
    lineId: 'Line 1 (Processing)',
    productName: 'Vienna Ham 2kg',
    volumeKg: 2800,
    laborCount: 7,
    runMinutes: 320,
    downtimeMin: 110,
    electricityKwh: 480,
    waterM3: 4.1,
    supervisor: 'QC NARONG',
    oee: 62.4,
    laborProd: 75.0,
    sec: 171.4, // high consumption per unit volume
    status: 'Critical Review',
    remarks: 'Extended unplanned downtime on secondary grinder. Low volume elevated Specific Energy Consumption.'
  },
  {
    id: 'EFF-260530-01',
    date: '2026-05-30',
    shift: 'Shift A (Day)',
    lineId: 'Line 2 (Forming)',
    productName: 'Smoked Garlic Bologna 1kg',
    volumeKg: 4800,
    laborCount: 9,
    runMinutes: 435,
    downtimeMin: 12,
    electricityKwh: 390,
    waterM3: 4.8,
    supervisor: 'QC SUDA',
    oee: 91.2,
    laborProd: 73.6,
    sec: 81.3,
    status: 'Optimal',
    remarks: 'Optimal performance. Steam valve adjustments secured continuous flow with minimal thermal bleed.'
  },
  {
    id: 'EFF-260529-01',
    date: '2026-05-29',
    shift: 'Shift A (Day)',
    lineId: 'Line 3 (Packaging)',
    productName: 'Frankfurter Chicken Sausage 500g',
    volumeKg: 4900,
    laborCount: 10,
    runMinutes: 445,
    downtimeMin: 22,
    electricityKwh: 450,
    waterM3: 5.2,
    supervisor: 'QC NARONG',
    oee: 88.0,
    laborProd: 66.1,
    sec: 91.8,
    status: 'Optimal',
    remarks: 'Good consistency. Packaging thermoformer heat seal parameters stayed within standard deviations.'
  }
];

export default function EfficiencySummary() {
  const [activeTab, setActiveTab] = useState('list_mode'); // list_mode | charts_mode
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // --- High Standard Configuration setting matching User Permissions Layout ---
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configStep, setConfigStep] = useState(0);
  const [settings, setSettings] = useState({
    targetOeeLevel: 85,             // Overall equipment effectiveness target %
    targetLaborProd: 72.0,          // Target Labor rate (Kg/Man-hour)
    maxSecLimit: 120.0,             // Max acceptable specific energy consumption (kWh/Ton)
    requireDoubleReview: true,      // Require secondary verification signature for Flagged lines
    autoFlagDeficiency: true,       // Mark underperforming shifts with Critical Review instantly
    downtimeAlertThreshold: 45,     // Alert trigger limit for downtime minutes
    reportRecipients: 'management-alerts@suda-foods.co.th',
    integrationChannel: 'Enterprise S-API Gateway / MQTT Sensor Hub'
  });

  // --- Step-based add/edit form step state machine ---
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [entryStep, setEntryStep] = useState(0);

  // Form Field States
  const [formDate, setFormDate] = useState('2026-06-01');
  const [formShift, setFormShift] = useState('Shift A (Day)');
  const [formLineId, setFormLineId] = useState('Line 1 (Processing)');
  const [formProductName, setFormProductName] = useState('Smoked Garlic Bologna 1kg');
  const [formVolumeKg, setFormVolumeKg] = useState(4500);
  const [formLaborCount, setFormLaborCount] = useState(8);
  const [formRunMinutes, setFormRunMinutes] = useState(440);
  const [formDowntimeMin, setFormDowntimeMin] = useState(15);
  const [formElectricityKwh, setFormElectricityKwh] = useState(380);
  const [formWaterM3, setFormWaterM3] = useState(4.5);
  const [formSupervisor, setFormSupervisor] = useState('QC SUDA');
  const [formStatus, setFormStatus] = useState('Optimal');
  const [formRemarks, setFormRemarks] = useState('');

  // Firestore standard database integration
  const { data: dbRecords, add: addRecord, update: updateRecord } = useCollection<any>('efficiency_summary_ledger', INITIAL_EFFICIENCY_LEDGER);
  
  // Use DB records if available, otherwise local records
  const records = dbRecords && dbRecords.length > 0 ? dbRecords.sort((a, b) => b.date.localeCompare(a.date)) : INITIAL_EFFICIENCY_LEDGER.sort((a, b) => b.date.localeCompare(a.date));

  // Handle Search Filtering
  const filteredRecords = useMemo(() => {
    return records.filter(rec => {
      const q = search.toLowerCase();
      return (
        rec.id.toLowerCase().includes(q) ||
        rec.productName.toLowerCase().includes(q) ||
        rec.lineId.toLowerCase().includes(q) ||
        rec.shift.toLowerCase().includes(q) ||
        rec.supervisor.toLowerCase().includes(q) ||
        (rec.remarks && rec.remarks.toLowerCase().includes(q))
      );
    });
  }, [records, search]);

  // Pagination layout calculations
  const currentData = useMemo(() => {
    return filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredRecords, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;

  // Real-time Composite Calculations for KPIs
  const compositeOee = useMemo(() => {
    if (records.length === 0) return 0;
    const sum = records.reduce((s, x) => s + Number(x.oee || 0), 0);
    return Number((sum / records.length).toFixed(1));
  }, [records]);

  const averageLaborProd = useMemo(() => {
    if (records.length === 0) return 0;
    const sum = records.reduce((s, x) => s + Number(x.laborProd || 0), 0);
    return Number((sum / records.length).toFixed(1));
  }, [records]);

  const averageEnergyConsumption = useMemo(() => {
    if (records.length === 0) return 0;
    const sum = records.reduce((s, x) => s + Number(x.sec || 0), 0);
    return Number((sum / records.length).toFixed(1));
  }, [records]);

  const criticalShiftsCount = useMemo(() => {
    return records.filter(r => r.status === 'Critical Review' || r.oee < settings.targetOeeLevel || r.sec > settings.maxSecLimit).length;
  }, [records, settings.targetOeeLevel, settings.maxSecLimit]);

  // Analytics datasets formatting
  const chartTimelineOeeVsSec = useMemo(() => {
    return records.map(r => ({
      name: `${r.date} (${r.shift.split(' ')[1]})`,
      'OEE Efficiency (%)': r.oee,
      'Specific Energy (kWh/Ton)': Number((r.sec).toFixed(1)),
      'Labor Index (Kg/Man-hr)': Number((r.laborProd).toFixed(1))
    })).reverse();
  }, [records]);

  const chartLaborPerformanceByLine = useMemo(() => {
    const linesGroup: { [key: string]: { totalVol: number, totalHrs: number } } = {
      'Line 1 (Processing)': { totalVol: 0, totalHrs: 0 },
      'Line 2 (Forming)': { totalVol: 0, totalHrs: 0 },
      'Line 3 (Packaging)': { totalVol: 0, totalHrs: 0 }
    };

    records.forEach(r => {
      const key = r.lineId;
      if (linesGroup[key]) {
        linesGroup[key].totalVol += Number(r.volumeKg || 0);
        // man hours = labor count * (run minutes / 60)
        const manHrs = Number(r.laborCount) * (Number(r.runMinutes) / 60);
        linesGroup[key].totalHrs += manHrs;
      }
    });

    return Object.entries(linesGroup).map(([line, val]) => ({
      name: line.split(' ')[0] + ' ' + line.split(' ')[1],
      'Avg Labor Index (Kg/hr)': val.totalHrs > 0 ? Number((val.totalVol / val.totalHrs).toFixed(1)) : 0
    }));
  }, [records]);

  const chartResourceFootprintPie = useMemo(() => {
    const map: { [key: string]: number } = {};
    records.forEach(r => {
      map[r.productName] = (map[r.productName] || 0) + Number(r.electricityKwh || 0);
    });
    return Object.entries(map).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value);
  }, [records]);

  // Modal State Triggers
  const handleOpenAdd = () => {
    setEditingEntry(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormShift('Shift A (Day)');
    setFormLineId('Line 1 (Processing)');
    setFormProductName('Smoked Garlic Bologna 1kg');
    setFormVolumeKg(4500);
    setFormLaborCount(8);
    setFormRunMinutes(445);
    setFormDowntimeMin(10);
    setFormElectricityKwh(380);
    setFormWaterM3(4.5);
    setFormSupervisor('QC SUDA');
    setFormStatus('Optimal');
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
    setFormVolumeKg(entry.volumeKg);
    setFormLaborCount(entry.laborCount);
    setFormRunMinutes(entry.runMinutes);
    setFormDowntimeMin(entry.downtimeMin);
    setFormElectricityKwh(entry.electricityKwh);
    setFormWaterM3(entry.waterM3);
    setFormSupervisor(entry.supervisor);
    setFormStatus(entry.status);
    setFormRemarks(entry.remarks || '');
    setEntryStep(0);
    setShowEntryModal(true);
  };

  const handleSaveEntry = async () => {
    // Dynamic Parameter Calculations
    // 1. Labor productivity Kg / man-hour
    const totalManHours = Number(formLaborCount) * (Number(formRunMinutes) / 60) || 1;
    const calculatedLaborProd = Number((Number(formVolumeKg) / totalManHours).toFixed(1));

    // 2. Specific Energy Consumption SEC (kWh per Ton)
    const volumeTons = Number(formVolumeKg) / 1000 || 1;
    const calculatedSec = Number((Number(formElectricityKwh) / volumeTons).toFixed(1));

    // 3. Overall Equipment Effectiveness OEE approximation
    const idealDuration = 480; // 8 hours shift
    const runtime = Number(formRunMinutes) - Number(formDowntimeMin);
    const availability = runtime / idealDuration;
    // performance speed threshold relative to volume capacity defaults
    const performance = Math.min(1.0, (Number(formVolumeKg) / 5000));
    const quality = 0.985; // general safety yield multiplier
    let calculatedOee = Math.round(availability * performance * quality * 100);
    if (calculatedOee > 100) calculatedOee = 99;
    if (calculatedOee < 25) calculatedOee = 25;

    // Automatic classification flags derived from configured Policy settings
    const failedOee = calculatedOee < settings.targetOeeLevel;
    const exceededSec = calculatedSec > settings.maxSecLimit;
    const excessiveDowntime = Number(formDowntimeMin) > settings.downtimeAlertThreshold;

    const finalStatus = (failedOee || exceededSec || excessiveDowntime) && settings.autoFlagDeficiency
      ? 'Critical Review'
      : formStatus;

    const dataObj = {
      date: formDate,
      shift: formShift,
      lineId: formLineId,
      productName: formProductName,
      volumeKg: Number(formVolumeKg),
      laborCount: Number(formLaborCount),
      runMinutes: Number(formRunMinutes),
      downtimeMin: Number(formDowntimeMin),
      electricityKwh: Number(formElectricityKwh),
      waterM3: Number(formWaterM3),
      supervisor: formSupervisor,
      oee: calculatedOee,
      laborProd: calculatedLaborProd,
      sec: calculatedSec,
      status: finalStatus,
      remarks: formRemarks || 'All performance metrics calculated using state-approved energy formulations.'
    };

    if (editingEntry) {
      await updateRecord(editingEntry.id, dataObj);
    } else {
      const generatedId = `EFF-${formDate.replace(/-/g, '').slice(2)}-${formShift === 'Shift A (Day)' ? 'D' : 'N'}-${formLineId.match(/\d+/) ? formLineId.match(/\d+/)![0] : '1'}`;
      await addRecord({ id: generatedId, ...dataObj });
    }

    setShowEntryModal(false);
    setEditingEntry(null);
  };

  // CSV Data Download Integration
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Efficiency ID,Date,Shift,Line,Product,Produced Vol (Kg),Labor Count,Operational Run Mins,Downtime Mins,Electricity (kWh),Water (m3),Avg OEE (%),Labor Productivity (Kg/hr),SEC (kWh/Ton),Supervisor,Status,Remarks\n';
    
    records.forEach(r => {
      const row = [
        r.id, r.date, r.shift, r.lineId, `"${r.productName}"`, r.volumeKg, r.laborCount, r.runMinutes, r.downtimeMin, r.electricityKwh, r.waterM3, r.oee, r.laborProd, r.sec, `"${r.supervisor}"`, r.status, `"${(r.remarks || '').replace(/"/g, '""')}"`
      ].join(',');
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Efficiency_Summary_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-1 w-full flex-col animate-fadeIn bg-transparent space-y-4">
      {/* FLOATING ACTION GUIDE SYNCED WITH PERFORMANCE */}
      <UserGuideButton onClick={() => setIsGuideOpen(true)} />

      {/* DETAILED USER GUIDE (MATCHED WITH USER PERMISSIONS DETAIL DEPTH) */}
      <UserGuidePanel
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        title="EFFICIENCY GUIDE"
        subtitle="ENERGY & PERFORMANCE HANDBOOK"
      >
        <div className="space-y-8 font-sans">
            <div>
                <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                    <Icons.TrendingUp size={16} className="text-[#3f809e]" /> 1. OEE & ENERGY STANDARDS
                </h3>
                <p className="mb-4 text-[#414757]">
                    โครงสร้างการประมวลประสิทธิภาพทำงานสอดคล้องกับมาตรฐานอุตสาหกรรม การวัดดัชนีภาพรวม (OEE) และระบบจัดการพลังงาน (ISO 50001:2018)
                </p>
                <div className="space-y-3">
                    <div className="p-3 bg-[#f8f9fa] border border-[#eaeaec] rounded-xl flex items-start gap-4">
                        <div className="p-2 bg-[#d55a6d] text-white rounded-lg shrink-0"><Icons.Zap size={16} /></div>
                        <div>
                            <span className="font-bold text-[#212c46] text-[12px] mb-1 block">SEC Target (Energy)</span>
                            <span className="text-[#7a8b95] text-[12px]">ตรวจสอบสัดส่วนพลังงานไฟฟ้าที่ใช้ต่อผลผลิต 1 ตัน (<strong className="text-[#d55a6d]">{settings.maxSecLimit} kWh/Ton</strong>) เพื่อคุมต้นทุนด้านพลังงาน</span>
                        </div>
                    </div>
                    <div className="p-3 bg-[#f8f9fa] border border-[#eaeaec] rounded-xl flex items-start gap-4">
                        <div className="p-2 bg-[#b58c4f] text-white rounded-lg shrink-0"><Icons.Activity size={16} /></div>
                        <div>
                            <span className="font-bold text-[#212c46] text-[12px] mb-1 block">OEE Target Level</span>
                            <span className="text-[#7a8b95] text-[12px]">เป้าหมายมาตรฐานประสิทธิภาพเครื่องจักรตั้งไว้ที่ <strong className="text-[#b58c4f]">{settings.targetOeeLevel}%</strong> เสมอ</span>
                        </div>
                    </div>
                    <div className="p-3 bg-[#f8f9fa] border border-[#eaeaec] rounded-xl flex items-start gap-4">
                        <div className="p-2 bg-[#3f809e] text-white rounded-lg shrink-0"><Icons.Users size={16} /></div>
                        <div>
                            <span className="font-bold text-[#212c46] text-[12px] mb-1 block">Labor Productivity</span>
                            <span className="text-[#7a8b95] text-[12px]">ประสิทธิภาพจากกำลังคนที่ใช้เพื่อเทียบจำนวนแรงงานต่อกิโลกรัมสินค้า (<strong className="text-[#3f809e]">{settings.targetLaborProd} Kg/Man-hour</strong>)</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-px bg-[#eaeaec] w-full" />

            <div>
                <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                    <Icons.Settings size={16} className="text-[#b58c4f]" /> 2. ขั้นตอนการบันทึกข้อมูลและส่งรายงาน
                </h3>
                <p className="mb-4 text-[#414757]">
                    ขั้นตอนปฏิบัติสำหรับ Supervisor/หัวหน้ากะ เพื่อทำการประเมินสายผลิต:
                </p>
                <div className="p-4 bg-[#fdf2f2] border border-[#f5c6cb] rounded-xl text-[#414757]">
                    <ul className="list-decimal pl-5 space-y-2">
                        <li>กรอกเป้าหมายผลผลิต (Target) และยอดที่ทำได้จริง (Actual)</li>
                        <li>จดมิเตอร์พลังงานไฟฟ้ารวมต่อกะการผลิต (KwH)</li>
                        <li>ตรวจสอบค่าที่หน้าเครื่อง และแนบเหตุผลที่ทำประสิทธิภาพต่ำกว่าเป้าก่อนยืนยันลงระบบ</li>
                    </ul>
                </div>
            </div>

            <div className="h-px bg-[#eaeaec] w-full" />

            <div>
                <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                    <Icons.Mail size={16} className="text-[#688a58]" /> 3. ระบบกระจายข่าวอัตโนมัติ (AUTO-ALERTS)
                </h3>
                <p className="mb-4 text-[#414757]">
                    สถานะที่เสี่ยง หรือตัวเลขผลการวิเคราะห์ในเชิงลบ จะถูกทริกเกอร์ส่งหาฝ่ายบริหารที่กำหนดไว้อัตโนมัติ: <strong className="text-[#688a58]">{settings.reportRecipients}</strong>
                </p>
            </div>
        </div>
      </UserGuidePanel>

      {/* HEADER SECTION PANEL */}
      <div className="h-14 px-4 sm:px-8 flex flex-row items-center justify-between gap-4 z-20 shrink-0">
        <div className="flex items-center gap-5">
          <div className="relative flex items-center justify-center group cursor-default shrink-0">
            <div className="absolute inset-0 bg-[#b58c4f] blur-[15px] opacity-25 rounded-full group-hover:opacity-75 transition-all duration-700"></div>
            <div className="relative z-10 p-1.5 border border-[#b58c4f]/40 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm">
              <Icons.Zap size={28} strokeWidth={2.5} className="text-[#b58c4f]" />
            </div>
          </div>
          <div>
            <h3 className="font-black text-[#212c46] uppercase tracking-tighter leading-none font-exception-header text-[24px]">
              EFFICIENCY <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#b58c4f] to-[#3f809e]">SUMMARY</span> NODE
            </h3>
            <p className="text-[11px] font-bold text-[#4d5a44] uppercase tracking-[0.2em] mt-0.5 opacity-80 leading-none">
              ISO 50001 ENERGY & ENTERPRISE PERFORMANCE SYNTHESIS CENTRE
            </p>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex items-center gap-4">
          <div className="bg-white/50 p-1.5 rounded-xl border border-white/60 shadow-inner flex flex-wrap items-center gap-1">
            <button
              onClick={() => setActiveTab('list_mode')}
              className={`px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'list_mode' ? 'bg-[#212c46] text-white shadow-md' : 'text-[#7a8b95] hover:text-[#b58c4f] hover:bg-[#d7d7d7]/20'}`}
            >
              <Icons.FileSpreadsheet size={16} /> Ledger View
            </button>
            <button
              onClick={() => setActiveTab('charts_mode')}
              className={`px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'charts_mode' ? 'bg-[#212c46] text-white shadow-md' : 'text-[#7a8b95] hover:text-[#b58c4f] hover:bg-[#d7d7d7]/20'}`}
            >
              <Icons.AreaChart size={16} /> Analytics Profile
            </button>
          </div>

          {/* Configuration Node settings matched perfectly with User Permissions */}
          <button
            onClick={() => { setConfigStep(0); setShowConfigModal(true); }}
            className="bg-white border border-[#eaeaec] text-[#212c46] hover:text-[#b58c4f] hover:border-[#b58c4f] p-2.5 rounded-xl shadow-sm hover:shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Icons.Settings size={18} />
          </button>
        </div>
      </div>

      {/* KPI DASHBOARD CARDS */}
      <div className="mx-auto px-4 sm:px-8 w-full mt-[2px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 shrink-0">
          <KpiCard
            label="Synthesis OEE Avg"
            value={`${compositeOee}%`}
            icon="gauge"
            colorAccent={compositeOee < settings.targetOeeLevel ? THEME.danger : THEME.success}
            colorValue={THEME.primary}
            desc={`Baseline target: ${settings.targetOeeLevel}%`}
          />
          <KpiCard
            label="Labor Productivity"
            value={`${averageLaborProd} Kg/h`}
            icon="users"
            colorAccent={averageLaborProd < settings.targetLaborProd ? THEME.gold : THEME.success}
            colorValue={THEME.primary}
            desc={`Threshold: ${settings.targetLaborProd} Kg/Man-hour`}
          />
          <KpiCard
            label="Specific Energy (SEC)"
            value={`${averageEnergyConsumption} kWh/T`}
            icon="bolt"
            colorAccent={averageEnergyConsumption > settings.maxSecLimit ? THEME.danger : THEME.skyBlue}
            colorValue={THEME.primary}
            desc={`Acceptable limit: ${settings.maxSecLimit} kWh/Ton`}
          />
          <KpiCard
            label="Deficient Shifts"
            value={`${criticalShiftsCount} Units`}
            icon="shield-alert"
            colorAccent={criticalShiftsCount > 0 ? THEME.danger : THEME.success}
            colorValue={criticalShiftsCount > 0 ? THEME.danger : THEME.success}
            desc="Exceeding baseline boundaries"
          />
        </div>

        {/* VIEW CONDITIONAL */}
        {activeTab === 'list_mode' ? (
          <div className="bg-white rounded-xl shadow-lg border border-[#eaeaec] overflow-hidden flex flex-col animate-fadeIn">
            {/* SUB-HEADER FILTER STRAPS */}
            <div className="px-8 py-4 border-b border-[#eaeaec] bg-[#f8f9fa] flex flex-col lg:flex-row justify-between items-center gap-4 shrink-0">
              <span className="text-[11px] font-black text-[#7a8b95] uppercase tracking-widest bg-white border border-[#eaeaec] px-4 py-2 rounded-xl shadow-sm">
                SYSTEM EFFICIENCY REGISTRY LEDGER
              </span>
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
                <div className="relative w-full sm:w-80">
                  <Icons.Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#7a8b95]" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                    placeholder="Search Shift, Line, Product, Supervisor..."
                    className="w-full pl-12 pr-6 py-2.5 text-[12px] border border-[#eaeaec] rounded-full font-bold outline-none focus:border-[#b58c4f] bg-white shadow-sm text-[#212c46]"
                  />
                </div>

                {/* CSV Download Hook */}
                <button
                  onClick={handleExportCSV}
                  className="bg-white border border-[#eaeaec] hover:border-[#b58c4f] hover:text-[#b58c4f] text-[#212c46] px-5 py-2.5 rounded-full font-black text-[11px] uppercase tracking-widest shadow-sm hover:shadow-md transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
                >
                  <Icons.Download size={15} /> Export Efficiency Data
                </button>

                {/* New Entries Log Button */}
                <button
                  onClick={handleOpenAdd}
                  className="bg-[#212c46] hover:bg-[#b58c4f] text-white px-6 py-2.5 rounded-full font-black text-[11px] uppercase tracking-widest shadow-md hover:shadow-lg transition-all flex items-center gap-2 border border-[#212c46] active:scale-95 cursor-pointer"
                >
                  <Icons.PlusCircle size={16} /> Log Shift Efficiency
                </button>
              </div>
            </div>

            {/* LEDGER DATA TABLE */}
            <div className="overflow-auto custom-scrollbar">
              <table className="w-full text-left border-collapse table-font">
                <thead className="sys-table-header [#b58c4f] ">
                    <tr>
                    <th className="font-black uppercase tracking-widest whitespace-nowrap">Efficiency ID / Date</th>
                    <th className="font-black uppercase tracking-widest whitespace-nowrap">Shift Coordinates</th>
                    <th className="font-black uppercase tracking-widest whitespace-nowrap w-[150px] max-w-[150px]">Active Product Name</th>
                    <th className="font-black uppercase tracking-widest text-center whitespace-nowrap w-[130px]">Produced Vol (Kg)</th>
                    <th className="font-black uppercase tracking-widest text-center whitespace-nowrap">Overall OEE %</th>
                    <th className="font-black uppercase tracking-widest text-center whitespace-nowrap">Labor Index</th>
                    <th className="font-black uppercase tracking-widest text-center whitespace-nowrap">Specific Energy (SEC)</th>
                    <th className="font-black uppercase tracking-widest whitespace-nowrap w-[350px]">Auditor / remarks</th>
                    <th className="font-black uppercase tracking-widest text-center whitespace-nowrap">Status</th>
                    <th className="font-black uppercase tracking-widest text-center whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#eaeaec]">
                  {currentData.length === 0 ? (
                    <tr>
                      <td className="text-center text-[#7a8b95] uppercase font-black tracking-widest text-[12px] py-2.5 px-4">
                        No recorded efficiency entries found matching filters.
                      </td>
                    </tr>
                  ) : (
                    currentData.map(rec => {
                      const isLowOee = rec.oee < settings.targetOeeLevel;
                      const isHighSec = rec.sec > settings.maxSecLimit;
                      const isLowLabor = rec.laborProd < settings.targetLaborProd;
                      const isCritical = rec.status === 'Critical Review' || isLowOee || isHighSec;

                      return (
                        <tr key={rec.id} className="hover:bg-[#f8f9fa] transition-colors group">
                          <td className="px-4 whitespace-nowrap font-mono font-black text-[#212c46] py-2.5">
                            <div className="flex flex-col">
                              <span className="text-[12px]">{rec.id}</span>
                              <span className="text-[9px] text-[#7a8b95] font-bold mt-0.5">{rec.date}</span>
                            </div>
                          </td>
                          <td className="px-4 whitespace-nowrap py-2.5">
                            <div className="flex flex-col">
                              <span className="font-extrabold uppercase text-[#212c46] text-[11px]">{rec.shift}</span>
                              <span className="text-[10px] text-[#3f809e] font-bold uppercase mt-0.5">{rec.lineId}</span>
                            </div>
                          </td>
                          <td className="px-4 whitespace-nowrap w-[150px] max-w-[150px] py-2.5" title={rec.productName}>
                            <span className="font-black text-[#212c46] uppercase text-[12px] tracking-tight block truncate">{rec.productName}</span>
                          </td>
                          <td className="px-4 whitespace-nowrap text-center font-black text-[12px] text-[#212c46] w-[130px] py-2.5">
                            {Number(rec.volumeKg).toLocaleString()} Kg
                          </td>
                          <td className="px-4 whitespace-nowrap text-center py-2.5">
                            <span className={`px-2.5 py-1 rounded-md text-[11px] font-black border tracking-wider text-center ${isLowOee ? 'bg-[#932c2e]/10 text-[#d96245] border-[#932c2e]/20' : 'bg-[#657f4d]/10 text-[#657f4d] border-[#657f4d]/20'}`}>
                              {rec.oee}%
                            </span>
                          </td>
                          <td className="px-4 whitespace-nowrap text-center py-2.5">
                            <span className={`text-[12px] font-extrabold inline-flex items-center gap-1 ${isLowLabor ? 'text-[#b58c4f]' : 'text-[#657f4d]'}`}>
                              {rec.laborProd} Kg/h
                            </span>
                          </td>
                          <td className="px-4 whitespace-nowrap text-center py-2.5">
                            <span className={`text-[12px] font-black inline-flex items-center gap-1 ${isHighSec ? 'text-[#932c2e]' : 'text-[#3f809e]'}`}>
                              {rec.sec}  <span className="text-[9px] text-[#7a8b95] font-semibold">kWh/T</span>
                            </span>
                          </td>
                          <td className="px-4 w-[350px] max-w-[350px] py-2.5">
                            <div className="w-full relative group" title={rec.remarks || '-'}>
                              <p className="text-[11px] font-bold text-[#414757] leading-tight truncate">{rec.remarks || '-'}</p>
                              <span className="text-[9px] uppercase font-bold text-[#7a8b95] mt-0.5 block truncate">Supervisor: {rec.supervisor}</span>
                            </div>
                          </td>
                          <td className="px-4 whitespace-nowrap text-center py-2.5">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase border tracking-wider shadow-sm ${!isCritical ? 'bg-[#657f4d]/15 text-[#657f4d] border-[#657f4d]/30' : 'bg-[#932c2e]/10 text-[#a94228] border-[#a94228]/35 animate-pulse'}`}>
                              {!isCritical ? <Icons.Check size={10}/> : <Icons.AlertCircle size={10}/>}
                              {!isCritical ? 'Optimal' : 'Review Prompt'}
                            </span>
                          </td>
                          <td className="px-4 whitespace-nowrap text-center py-2.5">
                            <button
                              onClick={() => handleOpenEdit(rec)}
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

            {/* LOWER PAGINATION CONTAINER */}
            <div className="px-8 py-3 bg-[#f8f9fa] border-t border-[#eaeaec] flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
              <div className="flex items-center gap-6 text-[11px] font-black text-[#7a8b95] uppercase tracking-widest">
                <div className="flex items-center gap-3">
                  <span>Display Rows:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="bg-white border border-[#eaeaec] rounded-lg px-3 py-1.5 outline-none font-black text-[#212c46] cursor-pointer shadow-sm focus:border-[#b58c4f]"
                  >
                    {[5, 10, 20, 50].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <p className="bg-white px-4 py-2 rounded-xl border border-[#eaeaec] shadow-sm">Total Record Count: {filteredRecords.length}</p>
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
          /* ANALYTICS CHARTS MODE VIEW */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
            {/* OEE & SEC TIMELINE TREND CORRELATION */}
            <div className="lg:col-span-8 bg-white p-6 rounded-xl shadow-lg border border-[#eaeaec] flex flex-col justify-between">
              <div className="border-b-2 border-[#b58c4f] pb-4 mb-4">
                <h4 className="text-[14px] font-black uppercase text-[#212c46] tracking-widest flex items-center gap-3">
                  <Icons.Activity size={20} className="text-[#3f809e]" /> OEE vs Specific Energy Trend Map
                </h4>
                <p className="text-[11px] font-bold text-[#7a8b95] uppercase tracking-widest mt-1">เปรียบเทียบความสัมพันธ์สหสัมพันธ์ระหว่างการใช้พลังงานจำเพาะและประสิทธิภาพเครื่องจักร</p>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartTimelineOeeVsSec} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaec" />
                    <XAxis dataKey="name" stroke="#7a8b95" fontSize={9} tickLine={false} />
                    <YAxis stroke="#7a8b95" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#212c46', border: 'none', color: '#fff', borderRadius: '12px', fontSize: '11px', fontFamily: 'monospace' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
                    <Area type="monotone" dataKey="OEE Efficiency (%)" name="Overall OEE (%)" fill="#3f809e" stroke="#3f809e" fillOpacity={0.15} />
                    <Line type="monotone" dataKey="Specific Energy (kWh/Ton)" name="SEC (kWh/Ton)" stroke="#a94228" strokeWidth={3} dot={{ r: 4 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ELECTRICITY LOSS SEGREGATION CORES */}
            <div className="lg:col-span-4 bg-white p-6 rounded-xl shadow-lg border border-[#eaeaec] flex flex-col justify-between">
              <div className="border-b-2 border-[#b58c4f] pb-4 mb-4">
                <h4 className="text-[14px] font-black uppercase text-[#212c46] tracking-widest flex items-center gap-3">
                  <Icons.PieChart size={20} className="text-[#a94228]" /> Energy Load Allocation Share
                </h4>
                <p className="text-[11px] font-bold text-[#7a8b95] uppercase tracking-widest mt-1">สัดส่วนการสิ้นเปลืองพลังงานแยกตามรูปแบบไลน์และกลุ่มสินค้า</p>
              </div>
              <div className="h-60 w-full flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartResourceFootprintPie}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      nameKey="name"
                      labelLine={false}
                    >
                      {chartResourceFootprintPie.map((entry, index) => {
                        const colors = ['#b58c4f', '#a94228', '#657f4d', '#3f809e', '#7a8b95'];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#212c46', border: 'none', color: '#fff', borderRadius: '12px', fontSize: '11px', fontFamily: 'monospace' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5">
                {chartResourceFootprintPie.slice(0, 4).map((item, idx) => {
                  const colors = ['#b58c4f', '#a94228', '#657f4d', '#3f809e', '#7a8b95'];
                  const totalPower = chartResourceFootprintPie.reduce((acc, current) => acc + current.value, 0) || 1;
                  return (
                    <div key={idx} className="flex justify-between items-center text-[10px] font-bold border-b border-[#eaeaec]/60 pb-1 uppercase">
                      <span className="flex items-center gap-1.5 text-[#212c46]">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }} />
                        <span className="truncate max-w-[170px]">{item.name}</span>
                       </span>
                      <span className="font-black text-[#212c46]">{item.value.toLocaleString()} kWh ({((item.value / totalPower) * 100).toFixed(1)}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* LABOR CAPACITY COMPARATOR BY LINE */}
            <div className="lg:col-span-12 bg-white p-6 rounded-xl shadow-lg border border-[#eaeaec]">
              <div className="border-b-2 border-[#b58c4f] pb-4 mb-4">
                <h4 className="text-[14px] font-black uppercase text-[#212c46] tracking-widest flex items-center gap-3">
                  <Icons.Users size={20} className="text-[#657f4d]" /> Labor Productivity Index Benchmarks
                </h4>
                <p className="text-[11px] font-bold text-[#7a8b95] uppercase tracking-widest mt-1">เปรียบเทียบมาตรฐานประสิทธิภาพกำลังผลิตของบุคคลต่อหนึ่งชั่วโมงการทำงานจริงแยกรายไลน์แปรรูป</p>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartLaborPerformanceByLine} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaec" />
                    <XAxis dataKey="name" stroke="#7a8b95" fontSize={10} tickLine={false} />
                    <YAxis stroke="#7a8b95" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#212c46', border: 'none', color: '#fff', borderRadius: '12px', fontSize: '11px', fontFamily: 'monospace' }} />
                    <Bar dataKey="Avg Labor Index (Kg/hr)" fill="#657f4d" radius={[5, 5, 0, 0]} maxBarSize={50}>
                      {chartLaborPerformanceByLine.map((entry, index) => {
                        const colors = ['#657f4d', '#b58c4f', '#3f809e'];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- ADD/EDIT 3-STAGED MODAL SYSTEM --- */}
      <DraggableModal
        isOpen={showEntryModal}
        onClose={() => setShowEntryModal(false)}
        width="max-w-[700px]"
        customHeader={
          <div className="bg-[#212c46] px-5 py-4 flex justify-between items-center border-b-2 border-[#b58c4f] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/20 shadow-sm">
                <Icons.Sliders size={20} className="text-[#b58c4f]" />
              </div>
              <div>
                <h3 className="text-[13px] font-black text-[#d7d7d7] uppercase tracking-widest leading-none">
                  {editingEntry ? 'Revise Efficiency Log' : 'Create System Efficiency Record'}
                </h3>
                <p className="text-[10px] font-bold text-[#d7d7d7]/70 uppercase tracking-widest mt-1">แบบฟอร์มรายงานประสิทธิภาพและการใช้พลังงานในกะ (Energy & Performance Report)</p>
              </div>
            </div>
            <button onClick={() => setShowEntryModal(false)} className="text-white/60 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"><Icons.X size={20} /></button>
          </div>
        }
      >
        <div className="bg-white text-[#414757]">
          {/* Staged Form Navigation Tab Headers */}
          <div className="flex border-b border-[#eaeaec] bg-[#f8f9fa] px-6 py-3 justify-between items-center shrink-0 uppercase tracking-widest text-[9px] font-black">
            <button onClick={() => setEntryStep(0)} className={`flex items-center gap-2 pb-1 transition-all ${entryStep === 0 ? 'text-[#212c46] border-b-2 border-[#212c46]' : 'text-[#7a8b95]'}`}>
              <span className="w-4 h-4 rounded-full bg-[#212c46] text-white flex items-center justify-center font-mono">1</span> Metadata
            </button>
            <button onClick={() => setEntryStep(1)} className={`flex items-center gap-2 pb-1 transition-all ${entryStep === 1 ? 'text-[#212c46] border-b-2 border-[#212c46]' : 'text-[#7a8b95]'}`}>
              <span className="w-4 h-4 rounded-full bg-[#212c46] text-white flex items-center justify-center font-mono">2</span> Productivity
            </button>
            <button onClick={() => setEntryStep(2)} className={`flex items-center gap-2 pb-1 transition-all ${entryStep === 2 ? 'text-[#212c46] border-b-2 border-[#212c46]' : 'text-[#7a8b95]'}`}>
              <span className="w-4 h-4 rounded-full bg-[#212c46] text-white flex items-center justify-center font-mono">3</span> Resources
            </button>
          </div>

          <div className="p-6 space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar">
            {entryStep === 0 && (
              <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                <div>
                  <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Production Date</label>
                  <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-extrabold text-[#212c46] outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Assigned Production Shift</label>
                  <select value={formShift} onChange={e => setFormShift(e.target.value)} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-semibold text-[#212c46] outline-none">
                    {SHIFTS.map(sh => <option key={sh} value={sh}>{sh}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Pipeline Assembly Line ID</label>
                  <select value={formLineId} onChange={e => setFormLineId(e.target.value)} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-semibold text-[#212c46] outline-none">
                    {LINES.map(ln => <option key={ln} value={ln}>{ln}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Main Output Product</label>
                  <select value={formProductName} onChange={e => setFormProductName(e.target.value)} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-semibold text-[#212c46] outline-none">
                    {PRODUCTS.map(prd => <option key={prd} value={prd}>{prd}</option>)}
                  </select>
                </div>
              </div>
            )}

            {entryStep === 1 && (
              <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                <div>
                  <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Produced Net Volume (Kg)</label>
                  <input type="number" value={formVolumeKg} onChange={e => setFormVolumeKg(Math.max(0, Number(e.target.value)))} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-extrabold text-[#212c46] outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Labor Count (Manpower On duty)</label>
                  <input type="number" value={formLaborCount} onChange={e => setFormLaborCount(Math.max(1, Number(e.target.value)))} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-extrabold text-[#212c46] outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Operational Runtime Minutes</label>
                  <input type="number" value={formRunMinutes} onChange={e => setFormRunMinutes(Math.max(0, Number(e.target.value)))} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-extrabold text-[#212c46] outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Unplanned Downtime minutes</label>
                  <input type="number" value={formDowntimeMin} onChange={e => setFormDowntimeMin(Math.max(0, Number(e.target.value)))} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-extrabold text-[#212c46] outline-none" />
                </div>
              </div>
            )}

            {entryStep === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Power Intake Consumption (kWh)</label>
                    <input type="number" value={formElectricityKwh} onChange={e => setFormElectricityKwh(Math.max(0, Number(e.target.value)))} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-extrabold text-[#212c46] outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Industrial Water Consumed (m³)</label>
                    <input type="number" value={formWaterM3} onChange={e => setFormWaterM3(Math.max(0, Number(e.target.value)))} step="0.1" className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-extrabold text-[#212c46] outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Reporting QC Auditor</label>
                    <input type="text" value={formSupervisor} onChange={e => setFormSupervisor(e.target.value)} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-semibold text-[#212c46] outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">System Target status override</label>
                    <select value={formStatus} onChange={e => setFormStatus(e.target.value)} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none">
                      <option value="Optimal">Optimal (No alarms triggered)</option>
                      <option value="Critical Review">Critical Review (Escalate immediately)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Downtime Cause & Engineering Remarks</label>
                  <textarea value={formRemarks} onChange={e => setFormRemarks(e.target.value)} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-semibold text-[#212c46] outline-none h-16 resize-none" placeholder="Provide raw utility breakdown details..." />
                </div>
              </div>
            )}
          </div>

          {/* Form Step Action Footer matched beautifully with standard layout */}
          <div className="px-6 py-4 bg-[#f8f9fa] border-t border-[#eaeaec] flex justify-between items-center shrink-0">
            <div>
              {entryStep > 0 && (
                <button
                  type="button"
                  onClick={() => setEntryStep(prev => prev - 1)}
                  className="px-5 py-2.5 bg-white border border-[#eaeaec] text-[#212c46] hover:bg-[#eaeaec]/30 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all cursor-pointer"
                >
                  Back
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowEntryModal(false)}
                className="px-5 py-2.5 bg-white border border-[#eaeaec] text-[#212c46] hover:bg-[#eaeaec]/30 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all cursor-pointer"
              >
                Cancel
              </button>
              {entryStep < 2 ? (
                <button
                  type="button"
                  onClick={() => setEntryStep(prev => prev + 1)}
                  className="px-6 py-2.5 bg-[#212c46] text-white hover:bg-[#b58c4f] rounded-xl font-black text-[11px] uppercase tracking-widest transition-all cursor-pointer"
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveEntry}
                  className="px-6 py-2.5 bg-[#212c46] text-white hover:bg-[#657f4d] rounded-xl font-black text-[11px] uppercase tracking-widest transition-all cursor-pointer"
                >
                  Commit Log
                </button>
              )}
            </div>
          </div>
        </div>
      </DraggableModal>

      {/* --- DRAGGABLE COMPOSITE POLICY SETTINGS CONFIGURATION MODAL (SYNCED ARCHITECTURE) --- */}
      <DraggableModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        width="max-w-[850px]"
        customHeader={
          <div className="bg-[#212c46] px-4 py-3 flex justify-between items-center shrink-0 border-b-2 border-[#b58c4f]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/20 shadow-sm">
                <Icons.Sliders size={20} className="text-[#b58c4f]" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#d7d7d7] uppercase tracking-widest leading-none">Efficiency Policy & Baseline Standards</h3>
                <p className="text-[10px] font-bold text-[#d7d7d7]/70 uppercase tracking-widest mt-1">เกณฑ์ควบคุมและมาตรฐานการแจ้งเตือนระดับบริษัท (Efficiency Controls Node)</p>
              </div>
            </div>
            <button onClick={() => setShowConfigModal(false)} className="text-white/60 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"><Icons.X size={20} /></button>
          </div>
        }
      >
        <div className="flex flex-col md:flex-row h-[420px] bg-white text-[#414757]">
          {/* Side-tab matching UserPermissions list layout */}
          <div className="w-full md:w-[240px] bg-[#f8f9fa] border-r border-[#eaeaec] flex flex-col p-3 shrink-0 uppercase tracking-widest font-black text-[10px] space-y-1">
            <button
              onClick={() => setConfigStep(0)}
              className={`p-3 rounded-xl text-left font-black tracking-widest flex items-center gap-2.5 transition-all ${configStep === 0 ? 'bg-[#212c46] text-white shadow-sm' : 'text-[#7a8b95] hover:bg-[#d7d7d7]/30 hover:text-[#212c46]'}`}
            >
              <Icons.Target size={14} /> Efficiency Baselines
            </button>
            <button
              onClick={() => setConfigStep(1)}
              className={`p-3 rounded-xl text-left font-black tracking-widest flex items-center gap-2.5 transition-all ${configStep === 1 ? 'bg-[#212c46] text-white shadow-sm' : 'text-[#7a8b95] hover:bg-[#d7d7d7]/30 hover:text-[#212c46]'}`}
            >
              <Icons.ShieldAlert size={14} /> Dispatch Rules
            </button>
            <button
              onClick={() => setConfigStep(2)}
              className={`p-3 rounded-xl text-left font-black tracking-widest flex items-center gap-2.5 transition-all ${configStep === 2 ? 'bg-[#212c46] text-white shadow-sm' : 'text-[#7a8b95] hover:bg-[#d7d7d7]/30 hover:text-[#212c46]'}`}
            >
              <Icons.Lock size={14} /> Trace Locking Info
            </button>
          </div>

          {/* Configuration Body Content */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            {configStep === 0 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="border-b border-[#eaeaec] pb-2 mb-4">
                  <h4 className="text-[12px] font-black text-[#212c46] uppercase tracking-widest">Step 1: Metric Compliance Baselines</h4>
                  <p className="text-[10px] text-[#7a8b95] uppercase font-bold mt-0.5">กำหนดเป้าหมายค่าดัชนีผลลัพธ์ประจำรอบผลิตและกำลังวัตถุดิบ</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Target Overall OEE Level (%)</label>
                    <input type="number" value={settings.targetOeeLevel} onChange={e => setSettings({ ...settings, targetOeeLevel: Number(e.target.value) })} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none focus:border-[#b58c4f]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Target Labor Output (Kg/Man-hr)</label>
                    <input type="number" value={settings.targetLaborProd} onChange={e => setSettings({ ...settings, targetLaborProd: Number(e.target.value) })} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none focus:border-[#b58c4f]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Elevated Specific Energy Max (kWh/T)</label>
                    <input type="number" value={settings.maxSecLimit} onChange={e => setSettings({ ...settings, maxSecLimit: Number(e.target.value) })} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none focus:border-[#b58c4f]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Unplanned Downtime Alarm Trigger (Min)</label>
                    <input type="number" value={settings.downtimeAlertThreshold} onChange={e => setSettings({ ...settings, downtimeAlertThreshold: Number(e.target.value) })} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none focus:border-[#b58c4f]" />
                  </div>
                </div>
              </div>
            )}

            {configStep === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="border-b border-[#eaeaec] pb-2 mb-4">
                  <h4 className="text-[12px] font-black text-[#212c46] uppercase tracking-widest">Step 2: Automated Dispatch & Alarm Rules</h4>
                  <p className="text-[10px] text-[#7a8b95] uppercase font-bold mt-0.5">กติกาการกักและสั่งระงับกะการผลิตกรณีพลังงานลื่นไถลสูงเกินมาตรฐาน</p>
                </div>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 bg-[#f8f9fa] border border-[#eaeaec] rounded-xl cursor-pointer hover:border-[#a94228] transition-colors">
                    <input type="checkbox" checked={settings.autoFlagDeficiency} onChange={e => setSettings({ ...settings, autoFlagDeficiency: e.target.checked })} className="w-4 h-4 accent-[#212c46]" />
                    <div>
                      <span className="block text-[11px] font-black text-[#212c46] uppercase tracking-wider">Automated Critical review status flag overrides</span>
                      <span className="block text-[9px] text-[#7a8b95] font-bold mt-0.5">สั่งบังคับสถานะรายงานตกมาตรฐานเป็น Critical Review ทันทีในฐานข้อมูลหลัก</span>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 p-3 bg-[#f8f9fa] border border-[#eaeaec] rounded-xl cursor-pointer hover:border-[#a94228] transition-colors">
                    <input type="checkbox" checked={settings.requireDoubleReview} onChange={e => setSettings({ ...settings, requireDoubleReview: e.target.checked })} className="w-4 h-4 accent-[#212c46]" />
                    <div>
                      <span className="block text-[11px] font-black text-[#212c46] uppercase tracking-wider">Require Double Verification signatory audit and technical approval</span>
                      <span className="block text-[9px] text-[#7a8b95] font-bold mt-0.5">ต้องลงลายเซ็นรับรองจากเทคนิคเชียนบำรุงรักษาควบหัวหน้ากะเพื่อปลดล็อก</span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {configStep === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="border-b border-[#eaeaec] pb-2 mb-4">
                  <h4 className="text-[12px] font-black text-[#212c46] uppercase tracking-widest">Step 3: ERP Integration & System Security</h4>
                  <p className="text-[10px] text-[#7a8b95] uppercase font-bold mt-0.5">การปรับตั้งช่องทางส่งข้อมูลและล็อกฟอร์มความสอดคล้อง</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Alert Dispatch Email Gateways</label>
                    <input type="text" value={settings.reportRecipients} onChange={e => setSettings({ ...settings, reportRecipients: e.target.value })} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none focus:border-[#b58c4f]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-1.5">Primary Enterprise Synchronization Channel</label>
                    <input type="text" value={settings.integrationChannel} onChange={e => setSettings({ ...settings, integrationChannel: e.target.value })} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none focus:border-[#b58c4f]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal settings footer matched perfectly */}
        <div className="px-6 py-3 bg-[#f8f9fa] border-t border-[#eaeaec] flex justify-end gap-3 shrink-0">
          <button onClick={() => setShowConfigModal(false)} className="px-5 py-2 bg-white border border-[#eaeaec] text-[#414757] rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-[#d7d7d7]/30 transition-all cursor-pointer">Cancel</button>
          <button onClick={() => setShowConfigModal(false)} className="bg-[#212c46] hover:bg-[#657f4d] text-white px-6 py-2 rounded-xl font-black text-[11px] uppercase tracking-widest hover:shadow-md transition-all active:scale-95 cursor-pointer">Save Settings</button>
        </div>
      </DraggableModal>
    </div>
  );
}
