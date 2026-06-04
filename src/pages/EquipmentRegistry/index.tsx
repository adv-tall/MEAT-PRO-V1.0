import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useCollection } from '../../services/useFirestore';
import { createPortal } from 'react-dom';
import * as Icons from 'lucide-react';
import { UserGuidePanel } from '@/src/components/shared/UserGuidePanel';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import KpiCard from '../../components/shared/KpiCard';
import { DraggableModal } from '../../components/shared/DraggableModal';

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

const Swal = typeof window !== 'undefined' ? (window as any).Swal || null : null;
const Papa = typeof window !== 'undefined' ? (window as any).Papa || null : null;
const IS_DEMO = false;

const THEME = {
    primary: '#212c46',
    accent: '#dc2626',
    bg: '#ffffff',
    card: '#FFFFFF',
    border: '#E2E8F0',
    info: '#3B82F6'
};

const CHART_THEME = {
    primary: '#932c2e',   
    warning: '#f59e0b',   
    info: '#4d87a8',      
    success: '#2e7d32',   
    secondary: '#b7a159', 
    navy: '#212c46',      
    muted: '#7a8b95'      
};

const STEPS = ['Mixing', 'Forming', 'Cooking', 'Cooling', 'Peeling', 'Cutting', 'Packing'];

const INITIAL_EQUIPMENT = [
    { id: 'EQ-MIX-001', name: 'Bowl Cutter 200L', step: 'Mixing', qty: 2, note: 'เครื่องหลักไลน์ A' },
    { id: 'EQ-MIX-002', name: 'Vacuum Mixer 500L', step: 'Mixing', qty: 1, note: 'สำหรับผสม Batter' },
    { id: 'EQ-FRM-001', name: 'Frank-A-Matic Hi-Speed', step: 'Forming', qty: 2, note: 'ไส้กรอกยาว' },
    { id: 'EQ-FRM-002', name: 'Meatball Former', step: 'Forming', qty: 3, note: 'ลูกชิ้น' },
    { id: 'EQ-CK-001', name: 'SmokeHouse Gen3', step: 'Cooking', qty: 2, note: 'ตู้อบรมควัน' },
    { id: 'EQ-CL-001', name: 'Rapid Chill Tunnel', step: 'Cooling', qty: 1, note: 'ลดอุณหภูมิ' },
    { id: 'EQ-PK-001', name: 'Thermoformer Pack', step: 'Packing', qty: 2, note: 'แพ็คสูญญากาศ' },
    { id: 'EQ-PK-002', name: 'Flow Pack Wrapper', step: 'Packing', qty: 1, note: 'แพ็คซองตั้ง' },
];

const generateMockBreakdowns = () => [
    { id: 'BD-260401', date: '04/04/2026', machineId: 'EQ-MIX-002', machineName: 'Vacuum Mixer 500L', problem: 'Motor Overheating (Temp > 85c)', actionTaken: '', downtimeMinutes: 45, status: 'Open', reportedBy: 'Operator A' },
    { id: 'BD-260402', date: '03/04/2026', machineId: 'EQ-FRM-001', machineName: 'Twist Linker A', problem: 'Casing Jammed / Tearing', actionTaken: 'Replaced linking nozzle and recalibrated speed', downtimeMinutes: 20, status: 'Resolved', reportedBy: 'Tech Lead' },
    { id: 'BD-260403', date: '01/04/2026', machineId: 'EQ-CK-001', machineName: 'Smoke House 6T', problem: 'Steam Valve Leak', actionTaken: 'Tightened valve and replaced gasket seal', downtimeMinutes: 120, status: 'Resolved', reportedBy: 'Maintenance' },
    { id: 'BD-260329', date: '29/03/2026', machineId: 'EQ-PK-001', machineName: 'Thermoformer Pack', problem: 'Vacuum Pump Failure', actionTaken: 'Swapped backup pump unit', downtimeMinutes: 90, status: 'Resolved', reportedBy: 'Maintenance' },
    { id: 'BD-260328', date: '28/03/2026', machineId: 'EQ-MIX-001', machineName: 'Bowl Cutter 200L', problem: 'Blade sensor error', actionTaken: '', downtimeMinutes: 15, status: 'Open', reportedBy: 'Operator B' },
];

const kebabToPascal = (str: string) => str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
const LucideIcon = ({ name, size = 16, className = "", color, style }: any) => {
    if (!name) return <Icons.HelpCircle size={size} className={className} style={style} />;
    const pascalName = kebabToPascal(name);
    const IconComponent = (Icons as any)[pascalName] || (Icons as any)[`${pascalName}Icon`] || Icons.CircleHelp || Icons.Activity;
    if (!IconComponent) return null;
    return <IconComponent size={size} className={className} style={{...style, color: color}} strokeWidth={2} />;
};


