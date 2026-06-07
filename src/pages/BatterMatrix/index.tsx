import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { useCollection } from '../../services/useFirestore';

import { DraggableModal } from '../../components/shared/DraggableModal';
import { UserGuidePanel } from '../../components/shared/UserGuidePanel';
import { CsvUpload } from '../../components/shared/CsvUpload';
import KpiCard from '../../components/shared/KpiCard';

// --- Mocking External Dependencies for Standalone Run ---
const Swal = typeof window !== 'undefined' ? (window as any).Swal || null : null;
const Papa = typeof window !== 'undefined' ? (window as any).Papa || null : null;

// --- Comprehensive Mock Data (22 Items) ---
export const MOCK_STANDARDS = [
    {id: 'BT-CK-STD', name: 'เนื้อไส้กรอกไก่ (Standard)'},
    {id: 'BT-MB-CK-A', name: 'เนื้อลูกชิ้นไก่เกรด A'},
    {id: 'BT-MB-FH', name: 'เนื้อลูกชิ้นปลาเยาวราช'},
    {id: 'BT-BL-CH', name: 'เนื้อโบโลน่าผสมพริก'},
    {id: 'BT-HM-CK', name: 'เนื้อแฮมไก่'},
    {id: 'BT-KY', name: 'เนื้อไก๋ยอ'},
    {id: 'BT-BL-PK', name: 'เนื้อโบโลน่าหมู'},
    {id: 'BT-PK-STD', name: 'เนื้อไส้กรอกหมู (Standard)'},
    {id: 'BT-MB-PK-A', name: 'เนื้อลูกชิ้นหมูเกรด A'},
    {id: 'BT-MB-BF', name: 'เนื้อลูกชิ้นวัว'},
    {id: 'BT-MB-BF-T', name: 'เนื้อลูกชิ้นเอ็นวัว'},
    {id: 'BT-CK-GR', name: 'เนื้อไส้กรอกไก่กระเทียม'},
    {id: 'BT-CK-VN', name: 'เนื้อไส้กรอกไก่วุ้นเส้น'},
    {id: 'BT-HM-YK', name: 'เนื้อยอร์คแฮม'},
    {id: 'BT-BC-SM', name: 'เนื้อเบคอนรมควัน'},
    {id: 'BT-MY-BP', name: 'เนื้อหมูยอพริกไทยดำ'},
    {id: 'BT-MB-SQ', name: 'เนื้อลูกชิ้นปลาหมึก'},
    {id: 'FL-CHZ', name: 'ไส้ชีส (Cheese Filling)'},
    {id: 'FL-KTC', name: 'ซอสมะเขือเทศ (Ketchup Filling)'},
    {id: 'LY-CK-GRN', name: 'เนื้อไก่บดผสมผักโขม (Green Layer)'},
    {id: 'LY-CK-WHT', name: 'เนื้อไก่บดสีขาว (White Layer)'},
    {id: 'LY-CK-RED', name: 'เนื้อไก่บดผสมปาปริก้า (Red Layer)'},
];

