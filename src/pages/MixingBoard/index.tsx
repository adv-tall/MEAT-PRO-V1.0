import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import * as Icons from "lucide-react";
import { DraggableModal } from "@/src/components/shared/DraggableModal";
import { UserGuidePanel } from "@/src/components/shared/UserGuidePanel";
import UserGuideButton from "@/src/components/shared/UserGuideButton";
import KpiCard from "@/src/components/shared/KpiCard";
import { useSharedOrders } from "@/src/store/ordersStore";

const THEME = {
  bgMain: "#f3f3f1",
  bgGradient: "transparent",
  sidebarBg: "linear-gradient(180deg, #1d2636 0%, #0F172A 100%)",
  glassWhite: "rgba(255, 255, 255, 0.88)",
  primary: "#212c46",
  primaryLight: "#4d87a8",
  accent: "#a94228",
  gold: "#b58c4f",
  brightGold: "#b7a159",
  success: "#657f4d",
  danger: "#932c2e",
  skyBlue: "#3f809e",
  dustyBlue: "#7a8b95",
  indigo: "#414757",
  softPurple: "#ab7d82",
  deepPurple: "#2d2c4a",
  pinkAccent: "#a54f6b",
  mutedSlate: "#606a5f",
  darkSlate: "#2f2926",
  silver: "#d7d7d7",
};

// --- CONFIGURATIONS ---
const STEP_CONFIG: Record<string, any> = {
  mixing: { color: THEME.primary, label: "MIXING", icon: "chef-hat" },
  forming: { color: THEME.brightGold, label: "FORMING", icon: "layers" },
  steaming: { color: THEME.accent, label: "STEAMING", icon: "thermometer" },
  cooling: { color: THEME.skyBlue, label: "COOLING", icon: "snowflake" },
  peeling: { color: THEME.success, label: "PEELING", icon: "scroll" },
  cutting: { color: THEME.dustyBlue, label: "CUTTING", icon: "scissors" },
};

// Removed BATTER_OPTIONS from here

const INITIAL_SETS = [
  {
    id: "SET-SMC-101",
    setNo: 101,
    productName: "SFG Smoked Sausage (Standard)",
    step: "mixing",
    status: "Processing",
    totalTime: 4500,
    timeLeft: 1200,
    weightPerBatch: 150,
    batchesInSet: 9,
    machine: "Emulsion System",
  },
  {
    id: "SET-SMC-102",
    setNo: 102,
    productName: "SFG Smoked Sausage (Standard)",
    step: "mixing",
    status: "Processing",
    totalTime: 4500,
    timeLeft: 2100,
    weightPerBatch: 150,
    batchesInSet: 9,
    machine: "Emulsion System",
  },
  {
    id: "SET-MTB-201",
    setNo: 201,
    productName: "SFG Pork Meatball Grade A",
    step: "mixing",
    status: "Processing",
    totalTime: 1800,
    timeLeft: 420,
    weightPerBatch: 150,
    batchesInSet: 2,
    machine: "Bowl Cutter",
  },
  {
    id: "SET-CHE-301",
    setNo: 301,
    productName: "SFG Cheese Sausage Lava",
    step: "forming",
    status: "Processing",
    totalTime: 1200,
    timeLeft: 820,
    weightPerBatch: 150,
    batchesInSet: 1,
    machine: "Vacuum Mixer",
  },
  {
    id: "SET-CHE-302",
    setNo: 302,
    productName: "SFG Cheese Sausage Lava",
    step: "forming",
    status: "Waiting",
    totalTime: 1200,
    timeLeft: 1200,
    weightPerBatch: 150,
    batchesInSet: 1,
    machine: "Vacuum Mixer",
  },
  {
    id: "SET-STM-401",
    setNo: 401,
    productName: "SFG Pork Meatball",
    step: "steaming",
    status: "Processing",
    totalTime: 1800,
    timeLeft: 450,
    weightPerBatch: 150,
    batchesInSet: 1,
    machine: "Oven",
  },
  {
    id: "SET-COL-501",
    setNo: 501,
    productName: "SFG Vienna Sausage",
    step: "cooling",
    status: "Processing",
    totalTime: 2400,
    timeLeft: 1200,
    weightPerBatch: 150,
    batchesInSet: 1,
    machine: "Chiller",
  },
  {
    id: "SET-PEL-601",
    setNo: 601,
    productName: "SFG Chicken Frank",
    step: "peeling",
    status: "Processing",
    totalTime: 600,
    timeLeft: 300,
    weightPerBatch: 150,
    batchesInSet: 1,
    machine: "Peeler",
  },
  {
    id: "SET-CUT-701",
    setNo: 701,
    productName: "SFG Ham Block Sliced",
    step: "cutting",
    status: "Processing",
    totalTime: 900,
    timeLeft: 150,
    weightPerBatch: 150,
    batchesInSet: 1,
    machine: "Slicer",
  },
  {
    id: "SET-CUT-702",
    setNo: 702,
    productName: "SFG Ham Block Sliced",
    step: "cutting",
    status: "Processing",
    totalTime: 900,
    timeLeft: 150,
    weightPerBatch: 150,
    batchesInSet: 1,
    machine: "Slicer",
  },
  {
    id: "SET-CUT-703",
    setNo: 703,
    productName: "SFG Garlic Ham",
    step: "cutting",
    status: "Processing",
    totalTime: 900,
    timeLeft: 400,
    weightPerBatch: 150,
    batchesInSet: 1,
    machine: "Slicer",
  },
];

