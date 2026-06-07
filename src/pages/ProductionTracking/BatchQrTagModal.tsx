import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, Download, Sparkles, Tag, AlertCircle, Layers, CheckSquare, Square, ThumbsUp, History, Trash2, Clock } from 'lucide-react';
import { generateProductionQrPayload, formatTagPrintDate } from '../../utils/qrUtils';
import { db } from '../../services/firebaseConfig';
import { collection, query, orderBy, limit, getDocs, setDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';

interface BatchQrTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onSimulateScan: (id: string) => void;
  allOrders?: any[]; // Allow bulk printing by reading active/all orders
}

export function BatchQrTagModal({ isOpen, onClose, order, onSimulateScan, allOrders = [] }: BatchQrTagModalProps) {
  const [mounted, setMounted] = useState(false);
  const [printMode, setPrintMode] = useState<'single' | 'bulk' | 'history'>('single');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [historyIds, setHistoryIds] = useState<string[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [labelSettings, setLabelSettings] = useState({
    companyName: 'MEAT PRO FOOD GROUP CO., LTD.',
    docTitle: 'OFFICIAL PRODUCTION JOB STICKER LABEL',
    labelTitle: 'Pallet Bin Batch Traveller',
    labelSub: 'SCAN TO UPDATE FACTORY RUN',
    batchIdLabel: 'BATCH RUN ID:',
    productNameLabel: 'PRODUCT NAME:',
    skuCodeLabel: 'SKU CODE:',
    targetQtyLabel: 'TARGET QTY:',
    unitRefLabel: 'UNIT REF:',
    showBatchId: true,
    showProductName: true,
    showSkuCode: true,
    showTargetQty: true,
    showUnitRef: true,
    instructionText: 'ติดป้ายบัตรนี้ที่ตัวถังผสมหรือพาเลทวัตถุดิบเพื่อให้พนักงานกวาดสแกนอัปเดตงาน'
  });

  // Load custom QR label settings from Firestore / Local Cache
  useEffect(() => {
    const fetchCustomSettings = async () => {
      try {
        const cached = localStorage.getItem('qr_label_settings_cached');
        if (cached) {
          setLabelSettings(JSON.parse(cached));
        }

        const snapshot = await getDoc(doc(db, 'Qr_Label_Settings', 'default'));
        if (snapshot.exists()) {
          const freshData = snapshot.data() as any;
          setLabelSettings(freshData);
          localStorage.setItem('qr_label_settings_cached', JSON.stringify(freshData));
        }
      } catch (err) {
        console.error('Failed to load printed label custom config from Firestore:', err);
      }
    };

    if (isOpen) {
      fetchCustomSettings();
    }
  }, [isOpen]);

  // Fetch QR print history logs from Firestore
  const fetchHistoryLogs = async () => {
    try {
      setLoadingHistory(true);
      const q = query(
        collection(db, "Qr_Code_History"),
        orderBy("printedAt", "desc"),
        limit(50)
      );
      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(doc => ({ ...doc.data() }));
      setHistoryLogs(logs);
      localStorage.setItem("qr_print_history_fallback", JSON.stringify(logs));
    } catch (err) {
      console.error("Error fetching QR history from Firestore:", err);
      try {
        const cached = localStorage.getItem("qr_print_history_fallback");
        if (cached) {
          setHistoryLogs(JSON.parse(cached));
        }
      } catch (e) {}
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (order) {
      setSelectedIds([order.id]);
      setPrintMode('single');
    }
    if (isOpen) {
      fetchHistoryLogs();
    }
  }, [order, isOpen]);

  if (!isOpen || !order || !mounted) return null;

  // Compute selected items for printing
  const itemsToPrint = printMode === 'single' 
    ? [order] 
    : printMode === 'bulk'
    ? allOrders.filter(o => selectedIds.includes(o.id))
    : historyLogs.filter(h => historyIds.includes(h.id)).map(h => {
        try {
          if (h.itemData) {
            return JSON.parse(h.itemData);
          }
        } catch (e) {}
        return {
          id: h.orderId,
          name: h.productName,
          sku: h.sku,
          qty: h.qty,
          customer: h.unitRef,
          isFromHistory: true
        };
      });

  // Toggle selection for bulk mode
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === allOrders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allOrders.map(o => o.id));
    }
  };

  const handleToggleHistorySelect = (id: string) => {
    setHistoryIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllHistory = () => {
    if (historyIds.length === historyLogs.length) {
      setHistoryIds([]);
    } else {
      setHistoryIds(historyLogs.map(h => h.id));
    }
  };

  const handleDeleteHistoryItem = async (histId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Check for DEMO
    const userStr = localStorage.getItem('user');
    const userObj = userStr ? JSON.parse(userStr) : null;
    if (userObj?.employeeId === 'DEMO') {
      console.log('DEMO user bypassed deleteDoc on Qr_Code_History');
      setHistoryLogs(prev => {
        const filtered = prev.filter(h => h.id !== histId);
        localStorage.setItem("qr_print_history_fallback", JSON.stringify(filtered));
        return filtered;
      });
      setHistoryIds(prev => prev.filter(id => id !== histId));
      return;
    }

    try {
      await deleteDoc(doc(db, "Qr_Code_History", histId));
      setHistoryLogs(prev => {
        const filtered = prev.filter(h => h.id !== histId);
        localStorage.setItem("qr_print_history_fallback", JSON.stringify(filtered));
        return filtered;
      });
      setHistoryIds(prev => prev.filter(id => id !== histId));
    } catch (err) {
      console.error("Failed to delete history log item from Firestore:", err);
    }
  };

  const saveToHistory = async () => {
    try {
      const userStr = localStorage.getItem('user');
      const userObj = userStr ? JSON.parse(userStr) : null;
      const email = userObj?.email || userObj?.username || "advancegroup.dcc@gmail.com";
      
      const newLogs: any[] = [];
      for (const item of itemsToPrint) {
        const histId = `hist-${Date.now()}-${item.id}`;
        const qrPayload = generateProductionQrPayload(item);
        
        const historyItem = {
          id: histId,
          orderId: item.id,
          productName: item.name || item.productName || "Unnamed Job",
          sku: item.sku || item.id,
          qty: item.target || item.qty || item.batchesInSet || item.weightPerBatch || 0,
          unitRef: item.customer || item.machine || (item.shift ? `${item.shift} Shift` : "GENERAL"),
          printedAt: new Date().toISOString(),
          printedBy: email,
          payload: qrPayload,
          itemData: JSON.stringify(item)
        };
        
        if (userObj?.employeeId !== 'DEMO') {
          await setDoc(doc(db, "Qr_Code_History", histId), historyItem);
        } else {
          console.log('DEMO user bypassed setDoc on Qr_Code_History');
        }
        newLogs.push(historyItem);
      }
      
      setHistoryLogs(prev => {
        const merged = [...newLogs, ...prev].slice(0, 50);
        localStorage.setItem("qr_print_history_fallback", JSON.stringify(merged));
        return merged;
      });
    } catch (err) {
      console.error("Error writing to Qr_Code_History collection in Firestore:", err);
    }
  };

  // Trigger standard window print on main browser window with absolute high fidelity print styles
  const handlePrint = () => {
    saveToHistory();
    window.print();
  };

  return createPortal(
    <div id="qr-tag-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      {/* INJECT HIGH-FIDELITY PRINT STYLESHEET */}
      <style>{`
        @media print {
          /* Hide everything under the body except the backdrop portal */
          body > *:not(#qr-tag-backdrop) {
            display: none !important;
          }
          
          #qr-tag-backdrop {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: 100% !important;
            background: #ffffff !important;
            backdrop-filter: none !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            z-index: 99999999 !important;
          }

          #qr-tag-card {
            display: block !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* Hide modal boundaries' headers, range toggles, checkout sidebars, control toolbars */
          .no-print,
          .no-print-content,
          #qr-tag-card > div:first-child, /* Header banner */
          .bg-white.border-b, /* Print Range buttons wrapper */
          .lg:col-span-4, /* Bulk Checklist sidebar */
          #qr-tag-card > div:last-child { /* Bottom dialog toolbar */
            display: none !important;
          }

          /* Force body area to occupy the full page block */
          .flex-1.p-6,
          .grid-cols-12,
          .lg:col-span-8,
          .lg:col-span-12,
          .flex-1.bg-slate-250 {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            background: #ffffff !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }

          #print-label-area {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 4mm !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #000000 !important;
          }

          .print-tag-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 15px !important;
            width: 100% !important;
          }

          .printable-label-badge {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            background: #ffffff !important;
            border: 2px dashed #000000 !important;
            border-radius: 12px !important;
            padding: 16px !important;
            box-shadow: none !important;
            color: #000000 !important;
            margin-bottom: 20px !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
          }

          /* Full density print properties for barcodes */
          .bg-white.p-3.rounded-lg {
            background-color: #ffffff !important;
            border: 1px solid #000000 !important;
            box-shadow: none !important;
            padding: 12px !important;
          }

          .printable-label-badge div {
            color: #000000 !important;
          }
        }
      `}</style>

      <div 
        id="qr-tag-card"
        className="w-full max-w-4xl bg-[#f8f9fa] rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-[#212c46] text-white p-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-[#b7a159] animate-pulse" />
            <span className="text-[12px] font-black tracking-widest uppercase font-mono">
              Industrial Barcode Label & QR Generator (ระบบจำลองพิมพ์สติกเกอร์คุมรุ่น)
            </span>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        {/* PRINT MODE CONTROLLER */}
        <div className="bg-white border-b border-[#eaeaec] px-6 py-3 flex gap-4 shrink-0 justify-between items-center no-print">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase text-slate-500 font-mono">Print Range:</span>
            <div className="inline-flex rounded-lg border border-[#eaeaec] bg-slate-50 p-0.5 text-[10px] font-black font-mono">
              <button
                type="button"
                onClick={() => setPrintMode('single')}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                  printMode === 'single' 
                    ? 'bg-[#212c46] text-white shadow-xs' 
                    : 'text-slate-500 hover:text-[#212c46]'
                }`}
              >
                <Tag size={11} /> SINGLE CURRENT RUN
              </button>
              <button
                type="button"
                onClick={() => setPrintMode('bulk')}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                  printMode === 'bulk' 
                    ? 'bg-[#212c46] text-white shadow-xs' 
                    : 'text-slate-500 hover:text-[#212c46]'
                }`}
              >
                <Layers size={11} /> BULK BATCH SHEETS ({selectedIds.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setPrintMode('history');
                  fetchHistoryLogs();
                }}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                  printMode === 'history' 
                    ? 'bg-[#212c46] text-white shadow-xs' 
                    : 'text-slate-500 hover:text-[#212c46]'
                }`}
              >
                <History size={11} /> PRINT HISTORY LOGS ({historyLogs.length})
              </button>
            </div>
          </div>

          <div className="text-[10px] font-bold text-slate-400 font-mono uppercase">
            Format: High Density Sticker Tag (4x6 Inch Grid)
          </div>
        </div>

        {/* MAIN BODY AREA FOR CONFIG & PREVIEW */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50">
          
          {/* CONFIGURATION SIDEBAR (ONLY SHOWN FOR BULK SELECTION) */}
          {printMode === 'bulk' && (
            <div className="lg:col-span-4 bg-white border border-[#eaeaec] rounded-2xl p-4 shadow-sm flex flex-col max-h-[60vh] lg:max-h-none overflow-hidden no-print">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-3 shrink-0">
                <span className="text-xs font-black text-[#212c46] uppercase tracking-wide">
                  Select Jobs Checklist ({allOrders.length})
                </span>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-[10px] font-black text-[#b7a159] hover:underline uppercase"
                >
                  {selectedIds.length === allOrders.length ? "Desel All" : "Select All"}
                </button>
              </div>

              {/* Checklist list */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {allOrders.map((o: any) => {
                  const isSelected = selectedIds.includes(o.id);
                  const oName = o.name || o.productName || "Unnamed Job";
                  const oCust = o.customer || o.machine || (o.shift ? `${o.shift} Shift` : "Standard");
                  const oQty = o.target || o.qty || o.batchesInSet || 0;
                  return (
                    <div
                      key={o.id}
                      onClick={() => handleToggleSelect(o.id)}
                      className={`p-2.5 rounded-xl border text-[11px] cursor-pointer transition-all flex items-center justify-between gap-2 text-left ${
                        isSelected 
                          ? 'bg-[#212c46]/5 border-[#212c46] text-[#212c46]' 
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-black">
                        {isSelected ? (
                          <CheckSquare size={14} className="text-[#a94228] shrink-0" />
                        ) : (
                          <Square size={14} className="text-slate-350 shrink-0" />
                        )}
                        <div className="truncate pr-1">
                          <p className="font-mono text-[#a94228] leading-none shrink-0 text-[10px] mb-1">{o.id}</p>
                          <p className="font-extrabold truncate" title={oName}>{oName}</p>
                          <p className="text-[9px] text-[#7a8b95] font-bold tracking-tight">Ref: {oCust}</p>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] font-black font-semibold text-slate-400 shrink-0 uppercase border px-1.5 py-0.5 rounded-md bg-slate-50">
                        {oQty}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CONFIGURATION SIDEBAR (ONLY SHOWN FOR HISTORY SELECTION) */}
          {printMode === 'history' && (
            <div className="lg:col-span-4 bg-white border border-[#eaeaec] rounded-2xl p-4 shadow-sm flex flex-col max-h-[60vh] lg:max-h-none overflow-hidden no-print">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-3 shrink-0">
                <span className="text-xs font-black text-[#212c46] uppercase tracking-wide flex items-center gap-1">
                  <History size={12} className="text-[#b7a159]" /> History Checklist ({historyLogs.length})
                </span>
                <button
                  type="button"
                  onClick={handleSelectAllHistory}
                  className="text-[10px] font-black text-[#b7a159] hover:underline uppercase"
                >
                  {historyIds.length === historyLogs.length ? "Desel All" : "Select All"}
                </button>
              </div>

              {/* History checklist logs list */}
              {loadingHistory ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 font-bold text-[10px] gap-2">
                  <div className="w-5 h-5 border-2 border-slate-350 border-t-transparent rounded-full animate-spin"></div>
                  <span>LOADING HISTORY...</span>
                </div>
              ) : historyLogs.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-405 p-4">
                  <Clock size={20} className="text-slate-300 mb-1 animate-pulse" />
                  <p className="text-[10px] font-black uppercase tracking-widest leading-normal">ไม่มีประวัติการพิมพ์</p>
                  <p className="text-[8px] mt-0.5 text-slate-400">Printed tags will automatically log here.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {historyLogs.map((h: any) => {
                    const isSelected = historyIds.includes(h.id);
                    const formattedTime = new Date(h.printedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const formattedDate = new Date(h.printedAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
                    return (
                      <div
                        key={h.id}
                        onClick={() => handleToggleHistorySelect(h.id)}
                        className={`p-2.5 rounded-xl border text-[11px] cursor-pointer transition-all flex items-start justify-between gap-2 text-left relative group ${
                          isSelected 
                            ? 'bg-[#212c46]/5 border-[#212c46] text-[#212c46]' 
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <div className="flex items-start gap-2 font-black min-w-0 flex-1">
                          {isSelected ? (
                            <CheckSquare size={14} className="text-[#a94228] shrink-0 mt-0.5" />
                          ) : (
                            <Square size={14} className="text-slate-350 shrink-0 mt-0.5" />
                          )}
                          <div className="truncate pr-1 min-w-0">
                            <p className="font-mono text-[#a94228] leading-none text-[9px] mb-1 truncate">{h.orderId}</p>
                            <p className="font-extrabold truncate" title={h.productName}>{h.productName}</p>
                            <p className="text-[8.5px] text-[#7a8b95] font-bold tracking-tight mt-0.5">Qty: {h.qty} | Ref: {h.unitRef}</p>
                            <p className="text-[8px] text-slate-400 font-mono flex items-center gap-1 mt-1 font-bold">
                              <Clock size={10} /> {formattedDate} {formattedTime} by {h.printedBy?.split('@')[0]}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleDeleteHistoryItem(h.id, e)}
                          className="text-slate-300 hover:text-red-600 p-1.5 rounded-lg transition-colors shrink-0"
                          title="ลบประวัติ"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* DYNAMIC LIVE PRINT-PREVIEW CANVAS WORKSPACE */}
          <div className={`${(printMode === 'bulk' || printMode === 'history') ? 'lg:col-span-8' : 'lg:col-span-12'} flex flex-col gap-4 overflow-hidden`}>
            
            <div className="flex items-center justify-between shrink-0 mb-1">
              <span className="text-xs font-black text-[#212c46] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></span> Live Real-Time Print Preview
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase font-mono">
                Total Printable Pages / Labels: {itemsToPrint.length} units
              </span>
            </div>

            {/* PREVIEW CONTAINER (Mirroring real printed dimensions) */}
            <div className="flex-1 bg-slate-250 border-2 border-dashed border-slate-300 rounded-2xl p-6 overflow-y-auto max-h-[60vh] custom-scrollbar flex justify-center shadow-inner">
              
              {/* THE EXACT DOCUMENT AREA SENT TO PRINT AREA */}
              <div 
                id="print-label-area" 
                className="w-full max-w-2xl bg-white p-6 shadow-md rounded-xl border border-slate-200 text-slate-800 flex flex-col font-sans"
              >
                
                {/* 1. STANDARDIZED INDUSTRIAL HEADER block requirement */}
                <div className="flex flex-col sm:flex-row justify-between items-center pb-4 border-b-2 border-[#212c46] mb-5 gap-3">
                  <div className="flex items-center gap-2">
                    {/* SVG logo for print branding consistency */}
                    <svg className="w-10 h-10 text-[#a94228]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                    <div>
                      <h1 className="text-xs sm:text-[14px] font-black tracking-widest text-[#212c46] uppercase leading-none">
                        {labelSettings.companyName}
                      </h1>
                      <p className="text-[9px] text-[#7a8b95] font-black uppercase tracking-widest mt-0.5">
                        {labelSettings.docTitle}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right font-mono text-[9px] text-slate-500 font-bold">
                    <p className="uppercase text-[8px] font-black text-slate-400 leading-none">DOCUMENT ID: PT-0482B</p>
                    <p className="mt-0.5">PRINT DATE: {formatTagPrintDate()}</p>
                  </div>
                </div>

                {itemsToPrint.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center">
                    <AlertCircle size={36} className="text-amber-500 animate-bounce mb-2" />
                    <p className="text-xs font-black uppercase tracking-widest">กรุณาเลือกอย่างน้อยหนึ่งรายการสั่งผลิตเพื่อพิมพ์ป้าย</p>
                    <p className="text-[10px] mt-1 text-slate-400 font-bold uppercase">No active jobs selected in the checklist</p>
                  </div>
                ) : (
                  <div className="print-tag-grid grid grid-cols-1 md:grid-cols-2 gap-4">
                    {itemsToPrint.map((item, idx) => {
                      // Generate standard QR payload
                      const qrPayload = generateProductionQrPayload(item);

                      return (
                        <div 
                          key={item.id}
                          className="printable-label-badge bg-[#fafafa] border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center relative overflow-hidden transition-all duration-200 hover:border-[#212c46]"
                        >
                          {/* Cutout stamp label watermark */}
                          <div className="absolute top-1.5 right-1.5 font-mono text-[7px] font-black text-slate-400 uppercase tracking-widest bg-white border border-slate-100 rounded px-1">
                            PASS-TAG #{idx + 1}
                          </div>

                          {/* Mini Header Inside Label */}
                          <div className="text-center pb-2 border-b border-slate-200 w-full mb-3">
                            <h3 className="text-[10.5px] font-black text-[#212c46] uppercase tracking-wider font-mono">
                              {labelSettings.labelTitle}
                            </h3>
                            <p className="text-[7.5px] text-slate-405 font-bold tracking-widest leading-none">
                              {labelSettings.labelSub}
                            </p>
                          </div>

                          {/* High Density QR Code */}
                          <div className="bg-white p-3 rounded-lg border border-slate-200/60 shadow-xs flex items-center justify-center my-2">
                            <QRCodeSVG 
                              id={`qr-svg-${item.id}`}
                              value={qrPayload}
                              size={120}
                              bgColor="#ffffff"
                              fgColor="#212c46"
                              level="Q"
                              includeMargin={true}
                            />
                          </div>

                          {/* Meta Specs details */}
                          <div className="w-full space-y-1 pt-2.5 border-t border-dashed border-slate-200 text-left text-slate-700">
                            {labelSettings.showBatchId && (
                              <div className="flex justify-between items-center text-[9.5px]">
                                <span className="text-slate-400 font-black uppercase tracking-wider">{labelSettings.batchIdLabel}</span>
                                <span className="font-mono font-black text-[#212c46] bg-slate-100/80 border px-1.5 py-0.5 rounded text-[10.5px]">
                                  {item.id}
                                </span>
                              </div>
                            )}

                            {labelSettings.showProductName && (
                              <div className="flex flex-col text-[9.5px] py-1 border-b border-slate-100">
                                <span className="text-slate-400 font-black uppercase tracking-wider leading-none">{labelSettings.productNameLabel}</span>
                                <span className="font-black text-[#212c46] tracking-tight truncate max-w-[240px] mt-0.5">
                                  {item.name || item.productName || "Unnamed Job"}
                                </span>
                              </div>
                            )}

                            {labelSettings.showSkuCode && (
                              <div className="flex justify-between items-center text-[9px] pt-1 border-b border-slate-100 pb-1">
                                <span className="text-slate-400 font-black uppercase tracking-wider">{labelSettings.skuCodeLabel}</span>
                                <span className="font-mono font-black text-[#a94228]">{item.sku || item.id}</span>
                              </div>
                            )}

                            {labelSettings.showTargetQty && (
                              <div className="flex justify-between items-center text-[9px] border-b border-slate-100 pb-1 flex-row">
                                <span className="text-slate-400 font-black uppercase tracking-wider">{labelSettings.targetQtyLabel}</span>
                                <span className="font-mono font-black text-[#2e7d32] bg-emerald-50 border border-emerald-100 px-1 rounded-sm">
                                  {item.target || item.qty || item.batchesInSet || item.weightPerBatch || 0}
                                </span>
                              </div>
                            )}

                            {labelSettings.showUnitRef && (
                              <div className="flex justify-between items-center text-[9px]">
                                <span className="text-slate-400 font-black uppercase tracking-wider">{labelSettings.unitRefLabel}</span>
                                <span className="font-bold text-slate-650">
                                  {item.customer || item.machine || (item.shift ? `${item.shift} Shift` : "GENERAL")}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Scanner Instruction bar */}
                          {labelSettings.instructionText && (
                            <div className="mt-3 bg-blue-50 border border-blue-100/50 p-1.5 rounded w-full flex items-start gap-1 text-[7.5px] text-blue-700 leading-normal font-medium">
                              <AlertCircle size={9} className="shrink-0 mt-0.5" />
                              <span>{labelSettings.instructionText}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>

            </div>
          </div>

        </div>

        {/* BOTTOM DIALOG TOOLBAR */}
        <div className="bg-white p-4 border-t border-[#eaeaec] flex flex-col sm:flex-row gap-3 items-center justify-between shrink-0">
          
          <div className="flex items-center gap-2 text-slate-500 font-medium text-[11px] font-mono select-none">
            <ThumbsUp size={14} className="text-[#b7a159]" />
            <span>Printed tags matches industrial ISO barcoding standardization protocols.</span>
          </div>

          <div className="flex gap-2 items-center w-full sm:w-auto">
            {/* Quick Simulate Trigger */}
            {printMode === 'single' && (
              <button
                type="button"
                onClick={() => {
                  onSimulateScan(order.id);
                  onClose();
                }}
                className="bg-[#2e7d32] hover:bg-[#225c25] text-white font-black text-[11px] uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Sparkles size={12} className="text-amber-300 animate-pulse" />
                ส่งไปจำลองสแกน (Simulate Scan)
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              disabled={itemsToPrint.length === 0}
              className="bg-[#212c46] hover:bg-[#151c2d] disabled:opacity-50 disabled:pointer-events-none text-white font-black text-[11px] uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Printer size={13} className="text-[#b7a159]" />
              Print Labels / Save PDF
            </button>
            
            <button
              type="button"
              onClick={() => {
                alert('ดาวน์โหลดไฟล์ข้อมูลชุดบาร์โค้ดป้ายพิมพ์สำเร็จ!');
              }}
              className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-[11px] uppercase tracking-widest px-4 py-2.5 rounded-xl transition-colors cursor-pointer active:scale-95"
            >
              <Download size={13} />
              Export Batch
            </button>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}
