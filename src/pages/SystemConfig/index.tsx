import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { DraggableModal } from '../../components/shared/DraggableModal';
import { 
  Settings2, 
  Building2, 
  Layers, 
  Tag, 
  Users, 
  Printer, 
  Barcode, 
  Search, 
  Plus, 
  Pencil, 
  Trash2, 
  X, 
  Save, 
  ChevronLeft, 
  ChevronRight, 
  HelpCircle, 
  Database, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  BookOpen,
  Award, 
  Zap, 
  Globe, 
  Bell, 
  LogOut, 
  ChevronDown, 
  Check,
  LayoutGrid,
  FileText,
  Handshake,
  ShieldCheck,
  Key
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { UserGuidePanel } from '@/src/components/shared/UserGuidePanel';

// --- Theme Configuration (Synced with Home Palette) ---
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

// --- Mock Data ---
const INITIAL_DATA = {
  departments: [
    { id: 1, name: 'Management', code: 'MGT' },
    { id: 2, name: 'Human Resources', code: 'HR' },
    { id: 3, name: 'Information Technology', code: 'IT' },
    { id: 4, name: 'Production', code: 'PROD' },
    { id: 5, name: 'Quality Assurance', code: 'QA' },
    { id: 6, name: 'Quality Control', code: 'QC' },
    { id: 7, name: 'Warehouse', code: 'WH' },
  ],
  categories: [
    { id: 1, name: 'Sausage' },
    { id: 2, name: 'Meatball' },
    { id: 3, name: 'Bologna' },
    { id: 4, name: 'Ham' },
    { id: 5, name: 'Sliced' },
    { id: 6, name: 'Loaf' },
    { id: 7, name: 'Batter' },
    { id: 8, name: 'SFG' },
    { id: 9, name: 'NPD' },
  ],
  brands: [
    { id: 1, name: 'AFM' },
    { id: 2, name: 'CJ' },
    { id: 3, name: 'ARO' },
    { id: 4, name: 'MAKRO' },
    { id: 5, name: 'Betagro' },
    { id: 6, name: 'Generic' },
    { id: 7, name: 'No Brand' },
    { id: 8, name: 'Internal' },
    { id: 9, name: 'Test' },
  ],
  customers: [
    { id: 1, name: 'Makro' },
    { id: 2, name: 'CP All' },
    { id: 3, name: 'Lotus' },
    { id: 4, name: 'Big C' },
    { id: 5, name: 'Tops' },
    { id: 6, name: 'Foodland' },
    { id: 7, name: 'MaxValu' },
    { id: 8, name: 'CJ Express' },
  ],
  pdfTemplates: [
    { id: 1, name: 'DAR FORM', dept: 'DC CENTER', code: 'FM-DC01-01', revision: 'REV. 02' },
    { id: 2, name: 'DESTRUCTION REPORT', dept: 'DC CENTER', code: 'FM-DC03-01', revision: 'REV. 01' },
    { id: 3, name: 'DISTRIBUTION REPORT', dept: 'DC CENTER', code: 'FM-DC04-01', revision: 'REV. 01' },
  ],
  idFormats: [
    {
      id: 1,
      pages: ['Plan from Planning', 'Production Planning'],
      prefix: 'PL',
      format: 'YYMMDD',
      sequenceDigit: 3,
      reset: 'Daily',
      note: 'Replacement format: PLYYMMDD/R.1'
    },
    {
      id: 2,
      pages: ['Daily Problem'],
      prefix: 'DF',
      format: 'YYMMDD',
      sequenceDigit: 3,
      reset: 'Daily',
      note: ''
    }
  ]
};

const TABS = [
  { id: 'departments', label: 'Departments', icon: 'Building2', title: 'Departments Registry', desc: 'Manage organizational units and coding structures.' },
  { id: 'categories', label: 'Category & Sub-Cat', icon: 'Layers', title: 'Categories', desc: 'Manage product classification and groupings.' },
  { id: 'brands', label: 'Brand', icon: 'Tag', title: 'Brands', desc: 'Manage manufacturing and OEM branding.' },
  { id: 'customers', label: 'Customer', icon: 'Users', title: 'Customers', desc: 'Manage external client and partner profiles.' },
  { id: 'pdfTemplates', label: 'PDF Templates', icon: 'Printer', title: 'PDF FORM TEMPLATES', desc: 'Configure official document layouts and compliance headers.' },
  { id: 'idFormats', label: 'ID Formats', icon: 'Barcode', title: 'ID FORMAT CONFIG', desc: 'Define auto-generation rules for system identifiers.' }
];

const AVAILABLE_PAGES = ['Plan from Planning', 'Production Planning', 'Daily Problem', 'Master Item', 'Equipment Registry', 'STD Process'];

// --- Helper Components ---
const LucideIcon = ({ name, size = 16, className = "", color, style }: any) => {
    if (!name) return null;
    const IconComponent = Icons[name as keyof typeof Icons] || Icons.CircleHelp;
    return <IconComponent size={size} className={className} style={{...style, color: color}} strokeWidth={2} />;
};

import KpiCard from '../../components/shared/KpiCard';

// --- User Guide Panel ---

// --- Main Component ---
export default function SystemConfig() {
  const [activeTab, setActiveTab] = useState('departments'); 
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [data, setData] = useState<any>(INITIAL_DATA);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null); 
  const [formData, setFormData] = useState<any>({ 
      name: '', code: '', dept: '', revision: '', 
      pages: [], prefix: '', format: 'YYMMDD', sequenceDigit: 3, reset: 'Daily', note: '' 
  });

  const activeTabData: any = TABS.find(t => t.id === activeTab);
  const currentList = data[activeTab] || [];

  const filteredList = useMemo(() => {
      return currentList.filter((item: any) => {
          const s = search.toLowerCase();
          if (activeTab === 'idFormats') {
              return (item.prefix?.toLowerCase().includes(s) || 
                      item.pages?.join(',').toLowerCase().includes(s));
          }
          return (item.name?.toLowerCase().includes(s) || 
                  item.code?.toLowerCase().includes(s) || 
                  item.dept?.toLowerCase().includes(s));
      });
  }, [currentList, search, activeTab]);

  const paginatedData = filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);

  useEffect(() => { setCurrentPage(1); setSearch(''); }, [activeTab]);

  const handleOpenModal = (item: any = null) => {
    setEditingItem(item);
    setFormData(item ? { ...item } : { 
      name: '', code: '', dept: '', revision: '',
      pages: [], prefix: '', format: 'YYMMDD', sequenceDigit: 3, reset: 'Daily', note: ''
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: any) => {
    e.preventDefault();
    if (editingItem) {
      setData((prev: any) => ({
        ...prev,
        [activeTab]: prev[activeTab].map((item: any) => item.id === editingItem.id ? { ...item, ...formData } : item)
      }));
    } else {
      const newId = currentList.length > 0 ? Math.max(...currentList.map((i: any) => i.id)) + 1 : 1;
      setData((prev: any) => ({
        ...prev,
        [activeTab]: [...prev[activeTab], { id: newId, ...formData }]
      }));
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: any) => {
    if(window.confirm('Are you sure you want to delete this configuration?')) {
      setData((prev: any) => ({
        ...prev,
        [activeTab]: prev[activeTab].filter((item: any) => item.id !== id)
      }));
    }
  };

  const togglePageSelection = (page: string) => {
      setFormData((prev: any) => {
          const pages = prev.pages || [];
          if (pages.includes(page)) return { ...prev, pages: pages.filter((p: string) => p !== page) };
          return { ...prev, pages: [...pages, page] };
      });
  };

  return (
    <div className="flex flex-1 w-full flex-col animate-fadeIn bg-transparent space-y-4">
      
      {/* USER GUIDE TAB BUTTON */}
      <button onClick={() => setIsGuideOpen(true)} className="fixed right-0 top-[80px] bg-[#f8f9fa] border border-[#eaeaec] border-r-0 text-[#212c46] py-8 px-1.5 rounded-l-xl shadow-md hover:bg-[#932c2e] hover:text-white hover:border-[#932c2e] transition-all duration-500 z-[100] flex flex-col items-center gap-4 group">
          <HelpCircle size={18} className="shrink-0 group-hover:rotate-12 transition-transform text-[#7a8b95] group-hover:text-white" />
          <span className="font-black tracking-[0.3em] [writing-mode:vertical-rl] rotate-180 whitespace-nowrap uppercase text-[11px]">USER GUIDE</span>
      </button>

      <UserGuidePanel isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

      {/* HEADER SECTION */}
      <div className="h-14 px-8 flex flex-row items-center justify-between gap-4 z-20 shrink-0">
          <div className="flex items-center gap-5">
              <div className="relative flex items-center justify-center group cursor-default shrink-0">
                  <div className="absolute inset-0 bg-[#3f809e] blur-[15px] opacity-20 rounded-full group-hover:opacity-60 transition-all duration-700"></div>
                  <div className="relative z-10 p-1.5 border border-[#3f809e]/40 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm">
                      <Settings2 size={28} strokeWidth={2.5} className="text-[#3f809e]" />
                  </div>
              </div>
              <div>
                  <h1 className="font-black text-[#212c46] uppercase tracking-tighter leading-none font-exception-header" style={{ fontSize: '24px' }}>
                      CONFIG <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3f809e] to-[#b58c4f]">CENTER</span>
                  </h1>
                  <p className="text-[11px] font-bold text-[#4d5a44] uppercase tracking-[0.2em] mt-0.5 opacity-80 leading-none">
                      GLOBAL MASTER DATA & SYSTEM CONFIGURATION NODE
                  </p>
              </div>
          </div>
          
          <div className="flex items-center gap-4">
              <div className="hidden lg:flex items-center gap-3 bg-[#212c46] text-white px-5 py-2.5 rounded-xl shadow-lg border border-[#b7a159]/30">
                  <ShieldCheck size={16} />
                  <div className="text-[10px] font-black font-mono tracking-widest uppercase">
                      Admin Access Verified
                  </div>
              </div>
          </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="max-w-[1532px] mx-auto px-4 sm:px-8 w-full mt-[2px]">
        <div className="w-full">
            
            {/* KPI STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-5 shrink-0">
                <KpiCard label="Total Records" value={filteredList.length} icon="Database" colorAccent={THEME.primaryLight} colorValue={THEME.primary} desc={`Active in ${activeTabData.label}`} />
                <KpiCard label="System Node" value={activeTab.charAt(0).toUpperCase() + activeTab.slice(1, 5)} icon="LayoutGrid" colorAccent={THEME.accent} colorValue={THEME.primary} desc="Master Data Module" />
                <KpiCard label="Last Modified" value="Now" icon="Clock" colorAccent={THEME.gold} colorValue={THEME.primary} desc={new Date().toLocaleTimeString()} />
                <KpiCard label="Sync Status" value="Active" icon="CheckCircle" colorAccent={THEME.success} colorValue={THEME.success} desc="Database Connected" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* SIDEBAR TABS */}
                <div className="lg:col-span-3 space-y-2 bg-white/90 p-6 rounded-3xl border border-[#eaeaec] shadow-lg h-fit">
                    <p className="text-[12px] font-black text-[#212c46] uppercase tracking-widest mb-4 border-b-2 border-[#b7a159] pb-2">Control Nodes</p>
                    {TABS.map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all relative group ${activeTab === tab.id ? 'bg-[#212c46] text-white shadow-md' : 'bg-white text-[#7a8b95] hover:bg-[#f8f9fa] hover:text-[#a94228] border border-[#eaeaec]'}`}
                        >
                            <div className={`p-2 rounded-xl shrink-0 ${activeTab === tab.id ? 'bg-[#b7a159]/20 text-[#b7a159]' : 'bg-[#f8f9fa] text-[#4d87a8] border border-[#eaeaec]'}`}>
                                <LucideIcon name={tab.icon} size={18} />
                            </div>
                            <div className="flex-1 text-left overflow-hidden">
                                <p className={`text-[13px] font-black uppercase tracking-tight truncate ${activeTab === tab.id ? 'text-[#d7d7d7]' : 'text-[#212c46]'}`}>{tab.label}</p>
                                <p className={`text-[11px] font-bold uppercase tracking-widest mt-0.5 truncate ${activeTab === tab.id ? 'text-[#b7a159]' : 'text-[#7a8b95]'}`}>{data[tab.id].length} Items</p>
                            </div>
                            {activeTab === tab.id && <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-[#b7a159] shadow-[0_0_8px_#b7a159]"></div>}
                        </button>
                    ))}
                </div>

                {/* CONTENT LIST */}
                <div className="lg:col-span-9 bg-white rounded-3xl shadow-lg border border-[#eaeaec] overflow-hidden flex flex-col animate-fadeIn">
                    <div className="px-8 py-5 border-b border-[#eaeaec] bg-[#f8f9fa] flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <h4 className="text-[18px] font-black uppercase text-[#212c46] tracking-tight flex items-center gap-3">
                                <LucideIcon name={activeTabData.icon} size={22} className="text-[#b7a159]"/> {activeTabData.title}
                            </h4>
                            <p className="text-[11px] font-bold text-[#7a8b95] uppercase tracking-widest mt-1">{activeTabData.desc}</p>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a8b95]" />
                                <input type="text" value={search} onChange={(e)=>setSearch(e.target.value)} placeholder={`Search ${activeTabData.label}...`} className="w-full pl-12 pr-4 py-2.5 text-[12px] border border-[#eaeaec] rounded-xl font-bold outline-none focus:border-[#b7a159] bg-white shadow-sm text-[#212c46]" />
                            </div>
                            <button onClick={() => handleOpenModal()} className="bg-[#212c46] text-white px-6 py-2.5 rounded-xl font-black text-[12px] uppercase tracking-widest shadow-md hover:bg-[#414757] hover:text-white transition-all flex items-center gap-2 shrink-0 border border-[#212c46]">
                                <Plus size={16} /> New Record
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left font-sans border-collapse">
                            <thead className="bg-[#212c46] border-b-2 border-[#b7a159] text-white uppercase tracking-widest text-[12px] font-black sticky top-0 z-10">
                                <tr>
                                    {activeTab === 'idFormats' ? (
                                        <>
                                            <th className="py-4 px-6 whitespace-nowrap text-[12px]">Pages</th>
                                            <th className="py-4 px-6 text-center whitespace-nowrap text-[12px]">Prefix</th>
                                            <th className="py-4 px-6 text-center whitespace-nowrap text-[12px]">Format</th>
                                            <th className="py-4 px-6 text-center whitespace-nowrap text-[12px]">Rule</th>
                                            <th className="py-4 px-6 text-center whitespace-nowrap text-[12px]">Actions</th>
                                        </>
                                    ) : activeTab === 'pdfTemplates' ? (
                                        <>
                                            <th className="py-4 px-6 whitespace-nowrap text-[12px]">Template</th>
                                            <th className="py-4 px-6 text-center whitespace-nowrap text-[12px]">Department</th>
                                            <th className="py-4 px-6 text-center whitespace-nowrap text-[12px]">Code</th>
                                            <th className="py-4 px-6 text-center whitespace-nowrap text-[12px]">Revision</th>
                                            <th className="py-4 px-6 text-center whitespace-nowrap text-[12px]">Actions</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="py-4 px-6 whitespace-nowrap text-[12px]">Identification</th>
                                            {activeTab === 'departments' && <th className="py-4 px-6 text-center whitespace-nowrap text-[12px]">Sys Code</th>}
                                            <th className="py-4 px-6 text-center whitespace-nowrap text-[12px]">Status</th>
                                            <th className="py-4 px-6 text-center whitespace-nowrap text-[12px]">Actions</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#eaeaec]">
                                {paginatedData.map((item: any) => (
                                    <tr key={item.id} className="hover:bg-[#f8f9fa] transition-colors group">
                                        {activeTab === 'idFormats' ? (
                                            <>
                                                <td className="py-3 px-6 text-[12px]">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {item.pages?.map((p: any, i: any) => (
                                                            <span key={i} className="px-2.5 py-1 bg-[#212c46]/5 text-[#212c46] rounded-lg text-[11px] font-black border border-[#eaeaec] uppercase">{p}</span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-6 text-center font-black text-[#4d87a8] text-[12px] font-mono">{item.prefix}</td>
                                                <td className="py-3 px-6 text-center text-[12px]">
                                                    <span className="bg-[#f8f9fa] text-[#212c46] px-3 py-1.5 rounded-lg font-mono font-black text-[12px] border border-[#eaeaec]">{item.format}</span>
                                                </td>
                                                <td className="py-3 px-6 text-center text-[12px]">
                                                    <p className="text-[12px] font-black text-[#212c46]">{item.sequenceDigit} Digits</p>
                                                    <p className="text-[11px] font-bold text-[#7a8b95] uppercase mt-0.5">{item.reset} Reset</p>
                                                </td>
                                            </>
                                        ) : activeTab === 'pdfTemplates' ? (
                                            <>
                                                <td className="py-3 px-6 font-black text-[#212c46] text-[12px] uppercase tracking-tight">{item.name}</td>
                                                <td className="py-3 px-6 text-center font-bold text-[#7a8b95] text-[11px] uppercase tracking-widest">{item.dept}</td>
                                                <td className="py-3 px-6 text-center font-mono font-black text-[#212c46] text-[12px]">{item.code}</td>
                                                <td className="py-3 px-6 text-center font-black text-[#d96245] text-[12px]">{item.revision}</td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="py-3 px-6 text-[12px]">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-2 h-2 rounded-full bg-[#b7a159] shrink-0"></div>
                                                        <span className="font-black text-[#212c46] text-[12px] uppercase tracking-tight">{item.name}</span>
                                                    </div>
                                                </td>
                                                {activeTab === 'departments' && <td className="py-3 px-6 text-center font-mono font-black text-[#4d87a8] text-[12px]">{item.code}</td>}
                                                <td className="py-3 px-6 text-center text-[12px]">
                                                   <span className="px-3 py-1 bg-[#657f4d]/10 text-[#657f4d] border border-[#657f4d]/20 rounded-full text-[11px] font-black uppercase tracking-widest">Active</span>
                                                </td>
                                            </>
                                        )}
                                        <td className="py-3 px-6 text-center text-[12px]">
                                            <div className="flex justify-center items-center gap-[0.5px]">
                                                <button onClick={() => handleOpenModal(item)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#eaeaec] text-[#4d87a8] hover:border-[#212c46] hover:text-[#a94228] hover:bg-[#212c46]/5 transition-all shadow-sm bg-white active:scale-90" title="Edit">
                                                    <Pencil size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(item.id)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#eaeaec] text-[#932c2e] hover:border-[#932c2e] hover:bg-[#932c2e]/10 transition-all shadow-sm bg-white active:scale-90" title="Delete">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION */}
                    <div className="px-8 py-3 bg-[#f8f9fa] border-t-[1.5px] border-slate-300 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-6 text-[11px] font-black text-[#7a8b95] uppercase tracking-widest">
                            <div className="flex items-center gap-3">
                                <span>Display Rows:</span>
                                <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="bg-white border border-[#eaeaec] rounded-lg px-3 py-1.5 outline-none font-black text-[#212c46] cursor-pointer shadow-sm">
                                    {[5, 10, 20, 50].map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                            </div>
                            <p className="bg-white px-4 py-2 rounded-xl border border-[#eaeaec] shadow-sm">Total Records: {filteredList.length}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className={`w-10 h-10 border border-[#eaeaec] bg-white rounded-xl flex items-center justify-center transition-all ${currentPage === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#212c46] hover:text-white shadow-md active:scale-90'}`}>
                                <ChevronLeft size={18}/>
                            </button>
                            <div className="bg-[#212c46] text-white px-8 py-2.5 rounded-xl shadow-md font-black text-[11px] min-w-[140px] text-center uppercase tracking-widest">
                                Page {currentPage} / {totalPages || 1}
                            </div>
                            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className={`w-10 h-10 border border-[#eaeaec] bg-white rounded-xl flex items-center justify-center transition-all ${currentPage === totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#212c46] hover:text-white shadow-md active:scale-90'}`}>
                                <ChevronRight size={18}/>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
        </div>
      </div>

      {/* MODAL SYSTEM */}
      <DraggableModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        width="max-w-2xl"
        customHeader={
            <div className="bg-[#212c46] px-6 py-4 flex justify-between items-center shrink-0 border-b-4 border-[#b7a159]">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/10 text-[#b7a159] flex items-center justify-center border border-white/20 shadow-md backdrop-blur-md">
                        <LucideIcon name={activeTabData.icon} size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-[#d7d7d7] uppercase tracking-widest leading-none">{editingItem ? `Modify` : `Create`} {activeTabData.label}</h3>
                        <p className="text-[11px] font-bold text-[#d7d7d7]/70 uppercase tracking-widest mt-1 flex items-center gap-2">
                          <Zap size={10} className="text-[#b7a159]" /> Strategic Config Node Management
                        </p>
                    </div>
                </div>
                <button onClick={()=>setIsModalOpen(false)} className="text-white/70 hover:text-[#932c2e] transition-all bg-white/10 hover:bg-white/20 p-2 rounded-full relative z-10 active:scale-90"><X size={18} /></button>
            </div>
        }
      >
             <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-[#f8f9fa]">
                <form id="configForm" onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-[#eaeaec] shadow-sm space-y-6">
                    {activeTab === 'idFormats' ? (
                      <div className="space-y-6">
                        <div>
                          <label className="text-[11px] font-black text-[#212c46] uppercase tracking-widest block mb-2">Connect to System Pages <span className="text-[#932c2e]">*</span></label>
                          <div className="grid grid-cols-2 gap-3 bg-[#f8f9fa] p-4 rounded-xl border border-[#eaeaec]">
                              {AVAILABLE_PAGES.map(page => (
                                  <label key={page} className="flex items-center gap-3 cursor-pointer group p-1">
                                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${formData.pages.includes(page) ? 'bg-[#212c46] border-[#212c46] text-[#b7a159]' : 'bg-white border-[#eaeaec] group-hover:border-[#212c46]'}`} onClick={() => togglePageSelection(page)}>
                                          {formData.pages.includes(page) && <Check size={12} strokeWidth={4} />}
                                      </div>
                                      <span className="text-[12px] font-bold text-[#414757] uppercase tracking-tight group-hover:text-[#a94228] transition-colors">{page}</span>
                                  </label>
                              ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                            <div>
                                <label className="text-[11px] font-black text-[#212c46] uppercase tracking-widest block mb-2">Prefix Header <span className="text-[#932c2e]">*</span></label>
                                <input type="text" required value={formData.prefix} onChange={(e) => setFormData({...formData, prefix: e.target.value.toUpperCase()})} className="w-full bg-white border border-[#eaeaec] rounded-lg px-4 py-2.5 text-[12px] font-black text-[#212c46] font-mono outline-none focus:border-[#b7a159] transition-all uppercase placeholder:opacity-30 shadow-sm" placeholder="e.g. PO" />
                            </div>
                            <div>
                                <label className="text-[11px] font-black text-[#212c46] uppercase tracking-widest block mb-2">Date Signature <span className="text-[#932c2e]">*</span></label>
                                <select required value={formData.format} onChange={(e) => setFormData({...formData, format: e.target.value})} className="w-full bg-white border border-[#eaeaec] rounded-lg px-4 py-2.5 text-[12px] font-black text-[#212c46] outline-none focus:border-[#b7a159] transition-all font-mono cursor-pointer shadow-sm">
                                    <option value="YYMMDD">YYMMDD (Standard)</option>
                                    <option value="YYYYMMDD">YYYYMMDD (Extended)</option>
                                    <option value="YYMM">YYMM (Monthly)</option>
                                    <option value="YYYYMM">YYYYMM (Full Monthly)</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                            <div>
                                <label className="text-[11px] font-black text-[#212c46] uppercase tracking-widest block mb-2">Sequence Digits <span className="text-[#932c2e]">*</span></label>
                                <input type="number" min="1" max="10" required value={formData.sequenceDigit} onChange={(e) => setFormData({...formData, sequenceDigit: e.target.value})} className="w-full bg-white border border-[#eaeaec] rounded-lg px-4 py-2.5 text-[12px] font-black text-[#212c46] outline-none focus:border-[#b7a159] transition-all shadow-sm" />
                            </div>
                            <div>
                                <label className="text-[11px] font-black text-[#212c46] uppercase tracking-widest block mb-2">Reset Cycle <span className="text-[#932c2e]">*</span></label>
                                <select required value={formData.reset} onChange={(e) => setFormData({...formData, reset: e.target.value})} className="w-full bg-white border border-[#eaeaec] rounded-lg px-4 py-2.5 text-[12px] font-black text-[#212c46] outline-none focus:border-[#b7a159] transition-all cursor-pointer shadow-sm">
                                    <option value="Daily">Daily Reset</option>
                                    <option value="Monthly">Monthly Reset</option>
                                    <option value="Yearly">Yearly Reset</option>
                                    <option value="Never">Never Reset</option>
                                </select>
                            </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div>
                            <label className="text-[11px] font-black text-[#212c46] uppercase tracking-widest block mb-2">{activeTab.slice(0, -1).toUpperCase()} Title/Name <span className="text-[#932c2e]">*</span></label>
                            <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-white border border-[#eaeaec] rounded-lg px-4 py-2.5 text-[12px] font-black text-[#212c46] outline-none focus:border-[#b7a159] transition-all uppercase shadow-sm" placeholder={`Enter ${activeTab.slice(0, -1)} description...`} />
                        </div>
                        {activeTab === 'departments' && (
                            <div>
                                <label className="text-[11px] font-black text-[#212c46] uppercase tracking-widest block mb-2">System Routing Code <span className="text-[#932c2e]">*</span></label>
                                <input type="text" required value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} className="w-full bg-white border border-[#eaeaec] rounded-lg px-4 py-2.5 text-[12px] font-black text-[#212c46] font-mono outline-none focus:border-[#b7a159] transition-all uppercase shadow-sm" placeholder="e.g. FIN" />
                            </div>
                        )}
                        {activeTab === 'pdfTemplates' && (
                          <div className="grid grid-cols-3 gap-4">
                             <div className="col-span-2">
                                <label className="text-[11px] font-black text-[#212c46] uppercase tracking-widest block mb-2">Form Code (ISO)</label>
                                <input type="text" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} className="w-full bg-white border border-[#eaeaec] rounded-lg px-4 py-2.5 text-[12px] font-black text-[#212c46] outline-none focus:border-[#b7a159] shadow-sm" placeholder="FM-XX-XX" />
                             </div>
                             <div>
                                <label className="text-[11px] font-black text-[#212c46] uppercase tracking-widest block mb-2">Revision</label>
                                <input type="text" value={formData.revision} onChange={(e) => setFormData({...formData, revision: e.target.value})} className="w-full bg-white border border-[#eaeaec] rounded-lg px-4 py-2.5 text-[12px] font-black text-[#212c46] outline-none focus:border-[#b7a159] shadow-sm" placeholder="REV 00" />
                             </div>
                          </div>
                        )}
                      </div>
                    )}
                </form>
             </div>

             <div className="p-4 bg-[#f8f9fa] border-t border-[#eaeaec] flex justify-end items-center gap-3 shrink-0">
                <button type="button" onClick={()=>setIsModalOpen(false)} className="px-6 py-2 bg-white border border-[#eaeaec] text-[#414757] rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-[#d7d7d7]/30 transition-all">Cancel</button>
                <button type="submit" form="configForm" className="bg-[#212c46] text-white px-6 py-2 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-md hover:bg-[#414757] hover:text-white transition-all flex items-center gap-2">
                    <Save size={14}/> Save Config
                </button>
             </div>
      </DraggableModal>
    </div>
  );
}
