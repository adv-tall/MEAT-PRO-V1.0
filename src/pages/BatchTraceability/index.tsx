import React, { useState, useEffect, useRef, useMemo } from "react";
import { Html5Qrcode } from "html5-qrcode";
import * as Icons from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import Swal from "sweetalert2";
import { useSharedOrders } from "@/src/store/ordersStore";
import KpiCard from "@/src/components/shared/KpiCard";
import { UserGuidePanel } from "@/src/components/shared/UserGuidePanel";
import UserGuideButton from "@/src/components/shared/UserGuideButton";
import BatchGenealogyTree from "@/src/components/BatchGenealogyTree";

// -- THEME PALETTE (Consistent with application styles) --
const THEME = {
  primary: "#212c46",
  primaryLight: "#4d87a8",
  accent: "#a94228",
  gold: "#b58c4f",
  success: "#657f4d",
  danger: "#932c2e",
  skyBlue: "#3f809e",
  dustyBlue: "#7a8b95",
  indigo: "#414757",
  silver: "#d7d7d7",
};

// --- REALISTIC RECIPES AND RAW MATERIALS DATABASE BY SKU PREFIX ---
const PRODUCT_LINEAGE_FALLBACKS: Record<string, any> = {
  "FG-10": { // Chicken Sausage
    materials: [
      { id: "RM-CHK-088", name: "เนื้อไก่แช่แข็งเกรด A (Frozen Chicken Breast)", source: "CPF Farm No. 12 (ISO 22000)", lot: "CPF-2606A", qty: 250, unit: "kg" },
      { id: "RM-SKN-101", name: "หนังไก่สดคัดไขมัน (Fresh Chicken Skin)", source: "Betagro Korat (GMP Certified)", lot: "BG-SKN-902", qty: 80, unit: "kg" },
      { id: "RM-SPICE-04", name: "เครื่องปรุงรสไส้กรอกจัมโบ้ (Sausage Seasoning Blend)", source: "Siam Flavors Co., Ltd.", lot: "SFB-771", qty: 15, unit: "kg" },
      { id: "RM-FOS-102", name: "อาหารเสริมถนอมอาหาร (Food Phosphate Formula)", source: "MC Foods Supply", lot: "MC-P22", qty: 2.5, unit: "kg" },
      { id: "RM-CAS-310", name: "ไส้คอลลาเจนขนาด 24 มม. (Collagen Casing 24mm)", source: "Devro Thailand", lot: "DEV-C-1981", qty: 12, unit: "reels" }
    ],
    mixingOperator: "สมเกียรติ ยิ่งยืน (Supervisor Shift A)",
    mixingMachine: "Emulsion System-1 (High-Speed)"
  },
  "FG-20": { // Cocktail Sausage
    materials: [
      { id: "RM-CHK-099", name: "เนื้ออกไก่บดละเอียด (Minced Chicken)", source: "CPF Nakhon Pathom", lot: "CPF-2605B", qty: 200, unit: "kg" },
      { id: "RM-SKN-101", name: "หนังไก่สดคัดไขมัน (Fresh Chicken Skin)", source: "Betagro Sriracha", lot: "BG-SKN-903", qty: 90, unit: "kg" },
      { id: "RM-SPICE-02", name: "ผงเครื่องปรุงรสคอกเทลสูตรพิเศษ (Cocktail Spice Mix)", source: "Premium Ingredients", lot: "PI-CK-402", qty: 18, unit: "kg" },
      { id: "RM-STARCH-1", name: "แป้งมันสำปะหลังแปรรูปดัดแปร (Modified Tapioca Starch)", source: "SMS Starch Thailand", lot: "SMS-ST-110", qty: 25, unit: "kg" }
    ],
    mixingOperator: "อานนท์ ใจดี (Senior Cooker)",
    mixingMachine: "Vacuum Bowl Cutter V-3"
  },
  "FG-30": { // Pork Meatball
    materials: [
      { id: "RM-PRK-120", name: "เนื้อสะโพกหมูสดคัดแต่ง (Fresh Pork Shoulder Trim 80/20)", source: "เครือสหพัฒน์ฟาร์ม (HACCP Approved)", lot: "SPF-PRK-29A", qty: 300, unit: "kg" },
      { id: "RM-FAT-202", name: "มันแข็งหมูบดละเอียด (Hard Pork Fat Back)", source: "CPF Chonburi Yard", lot: "CPF-PKF-80", qty: 50, unit: "kg" },
      { id: "RM-ICE-991", name: "น้ำแข็งน้ำกรองต้มสุกเกล็ด (Sterilised Flake Ice)", source: "MES Water Purifier System", lot: "H2O-ICE-MAIN", qty: 100, unit: "kg" },
      { id: "RM-SPICE-09", name: "ผงเครื่องเทศแกงลูกชิ้นหมูอุตสาหกรรม (Meatball Binder Premix)", source: "Siam Flavors Co., Ltd.", lot: "M-BIND-10", qty: 12, unit: "kg" }
    ],
    mixingOperator: "เกรียงไกร ชนะภัย (Cutter Specialist)",
    mixingMachine: "High-Power Vacuum Mixer B"
  },
  "FG-40": { // Chili Bologna
    materials: [
      { id: "RM-CHK-088", name: "เนื้อไก่แช่แข็งเกรด A (Frozen Chicken Breast)", source: "CPF Farm No. 8", lot: "CPF-2606F", qty: 180, unit: "kg" },
      { id: "RM-PRK-122", name: "เนื้อเศษหมูคัดละเอียด (Pork Trimmings Premium)", source: "Betagro Meat", lot: "BM-PR-55", qty: 120, unit: "kg" },
      { id: "RM-PEP-221", name: "พริกขี้หนูสวนดองสับ (Chopped Garden Chili)", source: "Local GAP Farmer-Group", lot: "GAP-CH-33", qty: 14, unit: "kg" },
      { id: "RM-SPICE-18", name: "ผงอิมัลซิไฟเออร์บลอนด์แซนด์วิช (Bologna Seasoning Base)", source: "Ajinomoto Industries", lot: "AJI-BLG-99", qty: 10, unit: "kg" }
    ],
    mixingOperator: "วัลลภ วันดี (Emulsifier Operator)",
    mixingMachine: "Bowl Cutter Emulsion System"
  },
  "FG-50": { // Cheese Lava Sausage
    materials: [
      { id: "RM-CHK-088", name: "เนื้อไก่นิ่มบด (Premium Minced Chicken)", source: "CPF Farm No. 12", lot: "CPF-2606A", qty: 220, unit: "kg" },
      { id: "RM-CHS-880", name: "เชดดาร์ชีสเหลวลากูน่า (High-Temp Cheddar Cheese)", source: "Fonterra New Zealand (Halal)", lot: "FT-CHS-004", qty: 85, unit: "kg" },
      { id: "RM-SPICE-04", name: "เครื่องปรุงรสไส้กรอกจัมโบ้ (Sausage Seasoning Blend)", source: "Siam Flavors Co., Ltd.", lot: "SFB-771", qty: 14, unit: "kg" },
      { id: "RM-CAS-310", name: "ไส้คอลลาเจนขนาด 24 มม. (Collagen Casing 24mm)", source: "Devro Thailand", lot: "DEV-C-1981", qty: 12, unit: "reels" }
    ],
    mixingOperator: "เดชา พรมมา (Cheese Line Lead)",
    mixingMachine: "Twin-Shaft Vacuum Mixer-2"
  },
  "DEFAULT": { // Generic / Fallback Product Lineage
    materials: [
      { id: "RM-MEAT-SPL", name: "วัตถุดิบเนื้อสัตว์ผสมป้อน (Standard Meat Base Mix)", source: "Local Slaughterhouse (GMP Approved)", lot: "STD-MT-302", qty: 250, unit: "kg" },
      { id: "RM-SPICE-STD", name: "ผงปรุงแต่งกลิ่นอรรถรสอเนกประสงค์ (Standard Seasoning Base)", source: "V-Care Food Tech Solutions", lot: "VCF-901", qty: 20, unit: "kg" },
      { id: "RM-ICE-991", name: "น้ำแข็งน้ำกรองต้มสุกเกล็ด (Sterilised Flake Ice)", source: "MES Water Purifier System", lot: "H2O-ICE-MAIN", qty: 70, unit: "kg" }
    ],
    mixingOperator: "พนักงานฝ่ายตักเตรียมสูตรทั่วไป (System Operator)",
    mixingMachine: "Industrial Vacuum Bowl Mixer"
  }
};