function CsvUploadModal({ isOpen, onClose, onUpload }: any) {
    const [dragActive, setDragActive] = useState(false);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleDrag = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.type === "dragenter" || e.type === "dragover") setDragActive(true); else setDragActive(false); };
    const handleDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); if (e.dataTransfer.files && e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]); };
    const handleChange = (e: any) => { if (e.target.files && e.target.files[0]) processFile(e.target.files[0]); };
    
    const processFile = (file: File) => {
        setError(null);
        if(!Papa) { setError("CSV Parser (PapaParse) ไม่ได้โหลดในระบบ แนะนำให้ป้อนข้อมูลแบบแมนนวล"); return; }
        Papa.parse(file, { header: true, skipEmptyLines: true, complete: function (results: any) {
            if (results.errors.length > 0) { setError("Error parsing CSV: " + results.errors[0].message); return; }
            setPreviewData(results.data);
        }});
    };

    const confirmUpload = () => {
        const newData = previewData.map(row => ({
            id: row.ID,
            name: row.Name,
            step: row.Step,
            qty: parseInt(row.Quantity) || 0,
            note: row.Note || ''
        }));
        
        onUpload(newData);
        onClose();
        setPreviewData([]);
        setError(null);
        if(Swal) Swal.fire({ icon: 'success', title: 'Imported!', text: 'Equipment data has been successfully imported.', timer: 1500, showConfirmButton: false });
    };

    return (
         <DraggableModal isOpen={isOpen} onClose={onClose} width="max-w-3xl" hideDefaultHeader>
            <div className="bg-white rounded-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-5 border-b border-[#eaeaec] flex justify-between items-center bg-[#212c46] text-white">
                    <h3 className="font-black flex items-center gap-2 uppercase tracking-widest text-sm"><LucideIcon name="upload-cloud" /> Import Equipment CSV</h3>
                    <button onClick={onClose} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors"><LucideIcon name="x" /></button>
                </div>
                <div className="p-8 flex-1 overflow-y-auto">
                    {!previewData.length ? (
                        <div className={`border-2 border-dashed rounded-xl p-10 text-center transition-all bg-[#f8f9fa] ${dragActive ? 'border-[#932c2e] bg-[#932c2e]/5' : 'border-[#eaeaec]'}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-[#7a8b95]"><LucideIcon name="file-spreadsheet" size={32} /></div>
                            <p className="text-[#212c46] font-black mb-2 uppercase tracking-widest text-[12px]">Drag & Drop CSV file here</p>
                            <button onClick={() => fileInputRef.current?.click()} className="bg-[#212c46] hover:bg-[#4d87a8] text-white px-6 py-2.5 rounded-lg text-[12px] uppercase tracking-widest font-black transition-colors shadow-md mt-4">Browse File</button>
                            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleChange} />
                        </div>
                    ) : (
                        <div className="overflow-x-auto border border-[#eaeaec] rounded-lg max-h-[300px] custom-scrollbar shadow-inner text-[12px]">
                            <h4 className="font-bold text-[#212c46] mb-3 px-4 pt-4 flex justify-between items-center">
                                <span>Preview Data ({previewData.length} rows)</span>
                                <button onClick={() => setPreviewData([])} className="text-[10px] text-[#932c2e] uppercase tracking-widest bg-red-50 px-2 py-1 rounded">Clear</button>
                            </h4>
                            <table className="w-full text-left whitespace-nowrap table-font">
                                <thead className="sys-table-header sticky top-0 z-10 ">
                    <tr>
                                        <th className="p-3 font-black uppercase tracking-wider   align-middle  ">ID</th>
                                        <th className="p-3 font-black uppercase tracking-wider   align-middle  ">Name</th>
                                        <th className="p-3 font-black uppercase tracking-wider   align-middle  ">Step</th>
                                        <th className="p-3 font-black uppercase tracking-wider  text-center  align-middle  ">Quantity</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.slice(0, 10).map((row, i) => (
                                        <tr key={i} className="hover:bg-slate-50 border-b">
                                            <td className="p-3 font-mono font-bold text-[#932c2e] py-2.5 px-4">{row.ID || '-'}</td>
                                            <td className="p-3 text-[#212c46] font-bold py-2.5 px-4">{row.Name || '-'}</td>
                                            <td className="p-3 text-[#4d87a8] py-2.5 px-4">{row.Step || '-'}</td>
                                            <td className="p-3 text-[#212c46] font-mono text-center py-2.5 px-4">{row.Quantity || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {previewData.length > 10 && <div className="p-3 text-center text-[10px] text-[#7a8b95] bg-[#f8f9fa] font-bold uppercase tracking-widest">Showing first 10 rows of {previewData.length} records...</div>}
                        </div>
                    )}
                    {error && <div className="mt-4 p-3 bg-red-50 text-[#932c2e] text-[12px] rounded-lg border border-red-100 flex items-center gap-2 font-bold"><LucideIcon name="alert-circle" size={16}/> {error}</div>}
                </div>
                {previewData.length > 0 && (
                     <div className="p-4 border-t border-[#eaeaec] flex justify-end gap-3 bg-[#f8f9fa]">
                        <button onClick={onClose} className="px-6 py-2.5 text-[#7a8b95] hover:text-[#212c46] font-bold text-[10px] uppercase tracking-widest transition-colors">Cancel</button>
                        <button onClick={confirmUpload} className="px-8 py-2.5 bg-[#212c46] hover:bg-[#4d87a8] text-white font-black text-[11px] uppercase tracking-widest rounded-lg shadow-md transition-colors flex items-center gap-2">
                            <LucideIcon name="check" size={14}/> Confirm Upload
                        </button>
                    </div>
                )}
            </div>
        </DraggableModal>
    );
}

function EquipmentModal({ isOpen, onClose, data, onSave }: any) {
    const [formData, setFormData] = useState({ id: '', name: '', step: 'Mixing', qty: 1, note: '' });

    useEffect(() => {
        if (isOpen) {
            setFormData(data ? { ...data } : { id: '', name: '', step: 'Mixing', qty: 1, note: '' });
        }
    }, [isOpen, data]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!formData.id || !formData.name) {
            if(Swal) Swal.fire({ icon: 'error', title: 'Error', text: 'ID and Name are required.' });
            else alert('ID and Name are required.');
            return;
        }
        onSave(formData);
        onClose();
    };

    return (
        <DraggableModal isOpen={isOpen} onClose={onClose} width="max-w-2xl" hideDefaultHeader>
            <div className="bg-white rounded-xl w-full flex flex-col overflow-hidden max-h-[90vh]">
                <div className="bg-[#212c46] px-8 py-5 flex justify-between items-center shrink-0 border-b border-[#eaeaec]">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/20">
                            <LucideIcon name={data ? "edit-3" : "plus-circle"} size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-widest leading-none">{data ? 'Edit Equipment' : 'New Equipment'}</h3>
                            <p className="text-[10px] font-bold text-[#b7a159] uppercase tracking-widest mt-1.5">{data ? formData.id : 'Add to registry'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/50 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-1.5 rounded-lg"><LucideIcon name="x" size={20} /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-[#f8f9fa]">
                    <div className="bg-white p-6 rounded-xl border border-[#eaeaec] shadow-sm grid grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="text-[10px] font-black text-[#7a8b95] uppercase tracking-widest block mb-2">Equipment ID</label>
                            <input type="text" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} disabled={!!data} className={`w-full border border-[#eaeaec] bg-[#f8f9fa] focus:bg-white rounded-xl p-3 text-[12px] font-mono font-bold focus:border-[#4d87a8] transition-all outline-none ${data ? 'bg-[#f8f9fa] text-[#7a8b95]' : 'bg-[#f8f9fa] focus:bg-white text-[#212c46]'}`} placeholder="EQ-XXX-001" />
                        </div>
                        <div className="col-span-2">
                            <label className="text-[10px] font-black text-[#7a8b95] uppercase tracking-widest block mb-2">Machine Name</label>
                            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-[#eaeaec] bg-[#f8f9fa] focus:bg-white rounded-xl p-3 text-[12px] font-bold text-[#212c46] focus:border-[#4d87a8] transition-all outline-none" placeholder="e.g. Bowl Cutter 200L" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-[#7a8b95] uppercase tracking-widest block mb-2">Process Step</label>
                            <select value={formData.step} onChange={e => setFormData({...formData, step: e.target.value})} className="w-full border border-[#eaeaec] bg-[#f8f9fa] focus:bg-white rounded-xl p-3 text-[12px] font-bold text-[#212c46] focus:border-[#4d87a8] transition-all outline-none cursor-pointer">
                                {STEPS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-[#7a8b95] uppercase tracking-widest block mb-2">Quantity</label>
                            <input type="number" min="0" value={formData.qty} onChange={e => setFormData({...formData, qty: parseInt(e.target.value)})} className="w-full border border-[#eaeaec] bg-[#f8f9fa] focus:bg-white rounded-xl p-3 text-[12px] font-mono font-bold text-[#212c46] focus:border-[#4d87a8] transition-all outline-none" />
                        </div>
                        <div className="col-span-2">
                            <label className="text-[10px] font-black text-[#7a8b95] uppercase tracking-widest block mb-2">Note</label>
                            <textarea value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} className="w-full border border-[#eaeaec] bg-[#f8f9fa] focus:bg-white rounded-xl p-3 text-[12px] font-bold text-[#212c46] focus:border-[#4d87a8] transition-all outline-none min-h-[80px]" placeholder="Additional details..." />
                        </div>
                    </div>
                </div>

                <div className="p-5 bg-white border-t border-[#eaeaec] flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-6 py-2.5 text-[#7a8b95] hover:text-[#212c46] font-bold text-[10px] uppercase tracking-widest transition-colors">Cancel</button>
                    <button onClick={handleSave} className="px-8 py-2.5 bg-[#212c46] hover:bg-[#4d87a8] text-white font-black text-[11px] uppercase tracking-widest rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"><LucideIcon name="save" size={14}/> Save Equipment</button>
                </div>
            </div>
        </DraggableModal>
    );
}

function BreakdownModal({ isOpen, onClose, data, onSave, equipment }: any) {
    const [formData, setFormData] = useState({ machineId: '', problem: '', actionTaken: '', downtimeMinutes: 0, status: 'Open' });

    useEffect(() => {
        if (isOpen) {
            setFormData(data ? { ...data } : { machineId: '', problem: '', actionTaken: '', downtimeMinutes: 0, status: 'Open' });
        }
    }, [isOpen, data]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!formData.machineId || !formData.problem) {
            if(Swal) Swal.fire({ icon: 'error', title: 'Error', text: 'Machine and Problem are required.' });
            else alert('Machine and Problem are required.');
            return;
        }
        onSave(formData);
    };

    return (
        <DraggableModal isOpen={isOpen} onClose={onClose} width="max-w-2xl" hideDefaultHeader>
            <div className="bg-white rounded-xl w-full flex flex-col overflow-hidden max-h-[90vh]">
                <div className="bg-[#212c46] px-8 py-5 flex justify-between items-center shrink-0 border-b border-[#eaeaec]">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/20">
                            <LucideIcon name={data ? "edit-3" : "alert-triangle"} size={20} className={!data ? "text-[#b7a159]" : ""} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-widest leading-none">{data ? 'Edit Breakdown Record' : 'Report Machine Issue'}</h3>
                            <p className="text-[10px] font-bold text-[#b7a159] uppercase tracking-widest mt-1.5">{data ? data.id : 'Create new maintenance log'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/50 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-1.5 rounded-lg"><LucideIcon name="x" size={20} /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-[#f8f9fa]">
                    <div className="bg-white p-6 rounded-xl border border-[#eaeaec] shadow-sm grid grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="text-[10px] font-black text-[#7a8b95] uppercase tracking-widest block mb-2">Machine</label>
                            <select 
                                value={formData.machineId} 
                                onChange={(e) => setFormData({...formData, machineId: e.target.value})}
                                className="w-full border border-[#eaeaec] bg-[#f8f9fa] focus:bg-white rounded-xl p-3 text-[12px] font-bold text-[#212c46] focus:border-[#4d87a8] transition-all outline-none cursor-pointer"
                            >
                                <option value="">-- Select Machine --</option>
                                {equipment.map((eq: any) => (
                                    <option key={eq.id} value={eq.id}>{eq.name} ({eq.step})</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="text-[10px] font-black text-[#7a8b95] uppercase tracking-widest block mb-2">Problem Description</label>
                            <textarea 
                                value={formData.problem} 
                                onChange={(e) => setFormData({...formData, problem: e.target.value})}
                                className="w-full border border-[#eaeaec] bg-[#f8f9fa] focus:bg-white rounded-xl p-3 text-[12px] font-bold text-[#212c46] focus:border-[#4d87a8] transition-all outline-none min-h-[80px]"
                                placeholder="Describe the issue..."
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="text-[10px] font-black text-[#7a8b95] uppercase tracking-widest block mb-2">Action Taken</label>
                            <textarea 
                                value={formData.actionTaken} 
                                onChange={(e) => setFormData({...formData, actionTaken: e.target.value})}
                                className="w-full border border-[#eaeaec] bg-[#f8f9fa] focus:bg-white rounded-xl p-3 text-[12px] font-bold text-[#212c46] focus:border-[#4d87a8] transition-all outline-none min-h-[80px]"
                                placeholder="What was done to fix it? (Optional if still open)"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-[#7a8b95] uppercase tracking-widest block mb-2">Downtime (Minutes)</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    min="0"
                                    value={formData.downtimeMinutes} 
                                    onChange={(e) => setFormData({...formData, downtimeMinutes: Number(e.target.value)})}
                                    className="w-full border border-[#eaeaec] bg-[#f8f9fa] focus:bg-white rounded-xl p-3 text-[12px] font-mono font-black text-[#932c2e] text-right pr-12 focus:border-[#4d87a8] transition-all outline-none"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#7a8b95]">MIN</span>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-[#7a8b95] uppercase tracking-widest block mb-2">Status</label>
                            <select 
                                value={formData.status} 
                                onChange={(e) => setFormData({...formData, status: e.target.value})}
                                className="w-full border border-[#eaeaec] bg-[#f8f9fa] focus:bg-white rounded-xl p-3 text-[12px] font-bold text-[#212c46] focus:border-[#4d87a8] transition-all outline-none cursor-pointer"
                            >
                                <option value="Open">Open</option>
                                <option value="Resolved">Resolved</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="p-5 bg-white border-t border-[#eaeaec] flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-6 py-2.5 text-[#7a8b95] hover:text-[#212c46] font-bold text-[10px] uppercase tracking-widest transition-colors">Cancel</button>
                    <button onClick={handleSave} className="px-8 py-2.5 bg-[#212c46] hover:bg-[#4d87a8] text-white font-black text-[11px] uppercase tracking-widest rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"><LucideIcon name="save" size={14}/> Save Record</button>
                </div>
            </div>
        </DraggableModal>
    );
}

// --- MAIN APPLICATION ---
export default function EquipmentRegistry() {
    const [activeTab, setActiveTab] = useState('equipment');
    const { data: dbEq, add: addEqDb, update: updateEqDb, remove: removeEqDb } = useCollection('Equipment_Registry', INITIAL_EQUIPMENT);
    const { data: dbBd, add: addBdDb, update: updateBdDb, remove: removeBdDb } = useCollection('Equipment_Breakdowns', []);
    const equipment = dbEq && dbEq.length > 0 ? dbEq : INITIAL_EQUIPMENT;
    const breakdowns = dbBd && dbBd.length > 0 ? dbBd : [];
    
    const [loading, setLoading] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStep, setFilterStep] = useState('All');

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [activeMainTab, setActiveMainTab] = useState('Machine List');
    
    // Modal State
    const [eqModal, setEqModal] = useState<any>({ isOpen: false, data: null });
    const [bdModal, setBdModal] = useState<any>({ isOpen: false, data: null });
    const [csvModalOpen, setCsvModalOpen] = useState(false);

    useEffect(() => {
        setCurrentPage(1);
        setSearchTerm('');
        setFilterStep('All');
        
        if (activeMainTab === 'Machine List') setActiveTab('equipment');
        else if (activeMainTab === 'Breakdown Log') setActiveTab('breakdowns');
        else if (activeMainTab === 'OEE Metrics') setActiveTab('oee');
        else if (activeMainTab === 'Dashboard') setActiveTab('dashboard');

    }, [activeMainTab]);

    // Data Filtering
    const filteredEquipment = useMemo(() => {
        return equipment.filter(item => {
            const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.id.toLowerCase().includes(searchTerm.toLowerCase());
            const matchStep = filterStep === 'All' || item.step === filterStep;
            return matchSearch && matchStep;
        });
    }, [searchTerm, equipment, filterStep]);

    const filteredBreakdowns = useMemo(() => {
        return breakdowns.filter(item => {
            const matchSearch = item.machineName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                item.problem.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                item.id.toLowerCase().includes(searchTerm.toLowerCase());
            return matchSearch;
        });
    }, [searchTerm, breakdowns]);

    const activeData = activeTab === 'equipment' ? filteredEquipment : filteredBreakdowns;
    
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const paginatedData = activeData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(activeData.length / itemsPerPage);

    // Handlers
    const handleSaveEquipment = (newItem: any) => {
        if (eqModal.data && eqModal.data.id) {
            updateEqDb(eqModal.data.id, newItem);
        } else {
            const newId = `EQ-${newItem.step.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-3)}`;
            addEqDb({ ...newItem, id: newId });
        }
        if(Swal) Swal.fire({ icon: 'success', title: 'Saved Successfully', showConfirmButton: false, timer: 1000 });
    };

    const handleDeleteEquipment = (id: string) => {
        if(Swal) {
            Swal.fire({ title: 'Are you sure?', text: `Delete machine ${id}?`, icon: 'warning', showCancelButton: true, confirmButtonColor: THEME.accent, confirmButtonText: 'Yes, delete it!' }).then((result: any) => { 
                if (result.isConfirmed) { 
                    removeEqDb(id); 
                    Swal.fire({icon: 'success', title: 'Deleted!', text: 'Machine deleted.', timer: 1500, showConfirmButton: false}); 
                } 
            });
        }
    };

    const handleSaveBreakdown = (newItem: any) => {
        const selectedMachine = equipment.find(e => e.id === newItem.machineId);
        const machineName = selectedMachine ? selectedMachine.name : newItem.machineId;

        const record = {
            id: bdModal.data ? bdModal.data.id : `BD-${Date.now().toString().slice(-6)}`,
            date: bdModal.data ? bdModal.data.date : new Date().toLocaleDateString('en-GB'),
            machineId: newItem.machineId,
            machineName,
            problem: newItem.problem,
            actionTaken: newItem.actionTaken,
            downtimeMinutes: newItem.downtimeMinutes,
            status: newItem.status,
            reportedBy: bdModal.data ? bdModal.data.reportedBy : 'Current User'
        };

        if (bdModal.data && bdModal.data.id) {
            updateBdDb(bdModal.data.id, record);
        } else {
            addBdDb(record);
        }
        
        setBdModal({ isOpen: false, data: null });
        if(Swal) Swal.fire({ icon: 'success', title: 'Saved Successfully', showConfirmButton: false, timer: 1000 });
    };

    const handleDeleteBreakdown = (id: string) => {
        if(Swal) {
            Swal.fire({ title: 'Are you sure?', text: `Delete record ${id}?`, icon: 'warning', showCancelButton: true, confirmButtonColor: THEME.accent, confirmButtonText: 'Yes, delete it!' }).then((result: any) => { 
                if (result.isConfirmed) { 
                    removeBdDb(id); 
                    Swal.fire({icon: 'success', title: 'Deleted!', text: 'Record deleted.', timer: 1500, showConfirmButton: false}); 
                } 
            });
        }
    };

    const handleCsvUpload = (newItems: any) => {
        newItems.forEach((ni: any) => {
            const existing = equipment.find(u => u.id === ni.id);
            if (existing && existing.id) {
                updateEqDb(existing.id, ni);
            } else {
                addEqDb(ni);
            }
        });
    };

    if (loading) return (
        <div className="flex h-screen w-full items-center justify-center bg-transparent">
            <div className="flex flex-col items-center gap-4">
                <Icons.Loader2 size={48} className="animate-spin text-[#212c46]" />
                <span className="text-[#212c46] font-black uppercase tracking-widest text-sm animate-pulse">Loading Equipment Data...</span>
            </div>
        </div>
    );

    // OEE Calculations
    const totalDowntime = breakdowns.reduce((sum, b) => sum + b.downtimeMinutes, 0);
    const openIssues = breakdowns.filter(b => b.status === 'Open').length;
    const resolvedIssues = breakdowns.filter(b => b.status === 'Resolved').length;
    const totalAvailableTime = equipment.length * 8 * 60; // Assuming 8 hours per machine
    const availability = totalAvailableTime > 0 ? ((totalAvailableTime - totalDowntime) / totalAvailableTime) * 100 : 100;

    return (
        <div className="flex flex-1 w-full flex-col animate-fadeIn bg-transparent space-y-4">
            <style>{globalStyles}</style>
            
            <button onClick={() => setShowGuide(true)} className="fixed right-0 top-[80px] bg-[#f8f9fa] border border-[#eaeaec] border-r-0 text-[#212c46] py-8 px-1.5 rounded-l-xl shadow-md hover:bg-[#932c2e] hover:text-white hover:border-[#932c2e] transition-all duration-500 z-[100] flex flex-col items-center gap-4 group">
                <Icons.HelpCircle size={18} className="shrink-0 group-hover:rotate-12 transition-transform text-[#7a8b95] group-hover:text-white" />
                <span className="font-black tracking-[0.3em] [writing-mode:vertical-rl] rotate-180 whitespace-nowrap uppercase text-[11px]">USER GUIDE</span>
            </button>
            <UserGuidePanel
                isOpen={showGuide}
                onClose={() => setShowGuide(false)}
                title="EQUIPMENT REGISTRY GUIDE"
                subtitle="ASSET MANAGEMENT MANUAL"
            >
                <div className="space-y-8 font-sans">
                    <div>
                        <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                            <Icons.Database size={16} className="text-[#3f809e]" /> 1. ภาพรวมของทะเบียนเครื่องจักร
                        </h3>
                        <p className="mb-4 text-[#414757]">
                            ระบบนี้ใช้สำหรับขึ้นทะเบียนทรัพย์สินและเครื่องจักรในไลน์ผลิตทั้งหมด เพื่อเป็นฐานข้อมูลหลัก (Master Data) สำหรับให้แผนกอื่นนำไปอ้างอิง เช่น การแจ้งซ่อม การบำรุงรักษา หรือการคำนวณต้นทุนการเดินเครื่องต่างๆ
                        </p>
                    </div>

                    <div className="h-px bg-[#eaeaec] w-full" />

                    <div>
                        <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                            <Icons.Activity size={16} className="text-[#b58c4f]" /> 2. การควบคุมสถานะการทำงาน (MACHINE STATUS)
                        </h3>
                        <p className="mb-4 text-[#414757]">
                            การอัพเดทสถานะเครื่องจักรให้ตรงความจริงเสมอจะช่วยลดการวางแผนการผลิตที่ผิดพลาด:
                        </p>
                        <div className="space-y-3 relative pb-2 border-l-2 border-[#eaeaec] ml-2 pl-4">
                            <div className="relative">
                                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-[#688a58] border-2 border-white"></div>
                                <strong className="text-[#688a58] block text-[12px]">Operational (พร้อมใช้งาน):</strong>
                                <p className="text-[#7a8b95] text-[11px] mt-0.5">เครื่องจักรอยู่ในสภาพ 100% พร้อมรับงานใหม่</p>
                            </div>
                            <div className="relative mt-4">
                                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-[#a94228] border-2 border-white"></div>
                                <strong className="text-[#a94228] block text-[12px]">Down (เสีย/ไฟดับ):</strong>
                                <p className="text-[#7a8b95] text-[11px] mt-0.5">เครื่องจักรขัดข้องรุนแรง ไม่สามารถใช้งานได้ ต้องเรียกช่างเคลียร์งาน</p>
                            </div>
                            <div className="relative mt-4">
                                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-[#b58c4f] border-2 border-white"></div>
                                <strong className="text-[#b58c4f] block text-[12px]">Maintenance (ซ่อมบำรุง/ล้างเครื่อง):</strong>
                                <p className="text-[#7a8b95] text-[11px] mt-0.5">หยุดเครื่องตามแผน หรืออยู่ระหว่างเปลี่ยนอะไหล่ตามรอบเวลา</p>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-[#eaeaec] w-full" />

                    <div>
                        <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                            <Icons.Cpu size={16} className="text-[#688a58]" /> 3. คำอธิบายหมวดหมู่ระบบเครื่องจักร
                        </h3>
                        <ul className="list-decimal pl-5 space-y-2 text-[#414757] text-[12px]">
                            <li><strong>Mixing:</strong> เครื่องผสม, เครื่องบดเนื้อ, ถังลดอุณหภูมิ</li>
                            <li><strong>Processing:</strong> ตู้อบรมควัน, เครื่องอัดไส้, เครื่องขึ้นรูปลูกชิ้น</li>
                            <li><strong>Packaging:</strong> เครื่องซีลสุญญากาศ, เครื่องแพ็คอัตโนมัติ, เครื่องพิมพ์วันหมดอายุ</li>
                            <li><strong>Utilities:</strong> ปั๊มลม, หม้อไอน้ำ, คอมเพรสเซอร์ทำความเย็นระดับโรงงาน</li>
                        </ul>
                    </div>
                </div>
            </UserGuidePanel>
            
            <CsvUploadModal isOpen={csvModalOpen} onClose={() => setCsvModalOpen(false)} onUpload={handleCsvUpload} />
            <EquipmentModal isOpen={eqModal.isOpen} onClose={() => setEqModal({ isOpen: false, data: null })} data={eqModal.data} onSave={handleSaveEquipment} />
            <BreakdownModal isOpen={bdModal.isOpen} onClose={() => setBdModal({ isOpen: false, data: null })} data={bdModal.data} onSave={handleSaveBreakdown} equipment={equipment} />

            {/* Header Bar synced with other modules */}
            <div className="h-14 px-4 sm:px-8 flex flex-row items-center justify-between gap-4 z-20 shrink-0">
                <div className="flex items-center gap-5">
                    <div className="relative flex items-center justify-center group cursor-default shrink-0">
                        <div className="absolute inset-0 bg-[#212c46] blur-[15px] opacity-20 rounded-full group-hover:opacity-60 transition-all duration-700"></div>
                        <div className="relative z-10 p-1.5 border border-[#212c46]/40 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm">
                            <Icons.Wrench size={28} strokeWidth={2.5} className="text-[#212c46]" />
                        </div>
                    </div>
                    <div>
                        <h3 className="font-black text-[#212c46] uppercase tracking-tighter leading-none font-exception-header" style={{ fontSize: '24px' }}>
                            EQUIPMENT <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#212c46] to-[#4d87a8]">REGISTRY</span>
                        </h3>
                        <p className="text-[11px] font-bold text-[#7a8b95] uppercase tracking-[0.2em] mt-0.5 opacity-80 leading-none">
                            Machine & Facility Hub
                        </p>
                    </div>
                </div>
                
                {/* Main Tabs matching Master Item */}
                <div className="flex items-center gap-4">
                    <div className="bg-white/50 p-1.5 rounded-xl border border-white/60 shadow-inner flex flex-wrap items-center gap-1">
                        {['Machine List', 'Breakdown Log', 'OEE Metrics', 'Dashboard'].map(t => (
                            <button 
                                key={t} 
                                onClick={() => setActiveMainTab(t)} 
                                className={`px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                                    activeMainTab === t ? 'bg-[#212c46] text-white shadow-md' : 'text-[#7a8b95] hover:text-[#a94228]'
                                }`}
                            >
                                {t === 'Machine List' && <Icons.Settings size={16} />}
                                {t === 'Breakdown Log' && <Icons.List size={16} />}
                                {t === 'OEE Metrics' && <Icons.Activity size={16} />}
                                {t === 'Dashboard' && <Icons.PieChart size={16} />}
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mx-auto px-4 sm:px-8 w-full mt-[2px]">
                {/* KPI STATS */}
                {(activeTab === 'equipment' || activeTab === 'breakdowns') && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 shrink-0">
                        {activeTab === 'equipment' ? (
                            <>
                                <KpiCard label="Total Units" value={equipment.length} icon="settings" colorAccent="#4d87a8" colorValue={THEME.primary} desc="Active Machinery" />
                                <KpiCard label="Forming Area" value={equipment.filter(e => e.step === 'Forming').length} icon="component" colorAccent="#2e7d32" colorValue={THEME.primary} desc="Core Production" />
                                <KpiCard label="Cooking Flow" value={equipment.filter(e => e.step === 'Cooking').length} icon="thermometer" colorAccent="#d96245" colorValue={THEME.primary} desc="Heating Units" />
                                <KpiCard label="Packaging Line" value={equipment.filter(e => e.step === 'Packing').length} icon="package" colorAccent="#b7a159" colorValue={THEME.primary} desc="End of Line" />
                            </>
                        ) : (
                            <>
                                <KpiCard label="Total Downtime" value={`${totalDowntime}`} icon="clock" colorAccent="#932c2e" colorValue={THEME.primary} desc="Minutes Lost" />
                                <KpiCard label="Open Issues" value={openIssues} icon="alert-triangle" colorAccent="#f59e0b" colorValue={THEME.primary} desc="Require Attention" />
                                <KpiCard label="Resolved logs" value={resolvedIssues} icon="check-circle" colorAccent="#2e7d32" colorValue={THEME.primary} desc="Fixed Issues" />
                                <KpiCard label="Est. Availability" value={`${availability.toFixed(1)}%`} icon="activity" colorAccent="#4d87a8" colorValue={THEME.primary} desc="Overall Network uptime" />
                            </>
                        )}
                    </div>
                )}

                <div className="w-full flex-1 flex flex-col min-h-[500px]">
                    {(activeTab === 'equipment' || activeTab === 'breakdowns') && (
                        <div className="sys-table-card border-[#eaeaec] flex flex-col flex-1 shadow-lg bg-white overflow-hidden rounded-xl border">
                            
                            {/* TOOLBAR */}
                            <div className="px-4 py-4 border-b border-[#eaeaec] flex flex-col md:flex-row justify-between items-center bg-white shrink-0 gap-4">
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <span className="bg-[#f8f9fa] text-[#7a8b95] border border-[#eaeaec] font-mono font-black text-[11px] px-3 py-1.5 rounded-lg flex items-center justify-center shadow-sm">
                                        {activeData.length} RECORDS
                                    </span>
                                </div>
                                <div className="flex gap-3 w-full md:w-auto items-center">
                                    {activeTab === 'equipment' && (
                                        <div className="relative group">
                                            <Icons.Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a8b95] group-hover:text-[#212c46] transition-colors" />
                                            <select value={filterStep} onChange={(e) => setFilterStep(e.target.value)} className="pl-9 pr-8 py-2 border border-[#eaeaec] rounded-xl text-[12px] font-bold bg-[#f8f9fa] focus:border-[#4d87a8] outline-none cursor-pointer transition-all text-[#212c46] shadow-sm appearance-none h-10 w-40">
                                                <option value="All">All Steps</option>
                                                {STEPS.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                            <Icons.ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a8b95] pointer-events-none" />
                                        </div>
                                    )}
                                    <div className="relative flex-1 md:w-64">
                                        <Icons.Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a8b95]"/>
                                        <input type="text" placeholder={activeTab === 'equipment' ? "Search Machine..." : "Search Issue..."} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-[#eaeaec] rounded-xl text-[12px] font-bold focus:outline-none focus:border-[#4d87a8] bg-[#f8f9fa] focus:bg-white shadow-sm text-[#212c46] h-10 transition-all" />
                                    </div>
                                    
                                    {activeTab === 'equipment' ? (
                                        <>
                                            <button onClick={() => setCsvModalOpen(true)} className="bg-white border border-[#eaeaec] hover:border-[#4d87a8] hover:text-[#4d87a8] text-[#7a8b95] px-4 py-2 rounded-xl font-bold text-[12px] uppercase tracking-widest flex items-center gap-2 shadow-sm transition-colors hidden md:flex h-10"><Icons.Upload size={14} /> Import</button>
                                            <button onClick={() => setEqModal({ isOpen: true, data: null })} className="bg-[#212c46] hover:bg-[#414757] text-white px-5 py-2 rounded-xl font-black text-[12px] uppercase tracking-widest shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap shrink-0 h-10 border border-[#212c46]">
                                                <Icons.Plus size={14} /> New Machine
                                            </button>
                                        </>
                                    ) : (
                                        <button onClick={() => setBdModal({ isOpen: true, data: null })} className="bg-[#212c46] hover:bg-[#414757] text-white px-5 py-2 rounded-xl font-black text-[12px] uppercase tracking-widest shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap shrink-0 h-10 border border-[#212c46]">
                                            <Icons.AlertTriangle size={14} /> Report Issue
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* TABLE */}
                            <div className="flex-1 overflow-hidden flex flex-col">
                                <div className="overflow-y-auto flex-1 custom-scrollbar bg-slate-50/50">
                                    <table className="w-full text-left min-w-[900px] border-collapse bg-white table-font">
                                        <thead className="sys-table-header [#eaeaec] sticky top-0 z-10 font-black uppercase tracking-widest ">
                                            {activeTab === 'equipment' ? (
                                                <tr>
                                                    <th className="pl-8 w-[15%] align-middle font-black whitespace-nowrap ">ID</th>
                                                    <th className="w-auto align-middle font-black whitespace-nowrap ">Machine Name</th>
                                                    <th className="w-[15%] text-center align-middle font-black whitespace-nowrap ">Process Step</th>
                                                    <th className="w-[15%] text-center align-middle font-black whitespace-nowrap ">Quantity</th>
                                                    <th className="w-[20%] align-middle font-black whitespace-nowrap ">Note</th>
                                                    <th className="pr-8 text-right w-20 align-middle font-black whitespace-nowrap ">Action</th>
                                                </tr>
                                            ) : (
                                                <tr>
                                                    <th className="pl-8 w-[12%] align-middle font-black whitespace-nowrap ">Date</th>
                                                    <th className="w-[20%] align-middle font-black whitespace-nowrap ">Machine</th>
                                                    <th className="w-[25%] align-middle font-black whitespace-nowrap ">Problem</th>
                                                    <th className="w-[20%] align-middle font-black whitespace-nowrap ">Action Taken</th>
                                                    <th className="w-[10%] text-right align-middle font-black whitespace-nowrap ">Downtime</th>
                                                    <th className="w-[10%] text-center align-middle font-black whitespace-nowrap ">Status</th>
                                                    <th className="pr-8 text-right w-20 align-middle font-black whitespace-nowrap ">Action</th>
                                                </tr>
                                            )}
                                        </thead>
                                        <tbody className="divide-y divide-[#eaeaec]">
                                            {paginatedData.map((item: any) => (
                                                <tr key={item.id} className="hover:bg-[#f8f9fa] transition-colors group">
                                                    
                                                    {activeTab === 'equipment' ? (
                                                        <>
                                                            <td className="px-4 pl-8 align-middle py-2.5">
                                                                <span className="font-bold text-[#4d87a8] text-[12px] font-mono leading-tight bg-[#4d87a8]/10 px-2.5 py-1 rounded-md border border-[#4d87a8]/20">{item.id}</span>
                                                            </td>
                                                            <td className="px-4 align-middle font-bold text-[#212c46] text-[12px] py-2.5">{item.name}</td>
                                                            <td className="px-4 align-middle text-center py-2.5">
                                                                <span className="bg-white text-[#7a8b95] px-3 py-1 rounded-full text-[10px] font-bold border border-[#eaeaec] uppercase tracking-widest shadow-sm">{item.step}</span>
                                                            </td>
                                                            <td className="px-4 align-middle text-center py-2.5">
                                                                <div className="font-black text-[#212c46] text-[12px] font-mono bg-slate-50 px-3 py-1 rounded-md border border-[#eaeaec] inline-block shadow-sm">{item.qty}</div>
                                                            </td>
                                                            <td className="px-4 align-middle py-2.5">
                                                                <div className="text-[11px] text-[#7a8b95] font-normal truncate max-w-xs">{item.note || '-'}</div>
                                                            </td>
                                                            <td className="px-4 pr-8 align-middle py-2.5">
                                                                <div className="flex justify-end gap-[1px] transition-opacity">
                                                                    <button onClick={() => setEqModal({ isOpen: true, data: item })} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#eaeaec] text-[#4d87a8] hover:border-[#212c46] hover:text-[#a94228] hover:bg-[#212c46]/5 transition-all shadow-sm bg-white active:scale-90" title="Edit"><Icons.Pencil size={16} /></button>
                                                                    {!IS_DEMO && (
                                                                        <button onClick={() => handleDeleteEquipment(item.id)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#eaeaec] text-[#932c2e] hover:border-[#932c2e] hover:bg-[#932c2e]/10 transition-all shadow-sm bg-white active:scale-90" title="Delete"><Icons.Trash2 size={16} /></button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td className="px-4 pl-8 align-middle py-2.5">
                                                                <div className="flex flex-col items-start gap-1">
                                                                    <span className="font-bold text-[#212c46] text-[12px] font-mono">{item.date}</span>
                                                                    <span className="text-[#932c2e] text-[10px] font-mono font-bold bg-[#932c2e]/10 px-1 py-0.5 rounded">{item.id}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 align-middle font-bold text-[#212c46] text-[12px] py-2.5">
                                                                {item.machineName}
                                                            </td>
                                                            <td className="px-4 align-middle py-2.5">
                                                                <div className="text-[12px] text-[#932c2e] font-bold truncate max-w-[200px]" title={item.problem}>{item.problem}</div>
                                                            </td>
                                                            <td className="px-4 align-middle py-2.5">
                                                                <div className="text-[11px] text-[#7a8b95] font-normal truncate max-w-[200px]" title={item.actionTaken || 'Pending action'}>{item.actionTaken || <span className="italic text-[#b2cade]">-</span>}</div>
                                                            </td>
                                                            <td className="px-4 align-middle text-right py-2.5">
                                                                <div className="flex items-baseline justify-end gap-[1px] whitespace-nowrap">
                                                                    <span className="font-mono font-black text-[#932c2e] text-[12px]">{item.downtimeMinutes}</span>
                                                                    <span className="text-[10px] text-[#7a8b95] font-bold uppercase tracking-widest">Min</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 align-middle text-center py-2.5">
                                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm border whitespace-nowrap ${item.status === 'Resolved' ? 'bg-[#2e7d32]/10 text-[#2e7d32] border-[#2e7d32]/20' : 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20'}`}>{item.status}</span>
                                                            </td>
                                                            <td className="px-4 pr-8 align-middle py-2.5">
                                                                <div className="flex justify-end gap-[1px] transition-opacity">
                                                                    <button onClick={() => setBdModal({ isOpen: true, data: item })} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#eaeaec] text-[#4d87a8] hover:border-[#212c46] hover:text-[#a94228] hover:bg-[#212c46]/5 transition-all shadow-sm bg-white active:scale-90" title="Edit"><Icons.Pencil size={16} /></button>
                                                                    {!IS_DEMO && (
                                                                        <button onClick={() => handleDeleteBreakdown(item.id)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#eaeaec] text-[#932c2e] hover:border-[#932c2e] hover:bg-[#932c2e]/10 transition-all shadow-sm bg-white active:scale-90" title="Delete"><Icons.Trash2 size={16} /></button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            ))}
                                            {paginatedData.length === 0 && (
                                                <tr>
                                                    <td className="text-center py-2.5 px-4">
                                                        <div className="flex flex-col items-center justify-center gap-[1px]">
                                                            <Icons.Inbox size={48} className="text-[#eaeaec]" />
                                                            <span className="text-[#7a8b95] font-bold uppercase tracking-widest text-[12px]">No Records Found</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                
                                {/* Pagination */}
                                <div className="px-6 py-4 border-t border-[#eaeaec] flex flex-col sm:flex-row justify-between items-center gap-4 bg-white shrink-0">
                                    <div className="text-[11px] font-bold text-[#7a8b95] uppercase tracking-widest">
                                        SHOWING {indexOfFirstItem + 1} TO {Math.min(indexOfLastItem, activeData.length)} OF {activeData.length} ENTRIES
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#eaeaec] text-[#212c46] hover:bg-[#f8f9fa] disabled:opacity-30 disabled:hover:bg-transparent transition-colors">
                                            <Icons.ChevronLeft size={16} strokeWidth={2.5}/>
                                        </button>
                                        <div className="h-8 px-4 flex items-center justify-center rounded-lg bg-[#f8f9fa] border border-[#eaeaec] text-[11px] font-black text-[#212c46]">
                                            {currentPage} / {totalPages || 1}
                                        </div>
                                        <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#eaeaec] text-[#212c46] hover:bg-[#f8f9fa] disabled:opacity-30 disabled:hover:bg-transparent transition-colors">
                                            <Icons.ChevronRight size={16} strokeWidth={2.5}/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'oee' && (
                        <div className="flex flex-col gap-6 animate-fadeIn h-full">
                            <div className="bg-white/80 backdrop-blur-md rounded-xl border border-[#eaeaec] shadow-lg p-8">
                                <h3 className="font-black text-[#212c46] flex items-center gap-2 uppercase tracking-widest mb-8 text-[14px]"><LucideIcon name="activity" size={18} className="text-[#932c2e]" /> Overall Equipment Effectiveness (OEE)</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="flex flex-col items-center justify-center p-8 bg-[#f8f9fa] rounded-xl border border-[#eaeaec] shadow-sm">
                                        <h4 className="text-[11px] font-black text-[#7a8b95] uppercase tracking-widest mb-6">Overall OEE</h4>
                                        <div className="relative w-44 h-44 flex items-center justify-center">
                                            <svg className="w-full h-full transform -rotate-90 drop-shadow-sm" viewBox="0 0 100 100">
                                                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#eaeaec" strokeWidth="8" />
                                                <circle cx="50" cy="50" r="40" fill="transparent" stroke={CHART_THEME.primary} strokeWidth="8" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * 78) / 100} strokeLinecap="round" className="transition-all duration-1000" />
                                            </svg>
                                            <div className="absolute flex flex-col items-center justify-center">
                                                <span className="text-4xl font-black text-[#212c46] font-mono">78<span className="text-xl text-[#7a8b95]">%</span></span>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-[#7a8b95] mt-6 text-center font-bold uppercase tracking-widest bg-white px-3 py-1 rounded-md border border-[#eaeaec]">Target: 85%</p>
                                    </div>
                                    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl border border-[#eaeaec] shadow-sm">
                                        <h4 className="text-[11px] font-black text-[#7a8b95] uppercase tracking-widest mb-6">Availability</h4>
                                        <div className="relative w-44 h-44 flex items-center justify-center">
                                            <svg className="w-full h-full transform -rotate-90 drop-shadow-sm" viewBox="0 0 100 100">
                                                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#eaeaec" strokeWidth="8" />
                                                <circle cx="50" cy="50" r="40" fill="transparent" stroke={CHART_THEME.info} strokeWidth="8" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * availability) / 100} strokeLinecap="round" className="transition-all duration-1000" />
                                            </svg>
                                            <div className="absolute flex flex-col items-center justify-center">
                                                <span className="text-4xl font-black text-[#212c46] font-mono">{availability.toFixed(1)}<span className="text-xl text-[#7a8b95]">%</span></span>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-[#7a8b95] mt-6 text-center font-bold uppercase tracking-widest">Operating / Planned</p>
                                    </div>
                                    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl border border-[#eaeaec] shadow-sm">
                                        <h4 className="text-[11px] font-black text-[#7a8b95] uppercase tracking-widest mb-6">Quality</h4>
                                        <div className="relative w-44 h-44 flex items-center justify-center">
                                            <svg className="w-full h-full transform -rotate-90 drop-shadow-sm" viewBox="0 0 100 100">
                                                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#eaeaec" strokeWidth="8" />
                                                <circle cx="50" cy="50" r="40" fill="transparent" stroke={CHART_THEME.success} strokeWidth="8" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * 98.5) / 100} strokeLinecap="round" className="transition-all duration-1000" />
                                            </svg>
                                            <div className="absolute flex flex-col items-center justify-center">
                                                <span className="text-4xl font-black text-[#212c46] font-mono">98.5<span className="text-xl text-[#7a8b95]">%</span></span>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-[#7a8b95] mt-6 text-center font-bold uppercase tracking-widest">Good / Total Count</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/80 backdrop-blur-md rounded-xl border border-[#eaeaec] shadow-lg p-8 flex-1 min-h-[350px]">
                                <h3 className="font-black text-[#212c46] flex items-center gap-2 uppercase tracking-widest mb-6 text-[14px]"><LucideIcon name="trending-up" size={18} className="text-[#932c2e]" /> OEE Trend (Last 7 Days)</h3>
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={[
                                            { name: 'Mon', oee: 75, target: 85 }, { name: 'Tue', oee: 78, target: 85 },
                                            { name: 'Wed', oee: 82, target: 85 }, { name: 'Thu', oee: 76, target: 85 },
                                            { name: 'Fri', oee: 79, target: 85 }, { name: 'Sat', oee: 84, target: 85 },
                                            { name: 'Sun', oee: 78, target: 85 }
                                        ]}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaec" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#7a8b95', fontFamily: 'JetBrains Mono', fontWeight: 'bold' }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#7a8b95', fontFamily: 'JetBrains Mono', fontWeight: 'bold' }} domain={[60, 100]} />
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #eaeaec', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)' }} />
                                            <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '20px', fontWeight: 'bold', color: '#212c46' }} />
                                            <Line type="monotone" dataKey="oee" name="Actual OEE %" stroke={CHART_THEME.primary} strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'white' }} activeDot={{ r: 6, fill: CHART_THEME.primary, stroke: 'white' }} />
                                            <Line type="monotone" dataKey="target" name="Target (85%)" stroke="#4d87a8" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'dashboard' && (
                        <div className="flex flex-col gap-6 animate-fadeIn h-full">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white/80 backdrop-blur-md rounded-xl border border-[#eaeaec] shadow-lg p-8 h-[450px]">
                                    <h3 className="font-black text-[#212c46] flex items-center gap-2 uppercase tracking-widest mb-6 text-[14px]"><LucideIcon name="bar-chart-2" size={18} className="text-[#932c2e]" /> Downtime by Machine</h3>
                                    <div className="h-[320px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={
                                                Object.values(breakdowns.reduce((acc, curr) => {
                                                    if (!acc[curr.machineName]) acc[curr.machineName] = { name: curr.machineName, downtime: 0 };
                                                    acc[curr.machineName].downtime += curr.downtimeMinutes;
                                                    return acc;
                                                }, {})).sort((a: any, b: any) => b.downtime - a.downtime).slice(0, 5)
                                            } layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eaeaec" />
                                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#7a8b95', fontFamily: 'JetBrains Mono', fontWeight: 'bold' }} />
                                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#212c46', fontWeight: 'bold' }} width={140} />
                                                <Tooltip cursor={{ fill: '#f8f9fa' }} contentStyle={{ borderRadius: '12px', border: '1px solid #eaeaec', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)' }} />
                                                <Bar dataKey="downtime" name="Downtime (Min)" fill={CHART_THEME.primary} radius={[0, 4, 4, 0]} barSize={20} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="bg-white/80 backdrop-blur-md rounded-xl border border-[#eaeaec] shadow-lg p-8 h-[450px]">
                                    <h3 className="font-black text-[#212c46] flex items-center gap-2 uppercase tracking-widest mb-6 text-[14px]"><LucideIcon name="pie-chart" size={18} className="text-[#932c2e]" /> Top Issues</h3>
                                    <div className="h-[320px] w-full flex items-center justify-center">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={
                                                        Object.values(breakdowns.reduce((acc, curr) => {
                                                            const prob = curr.problem.substring(0, 20) + (curr.problem.length > 20 ? '...' : '');
                                                            if (!acc[prob]) acc[prob] = { name: prob, value: 0 };
                                                            acc[prob].value += 1;
                                                            return acc;
                                                        }, {})).sort((a: any, b: any) => b.value - a.value).slice(0, 4)
                                                    }
                                                    cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={5} dataKey="value"
                                                >
                                                    {
                                                        [CHART_THEME.primary, CHART_THEME.warning, CHART_THEME.info, CHART_THEME.secondary].map((color, index) => (
                                                            <Cell key={`cell-${index}`} fill={color} stroke="none" />
                                                        ))
                                                    }
                                                </Pie>
                                                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #eaeaec', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)' }} />
                                                <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#212c46' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
