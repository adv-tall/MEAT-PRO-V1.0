import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import * as Icons from 'lucide-react';
import { UserGuidePanel } from '@/src/components/shared/UserGuidePanel';
import { 
  Settings2, Search, HelpCircle, CheckCircle2, AlertTriangle, X, Save,
  LayoutGrid, Lock, Calendar, Filter, Users, Megaphone, Briefcase,
  TrendingUp, MessageSquare, BadgePercent, Database, ChevronDown, Ship,
  Factory, DollarSign, ShieldCheck, FileText, Clock, Target, Activity,
  GraduationCap, BarChart2
} from 'lucide-react';

const THEME = {
  bgMain: '#f3f3f1',
  bgGradient: 'transparent',
  sidebarBg: 'linear-gradient(180deg, #1d2636 0%, #0F172A 100%)',
  glassWhite: 'rgba(255, 255, 255, 0.88)',
  primary: '#212c46',
  primaryLight: '#4d87a8',
  accent: '#a94228',
  gold: '#b58c4f',
  brightGold: '#b7a159',
  success: '#657f4d',
  danger: '#932c2e',
  skyBlue: '#3f809e',
  dustyBlue: '#7a8b95',
  indigo: '#414757',
  softPurple: '#ab7d82',
  deepPurple: '#2d2c4a',
  pinkAccent: '#a54f6b',
  mutedSlate: '#606a5f',
  darkSlate: '#2f2926',
  silver: '#d7d7d7',
  deepNavy: '#212c46',
  brownGold: '#b58c4f',
  vibrantPurple: '#2d2c4a',
  burntOrange: '#d96245',
  slateBlue: '#748ea1',
  coolGray: '#eaeaec'
};

import { SYSTEM_MODULES } from '../../config/modules';
import KpiCard from '../../components/shared/KpiCard';

const ToggleSwitch = ({ isOn, onToggle }: any) => (
    <div className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${isOn ? 'bg-[#4d87a8]' : 'bg-[#eaeaec]'}`} onClick={onToggle}>
        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${isOn ? 'translate-x-6' : 'translate-x-0'}`}></div>
    </div>
);


function SaveConfirmModal({ isOpen, onClose, onConfirm }: any) {
    if (!isOpen) return null;
    return createPortal(
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#212c46]/80 backdrop-blur-md p-4 animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden relative border border-[#b7a159]">
                <div className="p-8 text-center">
                    <div className="w-20 h-20 bg-[#b7a159]/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#b7a159]/40">
                        <Save size={32} className="text-[#b7a159]" />
                    </div>
                    <h3 className="text-xl font-black text-[#212c46] uppercase tracking-widest mb-2">Save Configuration?</h3>
                    <p className="text-[12px] text-[#7a8b95] font-medium leading-relaxed">การเปลี่ยนแปลงนี้จะส่งผลต่อเมนู Sidebar และ User Permission ของบุคลากรทุกคนในระบบแบบ Real-time ต้องการดำเนินการต่อหรือไม่?</p>
                </div>
                <div className="p-6 bg-[#f8f9fa] border-t border-[#eaeaec] flex justify-center gap-3 shrink-0">
                    <button onClick={onClose} className="px-6 py-2.5 bg-white border border-[#eaeaec] text-[#414757] rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-[#d7d7d7] transition-all active:scale-90 shadow-sm">
                        CANCEL
                    </button>
                    <button onClick={() => { onConfirm(); onClose(); }} className="px-8 py-2.5 bg-[#212c46] text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-md hover:bg-[#414757] hover:text-white transition-all flex items-center gap-2 active:scale-95 border border-[#212c46]">
                        <CheckCircle2 size={16}/> Confirm & Sync
                    </button>
                </div>
            </div>
        </div>, document.body
    );
}

import { useVisibility } from '../../context/ModuleVisibilityContext';

