import React from 'react';
import { DraggableModal } from './DraggableModal';
import { Settings, CheckCircle2, ChevronRight, Zap } from 'lucide-react';

interface AspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  onSave?: () => void;
}

export function AspectModal({
  isOpen,
  onClose,
  title = "Energy Consumption Configuration",
  onSave
}: AspectModalProps) {
  return (
    <DraggableModal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="p-6 space-y-6">
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-4">
          <div className="bg-blue-600 text-white p-2 rounded-lg mt-1 shrink-0">
            <Zap size={20} />
          </div>
          <div>
            <h4 className="text-[12px] font-black text-blue-900 uppercase tracking-widest mb-1">Environmental Baseline</h4>
            <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
              Configure parameters based on the current production environment. This will affect power load balancing across heavy machinery in Mixing and Forming.
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Idle Power Threshold (kW)</label>
            <input type="number" defaultValue={250} className="w-full border border-slate-200 bg-slate-50 rounded-lg p-2.5 text-[12px] font-mono text-slate-800 focus:border-blue-500 outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Cooling Target (°C)</label>
            <input type="number" defaultValue={-18} className="w-full border border-slate-200 bg-slate-50 rounded-lg p-2.5 text-[12px] font-mono text-slate-800 focus:border-blue-500 outline-none transition-colors" />
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Load Distribution Algorithm</label>
            <select className="w-full border border-slate-200 bg-slate-50 rounded-lg p-2.5 text-[12px] font-bold text-slate-800 focus:border-blue-500 outline-none transition-colors cursor-pointer">
              <option>Dynamic Capacity Allocation</option>
              <option>Fixed Cycle Operation</option>
              <option>Eco-Save Mode (Low Output)</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 text-[11px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-800 transition-colors">
            Cancel
          </button>
          <button 
            onClick={() => {
              if (onSave) onSave();
              onClose();
            }} 
            className="px-6 py-2 bg-[#212c46] hover:bg-[#111f42] text-white text-[11px] font-black uppercase tracking-widest rounded-lg shadow-sm transition-colors flex items-center gap-2"
          >
            <CheckCircle2 size={14} />
            Save Profile
          </button>
        </div>
      </div>
    </DraggableModal>
  );
}
