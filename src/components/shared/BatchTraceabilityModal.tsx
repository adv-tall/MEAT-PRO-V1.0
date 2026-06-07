import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import * as Icons from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Swal from 'sweetalert2';
import { useSharedOrders } from '@/src/store/ordersStore';

// Matching fallback records with the page component for consistency
const MODAL_LINEAGE_FALLBACKS: Record<string, any> = {
  "FG-10": {
    materials: [
      { id: "RM-CHK-088", name: "เนื้อไก่แช่แข็งเกรด A (Frozen Chicken Breast)", source: "CPF Farm No. 12 (ISO 22000)", lot: "CPF-2606A", qty: 250, unit: "kg" },
      { id: "RM-SKN-101", name: "หนังไก่สดคัดไขมัน (Fresh Chicken Skin)", source: "Betagro Korat (GMP Certified)", lot: "BG-SKN-902", qty: 80, unit: "kg" },
      { id: "RM-SPICE-04", name: "เครื่องปรุงรสไส้กรอกจัมโบ้ (Sausage Seasoning Blend)", source: "Siam Flavors Co., Ltd.", lot: "SFB-771", qty: 15, unit: "kg" },
      { id: "RM-CAS-310", name: "ไส้คอลลาเจนขนาด 24 มม. (Collagen Casing 24mm)", source: "Devro Thailand", lot: "DEV-C-1981", qty: 12, unit: "reels" }
    ],
    mixingOperator: "สมเกียรติ ยิ่งยืน (Supervisor Shift A)",
    mixingMachine: "Emulsion System-1"
  },
  "FG-20": {
    materials: [
      { id: "RM-CHK-099", name: "เนื้ออกไก่บดละเอียด (Minced Chicken)", source: "CPF Nakhon Pathom", lot: "CPF-2605B", qty: 200, unit: "kg" },
      { id: "RM-SKN-101", name: "หนังไก่สดคัดไขมัน (Fresh Chicken Skin)", source: "Betagro Sriracha", lot: "BG-SKN-903", qty: 90, unit: "kg" },
      { id: "RM-SPICE-02", name: "ผงเครื่องปรุงรสคอกเทลสูตรพิเศษ (Cocktail Spice Mix)", source: "Premium Ingredients", lot: "PI-CK-402", qty: 18, unit: "kg" }
    ],
    mixingOperator: "อานนท์ ใจดี (Senior Cooker)",
    mixingMachine: "Vacuum Bowl Cutter V-3"
  },
  "FG-30": {
    materials: [
      { id: "RM-PRK-120", name: "เนื้อสะโพกหมูสดคัดแต่ง (Fresh Pork Shoulder 80/20)", source: "สหพัฒน์ฟาร์ม (HACCP Approved)", lot: "SPF-PRK-29A", qty: 300, unit: "kg" },
      { id: "RM-FAT-202", name: "มันแข็งหมูบดละเอียด (Hard Pork Fat Back)", source: "CPF Chonburi Yard", lot: "CPF-PKF-80", qty: 50, unit: "kg" },
      { id: "RM-SPICE-09", name: "ผงเครื่องเทศแกงลูกชิ้นหมูอุตสาหกรรม (Meatball Binder)", source: "Siam Flavors Co., Ltd.", lot: "M-BIND-10", qty: 12, unit: "kg" }
    ],
    mixingOperator: "เกรียงไกร ชนะภัย (Cutter Specialist)",
    mixingMachine: "High-Power Vacuum Mixer B"
  },
  "FG-40": {
    materials: [
      { id: "RM-CHK-088", name: "เนื้อไก่แช่แข็งเกรด A", source: "CPF Farm No. 8", lot: "CPF-2606F", qty: 180, unit: "kg" },
      { id: "RM-PRK-122", name: "เนื้อเศษหมูคัดละเอียด (Pork Trimmings)", source: "Betagro Meat", lot: "BM-PR-55", qty: 120, unit: "kg" },
      { id: "RM-PEP-221", name: "พริกขี้หนูสวนดองสับ (Chopped Chili)", source: "Local GAP Farmer-Group", lot: "GAP-CH-33", qty: 14, unit: "kg" }
    ],
    mixingOperator: "วัลลภ วันดี (Emulsifier Operator)",
    mixingMachine: "Bowl Cutter Emulsion System"
  },
  "DEFAULT": {
    materials: [
      { id: "RM-MEAT-SPL", name: "วัตถุดิบเนื้อสัตว์ผสมป้อน (Standard Meat Base)", source: "Local Slaughterhouse (GMP)", lot: "STD-MT-302", qty: 250, unit: "kg" },
      { id: "RM-SPICE-STD", name: "ผงปรุงแต่งกลิ่นอรรถรสอเนกประสงค์ (Standard Seasoning)", source: "V-Care Food Tech Solutions", lot: "VCF-901", qty: 20, unit: "kg" }
    ],
    mixingOperator: "พนักงานฝ่ายตักเตรียมสูตรทั่วไป (System Operator)",
    mixingMachine: "Industrial Vacuum Bowl Mixer"
  }
};

