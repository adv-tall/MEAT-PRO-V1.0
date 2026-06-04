import React, { useState, useMemo } from 'react';
import * as Icons from 'lucide-react';
import Swal from 'sweetalert2';
import { DraggableModal } from '../../components/shared/DraggableModal';
import KpiCard from '../../components/shared/KpiCard';
import { UserGuidePanel } from '../../components/shared/UserGuidePanel';
import UserGuideButton from '../../components/shared/UserGuideButton';

import { useCollection } from '../../services/useFirestore';

// --- SYSTEM COLOR PALETTE (Matched with Main Home Theme) ---
const THEME = {
  bgMain: '#f3f3f1',
  bgGradient: 'transparent',
  sidebarBg: 'linear-gradient(180deg, #1d2636 0%, #0F172A 100%)',
  glassWhite: 'rgba(255, 255, 255, 0.88)',
  primary: '#212c46',         // Navy
  primaryLight: '#4d87a8',    // Light Blue
  accent: '#a94228',         // Crimson Red
  gold: '#b58c4f',           // Gold
  brightGold: '#b7a159',     // Amber Gold
  success: '#657f4d',        // Sage Green
  danger: '#932c2e',         // Dark Red
  skyBlue: '#3f809e',        // Sky Blue
  dustyBlue: '#7a8b95',      // Slate Muted
  indigo: '#414757',         // Tech Slate
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

// --- MOCK PROBLEMS (PRESERVED 100% AS REQUIRED) ---
const INITIAL_PROBLEMS = [
  { 
    id: 'PRB-001', 
    date: '26/02/2025', 
    planId: '260416-001', 
    product: 'Smoked Sausage', 
    reportedBy: 'QA Team', 
    type: 'QC Failed (Weight Var)', 
    lossKg: 50, 
    requiredReplacementKg: 50, 
    status: 'Pending Replan' 
  },
  { 
    id: 'PRB-002', 
    date: '26/02/2025', 
    planId: '260416-003', 
    product: 'Pork Meatball', 
    reportedBy: 'Mixing', 
    type: 'Spill / Dropped', 
    lossKg: 20, 
    requiredReplacementKg: 20, 
    status: 'Replanned' 
  }
];

export default function UnplannedJobs() {
  const { data: dbProblems, add, update, remove } = useCollection('Unplanned_Jobs', INITIAL_PROBLEMS);
  const problems = dbProblems && dbProblems.length > 0 ? dbProblems : INITIAL_PROBLEMS;
  const [searchTerm, setSearchTerm] = useState('');
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Settings State matching standard of UserPermissions (Wizard multi-step format)
  const [settingsStep, setSettingsStep] = useState(0);
  const [activeSettings, setActiveSettings] = useState({
    defaultPriority: 'High',
    autoReplanLowerThan: 30, // Auto-replan if loss < 30Kg
    autoAlertPlanning: true,
    autoInjectPLBoard: false,
    requireSupervisorOver: 100, // Kg
    notifyByEmail: true,
    notifyByBuzzer: false,
    replanEngine: 'v1.4-smart'
  });

  // Staged Settings for configuration wizard edits
  const [tempSettings, setTempSettings] = useState({ ...activeSettings });

  // Reporting Form State
  const [newProblem, setNewProblem] = useState({ 
    planId: '', 
    product: '', 
    type: '', 
    lossKg: '' 
  });

  // KPI Calculations
  const pendingReplansCount = useMemo(() => {
    return problems.filter(p => p.status === 'Pending Replan').length;
  }, [problems]);

  const totalLossesToday = useMemo(() => {
    return problems.reduce((sum, p) => sum + p.lossKg, 0);
  }, [problems]);

  // Filtering list based on search Input
  const filteredProblems = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return problems;
    return problems.filter(
      p => p.id.toLowerCase().includes(q) ||
           p.planId.toLowerCase().includes(q) ||
           p.product.toLowerCase().includes(q) ||
           p.type.toLowerCase().includes(q) ||
           p.reportedBy.toLowerCase().includes(q)
    );
  }, [problems, searchTerm]);

  // Handle reporting a new loss
  const handleReport = () => {
    if (!newProblem.planId) {
      Swal.fire({
        icon: 'error',
        title: 'ข้อมูลไม่ครบถ้วน',
        text: 'กรุณากรอก Original Plan ID สำคัญเพื่อใช้ดำเนินเรื่อง',
        confirmButtonColor: THEME.primary
      });
      return;
    }
    if (!newProblem.lossKg || Number(newProblem.lossKg) <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'ระบุน้ำหนักไม่ถูกต้อง',
        text: 'กรุณากรอกปริมาณความเสียหาย (Kg) มากกว่า 0',
        confirmButtonColor: THEME.primary
      });
      return;
    }

    const lossAmount = Number(newProblem.lossKg);

    // Check if require supervisor verification based on current rules
    if (lossAmount >= activeSettings.requireSupervisorOver) {
      Swal.fire({
        icon: 'warning',
        title: 'ต้องอนุมัติความเสียหายขนาดใหญ่',
        text: `ปริมาณความเสียหาย ${lossAmount} Kg เกินเกณฑ์มาตรฐานสูงสุด (${activeSettings.requireSupervisorOver} Kg) ต้องได้รับการยืนยันระดับหัวหน้างานก่อนบันทึกเข้าระบบหลัก`,
        showCancelButton: true,
        confirmButtonText: 'ยืนยันเพื่อบันทึกงาน',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: THEME.accent,
        cancelButtonColor: THEME.dustyBlue,
      }).then((result) => {
        if (result.isConfirmed) {
          executeProblemSubmission(lossAmount);
        }
      });
    } else {
      executeProblemSubmission(lossAmount);
    }
  };

  const executeProblemSubmission = async (lossAmount: number) => {
    const newPrb = {
      date: new Date().toLocaleDateString('en-GB'),
      planId: newProblem.planId,
      product: newProblem.product || 'Unknown Product',
      reportedBy: 'Production',
      type: newProblem.type || 'Other',
      lossKg: lossAmount,
      requiredReplacementKg: lossAmount,
      status: 'Pending Replan'
    };

    try {
        await add(newPrb);
        setIsReportOpen(false);
        setNewProblem({ planId: '', product: '', type: '', lossKg: '' });

        Swal.fire({
          title: 'Problem Reported!',
          text: 'IA Generator will calculate new Plan ID for replacement.',
          icon: 'success',
          confirmButtonColor: '#111f42',
          confirmButtonText: 'รับทราบหลักการ'
        });
    } catch(e) {
        alert("Failed to report problem");
    }
  };

  // Generate Replan with AI Engine
  const handleGenerateReplan = (id: string, lossAmount: number) => {
    // Check if auto-replan is allowed or if we apply optimizer
    const isUnderThreshold = lossAmount < activeSettings.autoReplanLowerThan;

    Swal.fire({
      title: 'กำลังเชื่อมโยงการประมวลผล...',
      text: `ทำการจัดคิวงานทดแทนจำนวน ${lossAmount} Kg ด้วยโมเดลระบบ ${activeSettings.replanEngine.toUpperCase()}`,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
      timer: 1200
    }).then(async () => {
      try {
          const target = problems.find((p: any) => p.id === id);
          if(target) {
              await update(id, { ...target, status: 'Replanned' });
          }
      } catch(e) {}

      const replanId = id.replace('PRB', 'RP-PLAN');
      Swal.fire({
        title: 'IA Generator Success',
        html: `<div class="text-left text-xs font-mono space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p><strong>- Generated ID:</strong> ${replanId}</p>
                <p><strong>- Priority Assigned:</strong> ${activeSettings.defaultPriority.toUpperCase()}</p>
                <p><strong>- Target Line Inject:</strong> AUTO-DISPATCHED</p>
                <p><strong>- Process Status:</strong> Alerted Production Planning Success</p>
               </div>`,
        icon: 'success',
        confirmButtonColor: THEME.primary,
        confirmButtonText: 'ยืนยันแนวกำหนด'
      });
    });
  };

  // Configurations actions
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
      title: 'บันทึกการตั้งค่าระบบสำเร็จ!',
      text: 'ข้อกำหนดของความเสียหายทั้งหมดได้รับการอัปเกรดเรียบร้อย',
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

      {/* DETAILED USER MANUAL (Matches UserPermissions Standard) */}
      <UserGuidePanel
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        title="UNPLANNED GUIDE"
        subtitle="LOSS MANAGEMENT GUIDE"
      >
        <div className="space-y-8 font-sans">
            <div>
                <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                    <Icons.AlertTriangle size={16} className="text-[#a94228]" /> 1. ความเข้าใจระบบการรายงาน (Overview)
                </h3>
                <p className="mb-4 text-[#414757]">
                    เมื่อมีข้อผิดพลาดหน้าเตาผสม (Mixing Line) หรือด่านควบคุม QC เช่น ตรวจสอบพบเศษส่วนตกหล่น (Spilled/Dropped) หรือน้ำหนักสายผลิตไม่คงที่ต่ำกว่ามาตรฐาน ผู้ปฏิบัติงานจะต้องรายงานลงในระบบเพื่อเข้าสู่กระบวนการจัดสรรใหม่ทันที
                </p>
                <div className="p-4 bg-[#fdf2f2] border border-[#f5c6cb] rounded-xl text-[#414757]">
                    <div className="font-bold text-[#a94228] mb-2 flex items-center gap-2"><Icons.Siren size={16} /> ACTION POINT</div>
                    ระบบจะบังคับให้กรอกความจุสุทธิที่สูญเสียไป (สุญเสียจริง) พร้อมล๊อตหมายเลขอ้างอิง และเหตุผลที่ตก QC เสมอ เพื่อการสอบกลับข้อมูลได้ 100%
                </div>
            </div>

            <div className="h-px bg-[#eaeaec] w-full" />

            <div>
                <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                    <Icons.Cpu size={16} className="text-[#3f809e]" /> 2. ปลั๊กอินการประมวลผลอัจฉริยะ (IA REPLAN)
                </h3>
                <p className="mb-4 text-[#414757]">
                    ระบบจะวิเคราะห์ความเบี่ยงเบนจากออเดอร์เดิม หากปริมาณสูญเสียเกินขีดจำกัดล่าง จะรันระบบ Auto-Replan อัตโนมัติ:
                </p>
                <div className="space-y-3">
                    <div className="flex items-start gap-4 p-3 bg-[#f8f9fa] border border-[#eaeaec] rounded-xl">
                        <div className="p-2 bg-[#3f809e] text-white rounded-lg shrink-0"><Icons.RefreshCw size={16} /></div>
                        <div>
                            <div className="text-[#212c46] font-bold text-[12px] mb-1">REPLACEMENT QUEUE</div>
                            <div className="text-[#7a8b95] text-[12px]">เครื่องจักรจะได้รับ Plan รหัสชดเชยขึ้นต้นด้วย RP-PLAN สอดแทรกเข้ามาเพื่อรีดผลผลิตทดแทนโดยด่วนให้ทันกำหนดส่ง</div>
                        </div>
                    </div>
                    <div className="flex items-start gap-4 p-3 bg-[#f8f9fa] border border-[#eaeaec] rounded-xl">
                        <div className="p-2 bg-[#b58c4f] text-white rounded-lg shrink-0"><Icons.Lock size={16} /></div>
                        <div>
                            <div className="text-[#212c46] font-bold text-[12px] mb-1">SUPERVISOR LOCK SIGN</div>
                            <div className="text-[#7a8b95] text-[12px]">ตั้งเกณฑ์เพื่อความแม่นยำ หากรายงานความเสียหายมีมูลค่าสูง ระบบจะเปิดหน้าต่างให้ Supervisor อนุมัติรหัสก่อนข้ามพาสทำงาน</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-px bg-[#eaeaec] w-full" />

            <div>
                <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                    <Icons.Settings size={16} className="text-[#b58c4f]" /> 3. การตั้งค่าระบบ (SETTINGS FORM)
                </h3>
                <p className="mb-4 text-[#414757]">
                    คุณสามารถกำหนดสูตรคำนวณและข้อจำกัดได้ในปุ่มตั้งค่า (Settings):
                </p>
                <div className="space-y-3">
                    <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-[#3f809e]"></div><span className="text-[#414757] text-[12px]"><strong className="text-[#212c46]">Step 1: Variables</strong> - กฎเกณฑ์และขีดจำกัดรับน้ำหนักความเสียหาย</span></div>
                    <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-[#d55a6d]"></div><span className="text-[#414757] text-[12px]"><strong className="text-[#212c46]">Step 2: Control Rules</strong> - การเตือนภัยบนกระดานกลาง, บังคับลายเซ็นหัวหน้า</span></div>
                    <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-[#688a58]"></div><span className="text-[#414757] text-[12px]"><strong className="text-[#212c46]">Step 3: Engine Selecors</strong> - โมดูล AI เลือกประเภทอัลกอริทึมในการทำสอบซ้ำและ Replan</span></div>
                </div>
            </div>
        </div>
      </UserGuidePanel>

      {/* DISTINCT UNIFIED HEADER */}
      <div className="h-14 px-4 sm:px-8 flex flex-row items-center justify-between gap-4 z-20 shrink-0">
        <div className="flex items-center gap-5">
          <div className="relative flex items-center justify-center group cursor-default shrink-0">
            <div className="absolute inset-0 bg-[#a94228] blur-[15px] opacity-20 rounded-full group-hover:opacity-60 transition-all duration-700"></div>
            <div className="relative z-10 p-1.5 border border-[#a94228]/40 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm">
              <Icons.AlertTriangle size={28} strokeWidth={2.5} className="text-[#a94228]" />
            </div>
          </div>
          <div>
            <h3 className="font-black text-[#212c46] uppercase tracking-tighter leading-none font-exception-header" style={{ fontSize: '24px' }}>
              UNPLANNED <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a94228] to-[#b58c4f]">JOBS & PROBLEMS</span>
            </h3>
            <p className="text-[11px] font-bold text-[#7a8b95] uppercase tracking-[0.2em] mt-0.5 opacity-80 leading-none">
              REPORT OPERATION LOSSES AND MANAGE AUTOMATED ORDER REPLACEMENTS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex gap-2 p-1 bg-white/50 border border-[#eaeaec] rounded-xl shadow-sm">
            <button
              onClick={openSettingsModal}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-[#212c46] px-4 py-2 rounded-lg font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-2 outline-none"
            >
              <Icons.Settings size={14} className="text-[#b7a159]" /> Configure Settings (ตั้งค่า)
            </button>
            <span className="text-[10px] font-black bg-[#212c46]/10 text-[#212c46] px-3.5 py-2 rounded-lg border border-[#212c46]/20 shadow-inner flex items-center gap-1.5 font-mono">
              <Icons.Cpu size={12} className="text-[#a94228] animate-pulse" />
              ENGINE {activeSettings.replanEngine.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="mx-auto px-4 sm:px-8 w-full mt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard 
            label="Pending Replans" 
            value={pendingReplansCount.toString()} 
            icon="alert-octagon" 
            colorAccent="#ec4899" 
            colorValue="#db2777" 
            desc="Awaiting replacement schedules" 
          />
          <KpiCard 
            label="Total Losses Today" 
            value={`${totalLossesToday} Kg`} 
            icon="trending-down" 
            colorAccent={THEME.accent} 
            colorValue={THEME.accent} 
            desc="Accumulated production errors" 
          />
          <KpiCard 
            label="Default Replan Priority" 
            value={activeSettings.defaultPriority.toUpperCase()} 
            icon="zap" 
            colorAccent={THEME.skyBlue} 
            colorValue={THEME.skyBlue} 
            desc="Assigned to new jobs" 
          />
          <KpiCard 
            label="Supervisor Check over" 
            value={`${activeSettings.requireSupervisorOver} Kg`} 
            icon="shield-check" 
            colorAccent={THEME.gold} 
            colorValue={THEME.gold} 
            desc="Threshold limit rule" 
          />
        </div>

        {/* DATA ACTIONS AND TABLE */}
        <div className="bg-white rounded-xl border border-[#eaeaec] shadow-lg overflow-hidden flex flex-col">
          
          <div className="p-6 border-b border-[#eaeaec] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white">
            <div className="relative w-full sm:w-96">
              <Icons.Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search Problem ID, Original Plan, Product..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 bg-[#f8f9fa] border border-[#eaeaec] rounded-xl text-xs font-bold text-[#212c46] outline-none focus:border-[#b7a159] shadow-inner transition-colors placeholder-slate-400" 
              />
            </div>
            
            <button 
              className="bg-[#a94228] hover:bg-[#932c2e] text-white px-5 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-md transition-all flex items-center gap-2 border border-transparent active:scale-95 shrink-0" 
              onClick={() => setIsReportOpen(true)}
            >
              <Icons.AlertCircle size={14} /> REPORT PROBLEM (แจ้งปัญหา)
            </button>
          </div>

          <div className="overflow-x-auto custom-scrollbar bg-slate-50">
            <table className="w-full text-left min-w-[1000px] border-collapse bg-white table-font">
              <thead className="sys-table-header">
                <tr className="bg-[#212c46] text-[#d7d7d7]  [#b7a159]">
                  <th className="font-black uppercase tracking-widest ">Report ID</th>
                  <th className="font-black uppercase tracking-widest ">Date</th>
                  <th className="font-black uppercase tracking-widest ">Original Plan ID</th>
                  <th className="font-black uppercase tracking-widest ">Product</th>
                  <th className="font-black uppercase tracking-widest ">Issue / Type</th>
                  <th className="font-black uppercase tracking-widest text-right ">Loss (Kg)</th>
                  <th className="font-black uppercase tracking-widest text-center ">Status</th>
                  <th className="font-black uppercase tracking-widest text-center">IA Replan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeaec]">
                {filteredProblems.length > 0 ? (
                  filteredProblems.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-4 font-mono font-black text-[#a94228] text-xs py-2.5">{p.id}</td>
                      <td className="px-4 text-slate-500 font-bold text-xs py-2.5">{p.date}</td>
                      <td className="px-4 font-mono text-[#212c46] font-black text-xs py-2.5">{p.planId}</td>
                      <td className="px-4 text-[#212c46] font-black text-xs uppercase tracking-tight py-2.5">{p.product}</td>
                      <td className="px-4 py-2.5">
                        <span className="bg-red-50 text-[#932c2e] border border-red-100 px-2.5 py-1 rounded-md text-[9.5px] font-black uppercase tracking-wider">
                          {p.type}
                        </span>
                      </td>
                      <td className="px-4 text-right font-mono font-black text-[#932c2e] text-xs py-2.5">
                        -{p.lossKg} <span className="text-[10px] text-slate-400">Kg</span>
                      </td>
                      <td className="px-4 text-center py-2.5">
                        <span className={`px-3 py-1 rounded-full text-[9.5px] font-black uppercase tracking-widest border ${
                          p.status === 'Replanned' 
                            ? 'bg-emerald-50 text-[#657f4d] border-emerald-200' 
                            : 'bg-amber-50 text-amber-600 border-amber-200 animate-pulse'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 text-center py-2.5">
                        {p.status === 'Pending Replan' ? (
                          <button 
                            onClick={() => handleGenerateReplan(p.id, p.lossKg)} 
                            className="bg-[#212c46]/10 hover:bg-[#212c46] text-[#212c46] hover:text-white px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 mx-auto active:scale-95 border border-[#212c46]/5"
                          >
                            <Icons.Sparkles size={12} className="text-[#b7a159]" /> IA Replan
                          </button>
                        ) : (
                          <span className="text-emerald-600 text-xs font-bold flex items-center justify-center gap-1">
                            <Icons.CheckCircle size={15} className="text-[#657f4d]" /> Done
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="text-center text-xs font-black text-slate-400 uppercase tracking-widest py-2.5 px-4">
                      <Icons.Database className="mx-auto text-slate-300 mb-2" size={32} />
                      No registered loss problems found matching query
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* REPORT REPLACEMENT MODAL */}
      <DraggableModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        title="REPORT DAILY QUALITY LOSS"
        width="600px"
        customHeader={
          <div className="bg-[#212c46] px-6 py-4 flex justify-between items-center shrink-0 border-b-2 border-[#b7a159] modal-handle cursor-move w-full select-none">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/20 shadow-sm">
                <Icons.AlertTriangle size={18} className="text-[#a94228] animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs font-black text-[#d7d7d7] uppercase tracking-widest leading-none">Report Daily Quality Loss</h3>
                <p className="text-[10px] font-bold text-[#b7a159] uppercase tracking-widest mt-1.5">Submit scrap, spill, or defect volumes</p>
              </div>
            </div>
            <button onClick={() => setIsReportOpen(false)} className="text-white/50 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-1.5 rounded-lg outline-none">
              <Icons.X size={16} />
            </button>
          </div>
        }
      >
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Original Plan ID (รหัสแผนผลิตเดิม *จำเป็น)</label>
            <input 
              type="text" 
              className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-3 text-xs font-bold text-[#212c46] outline-none focus:border-[#b7a159] shadow-inner uppercase" 
              placeholder="e.g. 260416-001" 
              value={newProblem.planId} 
              onChange={e => setNewProblem({...newProblem, planId: e.target.value})} 
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5 font-bold">Product Name / SKU (รายการสินค้าเพื่อจัดชดเชย)</label>
            <input 
              type="text" 
              className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-3 text-xs font-bold text-[#212c46] outline-none focus:border-[#b7a159] shadow-inner" 
              placeholder="e.g. Smoked Sausage, Pork Meatball"
              value={newProblem.product} 
              onChange={e => setNewProblem({...newProblem, product: e.target.value})} 
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Issue Type (ประเภทข้อบกพร่องที่พบ)</label>
            <select 
              className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-3 text-xs font-bold text-[#212c46] outline-none focus:border-[#b7a159] cursor-pointer" 
              value={newProblem.type} 
              onChange={e => setNewProblem({...newProblem, type: e.target.value})}
            >
              <option value="">-- Click to Select Issue Type --</option>
              <option value="QC Failed (Weight Var)">QC Failed (Weight Var)</option>
              <option value="Spill / Dropped">Spill / Dropped (ตกหล่น/รั่วไหล)</option>
              <option value="Machine Error">Machine Error (สายพาน/ชำรุด)</option>
              <option value="Other">Other (อื่น ๆ)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Loss amount (Kg) to replace (น้ำหนักสินค้าคงเหลือกู้คืนเป็นเศษสุทธิ)</label>
            <input 
              type="number" 
              className="w-full bg-red-50/50 border border-red-100 rounded-xl px-4 py-3 text-xs font-black text-[#932c2e] outline-none focus:border-red-300 shadow-inner" 
              placeholder="0.00 Kg"
              value={newProblem.lossKg} 
              onChange={e => setNewProblem({...newProblem, lossKg: e.target.value})} 
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 mt-6 font-sans">
            <button 
              className="bg-slate-50 border border-[#eaeaec] hover:bg-slate-100 text-slate-500 px-5 py-2.5 rounded-xl font-bold text-[10.5px] uppercase tracking-wider transition-colors active:scale-95" 
              onClick={() => setIsReportOpen(false)}
            >
              Cancel
            </button>
            <button 
              className="bg-[#a94228] hover:bg-[#932c2e] text-white px-6 py-2.5 rounded-xl font-black text-[10.5px] uppercase tracking-widest transition-all active:scale-95" 
              onClick={handleReport}
            >
              Submit Report (แจ้งข้อมูลเข้า)
            </button>
          </div>
        </div>
      </DraggableModal>

      {/* CONFIGURATOR WIZARD MODAL (Standards derived directly from UserPermissions) */}
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
                    <h3 className="text-sm font-black text-[#d7d7d7] uppercase tracking-widest leading-none">Configure Unplanned Jobs System</h3>
                    <p className="text-[10px] font-bold text-[#b7a159] uppercase tracking-widest mt-1.5">Setup rules, alert levels, & engine algorithms</p>
                  </div>
                </div>
                <button onClick={() => setIsSettingsOpen(false)} className="text-white/50 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-1.5 rounded-lg active:scale-90 outline-none">
                  <Icons.X size={18} />
                </button>
              </div>
            }
          >
            <div className="flex flex-col md:flex-row overflow-hidden bg-[#f8f9fa] h-[460px] font-sans">
              
              {/* Wizard Nav Columns (Exact standard of UserPermissions settings) */}
              <div className="w-full md:w-56 bg-white border-b md:border-b-0 md:border-r border-[#eaeaec] flex flex-row md:flex-col shrink-0 text-left select-none">
                <div className="hidden md:block px-5 py-4 text-[10px] font-black text-[#7a8b95] uppercase tracking-widest border-b border-[#eaeaec] bg-[#f8f9fa]">
                  Rules Matrix Menu
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
                    {step === 0 && <Icons.Zap size={14} className={settingsStep === step ? 'text-[#b7a159]' : 'text-[#7a8b95]'} />}
                    {step === 1 && <Icons.ShieldAlert size={14} className={settingsStep === step ? 'text-[#b7a159]' : 'text-[#7a8b95]'} />}
                    {step === 2 && <Icons.Cpu size={14} className={settingsStep === step ? 'text-[#b7a159]' : 'text-[#7a8b95]'} />}
                    <span className="text-[10.5px] font-black uppercase tracking-widest font-mono">
                      STEP {step + 1}: {step === 0 ? 'Variables' : step === 1 ? 'Controls' : 'Engine Tuner'}
                    </span>
                  </button>
                ))}
              </div>

              {/* Wizard step contents */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white select-none">
                
                {/* STEP 1 */}
                {settingsStep === 0 && (
                  <div className="space-y-5 animate-fadeIn">
                    <h4 className="text-[12px] font-black text-[#212c46] uppercase border-b-2 border-slate-100 pb-2.5 tracking-wider">Step 1: Default Variables Setup</h4>
                    
                    <div>
                      <label className="block text-[10px] font-black text-[#7a8b95] uppercase tracking-widest mb-1.5">New Jobs Default Priority (ลำดับความสำคัญเริ่มต้น)</label>
                      <select
                        value={tempSettings.defaultPriority}
                        onChange={e => setTempSettings({ ...tempSettings, defaultPriority: e.target.value })}
                        className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-3 text-[12px] font-bold text-[#212c46] outline-none focus:border-[#b7a159] cursor-pointer"
                      >
                        <option value="Normal">Normal Mode - คิวส่งคิวว่างทั่วไป</option>
                        <option value="Medium">Medium Mode - คิวมีช่องจัดสรรถัดไป</option>
                        <option value="High">High Mode - ล็อกข้ามเครื่องสายผลิต</option>
                        <option value="Urgent">Urgent Mode - ตัดสายเตาปัจจุบันทิ้งทันที</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[10px] font-black text-[#7a8b95] uppercase tracking-widest">Auto Replan Loss Weight Limit (ขีดล่างชดเชยด่วนอัตโนมัติ)</label>
                        <span className="text-xs font-mono font-black text-[#a94228] bg-orange-50 border border-orange-100 px-2 py-0.5 rounded">{tempSettings.autoReplanLowerThan} Kg</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="80"
                        value={tempSettings.autoReplanLowerThan}
                        onChange={e => setTempSettings({ ...tempSettings, autoReplanLowerThan: Number(e.target.value) })}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#212c46]"
                      />
                      <span className="text-[10px] text-slate-400 font-bold block mt-1">
                        ปริมาณความเสียหายที่น้อยกว่าที่กำหนดไว้จะได้รับการลงคิวบิลแทนที่อัตโนมัติ ไม่ยุ่งยากคอยดึงคอนเฟิร์มกระบวนการ
                      </span>
                    </div>
                  </div>
                )}

                {/* STEP 2 */}
                {settingsStep === 1 && (
                  <div className="space-y-5 animate-fadeIn">
                    <h4 className="text-[12px] font-black text-[#212c46] uppercase border-b-2 border-slate-100 pb-2.5 tracking-wider">Step 2: Controls & Safety Rules</h4>
                    
                    <div className="space-y-4">
                      
                      <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <div>
                          <span className="text-xs font-black text-[#212c46] block uppercase tracking-tight">Auto-Alert Planning Team</span>
                          <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">แจ้งเตือนแผงควบคุมหลักฝ่ายแผนทันทีเมื่อกดยืนยันบันทึก</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={tempSettings.autoAlertPlanning}
                          onChange={e => setTempSettings({ ...tempSettings, autoAlertPlanning: e.target.checked })}
                          className="w-4 h-4 text-[#212c46] border-[#eaeaec] rounded accent-[#212c46] cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <div>
                          <span className="text-xs font-black text-[#212c46] block uppercase tracking-tight">Supervisor Verification Lock</span>
                          <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">บังคับตรวจสอบโดยระดับหัวหน้าแถวผลิต</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 select-none">
                          <span className="text-[10.5px] font-semibold text-slate-400">If Over:</span>
                          <input
                            type="number"
                            value={tempSettings.requireSupervisorOver}
                            onChange={e => setTempSettings({ ...tempSettings, requireSupervisorOver: Number(e.target.value) })}
                            className="w-18 bg-white border border-[#eaeaec] rounded-lg px-2 py-1 text-center font-bold text-xs font-mono text-[#a94228] outline-none"
                          />
                          <span className="text-[10px] font-bold text-slate-400">Kg</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <div>
                          <span className="text-xs font-black text-[#212c46] block uppercase tracking-tight">Auto Inject to PL Board</span>
                          <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">เมื่อสร้างแผนชดเชยเสร็จ นำไปทับซ้อนลงกระดานเกณฑ์ผลิตหลักทันที</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={tempSettings.autoInjectPLBoard}
                          onChange={e => setTempSettings({...tempSettings, autoInjectPLBoard: e.target.checked})}
                          className="w-4 h-4 text-[#212c46] border-[#eaeaec] rounded accent-[#212c46] cursor-pointer"
                        />
                      </div>

                    </div>
                  </div>
                )}

                {/* STEP 3 */}
                {settingsStep === 2 && (
                  <div className="space-y-5 animate-fadeIn">
                    <h4 className="text-[12px] font-black text-[#212c46] uppercase border-b-2 border-slate-100 pb-2.5 tracking-wider">Step 3: Engine Selectors & Alarms</h4>
                    
                    <div>
                      <label className="block text-[10px] font-black text-[#7a8b95] uppercase tracking-widest mb-1.5">IA Re-Planning Engine Model</label>
                      <div className="grid grid-cols-2 gap-3.5">
                        {[
                          { val: 'v1.0-standard', label: 'Standard IA v1.0', desc: 'FIFO queue with basic shifts gaps' },
                          { val: 'v2.0-beta', label: 'Adaptive IA v2.0-Beta', desc: 'Predictive machine scheduling with safety offsets' },
                        ].map(alg => (
                          <div
                            key={alg.val}
                            onClick={() => setTempSettings({ ...tempSettings, replanEngine: alg.val })}
                            className={`p-4 border rounded-xl cursor-pointer transition-all ${
                              tempSettings.replanEngine === alg.val
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

                    <div className="border-t border-slate-100 pt-4">
                      <label className="block text-[10px] font-black text-[#7a8b95] uppercase tracking-widest mb-1.5">Channels of alarm dispatching</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={tempSettings.notifyByEmail}
                            onChange={e => setTempSettings({ ...tempSettings, notifyByEmail: e.target.checked })}
                            className="accent-[#212c46]"
                          />
                          Email Dispatching
                        </label>
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={tempSettings.notifyByBuzzer}
                            onChange={e => setTempSettings({ ...tempSettings, notifyByBuzzer: e.target.checked })}
                            className="accent-[#212c46]"
                          />
                          Physical Terminal Buzzer
                        </label>
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
