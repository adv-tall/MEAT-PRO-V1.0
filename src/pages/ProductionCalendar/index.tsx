import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import * as Icons from "lucide-react";
import {
  Calendar as CalendarIcon,

  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Clock,
  List,
  LayoutGrid,
  HelpCircle,
  X,
  Eye,
  Pencil,
  Trash2,
  Save,
  CalendarDays,
  BookOpen,
  ShoppingCart,
  AlertTriangle,
  ShieldCheck,
  Database,
  CheckCircle,
  Zap,
  Palmtree,
  Loader2,
  Factory,
} from "lucide-react";
import KpiCard from "@/src/components/shared/KpiCard";
import { UserGuidePanel } from "@/src/components/shared/UserGuidePanel";
import UserGuideButton from "@/src/components/shared/UserGuideButton";
import { GASService } from "@/src/services/GoogleAppsScriptService";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
const MySwal = withReactContent(Swal);

// --- Theme Configuration (Synced Palette) ---
const THEME = {
  bgGradient: "linear-gradient(135deg, #f8f9fa 50%, #eaeaec 100%)",
  primary: "#212c46",
  primaryLight: "#4d87a8",
  accent: "#b58c4f",
  gold: "#b7a159",
  brightGold: "#b58c4f",
  success: "#932c2e",
  danger: "#d96245",
  mainRed: "#932c2e",
  skyBlue: "#4d87a8",
  dustyBlue: "#7a8b95",
  indigo: "#212c46",
  softPurple: "#4d87a8",
  deepPurple: "#212c46",
  pinkAccent: "#d96245",
  mutedSlate: "#7a8b95",
  darkSlate: "#212c46",
  silver: "#eaeaec",
  deepNavy: "#212c46",
  brownGold: "#b58c4f",
  vibrantPurple: "#212c46",
  burntOrange: "#d96245",
  slateBlue: "#4d87a8",
  coolGray: "#7a8b95",
};

// --- Helper Components ---



