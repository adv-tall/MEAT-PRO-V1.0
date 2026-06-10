import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import * as Icons from "lucide-react";
import { UserGuidePanel } from "@/src/components/shared/UserGuidePanel";
import UserGuideButton from "@/src/components/shared/UserGuideButton";
import KpiCard from "../../components/shared/KpiCard";
import { useSharedOrders } from "@/src/store/ordersStore";
import { BatchQrTagModal } from "./BatchQrTagModal";
import Swal from "sweetalert2";
import { useNotifications } from "../../context/NotificationContext";
import { useCollection } from "../../services/useFirestore";
import { useAuth } from "../../context/AuthContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useMachineAlert } from "../../hooks/useMachineAlert";

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

const MOCK_HISTORICAL_BATCHES = [
  {
    id: "B-MTB-001-B1",
    parentJobId: "JOB-MTB-001",
    sku: "FG-3001",
    productName: "ลูกชิ้นหมู ARO 1kg",
    completionDate: "2026-06-05",
    totalActualMins: 130,
    totalStandardMins: 137,
    totalVarianceMins: -7,
    stages: [
      {
        stageName: "Mixing",
        startTime: "2026-06-05T08:00:00Z",
        endTime: "2026-06-05T08:11:00Z",
        actualDurationMins: 11,
        standardDurationMins: 12,
        varianceMins: -1,
        status: "compliant",
        equipment: "Bowl Cutter 200L (#1)",
        operator: "Nattapon S."
      },
      {
        stageName: "Forming",
        startTime: "2026-06-05T08:13:00Z",
        endTime: "2026-06-05T08:28:00Z",
        actualDurationMins: 15,
        standardDurationMins: 15,
        varianceMins: 0,
        status: "compliant",
        equipment: "Anko Forming Machine (#2)",
        operator: "Arun P."
      },
      {
        stageName: "Cooking",
        startTime: "2026-06-05T08:30:00Z",
        endTime: "2026-06-05T09:28:00Z",
        actualDurationMins: 58,
        standardDurationMins: 60,
        varianceMins: -2,
        status: "compliant",
        equipment: "Smoke House 4T (#2)",
        operator: "Somjit K."
      },
      {
        stageName: "Cooling",
        startTime: "2026-06-05T09:30:00Z",
        endTime: "2026-06-05T10:08:00Z",
        actualDurationMins: 38,
        standardDurationMins: 40,
        varianceMins: -2,
        status: "compliant",
        equipment: "Shower Tunnel (#1)",
        operator: "Somjit K."
      },
      {
        stageName: "Packing",
        startTime: "2026-06-05T10:12:00Z",
        endTime: "2026-06-05T10:21:00Z",
        actualDurationMins: 8,
        standardDurationMins: 10,
        varianceMins: -2,
        status: "compliant",
        equipment: "Thermoformer Packaging Line",
        operator: "Yupa T."
      }
    ]
  },
  {
    id: "B-MTB-001-B2",
    parentJobId: "JOB-MTB-001",
    sku: "FG-3001",
    productName: "ลูกชิ้นหมู ARO 1kg",
    completionDate: "2026-06-05",
    totalActualMins: 167,
    totalStandardMins: 137,
    totalVarianceMins: 30,
    stages: [
      {
        stageName: "Mixing",
        startTime: "2026-06-05T09:00:00Z",
        endTime: "2026-06-05T09:14:00Z",
        actualDurationMins: 14,
        standardDurationMins: 12,
        varianceMins: 2,
        status: "warning",
        equipment: "Bowl Cutter 200L (#1)",
        operator: "Nattapon S."
      },
      {
        stageName: "Forming",
        startTime: "2026-06-05T09:16:00Z",
        endTime: "2026-06-05T09:34:00Z",
        actualDurationMins: 18,
        standardDurationMins: 15,
        varianceMins: 3,
        status: "warning",
        equipment: "Anko Forming Machine (#2)",
        operator: "Arun P."
      },
      {
        stageName: "Cooking",
        startTime: "2026-06-05T09:40:00Z",
        endTime: "2026-06-05T11:05:00Z",
        actualDurationMins: 85,
        standardDurationMins: 60,
        varianceMins: 25,
        status: "exceeded",
        equipment: "Smoke House 4T (#2)",
        operator: "Somjit K."
      },
      {
        stageName: "Cooling",
        startTime: "2026-06-05T11:08:00Z",
        endTime: "2026-06-05T11:48:00Z",
        actualDurationMins: 40,
        standardDurationMins: 40,
        varianceMins: 0,
        status: "compliant",
        equipment: "Shower Tunnel (#1)",
        operator: "Somjit K."
      },
      {
        stageName: "Packing",
        startTime: "2026-06-05T11:51:00Z",
        endTime: "2026-06-05T12:01:00Z",
        actualDurationMins: 10,
        standardDurationMins: 10,
        varianceMins: 0,
        status: "compliant",
        equipment: "Thermoformer Packaging Line",
        operator: "Yupa T."
      }
    ]
  },
  {
    id: "B-MTB-001-B3",
    parentJobId: "JOB-MTB-001",
    sku: "FG-3001",
    productName: "ลูกชิ้นหมู ARO 1kg",
    completionDate: "2026-06-05",
    totalActualMins: 135,
    totalStandardMins: 137,
    totalVarianceMins: -2,
    stages: [
      {
        stageName: "Mixing",
        startTime: "2026-06-05T10:15:00Z",
        endTime: "2026-06-05T10:27:00Z",
        actualDurationMins: 12,
        standardDurationMins: 12,
        varianceMins: 0,
        status: "compliant",
        equipment: "Bowl Cutter 200L (#1)",
        operator: "Nattapon S."
      },
      {
        stageName: "Forming",
        startTime: "2026-06-05T10:29:00Z",
        endTime: "2026-06-05T10:44:00Z",
        actualDurationMins: 15,
        standardDurationMins: 15,
        varianceMins: 0,
        status: "compliant",
        equipment: "Anko Forming Machine (#2)",
        operator: "Arun P."
      },
      {
        stageName: "Cooking",
        startTime: "2026-06-05T10:46:00Z",
        endTime: "2026-06-05T11:46:00Z",
        actualDurationMins: 60,
        standardDurationMins: 60,
        varianceMins: 0,
        status: "compliant",
        equipment: "Smoke House 4T (#2)",
        operator: "Somjit K."
      },
      {
        stageName: "Cooling",
        startTime: "2026-06-05T11:48:00Z",
        endTime: "2026-06-05T12:26:00Z",
        actualDurationMins: 38,
        standardDurationMins: 40,
        varianceMins: -2,
        status: "compliant",
        equipment: "Shower Tunnel (#1)",
        operator: "Somjit K."
      },
      {
        stageName: "Packing",
        startTime: "2026-06-05T12:30:00Z",
        endTime: "2026-06-05T12:40:00Z",
        actualDurationMins: 10,
        standardDurationMins: 10,
        varianceMins: 0,
        status: "compliant",
        equipment: "Thermoformer Packaging Line",
        operator: "Yupa T."
      }
    ]
  },
  {
    id: "B-SMC-000-B1",
    parentJobId: "JOB-SMC-000",
    sku: "FG-2001",
    productName: "ไส้กรอกคอกเทล ARO 1kg",
    completionDate: "2026-06-04",
    totalActualMins: 241,
    totalStandardMins: 255,
    totalVarianceMins: -14,
    stages: [
      {
        stageName: "Mixing",
        startTime: "2026-06-04T07:30:00Z",
        endTime: "2026-06-04T07:44:00Z",
        actualDurationMins: 14,
        standardDurationMins: 15,
        varianceMins: -1,
        status: "compliant",
        equipment: "Vacuum Mixer (#1)",
        operator: "Arunya K."
      },
      {
        stageName: "Forming",
        startTime: "2026-06-04T07:46:00Z",
        endTime: "2026-06-04T08:05:00Z",
        actualDurationMins: 19,
        standardDurationMins: 20,
        varianceMins: -1,
        status: "compliant",
        equipment: "Vemag Vacuum Filler (#2)",
        operator: "Pichai K."
      },
      {
        stageName: "Cooking",
        startTime: "2026-06-04T08:10:00Z",
        endTime: "2026-06-04T10:08:00Z",
        actualDurationMins: 118,
        standardDurationMins: 120,
        varianceMins: -2,
        status: "compliant",
        equipment: "Smoke House 6T (#1)",
        operator: "Metee S."
      },
      {
        stageName: "Cooling",
        startTime: "2026-06-04T10:10:00Z",
        endTime: "2026-06-04T11:05:00Z",
        actualDurationMins: 55,
        standardDurationMins: 60,
        varianceMins: -5,
        status: "compliant",
        equipment: "Rapid Chill Tunnel (#2)",
        operator: "Metee S."
      },
      {
        stageName: "Peeling",
        startTime: "2026-06-04T11:07:00Z",
        endTime: "2026-06-04T11:19:00Z",
        actualDurationMins: 12,
        standardDurationMins: 15,
        varianceMins: -3,
        status: "compliant",
        equipment: "High-Speed Peeler (#1)",
        operator: "Preeya L."
      },
      {
        stageName: "Cutting",
        startTime: "2026-06-04T11:21:00Z",
        endTime: "2026-06-04T11:30:00Z",
        actualDurationMins: 9,
        standardDurationMins: 10,
        varianceMins: -1,
        status: "compliant",
        equipment: "SMC Rotary Knife (#2)",
        operator: "Preeya L."
      },
      {
        stageName: "Packing",
        startTime: "2026-06-04T11:32:00Z",
        endTime: "2026-06-04T11:46:00Z",
        actualDurationMins: 14,
        standardDurationMins: 15,
        varianceMins: -1,
        status: "compliant",
        equipment: "Thermoformer Packaging Line",
        operator: "Malee R."
      }
    ]
  },
  {
    id: "B-SMC-000-B2",
    parentJobId: "JOB-SMC-000",
    sku: "FG-2001",
    productName: "ไส้กรอกคอกเทล ARO 1kg",
    completionDate: "2026-06-04",
    totalActualMins: 293,
    totalStandardMins: 255,
    totalVarianceMins: 38,
    stages: [
      {
        stageName: "Mixing",
        startTime: "2026-06-04T08:30:00Z",
        endTime: "2026-06-04T08:47:00Z",
        actualDurationMins: 17,
        standardDurationMins: 15,
        varianceMins: 2,
        status: "warning",
        equipment: "Vacuum Mixer (#1)",
        operator: "Arunya K."
      },
      {
        stageName: "Forming",
        startTime: "2026-06-04T08:49:00Z",
        endTime: "2026-06-04T09:12:00Z",
        actualDurationMins: 23,
        standardDurationMins: 20,
        varianceMins: 3,
        status: "warning",
        equipment: "Vemag Vacuum Filler (#2)",
        operator: "Pichai K."
      },
      {
        stageName: "Cooking",
        startTime: "2026-06-04T09:15:00Z",
        endTime: "2026-06-04T11:37:00Z",
        actualDurationMins: 142,
        standardDurationMins: 120,
        varianceMins: 22,
        status: "exceeded",
        equipment: "Smoke House 6T (#1)",
        operator: "Metee S."
      },
      {
        stageName: "Cooling",
        startTime: "2026-06-04T11:40:00Z",
        endTime: "2026-06-04T12:45:00Z",
        actualDurationMins: 65,
        standardDurationMins: 60,
        varianceMins: 5,
        status: "warning",
        equipment: "Rapid Chill Tunnel (#2)",
        operator: "Metee S."
      },
      {
        stageName: "Peeling",
        startTime: "2026-06-04T12:48:00Z",
        endTime: "2026-06-04T13:06:00Z",
        actualDurationMins: 18,
        standardDurationMins: 15,
        varianceMins: 3,
        status: "warning",
        equipment: "High-Speed Peeler (#1)",
        operator: "Preeya L."
      },
      {
        stageName: "Cutting",
        startTime: "2026-06-04T13:08:00Z",
        endTime: "2026-06-04T13:20:00Z",
        actualDurationMins: 12,
        standardDurationMins: 10,
        varianceMins: 2,
        status: "warning",
        equipment: "SMC Rotary Knife (#2)",
        operator: "Preeya L."
      },
      {
        stageName: "Packing",
        startTime: "2026-06-04T13:22:00Z",
        endTime: "2026-06-04T13:38:00Z",
        actualDurationMins: 16,
        standardDurationMins: 15,
        varianceMins: 1,
        status: "warning",
        equipment: "Thermoformer Packaging Line",
        operator: "Malee R."
      }
    ]
  },
  {
    id: "B-BOL-002-B1",
    parentJobId: "JOB-BOL-002",
    sku: "FG-4003",
    productName: "โบโลน่าหมูพริก 500g",
    completionDate: "2026-06-03",
    totalActualMins: 312,
    totalStandardMins: 330,
    totalVarianceMins: -18,
    stages: [
      {
        stageName: "Mixing",
        startTime: "2026-06-03T07:15:00Z",
        endTime: "2026-06-03T07:33:00Z",
        actualDurationMins: 18,
        standardDurationMins: 20,
        varianceMins: -2,
        status: "compliant",
        equipment: "Vacuum Mixer (#1)",
        operator: "Chatchai O."
      },
      {
        stageName: "Forming",
        startTime: "2026-06-03T07:35:00Z",
        endTime: "2026-06-03T07:49:00Z",
        actualDurationMins: 14,
        standardDurationMins: 15,
        varianceMins: -1,
        status: "compliant",
        equipment: "Linker Sausage Host (#1)",
        operator: "Supot M."
      },
      {
        stageName: "Cooking",
        startTime: "2026-06-03T07:55:00Z",
        endTime: "2026-06-03T10:50:00Z",
        actualDurationMins: 175,
        standardDurationMins: 180,
        varianceMins: -5,
        status: "compliant",
        equipment: "Smoke House 6T (#2)",
        operator: "Natee P."
      },
      {
        stageName: "Cooling",
        startTime: "2026-06-03T10:52:00Z",
        endTime: "2026-06-03T12:20:00Z",
        actualDurationMins: 88,
        standardDurationMins: 90,
        varianceMins: -2,
        status: "compliant",
        equipment: "Shower Tunnel (#2)",
        operator: "Natee P."
      },
      {
        stageName: "Peeling",
        startTime: "2026-06-03T12:23:00Z",
        endTime: "2026-06-03T12:37:00Z",
        actualDurationMins: 14,
        standardDurationMins: 15,
        varianceMins: -1,
        status: "compliant",
        equipment: "High-Speed Peeler (#2)",
        operator: "Vasan O."
      },
      {
        stageName: "Cutting",
        startTime: "2026-06-03T12:39:00Z",
        endTime: "2026-06-03T12:48:00Z",
        actualDurationMins: 9,
        standardDurationMins: 10,
        varianceMins: -1,
        status: "compliant",
        equipment: "SMC Rotary Knife (#1)",
        operator: "Vasan O."
      },
      {
        stageName: "Packing",
        startTime: "2026-06-03T12:50:00Z",
        endTime: "2026-06-03T13:04:00Z",
        actualDurationMins: 14,
        standardDurationMins: 15,
        varianceMins: -1,
        status: "compliant",
        equipment: "Bandsaw Slice Pack Line",
        operator: "Apinya S."
      }
    ]
  },
  {
    id: "B-BOL-002-B2",
    parentJobId: "JOB-BOL-002",
    sku: "FG-4003",
    productName: "โบโลน่าหมูพริก 500g",
    completionDate: "2026-06-03",
    totalActualMins: 395,
    totalStandardMins: 330,
    totalVarianceMins: 65,
    stages: [
      {
        stageName: "Mixing",
        startTime: "2026-06-03T08:30:00Z",
        endTime: "2026-06-03T08:55:00Z",
        actualDurationMins: 25,
        standardDurationMins: 20,
        varianceMins: 5,
        status: "exceeded",
        equipment: "Vacuum Mixer (#1)",
        operator: "Chatchai O."
      },
      {
        stageName: "Forming",
        startTime: "2026-06-03T08:57:00Z",
        endTime: "2026-06-03T09:13:00Z",
        actualDurationMins: 16,
        standardDurationMins: 15,
        varianceMins: 1,
        status: "warning",
        equipment: "Linker Sausage Host (#1)",
        operator: "Supot M."
      },
      {
        stageName: "Cooking",
        startTime: "2026-06-03T09:18:00Z",
        endTime: "2026-06-03T12:50:00Z",
        actualDurationMins: 212,
        standardDurationMins: 180,
        varianceMins: 32,
        status: "exceeded",
        equipment: "Smoke House 6T (#2)",
        operator: "Natee P."
      },
      {
        stageName: "Cooling",
        startTime: "2026-06-03T12:52:00Z",
        endTime: "2026-06-03T14:27:00Z",
        actualDurationMins: 95,
        standardDurationMins: 90,
        varianceMins: 5,
        status: "warning",
        equipment: "Shower Tunnel (#2)",
        operator: "Natee P."
      },
      {
        stageName: "Peeling",
        startTime: "2026-06-03T14:30:00Z",
        endTime: "2026-06-03T14:47:00Z",
        actualDurationMins: 17,
        standardDurationMins: 15,
        varianceMins: 2,
        status: "warning",
        equipment: "High-Speed Peeler (#2)",
        operator: "Vasan O."
      },
      {
        stageName: "Cutting",
        startTime: "2026-06-03T14:49:00Z",
        endTime: "2026-06-03T15:01:00Z",
        actualDurationMins: 12,
        standardDurationMins: 10,
        varianceMins: 2,
        status: "warning",
        equipment: "SMC Rotary Knife (#1)",
        operator: "Vasan O."
      },
      {
        stageName: "Packing",
        startTime: "2026-06-03T15:03:00Z",
        endTime: "2026-06-03T15:21:00Z",
        actualDurationMins: 18,
        standardDurationMins: 15,
        varianceMins: 3,
        status: "warning",
        equipment: "Bandsaw Slice Pack Line",
        operator: "Apinya S."
      }
    ]
  }
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



const STANDARDS_FALLBACK = [
  { id: 'SFG-001', name: 'Smoked Sausage SFG', mixing: 15, forming: 20, cooking: 120, cooling: 60, peeling: 15, cutting: 10, packing: 15 },
  { id: 'SFG-002', name: 'Pork Meatball SFG', mixing: 12, forming: 15, cooking: 60, cooling: 40, peeling: 0, cutting: 0, packing: 10 },
  { id: 'SFG-003', name: 'Bologna SFG', mixing: 15, forming: 15, cooking: 150, cooling: 90, peeling: 0, cutting: 0, packing: 15 },
  { id: 'SFG-004', name: 'Cheese Sausage SFG', mixing: 15, forming: 15, cooking: 120, cooling: 60, peeling: 15, cutting: 0, packing: 15 },
  { id: 'SFG-005', name: 'Sandwich Ham SFG', mixing: 20, forming: 25, cooking: 180, cooling: 120, peeling: 0, cutting: 12, packing: 15 },
  { id: 'STD-001', name: 'Standard Smoked Sausage', mixing: 15, forming: 20, cooking: 120, cooling: 60, peeling: 15, cutting: 10, packing: 15 },
  { id: 'STD-002', name: 'Premium Meatball', mixing: 12, forming: 15, cooking: 60, cooling: 40, peeling: 0, cutting: 0, packing: 10 },
  { id: 'STD-003', name: 'Bologna Chili', mixing: 20, forming: 15, cooking: 180, cooling: 90, peeling: 15, cutting: 10, packing: 15 },
];

const INITIAL_BATCH_ALERTS = [
  {
    id: "B-2602-001-M",
    parentOrderId: "JO-2602-001",
    sku: "SFG-001",
    productName: "SMC ไส้กรอกไก่ ARO 125g",
    stage: "Cooking",
    standardTimeMins: 120,
    actualTimeMins: 112,
    operator: "Somchai K.",
    equipment: "Smoke House 6T (#1)",
    isAlerted: false,
    isAcknowledged: false,
    notes: "",
    lastUpdated: "2026-06-06T09:30:00Z"
  },
  {
    id: "B-2602-001-N",
    parentOrderId: "JO-2602-001",
    sku: "SFG-001",
    productName: "SMC ไส้กรอกไก่ ARO 125g",
    stage: "Cooling",
    standardTimeMins: 60,
    actualTimeMins: 58,
    operator: "Natee P.",
    equipment: "Rapid Chill Tunnel (#2)",
    isAlerted: false,
    isAcknowledged: false,
    notes: "",
    lastUpdated: "2026-06-06T09:32:00Z"
  },
  {
    id: "B-2602-002-K",
    parentOrderId: "JO-2602-002",
    sku: "SFG-003",
    productName: "BKP Chili Bologna",
    stage: "Cooking",
    standardTimeMins: 150,
    actualTimeMins: 155,
    operator: "Wichai T.",
    equipment: "Smoke House 6T (#1)",
    isAlerted: true,
    isAcknowledged: true,
    notes: "Steam cooker chamber temperature dropping, waiting for technician.",
    acknowledgedBy: "Supervisor Kittisak",
    lastUpdated: "2026-06-06T09:35:00Z"
  },
  {
    id: "B-2602-003-V",
    parentOrderId: "JO-2602-003",
    sku: "SFG-005",
    productName: "Ham Slice 500g",
    stage: "Cooking",
    standardTimeMins: 180,
    actualTimeMins: 140,
    operator: "Prapat S.",
    equipment: "Smoke House 6T (#2)",
    isAlerted: false,
    isAcknowledged: false,
    notes: "",
    lastUpdated: "2026-06-06T09:36:00Z"
  },
  {
    id: "B-2602-004-X",
    parentOrderId: "JO-2602-004",
    sku: "SFG-004",
    productName: "Cheese Sausage 4 inch",
    stage: "Mixing",
    standardTimeMins: 15,
    actualTimeMins: 12,
    operator: "Anan M.",
    equipment: "Vacuum Mixer (#1)",
    isAlerted: false,
    isAcknowledged: false,
    notes: "",
    lastUpdated: "2026-06-06T09:38:00Z"
  }
];

const JUSTIFICATION_CAUSES = [
  "Machinery Breakdown (เครื่องจักรขัดข้อง)",
  "Steam Pressure Drop (แรงดันไอน้ำตก)",
  "Chiller Unit Fault (ตู้แช่เย็นทำงานผิดปกติ)",
  "Raw Material Delayed (วัตถุดิบป้อนเข้าหน้าไลน์ช้า)",
  "Operator Shift Handover (เปลี่ยนกะผู้ปฏิบัติงาน)",
  "Allergen Cleaning / Recipe Changeover (ล้างทำความสะอาดเครื่อง)",
  "Quality Assurance Check Hold (ฝ่ายควบคุมคุณภาพสั่งระงับ)",
  "Other (กรณีอื่นๆ)"
];

// --- MAIN APPLICATION ---
export default function ProductionTracking() {
  const { user } = useAuth();
  useMachineAlert();
  const [activeTab, setActiveTab] = useState("daily");
  const [showGuide, setShowGuide] = useState(false);
  const [showPrintMode, setShowPrintMode] = useState(false);

  // QR Scanner / Tag Modal States
  const [selectedTagOrder, setSelectedTagOrder] = useState<any | null>(null);

  // Daily Monitor Filter & Search States
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchDaily, setSearchDaily] = useState("");
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [tableDensity, setTableDensity] = useState('normal');

  // Derived filtered data for Daily Monitor
  const [orders, , updateOrder] = useSharedOrders();
  const trackItems = useMemo(() => {
    let kgPerBatch = 80;
    try {
      const stored = localStorage.getItem('mes_batch_config');
      if (stored) {
        kgPerBatch = JSON.parse(stored).kgPerBatch || 80;
      }
    } catch (e) {}

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

      const toBatch = (val: number) => Math.ceil(val / kgPerBatch);

      return {
        id: o.id,
        sku: o.sku || o.id,
        customer: o.shift ? `${o.shift} Shift` : "Standard",
        name: o.name,
        target: toBatch(target),
        time: o.deadline,
        progress: progress,
        status: o.status,
        stages: [
          { step: "mixing", count: toBatch(mixVal), color: "#537E72" },
          { step: "forming", count: toBatch(formVal), color: "#DCBC1B" },
          { step: "cooking", count: toBatch(cookVal), color: "#C22D2E" },
          { step: "cooling", count: toBatch(coolVal), color: "#90B7BF" },
          { step: "cutting", count: toBatch(cutVal), color: "#BB8588" },
          { step: "packing", count: toBatch(packVal), color: "#2E395F" },
          { step: "wh", count: toBatch(whVal), color: "#537E72" }
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

  // Automated Alert Notification systems & hooks
  const { addNotification } = useNotifications();
  const { data: dbStandards } = useCollection('Std_Process_Time', []);
  const {
    data: alertsData,
    update: updateAlert,
    add: addAlert
  } = useCollection('Batch_Time_Alerts', INITIAL_BATCH_ALERTS);

  // States for Floor Alert Center Panel
  const [alertFilter, setAlertFilter] = useState('ALL'); // ALL, ACTIVE_LATE, ACKNOWLEDGED
  const [alertSearch, setAlertSearch] = useState('');
  const [isSimulating, setIsSimulating] = useState(true);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [activeAcknowledgeBatch, setActiveAcknowledgeBatch] = useState<any | null>(null);

  // States for Historical Batches Auditor
  const [selectedJobForHistory, setSelectedJobForHistory] = useState<any | null>(null);
  const [selectedBatchForPerformance, setSelectedBatchForPerformance] = useState<any | null>(null);
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('ALL'); // ALL, COMPLIANT, WARNING, EXCEEDED
  
  // Justification Modal fields
  const [justificationReason, setJustificationReason] = useState(JUSTIFICATION_CAUSES[0]);
  const [justificationNotes, setJustificationNotes] = useState('');
  const [justificationRepName, setJustificationRepName] = useState('Supervisor Kittisak');

  // Manual check run modal states
  const [showCreateBatchModal, setShowCreateBatchModal] = useState(false);
  const [newBatchId, setNewBatchId] = useState('');
  const [newBatchOrderId, setNewBatchOrderId] = useState('');
  const [newBatchStage, setNewBatchStage] = useState('Mixing');
  const [newBatchOperator, setNewBatchOperator] = useState('');
  const [newBatchEquipment, setNewBatchEquipment] = useState('');
  const [newBatchInitialActual, setNewBatchInitialActual] = useState(0);

  // Auto detect standard cycle time based on SKU and Stage selection
  const lookedUpStandardForNewBatch = useMemo(() => {
    if (!newBatchOrderId) return 30; // default
    const matchingOrder = orders.find((o: any) => o.id === newBatchOrderId);
    if (!matchingOrder) return 30;
    const sku = matchingOrder.sku || matchingOrder.id;
    
    // Look up in database standards or fallbacks
    const std = dbStandards.find((s: any) => s.id === sku || s.sku === sku);
    if (std) {
      if ((newBatchStage || "").toLowerCase() === 'mixing') return std.mixingStandards?.[0]?.cycleTimeMin || 15;
      if ((newBatchStage || "").toLowerCase() === 'cooking') return std.cookingStandards?.[0]?.cycleTimeMin || 120;
      if ((newBatchStage || "").toLowerCase() === 'cooling') return std.coolingStandards?.[0]?.cycleTimeMin || 60;
    }
    const fallback = STANDARDS_FALLBACK.find(fb => fb.id === sku);
    if (fallback) {
      return (fallback as any)[(newBatchStage || "").toLowerCase()] || 30;
    }
    return 30;
  }, [newBatchOrderId, newBatchStage, dbStandards, orders]);

  // Automated notification feedback loop inside useEffect
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      alertsData.forEach((batch: any) => {
        if (batch.isAcknowledged) return;

        const newActual = Number(batch.actualTimeMins || 0) + 1 * simulationSpeed;
        const limit = Number(batch.standardTimeMins || 30);

        const updates: any = {
          actualTimeMins: newActual,
          lastUpdated: new Date().toISOString()
        };

        // Automatical duration evaluation against lookups
        if (newActual > limit && !batch.isAlerted) {
          updates.isAlerted = true;
          
          // Trigger global notification dispatch center alert
          addNotification({
            title: `BATCH OVER EXCEEDED: ${batch.id}`,
            description: `Batch run ${batch.id} (${batch.productName}) has exceeded the standard ${batch.stage} limit of ${limit} mins in ${batch.equipment}. Elapsed: ${newActual} mins.`,
            severity: 'critical',
            category: 'PRODUCTION',
            actionLink: '/board/production'
          });

          // Visual warning card popup
          Swal.fire({
            title: '⚠️ โดนแจ้งเตือนเวลาผลิตเกินมาตรฐาน!',
            html: `
              <div class="text-left text-xs font-sans space-y-1 p-0.5">
                <p class="font-bold text-[#C22D2E] uppercase">AUTOMATED TRACKING BOT ALARM</p>
                <div class="p-2 bg-[#C22D2E]/5 border border-[#C22D2E]/20 rounded-md font-sans">
                  <p class="font-extrabold text-[#212c46]">Batch Run: ${batch.id}</p>
                  <p class="text-slate-600 font-medium">Stage: ${batch.stage} | Equipment: ${batch.equipment}</p>
                  <p class="text-[13px] text-red-600 font-bold mt-1">เวลาปัจจุบัน: ${newActual} นาที (มาตรฐาน: ${limit} นาที)</p>
                </div>
                <p class="text-slate-500 text-[10px] mt-1">ได้รับการบรรจุบันทึกลงในระบบการแจ้งเตือนและการรายงาน OEE ห้องควบคุมห้องกลาง Floor Managers</p>
              </div>
            `,
            icon: 'warning',
            confirmButtonText: 'เข้าแก้ไขด่วน / รับทราบ',
            confirmButtonColor: '#212c46',
            toast: true,
            position: 'top-end',
            timer: 8000,
            timerProgressBar: true
          });
        }

        updateAlert(batch.id, updates);
      });
    }, 5000); // cycle every 5 seconds

    return () => clearInterval(interval);
  }, [isSimulating, alertsData, simulationSpeed, updateAlert, addNotification]);

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

  // CSV Export System for Historical completed batches
  const handleExportHistoryCSV = (jobId: string) => {
    const batches = MOCK_HISTORICAL_BATCHES.filter(b => b.parentJobId === jobId);
    if (!batches.length) {
      Swal.fire("Export Alert", "No historical batch run records found for this job ID.", "info");
      return;
    }

    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += "Batch ID,Product Name,SKU,Date,Stage,Start Timestamp,End Timestamp,Actual Mins,Standard Mins,Variance Mins,Equipment,Operator,Status\n";

    batches.forEach(b => {
      b.stages.forEach(s => {
        const row = [
          b.id,
          b.productName,
          b.sku,
          b.completionDate,
          s.stageName,
          s.startTime,
          s.endTime,
          s.actualDurationMins,
          s.standardDurationMins,
          s.varianceMins,
          `"${s.equipment}"`,
          `"${s.operator}"`,
          s.status.toUpperCase()
        ].join(",");
        csvContent += row + "\n";
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `COMPLIANCE-METRIC-${jobId}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    Swal.fire({
      title: "Export Completed!",
      text: `${batches.length} batch runs summary successfully exported to CSV file format.`,
      icon: "success",
      confirmButtonColor: "#212c46",
      timer: 2000
    });
  };

  // Dynamic Recharts Mapper for active Batch performance comparison
  const chartData = useMemo(() => {
    if (!selectedBatchForPerformance || !selectedBatchForPerformance.stages) return [];
    return selectedBatchForPerformance.stages.map((stage: any) => ({
      stage: stage.stageName,
      Actual: Number(stage.actualDurationMins),
      Standard: Number(stage.standardDurationMins)
    }));
  }, [selectedBatchForPerformance]);

  // Real-time Search and Status Filter for related historical batches
  const filteredRelatedBatches = useMemo(() => {
    if (!selectedJobForHistory) return [];
    return MOCK_HISTORICAL_BATCHES.filter(b => {
      if (b.parentJobId !== selectedJobForHistory.id) return false;
      
      // Status filter matching
      if (historyStatusFilter !== 'ALL') {
        const hasMatchingStatus = b.stages.some(s => s.status.toUpperCase() === historyStatusFilter.toUpperCase());
        if (!hasMatchingStatus) return false;
      }
      
      // Search matching matching ID, Operator, Equipment
      if (historySearch.trim()) {
        const q = (historySearch || "").toLowerCase();
        const matchId = (b.id || "").toLowerCase().includes(q);
        const matchOperator = b.stages.some(s => (s.operator || "").toLowerCase().includes(q));
        const matchEquip = b.stages.some(s => (s.equipment || "").toLowerCase().includes(q));
        if (!matchId && !matchOperator && !matchEquip) return false;
      }
      
      return true;
    });
  }, [selectedJobForHistory, historySearch, historyStatusFilter]);

  const filteredDailyMonitor = useMemo(() => {
    return trackItems.filter((item: any) => {
      const matchStatus =
        filterStatus === "ALL" || item.status === filterStatus;
      const matchSearch =
        (item.name || "").toLowerCase().includes((searchDaily || "").toLowerCase()) ||
        (item.id || "").toLowerCase().includes((searchDaily || "").toLowerCase()) ||
        (item.customer || "").toLowerCase().includes((searchDaily || "").toLowerCase());
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
                  id: "alerts",
                  label: "TIME ALERTS",
                  icon: "AlertTriangle",
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

            {user?.employeeId === 'DEV001' && (
              <button
                onClick={() => setShowPrintMode(!showPrintMode)}
                className={`px-4 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border shadow-sm ${
                  showPrintMode
                    ? "bg-[#212c46] text-white border-[#212c46]"
                    : "bg-white text-[#7a8b95] hover:text-[#212c46] border-[#eaeaec] hover:bg-slate-50"
                }`}
              >
                <Icons.Printer size={16} />
                {showPrintMode ? "Close Print View" : "Print View (DEV001)"}
              </button>
            )}
          </div>
        </div>

        <div className="mx-auto px-4 sm:px-8 w-full mt-[2px]">
          <main className="w-full flex flex-col animate-fadeIn min-h-0">
            {showPrintMode ? (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#eaeaec] flex-1 min-h-[500px]">
                <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-widest text-[#212c46]">PRODUCTION WORK ORDER</h2>
                    <p className="text-[11px] font-bold text-[#7a8b95] mt-1 uppercase tracking-widest">Daily Production Manufacturing Order details for shop-floor display.</p>
                  </div>
                  <button className="px-6 py-2.5 bg-[#212c46] hover:bg-black text-white text-[12px] font-black uppercase tracking-widest rounded-lg flex items-center gap-2 print:hidden transition-all shadow-md hover:shadow-xl" onClick={() => window.print()}>
                    <Icons.Printer size={16} /> Print Document
                  </button>
                </div>
                
                <div className="space-y-6">
                  {trackItems.filter((o: any) => o.status !== 'COMPLETED').map((order: any, idx: number) => (
                    <div key={idx} className="border-2 border-[#212c46] rounded-2xl p-6 break-inside-avoid shadow-sm mb-6 pb-6">
                      <div className="flex justify-between items-start mb-4 border-b border-[#eaeaec] pb-4">
                        <div>
                          <h3 className="text-2xl font-black text-[#212c46] tracking-widest uppercase flex items-center gap-3">
                            <span className="text-[#a94228]">I</span> ORDER {order.id}
                          </h3>
                          <div className="flex items-center gap-3 mt-3">
                             <span className="bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-[#414757] border border-slate-200 rounded-md uppercase tracking-widest leading-none shadow-sm">SKU: {order.sku}</span>
                             <span className="bg-[#4d87a8]/10 px-3 py-1.5 text-[11px] font-bold text-[#3f809e] border border-[#4d87a8]/30 rounded-md uppercase tracking-widest leading-none shadow-sm">SHIFT: {order.shift}</span>
                             <span className="bg-[#a94228]/10 px-3 py-1.5 text-[11px] font-bold text-[#932c2e] border border-[#a94228]/20 rounded-md uppercase tracking-widest leading-none shadow-sm">DEADLINE: {order.deadline}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-5xl font-black text-[#212c46] leading-none tracking-tighter">{order.qty} <span className="text-2xl tracking-widest font-bold text-[#b7a159]">KG</span></p>
                          <p className="text-[11px] font-black text-[#7a8b95] uppercase tracking-[0.2em] mt-3">Total Target</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-6 gap-4 mt-6">
                        {['MIXING', 'FORMING', 'COOKING', 'COOLING', 'CUTTING', 'PACKING'].map((step, i) => (
                           <div key={i} className="border border-dashed border-[#d7d7d7] p-4 rounded-xl relative h-28 flex flex-col items-center justify-center bg-slate-50/50">
                             <p className="absolute top-2 left-3 text-[10px] font-black text-[#7a8b95] font-mono select-none">0{i+1}</p>
                             <p className="text-sm font-black text-[#d7d7d7] transform -rotate-12 uppercase tracking-widest">{step}</p>
                           </div>
                        ))}
                      </div>
                      <div className="mt-6 border border-[#eaeaec] rounded-xl p-5 bg-slate-50 flex items-start gap-4">
                        <Icons.AlertCircle className="shrink-0 text-[#212c46] mt-0.5" size={18} />
                        <div className="w-full">
                           <p className="text-[11px] font-black text-[#212c46] uppercase tracking-widest mb-3">Supervisor Notes / Remarks</p>
                           <p className="w-full border-b-2 border-dotted border-[#b58c4f]/50 mt-6"></p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {trackItems.filter((o:any) => o.status !== 'COMPLETED').length === 0 && (
                     <div className="text-center py-16 border-2 border-dashed border-[#eaeaec] rounded-2xl bg-slate-50 flex flex-col items-center justify-center h-[300px]">
                       <Icons.PackageOpen size={48} className="text-[#d7d7d7] mb-4" />
                       <p className="text-[12px] font-bold text-[#a8aebc] uppercase tracking-widest">No active orders to print.</p>
                     </div>
                  )}
                </div>
              </div>
            ) : (
              <>
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
                    <div className="flex items-center gap-3">
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
                      <div className="flex bg-white border border-[#eaeaec] rounded-xl shadow-sm p-1 ml-2">
                        <button 
                          onClick={() => setTableDensity('compact')}
                          className={`p-1.5 rounded-lg transition-colors ${tableDensity === 'compact' ? 'bg-[#f8f9fa] text-[#212c46] shadow-sm' : 'text-[#7a8b95] hover:text-[#212c46]'}`}
                          title="Compact"
                        >
                          <Icons.AlignJustify size={16} />
                        </button>
                        <button 
                          onClick={() => setTableDensity('normal')}
                          className={`p-1.5 rounded-lg transition-colors ${tableDensity === 'normal' ? 'bg-[#f8f9fa] text-[#212c46] shadow-sm' : 'text-[#7a8b95] hover:text-[#212c46]'}`}
                          title="Normal"
                        >
                          <Icons.Menu size={16} />
                        </button>
                        <button 
                          onClick={() => setTableDensity('cozy')}
                          className={`p-1.5 rounded-lg transition-colors ${tableDensity === 'cozy' ? 'bg-[#f8f9fa] text-[#212c46] shadow-sm' : 'text-[#7a8b95] hover:text-[#212c46]'}`}
                          title="Cozy"
                        >
                          <Icons.List size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Main Table */}
                  <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
                    <table className={`w-full text-left border-collapse min-w-[1100px] table-font density-${tableDensity}`}>
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
                                 <div className="flex items-center gap-1.5">
                                   <span className="bg-white border border-[#eaeaec] text-[#4d87a8] font-mono font-black text-[10px] px-2 py-0.5 rounded-md shadow-sm leading-none">
                                     {item.id}
                                   </span>
                                   <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider border transition-all duration-300 leading-none ${
                                     item.status === 'DELAYED'
                                       ? 'bg-rose-50 text-rose-600 border-rose-200/60 animate-pulse'
                                       : item.status === 'IN PROGRESS'
                                       ? 'bg-sky-50 text-sky-600 border-sky-200/60 animate-[pulse_2s_infinite]'
                                       : item.status === 'COMPLETED'
                                       ? 'bg-emerald-50 text-emerald-600 border-emerald-200/60'
                                       : 'bg-slate-50 text-slate-500 border-slate-200'
                                   }`}>
                                     {(item.status === 'DELAYED' || item.status === 'IN PROGRESS') && (
                                       <span className="relative flex h-1 w-1 shrink-0">
                                         <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${item.status === 'DELAYED' ? 'bg-rose-400' : 'bg-sky-400'}`}></span>
                                         <span className={`relative inline-flex rounded-full h-1 w-1 ${item.status === 'DELAYED' ? 'bg-rose-500' : 'bg-sky-500'}`}></span>
                                       </span>
                                     )}
                                     {item.status}
                                   </span>
                                 </div>
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
                              <td 
                                key={sIdx}
                                className="px-3 align-middle border-r border-[#eaeaec]/40 py-2.5 px-4"
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

              {/* 1.5. TIME ALERTS VIEW */}
              {activeTab === "alerts" && (
                <div className="flex-1 flex flex-col gap-4 animate-fadeIn">
                  {/* Alerts Toolbar / Controls Panel */}
                  <div className="bg-white p-4 rounded-xl border border-[#eaeaec] shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    {/* Filter buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        { id: 'ALL', label: 'All Tracked Runs', count: alertsData.length, color: 'bg-slate-100 text-slate-700' },
                        { id: 'ACTIVE_LATE', label: 'Active Exceeded Alerts', count: alertsData.filter((b: any) => Number(b.actualTimeMins) > Number(b.standardTimeMins) && !b.isAcknowledged).length, color: 'bg-red-500 text-white animate-pulse' },
                        { id: 'ACKNOWLEDGED', label: 'Acknowledged Notes', count: alertsData.filter((b: any) => b.isAcknowledged).length, color: 'bg-green-600 text-white' }
                      ].map(f => (
                        <button
                          key={f.id}
                          onClick={() => setAlertFilter(f.id)}
                          className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${
                            alertFilter === f.id
                              ? 'bg-[#212c46] text-white border-[#212c46] shadow'
                              : 'bg-white hover:bg-slate-50 text-[#7a8b95] border-[#eaeaec]'
                          }`}
                        >
                          {f.label}
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${alertFilter === f.id ? 'bg-white/20 text-white' : f.color}`}>
                            {f.count}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Simulation Engine Controls */}
                    <div className="flex flex-wrap items-center gap-4 p-2 bg-[#f8f9fa] border border-[#eaeaec] rounded-xl self-stretch lg:self-auto justify-between lg:justify-start">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                          {isSimulating && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          )}
                          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isSimulating ? 'bg-green-500' : 'bg-rose-500'}`}></span>
                        </span>
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest select-none">
                          Auto-Evaluator State
                        </span>
                        <button
                          onClick={() => setIsSimulating(!isSimulating)}
                          className={`px-3 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-widest border transition-all ${
                            isSimulating 
                              ? 'bg-rose-100 hover:bg-rose-200 text-rose-700 border-rose-300' 
                              : 'bg-green-100 hover:bg-green-200 text-green-700 border-green-300'
                          }`}
                        >
                          {isSimulating ? "PAUSE SIM" : "RESUME SIM"}
                        </button>
                      </div>

                      {isSimulating && (
                        <div className="flex items-center gap-2 border-l border-[#eaeaec] pl-4">
                          <span className="text-[9px] font-bold text-slate-500">SPEED:</span>
                          <select 
                            value={simulationSpeed} 
                            onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                            className="bg-white border border-[#eaeaec] px-2 py-1 rounded text-[10px] font-bold"
                          >
                            <option value="1">1x Speed</option>
                            <option value="2">2x Speed (Fast)</option>
                            <option value="5">5x Speed (Turbo)</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Manual button */}
                    <button
                      onClick={() => {
                        // Prefill some realistic values
                        setNewBatchId(`B-${Math.floor(Math.random() * 8000) + 1000}`);
                        setNewBatchOperator('Operator Peerawat');
                        setNewBatchEquipment('Smoke House 4T (#3)');
                        const activeOrders = orders.filter((o: any) => o.status === 'IN PROGRESS');
                        if (activeOrders.length > 0) {
                          setNewBatchOrderId(activeOrders[0].id);
                        } else if (orders.length > 0) {
                          setNewBatchOrderId(orders[0].id);
                        }
                        setShowCreateBatchModal(true);
                      }}
                      className="w-full lg:w-auto bg-[#b7a159] hover:bg-[#9c8646] text-white px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md active:scale-95"
                    >
                      <Icons.Plus size={14} /> Register Batch Run
                    </button>
                  </div>

                  {/* Search and legend info */}
                  <div className="flex flex-col md:flex-row gap-3 items-stretch">
                    <div className="relative flex-1">
                      <Icons.Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search by Batch ID, product, machine, operator..."
                        value={alertSearch}
                        onChange={(e) => setAlertSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 text-[12px] font-bold text-[#212c46] bg-white border border-[#eaeaec] rounded-xl outline-none focus:border-[#212c46] transition-all"
                      />
                    </div>
                  </div>

                  {/* List Grid cards of active floor runs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-12">
                    {alertsData
                      .filter((batch: any) => {
                        const isLate = Number(batch.actualTimeMins) > Number(batch.standardTimeMins);
                        const isAck = !!batch.isAcknowledged;
                        
                        const matchFilter = 
                          alertFilter === 'ALL' ||
                          (alertFilter === 'ACTIVE_LATE' && isLate && !isAck) ||
                          (alertFilter === 'ACKNOWLEDGED' && isAck);

                        const searchLower = (alertSearch || "").toLowerCase();
                        const matchSearch =
                          (batch.id || "").toLowerCase().includes(searchLower) ||
                          (batch.productName || "").toLowerCase().includes(searchLower) ||
                          (batch.operator || '').toLowerCase().includes(searchLower) ||
                          (batch.equipment || '').toLowerCase().includes(searchLower);

                        return matchFilter && matchSearch;
                      })
                      .map((batch: any) => {
                        const isLate = Number(batch.actualTimeMins) > Number(batch.standardTimeMins);
                        const variance = Number(batch.actualTimeMins) - Number(batch.standardTimeMins);
                        
                        return (
                          <div
                            key={batch.id}
                            className={`bg-white border-l-4 rounded-xl shadow-sm overflow-hidden flex flex-col transition-all duration-300 ${
                              batch.isAcknowledged
                                ? 'border-[#2e7d32]/70'
                                : isLate
                                  ? 'border-[#C22D2E] animate-alarm bg-red-50/5'
                                  : 'border-[#4d87a8]/70'
                            }`}
                          >
                            {/* Card Header information */}
                            <div className="p-4 flex justify-between items-start gap-4 border-b border-[#eaeaec]/60">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-mono font-black text-[#212c46] text-[12px]">
                                    {batch.id}
                                  </span>
                                  <span className="bg-[#f8f9fa] border border-[#eaeaec] text-[#7a8b95] text-[9px] font-bold uppercase py-0.5 px-2 rounded-md">
                                    Stage: {batch.stage}
                                  </span>
                                </div>
                                <h3 className="font-bold text-[#212c46] text-[13px] leading-snug line-clamp-1" title={batch.productName}>
                                  {batch.productName}
                                </h3>
                              </div>

                              {/* Alert Status Sign indicators */}
                              <div>
                                {batch.isAcknowledged ? (
                                  <span className="bg-green-100 text-green-800 text-[9px] font-black uppercase tracking-wider py-1 px-2.5 rounded-full flex items-center gap-1 border border-green-200/50">
                                    <Icons.CheckCircle size={10} /> Saved & Ack
                                  </span>
                                ) : isLate ? (
                                  <span className="bg-red-100 text-red-800 text-[9px] font-black uppercase tracking-wider py-1 px-2.5 rounded-full flex items-center gap-1 animate-pulse border border-red-200/60 shadow-xs">
                                    <span className="relative flex h-1.5 w-1.5 shrink-0">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                                    </span>
                                    <Icons.AlertTriangle size={10} /> LATE ALERT
                                  </span>
                                ) : (
                                  <span className="bg-sky-100 text-sky-800 text-[9px] font-black uppercase tracking-wider py-1 px-2.5 rounded-full flex items-center gap-1 animate-[pulse_2.0s_infinite] border border-sky-200/60 shadow-xs">
                                    <span className="relative flex h-1.5 w-1.5 shrink-0">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-sky-500"></span>
                                    </span>
                                    <Icons.RefreshCw size={10} className="animate-spin" /> In Progress
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Card Body process metric comparisons */}
                            <div className="p-4 flex-1 flex flex-col gap-3">
                              {/* Machine and Operator details */}
                              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 bg-[#f8f9fa] p-2 rounded-lg border border-[#eaeaec]/60">
                                <div>
                                  <span className="font-bold block uppercase text-[9px] tracking-wider text-slate-400">EQUIPMENT/HOST</span>
                                  <strong className="text-slate-700 font-bold">{batch.equipment || 'N/A'}</strong>
                                </div>
                                <div>
                                  <span className="font-bold block uppercase text-[9px] tracking-wider text-slate-400">FLOOR OPERATOR</span>
                                  <strong className="text-slate-700 font-bold">{batch.operator || 'N/A'}</strong>
                                </div>
                              </div>

                              {/* Timing Progress graphic bars */}
                              <div className="space-y-1">
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                  <span className="text-slate-500">Standard Cycle: <b className="font-mono text-[#212c46]">{batch.standardTimeMins} mins</b></span>
                                  <span className="text-slate-500">Actual Elapsed: <b className={`font-mono ${isLate ? 'text-red-600 font-black' : 'text-slate-900'}`}>{Math.round(batch.actualTimeMins)} mins</b></span>
                                </div>

                                {/* Custom horizontal thermometer */}
                                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-[#eaeaec]/50 flex">
                                  {/* Normal portion */}
                                  <div 
                                    className="h-full bg-sky-500 transition-all duration-500"
                                    style={{ width: `${Math.min(100, (Number(batch.actualTimeMins) / Number(batch.standardTimeMins)) * 100)}%` }}
                                  ></div>
                                  {/* Exceeded portion */}
                                  {isLate && (
                                    <div 
                                      className="h-full bg-red-600 transition-all duration-500"
                                      style={{ width: `${Math.min(100, ((variance) / Number(batch.standardTimeMins)) * 100)}%` }}
                                    ></div>
                                  )}
                                </div>
                              </div>

                              {/* Variance details */}
                              <div className="flex justify-between items-center text-[11px] border-t border-[#eaeaec]/40 pt-2.5">
                                <span className="text-slate-500 font-semibold flex items-center gap-1 uppercase text-[10px]">
                                  <Icons.Calendar size={12} /> Limit check
                                </span>
                                {isLate ? (
                                  <span className={`font-black ${batch.isAcknowledged ? 'text-[#2e7d32]' : 'text-red-600'}`}>
                                    +{Math.round(variance)} mins exceeded
                                  </span>
                                ) : (
                                  <span className="text-[#7a8b95] font-bold">
                                    {Math.round(Number(batch.standardTimeMins) - Number(batch.actualTimeMins))} mins remaining
                                  </span>
                                )}
                              </div>

                              {/* Justification details if saved */}
                              {batch.isAcknowledged && (
                                <div className="bg-green-50/70 border border-green-200/50 rounded-lg p-2 text-xs font-semibold text-slate-700 mt-1">
                                  <div className="text-green-800 font-black uppercase text-[9px] tracking-widest flex items-center gap-1 mb-1 leading-none">
                                    <Icons.MessageSquare size={10} /> Comment by {batch.acknowledgedBy || 'Supervisor'}
                                  </div>
                                  <p className="italic text-slate-600 leading-normal">
                                    <strong>[{batch.notes.split(': ')[0]}]</strong>: {batch.notes.split(': ')[1] || batch.notes}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Card Footer action links */}
                            <div className="px-4 py-3 bg-[#f8f9fa] border-t border-[#eaeaec]/60 flex items-center justify-end gap-2">
                              {/* Trigger immediate alerts manually again if needed */}
                              {isLate && !batch.isAcknowledged && (
                                <button
                                  onClick={() => {
                                    addNotification({
                                      title: `MANUAL DISPATCH: ${batch.id} (${batch.stage})`,
                                      description: `Manual dispatch to Floor Manager: Batch Run ${batch.id} exceeds Standard by ${variance} minutes. Operator ${batch.operator} reports mechanical hold.`,
                                      severity: 'critical',
                                      category: 'PRODUCTION',
                                      actionLink: '/board/production'
                                    });
                                    Swal.fire({
                                      title: "Floor Slack Dispatching successfully!",
                                      text: `Alert for batch ${batch.id} sent to connected pager channels!`,
                                      icon: "success",
                                      confirmButtonColor: "#212c46",
                                      timer: 1500
                                    });
                                  }}
                                  className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 py-1.5 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm"
                                >
                                  <Icons.PhoneCall size={12} /> BEEP MANAGER
                                </button>
                              )}

                              {!batch.isAcknowledged && (
                                <button
                                  onClick={() => {
                                    setActiveAcknowledgeBatch(batch);
                                    setJustificationReason(JUSTIFICATION_CAUSES[0]);
                                    setJustificationNotes('');
                                    setJustificationRepName('Supervisor Kittisak');
                                  }}
                                  className="bg-[#212c46] hover:bg-[#121929] text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow active:scale-95 transition-all"
                                >
                                  <Icons.ClipboardCheck size={12} /> Acknowledge Alert & Note
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}

                    {alertsData.length === 0 && (
                      <div className="col-span-full py-16 text-center text-slate-400 opacity-65">
                        <Icons.Compass size={44} className="mx-auto mb-2 text-slate-300" />
                        <p className="font-extrabold uppercase tracking-widest text-[12px]">
                          No active runs initialized. Click Register Batch Run to add one!
                        </p>
                      </div>
                    )}
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
                            onClick={() => {
                              setSelectedJobForHistory(item);
                              const related = MOCK_HISTORICAL_BATCHES.find(b => b.parentJobId === item.id);
                              setSelectedBatchForPerformance(related || null);
                              setHistorySearch('');
                              setHistoryStatusFilter('ALL');
                            }}
                            className="flex-1 bg-white border border-[#eaeaec] py-1 rounded text-[8px] font-black uppercase tracking-widest hover:border-[#212c46] hover:text-[#212c46] text-[#4d87a8] transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95"
                            title="Summary"
                          >
                            <Icons.FileText size={10} /> Summary & History
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
            </>
            )}
          </main>
        </div>
      </div>

      {/* Acknowledge Alert & Log Notes Modal */}
      {activeAcknowledgeBatch && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
            {/* Header */}
            <div className="bg-[#212c46] text-white p-5 flex justify-between items-center">
              <div>
                <span className="text-amber-400 font-mono text-[10px] font-black uppercase tracking-wider block">Supervisor Response Panel</span>
                <h3 className="text-[14px] font-black uppercase tracking-widest flex items-center gap-2 font-sans">
                  <Icons.AlertOctagon size={16} className="text-red-500 animate-pulse" /> Acknowledge Exceed Alert {activeAcknowledgeBatch.id}
                </h3>
              </div>
              <button 
                onClick={() => setActiveAcknowledgeBatch(null)}
                className="text-white/60 hover:text-white transition-all bg-white/10 hover:bg-white/20 p-1.5 rounded-full"
              >
                <Icons.X size={16} />
              </button>
            </div>

            {/* Content Form */}
            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
                <p className="text-xs text-slate-600 font-medium font-sans">
                  Batch: <strong className="text-slate-900 font-extrabold">{activeAcknowledgeBatch.id}</strong> ({activeAcknowledgeBatch.productName})
                </p>
                <p className="text-xs text-slate-600 font-medium font-sans">
                  Stage: <span className="font-extrabold text-slate-900">{activeAcknowledgeBatch.stage}</span> | Standard: <span className="font-mono text-slate-900">{activeAcknowledgeBatch.standardTimeMins} mins</span>
                </p>
                <p className="text-xs text-red-700 font-extrabold flex items-center gap-1 font-sans">
                  🔴 Warning: Current duration is {Math.round(activeAcknowledgeBatch.actualTimeMins)} mins (+{Math.round(activeAcknowledgeBatch.actualTimeMins - activeAcknowledgeBatch.standardTimeMins)} mins over)
                </p>
              </div>

              {/* Form inputs */}
              <div className="space-y-3 font-sans">
                {/* 1. Reason Selection Group */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Justified Root Cause (สาเหตุความล่าช้า)
                  </label>
                  <select
                    value={justificationReason}
                    onChange={(e) => setJustificationReason(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-bold bg-white outline-none focus:border-[#212c46] transition-all"
                  >
                    {JUSTIFICATION_CAUSES.map((cause) => (
                      <option key={cause} value={cause}>{cause}</option>
                    ))}
                  </select>
                </div>

                {/* 2. Custom Supervisor notes */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Corrective Measures / Notes (บันทึกมาตรการแก้ไข)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter detailed action plan, technician update, raw material count..."
                    value={justificationNotes}
                    onChange={(e) => setJustificationNotes(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-3 text-xs text-[#212c46] font-bold bg-white outline-none focus:border-[#212c46] focus:ring-1 focus:ring-[#212c46]/20 transition-all"
                  />
                </div>

                {/* 3. Authorized Rep Name */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Authorized Signatory (ผู้มีอำนาจลงนามรับทราบ)
                  </label>
                  <input
                    type="text"
                    value={justificationRepName}
                    onChange={(e) => setJustificationRepName(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#212c46] font-bold bg-white outline-none focus:border-[#212c46] transition-all"
                    placeholder="Enter supervisor's name..."
                  />
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="bg-[#f8f9fa] border-t border-slate-200 px-6 py-4 flex justify-end gap-3 font-sans">
              <button
                type="button"
                onClick={() => setActiveAcknowledgeBatch(null)}
                className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!justificationNotes.trim()) {
                    Swal.fire("Incomplete Notes", "Please write a brief corrective instruction before saving.", "warning");
                    return;
                  }
                  
                  // Update batch log as acknowledged with our notes
                  updateAlert(activeAcknowledgeBatch.id, {
                    isAcknowledged: true,
                    notes: `${justificationReason}: ${justificationNotes}`,
                    acknowledgedBy: justificationRepName,
                    lastUpdated: new Date().toISOString()
                  });

                  // Log persistent user feedback
                  Swal.fire({
                    title: "Alert Acknowledged Successfully!",
                    text: `Response notes compiled and routed into Daily OEE report.`,
                    icon: "success",
                    confirmButtonColor: "#212c46",
                    timer: 1800
                  });

                  setActiveAcknowledgeBatch(null);
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5 shadow"
              >
                <Icons.CheckCheck size={14} /> Commit & Authorize
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Batch Register Modal */}
      {showCreateBatchModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
            {/* Header */}
            <div className="bg-[#212c46] text-white p-5 flex justify-between items-center">
              <div>
                <span className="text-amber-400 font-mono text-[10px] font-black uppercase tracking-wider block">Floor Logistics Manager</span>
                <h3 className="text-[14px] font-black uppercase tracking-widest flex items-center gap-2 font-sans">
                  <Icons.FolderPlus size={16} className="text-[#b7a159]" /> Register New Batch Run Check
                </h3>
              </div>
              <button 
                onClick={() => setShowCreateBatchModal(false)}
                className="text-white/60 hover:text-white transition-all bg-white/10 hover:bg-white/20 p-1.5 rounded-full"
              >
                <Icons.X size={16} />
              </button>
            </div>

            {/* Content Form */}
            <div className="p-6 space-y-4 font-sans">
              <div className="grid grid-cols-2 gap-4">
                {/* Batch ID */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Batch Run ID (รหัสล็อตย่อย)
                  </label>
                  <input
                    type="text"
                    value={newBatchId}
                    onChange={(e) => setNewBatchId(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#212c46] font-mono font-black uppercase bg-[#f8f9fa] border-dashed"
                    placeholder="B-YYYY-XXX"
                    required
                  />
                </div>

                {/* Operator */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Floor Operator (ผู้ควบคุมสถานี)
                  </label>
                  <input
                    type="text"
                    value={newBatchOperator}
                    onChange={(e) => setNewBatchOperator(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#212c46] font-semibold"
                    placeholder="e.g. Operator Kittisak"
                    required
                  />
                </div>
              </div>

              {/* Order / Product Selection */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Target Work Order / SKU (เชื่อมโยงใบสั่งผลิตหลัก)
                </label>
                <select
                  value={newBatchOrderId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setNewBatchOrderId(id);
                  }}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-bold bg-white outline-none focus:border-[#212c46] transition-all"
                >
                  <option value="" disabled>-- Select Active Production Order --</option>
                  {orders.map((o: any) => (
                    <option key={o.id} value={o.id}>
                      [{o.id}] {o.name} ({o.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Stage */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Process Stage (ด่านผลิตสินค้า)
                  </label>
                  <select
                    value={newBatchStage}
                    onChange={(e) => setNewBatchStage(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold bg-white outline-none focus:border-[#212c46] transition-all"
                  >
                    <option value="Mixing">Mixing (ผสมเตรียมเนื้อ)</option>
                    <option value="Forming">Forming (ขึ้นรูปอาหาร)</option>
                    <option value="Cooking">Cooking (ต้ม อบ รมควัน)</option>
                    <option value="Cooling">Cooling (ชิลล์ผ่านอุโมงค์เย็น)</option>
                    <option value="Cutting">Cutting (ตัด ลอก เปลือก)</option>
                    <option value="Packing">Packing (ด่านบรรจุหีบห่อ)</option>
                  </select>
                </div>

                {/* Equipment */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Assigned Machine/Host
                  </label>
                  <input
                    type="text"
                    value={newBatchEquipment}
                    onChange={(e) => setNewBatchEquipment(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#212c46] font-semibold"
                    placeholder="e.g. Smoke House 6T (#3)"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Initial Elapsed Time */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Current Elapsed Time (Mins)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newBatchInitialActual}
                    onChange={(e) => setNewBatchInitialActual(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#212c46] font-bold"
                  />
                </div>

                {/* Standard time - READONLY PREVIEW */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Standard Time Match (Auto)
                  </label>
                  <div className="w-full border border-green-200 bg-green-50/50 rounded-xl px-3 py-2 text-xs text-green-800 font-black font-mono">
                    {lookedUpStandardForNewBatch} Mins
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="bg-[#f8f9fa] border-t border-slate-200 px-6 py-4 flex justify-end gap-3 font-sans">
              <button
                type="button"
                onClick={() => setShowCreateBatchModal(false)}
                className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!newBatchOrderId) {
                     Swal.fire("Configuration Missing", "Please link this run to an active Work Order first.", "warning");
                     return;
                  }
                  if (!newBatchOperator.trim() || !newBatchEquipment.trim()) {
                     Swal.fire("Missing Fields", "Operator name and Equipment host are required for accountability.", "warning");
                     return;
                  }

                  const linkedOrder = orders.find((o: any) => o.id === newBatchOrderId);
                  const isLate = newBatchInitialActual > lookedUpStandardForNewBatch;

                  const payload: any = {
                    id: newBatchId,
                    parentOrderId: newBatchOrderId,
                    sku: linkedOrder?.sku || 'N/A',
                    productName: linkedOrder?.name || 'Unknown Product',
                    stage: newBatchStage,
                    standardTimeMins: lookedUpStandardForNewBatch,
                    actualTimeMins: newBatchInitialActual,
                    operator: newBatchOperator,
                    equipment: newBatchEquipment,
                    isAlerted: isLate,
                    isAcknowledged: false,
                    notes: '',
                    lastUpdated: new Date().toISOString()
                  };

                  // If already exceeded at creation, dispatch alert context immediately
                  if (isLate) {
                    addNotification({
                      title: `CRITICAL PROCESS DELAY: ${newBatchId}`,
                      description: `Batch run ${newBatchId} (${payload.productName}) initialized above lookups standard of ${payload.standardTimeMins} mins inside ${payload.equipment}. Current time: ${newBatchInitialActual} mins.`,
                      severity: 'critical',
                      category: 'PRODUCTION',
                      actionLink: '/board/production'
                    });
                  }

                  // Add item to Firestore and local states
                  await addAlert(payload);

                  Swal.fire({
                    title: "Batch Created Successfully",
                    text: `Ready for real-time compliance OEE tracking under ${newBatchStage}.`,
                    icon: "success",
                    confirmButtonColor: "#212c46",
                    timer: 1800
                  });

                  setShowCreateBatchModal(false);
                }}
                className="bg-[#212c46] hover:bg-[#121929] text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5 shadow"
              >
                <Icons.Save size={14} /> Start Tracking Run
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals for QR Tag card and Live Cam Scanner */}
      <BatchQrTagModal
        isOpen={selectedTagOrder !== null}
        onClose={() => setSelectedTagOrder(null)}
        order={selectedTagOrder}
        onSimulateScan={handleSimulateScan}
        allOrders={orders}
      />

      {/* Historical Batch Performance Auditor & Comparator Summary Panel Modal */}
      {selectedJobForHistory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-7xl w-full h-[90vh] md:h-[85vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col font-sans">
            {/* Header banner */}
            <div className="bg-[#212c46] text-white p-5 flex justify-between items-center shrink-0 border-b border-slate-700">
              <div>
                <span className="text-amber-400 font-mono text-[10px] font-black uppercase tracking-wider block">Completed Batches Performance Audit & Compare</span>
                <h3 className="text-[14px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Icons.History size={16} className="text-[#b7a159]" /> {selectedJobForHistory.id} / {selectedJobForHistory.name} ({selectedJobForHistory.sku})
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleExportHistoryCSV(selectedJobForHistory.id)}
                  className="bg-[#2e7d32] hover:bg-[#205722] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 shadow"
                >
                  <Icons.Download size={12} /> Export Excel / CSV
                </button>
                <button 
                  onClick={() => {
                    setSelectedJobForHistory(null);
                    setSelectedBatchForPerformance(null);
                  }}
                  className="text-white/60 hover:text-white transition-all bg-white/10 hover:bg-white/20 p-1.5 rounded-full"
                >
                  <Icons.X size={16} />
                </button>
              </div>
            </div>

            {/* Split screen content layout */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
              {/* Left sidebar: list of related batches */}
              <div className="w-full lg:w-1/3 bg-slate-50 border-r border-slate-200 flex flex-col overflow-hidden min-h-0">
                {/* Filters */}
                <div className="p-4 bg-white border-b border-slate-200 space-y-3 shrink-0">
                  <div className="relative">
                    <Icons.Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                    <input
                      type="text"
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      placeholder="Search batch ID, operator, host..."
                      className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold uppercase text-slate-800 bg-slate-50/50 outline-none focus:border-[#212c46] focus:bg-white transition-all"
                    />
                  </div>
                  
                  <div className="flex gap-1">
                    {[
                      { id: "ALL", label: "ALL STATUS" },
                      { id: "COMPLIANT", label: "COMPLIANT" },
                      { id: "WARNING", label: "WARNING" },
                      { id: "EXCEEDED", label: "EXCEEDED" },
                    ].map((filt) => (
                      <button
                        key={filt.id}
                        onClick={() => setHistoryStatusFilter(filt.id)}
                        className={`flex-1 py-1 rounded text-[8px] font-black uppercase tracking-wider border transition-all ${
                          historyStatusFilter === filt.id
                            ? "bg-[#212c46] text-white border-[#212c46]"
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {filt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Batch list scroll */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                  {filteredRelatedBatches.map((batch) => {
                    const isSelected = selectedBatchForPerformance?.id === batch.id;
                    const isLate = batch.totalActualMins > batch.totalStandardMins;
                    const deviationVal = batch.totalActualMins - batch.totalStandardMins;

                    // Get primary status tag
                    let statusColor = "border-l-[#2e7d32]";
                    let statusBg = "bg-[#2e7d32]/10";
                    let statusTxt = "text-[#2e7d32]";
                    let statusLabel = "Compliant";

                    const hasExceeded = batch.stages.some(s => s.status === "exceeded");
                    const hasWarning = batch.stages.some(s => s.status === "warning");

                    if (hasExceeded) {
                      statusColor = "border-l-red-500";
                      statusBg = "bg-red-500/10";
                      statusTxt = "text-red-600";
                      statusLabel = "Exceeded";
                    } else if (hasWarning) {
                      statusColor = "border-l-amber-500";
                      statusBg = "bg-amber-500/10";
                      statusTxt = "text-amber-600";
                      statusLabel = "Warning";
                    }

                    return (
                      <div
                        key={batch.id}
                        onClick={() => setSelectedBatchForPerformance(batch)}
                        className={`p-3 rounded-xl border border-slate-200 cursor-pointer transition-all hover:shadow-xs flex flex-col gap-2 relative border-l-4 ${statusColor} ${
                          isSelected
                            ? "bg-slate-100/90 border-[#212c46] shadow-sm ring-1 ring-[#212c46]/10"
                            : "bg-white hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-[11px] font-black tracking-wider text-[#212c46]">{batch.id}</span>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${statusBg} ${statusTxt}`}>
                            {statusLabel}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[9px] border-t border-slate-100 pt-1.5">
                          <div>
                            <span className="text-slate-400 font-bold uppercase tracking-wider block">COMPLETED DATE</span>
                            <span className="text-slate-800 font-black font-mono">{batch.completionDate}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold uppercase tracking-wider block">CYCLE TIME</span>
                            <span className="text-slate-800 font-black font-mono">
                              {batch.totalActualMins}m / {batch.totalStandardMins}m
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-[9px] bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                          <span className="text-slate-500 font-semibold font-sans">Deviation</span>
                          {deviationVal > 0 ? (
                            <span className="text-red-600 font-black font-mono">+{deviationVal} Mins Delay ⚠️</span>
                          ) : (
                            <span className="text-green-600 font-black font-mono">{deviationVal} Mins Match ✓</span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {filteredRelatedBatches.length === 0 && (
                    <div className="text-center py-12 opacity-50 space-y-2">
                      <Icons.ArchiveX size={26} className="mx-auto text-slate-400" />
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No Batches Found</p>
                      <p className="text-[9px] text-slate-400">Match query standard requirements or reset filters.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right panel: audit trail & comparative charts */}
              <div className="flex-1 bg-white p-6 overflow-y-auto flex flex-col gap-6 custom-scrollbar min-h-0">
                {selectedBatchForPerformance ? (
                  <>
                    {/* Selected batch outline card */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 space-y-4 shadow-sm">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-[14px] font-black text-[#212c46] tracking-wider font-mono">{selectedBatchForPerformance.id}</h4>
                            <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest font-mono">
                              {selectedBatchForPerformance.sku}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-bold font-sans mt-0.5">
                            Compliance Auditor Overview | Completed on {selectedBatchForPerformance.completionDate}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-center shadow-xs">
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Actual Cycle</span>
                            <span className="text-xs font-black font-mono text-[#a94228]">{selectedBatchForPerformance.totalActualMins} mins</span>
                          </div>
                          <div className="bg-white border border-slate-100 px-4 py-2 rounded-xl text-center shadow-xs">
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Standard Cycle</span>
                            <span className="text-xs font-black font-mono text-slate-700">{selectedBatchForPerformance.totalStandardMins} mins</span>
                          </div>
                          <div className="bg-white border border-slate-100 px-4 py-2 rounded-xl text-center shadow-xs">
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Variance</span>
                            {selectedBatchForPerformance.totalVarianceMins > 0 ? (
                              <span className="text-xs font-black font-mono text-red-600 block">+{selectedBatchForPerformance.totalVarianceMins} m</span>
                            ) : (
                              <span className="text-xs font-black font-mono text-green-600 block">{selectedBatchForPerformance.totalVarianceMins} m</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Standard Comparison Visual Chart */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 font-sans flex items-center gap-1.5">
                          <Icons.BarChart4 size={14} className="text-[#a94228]" /> Actual Process Cycle vs Standard Target Time (Minutes)
                        </h4>
                        <span className="text-[9px] text-slate-400 font-bold">BY MANUFACTURING STAGE</span>
                      </div>

                      <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/60 shadow-xs">
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="stage" tick={{ fontSize: 10, fontWeight: 800, fill: '#1e293b' }} />
                            <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#475569' }} label={{ value: 'Minutes', angle: -90, position: 'insideLeft', style: { fontSize: 10, fontWeight: 'bold', fill: '#64748b' } }} />
                            <Tooltip contentStyle={{ fontSize: 11, fontWeight: 'bold', borderRadius: 8 }} />
                            <Legend wrapperStyle={{ fontSize: 10, fontWeight: 'bold', paddingTop: 8 }} />
                            <Bar dataKey="Actual" fill="#a94228" name="Actual Duration (Mins)" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Standard" fill="#212c46" name="Standard Target (Mins)" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Detailed Stage Timestamps Breakdown */}
                    <div className="space-y-3 font-sans">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 flex items-center gap-1.5">
                          <Icons.Clock4 size={14} className="text-[#212c46]" /> Chronological Stage Processing Timestamp Log
                        </h4>
                        <span className="text-[9px] text-[#2e7d32] font-mono font-black uppercase tracking-[0.15em] bg-green-50 px-2 py-0.5 rounded border border-green-200/60">
                          Complete Audit Trail
                        </span>
                      </div>

                      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-widest text-[9px] border-b border-slate-200">
                              <th className="px-4 py-3">Stage</th>
                              <th className="px-4 py-3">Equipment Host</th>
                              <th className="px-4 py-3">Operator</th>
                              <th className="px-4 py-3">Start Time</th>
                              <th className="px-4 py-3">End Time</th>
                              <th className="px-4 py-3 text-right">Actual</th>
                              <th className="px-4 py-3 text-right">Standard</th>
                              <th className="px-4 py-3 text-right">Variance</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            {selectedBatchForPerformance.stages.map((stage: any, sIdx: number) => {
                              const vMins = stage.varianceMins;
                              const isStageLate = vMins > 0;
                              
                              // Format dates
                              const startFormatted = new Date(stage.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                              const endFormatted = new Date(stage.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                              return (
                                <tr key={sIdx} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-4 py-3.5 font-bold text-slate-800 flex items-center gap-1.5">
                                    <span className={`w-2 h-2 rounded-full ${
                                      stage.status === 'exceeded' ? 'bg-red-500' : stage.status === 'warning' ? 'bg-amber-400' : 'bg-green-500'
                                    }`}></span>
                                    {stage.stageName}
                                  </td>
                                  <td className="px-4 py-3.5 text-slate-600 font-semibold">{stage.equipment}</td>
                                  <td className="px-4 py-3.5 text-slate-500">{stage.operator}</td>
                                  <td className="px-4 py-3.5 text-slate-700 font-mono text-[11px]">{startFormatted}</td>
                                  <td className="px-4 py-3.5 text-slate-700 font-mono text-[11px]">{endFormatted}</td>
                                  <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">{stage.actualDurationMins}m</td>
                                  <td className="px-4 py-3.5 text-right font-mono text-slate-400">{stage.standardDurationMins}m</td>
                                  <td className="px-4 py-3.5 text-right font-mono">
                                    {vMins > 0 ? (
                                      <span className="text-red-600 font-extrabold bg-red-50 px-1.5 py-0.5 rounded">+{vMins}m Over</span>
                                    ) : vMins < 0 ? (
                                      <span className="text-green-600 font-extrabold bg-green-50 px-1.5 py-0.5 rounded">{vMins}m Under</span>
                                    ) : (
                                      <span className="text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">On Time</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 py-20 gap-2">
                    <Icons.LayoutGrid size={48} className="text-slate-300" />
                    <h3 className="text-xs font-black uppercase text-slate-600 tracking-widest">Select a Batch Record</h3>
                    <p className="text-[10px] text-slate-400 max-w-sm">
                      Choose any batch on the left panel to review its full industrial stage timestamps, deviation metrics, and compliance charts.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