export const MOCK_MATRIX = [
    { 
        id: 'SFG-001', name: 'ไส้กรอกไก่รมควัน 6 นิ้ว (จัมโบ้)', 
        batterConfig: [{id: 'BT-CK-STD', ratio: 100}], 
        fgs: [{sku: 'FG-1001', name: 'SMC ไส้กรอกไก่ ARO 1kg', weight: 1, pieces: 20}, {sku: 'FG-1002', name: 'SMC ไส้กรอกไก่ 500g', weight: 0.5, pieces: 10}, {sku: 'FG-1003', name: 'SMC ไส้กรอกไก่ 5kg', weight: 5, pieces: 100}] 
    },
    { 
        id: 'SFG-002', name: 'ไส้กรอกไก่คอกเทล 4 นิ้ว', 
        batterConfig: [{id: 'BT-CK-STD', ratio: 100}], 
        fgs: [{sku: 'FG-2001', name: 'CP Frank Cocktail 1kg', weight: 1, pieces: 80}, {sku: 'FG-2002', name: 'CP Frank Cocktail 0.5kg', weight: 0.5, pieces: 40}, {sku: 'FG-2003', name: 'CP Frank 1kg', weight: 1, pieces: 80}, {sku: 'FG-2004', name: 'CP Frank 0.5kg', weight: 0.5, pieces: 40}, {sku: 'FG-2005', name: 'CP Frank 0.2kg', weight: 0.2, pieces: 15}, {sku: 'FG-2006', name: 'CP Frank 5kg', weight: 5, pieces: 400}] 
    },
    { 
        id: 'SFG-003', name: 'ลูกชิ้นไก่ (ต้มสุก)', 
        batterConfig: [{id: 'BT-MB-CK-A', ratio: 100}], 
        fgs: [{sku: 'FG-3001', name: 'ลูกชิ้นไก่เกรด A 1kg', weight: 1, pieces: 100}, {sku: 'FG-3002', name: 'ลูกชิ้นไก่เกรด A 0.5kg', weight: 0.5, pieces: 50}] 
    },
    { 
        id: 'SFG-004', name: 'ลูกชิ้นปลา (ต้มสุก)', 
        batterConfig: [{id: 'BT-MB-FH', ratio: 100}], 
        fgs: [{sku: 'FG-3005', name: 'ลูกชิ้นปลาเยาวราช', weight: 0.5, pieces: 45}] 
    },
    { 
        id: 'SFG-005', name: 'ลูกชิ้นไก่ (ย่างเสียบไม้)', 
        batterConfig: [{id: 'BT-MB-CK-A', ratio: 100}], 
        fgs: [{sku: 'FG-3010', name: 'ลูกชิ้นไก่ย่าง', weight: 0.8, pieces: 10}] 
    },
    { 
        id: 'SFG-006', name: 'โบโลน่าไก่พริก (แท่งยาวรอสไลซ์)', 
        batterConfig: [{id: 'BT-BL-CH', ratio: 100}], 
        fgs: [{sku: 'FG-4001', name: 'BKP Chili Bologna 1kg', weight: 1, pieces: 50}, {sku: 'FG-4002', name: 'BKP Chili Bologna 0.2kg', weight: 0.2, pieces: 10}] 
    },
    { 
        id: 'SFG-007', name: 'แฮมไก่ (Block สี่เหลี่ยมรอสไลซ์)', 
        batterConfig: [{id: 'BT-HM-CK', ratio: 100}], 
        fgs: [{sku: 'FG-4005', name: 'Chicken Ham Block', weight: 0.5, pieces: 25}] 
    },
    { 
        id: 'SFG-008', name: 'ไก่ยอแผ่น (นึ่งสายพาน)', 
        batterConfig: [{id: 'BT-KY', ratio: 100}], 
        fgs: [{sku: 'FG-5001', name: 'ไก่ยอแผ่นเล็ก', weight: 0.5, pieces: 5}, {sku: 'FG-5002', name: 'ไก่ยอแผ่นใหญ่', weight: 1, pieces: 10}] 
    },
    { 
        id: 'SFG-009', name: 'ไส้กรอกไก่สอดไส้ชีส (Cheese-Stuffed)', 
        batterConfig: [{id: 'BT-CK-STD', ratio: 80}, {id: 'FL-CHZ', ratio: 20}], 
        fgs: [{sku: 'FG-8001', name: 'Cheese Sausage 0.5kg', weight: 0.5, pieces: 30}] 
    },
    { 
        id: 'SFG-010', name: 'ไส้กรอกไก่สอดไส้ซอสมะเขือเทศ (Ketchup-Stuffed)', 
        batterConfig: [{id: 'BT-CK-STD', ratio: 85}, {id: 'FL-KTC', ratio: 15}], 
        fgs: [{sku: 'FG-8002', name: 'Ketchup Sausage 1kg', weight: 1, pieces: 60}] 
    },
    { 
        id: 'SFG-011', name: 'โบโลน่าหมู (แท่งยาวรอสไลซ์)', 
        batterConfig: [{id: 'BT-BL-PK', ratio: 100}], 
        fgs: [{sku: 'FG-4011', name: 'Pork Bologna 1kg', weight: 1, pieces: 50}] 
    },
    { 
        id: 'SFG-012', name: 'ไส้กรอกหมูรมควัน 5 นิ้ว', 
        batterConfig: [{id: 'BT-PK-STD', ratio: 100}], 
        fgs: [{sku: 'FG-1012', name: 'Smoked Pork Sausage 1kg', weight: 1, pieces: 25}, {sku: 'FG-1013', name: 'Smoked Pork Sausage 0.5kg', weight: 0.5, pieces: 12}] 
    },
    { 
        id: 'SFG-013', name: 'ลูกชิ้นหมู (ต้มสุก)', 
        batterConfig: [{id: 'BT-MB-PK-A', ratio: 100}], 
        fgs: [{sku: 'FG-3013', name: 'Pork Meatball 1kg', weight: 1, pieces: 100}, {sku: 'FG-3014', name: 'Pork Meatball 0.5kg', weight: 0.5, pieces: 50}] 
    },
    { 
        id: 'SFG-014', name: 'ลูกชิ้นเนื้อ (ต้มสุก)', 
        batterConfig: [{id: 'BT-MB-BF', ratio: 100}], 
        fgs: [{sku: 'FG-3015', name: 'Beef Meatball 1kg', weight: 1, pieces: 90}] 
    },
    { 
        id: 'SFG-015', name: 'ลูกชิ้นเอ็นเนื้อ', 
        batterConfig: [{id: 'BT-MB-BF-T', ratio: 100}], 
        fgs: [{sku: 'FG-3016', name: 'Beef Tendon Meatball 1kg', weight: 1, pieces: 90}, {sku: 'FG-3017', name: 'Beef Tendon Meatball 0.5kg', weight: 0.5, pieces: 45}] 
    },
    { 
        id: 'SFG-016', name: 'ไส้กรอกไก่กระเทียมพริกไทย', 
        batterConfig: [{id: 'BT-CK-GR', ratio: 100}], 
        fgs: [{sku: 'FG-1016', name: 'Garlic Chicken Sausage 1kg', weight: 1, pieces: 30}] 
    },
    { 
        id: 'SFG-017', name: 'ไส้กรอกไก่วุ้นเส้น', 
        batterConfig: [{id: 'BT-CK-VN', ratio: 100}], 
        fgs: [{sku: 'FG-1017', name: 'Vermicelli Chicken Sausage 1kg', weight: 1, pieces: 25}, {sku: 'FG-1018', name: 'Vermicelli Chicken Sausage 0.5kg', weight: 0.5, pieces: 12}] 
    },
    { 
        id: 'SFG-018', name: 'ยอร์คแฮม (York Ham Block)', 
        batterConfig: [{id: 'BT-HM-YK', ratio: 100}], 
        fgs: [{sku: 'FG-4018', name: 'York Ham Block 2kg', weight: 2, pieces: 100}] 
    },
    { 
        id: 'SFG-019', name: 'เบคอนสไลซ์ (Smoked Bacon)', 
        batterConfig: [{id: 'BT-BC-SM', ratio: 100}], 
        fgs: [{sku: 'FG-4019', name: 'Smoked Bacon 0.5kg', weight: 0.5, pieces: 20}, {sku: 'FG-4020', name: 'Smoked Bacon 1kg', weight: 1, pieces: 40}] 
    },
    { 
        id: 'SFG-020', name: 'ไส้กรอกไก่ชีสไบท์ (Cheese Bite)', 
        batterConfig: [{id: 'BT-CK-STD', ratio: 75}, {id: 'FL-CHZ', ratio: 25}], 
        fgs: [{sku: 'FG-8020', name: 'Cheese Bite Sausage 1kg', weight: 1, pieces: 100}, {sku: 'FG-8021', name: 'Cheese Bite Sausage 0.5kg', weight: 0.5, pieces: 50}] 
    },
    { 
        id: 'SFG-021', name: 'หมูยอพริกไทยดำ', 
        batterConfig: [{id: 'BT-MY-BP', ratio: 100}], 
        fgs: [{sku: 'FG-5021', name: 'Black Pepper Pork Roll 0.5kg', weight: 0.5, pieces: 3}, {sku: 'FG-5022', name: 'Black Pepper Pork Roll 1kg', weight: 1, pieces: 6}] 
    },
    { 
        id: 'SFG-022', name: 'ลูกชิ้นปลาหมึก (ต้มสุก)', 
        batterConfig: [{id: 'BT-MB-SQ', ratio: 100}], 
        fgs: [{sku: 'FG-3022', name: 'Squid Meatball 0.5kg', weight: 0.5, pieces: 40}] 
    },
    { 
        id: 'SFG-023', name: 'แซนวิซผักโขม 3 ชั้น', 
        batterConfig: [{id: 'LY-CK-WHT', ratio: 30}, {id: 'LY-CK-GRN', ratio: 40}, {id: 'LY-CK-WHT', ratio: 30}], 
        fgs: [{sku: 'FG-9023', name: '3-Layer Spinach Sausage 500g', weight: 0.5, pieces: 20}] 
    },
    { 
        id: 'SFG-024', name: 'แซนวิซผักโขมปาปริก้า', 
        batterConfig: [{id: 'LY-CK-RED', ratio: 15}, {id: 'LY-CK-WHT', ratio: 20}, {id: 'LY-CK-GRN', ratio: 30}, {id: 'LY-CK-WHT', ratio: 20}, {id: 'LY-CK-RED', ratio: 15}], 
        fgs: [{sku: 'FG-9024', name: '5-Layer Tricolor Sausage 1kg', weight: 1, pieces: 40}] 
    }
];

