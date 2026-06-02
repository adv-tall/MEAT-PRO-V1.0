import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import * as Icons from 'lucide-react';
import { UserGuidePanel } from '@/src/components/shared/UserGuidePanel';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';
import KpiCard from '../../components/shared/KpiCard';

// --- Placeholder for external libraries ---
const Swal = typeof window !== 'undefined' ? (window as any).Swal || null : null;
const Papa = typeof window !== 'undefined' ? (window as any).Papa || null : null;

const CATEGORIES = ['All', 'Batter', 'SFG', 'FG', 'Sausage', 'Meatball', 'Bologna', 'Ham', 'Sliced', 'Loaf', 'NPD'];
const BRANDS = ['AFM', 'CJ', 'ARO', 'MAKRO', 'Betagro', 'Generic', 'No Brand', 'Internal', 'Test'];

const THEME = {
    primary: '#212c46', // Matched with Sidebar bg
    accent: '#dc2626', // Updated to match Sidebar active Red
    bg: '#ffffff',
    card: '#FFFFFF',
    border: '#E2E8F0',
    info: '#3B82F6'
};

// --- Data Generation ---
const generateFullMasterItems = () => {
    const items = [];
    const todayStr = new Date().toLocaleDateString('en-GB');
    const rawData = [
        // Batters
        { sku: 'BAT-001', name: 'เนื้อไส้กรอกไก่ Standard', type: 'Batter', cat: 'Batter', brand: '', w: 0, pieces: 0 },
        { sku: 'BAT-002', name: 'เนื้อไส้กรอกไก่พริกไทยดำ', type: 'Batter', cat: 'Batter', brand: '', w: 0, pieces: 0 },
        { sku: 'BAT-003', name: 'เนื้อลูกชิ้นไก่ Grade A', type: 'Batter', cat: 'Batter', brand: '', w: 0, pieces: 0 },
        { sku: 'BAT-005', name: 'เนื้อโบโลน่าไก่พริก', type: 'Batter', cat: 'Batter', brand: '', w: 0, pieces: 0 },
        
        // SFGs
        { sku: 'SFG-001', name: 'ไส้กรอกไก่รมควัน 6 นิ้ว (จัมโบ้)', type: 'SFG', cat: 'SFG', brand: '', w: 0, pieces: 0 },
        { sku: 'SFG-002', name: 'ไส้กรอกไก่คอกเทล 4 นิ้ว', type: 'SFG', cat: 'SFG', brand: '', w: 0, pieces: 0 },
        { sku: 'SFG-006', name: 'โบโลน่าไก่พริก (แท่งยาว)', type: 'SFG', cat: 'SFG', brand: '', w: 0, pieces: 0 },
        
        // FGs
        { sku: 'FG-1001', name: 'ไส้กรอกไก่จัมโบ้ ARO 1kg', type: 'FG', cat: 'Sausage', brand: 'ARO', w: 1000, pieces: 20, status: 'Active', updated: '01/02/2026' },
        { sku: 'FG-1002', name: 'ไส้กรอกไก่จัมโบ้ MAKRO 500g', type: 'FG', cat: 'Sausage', brand: 'MAKRO', w: 500, pieces: 10, status: 'Active', updated: '15/01/2026' },
        { sku: 'FG-1003', name: 'ไส้กรอกไก่จัมโบ้ (ถุงใส)', type: 'FG', cat: 'Sausage', brand: 'No Brand', w: 5000, pieces: 100, status: 'Active', updated: '20/01/2026' },
        { sku: 'FG-2001', name: 'ไส้กรอกคอกเทล ARO 1kg', type: 'FG', cat: 'Sausage', brand: 'ARO', w: 1000, pieces: 80, status: 'Active', updated: '01/02/2026' },
        { sku: 'FG-2002', name: 'ไส้กรอกคอกเทล Betagro 500g', type: 'FG', cat: 'Sausage', brand: 'Betagro', w: 500, pieces: 40, status: 'Active', updated: '10/01/2026' },
        { sku: 'FG-3001', name: 'ลูกชิ้นหมู ARO 1kg', type: 'FG', cat: 'Meatball', brand: 'ARO', w: 1000, pieces: 100, status: 'Active', updated: '05/02/2026' },
        { sku: 'FG-3002', name: 'ลูกชิ้นหมู CJ 500g', type: 'FG', cat: 'Meatball', brand: 'CJ', w: 500, pieces: 50, status: 'Active', updated: '05/02/2026' },
        { sku: 'FG-3005', name: 'ลูกชิ้นปลาเยาวราช 500g', type: 'FG', cat: 'Meatball', brand: 'Generic', w: 500, pieces: 45, status: 'Inactive', updated: '12/12/2025' },
        { sku: 'FG-3010', name: 'ลูกชิ้นหมูปิ้ง AFM (แพ็ค 10 ไม้)', type: 'FG', cat: 'Meatball', brand: 'AFM', w: 800, pieces: 10, status: 'Active', updated: '02/02/2026' },
        { sku: 'FG-4001', name: 'โบโลน่าพริก MAKRO 1kg (Sliced)', type: 'FG', cat: 'Bologna', brand: 'MAKRO', w: 1000, pieces: 50, status: 'Active', updated: '28/01/2026' },
        { sku: 'FG-4002', name: 'โบโลน่าพริก Betagro 200g (Sliced)', type: 'FG', cat: 'Bologna', brand: 'Betagro', w: 200, pieces: 10, status: 'Active', updated: '28/01/2026' },
        { sku: 'FG-4005', name: 'แซนวิชแฮม 500g (Sliced)', type: 'FG', cat: 'Ham', brand: 'ARO', w: 500, pieces: 25, status: 'Active', updated: '18/01/2026' }
    ];
    rawData.forEach((item, index) => {
        items.push({ id: `item-${index}`, status: item.status || 'Active', updated: item.updated || todayStr, ...item });
    });
    return items;
};