export default function DevPermit() {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedModules, setExpandedModules] = useState<any>({});
  const { visibility, setVisibility } = useVisibility();

  // Handle initializing visibility for any modules that might be missing from storage
  useEffect(() => {
    let changed = false;
    const newVis = { ...visibility };
    SYSTEM_MODULES.forEach((m: any) => {
      if (newVis[m.id] === undefined) {
        newVis[m.id] = true;
        changed = true;
      }
      if (m.subItems) {
        m.subItems.forEach((s: any) => {
          if (newVis[s.id] === undefined) {
            newVis[s.id] = true;
            changed = true;
          }
        });
      }
    });
    if (changed) setVisibility(newVis);
  }, []);

  const handleToggle = (id: string, isParent: boolean, parentId: string | null = null) => {
      setVisibility((prev: any) => {
          const newState = { ...prev, [id]: !prev[id] };
          if (isParent) {
              const module = SYSTEM_MODULES.find((m: any) => m.id === id);
              if (module && (module as any).subItems) (module as any).subItems.forEach((s: any) => newState[s.id] = !prev[id]);
          } else if (parentId) {
              if (!prev[id]) newState[parentId] = true;
          }
          return newState;
      });
  };

  const toggleExpand = (id: string) => setExpandedModules((prev: any) => ({ ...prev, [id]: !prev[id] }));
  const handleSaveConfig = () => alert("Configuration Saved and Synced to Sidebar successfully!");

  const totalComponents = Object.keys(visibility).length;
  const activeComponents = Object.values(visibility).filter(Boolean).length;
  const restrictedComponents = totalComponents - activeComponents;

  const filteredModules = useMemo(() => {
      if (!search) return SYSTEM_MODULES;
      const s = (search || "").toLowerCase();
      return SYSTEM_MODULES.map((m: any) => {
          const matchParent = (m.label || "").toLowerCase().includes(s);
          const matchedSubs = m.subItems ? m.subItems.filter((sub: any) => (sub.label || "").toLowerCase().includes(s)) : [];
          if (matchParent || matchedSubs.length > 0) return { ...m, subItems: m.subItems ? matchedSubs : undefined, isSearchMatch: true };
          return null;
      }).filter(Boolean);
  }, [search]);

  useEffect(() => {
      if (search) {
          const allExpanded: any = {};
          filteredModules.forEach((m: any) => allExpanded[m.id] = true);
          setExpandedModules(allExpanded);
      }
  }, [search, filteredModules]);

  return (
    <div className="flex flex-1 w-full flex-col animate-fadeIn bg-transparent space-y-4">
      
      <button onClick={() => setIsGuideOpen(true)} className="fixed right-0 top-[80px] bg-[#f8f9fa] border border-[#eaeaec] border-r-0 text-[#212c46] py-8 px-1.5 rounded-l-xl shadow-md hover:bg-[#932c2e] hover:text-white hover:border-[#932c2e] transition-all duration-500 z-[100] flex flex-col items-center gap-4 group">
          <HelpCircle size={18} className="shrink-0 group-hover:rotate-12 transition-transform text-[#7a8b95] group-hover:text-white" />
          <span className="font-black tracking-[0.3em] [writing-mode:vertical-rl] rotate-180 whitespace-nowrap uppercase text-[11px]">USER GUIDE</span>
      </button>

      <UserGuidePanel isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} title="DEV GUIDE" subtitle="SYSTEM VISIBILITY CONTROL">
        <div className="space-y-8">
            <div>
                <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                    <Icons.LayoutGrid size={16} className="text-[#b7a159]" /> 1. GLOBAL MENU SYNC
                </h3>
                <div className="p-4 bg-[#f8f9fa] border border-[#eaeaec] rounded-xl">
                    <p className="mb-4">ระบบ Dev Permit (BETA) ออกแบบมาเพื่อให้นักพัฒนา (Developer) หรือ Super Admin สามารถควบคุม <span className="font-bold">การมองเห็น (Visibility)</span> ของเมนูทั้งหมดในระบบส่วนกลาง</p>
                    <div className="p-4 bg-[#e8eff4] rounded-lg text-[#3f809e]">
                        การเปิด/ปิดเมนูในหน้านี้ จะส่งผลกระทบโดยตรงต่อ <span className="font-bold">Sidebar Menu หลัก</span> และ <span className="font-bold">User Permission Module</span> ของพนักงานทุกคนแบบ Real-time (Auto Sync) ทันทีที่บันทึก
                    </div>
                </div>
            </div>

            <div className="h-px bg-[#eaeaec] w-full" />

            <div>
                <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                    <Icons.Lock size={16} className="text-[#932c2e]" /> 2. MAIN VS SUB-MODULES
                </h3>
                <div className="p-4 bg-[#f8f9fa] border border-[#eaeaec] rounded-xl space-y-4">
                    <div className="flex gap-3">
                        <Icons.CheckCircle2 size={16} className="text-[#688a58] mt-0.5 shrink-0" />
                        <div>หากทำการ <span className="font-bold">ปิด</span> เมนูหลัก (Main Module) เมนูย่อยทั้งหมดภายใต้เมนูนั้นจะถูกซ่อนจาก Sidebar โดยอัตโนมัติ ไม่ว่าสิทธิ์รายบุคคลจะเป็นอย่างไรก็ตาม</div>
                    </div>
                    <div className="flex gap-3">
                        <Icons.CheckCircle2 size={16} className="text-[#688a58] mt-0.5 shrink-0" />
                        <div>คุณสามารถเลือกปิดเฉพาะ <span className="font-bold">เมนูย่อย (Sub-Modules)</span> บางฟังก์ชันที่ไม่เปิดใช้งานได้ โดยคลิกที่ลูกศร Dropdown ท้ายชื่อเมนูหลักเพื่อกางเมนูย่อยออกมา</div>
                    </div>
                </div>
            </div>
            
            <div className="h-px bg-[#eaeaec] w-full" />

            <div>
                <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                    <Icons.AlertTriangle size={16} className="text-[#d55a6d]" /> 3. SYSTEM WARNING
                </h3>
                
                <div className="p-4 bg-[#fdf2f2] border border-[#f5c6cb] rounded-xl text-[#932c2e]">
                    อย่าลืมกดปุ่ม <span className="font-bold">SAVE CONFIGURATION</span> ที่มุมขวาบนหน้าจอทุกครั้งหลังจากปรับเปลี่ยนค่า Toggle เพื่อให้ระบบอัปเดตสถานะและเขียนทับลงใน Master Database
                </div>
            </div>
        </div>
      </UserGuidePanel>
      <SaveConfirmModal isOpen={isSaveModalOpen} onClose={() => setIsSaveModalOpen(false)} onConfirm={handleSaveConfig} />

      <div className="h-14 px-4 sm:px-8 flex flex-row items-center justify-between gap-4 z-20 shrink-0">
          <div className="flex items-center gap-5">
              <div className="relative flex items-center justify-center group cursor-default shrink-0">
                  <div className="absolute inset-0 bg-[#3f809e] blur-[15px] opacity-20 rounded-full group-hover:opacity-60 transition-all duration-700"></div>
                  <div className="relative z-10 p-1.5 border border-[#3f809e]/40 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm">
                      <Settings2 size={28} strokeWidth={2.5} className="text-[#3f809e]" />
                  </div>
              </div>
              <div className="flex flex-col">
                  <div className="flex items-center gap-3">
                      <h3 className="font-black text-[#212c46] uppercase tracking-widest text-[24px] flex items-center gap-2 leading-none font-exception-header">DEV <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3f809e] to-[#b58c4f] drop-shadow-sm">PERMIT</span></h3>
                      <span className="px-3 py-1 bg-[#932c2e]/20 text-[#932c2e] text-[11px] font-black rounded-full border border-[#932c2e]/40 uppercase tracking-widest shadow-sm">BETA</span>
                  </div>
                  <p className="text-[11px] font-bold text-[#4d5a44] uppercase tracking-[0.2em] mt-0.5 opacity-80 leading-none">SYSTEM MODULE VISIBILITY CONTROL</p>
              </div>
          </div>
          <button onClick={() => setIsSaveModalOpen(true)} className="bg-gradient-to-r from-[#212c46] to-[#414757] hover:scale-105 text-white px-8 py-3.5 rounded-xl font-black text-[12px] uppercase tracking-widest shadow-md transition-all flex items-center gap-3 active:scale-95 border border-[#212c46]">
              <Save size={16} className="text-current" /> SAVE CONFIGURATION
          </button>
      </div>

      <div className="mx-auto px-4 sm:px-8 w-full mt-[2px]">
        <div className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5 shrink-0 z-20">
              <KpiCard label="ACTIVE MODULES" value={<>{activeComponents} <span className="text-[20px] text-[#7a8b95]">/ {totalComponents}</span></>} icon={LayoutGrid} colorAccent={THEME.primaryLight} colorValue={THEME.primary} desc="Currently Visible Components" />
              <KpiCard label="RESTRICTED VISIBILITY" value={restrictedComponents} icon={Lock} colorAccent={THEME.danger} colorValue={THEME.danger} desc="Modules Hidden From Sidebar" />
              <KpiCard label="MAIN CATEGORIES" value={SYSTEM_MODULES.length} icon={Briefcase} colorAccent={THEME.gold} colorValue={THEME.gold} desc="Primary Navigation Headers" />
              <KpiCard label="SUB MODULES" value={totalComponents - SYSTEM_MODULES.length} icon={LayoutGrid} colorAccent={THEME.skyBlue} colorValue={THEME.skyBlue} desc="Nested System Components" />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-[#eaeaec]/60 overflow-hidden flex flex-col animate-fadeIn">
            <div className="px-4 py-4 border-b-2 border-[#b7a159] bg-white flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
                <h4 className="text-[14px] font-black uppercase text-white tracking-widest flex items-center gap-3"><Database size={18} className="text-[#b7a159]"/> MODULE TOGGLE LIST</h4>
                <div className="relative w-full md:w-80 font-sans">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
                    <input type="text" value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search modules..." className="w-full pl-12 pr-4 py-2 text-[12px] border border-transparent rounded-xl font-bold outline-none focus:border-[#b7a159] bg-white/10 text-white placeholder:text-white/50 focus:bg-white focus:text-[#212c46] shadow-sm transition-all" />
                </div>
            </div>

            <div className="p-5 space-y-3 bg-[#f8f9fa] table-font">
                {filteredModules.length === 0 ? (
                    <div className="text-center py-20 text-[#7a8b95] font-bold text-[12px]">No modules found matching "{search}"</div>
                ) : (
                    filteredModules.map((module: any) => {
                        if (module.isHeading) {
                            return (
                                <div key={module.id} className="pt-4 pb-2 px-3">
                                    <h4 className="text-[10px] font-black text-[#7a8b95] uppercase tracking-[0.2em]">{module.label}</h4>
                                </div>
                            );
                        }
                        return (
                        <div key={module.id} className="space-y-1.5 animate-fadeIn">
                            <div className={`flex items-center justify-between px-5 py-3 rounded-xl border transition-all duration-300 ${visibility[module.id] ? 'bg-white border-[#eaeaec] shadow-sm hover:border-[#4d87a8]/40' : 'bg-[#d7d7d7] border-[#eaeaec]/50 opacity-75'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${visibility[module.id] ? 'bg-[#4d87a8]/10 text-[#4d87a8] border-[#4d87a8]/20' : 'bg-white text-[#7a8b95] border-[#eaeaec]'}`}>{module.icon && <module.icon size={18} />}</div>
                                    <div className="flex flex-col gap-0.5">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-black text-[12px] uppercase tracking-widest ${visibility[module.id] ? 'text-[#212c46]' : 'text-[#7a8b95]'}`}>{module.label}</span>
                                            {module.subItems && (
                                                <button onClick={() => toggleExpand(module.id)} className="w-8 h-8 flex items-center justify-center text-[#7a8b95] hover:text-[#a94228] hover:bg-[#d7d7d7] rounded-lg transition-all" style={{ gap: '1px' }}>
                                                    <ChevronDown size={16} className={`transition-transform duration-300 ${expandedModules[module.id] ? 'rotate-180' : ''}`} />
                                                </button>
                                            )}
                                        </div>
                                        <span className={`text-[11px] font-bold uppercase tracking-widest ${visibility[module.id] ? 'text-[#4d87a8]' : 'text-[#7a8b95]'}`}>{visibility[module.id] ? 'ACTIVE' : 'HIDDEN'}</span>
                                    </div>
                                </div>
                                <ToggleSwitch isOn={visibility[module.id]} onToggle={() => handleToggle(module.id, true)} />
                            </div>
                            {module.subItems && expandedModules[module.id] && (
                                <div className="pl-12 pr-2 space-y-1.5 pt-0.5 pb-1.5">
                                    {module.subItems.map((sub: any) => (
                                        <div key={sub.id} className={`flex items-center justify-between px-5 py-3 rounded-xl border transition-all duration-300 ${visibility[sub.id] ? 'bg-white border-[#eaeaec] shadow-sm' : 'bg-[#d7d7d7] border-[#eaeaec]/50 opacity-70'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-1.5 h-1.5 rounded-full ${visibility[sub.id] ? 'bg-[#4d87a8]' : 'bg-[#eaeaec]'}`}></div>
                                                <span className={`font-bold text-[12px] uppercase tracking-wider ${visibility[sub.id] ? 'text-[#414757]' : 'text-[#7a8b95]'}`}>{sub.label}</span>
                                            </div>
                                            <ToggleSwitch isOn={visibility[sub.id]} onToggle={() => handleToggle(sub.id, false, module.id)} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        );
                    })
                )}
            </div>
            <div className="px-8 py-4 bg-[#f8f9fa] border-t border-[#eaeaec] flex justify-between items-center shrink-0">
                <p className="bg-white px-4 py-3 rounded-xl border border-[#eaeaec] shadow-sm text-[11px] font-black text-[#7a8b95] uppercase tracking-widest flex items-center gap-2"><Database size={14} className="text-[#b7a159]" /> Total Modules Configured: {totalComponents}</p>
                <span className="text-[11px] font-bold text-[#7a8b95] flex items-center gap-1.5"><AlertTriangle size={14} className="text-[#932c2e]" /> Save configuration to apply all changes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