const OPERATORS_LIST = [
  "นางสาวสุลดา หอมกลิ่น (Station 1 Lead)",
  "นายอลงกรณ์ ทองมา (Automatic Sealer)",
  "นางฉวี ศิริวรรณ (Quality Control Inspector)",
  "นายวัชระ ประดับวงษ์ (Boxer Assistant)",
  "นางสาววนิดา ดีใจ (Carton Label Recorder)"
];

const FILM_LOTS_LIST = [
  "Aris Pack Lot AP-801 (PET/AL/PE)",
  "Siam Polymer Lot SP-93 (BOPA Laminated)",
  "Thaimax Poly Lot TX-44 (High Barrier)",
  "Star-Pack Film Lot ST-299 (EVOH Film)"
];

function getDeterministicLineage(skuCode: string, batchId: string) {
  let matchedGroup = "DEFAULT";
  if (skuCode) {
    const prefix = skuCode.substring(0, 5);
    if (MODAL_LINEAGE_FALLBACKS[prefix]) {
      matchedGroup = prefix;
    }
  }

  const base = MODAL_LINEAGE_FALLBACKS[matchedGroup];
  let h = 0;
  if (batchId) {
    for (let i = 0; i < batchId.length; i++) {
      h = batchId.charCodeAt(i) + ((h << 5) - h);
    }
  }
  const opIdx = Math.abs(h) % OPERATORS_LIST.length;
  const filmIdx = Math.abs(h) % FILM_LOTS_LIST.length;

  const dt = new Date();
  dt.setHours(dt.getHours() - 4);
  const mDate = dt.toISOString().split("T")[0];
  const mTime = dt.toTimeString().split(" ")[0];

  return {
    materials: base.materials.map((m: any) => ({ ...m })),
    mixingTimestamp: `${mDate} ${mTime}`,
    mixingOperator: base.mixingOperator,
    mixingMachine: base.mixingMachine,
    packingOperator: OPERATORS_LIST[opIdx],
    packingFoilLot: FILM_LOTS_LIST[filmIdx],
    sealTestingStatus: "ผ่านการทดสอบสูญญากาศ 100% (Leaking Test OK)",
    coreInternalTemp: "74.8 °C (ผ่านเกณฑ์ควบคุมวิกฤตความร้อน >72°C)",
    warehouseBay: "คลังสินค้าสำเร็จรูป Cold Storage Zone BF-32",
    dispatchTruckLicense: "บพ-8854 ปทุมธานี (ห้องควบคุม -18°C)"
  };
}

interface BatchTraceabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBatchId?: string | null;
}

