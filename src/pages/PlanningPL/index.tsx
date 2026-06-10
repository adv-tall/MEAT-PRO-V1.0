import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import * as Icons from "lucide-react";
import { UserGuidePanel } from "@/src/components/shared/UserGuidePanel";
import UserGuideButton from "@/src/components/shared/UserGuideButton";
import { DraggableModal } from "@/src/components/shared/DraggableModal";
import { CsvUpload } from "@/src/components/shared/CsvUpload";
import { CsvExport } from "@/src/components/shared/CsvExport";
import { PdfPrint } from "@/src/components/shared/PdfPrint";
import KpiCard from "../../components/shared/KpiCard";
import { useCollection } from "@/src/services/useFirestore";
import { FG_DATABASE } from "@/src/data/mockOrders";
import { useMachineAlert } from "../../hooks/useMachineAlert";

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700;800&family=Noto+Sans+Thai:wght@300;400;500;600;700;800&display=swap');
  
  :root {
    --font-mixed: 'JetBrains Mono', 'Noto Sans Thai', sans-serif;
  }
  
  .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(33, 44, 70, 0.1); border-radius: 10px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(147, 44, 46, 0.5); }
  
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
  .font-exception-header { font-family: 'JetBrains Mono', 'Noto Sans Thai', sans-serif; }