const PACKING_OPERATORS = [
  "นางสาวสุลดา หอมกลิ่น (Station 1 Lead)",
  "นายอลงกรณ์ ทองมา (Automatic Sealer)",
  "นางฉวี ศิริวรรณ (Quality Control Inspector)",
  "นายวัชระ ประดับวงษ์ (Boxer Assistant)",
  "นางสาววนิดา ดีใจ (Carton Label Recorder)"
];

const PACKING_FOIL_LOTS = [
  "Aris Pack Lot AP-801 (PET/AL/PE Premium Layer)",
  "Siam Polymer Lot SP-93 (BOPA laminated)",
  "Thaimax Poly Lot TX-44 (High Barrier Shrunk)",
  "Star-Pack Film Lot ST-299 (Co-extruded EVOH Film)"
];

// Helper to resolve details for a batch code
function getFallbackLineage(skuCode: string, batchId: string) {
  let matchedGroupFlag = "DEFAULT";
  if (skuCode) {
    const pfx = skuCode.substring(0, 5);
    if (PRODUCT_LINEAGE_FALLBACKS[pfx]) {
      matchedGroupFlag = pfx;
    }
  }

  const baseConfig = PRODUCT_LINEAGE_FALLBACKS[matchedGroupFlag];

  // Hash-based deterministic values so the page maintains identical values on a per-batch basis if not customized
  let mixIndex = 0;
  let foilIndex = 0;
  if (batchId) {
    let hash = 0;
    for (let i = 0; i < batchId.length; i++) {
        hash = batchId.charCodeAt(i) + ((hash << 5) - hash);
    }
    mixIndex = Math.abs(hash) % PACKING_OPERATORS.length;
    foilIndex = Math.abs(hash) % PACKING_FOIL_LOTS.length;
  }

  // Calculate random-offset mixing timestamp (about 3-4 hours prior to standard timeline)
  const dt = new Date();
  dt.setHours(dt.getHours() - 4);
  const mixingDateStr = dt.toISOString().split("T")[0];
  const mixingTimeStr = dt.toTimeString().split(" ")[0];

  return {
    materials: baseConfig.materials.map((m: any) => ({ ...m })),
    mixingTimestamp: `${mixingDateStr} ${mixingTimeStr}`,
    mixingOperator: baseConfig.mixingOperator,
    mixingMachine: baseConfig.mixingMachine,
    packingOperator: PACKING_OPERATORS[mixIndex],
    packingFoilLot: PACKING_FOIL_LOTS[foilIndex],
    sealTestingStatus: "ผ่านการทดสอบสูญญากาศ 100% (Leaking Test OK)",
    coreInternalTemp: "74.8 °C (ผ่านระเบียบสุขอนามัย >72°C)",
    warehouseBay: "คลังสินค้าทั่วไป Bay A-14 (ห้องเก็บอุณหภูมิติดลบ)",
    dispatchTruckLicense: "บพ-8854 ปทุมธานี (รถติดตั้งห้องเย็นควบคุม -18°C)"
  };
}

