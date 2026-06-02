import React, { useState, useEffect, useMemo } from 'react';
import * as Icons from 'lucide-react';
import { DraggableModal } from '../../components/shared/DraggableModal';
import KpiCard from '../../components/shared/KpiCard';
import { UserGuidePanel } from '../../components/shared/UserGuidePanel';
import UserGuideButton from '../../components/shared/UserGuideButton';
import Swal from 'sweetalert2';
import { useSharedOrders } from '@/src/store/ordersStore';

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

// --- Master Data (100% Matching Original) ---
const FG_DATABASE = [
    { sku: 'FG-1001', name: 'ไส้กรอกไก่จัมโบ้ ARO 1kg', weight: 1.0, sfg: 'SFG-SMC-001' },
    { sku: 'FG-1002', name: 'ไส้กรอกไก่จัมโบ้ CP 500g', weight: 0.5, sfg: 'SFG-SMC-001' },
    { sku: 'FG-2001', name: 'ไส้กรอกคอกเทล ARO 1kg', weight: 1.0, sfg: 'SFG-002' },
    { sku: 'FG-3001', name: 'ลูกชิ้นหมู ARO 1kg', weight: 1.0, sfg: 'SFG-MTB-002' },
    { sku: 'FG-4001', name: 'โบโลน่าพริก CP 1kg (Sliced)', weight: 1.0, sfg: 'SFG-BOL-004' },
    { sku: 'FG-5001', name: 'ไส้กรอกชีสลาวา 500g', weight: 0.5, sfg: 'SFG-CHE-009' },
    { sku: 'FG-8001', name: 'แซนวิชไก่แฮม 500g', weight: 0.5, sfg: 'SFG-SND-020' },
    { sku: 'FG-8003', name: 'ไส้กรอกระเบิดซอส 120g', weight: 0.12, sfg: 'SFG-SPY-040' }
];

const PACKING_MACHINES = [
    { id: 'M-THERMO-01', name: 'Thermoformer Line 1', capacityKgHr: 800, type: 'Thermoformer' },
    { id: 'M-THERMO-02', name: 'Thermoformer Line 2', capacityKgHr: 600, type: 'Thermoformer' },
    { id: 'M-FLOW-01', name: 'Flow Pack Line A', capacityKgHr: 400, type: 'Flow Pack' },
    { id: 'M-VAC-01', name: 'Vacuum Chamber B', capacityKgHr: 300, type: 'Vacuum Chamber' }
];

const INITIAL_PACKING_PLANS = [
    { id: 'PK-2603-001', sku: 'FG-8001', fgName: 'แซนวิชไก่แฮม 500g', targetPacks: 200, packedPacks: 50, wipPacks: 0, status: 'In Progress' },
    { id: 'PK-2603-002', sku: 'FG-8003', fgName: 'ไส้กรอกระเบิดซอส 120g', targetPacks: 500, packedPacks: 0, wipPacks: 0, status: 'Pending' },
    { id: 'PK-2603-003', sku: 'FG-5001', fgName: 'ไส้กรอกชีสลาวา 500g', targetPacks: 50, packedPacks: 50, wipPacks: 0, status: 'Completed' },
    { id: 'PK-2603-004', sku: 'FG-1001', fgName: 'ไส้กรอกไก่จัมโบ้ ARO 1kg', targetPacks: 450, packedPacks: 0, wipPacks: 0, status: 'Pending' },
];

const INITIAL_SFG_STOCK: Record<string, number> = {
    'SFG-SND-020': 150,
    'SFG-SPY-040': 100,
    'SFG-CHE-009': 0,
    'SFG-SMC-001': 500 
};

// --- Helper Components ---
const kebabToPascal = (str: string) => str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
const LucideIcon = ({ name, size = 16, className = "", color, style }: any) => {
    if (!name) return null;
    const pascalName = kebabToPascal(name);
    const IconComponent = (Icons as any)[pascalName] || (Icons as any)[`${pascalName}Icon`] || Icons.CircleHelp;
    if (!IconComponent) return null;
    return <IconComponent size={size} className={className} style={{...style, color: color}} strokeWidth={2.2} />;
};

