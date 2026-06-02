import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import * as Icons from 'lucide-react';
import { UserGuidePanel } from '@/src/components/shared/UserGuidePanel';
import UserGuideButton from '@/src/components/shared/UserGuideButton';
import { DraggableModal } from '../../components/shared/DraggableModal';

import { SYSTEM_MODULES } from '../../config/modules';
import { useCollection } from '../../services/useFirestore';

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

// --- SYSTEM MODULES ---


const PERMISSION_LEVELS = [
  { level: 0, label: 'No Access', icon: 'ban', color: THEME.dustyBlue, bg: '#eaeaec' },
  { level: 1, label: 'Viewer', icon: 'eye', color: THEME.skyBlue, bg: '#eaeaec' },
  { level: 2, label: 'Editor', icon: 'edit', color: THEME.accent, bg: '#d9624540' },
  { level: 3, label: 'Verifier', icon: 'check-square', color: THEME.indigo, bg: '#7a8b95' },
  { level: 4, label: 'Approver', icon: 'award', color: THEME.success, bg: '#657f4d40' },
];

const PermissionBadges = ({ user, moduleId }: any) => {
    let perms = [];
    let isFullAccess = user.isDev || (user.permissions && user.permissions['*']);
    
    if (isFullAccess) {
        perms = [1, 2, 3, 4];
    } else if (user.permissions && user.permissions[moduleId]) {
        perms = user.permissions[moduleId];
    }

    if (!perms || perms.length === 0) {
        return <span className="text-[#7a8b95] font-black text-[14px] opacity-50">-</span>;
    }

    return (
        <div className="flex items-center justify-center gap-1.5">
            {perms.sort().map(level => {
                const permInfo = PERMISSION_LEVELS.find(p => p.level === level);
                if (!permInfo || level === 0) return null;
                
                const IconComp = isFullAccess ? Icons.Check : (Icons[kebabToPascal(permInfo.icon) as keyof typeof Icons] || Icons.Circle);

                return (
                    <div key={level} className="w-6 h-6 rounded-md flex items-center justify-center shadow-sm border" style={{ backgroundColor: permInfo.color + '15', borderColor: permInfo.color + '30', color: permInfo.color }}>
                        <IconComp size={12} strokeWidth={isFullAccess ? 4 : 2.5} />
                    </div>
                );
            })}
        </div>
    );
};

// --- HELPER COMPONENTS ---
const kebabToPascal = (str: string) => str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
const LucideIcon = ({ name, size = 16, className = "", color, style, strokeWidth = 2.5 }: any) => {
    if (!name) return null;
    
    // Check if name is already a React component (like from lucide-react)
    if (typeof name !== 'string') {
        const IconComponent = name;
        return <IconComponent size={size} className={className} style={{...style, color: color}} strokeWidth={strokeWidth} />;
    }

    const pascalName = kebabToPascal(name);
    const IconComponent = Icons[pascalName as keyof typeof Icons] || Icons.CircleHelp;
    if (!IconComponent) return null;
    return <IconComponent size={size} className={className} style={{...style, color: color}} strokeWidth={strokeWidth} />;
};

import KpiCard from '../../components/shared/KpiCard';