const MIXING_MACHINES = [
  { name: "Emulsion System", batches: 9 },
  { name: "Bowl Cutter", batches: 2 },
  { name: "Vacuum Mixer", batches: 1 },
];

const WAITING_SFG_DATA = [
  {
    id: "W-105",
    code: "SFG-SMC-001",
    name: "SFG Smoked Sausage (Standard)",
    batchSet: "SET #105",
    location: "Cooling Room A",
    weight: 450,
    delay: "5h 10m",
    isDelayed: true,
  },
  {
    id: "W-88",
    code: "SFG-BOL-004",
    name: "SFG Chili Bologna Bar",
    batchSet: "SET #88",
    location: "Buffer Zone 2",
    weight: 300,
    delay: "24h 40m",
    isDelayed: true,
  },
  {
    id: "W-106",
    code: "SFG-SMC-001",
    name: "SFG Smoked Sausage (Standard)",
    batchSet: "SET #106",
    location: "Cooling Room A",
    weight: 450,
    delay: "1h 52m",
    isDelayed: false,
  },
  {
    id: "W-112",
    code: "SFG-MTB-002",
    name: "SFG Pork Meatball Grade A",
    batchSet: "SET #112",
    location: "Cooling Room B",
    weight: 500,
    delay: "1h 25m",
    isDelayed: false,
  },
];

const OVERVIEW_PLANS = [
  {
    id: "JOB-SMC-001",
    name: "SFG Smoked Sausage (Standard)",
    code: "SFG-SMC-001",
    target: 60,
    produced: 30,
    wip: 6,
    progress: 50,
    status: "IN PROGRESS",
  },
  {
    id: "JOB-BOL-004",
    name: "SFG Chili Bologna Bar",
    code: "SFG-BOL-004",
    target: 40,
    produced: 10,
    wip: 6,
    progress: 25,
    status: "IN PROGRESS",
  },
];

// --- HELPER COMPONENTS ---

const LucideIcon = ({ name, size = 16, className = "", color, style }: any) => {
  if (!name) return null;
  const pascalName = name
    .split("-")
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
  const IconComponent =
    (Icons as any)[pascalName] ||
    (Icons as any)[`${pascalName}Icon`] ||
    Icons.Activity;
  return (
    <IconComponent
      size={size}
      className={className}
      style={{ ...style, color: color }}
      strokeWidth={2.2}
    />
  );
};

const GuideContent = () => (
  <div className="space-y-8">
      <div>
          <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
              <Icons.Activity size={16} className="text-[#3f809e]" /> 1. OVERVIEW BOARD
          </h3>
          <p className="mb-4 text-[#414757]">
              บอร์ดนี้ใช้สำหรับติดตามสถานะการผสมแบบ Real-time ข้อมูลจะซิงค์กับแผนการผลิตประจำวัน โดยสามารถตรวจสอบได้จากแท็บข้างบน:
          </p>
          <div className="space-y-3">
              <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#3f809e] mt-1.5 shrink-0"></div>
                  <div className="text-[#414757]"><span className="font-bold text-[#212c46]">BATTER &rarr; SFG:</span> หน้ากระดานแสดงกระบวนการผลิตพร้อมเวลาถอยหลังแต่ละ Batch</div>
              </div>
              <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#d55a6d] mt-1.5 shrink-0"></div>
                  <div className="text-[#414757]"><span className="font-bold text-[#212c46]">SFG WAITING:</span> แสดงข้อมูล SFG ที่กำลังรอเข้าสเต็ป Packing พร้อมข้อมูล Delay time</div>
              </div>
              <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#b58c4f] mt-1.5 shrink-0"></div>
                  <div className="text-[#414757]"><span className="font-bold text-[#212c46]">OVERVIEW:</span> สถานะภาพรวมของแผนการผลิต SFG ในแต่วัน การเทียบเป้าหมายและ WIP</div>
              </div>
          </div>
      </div>

      <div className="h-px bg-[#eaeaec] w-full" />

      <div>
          <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
              <Icons.Settings size={16} className="text-[#b58c4f]" /> 2. PLANNER (การสร้างแผนผสม)
          </h3>
          <p className="mb-4 text-[#414757]">
              คุณสามารถเพิ่ม Batch งานใหม่ผ่านปุ่ม <span className="font-bold text-[#212c46]">NEW MIXING</span> ในหน้า Execution Board โดยระบบจะ:
          </p>
          <div className="p-4 bg-[#f8f9fa] border border-[#eaeaec] rounded-xl text-[#414757]">
              <ul className="list-disc pl-5 space-y-2">
                  <li>เชื่อมโยงข้อมูล Batter ที่ต้องเตรียมจากข้อมูล <span className="font-bold">Production Planning</span> ทันที</li>
                  <li>คำนวณจำนวน Batches ที่เหลืออยู่ (Left) เพื่อป้องกันการผลิตเกินเป้าหมาย</li>
                  <li>รองรับการสั่งงานแบบเป็นชุด (Order Sets) โดย 1 Set จะเท่ากับ 6 Batches เสมอ</li>
              </ul>
          </div>
      </div>
  </div>
);