export const MOCK_MASTER = Array.from(new Map(MOCK_MATRIX.flatMap(sfg => sfg.fgs.map(fg => [fg.sku, {...fg, name: fg.name || fg.sku}]))).values());

// --- HELPER COMPONENTS ---

const kebabToPascal = (str: string) => str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
const LucideIcon = ({ name, size = 16, className = "", color, style, strokeWidth = 2 }: any) => {
    const pascalName = kebabToPascal(name);
    const IconComponent = (Icons as any)[pascalName] || (Icons as any)[`${pascalName}Icon`] || Icons.CircleHelp || Icons.Activity;
    if (!IconComponent) return null;
    return <IconComponent size={size} className={className} style={{...style, color: color}} strokeWidth={strokeWidth} />;
};




export function MatrixConfigModal({ isOpen, onClose, sfgData, onSave, batters, fgDatabase, addMasterItem }: any) {
    const [formData, setFormData] = useState<any>(null);
    const [selectedFgSku, setSelectedFgSku] = useState('');
    const [selectedBatterId, setSelectedBatterId] = useState('');

    useEffect(() => {
        if (isOpen && sfgData) {
            const data = JSON.parse(JSON.stringify(sfgData));
            if (!data.batterConfig) data.batterConfig = data.batterId ? [{ id: data.batterId, ratio: 100 }] : [];
            setFormData(data); 
        } else if (isOpen) {
            setFormData({ id: '', name: '', batterConfig: [], fgs: [] }); 
        }
        setSelectedFgSku(''); setSelectedBatterId('');
    }, [isOpen, sfgData]);

    if (!isOpen || !formData) return null;

    const totalRatio = formData.batterConfig.reduce((acc: number, curr: any) => acc + (parseFloat(String(curr.ratio)) || 0), 0);
    const isRatioValid = Math.abs(totalRatio - 100) < 0.1;

    const handleSave = () => {
        if (formData.batterConfig.length > 0 && !isRatioValid) { 
            if(Swal) Swal.fire({ icon: 'warning', title: 'Ratio Mismatch', text: `Total ratio is ${totalRatio}%. It must be 100%.` }); 
            else alert(`Total ratio is ${totalRatio}%. It must be 100%.`);
            return; 
        }
        onSave(formData);
    };

    const handleAddBatter = () => {
        if (selectedBatterId && !formData.batterConfig.some((b: any) => b.id === selectedBatterId)) {
            const currentTotal = formData.batterConfig.reduce((acc: number, curr: any) => acc + (parseFloat(String(curr.ratio)) || 0), 0);
            const remaining = Math.max(0, 100 - currentTotal);
            setFormData({ ...formData, batterConfig: [...formData.batterConfig, { id: selectedBatterId, ratio: remaining }] });
            setSelectedBatterId('');
        }
    };

    const handleAddFgFromDb = () => {
        const inputSku = selectedFgSku.split(' ')[0].trim();
        if (!inputSku) return;
        
        if (formData.fgs.some((f: any) => f.sku && f.sku.trim().toUpperCase() === inputSku.toUpperCase())) { 
            if(Swal) Swal.fire({ icon: 'warning', title: 'Duplicate', text: 'SKU already mapped.', timer: 1000 }); 
            else alert('SKU already mapped.');
            return; 
        }

        const fgMaster = fgDatabase.find((f: any) => f.sku && f.sku.trim().toUpperCase() === inputSku.toUpperCase());
        if (fgMaster) {
            let initialWeight = parseFloat(String(fgMaster.weight));
            if (isNaN(initialWeight) || initialWeight <= 0) {
                // If weight in Master Item is specified in grams (e.g. 1000) or is empty
                initialWeight = 1;
            } else if (initialWeight > 50) {
                // If it is in grams representation (e.g. 500g or 1000g), convert g to kg for matrix display
                initialWeight = initialWeight / 1000;
            }
            const initialPieces = parseInt(String(fgMaster.pieces)) || 0;
            setFormData({ ...formData, fgs: [...formData.fgs, { sku: fgMaster.sku, name: fgMaster.name, brand: fgMaster.brand || '', weight: initialWeight, pieces: initialPieces }] });
        } else {
            const tempName = `N/A - ${inputSku}`;
            setFormData({ ...formData, fgs: [...formData.fgs, { sku: inputSku, name: tempName, pieces: 0, weight: 1 }] });
            // Auto add to Master Items
            if (addMasterItem) {
                try {
                    addMasterItem({ sku: inputSku, name: tempName, weight: 1, category: 'FG', type: 'Generated' });
                    if(Swal) Swal.fire({ icon: 'info', title: 'Auto-Created', text: `Added ${inputSku} to Master Items.`, timer: 1500, showConfirmButton: false });
                } catch(e) {}
            }
        }
        setSelectedFgSku('');
    };

    return (
        <DraggableModal isOpen={isOpen} onClose={onClose} width="max-w-5xl" hideDefaultHeader hideCloseButton>
            <div className="bg-white rounded-xl w-full overflow-hidden flex flex-col h-[85vh]">
                <div className="bg-[#212c46] px-8 py-5 flex justify-between items-center shrink-0 border-b border-[#212c46] drag-handle cursor-move">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/20">
                            <LucideIcon name="settings-2" size={20} color="white"/>
                        </div>
                        Product Structure Config
                    </h3>
                    <button onClick={onClose} className="text-white/50 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-1.5 rounded-lg"><LucideIcon name="x" size={20} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50 custom-scrollbar">
                    
                    {/* Basic Info */}
                    <div className="sys-table-card shadow-sm p-6 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">SFG Code</label>
                                <input type="text" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} className="sys-input w-full font-mono font-bold focus:border-red-600 focus:bg-white" disabled={!!sfgData} placeholder="E.g. SFG-001" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">SFG Name</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="sys-input w-full focus:bg-white" placeholder="Enter product name..." />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Batter Config */}
                        <div className="sys-table-card shadow-sm p-6 flex flex-col h-[400px]">
                            <h4 className="text-[12px] font-black text-[#212c46] border-b border-slate-200 pb-3 mb-5 uppercase tracking-widest flex justify-between items-center">
                                <span>Batter Composition</span>
                                <span className={`text-[10px] px-2 py-1 rounded-md font-mono ${isRatioValid ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600 animate-pulse'}`}>Total: {totalRatio}%</span>
                            </h4>
                            <div className="flex gap-2 mb-4">
                                <div className="relative flex-1">
                                    <select value={selectedBatterId} onChange={e => setSelectedBatterId(e.target.value)} className="sys-input w-full appearance-none pr-10 cursor-pointer">
                                        <option value="">-- Select Batter Standard --</option>
                                        {batters.map((b: any) => <option key={b.id} value={b.id}>{b.id} | {b.name}</option>)}
                                    </select>
                                    <Icons.ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                                <button onClick={handleAddBatter} className="bg-slate-500 hover:bg-[#212c46] text-white px-4 py-2.5 rounded-xl transition-colors shadow-sm"><LucideIcon name="plus" size={16} color="white"/></button>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                                {formData.batterConfig.map((b: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center p-2 border border-slate-200 rounded-xl bg-slate-50 text-[12px] shadow-sm">
                                        <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                                            <span className="text-[#a94228] font-black font-mono whitespace-nowrap">{b.id}</span>
                                            <span className="text-[#212c46] font-bold truncate">{batters.find((x: any) => x.id === b.id)?.name || b.id}</span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <input type="number" value={b.ratio} onChange={e => {const newC = [...formData.batterConfig]; newC[idx].ratio = parseFloat(e.target.value)||0; setFormData({...formData, batterConfig: newC})}} className="sys-input w-14 text-center font-black text-[#4d87a8] focus:bg-white font-mono p-1" />
                                            <span className="text-slate-400 font-bold font-mono text-[10px]">%</span>
                                            <button onClick={() => setFormData({...formData, batterConfig: formData.batterConfig.filter((x: any)=>x.id!==b.id)})} className="text-[#7a8b95] hover:text-[#a94228] bg-white p-1.5 rounded-md border border-slate-200 hover:border-red-200 transition-all shadow-sm"><LucideIcon name="trash-2" size={14}/></button>
                                        </div>
                                    </div>
                                ))}
                                {formData.batterConfig.length === 0 && <div className="text-center text-slate-400 text-[10px] uppercase tracking-widest font-bold pt-10 opacity-60">No batters configured</div>}
                            </div>
                        </div>

                        {/* FG Mapping */}
                        <div className="sys-table-card shadow-sm p-6 flex flex-col h-[400px]">
                            <h4 className="text-[12px] font-black text-[#212c46] border-b border-slate-200 pb-3 mb-5 uppercase tracking-widest">Mapped SKUs (FGs)</h4>
                            <div className="flex gap-2 mb-4">
                                <div className="relative flex-1">
                                    <input type="text" list="fgList" value={selectedFgSku} onChange={e => setSelectedFgSku(e.target.value)} className="sys-input w-full" placeholder="Search & Select FG SKU..." />
                                    <datalist id="fgList">{fgDatabase.map((fg: any, idx: number) => <option key={`${fg.sku}-${idx}`} value={`${fg.sku} ${fg.name}`} />)}</datalist>
                                </div>
                                <button onClick={handleAddFgFromDb} className="bg-red-700 hover:bg-red-800 text-white px-4 py-2.5 rounded-xl transition-colors shadow-sm"><LucideIcon name="plus" size={16} color="white"/></button>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                                {formData.fgs.map((fg: any, idx: number) => (
                                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-slate-200 rounded-xl bg-slate-50 text-[12px] shadow-sm gap-2">
                                        <div className="flex flex-1 min-w-0 pr-2 truncate">
                                            <span className="text-[#212c46] font-bold truncate">
                                                <span className="text-[#a94228] font-black font-mono mr-1">{fg.sku}</span> {fg.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <div className="flex items-center gap-1 bg-slate-100/80 px-2 py-1.5 rounded border border-slate-200" title="Edit in Master Item">
                                                <span className="text-slate-400 font-bold font-mono text-[10px] mr-1">W:</span>
                                                <span className="font-black text-[#4d87a8] font-mono text-[11px] min-w-[24px] text-center">{fg.weight || 0}</span>
                                                <span className="text-slate-400 font-bold font-mono text-[10px] ml-1">kg</span>
                                            </div>
                                            <div className="flex items-center gap-1 bg-slate-100/80 px-2 py-1.5 rounded border border-slate-200" title="Edit in Master Item">
                                                <span className="text-slate-400 font-bold font-mono text-[10px] mr-1">P:</span>
                                                <span className="font-black text-red-600 font-mono text-[11px] min-w-[20px] text-center">{fg.pieces || 0}</span>
                                                <span className="text-slate-400 font-bold font-mono text-[10px] ml-1">pcs</span>
                                            </div>
                                            <button onClick={() => setFormData({...formData, fgs: formData.fgs.filter((_: any, i: number) => i !== idx)})} className="text-[#7a8b95] hover:text-[#a94228] bg-white p-1.5 rounded-md border border-slate-200 hover:border-red-200 transition-all shadow-sm"><LucideIcon name="trash-2" size={14}/></button>
                                        </div>
                                    </div>
                                ))}
                                {formData.fgs.length === 0 && <div className="text-center text-slate-400 text-[10px] uppercase tracking-widest font-bold pt-10 opacity-60">No Finished Goods Mapped</div>}
                            </div>
                        </div>
                    </div>

                </div>
                <div className="p-5 bg-white border-t border-slate-200 flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-6 py-2.5 text-slate-500 hover:text-[#212c46] font-bold text-[12px] uppercase tracking-widest transition-colors">Cancel</button>
                    <button onClick={handleSave} className="sys-btn-primary px-8 py-2.5 flex items-center gap-2"><LucideIcon name="save" size={14} color="white"/> Save Config</button>
                </div>
            </div>
        </DraggableModal>
    );
}