`;

const THEME = {
  primary: "#212c46",
  accent: "#dc2626",
  bg: "#ffffff",
  card: "#FFFFFF",
  border: "#E2E8F0",
  info: "#3B82F6",
};

// --- MOCK DATABASE ---
const MOCK_PL_DATA: any[] = [];
let globalPlCounter = 1;

for (let d = -2; d <= 2; d++) {
  const dateStr = new Date(Date.now() + d * 86400000).toISOString().split("T")[0];
  let dailyKg = 0;
  const targetDailyKg = Math.floor(Math.random() * 100000) + 150000; // 150,000 - 250,000 KG (150-250 tons)
  
  while (dailyKg < targetDailyKg) {
      const fg = FG_DATABASE[Math.floor(Math.random() * FG_DATABASE.length)];
      
      let itemKg = 0;
      if (fg.name.includes('AFM') || fg.sku.includes('AFM')) {
          itemKg = Math.floor(Math.random() * 10000) + 5000; // 5,000 to 15,000 kg (>= 5 tons)
      } else {
          itemKg = Math.floor(Math.random() * 4000) + 1000; // 1,000 to 5,000 kg
      }
      
      const packs = Math.ceil(itemKg / fg.weight);
      const totalKg = packs * fg.weight;
      dailyKg += totalKg;
      
      const targetBatter = totalKg * 1.1;
      const batchSize = [80, 100, 120][Math.floor(Math.random() * 3)];
      const batches = Math.ceil(targetBatter / batchSize);
      
      const status = ["DRAFT", "CONFIRMED", "IN_PROCESS", "COMPLETED", "CANCELLED"][Math.floor(Math.random() * 5)];
      
      MOCK_PL_DATA.push({
          plNo: `PL-${dateStr.replace(/-/g, '').substring(2, 6)}-${String(globalPlCounter++).padStart(4, "0")}`,
          date: dateStr,
          shift: ["Morning", "Afternoon", "Night"][Math.floor(Math.random() * 3)],
          customer: ["Makro", "Lotus", "CPALL", "BJC", "Export-JP", "General Market", "AFM"][Math.floor(Math.random() * 7)],
          skuCount: 1,
          item: fg,
          totalKg: totalKg,
          totalPacks: packs,
          batches: batches,
          batchSize: batchSize,
          priority: ["Normal", "High", "Urgent"][Math.floor(Math.random() * 3)],
          status: status,
          progress: Math.floor(Math.random() * 100),
          delayDetected: status === "IN_PROCESS" && Math.random() > 0.7,
          createdBy: ["Admin", "Planner_JS", "Planner_TK", "System_Auto"][Math.floor(Math.random() * 4)],
      });
  }
}

MOCK_PL_DATA.sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
);

const getStatusStyle = (status: string) => {
  switch (status) {
    case "DRAFT":
      return "bg-[#f8f9fa] text-[#7a8b95] border-[#eaeaec]";
    case "CONFIRMED":
      return "bg-cyan-50 text-[#4d87a8] border-cyan-100";
    case "IN_PROCESS":
      return "bg-yellow-50 text-[#f59e0b] border-yellow-100";
    case "COMPLETED":
      return "bg-green-50 text-[#2e7d32] border-green-100";
    case "CANCELLED":
      return "bg-red-50 text-[#932c2e] border-red-100";
    default:
      return "bg-gray-50 text-gray-500 border-gray-200";
  }
};

const getShiftStyle = (shift: string) => {
  switch (shift) {
    case "Morning":
      return "bg-[#4d87a8] text-white border-[#4d87a8]";
    case "Afternoon":
      return "bg-[#932c2e] text-white border-[#932c2e]";
    case "Night":
      return "bg-[#212c46] text-white border-[#212c46]";
    default:
      return "bg-[#7a8b95] text-white border-[#7a8b95]";
  }
};

const getPriorityStyle = (priority: string) => {
  switch (priority) {
    case "Urgent":
      return "text-[#932c2e] font-black flex items-center gap-1";
    case "High":
      return "text-[#f59e0b] font-bold flex items-center gap-1";
    default:
      return "text-[#7a8b95] font-bold flex items-center gap-1";
  }
};

export default function PlanningPL() {
  const navigate = useNavigate();
  useMachineAlert();
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState(() => new Date().toISOString().split("T")[0]);
  const todayStr = new Date().toISOString().split("T")[0];
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [activeMainTab, setActiveMainTab] = useState("PLANNING (PL)");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [actionItem, setActionItem] = useState<any>(null);
  const [actionType, setActionType] = useState<"view" | "edit">("view");

  const [newPL, setNewPL] = useState({
    date: new Date().toISOString().split("T")[0],
    customer: "",
    skuCount: 1,
    itemSku: "",
    batches: 1,
    batchSize: 80,
    totalKg: 72.7,
    totalPacks: 72,
    priority: "Normal",
    shift: "Morning",
  });

  const handleBatchChangePL = (b: number, bs: number, sku: string) => {
      const fg = FG_DATABASE.find(f => f.sku === sku);
      if(!fg) {
          setNewPL(prev => ({...prev, batches: b, batchSize: bs, itemSku: sku}));
          return;
      }
      const totalBatter = b * bs;
      const totalFgKg = totalBatter / 1.1;
      const packs = Math.floor(totalFgKg / fg.weight);
      setNewPL(prev => ({...prev, batches: b, batchSize: bs, itemSku: sku, totalKg: packs * fg.weight, totalPacks: packs}));
  };

  const { data: dailyReports } = useCollection<any>('Daily_Reports');
  const { data: plDataList, loading: plLoading, add, update, remove } = useCollection<any>('Orders_PL', MOCK_PL_DATA);

  const [mockPlData, setMockPlData] = useState(() => MOCK_PL_DATA);

  // Sync GAS data
  useEffect(() => {
      if (plDataList && plDataList.length > 0) {
          setMockPlData(plDataList);
      }
  }, [plDataList]);

  useEffect(() => {
    if (mockPlData.length > 0) {
        const todayItems = mockPlData.filter(d => (d.date || todayStr) === todayStr);
        if (todayItems.length === 0) {
            const dates = mockPlData.map(d => d.date).filter(Boolean).sort().reverse();
            if (dates.length > 0 && dateFilter === todayStr) {
                setDateFilter(dates[0]);
            }
        }
    }
  }, [mockPlData]);

  const syncedData = useMemo(() => {
    return mockPlData.map(pl => {
      // Find reports matching the date (and roughly shift if possible, but date is easier)
      const matchingReports = dailyReports.filter(r => r.date === pl.date);
      const shiftPrefix = pl.shift === 'Morning' ? 'Shift A' : pl.shift === 'Afternoon' ? 'Shift B' : 'Shift C';
      const exactReports = matchingReports.filter(r => r.shift && r.shift.includes(shiftPrefix));
      
      const relatedReports = exactReports.length > 0 ? exactReports : matchingReports;

      const totalActual = relatedReports.reduce((sum, r) => sum + (Number(r.actualQty) || 0), 0);
      
      let baseStatus = pl.status;
      let baseProgress = pl.progress;
      let totalKg = pl.totalKg;
      let delayDetected = pl.delayDetected;

      if (relatedReports.length > 0) {
        // If there are real reports, calculate progress
        const target = pl.totalKg;
        const progress = Math.min(100, Math.round((totalActual / target) * 100));
        baseProgress = progress;
        
        if (progress === 100) baseStatus = "COMPLETED";
        else if (progress > 0) baseStatus = "IN_PROCESS";
        else baseStatus = "CONFIRMED";

        delayDetected = relatedReports.some(r => r.status === 'Flagged' || Number(r.downtimeMin) > 30);
      }

      return {
        ...pl,
        status: baseStatus,
        progress: baseProgress,
        delayDetected,
        actualKg: relatedReports.length > 0 ? totalActual : 0
      };
    });
  }, [dailyReports]);

  const filteredData = useMemo(() => {
    return syncedData.filter((item) => {
      const matchSearch =
        (item.plNo || "").toLowerCase().includes((searchTerm || "").toLowerCase()) ||
        (item.customer || "").toLowerCase().includes((searchTerm || "").toLowerCase());
      const matchStatus =
        statusFilter === "ALL" || item.status === statusFilter;
      const matchDate = !dateFilter || item.date === dateFilter;
      return matchSearch && matchStatus && matchDate;
    });
  }, [syncedData, searchTerm, statusFilter, dateFilter]);

  // Pagination basics
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateFilter, itemsPerPage]);

  // KPIs
  const totalVolume = filteredData.reduce((sum, i) => sum + i.totalKg, 0);
  const totalBatches = filteredData.reduce((sum, i) => sum + i.batches, 0);
  const totalPacks = filteredData.reduce((sum, i) => sum + i.totalPacks, 0);

  const completedCount = filteredData.filter((i) => i.status === "COMPLETED").length;
  const delayedCount = filteredData.filter((i) => i.delayDetected).length;

  const [showAlarm, setShowAlarm] = useState(delayedCount > 0);

  return (
    <div className="flex flex-1 w-full flex-col animate-fadeIn bg-transparent space-y-4">
      <style>{globalStyles}</style>

      <UserGuideButton onClick={() => setIsGuideOpen(true)} />
      <UserGuidePanel
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        title="PLANNING GUIDE"
        subtitle="CENTRAL PLANNING & ORDER MANAGEMENT"
      >
        <div className="space-y-8">
            <div>
                <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                    <div className="bg-[#212c46] text-white w-5 h-5 rounded flex items-center justify-center text-[10px] shrink-0">1</div> 
                    ข้อมูลการขายรอประเมิน
                </h3>
                <p className="mb-4 text-[#414757]">
                    ใบสั่งขาย (Sales Order) จากออฟฟิศที่รอการจับคู่กับกำลังการผลิต (Capacity) เพื่อนำมาสร้างเป็นตารางการผลิต (Production Plan)
                </p>
            </div>

            <div className="h-px bg-[#eaeaec] w-full" />

            <div>
                <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                    <div className="bg-[#d55a6d] text-white w-5 h-5 rounded flex items-center justify-center text-[10px] shrink-0">2</div> 
                    สถานะ (STATUS)
                </h3>
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#7a8b95] shrink-0"></div>
                        <div><span className="font-bold text-[#414757]">DRAFT:</span> ร่างแผน ยังไม่ได้รับการยืนยัน</div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#3f809e] shrink-0"></div>
                        <div><span className="font-bold text-[#414757]">CONFIRMED:</span> แผนผลิตยืนยันแล้ว รอเข้าสายการผลิต</div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#b58c4f] shrink-0"></div>
                        <div><span className="font-bold text-[#414757]">IN PROCESS:</span> กำลังดำเนินการผลิตจริง</div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#688a58] shrink-0"></div>
                        <div><span className="font-bold text-[#414757]">COMPLETED:</span> ปิดแผนการผลิตแล้ว</div>
                    </div>
                </div>
            </div>
            
            <div className="h-px bg-[#eaeaec] w-full" />

            <div>
                <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                    <div className="bg-[#b58c4f] text-white w-5 h-5 rounded flex items-center justify-center text-[10px] shrink-0"><Icons.HeartPulse size={12} /></div> 
                    PLAN HEALTH
                </h3>
                <p className="mb-4 text-[#414757]">ระบบแจ้งเตือนสถานะความเสี่ยงของออเดอร์ คำนวณแบบ Real-time โดยเทียบเวลาปัจจุบันกับกำหนดส่งมอบ:</p>
                <div className="space-y-3">
                    <div className="flex items-start gap-3">
                        <div className="bg-[#f0f2f5] text-[#212c46] font-bold text-[10px] uppercase tracking-widest px-2 py-1 rounded w-[80px] text-center mt-1 shrink-0">ON PLAN</div>
                        <div className="text-[#414757]">อยู่ในแผนงานปกติ มีเวลาดำเนินการเพียงพอ (มากกว่า 2 ชั่วโมงก่อนกำหนด)</div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="bg-[#fff9e6] border border-[#ffdb7d] text-[#ce870a] font-bold text-[10px] uppercase tracking-widest px-2 py-1 rounded w-[80px] text-center mt-1 shrink-0">URGENT</div>
                        <div className="text-[#414757]">ออเดอร์เร่งด่วน ใกล้ถึงกำหนดส่งมอบ (เหลือเวลา &le; 2 ชั่วโมง)</div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="bg-[#fdf2f2] border border-[#f5c6cb] text-[#d55a6d] font-bold text-[10px] uppercase tracking-widest px-2 py-1 rounded w-[80px] text-center mt-1 shrink-0">DELAYED</div>
                        <div className="text-[#414757]">ออเดอร์ล่าช้าเกินกำหนดส่งมอบ ต้องเร่งติดตามและจัดการทันที หรือเป็นออเดอร์ฉุกเฉิน</div>
                    </div>
                </div>
            </div>

            <div className="h-px bg-[#eaeaec] w-full" />

            <div>
                <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                    <div className="bg-[#3f809e] text-white w-5 h-5 rounded flex items-center justify-center text-[10px] shrink-0">4</div> 
                    ACTION BUTTONS
                </h3>
                <p className="mb-4">การจัดการข้อมูลแผนการผลิตสามารถทำได้ผ่านปุ่มคำสั่งต่อไปนี้ :</p>
                <div className="space-y-3">
                    <div className="p-3 bg-[#f8f9fa] border border-[#eaeaec] rounded-lg">
                        <span className="font-bold text-[#212c46]">BULK UPLOAD:</span> นำเข้าแผนการผลิตหลายรายการพร้อมกันผ่านไฟล์ Excel/CSV 
                    </div>
                    <div className="p-3 bg-[#f8f9fa] border border-[#eaeaec] rounded-lg">
                        <span className="font-bold text-[#212c46]">EXPORT:</span> ส่งออกข้อมูลแผนการผลิตทั้งหมดในรูปแบบตารางเพื่อนำไปวิเคราะห์ต่อ
                    </div>
                    <div className="p-3 bg-[#f8f9fa] border border-[#eaeaec] rounded-lg">
                        <span className="font-bold text-[#212c46]">CREATE PL:</span> สร้างแผนการผลิตใหม่แบบ Manual พร้อมระบุรายละเอียด ลูกค้า สินค้า และเป้าหมาย
                    </div>
                </div>
            </div>
        </div>
      </UserGuidePanel>

      <DraggableModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="BULK PL UPLOAD"
      >
        <div className="p-6 overflow-y-auto max-h-[80vh] custom-scrollbar">
          <CsvUpload
            onUpload={(data) => {
              console.log("Uploaded Data:", data);
              // In a real app we'd call an API. Setting a mock notification.
              setIsUploadOpen(false);
            }}
            requiredHeaders={["plNo", "date", "customer", "skuCount", "totalKg", "priority"]}
            templateName="PL_Template.xlsx"
            instructions={[
              "Ensure the file is in .csv or .xlsx format",
              "Maximum file size: 10MB",
              "All required columns must be filled for successful plan creation"
            ]}
          />
        </div>
      </DraggableModal>

      {/* CREATE PL MODAL */}
      <DraggableModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="CREATE PLANNING (PL)"
      >
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-[#7a8b95] mb-1">Date</label>
              <input type="date" className="w-full border border-[#eaeaec] bg-[#f8f9fa] rounded-lg p-2.5 text-[12px] font-mono text-[#212c46] focus:border-[#4d87a8] outline-none" value={newPL.date} onChange={e => setNewPL({...newPL, date: e.target.value})} />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-[#7a8b95] mb-1">Shift</label>
              <select className="w-full border border-[#eaeaec] bg-[#f8f9fa] rounded-lg p-2.5 text-[12px] font-bold text-[#212c46] focus:border-[#4d87a8] outline-none" value={newPL.shift} onChange={e => setNewPL({...newPL, shift: e.target.value})}>
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Night">Night</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-[#7a8b95] mb-1">Customer / Reference</label>
            <input type="text" placeholder="e.g. Makro" className="w-full border border-[#eaeaec] bg-[#f8f9fa] rounded-lg p-2.5 text-[12px] font-bold text-[#212c46] focus:border-[#4d87a8] outline-none" value={newPL.customer} onChange={e => setNewPL({...newPL, customer: e.target.value})} />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-[#7a8b95] mb-1">Finished Goods (FG)</label>
            <select value={newPL.itemSku} onChange={e => handleBatchChangePL(newPL.batches, newPL.batchSize, e.target.value)} className="w-full border border-[#eaeaec] bg-[#f8f9fa] rounded-lg p-2.5 text-[12px] font-bold text-[#212c46] focus:border-[#4d87a8] outline-none">
              <option value="" disabled>-- SELECT PRODUCT --</option>
              {FG_DATABASE.map(f => <option key={f.sku} value={f.sku}>{f.sku} : {f.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-[10px] font-black uppercase text-[#7a8b95] mb-1">Batch Size (KG)</label>
              <select value={newPL.batchSize} onChange={e => handleBatchChangePL(newPL.batches, Number(e.target.value), newPL.itemSku)} className="w-full border border-[#eaeaec] bg-[#f8f9fa] rounded-lg p-2.5 text-[12px] font-bold text-[#212c46] focus:border-[#4d87a8] outline-none">
                  <option value={50}>50 KGS / Batch</option>
                  <option value={80}>80 KGS / Batch</option>
                  <option value={100}>100 KGS / Batch</option>
                  <option value={120}>120 KGS / Batch</option>
              </select>
            </div>
             <div>
              <label className="block text-[10px] font-black uppercase text-[#7a8b95] mb-1">Number of Batches</label>
              <input type="number" min="1" className="w-full border border-[#eaeaec] bg-[#f8f9fa] rounded-lg p-2.5 text-[12px] font-mono text-[#212c46] focus:border-[#4d87a8] outline-none" value={newPL.batches} onChange={e => handleBatchChangePL(Number(e.target.value), newPL.batchSize, newPL.itemSku)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-[10px] font-black uppercase text-[#7a8b95] mb-1">Calculated Packs</label>
              <input type="number" disabled className="w-full border border-[#eaeaec] bg-gray-200 rounded-lg p-2.5 text-[12px] font-mono text-[#212c46] opacity-70" value={newPL.totalPacks} />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-[#7a8b95] mb-1">Priority</label>
              <select className="w-full border border-[#eaeaec] bg-[#f8f9fa] rounded-lg p-2.5 text-[12px] font-bold text-[#212c46] focus:border-[#4d87a8] outline-none" value={newPL.priority} onChange={e => setNewPL({...newPL, priority: e.target.value})}>
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
             <button onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-[11px] font-black text-[#7a8b95] uppercase tracking-widest hover:text-[#212c46]">Cancel</button>
             <button onClick={async () => {
                 try {
                     const plNoStr = `PL-${new Date().toISOString().replace(/-/g, '').substring(2, 6)}-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;
                     const fg = FG_DATABASE.find(f => f.sku === newPL.itemSku);
                     await add({
                         plNo: plNoStr,
                         date: newPL.date,
                         shift: newPL.shift,
                         customer: newPL.customer,
                         skuCount: 1,
                         item: fg || { sku: newPL.itemSku, name: 'Unknown' },
                         totalKg: newPL.totalKg,
                         totalPacks: newPL.totalPacks,
                         batches: newPL.batches,
                         batchSize: newPL.batchSize,
                         priority: newPL.priority,
                         status: 'DRAFT',
                         progress: 0,
                         delayDetected: false,
                         createdBy: 'Staff'
                     });
                     alert('Plan Created!'); 
                     setIsCreateOpen(false); 
                 } catch(e) {
                     alert("Failed to create plan");
                 }
             }} className="px-6 py-2 bg-[#212c46] text-white text-[11px] font-black uppercase tracking-widest rounded-lg shadow-sm hover:bg-[#414757]">Save Plan</button>
          </div>
        </div>
      </DraggableModal>

      {/* ACTION MODAL (View/Edit) */}
      <DraggableModal
        isOpen={isActionOpen}
        onClose={() => setIsActionOpen(false)}
        title={actionType === 'view' ? "VIEW PLAN DETAILS" : "EDIT PLAN"}
      >
        <div className="p-6 space-y-4" id="print-pl-details">
            {actionItem && (
               <>
                 <div className="flex justify-between items-center bg-[#f8f9fa] p-4 rounded-xl border border-[#eaeaec]">
                    <div>
                       <div className="text-[10px] font-black text-[#7a8b95] uppercase tracking-widest mb-1">PL Number</div>
                       <div className="text-[16px] font-mono font-black text-[#932c2e]">{actionItem.plNo}</div>
                    </div>
                    <div className="text-right">
                       <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border rounded-md shadow-sm ${getStatusStyle(actionItem.status)}`}>{actionItem.status}</span>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-[12px]">
                    <div>
                        <div className="text-[10px] font-black text-[#7a8b95] uppercase tracking-widest mb-1">Customer / Reference</div>
                        {actionType === 'edit' ? (
                          <input type="text" className="w-full border border-[#eaeaec] p-2 rounded-lg bg-[#f8f9fa] focus:border-[#4d87a8] outline-none" value={actionItem.customer} onChange={e => setActionItem({...actionItem, customer: e.target.value})} />
                        ) : (
                          <div className="font-bold text-[#212c46]">{actionItem.customer}</div>
                        )}
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-[#7a8b95] uppercase tracking-widest mb-1">Delivery Date</div>
                        {actionType === 'edit' ? (
                          <input type="date" className="w-full border border-[#eaeaec] p-2 rounded-lg bg-[#f8f9fa] focus:border-[#4d87a8] outline-none" value={actionItem.date} onChange={e => setActionItem({...actionItem, date: e.target.value})} />
                        ) : (
                          <div className="font-mono font-black text-[#212c46]">{new Date(actionItem.date).toLocaleDateString()}</div>
                        )}
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-[#7a8b95] uppercase tracking-widest mb-1">Total Target Volume (Packs / KG)</div>
                        {actionType === 'edit' ? (
                          <div className="flex gap-2">
                             <input type="number" className="w-1/2 border border-[#eaeaec] p-2 rounded-lg bg-[#f8f9fa] focus:border-[#4d87a8] outline-none" value={actionItem.totalPacks} placeholder="Packs" onChange={e => {
                                 const p = Number(e.target.value);
                                 setActionItem({...actionItem, totalPacks: p, totalKg: p * (actionItem.item?.weight || 1)});
                             }} />
                             <span className="w-1/2 p-2 text-[12px] font-mono text-[#7a8b95] bg-gray-100 rounded-lg flex items-center justify-end">{actionItem.totalKg?.toLocaleString()} KG</span>
                          </div>
                        ) : (
                          <div className="font-mono font-black text-[#212c46]">{actionItem.totalPacks?.toLocaleString()} PCK / {actionItem.totalKg?.toLocaleString()} KG</div>
                        )}
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-[#7a8b95] uppercase tracking-widest mb-1">Product Code / Name</div>
                        <div className="font-bold text-[#212c46] truncate" title={actionItem.item?.name}>{actionItem.item?.sku} : {actionItem.item?.name}</div>
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-[#7a8b95] uppercase tracking-widest mb-1">Actual Volume Yield</div>
                        <div className="font-mono font-black text-[#3f809e]">{actionItem.actualKg?.toLocaleString() || 0} KG</div>
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-[#7a8b95] uppercase tracking-widest mb-1">Priority</div>
                        {actionType === 'edit' ? (
                          <select className="w-full border border-[#eaeaec] p-2 rounded-lg bg-[#f8f9fa] focus:border-[#4d87a8] outline-none" value={actionItem.priority} onChange={e => setActionItem({...actionItem, priority: e.target.value})}>
                            <option value="Normal">Normal</option>
                            <option value="High">High</option>
                            <option value="Urgent">Urgent</option>
                          </select>
                        ) : (
                          <div className="font-bold">{actionItem.priority}</div>
                        )}
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-[#7a8b95] uppercase tracking-widest mb-1">Creation Info</div>
                        <div className="font-mono text-[#7a8b95]">{actionItem.createdBy}</div>
                    </div>
                 </div>

                 {actionType === 'view' && (
                   <div className="pt-6 border-t border-[#eaeaec] flex justify-end gap-3 no-print">
                      <PdfPrint contentId="print-pl-details" title={`PLAN ${actionItem.plNo}`} />
                      <button onClick={() => setIsActionOpen(false)} className="px-6 py-2 bg-[#212c46] text-white text-[11px] font-black uppercase tracking-widest rounded-lg shadow-sm hover:bg-[#414757]">Close</button>
                   </div>
                 )}
                 {actionType === 'edit' && (
                   <div className="pt-6 border-t border-[#eaeaec] flex justify-end gap-3">
                      <button onClick={() => setIsActionOpen(false)} className="px-4 py-2 text-[11px] font-black text-[#7a8b95] uppercase tracking-widest hover:text-[#212c46]">Cancel</button>
                      <button onClick={async () => { 
                          try {
                              await update(actionItem.plNo || actionItem.id, actionItem);
                              alert('Plan updated!'); 
                              setIsActionOpen(false); 
                          } catch(e) {
                              alert('Failed to update plan');
                          }
                      }} className="px-6 py-2 bg-[#212c46] text-white text-[11px] font-black uppercase tracking-widest rounded-lg shadow-sm hover:bg-[#414757]">Save Changes</button>
                   </div>
                 )}
               </>
            )}
        </div>
      </DraggableModal>

      {/* ALARM POP-UP */}
      {showAlarm && (
        <div className="fixed bottom-6 right-6 z-50 bg-white border border-red-200 shadow-2xl rounded-xl p-4 w-[320px] animate-fadeIn flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <Icons.AlertOctagon size={16} className="text-red-600 animate-pulse" />
              </div>
              <span className="font-black text-[#212c46] tracking-widest uppercase text-[12px]">SYSTEM ALARM</span>
            </div>
            <button onClick={() => setShowAlarm(false)} className="text-[#7a8b95] hover:text-[#212c46]">
              <Icons.X size={16} />
            </button>
          </div>
          <div className="pl-10">
            <p className="text-[12px] text-[#414757] font-bold">
              Detected <span className="text-red-600 animate-pulse">{delayedCount} pending order(s)</span> with potential delay risk.
            </p>
            <button className="mt-3 text-[10px] bg-[#212c46] active:scale-95 text-white font-black uppercase tracking-widest px-4 py-1.5 rounded-lg transition-colors hover:bg-black shadow-sm">
              Review Action Plan
            </button>
          </div>
        </div>
      )}

      {/* Header Area synced with other modules */}
      <div className="h-14 px-4 sm:px-8 flex flex-row items-center justify-between gap-4 z-20 shrink-0">
        <div className="flex items-center gap-5">
          <div className="relative flex items-center justify-center group cursor-default shrink-0">
            <div className="absolute inset-0 bg-[#212c46] blur-[15px] opacity-20 rounded-full group-hover:opacity-60 transition-all duration-700"></div>
            <div className="relative z-10 p-1.5 border border-[#212c46]/40 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm">
              <Icons.CalendarClock
                size={28}
                strokeWidth={2.5}
                className="text-[#212c46]"
              />
            </div>
          </div>
          <div>
            <h3
              className="font-black text-[#212c46] uppercase tracking-tighter leading-none font-exception-header"
              style={{ fontSize: "24px" }}
            >
              PLANNING{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#212c46] to-[#4d87a8]">
                (PL)
              </span>
            </h3>
            <p className="text-[11px] font-bold text-[#7a8b95] uppercase tracking-[0.2em] mt-0.5 opacity-80 leading-none">
              Central Planning & Order Management
            </p>
          </div>
        </div>

        {/* Main Tabs */}
        <div className="flex items-center gap-4">
          <div className="bg-white/50 p-1.5 rounded-xl border border-white/60 shadow-inner flex flex-wrap items-center gap-1">
            {["PLANNING (PL)", "PRODUCTION PLANNING", "AI PLANNER ASST."].map(
              (t) => (
                <button
                  key={t}
                  onClick={() => {
                    setActiveMainTab(t);
                    if (t === "PLANNING (PL)") navigate("/planning/pl");
                    if (t === "PRODUCTION PLANNING") navigate("/planning/production");
                    if (t === "AI PLANNER ASST.") navigate("/planning/ai");
                  }}
                  className={`px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                    activeMainTab === t
                      ? "bg-[#212c46] text-white shadow-md"
                      : "text-[#7a8b95] hover:text-[#a94228]"
                  }`}
                >
                  {t === "PLANNING (PL)" && <Icons.FileSpreadsheet size={16} />}
                  {t === "PRODUCTION PLANNING" && <Icons.Factory size={16} />}
                  {t === "AI PLANNER ASST." && <Icons.Cpu size={16} />}
                  {t}
                </button>
              ),
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 sm:px-8 w-full mt-[2px]">
        {/* KPI STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-4 shrink-0">
          <KpiCard
            label="Target Volume (Tons)"
            value={(totalVolume / 1000).toFixed(1)}
            unit="TON"
            icon="weight"
            colorAccent="#4d87a8"
            colorValue={THEME.primary}
            desc="Planned Output"
          />
          <KpiCard
            label="Target Volume (Batches)"
            value={(totalBatches || 0).toLocaleString()}
            icon="layers"
            colorAccent="#b7a159"
            colorValue={THEME.primary}
            desc="Batches"
          />
          <KpiCard
            label="Target Volume (Packs)"
            value={(totalPacks || 0).toLocaleString()}
            icon="package"
            colorAccent="#f59e0b"
            colorValue={THEME.primary}
            desc="Packs"
          />
          <KpiCard
            label="Completed"
            value={(completedCount || 0).toLocaleString()}
            icon="check-circle"
            colorAccent="#2e7d32"
            colorValue={THEME.primary}
            desc="PL COMPLETED"
          />
          <KpiCard
            label="Delayed"
            value={(delayedCount || 0).toLocaleString()}
            icon="alert-circle"
            colorAccent="#932c2e"
            colorValue={THEME.primary}
            desc="PL DELAYED"
          />
        </div>

        <div className="w-full flex-1 flex flex-col min-h-[500px]">
          <div className="sys-table-card border-[#eaeaec] flex flex-col flex-1 shadow-lg bg-white overflow-hidden rounded-xl border">
            {/* TOOLBAR */}
            <div className="px-4 py-4 border-b border-[#eaeaec] flex flex-col md:flex-row justify-between items-center bg-white shrink-0 gap-4">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative group">
                  <Icons.Filter
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a8b95] group-hover:text-[#212c46] transition-colors"
                  />
                  <select
                    className="pl-9 pr-8 py-2 border border-[#eaeaec] rounded-xl text-[12px] font-bold bg-[#f8f9fa] focus:border-[#4d87a8] outline-none cursor-pointer transition-all text-[#212c46] shadow-sm appearance-none h-10 min-w-[160px]"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="ALL">ALL STATUS</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="IN_PROCESS">IN PROCESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                  <Icons.ChevronDown
                    size={12}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a8b95] pointer-events-none"
                  />
                </div>

                <div className="relative group flex items-center">
                  <Icons.Calendar
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a8b95] group-hover:text-[#212c46]"
                  />
                  <input
                    type="date"
                    className="pl-9 pr-4 py-2 border border-[#eaeaec] rounded-xl text-[12px] font-bold bg-[#f8f9fa] focus:border-[#4d87a8] outline-none transition-all text-[#212c46] shadow-sm h-10 w-[150px]"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value || new Date().toISOString().split("T")[0])}
                  />
                </div>
              </div>

              <div className="flex gap-3 w-full md:w-auto items-center">
                <div className="relative flex-1 md:w-80 group">
                  <Icons.Search
                    size={14}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a8b95]"
                  />
                  <input
                    type="text"
                    placeholder="Search PL No, Customer..."
                    className="w-full pl-10 pr-4 py-2 border border-[#eaeaec] rounded-xl text-[12px] font-bold focus:outline-none focus:border-[#4d87a8] bg-[#f8f9fa] focus:bg-white shadow-sm text-[#212c46] h-10 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button onClick={() => setIsUploadOpen(true)} className="bg-white border border-[#eaeaec] hover:border-[#4d87a8] hover:text-[#4d87a8] text-[#7a8b95] px-4 py-2 rounded-xl font-bold text-[12px] uppercase tracking-widest flex items-center gap-2 shadow-sm transition-colors hidden md:flex h-10 shrink-0">
                  <Icons.Upload size={14} /> BULK UPLOAD
                </button>
                <CsvExport 
                  data={filteredData} 
                  filename="planning_pl_export.csv"
                  label="EXPORT" 
                  className="!h-10 !rounded-xl !bg-white !text-[#7a8b95] !border !border-[#eaeaec] hover:!border-[#4d87a8] hover:!text-[#4d87a8] !shadow-sm !font-bold !text-[12px] hidden md:flex" 
                />
                <button 
                  onClick={() => setIsCreateOpen(true)}
                  className="bg-[#212c46] hover:bg-[#414757] text-white px-5 py-2 rounded-xl font-black text-[12px] uppercase tracking-widest shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap shrink-0 h-10 border border-[#212c46]">
                  <Icons.Plus size={14} /> CREATE PL
                </button>
              </div>
            </div>

            {/* TABLE */}
            <div className="flex-1 overflow-auto custom-scrollbar bg-slate-50/50">
              <table className="w-full text-left min-w-[1100px] border-collapse bg-white table-font">
                <thead className="sys-table-header [#eaeaec] sticky top-0 z-10 font-black uppercase tracking-widest ">
                    <tr>
                    <th className="text-center w-16 align-middle font-black shadow-sm ">
                      #
                    </th>
                    <th className="align-middle font-black shadow-sm ">
                      PL NO.
                    </th>
                    <th className="align-middle font-black shadow-sm ">
                      Date
                    </th>
                    <th className="text-center align-middle font-black shadow-sm ">
                      Shift
                    </th>
                    <th className="align-middle font-black shadow-sm ">
                      Customer/Ref
                    </th>
                    <th className="align-middle font-black shadow-sm ">
                      Priority
                    </th>
                    <th className="text-center w-[12%] align-middle font-black shadow-sm ">
                      Plan Health
                    </th>
                    <th className="text-center align-middle font-black shadow-sm ">
                      Items
                    </th>
                    <th className="text-right align-middle font-black shadow-sm ">
                      Volume (KG / PACK)
                    </th>
                    <th className="w-[150px] align-middle font-black shadow-sm ">
                      Progress
                    </th>
                    <th className="text-center align-middle font-black shadow-sm ">
                      Status
                    </th>
                    <th className="text-right w-24 align-middle font-black shadow-sm pr-8 ">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((item, idx) => (
                    <tr
                      key={item.plNo}
                      className="hover:bg-slate-50 transition-colors group border-b border-[#eaeaec]"
                    >
                      <td className="px-4 text-center text-[#7a8b95] font-black font-mono text-[12px] align-middle py-2.5">
                        {indexOfFirstItem + idx + 1}
                      </td>
                      <td className="px-4 align-middle py-2.5">
                        <div className="flex flex-col">
                          <span className="font-mono font-bold text-[#932c2e] text-[12px] leading-tight">
                            {item.plNo}
                          </span>
                          <span className="text-[9px] text-[#7a8b95] font-bold uppercase tracking-widest flex items-center gap-1 mt-0.5">
                            <Icons.User size={10} /> {item.createdBy}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 text-[#212c46] font-mono font-black text-[12px] align-middle py-2.5">
                        {new Date(item.date).toLocaleDateString("en-GB")}
                      </td>
                      <td className="px-4 text-center align-middle py-2.5">
                        <span className={`border font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm ${getShiftStyle(item.shift)}`}>
                          {item.shift}
                        </span>
                      </td>
                      <td className="px-4 align-middle py-2.5">
                        <span className="bg-[#f8f9fa] border border-[#eaeaec] text-[#414757] font-bold text-[11px] px-2.5 py-1 rounded-md">
                          {item.customer}
                        </span>
                      </td>
                      <td className="px-4 align-middle text-[12px] py-2.5">
                        <span className={getPriorityStyle(item.priority)}>
                          {item.priority === "Urgent" && (
                            <Icons.AlertCircle size={14} />
                          )}
                          {item.priority === "High" && (
                            <Icons.ArrowUpCircle size={14} />
                          )}
                          {item.priority === "Normal" && (
                            <Icons.Activity size={14} />
                          )}
                          {item.priority}
                        </span>
                      </td>
                      <td className="px-4 align-middle text-center py-2.5">
                          {(() => {
                            if (item.status === 'COMPLETED' || item.status === 'CANCELLED') {
                               return <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border shadow-sm bg-stone-50 text-stone-500 border-stone-200`}>{item.status}</span>;
                            }
                            
                            const pDate = new Date(item.date);
                            const tDate = new Date();
                            tDate.setHours(0,0,0,0);
                            
                            let hStatus = { label: 'ON PLAN', color: 'bg-[#f8f9fa] text-[#7a8b95] border-[#eaeaec]', blink: false };
                            if (item.delayDetected || pDate < tDate) {
                                hStatus = { label: 'DELAYED', color: 'bg-rose-50 border-rose-200 text-[#932c2e] shadow-sm', blink: true };
                            } else if (pDate.getTime() === tDate.getTime()) {
                                hStatus = { label: 'URGENT', color: 'bg-amber-50 text-[#f59e0b] border-amber-200', blink: false };
                            }
                            return (
                                <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border shadow-sm transition-all ${hStatus.color} ${hStatus.blink ? 'opacity-80' : ''}`}>{hStatus.label}</span>
                            );
                          })()}
                      </td>
                      <td className="px-4 text-center align-middle py-2.5">
                        <div className="flex flex-col gap-1 items-start max-w-[200px] mx-auto">
                            {item.item ? (
                                <div className="truncate w-full text-left text-[11px] font-bold text-[#414757] bg-[#f8f9fa] border border-[#eaeaec] px-2 py-1 rounded" title={item.item.name}>
                                    {item.item.sku} : {item.item.name}
                                </div>
                            ) : (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#f8f9fa] border border-[#eaeaec] text-[#212c46] font-black text-[11px] font-mono">
                                  1
                                </span>
                            )}
                        </div>
                      </td>
                      <td className="px-4 text-right align-middle py-2.5">
                        <div className="flex flex-col items-end">
                          <span className="font-mono font-black text-[#212c46] text-[12px] flex items-center justify-end gap-1.5">
                            {item.status === "IN_PROCESS" && !item.delayDetected && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>}
                            {item.actualKg > 0 ? (
                                <span><span className="text-[#3f809e]">{(item.actualKg || 0).toLocaleString()}</span> / {(item.totalKg || 0).toLocaleString()}</span>
                            ) : (
                                <span>{(item.totalKg || 0).toLocaleString()}</span>
                            )}
                            <span className="text-[9px] text-[#7a8b95] ml-0.5">KG</span>
                          </span>
                          <span className="text-[10px] text-[#7a8b95] font-bold font-mono">
                            {(item.totalPacks || 0).toLocaleString()} <span className="text-[8px]">PACK</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 align-middle py-2.5">
                        <div className="flex flex-col gap-1.5 w-full">
                          <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-[#7a8b95]">
                            <span>{item.progress}%</span>
                            {item.status === "IN_PROCESS" && <span className="text-green-600 flex items-center gap-1 text-[8px]"><Icons.Activity size={8} /> LIVE</span>}
                          </div>
                          <div className="h-2 w-full bg-[#eaeaec] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${item.delayDetected ? "bg-red-500 animate-pulse" : item.progress === 100 ? "bg-[#2e7d32]" : "bg-[#4d87a8]"}`}
                              style={{ width: `${item.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 text-center align-middle relative py-2.5">
                        <span
                          className={`border font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-md ${item.delayDetected ? 'bg-red-100 text-red-600 border-red-300 animate-pulse' : getStatusStyle(item.status)}`}
                        >
                          {item.delayDetected ? "DELAYED" : item.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 text-right pr-8 align-middle py-2.5">
                        <div className="flex items-center justify-end gap-[1px]">
                          <button
                            onClick={() => { setActionType('view'); setActionItem(item); setIsActionOpen(true); }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#eaeaec] text-[#4d87a8] hover:border-[#212c46] hover:text-[#a94228] hover:bg-[#212c46]/5 transition-all shadow-sm bg-white active:scale-90"
                            title="View"
                          >
                            <Icons.Eye size={16} />
                          </button>
                          {!["COMPLETED", "CANCELLED"].includes(
                            item.status,
                          ) && (
                            <button
                              onClick={() => { setActionType('edit'); setActionItem(item); setIsActionOpen(true); }}
                              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#eaeaec] text-[#4d87a8] hover:border-[#212c46] hover:text-[#a94228] hover:bg-[#212c46]/5 transition-all shadow-sm bg-white active:scale-90"
                              title="Edit"
                            >
                              <Icons.Pencil size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {currentItems.length === 0 && (
                    <tr>
                      <td className="text-center py-2.5 px-4">
                        <div className="flex flex-col items-center justify-center gap-[1px]">
                          <div className="w-12 h-12 bg-[#f8f9fa] border border-[#eaeaec] rounded-full flex items-center justify-center text-[#7a8b95] mb-2">
                            <Icons.SearchX size={24} />
                          </div>
                          <p className="text-[12px] font-bold text-[#7a8b95] uppercase tracking-widest">
                            No planning records found
                          </p>
                          <button
                            onClick={() => {
                              setSearchTerm("");
                              setStatusFilter("ALL");
                            }}
                            className="text-[10px] font-black uppercase tracking-widest text-[#4d87a8] mt-2 underline"
                          >
                            Clear Filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-[#eaeaec] flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-[10px] text-[#7a8b95] uppercase tracking-widest">
                  SHOW:
                </span>
                <select
                  className="bg-[#f8f9fa] border border-[#eaeaec] rounded-lg px-3 py-1.5 text-[11px] font-black text-[#212c46] outline-none focus:border-[#4d87a8] cursor-pointer appearance-none text-center min-w-[60px]"
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span className="font-mono font-bold text-[10px] text-[#7a8b95] uppercase tracking-widest shrink-0 ml-2">
                  TOTAL {filteredData.length} RECORDS
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${currentPage === 1 ? "bg-[#f8f9fa] border-[#eaeaec] text-[#d7d7d7] cursor-not-allowed" : "bg-white border-[#eaeaec] text-[#212c46] hover:border-[#4d87a8] hover:text-[#4d87a8] shadow-sm"}`}
                >
                  <Icons.ChevronLeft size={16} />
                </button>
                <span className="font-mono font-black text-[11px] text-[#212c46] uppercase tracking-widest min-w-[120px] text-center bg-[#f8f9fa] py-1.5 px-3 rounded-lg border border-[#eaeaec]">
                  PAGE {currentPage} OF {totalPages || 1}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${currentPage === totalPages || totalPages === 0 ? "bg-[#f8f9fa] border-[#eaeaec] text-[#d7d7d7] cursor-not-allowed" : "bg-white border-[#eaeaec] text-[#212c46] hover:border-[#4d87a8] hover:text-[#4d87a8] shadow-sm"}`}
                >
                  <Icons.ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
