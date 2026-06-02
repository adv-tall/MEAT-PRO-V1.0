import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarClock,
  Sparkles,
  BookOpen,
  Calculator,
  BarChart3,
  Clock,
  AlertTriangle,
  FileCheck,
  Layers,
  ChevronRight,
  CheckCircle2,
  TrendingUp,
  Package,
  Cog,
  HelpCircle,
  X,
  Settings,
  ShieldCheck,
  User,
  Info,
  Trophy,
  BarChart2,
  Check,
  RefreshCw,
  Plus,
  Trash2,
  Pencil
} from 'lucide-react';
import { DraggableModal } from '../../components/shared/DraggableModal';
import KpiCard from '../../components/shared/KpiCard';
import { UserGuidePanel } from '../../components/shared/UserGuidePanel';
import UserGuideButton from '../../components/shared/UserGuideButton';
import { CsvUpload } from '../../components/shared/CsvUpload';
import { CsvExport } from '../../components/shared/CsvExport';
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

export default function AiPlannerAsst() {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [progress, setProgress] = useState(0);

  // AI Configuration Settings State (standard like UserPermissions)
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [configStep, setConfigStep] = useState(0);

  const [aiPrompt, setAiPrompt] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Configuration Node states
  const [safetyStockRatio, setSafetyStockRatio] = useState(25);
  const [planningHorizon, setPlanningHorizon] = useState('weekly');
  const [optimizeChangeover, setOptimizeChangeover] = useState(true);
  const [deliveryPriority, setDeliveryPriority] = useState('high');
  const [limitOvertime, setLimitOvertime] = useState(false);
  const [engineVersion, setEngineVersion] = useState('v1.2');
  const [maxIterations, setMaxIterations] = useState(2000);

  // Temp configuration state for multi-step modal edits
  const [tempConfig, setTempConfig] = useState({
    safetyStockRatio: 25,
    planningHorizon: 'weekly',
    optimizeChangeover: true,
    deliveryPriority: 'high',
    limitOvertime: false,
    engineVersion: 'v1.2',
    maxIterations: 2000,
  });

  const handleStartAnalysis = () => {
    setIsAnalyzing(true);
    setAnalysisComplete(false);
    setProgress(0);
    
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 5;
      setProgress(currentProgress);
      
      if (currentProgress >= 100) {
        clearInterval(interval);
        setIsAnalyzing(false);
        setAnalysisComplete(true);
        Swal.fire({
          icon: 'success',
          title: 'ประมวลผลเสร็จสิ้น!',
          text: 'AI แนะนำแผนการผลิตที่เหมาะสมที่สุดเรียบร้อยแล้ว',
          confirmButtonColor: THEME.primary,
          timer: 2000,
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
        });
      }
    }, 100);
  };

  const handleOpenConfig = () => {
    // Populate temp states
    setTempConfig({
      safetyStockRatio,
      planningHorizon,
      optimizeChangeover,
      deliveryPriority,
      limitOvertime,
      engineVersion,
      maxIterations,
    });
    setConfigStep(0);
    setIsConfigOpen(true);
  };

  const handleSaveConfig = () => {
    // Commit temp to real state
    setSafetyStockRatio(tempConfig.safetyStockRatio);
    setPlanningHorizon(tempConfig.planningHorizon);
    setOptimizeChangeover(tempConfig.optimizeChangeover);
    setDeliveryPriority(tempConfig.deliveryPriority);
    setLimitOvertime(tempConfig.limitOvertime);
    setEngineVersion(tempConfig.engineVersion);
    setMaxIterations(tempConfig.maxIterations);

    setIsConfigOpen(false);
    Swal.fire({
      icon: 'success',
      title: 'บันทึกการตั้งค่าแผนสำเร็จ',
      text: 'ระบบจะนำเกณฑ์และข้อจำกัดนี้ไปประมวลผลร่วมกับ AI ในรอบหน้า',
      confirmButtonColor: THEME.primary,
    });
  };

  return (
    <div className="flex flex-1 w-full flex-col animate-fadeIn bg-transparent space-y-4 relative font-sans">
      
      {/* FLOATING GUIDE BUTTON */}
      <UserGuideButton onClick={() => setIsGuideOpen(true)} />

      {/* RICH USER GUIDE PANEL (UserPermissions Detailed Style) */}
      <UserGuidePanel
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        title="AI PLANNER MANUAL"
        subtitle="คู่มือระบบวางแผนการผลิตอัจฉริยะ (AI-Driven Capacity Planning Guide)"
      >
        <div className="space-y-6">
          
          {/* Section 1: Objective */}
          <section className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="text-[13px] font-black text-[#212c46] mb-2.5 uppercase flex items-center gap-2 border-b border-[#b7a159]/30 pb-2 font-mono">
              <Info size={16} className="text-[#a94228]" />
              1. ระบบ AI PLANNER แนะนำ (Hub Overview)
            </h4>
            <p className="leading-relaxed text-[11.5px] text-[#414757] font-bold">
              เมนู **AI Planner Assistant** ทำหน้าที่เชื่อมโยงความต้องการทางตลาดจากกระดานออเดอร์ (Demand Input) เข้ากับกำลังพล และสถานะเครื่องจักรจริงหน้าไลน์เปรียบเทียบ โดยใช้โครงสร้างแบบจำลอง AI Machine-Capacity ในการคำนวณรวบยอด
            </p>
          </section>

          {/* Section 2: Key Benefits */}
          <section className="space-y-2">
            <h4 className="text-[13px] font-black text-[#212c46] mb-2.5 uppercase flex items-center gap-2 border-b border-[#b7a159]/30 pb-2 font-mono">
              <Sparkles size={16} className="text-[#a94228]" />
              2. ประโยชน์ที่พึงได้รับ
            </h4>
            <div className="space-y-2">
              <div className="p-3 bg-white border border-[#eaeaec] rounded-xl text-[11px]">
                <strong className="text-primary block font-mono">MINIMIZE CHANGEOVER</strong>
                <p className="text-slate-500 mt-1">คัดกลุ่มกลุ่มเนื้อหรือบรรจุภัณฑ์คล้ายกัน เพื่อลดเวลาทำความสะอาดหัวฉีด/แม่พิมพ์สายผลิตได้ถึง 15%</p>
              </div>
              <div className="p-3 bg-white border border-[#eaeaec] rounded-xl text-[11px]">
                <strong className="text-emerald-700 block font-mono">SAFETY STOCK BUFFER</strong>
                <p className="text-slate-500 mt-1">จัดสำรองปริมาณสินค้าคงคลังสำรองสำหรับกลุ่มตลาดอุปสงค์แปรปรวนป้องกันปัญหาอุตสาหกรรมในอนาคต</p>
              </div>
            </div>
          </section>

          {/* Section 3: Wizard Configurator */}
          <section className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <h4 className="text-[13px] font-black text-[#212c46] mb-1.5 uppercase flex items-center gap-2 border-b border-[#b7a159]/30 pb-1.5 font-mono">
              <Layers size={16} className="text-[#a94228]" />
              3. คำอธิบายขั้นตอนในหน้าต่างแก้ไขการตั้งค่า (Wizard Core)
            </h4>
            <p className="text-[11.5px] text-[#414757] font-bold">
              ระบบ Configurator ออกแบบแบ่งออกเป็น 3 ขั้นตอนเชิงลึก (Standard Wizard Step) ดั่งนี้:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[11px] text-[#414757]">
              <li><strong className="text-primary font-mono">STEP 1: Horizon & Metrics</strong> - ปรับเปลี่ยนกรอบประยุกต์รายเวลา (Short-term บายวีค หรือ Forecasting รายเดือน) พร้อมกำหนดระดับจำกัดรักษาสต็อคปลอดภัย</li>
              <li><strong className="text-primary font-mono">STEP 2: Priority Nodes</strong> - จัดน้ำหนักเป้าหมาย (ให้สิทธิ์เวลาจัดส่ง หรือการรดต้นทุนการสลับชุดพิมพ์เป็นสำคัญ) เพื่อคัดสรรค์โมเดลพยากรณ์</li>
              <li><strong className="text-primary font-mono">STEP 3: Engine Tuners</strong> - เลือกรุ่นเอ็นจิ้น AI และปรับปรุง Max Iterations สำหรับชุดเซตคำนวณขั้นสูง</li>
            </ul>
          </section>

          {/* Section 4: Operational Guidelines */}
          <section className="space-y-2">
            <h4 className="text-[13px] font-black text-[#212c46] mb-2.5 uppercase flex items-center gap-2 border-b border-[#b7a159]/30 pb-2 font-mono">
              <Cog size={16} className="text-[#a94228]" />
              4. วิธีรับมือคอขวดสะสมไลน์ผลิต (Bottlenecks Action)
            </h4>
            <p className="text-[11.5px] text-[#414757] leading-relaxed font-bold">
              ในแถบคอขวดขวาของจอ (Bottlenecks) จะดึงสถิติตรงจากบอร์ดเครื่องจักรแจ้งเครื่องเสีย เมื่อชิ้นงานหรือสายพานล่าช้า ให้กดดูเพื่อทวนเวลาทำงานหรือสั่ง Override การวางแผน แต่อาจเกิดปัญหาในสายพานจริงของฝ่ายปฏิบัติการ
            </p>
          </section>

          <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            MES ระดับผู้ช่วยแผนงานผลิตอเนกประสงค์อัตโนมัติ • VER 1.2.0
          </div>
        </div>
      </UserGuidePanel>

      {/* UNIFIED COHERENT HEADER */}
      <div className="h-14 px-8 flex flex-row items-center justify-between gap-4 z-20 shrink-0">
        <div className="flex items-center gap-5">
          <div className="relative flex items-center justify-center group cursor-default shrink-0">
            <div className="absolute inset-0 bg-[#3f809e] blur-[15px] opacity-20 rounded-full group-hover:opacity-60 transition-all duration-700"></div>
            <div className="relative z-10 p-1.5 border border-[#3f809e]/40 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm">
              <CalendarClock size={28} strokeWidth={2.5} className="text-[#3f809e]" />
            </div>
          </div>
          <div>
            <h3 className="font-black text-[#212c46] uppercase tracking-tighter leading-none font-exception-header" style={{ fontSize: '24px' }}>
              AI PLANNER <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3f809e] to-[#b58c4f]">ASSISTANT</span>
            </h3>
            <p className="text-[11px] font-bold text-[#7a8b95] uppercase tracking-[0.2em] mt-0.5 opacity-80 leading-none">
              AI-DRIVEN CAPACITY PLANNING & SCHEDULING SYSTEM
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex gap-2 p-1 bg-white/50 border border-[#eaeaec] rounded-xl shadow-sm">
            <button
              onClick={handleOpenConfig}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-[#212c46] px-4 py-2 rounded-lg font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-2"
            >
              <Settings size={14} className="text-[#b7a159]" /> Configure Settings (ตั้งค่า)
            </button>
            <span className="text-[10px] font-black bg-[#212c46]/10 text-[#212c46] px-3.5 py-2 rounded-lg border border-[#212c46]/20 shadow-inner flex items-center gap-1.5 font-mono">
              <Sparkles size={12} className="text-[#a94228] animate-pulse" />
              AI MODE {engineVersion.toUpperCase()} ACTIVE
            </span>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="max-w-[1532px] mx-auto px-4 sm:px-8 w-full mt-2 transition-all">
        
        {/* KPI CARDS BAR */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 shrink-0">
          <KpiCard label="Safety Stock Target" value={`${safetyStockRatio}%`} icon="package" colorAccent={THEME.accent} colorValue={THEME.accent} desc="Inventory buffer ratio" />
          <KpiCard label="Planning Horizon" value={planningHorizon === 'weekly' ? '7 Days (Weekly)' : '90 Days (Forecast)'} icon="calendar-clock" colorAccent={THEME.gold} colorValue={THEME.gold} desc="Calculation spectrum" />
          <KpiCard label="Changeover Rules" value={optimizeChangeover ? "Active (Minimize)" : "Bypassed"} icon="cog" colorAccent={THEME.success} colorValue={THEME.success} desc="Clean / wash optimize" />
          <KpiCard label="Delivery Priority" value={deliveryPriority.toUpperCase()} icon="trophy" colorAccent={THEME.skyBlue} colorValue={THEME.skyBlue} desc="Focus optimization weight" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Action Panel */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-[#eaeaec] p-8 shadow-lg flex flex-col space-y-4">
            
            <div className="flex items-center justify-between border-b border-[#eaeaec] pb-4 mb-4">
              <div>
                <h3 className="text-sm font-black text-[#212c46] uppercase tracking-widest flex items-center gap-2">
                  <Calculator size={18} className="text-[#a94228]" />
                  ระบบประมวลสร้างแผนกำลังการผลิตด้วยสมองกลอัจฉริยะ
                </h3>
                <p className="text-[11px] text-[#7a8b95] font-semibold uppercase tracking-wider mt-1">Automatic Capacity Optimizer & Schedulers Module</p>
              </div>
              <div className="flex items-center gap-3">
                <CsvExport 
                    data={analysisComplete ? [{ plan_id: "PL-4092-A", line: 1, item: "Sausage", status: "Optimized" }] : []}
                    filename="ai_generated_plan.csv"
                    label="EXPORT PLAN"
                    className="!h-9 !px-4 !rounded-lg !bg-white !text-[#7a8b95] !border !border-[#eaeaec] hover:!border-[#4d87a8] hover:!text-[#4d87a8] !shadow-sm !font-black !text-[10px] !tracking-widest !uppercase"
                />
                <button 
                  onClick={() => setIsUploadModalOpen(true)}
                  className="bg-white border border-[#eaeaec] hover:border-[#4d87a8] hover:text-[#4d87a8] text-[#7a8b95] px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-sm transition-colors h-9"
                >
                    <Plus size={14} /> IMPORT DEMAND
                </button>
                <span className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest border border-dashed ${
                  isAnalyzing ? 'bg-amber-50 text-amber-600 border-amber-300 animate-pulse' :
                  analysisComplete ? 'bg-emerald-50 text-emerald-600 border-emerald-300' :
                  'bg-slate-50 text-slate-500 border-slate-300'
                }`}>
                  {isAnalyzing ? 'ANALYZING HARVESTS...' : analysisComplete ? 'ANALYSIS COMPLETED' : 'AWAITING DISPATCH'}
                </span>
              </div>
            </div>

            {!isAnalyzing && !analysisComplete && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Card 1: Short Term Plan */}
                  <div 
                    onClick={() => {
                      setPlanningHorizon('weekly');
                      Swal.fire({
                        icon: 'info',
                        title: 'โมเดลวางแผนระยะสั้น',
                        text: 'สลับเกณฑ์คำนวณเข้าหาช่วง 7 วัน (Weekly Run) ปรับปรุงตามเวลาและวัตถุดิบจริง',
                        confirmButtonColor: THEME.primary,
                        timer: 1500,
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false
                      });
                    }}
                    className={`bg-white border rounded-2xl p-5 shadow-sm transition-all cursor-pointer group flex flex-col justify-between min-h-[140px] hover:shadow-md ${
                      planningHorizon === 'weekly' ? 'border-[#b7a159] bg-[#b7a159]/5' : 'border-[#eaeaec] hover:border-[#b7a159]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-[#212c46]/5 flex items-center justify-center border border-[#eaeaec] group-hover:scale-110 transition-transform">
                          <Calculator size={20} className="text-[#212c46]" />
                        </div>
                        {planningHorizon === 'weekly' && <Check size={16} className="text-[#b7a159] font-black" />}
                      </div>
                      <h4 className="font-extrabold text-[#212c46] text-[13px] uppercase tracking-wide">วางแผนระยะสั้น (Short-term Plan)</h4>
                      <p className="text-[11px] text-[#7a8b95] leading-relaxed mt-1 font-semibold">คำนวณกำลังการผลิตรายสัปดาห์ ปรับแผนตามจำนวนวัตถุดิบจริงและคำสั่งซื้อปัจจุบันในคลัง</p>
                    </div>
                  </div>

                  {/* Card 2: Forecast Projection */}
                  <div 
                    onClick={() => {
                      setPlanningHorizon('forecast');
                      Swal.fire({
                        icon: 'info',
                        title: 'โมเดลพยากรณ์ล่วงหน้า',
                        text: 'สลับเกณฑ์คำนวณเป็นคาดการณ์ยอดสั่งซื้อฤดูกาล (Forecast Range: 1-3 เดือน)',
                        confirmButtonColor: THEME.primary,
                        timer: 1500,
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false
                      });
                    }}
                    className={`bg-white border rounded-2xl p-5 shadow-sm transition-all cursor-pointer group flex flex-col justify-between min-h-[140px] hover:shadow-md ${
                      planningHorizon === 'forecast' ? 'border-[#a94228] bg-[#a94228]/5' : 'border-[#eaeaec] hover:border-[#a94228]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-[#212c46]/5 flex items-center justify-center border border-[#eaeaec] group-hover:scale-110 transition-transform">
                          <BarChart3 size={20} className="text-[#a94228]" />
                        </div>
                        {planningHorizon === 'forecast' && <Check size={16} className="text-[#a94228] font-black" />}
                      </div>
                      <h4 className="font-extrabold text-[#212c46] text-[13px] uppercase tracking-wide">คาดการณ์กำลังผลิตล่วงหน้า (Forecast Mode)</h4>
                      <p className="text-[11px] text-[#7a8b95] leading-relaxed mt-1 font-semibold">พยากรณ์อุปสงค์ระยะยาว 1-3 เดือนอิงสมมติประวัติ ยอดขาย และกระแสเทรนด์สากลของฤดูกาล</p>
                    </div>
                  </div>

                </div>

                {/* Target Configurations */}
                <div className="bg-[#f8f9fa] rounded-2xl p-6 border border-[#eaeaec]">
                  <h4 className="text-[11.5px] font-black text-[#212c46] mb-4 uppercase tracking-widest flex items-center gap-2 font-mono">
                    <Layers size={14} className="text-[#b7a159]" />
                    เกณฑ์ประเมินและเป้าหมายกำลังประมวล (Target Goals)
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-[#eaeaec] shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-50 rounded-lg text-[#a94228] border border-orange-100">
                          <Package size={16} />
                        </div>
                        <div>
                          <span className="text-[12px] font-black text-[#212c46] uppercase tracking-tight block">ควบคุมสต็อคป้องกันความปลอดภัย (Safety Buffer Control)</span>
                          <span className="text-[10px] text-slate-400 font-bold block mt-0.5">รักษาสนับสนุนสินค้าในสต็อค {safetyStockRatio}% ตลอดเวลา</span>
                        </div>
                      </div>
                      <span className="bg-[#657f4d] text-white px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-inner">ACTIVE OK</span>
                    </div>

                    <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-[#eaeaec] shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg text-[#3f809e] border border-blue-100">
                          <Clock size={16} />
                        </div>
                        <div>
                          <span className="text-[12px] font-black text-[#212c46] uppercase tracking-tight block">ลดรอบเปลี่ยนแบบสอดพิมพ์ (Minimize Changeovers)</span>
                          <span className="text-[10px] text-slate-400 font-bold block mt-0.5">จัดระเบียบลายผสมและล้างหัวฉีดให้ทับซ้อนกันเพื่อเพิ่มความคล่องตัวรวดเร็ว</span>
                        </div>
                      </div>
                      <span className="bg-[#657f4d] text-white px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-inner">ACTIVE OK</span>
                    </div>
                  </div>

                  {/* AI Prompt Instruction */}
                  <div className="mt-5 bg-white p-4 rounded-xl border border-[#eaeaec] shadow-sm">
                    <label className="text-[11px] font-black text-[#212c46] uppercase tracking-widest flex items-center gap-1.5 mb-2">
                       <Sparkles size={14} className="text-[#3f809e]" />
                       คำสั่งเพิ่มเติม (AI Prompt Instruction)
                    </label>
                    <textarea 
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="พิมพ์เพื่อออกคำสั่งให้ AI วางแผนพิเศษ เช่น 'เน้นไลน์แพ็คให้เสร็จก่อน 15:00', 'หลีกเลี่ยงการผลิตไส้กรอกไก่ติดกับหมู'..."
                        className="w-full h-20 p-3 bg-[#f8f9fa] border border-[#eaeaec] rounded-lg text-sm text-[#212c46] placeholder:text-slate-400 focus:outline-none focus:border-[#4d87a8] transition-colors resize-none font-sans"
                    />
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button 
                      onClick={handleStartAnalysis} 
                      className="bg-[#212c46] text-white px-7 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-md hover:bg-[#3f809e] transition-all flex items-center gap-2.5 border border-[#212c46]"
                    >
                      <Sparkles size={16} className="text-[#b7a159]" />
                      เริ่มประมวลผลสมองกลแผนการผลิต
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* IS ANALYZING LOADER STATE */}
            {isAnalyzing && (
              <div className="py-16 flex flex-col items-center justify-center space-y-6">
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-28 h-28 border-4 border-[#212c46]/20 rounded-full border-t-[#212c46] animate-spin"></div>
                  <Sparkles className="text-[#a94228] animate-pulse" size={32} />
                </div>
                <div className="text-center space-y-2">
                  <h4 className="text-sm font-black text-[#212c46] uppercase tracking-widest font-mono">AI ENGINE กำลังประมวลจัดตาราง...</h4>
                  <p className="text-[11px] text-[#7a8b95] font-extrabold uppercase tracking-wide">
                    {progress < 30 ? 'Reading current production orders demand...' : 
                     progress < 60 ? 'Evaluating machine configurations & maintenance queue...' : 
                     progress < 90 ? 'Checking current raw meat inventory levels...' : 
                     'Generating short-term optimized machine layouts...'}
                  </p>
                </div>
                <div className="w-full max-w-sm bg-slate-100 border border-slate-200 rounded-full h-3 overflow-hidden p-[1px]">
                  <div className="bg-gradient-to-r from-[#212c46] via-[#3f809e] to-[#b7a159] h-full rounded-full transition-all duration-150 ease-out" style={{ width: `${progress}%` }}></div>
                </div>
                <span className="text-[11px] font-mono font-black text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1 rounded-md shadow-sm opacity-90">{progress}% COMPLETE</span>
              </div>
            )}

            {/* ANALYSIS COMPLETE RECOMMENDATION */}
            {analysisComplete && (
              <div className="space-y-6 animate-fadeIn">
                
                {/* Result Highlights */}
                <div className="bg-[#657f4d]/5 border border-[#657f4d]/30 rounded-2xl p-5 shadow-inner">
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-[#657f4d]/10 flex items-center justify-center text-[#657f4d] border border-[#657f4d]/20 shadow-sm shrink-0">
                      <CheckCircle2 size={22} className="animate-bounce" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-[#657f4d] uppercase tracking-widest leading-none">AI Optimization Completed (เสร็จสมบูรณ์!)</h4>
                      <p className="text-[11.5px] text-slate-500 font-bold mt-1.5">ตรวจพบข้อเสนอแนะตัวเลือกตารางการผลิตที่ได้จุดคุ้มทุนสูงสุด 2 แผนสำหรับสัปดาห์นี้</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans text-center">
                    <div className="bg-white p-4 rounded-xl border border-[#eaeaec] shadow-sm">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1.5">Orders Fulfilled</p>
                      <p className="text-2xl font-mono font-black text-[#212c46]">98.5%</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-[#eaeaec] shadow-sm">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1.5">Machine Utilization</p>
                      <p className="text-2xl font-mono font-black text-[#657f4d]">87.2%</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-[#eaeaec] shadow-sm">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1.5">Est. Lead Time</p>
                      <p className="text-2xl font-mono font-black text-[#212c46]">2.4 <span className="text-xs font-black uppercase text-slate-400">Days</span></p>
                    </div>
                  </div>
                </div>

                {/* Suggested Schedules */}
                <div className="space-y-3 font-sans">
                  <h4 className="text-[11.5px] font-black text-[#212c46] px-1 uppercase tracking-widest font-mono">แผนการผลิตที่แนะนำโดยสมองกล (Suggested Schedules)</h4>
                  
                  {/* Option 1: Main alpha */}
                  <div className="bg-white p-5 rounded-2xl border-2 border-[#b7a159] shadow-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 bg-[#b7a159] text-white text-[9.5px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-xl shadow-sm font-mono flex items-center gap-1">
                      <Sparkles size={11} /> TOP OPTIMIZED MATCH
                    </div>
                    
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h5 className="font-extrabold text-[#212c46] text-[13.5px] uppercase tracking-tight flex items-center gap-1.5">
                          <span>Schedule Alpha</span>
                          <span className="text-slate-300">|</span> 
                          <span className="text-[#3f809e] text-[11px] font-black tracking-widest">Optimize for Delivery Time</span>
                        </h5>
                        <p className="text-[11.5px] text-slate-500 font-semibold leading-relaxed mt-1">จัดแผนตึงส่วนความล่าช้า ดึงให้สาย Mixing และ Packing รวบยอดออเดอร์ส่งออก 3 คำสั่งด่วนได้ทันกรอบเวลา</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          Swal.fire({
                            icon: 'success',
                            title: 'ยืนยันการรับแผนทั้งหมด!',
                            text: 'อัปเดตข้อมูลครอบคลุมกระดานหลักเรียบร้อยแล้ว',
                            confirmButtonColor: THEME.primary
                          });
                        }}
                        className="bg-[#212c46] hover:bg-[#3f809e] text-white text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-lg border border-[#212c46] transition-colors"
                      >
                        Accept All (รับแผนทั้งหมด)
                      </button>
                      <button 
                        onClick={() => {
                          Swal.fire({
                            title: 'เลือปรับแผนบางส่วน',
                            html: `<div class="text-left text-[11px] font-mono space-y-2 max-h-[150px] overflow-y-auto w-full">
                                    <label class="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 border rounded-lg cursor-pointer"><input type="checkbox" checked /> [Line 1] Order #1001-A Sausage</label>
                                    <label class="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 border rounded-lg cursor-pointer"><input type="checkbox" checked /> [Line 2] Order #1002-B Meatball</label>
                                    <label class="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 border rounded-lg cursor-pointer"><input type="checkbox" checked /> [Line 1] Order #1003-C Sausage</label>
                                   </div>`,
                            showCancelButton: true,
                            confirmButtonText: 'ยืนยัน (Confirm)',
                            cancelButtonText: 'ยกเลิก',
                            confirmButtonColor: THEME.primary
                          }).then((result) => {
                              if (result.isConfirmed) {
                                  Swal.fire('สำเร็จ', 'นำแผนบางส่วนเข้าสู่ระบบแล้ว', 'success')
                              }
                          })
                        }}
                        className="bg-white hover:bg-slate-50 text-[#3f809e] text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-lg border border-[#3f809e] transition-colors shadow-sm"
                      >
                        Partial Accept (รับบางส่วน)
                      </button>
                      <button 
                        onClick={() => {
                          Swal.fire({
                            title: 'Schedule Alpha Details',
                            html: `<div class="text-left text-xs space-y-2 font-mono">
                                    <p><strong>- Line 1 Vacuum Mixer:</strong> Grouping 4 Sausage runs into 1 block</p>
                                    <p><strong>- Line 2 Twist Linker:</strong> Reduced cleaning time delay by 30 mins</p>
                                    <p><strong>- Target Overtime:</strong> +4 hours total across week</p>
                                  </div>`,
                            icon: 'info',
                            confirmButtonColor: THEME.primary
                          });
                        }}
                        className="bg-[#f8f9fa] hover:bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-lg transition-colors ml-auto"
                      >
                        ดูรายละเอียดแผน
                      </button>
                    </div>
                  </div>

                  {/* Option 2: Alternate beta */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h5 className="font-extrabold text-[#212c46] text-[13px] uppercase tracking-tight flex items-center gap-1.5">
                          <span>Schedule Beta</span>
                          <span className="text-slate-300">|</span> 
                          <span className="text-[#a94228] text-[11px] font-black tracking-widest">Minimize Changeover Cost</span>
                        </h5>
                        <p className="text-[11.5px] text-slate-500 font-semibold leading-relaxed mt-1">เน้นแยกออเดอร์ตามกลุ่มสีและหัวบีบไส้กรอก ให้ความสำคัญด้านลดความถี่ล้างท่อ ลากยาวไลน์การผลิตต้นทุนต่ำสุด</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          Swal.fire({
                            icon: 'success',
                            title: 'ยืนยันการรับแผนทั้งหมด!',
                            text: 'อัปเดตข้อมูลขึ้นกระดานหลักเรียบร้อยแล้ว',
                            confirmButtonColor: THEME.primary
                          });
                        }}
                        className="bg-[#212c46] hover:bg-[#3f809e] text-white text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-lg border border-[#212c46] transition-colors"
                      >
                        Accept All (รับแผนทั้งหมด)
                      </button>
                      <button 
                        onClick={() => {
                          Swal.fire({
                            title: 'เลือปรับแผนบางส่วน',
                            html: `<div class="text-left text-[11px] font-mono space-y-2 max-h-[150px] overflow-y-auto w-full">
                                    <label class="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 border rounded-lg cursor-pointer"><input type="checkbox" checked /> [Line 1] Order #1004-D Sausage</label>
                                    <label class="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 border rounded-lg cursor-pointer"><input type="checkbox" checked /> [Line 2] Order #1005-E Meatball</label>
                                   </div>`,
                            showCancelButton: true,
                            confirmButtonText: 'ยืนยัน (Confirm)',
                            cancelButtonText: 'ยกเลิก',
                            confirmButtonColor: THEME.primary
                          }).then((result) => {
                              if (result.isConfirmed) {
                                  Swal.fire('สำเร็จ', 'นำแผนบางส่วนเข้าสู่ระบบแล้ว', 'success')
                              }
                          })
                        }}
                        className="bg-white hover:bg-slate-50 text-[#3f809e] text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-lg border border-[#3f809e] transition-colors shadow-sm"
                      >
                        Partial Accept (รับบางส่วน)
                      </button>
                    </div>
                  </div>

                </div>

                <div className="mt-4 flex justify-between items-center border-t border-slate-100 pt-4 font-sans">
                  <button 
                    onClick={() => setAnalysisComplete(false)} 
                    className="text-[#a94228] hover:text-[#212c46] text-xs font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw size={14} /> ตั้งเป้าหมายคำนวณใหม่ (Re-calculate)
                  </button>
                  <p className="text-[9.5px] text-slate-400 font-black uppercase tracking-widest">Calculated by AI Engine {engineVersion}</p>
                </div>

              </div>
            )}

          </div>

          {/* RIGHT PANELS - Status, Alerts, Drafts */}
          <div className="space-y-6 h-full flex flex-col">
            
            {/* BOTTLENECKS LIMITS */}
            <div className="bg-white rounded-3xl p-6 border border-[#eaeaec] shadow-lg flex-1 min-h-[300px]">
              
              <div className="flex items-center gap-3 border-b border-[#eaeaec] pb-4 mb-4">
                <AlertTriangle size={18} className="text-[#a94228] animate-pulse" />
                <div>
                  <h3 className="text-sm font-black text-[#212c46] uppercase tracking-widest">ข้อจำกัดที่พบ (Bottlenecks)</h3>
                  <p className="text-[9.5px] text-[#7a8b95] font-black uppercase tracking-wider mt-0.5">Critical production constraints detected</p>
                </div>
              </div>

              <div className="space-y-4 font-sans">
                
                {/* Constraint 1: Lower machine capacity */}
                <div className="bg-red-50/50 border border-red-100 border-l-4 border-l-[#932c2e] p-4 rounded-xl shadow-sm">
                  <div className="flex gap-2 items-center mb-1.5">
                    <Cog size={14} className="text-[#932c2e] animate-spin-slow" />
                    <p className="text-[11.5px] font-black text-[#932c2e] uppercase tracking-widest">กำลังเครื่องจักรต่ำกว่าเกณฑ์</p>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                    เครื่องแจ้งซ่อม **Twist Linker A** เจอปัญหากระบอกสูบ ส่งผลกระทบต่อ Capacity โรงงานโดยรวมลดลง 12% ในสัปดาห์นี้
                  </p>
                </div>

                {/* Constraint 2: Inventory warning */}
                <div className="bg-amber-50/50 border border-amber-100 border-l-4 border-l-[#b58c4f] p-4 rounded-xl shadow-sm">
                  <div className="flex gap-2 items-center mb-1.5">
                    <Package size={14} className="text-[#b58c4f]" />
                    <p className="text-[11.5px] font-black text-[#b58c4f] uppercase tracking-widest">วัตถุดิบใกล้หมดอายุ (Inventory)</p>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                    เนื้อหมูล็อตบดละเอียด **TR-409** ในคลังมีความชื้นสูง จำเป็นต้องนำมาจับคู่แผนการผลิตเพื่อระบายทิ้งภายใน 48 ชั่วโมง
                  </p>
                </div>

                {/* Constraint 3 (Only show when complete): Overwhelmed Demand details */}
                {analysisComplete && (
                  <div className="bg-blue-50/50 border border-blue-100 border-l-4 border-l-[#3f809e] p-4 rounded-xl shadow-sm animate-fadeIn">
                    <div className="flex gap-2 items-center mb-1.5">
                      <TrendingUp size={14} className="text-[#3f809e]" />
                      <p className="text-[11.5px] font-black text-[#3f809e] uppercase tracking-widest">Overwhelmed Orders Demand</p>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                      คำสั่งส่งออกลูกค้า **PO-9912** สัดส่วนสูง อาจมีความล่าช้าเกินเกณฑ์ 0.5 วัน หากไม่เพิ่มกะลากโอเวอร์ไทม์ทีมแพ็ค (Packing)
                    </p>
                  </div>
                )}

              </div>

            </div>

            {/* DRAFT PLANS */}
            <div className="bg-[#212c46] rounded-3xl border border-transparent p-6 text-[#d7d7d7] shadow-lg shrink-0">
              <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-4">
                <FileCheck size={20} className="text-[#b7a159]" />
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Draft Schedule Plans</h3>
                  <p className="text-[9.5px] text-[#7a8b95] font-black uppercase tracking-wider mt-0.5">Unapproved temporary outlines queue</p>
                </div>
              </div>
              <p className="text-[11px] text-[#7a8b95] font-semibold leading-relaxed mb-4">
                มีผลลัพธ์โครงร่างตารางแผนการผลิตที่ AI เคยสร้างแบบร่างไว้ค้างอนุมัติอยู่ 1 โครงงาน:
              </p>

              <button 
                onClick={() => {
                  Swal.fire({
                    title: 'Draft Plan #4092 Info',
                    html: `<div class="text-left text-xs font-mono space-y-1.5 dark:text-slate-800">
                            <p><strong>- Version ID:</strong> PL-4092-A</p>
                            <p><strong>- Creation Date:</strong> 29/05/2026</p>
                            <p><strong>- Core Model Range:</strong> 20 May - 26 May</p>
                            <p><strong>- Primary Objective:</strong> Speed Delivery</p>
                           </div>`,
                    icon: 'info',
                    confirmButtonColor: THEME.primary
                  });
                }}
                className="w-full text-left bg-white/5 hover:bg-white/10 p-4 border border-white/10 rounded-2xl transition-all flex items-center justify-between group"
              >
                <div>
                  <p className="text-xs font-black text-white mb-0.5 font-mono">Plan #4092</p>
                  <p className="text-[10px] text-[#b7a159] uppercase tracking-widest font-black">20 May - 26 May Range</p>
                </div>
                <ChevronRight size={18} className="text-[#7a8b95] group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* DRAGGABLE CONFIG MODAL (Exact Standard of UserPermissions Settings wizard!) */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#212c46]/60 backdrop-blur-sm p-4 animate-fadeIn font-sans">
          <DraggableModal
            isOpen={isConfigOpen}
            onClose={() => setIsConfigOpen(false)}
            width="max-w-[850px]"
            customHeader={
              <div className="bg-[#212c46] px-6 py-4 flex justify-between items-center shrink-0 border-b-2 border-[#b7a159] modal-handle cursor-move w-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/20 shadow-sm shrink-0">
                    <Settings size={20} className="text-[#b7a159]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#d7d7d7] uppercase tracking-widest leading-none">Configure AI Planner Parameters</h3>
                    <p className="text-[10px] font-bold text-[#b7a159] uppercase tracking-widest mt-1.5">Set goals, algorithms, & limit parameters</p>
                  </div>
                </div>
                <button onClick={() => setIsConfigOpen(false)} className="text-white/50 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-1.5 rounded-lg">
                  <X size={18} />
                </button>
              </div>
            }
          >
            <div className="flex flex-col md:flex-row overflow-hidden bg-[#f8f9fa] h-[460px]">
              
              {/* Sidebar Configuration Step Selector */}
              <div className="w-full md:w-56 bg-white border-b md:border-b-0 md:border-r border-[#eaeaec] flex flex-row md:flex-col shrink-0 text-left">
                <div className="hidden md:block px-5 py-4 text-[10px] font-black text-[#7a8b95] uppercase tracking-widest border-b border-[#eaeaec] bg-[#f8f9fa]">
                  Planning Settings
                </div>
                
                {[0, 1, 2].map(step => (
                  <button
                    key={step}
                    onClick={() => setConfigStep(step)}
                    className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 px-5 py-3.5 text-left transition-all md:border-l-4 ${
                      configStep === step 
                        ? 'border-b-4 md:border-b-0 border-[#b7a159] bg-[#f8f9fa] text-[#212c46]' 
                        : 'border-transparent text-[#7a8b95] hover:bg-[#f8f9fa]/50'
                    }`}
                  >
                    <LucideIcon
                      name={step === 0 ? 'calendar-clock' : step === 1 ? 'trophy' : 'cog'}
                      size={15}
                      color={configStep === step ? THEME.brightGold : undefined}
                    />
                    <span className="text-[10.5px] font-black uppercase tracking-widest font-mono">
                      STEP {step + 1}: {step === 0 ? 'Horizon' : step === 1 ? 'Priorities' : 'Engine Tuner'}
                    </span>
                  </button>
                ))}
              </div>

              {/* Step Content Body Panel */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 bg-white select-none">
                
                {configStep === 0 && (
                  <div className="space-y-5 animate-fadeIn">
                    <h4 className="text-[12px] font-black text-[#212c46] uppercase border-b-2 border-slate-100 pb-2.5 tracking-wider">Step 1: Planning Horizon & Safety Stocks</h4>
                    
                    <div>
                      <label className="block text-[10px] font-black text-[#7a8b95] uppercase tracking-widest mb-1.5">Horizon Interval (กรอบเวลาคำนวณ)</label>
                      <select
                        value={tempConfig.planningHorizon}
                        onChange={e => setTempConfig({ ...tempConfig, planningHorizon: e.target.value })}
                        className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-3 text-[12px] font-bold text-[#212c46] outline-none focus:border-[#b7a159]"
                      >
                        <option value="weekly">Weekly scheduling (7 Days operational run)</option>
                        <option value="forecast">Seasonal forecasting (3 Months ERP projection)</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[10px] font-black text-[#7a8b95] uppercase tracking-widest">Safety Stock Target Ratio (เกณฑ์สต็อคปลอดภัย)</label>
                        <span className="text-xs font-mono font-black text-[#a94228] bg-orange-50 border border-orange-100 px-2 py-0.5 rounded">{tempConfig.safetyStockRatio}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="50"
                        value={tempConfig.safetyStockRatio}
                        onChange={e => setTempConfig({ ...tempConfig, safetyStockRatio: Number(e.target.value) })}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#212c46]"
                      />
                      <span className="text-[10px] text-slate-400 font-bold block mt-1">ค่ายิ่งสูงยิ่งช่วยเตรียมอะไหล่สำรองมาก แต่จะทำให้ต้นทุนจมคงเหลืองบประมาณ</span>
                    </div>
                  </div>
                )}

                {configStep === 1 && (
                  <div className="space-y-5 animate-fadeIn">
                    <h4 className="text-[12px] font-black text-[#212c46] uppercase border-b-2 border-slate-100 pb-2.5 tracking-wider">Step 2: Optimization Objectives & Rules</h4>
                    
                    <div>
                      <label className="block text-[10px] font-black text-[#7a8b95] uppercase tracking-widest mb-1.5">Delivery Order Priority Weight</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['low', 'medium', 'high'].map(prio => (
                          <button
                            key={prio}
                            type="button"
                            onClick={() => setTempConfig({ ...tempConfig, deliveryPriority: prio })}
                            className={`py-2 px-4 rounded-xl text-[10.5px] font-black uppercase tracking-widest border transition-all ${
                              tempConfig.deliveryPriority === prio
                                ? 'bg-[#212c46] text-white border-[#212c46] shadow-md'
                                : 'bg-slate-50 text-slate-500 border-[#eaeaec] hover:bg-slate-100'
                            }`}
                          >
                            {prio}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 pt-3">
                      
                      <label className="relative flex items-start gap-3 cursor-pointer group bg-slate-50/50 p-3 rounded-xl border border-slate-100 hover:border-slate-200">
                        <input
                          type="checkbox"
                          checked={tempConfig.optimizeChangeover}
                          onChange={e => setTempConfig({ ...tempConfig, optimizeChangeover: e.target.checked })}
                          className="mt-1 w-4 h-4 text-[#212c46] bg-gray-100 border-gray-300 rounded focus:ring-[#212c46]"
                        />
                        <div>
                          <strong className="text-[11.5px] font-extrabold text-[#212c46] uppercase tracking-wide block">Optimize Product Changeovers</strong>
                          <span className="text-[10px] text-slate-400 font-bold block mt-0.5">จัดระเบียบตามกลุ่มสีและเครื่องบดสับเพื่อรักษาระเบียบเวลาทำความสะอาดหัวบีบ</span>
                        </div>
                      </label>

                      <label className="relative flex items-start gap-3 cursor-pointer group bg-slate-50/50 p-3 rounded-xl border border-slate-100 hover:border-slate-200">
                        <input
                          type="checkbox"
                          checked={tempConfig.limitOvertime}
                          onChange={e => setTempConfig({ ...tempConfig, limitOvertime: e.target.checked })}
                          className="mt-1 w-4 h-4 text-[#212c46] bg-gray-100 border-gray-300 rounded focus:ring-[#212c46]"
                        />
                        <div>
                          <strong className="text-[11.5px] font-extrabold text-[#212c46] uppercase tracking-wide block">Limit Staff Overtime (บีบอัดโอเวอร์ไทม์)</strong>
                          <span className="text-[10px] text-slate-400 font-bold block mt-0.5">จำกัดชั่วโมงทำงานล่วงเวลาของพนักงานจัดแพ็คให้อยู่ภายในกรอบกฎหมาย</span>
                        </div>
                      </label>

                    </div>
                  </div>
                )}

                {configStep === 2 && (
                  <div className="space-y-5 animate-fadeIn">
                    <h4 className="text-[12px] font-black text-[#212c46] uppercase border-b-2 border-slate-100 pb-2.5 tracking-wider">Step 3: Algorithm Tuning & Tuners</h4>
                    
                    <div>
                      <label className="block text-[10px] font-black text-[#7a8b95] uppercase tracking-widest mb-1.5">AI Engine Version Selection</label>
                      <select
                        value={tempConfig.engineVersion}
                        onChange={e => setTempConfig({ ...tempConfig, engineVersion: e.target.value })}
                        className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-3 text-[12px] font-bold text-[#212c46] outline-none focus:border-[#b7a159]"
                      >
                        <option value="v1.2">AI Multi-Constrained Core V1.2.0 (Deep heuristics)</option>
                        <option value="v1.1">Standard Linear Optimizer Version 1.1.0 (Basic matrices)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-[#7a8b95] uppercase tracking-widest mb-1.5">Maximum Iteration Threshold (จำกัดคำนวณซ้ำ)</label>
                      <input
                        type="number"
                        min="500"
                        max="10000"
                        step="500"
                        value={tempConfig.maxIterations}
                        onChange={e => setTempConfig({ ...tempConfig, maxIterations: Number(e.target.value) })}
                        className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-xl px-4 py-3 text-[12px] font-bold text-[#212c46] outline-none focus:border-[#b7a159]"
                      />
                      <span className="text-[10px] text-slate-400 font-bold block mt-1.5">การเพิ่มค่าจะช่วยให้แผนเหมาะสมขึ้นแต่จะประมวลผลเพิ่มขึ้นทีละเสี้ยววินาที</span>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="p-5 bg-white border-t border-slate-200 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsConfigOpen(false)}
                className="px-6 py-2.5 text-slate-500 hover:text-[#212c46] font-bold text-[10px] uppercase tracking-widest transition-colors shadow-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveConfig}
                className="bg-[#212c46] text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest tracking-[0.05em] hover:bg-[#3f809e] transition-all flex items-center gap-1.5"
              >
                Save Calculations
              </button>
            </div>
          </DraggableModal>
        </div>
      )}

      {/* CSV UPLOAD MODAL */}
      {isUploadModalOpen && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#212c46]/60 backdrop-blur-sm p-4 animate-fadeIn font-sans">
              <DraggableModal 
                isOpen={isUploadModalOpen} 
                onClose={() => setIsUploadModalOpen(false)} 
                width="max-w-[700px]"
                customHeader={
                   <div className="bg-[#212c46] px-6 py-4 flex justify-between items-center shrink-0 border-b-2 border-[#3f809e] modal-handle cursor-move w-full">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/20 shadow-sm shrink-0">
                         <Plus size={20} className="text-[#3f809e]" />
                       </div>
                       <div>
                         <h3 className="text-sm font-black text-[#d7d7d7] uppercase tracking-widest leading-none">Import Demand Data</h3>
                         <p className="text-[10px] font-bold text-[#3f809e] uppercase tracking-widest mt-1.5">Upload CSV to set constraints</p>
                       </div>
                     </div>
                     <button onClick={() => setIsUploadModalOpen(false)} className="text-white/50 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-1.5 rounded-lg">
                       <X size={18} />
                     </button>
                   </div>
                }
               >
                  <div className="p-8 bg-[#f8f9fa] max-h-[500px] overflow-auto select-none">
                     <div className="bg-white p-6 rounded-2xl border border-[#eaeaec] shadow-sm">
                        <CsvUpload 
                            requiredHeaders={['order_no', 'product', 'quantity', 'deadline']}
                            onUpload={(data) => {
                                Swal.fire('สำเร็จ', `อัปโหลดจำนวน ${data.length} รายการแล้ว`, 'success');
                                setIsUploadModalOpen(false);
                            }}
                        />
                     </div>
                  </div>
              </DraggableModal>
          </div>
      )}

    </div>
  );
}

// --- Dynamic Icon Helper ---
const kebabToPascal = (str: string) => str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
const LucideIcon = ({ name, size = 16, className = "", color, style, strokeWidth = 2.5 }: any) => {
  if (!name) return null;
  const pascalName = kebabToPascal(name);
  const IconComponent = (Icons as any)[pascalName] || (Icons as any)[`${pascalName}Icon`] || Icons.CircleHelp;
  if (!IconComponent) return null;
  return <IconComponent size={size} className={className} style={{ ...style, color: color }} strokeWidth={strokeWidth} />;
};
import * as Icons from 'lucide-react';