export default function BatterMatrix() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [editModeItem, setEditModeItem] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [showGuide, setShowGuide] = useState(false);
    const [itemsPerPage, setItemsPerPage] = useState(15);
    
    // We can fetch from collections, but for simplicity we rely on the same schemas as ProductMatrix.
    const { data: dbBatters } = useCollection('Meat_Formula', MOCK_STANDARDS as any);
    const { data: dbMatrix, update: updateMatrix, add: addMatrix } = useCollection('Batter_Matrix', MOCK_MATRIX as any);
    const { data: dbMaster, add: addMasterItem } = useCollection('Master_Item', MOCK_MASTER as any);

    const batters = dbBatters && dbBatters.length > 0 ? dbBatters : MOCK_STANDARDS;
    const rawMatrixData = dbMatrix && dbMatrix.length > 0 ? dbMatrix : MOCK_MATRIX;
    const masterItems = dbMaster && dbMaster.length > 0 ? dbMaster : MOCK_MASTER;

    const matrixData = useMemo(() => {
        return rawMatrixData.map(item => {
            let bConf = item.batterConfig;
            let fgsConf = item.fgs;
            if (typeof bConf === 'string') {
                try { bConf = JSON.parse(bConf); } catch(e) { bConf = []; }
            }
            if (typeof fgsConf === 'string') {
                try { fgsConf = JSON.parse(fgsConf); } catch(e) { fgsConf = []; }
            }
            return {
                ...item,
                batterConfig: Array.isArray(bConf) ? bConf : [],
                fgs: Array.isArray(fgsConf) ? fgsConf : []
            };
        });
    }, [rawMatrixData]);

    const filteredData = useMemo(() => 
        matrixData.filter(item => 
            (item.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) || 
            (item.id || '').toLowerCase().includes((searchTerm || '').toLowerCase())
        ), [searchTerm, matrixData]
    );

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredData.slice(start, start + itemsPerPage);
    }, [filteredData, currentPage]);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const handleSave = async (item: any) => { 
        try {
            const payload = { 
                id: item.id || '',
                name: item.name || '',
                batterConfig: item.batterConfig || [],
                fgs: item.fgs || [],
                updatedAt: new Date().toLocaleDateString('en-GB')
            };
            if (editModeItem && editModeItem.id) {
                await updateMatrix(item.id, payload);
            } else {
                await addMatrix(payload);
            }
            if(Swal) Swal.fire({ icon: 'success', title: 'Saved!', timer: 1500, showConfirmButton: false });
            setEditModeItem(null);
        } catch(e: any) {
            console.error("Save error", e);
            if(Swal) Swal.fire({ icon: 'error', title: 'Failed to save', text: String(e.message || e), timer: 3000, showConfirmButton: false });
        }
    };

    return (
        <div className="flex flex-1 w-full flex-col animate-fadeIn bg-transparent space-y-4">
            <button onClick={() => setShowGuide(true)} className="fixed right-0 top-[80px] bg-[#f8f9fa] border border-[#eaeaec] border-r-0 text-[#212c46] py-8 px-1.5 rounded-l-xl shadow-md hover:bg-[#932c2e] hover:text-white hover:border-[#932c2e] transition-all duration-500 z-[100] flex flex-col items-center gap-4 group">
                <Icons.HelpCircle size={18} className="shrink-0 group-hover:rotate-12 transition-transform text-[#7a8b95] group-hover:text-white" />
                <span className="font-black tracking-[0.3em] [writing-mode:vertical-rl] rotate-180 whitespace-nowrap uppercase text-[11px]">USER GUIDE</span>
            </button>
            <UserGuidePanel
                isOpen={showGuide}
                onClose={() => setShowGuide(false)}
                title="END-TO-END TRACING GUIDE"
                subtitle="BATTER AND SFG TRACING"
            >
                <div className="space-y-8 font-sans">
                    <div>
                        <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                            <Icons.Network size={16} className="text-[#3f809e]" /> 1. ความเข้าใจระบบ Tracing
                        </h3>
                        <p className="mb-4 text-[#414757]">
                            หน้านี้ใช้สำหรับแสดงโครงสร้างของสินค้ากึ่งสำเร็จ (SFG) ว่ามีความเชื่อมโยงกับสูตรส่วนผสมน้ำเนื้อ (Batter) ต่างๆ อย่างไร โดยจะแสดงให้เห็นถึงโครงสร้างตั้งแต่ต้นน้ำถึงปลายน้ำ:
                        </p>
                        <div className="space-y-3">
                            <div className="p-3 bg-[#f8f9fa] border border-[#eaeaec] flex items-start gap-4 rounded-xl text-[12px]">
                                <div className="bg-[#b58c4f] text-white p-2 rounded-lg shrink-0 w-12 flex justify-center"><Icons.Droplets size={16} /></div>
                                <div>
                                    <strong className="text-[#212c46]">ฝั่งซ้าย: แหล่งที่มา (Batter Formulation)</strong>
                                    <p className="text-[#7a8b95]">แสดงสูตรส่วนผสมน้ำเนื้อที่ใช้เป็นวัตถุดิบต้นทางในการขึ้นเป็น SFG ร่วมกับสัดส่วน % ที่นำมาใช้</p>
                                </div>
                            </div>
                            <div className="p-3 bg-[#f8f9fa] border border-[#eaeaec] flex items-start gap-4 rounded-xl text-[12px]">
                                <div className="bg-[#3f809e] text-white p-2 rounded-lg shrink-0 w-12 flex justify-center"><Icons.Box size={16} /></div>
                                <div>
                                    <strong className="text-[#212c46]">ตรงกลาง: สินค้ากึ่งสำเร็จ (SFG)</strong>
                                    <p className="text-[#7a8b95]">รหัสและชื่อของสินค้ากึ่งสำเร็จรูปที่เป็นจุดศูนย์กลางของการวิเคราะห์ในหน้านี้</p>
                                </div>
                            </div>
                            <div className="p-3 bg-[#f8f9fa] border border-[#eaeaec] flex items-start gap-4 rounded-xl text-[12px]">
                                <div className="bg-[#a94228] text-white p-2 rounded-lg shrink-0 w-12 flex justify-center"><Icons.Package size={16} /></div>
                                <div>
                                    <strong className="text-[#212c46]">ฝั่งขวา: ปลายทาง (Linked FG)</strong>
                                    <p className="text-[#7a8b95]">แสดงสินค้าสำเร็จรูปพร้อมขายทั้งหมดที่มีระบุว่าเกิดจากการนำ SFG ตัวนี้ไปใช้งาน</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-[#eaeaec] w-full" />

                    <div>
                        <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                            <Icons.Settings size={16} className="text-[#b58c4f]" /> 2. การจัดการและแก้ไขความเชื่อมโยง (CONFIG MODE)
                        </h3>
                        <p className="mb-4 text-[#414757]">
                            ในตารางหลัก คุณสามารถกดปุ่มเครื่องมือ <span className="text-[#4d87a8] font-bold">Tree View</span> และ <span className="text-[#a94228] font-bold">Edit Matrix</span> ที่ท้ายรายการของแต่ละ SFG:
                        </p>
                        <div className="p-4 bg-[#fdf2f2] border border-[#f5c6cb] rounded-xl text-[#414757] text-[12px]">
                            <ul className="list-decimal pl-5 space-y-2">
                                <li><strong>Tree View (สัญลักษณ์รูปดวงตา):</strong> ดูภาพรวมโครงสร้างและการไหลของสัดส่วนวัตถุดิบ (End-to-End Dependency) อย่างชัดเจนและง่ายต่อการวิเคราะห์ข้ามสูตร</li>
                                <li><strong>Edit Matrix (สัญลักษณ์รูปดินสอ):</strong> แก้ไขโครงสร้างในระดับ Batter Configuration สำหรับการกำหนดเป้าประสงค์ผสมหลักใหม่เพื่อเชื่อมต่อข้อมูลให้สมบูรณ์</li>
                            </ul>
                        </div>
                        <p className="mt-4 text-[#7a8b95] text-[11px] italic">
                            *ข้อมูลจะเชื่อมโยงถึงข้อมูลหลักและมีผลกับการคำนวณการใช้วัตถุดิบทั้งระบบ
                        </p>
                    </div>
                </div>
            </UserGuidePanel>
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 sm:px-8 h-14 shrink-0 transition-all gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white border border-[#eaeaec] flex items-center justify-center shadow-sm shrink-0">
                        <Icons.Network size={20} className="text-[#a94228]" />
                    </div>
                    <div className="flex flex-col">
                        <h3 className="font-black text-[#212c46] uppercase tracking-tighter leading-none font-exception-header" style={{ fontSize: '24px' }}>
                            END-TO-END <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#932c2e] to-[#d96245]">TRACING</span>
                        </h3>
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest mt-0.5 leading-none">
                            BATTER / SFG / FG MATRIX OVERVIEW
                        </p>
                    </div>
                </div>
            </div>

            {/* Container */}
            <div className="max-w-[1532px] mx-auto px-4 sm:px-8 w-full flex-1 flex flex-col z-10 relative">
                
                {/* KPI STATS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 shrink-0">
                    <KpiCard label="Total Matrices" value={matrixData.length} icon="git-merge" colorAccent="#4d87a8" colorValue="#212c46" desc="Configured Formulations" />
                    <KpiCard label="Base Materials" value={batters.length} icon="beaker" colorAccent="#2e7d32" colorValue="#212c46" desc="Available Batters/Layers" />
                    <KpiCard label="Target FG" value={matrixData.reduce((acc: any, curr: any) => acc + (curr.fgs?.length || 0), 0)} icon="package" colorAccent="#d96245" colorValue="#212c46" desc="Linked Finished Goods" />
                    <KpiCard label="Completion Rate" value={`${Math.round((matrixData.filter((m: any) => m.fgs?.length > 0 && m.batterConfig?.length > 0).length / Math.max(matrixData.length, 1)) * 100)}%`} icon="check-circle" colorAccent="#b7a159" colorValue="#212c46" desc="Fully Mapped" />
                </div>

                {/* TOOLBAR */}
                <div className="w-full flex-1 flex flex-col min-h-[500px]">
                    <div className="sys-table-card border-[#eaeaec] flex flex-col flex-1 shadow-lg bg-white overflow-hidden rounded-xl border">
                        <div className="py-4 px-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center bg-white gap-4">
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="flex items-center gap-2 text-[12px] font-black text-[#212c46] uppercase tracking-widest">
                                    <Icons.List size={16} className="text-red-700"/>
                                    <span>MATRIX MASTER LIST</span>
                                </div>
                                <span className="hidden md:inline text-slate-300">|</span>
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-md shadow-sm">
                                    {filteredData.length} Records
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                                <div className="relative flex-1 sm:w-64">
                                    <Icons.Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input 
                                        type="text"
                                        placeholder="Search Name or SFG Code..."
                                        value={searchTerm}
                                        onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                        className="sys-input w-full pl-10 pr-4 py-2 h-10"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* TABLE */}
                        <div className="flex-1 overflow-auto flex flex-col bg-white">
                            <div className="overflow-y-auto flex-1 custom-scrollbar">
                                <table className="w-full text-left min-w-[1000px] border-collapse relative table-font">
                                    <thead className="sys-table-header sticky top-0 z-10 shadow-sm slate-200">
                                        <tr>
                                            <th className="pl-6 w-[25%] whitespace-nowrap font-black uppercase tracking-widest">SFG Code & Name</th>
                                            <th className="w-[25%] whitespace-nowrap font-black uppercase tracking-widest text-center">Batter Formulation</th>
                                            <th className="w-[40%] whitespace-nowrap font-black uppercase tracking-widest text-center">Linked FG</th>
                                            <th className="pr-6 text-right w-24 font-black uppercase tracking-widest">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                        {paginatedData.map((item: any) => (
                                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 group">
                                                <td className="sys-table-td px-4 pl-6 align-middle border-b border-slate-100 py-2.5">
                                                    <div className="flex flex-col items-start gap-1">
                                                        <span className="font-bold text-[#212c46] text-[12px] leading-tight font-exception-header">{item.name}</span>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <span className="bg-slate-100 text-slate-500 font-mono font-bold text-[11px] px-1.5 py-0.5 rounded border border-slate-200">{item.id}</span>
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigator.clipboard.writeText(item.id);
                                                                }}
                                                                className="text-slate-400 hover:text-[#4d87a8] transition-colors"
                                                                title="Copy SFG Code"
                                                            >
                                                                <Icons.Copy size={12} strokeWidth={2.5}/>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="sys-table-td align-middle py-2.5 px-4 text-center border-b border-slate-100">
                                                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-widest ${item.batterConfig.length > 0 ? 'bg-amber-50 text-amber-700 border border-amber-200/60 shadow-sm' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>
                                                        <Icons.Blend size={12}/> {item.batterConfig.length} Components
                                                    </span>
                                                </td>
                                                <td className="sys-table-td align-middle py-2.5 px-4 text-center border-b border-slate-100">
                                                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-widest ${item.fgs.length > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-sm' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>
                                                        <Icons.PackageCheck size={12}/> {item.fgs.length} Items
                                                    </span>
                                                </td>
                                                <td className="sys-table-td px-4 pr-6 align-middle border-b border-slate-100 py-2.5">
                                                    <div className="flex justify-end gap-[1px] transition-opacity">
                                                        <button onClick={() => setSelectedItem(item)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#eaeaec] text-[#4d87a8] hover:border-[#212c46] hover:text-[#a94228] hover:bg-[#212c46]/5 transition-all shadow-sm bg-white active:scale-90" title="View Tree">
                                                            <Icons.Eye size={16} />
                                                        </button>
                                                        <button onClick={() => setEditModeItem(item)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#eaeaec] text-[#4d87a8] hover:border-[#212c46] hover:text-[#a94228] hover:bg-[#212c46]/5 transition-all shadow-sm bg-white active:scale-90" title="Edit Matrix">
                                                            <Icons.Pencil size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {paginatedData.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="text-center text-slate-400 font-bold uppercase tracking-widest text-[12px] opacity-70 py-2.5 px-4">
                                                    No Records Found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            
                            {/* Pagination (Synced) */}
                            {totalPages > 0 && (
                                <div className="py-3 px-4 bg-[#F0EAE1]/80 border-t-[1.5px] border-[#adb2b0]/50 flex justify-between items-center font-bold text-slate-500 uppercase tracking-widest shrink-0 font-mono text-[10px]">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-400">Total</span>
                                            <span className="text-[#212c46] bg-white px-2 py-0.5 rounded shadow-sm border border-slate-200">{filteredData.length}</span>
                                            <span className="text-slate-400">Items</span>
                                        </div>
                                        <div className="flex items-center gap-2 border-l border-[#adb2b0]/30 pl-4">
                                            <span className="text-slate-400 hidden sm:inline">Show</span>
                                            <select 
                                                value={itemsPerPage} 
                                                onChange={(e) => {
                                                    setItemsPerPage(Number(e.target.value));
                                                    setCurrentPage(1);
                                                }}
                                                className="bg-white border border-slate-200 rounded px-1 py-0.5 cursor-pointer hover:border-slate-300 transition-colors"
                                            >
                                                <option value={10}>10</option>
                                                <option value={15}>15</option>
                                                <option value={20}>20</option>
                                                <option value={50}>50</option>
                                                <option value={100}>100</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-6 h-6 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-500 hover:text-[#212c46] disabled:opacity-50 transition-colors shadow-sm"><Icons.ChevronLeft size={14}/></button>
                                            <span className="text-[#212c46]">PAGE {currentPage} / {totalPages || 1}</span>
                                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-6 h-6 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-500 hover:text-[#212c46] disabled:opacity-50 transition-colors shadow-sm"><Icons.ChevronRight size={14}/></button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tree Modal View */}
            <DraggableModal 
                isOpen={!!selectedItem} 
                onClose={() => setSelectedItem(null)} 
                title={
                    <div className="flex items-center gap-2 text-[#212c46]">
                        <Icons.Network size={20} className="text-orange-600" />
                        <span>End-to-End Tracing Tree</span>
                    </div>
                }
                width="max-w-5xl"
            >
                {selectedItem && (
                    <div className="p-6 bg-slate-50">
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 relative items-center">
                            
                            {/* BATTER LIST */}
                            <div className="space-y-3 relative z-10 w-full">
                                <div className="text-[10px] font-black uppercase tracking-widest text-[#b58c4f] mb-2 flex items-center gap-1.5"><Icons.Blend size={14}/> Batters</div>
                                {selectedItem.batterConfig.length > 0 ? (
                                    selectedItem.batterConfig.map((bConf: any, idx: number) => {
                                        const batterInfo = batters.find((b: any) => b.id === bConf.id);
                                        return (
                                            <div key={idx} className="bg-[#fcfaf5] border border-[#e8dfce] rounded-xl p-3 flex items-center justify-between shadow-sm">
                                                <div>
                                                    <div className="text-[10px] font-bold font-mono text-[#b58c4f] uppercase tracking-widest leading-none mb-1">{bConf.id}</div>
                                                    <div className="text-[12px] font-black text-[#212c46]">{batterInfo?.name || 'Unknown Batter'}</div>
                                                </div>
                                                <div className="text-[12px] font-black font-mono text-[#b58c4f] bg-[#f5ead7] flex items-center justify-center h-6 px-2 rounded-md">{bConf.ratio}%</div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center p-4 rounded-xl border border-dashed border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-white">
                                        No Batter Linked
                                    </div>
                                )}
                            </div>

                            {/* SFG (CENTER) */}
                            <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 py-8 bg-[#f2f8fc]/50 border border-[#d9edf7] rounded-2xl mx-auto w-full max-w-xs shadow-sm">
                                <div className="hidden xl:block absolute top-1/2 left-0 -ml-8 w-8 border-t-2 border-dashed border-slate-200"></div>
                                <div className="hidden xl:block absolute top-1/2 right-0 -mr-8 w-8 border-t-2 border-dashed border-slate-200"></div>
                                
                                <div className="w-12 h-12 bg-[#3f809e] text-white rounded-xl shadow-lg shadow-[#3f809e]/30 flex items-center justify-center mb-4 min-w-[3rem]">
                                    <Icons.Box size={24} strokeWidth={2.5} />
                                </div>
                                <span className="text-[10px] font-black font-mono tracking-widest uppercase text-[#3f809e] bg-[#d9edf7]/60 flex items-center justify-center h-6 px-2.5 rounded-full mb-2 border border-[#d9edf7]">
                                    {selectedItem.id}
                                </span>
                                <h3 className="text-lg font-black text-[#212c46] leading-tight max-w-[200px] whitespace-normal break-words">{selectedItem.name}</h3>
                                <p className="text-[11px] font-bold text-slate-500 mt-2 uppercase tracking-widest">SFG Component</p>
                            </div>

                            {/* FG LIST */}
                            <div className="space-y-3 relative z-10 w-full">
                                <div className="text-[10px] font-black uppercase tracking-widest text-[#a94228] mb-2 flex items-center gap-1.5"><Icons.PackageCheck size={14}/> Finished Goods</div>
                                {selectedItem.fgs.length > 0 ? (
                                    selectedItem.fgs.map((fg: any, idx: number) => (
                                        <div key={idx} className="bg-[#fdf2f2] border border-[#f2d9db] rounded-xl p-3 flex items-start gap-3 shadow-sm">
                                            <div className="w-8 h-8 rounded-lg bg-white/70 text-[#a94228] flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#f5c6cb]">
                                                <Icons.Package size={16} strokeWidth={2.5}/>
                                            </div>
                                            <div className="overflow-hidden flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-bold font-mono text-[#a94228] uppercase tracking-widest leading-none bg-[#f5c6cb]/40 border border-[#f2d9db] flex flex-col justify-center h-5 px-1.5 rounded">{fg.sku}</span>
                                                </div>
                                                <div className="text-[12px] font-black text-[#212c46] mb-1 truncate">{fg.name}</div>
                                                <div className="text-[10px] font-bold font-mono text-[#7a8b95] uppercase tracking-widest flex items-center gap-2">
                                                    <span className="flex items-center h-4"><Icons.Scale size={10} className="inline mr-1"/> {fg.weight}kg</span>
                                                    <span className="flex items-center h-4"><Icons.Boxes size={10} className="inline mr-1"/> {fg.pieces} pcs</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center p-4 rounded-xl border border-dashed border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-white">
                                        No Finished Goods Linked
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                )}
            </DraggableModal>

            <MatrixConfigModal
                isOpen={!!editModeItem}
                onClose={() => setEditModeItem(null)}
                sfgData={editModeItem}
                onSave={handleSave}
                batters={batters}
                fgDatabase={masterItems}
                addMasterItem={addMasterItem}
            />
        </div>
    );
}
