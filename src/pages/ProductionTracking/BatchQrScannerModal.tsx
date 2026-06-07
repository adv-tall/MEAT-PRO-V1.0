import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  X, Camera, AlertCircle, RefreshCw, Volume2, Sparkles, 
  CheckCircle2, Flame, Scissors, Package, Database, CookingPot,
  Plus, Minus, ArrowRight, Video, VideoOff, Info, HelpCircle
} from 'lucide-react';
import Swal from 'sweetalert2';

interface BatchQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  ordersList: any[];
  onUpdateOrder: (id: string, updates: any) => void;
  preselectedId?: string | null;
  clearPreselected?: () => void;
}

export function BatchQrScannerModal({ 
  isOpen, 
  onClose, 
  ordersList, 
  onUpdateOrder, 
  preselectedId,
  clearPreselected
}: BatchQrScannerModalProps) {
  
  const [activeMode, setActiveMode] = useState<'camera' | 'emulator'>('camera');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  
  // Camera scanning states
  const [cameraState, setCameraState] = useState<'idle' | 'scanning' | 'permissions_failed' | 'starting'>('idle');
  const [cameraIdSelected, setCameraIdSelected] = useState<string>('');
  const [camerasFound, setCamerasFound] = useState<any[]>([]);
  const [scannerErrorMessage, setScannerErrorMessage] = useState<string>('');
  
  // Form submission states
  const [selectedStage, setSelectedStage] = useState<string>('mixing');
  const [batchCountIncrement, setBatchCountIncrement] = useState<number>(1);
  const [customStatus, setCustomStatus] = useState<string>('IN PROGRESS');
  const [scannerLog, setScannerLog] = useState<string[]>([]);

  // Refs
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const elementId = "local-qr-shutter";

  // Synthesize scan beep sound
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1400, audioCtx.currentTime); // clear high frequency chirp
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      console.warn("Unable to play synthesize beep sound", e);
    }
  };

  // Preselected Tag logic
  useEffect(() => {
    if (preselectedId) {
      const ord = ordersList.find(o => o.id === preselectedId);
      if (ord) {
        setSelectedOrder(ord);
        setActiveMode('emulator'); // Switch tab so they can see target fields loaded
        // Add log entry
        pushLog(`[PRE-SELECT] โหลดข้อมูลบาร์โค้ดสำเร็จ: ${ord.id}`);
        playBeep();
      }
      if (clearPreselected) clearPreselected();
    }
  }, [preselectedId, ordersList]);

  // Log logger Helper
  const pushLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setScannerLog(prev => [`[${timestamp}] ${msg}`, ...prev].slice(0, 10));
  };

  const isCameraTransitioning = useRef<boolean>(false);

  // Safe camera startup
  const startCameraScan = async (selectedCamId?: string) => {
    if (isCameraTransitioning.current) return;
    pushLog("กำลังเปิดใช้งานกล้อง...");
    setCameraState('starting');
    setScannerErrorMessage('');

    // Clear previous if exist
    await stopCameraScan();

    isCameraTransitioning.current = true;
    try {
      const html5QrCode = new Html5Qrcode(elementId);
      html5QrCodeRef.current = html5QrCode;

      // Find available cameras if none listed
      if (camerasFound.length === 0) {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setCamerasFound(devices);
          selectedCamId = selectedCamId || devices[0].id;
          setCameraIdSelected(devices[0].id);
        } else {
          throw new Error("ไม่พบอุปกรณ์กล้องวิดีโอบนอุปกรณ์นี้");
        }
      }

      const camIdToUse = selectedCamId || cameraIdSelected || (camerasFound[0] && camerasFound[0].id);
      if (!camIdToUse) {
        throw new Error("ไม่มีรหัสประจำกล้องเพื่อเชื่อมต่อ");
      }

      await html5QrCode.start(
        camIdToUse,
        {
          fps: 10,
          qrbox: { width: 200, height: 200 }
        },
        (decodedText) => {
          handleOnDecoded(decodedText);
        },
        (errorMessage) => {
          // Normal feedback during inactive frames, silent
        }
      );

      setCameraState('scanning');
      pushLog("เชื่อมต่อหน้าจอกล้องเรียบร้อย!");
    } catch (error: any) {
      console.error("Camera scan failed", error);
      setCameraState('permissions_failed');
      setScannerErrorMessage(error?.message || "ไม่ได้รับอนุญาตให้ใช้กล้อง หรือบราวเซอร์บล็อกเฟรม");
      pushLog(`⚠️ ข้อผิดพลาดกล้อง: ${error?.message || 'Access Denied'}`);
    } finally {
      isCameraTransitioning.current = false;
    }
  };

  // Stop camera feed
  const stopCameraScan = async () => {
    if (isCameraTransitioning.current) {
      while (isCameraTransitioning.current) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    if (html5QrCodeRef.current) {
      isCameraTransitioning.current = true;
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
      } catch (err) {
        console.warn("Failed to safely unmount html5-qrcode renderer ignored", err);
      } finally {
        isCameraTransitioning.current = false;
        html5QrCodeRef.current = null;
      }
    }
    setCameraState('idle');
  };

  // Trigger when a scan decodes
  const handleOnDecoded = (decodedText: string) => {
    playBeep();
    pushLog(`🎉 สแกนเจอคิวอาร์: "${decodedText}"`);

    // Extract order id
    const cleanId = decodedText.trim();
    const matchOrder = ordersList.find(o => o.id === cleanId || o.id === cleanId.toUpperCase());
    
    if (matchOrder) {
      setSelectedOrder(matchOrder);
      pushLog(`✅ ลิงก์ออเดอร์พบเรียบร้อย: ${matchOrder.id} - ${matchOrder.name}`);
      
      // Auto blink transition to emulator form for worker confirmation
      setActiveMode('emulator');
      
      Swal.fire({
        title: 'สแกนสำเร็จ!',
        html: `<div class="text-left text-xs bg-slate-50 p-3 rounded border font-mono">
                 <p class="font-bold text-[#212c46]">รหัส: ${matchOrder.id}</p>
                 <p class="mt-1">${matchOrder.name}</p>
                 <p class="mt-1 text-[#a94228]">เป้าหมาย: ${matchOrder.target || matchOrder.qty} ลัง</p>
               </div>`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    } else {
      pushLog(`❌ ไม่สแกนพบบาร์โค้ดนี้ในระบบสตรีมออเดอร์: "${decodedText}"`);
      Swal.fire({
        title: 'ไม่พบเลขออเดอร์นี้',
        text: `รหัส "${decodedText}" ไม่ตรงกับล็อตการทำงานที่ลงทะเบียนไว้`,
        icon: 'warning',
        confirmButtonColor: '#212c46'
      });
    }
  };

  // On mode toggle
  useEffect(() => {
    if (activeMode === 'camera' && isOpen) {
      startCameraScan();
    } else {
      stopCameraScan();
    }
  }, [activeMode, isOpen]);

  // Safely clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCameraScan();
    };
  }, []);

  // Update batch submission
  const handleSubmitProgress = () => {
    if (!selectedOrder) {
      Swal.fire({
        title: 'ไม่พบหัวข้อคำสั่งผลิต',
        text: 'กรุณาเลือกหรือสแกนบัตรออเดอร์ให้เรียบร้อยก่อนทำการเพิ่มผลผลิต',
        icon: 'warning',
        confirmButtonColor: '#212c46'
      });
      return;
    }

    const orderId = selectedOrder.id;
    const targetQty = selectedOrder.target || selectedOrder.qty;
    
    // Choose which state count to update
    let currentVal = 0;
    let fieldToUpdate = 'mixingCount';
    let stageThaiName = 'ขั้นตอนผสม';

    switch (selectedStage) {
      case 'mixing':
        fieldToUpdate = 'mixingCount';
        currentVal = selectedOrder.mixingCount !== undefined ? selectedOrder.mixingCount : Math.floor(targetQty * 0.9);
        stageThaiName = 'สแกนจุดผสม (Mixing Stage)';
        break;
      case 'forming':
        fieldToUpdate = 'formingCount';
        currentVal = selectedOrder.formingCount !== undefined ? selectedOrder.formingCount : Math.floor(targetQty * 0.7);
        stageThaiName = 'สแกนจุดขึ้นรูป (Forming Stage)';
        break;
      case 'cooking':
        fieldToUpdate = 'cookingCount';
        currentVal = selectedOrder.cookingCount !== undefined ? selectedOrder.cookingCount : Math.floor(targetQty * 0.5);
        stageThaiName = 'สแกนจุดรมควันอบสุก (Cooking Stage)';
        break;
      case 'cooling':
        fieldToUpdate = 'coolingCount';
        currentVal = selectedOrder.coolingCount !== undefined ? selectedOrder.coolingCount : Math.floor(targetQty * 0.4);
        stageThaiName = 'สแกนจุดหล่อเย็น (Cooling Stage)';
        break;
      case 'cutting':
        fieldToUpdate = 'cuttingCount';
        currentVal = selectedOrder.cuttingCount !== undefined ? selectedOrder.cuttingCount : Math.floor(targetQty * 0.3);
        stageThaiName = 'สแกนจุดตัด/ปอก (Cutting Stage)';
        break;
      case 'packing':
        fieldToUpdate = 'packingCount';
        currentVal = selectedOrder.packingCount !== undefined ? selectedOrder.packingCount : 0;
        stageThaiName = 'สแกนสวมบรรจุห่อ (Packing Stage)';
        break;
      case 'wh':
        fieldToUpdate = 'whCount';
        currentVal = selectedOrder.whCount !== undefined ? selectedOrder.whCount : 0;
        stageThaiName = 'สแกนโอนคลั่งสำเร็จเกรด (WH Storage)';
        break;
    }

    // New value
    const calculatedNewCount = Math.max(0, currentVal + batchCountIncrement);
    const finalNewCount = calculatedNewCount > targetQty ? targetQty : calculatedNewCount;

    // Check completed automation
    let determinedStatus = customStatus;
    if (selectedStage === 'wh' && finalNewCount >= targetQty && targetQty > 0) {
      determinedStatus = 'COMPLETED';
    }

    // Save back to store
    onUpdateOrder(orderId, {
      [fieldToUpdate]: finalNewCount,
      status: determinedStatus,
      // Fallback update order status to complete if general is set
      ...(determinedStatus === 'COMPLETED' ? { progress: 100 } : {})
    });

    playBeep();
    pushLog(`💾 บันทึกสำเร็จ: ${orderId} | ${selectedStage} ➔ ${finalNewCount} / ${targetQty} ลัง`);

    // Alert worker
    Swal.fire({
      title: 'อัปเดตความคืบหน้าสำเร็จ!',
      html: `
        <div class="text-left text-xs space-y-1 bg-slate-50 p-3 rounded border font-mono">
          <p class="font-bold text-[#212c46]">คำสั่งสแกน: ${orderId}</p>
          <p class="text-slate-600">ตำแหน่ง: ${stageThaiName}</p>
          <p class="font-black text-emerald-600 text-[13px] mt-1">อัปเดตยอด: ${currentVal} ➔ ${finalNewCount} ลัง (เป้าหมาย: ${targetQty})</p>
          <p class="mt-1">สถานะควบคุม: <span class="bg-[#212c46] text-white px-1.5 py-0.2 rounded text-[9px] uppercase font-black">${determinedStatus}</span></p>
        </div>
      `,
      icon: 'success',
      confirmButtonColor: '#212c46'
    });

    // Update the local select object to reflect live counts immediately in form fields
    setSelectedOrder({
      ...selectedOrder,
      [fieldToUpdate]: finalNewCount,
      status: determinedStatus
    });
  };

  // Helper icons selector
  const renderStageIcon = (stg: string) => {
    switch (stg) {
      case 'mixing': return <Database size={16} className="text-teal-600" />;
      case 'forming': return <CookingPot size={16} className="text-amber-600" />;
      case 'cooking': return <Flame size={16} className="text-rose-600" />;
      case 'cooling': return <Plus size={16} className="text-sky-600" />;
      case 'cutting': return <Scissors size={16} className="text-pink-600" />;
      case 'packing': return <Package size={16} className="text-[#212c46]" />;
      default: return <CheckCircle2 size={16} className="text-emerald-600" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-4xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[94vh] md:h-[650px]">
        
        {/* LEFT COLUMN: SCAN FEED / EMULATOR */}
        <div className="w-full md:w-3/5 bg-slate-950 p-5 flex flex-col justify-between relative text-white border-b md:border-b-0 md:border-r border-slate-800">
          
          {/* Header row */}
          <div className="flex justify-between items-center z-10">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-[12px] font-black tracking-widest uppercase">MEAT-TRAK BATCH SCANNER</span>
            </div>
            
            {/* Mode switch pills */}
            <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              <button 
                onClick={() => setActiveMode('camera')}
                className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer ${activeMode === 'camera' ? 'bg-[#a94228] text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <Video size={10} /> Camera Shutter
              </button>
              <button 
                onClick={() => setActiveMode('emulator')}
                className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer ${activeMode === 'emulator' ? 'bg-[#a94228] text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <Sparkles size={10} /> Simulator
              </button>
            </div>
          </div>

          {/* Scanner Viewport / Emulator Viewport Box */}
          <div className="flex-1 my-4 bg-slate-900 rounded-xl border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden min-h-[180px]">
            {activeMode === 'camera' ? (
              <>
                <div id={elementId} className="w-full h-full scale-100 flex items-center justify-center bg-transparent [&_video]:max-w-full [&_video]:max-h-full [&_video]:rounded-xl" />
                
                {/* Visual Scanner Guide layer */}
                {cameraState === 'scanning' && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                    {/* Laser overlay line */}
                    <div className="w-[180px] h-[180px] border-2 border-dashed border-emerald-400 rounded-xl relative flex items-center justify-center shadow-[0_0_15px_rgba(52,211,153,0.15)] bg-slate-950/25">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-400 rounded-tl" />
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-400 rounded-tr" />
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-400 rounded-bl" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-400 rounded-br" />
                      <div className="w-full h-0.5 bg-emerald-400 blur-[0.5px] absolute animate-pulse animate-bounce" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-slate-950/75 px-3 py-1.5 rounded-full mt-4 border border-emerald-500/30">
                      กรุณาทาบคิวอาร์โค้ดประจำออเดอร์ในช่องนี้
                    </span>
                  </div>
                )}

                {/* Shutter Status / Loader guides */}
                {cameraState === 'starting' && (
                  <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                    <div className="w-9 h-9 rounded-full border-2 border-t-emerald-400 border-slate-800 animate-spin" />
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">กำลังเปิดกล้องวิดีโอ...</span>
                  </div>
                )}

                {(cameraState === 'idle' || cameraState === 'permissions_failed') && (
                  <div className="flex flex-col items-center justify-center gap-3 p-6 text-center max-w-sm">
                    <VideoOff size={32} className="text-slate-500 animate-bounce" />
                    <div>
                      <p className="text-[12px] font-black uppercase tracking-widest text-[#a94228]">CAMERA STREAMING RESOLUTIONS</p>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                        {scannerErrorMessage || "กรุณาคลิกเพื่อเชื่อมต่อ Shutter และขอสิทธิ์กล้องของเบราว์เซอร์ในการสแกน"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 justify-center mt-2">
                      <button
                        onClick={() => startCameraScan()}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Camera size={12} /> Start Camera
                      </button>
                      <button
                        onClick={() => setActiveMode('emulator')}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        สแกนจำลองด้วยคีย์บอร์ด
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* SIMULATED EMULATOR VIEW */
              <div className="w-full h-full p-6 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                    <Sparkles size={12} className="animate-pulse" /> SCANNER HARDWARE EMULATOR (ZERO LATENCY)
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    พิมพ์หมายเลขนำเข้าหรือเลือกรายการด้านล่างเพื่อทำการสแกนประวัติคิวอาร์แบบจำลอง (ใช้งานทดสอบได้เหมือนกล้องจริง)
                  </p>
                </div>

                <div className="my-4 bg-slate-950 p-4 border border-slate-800 rounded-lg flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] text-[#7a8b95] font-black uppercase tracking-widest">
                      พิมพ์หรือเลือกไอดีออเดอร์ (เช่น 260603-001)
                    </label>
                    <div className="flex gap-2">
                      <select
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) {
                            const found = ordersList.find(o => o.id === val);
                            if (found) {
                              setSelectedOrder(found);
                              playBeep();
                              pushLog(`[EMU] เลือกออเดอร์: ${found.id}`);
                            }
                          }
                        }}
                        value={selectedOrder ? selectedOrder.id : ''}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white uppercase font-black outline-none focus:border-amber-500"
                      >
                        <option value="">-- เลือกออเดอร์ในระบบ --</option>
                        {ordersList.map(o => (
                          <option key={o.id} value={o.id}>
                            {o.id} - {o.name} ({o.qty} bts)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {selectedOrder && (
                    <div className="bg-[#212c46]/40 p-2.5 rounded border border-slate-800/80 flex items-center justify-between text-left">
                      <div>
                        <span className="text-[8px] font-black bg-amber-500 text-slate-950 px-1 py-0.2 rounded uppercase leading-none">
                          FOUND IN CACHE
                        </span>
                        <p className="text-[11px] font-black text-white truncate max-w-[200px] mt-1">{selectedOrder.name}</p>
                        <p className="text-[9px] text-slate-400 tracking-wider">SKU: {selectedOrder.sku || 'Generic'}</p>
                      </div>
                      <span className="text-xs font-mono font-black text-amber-500">
                        {selectedOrder.target || selectedOrder.qty} ลัง
                      </span>
                    </div>
                  )}
                </div>

                <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider text-center">
                  💡 คำแนะนำ: เลือกออเดอร์ด้านบน ระบบจะโหลดข้อมูลประวัติพร้อมสุ่มเสียงสแกนสำเร็จทันที
                </span>
              </div>
            )}
          </div>

          {/* Real-time scanning diagnostic console logs */}
          <div className="h-24 bg-slate-950 p-2 border border-slate-800 rounded-lg flex flex-col justify-between overflow-hidden">
            <div className="flex justify-between items-center text-[8px] font-black uppercase text-[#acd9bd] border-b border-slate-900 pb-1 shrink-0">
              <span className="flex items-center gap-1"><Volume2 size={10} /> Live Scanner Logs Terminal</span>
              <button 
                onClick={() => setScannerLog([])}
                className="text-slate-600 hover:text-white transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-[9px] text-slate-400 space-y-1 pt-1 selection:bg-slate-800">
              {scannerLog.length === 0 ? (
                <p className="text-[8px] text-slate-600 uppercase tracking-widest italic pt-2">ไม่มีประวัติการส่งคำสั่งทางฟากวิดีโอ</p>
              ) : (
                scannerLog.map((log, index) => (
                  <p key={index} className="truncate select-all text-slate-300">
                    {log}
                  </p>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTION AND CONFIRMATION PANEL */}
        <div className="w-full md:w-2/5 p-5 flex flex-col justify-between bg-slate-50 overflow-y-auto">
          {/* Form container */}
          <div className="flex flex-col gap-4">
            
            {/* Header column title */}
            <div className="flex justify-between items-center border-b pb-2 border-slate-200">
              <div className="flex flex-col">
                <span className="text-[12px] font-black text-[#212c46] uppercase tracking-wide flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-[#a94228]" /> UPDATE BATCH BINS
                </span>
                <span className="text-[8px] text-[#7a8b95] font-black uppercase tracking-widest">
                  บันทึกความคืบหน้าเข้าฐานข้อมูล
                </span>
              </div>
              <button 
                onClick={onClose}
                className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Target Selected info */}
            {selectedOrder ? (
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col gap-2 relative">
                <span className="absolute top-3 right-3 text-[9px] text-[#212c46] font-mono font-black border border-slate-200 px-2 py-0.5 rounded shadow-sm bg-slate-50">
                  {selectedOrder.id}
                </span>

                <div className="text-left font-sans select-none pr-12">
                  <span className="text-[8.5px] font-black text-[#a94228] uppercase bg-red-50 border border-red-100 px-1.5 py-0.5 rounded tracking-wide">
                    {selectedOrder.sku || 'FG-BATCH'}
                  </span>
                  <h3 className="font-black text-[#212c46] text-xs leading-snug mt-1.5 line-clamp-1">
                    {selectedOrder.name}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-[10px] pt-1.5 border-t border-slate-100">
                  <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                    <span className="text-[#7a8b95] font-bold block uppercase text-[8px] tracking-wider">เป้าหมายทั้งหมด</span>
                    <span className="font-mono font-black text-[#212c46] text-xs">
                      {selectedOrder.target || selectedOrder.qty} ลัง
                    </span>
                  </div>
                  <div className="bg-amber-50 p-1.5 rounded border border-amber-100">
                    <span className="text-[#b58c4f] font-bold block uppercase text-[8px] tracking-wider">สถานะปัจจุบัน</span>
                    <span className="font-mono font-black text-amber-700 text-xs">
                      {selectedOrder.status}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 border border-dashed border-slate-300 rounded-xl bg-slate-100 text-center flex flex-col items-center justify-center gap-2">
                <Info size={24} className="text-slate-400" />
                <div>
                  <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider">ต้องการการตรวจจับออเดอร์</p>
                  <p className="text-[9px] text-slate-400 leading-normal max-w-xs mx-auto mt-1">
                    ทาบแถบคิวอาร์ที่หัวช่องกล้อง, เลือกออเดอร์จากระบบจำลอง หรือพิมพ์โค้ดเพื่อเริ่มต้น
                  </p>
                </div>
              </div>
            )}

            {/* Select scanning Stage location */}
            <div className="flex flex-col gap-1 text-left">
              <label className="text-[10px] font-black text-[#7a8b95] uppercase tracking-widest flex items-center gap-1">
                <span>เลือกขั้นตอนตรวจจับ (Scanning Stage)</span>
              </label>
              
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'all_stages', label: '-- ด่านเตรียมเนื้อผสม --', isDivider: true },
                  { id: 'mixing', label: '1. จุดผสม (Mixing)' },
                  { id: 'forming', label: '2. ขึ้นรูป (Forming)' },
                  { id: 'cooking', label: '3. อบรมควัน (Cooking)' },
                  { id: 'all_stages_2', label: '-- ด่านอุณหภูมิ/ปอก --', isDivider: true },
                  { id: 'cooling', label: '4. หล่อเย็น (Cooling)' },
                  { id: 'cutting', label: '5. ตัดปอก (Cutting)' },
                  { id: 'packing', label: '6. บรรจุแพ็ค (Packing)' },
                  { id: 'wh', label: '7. คลังสินค้า (Warehouse)' }
                ].map((st) => {
                  if (st.isDivider) {
                    return (
                      <span key={st.id} className="col-span-2 text-[8px] font-black uppercase text-slate-400 tracking-widest pt-1.5">
                        {st.label}
                      </span>
                    );
                  }
                  
                  // Query current stage count in selectedOrder
                  let countVal = 0;
                  if (selectedOrder) {
                    const targetQty = selectedOrder.target || selectedOrder.qty;
                    switch (st.id) {
                      case 'mixing': countVal = selectedOrder.mixingCount !== undefined ? selectedOrder.mixingCount : Math.floor(targetQty * 0.9); break;
                      case 'forming': countVal = selectedOrder.formingCount !== undefined ? selectedOrder.formingCount : Math.floor(targetQty * 0.7); break;
                      case 'cooking': countVal = selectedOrder.cookingCount !== undefined ? selectedOrder.cookingCount : Math.floor(targetQty * 0.5); break;
                      case 'cooling': countVal = selectedOrder.coolingCount !== undefined ? selectedOrder.coolingCount : Math.floor(targetQty * 0.4); break;
                      case 'cutting': countVal = selectedOrder.cuttingCount !== undefined ? selectedOrder.cuttingCount : Math.floor(targetQty * 0.3); break;
                      case 'packing': countVal = selectedOrder.packingCount !== undefined ? selectedOrder.packingCount : 0; break;
                      case 'wh': countVal = selectedOrder.whCount !== undefined ? selectedOrder.whCount : 0; break;
                    }
                  }

                  const isActive = selectedStage === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      disabled={!selectedOrder}
                      onClick={() => setSelectedStage(st.id)}
                      className={`px-3 py-2 border rounded-xl flex items-center justify-between text-left text-[10px] tracking-tight font-black transition-all cursor-pointer disabled:opacity-50 ${isActive ? 'bg-[#212c46] text-white border-[#212c46] shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        {renderStageIcon(st.id)}
                        <span>{st.label}</span>
                      </span>
                      {selectedOrder && (
                        <span className={`font-mono text-[9px] px-1 py-0.2 rounded-md ${isActive ? 'bg-amber-400 text-[#212c46]' : 'bg-slate-100 text-slate-600 font-black'}`}>
                          {countVal}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity input adjuster */}
            <div className="flex flex-col gap-1 text-left mt-1 border-t pt-3.5 border-slate-200">
              <label className="text-[10px] font-black text-[#7a8b95] uppercase tracking-widest">
                ระบุจำนวนตู้/ลัง (Increment processed amount)
              </label>
              
              <div className="flex items-center justify-between gap-3 bg-white border border-slate-200.5 p-1 rounded-xl shadow-sm">
                <button
                  type="button"
                  disabled={!selectedOrder || batchCountIncrement <= 1}
                  onClick={() => setBatchCountIncrement(prev => Math.max(1, prev - 1))}
                  className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border hover:bg-slate-100 cursor-pointer disabled:opacity-40"
                >
                  <Minus size={16} className="text-slate-700" />
                </button>
                <div className="text-center">
                  <span className="font-mono text-lg font-black text-[#212c46]">{batchCountIncrement}</span>
                  <span className="text-[9px] block text-slate-400 font-bold uppercase tracking-wider">BATCH BINS / ลัง</span>
                </div>
                <button
                  type="button"
                  disabled={!selectedOrder}
                  onClick={() => setBatchCountIncrement(prev => prev + 1)}
                  className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border hover:bg-slate-100 cursor-pointer"
                >
                  <Plus size={16} className="text-slate-700" />
                </button>
              </div>

              {/* Shortcut buttons */}
              <div className="grid grid-cols-3 gap-1.5 mt-2">
                {[1, 5, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    disabled={!selectedOrder}
                    onClick={() => {
                      setBatchCountIncrement(num);
                      playBeep();
                    }}
                    className={`py-1.5 rounded-lg border text-[9px] font-mono font-black cursor-pointer transition-all ${batchCountIncrement === num ? 'bg-[#a94228] text-white border-[#a94228]' : 'bg-white text-[#212c46] border-slate-200 hover:bg-slate-50'}`}
                  >
                    +{num} LIMS
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Status pill option */}
            <div className="flex flex-col gap-1 text-left">
              <label className="text-[10px] font-black text-[#7a8b95] uppercase tracking-widest">
                อัปเกรดสถานะควบคุมความร้อนสินค้า (Control Status)
              </label>
              <div className="grid grid-cols-2 gap-2 mt-0.5">
                {['IN PROGRESS', 'COMPLETED'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    disabled={!selectedOrder}
                    onClick={() => setCustomStatus(st)}
                    className={`py-2 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${customStatus === st ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                  >
                    {st === 'COMPLETED' ? '💯 ' : ''}{st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Execution triggers */}
          <div className="mt-4 border-t pt-4 border-slate-200 flex flex-col gap-2 shrink-0">
            <button
              onClick={handleSubmitProgress}
              disabled={!selectedOrder}
              className="w-full bg-[#212c46] hover:bg-[#212c46]/90 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black text-[11px] uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              COMMIT SCAN / UPDATE LINE PROGRESS
              <ArrowRight size={14} />
            </button>
            <p className="text-[8px] text-slate-400 font-bold text-center uppercase tracking-wider">
              บอร์ดจะอัปเดตข้อมูลความสัมพันธ์เวิร์กโฟลว์ทันที มีระบบบันทึกความคืบหน้าแบบออฟไลน์
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
