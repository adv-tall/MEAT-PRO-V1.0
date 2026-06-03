import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import * as Icons from "lucide-react";
import { UserGuidePanel } from "@/src/components/shared/UserGuidePanel";
import UserGuideButton from "@/src/components/shared/UserGuideButton";
import KpiCard from "../../components/shared/KpiCard";
import { useSharedOrders } from "@/src/store/ordersStore";
import { BatchQrTagModal } from "./BatchQrTagModal";
import Swal from "sweetalert2";

// --- Global Styles ---
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700;800&family=Noto+Sans+Thai:wght@300;400;500;600;700;800&display=swap');

  :root {
    --font-mixed: 'JetBrains Mono', 'Noto Sans Thai', sans-serif;
  }

  .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(46, 57, 95, 0.1); border-radius: 10px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(194, 45, 46, 0.5); }
  
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }

  @keyframes pulse-red {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; background-color: #ef4444; }
  }
  .animate-alarm {
    animation: pulse-red 1.5s infinite;
  }

  .shadow-card {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.02);
  }

  .status-inner-box { background: white; border-radius: 8px; border: 1px solid rgba(0,0,0,0.05); }

  .unified-container {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 0px; 
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.04);
  }
`;

// --- MOCK DATA GENERATOR ---
const generateMockDailyMonitor = () => {
  const items = [
    {
      id: "JO-2602-001",
      customer: "ARO (Makro)",
      name: "SMC ไส้กรอกไก่ ARO 125g",
      target: 200,
      time: "13:00",
      progress: 10,
      status: "IN PROGRESS",
      stages: [
        { step: "mixing", count: 150, color: "#55738D" },
        { step: "forming", count: 120, color: "#DCBC1B" },
        { step: "cooking", count: 90, color: "#C22D2E" },
        { step: "cooling", count: 85, color: "#90B7BF" },
        { step: "cutting", count: 80, color: "#BB8588" },
        { step: "packing", count: 50, color: "#2E395F" },
        { step: "wh", count: 20, color: "#537E72" },
      ],
    },
    {
      id: "JO-2602-002",
      customer: "Betagro",
      name: "BKP Chili Bologna",
      target: 50,
      time: "09:00",
      progress: 0,
      status: "IN PROGRESS",
      stages: [
        { step: "mixing", count: 50, color: "#537E72" },
        { step: "forming", count: 45, color: "#DCBC1B" },
        { step: "cooking", count: 40, color: "#C22D2E" },
        { step: "cooling", count: 0, color: "#E6E1DB" },
        { step: "cutting", count: 0, color: "#E6E1DB" },
        { step: "packing", count: 0, color: "#E6E1DB" },
        { step: "wh", count: 0, color: "#E6E1DB" },
      ],
    },
    {
      id: "JO-2602-003",
      customer: "Foodland",
      name: "Ham Slice 500g",
      target: 30,
      time: "08:30",
      progress: 0,
      status: "IN PROGRESS",
      stages: [
        { step: "mixing", count: 30, color: "#537E72" },
        { step: "forming", count: 30, color: "#537E72" },
        { step: "cooking", count: 30, color: "#537E72" },
        { step: "cooling", count: 30, color: "#537E72" },
        { step: "cutting", count: 30, color: "#537E72" },
        { step: "packing", count: 5, color: "#2E395F" },
        { step: "wh", count: 0, color: "#E6E1DB" },
      ],
    },
    {
      id: "JO-2602-004",
      customer: "Big C",
      name: "Cheese Sausage 4 inch",
      target: 80,
      time: "11:00",
      progress: 0,
      status: "IN PROGRESS",
      stages: [
        { step: "mixing", count: 80, color: "#537E72" },
        { step: "forming", count: 60, color: "#DCBC1B" },
        { step: "cooking", count: 0, color: "#E6E1DB" },
        { step: "cooling", count: 0, color: "#E6E1DB" },
        { step: "cutting", count: 0, color: "#E6E1DB" },
        { step: "packing", count: 0, color: "#E6E1DB" },
        { step: "wh", count: 0, color: "#E6E1DB" },
      ],
    },
    {
      id: "JO-2602-005",
      customer: "CJ Express",
      name: "ไส้กรอกแวมไพร์ AFM 500g",
      target: 40,
      time: "15:00",
      progress: 5,
      status: "DELAYED",
      stages: [
        { step: "mixing", count: 40, color: "#C22D2E" },
        { step: "forming", count: 2, color: "#DCBC1B" },
        { step: "cooking", count: 0, color: "#E6E1DB" },
        { step: "cooling", count: 0, color: "#E6E1DB" },
        { step: "cutting", count: 0, color: "#E6E1DB" },
        { step: "packing", count: 0, color: "#E6E1DB" },
        { step: "wh", count: 0, color: "#E6E1DB" },
      ],
    },
  ];

  const customers = ["CP All", "Lotus", "Tops", "MaxValu", "CJ Express"];
  const products = [
    "ไส้กรอกหมูรมควัน",
    "ลูกชิ้นเนื้อ",
    "ลูกชิ้นไก่ปิ้ง",
    "โบโลน่าหมูพริก",
    "แฮมสไลซ์",
    "ไก่ยอแผ่น",
    "ไส้กรอกชีสลาวา",
    "ไส้กรอกแดงจัมโบ้",
  ];

  // Generate 20 more items
  for (let i = 6; i <= 25; i++) {
    const target = Math.floor(Math.random() * 150) + 30;
    const progress = Math.floor(Math.random() * 100);
    let status = "IN PROGRESS";
    if (progress === 100) status = "COMPLETED";
    else if (Math.random() > 0.8) status = "DELAYED";

    const cMix = Math.min(target, Math.floor((target * (progress + 20)) / 100));
    const cFrm = Math.min(cMix, Math.floor((target * (progress + 15)) / 100));
    const cCok = Math.min(cFrm, Math.floor((target * (progress + 10)) / 100));
    const cCol = Math.min(cCok, Math.floor((target * (progress + 5)) / 100));
    const cCut = Math.min(cCol, Math.floor((target * progress) / 100));
    const cPak = Math.min(cCut, Math.floor((target * (progress - 5)) / 100));
    const cWh = Math.max(0, Math.floor((target * (progress - 10)) / 100));

    items.push({
      id: `JO-2602-${String(i).padStart(3, "0")}`,
      customer: customers[i % customers.length],
      name: `${products[i % products.length]} ${i % 2 === 0 ? "500g" : "1kg"}`,
      target: target,
      time: `${String(8 + (i % 8)).padStart(2, "0")}:00`,
      progress: progress,
      status: status,
      stages: [
        {
          step: "mixing",
          count: cMix,
          color: cMix > 0 ? "#55738D" : "#E6E1DB",
        },
        {
          step: "forming",
          count: cFrm,
          color: cFrm > 0 ? "#DCBC1B" : "#E6E1DB",
        },
        {
          step: "cooking",
          count: cCok,
          color: cCok > 0 ? "#C22D2E" : "#E6E1DB",
        },
        {
          step: "cooling",
          count: cCol,
          color: cCol > 0 ? "#90B7BF" : "#E6E1DB",
        },
        {
          step: "cutting",
          count: cCut,
          color: cCut > 0 ? "#BB8588" : "#E6E1DB",
        },
        {
          step: "packing",
          count: cPak,
          color: cPak > 0 ? "#2E395F" : "#E6E1DB",
        },
        { step: "wh", count: cWh, color: cWh > 0 ? "#537E72" : "#E6E1DB" },
      ],
    });
  }
  return items;
};

const MOCK_DAILY_MONITOR = generateMockDailyMonitor();

const MOCK_NOT_STARTED = [
  {
    id: "JOB-CHE-009",
    name: "SFG Cheese Sausage Lava",
    sku: "SFG-CHE-009",
    totalBatches: 50,
    priority: "Normal",
    plannedTime: "13:00",
  },
  {
    id: "JOB-MTB-002",
    name: "SFG Pork Meatball Grade A",
    sku: "SFG-MTB-002",
    totalBatches: 80,
    priority: "Urgent",
    plannedTime: "14:30",
  },
  {
    id: "JOB-SND-020",
    name: "SFG Sandwich Ham",
    sku: "SFG-SND-020",
    totalBatches: 30,
    priority: "Normal",
    plannedTime: "15:00",
  },
  {
    id: "JOB-CK-001",
    name: "SFG Chicken Sausage",
    sku: "SFG-CK-001",
    totalBatches: 120,
    priority: "Normal",
    plannedTime: "16:00",
  },
  {
    id: "JOB-BL-004",
    name: "SFG Pork Bologna",
    sku: "SFG-BL-004",
    totalBatches: 45,
    priority: "Normal",
    plannedTime: "16:30",
  },
];

const MOCK_PACKING_QUEUE = [
  {
    id: "JOB-SMC-002",
    name: "ไส้กรอกไก่จัมโบ้ ARO 1kg",
    sku: "FG-1001",
    readyToPack: 45,
    packed: 10,
    totalBatches: 100,
  },
  {
    id: "JOB-CHE-001",
    name: "ไส้กรอกชีสลาวา 500g",
    sku: "FG-5001",
    readyToPack: 20,
    packed: 0,
    totalBatches: 50,
  },
  {
    id: "JOB-BOL-001",
    name: "โบโลน่าพริก CP 1kg",
    sku: "FG-4001",
    readyToPack: 15,
    packed: 15,
    totalBatches: 60,
  },
  {
    id: "JOB-MB-003",
    name: "ลูกชิ้นเนื้อ MaxValu 500g",
    sku: "FG-3005",
    readyToPack: 30,
    packed: 20,
    totalBatches: 80,
  },
  {
    id: "JOB-HM-001",
    name: "แฮมสไลซ์ 200g",
    sku: "FG-4008",
    readyToPack: 10,
    packed: 5,
    totalBatches: 40,
  },
];

const MOCK_COMPLETED = [
  {
    id: "JOB-MTB-001",
    name: "ลูกชิ้นหมู ARO 1kg",
    sku: "FG-3001",
    totalBatches: 120,
    lastUpdated: "10:45 AM",
    transferRef: "TRF-260416-01",
  },
  {
    id: "JOB-SMC-000",
    name: "ไส้กรอกคอกเทล ARO 1kg",
    sku: "FG-2001",
    totalBatches: 80,
    lastUpdated: "09:30 AM",
    transferRef: "TRF-260416-02",
  },
  {
    id: "JOB-BOL-002",
    name: "โบโลน่าหมูพริก 500g",
    sku: "FG-4003",
    totalBatches: 60,
    lastUpdated: "11:15 AM",
    transferRef: "TRF-260416-03",
  },
];

// --- HELPER COMPONENTS ---
const kebabToPascal = (str: string) =>
  str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
const LucideIcon = ({
  name,
  size = 16,
  className = "",
  color,
  style,
}: {
  name: string;
  size?: number;
  className?: string;
  color?: string;
  style?: any;
}) => {
  if (!name) return null;
  const pascalName = kebabToPascal(name);
  const IconComponent =
    (Icons as any)[pascalName] ||
    (Icons as any)[`${pascalName}Icon`] ||
    Icons.CircleHelp;
  if (!IconComponent) return null;
  return (
    <IconComponent
      size={size}
      className={className}
      style={{ ...style, color: color }}
      strokeWidth={2.2}
    />
  );
};



// --- MAIN APPLICATION ---
export default function ProductionTracking() {
  const [activeTab, setActiveTab] = useState("daily");
  const [showGuide, setShowGuide] = useState(false);

  // QR Scanner / Tag Modal States
  const [selectedTagOrder, setSelectedTagOrder] = useState<any | null>(null);

  // Daily Monitor Filter & Search States
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchDaily, setSearchDaily] = useState("");
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // Derived filtered data for Daily Monitor
  const [orders, , updateOrder] = useSharedOrders();
  const trackItems = useMemo(() => {
    return orders.map((o: any) => {
      const target = o.qty;
      const progressOverride = o.status === 'COMPLETED' ? 100 : (o.status === 'PLANNED' ? 0 : null);
      
      const mixVal = o.mixingCount !== undefined ? o.mixingCount : (o.status === 'COMPLETED' ? target : (o.status === 'PLANNED' ? 0 : Math.floor(target * 0.9)));
      const formVal = o.formingCount !== undefined ? o.formingCount : (o.status === 'COMPLETED' ? target : (o.status === 'PLANNED' ? 0 : Math.floor(target * 0.7)));
      const cookVal = o.cookingCount !== undefined ? o.cookingCount : (o.status === 'COMPLETED' ? target : (o.status === 'PLANNED' ? 0 : Math.floor(target * 0.5)));
      const coolVal = o.coolingCount !== undefined ? o.coolingCount : (o.status === 'COMPLETED' ? target : (o.status === 'PLANNED' ? 0 : Math.floor(target * 0.4)));
      const cutVal = o.cuttingCount !== undefined ? o.cuttingCount : (o.status === 'COMPLETED' ? target : (o.status === 'PLANNED' ? 0 : Math.floor(target * 0.3)));
      const packVal = o.packingCount !== undefined ? o.packingCount : (o.status === 'COMPLETED' ? target : 0);
      const whVal = o.whCount !== undefined ? o.whCount : 0;

      const sumVal = mixVal + formVal + cookVal + coolVal + cutVal + packVal + whVal;
      const calculatedProgress = target > 0 ? Math.round((sumVal / (target * 7)) * 100) : 0;
      const progress = progressOverride !== null ? progressOverride : Math.min(99, calculatedProgress);

      return {
        id: o.id,
        sku: o.sku || o.id,
        customer: o.shift ? `${o.shift} Shift` : "Standard",
        name: o.name,
        target: target,
        time: o.deadline,
        progress: progress,
        status: o.status,
        stages: [
          { step: "mixing", count: mixVal, color: "#537E72" },
          { step: "forming", count: formVal, color: "#DCBC1B" },
          { step: "cooking", count: cookVal, color: "#C22D2E" },
          { step: "cooling", count: coolVal, color: "#90B7BF" },
          { step: "cutting", count: cutVal, color: "#BB8588" },
          { step: "packing", count: packVal, color: "#2E395F" },
          { step: "wh", count: whVal, color: "#537E72" }
        ],
        // Save current counts for label print visualization
        mixingCount: mixVal,
        formingCount: formVal,
        cookingCount: cookVal,
        coolingCount: coolVal,
        cuttingCount: cutVal,
        packingCount: packVal,
        whCount: whVal
      };
    });
  }, [orders]);

  const handleSimulateScan = (id: string) => {
    setSelectedTagOrder(null); // Close traveler tag sticker
    Swal.fire({
      title: 'ต้องการเข้าหัวสแกนด่านผลิต!',
      html: `
        <div class="text-left text-xs space-y-2 p-1">
          <p class="font-bold text-[#a94228]">⚠️ หน้าสแกนย้ายไปสถานีด่านจริงแล้ว!</p>
          <p class="text-slate-600 leading-normal">
            หน้าบอร์ดนี้เป็นแดชบอร์ดสรุปผลกรุ๊ปรวม <strong>(Production Tracking Room)</strong> เท่านั้น 
            การสแกนความคืบหน้าของสินค้าล็อต <strong>${id}</strong> กรุณาใช้ปุ่ม <strong>"SCAN BATCH QR"</strong> บนหน้า 
            <span class="text-[#212c46] font-bold">MIXING BOARD (จุดสแกนส่วนผสม)</span> หรือ 
            <span class="text-[#212c46] font-bold">PACKING BOARD (จุดสแกนบรรจุห่อสำเร็จ)</span>
          </p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'ตกลง (รับทราบ)',
      confirmButtonColor: '#212c46'
    });
  };

  const filteredDailyMonitor = useMemo(() => {
    return trackItems.filter((item: any) => {
      const matchStatus =
        filterStatus === "ALL" || item.status === filterStatus;
      const matchSearch =
        item.name.toLowerCase().includes(searchDaily.toLowerCase()) ||
        item.id.toLowerCase().includes(searchDaily.toLowerCase()) ||
        item.customer.toLowerCase().includes(searchDaily.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [trackItems, filterStatus, searchDaily]);

  const activeStatuses = ["ALL", "IN PROGRESS", "DELAYED", "COMPLETED"];
  const [pendingIAReplans] = useState([
    {
      id: "IA-RP-001",
      product: "Pork Meatball",
      lossKg: 20,
      refPrb: "PRB-002",
      status: "Pending Approval",
    },
  ]);

  return (
    <>
      <style>{globalStyles}</style>
      <div className="flex flex-1 w-full flex-col animate-fadeIn bg-transparent space-y-4">
        <UserGuidePanel
          isOpen={showGuide}
          onClose={() => setShowGuide(false)}
          title="TRACKING GUIDE"
          subtitle="REAL-TIME MONITORING"
        >
          <div className="space-y-8">
              <div>
                  <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                      <Icons.Database size={16} className="text-[#3f809e]" /> 1. การเชื่อมโยงข้อมูล (DATA SYNC)
                  </h3>
                  <p className="mb-4 text-[#414757]">
                      รายการสินค้าที่ต้องผลิตทั้งหมดในบอร์ดนี้ จะถูกซิงค์ (Sync) มาจากหน้า <span className="font-bold text-[#d55a6d]">Production Planning</span> แบบอัตโนมัติ เพื่อให้ฝ่ายผลิตและฝ่ายวางแผนเห็นเป้าหมายที่ตรงกัน
                  </p>
                  <div className="space-y-3">
                      <div className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#3f809e] mt-1.5 shrink-0"></div>
                          <div className="text-[#414757]"><span className="font-bold text-[#212c46]">DAILY MONITOR:</span> แสดงภาพรวมของออเดอร์ที่กำลังดำเนินการ (Active Orders) แยกตามสถานะในแต่ละ Stage พร้อมตารางสรุป Progress รูปแบบ Real-Time (สามารถใช้ตัวกรอง Status Filter เพื่อดูเฉพาะงานที่เสร็จแล้ว หรือล่าช้าได้)</div>
                      </div>
                      <div className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#b58c4f] mt-1.5 shrink-0"></div>
                          <div className="text-[#414757]"><span className="font-bold text-[#212c46]">PACKING QUEUE:</span> คิวงานคอขวดสำหรับแผนกบรรจุ โดยแสดงจำนวนสินค้าที่ผ่านขั้นตอน Cutting/Peeling มาแล้ว และ <span className="font-bold text-[#b58c4f]">Ready to Pack</span> รอดำเนินการแพ็คลงซอง</div>
                      </div>
                      <div className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#7a8b95] mt-1.5 shrink-0"></div>
                          <div className="text-[#414757]"><span className="font-bold text-[#212c46]">NOT STARTED:</span> ออเดอร์ที่ได้รับแผนมาแล้ว แต่ยังไม่ได้เริ่มลงมือผลิตในขั้นตอนแรก (คิวงานที่รอเข้า Mixing)</div>
                      </div>
                      <div className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#688a58] mt-1.5 shrink-0"></div>
                          <div className="text-[#414757]"><span className="font-bold text-[#212c46]">COMPLETED:</span> ตารางสรุปออเดอร์ที่ผลิตเสร็จสิ้น <span className="text-[#688a58] font-bold">100%</span> และถูกโอนย้ายเข้าคลังสินค้า (FG Transfer) เรียบร้อยแล้ว</div>
                      </div>
                  </div>
              </div>
          </div>
        </UserGuidePanel>
        <UserGuideButton onClick={() => setShowGuide(true)} />

        {/* HEADER SECTION */}
        <div className="h-14 px-4 sm:px-8 flex flex-row items-center justify-between gap-4 z-20 shrink-0">
          <div className="flex items-center gap-5">
            <div className="relative flex items-center justify-center group cursor-default shrink-0">
              <div className="absolute inset-0 bg-[#b7a159] blur-[15px] opacity-20 rounded-full group-hover:opacity-60 transition-all duration-700"></div>
              <div className="relative z-10 p-1.5 border border-[#b7a159]/40 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm">
                <Icons.Activity
                  size={28}
                  strokeWidth={2.5}
                  className="text-[#b7a159]"
                />
              </div>
            </div>
            <div>
              <h3
                className="font-black text-[#212c46] uppercase tracking-tighter leading-none font-exception-header"
                style={{ fontSize: "24px" }}
              >
                PRODUCTION{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#b7a159] to-[#932c2e]">
                  TRACKING
                </span>
              </h3>
              <p className="text-[11px] font-bold text-[#4d5a44] uppercase tracking-[0.2em] mt-0.5 opacity-80 leading-none">
                <span className="w-1.5 h-1.5 rounded-full bg-[#932c2e] inline-block mr-1.5 animate-pulse"></span>
                REAL-TIME FLOOR MONITORING
              </p>
            </div>
          </div>

          {/* Main Nav */}
          <div className="flex items-center gap-4">
            <div className="bg-white/50 p-1.5 rounded-xl border border-white/60 shadow-inner flex flex-wrap items-center gap-1">
              {[
                {
                  id: "daily",
                  label: "DAILY MONITOR",
                  icon: "LayoutDashboard",
                },
                {
                  id: "packing",
                  label: "PACKING QUEUE",
                  icon: "PackageOpen",
                },
                { id: "not_started", label: "NOT STARTED", icon: "Clock" },
                { id: "completed", label: "COMPLETED", icon: "Archive" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                    activeTab === t.id
                      ? "bg-[#212c46] text-white shadow-md relative overflow-hidden"
                      : "text-[#7a8b95] hover:text-[#a94228]"
                  }`}
                >
                  <LucideIcon name={t.icon} size={16} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto px-4 sm:px-8 w-full mt-[2px]">
          <main className="w-full flex flex-col animate-fadeIn min-h-0">
            {pendingIAReplans.length > 0 && (
              <div className="bg-[#a94228]/5 border border-[#a94228]/20 p-4 rounded-xl shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm animate-fadeIn mb-3">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#a94228]/10 flex items-center justify-center text-[#a94228] shrink-0">
                    <Icons.Bot size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-[#a94228] text-[13px] flex items-center gap-2 uppercase tracking-widest">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#a94228] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#a94228]"></span>
                      </span>
                      IA GENERATOR ALERT
                    </h3>
                    <p className="text-[12px] text-[#a94228]/80 font-medium mt-1">
                      There are {pendingIAReplans.length} replacement requests
                      waiting to be approved in{" "}
                      <strong className="font-bold uppercase tracking-widest px-1">
                        Production Planning
                      </strong>
                      .
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0 mb-3">
              <KpiCard
                title="Total Planned"
                value="920"
                subLabel="OUTPUT BATCHES"
                colorAccent="#b7a159"
                icon={Icons.Target}
              />
              <KpiCard
                title="Pending Start"
                value="1"
                subLabel="WAITING ORDERS"
                colorAccent="#7a8b95"
                icon={Icons.Clock}
              />
              <KpiCard
                title="In Progress"
                value="6"
                subLabel="LINE ACTIVE"
                colorAccent="#4d87a8"
                icon={Icons.Activity}
              />
              <KpiCard
                title="Total WIP"
                value="195"
                subLabel="WAIT PACKING"
                colorAccent="#a94228"
                icon={Icons.Layers}
              />
            </div>

            {/* CONTENT VIEWS */}
            <div className="flex flex-col flex-1 min-h-0 bg-transparent">
              {/* 1. DAILY MONITOR VIEW */}
              {activeTab === "daily" && (
                <div className="bg-white rounded-xl shadow-sm border border-[#eaeaec] overflow-hidden flex flex-col flex-1 min-h-0 animate-fadeIn relative">
                  {/* Toolbar */}
                  <div className="px-6 py-4 border-b border-[#eaeaec] flex justify-between items-center bg-[#f8f9fa] shrink-0">
                    <div className="flex items-center gap-3 relative">
                      <button
                        onClick={() =>
                          setIsStatusDropdownOpen(!isStatusDropdownOpen)
                        }
                        className="flex items-center gap-2 bg-white border border-[#eaeaec] px-4 py-2.5 rounded-xl shadow-sm text-[11px] font-black text-[#4d87a8] uppercase tracking-widest hover:border-[#212c46] hover:text-[#212c46] transition-all"
                      >
                        STATUS |{" "}
                        <span className="text-[#212c46] ml-1">
                          {filterStatus}
                        </span>
                        <span className="text-[#a94228] ml-1 bg-[#a94228]/10 px-1.5 py-0.5 rounded-md border border-[#a94228]/20 leading-none">
                          {filterStatus === "ALL"
                            ? trackItems.length
                            : trackItems.filter(
                                (x: any) => x.status === filterStatus,
                              ).length}
                        </span>
                        <Icons.ChevronDown
                          size={14}
                          className="text-[#7a8b95] ml-2"
                        />
                      </button>

                      {isStatusDropdownOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={() => setIsStatusDropdownOpen(false)}
                          ></div>
                          <div className="absolute top-full left-0 mt-2 w-[220px] bg-white border border-[#eaeaec] shadow-xl rounded-xl p-2 z-40">
                            {activeStatuses.map((st) => (
                              <button
                                key={st}
                                onClick={() => {
                                  setFilterStatus(st);
                                  setIsStatusDropdownOpen(false);
                                }}
                                className="w-full text-left px-4 py-2.5 rounded-lg hover:bg-[#f8f9fa] hover:text-[#212c46] text-[11px] font-black text-[#7a8b95] uppercase tracking-widest transition-colors flex justify-between items-center"
                              >
                                {st}
                                {filterStatus === st && (
                                  <Icons.Check
                                    size={14}
                                    className="text-[#a94228]"
                                  />
                                )}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    <div className="relative w-72 hidden md:block">
                      <Icons.Search
                        size={16}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a8b95]"
                      />
                      <input
                        type="text"
                        placeholder="Search Active Order..."
                        value={searchDaily}
                        onChange={(e) => setSearchDaily(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 text-[12px] font-bold text-[#212c46] bg-white border border-[#eaeaec] rounded-xl outline-none focus:border-[#212c46] focus:ring-1 focus:ring-[#212c46] transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Main Table */}
                  <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[1100px] table-font">
                      <thead className="sys-table-header sticky top-0 z-20 ">
                    <tr className="bg-[#212c46] text-white">
                          <th className="pl-8  font-black uppercase tracking-widest w-[25%] min-w-[280px]">
                            ORDER / PRODUCT INFO
                          </th>
                          <th className="text-center w-[9.7%]  ">
                            <Icons.ChefHat
                              size={16}
                              className="mx-auto opacity-70"
                              title="Mixing"
                            />
                          </th>
                          <th className="text-center w-[9.7%]  ">
                            <Icons.Disc
                              size={16}
                              className="mx-auto opacity-70"
                              title="Forming"
                            />
                          </th>
                          <th className="text-center w-[9.7%]  ">
                            <Icons.Flame
                              size={16}
                              className="mx-auto opacity-70"
                              title="Cooking"
                            />
                          </th>
                          <th className="text-center w-[9.7%]  ">
                            <Icons.Snowflake
                              size={16}
                              className="mx-auto opacity-70"
                              title="Cooling"
                            />
                          </th>
                          <th className="text-center w-[9.7%]  ">
                            <Icons.Scissors
                              size={16}
                              className="mx-auto opacity-70"
                              title="Cutting"
                            />
                          </th>
                          <th className="text-center w-[9.7%]  ">
                            <Icons.Package
                              size={16}
                              className="mx-auto opacity-70"
                              title="Packing"
                            />
                          </th>
                          <th className="text-center w-[9.7%]  ">
                            <Icons.Truck
                              size={16}
                              className="mx-auto opacity-70"
                              title="Warehouse"
                            />
                          </th>
                          <th className="pr-8 text-right w-[10%]  font-black uppercase tracking-widest">
                            PROGRESS
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {filteredDailyMonitor.map((item, idx) => (
                          <tr
                            key={idx}
                            className="border-b border-[#eaeaec] hover:bg-[#f8f9fa] transition-colors"
                          >
                            {/* Order Info */}
                            <td className="px-4 pl-8 border-r border-[#eaeaec]/40 h-[70px] py-2.5">
                               <div className="flex justify-between items-center mb-1.5 gap-2">
                                <span className="bg-white border border-[#eaeaec] text-[#4d87a8] font-mono font-black text-[10px] px-2 py-0.5 rounded-md shadow-sm leading-none">
                                  {item.id}
                                </span>
                                <div className="flex items-center gap-1.5 select-none text-[9px]">
                                  <button
                                    onClick={() => setSelectedTagOrder(item)}
                                    className="text-[#2c6e49] bg-[#d8f3dc] hover:bg-[#b7e4c7] border border-[#2c6e49]/20 px-1.5 py-0.5 rounded-lg flex items-center gap-0.5 cursor-pointer font-black uppercase transition-all shadow-sm active:scale-95"
                                    title="เปิดดูและพิมพ์บัตรคิวอาร์บาร์โค้ดประจำรุ่น (Print/Visualize QR Tag)"
                                  >
                                    <Icons.QrCode size={10} /> QR LABEL
                                  </button>
                                  <span className="text-[#a94228] bg-[#a94228]/5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-[1px] border border-[#a94228]/10">
                                    <Icons.User size={10} /> {item.customer}
                                  </span>
                                </div>
                              </div>
                              <h4 className="font-bold text-[#212c46] text-[12px] mb-1.5 truncate max-w-[220px] leading-tight mt-1">
                                {item.name}
                              </h4>
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-mono font-black text-[#7a8b95] flex items-center gap-[1px] leading-none">
                                  <Icons.Target
                                    size={12}
                                    className="text-[#b7a159]"
                                  />{" "}
                                  {item.target} Batches
                                </span>
                                <span className="bg-[#f8f9fa] border border-[#eaeaec] text-[#7a8b95] font-mono font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-[1px] leading-none">
                                  <Icons.Clock size={10} /> {item.time}
                                </span>
                              </div>
                            </td>

                            {/* Stages */}
                            {item.stages.map((stage, sIdx) => (
                              <td className="px-3 align-middle border-r border-[#eaeaec]/40 py-2.5 px-4"
                              >
                                <div className="flex flex-col items-center justify-center gap-[1px] w-full mx-auto">
                                  <span
                                    className={`font-mono font-black text-[12px] leading-none ${stage.count > 0 ? "text-[#212c46]" : "text-[#7a8b95]/50"}`}
                                  >
                                    {stage.count}
                                  </span>
                                  <div className="w-full h-1.5 bg-[#f8f9fa] rounded-full overflow-hidden border border-[#eaeaec]/50 shadow-inner">
                                    <div
                                      className="h-full rounded-full transition-all duration-1000"
                                      style={{
                                        width: `${(stage.count / item.target) * 100}%`,
                                        backgroundColor:
                                          stage.count === 0
                                            ? "transparent"
                                            : sIdx === 0
                                              ? "#4d87a8"
                                              : sIdx === 1
                                                ? "#b7a159"
                                                : sIdx === 2
                                                  ? "#a94228"
                                                  : sIdx === 3
                                                    ? "#55738D"
                                                    : sIdx === 4
                                                      ? "#BB8588"
                                                      : sIdx === 5
                                                        ? "#212c46"
                                                        : "#2e7d32",
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              </td>
                            ))}

                            {/* Progress Circular */}
                            <td className="px-4 pr-8 align-middle text-right relative z-0 py-2.5">
                              <div className="relative w-10 h-10 ml-auto flex items-center justify-center bg-white rounded-full shadow-sm border border-[#eaeaec]">
                                <svg
                                  className="w-full h-full transform -rotate-90 drop-shadow-sm p-0.5"
                                  viewBox="0 0 36 36"
                                >
                                  <circle
                                    cx="18"
                                    cy="18"
                                    r="15"
                                    fill="transparent"
                                    stroke="#f8f9fa"
                                    strokeWidth="3"
                                  />
                                  <circle
                                    cx="18"
                                    cy="18"
                                    r="15"
                                    fill="transparent"
                                    stroke={
                                      item.progress > 0
                                        ? item.progress === 100
                                          ? "#2e7d32"
                                          : "#b7a159"
                                        : "transparent"
                                    }
                                    strokeWidth="3"
                                    strokeDasharray="94.2"
                                    strokeDashoffset={
                                      94.2 - (94.2 * item.progress) / 100
                                    }
                                    strokeLinecap="round"
                                    className="transition-all duration-1000"
                                  />
                                </svg>
                                <span className="absolute text-[9px] font-mono font-black text-[#212c46]">
                                  {item.progress}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredDailyMonitor.length === 0 && (
                          <tr>
                            <td className="text-center text-[#7a8b95] font-black uppercase tracking-widest text-[12px] opacity-50 py-2.5 px-4"
                            >
                              No active orders match the criteria
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 2. PACKING QUEUE VIEW */}
              {activeTab === "packing" && (
                <div className="flex-1 overflow-y-auto custom-scrollbar pb-6 animate-fadeIn">
                  <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                    {MOCK_PACKING_QUEUE.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white border-l-4 border-[#eaeaec] border-l-[#b7a159] p-2 rounded-lg relative group transition-all hover:shadow-md flex flex-col h-full shadow-sm"
                      >
                        <div className="flex justify-between items-center mb-1 gap-1 border-b border-[#eaeaec] pb-1">
                          <span className="text-[10px] font-black text-[#212c46] font-mono uppercase truncate">
                            {item.id}
                          </span>
                          <span className="text-[8px] text-[#b7a159] px-1.5 py-0.5 rounded border border-[#b7a159]/30 font-black uppercase tracking-widest bg-[#b7a159]/10">
                            Ready
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 mb-1.5 overflow-hidden" title={`${item.name} | ${item.sku}`}>
                          <h4 className="font-bold text-[#212c46] text-[10px] leading-none truncate shrink">
                            {item.name}
                          </h4>
                          <p className="text-[8px] text-[#7a8b95] font-mono shrink-0 leading-none">
                            • {item.sku}
                          </p>
                        </div>

                        <div className="bg-[#f8f9fa] rounded p-1 mb-1 border border-[#eaeaec] flex justify-between items-center mt-auto">
                          <div className="flex items-center gap-1.5 text-[9px] font-bold text-[#7a8b95] uppercase tracking-widest">
                            Ready: <span className="text-[11px] font-black text-[#b7a159] font-mono">{item.readyToPack}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[9px] font-bold text-[#7a8b95] uppercase tracking-widest border-l border-[#eaeaec] pl-1.5">
                            Packed: <span className="text-[11px] font-black text-black font-mono">{item.packed}</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-[8px] font-bold text-[#7a8b95] uppercase tracking-widest px-1 border-t-[1.5px] border-dashed border-[#eaeaec] pt-1">
                          <span>
                            Target: <span className="font-mono text-[#212c46]">{item.totalBatches}</span>
                          </span>
                          <span className="text-[#a94228] font-black font-mono text-[9px]">
                            {Math.round((item.packed / item.totalBatches) * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                    {MOCK_PACKING_QUEUE.length === 0 && (
                      <div className="col-span-full py-16 text-center opacity-30 text-[#7a8b95]">
                        <Icons.Inbox size={40} className="mx-auto mb-2" />
                        <p className="font-black uppercase tracking-widest text-[11px]">
                          No items in packing queue
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 3. NOT STARTED VIEW */}
              {activeTab === "not_started" && (
                <div className="flex-1 overflow-y-auto custom-scrollbar pb-6 animate-fadeIn">
                  <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                    {MOCK_NOT_STARTED.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white border-l-4 border-[#eaeaec] border-l-[#7a8b95] p-2 rounded-lg relative group transition-all hover:shadow-md flex flex-col h-full shadow-sm"
                      >
                        <div className="flex justify-between items-center mb-1 gap-1 border-b border-[#eaeaec] pb-1">
                          <span className="text-[10px] font-black text-[#212c46] font-mono uppercase truncate">
                            {item.id}
                          </span>
                          <span
                            className={`text-[8px] px-1.5 py-0.5 rounded border font-black uppercase tracking-widest whitespace-nowrap ${item.priority === "Urgent" ? "text-[#a94228] border-[#a94228]/30 bg-[#a94228]/10" : "text-[#7a8b95] border-[#eaeaec] bg-[#f8f9fa]"}`}
                          >
                            Pending
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 mb-1.5 overflow-hidden" title={`${item.name} | ${item.sku}`}>
                          <h4 className="font-bold text-[#212c46] text-[10px] leading-none truncate shrink">
                            {item.name}
                          </h4>
                          <p className="text-[8px] text-[#7a8b95] font-mono shrink-0 leading-none">
                            • {item.sku}
                          </p>
                        </div>

                        <div className="bg-[#f8f9fa] rounded p-1 flex justify-between items-center border border-[#eaeaec] mt-auto">
                          <div className="flex items-center gap-1 text-[8px] font-bold text-[#7a8b95] uppercase tracking-widest">
                            Target: <span className="font-mono font-black text-[#212c46] text-[10px]">{item.totalBatches} bts</span>
                          </div>
                          <div className="flex items-center gap-1 text-[8px] font-bold text-[#7a8b95] uppercase tracking-widest border-l border-[#eaeaec] pl-1">
                            Planned: <span className="font-mono font-black text-[#a94228] text-[10px] flex items-center gap-0.5"><Icons.Clock size={8} /> {item.plannedTime}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. COMPLETED VIEW */}
              {activeTab === "completed" && (
                <div className="flex-1 overflow-y-auto custom-scrollbar pb-6 animate-fadeIn">
                  <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                    {MOCK_COMPLETED.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white border-l-4 border-[#eaeaec] border-l-[#2e7d32] p-2 rounded-lg relative group transition-all hover:shadow-md flex flex-col h-full shadow-sm"
                      >
                        <div className="flex justify-between items-center mb-1 gap-1 border-b border-[#eaeaec] pb-1">
                          <span className="text-[10px] font-black text-[#212c46] font-mono uppercase truncate">
                            {item.id}
                          </span>
                          <span className="text-[8px] text-[#2e7d32] px-1.5 py-0.5 rounded border border-[#2e7d32]/30 font-black uppercase tracking-widest bg-[#2e7d32]/10">
                            Finished
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 mb-1.5 overflow-hidden" title={`${item.name} | ${item.sku}`}>
                          <h4 className="font-bold text-[#212c46] text-[10px] leading-none truncate shrink">
                            {item.name}
                          </h4>
                          <p className="text-[8px] text-[#7a8b95] font-mono shrink-0 leading-none">
                            • {item.sku}
                          </p>
                        </div>

                        <div className="bg-[#f8f9fa] rounded p-1 flex justify-between items-center border border-[#eaeaec] mt-auto">
                          <div className="flex items-center gap-1 text-[8px] font-bold text-[#7a8b95] uppercase tracking-widest">
                            <Icons.PackageCheck size={10} className="text-[#2e7d32]" />
                            Out: <span className="font-mono font-black text-[#212c46] text-[10px]">{item.totalBatches} bts</span>
                          </div>
                          <div className="flex items-center gap-1 text-[8px] font-bold text-[#7a8b95] uppercase tracking-widest border-l border-[#eaeaec] pl-1 text-right">
                            <Icons.Clock size={8} /> <span className="font-mono text-[#a94228] font-black">{item.lastUpdated}</span>
                          </div>
                        </div>

                        <div className="flex gap-1.5 mt-1 border-t border-[#eaeaec] pt-1.5">
                          <button
                            className="flex-1 bg-white border border-[#eaeaec] py-1 rounded text-[8px] font-black uppercase tracking-widest hover:border-[#212c46] hover:text-[#212c46] text-[#4d87a8] transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95"
                            title="Summary"
                          >
                            <Icons.FileText size={10} /> Summary
                          </button>
                        </div>
                      </div>
                    ))}
                    {MOCK_COMPLETED.length === 0 && (
                      <div className="col-span-full py-16 text-center opacity-30 text-[#7a8b95]">
                        <Icons.Archive size={40} className="mx-auto mb-2" />
                        <p className="font-black uppercase tracking-widest text-[11px]">
                          No completed items yet
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Modals for QR Tag card and Live Cam Scanner */}
      <BatchQrTagModal
        isOpen={selectedTagOrder !== null}
        onClose={() => setSelectedTagOrder(null)}
        order={selectedTagOrder}
        onSimulateScan={handleSimulateScan}
      />
    </>
  );
}