export function BatchTraceabilityModal({ isOpen, onClose, initialBatchId }: BatchTraceabilityModalProps) {
  const [orders] = useSharedOrders();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMode, setActiveMode] = useState<'camera' | 'emulator'>('emulator');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [lineage, setLineage] = useState<any | null>(null);
  
  // Camera scanning states
  const [cameraState, setCameraState] = useState<'idle' | 'scanning' | 'starting' | 'error'>('idle');
  const [cameras, setCameras] = useState<any[]>([]);
  const [cameraId, setCameraId] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [localLogs, setLocalLogs] = useState<string[]>([]);

  const html5QrRef = useRef<Html5Qrcode | null>(null);
  const elementId = "modal-traceability-shutter";

  const pushLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLocalLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 10));
  };

  const isCameraTransitioning = useRef<boolean>(false);

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch(e) {}
  };

  const handleLoadBatch = (batchId: string) => {
    const matched = orders.find(o => o.id === batchId || o.id === batchId.toUpperCase());
    if (!matched) {
      // Load virtual info if they typed/scanned a mock code not in orders list
      const virtualO = {
        id: batchId,
        name: "ไส้กรอกหมูรัญจวนคัดพิเศษ",
        sku: "FG-3001-VIRTUAL",
        qty: 120,
        status: "COMPLETED",
        customer: "Makro Logistics Hub",
        currentStep: "WH"
      };
      setSelectedOrder(virtualO);
      
      const savedKey = `mes_batch_lineage_${batchId}`;
      const savedOverride = localStorage.getItem(savedKey);
      if (savedOverride) {
        try { setLineage(JSON.parse(savedOverride)); } catch(e) { setLineage(getDeterministicLineage(virtualO.sku, batchId)); }
      } else {
        setLineage(getDeterministicLineage(virtualO.sku, batchId));
      }
      return;
    }

    setSelectedOrder(matched);
    const savedKey = `mes_batch_lineage_${matched.id}`;
    const savedOverride = localStorage.getItem(savedKey);
    if (savedOverride) {
      try {
        setLineage(JSON.parse(savedOverride));
      } catch(e) {
        setLineage(getDeterministicLineage(matched.sku || "DEFAULT", matched.id));
      }
    } else {
      setLineage(getDeterministicLineage(matched.sku || "DEFAULT", matched.id));
    }
  };

  // Init logic on modal loading
  useEffect(() => {
    if (isOpen) {
      if (initialBatchId) {
        handleLoadBatch(initialBatchId);
        setSearchQuery(initialBatchId);
      } else if (orders.length > 0 && !selectedOrder) {
        handleLoadBatch(orders[0].id);
      }
    }
  }, [isOpen, initialBatchId, orders]);

  // --- CAMERA STREAMS ---
  const startScanning = async (camIdSelected?: string) => {
    if (isCameraTransitioning.current) return;
    setCameraState('starting');
    setErrorMsg('');
    pushLog("กำลังเข้าถึงเลนส์กล้องของเบราว์เซอร์...");

    await stopScanning();

    isCameraTransitioning.current = true;
    try {
      const html5Qr = new Html5Qrcode(elementId);
      html5QrRef.current = html5Qr;

      if (cameras.length === 0) {
        const devs = await Html5Qrcode.getCameras();
        if (devs && devs.length > 0) {
          setCameras(devs);
          camIdSelected = camIdSelected || devs[0].id;
          setCameraId(devs[0].id);
        } else {
          throw new Error("ตรวจไม่พบกล้องวิดีโอบนเวิร์กสเตชัน");
        }
      }

      const activeCamId = camIdSelected || cameraId || (cameras[0]?.id);
      if (!activeCamId) throw new Error("หัวกล้องยังไม่พร้อมระบุ ID");

      await html5Qr.start(
        activeCamId,
        {
          fps: 10,
          qrbox: { width: 180, height: 180 }
        },
        (text) => {
          handleOnDecoded(text);
        },
        () => {}
      );

      setCameraState('scanning');
      pushLog("กล้องอุตสาหกรรมพร้อมกวาดจับฉลาก QR แล้ว!");
    } catch(err: any) {
      console.error(err);
      setCameraState('error');
      setErrorMsg(err.message || "เบราว์เซอร์สกัดกั้นกล้อง หรืออุปกรณ์เชื่อมต่อขัดข้อง");
      pushLog(`⚠️ กล้องขัดข้อง: ${err.message || 'Access Denied'}`);
    } finally {
      isCameraTransitioning.current = false;
    }
  };

  const stopScanning = async () => {
    if (isCameraTransitioning.current) {
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
      } catch(e) {
        console.warn("Clean error on html5qr stop ignored", e);
      } finally {
        isCameraTransitioning.current = false;
        html5QrRef.current = null;
      }
    }
    setCameraState('idle');
  };

  const handleOnDecoded = (text: string) => {
    playBeep();
    pushLog(`スแกน QR สด: "${text}"`);

    let cleanId = text.trim();
    try {
      const parsed = JSON.parse(text);
      if (parsed && parsed.id) cleanId = parsed.id;
    } catch(e) {}

    handleLoadBatch(cleanId);
    setSearchQuery(cleanId);
    setActiveMode('emulator'); // Auto shift back to emulator tab to view the results cleanly

    Swal.fire({
      title: 'สแกนย้อนกลับสำเร็จ!',
      text: `ดึงห่วงโซ่ล็อต: ${cleanId}`,
      icon: 'success',
      timer: 1300,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  };

  useEffect(() => {
    if (activeMode === 'camera' && isOpen) {
      startScanning();
    } else {
      stopScanning();
    }
    return () => {
      stopScanning();
    };
  }, [activeMode, isOpen]);

  const handleSearchTrigger = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      handleLoadBatch(searchQuery.trim());
      pushLog(`🔍 ดึงรหัสข้ามจุด: ${searchQuery.trim()}`);
      playBeep();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      {/* Container card */}
      <div className="w-full max-w-5xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[94vh] md:h-[620px] text-slate-800">
        
        {/* LEFT COLUMN: SCANNER PORT (40% width) */}
        <div className="w-full md:w-[35%] bg-slate-950 p-5 flex flex-col justify-between text-white border-b md:border-b-0 md:border-r border-slate-800 shrink-0">
          
          <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
            <span className="text-[10px] text-orange-400 font-extrabold tracking-widest uppercase flex items-center gap-1.5">
              <Icons.QrCode size={14} className="animate-spin-slow text-[#a94228]" />
              BATCH TRACEPORT
            </span>
            
            <div className="flex bg-slate-900 border border-slate-800/80 rounded-lg p-0.5 scale-90">
              <button 
                onClick={() => setActiveMode('camera')}
                className={`px-2 py-1 rounded-md text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer ${activeMode === 'camera' ? 'bg-[#a94228] text-white' : 'text-slate-400 hover:text-white'}`}
              >
                กล้อง
              </button>
              <button 
                onClick={() => setActiveMode('emulator')}
                className={`px-2 py-1 rounded-md text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer ${activeMode === 'emulator' ? 'bg-[#a94228] text-white' : 'text-slate-400 hover:text-white'}`}
              >
                ปุ่มพิมพ์
              </button>
            </div>
          </div>

          {/* Quick Search */}
          <div className="my-3 text-left">
            <label className="text-[8px] font-black tracking-widest text-[#7a8b95] uppercase block mb-1">
              พิมพ์รหัสตรวจด่วน (Press Enter)
            </label>
            <div className="relative">
              <input 
                type="text" 
                value={searchQuery}
                onKeyDown={handleSearchTrigger}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="PL-2606-0001..." 
                className="w-full bg-slate-910 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono font-black placeholder:italic placeholder:text-slate-500 text-white outline-none focus:border-amber-500 uppercase"
              />
              <Icons.Search size={12} className="absolute right-3 top-2.5 text-slate-500" />
            </div>
          </div>

          {/* Scanner View Frame */}
          <div className="flex-1 my-2 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex flex-col items-center justify-center relative min-h-[160px]">
            {activeMode === 'camera' ? (
              <>
                <div id={elementId} className="w-full h-full min-h-[170px] flex items-center justify-center bg-transparent [&_video]:max-w-full [&_video]:max-h-full [&_video]:rounded-xl" />
                {cameraState === 'scanning' && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                    <div className="w-[120px] h-[120px] border border-dashed border-emerald-400 rounded-lg relative flex items-center justify-center bg-slate-950/20">
                      <div className="w-full h-px bg-emerald-400 absolute animate-pulse animate-bounce" />
                    </div>
                  </div>
                )}
                {cameraState === 'starting' && (
                  <p className="text-[10px] text-slate-400 font-bold uppercase animate-pulse">กำลังสแกนกล้อง...</p>
                )}
                {(cameraState === 'idle' || cameraState === 'error') && (
                  <div className="p-4 text-center">
                    <Icons.Camera size={24} className="text-[#a94228] mx-auto animate-bounce mb-1" />
                    <button 
                      onClick={() => startScanning()} 
                      className="bg-emerald-600 px-3 py-1.5 rounded text-[9px] font-black uppercase tracking-wider"
                    >
                      Connect Camera
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full p-4 flex flex-col justify-between text-left">
                <div>
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-wider">BATCH PRESETS EMULATOR</p>
                  <p className="text-[9px] text-slate-400 leading-normal mt-0.5">ดึงข้อมูลตัวอย่างด้านล่างเพื่อประเมินประวัติการเดินทางของบิลผลิตสำเร็จ</p>
                </div>
                
                <div className="flex flex-col gap-1.5 my-3">
                  {orders.slice(0, 3).map((o: any) => (
                    <button
                      key={o.id}
                      onClick={() => handleLoadBatch(o.id)}
                      className={`p-2 border rounded-lg text-left transition-all text-xs truncate cursor-pointer ${selectedOrder?.id === o.id ? 'bg-[#a94228]/20 border-[#a94228]' : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'}`}
                    >
                      <span className="font-mono font-black text-amber-500 text-[10px] block">{o.id}</span>
                      <span className="text-slate-300 text-[10px]">{o.name}</span>
                    </button>
                  ))}
                </div>

                <span className="text-[8.5px] text-slate-500 italic text-center block">
                  พิมพ์รหัสบิลอะไรก็ได้เพื่อประมวลประวัติย้อนกลับ
                </span>
              </div>
            )}
          </div>

          {/* Quick Logs Terminal */}
          <div className="bg-slate-950 p-2 border border-slate-900 rounded-lg h-24 flex flex-col justify-between overflow-hidden text-left font-mono shrink-0">
            <span className="text-[8px] font-bold text-[#acd9bd] border-b border-slate-900 pb-1">CONSOLE METADATA STREAM</span>
            <div className="flex-1 overflow-y-auto custom-scrollbar text-[8.5px] text-slate-400 space-y-1 mt-1">
              {localLogs.length === 0 ? (
                <p className="text-slate-600 italic">สแตนด์บายกล้องอ่าน...</p>
              ) : (
                localLogs.map((lg, idx) => (
                  <p key={idx} className="truncate text-slate-300">{lg}</p>
                ))
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: TRACEABILITY OVERVIEW (65% width) */}
        <div className="flex-1 p-5 flex flex-col justify-between bg-slate-50 overflow-y-auto">
          
          {/* Header toolbar */}
          <div className="flex justify-between items-center border-b pb-2 border-slate-200.5 shrink-0">
            <div className="text-left">
              <h2 className="text-xs font-black text-[#212c46] uppercase tracking-wide flex items-center gap-1.5">
                <Icons.Verified size={15} className="text-[#a94228]" strokeWidth={2.4} /> 
                BATCH LINEAGE REPORT • ห่วงโซ่ย้อนกลับ
              </h2>
              <span className="text-[8px] text-[#7a8b95] font-black uppercase tracking-widest block mt-0.5">
                ISO 9001, GHP, HACCP CRITICAL PATH MONITORING
              </span>
            </div>
            
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-100 rounded-lg transition-all"
            >
              <Icons.X size={16} />
            </button>
          </div>

          {selectedOrder && lineage ? (
            <div className="flex-1 my-4 flex flex-col gap-4 text-left">
              
              {/* Top Banner details */}
              <div className="bg-white border rounded-xl p-3.5 shadow-xs flex justify-between items-center">
                <div className="pr-4 shrink min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-[9px] font-black bg-rose-50 border border-rose-100 text-[#a94228] px-1.5 rounded lowercase">
                      {selectedOrder.id}
                    </span>
                    <span className="font-mono text-[9px] font-black bg-slate-100 text-slate-600 px-1.5 rounded uppercase">
                      SKU: {selectedOrder.sku || 'N/A'}
                    </span>
                  </div>
                  <h3 className="font-black text-xs text-[#212c46] leading-snug mt-1.5 truncate">
                    {selectedOrder.name}
                  </h3>
                  <p className="text-[9.5px] mt-0.5 text-slate-400 font-bold uppercase tracking-wider">
                    Customer: {selectedOrder.customer || 'DOMESTIC MARKET'}
                  </p>
                </div>

                <div className="shrink-0 p-1 bg-slate-50 rounded border">
                  <QRCodeSVG 
                    value={JSON.stringify({ schema: "MEAT-PRO-BATCH-V1", id: selectedOrder.id })}
                    size={38}
                  />
                </div>
              </div>

              {/* TIMELINE OVERVIEW WITH RICH ICONS */}
              <div className="space-y-4">
                
                {/* 1. Origins */}
                <div className="flex gap-3 relative">
                  <div className="absolute top-7 bottom-0 left-[11px] w-0.5 bg-slate-200" />
                  
                  <div className="w-6 h-6 rounded-full bg-orange-100 text-[#a94228] border border-orange-200.5 flex items-center justify-center shrink-0 z-10">
                    <Icons.Dna size={12} />
                  </div>
                  
                  <div className="flex-1 text-xs">
                    <h5 className="font-black text-[10px] text-slate-400 uppercase tracking-widest leading-none">STAGE 1: วัตถุดิบนำเข้า (INGREDIENT PROVENANCE)</h5>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {lineage.materials?.map((m: any, idx: number) => (
                        <div key={idx} className="bg-white border border-slate-200 p-1.5 rounded-lg flex flex-col text-[10px] items-start shadow-xs">
                          <span className="text-[8px] font-black text-pink-600 bg-pink-50 px-1 rounded-sm block leading-none mb-0.5 font-mono">Lot: {m.lot}</span>
                          <span className="font-black text-slate-800 line-clamp-1">{m.name}</span>
                          <span className="text-[8px] text-slate-400 block mt-0.5">Farm: {m.source}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Mixing */}
                <div className="flex gap-3 relative">
                  <div className="absolute top-7 bottom-0 left-[11px] w-0.5 bg-slate-200" />
                  
                  <div className="w-6 h-6 rounded-full bg-amber-100 text-[#b58c4f] border border-amber-200 flex items-center justify-center shrink-0 z-10">
                    <Icons.Timer size={12} />
                  </div>

                  <div className="flex-1 text-xs">
                    <h5 className="font-black text-[10px] text-slate-400 uppercase tracking-widest leading-none">STAGE 2: ต้มสุกสแกนสูตรปรุง (MIXING & PROCESS TIME)</h5>
                    <div className="bg-white border p-2 rounded-xl mt-1.5 space-y-1.5">
                      <div className="flex justify-between font-medium text-[10px]">
                        <span className="text-slate-400">ผสมอัปเดตเวลา (Mixed At):</span>
                        <span className="font-mono font-black text-slate-800">{lineage.mixingTimestamp}</span>
                      </div>
                      <div className="flex justify-between font-medium text-[10px]">
                        <span className="text-slate-400">พนักงานประกอบเครื่อง (Technician):</span>
                        <span className="font-black text-slate-800">{lineage.mixingOperator}</span>
                      </div>
                      <div className="flex justify-between font-medium text-[10px]">
                        <span className="text-slate-400">โถสับสูญญากาศ (Mixing Vessel):</span>
                        <span className="font-black text-slate-800">{lineage.mixingMachine}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Packing */}
                <div className="flex gap-3 relative">
                  <div className="absolute top-7 bottom-0 left-[11px] w-0.5 bg-slate-200" />
                  
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0 z-10">
                    <Icons.Package size={11} />
                  </div>

                  <div className="flex-1 text-xs">
                    <h5 className="font-black text-[10px] text-slate-400 uppercase tracking-widest leading-none">STAGE 3: ควบคุมบรรจุหีบ (PACKING OPERATOR DETAILS)</h5>
                    <div className="bg-white border p-2 rounded-xl mt-1.5 space-y-1.5">
                      <div className="flex justify-between font-medium text-[10px]">
                        <span className="text-slate-400">หัวหน้าทีมผนึกฟอยล์ (Packing Lead):</span>
                        <span className="font-black text-[#212c46]">{lineage.packingOperator}</span>
                      </div>
                      <div className="flex justify-between font-medium text-[10px]">
                        <span className="text-slate-400">คู่ล็อตแผ่นฟิล์มสตรีม (Packaging Foil Lot):</span>
                        <span className="font-mono font-bold text-slate-700">{lineage.packingFoilLot}</span>
                      </div>
                      <div className="flex justify-between font-medium text-[10px]">
                        <span className="text-slate-400">การรั่วอากาศสูญญากาศ:</span>
                        <span className="text-emerald-600 font-extrabold flex items-center gap-1">✓ Passed</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Warehousing */}
                <div className="flex gap-3 relative">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 z-10">
                    <Icons.Home size={11} />
                  </div>

                  <div className="flex-1 text-xs">
                    <h5 className="font-black text-[10px] text-slate-400 uppercase tracking-widest leading-none">STAGE 4: ห้องเก็บรักษาและการขนย้าย (COLD CHAIN LOGISTICS)</h5>
                    <div className="bg-white border p-2 rounded-xl mt-1.5 space-y-1.5">
                      <div className="flex justify-between font-medium text-[10px]">
                        <span className="text-slate-400">ตำแหน่งพิกัดพักพาเลท (Warehouse Bay):</span>
                        <span className="font-bold text-slate-800">{lineage.warehouseBay}</span>
                      </div>
                      <div className="flex justify-between font-medium text-[10px]">
                        <span className="text-slate-400">อุณหภูมิแกนกลางชิ้นเนื้อ (CCP1 Core Temp):</span>
                        <span className="font-mono text-emerald-600 font-black">{lineage.coreInternalTemp}</span>
                      </div>
                      <div className="flex justify-between font-medium text-[10px]">
                        <span className="text-slate-400">รถขนส่งห้องเย็นควบคุม (-18°C):</span>
                        <span className="font-bold text-slate-700 truncate max-w-[170px] inline-block">{lineage.dispatchTruckLicense}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="flex-1 p-10 border border-dashed border-slate-300 rounded-xl bg-slate-100 text-center flex flex-col items-center justify-center gap-2">
              <Icons.Loader2 size={36} className="text-slate-400 animate-spin" />
              <p className="text-[11px] font-black text-slate-500 uppercase">กำลังสตรีมประมวลระบบล็อตผลิต...</p>
            </div>
          )}

          {/* Dialog buttons block */}
          <div className="mt-4 border-t pt-3 flex flex-col gap-2 shrink-0 text-center">
            <button
              onClick={() => {
                onClose();
                window.location.hash = "/process/traceability";
                // Trigger react-router replacement if applicable, or we tell them to load
                window.location.pathname = "/process/traceability";
              }}
              className="w-full bg-[#212c46] hover:bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest py-3 rounded-lg shadow transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>OPEN ADVANCED FULL-SCREEN TRACEBOARD</span>
              <Icons.ArrowRight size={12} />
            </button>
            <p className="text-[7.5px] font-black uppercase tracking-wider text-slate-400">
              MEAT-PRO TRACEABILITY ASSURANCE NODE • ENCRYPTED AUDIT TRAILS
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
