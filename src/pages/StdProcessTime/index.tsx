import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useCollection } from '../../services/useFirestore';
import { createPortal } from 'react-dom';
import * as Icons from 'lucide-react';
import { UserGuidePanel } from '@/src/components/shared/UserGuidePanel';
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

const INITIAL_CATEGORIES = ['Sausage', 'Meatball', 'Ham', 'Bologna', 'WIP-Emulsion'];
const STANDARD_BATCH_SIZES = [100, 150];

const MOCK_STANDARDS = [
    {
        id: 'STD-001', name: 'Standard Smoked Sausage', category: 'Sausage', rawWeightPerBatch: 150, yieldPercent: 88.5, status: 'Active', updateDate: '26/02/2025',
        mixingStandards: [{ id: 1, machine: 'Vacuum Mixer', batter: 'Standard Pork', batchPerCycle: 1, cycleTimeMin: 15, yieldPercent: 100 }],
        formingStandards: [{ id: 1, batter: 'Standard Pork', size: 'Jumbo', type: 'Twist Linker', casing: 'Cellulose', stuffed: true, capacityKgHr: 2000 }],
        cookingStandards: [{ id: 1, oven: 'Smoke House 6T', program: 'Smoke_Std', cycleTimeMin: 120, capacityBatch: 10 }],
        coolingStandards: [{ id: 1, unit: 'Rapid Chill Tunnel', program: 'Shower_Fast', cycleTimeMin: 60, capacityBatch: 10 }],
        peelingStandards: [{ id: 1, method: 'Machine Only', capacityKgHr: 1500 }],
        cuttingStandards: [],
        packingStandards: [{ id: 1, machine: 'Thermoformer', packSize: '1kg', format: 'Bag', sfgSize: 'Jumbo', capacityKgHr: 1000 }],
        packVariants: []
    },
    {
        id: 'STD-002', name: 'Premium Meatball', category: 'Meatball', rawWeightPerBatch: 100, yieldPercent: 95, status: 'Active', updateDate: '25/02/2025',
        mixingStandards: [{ id: 1, machine: 'Bowl Cutter 200L', batter: 'Premium Beef', batchPerCycle: 1, cycleTimeMin: 12, yieldPercent: 100 }],
        formingStandards: [{ id: 1, batter: 'Premium Beef', size: 'M', type: 'Belt Former', casing: '', stuffed: false, capacityKgHr: 1500 }],
        cookingStandards: [{ id: 1, oven: 'Smoke House 4T', program: 'Steam_01', cycleTimeMin: 60, capacityBatch: 8 }],
        coolingStandards: [{ id: 1, unit: 'Shower Tunnel', program: 'Chill_Std', cycleTimeMin: 40, capacityBatch: 8 }],
        peelingStandards: [],
        cuttingStandards: [],
        packingStandards: [{ id: 1, machine: 'Flow Pack', packSize: '500g', format: 'Bag', sfgSize: 'M', capacityKgHr: 800 }],
        packVariants: []
    },
    {
        id: 'BAT-SMC-01', name: 'Batter ไส้กรอกรมควัน (Smoked)', category: 'WIP-Emulsion', rawWeightPerBatch: 150, yieldPercent: 100, status: 'Active', updateDate: '27/02/2025',
        mixingStandards: [{ id: 1, machine: 'Vacuum Mixer', batter: 'Smoked Formula', batchPerCycle: 1, cycleTimeMin: 15, yieldPercent: 100 }],
        formingStandards: [], cookingStandards: [], coolingStandards: [], peelingStandards: [], cuttingStandards: [], packingStandards: [], packVariants: []
    },
    {
        id: 'BAT-MTB-02', name: 'Batter ลูกชิ้นหมู (Pork Meatball)', category: 'WIP-Emulsion', rawWeightPerBatch: 100, yieldPercent: 100, status: 'Active', updateDate: '27/02/2025',
        mixingStandards: [{ id: 1, machine: 'Bowl Cutter 200L', batter: 'Pork Meatball Formula', batchPerCycle: 1, cycleTimeMin: 12, yieldPercent: 100 }],
        formingStandards: [], cookingStandards: [], coolingStandards: [], peelingStandards: [], cuttingStandards: [], packingStandards: [], packVariants: []
    },
    {
        id: 'BAT-BOL-04', name: 'Batter โบโลน่า (Bologna)', category: 'WIP-Emulsion', rawWeightPerBatch: 150, yieldPercent: 100, status: 'Active', updateDate: '27/02/2025',
        mixingStandards: [{ id: 1, machine: 'Vacuum Mixer', batter: 'Bologna Formula', batchPerCycle: 1, cycleTimeMin: 15, yieldPercent: 100 }],
        formingStandards: [], cookingStandards: [], coolingStandards: [], peelingStandards: [], cuttingStandards: [], packingStandards: [], packVariants: []
    },
    {
        id: 'BAT-CHE-09', name: 'Batter ไส้กรอกชีส (Cheese)', category: 'WIP-Emulsion', rawWeightPerBatch: 150, yieldPercent: 100, status: 'Active', updateDate: '27/02/2025',
        mixingStandards: [{ id: 1, machine: 'Vacuum Mixer', batter: 'Cheese Sausage Formula', batchPerCycle: 1, cycleTimeMin: 15, yieldPercent: 100 }],
        formingStandards: [], cookingStandards: [], coolingStandards: [], peelingStandards: [], cuttingStandards: [], packingStandards: [], packVariants: []
    },
    {
        id: 'BAT-SND-20', name: 'Batter แฮมแซนวิช (Sandwich Ham)', category: 'WIP-Emulsion', rawWeightPerBatch: 150, yieldPercent: 100, status: 'Active', updateDate: '27/02/2025',
        mixingStandards: [{ id: 1, machine: 'Vacuum Mixer', batter: 'Sandwich Ham Formula', batchPerCycle: 1, cycleTimeMin: 20, yieldPercent: 100 }],
        formingStandards: [], cookingStandards: [], coolingStandards: [], peelingStandards: [], cuttingStandards: [], packingStandards: [], packVariants: []
    },
    {
        id: 'BAT-001', name: 'Smoked Batter', category: 'WIP-Emulsion', rawWeightPerBatch: 150, yieldPercent: 100, status: 'Active', updateDate: '27/02/2025',
        mixingStandards: [{ id: 1, machine: 'Vacuum Mixer', batter: 'Smoked Formula', batchPerCycle: 1, cycleTimeMin: 15, yieldPercent: 100 }],
        formingStandards: [], cookingStandards: [], coolingStandards: [], peelingStandards: [], cuttingStandards: [], packingStandards: [], packVariants: []
    },
    {
        id: 'BAT-002', name: 'Meatball Batter', category: 'WIP-Emulsion', rawWeightPerBatch: 100, yieldPercent: 100, status: 'Active', updateDate: '27/02/2025',
        mixingStandards: [{ id: 1, machine: 'Bowl Cutter 200L', batter: 'Meatball Formula', batchPerCycle: 1, cycleTimeMin: 12, yieldPercent: 100 }],
        formingStandards: [], cookingStandards: [], coolingStandards: [], peelingStandards: [], cuttingStandards: [], packingStandards: [], packVariants: []
    },
    {
        id: 'BAT-003', name: 'Bologna Batter', category: 'WIP-Emulsion', rawWeightPerBatch: 150, yieldPercent: 100, status: 'Active', updateDate: '27/02/2025',
        mixingStandards: [{ id: 1, machine: 'Vacuum Mixer', batter: 'Bologna Formula', batchPerCycle: 1, cycleTimeMin: 15, yieldPercent: 100 }],
        formingStandards: [], cookingStandards: [], coolingStandards: [], peelingStandards: [], cuttingStandards: [], packingStandards: [], packVariants: []
    },
    {
        id: 'BAT-004', name: 'Cheese Batter', category: 'WIP-Emulsion', rawWeightPerBatch: 150, yieldPercent: 100, status: 'Active', updateDate: '27/02/2025',
        mixingStandards: [{ id: 1, machine: 'Vacuum Mixer', batter: 'Cheese Formula', batchPerCycle: 1, cycleTimeMin: 15, yieldPercent: 100 }],
        formingStandards: [], cookingStandards: [], coolingStandards: [], peelingStandards: [], cuttingStandards: [], packingStandards: [], packVariants: []
    },
    {
        id: 'BAT-005', name: 'Sandwich Ham Batter', category: 'WIP-Emulsion', rawWeightPerBatch: 150, yieldPercent: 100, status: 'Active', updateDate: '27/02/2025',
        mixingStandards: [{ id: 1, machine: 'Vacuum Mixer', batter: 'Sandwich Ham Formula', batchPerCycle: 1, cycleTimeMin: 20, yieldPercent: 100 }],
        formingStandards: [], cookingStandards: [], coolingStandards: [], peelingStandards: [], cuttingStandards: [], packingStandards: [], packVariants: []
    },
    {
        id: 'BAT-006', name: 'Layer Batter Red', category: 'WIP-Emulsion', rawWeightPerBatch: 100, yieldPercent: 100, status: 'Active', updateDate: '27/02/2025',
        mixingStandards: [{ id: 1, machine: 'Bowl Cutter 200L', batter: 'Red Layer Formula', batchPerCycle: 1, cycleTimeMin: 10, yieldPercent: 100 }],
        formingStandards: [], cookingStandards: [], coolingStandards: [], peelingStandards: [], cuttingStandards: [], packingStandards: [], packVariants: []
    },
    {
        id: 'BAT-007', name: 'Layer Batter Green', category: 'WIP-Emulsion', rawWeightPerBatch: 100, yieldPercent: 100, status: 'Active', updateDate: '27/02/2025',
        mixingStandards: [{ id: 1, machine: 'Bowl Cutter 200L', batter: 'Green Layer Formula', batchPerCycle: 1, cycleTimeMin: 10, yieldPercent: 100 }],
        formingStandards: [], cookingStandards: [], coolingStandards: [], peelingStandards: [], cuttingStandards: [], packingStandards: [], packVariants: []
    },
    {
        id: 'BAT-008', name: 'Filling Cheese', category: 'WIP-Emulsion', rawWeightPerBatch: 50, yieldPercent: 100, status: 'Active', updateDate: '27/02/2025',
        mixingStandards: [{ id: 1, machine: 'Vacuum Mixer', batter: 'Filling Cheese Formula', batchPerCycle: 1, cycleTimeMin: 10, yieldPercent: 100 }],
        formingStandards: [], cookingStandards: [], coolingStandards: [], peelingStandards: [], cuttingStandards: [], packingStandards: [], packVariants: []
    },
    {
        id: 'SFG-001', name: 'Smoked Sausage SFG', category: 'Sausage', rawWeightPerBatch: 150, yieldPercent: 88.5, status: 'Active', updateDate: '27/02/2025',
        mixingStandards: [], 
        formingStandards: [{ id: 1, batter: 'Smoked Batter', size: 'M', type: 'Twist Linker', casing: 'Cellulose', stuffed: true, capacityKgHr: 2000 }],
        cookingStandards: [{ id: 1, oven: 'Smoke House 6T', program: 'Smoke_Std', cycleTimeMin: 120, capacityBatch: 10 }],
        coolingStandards: [{ id: 1, unit: 'Rapid Chill Tunnel', program: 'Shower_Fast', cycleTimeMin: 60, capacityBatch: 10 }],
        peelingStandards: [{ id: 1, method: 'Machine Only', capacityKgHr: 1500 }],
        cuttingStandards: [], packingStandards: [], packVariants: []
    },
    {
        id: 'SFG-002', name: 'Pork Meatball SFG', category: 'Meatball', rawWeightPerBatch: 100, yieldPercent: 95, status: 'Active', updateDate: '27/02/2025',
        mixingStandards: [],
        formingStandards: [{ id: 1, batter: 'Meatball Batter', size: 'M', type: 'Belt Former', casing: '', stuffed: false, capacityKgHr: 1500 }],
        cookingStandards: [{ id: 1, oven: 'Smoke House 4T', program: 'Steam_01', cycleTimeMin: 60, capacityBatch: 8 }],
        coolingStandards: [{ id: 1, unit: 'Shower Tunnel', program: 'Chill_Std', cycleTimeMin: 40, capacityBatch: 8 }],
        peelingStandards: [], cuttingStandards: [], packingStandards: [], packVariants: []
    },
    {
        id: 'SFG-003', name: 'Bologna SFG', category: 'Bologna', rawWeightPerBatch: 150, yieldPercent: 92, status: 'Active', updateDate: '27/02/2025',
        mixingStandards: [],
        formingStandards: [{ id: 1, batter: 'Bologna Batter', size: 'L', type: 'Clipper Direct', casing: 'Polyamide', stuffed: true, capacityKgHr: 1800 }],
        cookingStandards: [{ id: 1, oven: 'Smoke House 6T', program: 'Steam_01', cycleTimeMin: 150, capacityBatch: 10 }],
        coolingStandards: [{ id: 1, unit: 'Shower Tunnel', program: 'Chill_Std', cycleTimeMin: 90, capacityBatch: 10 }],
        peelingStandards: [], cuttingStandards: [], packingStandards: [], packVariants: []
    },
    {
        id: 'SFG-004', name: 'Cheese Sausage SFG', category: 'Sausage', rawWeightPerBatch: 150, yieldPercent: 89, status: 'Active', updateDate: '27/02/2025',
        mixingStandards: [],
        formingStandards: [{ id: 1, batter: 'Cheese Batter', size: 'M', type: 'Twist Linker', casing: 'Cellulose', stuffed: true, capacityKgHr: 1900 }],
        cookingStandards: [{ id: 1, oven: 'Smoke House 6T', program: 'Smoke_Std', cycleTimeMin: 120, capacityBatch: 10 }],
        coolingStandards: [{ id: 1, unit: 'Rapid Chill Tunnel', program: 'Shower_Fast', cycleTimeMin: 60, capacityBatch: 10 }],
        peelingStandards: [{ id: 1, method: 'Machine Only', capacityKgHr: 1500 }],
        cuttingStandards: [], packingStandards: [], packVariants: []
    },
    {
        id: 'SFG-005', name: 'Sandwich Ham SFG', category: 'Ham', rawWeightPerBatch: 150, yieldPercent: 98, status: 'Active', updateDate: '27/02/2025',
        mixingStandards: [],
        formingStandards: [{ id: 1, batter: 'Sandwich Ham Batter', size: 'Jumbo', type: 'Clipper Direct', casing: 'Polyamide', stuffed: true, capacityKgHr: 1200 }],
        cookingStandards: [{ id: 1, oven: 'Smoke House 6T', program: 'Steam_01', cycleTimeMin: 180, capacityBatch: 10 }],
        coolingStandards: [{ id: 1, unit: 'Shower Tunnel', program: 'Chill_Std', cycleTimeMin: 120, capacityBatch: 10 }],
        peelingStandards: [], cuttingStandards: [], packingStandards: [], packVariants: []
    },
    {
        id: 'STD-003', name: 'Bologna Chili', category: 'Bologna', rawWeightPerBatch: 150, yieldPercent: 98, status: 'Active', updateDate: '27/02/2025',
        mixingStandards: [{ id: 1, machine: 'Vacuum Mixer', batter: 'Bologna Chili Formula', batchPerCycle: 1, cycleTimeMin: 20, yieldPercent: 100 }],
        formingStandards: [{ id: 1, batter: 'Bologna Chili', size: 'Large', type: 'Clipper', casing: 'Plastic', stuffed: true, capacityKgHr: 1500 }],
        cookingStandards: [{ id: 1, oven: 'Steam Oven', program: 'Steam_85C', cycleTimeMin: 180, capacityBatch: 12 }],
        coolingStandards: [{ id: 1, unit: 'Chilled Water Tank', program: 'Water_Chill', cycleTimeMin: 90, capacityBatch: 12 }],
        peelingStandards: [{ id: 1, method: 'Manual Peeling', capacityKgHr: 500 }],
        cuttingStandards: [{ id: 1, machine: 'High Speed Slicer', thicknessMm: 2, capacityKgHr: 800 }],
        packingStandards: [{ id: 1, machine: 'Thermoformer', packSize: '200g', format: 'Vacuum Pack', sfgSize: 'Sliced', capacityKgHr: 600 }],
        packVariants: []
    },
    {
        id: 'STD-004', name: 'Cheese Sausage', category: 'Sausage', rawWeightPerBatch: 150, yieldPercent: 92, status: 'Active', updateDate: '27/02/2025',
        mixingStandards: [{ id: 1, machine: 'Vacuum Mixer', batter: 'Cheese Sausage Formula', batchPerCycle: 1, cycleTimeMin: 15, yieldPercent: 100 }],
        formingStandards: [{ id: 1, batter: 'Cheese Formula', size: 'Standard', type: 'Co-Extrusion', casing: 'Collagen', stuffed: true, capacityKgHr: 1800 }],
        cookingStandards: [{ id: 1, oven: 'Smoke House 6T', program: 'Smoke_Cheese', cycleTimeMin: 100, capacityBatch: 10 }],
        coolingStandards: [{ id: 1, unit: 'Rapid Chill Tunnel', program: 'Shower_Std', cycleTimeMin: 60, capacityBatch: 10 }],
        peelingStandards: [],
        cuttingStandards: [],
        packingStandards: [{ id: 1, machine: 'Thermoformer', packSize: '500g', format: 'Bag', sfgSize: 'Standard', capacityKgHr: 900 }],
        packVariants: []
    }
];

