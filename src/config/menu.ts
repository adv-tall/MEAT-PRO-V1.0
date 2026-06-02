import {
  LayoutDashboard,
  BrainCircuit,
  Calendar,
  Settings,
  ClipboardList,
  AlertTriangle,
  CalendarClock,
  Factory,
  Settings2,
  LineChart,
  PieChart,
  BarChart,
  CircleDollarSign,
} from "lucide-react";

export interface MenuItem {
  id: string;
  path?: string;
  name: string;
  icon?: any;
  isConfidential?: boolean;
  category?: string;
  subItems?: {
    id: string;
    name: string;
    path: string;
    isConfidential?: boolean;
  }[];
}

export const MENU_ITEMS: MenuItem[] = [
  // Top Level
  {
    id: "dashboard",
    path: "/",
    name: "MES HOME",
    icon: LayoutDashboard,
    category: "TOP",
  },
  {
    id: "copilot",
    path: "/copilot",
    name: "AI COPILOT",
    icon: BrainCircuit,
    category: "TOP",
  },
  {
    id: "calendar",
    path: "/production-calendar",
    name: "CALENDAR",
    icon: Calendar,
    category: "TOP",
  },

  // OPERATIONAL MODULES
  {
    id: "planning",
    name: "PLANNING",
    icon: CalendarClock,
    category: "OPERATIONAL MODULES",
    subItems: [
      { id: "plan_pl", name: "PLANNING (PL)", path: "/planning/pl" },
      {
        id: "plan_prod",
        name: "PRODUCTION PLANNING",
        path: "/planning/production",
      },
      { id: "plan_ai", name: "AI PLANNER ASST.", path: "/planning/ai" },
    ],
  },
  {
    id: "daily_board",
    name: "DAILY BOARD",
    icon: ClipboardList,
    category: "OPERATIONAL MODULES",
    subItems: [
      {
        id: "board_tracking",
        name: "PRODUCTION TRACKING",
        path: "/board/tracking",
      },
      { id: "board_mixing", name: "MIXING BOARD", path: "/board/mixing" },
      { id: "board_packing", name: "PACKING BOARD", path: "/board/packing" },
    ],
  },
  {
    id: "daily_problem",
    name: "DAILY PROBLEM",
    icon: AlertTriangle,
    category: "OPERATIONAL MODULES",
    subItems: [
      {
        id: "prob_unplanned",
        name: "UNPLANNED JOBS",
        path: "/problem/unplanned",
      },
      {
        id: "prob_machine",
        name: "MACHINE BREAKDOWN",
        path: "/problem/machine",
      },
    ],
  },
  {
    id: "process",
    name: "PROCESS",
    icon: Factory,
    category: "OPERATIONAL MODULES",
    subItems: [
      { id: "proc_premix", name: "PREMIX", path: "/process/premix" },
      { id: "proc_mixing", name: "MIXING", path: "/process/mixing" },
      { id: "proc_forming", name: "FORMING", path: "/process/forming" },
      { id: "proc_cooking", name: "COOKING", path: "/process/cooking" },
      { id: "proc_cooling", name: "COOLING", path: "/process/cooling" },
      { id: "proc_cut_peel", name: "CUT & PEEL", path: "/process/cut-peel" },
      { id: "proc_packing", name: "PACKING", path: "/process/packing" },
    ],
  },
  {
    id: "prod_config",
    name: "PROD CONFIG",
    icon: Settings2,
    category: "OPERATIONAL MODULES",
    subItems: [
      { id: "conf_master", name: "MASTER ITEM", path: "/config/master" },
      { id: "conf_matrix", name: "PRODUCT MATRIX", path: "/config/matrix" },
      { id: "conf_formula", name: "MEAT FORMULA", path: "/config/formula" },
      {
        id: "conf_std_time",
        name: "STD PROCESS TIME",
        path: "/config/std-time",
      },
      {
        id: "conf_equipment",
        name: "EQUIPMENT REGISTRY",
        path: "/config/equipment",
      },
      { id: "conf_config", name: "CONFIG", path: "/config/general" },
    ],
  },

  // ANALYTICS & PERFORMANCE
  {
    id: "perf_analytics",
    name: "PERFORMANCE",
    icon: LineChart,
    category: "ANALYTICS & PERFORMANCE",
    subItems: [
      { id: "perf_dashboard", name: "PERFORMANCE DASHBOARD", path: "/analytics/performance" },
      { id: "perf_oee", name: "OEE MONITORING", path: "/analytics/oee" },
      { id: "perf_yield", name: "YIELD ANALYSIS", path: "/analytics/yield" },
      {
        id: "perf_downtime",
        name: "DOWNTIME TRACKING",
        path: "/analytics/downtime",
      },
      { id: "perf_cost", name: "COST ANALYSIS", path: "/analytics/cost" },
    ],
  },
  {
    id: "quality_analytics",
    name: "QUALITY ANALYTICS",
    icon: PieChart,
    category: "ANALYTICS & PERFORMANCE",
    subItems: [
      { id: "qa_metrics", name: "QUALITY METRICS", path: "/analytics/quality" },
      { id: "qa_reject", name: "REJECT ANALYSIS", path: "/analytics/reject" },
    ],
  },
  {
    id: "report_analytics",
    name: "REPORTS",
    icon: BarChart,
    category: "ANALYTICS & PERFORMANCE",
    subItems: [
      { id: "rep_daily", name: "DAILY PROD. REPORT", path: "/analytics/daily" },
      {
        id: "rep_efficiency",
        name: "EFFICIENCY SUMMARY",
        path: "/analytics/efficiency",
      },
    ],
  },

  // ADMINISTRATION
  {
    id: "system_settings",
    name: "SETTINGS",
    icon: Settings,
    category: "ADMINISTRATION",
    subItems: [
      { id: "user_permission", name: "USER PERMISSION", path: "/permissions" },
      { id: "system_config", name: "SYSTEM CONFIG", path: "/settings" },
      { id: "dev_permit", name: "DEV PERMIT BETA", path: "/dev-permit" },
      { id: "dev_logs", name: "SYSTEM LOGS", path: "/dev-logs" },
    ],
  },
];