// --- MAIN APPLICATION ---
export default function PackingBoard() {
    const [orders, setOrders, updateOrder] = useSharedOrders();
    const [activeTab, setActiveTab] = useState('execution');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    
    // Map orders to packing plans
    const dynamicPlans = orders.filter((o: any) => o.currentStep === 'Packing' || o.qty > 0).map((o: any) => ({
        id: `PK-${o.id}`,
        sku: o.sku,
        fgName: o.name,
        targetPacks: o.qty,
        packedPacks: 0,
        wipPacks: 0,
        status: o.status === 'COMPLETED' ? 'Completed' : 'Pending'
    }));

    const [plans, setPlans] = useState(dynamicPlans.length > 0 ? dynamicPlans : INITIAL_PACKING_PLANS);
    const [sfgStock, setSfgStock] = useState<Record<string, number>>(INITIAL_SFG_STOCK);
    const [showGuide, setShowGuide] = useState(false);
    const [isPlannerOpen, setIsPlannerOpen] = useState(false);
    
    // Execution State
    const [selectedPlanId, setSelectedPlanId] = useState(plans[0].id);
    const [selectedMachineId, setSelectedMachineId] = useState(PACKING_MACHINES[0].id);
    const [releaseInput, setReleaseInput] = useState(100);
    const [activeLots, setActiveLots] = useState<any[]>([]);
    const [simSpeed, setSimSpeed] = useState(1);
    const [batchSeq, setBatchSeq] = useState(1);
    const [showCompleted, setShowCompleted] = useState(false);
    const [qrPrint, setQrPrint] = useState<any>(null);

    // Derived State
    const currentPlan = useMemo(() => plans.find(p => p.id === selectedPlanId), [plans, selectedPlanId]);
    const fgObj = useMemo(() => FG_DATABASE.find(fg => fg.sku === currentPlan?.sku), [currentPlan]);
    const selectedMachine = useMemo(() => PACKING_MACHINES.find(m => m.id === selectedMachineId), [selectedMachineId]);
    
    const planRemaining = currentPlan ? Math.max(0, currentPlan.targetPacks - (currentPlan.packedPacks + currentPlan.wipPacks)) : 0;
    const availSfgQty = fgObj ? (sfgStock[fgObj.sfg] || 0) : 0;
    const maxByStock = fgObj ? Math.floor(availSfgQty / fgObj.weight) : 0;
    const maxRelease = Math.min(planRemaining, maxByStock);

    const estTime = useMemo(() => {
        if (!selectedMachine || releaseInput <= 0 || !fgObj) return 0;
        return ((releaseInput * fgObj.weight) / selectedMachine.capacityKgHr) * 60;
    }, [releaseInput, selectedMachine, fgObj]);

    // Update form state on selection change to prevent invalid state
    useEffect(() => {
        if (currentPlan) {
            setReleaseInput(Math.min(100, maxRelease));
        }
    }, [selectedPlanId, sfgStock]);

    // Simulation Loop
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveLots(prev => {
                const next = prev.map(lot => {
                    if (lot.timeLeft > 0) {
                        const newTime = Math.max(0, lot.timeLeft - (1 * simSpeed));
                        if (newTime === 0) {
                            // Finish logic
                            setPlans(currPlans => currPlans.map(p => {
                                if (p.id === lot.jobId) {
                                    const isDone = (p.packedPacks + lot.qty) >= p.targetPacks;
                                    return { 
                                        ...p, 
                                        packedPacks: p.packedPacks + lot.qty, 
                                        wipPacks: Math.max(0, p.wipPacks - lot.qty),
                                        status: isDone ? 'Completed' : 'In Progress'
                                    };
                                }
                                return p;
                            }));
                            return { ...lot, timeLeft: 0, status: 'Completed' };
                        }
                        return { ...lot, timeLeft: newTime };
                    }
                    return lot;
                });
                return next;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [simSpeed]);

    const handleStartPacking = () => {
        if (releaseInput <= 0 || releaseInput > maxRelease) {
            Swal.fire({ 
              icon: 'warning', 
              title: 'พารามิเตอร์ไม่ถูกต้อง', 
              text: 'ปริมาณต่ำกว่าเกณฑ์ หรือสต๊อกดิบสินค้ากึ่งสำเร็จรูป (SFG) ไม่พอดำเนินการ',
              confirmButtonColor: THEME.primary
            });
            return;
        }

        const lotId = `LOT-${String(batchSeq).padStart(3, '0')}`;
        const newLot = {
            id: lotId,
            jobId: selectedPlanId,
            sku: fgObj?.sku,
            name: fgObj?.name,
            qty: releaseInput,
            machineName: selectedMachine?.name,
            totalTime: Math.ceil(estTime),
            timeLeft: Math.ceil(estTime)
        };

        // Deduct Stock
        if(fgObj) {
            setSfgStock(prev => ({ ...prev, [fgObj.sfg]: prev[fgObj.sfg] - (releaseInput * fgObj.weight) }));
        }
        
        // Update Plan WIP
        setPlans(curr => curr.map(p => p.id === selectedPlanId ? { ...p, wipPacks: p.wipPacks + releaseInput, status: 'In Progress' } : p));
        
        setActiveLots(prev => [...prev, newLot]);
        setBatchSeq(s => s + 1);
        
        Swal.fire({ 
          icon: 'success', 
          title: 'ล๊อตจัดผลิตถูกสร้างสำเร็จ', 
          timer: 1200, 
          showConfirmButton: false, 
          position: 'top-end', 
          toast: true 
        });
    };

    return (
        <div className="flex flex-1 w-full flex-col animate-fadeIn bg-transparent space-y-4 relative font-sans">
            <UserGuideButton onClick={() => setShowGuide(true)} />
            
            {qrPrint && (
                <div className="fixed inset-0 bg-[#1d2636]/60 backdrop-blur-sm z-[6000] flex items-center justify-center p-4 animate-fadeIn" onClick={() => setQrPrint(null)}>
                    <div className="bg-white shadow-2xl relative flex flex-col items-center justify-center border-4 border-dashed border-gray-300" style={{ width: '384px', height: '384px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="absolute top-2 left-2 right-2 text-center text-xs font-bold text-gray-400">4" x 4" LABEL SIMULATION</div>
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${qrPrint.id}`} alt="QR" className="w-[70%] h-[70%] object-contain" />
                        <span className="mt-4 font-mono font-black text-2xl tracking-widest text-black">{qrPrint.id}</span>
                        <div className="absolute bottom-4 right-4 flex gap-2 no-print">
                            <button onClick={() => setQrPrint(null)} className="px-4 py-2 bg-gray-200 text-gray-700 text-[10px] font-black rounded uppercase tracking-widest hover:bg-gray-300 transition-colors">Close</button>
                            <button onClick={() => { alert('Sending to Print Queue...'); setQrPrint(null); }} className="px-4 py-2 bg-black text-white text-[10px] font-black rounded uppercase tracking-widest hover:bg-gray-800 transition-colors flex items-center gap-2"><Icons.Printer size={12}/> Print Tag</button>
                        </div>
                    </div>
                </div>
            )}

            <UserGuidePanel isOpen={showGuide} onClose={() => setShowGuide(false)} title="PACKING MANUAL" subtitle="คู่มือควบคุมแผงงานบรรจุสำเร็จรูป (Finished Goods Manual)">
                <div className="space-y-6">
                  <section className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="text-[13px] font-black text-[#212c46] mb-2.5 uppercase flex items-center gap-2 border-b border-[#b7a159]/30 pb-2 font-mono">
                      <Icons.Info size={16} className="text-[#a94228]"/>
                      1. บทนำและวัตถุประสงค์ระบบบรรจุสำเร็จรูป
                    </h4>
                    <p className="leading-relaxed text-[11.5px] text-[#414757] font-bold">
                      ระบบ **Packing Board** ออกแบบมาเพื่อให้ผู้ควบคุมงานบริหารจัดการ แผนส่งจัดบรรจุขั้นสุดท้าย (Finished Goods Packing Phase) โดยการดึงสต๊อกจากห้องเย็นบรรจุสินค้ากึ่งสำเร็จรูป (**SFG - Semi-Finished Goods**) ตัดผ่านชุดเครื่องจักรสู่สินค้าพร้อมขาย (**FG - Finished Goods**) ครอบคลุมปริมาตร ล๊อตผลิต และวงจรชีวิตค้ำประกันความเสถียร
                    </p>
                  </section>

                  <section className="space-y-3">
                    <h4 className="text-[13px] font-black text-[#212c46] mb-2.5 uppercase flex items-center gap-2 border-b border-[#b7a159]/30 pb-2 font-mono">
                      <Icons.Cpu size={16} className="text-[#a94228]"/>
                      2. อัตราความสามารถเครื่องจักร (Packing Machines capability)
                    </h4>
                    <p className="text-[11px] text-slate-500 font-bold">ระบบจดทะเบียนเครื่องจักรประมวลผล 4 รายการประกอบด้วย:</p>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="p-2.5 bg-white border border-[#eaeaec] rounded-xl flex justify-between items-center text-[11px]">
                        <div>
                          <strong className="text-[#212c46]">Thermoformer Lines (Line 1/2)</strong>
                          <p className="text-slate-400 font-medium">ชุดแพ็คขึ้นรูปแบบถาดหนาความร้อน</p>
                        </div>
                        <span className="font-mono font-black text-[#a94228] bg-[#a94228]/5 px-2.5 py-1 rounded-md border border-[#a94228]/20">600 - 800 kg/hr</span>
                      </div>
                      <div className="p-2.5 bg-white border border-[#eaeaec] rounded-xl flex justify-between items-center text-[11px]">
                        <div>
                          <strong className="text-[#212c46]">Flow Pack (Line A)</strong>
                          <p className="text-slate-400 font-medium font-bold">ชุดซีลห่อพันซองเรียบต่อเนื่อง</p>
                        </div>
                        <span className="font-mono font-black text-[#3f809e] bg-[#3f809e]/5 px-2.5 py-1 rounded-md border border-[#3f809e]/20">400 kg/hr</span>
                      </div>
                      <div className="p-2.5 bg-white border border-[#eaeaec] rounded-xl flex justify-between items-center text-[11px]">
                        <div>
                          <strong className="text-[#212c46]">Vacuum Chamber (B)</strong>
                          <p className="text-slate-400 font-medium">ชุดแพ็คดูดปิดสุญญากาศยืดอายุอาหาร</p>
                        </div>
                        <span className="font-mono font-black text-[#657f4d] bg-[#657f4d]/5 px-2.5 py-1 rounded-md border border-[#657f4d]/20">300 kg/hr</span>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h4 className="text-[13px] font-black text-[#212c46] mb-2.5 uppercase flex items-center gap-2 border-b border-[#b7a159]/30 pb-2 font-mono">
                      <Icons.Layers size={16} className="text-[#a94228]"/>
                      3. สถานะควบคุมการผลิต (Job Status lifecycles)
                    </h4>
                    <div className="space-y-2 text-[11px]">
                      <div className="flex gap-2.5 items-start p-2.5 bg-[#f3f3f1] border border-slate-200 rounded-lg">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#7a8b95] shrink-0 mt-0.5 animate-pulse" />
                        <div>
                          <strong className="text-slate-700">Pending:</strong> งานรอสายการบรรจุ ค้างจัดการเนื่องจากรอส่งจ่าย SFG กึ่งสำเร็จรูปจากแผนกก่อนหน้า
                        </div>
                      </div>
                      <div className="flex gap-2.5 items-start p-2.5 bg-[#3f809e]/10 border border-[#3f809e]/30 rounded-lg">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#3f809e] shrink-0 mt-0.5 animate-pulse" />
                        <div>
                          <strong className="text-sky-700">In Progress:</strong> ดำเนินการขึ้นรูปบรรจุ ตอกบาร์โค้ด และคำนวณหักลบสต๊อกเปรียบเป็นเวลาจริง
                        </div>
                      </div>
                      <div className="flex gap-2.5 items-start p-2.5 bg-[#657f4d]/10 border border-[#657f4d]/30 rounded-lg">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#657f4d] shrink-0 mt-0.5 animate-pulse" />
                        <div>
                          <strong className="text-emerald-700">Completed:</strong> กระบวนการบรรจุสิ้นสุด ดำเนินการตรวจรับและปิด Lot ผลิต 100% เรียบร้อย
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <h4 className="text-[13px] font-black text-[#212c46] mb-1.5 uppercase flex items-center gap-2 border-b border-[#b7a159]/30 pb-1.5 font-mono">
                      <Icons.Play size={16} className="text-[#a94228]"/>
                      4. ขั้นตอนและคำแนะการประมวลผลงาน (Operations Guides)
                    </h4>
                    <ul className="list-decimal pl-5 space-y-1.5 text-[11px] text-[#414757]">
                      <li>เลือกแผนงานหลักที่ต้องการผลิต โดยระบบจะเปรียบเทียบรหัสสินค้าและสต๊อกของ SFG ของผู้ผลิต</li>
                      <li>ใช้ตัวเลือก **Sim Speed** เร่งอัตราเวลาจัดทำงานจำลอง (1 เท่า, 10 เท่า หรือ 60 เท่า) เพื่อสังเกตจุดการชนกันของกำลังผลิต</li>
                      <li>กรณีล๊อตค้างอยู่หรือต้องการทดสอบรอบด่วน สามารถใช้คำสั่ง **Force Finish** เพื่อทดสอบจำลองงานบรรจุล๊อตรอบนั้นได้ทันที</li>
                    </ul>
                  </section>

                  <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    MES บอร์ดบรรจุและการตัดบัญชีล๊อควัตถุจำลองระบบ • VER 3.5.0
                  </div>
                </div>
            </UserGuidePanel>

            {/* HEADER SECTION - Unified MES Navy Header */}
            <div className="h-14 px-8 flex flex-row items-center justify-between gap-4 z-20 shrink-0">
                <div className="flex items-center gap-5">
                    <div className="relative flex items-center justify-center group cursor-default shrink-0">
                        <div className="absolute inset-0 bg-[#3f809e] blur-[15px] opacity-20 rounded-full group-hover:opacity-60 transition-all duration-700"></div>
                        <div className="relative z-10 p-1.5 border border-[#3f809e]/40 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm">
                            <Icons.Package size={28} strokeWidth={2.5} className="text-[#3f809e]" />
                        </div>
                    </div>
                    <div>
                        <h3 className="font-black text-[#212c46] uppercase tracking-tighter leading-none font-exception-header" style={{ fontSize: '24px' }}>
                            PACKING <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3f809e] to-[#b58c4f]">BOARD</span> SYSTEM
                        </h3>
                        <p className="text-[11px] font-bold text-[#7a8b95] uppercase tracking-[0.2em] mt-0.5 opacity-80 leading-none">
                            FINISHED GOODS PRODUCTION CONTROL & LOT SCHEDULER
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center bg-white px-3 py-1.5 rounded-xl border border-[#eaeaec] shadow-sm h-10">
                        <Icons.Calendar size={14} className="text-[#7a8b95] mr-2"/>
                        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="text-[11px] font-bold font-mono text-[#212c46] outline-none cursor-pointer bg-transparent uppercase" />
                    </div>

                    <div className="flex gap-1.5 bg-white/50 p-1.5 rounded-xl border border-[#eaeaec] shadow-inner">
                        <button onClick={() => setActiveTab('execution')} className={`px-5 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'execution' ? 'bg-[#212c46] text-[#d7d7d7] shadow-md' : 'text-[#7a8b95] hover:text-[#a94228]'}`}>
                            <Icons.Play size={14} /> Packing Execution
                        </button>
                        <button onClick={() => setActiveTab('overview')} className={`px-5 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'overview' ? 'bg-[#212c46] text-[#d7d7d7] shadow-md' : 'text-[#7a8b95] hover:text-[#a94228]'}`}>
                            <Icons.LayoutDashboard size={14} /> Overview
                        </button>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT WRAPPER */}
            <div className="max-w-[1532px] mx-auto px-4 sm:px-8 w-full mt-[2px] transition-all">
                
                {/* KPI STATS - Styled like UserPermissions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 shrink-0">
                    <KpiCard label="Total Plan Packs" value={plans.reduce((s,p)=>s+p.targetPacks, 0)} icon="target" colorAccent={THEME.primaryLight} colorValue={THEME.primary} desc="Target Packs" />
                    <KpiCard label="Total Packed" value={plans.reduce((s,p)=>s+p.packedPacks, 0)} icon="package-check" colorAccent={THEME.success} colorValue={THEME.success} desc="Finished Packs" />
                    <KpiCard label="Work In Process" value={plans.reduce((s,p)=>s+p.wipPacks, 0)} icon="activity" colorAccent={THEME.skyBlue} colorValue={THEME.skyBlue} desc="Active Packing WIP" />
                    <KpiCard label="Completed Jobs" value={`${plans.filter(p=>p.status==='Completed').length} / ${plans.length}`} icon="check-circle" colorAccent={THEME.brightGold} colorValue={THEME.brightGold} desc="Completed Plans" />
                </div>

                {activeTab === 'overview' ? (
                    /* --- OVERVIEW TABLE VIEW --- */
                    <div className="bg-white rounded-3xl shadow-lg border border-[#eaeaec] overflow-hidden flex flex-col animate-fadeIn">
                        <div className="p-6 flex flex-row justify-between items-center bg-[#f8f9fa] border-b border-[#eaeaec] shrink-0">
                            <div className="flex items-center gap-3 text-sm font-black text-[#212c46] uppercase tracking-widest">
                                <Icons.ListTree size={20} className="text-[#b7a159]" /> Daily Packing Plan List
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#7a8b95] bg-white border border-[#eaeaec] px-4 py-2 rounded-xl shadow-sm">
                                {plans.length} Records Installed
                            </span>
                        </div>
                        <div className="overflow-auto custom-scrollbar">
                            <table className="w-full text-left font-sans border-collapse">
                                <thead className="sys-table-header bg-[#212c46] text-white border-[#b7a159]">
                                    <tr>
                                        <th className="py-4 px-6 font-black uppercase tracking-widest whitespace-nowrap pl-8 text-[11px]">Job Plan ID</th>
                                        <th className="py-4 px-6 font-black uppercase tracking-widest whitespace-nowrap text-[11px]">Finished Product Description (SKU)</th>
                                        <th className="py-4 px-6 font-black uppercase tracking-widest text-center whitespace-nowrap text-[11px]">Target (Packs)</th>
                                        <th className="py-4 px-6 font-black uppercase tracking-widest text-center whitespace-nowrap text-[11px]">Packed (Packs)</th>
                                        <th className="py-4 px-6 font-black uppercase tracking-widest text-center whitespace-nowrap text-[11px]">WIP (Packs)</th>
                                        <th className="py-4 px-6 font-black uppercase tracking-widest text-center w-48 text-[11px]">Progress Rate</th>
                                        <th className="py-4 px-6 font-black uppercase tracking-widest text-center whitespace-nowrap pr-8 text-[11px]">Status State</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-[#eaeaec]">
                                    {plans.map(p => {
                                        const pct = Math.min(100, Math.round((p.packedPacks / p.targetPacks) * 100));
                                        return (
                                            <tr key={p.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 font-sans">
                                                <td className="py-4 px-6 pl-8 font-mono font-black text-[#a94228] text-[12px]">{p.id}</td>
                                                <td className="py-4 px-6">
                                                    <div className="font-extrabold text-[#212c46] text-[12.5px] uppercase tracking-tight">{p.fgName}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono font-bold mt-1 tracking-widest">{p.sku}</div>
                                                </td>
                                                <td className="py-4 px-6 text-center font-mono font-black text-[#212c46] text-[12px]">{p.targetPacks.toLocaleString()}</td>
                                                <td className="py-4 px-6 text-center font-mono font-black text-emerald-600 text-[12px]">{p.packedPacks.toLocaleString()}</td>
                                                <td className="py-4 px-6 text-center font-mono font-black text-slate-500 text-[12px]">{p.wipPacks.toLocaleString()}</td>
                                                <td className="py-4 px-6 text-center w-48">
                                                    <div className="flex items-center gap-3 justify-center">
                                                        <div className="flex-1 bg-slate-100 border border-[#eaeaec] h-3.5 rounded-full overflow-hidden shadow-inner max-w-[120px]">
                                                            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full transition-all duration-500 rounded-full" style={{ width: `${pct}%` }}></div>
                                                        </div>
                                                        <span className="font-mono text-[11px] font-black text-[#212c46] w-8">{pct}%</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 pr-8 text-center">
                                                    <span className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest border shadow-inner ${
                                                        p.status === 'Completed' ? 'bg-[#657f4d]/10 text-[#657f4d] border-[#657f4d]/30' :
                                                        p.status === 'In Progress' ? 'bg-[#3f809e]/10 text-[#3f809e] border-[#3f809e]/30' :
                                                        'bg-[#7a8b95]/10 text-[#7a8b95] border-[#7a8b95]/30'
                                                    }`}>
                                                        {p.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    /* --- EXECUTION BOARD VIEW --- */
                    <div className="flex flex-col flex-1 min-h-0 space-y-4">
                        
                        {/* DRAGGABLE PLANNING MODAL */}
                        <DraggableModal 
                            isOpen={isPlannerOpen} 
                            onClose={() => setIsPlannerOpen(false)} 
                            width="max-w-[700px]"
                            customHeader={
                                <div className="bg-[#212c46] px-6 py-4 flex justify-between items-center shrink-0 border-b-2 border-[#b7a159] modal-handle cursor-move w-full">
                                    <div className="flex items-center gap-3">
                                        <Icons.PackageCheck size={18} className="text-[#b7a159]" />
                                        <h3 className="text-sm font-black text-[#d7d7d7] uppercase tracking-widest leading-none">
                                            Select Packing Job & Machine Setup
                                        </h3>
                                    </div>
                                    <button onClick={() => setIsPlannerOpen(false)} className="text-white/70 hover:text-[#a94228] transition-all bg-white/10 hover:bg-white/20 p-1.5 rounded-full"><Icons.X size={16} /></button>
                                </div>
                            }
                        >
                            <div className="p-6 space-y-5 bg-white text-] text-[12px]">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-black text-[#7a8b95] uppercase tracking-widest">Select Job Plan</label>
                                        <div className="relative">
                                            <select value={selectedPlanId} onChange={e=>setSelectedPlanId(e.target.value)} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-lg px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none focus:border-[#b7a159] appearance-none cursor-pointer">
                                                {plans.filter(p=>p.status !== 'Completed').map(p => <option key={p.id} value={p.id}>{p.id} : {p.sku} ({p.fgName})</option>)}
                                            </select>
                                            <Icons.ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-black text-[#7a8b95] uppercase tracking-widest">Target Packing Machine</label>
                                        <div className="relative">
                                            <select value={selectedMachineId} onChange={e=>setSelectedMachineId(e.target.value)} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-lg px-4 py-2.5 text-[12px] font-bold text-[#212c46] outline-none focus:border-[#b7a159] appearance-none cursor-pointer">
                                                {PACKING_MACHINES.map(m => <option key={m.id} value={m.id}>{m.name} ({m.capacityKgHr} kg/hr)</option>)}
                                            </select>
                                            <Icons.ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#f8f9fa] border border-[#eaeaec] p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="flex flex-col">
                                        <p className="text-[9px] font-black text-[#7a8b95] uppercase tracking-widest leading-none mb-1">Available Sfg Stock</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-[20px] font-black text-[#212c46] font-mono leading-none">{availSfgQty.toLocaleString()}</span>
                                            <span className="text-[10px] font-extrabold text-slate-400 uppercase">kg</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-[9px] font-black text-[#7a8b95] uppercase tracking-widest leading-none mb-1">Max Packable Packs</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-[20px] font-black text-emerald-600 font-mono leading-none">{maxByStock.toLocaleString()}</span>
                                            <span className="text-[10px] font-extrabold text-[#7a8b95] uppercase">Packs</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-[9px] font-black text-[#7a8b95] uppercase tracking-widest leading-none mb-1">Estimate Time</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-[20px] font-black text-[#a94228] font-mono leading-none">{Math.round(estTime)}</span>
                                            <span className="text-[10px] font-extrabold text-slate-400 uppercase">Min</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center sm:px-1">
                                        <label className="text-[11px] font-black text-[#212c46] uppercase tracking-widest font-mono">Qty to Release (Packs)</label>
                                        <span className="text-[10px] font-bold text-[#7a8b95] font-mono">Plan Limits Remaining: {planRemaining.toLocaleString()} Packs</span>
                                    </div>
                                    <div className="relative w-full">
                                        <input 
                                            type="number" 
                                            value={releaseInput} 
                                            onChange={e=>setReleaseInput(Number(e.target.value))} 
                                            min={1}
                                            max={maxRelease}
                                            className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-lg px-4 py-3 text-center text-lg font-black text-[#a94228] outline-none focus:border-[#b7a159] pr-14" 
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-widest">PCKS</span>
                                    </div>
                                </div>

                                <div className="pt-2 flex justify-end gap-3 shrink-0">
                                    <button 
                                        onClick={() => setIsPlannerOpen(false)} 
                                        className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-lg uppercase text-[11px] tracking-wider transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={() => { handleStartPacking(); setIsPlannerOpen(false); }} 
                                        disabled={releaseInput <= 0 || releaseInput > maxRelease} 
                                        className="px-6 py-2.5 bg-[#212c46] text-white font-black rounded-lg uppercase text-[11px] tracking-wider hover:bg-[#3f809e] transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Icons.Play size={14} fill="white" /> START BATCH PACKING
                                    </button>
                                </div>
                            </div>
                        </DraggableModal>

                        {/* Active Lots Visualization with Grid layout */}
                        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 w-full overflow-hidden">
                            
                            {/* Summary Left Sidebar - MES Styled Navy Side bar */}
                            <div className="w-full lg:w-72 bg-[#212c46] text-white flex flex-col p-6 shadow-xl relative overflow-hidden shrink-0 rounded-3xl border border-[#212c46] transition-all duration-300">
                                <div className="absolute -right-8 -bottom-8 text-white/5 transform rotate-12 pointer-events-none">
                                    <Icons.Package size={200} />
                                </div>
                                <div className="relative z-10 flex flex-col h-full w-full justify-between">
                                    <div>
                                        <h3 className="text-[11px] font-black uppercase text-[#b7a159] mb-4 tracking-widest border-b border-white/10 pb-3 flex items-center gap-1.5">
                                            <Icons.Gauge size={14}/> PACKED ACCUMULATED
                                        </h3>
                                        <div className="flex flex-col gap-1.5 mb-6">
                                            <span className="text-4xl lg:text-5xl font-black font-mono text-white tracking-tighter">
                                                {plans.reduce((s,p)=>s+p.packedPacks, 0).toLocaleString()}
                                            </span>
                                            <span className="text-[10px] font-extrabold text-[#7a8b95] uppercase tracking-widest">
                                                Finished Packs Today
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-8 pt-6 border-t border-white/10 w-full bg-black/20 backdrop-blur-sm rounded-2xl py-4 flex flex-col items-center">
                                        <div className="flex items-center justify-center gap-2 mb-3">
                                            <Icons.Activity size={14} className="text-amber-500 animate-pulse" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-white">SIMULATION SPEED CONTROL</span>
                                        </div>
                                        <div className="flex justify-center gap-2 px-3 w-full">
                                            {[1, 10, 60].map(s => (
                                                <button key={s} onClick={()=>setSimSpeed(s)} className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${simSpeed === s ? 'bg-[#b7a159] text-[#212c46] shadow-md' : 'bg-white/10 text-white/50 hover:bg-white/20'}`}>{s}x</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Active Processes Board */}
                            <div className="flex-1 overflow-hidden flex flex-col bg-white border border-[#eaeaec] rounded-3xl shadow-lg transition-all">
                                <div className="px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#f8f9fa] shrink-0 border-b border-[#eaeaec]">
                                    <h3 className="font-black text-[12px] text-[#212c46] flex items-center gap-2 uppercase tracking-widest">
                                        <Icons.Cpu size={16} className="text-[#a94228]" /> ACTIVE PACKING MACHINE MONITORS
                                    </h3>
                                    <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto no-scrollbar py-1">
                                        <label className="flex items-center gap-2.5 text-[11px] font-black text-slate-500 uppercase cursor-pointer shrink-0">
                                            <input type="checkbox" checked={showCompleted} onChange={(e) => setShowCompleted(e.target.checked)} className="rounded text-[#212c46] focus:ring-[#212c46] w-4 h-4" />
                                            Show Completed
                                        </label>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-[#7a8b95] bg-white border border-[#eaeaec] px-3.5 py-2 rounded-lg shadow-sm shrink-0 font-mono">
                                            {activeLots.filter(l => showCompleted ? true : l.status !== 'Completed').length} Lines
                                        </div>
                                        <button onClick={() => setIsPlannerOpen(true)} className="bg-[#212c46] text-white px-5 py-2 rounded-full font-black text-[11px] uppercase tracking-widest shadow-md hover:bg-[#3f809e] hover:text-white transition-all flex items-center gap-1.5 shrink-0 border border-[#212c46]">
                                            <Icons.Plus size={14} /> NEW PACKING
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#f8f9fa]/50">
                                    {activeLots.filter(l => showCompleted ? true : l.status !== 'Completed').length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                            {activeLots.filter(l => showCompleted ? true : l.status !== 'Completed').map(lot => {
                                                const progress = 100 - ((lot.timeLeft / lot.totalTime) * 100);
                                                return (
                                                    <div key={lot.id} className={`bg-white border border-[#eaeaec] rounded-2xl p-4 relative group hover:shadow-md transition-all flex flex-col h-[185px] leading-tight select-none ${lot.status === 'Completed' ? 'opacity-65 saturate-50 bg-[#f8f9fa]' : ''}`}>
                                                        <div className="flex justify-between items-start mb-2 gap-2">
                                                            <div className="flex flex-col flex-1 min-w-0">
                                                                <span className="font-mono font-black text-[#a94228] text-[12px]">{lot.id}</span>
                                                                <h4 className="font-extrabold text-[#212c46] text-[11px] uppercase mt-0.5 truncate max-w-[130px]" title={lot.name}>{lot.name}</h4>
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                <div className="text-[9px] font-black text-[#7a8b95] uppercase tracking-wider mb-1 truncate max-w-[100px]" title={lot.machineName}>{lot.machineName}</div>
                                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border uppercase shadow-sm ${lot.status === 'Completed' ? 'bg-[#657f4d]/10 text-[#657f4d] border-[#657f4d]/20' : 'bg-[#3f809e]/10 text-[#3f809e] border-[#3f809e]/20 animate-pulse'}`}>{lot.status === 'Completed' ? 'Completed' : 'Packing'}</span>
                                                            </div>
                                                        </div>
                                                        <div className="bg-[#f8f9fa] border border-[#eaeaec] rounded-xl p-3 mb-3 shadow-inner">
                                                            <div className="flex justify-between items-center mb-1.5">
                                                                <span className="text-[9px] font-black uppercase text-slate-400">Process Progress</span>
                                                                <span className="text-[11px] font-black text-[#212c46] font-mono">{Math.round(progress)}%</span>
                                                            </div>
                                                            <div className="w-full bg-[#eaeaec] h-2 rounded-full overflow-hidden mb-2">
                                                                <div className={`h-full transition-all duration-1000 ease-linear rounded-full ${lot.status === 'Completed' ? 'bg-[#657f4d]' : 'bg-[#3f809e]'}`} style={{ width: `${progress}%` }}></div>
                                                            </div>
                                                            <div className="flex justify-between text-[11.5px] font-mono font-black text-slate-500">
                                                                <span>{lot.qty.toLocaleString()} Packs</span>
                                                                <span>{Math.ceil(lot.timeLeft)} min left</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1.5 mt-auto">
                                                            {lot.status !== 'Completed' ? (
                                                                <button onClick={() => {
                                                                    setActiveLots(curr => curr.map(l => l.id === lot.id ? {...l, timeLeft: 1} : l));
                                                                }} className="flex-1 bg-white border border-[#eaeaec] py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all text-[#7a8b95] hover:text-white hover:bg-[#a94228] hover:border-transparent flex items-center justify-center gap-1.5 shadow-sm active:scale-95">
                                                                    Force Finish Plan
                                                                </button>
                                                            ) : (
                                                                <div className="flex-1 border bg-[#f8f9fa]/80 border-[#eaeaec] py-1.5 rounded-lg text-[9.5px] font-black uppercase tracking-widest text-[#7a8b95] flex items-center justify-center shadow-inner">
                                                                    COMPLETED CYCLE
                                                                </div>
                                                            )}
                                                            <button onClick={() => setQrPrint(lot)} className="w-8 h-8 flex items-center justify-center bg-white border border-[#eaeaec] rounded-lg shadow-sm shrink-0 hover:bg-[#f8f9fa] transition-colors" title="Print QR Tag">
                                                                <Icons.QrCode size={14} className="text-[#a94228]" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16 opacity-60">
                                            <Icons.PackageOpen size={48} className="mb-4 text-[#7a8b95]" />
                                            <p className="font-black uppercase tracking-widest text-xs text-slate-500">No active machines currently packing</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
