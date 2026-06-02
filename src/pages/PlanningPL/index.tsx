import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import * as Icons from "lucide-react";
import { UserGuidePanel } from "@/src/components/shared/UserGuidePanel";
import UserGuideButton from "@/src/components/shared/UserGuideButton";
import { DraggableModal } from "@/src/components/shared/DraggableModal";
import { CsvUpload } from "@/src/components/shared/CsvUpload";
import KpiCard from "../../components/shared/KpiCard";
import { useCollection } from "@/src/services/useFirestore";

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
const MOCK_PL_DATA = Array.from({ length: 45 }).map((_, i) => {
  const status = ["DRAFT", "CONFIRMED", "IN_PROCESS", "COMPLETED", "CANCELLED"][Math.floor(Math.random() * 5)];
  return {
    plNo: `PL-${new Date().getFullYear().toString().slice(-2)}${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(i + 1).padStart(4, "0")}`,
    date: new Date(Date.now() - Math.floor(Math.random() * 10) * 86400000)
      .toISOString()
      .split("T")[0],
    shift: ["Morning", "Afternoon", "Night"][Math.floor(Math.random() * 3)],
    customer: [
      "Makro",
      "Lotus",
      "CPALL",
      "BJC",
      "Export-JP",
      "General Market",
      "AFM",
    ][Math.floor(Math.random() * 7)],
    skuCount: Math.floor(Math.random() * 15) + 1,
    totalKg: Math.floor(Math.random() * 15000) + 1000,
    priority: ["Normal", "High", "Urgent"][Math.floor(Math.random() * 3)],
    status: status,
    progress: Math.floor(Math.random() * 100),
    delayDetected: status === "IN_PROCESS" && Math.random() > 0.7,
    createdBy: ["Admin", "Planner_JS", "Planner_TK", "System_Auto"][
      Math.floor(Math.random() * 4)
    ],
  };
});

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
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [loading, setLoading] = useState(true);
  const [activeMainTab, setActiveMainTab] = useState("PLANNING (PL)");
  const { data: dailyReports } = useCollection<any>('daily_production_reports');

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const syncedData = useMemo(() => {
    return MOCK_PL_DATA.map(pl => {
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
        item.plNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customer.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus =
        statusFilter === "ALL" || item.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [syncedData, searchTerm, statusFilter]);

  // Pagination basics
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, itemsPerPage]);

  // KPIs
  const totalPL = filteredData.length;
  const totalVolume = filteredData.reduce((sum, i) => sum + i.totalKg, 0);
  const pendingPL = filteredData.filter((i) =>
    ["DRAFT", "CONFIRMED"].includes(i.status),
  ).length;
  const completedPL = filteredData.filter(
    (i) => i.status === "COMPLETED",
  ).length;

  const delayedCount = syncedData.filter((i) => i.delayDetected).length;
  const [showAlarm, setShowAlarm] = useState(delayedCount > 0);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-transparent">
        <div className="flex flex-col items-center gap-4">
          <Icons.Loader2 size={48} className="animate-spin text-[#212c46]" />
          <span className="text-[#212c46] font-black uppercase tracking-widest text-sm animate-pulse">
            Loading Planning Data...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 w-full flex-col animate-fadeIn bg-transparent space-y-4">
      <style>{globalStyles}</style>

      <UserGuideButton onClick={() => setIsGuideOpen(true)} />
      <UserGuidePanel
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

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

      {/* ALARM POP-UP */}
      {showAlarm && (
        <div className="fixed bottom-6 right-6 z-50 bg-white border border-red-200 shadow-2xl rounded-2xl p-4 w-[320px] animate-fadeIn flex flex-col gap-2">
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
      <div className="h-14 px-8 flex flex-row items-center justify-between gap-4 z-20 shrink-0">
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

      <div className="max-w-[1532px] mx-auto px-4 sm:px-8 w-full mt-[2px]">
        {/* KPI STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 shrink-0">
          <KpiCard
            label="Total Plans"
            value={totalPL}
            icon="file-spreadsheet"
            colorAccent="#4d87a8"
            colorValue={THEME.primary}
            desc="Sales Orders"
          />
          <KpiCard
            label="Target Volume"
            value={(totalVolume / 1000).toFixed(1)}
            unit="TON"
            icon="weight"
            colorAccent="#932c2e"
            colorValue={THEME.primary}
            desc="Total Mass"
          />
          <KpiCard
            label="Pending"
            value={pendingPL}
            icon="clock"
            colorAccent="#f59e0b"
            colorValue={THEME.primary}
            desc="Draft & Confirmed"
          />
          <KpiCard
            label="Completed"
            value={completedPL}
            icon="check-circle"
            colorAccent="#2e7d32"
            colorValue={THEME.primary}
            desc="Finished Plans"
          />
        </div>

        <div className="w-full flex-1 flex flex-col min-h-[500px]">
          <div className="sys-table-card border-[#eaeaec] flex flex-col flex-1 shadow-lg bg-white overflow-hidden rounded-3xl border">
            {/* TOOLBAR */}
            <div className="px-5 py-4 border-b border-[#eaeaec] flex flex-col md:flex-row justify-between items-center bg-white shrink-0 gap-4">
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
                <button className="bg-white border border-[#eaeaec] hover:border-[#4d87a8] hover:text-[#4d87a8] text-[#7a8b95] px-4 py-2 rounded-xl font-bold text-[12px] uppercase tracking-widest flex items-center gap-2 shadow-sm transition-colors hidden md:flex h-10 shrink-0">
                  <Icons.Download size={14} /> Export
                </button>
                <button className="bg-[#212c46] hover:bg-[#414757] text-white px-5 py-2 rounded-xl font-black text-[12px] uppercase tracking-widest shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap shrink-0 h-10 border border-[#212c46]">
                  <Icons.Plus size={14} /> CREATE PL
                </button>
              </div>
            </div>

            {/* TABLE */}
            <div className="flex-1 overflow-auto custom-scrollbar bg-slate-50/50">
              <table className="w-full text-left min-w-[1100px] border-collapse bg-white">
                <thead className="bg-[#f8f9fa] text-[#7a8b95] border-b border-[#eaeaec] sticky top-0 z-10 font-bold uppercase tracking-widest text-[10px]">
                  <tr>
                    <th className="py-4 px-6 text-center w-16 align-middle font-black shadow-sm">
                      #
                    </th>
                    <th className="py-4 px-6 align-middle font-black shadow-sm">
                      PL NO.
                    </th>
                    <th className="py-4 px-6 align-middle font-black shadow-sm">
                      Date
                    </th>
                    <th className="py-4 px-6 text-center align-middle font-black shadow-sm">
                      Shift
                    </th>
                    <th className="py-4 px-6 align-middle font-black shadow-sm">
                      Customer/Ref
                    </th>
                    <th className="py-4 px-6 align-middle font-black shadow-sm">
                      Priority
                    </th>
                    <th className="py-4 px-6 text-center align-middle font-black shadow-sm">
                      Items
                    </th>
                    <th className="py-4 px-6 text-right align-middle font-black shadow-sm">
                      Volume (KG)
                    </th>
                    <th className="py-4 px-6 w-[150px] align-middle font-black shadow-sm">
                      Progress
                    </th>
                    <th className="py-4 px-6 text-center align-middle font-black shadow-sm">
                      Status
                    </th>
                    <th className="py-4 px-6 text-right w-24 align-middle font-black shadow-sm pr-8">
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
                      <td className="py-3 px-6 text-center text-[#7a8b95] font-black font-mono text-[11px] align-middle">
                        {indexOfFirstItem + idx + 1}
                      </td>
                      <td className="py-3 px-6 align-middle">
                        <div className="flex flex-col">
                          <span className="font-mono font-bold text-[#932c2e] text-[12px] leading-tight">
                            {item.plNo}
                          </span>
                          <span className="text-[9px] text-[#7a8b95] font-bold uppercase tracking-widest flex items-center gap-1 mt-0.5">
                            <Icons.User size={10} /> {item.createdBy}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-6 text-[#212c46] font-mono font-black text-[11px] align-middle">
                        {new Date(item.date).toLocaleDateString("en-GB")}
                      </td>
                      <td className="py-3 px-6 text-center align-middle">
                        <span className={`border font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm ${getShiftStyle(item.shift)}`}>
                          {item.shift}
                        </span>
                      </td>
                      <td className="py-3 px-6 align-middle">
                        <span className="bg-[#f8f9fa] border border-[#eaeaec] text-[#414757] font-bold text-[11px] px-2.5 py-1 rounded-md">
                          {item.customer}
                        </span>
                      </td>
                      <td className="py-3 px-6 align-middle text-[11px]">
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
                      <td className="py-3 px-6 text-center align-middle">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#f8f9fa] border border-[#eaeaec] text-[#212c46] font-black text-[11px] font-mono">
                          {item.skuCount}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right align-middle">
                        <div className="flex flex-col items-end">
                          <span className="font-mono font-black text-[#212c46] text-[12px] flex items-center justify-end gap-1.5">
                            {item.status === "IN_PROCESS" && !item.delayDetected && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>}
                            {item.actualKg > 0 ? (
                                <span><span className="text-[#3f809e]">{item.actualKg.toLocaleString()}</span> / {item.totalKg.toLocaleString()}</span>
                            ) : (
                                <span>{item.totalKg.toLocaleString()}</span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-6 align-middle">
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
                      <td className="py-3 px-6 text-center align-middle relative">
                        <span
                          className={`border font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-md ${item.delayDetected ? 'bg-red-100 text-red-600 border-red-300 animate-pulse' : getStatusStyle(item.status)}`}
                        >
                          {item.delayDetected ? "DELAYED" : item.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right pr-8 align-middle">
                        <div className="flex items-center justify-end gap-[1px]">
                          <button
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#eaeaec] text-[#4d87a8] hover:border-[#212c46] hover:text-[#a94228] hover:bg-[#212c46]/5 transition-all shadow-sm bg-white active:scale-90"
                            title="View"
                          >
                            <Icons.Eye size={16} />
                          </button>
                          {!["COMPLETED", "CANCELLED"].includes(
                            item.status,
                          ) && (
                            <button
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
                      <td colSpan={10} className="py-16 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
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