const getMockHistory = () => [
    { date: '01/02/2026 14:30', user: 'Admin', action: 'Update', detail: 'Changed status to Active' },
    { date: '28/01/2026 09:15', user: 'Prod. Manager', action: 'Update', detail: 'Adjusted size configurations' },
    { date: '10/01/2026 11:00', user: 'Admin', action: 'Create', detail: 'Initial creation of item' },
];

const getCategoryStyle = (category: string) => {
    switch (category?.toUpperCase()) {
        case 'SAUSAGE': return 'bg-white text-rose-600 border-rose-200 shadow-sm';
        case 'MEATBALL': return 'bg-white text-emerald-600 border-emerald-200 shadow-sm';
        case 'BOLOGNA': return 'bg-white text-amber-600 border-amber-200 shadow-sm';
        case 'HAM': return 'bg-white text-blue-600 border-blue-200 shadow-sm';
        case 'SLICED': return 'bg-white text-indigo-600 border-indigo-200 shadow-sm';
        case 'LOAF': return 'bg-white text-fuchsia-600 border-fuchsia-200 shadow-sm';
        case 'NPD': return 'bg-white text-slate-600 border-slate-200 shadow-sm';
        default: return 'bg-white text-slate-500 border-slate-200';
    }
};

const getStatusStyle = (status: string) => {
    switch (status?.toUpperCase()) {
        case 'ACTIVE': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
        case 'INACTIVE': return 'bg-slate-50 text-slate-500 border-slate-200';
        case 'DRAFT': return 'bg-amber-50 text-amber-600 border-amber-200';
        default: return 'bg-white text-slate-400 border-slate-200';
    }
};

const kebabToPascal = (str: string) => str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
const LucideIcon = ({ name, size = 16, className = "", color, style, strokeWidth = 2 }: any) => {
    if (!name) return null;
    const pascalName = kebabToPascal(name);
    const IconComponent = (Icons as any)[pascalName] || (Icons as any)[`${pascalName}Icon`] || Icons.CircleHelp;
    if (!IconComponent) return null;
    return <IconComponent size={size} className={className} style={{...style, color: color}} strokeWidth={strokeWidth} />;
};