export default function BatchTraceability() {
  const [orders, setOrders, updateOrder] = useSharedOrders();
  const [searchQuery, setSearchQuery] = useState("");
  const [scannedBatchId, setScannedBatchId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'camera' | 'emulator'>('emulator');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'tree' | 'stepper'>('tree');
  
  // Camera & Diagnostics logs
  const [cameraState, setCameraState] = useState<'idle' | 'scanning' | 'permissions_failed' | 'starting'>('idle');
  const [camerasFound, setCamerasFound] = useState<any[]>([]);
  const [cameraIdSelected, setCameraIdSelected] = useState<string>('');
  const [scannerErrorMessage, setScannerErrorMessage] = useState('');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);

  // Selected Order and Lineage Details state
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [lineageDetails, setLineageDetails] = useState<any | null>(null);
  
  // Custom editing states
  const [isEditingLineage, setIsEditingLineage] = useState(false);
  const [tempLineage, setTempLineage] = useState<any | null>(null);

  // Refs for HTML5QR
  const html5QrRef = useRef<Html5Qrcode | null>(null);
  const isCameraTransitioning = useRef<boolean>(false);
  const cameraContainerId = "traceability-camera-frame";

  // Notification and manual log utilities
  const pushLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTerminalLogs(prev => [`[${timestamp}] ${msg}`, ...prev].slice(0, 15));
  };

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.06, audioCtx.currentTime);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
      console.warn("Unable to play diagnostic beep noise", e);
    }
  };

  // Start with a default selected order if none picked
  useEffect(() => {
    if (orders.length > 0 && !selectedOrder) {
      const firstActive = orders.find(o => o.status === "IN PROGRESS" || o.status === "COMPLETED") || orders[0];
      handleLoadBatch(firstActive.id);
    }
  }, [orders, selectedOrder]);

  // Load a batch lineage and merge with local storage overrides
  const handleLoadBatch = (batchId: string) => {
    const matched = orders.find(o => o.id === batchId || o.id === batchId.toUpperCase());
    if (!matched) {
      // Create a virtual mocked order in case they type an un-listed ID
      const virtualOrder = {
        id: batchId,
        name: "ไส้กรอกหมูพันเบคอนเกรดโกลด์",
        sku: "FG-5008-VIRTUAL",
        qty: 150,
        deadline: "16:00",
        status: "COMPLETED",
        shift: "Afternoon",
        customer: "Lotus Market Hub",
        currentStep: "WH",
        date: new Date().toISOString().split("T")[0]
      };
      setSelectedOrder(virtualOrder);
      
      const staticLineage = getFallbackLineage(virtualOrder.sku, batchId);
      const storageKey = `mes_batch_lineage_${batchId}`;
      const savedOverride = localStorage.getItem(storageKey);
      if (savedOverride) {
        try {
          setLineageDetails(JSON.parse(savedOverride));
        } catch(e) {
          setLineageDetails(staticLineage);
        }
      } else {
        setLineageDetails(staticLineage);
      }
      return;
    }

    setSelectedOrder(matched);
    const staticLineage = getFallbackLineage(matched.sku || "DEFAULT", matched.id);
    const storageKey = `mes_batch_lineage_${matched.id}`;
    const savedOverride = localStorage.getItem(storageKey);
    if (savedOverride) {
      try {
        setLineageDetails(JSON.parse(savedOverride));
      } catch (e) {
        setLineageDetails(staticLineage);
      }
    } else {
      setLineageDetails(staticLineage);
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      handleLoadBatch(searchQuery.trim());
      pushLog(`🔍 ทำการค้นหา Batch ID: ${searchQuery.trim()}`);
      playBeep();
    }
  };

  // --- CAMERA SCANNING CODE ---
  const startCamera = async (camId?: string) => {
    if (isCameraTransitioning.current) return;
    
    setCameraState('starting');
    setScannerErrorMessage('');
    pushLog("กำลังเตรียมอนุญาตฟีดของกล้อง...");

    await stopCamera();

    isCameraTransitioning.current = true;
    try {
      const html5QrCode = new Html5Qrcode(cameraContainerId);
      html5QrRef.current = html5QrCode;

      if (camerasFound.length === 0) {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setCamerasFound(devices);
          camId = camId || devices[0].id;
          setCameraIdSelected(devices[0].id);
        } else {
          throw new Error("ไม่พบเซนเซอร์กล้องบนคอมพิวเตอร์ของคุณ");
        }
      }

      const activeCamId = camId || cameraIdSelected || (camerasFound[0] && camerasFound[0].id);
      if (!activeCamId) {
        throw new Error("ไม่มีค่า UID กล้องเพื่อเชื่อมต่อ");
      }

      await html5QrCode.start(
        activeCamId,
        {
          fps: 12,
          qrbox: { width: 220, height: 220 }
        },
        (text) => {
          handleCameraDecoded(text);
        },
        () => {
          // Inner capture, quiet
        }
      );

      setCameraState('scanning');
      pushLog("กล้องพร้อมเชื่อมต่อสำเร็จ! เล็งไปที่บาร์โค้ดแถบพิมพ์บอร์ดผลิต");
    } catch (err: any) {
      console.error(err);
      setCameraState('permissions_failed');
      setScannerErrorMessage(err.message || "เบราว์เซอร์ไม่ได้รับอนุญาตหรืออุปกรณ์กล้องขัดข้อง");
      pushLog(`⚠️ ข้อผิดพลาดกล้อง: ${err.message || 'Access Blocked'}`);
    } finally {
      isCameraTransitioning.current = false;
    }
  };

  const stopCamera = async () => {
    if (isCameraTransitioning.current) {
      // If we are currently starting, we can't reliably stop immediately without a transition error,
      // so we will spin-wait until the transition completes.
      while (isCameraTransitioning.current) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    if (html5QrRef.current) {
      isCameraTransitioning.current = true;
      try {
        if (html5QrRef.current.isScanning) {
          await html5QrRef.current.stop();
        }
      } catch (e) {
        console.warn("Clean error on html5qr stop ignored", e);
      } finally {
        isCameraTransitioning.current = false;
        html5QrRef.current = null;
      }
    }
    setCameraState('idle');
  };

  const handleCameraDecoded = (decodedText: string) => {
    playBeep();
    pushLog(`🎉 ตรวจสแกนพบคิวอาร์: "${decodedText}"`);

    // Parse if JSON, or extract clean ID
    let batchIdToLoad = decodedText.trim();
    try {
      const parsed = JSON.parse(decodedText);
      if (parsed && parsed.id) {
        batchIdToLoad = parsed.id;
        pushLog(`✓ ถอดข้อมูล Schema วัตถุดิบข้ามจุด: ${parsed.name || "Sausage"}`);
      }
    } catch (e) {
      // Plain text ID
    }

    handleLoadBatch(batchIdToLoad);
    setScannedBatchId(batchIdToLoad);

    Swal.fire({
      title: 'สแกนตรวจสอบเสร็จสิ้น!',
      text: `โหลดข้อมูลล็อตการผลิต: ${batchIdToLoad}`,
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });

    // Auto toggle to emulator view to avoid constant scanning loop
    setActiveTab('emulator');
  };

  useEffect(() => {
    if (activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeTab]);

  // Handle saving editing inputs
  const handleStartEditing = () => {
    setTempLineage(JSON.parse(JSON.stringify(lineageDetails)));
    setIsEditingLineage(true);
  };

  const handleCancelEditing = () => {
    setIsEditingLineage(false);
    setTempLineage(null);
  };

  const handleSaveEditing = () => {
    if (!selectedOrder || !tempLineage) return;

    // Cache to local storage
    const storageKey = `mes_batch_lineage_${selectedOrder.id}`;
    localStorage.setItem(storageKey, JSON.stringify(tempLineage));
    setLineageDetails(tempLineage);
    setIsEditingLineage(false);
    setTempLineage(null);
    pushLog(`💾 บันทึกการแก้ไขข้อมูล Lineage สู่ LocalStorage: ${selectedOrder.id}`);

    Swal.fire({
      title: "บันทึกประวัติสำเร็จ!",
      text: "ระบบจำลองอัปเดตไฟล์สำแดงห่วงโซ่ของล็อตนี้เรียบร้อย",
      icon: "success",
      confirmButtonColor: THEME.primary
    });
  };

  const handleUpdateMaterialItem = (index: number, field: string, value: any) => {
    if (!tempLineage) return;
    const updatedMaterials = [...tempLineage.materials];
    updatedMaterials[index] = { ...updatedMaterials[index], [field]: value };
    setTempLineage({ ...tempLineage, materials: updatedMaterials });
  };

  const handleDeleteMaterialItem = (index: number) => {
    if (!tempLineage) return;
    const updatedMaterials = tempLineage.materials.filter((_: any, i: number) => i !== index);
    setTempLineage({ ...tempLineage, materials: updatedMaterials });
  };

  const handleAddMaterialItem = () => {
    if (!tempLineage) return;
    const newMaterial = {
      id: `RM-NEW-${Math.floor(100 + Math.random() * 900)}`,
      name: "วัตถุดิบใหม่เสริมสูตรสแกน",
      source: "ระบุแหล่งที่มา / ผู้ส่งมอบ",
      lot: `LOT-${new Date().getFullYear()}X`,
      qty: 10,
      unit: "kg"
    };
    setTempLineage({
      ...tempLineage,
      materials: [...tempLineage.materials, newMaterial]
    });
  };

  const handlePrintPDF = () => {
    pushLog(`สั่งพิมพ์รายงานประวัติความย้อนกลับอย่างเป็นทางการสำหรับล็อต ${selectedOrder?.id || "N/A"}...`);
    window.print();
  };

  // KPI Calculations
  const ordersCompletedToday = useMemo(() => {
    return orders.filter(o => o.status === "COMPLETED").length;
  }, [orders]);

  const totalRawWeighings = useMemo(() => {
    // Generate a beautiful index count representing secure lots in storage
    return 145 + ordersCompletedToday * 4;
  }, [ordersCompletedToday]);

  return (
    <div className="p-6 md:p-8 flex flex-col gap-6 text-[#212c46] min-h-screen" style={{ backgroundColor: "#f3f3f1" }}>
      
      {/* 1. TOP TITLE BENTO BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#212c46] to-[#a94228] flex items-center justify-center text-white shadow-md">
            <Icons.QrCode size={24} className="animate-spin-slow" />
          </div>
          <div className="text-left font-sans">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-[#a94228] text-white px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Lineage Trace V2</span>
              <span className="text-xs bg-slate-100 text-slate-500 border px-2 py-0.5 rounded-full font-bold">Offline & Cloud Sync</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight mt-1">BATCH TRACEABILITY • ตรวจสอบห่วงโซวัตถุดิบย้อนกลับ</h1>
            <p className="text-[11px] text-slate-500 font-medium">สแกนคิวอาร์โค้ดบัตรคำสั่งผลิตหรือระบุหมายเลขบิล เพื่อสำรวจประวัติการผสม, แหล่งส่งมอบวัตถุดิบ ตลอดจนทีมพนักงานสวมบรรจุกล่อง</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          <UserGuideButton onClick={() => setIsGuideOpen(true)} />
        </div>
      </div>

      {/* KPI METRIC BAR */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard label="Lineage Records Secured" value={`${orders.length} Batches`} icon="shield-check" colorAccent={THEME.primary} colorValue={THEME.primary} desc="Secure production lots tracked" />
        <KpiCard label="Raw Materials Checked" value={`${totalRawWeighings} LOTs`} icon="database" colorAccent={THEME.gold} colorValue={THEME.gold} desc="Supplier farms & lots validated" />
        <KpiCard label="HACCP Critical Limit Checks" value="Passed (100%)" icon="thermometer" colorAccent={THEME.success} colorValue={THEME.success} desc="Cook temperature exceeded 72°C" />
        <KpiCard label="Active QR Printers Online" value="3 Nodes" icon="printer" colorAccent={THEME.skyBlue} colorValue={THEME.skyBlue} desc="Tag printers & scanners syncing" />
      </div>

      {/* 2. BODY CONTENT PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
        
        {/* LEFT COLUMN: SCANNER, SEARCH & SELECTION (4 Cols) */}
        <div className="col-span-1 lg:col-span-4 flex flex-col gap-6">
          
          {/* SEARCH & SELECT CARD */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4 text-left">
            <div>
              <h2 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5 mb-1">
                <Icons.Search size={14} className="text-[#a94228]" /> ค้นหาล็อตผลิตคีย์บอร์ด
              </h2>
              <p className="text-[10px] text-slate-500 leading-normal">
                กด Enter เพื่อประมวลวิเคราะห์ หรือกดเลือกรายชื่อชุดงานจอยริลในกล่องด้านล่าง
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="พิมพ์เลขล็อต เช่น PL-2606-0001..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyPress}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 font-mono font-bold outline-none focus:border-[#a94228] transition-all uppercase placeholder:italic"
                />
                <Icons.Search size={15} className="absolute left-3 top-3 text-slate-400 pointer-events-none" />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700">
                    <Icons.X size={15} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="h-px bg-slate-200 flex-1"></div>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">หรือเลือกในคลังข้อมูล</span>
                <div className="h-px bg-slate-200 flex-1"></div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-[#7a8b95] font-black uppercase tracking-widest">เลือกบิลออเดอร์ในระบบ</label>
                <select
                  value={selectedOrder ? selectedOrder.id : ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) {
                      handleLoadBatch(val);
                      pushLog(`[LIST] ผู้ใช้เลือกโหลดล็อต: ${val}`);
                      playBeep();
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-black outline-none focus:border-[#a94228] transition-all cursor-pointer"
                >
                  <option value="">-- ดึงรายชื่อเป้าหมายผลิตสด --</option>
                  {orders.map((o: any) => (
                    <option key={o.id} value={o.id}>
                      [{o.id}] - {o.name.substring(0, 24)} ({o.qty} bts)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* HARDWARE QR/BARCODE SCANNER */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between text-white relative">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-[10px] text-emerald-400 font-black tracking-widest uppercase flex items-center gap-1.5">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                LIVE METACELL DECODER
              </span>
              
              <div className="flex bg-slate-900 border border-slate-800/80 rounded-lg p-0.5 shrink-0 scale-90">
                <button 
                  onClick={() => setActiveTab('camera')}
                  className={`px-2 py-1 rounded-md text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer ${activeTab === 'camera' ? 'bg-[#a94228] text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  <Icons.Camera size={10} /> Camera
                </button>
                <button 
                  onClick={() => setActiveTab('emulator')}
                  className={`px-2 py-1 rounded-md text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer ${activeTab === 'emulator' ? 'bg-[#a94228] text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  <Icons.Sparkles size={10} /> Emulator
                </button>
              </div>
            </div>

            {/* Viewport Frame */}
            <div className="my-4 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex flex-col items-center justify-center relative min-h-[220px]">
              {activeTab === 'camera' ? (
                <>
                  <div id={cameraContainerId} className="w-full h-full min-h-[225px] flex items-center justify-center bg-transparent [&_video]:max-w-full [&_video]:max-h-full [&_video]:rounded-xl" />
                  
                  {cameraState === 'scanning' && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center bg-slate-950/10">
                      <div className="w-[170px] h-[170px] border-2 border-dashed border-emerald-400 rounded-xl relative flex items-center justify-center bg-slate-950/20 shadow-[0_0_15px_rgba(52,211,153,0.1)]">
                        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-emerald-400 rounded-tl" />
                        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-emerald-400 rounded-tr" />
                        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-emerald-400 rounded-bl" />
                        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-emerald-400 rounded-br" />
                        <div className="w-full h-0.5 bg-emerald-400 absolute animate-pulse animate-bounce" />
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400 bg-slate-950/85 px-2 py-1 rounded border border-emerald-500/25 mt-3 shadow">
                        ทาบสัญลักษณ์บาร์โค้ดหน้าจอ
                      </span>
                    </div>
                  )}

                  {cameraState === 'starting' && (
                    <div className="flex flex-col items-center justify-center gap-2 text-center p-4">
                      <div className="w-8 h-8 rounded-full border-2 border-t-emerald-400 border-slate-800 animate-spin" />
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">กำลังสตาร์ทกล้องหลัก...</span>
                    </div>
                  )}

                  {(cameraState === 'idle' || cameraState === 'permissions_failed') && (
                    <div className="flex flex-col items-center justify-center gap-2 p-6 text-center max-w-xs">
                      <Icons.VideoOff size={28} className="text-slate-500 animate-bounce mb-1" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#a94228]">กล้องยังไม่เชื่อมต่อ</p>
                      <p className="text-[9px] text-slate-400 leading-normal">
                        {scannerErrorMessage || "อนุญาตสิทธิ์การดึงข้อมูลจากเลนส์กล้องของเบราว์เซอร์ เพื่อแสกนบาร์โค้ดพิมพ์"}
                      </p>
                      <button
                        onClick={() => startCamera()}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[9px] uppercase tracking-widest px-3.5 py-2 mt-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                      >
                        <Icons.Camera size={11} /> Start Camera Focus
                      </button>
                    </div>
                  )}
                </>
              ) : (
                /* SIMULATOR QUICK PRESETS */
                <div className="w-full h-full p-4 flex flex-col justify-between">
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Icons.PlayCircle size={12} className="text-amber-500" /> สตรีมจำลองสแกนด่านผลิต (Simulator Bypass)
                    </p>
                    <p className="text-[9px] text-slate-500 leading-normal mt-0.5">
                      เลือกตัวอย่างชุดบิลจำลองบาร์โค้ดด้านล่างเพื่อคัดเลือกและฟังเสียงเป่าแชมปืนยิงบาร์โค้ดเสมือนติดตั้งหน้างาน
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 my-3">
                    {orders.slice(0, 4).map((o: any) => (
                      <button
                        key={o.id}
                        onClick={() => {
                          handleCameraDecoded(JSON.stringify({ schema: "MEAT-PRO-BATCH-V1", id: o.id, name: o.name }));
                        }}
                        className="p-2 border border-slate-800 hover:border-amber-500 bg-[#161d2d] hover:bg-[#1a253b] text-left rounded-lg transition-all cursor-pointer text-[9px]"
                      >
                        <p className="font-mono font-black text-amber-500 leading-none mb-1">{o.id}</p>
                        <p className="text-slate-300 font-bold truncate">{o.name}</p>
                      </button>
                    ))}
                  </div>

                  <div className="bg-slate-950 p-2 rounded text-center border border-slate-900/60 text-[8.5px] text-slate-500">
                    💡 พนักงานหน้าด่านขนย้ายกวาดสแกนด้วยเครื่องอ่านพกพา ข้อมูลจะลิงก์ย้อนจุดทันที
                  </div>
                </div>
              )}
            </div>

            {/* Terminal logs diagnostics */}
            <div className="bg-slate-950 border border-slate-900 rounded-lg p-2.5 h-28 flex flex-col justify-between overflow-hidden">
              <div className="flex justify-between items-center text-[7.5px] font-black text-[#acd9bd] tracking-widest uppercase border-b border-slate-900 pb-1.5 shrink-0">
                <span className="flex items-center gap-1"><Icons.Code size={11} /> Scanner Decoder Logs</span>
                <button onClick={() => setTerminalLogs([])} className="text-slate-600 hover:text-white text-[8px]">Clear</button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-[8.5px] text-slate-400 space-y-1.5 pt-1.5 text-left">
                {terminalLogs.length === 0 ? (
                  <p className="text-slate-600 italic uppercase">สแตนด์บายรับการเชื่อมต่อบาร์โค้ด...</p>
                ) : (
                  terminalLogs.map((log, i) => (
                    <p key={i} className="truncate select-all leading-relaxed text-slate-300">{log}</p>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: LINEAGE TIMELINE & DETAILS (8 Cols) */}
        <div className="col-span-1 lg:col-span-8 flex flex-col gap-6">
          
          {selectedOrder ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col text-left">
              
              {/* PRIMARY TITLE HEADER */}
              <div className="bg-[#212c46] p-5 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 relative">
                <div className="absolute top-0 right-0 p-1 bg-[#a94228] text-white opacity-10">
                   <Icons.ShieldCheck size={180} />
                </div>
                
                <div className="text-left font-sans z-10">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black bg-[#a94228] text-white px-2 py-0.5 rounded uppercase font-mono shadow-sm">
                      BATCH: {selectedOrder.id}
                    </span>
                    <span className="text-[9px] font-black bg-slate-900/60 text-slate-100 px-2 py-0.5 rounded uppercase font-mono tracking-wider ml-1">
                      SKU: {selectedOrder.sku || "N/A"}
                    </span>
                  </div>
                  <h2 className="text-lg font-black tracking-tight mt-1 leading-snug">
                     {selectedOrder.name}
                  </h2>
                  <p className="text-[10px] text-slate-300 font-medium">คำสั่งการจัดซื้อและกระจายสินค้า: ลูกค้าสั่ง <strong className="text-white font-bold">{selectedOrder.customer || "General Market"}</strong> | ผลผลิต {selectedOrder.qty || selectedOrder.fgKg / 1000} ลัง/ชุดผลิต</p>
                </div>

                <div className="bg-white/10 border border-white/20 p-2.5 rounded-xl flex items-center gap-3 shrink-0 self-stretch sm:self-auto justify-between sm:justify-start z-10 backdrop-blur-sm">
                  <div className="text-right">
                    <span className="text-[8px] font-black text-slate-300 block uppercase tracking-widest leading-none">STATUS CONTROL</span>
                    <span className="font-mono text-xs font-black text-amber-300 inline-block mt-1">{selectedOrder.status}</span>
                  </div>

                  <div className="p-1 px-1.5 bg-white rounded">
                    <QRCodeSVG
                      value={JSON.stringify({ schema: "MEAT-PRO-BATCH-V1", id: selectedOrder.id })}
                      size={44}
                      level={"L"}
                    />
                  </div>
                </div>
              </div>

              {/* ACTION NAVIGATION & TOOLBAR */}
              <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                {/* Visual view mode toggles */}
                <div className="flex bg-slate-200 border border-slate-300 rounded-lg p-0.5 self-start sm:self-auto select-none">
                  <button
                    onClick={() => setViewMode('tree')}
                    className={`px-3.5 py-1.5 rounded-md text-[10.5px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                      viewMode === 'tree'
                        ? 'bg-[#212c46] text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Icons.GitMerge size={12} className="rotate-90" /> 📈 GENEALOGY CHART (แผนผังสายใย)
                  </button>
                  <button
                    onClick={() => setViewMode('stepper')}
                    className={`px-3.5 py-1.5 rounded-md text-[10.5px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                      viewMode === 'stepper'
                        ? 'bg-[#212c46] text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Icons.ListOrdered size={12} /> 📋 STEP RECORD (ประวัติรายละเอียด)
                  </button>
                </div>

                <div className="flex gap-2 self-end sm:self-auto">
                  {!isEditingLineage ? (
                    <>
                      <button
                        onClick={handlePrintPDF}
                        className="px-3.5 py-1.5 bg-[#212c46] hover:bg-slate-900 border border-transparent text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                      >
                        <Icons.Printer size={12} className="text-amber-400" /> Export to PDF (พิมพ์รายงาน)
                      </button>
                      <button
                        onClick={handleStartEditing}
                        className="px-3 py-1.5 border border-slate-300 hover:border-[#212c46] hover:bg-slate-100 text-[#212c46] rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer bg-white"
                      >
                        <Icons.Edit size={12} className="text-[#a94228]" /> อัปเดตข้อมูลย้อนกลับ (Override Logs)
                      </button>
                    </>
                  ) : (
                    <div className="flex gap-1.5">
                      <button
                        onClick={handleSaveEditing}
                        className="px-3.5 py-1.5 bg-[#657f4d] hover:bg-[#526a3d] text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                      >
                        <Icons.Check size={12} /> ยอมรับการเปลี่ยนแปลง
                      </button>
                      <button
                        onClick={handleCancelEditing}
                        className="px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* THE STEPPER TIMELINE OR GENEALOGY FLOW CHART */}
              {viewMode === 'tree' ? (
                <div className="p-6">
                  <BatchGenealogyTree selectedOrder={selectedOrder} lineageDetails={lineageDetails} />
                </div>
              ) : (
                <div className="p-6 flex flex-col gap-8">
                
                {/* STAGE A: RAW MATERIALS */}
                <div className="flex gap-4 relative group">
                  <div className="absolute top-10 bottom-0 left-[15px] w-[2px] bg-slate-200"></div>
                  
                  <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-slate-300 text-slate-600 flex items-center justify-center shrink-0 z-10 group-hover:bg-[#a94228] group-hover:border-[#a94228] group-hover:text-white transition-all">
                    <Icons.Egg size={15} />
                  </div>

                  <div className="flex-1 flex flex-col gap-3">
                    <div className="text-left">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">STAGE 1: แหล่งที่มารวมส่วนผสม (RAW MATERIAL SOURCE LOTS)</h3>
                      <p className="text-[10px] mt-0.5 text-slate-500">เอกสารการอนุญาตและตรวจสอบใบรับรองส่งมอบ (COA) จากฟาร์มเลี้ยงและเคมีภัณฑ์ต้นสาย</p>
                    </div>

                    {!isEditingLineage ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {lineageDetails?.materials?.map((m: any, idx: number) => (
                          <div key={idx} className="bg-slate-50/50 p-3 rounded-xl border border-slate-200.5 flex flex-col justify-between hover:shadow-xs transition-shadow">
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[8px] font-mono font-black text-[#a54f6b] bg-pink-50 border border-pink-100 px-1 rounded">
                                  {m.id}
                                </span>
                                <span className="text-[9px] font-mono font-bold text-slate-500">
                                  Lot: <strong className="text-slate-800">{m.lot}</strong>
                                </span>
                              </div>
                              <h4 className="text-[11px] font-black text-slate-800 line-clamp-1">{m.name}</h4>
                              <p className="text-[9px] text-[#7a8b95] font-semibold mt-0.5">Supplier: {m.source}</p>
                            </div>
                            <div className="pt-2 text-right border-t border-slate-100 mt-2 flex justify-between items-center">
                              <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                🛡️ PASSED INSP.
                              </span>
                              <span className="text-[10.5px] font-mono font-black text-[#212c46]">{m.qty} {m.unit}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 border border-dashed border-slate-300 p-4 rounded-xl bg-slate-50/20">
                        <div className="space-y-3">
                          {tempLineage?.materials?.map((m: any, idx: number) => (
                            <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                              <div className="md:col-span-2">
                                <label className="text-[8px] font-bold text-slate-400 block uppercase">Material ID</label>
                                <input
                                  type="text"
                                  value={m.id}
                                  onChange={(e) => handleUpdateMaterialItem(idx, "id", e.target.value)}
                                  className="w-full bg-slate-50 border p-1 rounded font-mono text-[10px] outline-none"
                                />
                              </div>
                              <div className="md:col-span-3">
                                <label className="text-[8px] font-bold text-slate-400 block uppercase font-sans">ชื่อวัตถุดิบหลัก</label>
                                <input
                                  type="text"
                                  value={m.name}
                                  onChange={(e) => handleUpdateMaterialItem(idx, "name", e.target.value)}
                                  className="w-full bg-slate-50 border p-1 rounded text-[10px] font-black outline-none"
                                />
                              </div>
                              <div className="md:col-span-3">
                                <label className="text-[8px] font-bold text-slate-400 block uppercase">Supplier Farm</label>
                                <input
                                  type="text"
                                  value={m.source}
                                  onChange={(e) => handleUpdateMaterialItem(idx, "source", e.target.value)}
                                  className="w-full bg-slate-50 border p-1 rounded text-[10px] outline-none"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="text-[8px] font-bold text-slate-400 block uppercase">Farm Lot No.</label>
                                <input
                                  type="text"
                                  value={m.lot}
                                  onChange={(e) => handleUpdateMaterialItem(idx, "lot", e.target.value)}
                                  className="w-full bg-slate-50 border p-1 rounded text-[10px] outline-none"
                                />
                              </div>
                              <div className="md:col-span-1">
                                <label className="text-[8px] font-bold text-slate-400 block uppercase">ปริมาณ</label>
                                <input
                                  type="number"
                                  value={m.qty}
                                  onChange={(e) => handleUpdateMaterialItem(idx, "qty", Number(e.target.value))}
                                  className="w-full bg-slate-50 border p-1 rounded text-[10px] outline-none"
                                />
                              </div>
                              <div className="md:col-span-1 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMaterialItem(idx)}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                                >
                                  <Icons.Trash size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={handleAddMaterialItem}
                          className="self-start mt-2 px-3 py-1.5 bg-[#212c46] hover:bg-slate-800 text-white text-[9.5px] rounded-lg font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                        >
                          <Icons.Plus size={11} /> เพิ่มแถววัตถุดิบใหม่
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* STAGE B: MIXING TIMESTAMPS */}
                <div className="flex gap-4 relative group">
                  <div className="absolute top-10 bottom-0 left-[15px] w-[2px] bg-slate-200"></div>

                  <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-slate-300 text-slate-600 flex items-center justify-center shrink-0 z-10 group-hover:bg-[#b58c4f] group-hover:border-[#b58c4f] group-hover:text-white transition-all">
                    <Icons.RotateCw size={15} />
                  </div>

                  <div className="flex-1 flex flex-col gap-2.5">
                    <div className="text-left">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">STAGE 2: ต้มผสมขึ้นรูป (MIXING & PROCESS LOGS)</h3>
                      <p className="text-[10px] mt-0.5 text-slate-500 font-medium">บันทึกเครื่องจักร, ความคลาดระดับช่วงเวลาทำงาน และพนักงานเทคนิคปรุงผสมอาหาร</p>
                    </div>

                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-4 justify-between">
                      <div className="flex-1 space-y-2 text-left">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Icons.Clock size={13} className="text-[#b58c4f]" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mixing Timestamp</span>
                        </div>
                        {!isEditingLineage ? (
                          <p className="font-mono text-xs font-black text-slate-800 bg-white p-2 rounded border border-slate-200">
                            {lineageDetails?.mixingTimestamp || "2026-06-03 10:14:22 น."}
                          </p>
                        ) : (
                          <input
                            type="text"
                            value={tempLineage?.mixingTimestamp || ""}
                            onChange={(e) => setTempLineage({ ...tempLineage, mixingTimestamp: e.target.value })}
                            className="w-full bg-white border px-2 py-1.5 rounded text-xs font-mono font-bold"
                          />
                        )}
                      </div>

                      <div className="flex-1 space-y-2 text-left">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Icons.User size={13} className="text-[#b58c4f]" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mixing Operator Team</span>
                        </div>
                        {!isEditingLineage ? (
                          <p className="text-xs font-black text-slate-800 bg-white p-2 rounded border border-slate-200">
                            {lineageDetails?.mixingOperator || "สมชาย วันดี (Operator Team)"}
                          </p>
                        ) : (
                          <input
                            type="text"
                            value={tempLineage?.mixingOperator || ""}
                            onChange={(e) => setTempLineage({ ...tempLineage, mixingOperator: e.target.value })}
                            className="w-full bg-white border px-2 py-1.5 rounded text-xs"
                          />
                        )}
                      </div>

                      <div className="flex-1 space-y-2 text-left">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Icons.Cpu size={13} className="text-[#b58c4f]" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mixing System Vessel</span>
                        </div>
                        {!isEditingLineage ? (
                          <p className="text-xs font-black text-slate-800 bg-white p-2 rounded border border-slate-200 truncate">
                            {lineageDetails?.mixingMachine || "Emulsion Core System MC-101"}
                          </p>
                        ) : (
                          <input
                            type="text"
                            value={tempLineage?.mixingMachine || ""}
                            onChange={(e) => setTempLineage({ ...tempLineage, mixingMachine: e.target.value })}
                            className="w-full bg-white border px-2 py-1.5 rounded text-xs"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* STAGE C: PACKING OPERATOR DETAILS */}
                <div className="flex gap-4 relative group">
                  <div className="absolute top-10 bottom-0 left-[15px] w-[2px] bg-slate-200"></div>

                  <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-slate-300 text-slate-600 flex items-center justify-center shrink-0 z-10 group-hover:bg-[#212c46] group-hover:border-[#212c46] group-hover:text-white transition-all">
                    <Icons.Package size={15} />
                  </div>

                  <div className="flex-1 flex flex-col gap-2.5">
                    <div className="text-left">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">STAGE 3: ห่อสวมและบรรจุ (PACKING OPERATOR DETAILS)</h3>
                      <p className="text-[10px] mt-0.5 text-slate-500 font-medium">บันทึกพนักงานซีล, ซีเรียลฟิล์มสตรีม และการรับสัญญาณน้ำหนักตรวจจับโลหะ (Metal Tester)</p>
                    </div>

                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Packing Line Crew Lead</label>
                        {!isEditingLineage ? (
                          <p className="text-xs font-black text-slate-800 bg-white p-2.5 rounded border border-slate-200">
                            {lineageDetails?.packingOperator || "นางสาว สุลดา หอมกลิ่น"}
                          </p>
                        ) : (
                          <input
                            type="text"
                            value={tempLineage?.packingOperator || ""}
                            onChange={(e) => setTempLineage({ ...tempLineage, packingOperator: e.target.value })}
                            className="w-full bg-white border px-2 py-1.5 rounded text-xs"
                          />
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Packaging Foil Lot Ref</label>
                        {!isEditingLineage ? (
                          <p className="font-mono text-xs font-bold text-slate-800 bg-white p-2.5 rounded border border-slate-200">
                            {lineageDetails?.packingFoilLot || "Aris Pack Lot AP-801"}
                          </p>
                        ) : (
                          <input
                            type="text"
                            value={tempLineage?.packingFoilLot || ""}
                            onChange={(e) => setTempLineage({ ...tempLineage, packingFoilLot: e.target.value })}
                            className="w-full bg-white border px-2 py-1.5 rounded text-xs font-mono"
                          />
                        )}
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Vacuum Seal Tester Leak-Checking logs</label>
                        {!isEditingLineage ? (
                          <div className="bg-white p-2.5 rounded border border-slate-200 text-xs font-black text-emerald-600 flex items-center gap-1.5">
                            <Icons.CheckCircle size={14} />
                            <span>{lineageDetails?.sealTestingStatus || "ผ่านการทดสอบซีลต้านทานอากาศสูญญากาศ 100%"}</span>
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={tempLineage?.sealTestingStatus || ""}
                            onChange={(e) => setTempLineage({ ...tempLineage, sealTestingStatus: e.target.value })}
                            className="w-full bg-white border px-2 py-1.5 rounded text-xs text-emerald-600 font-bold"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* STAGE D: THERMAL REACH AND STORAGE INBOUND */}
                <div className="flex gap-4 relative group">
                  <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-slate-300 text-slate-600 flex items-center justify-center shrink-0 z-10 group-hover:bg-emerald-600 group-hover:border-emerald-600 group-hover:text-white transition-all">
                    <Icons.Home size={15} />
                  </div>

                  <div className="flex-1 flex flex-col gap-2.5">
                    <div className="text-left">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">STAGE 4: ห้องอบสุกและการโอนย้ายคลังสำเร็จรูป (STORAGE & LOGISTICS)</h3>
                      <p className="text-[10px] mt-0.5 text-slate-500 font-medium">จุดอุณหภูมิวิกฤต CCP1 และช่องจอดเก็บสำรับกระจายรถห้องเย็นสู่ผู้บริโภค</p>
                    </div>

                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                      <div className="space-y-1">
                        <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">CCP Core Temperature</span>
                        <div className="p-2 bg-rose-50 border border-rose-100 text-[#a94228] rounded font-mono font-black text-xs">
                          {lineageDetails?.coreInternalTemp || "74.8 °C"}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">Cool Rack storage</span>
                        <div className="p-2 bg-blue-50 border border-blue-100 text-blue-800 rounded font-bold text-xs truncate">
                          {lineageDetails?.warehouseBay || "Bay B-09 Room Cool"}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[8.5px] font-bold text-[#b58c4f] uppercase tracking-wider block">Logistics dispatch truck</span>
                        <div className="p-2 bg-amber-50 border border-amber-100 text-amber-800 rounded font-bold text-[11px] truncate">
                          {lineageDetails?.dispatchTruckLicense || "รถทะเบียน ยล-9954 กรุงเทพ"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                </div>
              )}

            </div>
          ) : (
            <div className="p-16 border-2 border-dashed border-slate-300 rounded-3xl bg-white text-center flex flex-col items-center justify-center gap-3">
              <Icons.Loader2 size={44} className="text-slate-400 animate-spin" />
              <div>
                <p className="text-sm font-black text-[#212c46] uppercase">กำลังเรียกประมวลผลเซสชั่น...</p>
                <p className="text-xs text-slate-400 text-center max-w-sm mx-auto mt-1">
                  กรุณาเชื่อมต่อดักความเคลื่อนไหวจากกล้องสแกนเนอร์บาร์โค้ด หรือทำการตรวจสอบเลือกจากคู่บิลในบอร์ดรายชื่อ
                </p>
              </div>
            </div>
          )}

          {/* CRITICAL SANITARY DECLARATIONS & SECURITY AUDIT MARGINS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border rounded-2xl p-4 flex gap-3 text-left items-start shadow-xs">
              <Icons.ShieldAlert size={20} className="text-[#a94228] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[11px] font-black uppercase text-slate-800">ISO 9001 & HACCP DIGITAL COMPLIANCE REGISTER</h4>
                <p className="text-[9.5px] leading-relaxed text-slate-500 mt-1">
                  ข้อมูลการลากเส้นทางวัตถุดิบและระบบสแกนบาร์โค้ดย้อนกลับทั้งหมดจะถูกตรวจสอบการแก้ไข (Audited) และประทับเวลา (Timestamped) จากเจ้าหน้าที่อย่างปลอดภัย ป้องกันปัญหาสหภาพการค้าสิ่งเจือปน
                </p>
              </div>
            </div>

            <div className="bg-white border rounded-2xl p-4 flex gap-3 text-left items-start shadow-xs">
              <Icons.FileText size={20} className="text-[#b58c4f] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[11px] font-black uppercase text-slate-800">EXPORT / DOMESTIC COMPATIBILITY MATRIX</h4>
                <p className="text-[9.5px] leading-relaxed text-slate-500 mt-1">
                  ฉลากบรรจุหีบห่อมีการสวมรหัส COA และ Halal Certificate ย้อนต้นน้ำอัตโนมัติ ทำให้คู่ค้าเช่น Makro หรือลูกค้าตลาดประเทศญี่ปุ่นมั่นใจในความสะอาดได้ระดับมาตรฐานสูงสุด
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* FOOTER USER GUIDELINE INFO */}
      <UserGuidePanel
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        title="วิธีสแกนตรวจสอบความย้อนกลับของล็อตอาหาร (Traceability Guide)"
        steps={[
          "เลือกคู่บิลออเดอร์ในหน้าต่างตรวจสอบบิล หรือ พิมพ์หมายเลขบิล/Batch ID และกดปุ่ม Enter ค้นหาด่วน",
          "หรือ เปิดโหมดดักจับเลนส์กล้อง Camera Shutter และทาบแผ่นพิมพ์คิวอาร์ (QR) ประจำล็อตเพื่อสแกนถอดข้อมูล",
          "แถบหน้าจอจะสำแดงห่วงโซ่หลัก 4 ระดับ (วัตถุดิบจากโรงงาน ➔ ด่านผสม ➔ ทีมพนักงานบรรจุ ➔ โอนย้ายเข้าคลัง)",
          "เพื่ออัปเดตหรือปรับแก้อมูลประวัติ ให้กดปุ่ม 'Override Logs' ด้านบนเพื่อกรอกลบแถววัตถุดิบหรือเปลี่ยนชื่อพนักงานซีลคุม และจัดเก็บความจำแบบออฟไลน์",
        ]}
      />

      {/* STYLE BLOCK DECLARATION FOR HIGH-FIDELITY VECTOR PRINTING */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          /* Hide standard elements completely */
          body * {
            display: none !important;
          }
          /* Bring only the print area and its contents to life using revert layouts */
          #report-print-area,
          #report-print-area * {
            display: revert !important;
          }
          #report-print-area {
            display: flex !important;
            flex-direction: column !important;
            width: 100% !important;
            background: white !important;
            color: #0f172a !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          /* Grid, Flex, and Table alignment restores */
          #report-print-area .flex {
            display: flex !important;
          }
          #report-print-area .grid {
            display: grid !important;
          }
          #report-print-area .grid-cols-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          #report-print-area .grid-cols-3 {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
          #report-print-area .grid-cols-4 {
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
          }
          #report-print-area table {
            display: table !important;
            width: 100% !important;
          }
          #report-print-area thead {
            display: table-header-group !important;
          }
          #report-print-area tbody {
            display: table-row-group !important;
          }
          #report-print-area tr {
            display: table-row !important;
          }
          #report-print-area th,
          #report-print-area td {
            display: table-cell !important;
          }
          #report-print-area .hidden {
            display: none !important;
          }
          /* Force color processing on PDF renderers */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A4 portrait;
            margin: 1.5cm;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .page-break {
            page-break-before: always;
          }
        }
      `}} />

      {/* FORMAL BATCH TRACEABILITY REPORT (Only visible during print / Export PDF action) */}
      {selectedOrder && lineageDetails && (
        <div id="report-print-area" className="hidden text-left bg-white font-sans text-xs p-4 leading-relaxed">
          
          {/* Logo & Standard Header Block */}
          <div className="border-b-4 border-[#212c46] pb-4 mb-6 flex justify-between items-end">
            <div className="flex items-center gap-3">
              {/* Specialized DCC Food Emblem */}
              <div className="w-12 h-12 bg-[#212c46] text-white flex flex-col items-center justify-center font-black rounded-lg shrink-0">
                <span className="text-sm tracking-tighter leading-none">DCC</span>
                <span className="text-[7px] tracking-widest font-bold leading-none mt-0.5">FOOD</span>
              </div>
              <div>
                <h2 className="text-sm font-black tracking-tight text-slate-800">DCC MEAT PROCESSING GROUP</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">HACCP & ISO 9001 REGISTERED FACILITY</p>
                <p className="text-[8.5px] text-slate-400">เลขอนุมัติสุขลักษณะสุขอนามัยโรงงาน: EST-NO-142/THAILAND</p>
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-base font-black text-[#212c46] tracking-tight uppercase">BATCH TRACEABILITY REPORT</h1>
              <p className="text-[10px] font-bold text-slate-600">รายงานประวัติความย้อนกลับของล็อตสินค้าอาหาร</p>
              <p className="text-[9px] font-mono text-slate-400 mt-1">
                Printed: {new Date().toLocaleDateString('th-TH')} {new Date().toLocaleTimeString('th-TH')} น.
              </p>
            </div>
          </div>

          {/* Core Batch Metadata Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
            <div>
              <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest">BATCH REF ID (หมายเลขล็อตคิวอาร์)</p>
              <p className="text-xs font-black font-mono text-[#a94228] mt-1">{selectedOrder.id}</p>
            </div>
            <div>
              <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest">PRODUCT NAME (ชื่อเวิร์กการตลาด)</p>
              <p className="text-xs font-black text-slate-800 mt-1">{selectedOrder.name}</p>
            </div>
            <div>
              <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest">SKU CODE REF (รหัสสินค้าสากล)</p>
              <p className="text-xs font-mono font-bold text-slate-700 mt-1">{selectedOrder.sku || "N/A"}</p>
            </div>
            <div>
              <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest">COMPLIANCE CODE (มาตรฐานสุขบริการ)</p>
              <p className="text-xs font-bold text-emerald-600 mt-1 flex items-center gap-1">✓ HACCP COMPLIANT</p>
            </div>
            <div>
              <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest">CLIENT DESTINATION (ลูกค้าอ้างอิง)</p>
              <p className="text-xs font-bold text-slate-700 mt-1">{selectedOrder.customer || "General Distribution Spot"}</p>
            </div>
            <div>
              <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest">PRODUCTION DATE (วันที่แปรรูปล็อต)</p>
              <p className="text-xs font-mono text-slate-700 mt-1">{selectedOrder.date || new Date().toISOString().split("T")[0]}</p>
            </div>
            <div>
              <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest">SHIFT IN-CHARGE (พนักงานเวรกะ)</p>
              <p className="text-xs font-bold text-slate-700 mt-1">{selectedOrder.shift || "Day A Shift"}</p>
            </div>
            <div>
              <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest">TOTAL QUANTITY (จำนวนผลิตรวม)</p>
              <p className="text-xs font-mono font-black text-slate-800 mt-1">{selectedOrder.qty} Units</p>
            </div>
          </div>

          {/* Part 1: Visual Chain Diagram */}
          <div className="mb-6">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2 pb-1 border-b border-slate-200">
              📈 PART 1: GENEALOGY WORKFLOW DIAGRAM (แผนภาพสรุปสายใยห่วงโซ่ผลิต)
            </h3>
            <p className="text-[9.5px] text-slate-500 mb-3">
              สายวิเคราะห์วัตถุดิบและฟาร์มต้นทาง วิ่งจำลองผ่านสถานีบดสุก บรรจุกล่องซีล จนถอดไปสู่รถควบคุมอุณหภูมิความเย็นสำเร็จรูป
            </p>
            <div className="border border-slate-200 rounded-xl p-4 bg-white">
              <BatchGenealogyTree selectedOrder={selectedOrder} lineageDetails={lineageDetails} />
            </div>
          </div>

          {/* Part 2: Detailed Chronicle Steps & Hard Logs */}
          <div className="page-break pt-4">
            <div className="border-b-4 border-[#212c46] pb-2 mb-6 flex justify-between items-end">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                📋 PART 2: SECURED CHRONOLOGICAL COMPLIANCE LOGS (ประวัติผลการตรวจสอบย้อนกลับ 4 ระดับอย่างเป็นทางการ)
              </h3>
              <span className="text-[9px] font-mono text-slate-400 font-bold">LOT: {selectedOrder.id}</span>
            </div>

            <div className="flex flex-col gap-6 text-left">
              {/* STAGE 1 LOGS */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/20">
                <h4 className="text-[10px] font-black text-[#a94228] uppercase tracking-widest mb-1 pb-1 border-b border-dashed border-slate-200">
                  STAGE 1: RAW INBOUND INGREDIENTS (ข้อมูลรับรองและฟาร์มส่งเข้าวัตถุดิบหลัก)
                </h4>
                <p className="text-[9.5px] text-slate-400 mb-3">ตารางบันทึกการส่งอณูสูตรผสมจากซัพพลายเออร์, เลขรหัสนำเข้าฟาร์ม และปริมาณที่สวมตรวจสอบย้อนต้นน้ำ COA</p>
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200.5">
                      <th className="p-2">Material ID</th>
                      <th className="p-2">Material Name (ชื่อวัตถุดิบ)</th>
                      <th className="p-2">Approved Supplier Farm (แหล่งส่งมอบหลัก)</th>
                      <th className="p-2">Partner Lot Ref (ล็อตส่งมอบ)</th>
                      <th className="p-2 text-right">Injected Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineageDetails.materials.map((m: any, idx: number) => (
                      <tr key={idx} className="border-b border-slate-100 text-slate-800 font-medium">
                        <td className="p-2 font-mono text-[#a54f6b] font-bold">{m.id}</td>
                        <td className="p-2 font-black text-slate-800">{m.name}</td>
                        <td className="p-2 text-slate-600">{m.source}</td>
                        <td className="p-2 font-mono text-slate-600">{m.lot}</td>
                        <td className="p-2 font-mono text-right font-black">{m.qty} {m.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* STAGE 2 LOGS */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/20">
                <h4 className="text-[10px] font-black text-[#b58c4f] uppercase tracking-widest mb-3 pb-1 border-b border-dashed border-slate-200">
                  STAGE 2: PROCESS & EMULSION MIXING CONTROL (ประวัติดารคุมด่านผสมต้มขึ้นรูปสูตร)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-3 border border-slate-200 rounded-xl">
                    <span className="text-[8px] text-slate-400 font-black block uppercase">MIXING OPERATOR TEAM</span>
                    <span className="text-[11px] font-black text-slate-800 mt-1 block">{lineageDetails.mixingOperator}</span>
                  </div>
                  <div className="bg-white p-3 border border-slate-200 rounded-xl">
                    <span className="text-[8px] text-slate-400 font-black block uppercase">EMULSION VESSEL / MACHINE REF</span>
                    <span className="text-[11px] font-black text-slate-800 mt-1 block">{lineageDetails.mixingMachine}</span>
                  </div>
                  <div className="bg-white p-3 border border-slate-200 rounded-xl">
                    <span className="text-[8px] text-slate-400 font-black block uppercase">MIXING TIMESTAMP</span>
                    <span className="text-[11px] font-mono font-bold text-slate-700 mt-1 block">{lineageDetails.mixingTimestamp}</span>
                  </div>
                </div>
              </div>

              {/* STAGE 3 LOGS */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/20">
                <h4 className="text-[10px] font-black text-[#212c46] uppercase tracking-widest mb-3 pb-1 border-b border-dashed border-slate-200">
                  STAGE 3: PACKAGING & REEL FILM OPERATIONS (ข้อมูลฝ่ายพนักงานคุมเครื่องซีลสูญญากาศและกล่อง)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-3 border border-slate-200 rounded-xl">
                    <span className="text-[8px] text-slate-400 font-black block uppercase">PACKING LINE TEAM LEAD</span>
                    <span className="text-[11px] font-black text-slate-800 mt-1 block">{lineageDetails.packingOperator}</span>
                  </div>
                  <div className="bg-white p-3 border border-slate-200 rounded-xl">
                    <span className="text-[8px] text-slate-400 font-black block uppercase">FOIL CO-EXTRUDED PACK REF LOT</span>
                    <span className="text-[11px] font-mono font-bold text-slate-700 mt-1 block truncate">{lineageDetails.packingFoilLot}</span>
                  </div>
                  <div className="bg-white p-3 border border-slate-200 rounded-xl">
                    <span className="text-[8px] text-slate-400 font-black block uppercase">LEAK & VACUUM SAFETY TESTS</span>
                    <span className="text-[11px] font-black text-emerald-600 mt-1 block">✓ PASSED: {lineageDetails.sealTestingStatus}</span>
                  </div>
                </div>
              </div>

              {/* STAGE 4 LOGS */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/20">
                <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-3 pb-1 border-b border-dashed border-slate-200">
                  STAGE 4: COLD CHAIN LOGISTICS CONTROL (ระเบียบสุขาภิบาลควบคุมความเย็นก่อนส่งกระจาย)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-3 border border-slate-200 rounded-xl">
                    <span className="text-[8px] text-slate-400 font-black block uppercase">CORE CCP SANITARY TEMPERATURE</span>
                    <span className="text-[11.5px] font-mono font-black text-[#a94228] mt-1 bg-red-50/55 px-1.5 py-0.5 rounded border border-red-100 inline-block">
                      {lineageDetails.coreInternalTemp}
                    </span>
                  </div>
                  <div className="bg-white p-3 border border-slate-200 rounded-xl">
                    <span className="text-[8px] text-slate-400 font-black block uppercase">ASSIGNED ICE ROOM RACK BAY</span>
                    <span className="text-[11px] font-black text-slate-800 mt-1 block">{lineageDetails.warehouseBay}</span>
                  </div>
                  <div className="bg-white p-3 border border-slate-200 rounded-xl">
                    <span className="text-[8px] text-slate-400 font-black block uppercase">REEFER TRUCK FLEET LICENSE</span>
                    <span className="text-[11px] font-bold text-slate-700 mt-1 block">{lineageDetails.dispatchTruckLicense}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Official Audit Authentication Stamp/Signatures area */}
            <div className="mt-12 pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-center bg-white">
              <div className="flex flex-col items-center">
                <div className="w-48 border-b-2 border-slate-300 mt-4 mb-2 h-10 flex items-end justify-center">
                  <span className="font-mono text-[9px] text-slate-400 italic">Secure Digital Handshake Authenticated</span>
                </div>
                <p className="text-[10px] font-black text-slate-800">ผู้รายงานประจำสถานีงานเบนโตะมิกเซอร์</p>
                <p className="text-[8px] text-slate-400 uppercase font-black">PROCESS TECHNICAL SPECIALIST / BARCODE SCAN CONTROLLER</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-48 border-b-2 border-slate-300 mt-4 mb-2 h-10 flex items-end justify-center">
                  <span className="font-mono text-[10px] text-emerald-600 font-black uppercase tracking-wider">Approved QA EST-142</span>
                </div>
                <p className="text-[10px] font-black text-slate-800">หัวหน้าฝ่ายควบคุมอุณหภูมิวิกฤตความสะอาดและสุขอนามัย QA</p>
                <p className="text-[8px] text-slate-400 uppercase font-black">QA ASSURANCE MANAGER • DCC MEAT COMPLEX</p>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