const getCategoryStyle = (category: string) => {
    switch (category?.toUpperCase()) {
        case 'SAUSAGE': return 'bg-white text-[#932c2e] border-[#932c2e]/30';
        case 'MEATBALL': return 'bg-white text-[#4d87a8] border-[#4d87a8]/30';
        case 'BOLOGNA': return 'bg-white text-[#b7a159] border-[#b7a159]/30';
        case 'HAM': return 'bg-white text-[#d96245] border-[#d96245]/30';
        case 'WIP-EMULSION': return 'bg-white text-[#212c46] border-[#212c46]/30';
        default: return 'bg-white text-[#7a8b95] border-[#eaeaec]';
    }
};

const getStatusStyle = (status: string) => {
    switch (status?.toUpperCase()) {
        case 'ACTIVE': return 'bg-white text-[#2e7d32] border-[#2e7d32]/60';
        case 'INACTIVE': return 'bg-white text-[#7a8b95] border-[#7a8b95]/60';
        case 'DRAFT': return 'bg-white text-[#f59e0b] border-[#f59e0b]/60';
        default: return 'bg-white text-gray-400 border-gray-300';
    }
};

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
            category: row.Category,
            rawWeightPerBatch: parseFloat(row.Raw_Batch) || 100,
            yieldPercent: parseFloat(row.Yield) || 100,
            status: row.Status || 'Active',
            updateDate: new Date().toLocaleDateString('en-GB'),
            mixingStandards: [], formingStandards: [], cookingStandards: [],
            coolingStandards: [], peelingStandards: [], cuttingStandards: [], packingStandards: [],
            packVariants: []
        }));
        onUpload(newData);
        onClose();
        setPreviewData([]);
        setError(null);
        if(Swal) Swal.fire({ icon: 'success', title: 'Imported!', text: 'Data has been successfully imported.', timer: 1500, showConfirmButton: false });
    };

    return (
        <DraggableModal isOpen={isOpen} onClose={onClose} width="max-w-3xl" hideDefaultHeader>
            <div className="bg-white rounded-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-5 border-b border-[#eaeaec] flex justify-between items-center bg-[#212c46] text-white">
                    <h3 className="font-black flex items-center gap-2 uppercase tracking-widest text-sm"><LucideIcon name="upload-cloud" /> Import CSV</h3>
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
                                <thead className="sys-table-header sticky top-0 ">
                    <tr>
                                        <th className="p-3 font-black uppercase  align-middle   ">ID</th>
                                        <th className="p-3 font-black uppercase  align-middle   ">Name</th>
                                        <th className="p-3 font-black uppercase  align-middle   ">Category</th>
                                        <th className="p-3 font-black uppercase text-right  align-middle   ">Raw Batch</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.slice(0, 10).map((row, i) => (
                                        <tr key={i} className="hover:bg-slate-50 border-b">
                                            <td className="p-3 font-mono font-bold text-[#932c2e] py-2.5 px-4">{row.ID || '-'}</td>
                                            <td className="p-3 text-[#212c46] font-bold py-2.5 px-4">{row.Name || '-'}</td>
                                            <td className="p-3 text-[#4d87a8] py-2.5 px-4">{row.Category || '-'}</td>
                                            <td className="p-3 font-mono text-right py-2.5 px-4">{row.Raw_Batch || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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

function ConfigModal({ isOpen, onClose, data, onSave, mode, categories }: any) {
    const [topTab, setTopTab] = useState('info');
    const [activeTab, setActiveTab] = useState('batter');
    const [config, setConfig] = useState<any>(null);
    const [options, setOptions] = useState<any>({
        machineMixing: ['Bowl Cutter 200L', 'Bowl Cutter 500L', 'Vacuum Mixer', 'Emulsifier'],
        batterFormulas: ['Standard Pork', 'Premium Beef', 'Chicken A'],
        productSizes: ['S', 'M', 'L', 'Jumbo', 'Cocktail']
    });
    
    const DEFAULT_CONFIG = {
        id: '', name: '', category: categories[0] || 'Batter', status: 'Active',
        rawWeightPerBatch: 150.00, yieldPercent: 100, specPiecesPerKg: 0,
        mixingStandards: [], formingStandards: [], cookingStandards: [],
        coolingStandards: [], peelingStandards: [], cuttingStandards: [], packingStandards: [],
        packVariants: []
    };

    useEffect(() => {
        if (isOpen) {
            setTopTab('info');
            if (data) {
                setConfig({ ...DEFAULT_CONFIG, ...data });
            } else {
                setConfig(DEFAULT_CONFIG);
            }
            setActiveTab('batter');
        }
    }, [isOpen, data]);

    if (!isOpen || !config) return null;
    const isReadOnly = mode === 'view';

    const handleSaveClick = () => {
        onSave(config);
        onClose();
        if(Swal) Swal.fire({ icon: 'success', title: 'Saved Successfully', showConfirmButton: false, timer: 1000 });
    };

    const TabButton = ({ id, label, icon }: any) => (
        <button 
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-3 px-4 py-3 text-left transition-all border-l-4 w-full group ${activeTab === id ? 'border-[#b7a159] bg-[#f8f9fa] text-[#212c46]' : 'border-transparent text-[#7a8b95] hover:bg-[#f8f9fa]/50 hover:text-[#212c46]'}`}
        >
            <LucideIcon name={icon} size={16} />
            <span className={`text-[11px] uppercase tracking-widest ${activeTab === id ? 'font-black' : 'font-bold'}`}>{label}</span>
        </button>
    );

    return (
        <DraggableModal isOpen={isOpen} onClose={onClose} width="max-w-6xl" hideDefaultHeader>
            <div className="bg-white rounded-xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden relative border border-white/40">
                <div className="bg-[#212c46] px-8 py-5 flex justify-between items-center shrink-0 border-b border-[#212c46]">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                        <Icons.Settings2 size={24} className="text-[#b7a159]" />
                        {config.name || 'New Process Standard'} <span className="text-[#7a8b95] ml-2">{config.id}</span>
                    </h3>
                    <button onClick={onClose} className="text-white/50 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-xl"><LucideIcon name="x" size={20} /></button>
                </div>

                <div className="flex flex-1 overflow-hidden bg-white">
                    <div className="w-64 bg-white border-r border-[#eaeaec] flex flex-col shrink-0 overflow-y-auto pt-2">
                        <TabButton id="batter" label="General Information" icon="file-text" />
                        <TabButton id="mixing" label="1. Mixing" icon="chef-hat" />
                        <TabButton id="forming" label="2. Forming" icon="component" />
                        <TabButton id="cooking" label="3. Cooking" icon="thermometer" />
                        <TabButton id="cooling" label="4. Cooling" icon="snowflake" />
                        <TabButton id="packing" label="7. Packing" icon="package" />
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-[#f8f9fa]">
                        {activeTab === 'batter' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="bg-white p-8 rounded-xl border border-[#eaeaec] shadow-sm">
                                    <h4 className="text-[12px] font-black text-[#212c46] border-b border-[#eaeaec] pb-3 mb-6 uppercase tracking-widest">Product Information</h4>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="col-span-2">
                                            <label className="text-[10px] font-black text-[#7a8b95] uppercase tracking-widest block mb-2">Standard Name</label>
                                            <input disabled={isReadOnly} type="text" value={config.name} onChange={e=>setConfig({...config, name: e.target.value})} className={`w-full border border-[#eaeaec] rounded-xl p-3 text-[12px] font-bold focus:border-[#4d87a8] outline-none transition-all ${isReadOnly ? 'bg-[#f8f9fa] text-[#7a8b95]' : 'bg-[#f8f9fa] focus:bg-white text-[#212c46]'}`} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-[#7a8b95] uppercase tracking-widest block mb-2">Category</label>
                                            <select disabled={isReadOnly} value={config.category} onChange={e=>setConfig({...config, category: e.target.value})} className={`w-full border border-[#eaeaec] rounded-xl p-3 text-[12px] font-bold focus:border-[#4d87a8] outline-none transition-all cursor-pointer ${isReadOnly ? 'bg-[#f8f9fa] text-[#7a8b95]' : 'bg-[#f8f9fa] focus:bg-white text-[#212c46]'}`}>
                                                {categories.filter((c: any) => c !== 'All').map((c: any) => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-[#7a8b95] uppercase tracking-widest block mb-2">Status</label>
                                            <select disabled={isReadOnly} value={config.status || 'Active'} onChange={e=>setConfig({...config, status: e.target.value})} className={`w-full border border-[#eaeaec] rounded-xl p-3 text-[12px] font-bold focus:border-[#4d87a8] outline-none transition-all cursor-pointer ${isReadOnly ? 'bg-[#f8f9fa] text-[#7a8b95]' : 'bg-[#f8f9fa] focus:bg-white text-[#212c46]'}`}>
                                                <option value="Active">Active</option>
                                                <option value="Inactive">Inactive</option>
                                                <option value="Draft">Draft</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTab !== 'batter' && (
                             <div className="bg-white p-8 rounded-xl border border-[#eaeaec] shadow-sm animate-fadeIn flex flex-col items-center justify-center text-[#7a8b95] py-20">
                                 <Icons.Settings size={48} className="mb-4 text-[#eaeaec]"/>
                                 <p className="font-bold uppercase tracking-widest text-[12px]">Advanced Config Panel placeholder</p>
                             </div>
                        )}
                    </div>
                </div>

                <div className="p-5 bg-white border-t border-[#eaeaec] flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-6 py-2.5 text-[#7a8b95] hover:text-[#212c46] font-bold text-[10px] uppercase tracking-widest transition-colors">Close</button>
                    {!isReadOnly && (
                        <button onClick={handleSaveClick} className="px-8 py-2.5 bg-[#212c46] hover:bg-[#4d87a8] text-white font-black text-[11px] uppercase tracking-widest rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2">
                            <LucideIcon name="save" size={14} /> Save Config
                        </button>
                    )}
                </div>
            </div>
        </DraggableModal>
    );
}

export default function STDProcess() {
    const { data: dbData, loading: dbLoading, add: addDb, update: updateDb, remove: removeDb } = useCollection('Std_Process_Time', MOCK_STANDARDS);
    const masterData = dbData && dbData.length > 0 ? dbData : MOCK_STANDARDS;
    
    // We can keep loading for the initial load if we want
    // But we'll rely on dbLoading
    // Remove the useEffect that sets dummy data!
    
    const [searchTerm, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [categories, setCategories] = useState(INITIAL_CATEGORIES);
    const [modalConfig, setModalConfig] = useState<any>({ isOpen: false, mode: 'view', data: null });
    const [csvModalOpen, setCsvModalOpen] = useState(false);
    const [batchConfigOpen, setBatchConfigOpen] = useState(false);
    const [batchConfig, setBatchConfig] = useState(() => {
        const stored = localStorage.getItem('mes_batch_config');
        return stored ? JSON.parse(stored) : { kgPerBatch: 80, mixingBatchSet: 2 };
    });
    const [showGuide, setShowGuide] = useState(false);
    const [activeMainTab, setActiveMainTab] = useState('Batter');

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const filteredData = useMemo(() => {
        return masterData.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  item.id.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
            return matchesSearch && matchesCategory;
        });
    }, [searchTerm, masterData, filterCategory]);

    const activeItemsCount = masterData.filter(i => i.status === 'Active').length;

    const handleDelete = (id: string) => {
        if(Swal) {
            Swal.fire({ title: 'Are you sure?', text: "You won't be able to revert this!", icon: 'warning', showCancelButton: true, confirmButtonColor: THEME.accent, confirmButtonText: 'Yes, delete it!' }).then((result: any) => { 
                if (result.isConfirmed) { 
                    removeDb(id); 
                    Swal.fire({icon: 'success', title: 'Deleted!', text: 'Record deleted.', timer: 1500, showConfirmButton: false}); 
                } 
            });
        }
    };

    const handleSave = (newItem: any) => {
        if (modalConfig.data && modalConfig.data.id) {
             updateDb(modalConfig.data.id, { ...newItem, updateDate: new Date().toLocaleDateString('en-GB') });
        } else {
             const newId = `STD-${Date.now().toString().slice(-6)}`;
             addDb({ ...newItem, id: newId, updateDate: new Date().toLocaleDateString('en-GB') });
        }
    };

    const handleCsvUpload = (newItems: any[]) => {
        newItems.forEach((ni: any) => {
             const existing = masterData.find(i => i.id === ni.id);
             if (existing && existing.id) {
                  updateDb(existing.id, ni);
             } else {
                  addDb(ni);
             }
        });
    }

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    if(dbLoading) return (
        <div className="flex h-screen w-full items-center justify-center bg-transparent">
            <div className="flex flex-col items-center gap-4">
                <Icons.Loader2 size={48} className="animate-spin text-[#212c46]" />
                <span className="text-[#212c46] font-black uppercase tracking-widest text-sm animate-pulse">Loading Configurations...</span>
            </div>
        </div>
    );

    return (
        <div className="flex flex-1 w-full flex-col animate-fadeIn bg-transparent space-y-4">
            <style>{globalStyles}</style>
            
            <button onClick={() => setShowGuide(true)} className="fixed right-0 top-[80px] bg-[#f8f9fa] border border-[#eaeaec] border-r-0 text-[#212c46] py-8 px-1.5 rounded-l-xl shadow-md hover:bg-[#932c2e] hover:text-white hover:border-[#932c2e] transition-all duration-500 z-[100] flex flex-col items-center gap-4 group">
                <Icons.HelpCircle size={18} className="shrink-0 group-hover:rotate-12 transition-transform text-[#7a8b95] group-hover:text-white" />
                <span className="font-black tracking-[0.3em] [writing-mode:vertical-rl] rotate-180 whitespace-nowrap uppercase text-[11px]">USER GUIDE</span>
            </button>
            <UserGuidePanel isOpen={showGuide} onClose={() => setShowGuide(false)} title="STANDARD TIME GUIDE" subtitle="STANDARD PROCESS TIME MANAGEMENT">
                <div className="space-y-8 font-sans">
                    <div>
                        <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                            <Icons.Timer size={16} className="text-[#3f809e]" /> 1. ภาพรวมระบบ (System Overview)
                        </h3>
                        <p className="mb-4 text-[#414757]">
                            โมดูลทำหน้าที่จัดการเวลามาตรฐานในการผลิต (Standard Time) เช่น เวลาสูตรผสม หรือ เครื่องแพ็คแยกย่อยตามชนิดสินค้า เพื่อให้นำค่าตรงนี้ไปคำนวณในปฏิทิน และเป็น Core Engine ในการใช้งาน AI วางแผน
                        </p>
                    </div>

                    <div className="h-px bg-[#eaeaec] w-full" />

                    <div>
                        <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                            <Icons.Settings size={16} className="text-[#b58c4f]" /> 2. การจัดการข้อมูลเวลามาตรฐาน (Management)
                        </h3>
                        <p className="mb-4 text-[#414757]">
                            ข้อมูลแต่ละรายการ (Item) จะเก็บพารามิเตอร์ต่างๆ ได้แก่:
                        </p>
                        <div className="space-y-3">
                            <div className="p-3 bg-[#f8f9fa] border border-[#eaeaec] rounded-xl flex items-start gap-4 text-[12px]">
                                <div className="p-2 bg-[#d55a6d] text-white rounded-lg"><Icons.Briefcase size={16} /></div>
                                <div>
                                    <strong className="text-[#212c46]">Setup Time (Prep)</strong>
                                    <p className="text-[#7a8b95]">เวลาตระเตรียม เช่น อุ่นเครื่อง ซับน้ำ ทำความสะอาด ฯลฯ</p>
                                </div>
                            </div>
                            <div className="p-3 bg-[#f8f9fa] border border-[#eaeaec] rounded-xl flex items-start gap-4 text-[12px]">
                                <div className="p-2 bg-[#3f809e] text-white rounded-lg"><Icons.PlayCircle size={16} /></div>
                                <div>
                                    <strong className="text-[#212c46]">Process Time (Run)</strong>
                                    <p className="text-[#7a8b95]">เวลาที่ใช้ผลิตจริง มีหน่วยเวลาต่อชิ้น, ต่อกิโลกรัม, ต่อล๊อตผลิต</p>
                                </div>
                            </div>
                            <div className="p-3 bg-[#f8f9fa] border border-[#eaeaec] rounded-xl flex items-start gap-4 text-[12px]">
                                <div className="p-2 bg-[#b58c4f] text-white rounded-lg"><Icons.MonitorStop size={16} /></div>
                                <div>
                                    <strong className="text-[#212c46]">Teardown Time (End)</strong>
                                    <p className="text-[#7a8b95]">เวลาเก็บกวาด ซักล้าง ปิดเครื่อง หลังจากผลิตจบออเดอร์แล้ว</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-[#eaeaec] w-full" />

                    <div>
                        <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                            <Icons.DownloadCloud size={16} className="text-[#688a58]" /> 3. IMPORT / EXPORT (ข้อมูลจำนวนมาก)
                        </h3>
                        <div className="space-y-3 p-4 bg-[#fdf2f2] border border-[#f5c6cb] rounded-xl text-[#414757]">
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>CSV Import:</strong> สามารถอัปโหลดไฟล์ Excel (.csv) โดยโครงสร้างต้องมี Columns: ItemCode, Type, Target, Batch Size</li>
                                <li><strong>Export Data:</strong> การสำรองข้อมูลทั้งหมดในฐานข้อมูล เป็นเอกสาร Excel ภายนอก</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </UserGuidePanel>
            <CsvUploadModal isOpen={csvModalOpen} onClose={() => setCsvModalOpen(false)} onUpload={handleCsvUpload} />
            <ConfigModal isOpen={modalConfig.isOpen} onClose={() => setModalConfig({ ...modalConfig, isOpen: false, data: null })} data={modalConfig.data} mode={modalConfig.mode} onSave={handleSave} categories={categories} />

            {batchConfigOpen && (
                <DraggableModal
                    isOpen={batchConfigOpen}
                    onClose={() => setBatchConfigOpen(false)}
                    width="max-w-[450px]"
                    title="Batch Core Configuration"
                >
                    <div className="p-6 bg-[#f8f9fa] space-y-6 select-none font-sans">
                        <div className="space-y-4">
                            <h4 className="text-[12px] font-black text-[#212c46] uppercase border-b-2 border-[#eaeaec] pb-2 tracking-widest flex items-center gap-2">
                                <Icons.Settings size={14} className="text-[#b7a159]" /> System-Wide Settings
                            </h4>
                            <div>
                                <label className="block text-[10px] font-black text-[#7a8b95] uppercase tracking-widest mb-1.5 flex items-center justify-between">
                                    <span>Standard Batch Weight (Kg)</span>
                                    <span className="text-[#b7a159] bg-[#b7a159]/10 px-2 py-0.5 rounded text-[9px]">Global</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={batchConfig.kgPerBatch}
                                        onChange={e => setBatchConfig({ ...batchConfig, kgPerBatch: Number(e.target.value) })}
                                        className="w-full bg-white border border-[#eaeaec] rounded-xl pl-4 pr-12 py-3 text-[14px] font-mono font-black text-[#212c46] outline-none focus:border-[#4d87a8] transition-colors shadow-sm"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#7a8b95] uppercase">Kg</span>
                                </div>
                                <p className="text-[10px] text-[#7a8b95] font-bold mt-1.5 leading-tight">ระบบจะใช้ค่านี้แปลงหน่วยระหว่าง Kg กับ Batch อัตโนมัติใน Daily Board</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-[12px] font-black text-[#212c46] uppercase border-b-2 border-[#eaeaec] pb-2 tracking-widest flex items-center gap-2 mt-2">
                                <Icons.Layers size={14} className="text-[#3f809e]" /> Batter Mixing Routing
                            </h4>
                            <div>
                                <label className="block text-[10px] font-black text-[#7a8b95] uppercase tracking-widest mb-1.5 flex items-center justify-between">
                                    <span>Mixing Lot Size (Batches/Set)</span>
                                    <span className="text-[#3f809e] bg-[#3f809e]/10 px-2 py-0.5 rounded text-[9px]">Process</span>
                                </label>
                                <div className="flex bg-white rounded-xl border border-[#eaeaec] overflow-hidden shadow-sm">
                                    <button 
                                        onClick={() => setBatchConfig({ ...batchConfig, mixingBatchSet: Math.max(1, batchConfig.mixingBatchSet - 1) })}
                                        className="px-4 bg-[#f8f9fa] hover:bg-[#eaeaec] transition-colors border-r border-[#eaeaec] flex items-center justify-center text-[#212c46]"
                                    >
                                        <Icons.Minus size={14} />
                                    </button>
                                    <input
                                        type="number"
                                        value={batchConfig.mixingBatchSet}
                                        onChange={e => setBatchConfig({ ...batchConfig, mixingBatchSet: Math.max(1, Number(e.target.value)) })}
                                        className="w-full bg-transparent text-center py-3 text-[14px] font-mono font-black text-[#212c46] outline-none"
                                    />
                                    <button 
                                        onClick={() => setBatchConfig({ ...batchConfig, mixingBatchSet: batchConfig.mixingBatchSet + 1 })}
                                        className="px-4 bg-[#f8f9fa] hover:bg-[#eaeaec] transition-colors border-l border-[#eaeaec] flex items-center justify-center text-[#212c46]"
                                    >
                                        <Icons.Plus size={14} />
                                    </button>
                                </div>
                                <p className="text-[10px] text-[#7a8b95] font-bold mt-1.5 leading-tight">สามารถสั่ง Mix Batter เป็น Batch ที่ผลิต 1 Set ตามเครื่องจักรได้เลย (เช่น 2 Batch, 9 Batch ฯลฯ)</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-4 bg-white border-t border-[#eaeaec] flex justify-end gap-3 shrink-0 rounded-b-2xl">
                        <button
                            onClick={() => setBatchConfigOpen(false)}
                            className="px-6 py-2.5 text-[#7a8b95] hover:text-[#212c46] font-bold text-[10px] uppercase tracking-widest transition-colors"
                        >
                            Close
                        </button>
                        <button
                            onClick={() => {
                                localStorage.setItem('mes_batch_config', JSON.stringify(batchConfig));
                                setBatchConfigOpen(false);
                                if (Swal) Swal.fire({ icon: 'success', title: 'Config Updated', text: 'Batch configurations applied globally.', timer: 1500, showConfirmButton: false });
                            }}
                            className="bg-[#212c46] text-white px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest tracking-[0.05em] hover:bg-[#4d87a8] transition-all flex items-center gap-1.5 shadow-md active:scale-95"
                        >
                            <Icons.Save justify-end size={14} /> Apply Settings
                        </button>
                    </div>
                </DraggableModal>
            )}

            {/* Header Bar synced with other modules */}
            <div className="h-14 px-4 sm:px-8 flex flex-row items-center justify-between gap-4 z-20 shrink-0">
                <div className="flex items-center gap-5">
                    <div className="relative flex items-center justify-center group cursor-default shrink-0">
                        <div className="absolute inset-0 bg-[#212c46] blur-[15px] opacity-20 rounded-full group-hover:opacity-60 transition-all duration-700"></div>
                        <div className="relative z-10 p-1.5 border border-[#212c46]/40 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm">
                            <Icons.Settings2 size={28} strokeWidth={2.5} className="text-[#212c46]" />
                        </div>
                    </div>
                    <div>
                        <h3 className="font-black text-[#212c46] uppercase tracking-tighter leading-none font-exception-header" style={{ fontSize: '24px' }}>
                            STD PROCESS <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#212c46] to-[#4d87a8]">TIME</span>
                        </h3>
                        <p className="text-[11px] font-bold text-[#7a8b95] uppercase tracking-[0.2em] mt-0.5 opacity-80 leading-none">
                            Configure Production Standards & Routing
                        </p>
                    </div>
                </div>
                
                {/* Main Tabs matching Master Item */}
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
                {/* KPI STATS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 shrink-0">
                    <KpiCard label="Process Standards" value={masterData.length} icon="settings" colorAccent="#4d87a8" colorValue={THEME.primary} desc="Configured Routings" />
                    <KpiCard label="Active Standards" value={activeItemsCount} icon="check-circle" colorAccent="#2e7d32" colorValue={THEME.primary} desc="In Service" />
                    <KpiCard label="Pending Review" value={masterData.filter(i => i.status === 'Draft').length} icon="clock" colorAccent="#f59e0b" colorValue={THEME.primary} desc="Draft Records" />
                    <KpiCard label="System Status" value="OPT-IN" icon="activity" colorAccent="#932c2e" colorValue={THEME.primary} desc="Operational" />
                </div>

                <div className="w-full flex-1 flex flex-col min-h-[500px]">
                    <div className="sys-table-card border-[#eaeaec] flex flex-col flex-1 shadow-lg bg-white overflow-hidden rounded-xl border">
                        
                        {/* TOOLBAR */}
                        <div className="px-4 py-4 border-b border-[#eaeaec] flex flex-col md:flex-row justify-between items-center bg-white shrink-0 gap-4">
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <span className="bg-[#f8f9fa] text-[#7a8b95] border border-[#eaeaec] font-mono font-black text-[11px] px-3 py-1.5 rounded-lg flex items-center justify-center shadow-sm">
                                    {filteredData.length} RECORDS
                                </span>
                            </div>
                            <div className="flex gap-3 w-full md:w-auto items-center">
                                <div className="relative group">
                                    <Icons.Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a8b95] group-hover:text-[#212c46] transition-colors" />
                                    <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="pl-9 pr-8 py-2 border border-[#eaeaec] rounded-xl text-[12px] font-bold bg-[#f8f9fa] focus:border-[#4d87a8] outline-none cursor-pointer transition-all text-[#212c46] shadow-sm appearance-none h-10 w-44">
                                        <option value="All">All Categories</option>
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <Icons.ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a8b95] pointer-events-none" />
                                </div>
                                <div className="relative flex-1 md:w-64">
                                    <Icons.Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a8b95]"/>
                                    <input type="text" placeholder="Search Standards..." value={searchTerm} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-[#eaeaec] rounded-xl text-[12px] font-bold focus:outline-none focus:border-[#4d87a8] bg-[#f8f9fa] focus:bg-white shadow-sm text-[#212c46] h-10 transition-all" />
                                </div>
                                <button onClick={() => setBatchConfigOpen(true)} className="bg-white border border-[#b7a159] text-[#b7a159] hover:bg-[#b7a159] hover:text-white px-4 py-2 rounded-xl font-bold text-[12px] uppercase tracking-widest flex items-center gap-2 shadow-sm transition-colors md:flex h-10">
                                    <Icons.Settings size={14} /> Batch Config
                                </button>
                                <button onClick={() => setCsvModalOpen(true)} className="bg-white border border-[#eaeaec] hover:border-[#4d87a8] hover:text-[#4d87a8] text-[#7a8b95] px-4 py-2 rounded-xl font-bold text-[12px] uppercase tracking-widest flex items-center gap-2 shadow-sm transition-colors hidden md:flex h-10"><Icons.Upload size={14} /> Import</button>
                                <button onClick={() => setModalConfig({ isOpen: true, mode: 'edit', data: null })} className="bg-[#212c46] hover:bg-[#414757] text-white px-5 py-2 rounded-xl font-black text-[12px] uppercase tracking-widest shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap shrink-0 h-10 border border-[#212c46]">
                                    <Icons.Plus size={14} /> New Standard
                                </button>
                            </div>
                        </div>

                        {/* TABLE */}
                        <div className="flex-1 overflow-hidden flex flex-col">
                            <div className="overflow-y-auto flex-1 custom-scrollbar bg-slate-50/50">
                                <table className="w-full text-left min-w-[1000px] border-collapse bg-white table-font">
                                    <thead className="sys-table-header [#eaeaec] sticky top-0 z-10 font-black uppercase tracking-widest ">
                    <tr>
                                            <th className="pl-8 w-[15%] align-middle font-black ">Standard ID</th>
                                            <th className="w-[25%] align-middle font-black ">Standard Name</th>
                                            <th className="w-[15%] align-middle font-black ">Category</th>
                                            <th className="w-[12%] text-right align-middle font-black ">Batch Size</th>
                                            <th className="w-[10%] text-center align-middle font-black ">Yield</th>
                                            <th className="w-[10%] text-center align-middle font-black ">Status</th>
                                            <th className="pr-8 text-right w-24 align-middle font-black ">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#eaeaec]">
                                        {currentItems.map((item: any) => (
                                            <tr key={item.id} className="hover:bg-[#f8f9fa] transition-colors group">
                                                <td className="px-4 pl-8 align-middle py-2.5">
                                                    <span className="font-bold text-[#4d87a8] text-[12px] font-mono leading-tight bg-[#4d87a8]/10 px-2.5 py-1 rounded-md border border-[#4d87a8]/20 cursor-pointer hover:bg-[#4d87a8] hover:text-white transition-colors" onClick={() => setModalConfig({ isOpen: true, mode: 'view', data: item })}>
                                                        {item.id}
                                                    </span>
                                                </td>
                                                <td className="px-4 align-middle py-2.5">
                                                    <div className="font-bold text-[#212c46] text-[12px] leading-tight cursor-pointer hover:text-[#4d87a8] transition-colors" onClick={() => setModalConfig({ isOpen: true, mode: 'view', data: item })}>
                                                        {item.name}
                                                    </div>
                                                </td>
                                                <td className="px-4 align-middle py-2.5">
                                                    <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold uppercase tracking-widest shadow-sm ${getCategoryStyle(item.category)}`}>
                                                        {item.category}
                                                    </span>
                                                </td>
                                                <td className="px-4 align-middle text-right py-2.5">
                                                    <div className="flex items-baseline justify-end gap-[1px] whitespace-nowrap">
                                                        <span className="font-mono font-black text-[#212c46] text-[12px]">
                                                            {item.rawWeightPerBatch}
                                                        </span>
                                                        <span className="text-[10px] text-[#7a8b95] font-bold uppercase tracking-widest">
                                                            KG
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 align-middle text-center py-2.5">
                                                    <div className="flex flex-col items-center justify-center gap-[1px] w-full max-w-[80px] mx-auto">
                                                        <div className="w-full h-1.5 bg-[#eaeaec] rounded-full overflow-hidden">
                                                            <div className="h-full bg-[#4d87a8] rounded-full" style={{ width: `${item.yieldPercent}%` }}></div>
                                                        </div>
                                                        <span className="font-mono font-black text-[#212c46] text-[11px] leading-none">{item.yieldPercent}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 align-middle text-center py-2.5">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm border whitespace-nowrap ${getStatusStyle(item.status)}`}>
                                                        {item.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-4 pr-8 align-middle py-2.5">
                                                    <div className="flex justify-end gap-[1px] transition-opacity">
                                                        <button onClick={() => setModalConfig({ isOpen: true, mode: 'edit', data: item })} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#eaeaec] text-[#4d87a8] hover:border-[#212c46] hover:text-[#a94228] hover:bg-[#212c46]/5 transition-all shadow-sm bg-white active:scale-90" title="Edit">
                                                            <Icons.Pencil size={16} />
                                                        </button>
                                                        {!IS_DEMO && (
                                                            <button onClick={() => handleDelete(item.id)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#eaeaec] text-[#932c2e] hover:border-[#932c2e] hover:bg-[#932c2e]/10 transition-all shadow-sm bg-white active:scale-90" title="Delete">
                                                                <Icons.Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {currentItems.length === 0 && (
                                            <tr>
                                                <td className="text-center py-2.5 px-4">
                                                    <div className="flex flex-col items-center justify-center gap-[1px]">
                                                        <Icons.Inbox size={48} className="text-[#eaeaec]" />
                                                        <span className="text-[#7a8b95] font-bold uppercase tracking-widest text-[12px]">No Standards Found</span>
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
                                    SHOWING {indexOfFirstItem + 1} TO {Math.min(indexOfLastItem, filteredData.length)} OF {filteredData.length} ENTRIES
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
                </div>
            </div>
        </div>
    );
}
