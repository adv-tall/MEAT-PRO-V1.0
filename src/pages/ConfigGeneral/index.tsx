import React, { useState, useMemo } from 'react';
import { Layers, Plus, Search, Pencil, Trash2, CheckCircle, Database, LayoutGrid, Clock, Upload } from 'lucide-react';
import * as Icons from 'lucide-react';
import { DraggableModal } from '../../components/shared/DraggableModal';
import KpiCard from '../../components/shared/KpiCard';
import { CsvUpload } from '../../components/shared/CsvUpload';
import { CsvExport } from '../../components/shared/CsvExport';

const THEME = {
  primary: '#212c46',
  primaryLight: '#4d87a8',
  accent: '#a94228',
  gold: '#b58c4f',
  success: '#657f4d',
};

const INITIAL_DATA = [
    { id: 1, name: 'Sausage' },
    { id: 2, name: 'Meatball' },
    { id: 3, name: 'Bologna' },
    { id: 4, name: 'Ham' },
    { id: 5, name: 'Sliced' },
    { id: 6, name: 'Loaf' },
    { id: 7, name: 'NPD' },
];

export default function ConfigGeneral() {
    const [subCats, setSubCats] = useState(INITIAL_DATA);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [csvModalOpen, setCsvModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [formData, setFormData] = useState({ name: '' });

    const handleCsvUpload = (data: any[]) => {
        const newData = data.map((row, index) => ({
            id: Date.now() + index,
            name: row.Name || row.name
        })).filter(r => r.name);
        setSubCats(prev => [...prev, ...newData]);
        setCsvModalOpen(false);
    };

    const handleOpenModal = (item: any = null) => {
        if (item) {
            setEditingItem(item);
            setFormData({ name: item.name });
        } else {
            setEditingItem(null);
            setFormData({ name: '' });
        }
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!formData.name) return;
        if (editingItem) {
            setSubCats(prev => prev.map(c => c.id === editingItem.id ? { ...c, name: formData.name } : c));
        } else {
            setSubCats(prev => [...prev, { id: Date.now(), name: formData.name }]);
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id: number) => {
        if(confirm('Are you sure you want to delete this sub-category?')) {
            setSubCats(prev => prev.filter(c => c.id !== id));
        }
    };

    const filteredList = useMemo(() => {
        return subCats.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    }, [subCats, search]);

    return (
        <div className="flex flex-1 w-full flex-col animate-fadeIn bg-transparent space-y-4">
            {/* HEADER */}
            <div className="h-14 px-4 sm:px-8 flex flex-row items-center justify-between gap-4 z-20 shrink-0">
                <div className="flex items-center gap-5">
                    <div className="relative flex items-center justify-center group cursor-default shrink-0">
                        <div className="absolute inset-0 bg-[#3f809e] blur-[15px] opacity-20 rounded-full group-hover:opacity-60 transition-all duration-700"></div>
                        <div className="relative z-10 p-1.5 border border-[#3f809e]/40 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm">
                            <Layers size={28} strokeWidth={2.5} className="text-[#3f809e]" />
                        </div>
                    </div>
                    <div>
                        <h1 className="font-black text-[#212c46] uppercase tracking-tighter leading-none font-exception-header" style={{ fontSize: '24px' }}>
                            PROD CONFIG <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3f809e] to-[#b58c4f]">/ SUB-CAT</span>
                        </h1>
                        <p className="text-[11px] font-bold text-[#4d5a44] uppercase tracking-[0.2em] mt-0.5 opacity-80 leading-none">
                            MANAGE PRODUCT CATEGORY ALIASES
                        </p>
                    </div>
                </div>
            </div>

            {/* MAIN AREA */}
            <DraggableModal isOpen={csvModalOpen} onClose={() => setCsvModalOpen(false)} title="Bulk Upload Config" width="max-w-2xl">
                <CsvUpload 
                    onUpload={handleCsvUpload}
                    requiredHeaders={['Name']}
                    templateName="config_general_template.xlsx"
                />
            </DraggableModal>
            <div className="mx-auto px-4 sm:px-8 w-full mt-[2px] flex-1 flex flex-col">
                <div className="w-full flex-1 flex flex-col">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-5 shrink-0">
                        <KpiCard label="Total Records" value={filteredList.length} icon="Database" colorAccent={THEME.primaryLight} colorValue={THEME.primary} desc={`Active Sub-Cats`} />
                        <KpiCard label="Module" value="Prod Config" icon="LayoutGrid" colorAccent={THEME.accent} colorValue={THEME.primary} desc="Master Data Module" />
                        <KpiCard label="Last Modified" value="Now" icon="Clock" colorAccent={THEME.gold} colorValue={THEME.primary} desc={new Date().toLocaleTimeString()} />
                        <KpiCard label="Sync Status" value="Active" icon="CheckCircle" colorAccent={THEME.success} colorValue={THEME.success} desc="Database Connected" />
                    </div>

                    <div className="bg-white rounded-xl shadow-lg border border-[#eaeaec] overflow-hidden flex flex-col flex-1 animate-fadeIn">
                        <div className="px-4 py-4 border-b border-[#eaeaec] bg-white flex flex-col md:flex-row justify-between items-center gap-4">
                            <div>
                                <h4 className="text-[18px] font-black uppercase text-[#212c46] tracking-tight flex items-center gap-3">
                                    <Layers size={22} className="text-[#b7a159]"/> SYSTEM CONFIG: CATEGORY & SUB-CAT
                                </h4>
                                <p className="text-[11px] font-bold text-[#7a8b95] uppercase tracking-widest mt-1">Manage configuration for sub-categories.</p>
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <div className="relative flex-1 md:w-64">
                                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a8b95]" />
                                    <input type="text" value={search} onChange={(e)=>setSearch(e.target.value)} placeholder={`Search Sub-Cats...`} className="w-full pl-12 pr-4 py-2.5 text-[12px] border border-[#eaeaec] rounded-xl font-bold outline-none focus:border-[#b7a159] bg-white shadow-sm text-[#212c46]" />
                                </div>
                                <button onClick={() => setCsvModalOpen(true)} className="bg-white border border-[#eaeaec] hover:border-[#4d87a8] hover:text-[#4d87a8] text-[#7a8b95] px-4 py-2.5 rounded-xl font-bold text-[12px] uppercase tracking-widest flex items-center gap-2 shadow-sm transition-colors md:flex">
                                    <Upload size={14} /> Import
                                </button>
                                <CsvExport data={subCats} filename="prod_config.csv" label="Export" className="bg-white border border-[#eaeaec] hover:border-[#4d87a8] hover:text-[#4d87a8] text-[#7a8b95] px-4 py-2.5 rounded-xl font-bold text-[12px] uppercase tracking-widest flex items-center gap-2 shadow-sm transition-colors md:flex" />
                                <button onClick={() => handleOpenModal()} className="bg-[#212c46] text-white px-6 py-2.5 rounded-xl font-black text-[12px] uppercase tracking-widest shadow-md hover:bg-[#414757] hover:text-white transition-all flex items-center gap-2 shrink-0 border border-[#212c46]">
                                    <Plus size={16} /> New Record
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto flex-1 custom-scrollbar">
                            <table className="w-full text-left border-collapse table-font relative">
                                <thead className="bg-[#b7a159] text-white uppercase tracking-widest font-black sticky top-0 z-10 text-[11px]">
                                    <tr>
                                        <th className="px-4 py-3 whitespace-nowrap">Category Name (Sub-Cat)</th>
                                        <th className="px-4 py-3 text-center whitespace-nowrap w-32">Status</th>
                                        <th className="px-4 py-3 text-center whitespace-nowrap w-24">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#eaeaec]">
                                    {filteredList.map((item: any) => (
                                        <tr key={item.id} className="hover:bg-[#f8f9fa] transition-colors group">
                                            <td className="px-4 py-3 text-[12px]">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-[#b7a159] shrink-0"></div>
                                                    <span className="font-black text-[#212c46] text-[12px] uppercase tracking-tight">{item.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center text-[12px]">
                                                <span className="px-3 py-1 bg-[#657f4d]/10 text-[#657f4d] border border-[#657f4d]/20 rounded-full text-[11px] font-black uppercase tracking-widest">Active</span>
                                            </td>
                                            <td className="px-4 py-3 text-center text-[12px]">
                                                <div className="flex justify-center items-center gap-[1px]">
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
                                    {filteredList.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-4 py-8 text-center text-[#7a8b95] text-[12px] font-bold uppercase tracking-widest">
                                                No records found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <DraggableModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? `Edit Sub-Cat` : `New Sub-Cat`} icon={<Layers size={20} color="white" />}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Category Name</label>
                        <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[12px] font-bold text-[#212c46] focus:bg-white focus:border-[#b7a159] focus:shadow-[0_0_0_2px_rgba(183,161,89,0.1)] outline-none transition-all" placeholder="Enter sub-category name..." autoFocus />
                    </div>
                    <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
                        <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-widest text-[#7a8b95] hover:bg-slate-100 transition-colors">Cancel</button>
                        <button onClick={handleSave} className="bg-[#212c46] text-white px-6 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-[#b7a159] transition-colors shadow-md">Save Changes</button>
                    </div>
                </div>
            </DraggableModal>
        </div>
    );
}