function EditUserModal({ isOpen, onClose, user, onSave }: any) {
    const [modalStep, setModalStep] = useState(0);
    const [tempPerms, setTempPerms] = useState<any>({});
    const [tempUser, setTempUser] = useState<any>({});

    useEffect(() => {
        if (isOpen && user) {
            setModalStep(0);
            setTempPerms(JSON.parse(JSON.stringify(user.permissions || {})));
            setTempUser(JSON.parse(JSON.stringify(user)));
        }
    }, [isOpen, user]);

    if (!isOpen || !user || !tempUser) return null;

    const handleTogglePerm = (moduleId: string, level: number) => {
        if (tempUser.isDev) return;
        setTempPerms((prev: any) => {
            const newPerms = { ...prev };
            if (!newPerms[moduleId]) newPerms[moduleId] = [];
            if (level === 0) {
                newPerms[moduleId] = [];
                return newPerms;
            }
            if (newPerms[moduleId].includes(level)) {
                newPerms[moduleId] = newPerms[moduleId].filter((l: number) => l !== level);
            } else {
                newPerms[moduleId] = [...newPerms[moduleId], level].sort();
            }
            return newPerms;
        });
    };

    return (
        <DraggableModal
            isOpen={isOpen}
            onClose={onClose}
            width="max-w-[950px]"
            customHeader={
                <div className="bg-[#212c46] px-4 py-3 flex justify-between items-center shrink-0 border-b-2 border-[#b7a159]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/20 shadow-sm overflow-hidden">
                            <img src={tempUser.avatar} className="w-full h-full object-cover" alt={tempUser.name || 'User'} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-[#d7d7d7] uppercase tracking-widest leading-none">{tempUser.name || 'NEW USER'}</h3>
                            <p className="text-[10px] font-bold text-[#d7d7d7]/70 uppercase tracking-widest mt-1">{tempUser.position || 'POSITION'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/70 hover:text-[#932c2e] transition-all bg-white/10 hover:bg-white/20 p-1.5 rounded-full"><Icons.X size={16} /></button>
                </div>
            }
        >
                {/* Modal Body */}
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#f8f9fa]">
                    {/* Sidebar Steps */}
                    <div className="w-full md:w-56 bg-white border-b md:border-b-0 md:border-r border-[#eaeaec] flex flex-row md:flex-col shrink-0">
                        <div className="hidden md:block px-4 py-4 text-[10px] font-black text-[#7a8b95] uppercase tracking-widest border-b border-[#eaeaec] bg-[#f8f9fa]">Configuration Nodes</div>
                        {[0, 1, 2].map(step => (
                            <button key={step} onClick={()=>setModalStep(step)} className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 px-4 py-3 text-left transition-all md:border-l-4 ${modalStep===step ? 'border-b-4 md:border-b-0 border-[#b7a159] bg-[#f8f9fa] text-[#212c46]' : 'border-transparent text-[#7a8b95] hover:bg-[#f8f9fa]/50'}`}>
                                <LucideIcon name={step===0 ? 'User' : 'ShieldCheck'} size={16} color={modalStep===step ? THEME.brightGold : undefined} />
                                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest">STEP {step+1}: {step===0 ? 'Profile' : step===1 ? 'Visibility' : 'Rights'}</span>
                            </button>
                        ))}
                    </div>
                    
                    {/* Content Panel */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 bg-white">
                        {modalStep === 0 ? (
                            <div className="space-y-4 max-w-xl">
                                <div>
                                    <label className="block text-[11px] font-black text-[#7a8b95] uppercase tracking-widest mb-1.5">Full Name</label>
                                    <input type="text" value={tempUser.name || ''} onChange={e => setTempUser({...tempUser, name: e.target.value})} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-lg px-4 py-2 text-[12px] font-bold text-[#212c46] outline-none focus:border-[#b7a159]" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-[#7a8b95] uppercase tracking-widest mb-1.5">Position / Role</label>
                                    <input type="text" value={tempUser.position || ''} onChange={e => setTempUser({...tempUser, position: e.target.value})} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-lg px-4 py-2 text-[12px] font-bold text-[#212c46] outline-none focus:border-[#b7a159]" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-[#7a8b95] uppercase tracking-widest mb-1.5">Email Address</label>
                                    <input type="email" value={tempUser.email || ''} onChange={e => setTempUser({...tempUser, email: e.target.value})} className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded-lg px-4 py-2 text-[12px] font-bold text-[#212c46] outline-none focus:border-[#b7a159]" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-[#7a8b95] uppercase tracking-widest mb-1.5">Profile Picture</label>
                                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full bg-white border border-[#eaeaec] rounded-lg p-3">
                                        <div className="w-16 h-16 rounded-xl bg-[#f8f9fa] border border-[#eaeaec] flex items-center justify-center shadow-sm overflow-hidden shrink-0">
                                            {tempUser.avatar ? (
                                                <img src={tempUser.avatar} className="w-full h-full object-cover" alt="Avatar" />
                                            ) : (
                                                <Icons.User size={24} className="text-[#7a8b95]" />
                                            )}
                                        </div>
                                        <div className="flex-1 w-full space-y-2">
                                            <div className="flex gap-2">
                                                <button type="button" onClick={() => {
                                                    const input = document.createElement('input');
                                                    input.type = 'file';
                                                    input.accept = 'image/*';
                                                    input.onchange = (e: any) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onload = (ev) => {
                                                                setTempUser({...tempUser, avatar: ev.target?.result as string});
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }
                                                    };
                                                    input.click();
                                                }} className="bg-[#f8f9fa] border border-[#eaeaec] text-[#212c46] hover:text-[#a94228] hover:border-[#a94228] py-1.5 px-3 rounded-lg text-[10px] uppercase font-black tracking-widest shadow-sm flex items-center gap-1.5 flex-1 justify-center transition-colors"><Icons.Upload size={12}/> Computer</button>

                                                <button type="button" onClick={() => {
                                                    const Swal = typeof window !== 'undefined' ? (window as any).Swal || null : null;
                                                    if (Swal) {
                                                        Swal.fire({
                                                            title: 'Google Drive / URL',
                                                            input: 'url',
                                                            inputPlaceholder: 'Paste Image URL here...',
                                                            inputAttributes: {
                                                                autocapitalize: 'off'
                                                            },
                                                            showCancelButton: true,
                                                            confirmButtonText: 'Preview',
                                                            confirmButtonColor: '#212c46',
                                                        }).then((result: any) => {
                                                            if (result.isConfirmed && result.value) {
                                                                setTempUser({...tempUser, avatar: result.value});
                                                            }
                                                        });
                                                    } else {
                                                        const url = prompt("Enter Google Drive Image URL or any URL");
                                                        if (url) setTempUser({...tempUser, avatar: url});
                                                    }
                                                }} className="bg-[#f8f9fa] border border-[#eaeaec] text-[#212c46] hover:text-[#a94228] hover:border-[#a94228] py-1.5 px-3 rounded-lg text-[10px] uppercase font-black tracking-widest shadow-sm flex items-center gap-1.5 flex-1 justify-center transition-colors"><Icons.Link size={12}/> URL / Drive</button>
                                            </div>
                                            <input type="text" value={tempUser.avatar || ''} onChange={e => setTempUser({...tempUser, avatar: e.target.value})} placeholder="Or paste image URL here..." className="w-full bg-[#f8f9fa] border border-[#eaeaec] rounded border-dashed px-2 py-1.5 text-[10px] font-bold text-[#212c46] outline-none focus:border-[#b7a159] transition-colors" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 pt-2">
                                    <input type="checkbox" checked={tempUser.isDev || false} onChange={e => setTempUser({...tempUser, isDev: e.target.checked})} className="w-4 h-4 accent-[#212c46] cursor-pointer" id="isDevCheck" />
                                    <label htmlFor="isDevCheck" className="text-[11px] font-black text-[#212c46] uppercase tracking-widest cursor-pointer">Super Admin (Developer) Privileges</label>
                                </div>
                            </div>
                        ) : (
                        <div className="space-y-3">
                            {SYSTEM_MODULES.map(mod => {
                                const userHasMod = tempPerms[mod.id] && tempPerms[mod.id].length > 0;
                                const isDev = tempUser.isDev;
                                return (
                                    <div key={mod.id} className={`px-4 py-3 rounded-xl border transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-3 ${userHasMod || isDev ? 'bg-[#f8f9fa] border-[#b7a159]/50 shadow-sm' : 'bg-white border-[#eaeaec]'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${userHasMod || isDev ? 'bg-[#212c46] text-white border-[#212c46]' : 'bg-[#f8f9fa] text-[#7a8b95] border-[#eaeaec]'}`}>
                                                <LucideIcon name={mod.icon} size={16}/>
                                            </div>
                                            <span className="font-black text-[#212c46] uppercase text-[11px] tracking-widest leading-tight">{mod.label}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 p-1.5 bg-white rounded-lg border border-[#eaeaec] w-full md:w-auto">
                                            {PERMISSION_LEVELS.filter(p => modalStep===1 ? p.level <= 1 : p.level===0 || p.level>=2).map(p => {
                                                const isSelected = isDev || (p.level === 0 && !userHasMod) || (tempPerms[mod.id] && tempPerms[mod.id].includes(p.level));
                                                return (
                                                    <button key={p.level} onClick={()=>handleTogglePerm(mod.id, p.level)} disabled={isDev} className={`flex-1 md:flex-none h-8 px-2.5 rounded-md border flex items-center justify-center gap-1.5 transition-all ${isSelected ? 'bg-[#212c46] text-white border-[#212c46] shadow-sm' : 'bg-white border-transparent text-[#7a8b95] hover:bg-[#f8f9fa]'}`}>
                                                        <LucideIcon name={p.icon} size={12} color={isSelected ? THEME.brightGold : THEME.dustyBlue} />
                                                        {isSelected && <span className="text-[10px] font-black uppercase tracking-widest">{p.label}</span>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        )}
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-3 bg-[#f8f9fa] border-t border-[#eaeaec] flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-5 py-2 bg-white border border-[#eaeaec] text-[#414757] rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-[#d7d7d7]/30 transition-all">Cancel</button>
                    <button onClick={()=>{onSave(tempUser, tempPerms); onClose();}} className="bg-[#212c46] text-white px-5 py-2 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-md hover:bg-[#414757] hover:text-white transition-all flex items-center gap-2"><Icons.Save size={14}/> Save User</button>
                </div>
        </DraggableModal>
    );
}

// --- Main Page Component ---
export default function UserPermission() {
  const [activeTab, setActiveTab] = useState('registry'); 
  const [viewMode, setViewMode] = useState('list'); 
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [editModal, setEditModal] = useState<any>({ isOpen: false, user: null });
  const [expandedModules, setExpandedModules] = useState<any>({ sr_so: true, vendors: true, analytics: true, inventory: true });
  const [confidentialityMap, setConfidentialityMap] = useState<any>({'settings': true, 'risk_management': true});

  const { data: firebaseUsers, add: addUser, update: updateUser } = useCollection<any>('users');
  const [localUsers, setLocalUsers] = useState([
    { id: '1', name: 'SOMCHAI WORKER', position: 'SALES MANAGER', email: 'somchai.w@salepro.com', avatar: 'https://i.pravatar.cc/150?img=11', isDev: false, permissions: { dashboard: [1, 2, 3, 4], analytics: [1, 2] } },
    { id: '2', name: 'SUDA QUALITY', position: 'QC SUPERVISOR', email: 'suda.q@salepro.com', avatar: 'https://i.pravatar.cc/150?img=5', isDev: false, permissions: { dashboard: [1] } },
    { id: '3', name: 'PHICHAMON ADMIN', position: 'Lead Developer', email: 'tallintelligence.dcc@gmail.com', avatar: 'https://drive.google.com/thumbnail?id=1Z_fRbN9S4aA7OkHb3mlim_t60wIT4huY&sz=w400', isDev: true, permissions: { '*': [1, 2, 3, 4] } },
    { id: '4', name: 'SARAH ACCOUNTING', position: 'FINANCE', email: 'sarah@salepro.com', avatar: 'https://i.pravatar.cc/150?img=9', isDev: false, permissions: { dashboard: [1] } }
  ]);

  const users = useMemo(() => {
    // Merge firebase users and local mock users so it looks somewhat populated
    const merged = [...firebaseUsers];
    localUsers.forEach(lu => {
       if (!merged.find(mu => mu.id === lu.id)) merged.push(lu);
    });
    return merged;
  }, [firebaseUsers, localUsers]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.position.toLowerCase().includes(search.toLowerCase()));
  }, [users, search]);

  const currentData = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;

  const toggleConfidentiality = (id: string) => setConfidentialityMap((prev: any) => ({ ...prev, [id]: !prev[id] }));
  const toggleExpand = (id: string) => setExpandedModules((prev: any) => ({ ...prev, [id]: !prev[id] }));

  const saveUserPermissions = async (savedUser: any, newPermissions: any) => {
    try {
        const userData = { ...savedUser, permissions: newPermissions };
        // Clean out id if creating
        if (typeof savedUser.id === 'string' && savedUser.id.length > 10) {
            await updateUser(savedUser.id, userData);
        } else {
            // Treat as new explicitly for short ID or numbers
            const {id, ...rest} = userData;
            await addUser(rest);
        }
    } catch(e) {
        setLocalUsers(prevUsers => {
          const exists = prevUsers.find(u => u.id === savedUser.id);
          if (exists) {
            return prevUsers.map(u => u.id === savedUser.id ? { ...u, ...savedUser, permissions: newPermissions } : u);
          } else {
            return [{ ...savedUser, permissions: newPermissions }, ...prevUsers];
          }
        });
    }
  };

  return (
    <div className="flex flex-1 w-full flex-col animate-fadeIn bg-transparent space-y-4">
      
      {/* USER GUIDE FLOATING TAB */}
      <UserGuideButton onClick={() => setIsGuideOpen(true)} />

      <UserGuidePanel isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} title="PERMISSION GUIDE" subtitle="ACCESS CONTROL MANAGEMENT">
        <div className="space-y-8">
            <div>
                <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                    <Icons.Shield size={16} className="text-[#b7a159]" /> 1. CONFIDENTIAL RESTRICTED
                </h3>
                <p className="mb-4">ระบบอนุญาตให้คุณกำหนดความลับของข้อมูลได้ทั้งระดับ <span className="font-bold">โมดูลหลัก</span> และ <span className="font-bold">เมนูย่อย</span> :</p>
                <div className="space-y-3">
                    <div className="p-4 bg-[#f8f9fa] border border-[#eaeaec] rounded-xl flex items-start gap-3">
                        <Icons.Eye size={16} className="text-[#3f809e] mt-0.5 shrink-0" />
                        <div>
                            <span className="font-bold text-[#3f809e]">Public Node: </span>
                            ทุกคนในระบบได้รับสิทธิ์ในการเข้าถึงและมองเห็นเบื้องต้น (Viewer) ยกเว้นโดนจำกัดสิทธิ์รายบุคคล
                        </div>
                    </div>
                    <div className="p-4 bg-[#fdf2f2] border border-[#f5c6cb] rounded-xl flex items-start gap-3">
                        <Icons.Lock size={16} className="text-[#932c2e] mt-0.5 shrink-0" />
                        <div className="text-[#932c2e]">
                            <span className="font-bold">Restricted Area: </span>
                            ปิดกั้นการมองเห็นโดยสมบูรณ์ เมนูจะถูกซ่อน ต้องกำหนดสิทธิ์รายบุคคลแบบเจาะจงเท่านั้น
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-px bg-[#eaeaec] w-full" />

            <div>
                <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                    <Icons.Key size={16} className="text-[#d55a6d]" /> 2. PERMISSION LEVELS
                </h3>
                <p className="mb-4">สิทธิ์การใช้งานแต่ละโมดูล แบ่งออกเป็น 4 ระดับ (สามารถรับสิทธิ์ทับซ้อนกันได้) :</p>
                <ul className="space-y-3 list-disc pl-5">
                    <li><span className="font-bold text-[#3f809e]">Viewer (สิทธิ์การดู):</span> สามารถเข้าถึงหน้านั้นๆ ได้ แต่อ่านข้อมูลได้อย่างเดียว</li>
                    <li><span className="font-bold text-[#d55a6d]">Editor (สิทธิ์แก้ไข):</span> สามารถสร้าง หรือแก้ไขข้อมูลและฟอร์มต่างๆ ภายในโมดูลได้</li>
                    <li><span className="font-bold text-[#45516b]">Verifier (สิทธิ์ตรวจสอบ):</span> มีอำนาจตรวจสอบความถูกต้อง (Verify) ก่อนส่งให้อนุมัติ</li>
                    <li><span className="font-bold text-[#688a58]">Approver (สิทธิ์อนุมัติ):</span> อำนาจขั้นสูงสุดในการอนุมัติเอกสารและคำสั่ง (Approve)</li>
                </ul>
            </div>
            
            <div className="h-px bg-[#eaeaec] w-full" />

            <div>
                <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                    <Icons.RefreshCw size={16} className="text-[#3f809e]" /> 3. SYSTEM SYNC
                </h3>
                <p className="mb-4">การตั้งค่าที่ถูกอัปเดตในหน้านี้จะทำการ <span className="font-bold">ซิงค์กับแถบเมนู (Sidebar) หลัก</span> ของระบบ MEAT PRO โดยอัตโนมัติ การจำกัดสิทธิ์ส่งผลแบบ Real-time</p>
            </div>
        </div>
      </UserGuidePanel>
      <EditUserModal isOpen={editModal.isOpen} onClose={() => setEditModal({isOpen: false, user: null})} user={editModal.user} onSave={saveUserPermissions} />

      {/* HEADER SECTION */}
      <div className="h-14 px-4 sm:px-8 flex flex-row items-center justify-between gap-4 z-20 shrink-0">
          <div className="flex items-center gap-5">
              <div className="relative flex items-center justify-center group cursor-default shrink-0">
                  <div className="absolute inset-0 bg-[#3f809e] blur-[15px] opacity-20 rounded-full group-hover:opacity-60 transition-all duration-700"></div>
                  <div className="relative z-10 p-1.5 border border-[#3f809e]/40 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm">
                      <Icons.ShieldCheck size={28} strokeWidth={2.5} className="text-[#3f809e]" />
                  </div>
              </div>
              <div>
                  <h3 className="font-black text-[#212c46] uppercase tracking-tighter leading-none font-exception-header" style={{ fontSize: '24px' }}>
                      USER <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3f809e] to-[#b58c4f]">PERMISSIONS</span> NODE
                  </h3>
                  <p className="text-[11px] font-bold text-[#4d5a44] uppercase tracking-[0.2em] mt-0.5 opacity-80 leading-none">
                      SECURITY CONTROL & ACCESS AUTHORIZATION HUB
                  </p>
              </div>
          </div>

          <div className="flex items-center gap-4">
              <div className="bg-white/50 p-1.5 rounded-xl border border-white/60 shadow-inner flex flex-wrap items-center gap-1">
                  <button onClick={() => setActiveTab('registry')} className={`px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'registry' ? 'bg-[#212c46] text-white shadow-md' : 'text-[#7a8b95] hover:text-[#a94228]'}`}>
                    <Icons.Database size={16} /> Global Registry
                  </button>
                  <button onClick={() => setActiveTab('staff')} className={`px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'staff' ? 'bg-[#212c46] text-white shadow-md' : 'text-[#7a8b95] hover:text-[#a94228]'}`}>
                    <Icons.Users size={16} /> Staff Access
                  </button>
              </div>
          </div>
      </div>

      <div className="mx-auto px-4 sm:px-8 w-full mt-[2px]">
        <div className="w-full">
            
            {/* KPI STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-3 shrink-0">
                <KpiCard label="Active Personnel" value={users.length} icon="users" colorAccent={THEME.primaryLight} colorValue={THEME.primary} desc="Managed Users" />
                <KpiCard label="Functional Modules" value={SYSTEM_MODULES.length} icon="layout-grid" colorAccent={THEME.accent} colorValue={THEME.primary} desc="Tracked Zones" />
                <KpiCard label="Restricted Keys" value={Object.values(confidentialityMap).filter(v=>v).length} icon="lock" colorAccent={THEME.danger} colorValue={THEME.primary} desc="Security Lock" />
                <KpiCard label="Security Status" value="AUDITED" icon="shield-check" colorAccent={THEME.success} colorValue={THEME.success} desc="System Verified" />
            </div>

            {activeTab === 'registry' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* ACCESS POLICIES CARD */}
                    <div className="lg:col-span-4 bg-white/90 p-6 rounded-xl shadow-lg border border-[#eaeaec] animate-fadeIn h-fit">
                        <h3 className="text-[14px] font-black text-[#212c46] uppercase tracking-widest flex items-center gap-3 border-b-2 border-[#b7a159] pb-4 mb-6"><Icons.ShieldAlert size={20} className="text-[#b7a159]" /> ACCESS POLICIES</h3>
                        <div className="space-y-5">
                            <div className="p-5 bg-[#f8f9fa] border border-[#eaeaec] rounded-xl shadow-sm hover:border-[#4d87a8] transition-colors">
                                <div className="flex items-center gap-2 text-[#4d87a8] font-black text-[12px] uppercase tracking-widest mb-2"><Icons.Eye size={18}/> Public Node</div>
                                <p className="text-[12px] text-[#414757] font-bold leading-relaxed">โมดูลมาตรฐาน: พนักงานจะได้รับสิทธิ์อ่าน (Viewer) เบื้องต้นโดยอัตโนมัติ</p>
                            </div>
                            <div className="p-5 bg-[#932c2e]/10 border border-[#932c2e]/30 rounded-xl shadow-sm hover:border-[#932c2e] transition-colors">
                                <div className="flex items-center gap-2 text-[#932c2e] font-black text-[12px] uppercase tracking-widest mb-2"><Icons.Lock size={18}/> Restricted Area</div>
                                <p className="text-[12px] text-[#414757] font-bold leading-relaxed">พื้นที่จำกัด: เมนูจะถูกซ่อนจากผู้ใช้ทั่วไป ต้องได้รับสิทธิ์แบบเจาะจงรายบุคคลเท่านั้น</p>
                            </div>
                        </div>
                    </div>

                    {/* GLOBAL MODULE REGISTRY (SYNCED) */}
                    <div className="lg:col-span-8 bg-white rounded-xl shadow-lg border border-[#eaeaec] overflow-hidden">
                        <div className="p-6 bg-[#f8f9fa] border-b border-[#eaeaec]">
                            <h4 className="text-[14px] font-black uppercase text-[#212c46] tracking-widest flex items-center gap-3"><Icons.ListTree size={20} className="text-[#b7a159]"/> GLOBAL MODULE REGISTRY</h4>
                        </div>
                        <div className="p-6 space-y-3 custom-scrollbar">
                            {SYSTEM_MODULES.map(mod => (
                                <div key={mod.id} className="space-y-2">
                                    <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all ${confidentialityMap[mod.id] ? 'bg-[#932c2e]/5 border-[#932c2e]/30 shadow-sm' : 'bg-white border-[#eaeaec] hover:border-[#4d87a8]'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm ${confidentialityMap[mod.id] ? 'bg-[#932c2e]/20 text-[#932c2e] border-[#932c2e]/30' : 'bg-[#f8f9fa] text-[#212c46] border-[#eaeaec]'}`}>
                                                <LucideIcon name={mod.icon} size={22}/>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black text-[#212c46] text-[13px] uppercase tracking-widest">{mod.label}</span>
                                                    {mod.subItems && (
                                                        <button onClick={() => toggleExpand(mod.id)} className="p-1 hover:bg-[#d7d7d7]/50 rounded transition-all text-[#b7a159]">
                                                            <Icons.ChevronDown size={18} className={`transition-transform duration-300 ${expandedModules[mod.id] ? 'rotate-180' : ''}`} />
                                                        </button>
                                                    )}
                                                </div>
                                                <span className={`text-[11px] font-black uppercase tracking-widest ${confidentialityMap[mod.id] ? 'text-[#932c2e]' : 'text-[#7a8b95]'}`}>Module {confidentialityMap[mod.id] ? 'Restricted' : 'Public'}</span>
                                            </div>
                                        </div>
                                        <button onClick={()=>toggleConfidentiality(mod.id)} className={`p-2.5 rounded-xl transition-all shadow-sm active:scale-90 ${confidentialityMap[mod.id] ? 'bg-[#932c2e] text-white' : 'bg-white text-[#7a8b95] border border-[#eaeaec] hover:bg-[#f8f9fa]'}`}>
                                            {confidentialityMap[mod.id] ? <Icons.Lock size={18}/> : <Icons.Eye size={18}/>}
                                        </button>
                                    </div>

                                    {/* SUB-ITEMS CONFIDENTIALITY */}
                                    {mod.subItems && expandedModules[mod.id] && (
                                        <div className="ml-16 space-y-2 animate-fadeIn pr-4 pb-4">
                                            {mod.subItems.map((sub: any) => (
                                                <div key={sub.id} className={`flex items-center justify-between px-4 py-2.5 rounded-xl border bg-white transition-all ${confidentialityMap[sub.id] ? 'border-[#932c2e]/40 bg-[#932c2e]/5 shadow-inner' : 'border-[#d7d7d7] hover:border-[#4d87a8]'}`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-2 h-2 rounded-full ${confidentialityMap[sub.id] ? 'bg-[#932c2e] animate-pulse' : 'bg-[#b7a159]'}`}></div>
                                                        <span className="text-[12px] font-black text-[#212c46] uppercase tracking-widest">{sub.label}</span>
                                                    </div>
                                                    <button onClick={()=>toggleConfidentiality(sub.id)} className={`p-2 rounded-lg transition-all ${confidentialityMap[sub.id] ? 'bg-[#932c2e]/10 text-[#932c2e]' : 'text-[#7a8b95] hover:bg-[#f8f9fa]'}`}>
                                                        {confidentialityMap[sub.id] ? <Icons.Lock size={16}/> : <Icons.Eye size={16}/>}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-lg border border-[#eaeaec] overflow-hidden flex flex-col animate-fadeIn">
                    <div className="px-4 py-4 border-b border-[#eaeaec] bg-white flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="flex bg-[#f8f9fa] border border-[#eaeaec] p-1 rounded-full shadow-sm inline-flex">
                                <button onClick={()=>setViewMode('list')} className={`px-5 py-2 text-[11px] font-black uppercase tracking-widest rounded-full transition-all flex items-center gap-2 ${viewMode==='list'?'bg-[#212c46] text-[#d7d7d7] shadow-md':'text-[#7a8b95] hover:text-[#a94228]'}`}>
                                    <Icons.List size={14}/> List View
                                </button>
                                <button onClick={()=>setViewMode('matrix')} className={`px-5 py-2 text-[11px] font-black uppercase tracking-widest rounded-full transition-all flex items-center gap-2 ${viewMode==='matrix'?'bg-[#212c46] text-[#d7d7d7] shadow-md':'text-[#7a8b95] hover:text-[#a94228]'}`}>
                                    <Icons.LayoutGrid size={14}/> Summary Matrix
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:w-80">
                                <Icons.Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#7a8b95]" />
                                <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search personnel..." className="w-full pl-12 pr-6 py-2.5 text-[12px] border border-[#eaeaec] rounded-full font-bold outline-none focus:border-[#b7a159] bg-white shadow-sm text-[#212c46]" />
                            </div>
                            <button onClick={()=>setEditModal({isOpen: true, user: { id: Date.now(), name: 'NEW USER', position: 'POSITION', email: '', avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png', isDev: false, permissions: {} }})} className="bg-[#212c46] text-white px-6 py-2.5 rounded-full font-black text-[12px] uppercase tracking-widest shadow-md hover:bg-[#414757] hover:text-white transition-all flex items-center gap-2 shrink-0 border border-[#212c46]">
                                <Icons.UserPlus size={16} /> New User
                            </button>
                        </div>
                    </div>

                    <div className="overflow-auto custom-scrollbar">
                        {viewMode === 'list' ? (
                            <table className="w-full text-left border-collapse table-font">
                                <thead className="sys-table-header [#b7a159] ">
                    <tr>
                                        <th className="font-black uppercase tracking-widest whitespace-nowrap   ">Personnel Identity</th>
                                        <th className="font-black uppercase tracking-widest whitespace-nowrap   ">Responsibility Node</th>
                                        <th className="font-black uppercase tracking-widest whitespace-nowrap   ">E-Mail Channel</th>
                                        <th className="font-black uppercase tracking-widest text-center   ">Authorization</th>
                                        <th className="font-black uppercase tracking-widest text-center   ">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-[#eaeaec]">
                                    {currentData.map(user => (
                                        <tr key={user.id} className="hover:bg-[#f8f9fa] transition-colors group">
                                            <td className="sys-table-td font-black text-[#212c46] uppercase tracking-tight py-2.5 px-4">
                                                <div className="flex items-center gap-4">
                                                    <img src={user.avatar} className="w-8 h-8 rounded-lg object-cover border border-[#eaeaec] shadow-sm" />
                                                    <span>{user.name}</span>
                                                </div>
                                            </td>
                                            <td className="sys-table-td font-bold text-[#4d87a8] uppercase py-2.5 px-4">{user.position}</td>
                                            <td className="sys-table-td font-mono text-[#7a8b95] py-2.5 px-4">{user.email}</td>
                                            <td className="sys-table-td text-center py-2.5 px-4">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase border tracking-widest ${user.isDev ? 'bg-[#b7a159]/10 text-[#d96245] border-[#b7a159]/30' : 'bg-[#212c46]/5 text-[#212c46] border-[#eaeaec]'}`}>
                                                    {user.isDev ? 'Developer' : 'General'}
                                                </span>
                                            </td>
                                            <td className="sys-table-td text-center py-2.5 px-4">
                                                <div className="flex justify-center items-center gap-[1px]">
                                                    <button onClick={()=>setEditModal({isOpen: true, user: user})} className="sys-table-action-btn w-8 h-8 text-[#4d87a8] hover:bg-[#4d87a8]/10 border-transparent">
                                                        <Icons.UserCog size={14} />
                                                    </button>
                                                    <button className="sys-table-action-btn w-8 h-8 text-[#932c2e] hover:bg-[#932c2e]/10 border-transparent">
                                                        <Icons.Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <table className="w-full text-left border-collapse min-w-[900px] table-font">
                                <thead className="sys-table-header">
                    <tr className="-[3px] [#b7a159]">
                                        <th className="font-black uppercase tracking-widest  r [#ffffff20] w-72">Module / Sub-Module</th>
                                        {currentData.map(user => (
                                            <th className="text-center r [#ffffff20] last:0 min-w-[140px] ">
                                                <div className="flex flex-col items-center justify-center gap-1.5">
                                                    <img src={user.avatar} className="w-10 h-10 rounded-xl object-cover border-2 border-white/20 shadow-sm" />
                                                    <span className="text-[10px] uppercase tracking-widest font-black text-[#d7d7d7]">{user.name.split(' ')[0]}</span>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-[#eaeaec]">
                                    {SYSTEM_MODULES.map(mod => (
                                        <React.Fragment key={mod.id}>
                                            <tr className="hover:bg-[#f8f9fa] transition-colors group">
                                                <td className="px-4 border-r border-[#eaeaec] py-2.5">
                                                    <div className="flex items-center gap-3">
                                                        {mod.subItems ? (
                                                            <button onClick={() => toggleExpand(mod.id)} className="text-[#4d87a8] p-0.5 rounded outline-none">
                                                                <Icons.ChevronDown size={14} className={`transition-transform duration-300 ${expandedModules[mod.id] ? '' : '-rotate-90'}`} />
                                                            </button>
                                                        ) : <div className="w-4 h-4 shrink-0" />}
                                                        <LucideIcon name={mod.icon} size={16} className="text-[#a74353]" />
                                                        <span className="font-black text-[#212c46] uppercase text-[12px] tracking-widest">{mod.label}</span>
                                                    </div>
                                                </td>
                                                {currentData.map(user => (
                                                    <td className="px-4 text-center border-r border-[#eaeaec] last:border-0 py-2.5">
                                                        <PermissionBadges user={user} moduleId={mod.id} />
                                                    </td>
                                                ))}
                                            </tr>
                                            {mod.subItems && expandedModules[mod.id] && mod.subItems.map((sub: any) => (
                                                <tr key={sub.id} className="bg-[#f8f9fa]/50 hover:bg-[#f8f9fa] transition-colors border-b border-[#eaeaec]/50 last:border-b-0">
                                                    <td className="px-4 pl-14 border-r border-[#eaeaec] py-2.5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-1 h-1 rounded-full bg-[#7a8b95]"></div>
                                                            <span className="font-bold text-[#414757] uppercase text-[11px] tracking-wider">{sub.label}</span>
                                                        </div>
                                                    </td>
                                                    {currentData.map(user => (
                                                        <td className="px-4 text-center border-r border-[#eaeaec] last:border-0 py-2.5">
                                                            <PermissionBadges user={user} moduleId={sub.id} />
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="px-8 py-3 bg-[#f8f9fa] border-t border-[#eaeaec] flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
                        <div className="flex items-center gap-6 text-[11px] font-black text-[#7a8b95] uppercase tracking-widest">
                            <div className="flex items-center gap-3">
                                <span>Display Rows:</span>
                                <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="bg-white border border-[#eaeaec] rounded-lg px-3 py-1.5 outline-none font-black text-[#212c46] cursor-pointer shadow-sm">
                                    {[5, 10, 20, 50].map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                            </div>
                            <p className="bg-white px-4 py-2 rounded-xl border border-[#eaeaec] shadow-sm">Total Records: {filteredUsers.length}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className={`w-10 h-10 border border-[#eaeaec] bg-white rounded-xl flex items-center justify-center transition-all ${currentPage === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#212c46] hover:text-white shadow-md active:scale-90'}`}>
                                <Icons.ChevronLeft size={18}/>
                            </button>
                            <div className="bg-[#212c46] text-white px-8 py-2.5 rounded-xl shadow-md font-black text-[11px] min-w-[140px] text-center uppercase tracking-widest">
                                Page {currentPage} / {totalPages}
                            </div>
                            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className={`w-10 h-10 border border-[#eaeaec] bg-white rounded-xl flex items-center justify-center transition-all ${currentPage === totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#212c46] hover:text-white shadow-md active:scale-90'}`}>
                                <Icons.ChevronRight size={18}/>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