function PlannerModal({ isOpen, onClose, onStart }: any) {
  const [orders] = useSharedOrders();
  const BATTER_OPTIONS = Array.from(new Set(orders.map((o: any) => o.sku))).map(
    (sku) => {
      const order = orders.find((o: any) => o.sku === sku);
      const code = (sku as string).replace("FG-", "SFG-");
      const totalWeight = orders.filter((o: any) => o.sku === sku).reduce(
        (sum: number, o: any) => sum + o.batterKg,
        0,
      );
      const totalBatches = Math.ceil(totalWeight / 150);
      const remaining = Math.max(
        0,
        Math.ceil(totalBatches * (0.3 + Math.random() * 0.4)),
      );
      return {
        code,
        name: `SFG ${order?.name.replace(" 1kg", "").replace(" 500g", "")}`,
        totalBatches,
        totalWeight,
        remaining,
      };
    },
  );

  const [selectedBatter, setSelectedBatter] = useState<any>(BATTER_OPTIONS[0]);
  const [selectedMachine, setSelectedMachine] = useState<any>(
    MIXING_MACHINES[0],
  );
  const [orderSets, setOrderSets] = useState(1);
  const remainingPercent =
    selectedBatter?.totalBatches > 0
      ? (selectedBatter.remaining / selectedBatter.totalBatches) * 100
      : 0;

  const handleStart = () => {
    if (!onStart || !selectedBatter) return;
    const newSets = [];
    for (let i = 0; i < orderSets; i++) {
      newSets.push({
        id: `SET-NEW-${Math.floor(Math.random() * 10000)}`,
        setNo: Math.floor(Math.random() * 100) + 800,
        productName: selectedBatter.name,
        step: "mixing",
        status: "Processing",
        totalTime: 900 * selectedMachine.batches,
        timeLeft: 900 * selectedMachine.batches,
        weightPerBatch: 150,
        batchesInSet: selectedMachine.batches,
        machine: selectedMachine.name,
      });
    }
    onStart(newSets);
  };

  return (
    <DraggableModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Icons.Activity size={18} className="text-[#3f809e] animate-pulse" />
          <span className="text-sm font-black text-[#111f42] uppercase tracking-widest">
            Production Planner
          </span>
        </div>
      }
      className="w-[800px]"
    >
      <div className="p-6 overflow-y-auto max-h-[80vh] custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 items-end">
          <div className="lg:col-span-4 flex flex-col gap-1.5 w-full">
            <label className="text-[10px] font-bold text-[#7a8b95] uppercase tracking-widest pl-1">
              Batter Selection
            </label>
            <div className="relative">
              <select
                value={selectedBatter?.code || ""}
                onChange={(e) =>
                  setSelectedBatter(
                    BATTER_OPTIONS.find((b) => b.code === e.target.value),
                  )
                }
                className="w-full bg-white border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#212c46] focus:border-[#4d87a8] focus:ring-1 focus:ring-[#4d87a8] transition-all outline-none appearance-none cursor-pointer"
              >
                {BATTER_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.code} : {opt.name}
                  </option>
                ))}
              </select>
              <Icons.ChevronDown
                size={14}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7a8b95] pointer-events-none"
              />
            </div>
          </div>
          <div className="lg:col-span-4 flex flex-col gap-1.5 w-full">
            <label className="text-[10px] font-bold text-[#7a8b95] uppercase tracking-widest pl-1">
              Mixing Machine
            </label>
            <div className="relative">
              <select
                value={selectedMachine?.name || ""}
                onChange={(e) =>
                  setSelectedMachine(
                    MIXING_MACHINES.find((m) => m.name === e.target.value),
                  )
                }
                className="w-full bg-white border border-[#eaeaec] rounded-xl px-4 py-2.5 text-[12px] font-bold text-[#212c46] focus:border-[#4d87a8] focus:ring-1 focus:ring-[#4d87a8] transition-all outline-none appearance-none cursor-pointer"
              >
                {MIXING_MACHINES.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name} ({m.batches} Batches/Set)
                  </option>
                ))}
              </select>
              <Icons.ChevronDown
                size={14}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7a8b95] pointer-events-none"
              />
            </div>
          </div>
          <div className="lg:col-span-4 w-full">
            <div className="bg-[#f8f9fa] border border-[#eaeaec] p-3 rounded-xl flex items-center justify-between shadow-inner">
              <div className="flex flex-col">
                <p className="text-[9px] font-black text-[#7a8b95] uppercase tracking-widest leading-none mb-1">
                  Total Plan
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black text-[#212c46] font-mono leading-none">
                    {selectedBatter?.totalBatches || 0}
                  </span>
                  <span className="text-[9px] font-bold text-[#7a8b95] uppercase">
                    Batches
                  </span>
                </div>
              </div>
              <Icons.ClipboardList size={20} className="text-[#d7d7d7]" />
            </div>
          </div>
          <div className="lg:col-span-4 flex flex-col gap-1.5 w-full">
            <label className="text-[10px] font-bold text-[#7a8b95] uppercase tracking-widest pl-1">
              Remaining
            </label>
            <div className="bg-[#f8f9fa] border border-[#eaeaec] p-3 rounded-xl flex flex-col justify-center gap-2 shadow-inner h-[50px]">
              <span className="text-[12px] font-black text-[#212c46] font-mono leading-none">
                {selectedBatter?.remaining || 0}{" "}
                <span className="text-[9px] text-[#7a8b95] uppercase">
                  Left
                </span>
              </span>
              <div className="w-full bg-[#eaeaec] h-1.5 rounded-full overflow-hidden relative">
                <div
                  className="bg-[#4d87a8] h-full absolute left-0 top-0 transition-all duration-300"
                  style={{ width: `${remainingPercent}%` }}
                ></div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-4 flex flex-col gap-1.5 w-full">
            <div className="flex justify-between items-center px-1">
              <label className="text-[11px] font-black text-[#a94228] uppercase tracking-widest">
                Order Sets
              </label>
              <span className="bg-[#f8f9fa] text-[#7a8b95] text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase font-mono border border-[#eaeaec]">
                1S={selectedMachine?.batches}B
              </span>
            </div>
            <input
              type="number"
              value={orderSets}
              onChange={(e) =>
                setOrderSets(Math.max(1, parseInt(e.target.value) || 1))
              }
              className="w-full bg-white border border-[#eaeaec] rounded-xl text-center text-lg font-black text-[#a94228] py-2 focus:border-[#4d87a8] focus:ring-1 focus:ring-[#4d87a8] transition-all outline-none"
            />
          </div>
          <div className="lg:col-span-4 w-full">
            <button
              onClick={handleStart}
              className="w-full h-[50px] bg-[#212c46] hover:bg-[#1a233a] hover:shadow-lg text-white rounded-xl font-bold uppercase tracking-widest text-[12px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
            >
              <Icons.Play size={16} fill="white" /> Start{" "}
              <span className="bg-white/20 px-1.5 py-0.5 rounded text-[11px] border border-white/20 font-bold font-mono">
                +{orderSets * selectedMachine?.batches} Batches
              </span>
            </button>
          </div>
        </div>
      </div>
    </DraggableModal>
  );
}