// --- Main App Component ---
export default function ProductionCalendar() {
  const [activeTab, setActiveTab] = useState("calendar");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [holidayForm, setHolidayForm] = useState<any>({
    id: "",
    date: "",
    title: "",
    time: "00:00",
    type: "Holiday",
    priority: "High",
    status: "Scheduled",
    isYearlyRepeat: true,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(false);

  const [events, setEvents] = useState<any[]>([]);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const response = await GASService.read("CalendarEvents");
      if (response && response.data && response.data.items) {
        setEvents(response.data.items);
      }
    } catch (error) {
      console.error("Failed to fetch calendar events:", error);
      // MySwal.fire('Error', 'Unable to load events from server.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const THAI_HOLIDAYS = [
    { month: 1, day: 1, title: "วันขึ้นปีใหม่" },
    { month: 3, day: 3, title: "วันมาฆบูชา" },
    { month: 4, day: 13, title: "วันสงกรานต์" },
    { month: 4, day: 14, title: "วันสงกรานต์" },
    { month: 4, day: 15, title: "วันสงกรานต์" },
    { month: 5, day: 1, title: "วันแรงงานแห่งชาติ" },
    {
      month: 6,
      day: 3,
      title:
        "วันเฉลิมพระชนมพรรษา สมเด็จพระนางเจ้าสุทิดา พัชรสุธาพิมลลักษณ พระบรมราชินี",
    },
    {
      month: 7,
      day: 28,
      title:
        "วันเฉลิมพระชนมพรรษา พระบาทสมเด็จพระปรเมนทรรามาธิบดี ศรีสินทรมหาวชิราลงกรณ พระวชิรเกล้าเจ้าอยู่หัว (รัชกาลที่ 10)",
    },
    { month: 8, day: 12, title: "วันแม่แห่งชาติ" },
    { month: 10, day: 13, title: "วันหยุดชดเชย วันนวมินทรมหาราช" },
    { month: 10, day: 23, title: "วันปิยมหาราช" },
    { month: 12, day: 5, title: "วันพ่อแห่งชาติ" },
    { month: 12, day: 31, title: "วันสิ้นปี" },
  ];

  const getHolidaysForYear = (year: number) => {
    return THAI_HOLIDAYS.map((h, i) => ({
      id: `HOLIDAY-${year}-${h.month}-${h.day}-${i}`,
      date: `${year}-${String(h.month).padStart(2, "0")}-${String(h.day).padStart(2, "0")}`,
      title: h.title,
      time: "00:00",
      type: "Holiday",
      priority: "High",
      status: "Confirmed",
      color:
        "bg-[#d96245]/20 text-[#d96245] border-[#d96245] border-dashed border-2",
      isSystemHoliday: true,
    }));
  };

  const allEvents = useMemo(() => {
    const year = currentDate.getFullYear();
    // Preload holidays for current, previous, and next year to be safe
    const holidays = [
      ...getHolidaysForYear(year - 1),
      ...getHolidaysForYear(year),
      ...getHolidaysForYear(year + 1),
    ];
    const customEvents: any[] = [];
    events.forEach((ev) => {
      if (ev.type === "Holiday" && ev.isYearlyRepeat) {
        if (ev.date) {
          const parts = ev.date.split("-");
          if (parts.length >= 3) {
            const m = parts[1];
            const d = parts[2];
            customEvents.push({
              ...ev,
              date: `${year - 1}-${m}-${d}`,
              id: `${ev.id}-prev`,
            });
            customEvents.push({ ...ev, date: `${year}-${m}-${d}` });
            customEvents.push({
              ...ev,
              date: `${year + 1}-${m}-${d}`,
              id: `${ev.id}-next`,
            });
          } else {
            customEvents.push(ev);
          }
        }
      } else {
        customEvents.push(ev);
      }
    });

    return [...holidays, ...customEvents];
  }, [events, currentDate]);

  const [eventForm, setEventForm] = useState({
    id: "",
    date: "",
    title: "",
    time: "",
    type: "Meeting",
    priority: "Normal",
    status: "Scheduled",
  });

  // Calendar Logic
  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push({ day: null });
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push({
        day: i,
        dateStr,
        isToday: dateStr === new Date().toISOString().split("T")[0],
        isSunday: new Date(year, month, i).getDay() === 0,
        isSaturday: new Date(year, month, i).getDay() === 6,
      });
    }
    while (days.length < 42) days.push({ day: null });
    return days;
  }, [currentDate]);

  const filteredEvents = useMemo(() => {
    return allEvents
      .filter((ev) => {
        const matchSearch =
          (ev.title || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
          (ev.type || "").toLowerCase().includes((searchQuery || "").toLowerCase());
        const evMonth = ev.date?.substring(0, 7) || "";
        const currMonth = currentDate.toISOString().substring(0, 7);
        return (
          matchSearch && (activeTab === "list" ? true : evMonth === currMonth)
        );
      })
      .sort(
        (a: any, b: any) =>
          new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
  }, [allEvents, searchQuery, currentDate, activeTab]);

  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage) || 1;

  const handleOpenModal = (
    mode: string,
    event: any = null,
    prefillDate: any = null,
  ) => {
    setModalMode(mode);
    setEventForm(
      event
        ? { ...event }
        : {
            id: `EV-${currentDate.getFullYear().toString().substring(2)}${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(events.length + 1).padStart(3, "0")}`,
            date: prefillDate || new Date().toISOString().split("T")[0],
            title: "",
            time: "09:00",
            type: "Meeting",
            priority: "Normal",
            status: "Scheduled",
          },
    );
    setIsModalOpen(true);
  };

  const handleSaveHoliday = async (e: any) => {
    e.preventDefault();
    const typeColors: any = {
      Holiday:
        "bg-[#d96245]/20 text-[#d96245] border-[#d96245] border-dashed border-2",
    };
    const payload = {
      ...holidayForm,
      color:
        typeColors[holidayForm.type] ||
        "bg-[#f8f9fa] text-[#435665] border-[#eaeaec]",
    };

    setIsLoading(true);
    try {
      if (modalMode === "create") {
        await GASService.write("CalendarEvents", [payload]);
        setEvents([...events, payload]);
        MySwal.fire("Success", "Holiday Scheduled Successfully", "success");
      } else {
        await GASService.update("CalendarEvents", [payload]);
        setEvents(
          events.map((ev) => (ev.id === holidayForm.id ? payload : ev)),
        );
        MySwal.fire("Success", "Holiday Modified Successfully", "success");
      }
    } catch (error) {
      console.error("Save error:", error);
      MySwal.fire("Error", "Failed to save holiday.", "error");
    } finally {
      setIsLoading(false);
      setIsHolidayModalOpen(false);
    }
  };

  const handleSaveEvent = async (e: any) => {
    e.preventDefault();
    if ((eventForm as any).isSystemHoliday) {
      MySwal.fire("Error", "Cannot edit system holidays.", "error");
      return;
    }

    const typeColors: any = {
      Meeting: "bg-[#5372ba]/10 text-[#5372ba] border-[#5372ba]/20",
      Hearing: "bg-[#ce870a]/10 text-[#ce870a] border-[#ce870a]/20",
      Filing: "bg-[#b84530]/10 text-[#b84530] border-[#b84530]/20",
      Production: "bg-[#d96245]/10 text-[#d96245] border-[#d96245]/20",
      Maintenance: "bg-[#6293b9]/10 text-[#6293b9] border-[#6293b9]/20",
      Holiday:
        "bg-[#d96245]/20 text-[#d96245] border-[#d96245] border-dashed border-2",
    };
    const payload = {
      ...eventForm,
      color:
        typeColors[eventForm.type] ||
        "bg-[#f8f9fa] text-[#435665] border-[#eaeaec]",
    };

    setIsLoading(true);
    try {
      if (modalMode === "create") {
        await GASService.write("CalendarEvents", [payload]);
        setEvents([...events, payload]);
        MySwal.fire("Success", "Activity Scheduled Successfully", "success");
      } else {
        await GASService.update("CalendarEvents", [payload]);
        setEvents(events.map((ev) => (ev.id === eventForm.id ? payload : ev)));
        MySwal.fire("Success", "Activity Modified Successfully", "success");
      }
    } catch (error) {
      console.error("Save error:", error);
      MySwal.fire("Error", "Failed to save event.", "error");
    } finally {
      setIsLoading(false);
      setIsModalOpen(false);
    }
  };

  const handleDeleteEvent = async (id: string, isSystemHoliday?: boolean) => {
    if (isSystemHoliday) {
      MySwal.fire("Information", "System holidays cannot be deleted.", "info");
      return;
    }
    const result = await MySwal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this schedule deletion!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d96245",
      cancelButtonColor: "#7a8b95",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      setIsLoading(true);
      try {
        await GASService.delete("CalendarEvents", [{ id }]);
        setEvents(events.filter((e) => e.id !== id));
        MySwal.fire("Deleted!", "Activity has been deleted.", "success");
      } catch (error) {
        console.error("Delete error:", error);
        MySwal.fire("Error", "Failed to delete event.", "error");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-1 w-full flex-col animate-fadeIn bg-transparent space-y-4">
      {/* USER GUIDE FLOATING TAB */}
      <UserGuideButton onClick={() => setIsGuideOpen(true)} />

      <UserGuidePanel
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        title="CALENDAR GUIDE"
        subtitle="OPERATIONAL SCHEDULE MANAGEMENT"
      >
        <div className="space-y-8">
            <div>
                <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                    <Icons.ShoppingCart size={16} className="text-[#b7a159]" /> 1. SALES PLANNING
                </h3>
                <p className="mb-4">ใช้เพื่อติดตามและนัดหมายกิจกรรมสำคัญในระบบจัดซื้อ เช่น :</p>
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#3f809e] mt-0.5 shrink-0"></div>
                        <div>
                            <span className="font-bold text-[#3f809e]">Audit: </span>
                            การเข้าตรวจประเมินโรงงานผู้ขาย (Supplier Audit)
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#b58c4f] mt-0.5 shrink-0"></div>
                        <div>
                            <span className="font-bold text-[#b58c4f]">Quality: </span>
                            ติดตามและทบทวนเอกสาร SCAR หรือปัญหาคุณภาพ
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#688a58] mt-0.5 shrink-0"></div>
                        <div>
                            <span className="font-bold text-[#688a58]">Contract: </span>
                            วันครบกำหนดสัญญาจ้าง หรือรอบการต่อสัญญาประจำปี
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-px bg-[#eaeaec] w-full" />

            <div>
                <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                    <Icons.AlertTriangle size={16} className="text-[#d55a6d]" /> 2. PRIORITY MANAGEMENT
                </h3>
                <p className="mb-4">ระบบจะใช้สีเพื่อจำแนกระดับความสำคัญของงาน (Priority Level) เพื่อง่ายต่อการจัดลำดับความเร่งด่วน :</p>
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#d55a6d] shrink-0"></div>
                        <div><span className="font-bold text-[#d55a6d]">Critical:</span> งานด่วนมาก / ต้องดำเนินการทันที</div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#b58c4f] shrink-0"></div>
                        <div><span className="font-bold text-[#b58c4f]">High:</span> งานสำคัญ / เตรียมดำเนินการ</div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#5372ba] shrink-0"></div>
                        <div><span className="font-bold text-[#5372ba]">Normal:</span> งานปกติตามรอบระยะเวลา</div>
                    </div>
                </div>
            </div>
            
            <div className="h-px bg-[#eaeaec] w-full" />

            <div>
                <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                    <Icons.LayoutGrid size={16} className="text-[#3f809e]" /> 3. VIEWS & NAVIGATION
                </h3>
                <div className="p-4 bg-[#f8f9fa] border border-[#eaeaec] rounded-xl">
                    คุณสามารถสลับมุมมองระหว่าง <span className="font-bold">Calendar View</span> (แบบปฏิทินรายเดือน) เพื่อดูภาพรวม และ <span className="font-bold">List View</span> (แบบตาราง) เพื่อจัดการข้อมูล ค้นหา หรือแก้ไขรายละเอียดเชิงลึกได้อย่างสะดวกสบาย
                </div>
            </div>
        </div>
      </UserGuidePanel>

      {/* HEADER SECTION */}
      <div className="h-14 px-4 sm:px-8 flex flex-row items-center justify-between gap-4 z-20 shrink-0">
        <div className="flex items-center gap-5">
          <div className="relative flex items-center justify-center group cursor-default shrink-0">
            <div className="absolute inset-0 bg-[#3f809e] blur-[15px] opacity-20 rounded-full group-hover:opacity-60 transition-all duration-700"></div>
            <div className="relative z-10 p-1.5 border border-[#3f809e]/40 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm">
              <CalendarDays
                size={28}
                strokeWidth={2.5}
                className="text-[#3f809e]"
              />
            </div>
          </div>
          <div>
            <h3
              className="font-black text-[#212c46] uppercase tracking-tighter leading-none"
              style={{ fontSize: "24px" }}
            >
              PROD{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3f809e] to-[#b58c4f]">
                CALENDAR
              </span>{" "}
              HUB
            </h3>
            <p className="text-[11px] font-bold text-[#4d5a44] uppercase tracking-[0.2em] mt-0.5 opacity-80 leading-none">
              STRATEGIC OPERATIONAL SCHEDULE & SALES PLAN
            </p>
          </div>
        </div>

        <div className="flex bg-[#f8f9fa] border border-[#eaeaec] p-1 rounded-full shadow-sm inline-flex">
          <button
            onClick={() => setActiveTab("calendar")}
            className={`px-5 py-2 text-[11px] font-black uppercase tracking-widest rounded-full transition-all flex items-center gap-2 ${activeTab === "calendar" ? "bg-[#212c46] text-[#d7d7d7] shadow-md" : "text-[#7a8b95] hover:text-[#932c2e]"}`}
          >
            <LayoutGrid size={14} /> Calendar View
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={`px-5 py-2 text-[11px] font-black uppercase tracking-widest rounded-full transition-all flex items-center gap-2 ${activeTab === "list" ? "bg-[#212c46] text-[#d7d7d7] shadow-md" : "text-[#7a8b95] hover:text-[#932c2e]"}`}
          >
            <List size={14} /> List View
          </button>
        </div>
      </div>

      <div className="mx-auto px-4 sm:px-8 w-full mt-[2px]">
        <div className="w-full">
          {/* KPI STATS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-5 shrink-0">
            <KpiCard
              title="Scheduled Tasks"
              val={filteredEvents.length}
              icon={Database}
              color={THEME.primaryLight}
              desc="Current View"
            />
            <KpiCard
              title="Critical Deadlines"
              val={events.filter((e) => e.priority === "Critical").length}
              icon={AlertTriangle}
              color={THEME.danger}
              desc="Action Required"
            />
            <KpiCard
              title="Production Plans"
              val={events.filter((e) => e.type === "Production").length}
              icon={Factory}
              color={THEME.accent}
              desc="Operational Node"
            />
            <KpiCard
              title="Sync Status"
              val="Live"
              icon={CheckCircle}
              color={THEME.success}
              desc="System Synced"
            />
          </div>

          {/* CONTENT BLOCK - CALENDAR OR LIST */}
          <div className="bg-white rounded-xl shadow-sm border border-[#eaeaec]/60 overflow-hidden flex flex-col animate-fadeIn relative">
            {isLoading && (
              <div className="absolute inset-0 z-50 bg-white/50 backdrop-blur-[2px] flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-[#212c46]" />
              </div>
            )}
            <div className="px-8 py-4 bg-[#f8f9fa] flex flex-col md:flex-row justify-between items-center gap-4 border-b border-[#eaeaec]/60 shrink-0">
              {/* MONTH/YEAR NAVIGATION BAR */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="flex items-center justify-between bg-white px-2 py-1.5 rounded-xl border border-[#eaeaec] shadow-sm min-w-[220px]">
                  <button
                    onClick={() =>
                      setCurrentDate(
                        new Date(
                          currentDate.getFullYear(),
                          currentDate.getMonth() - 1,
                        ),
                      )
                    }
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-[#5372ba] hover:bg-[#f8f9fa] transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <h4 className="text-[13px] font-black uppercase text-[#212c46] tracking-widest">
                    {currentDate.toLocaleString("en-US", { month: "long" })}{" "}
                    {currentDate.getFullYear()}
                  </h4>
                  <button
                    onClick={() =>
                      setCurrentDate(
                        new Date(
                          currentDate.getFullYear(),
                          currentDate.getMonth() + 1,
                        ),
                      )
                    }
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-[#5372ba] hover:bg-[#f8f9fa] transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="bg-white border border-[#eaeaec] text-[#212c46] px-6 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-sm hover:bg-[#f8f9fa] transition-colors"
                >
                  TODAY
                </button>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
                <div className="relative flex-1 md:w-72 min-w-[200px]">
                  <Search
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7691ad]"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search activities..."
                    className="w-full pl-12 pr-4 py-2.5 text-[12px] border border-[#eaeaec] rounded-xl font-bold outline-none focus:border-[#b7a159] bg-white shadow-sm text-[#212c46]"
                  />
                </div>
                <button
                  onClick={() => handleOpenModal("create")}
                  className="bg-[#212c46] text-[#b7a159] hover:bg-[#254268] hover:text-white px-6 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-sm transition-all flex items-center gap-2 border border-[#212c46] shrink-0"
                >
                  <Plus size={16} strokeWidth={3} /> Add Task
                </button>
                <button
                  onClick={() => {
                    const d = new Date();
                    setHolidayForm({
                      id: `HOLIDAY-${d.getFullYear().toString().substring(2)}${String(d.getMonth() + 1).padStart(2, "0")}-${String(events.length + 1).padStart(3, "0")}`,
                      date: d.toISOString().split("T")[0],
                      title: "",
                      time: "00:00",
                      type: "Holiday",
                      priority: "High",
                      status: "Scheduled",
                      isYearlyRepeat: true,
                    });
                    setModalMode("create");
                    setIsHolidayModalOpen(true);
                  }}
                  className="bg-white text-[#d96245] px-5 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-sm hover:bg-[#d96245] hover:text-white transition-all flex items-center gap-2 border border-[#eaeaec] hover:border-[#d96245] shrink-0"
                >
                  <Palmtree size={16} /> Holiday
                </button>
              </div>
            </div>

            <div className="overflow-auto custom-scrollbar">
              {activeTab === "calendar" ? (
                <div className="grid grid-cols-7 border-b border-[#eaeaec]">
                  {daysOfWeek.map((d) => {
                    let bgClass = "bg-[#212c46] text-[#eaeaec]";
                    if (d === "SUN") bgClass = "bg-[#d96245] text-white";
                    else if (d === "SAT") bgClass = "bg-[#999dc7] text-white";
                    return (
                      <div
                        key={d}
                        className={`py-3 text-center text-[12px] font-black tracking-widest border-r border-[#ffffff20] last:border-r-0 ${bgClass}`}
                      >
                        {d}
                      </div>
                    );
                  })}
                  {calendarDays.map((d, i) => {
                    const dayEvents = allEvents.filter(
                      (e) => e.date === d.dateStr,
                    );
                    return (
                      <div
                        key={i}
                        className={`min-h-[135px] border-r border-b border-[#eaeaec]/50 p-2.5 group transition-all relative ${!d.day ? "bg-[#f8f9fa]/50 opacity-40" : "bg-white hover:bg-[#f8f9fa]"}`}
                      >
                        {d.day && (
                          <div className="h-full flex flex-col relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenModal("create", null, d.dateStr);
                              }}
                              className="absolute -top-1 -right-1 w-6 h-6 bg-[#212c46] text-[#b7a159] rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-[#b7a159] hover:text-[#212c46] z-20"
                              title="Add Task to this date"
                            >
                              <Plus size={14} strokeWidth={3} />
                            </button>
                            <div className="flex justify-between items-start mb-2">
                              <span
                                className={`text-[14px] font-black ${d.isToday ? "bg-[#212c46] text-[#b7a159] w-8 h-8 flex items-center justify-center rounded-xl shadow-md transform rotate-3" : d.isSunday ? "text-[#d96245]" : "text-[#7691ad]"}`}
                              >
                                {d.day}
                              </span>
                              {dayEvents.length > 0 && (
                                <span className="text-[9px] font-black text-[#212c46] bg-[#eaeaec] px-1.5 py-0.5 rounded-md uppercase border border-[#b7a159] mr-6">
                                  {dayEvents.length} Tasks
                                </span>
                              )}
                            </div>
                            <div className="space-y-1.5 overflow-y-auto custom-scrollbar flex-1 max-h-[90px]">
                              {dayEvents.map((ev) => (
                                <div
                                  key={ev.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenModal("view", ev);
                                  }}
                                  className={`px-2.5 py-1.5 rounded-md text-[11px] font-black border truncate cursor-pointer hover:brightness-95 transition-all shadow-sm ${ev.color}`}
                                >
                                  {ev.title}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <table className="w-full text-left border-collapse table-font">
                  <thead className="sys-table-header sticky top-0 z-10 [#b58c4f] ">
                    <tr>
                      <th className="font-black uppercase tracking-widest  whitespace-nowrap">
                        ID Code
                      </th>
                      <th className="font-black uppercase tracking-widest  whitespace-nowrap">
                        Schedule Info
                      </th>
                      <th className="font-black uppercase tracking-widest  whitespace-nowrap">
                        Activity Description
                      </th>
                      <th className="font-black uppercase tracking-widest  text-center">
                        Category
                      </th>
                      <th className="font-black uppercase tracking-widest  text-center">
                        Priority
                      </th>
                      <th className="font-black uppercase tracking-widest  text-center">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[#eaeaec]">
                    {paginatedEvents.length > 0 ? (
                      paginatedEvents.map((ev) => (
                        <tr
                          key={ev.id}
                          className="hover:bg-[#f8f9fa] transition-colors group"
                        >
                          <td className="px-4 font-mono font-black text-[#7691ad] uppercase text-[12px] py-2.5">
                            {ev.id}
                          </td>
                          <td className="px-4 text-[12px] py-2.5">
                            <div className="flex flex-col">
                              <span className="font-black text-[#212c46]">
                                {new Date(ev.date).toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                              <span className="text-[11px] text-[#ce870a] font-black flex items-center gap-[1px] uppercase tracking-tight mt-0.5">
                                <Clock size={12} /> {ev.time} HRS
                              </span>
                            </div>
                          </td>
                          <td className="px-4 font-black text-[#212c46] uppercase tracking-tight text-[12px] py-2.5">
                            {ev.title}
                          </td>
                          <td className="px-4 text-center text-[12px] py-2.5">
                            <span
                              className={`px-4 py-1 rounded-md text-[11px] font-black border uppercase tracking-widest ${ev.color}`}
                            >
                              {ev.type}
                            </span>
                          </td>
                          <td className="px-4 text-center text-[12px] py-2.5">
                            <div
                              className={`inline-flex items-center justify-center gap-[1px] px-3 py-1 rounded-full text-[11px] font-black uppercase border tracking-widest ${ev.priority === "Critical" ? "bg-[#d96245]/10 text-[#d96245] border-[#d96245]/30" : ev.priority === "High" ? "bg-[#ce870a]/10 text-[#ce870a] border-[#ce870a]/30" : "bg-[#5372ba]/10 text-[#5372ba] border-[#5372ba]/30"}`}
                            >
                              <div
                                className={`w-1.5 h-1.5 rounded-full ${ev.priority === "Critical" ? "bg-[#d96245] animate-pulse" : "bg-current"}`}
                              ></div>
                              {ev.priority}
                            </div>
                          </td>
                          <td className="px-4 text-center text-[12px] py-2.5">
                            <div className="flex justify-center items-center gap-[1px]">
                              <button
                                onClick={() => handleOpenModal("view", ev)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#eaeaec] text-[#5372ba] hover:border-[#212c46] hover:text-[#212c46] hover:bg-[#212c46]/5 bg-white transition-all shadow-sm active:scale-90"
                                title="View"
                              >
                                <Eye size={16} />
                              </button>
                              {!ev.isSystemHoliday && (
                                <button
                                  onClick={() => handleOpenModal("edit", ev)}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#eaeaec] text-[#ce870a] hover:border-[#212c46] hover:text-[#212c46] hover:bg-[#212c46]/5 bg-white transition-all shadow-sm active:scale-90"
                                  title="Edit"
                                >
                                  <Pencil size={16} />
                                </button>
                              )}
                              {!ev.isSystemHoliday && (
                                <button
                                  onClick={() =>
                                    handleDeleteEvent(ev.id, ev.isSystemHoliday)
                                  }
                                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#eaeaec] text-[#d96245] hover:border-[#212c46] hover:text-[#212c46] hover:bg-[#212c46]/5 bg-white transition-all shadow-sm active:scale-90"
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="0 text-center text-[#7691ad] font-black uppercase tracking-widest text-[12px] opacity-60 py-2.5 px-4"
                        >
                          No scheduled events found for this criteria
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* PAGINATION */}
            {activeTab === "list" && (
              <div className="px-8 py-3 bg-[#d7d7d7] border-t-[1.5px] border-slate-300 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
                <div className="flex items-center gap-6 text-[11px] font-black text-[#7691ad] uppercase tracking-widest">
                  <div className="flex items-center gap-3">
                    <span>Display Rows:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="bg-white border border-[#eaeaec] rounded-lg px-3 py-1.5 outline-none focus:border-[#b7a159] text-[#212c46] cursor-pointer shadow-sm font-black text-[12px]"
                    >
                      {[5, 10, 20, 50].map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="bg-white px-4 py-2 rounded-xl border border-[#eaeaec] shadow-sm">
                    Total Activities: {filteredEvents.length}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className={`w-10 h-10 border border-[#eaeaec] bg-white rounded-xl flex items-center justify-center transition-all ${currentPage === 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-[#212c46] hover:text-[#b7a159] shadow-md active:scale-90"}`}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <div className="bg-[#212c46] text-[#b7a159] px-8 py-2.5 rounded-xl shadow-md font-black text-[11px] min-w-[140px] text-center uppercase tracking-widest border border-[#212c46]">
                    Page {currentPage} / {totalPages || 1}
                  </div>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages || totalPages === 0}
                    className={`w-10 h-10 border border-[#eaeaec] bg-white rounded-xl flex items-center justify-center transition-all ${currentPage === totalPages ? "opacity-30 cursor-not-allowed" : "hover:bg-[#212c46] hover:text-[#b7a159] shadow-md active:scale-90"}`}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL SYSTEM */}
      {isModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#212c46]/80 backdrop-blur-md p-4 animate-fadeIn">
            <div className="bg-[#f8f9fa] rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden relative border border-[#b7a159]">
              <div className="bg-[#212c46] px-8 py-6 flex justify-between items-center shrink-0 border-b-4 border-[#b7a159] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 scale-150">
                  <CalendarDays size={120} className="text-white" />
                </div>
                <div className="flex items-center gap-5 relative z-10">
                  <div className="w-14 h-14 rounded-xl bg-white/10 text-[#b7a159] flex items-center justify-center border border-white/20 shadow-md backdrop-blur-md">
                    <CalendarIcon size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[#eaeaec] uppercase tracking-widest leading-none">
                      {modalMode === "create"
                        ? "Schedule Activity"
                        : modalMode === "view"
                          ? "Activity Record"
                          : "Modify Schedule"}
                    </h3>
                    <p className="text-[12px] font-bold text-[#7691ad] uppercase tracking-widest mt-1.5 flex items-center gap-2">
                      <Zap size={12} className="text-[#b7a159]" /> Strategic
                      Operations Planning
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-[#9094ac] hover:text-[#d96245] transition-all bg-white/5 hover:bg-white/10 p-2.5 rounded-full active:scale-90 relative z-10"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar">
                <form
                  id="calendarForm"
                  onSubmit={handleSaveEvent}
                  className="space-y-6 bg-white p-6 rounded-xl border border-[#eaeaec] shadow-sm"
                >
                  <div>
                    <label className="text-[11px] font-black text-[#212c46] uppercase tracking-widest block mb-2">
                      Activity Description{" "}
                      <span className="text-[#d96245]">*</span>
                    </label>
                    <input
                      required
                      disabled={modalMode === "view"}
                      value={eventForm.title}
                      onChange={(e) =>
                        setEventForm({ ...eventForm, title: e.target.value })
                      }
                      className="w-full bg-white border border-[#eaeaec] rounded-lg px-4 py-2.5 text-[12px] font-black text-[#212c46] uppercase outline-none focus:border-[#b7a159] transition-all shadow-sm disabled:bg-[#f8f9fa]"
                      placeholder="e.g. Audit Vendor Premises"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="text-[11px] font-black text-[#212c46] uppercase tracking-widest block mb-2">
                        Target Date <span className="text-[#d96245]">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        disabled={modalMode === "view"}
                        value={eventForm.date}
                        onChange={(e) =>
                          setEventForm({ ...eventForm, date: e.target.value })
                        }
                        className="w-full bg-white border border-[#eaeaec] rounded-lg px-4 py-2.5 text-[12px] font-black text-[#212c46] outline-none focus:border-[#b7a159] transition-all shadow-sm disabled:bg-[#f8f9fa] font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-black text-[#212c46] uppercase tracking-widest block mb-2">
                        Execution Time <span className="text-[#d96245]">*</span>
                      </label>
                      <input
                        type="time"
                        required
                        disabled={modalMode === "view"}
                        value={eventForm.time}
                        onChange={(e) =>
                          setEventForm({ ...eventForm, time: e.target.value })
                        }
                        className="w-full bg-white border border-[#eaeaec] rounded-lg px-4 py-2.5 text-[12px] font-black text-[#212c46] outline-none focus:border-[#b7a159] transition-all shadow-sm disabled:bg-[#f8f9fa] font-mono"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="text-[11px] font-black text-[#212c46] uppercase tracking-widest block mb-2">
                        Workstream Category{" "}
                        <span className="text-[#d96245]">*</span>
                      </label>
                      <select
                        disabled={modalMode === "view"}
                        value={eventForm.type}
                        onChange={(e) =>
                          setEventForm({ ...eventForm, type: e.target.value })
                        }
                        className="w-full bg-white border border-[#eaeaec] rounded-lg px-4 py-2.5 text-[12px] font-black text-[#212c46] outline-none cursor-pointer focus:border-[#b7a159] transition-all shadow-sm disabled:bg-[#f8f9fa]"
                      >
                        <option value="Meeting">Meeting</option>
                        <option value="Production">Production</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Audit">Audit</option>
                        <option value="Cleaning">Cleaning</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-black text-[#212c46] uppercase tracking-widest block mb-2">
                        Priority Level <span className="text-[#d96245]">*</span>
                      </label>
                      <select
                        disabled={modalMode === "view"}
                        value={eventForm.priority}
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            priority: e.target.value,
                          })
                        }
                        className="w-full bg-white border border-[#eaeaec] rounded-lg px-4 py-2.5 text-[12px] font-black text-[#212c46] outline-none cursor-pointer focus:border-[#b7a159] transition-all shadow-sm disabled:bg-[#f8f9fa]"
                      >
                        <option value="Normal">Normal</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-6 bg-[#f8f9fa] border-t border-[#eaeaec] flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-2.5 bg-white border border-[#eaeaec] text-[#435665] rounded-xl font-bold text-[12px] uppercase tracking-widest hover:bg-[#eaeaec]/30 transition-all shadow-sm"
                >
                  Cancel
                </button>
                {modalMode !== "view" ? (
                  <button
                    type="submit"
                    form="calendarForm"
                    className="bg-[#212c46] text-[#b7a159] px-8 py-2.5 rounded-xl font-black text-[12px] uppercase tracking-widest shadow-md hover:bg-[#254268] hover:text-white transition-all flex items-center gap-2 border border-[#212c46]"
                  >
                    <Save size={16} />{" "}
                    {modalMode === "create" ? "Register" : "Save Update"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setModalMode("edit")}
                    className="bg-[#212c46] text-[#b7a159] px-8 py-2.5 rounded-xl font-black text-[12px] uppercase tracking-widest shadow-md hover:bg-[#254268] hover:text-white transition-all flex items-center gap-2 border border-[#212c46]"
                  >
                    <Pencil size={16} /> Modify Activity
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
      {/* HOLIDAY MODAL SYSTEM */}
      {isHolidayModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#212c46]/80 backdrop-blur-md p-4 animate-fadeIn">
            <div className="bg-[#f8f9fa] rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden relative border border-[#d96245]">
              <div className="bg-[#d96245] px-8 py-6 flex justify-between items-center shrink-0 border-b-4 border-[#ce870a] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 scale-150">
                  <Palmtree size={120} className="text-white" />
                </div>
                <div className="flex items-center gap-5 relative z-10">
                  <div className="w-14 h-14 rounded-xl bg-white/20 text-white flex items-center justify-center border border-white/20 shadow-md backdrop-blur-md">
                    <Palmtree size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-widest leading-none">
                      Register Holiday
                    </h3>
                    <p className="text-[12px] font-bold text-white/80 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                      <Zap size={12} className="text-[#ce870a]" /> Custom
                      Holiday Schedule
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsHolidayModalOpen(false)}
                  className="text-white hover:text-[#212c46] transition-all bg-white/10 hover:bg-white/30 p-2.5 rounded-full active:scale-90 relative z-10"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar">
                <form
                  id="holidayFormProd"
                  onSubmit={handleSaveHoliday}
                  className="space-y-6 bg-white p-6 rounded-xl border border-[#eaeaec] shadow-sm"
                >
                  <div>
                    <label className="text-[11px] font-black text-[#212c46] uppercase tracking-widest block mb-2">
                      Holiday Name <span className="text-[#d96245]">*</span>
                    </label>
                    <input
                      required
                      value={holidayForm.title}
                      onChange={(e) =>
                        setHolidayForm({
                          ...holidayForm,
                          title: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-[#eaeaec] rounded-lg px-4 py-2.5 text-[12px] font-black text-[#212c46] uppercase outline-none focus:border-[#d96245] transition-all shadow-sm"
                      placeholder="e.g. Audit Vendor Premises"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-black text-[#212c46] uppercase tracking-widest block mb-2">
                      Holiday Date <span className="text-[#d96245]">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={holidayForm.date}
                      onChange={(e) =>
                        setHolidayForm({ ...holidayForm, date: e.target.value })
                      }
                      className="w-full bg-white border border-[#eaeaec] rounded-lg px-4 py-2.5 text-[12px] font-black text-[#212c46] outline-none focus:border-[#d96245] transition-all shadow-sm font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-3 bg-[#f8f9fa] border border-[#eaeaec] p-4 rounded-xl">
                    <input
                      type="checkbox"
                      id="isYearlyRepeatProd"
                      checked={holidayForm.isYearlyRepeat}
                      onChange={(e) =>
                        setHolidayForm({
                          ...holidayForm,
                          isYearlyRepeat: e.target.checked,
                        })
                      }
                      className="w-5 h-5 accent-[#d96245] cursor-pointer"
                    />
                    <label
                      htmlFor="isYearlyRepeatProd"
                      className="text-[12px] font-bold text-[#212c46] uppercase tracking-widest cursor-pointer"
                    >
                      Repeat every year (ซ้ำทุกปี)
                    </label>
                  </div>
                </form>
              </div>

              <div className="p-6 bg-[#f8f9fa] border-t border-[#eaeaec] flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsHolidayModalOpen(false)}
                  className="px-8 py-2.5 bg-white border border-[#eaeaec] text-[#435665] rounded-xl font-bold text-[12px] uppercase tracking-widest hover:bg-[#eaeaec]/30 transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="holidayFormProd"
                  className="bg-[#d96245] text-white px-8 py-2.5 rounded-xl font-black text-[12px] uppercase tracking-widest shadow-md hover:bg-[#b84530] transition-all flex items-center gap-2 border border-[#d96245]"
                >
                  <Save size={16} /> Register Holiday
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
