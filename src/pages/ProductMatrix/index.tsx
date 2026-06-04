import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import * as Icons from 'lucide-react';
import { UserGuidePanel } from '@/src/components/shared/UserGuidePanel';
import KpiCard from '../../components/shared/KpiCard';
import { DraggableModal } from '../../components/shared/DraggableModal';
import { CsvUpload } from '../../components/shared/CsvUpload';
import { CsvExport } from '../../components/shared/CsvExport';
import { useCollection } from '../../services/useFirestore';

// --- Mocking External Dependencies for Standalone Run ---
const Swal = typeof window !== 'undefined' ? (window as any).Swal || null : null;
const Papa = typeof window !== 'undefined' ? (window as any).Papa || null : null;

// --- Comprehensive Mock Data (22 Items) ---
const MOCK_STANDARDS = [
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

const MOCK_MATRIX = [
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

const MOCK_MASTER = MOCK_MATRIX.flatMap(sfg => sfg.fgs.map(fg => ({...fg, name: fg.name || fg.sku})));

// --- HELPER COMPONENTS ---

const kebabToPascal = (str: string) => str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
const LucideIcon = ({ name, size = 16, className = "", color, style, strokeWidth = 2 }: any) => {
    const pascalName = kebabToPascal(name);
    const IconComponent = (Icons as any)[pascalName] || (Icons as any)[`${pascalName}Icon`] || Icons.CircleHelp || Icons.Activity;
    if (!IconComponent) return null;
    return <IconComponent size={size} className={className} style={{...style, color: color}} strokeWidth={strokeWidth} />;
};




function MatrixConfigModal({ isOpen, onClose, sfgData, onSave, batters, fgDatabase, addMasterItem }: any) {
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
        onSave(formData); onClose();
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
        if (!selectedFgSku) return;
        
        if (formData.fgs.some((f: any) => f.sku === selectedFgSku)) { 
            if(Swal) Swal.fire({ icon: 'warning', title: 'Duplicate', text: 'SKU already mapped.', timer: 1000 }); 
            else alert('SKU already mapped.');
            return; 
        }

        const fgMaster = fgDatabase.find((f: any) => f.sku === selectedFgSku);
        if (fgMaster) {
            setFormData({ ...formData, fgs: [...formData.fgs, { sku: fgMaster.sku, name: fgMaster.name, brand: fgMaster.brand, weight: fgMaster.weight, pieces: 0 }] });
        } else {
            const tempName = `N/A - ${selectedFgSku}`;
            setFormData({ ...formData, fgs: [...formData.fgs, { sku: selectedFgSku, name: tempName, pieces: 0, weight: 1 }] });
            // Auto add to Master Items
            if (addMasterItem) {
                try {
                    addMasterItem({ sku: selectedFgSku, name: tempName, weight: 1, category: 'FG', type: 'Generated' });
                    if(Swal) Swal.fire({ icon: 'info', title: 'Auto-Created', text: `Added ${selectedFgSku} to Master Items.`, timer: 1500, showConfirmButton: false });
                } catch(e) {}
            }
        }
        setSelectedFgSku('');
    };

    return (
        <DraggableModal isOpen={isOpen} onClose={onClose} width="max-w-5xl" hideDefaultHeader>
            <div className="bg-white rounded-xl w-full overflow-hidden flex flex-col h-[85vh]">
                <div className="bg-[#212c46] px-8 py-5 flex justify-between items-center shrink-0 border-b border-[#212c46]">
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
                                        {batters.map((b: any) => <option key={b.id} value={b.id}>{b.name} ({b.id})</option>)}
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
                                    <datalist id="fgList">{fgDatabase.map((fg: any) => <option key={fg.sku} value={fg.sku}>{fg.name}</option>)}</datalist>
                                </div>
                                <button onClick={handleAddFgFromDb} className="bg-red-700 hover:bg-red-800 text-white px-4 py-2.5 rounded-xl transition-colors shadow-sm"><LucideIcon name="plus" size={16} color="white"/></button>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                                {formData.fgs.map((fg: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center p-2 border border-slate-200 rounded-xl bg-slate-50 text-[12px] shadow-sm">
                                        <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                                            <span className="text-[#a94228] font-black font-mono whitespace-nowrap">{fg.sku}</span>
                                            <span className="text-[#212c46] font-bold truncate">{fg.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
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

export default function ProductMatrix() {
    const [searchTerm, setSearchQuery] = useState('');
    const { data: dbBatters, loading: bLoad } = useCollection('Meat_Formula', MOCK_STANDARDS);
    const { data: dbMatrix, loading: mLoad, add: addMatrix, update: updateMatrix, remove: removeMatrix } = useCollection('Product_Matrix', MOCK_MATRIX);
    const { data: dbMaster, loading: msLoad, add: addMasterItem } = useCollection('Master_Item', MOCK_MASTER);

    const batters = dbBatters && dbBatters.length > 0 ? dbBatters : MOCK_STANDARDS;
    const rawMatrixData = dbMatrix && dbMatrix.length > 0 ? dbMatrix : MOCK_MATRIX;
    
    // Check if the database has old invalid schema
    const isDbInvalid = rawMatrixData.length > 0 && typeof (rawMatrixData[0] as any).crewSize !== 'undefined';

    const matrixData = rawMatrixData.map(item => {
        let bConf = item.batterConfig;
        let fgsConf = item.fgs;
        if (typeof bConf === 'string') {
            try { bConf = JSON.parse(bConf); } catch(e) { bConf = []; }
        }
        if (typeof fgsConf === 'string') {
            try { fgsConf = JSON.parse(fgsConf); } catch(e) { fgsConf = []; }
        }
        return { ...item, batterConfig: bConf || [], fgs: fgsConf || [], name: item.name || (item as any).sku || 'Unnamed' };
    });
    const masterItems = dbMaster && dbMaster.length > 0 ? dbMaster : MOCK_MASTER;

    const [modal, setModal] = useState<{isOpen: boolean, data: any}>({ isOpen: false, data: null });
    const [csvModalOpen, setCsvModalOpen] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const loading = false; // Always render with data available locally or from cache
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [activeMainTab, setActiveMainTab] = useState('Batter');

    const filteredData = useMemo(() => matrixData.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.id.toLowerCase().includes(searchTerm.toLowerCase())), [searchTerm, matrixData]);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const handleSave = async (item: any) => { 
        try {
            const payload = {
                ...item,
                batterConfig: JSON.stringify(item.batterConfig),
                fgs: JSON.stringify(item.fgs)
            };
            if(modal.data) {
                await updateMatrix(item.id, payload);
            } else {
                await addMatrix(payload);
            }
            if(Swal) Swal.fire({ icon: 'success', title: 'Saved!', timer: 1500, showConfirmButton: false });
        } catch(e) {
            if(Swal) Swal.fire({ icon: 'error', title: 'Failed to save', timer: 1500, showConfirmButton: false });
        }
    };
    
    const handleDelete = (id: string) => { 
        if(Swal) {
            Swal.fire({ title: 'Are you sure?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#EF4444' }).then(async (r: any) => { 
                if(r.isConfirmed) { await removeMatrix(id); } 
            }); 
        } else {
            if(window.confirm('Are you sure you want to delete this item?')) {
                removeMatrix(id);
            }
        }
    };

    if(loading) return (
        <div className="flex h-[80vh] w-full items-center justify-center bg-transparent">
            <div className="flex flex-col items-center gap-4">
                <LucideIcon name="loader-2" size={48} className="animate-spin text-red-700" />
                <span className="text-[#212c46] font-black uppercase tracking-widest text-sm animate-pulse">Loading Matrix Data...</span>
            </div>
        </div>
    );

    return (
        <div className="flex flex-1 w-full flex-col animate-fadeIn bg-transparent space-y-4">
            <button onClick={() => setShowGuide(true)} className="fixed right-0 top-[80px] bg-[#f8f9fa] border border-[#eaeaec] border-r-0 text-[#212c46] py-8 px-1.5 rounded-l-xl shadow-md hover:bg-[#932c2e] hover:text-white hover:border-[#932c2e] transition-all duration-500 z-[100] flex flex-col items-center gap-4 group">
                <Icons.HelpCircle size={18} className="shrink-0 group-hover:rotate-12 transition-transform text-[#7a8b95] group-hover:text-white" />
                <span className="font-black tracking-[0.3em] [writing-mode:vertical-rl] rotate-180 whitespace-nowrap uppercase text-[11px]">USER GUIDE</span>
            </button>
            <UserGuidePanel
                isOpen={showGuide}
                onClose={() => setShowGuide(false)}
                title="PRODUCT MATRIX GUIDE"
                subtitle="RECIPE & BOM LINKING"
            >
                <div className="space-y-8 font-sans">
                    <div>
                        <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                            <Icons.Network size={16} className="text-[#3f809e]" /> 1. ความเข้าใจระบบ Product Matrix
                        </h3>
                        <p className="mb-4 text-[#414757]">
                            Matrix นี้ทำหน้าที่เป็นแกนกลางในการเชื่อมโยงโครงสร้างสูตรการผลิตทั้งหมด (Bill Of Materials - BOM) โดยเชื่อมโยง 3 ระดับเข้าด้วยกันแบบ Tree Structure:
                        </p>
                        <div className="space-y-3">
                            <div className="p-3 bg-[#f8f9fa] border border-[#eaeaec] flex items-start gap-4 rounded-xl text-[12px]">
                                <div className="bg-[#b58c4f] text-white p-2 rounded-lg shrink-0 w-12 flex justify-center"><Icons.Droplets size={16} /></div>
                                <div>
                                    <strong className="text-[#212c46]">ระดับที่ 1: ส่วนผสมน้ำเนื้อ (BATTER)</strong>
                                    <p className="text-[#7a8b95]">เนื้อบดผสมตามสูตรแล้ว รอนำไปขึ้นรูป</p>
                                </div>
                            </div>
                            <div className="p-3 bg-[#f8f9fa] border border-[#eaeaec] flex items-start gap-4 rounded-xl text-[12px]">
                                <div className="bg-[#3f809e] text-white p-2 rounded-lg shrink-0 w-12 flex justify-center"><Icons.Box size={16} /></div>
                                <div>
                                    <strong className="text-[#212c46]">ระดับที่ 2: สินค้ากึ่งสำเร็จ (SFG)</strong>
                                    <p className="text-[#7a8b95]">เช่นไส้กรอกที่ตัดแล้ว, ลูกชิ้น ที่พร้อมจะนำไปแพคและติดแบรนด์ต่างๆ</p>
                                </div>
                            </div>
                            <div className="p-3 bg-[#f8f9fa] border border-[#eaeaec] flex items-start gap-4 rounded-xl text-[12px]">
                                <div className="bg-[#a94228] text-white p-2 rounded-lg shrink-0 w-12 flex justify-center"><Icons.Package size={16} /></div>
                                <div>
                                    <strong className="text-[#212c46]">ระดับที่ 3: สินค้าสำเร็จรูปพร้อมขาย (FG)</strong>
                                    <p className="text-[#7a8b95]">สินค้าสำเร็จรูปพร้อมจำหน่าย บรรจุในภาชนะบรรจุที่มีแบรนด์เรียบร้อยแล้ว</p>
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
                            ในตารางหลัก คุณสามารถกดปุ่ม <strong className="text-[#b58c4f]">Configure</strong> ที่ท้ายรายการของแต่ละ SFG เพื่อเข้าสู่โหมดการแก้ไขโครงสร้าง:
                        </p>
                        <div className="p-4 bg-[#fdf2f2] border border-[#f5c6cb] rounded-xl text-[#414757] text-[12px]">
                            <ul className="list-decimal pl-5 space-y-2">
                                <li><strong>แท็บ Batter Recipes:</strong> สัดส่วนเนื้อหรือเครื่องปรุงที่ใช้ผสมเพื่อสร้าง SFG ตัวนั้น 100% (กำหนด Ratio ให้รวมได้ 100%)</li>
                                <li><strong>แท็บ Packaged SKUs:</strong> เพิ่มหรือนำออกรายการสินค้า FG ที่เชื่อมกับเนื้อ SFG นี้</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </UserGuidePanel>
            
            <DraggableModal isOpen={csvModalOpen} onClose={() => setCsvModalOpen(false)} title="Bulk Upload Product Matrix" width="max-w-2xl">
                <CsvUpload 
                    onUpload={(data) => {
                        data.forEach((item: any) => addMatrix?.(item));
                        setCsvModalOpen(false);
                        if(Swal) Swal.fire({ icon: 'success', title: 'Imported!', timer: 1500, showConfirmButton: false });
                    }} 
                    requiredHeaders={['SFG_ID', 'FG_SKU', 'FG_Name']}
                    templateName="product_matrix_template.xlsx"
                />
            </DraggableModal>
            <MatrixConfigModal isOpen={modal.isOpen} onClose={() => setModal({ isOpen: false, data: null })} sfgData={modal.data} onSave={handleSave} batters={batters} fgDatabase={masterItems} addMasterItem={addMasterItem} />

            {/* Header Bar */}
            <div className="h-14 px-4 sm:px-8 flex flex-row items-center justify-between gap-4 z-20 shrink-0">
                <div className="flex items-center gap-5">
                    <div className="relative flex items-center justify-center group cursor-default shrink-0">
                        <div className="absolute inset-0 bg-[#932c2e] blur-[15px] opacity-20 rounded-full group-hover:opacity-60 transition-all duration-700"></div>
                        <div className="relative z-10 p-1.5 border border-[#932c2e]/40 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm">
                            <Icons.GitMerge size={28} strokeWidth={2.5} className="text-[#932c2e]" />
                        </div>
                    </div>
                    <div>
                        <h3 className="font-black text-[#212c46] uppercase tracking-tighter leading-none font-exception-header" style={{ fontSize: '24px' }}>
                            PRODUCT <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#932c2e] to-[#d96245]">MATRIX</span>
                        </h3>
                        <p className="text-[11px] font-bold text-[#7a8b95] uppercase tracking-[0.2em] mt-0.5 opacity-80 leading-none">
                            PRODUCT STRUCTURE CONFIGURATION
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

            <div className="mx-auto px-4 sm:px-8 w-full mt-[2px]">
                {isDbInvalid && (
                    <div className="bg-red-50 border-l-4 border-red-700 p-4 mb-4 rounded-r-xl shadow-sm animate-pulse-slow">
                        <div className="flex gap-4">
                            <Icons.AlertTriangle className="text-red-700 shrink-0" size={24} />
                            <div>
                                <h3 className="text-sm font-black text-red-900 uppercase tracking-widest mb-1">Database Schema Mismatch Detected</h3>
                                <p className="text-xs text-red-800 font-bold mb-2">
                                    ดูเหมือนว่า Google Sheets ของคุณในแท็บ <span className="bg-red-200 px-1 py-0.5 rounded font-mono">Product_Matrix</span> ยังใช้หัวคอลัมน์จากเวอร์ชั่นเก่า ทำให้ไม่สามารถอ่านสูตรส่วนผสม (Batter & FGs) ได้ ข้อมูลที่แสดงผลจึงว่างเปล่า
                                </p>
                                <p className="text-[11px] text-red-700 bg-red-100 p-2 rounded-md font-mono mb-2">
                                    [ต้องแก้ไข] ลบชีตเดิมทิ้ง หรือเปลี่ยนหัวคอลัมน์ Row 1 ให้เป็น:<br/>
                                    <span className="font-bold">id, name, batterConfig, fgs, createdAt, updatedAt</span>
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* KPI STATS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 shrink-0">
                    <KpiCard label="Total Matrices" value={matrixData.length} icon="git-merge" colorAccent="#4d87a8" colorValue="#212c46" desc="Configured Formulations" />
                    <KpiCard label="Base Materials" value={batters.length} icon="beaker" colorAccent="#2e7d32" colorValue="#212c46" desc="Available Batters/Layers" />
                    <KpiCard label="Target FG" value={matrixData.reduce((acc, curr) => acc + (curr.fgs?.length || 0), 0)} icon="package" colorAccent="#d96245" colorValue="#212c46" desc="Linked Finished Goods" />
                    <KpiCard label="Completion Rate" value={`${Math.round((matrixData.filter(m => m.fgs?.length > 0 && m.batterConfig?.length > 0).length / Math.max(matrixData.length, 1)) * 100)}%`} icon="check-circle" colorAccent="#b7a159" colorValue="#212c46" desc="Fully Mapped" />
                </div>

                <div className="w-full flex-1 flex flex-col min-h-[500px]">
                    <div className="sys-table-card border-[#eaeaec] flex flex-col flex-1 shadow-lg bg-white overflow-hidden rounded-xl border">
                    
                    {/* TOOLBAR */}
                    <div className="py-4 px-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center bg-white gap-4">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="flex items-center gap-2 text-[12px] font-black text-[#212c46] uppercase tracking-widest">
                                <LucideIcon name="list" size={16} className="text-red-700"/>
                                <span>SFG Master List</span>
                            </div>
                            <span className="hidden md:inline text-slate-300">|</span>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-md shadow-sm">
                                {filteredData.length} Records
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                            <div className="relative flex-1 sm:w-64">
                                <LucideIcon name="search" size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                                <input type="text" placeholder="Search SFG..." value={searchTerm} onChange={(e) => setSearchQuery(e.target.value)} className="sys-input w-full pl-10 pr-4 py-2 h-10" />
                            </div>
                            <button onClick={() => setCsvModalOpen(true)} className="flex-1 sm:flex-none justify-center bg-white border border-slate-200 hover:border-slate-300 text-slate-500 px-4 py-2 rounded-xl font-bold text-[12px] uppercase tracking-widest flex items-center gap-2 shadow-sm transition-colors hover:text-[#212c46] h-10"><LucideIcon name="upload" size={14} /> Import</button>
                            <CsvExport data={matrixData} filename="product_matrix_export.csv" label="Export" className="flex-1 sm:flex-none justify-center bg-white border border-slate-200 hover:border-slate-300 text-slate-500 px-4 py-2 rounded-xl font-bold text-[12px] uppercase tracking-widest flex items-center gap-2 shadow-sm transition-colors h-10 hover:text-[#212c46]" />
                            <button onClick={() => setModal({ isOpen: true, data: null })} className="sys-btn-primary flex-1 sm:flex-none h-10 whitespace-nowrap">
                                <LucideIcon name="plus" size={16} color="white"/> New SFG
                            </button>
                        </div>
                    </div>

                    {/* TABLE */}
                    <div className="flex-1 overflow-auto flex flex-col bg-white">
                        <div className="overflow-y-auto flex-1 custom-scrollbar">
                            <table className="w-full text-left min-w-[1000px] border-collapse relative table-font">
                                <thead className="sys-table-header sticky top-0 z-10 shadow-sm slate-200 ">
                    <tr>
                                        <th className="pl-6 w-[25%] whitespace-nowrap font-black uppercase tracking-widest ">SFG Code & Name</th>
                                        <th className="w-[25%] whitespace-nowrap font-black uppercase tracking-widest ">Source Batter(s) & Formula</th>
                                        <th className="w-[40%] min-w-[400px] font-black uppercase tracking-widest ">Mapped FGs</th>
                                        <th className="pr-6 text-right w-24 font-black uppercase tracking-widest ">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {currentItems.map(item => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 group">
                                            
                                            {/* Col 1: SFG Code & Name */}
                                            <td className="sys-table-td px-4 pl-6 align-middle border-b border-slate-100 py-2.5">
                                                <div className="flex flex-col items-start gap-1">
                                                    <span className="font-bold text-[#212c46] text-[12px] leading-tight font-exception-header">{item.name}</span>
                                                    <span className="bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded text-[11px] font-mono shadow-sm">{item.id}</span>
                                                </div>
                                            </td>

                                            {/* Col 2: Batter Config */}
                                            <td className="sys-table-td px-4 align-middle border-b border-slate-100 py-2.5">
                                                <div className="flex flex-wrap gap-2">
                                                    {item.batterConfig?.map((b: any, i: number) => {
                                                        const std = batters.find((x: any) => x.id === b.id);
                                                        const isFilling = b.id.startsWith('FL-');
                                                        const isLayer = b.id.startsWith('LY-');
                                                        const bgClass = isFilling ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200';
                                                        const textClass = isFilling ? 'text-amber-700' : 'text-[#212c46]';
                                                        let icon = 'database';
                                                        if (isFilling) icon = 'droplet';
                                                        if (isLayer) icon = 'layers';
                                                        
                                                        return (
                                                            <div key={i} className={`flex items-center gap-1.5 px-2 py-1 rounded-md border w-fit shadow-sm ${bgClass}`}>
                                                                <span className={`font-mono font-black text-[11px] w-[28px] text-right shrink-0 ${textClass}`}>{b.ratio}%</span>
                                                                <LucideIcon name={icon} size={14} className={`${textClass} shrink-0 text-slate-500`} />
                                                                <span className={`text-[11px] font-medium whitespace-nowrap ${textClass}`}>{std?.name || b.id}</span>
                                                            </div>
                                                        )
                                                    })}
                                                    {(!item.batterConfig?.length) && <span className="text-slate-400 italic text-[11px]">No Configuration</span>}
                                                </div>
                                            </td>

                                            {/* Col 3: Mapped FGs */}
                                            <td className="sys-table-td px-4 align-middle border-b border-slate-100 py-2.5">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {item.fgs?.map((f: any, i: number) => (
                                                        <div key={i} className="flex items-center gap-1.5 bg-white border border-slate-200 rounded px-1.5 py-0.5 shadow-sm shrink-0 w-fit">
                                                            <span className="bg-slate-100 text-slate-500 font-mono font-bold text-[11px] px-1.5 py-0.5 rounded border border-slate-200">{f.sku}</span>
                                                            <span className="text-[#212c46] font-mono font-bold text-[11px]">{f.weight}kg</span>
                                                            <span className="bg-red-50 text-red-600 border border-red-100 font-mono font-bold text-[11px] px-1.5 py-0.5 rounded">{f.pieces}pcs</span>
                                                        </div>
                                                    ))}
                                                    {(!item.fgs?.length) && <span className="text-slate-400 italic text-[11px]">No FG Mapped</span>}
                                                </div>
                                            </td>

                                            {/* Col 4: Action */}
                                            <td className="sys-table-td px-4 pr-6 align-middle border-b border-slate-100 py-2.5">
                                                <div className="flex justify-end gap-[1px] transition-opacity">
                                                    <button onClick={() => setModal({ isOpen: true, data: item })} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#eaeaec] text-[#4d87a8] hover:border-[#212c46] hover:text-[#a94228] hover:bg-[#212c46]/5 transition-all shadow-sm bg-white active:scale-90" title="Edit"><LucideIcon name="pencil" size={16} /></button>
                                                    <button onClick={() => handleDelete(item.id)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#eaeaec] text-[#932c2e] hover:border-[#932c2e] hover:bg-[#932c2e]/10 transition-all shadow-sm bg-white active:scale-90" title="Delete"><LucideIcon name="trash-2" size={16} /></button>
                                                </div>
                                            </td>

                                        </tr>
                                    ))}
                                    {currentItems.length === 0 && (
                                        <tr>
                                            <td className="text-center text-slate-400 font-bold uppercase tracking-widest text-[12px] opacity-70 py-2.5 px-4">
                                                No Records Found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Pagination (Synced) */}
                        <div className="py-3 px-4 bg-[#F0EAE1]/80 border-t-[1.5px] border-[#adb2b0]/50 flex justify-between items-center font-bold text-slate-500 uppercase tracking-widest shrink-0 font-mono text-[10px]">
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
                                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className={`p-1.5 border border-[#adb2b0]/50 bg-white rounded-lg transition-all shadow-sm ${currentPage === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-50 text-[#212c46] hover:border-slate-400'}`}><LucideIcon name="chevron-left" size={16}/></button>
                                <div className="bg-white border border-[#adb2b0]/50 px-5 py-1.5 rounded-lg shadow-sm text-[#212c46] font-black min-w-[120px] text-center uppercase tracking-widest">PAGE {currentPage} OF {totalPages || 1}</div>
                                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className={`p-1.5 border border-[#adb2b0]/50 bg-white rounded-lg transition-all shadow-sm ${currentPage === totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-50 text-[#212c46] hover:border-slate-400'}`}><LucideIcon name="chevron-right" size={16}/></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </div>
    );
}