function CsvUploadModal({ isOpen, onClose, onUpload }: any) {
    const [dragActive, setDragActive] = useState(false);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleDrag = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.type === "dragenter" || e.type === "dragover") setDragActive(true); else setDragActive(false); };
    const handleDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); if (e.dataTransfer.files && e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]); };
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) processFile(e.target.files[0]); };
    
    const processFile = (file: File) => {
        setError(null);
        if(!Papa) { setError("CSV Parser (PapaParse) ไม่ได้โหลดในระบบ แนะนำให้ป้อนข้อมูลแบบแมนนวล"); return; }
        Papa.parse(file, { header: true, skipEmptyLines: true, complete: function (results: any) {
            if (results.errors.length > 0) { setError("Error parsing CSV: " + results.errors[0].message); return; }
            const requiredHeaders = ["SKU", "Name", "Category", "Brand", "Weight", "Pieces", "Status"];
            const headers = results.meta.fields;
            const missing = requiredHeaders.filter((h: string) => !headers.includes(h));
            if (missing.length > 0) { setError(`Missing columns: ${missing.join(", ")}`); return; }
            setPreviewData(results.data);
        }});
    };

    const confirmUpload = () => {
        const newData = previewData.map(row => ({
            sku: row.SKU,
            name: row.Name,
            cat: row.Category,
            type: 'FG', 
            brand: row.Brand,
            w: parseFloat(row.Weight) || 0,
            pieces: parseInt(row.Pieces) || 0,
            status: row.Status || 'Active',
            updated: new Date().toLocaleDateString('en-GB'),
            id: `imported-${Date.now()}-${Math.random()}`
        }));
        
        onUpload(newData);
        onClose();
        setPreviewData([]);
        setError(null);
        if(Swal) Swal.fire({ icon: 'success', title: 'Imported!', text: 'Data has been successfully imported.', timer: 1500, showConfirmButton: false });
    };

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn font-sans">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] border border-white/40" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-[#212c46] text-white">
                    <h3 className="font-black flex items-center gap-2 uppercase tracking-widest text-sm"><LucideIcon name="upload-cloud" /> Import Bulk CSV</h3>
                    <button onClick={onClose} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors"><LucideIcon name="x" /></button>
                </div>
                <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
                    {!previewData.length ? (
                        <div className={`border-2 border-dashed rounded-xl p-10 text-center transition-all bg-slate-50 ${dragActive ? 'border-red-500 bg-red-50' : 'border-slate-300'}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-500"><LucideIcon name="file-spreadsheet" size={32} /></div>
                            <p className="text-[#212c46] font-black mb-2 uppercase tracking-widest text-[12px]">Drag & Drop CSV file here</p>
                            <p className="text-slate-500 text-[10px] mb-6">Or click the button below to browse</p>
                            <button onClick={() => fileInputRef.current?.click()} className="bg-slate-800 text-white hover:bg-slate-900 shadow-md font-bold text-xs uppercase tracking-widest rounded-xl transition-all px-6 py-2.5">Browse File</button>
                            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleChange} />
                        </div>
                    ) : (
                        <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-[300px] custom-scrollbar shadow-inner text-[12px]">
                            <h4 className="font-bold text-[#212c46] mb-3 px-4 pt-4 flex justify-between items-center">
                                <span>Preview Data ({previewData.length} rows)</span>
                                <button onClick={() => setPreviewData([])} className="text-[10px] text-red-600 font-bold uppercase tracking-widest bg-red-50 px-2 py-1 rounded">Clear</button>
                            </h4>
                            <table className="w-full text-left whitespace-nowrap">
                                <thead className="bg-[#212c46] text-white sticky top-0 z-10 text-[10px] uppercase font-bold tracking-widest">
                                    <tr>
                                        <th className="p-3">SKU</th>
                                        <th className="p-3">Name</th>
                                        <th className="p-3">Category</th>
                                        <th className="p-3">Brand</th>
                                        <th className="p-3 text-right">Weight</th>
                                        <th className="p-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {previewData.slice(0, 10).map((row, i) => (
                                        <tr key={i} className="hover:bg-slate-50 text-[12px]">
                                            <td className="p-3 font-mono font-bold text-red-600">{row.SKU || '-'}</td>
                                            <td className="p-3 text-[#212c46] font-bold">{row.Name || '-'}</td>
                                            <td className="p-3 text-slate-500">{row.Category || '-'}</td>
                                            <td className="p-3 text-slate-400">{row.Brand || '-'}</td>
                                            <td className="p-3 text-[#212c46] font-mono text-right">{row.Weight || '-'}</td>
                                            <td className="p-3 text-center">{row.Status || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {previewData.length > 10 && <div className="p-3 text-center text-[10px] text-slate-500 bg-slate-50 font-bold uppercase tracking-widest border-t border-slate-200">Showing first 10 rows of {previewData.length} records...</div>}
                        </div>
                    )}
                    {error && <div className="mt-4 p-3 bg-red-50 text-red-600 font-bold text-[12px] rounded-lg border border-red-100 flex items-center gap-2"><LucideIcon name="alert-circle" size={16}/> {error}</div>}
                </div>
                {previewData.length > 0 && (
                    <div className="p-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50 shrink-0">
                        <button onClick={onClose} className="px-6 py-2.5 text-slate-500 hover:text-slate-800 font-bold text-[10px] uppercase tracking-widest transition-colors">Cancel</button>
                        <button onClick={confirmUpload} className="bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-md font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all px-8 py-2.5 flex items-center gap-2">
                            <LucideIcon name="check" size={14} color="white" /> Confirm Upload
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function ItemModal({ isOpen, onClose, data, onSave, categories, brands, activeMainTab }: any) {
    const [activeTab, setActiveTab] = useState('info');
    const [formData, setFormData] = useState<any>({
        sku: '', name: '', cat: '', type: 'FG', brand: '', w: 0, pieces: 0, status: 'Active'
    });
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            setActiveTab('info');
            if (data) {
                setFormData({ ...data });
                setHistory(getMockHistory());
            } else {
                setFormData({ sku: '', name: '', type: activeMainTab, cat: categories[1], brand: brands[0], w: 0, pieces: 0, status: 'Active' });
                setHistory([]);
            }
        }
    }, [isOpen, data, activeMainTab, categories, brands]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!formData.sku || !formData.name) {
            if(Swal) Swal.fire({ icon: 'error', title: 'Error', text: 'SKU and Name are required.' });
            else alert('SKU and Name are required.');
            return;
        }
        onSave(formData);
        onClose();
    };

    const isFinishedGood = formData.type === 'FG';

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn font-sans">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden relative border border-white/40 h-[85vh] md:h-auto" onClick={e => e.stopPropagation()}>
                <div className="bg-[#212c46] px-8 py-5 flex justify-between items-center shrink-0 border-b border-[#212c46]">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/20">
                            <LucideIcon name={data ? "edit-3" : "plus-circle"} size={20} color="white" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-widest leading-none">{data ? 'Edit Master Item' : 'New Master Item'}</h3>
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1.5">{data ? formData.sku : `Create new ${activeMainTab} record`}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/50 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-1.5 rounded-lg"><LucideIcon name="x" size={20} color="white" /></button>
                </div>
                
                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar Tabs */}
                    <div className="w-48 bg-slate-50 border-r border-slate-200 p-5 flex flex-col gap-3 shrink-0">
                        <button onClick={()=>setActiveTab('info')} className={`w-full p-4 rounded-xl text-left transition-all ${activeTab==='info'?'bg-[#212c46] text-white shadow-md':'text-slate-500 hover:bg-white hover:shadow-sm'}`}>
                            <div className="text-[12px] font-black uppercase tracking-tight flex items-center gap-2"><LucideIcon name="info" size={14}/> General Info</div>
                        </button>
                        {data && (
                            <button onClick={()=>setActiveTab('history')} className={`w-full p-4 rounded-xl text-left transition-all ${activeTab==='history'?'bg-[#212c46] text-white shadow-md':'text-slate-500 hover:bg-white hover:shadow-sm'}`}>
                                <div className="text-[12px] font-black uppercase tracking-tight flex items-center gap-2"><LucideIcon name="history" size={14}/> History Log</div>
                            </button>
                        )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-white">
                        {activeTab === 'info' ? (
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">SKU Code</label>
                                    <input type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} disabled={!!data} className="sys-input font-mono font-bold w-full" placeholder="Ex. FG-1001" />
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Status</label>
                                    <div className="relative">
                                        <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="sys-input w-full appearance-none pr-10 cursor-pointer">
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                            <option value="Draft">Draft</option>
                                        </select>
                                        <Icons.ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Item Name</label>
                                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="sys-input w-full" placeholder="Enter product name..." />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Category / Sub-Cat</label>
                                    <div className="relative">
                                        <select value={formData.cat} onChange={e => setFormData({...formData, cat: e.target.value})} className="sys-input w-full appearance-none pr-10 cursor-pointer">
                                            {categories.filter((c: string) => c !== 'All').map((c: string) => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        <Icons.ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                                
                                {isFinishedGood && (
                                    <>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Brand</label>
                                            <div className="relative">
                                                <input type="text" list="brandsList" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="sys-input w-full" placeholder="Select or Type..." />
                                                <datalist id="brandsList">
                                                    {brands.map((b: string) => <option key={b} value={b} />)}
                                                </datalist>
                                                <Icons.ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Weight (g)</label>
                                            <input type="number" step="0.1" value={formData.w} onChange={e => setFormData({...formData, w: parseFloat(e.target.value)})} className="sys-input w-full font-mono" placeholder="e.g. 500, 1000" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Pieces / Pack</label>
                                            <input type="number" value={formData.pieces} onChange={e => setFormData({...formData, pieces: parseInt(e.target.value)})} className="sys-input w-full font-mono" placeholder="e.g. 10, 50" />
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
                                    <h4 className="text-[12px] font-black text-[#212c46] uppercase tracking-widest">Change Log</h4>
                                    <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md uppercase tracking-widest">{history.length} records</span>
                                </div>
                                <div className="relative border-l-2 border-slate-200 ml-3 space-y-4">
                                    {history.map((log, idx) => (
                                        <div key={idx} className="ml-5 relative">
                                            <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-slate-300 border-2 border-white shadow-sm"></div>
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className={`font-black text-[11px] uppercase tracking-widest px-2 py-0.5 rounded-md ${log.action === 'Create' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{log.action}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono font-bold">{log.date}</span>
                                                </div>
                                                <p className="text-[#212c46] text-[12px] mb-2 font-bold">{log.detail}</p>
                                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-widest border-t border-slate-200 pt-2">
                                                    <LucideIcon name="user" size={12} /> <span>{log.user}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-5 bg-white border-t border-slate-200 flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-6 py-2.5 text-slate-500 hover:text-[#212c46] font-bold text-[10px] uppercase tracking-widest transition-colors">Cancel</button>
                    <button onClick={handleSave} className="sys-btn-primary px-8 py-2.5 flex items-center gap-2"><LucideIcon name="save" size={14} color="white"/> Save Item</button>
                </div>
            </div>
        </div>
    );
}

export default function MasterItems() {
    const [items, setItems] = useState<any[]>(generateFullMasterItems());
    const [searchTerm, setSearchTerm] = useState('');
    const [activeMainTab, setActiveMainTab] = useState('FG');
    const [activeCategory, setActiveCategory] = useState('All');
    const [activeBrand, setActiveBrand] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
    const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    
    // Modal states
    const [csvModalOpen, setCsvModalOpen] = useState(false);
    const [itemModal, setItemModal] = useState<{isOpen: boolean, data: any}>({ isOpen: false, data: null });

    const activeItemsCount = items.filter(i => i.status === 'Active').length;
    const catCount = new Set(items.map(i => i.cat).filter(c => c)).size;
    const brandCount = new Set(items.map(i => i.brand).filter(b => b)).size;

    const filteredData = useMemo(() => {
        return items.filter(item => {
            const matchSearch = (item.sku + item.name + item.brand).toLowerCase().includes(searchTerm.toLowerCase());
            const matchTab = item.type === activeMainTab;
            const matchCat = activeCategory === 'All' || item.cat === activeCategory;
            const matchBrand = activeBrand === 'All' || item.brand === activeBrand;
            return matchSearch && matchTab && matchCat && matchBrand;
        });
    }, [items, searchTerm, activeMainTab, activeCategory, activeBrand]);

    useEffect(() => { 
        setCurrentPage(1); 
        setActiveCategory('All'); 
        setActiveBrand('All');
    }, [searchTerm, activeMainTab]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const paginatedData = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const handleDelete = (sku: string) => {
        if(Swal) {
            Swal.fire({
                title: 'Are you sure?', text: `Delete item ${sku}?`, icon: 'warning', showCancelButton: true, confirmButtonColor: THEME.accent, confirmButtonText: 'Yes, delete it!'
            }).then((result: any) => {
                if (result.isConfirmed) {
                    setItems(prev => prev.filter(item => item.sku !== sku));
                    Swal.fire({icon: 'success', title: 'Deleted!', text: 'Item has been deleted.', timer: 1500, showConfirmButton: false});
                }
            });
        } else {
            if(window.confirm(`Are you sure you want to delete ${sku}?`)) {
                setItems(prev => prev.filter(item => item.sku !== sku));
            }
        }
    };

    const handleSaveItem = (newItem: any) => {
        if (itemModal.data) {
            setItems(items.map(item => item.sku === newItem.sku ? { ...newItem, updated: new Date().toLocaleDateString('en-GB') } : item));
        } else {
            setItems([{ ...newItem, id: `item-${Date.now()}`, updated: new Date().toLocaleDateString('en-GB') }, ...items]);
        }
        if(Swal) Swal.fire({ icon: 'success', title: 'Saved Successfully', showConfirmButton: false, timer: 1000 });
    };

    const handleCsvUpload = (newItems: any[]) => {
        const updatedItems = [...items];
        newItems.forEach(newItem => {
            const idx = updatedItems.findIndex(i => i.sku === newItem.sku);
            if (idx >= 0) { updatedItems[idx] = newItem; } 
            else { updatedItems.push(newItem); }
        });
        setItems(updatedItems);
    };

    return (
        <div className="flex flex-1 w-full flex-col animate-fadeIn bg-transparent space-y-4">
            <button onClick={() => setIsGuideOpen(true)} className="fixed right-0 top-[80px] bg-[#f8f9fa] border border-[#eaeaec] border-r-0 text-[#212c46] py-8 px-1.5 rounded-l-xl shadow-md hover:bg-[#932c2e] hover:text-white hover:border-[#932c2e] transition-all duration-500 z-[100] flex flex-col items-center gap-4 group">
                <Icons.HelpCircle size={18} className="shrink-0 group-hover:rotate-12 transition-transform text-[#7a8b95] group-hover:text-white" />
                <span className="font-black tracking-[0.3em] [writing-mode:vertical-rl] rotate-180 whitespace-nowrap uppercase text-[11px]">USER GUIDE</span>
            </button>
            <UserGuidePanel isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
            
            <CsvUploadModal isOpen={csvModalOpen} onClose={() => setCsvModalOpen(false)} onUpload={handleCsvUpload} />
            <ItemModal 
                isOpen={itemModal.isOpen} 
                onClose={() => setItemModal({ isOpen: false, data: null })} 
                data={itemModal.data} 
                onSave={handleSaveItem} 
                categories={CATEGORIES}
                brands={BRANDS}
                activeMainTab={activeMainTab}
            />

            {/* Header Bar */}
            <div className="h-14 px-8 flex flex-row items-center justify-between gap-4 z-20 shrink-0">
                <div className="flex items-center gap-5">
                    <div className="relative flex items-center justify-center group cursor-default shrink-0">
                        <div className="absolute inset-0 bg-[#932c2e] blur-[15px] opacity-20 rounded-full group-hover:opacity-60 transition-all duration-700"></div>
                        <div className="relative z-10 p-1.5 border border-[#932c2e]/40 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm">
                            <Icons.Database size={28} strokeWidth={2.5} className="text-[#932c2e]" />
                        </div>
                    </div>
                    <div>
                        <h3 className="font-black text-[#212c46] uppercase tracking-tighter leading-none font-exception-header" style={{ fontSize: '24px' }}>
                            MASTER ITEM <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#932c2e] to-[#d96245]">DATABASE</span>
                        </h3>
                        <p className="text-[11px] font-bold text-[#7a8b95] uppercase tracking-[0.2em] mt-0.5 opacity-80 leading-none">
                            CENTRALIZED MATERIAL & PRODUCT HUB
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="bg-white/50 p-1.5 rounded-xl border border-white/60 shadow-inner flex flex-wrap items-center gap-1">
                        {['Batter', 'SFG', 'FG'].map(t => (
                            <button 
                                key={t} 
                                onClick={() => setActiveMainTab(t)} 
                                className={`px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                                    activeMainTab === t ? 'bg-[#212c46] text-white shadow-md' : 'text-[#7a8b95] hover:text-[#a94228]'
                                }`}
                            >
                                {t === 'Batter' && <Icons.Beaker size={16} />}
                                {t === 'SFG' && <Icons.Layers size={16} />}
                                {t === 'FG' && <Icons.Package size={16} />}
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-[1532px] mx-auto px-4 sm:px-8 w-full mt-[2px]">
                {/* KPI STATS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 shrink-0">
                    <KpiCard label="Total Items" value={items.length} icon="package" colorAccent="#4d87a8" colorValue={THEME.primary} desc="Registered Master Items" />
                    <KpiCard label="Active Items" value={activeItemsCount} icon="check-circle" colorAccent="#2e7d32" colorValue={THEME.primary} desc="In Service" />
                    <KpiCard label="Categories" value={catCount} icon="layers" colorAccent={THEME.accent} colorValue={THEME.primary} desc="Product Groups" />
                    <KpiCard label="Brands" value={brandCount} icon="tag" colorAccent="#f59e0b" colorValue={THEME.primary} desc="Tracked Brands" />
                </div>

                <div className="w-full flex-1 flex flex-col min-h-[500px]">
                    <div className="sys-table-card border-[#eaeaec] flex flex-col flex-1 shadow-lg bg-white overflow-hidden rounded-3xl border">
                    
                    {/* TOOLBAR */}
                    <div className="sys-table-toolbar border-b border-slate-200 bg-white">
                        
                        {/* Left Side: Filters & Search */}
                        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                            {/* Category Dropdown Filter */}
                            <div className="relative">
                                <button onClick={() => { setIsCatDropdownOpen(!isCatDropdownOpen); setIsBrandDropdownOpen(false); }} className="flex items-center justify-between gap-2.5 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-xl transition-colors h-10 border border-slate-200 shadow-sm w-full sm:w-auto min-w-[140px]">
                                    <div className="flex items-center gap-2">
                                        <Icons.List size={16} className="text-red-700" strokeWidth={2.5} />
                                        <span className="font-black text-[12px] text-[#212c46] uppercase tracking-widest">CAT: {activeCategory}</span>
                                    </div>
                                    <span className="bg-slate-100 text-slate-500 font-mono font-black text-[11px] min-w-[20px] px-1.5 h-5 rounded-md flex items-center justify-center border border-slate-200 shadow-sm ml-2">
                                        {activeCategory === 'All' ? items.filter(i => i.type === activeMainTab).length : items.filter(i => i.type === activeMainTab && i.cat === activeCategory).length}
                                    </span>
                                </button>
                                {isCatDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsCatDropdownOpen(false)}></div>
                                        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 shadow-lg rounded-xl overflow-hidden z-50 py-1">
                                            {CATEGORIES.map(cat => {
                                                const count = items.filter(item => item.type === activeMainTab && (cat === 'All' || item.cat === cat)).length;
                                                if (count === 0 && cat !== 'All') return null; // Hide empty categories dynamically
                                                return (
                                                    <button key={cat} onClick={() => { setActiveCategory(cat); setIsCatDropdownOpen(false); }} className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-50 transition-colors text-left">
                                                        <span className={`text-[11px] font-bold uppercase tracking-widest ${activeCategory === cat ? 'text-red-700' : 'text-slate-500'}`}>{cat}</span>
                                                        <span className="bg-slate-100/50 text-slate-400 font-mono font-black text-[9px] px-1.5 py-0.5 rounded-md border border-slate-200">{count}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Brand Dropdown Filter */}
                            <div className="relative">
                                <button onClick={() => { setIsBrandDropdownOpen(!isBrandDropdownOpen); setIsCatDropdownOpen(false); }} className="flex items-center justify-between gap-2.5 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-xl transition-colors h-10 border border-slate-200 shadow-sm w-full sm:w-auto min-w-[140px]">
                                    <div className="flex items-center gap-2">
                                        <Icons.Tag size={16} className="text-emerald-600" strokeWidth={2.5} />
                                        <span className="font-black text-[12px] text-[#212c46] uppercase tracking-widest">BRD: {activeBrand}</span>
                                    </div>
                                    <span className="bg-slate-100 text-slate-500 font-mono font-black text-[11px] min-w-[20px] px-1.5 h-5 rounded-md flex items-center justify-center border border-slate-200 shadow-sm ml-2">
                                        {activeBrand === 'All' ? items.filter(i => i.type === activeMainTab).length : items.filter(i => i.type === activeMainTab && i.brand === activeBrand).length}
                                    </span>
                                </button>
                                {isBrandDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsBrandDropdownOpen(false)}></div>
                                        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 shadow-lg rounded-xl overflow-hidden z-50 py-1">
                                            {['All', ...BRANDS].map(brand => {
                                                const count = items.filter(item => item.type === activeMainTab && (brand === 'All' || item.brand === brand)).length;
                                                if (count === 0 && brand !== 'All') return null; // Hide empty brands dynamically
                                                return (
                                                    <button key={brand} onClick={() => { setActiveBrand(brand); setIsBrandDropdownOpen(false); }} className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-50 transition-colors text-left">
                                                        <span className={`text-[11px] font-bold uppercase tracking-widest ${activeBrand === brand ? 'text-emerald-600' : 'text-slate-500'}`}>{brand}</span>
                                                        <span className="bg-slate-100/50 text-slate-400 font-mono font-black text-[9px] px-1.5 py-0.5 rounded-md border border-slate-200">{count}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="relative flex-1 sm:w-64">
                                <Icons.Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                                <input type="text" placeholder={`Search ${activeMainTab}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="sys-input w-full pl-10 pr-4 py-2 h-10" />
                            </div>
                        </div>

                        {/* Right Side: Action Buttons */}
                        <div className="flex gap-3 w-full xl:w-auto mt-4 xl:mt-0">
                            <button onClick={() => setCsvModalOpen(true)} className="flex-1 md:flex-none justify-center bg-white border border-slate-200 hover:border-slate-300 text-slate-500 px-4 py-2 rounded-xl font-bold text-[12px] uppercase tracking-widest flex items-center gap-2 shadow-sm transition-colors h-10 hover:text-[#212c46]"><Icons.Upload size={14} /> Import</button>
                            <button onClick={() => setItemModal({ isOpen: true, data: null })} className="sys-btn-primary flex-1 md:flex-none h-10 whitespace-nowrap">
                                <Icons.Plus size={16} fill="none" color="white" /> New {activeMainTab}
                            </button>
                        </div>
                    </div>

                    {/* TABLE */}
                    <div className="flex-1 overflow-auto flex flex-col bg-white">
                        <div className="overflow-y-auto flex-1 custom-scrollbar">
                            <table className="w-full text-left min-w-[1050px] border-collapse relative font-sans">
                                <thead className="sys-table-header bg-[#212c46] text-white border-slate-200">
                                    <tr>
                                        <th className="pl-6 w-[14%] whitespace-nowrap">SKU / Code</th>
                                        <th className="w-[30%] whitespace-nowrap">Item Name</th>
                                        <th className="w-[12%] whitespace-nowrap">Category</th>
                                        <th className="w-[10%] whitespace-nowrap">Brand</th>
                                        <th className="w-[12%] text-right whitespace-nowrap">Size</th>
                                        <th className="w-[10%] text-center whitespace-nowrap">Status</th>
                                        <th className="w-[12%] text-center whitespace-nowrap">Last Update</th>
                                        <th className="pr-6 text-right w-20 whitespace-nowrap">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {paginatedData.map(item => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 group h-16">
                                            
                                            {/* Col 1: SKU */}
                                            <td className="sys-table-td pl-6 align-middle">
                                                <span className="font-bold text-red-600 text-[12px] font-mono leading-tight px-2 py-1 bg-red-50 rounded-md border border-red-100 shadow-sm">{item.sku}</span>
                                            </td>

                                            {/* Col 2: Name */}
                                            <td className="sys-table-td align-middle font-bold text-[#212c46] text-[12px] leading-tight font-exception-header">
                                                {item.name}
                                            </td>

                                            {/* Col 3: Category (Stacked) */}
                                            <td className="sys-table-td align-middle">
                                                <div className="flex flex-col items-start gap-1.5">
                                                    <span className={`px-2.5 py-0.5 rounded-md border text-[11px] font-bold uppercase tracking-widest ${getCategoryStyle(item.cat)}`}>
                                                        {item.cat}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Col 4: Brand */}
                                            <td className="sys-table-td align-middle">
                                                {item.type === 'FG' ? (
                                                    <span className={`text-[11px] font-bold px-2 py-1 rounded-md border uppercase tracking-widest flex items-center justify-center shadow-sm ${
                                                        item.brand === 'AFM' ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white border-transparent' : 
                                                        item.brand === 'No Brand' ? 'bg-slate-100 text-slate-500 border-slate-200 whitespace-pre-wrap w-14 leading-tight' :
                                                        'bg-white text-slate-500 border-slate-200 whitespace-nowrap w-fit'
                                                    }`}>
                                                        {item.brand.replace('No Brand', 'NO\nBRAND')}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 italic font-mono">-</span>
                                                )}
                                            </td>

                                            {/* Col 5: Size (Stacked) */}
                                            <td className="sys-table-td align-middle text-right">
                                                {item.type === 'FG' ? (
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className="font-mono font-black text-[#212c46] text-[12px] leading-none whitespace-nowrap">
                                                            {item.w >= 1000 ? `${(item.w / 1000).toLocaleString()} kg` : `${item.w.toLocaleString()} g`}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-tight whitespace-nowrap mt-0.5">
                                                            {item.pieces} PCS./PACK
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic font-mono">-</span>
                                                )}
                                            </td>
                                            
                                            {/* Col 6: Status */}
                                            <td className="sys-table-td align-middle text-center">
                                                <span className={`px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-widest shadow-sm border ${getStatusStyle(item.status)}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            
                                            {/* Col 7: Last Update */}
                                            <td className="sys-table-td align-middle text-center">
                                                <span className="font-mono font-bold text-slate-400 text-[11px] whitespace-nowrap bg-slate-50 px-2 py-1 rounded-md border border-slate-100">{item.updated}</span>
                                            </td>

                                            {/* Col 8: Action */}
                                            <td className="sys-table-td pr-6 align-middle">
                                                <div className="flex justify-end items-center gap-[1px] transition-opacity">
                                                    <button onClick={() => setItemModal({ isOpen: true, data: item })} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#eaeaec] text-[#4d87a8] hover:border-[#212c46] hover:text-[#a94228] hover:bg-[#212c46]/5 transition-all shadow-sm bg-white active:scale-90" title="Edit">
                                                        <Icons.Pencil size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(item.sku)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#eaeaec] text-[#932c2e] hover:border-[#932c2e] hover:bg-[#932c2e]/10 transition-all shadow-sm bg-white active:scale-90" title="Delete">
                                                        <Icons.Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>

                                        </tr>
                                    ))}
                                    {paginatedData.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="py-16 text-center text-slate-400 font-bold uppercase tracking-widest text-[12px] opacity-70">
                                                No Records Found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Pagination (Synced) */}
                        <div className="sys-table-pagination font-mono">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span>SHOW:</span>
                                    <select 
                                        value={itemsPerPage} 
                                        onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} 
                                        className="bg-white border border-slate-200 rounded-md px-2 py-1 outline-none focus:border-slate-300 text-[#212c46] cursor-pointer shadow-sm"
                                    >
                                        {[5, 10, 20, 50].map(v => <option key={v} value={v}>{v}</option>)}
                                    </select>
                                </div>
                                <div>TOTAL {filteredData.length} ITEMS</div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className={`p-1.5 border border-[#adb2b0]/50 bg-white rounded-lg transition-all shadow-sm ${currentPage === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-50 text-[#212c46] hover:border-slate-400'}`}><Icons.ChevronLeft size={16}/></button>
                                <div className="bg-white border border-[#adb2b0]/50 px-5 py-1.5 rounded-lg shadow-sm text-[#212c46] font-black min-w-[120px] text-center uppercase tracking-widest">PAGE {currentPage} OF {totalPages || 1}</div>
                                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className={`p-1.5 border border-[#adb2b0]/50 bg-white rounded-lg transition-all shadow-sm ${currentPage === totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-50 text-[#212c46] hover:border-slate-400'}`}><Icons.ChevronRight size={16}/></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </div>
    );
}