// --- VIEWS ---

const BatchExecutionView = ({
  processSets,
  activeStep,
  onOpenPlanner,
  onFinishSet,
  onStartSet
}: any) => {
  const config = STEP_CONFIG[activeStep];
  const [qrData, setQrData] = useState<any>(null);
  const [simSpeed, setSimSpeed] = useState(1);
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedMachineFilter, setSelectedMachineFilter] = useState<string>("All");

  const totalProduced = 120; // Mock count

  let displaySets = showCompleted
    ? processSets
    : processSets.filter((s: any) => s.status !== "Completed");

  if (selectedMachineFilter !== "All") {
    displaySets = displaySets.filter((s: any) => s.machine === selectedMachineFilter);
  }

  const gridColsClass =
    activeStep === "cutting"
      ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 3xl:grid-cols-5 gap-4"
      : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 3xl:grid-cols-6 gap-4";

  const renderGrid = () => (
    <div className={gridColsClass}>
      {displaySets.map((procSet: any) => {
        const progress =
          ((procSet.totalTime - procSet.timeLeft) / procSet.totalTime) * 100;
        return (
          <div
            key={procSet.id}
            className={`bg-white rounded-xl shadow-sm border border-[#eaeaec] p-3 relative group flex flex-col h-[180px] ${procSet.status === "Completed" ? "opacity-60 saturate-50 bg-[#f8f9fa]" : ""}`}
          >
            <div className="flex justify-between items-start mb-2 gap-2">
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-[11px] font-black uppercase tracking-tighter text-[#7a8b95]">
                  SET #{procSet.setNo} • {procSet.machine}
                </span>
                <h4
                  className="text-[12px] font-bold text-[#212c46] leading-tight line-clamp-1"
                  title={procSet.productName}
                >
                  {procSet.productName}
                </h4>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[14px] font-black text-[#212c46] font-mono leading-none">
                  {procSet.weightPerBatch * procSet.batchesInSet}
                </span>
                <span className="text-[8px] font-bold opacity-50 block uppercase text-[#212c46]">
                  KG
                </span>
              </div>
            </div>
            <div className="bg-[#f8f9fa] border border-[#eaeaec] rounded-lg p-2 mb-3 shadow-inner">
              <div className="flex justify-between items-end mb-2">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold uppercase text-[#7a8b95]">
                    Status
                  </span>
                  <span
                    className={`text-[11px] font-black uppercase ${procSet.status === "Processing" ? "text-[#657f4d] animate-pulse" : procSet.status === "Completed" ? "text-[#3f809e]" : "text-[#7a8b95]"}`}
                  >
                    {procSet.status}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="bg-white border border-[#212c46] px-1.5 py-0.5 rounded leading-none text-[#212c46] font-black text-[10px] uppercase">
                    {procSet.batchesInSet} BATCHES
                  </span>
                </div>
              </div>
              <div className="w-full bg-[#eaeaec] h-1.5 rounded-full overflow-hidden mb-1.5">
                <div
                  className="h-full bg-[#657f4d] rounded-full"
                  style={{
                    width: `${progress}%`,
                    backgroundColor:
                      procSet.status === "Completed" ? "#3f809e" : "",
                  }}
                ></div>
              </div>
              <div className="text-right text-[11px] font-mono font-bold text-[#7a8b95]">
                {Math.floor(procSet.timeLeft / 60)}:
                {String(procSet.timeLeft % 60).padStart(2, "0")} Left
              </div>
            </div>
            <div className="flex gap-1.5 mt-auto">
              {procSet.status === "Waiting" ? (
                <button
                  onClick={() => onStartSet(procSet.id)}
                  className="flex-1 bg-[#212c46] border border-[#212c46] py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all hover:bg-black text-white flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                >
                  <Icons.Play size={12} fill="white" /> START SET
                </button>
              ) : procSet.status === "Processing" ? (
                <button
                  onClick={() => onFinishSet(procSet.id)}
                  className="flex-1 bg-white border border-[#eaeaec] py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all hover:bg-[#f8f9fa] hover:border-[#212c46] flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                  style={{ color: config.color }}
                >
                  <Icons.CheckCircle size={12} /> FINISH SET
                </button>
              ) : (
                <div className="flex-1 border bg-[#f8f9fa] border-[#eaeaec] py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest text-[#7a8b95] flex items-center justify-center shadow-inner">
                  FINISHED
                </div>
              )}
              <button
                onClick={() => setQrData(procSet)}
                className="w-8 h-8 flex items-center justify-center bg-white border border-[#eaeaec] rounded-lg shadow-sm shrink-0 hover:bg-[#f8f9fa] transition-colors"
              >
                <Icons.QrCode size={14} className="text-[#a94228]" />
              </button>
            </div>
          </div>
        );
      })}
      {displaySets.length === 0 && (
        <div className="col-span-full py-16 text-center opacity-40 flex flex-col items-center">
          <Icons.Inbox size={40} className="mb-3 text-[#7a8b95]" />
          <p className="font-black uppercase tracking-widest text-[11px] text-[#7a8b95]">
            No active sets in this stage
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col flex-1 animate-fadeIn overflow-hidden bg-transparent">
      {qrData &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 bg-[#1d2636]/60 backdrop-blur-sm z-[5000] flex items-center justify-center p-4 animate-fadeIn"
            onClick={() => setQrData(null)}
          >
            <div
              className="bg-white rounded-xl p-8 text-center shadow-2xl relative w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setQrData(null)}
                className="absolute top-4 right-4 text-[#7a8b95] hover:text-[#a94228] transition-colors"
              >
                <Icons.X size={20} />
              </button>
              <h3 className="font-black mb-6 uppercase text-[#212c46] tracking-widest border-b border-[#eaeaec] pb-4">
                BATCH ID: {qrData.id}
              </h3>
              <div className="bg-[#f8f9fa] p-4 border border-[#eaeaec] rounded-xl flex shadow-inner mb-6 items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${qrData.id}`}
                  alt="QR"
                  className="mix-blend-multiply w-[200px] h-[200px] object-contain"
                />
              </div>
              <button
                onClick={() => setQrData(null)}
                className="w-full py-3 bg-[#212c46] text-white rounded-xl font-bold uppercase tracking-widest hover:bg-[#1a233a] transition-colors shadow-sm"
              >
                CLOSE
              </button>
            </div>
          </div>,
          document.body,
        )}

      {/* Board Sub-Header */}
      <div className="bg-white rounded-xl flex-1 flex flex-col shadow-sm mt-0 rounded-t-none border border-t-0 border-[#eaeaec] z-10 relative">
        <div
          className="px-5 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#eaeaec] shrink-0"
          style={{ backgroundColor: `${config.color}0A` }}
        >
          <h3
            className="font-black text-[13px] flex items-center gap-2 uppercase tracking-widest"
            style={{ color: config.color }}
          >
            <LucideIcon name={config.icon} size={16} />
            {config.label} PROCESS BOARD
          </h3>
          <div className="flex items-center gap-3">
            <select
               value={selectedMachineFilter}
               onChange={(e) => setSelectedMachineFilter(e.target.value)}
               className="bg-white border rounded-lg text-[10px] font-bold text-[#414757] uppercase tracking-widest outline-none py-1.5 px-3 min-w-[120px]"
            >
               <option value="All">All Machines</option>
               {MIXING_MACHINES.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
            </select>
            <label className="flex items-center gap-2 text-[10px] font-bold text-[#7a8b95] uppercase cursor-pointer">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
                className="rounded text-[#4d87a8] focus:ring-[#4d87a8] border-[#d7d7d7]"
              />
              Show Completed
            </label>
            <span className="text-[11px] font-black text-[#212c46] bg-white px-3 py-1.5 rounded-lg uppercase border border-[#eaeaec] shadow-sm whitespace-nowrap">
              {displaySets.length} ACTIVE SETS
            </span>
            <button
              onClick={onOpenPlanner}
              className="bg-[#212c46] hover:bg-[#1a233a] text-white py-1.5 px-3 rounded-lg font-bold text-[11px] uppercase tracking-widest shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Icons.Plus size={14} /> NEW MIXING
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col bg-white rounded-b-2xl">
          {activeStep === "cutting" ? (
            <div className="flex-1 flex flex-col md:flex-row">
              {/* Summary Side Box */}
              <div className="w-full md:w-64 bg-[#212c46] text-white flex flex-col p-6 relative overflow-hidden shrink-0 m-0 md:border-r border-[#eaeaec] rounded-bl-2xl">
                <div className="absolute -right-8 -bottom-8 text-white/5 transform rotate-12 transition-transform group-hover:scale-110 duration-700 pointer-events-none">
                  <Icons.Scissors size={180} />
                </div>
                <div className="relative z-10 flex flex-col h-full">
                  <h3 className="text-[11px] font-black uppercase text-[#7a8b95] mb-6 tracking-widest border-b border-white/10 pb-3">
                    TOTAL SFG TODAY
                  </h3>
                  <div className="flex flex-col gap-2 mb-8 md:items-center md:text-center text-left">
                    <span className="text-4xl md:text-5xl font-black font-mono text-white tracking-tighter">
                      {totalProduced.toLocaleString()}
                    </span>
                    <span className="text-[11px] font-bold text-[#7a8b95] uppercase tracking-widest">
                      FINISHED SETS
                    </span>
                  </div>

                  <div className="mt-auto pt-6 border-t border-white/10 w-full bg-black/20 backdrop-blur-sm rounded-xl py-4 px-4">
                    <div className="flex items-center justify-start md:justify-center gap-2 mb-3">
                      <Icons.Activity
                        size={14}
                        className="text-[#b7a159] animate-pulse"
                      />
                      <span className="text-[9px] font-black uppercase tracking-[0.15em] text-white">
                        CUTTING SIM SPEED
                      </span>
                    </div>
                    <div className="flex justify-center gap-1.5">
                      {[1, 10, 60].map((s) => (
                        <button
                          key={s}
                          onClick={() => setSimSpeed(s)}
                          className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all ${simSpeed === s ? "bg-[#b7a159] text-[#212c46] shadow-sm" : "bg-white/10 text-white/50 hover:bg-white/20"}`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid Area for Cutting */}
              <div className="flex-1 p-4 md:p-6 bg-[#f8f9fa] rounded-br-2xl border-t md:border-t-0 border-[#eaeaec] shadow-inner font-sans">
                {renderGrid()}
              </div>
            </div>
          ) : (
            /* Standard Full Width Grid */
            <div className="flex-1 p-4 md:p-6 bg-[#f8f9fa] rounded-b-2xl shadow-inner font-sans">
              {renderGrid()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SFGWaitingView = () => (
  <div className="bg-white rounded-xl border border-[#eaeaec] shadow-sm animate-fadeIn flex flex-col flex-1 min-h-0 min-w-0">
    <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#eaeaec] shrink-0">
      <h3 className="font-black text-[13px] text-[#212c46] flex items-center gap-2 uppercase tracking-widest">
        <LucideIcon name="package" size={18} className="text-[#a94228]" /> SFG
        WAITING FOR PACKING
      </h3>
      <button className="flex items-center gap-2 text-[10px] font-black text-[#7a8b95] uppercase tracking-widest hover:text-[#212c46] transition-colors bg-white px-3 py-1.5 rounded-lg border border-[#eaeaec] shadow-sm">
        <Icons.RefreshCcw size={14} /> Auto-refresh
      </button>
    </div>

    <div className="flex-1 overflow-auto custom-scrollbar bg-[#f8f9fa] shadow-inner rounded-b-2xl">
      <table className="w-full text-left min-w-[900px] border-collapse bg-white table-font">
        <thead className="sys-table-header [#eaeaec] sticky top-0 z-10 shadow-sm uppercase tracking-widest ">
                    <tr>
            <th className="pl-8 whitespace-nowrap font-black ">
              SFG Code
            </th>
            <th className="whitespace-nowrap font-black ">
              Product Name
            </th>
            <th className="whitespace-nowrap font-black ">
              Batch Set
            </th>
            <th className="whitespace-nowrap font-black ">Location</th>
            <th className="text-center whitespace-nowrap font-black ">
              Weight (Kg)
            </th>
            <th className="text-center whitespace-nowrap font-black ">
              Delay (Steam)
            </th>
            <th className="pr-8 text-center whitespace-nowrap font-black ">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white text-[12px]">
          {WAITING_SFG_DATA.map((item) => (
            <tr
              key={item.id}
              className="border-b border-[#eaeaec] hover:bg-[#f8f9fa] transition-colors"
            >
              <td className="px-4 pl-8 py-2.5">
                <span className="bg-[#a94228]/5 text-[#a94228] px-3 py-1 rounded-md border border-[#a94228]/20 font-mono text-[11px] font-black tracking-tight">
                  {item.code}
                </span>
              </td>
              <td className="px-4 font-bold text-[#212c46] py-2.5">
                {item.name}
              </td>
              <td className="px-4 py-2.5">
                <span className="bg-[#f8f9fa] text-[#7a8b95] px-2.5 py-0.5 rounded border border-[#eaeaec] font-mono text-[11px] font-bold">
                  {item.batchSet}
                </span>
              </td>
              <td className="px-4 font-bold text-[#7a8b95] font-mono py-2.5">
                {item.location}
              </td>
              <td className="px-4 text-center font-black text-[#212c46] font-mono py-2.5">
                {item.weight}
              </td>
              <td
                className={`py-3 px-6 text-center font-black font-mono ${item.isDelayed ? "text-[#a94228] animate-pulse" : "text-[#7a8b95]"}`}
              >
                {item.delay}
              </td>
              <td className="px-4 pr-8 text-center py-2.5">
                <span className="bg-[#b7a159]/10 text-[#b7a159] border border-[#b7a159]/20 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest shadow-sm">
                  Waiting
                </span>
              </td>
            </tr>
          ))}
          {WAITING_SFG_DATA.length === 0 && (
            <tr>
              <td className="text-center text-[#7a8b95] font-bold uppercase tracking-widest text-[12px] opacity-70 py-2.5 px-4"
              >
                No SFG Waiting
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const OverviewView = () => (
  <div className="animate-fadeIn flex flex-col flex-1 min-h-0 min-w-0">
    <div className="bg-white rounded-xl border border-[#eaeaec] shadow-sm flex-1 flex flex-col">
      <div className="p-5 flex items-center justify-start gap-3 border-b border-[#eaeaec] shrink-0">
        <Icons.Calendar size={18} className="text-[#a94228]" />
        <h3 className="font-black text-[13px] text-[#212c46] uppercase tracking-widest">
          Daily SFG Production Plan (Synced)
        </h3>
      </div>
      <div className="flex-1 overflow-auto custom-scrollbar bg-[#f8f9fa] shadow-inner rounded-b-2xl">
        <table className="w-full text-left min-w-[900px] border-collapse bg-white table-font">
          <thead className="sys-table-header [#eaeaec] sticky top-0 z-10 shadow-sm uppercase tracking-widest ">
                    <tr>
              <th className="pl-8 whitespace-nowrap font-black ">
                Job ID
              </th>
              <th className="whitespace-nowrap font-black ">
                SFG Name
              </th>
              <th className="whitespace-nowrap font-black ">Code</th>
              <th className="text-center whitespace-nowrap font-black ">
                Target
              </th>
              <th className="text-center whitespace-nowrap font-black ">
                Produced
              </th>
              <th className="text-center whitespace-nowrap font-black ">
                WIP
              </th>
              <th className="text-center w-40 whitespace-nowrap font-black ">
                Progress
              </th>
              <th className="pr-8 text-center whitespace-nowrap font-black ">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white text-[12px]">
            {OVERVIEW_PLANS.map((plan) => (
              <tr
                key={plan.id}
                className="border-b border-[#eaeaec] hover:bg-[#f8f9fa] transition-colors text-[12px]"
              >
                <td className="px-4 pl-8 font-black text-[#a94228] font-mono py-2.5">
                  {plan.id}
                </td>
                <td className="px-4 font-bold text-[#212c46] py-2.5">
                  {plan.name}
                </td>
                <td className="px-4 py-2.5">
                  <span className="bg-[#f8f9fa] text-[#7a8b95] px-2.5 py-0.5 rounded border border-[#eaeaec] font-mono text-[11px] font-bold">
                    {plan.code}
                  </span>
                </td>
                <td className="px-4 text-center font-black text-[#212c46] font-mono py-2.5">
                  {plan.target}
                </td>
                <td className="px-4 text-center font-black text-[#657f4d] font-mono py-2.5">
                  {plan.produced}
                </td>
                <td className="px-4 text-center font-black text-[#7a8b95] font-mono py-2.5">
                  {plan.wip}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-full bg-[#eaeaec] h-2 rounded-full overflow-hidden border border-[#eaeaec] shadow-inner">
                      <div
                        className="h-full bg-[#657f4d]"
                        style={{ width: `${plan.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-[11px] font-black text-[#7a8b95] font-mono">
                      {plan.progress}%
                    </span>
                  </div>
                </td>
                <td className="px-4 pr-8 text-center py-2.5">
                  <span className="bg-[#f8f9fa] text-[#7a8b95] border border-[#d7d7d7] px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest shadow-sm">
                    {plan.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// --- MAIN APP ---
export default function DailyBoard() {
  const [orders, setOrders, updateOrder] = useSharedOrders();
  const [activeTab, setActiveTab] = useState("mixing");
  const [activeView, setActiveView] = useState("execution");
  const [showGuide, setShowGuide] = useState(false);
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const [processSets, setProcessSets] = useState(INITIAL_SETS);

  const handleFinishSet = (setId: string) => {
    setProcessSets((prev) =>
      prev.map((s) =>
        s.id === setId ? { ...s, status: "Completed", timeLeft: 0 } : s,
      ),
    );
    if ((window as any).Swal)
      (window as any).Swal.fire({
        icon: "success",
        title: "Set Finished",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 1500,
      });
  };

  const handleStartSet = (setId: string) => {
    setProcessSets((prev) =>
      prev.map((s) =>
        s.id === setId ? { ...s, status: "Processing" } : s,
      ),
    );
  };

  return (
    <div className="w-full flex flex-col animate-fadeIn bg-transparent">
      <UserGuidePanel
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        title="USER GUIDE"
        subtitle="MIXING BOARD"
      >
        <GuideContent />
      </UserGuidePanel>
      <UserGuideButton onClick={() => setShowGuide(true)} />

      <PlannerModal
        isOpen={isPlannerOpen}
        onClose={() => setIsPlannerOpen(false)}
        onStart={(newSets: any) => {
          setProcessSets((prev) => [...newSets, ...prev]);
          setIsPlannerOpen(false);
        }}
      />

      {/* HEADER SECTION */}
      <div className="h-14 px-4 sm:px-8 flex flex-row items-center justify-between gap-4 z-20 shrink-0">
        <div className="flex items-center gap-5">
          <div className="relative flex items-center justify-center group cursor-default shrink-0">
            <div className="absolute inset-0 bg-[#3f809e] blur-[15px] opacity-20 rounded-full group-hover:opacity-60 transition-all duration-700"></div>
            <div className="relative z-10 p-1.5 border border-[#3f809e]/40 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm">
              <Icons.Activity
                size={28}
                strokeWidth={2.5}
                className="text-[#3f809e]"
              />
            </div>
          </div>
          <div>
            <h3
              className="font-black text-[#212c46] uppercase tracking-tighter leading-none font-exception-header"
              style={{ fontSize: "24px" }}
            >
              MIXING{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3f809e] to-[#b58c4f]">
                BOARD
              </span>
            </h3>
            <p className="text-[11px] font-bold text-[#4d5a44] uppercase tracking-[0.2em] mt-0.5 opacity-80 leading-none">
              Interactive Production Floor Board
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-white/50 p-1.5 rounded-xl border border-white/60 shadow-inner flex flex-wrap items-center gap-1">
            {[
              { id: "execution", label: "BATTER \u2192 SFG", icon: "layers" },
              { id: "waiting", label: "SFG WAITING", icon: "package" },
              { id: "overview", label: "OVERVIEW", icon: "layout-grid" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  activeView === tab.id
                    ? "bg-[#212c46] text-white shadow-md relative overflow-hidden"
                    : "text-[#7a8b95] hover:text-[#a94228]"
                }`}
              >
                <LucideIcon name={tab.icon} size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 sm:px-8 w-full mt-4 flex flex-col">
        {/* KPI STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 shrink-0">
          <KpiCard
            label="Total Daily Plan"
            value={120}
            desc="Batches"
            icon="clipboard-list"
            colorAccent={THEME.primaryLight}
            colorValue={THEME.primary}
          />
          <KpiCard
            label="Produced (Finished)"
            value={processSets.filter(s => s.status === "Completed").length + 45}
            desc="Batches"
            icon="check-circle"
            colorAccent={THEME.success}
            colorValue={THEME.success}
          />
          <KpiCard
            label="Work In Process"
            value={processSets.filter(s => s.status === "Processing").length}
            desc="Batches"
            icon="activity"
            colorAccent={THEME.skyBlue}
            colorValue={THEME.skyBlue}
          />
          <KpiCard
            label="Overall Progress"
            value={`${Math.round(((processSets.filter(s => s.status === "Completed").length + 45) / 120) * 100)}%`}
            desc="Completed"
            icon="pie-chart"
            colorAccent={THEME.brightGold}
            colorValue={THEME.brightGold}
          />
        </div>

        <main className="w-full flex flex-col flex-1 animate-fadeIn min-h-0">
          <div
            className={`flex flex-col flex-1 w-full ${activeView === "execution" ? "relative" : ""}`}
          >
            {activeView === "execution" && (
              <div className="bg-white p-4 lg:p-6 pb-1 border-x border-t border-[#eaeaec] rounded-t-2xl shrink-0 z-10 shadow-sm relative z-20">
                <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-1">
                  {Object.entries(STEP_CONFIG).map(([id, step]) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id)}
                      className={`flex-1 min-w-[140px] px-4 py-3.5 rounded-xl transition-all flex items-center justify-between group border relative overflow-hidden ${activeTab === id ? "shadow-md text-white border-transparent" : "bg-white hover:bg-[#f8f9fa] text-[#7a8b95] border-[#eaeaec]"}`}
                      style={
                        activeTab === id ? { backgroundColor: step.color } : {}
                      }
                    >
                      <div className="flex flex-col items-start leading-none gap-2 z-10">
                        <LucideIcon
                          name={step.icon}
                          size={18}
                          color={activeTab === id ? "white" : step.color}
                        />
                        <span className="text-[12px] font-black uppercase tracking-widest">
                          {step.label}
                        </span>
                      </div>
                      <span
                        className={`text-[12px] font-mono font-black px-2.5 py-1 rounded-lg z-10 shrink-0 ${activeTab === id ? "bg-white/20 text-white" : "bg-[#f8f9fa] text-[#7a8b95]"}`}
                      >
                        {processSets.filter((s) => s.step === id).length}
                      </span>
                      <div className="absolute -right-2 -bottom-2 opacity-[0.05] pointer-events-none group-hover:scale-110 transition-transform">
                        <LucideIcon
                          name={step.icon}
                          size={60}
                          color={activeTab === id ? "white" : step.color}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeView === "execution" ? (
              <BatchExecutionView
                processSets={processSets.filter((b) => b.step === activeTab)}
                activeStep={activeTab}
                onOpenPlanner={() => setIsPlannerOpen(true)}
                onFinishSet={handleFinishSet}
                onStartSet={handleStartSet}
              />
            ) : activeView === "waiting" ? (
              <SFGWaitingView />
            ) : (
              <OverviewView />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
