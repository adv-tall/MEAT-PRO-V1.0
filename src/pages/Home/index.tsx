import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, Briefcase, UserCheck, CalendarDays, TrendingUp, BrainCircuit, ShieldCheck, Factory,
  ChevronRight, ChevronLeft, Bell, UserPlus, PartyPopper, Send, Globe, Plus, CalendarClock, Info, AlertCircle, Newspaper, Box, Archive
} from 'lucide-react';
import { DraggableModal } from '../../components/shared/DraggableModal';

const THEME = {
  primary: '#212c46',
  accent: '#a94228',
  glassWhite: 'rgba(255, 255, 255, 0.95)'
};

const AddUpdateForm = ({ onClose }: any) => {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-[10px] font-black tracking-widest text-[#7a8b95] mb-1 block">TITLE</label>
        <input type="text" className="w-full border border-[#eaeaec] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#c27848]" placeholder="Enter announcement title..." />
      </div>
      <div>
        <label className="text-[10px] font-black tracking-widest text-[#7a8b95] mb-1 block">TAG</label>
        <select className="w-full border border-[#eaeaec] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#c27848]">
          <option>COMPANY UPDATE</option>
          <option>HR ANNOUNCEMENT</option>
          <option>EVENT</option>
          <option>QA ANNOUNCEMENT</option>
        </select>
      </div>
      <div>
        <label className="text-[10px] font-black tracking-widest text-[#7a8b95] mb-1 block">CONTENT</label>
        <textarea className="w-full border border-[#eaeaec] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#c27848] h-32 resize-none" placeholder="Write full details here..."></textarea>
      </div>
      <div>
        <label className="text-[10px] font-black tracking-widest text-[#7a8b95] mb-1 block">ATTACHMENT</label>
        <div className="border-2 border-dashed border-[#eaeaec] bg-[#fdfdfd] rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors">
           <Globe size={24} className="text-[#a2aeb6] mb-2" />
           <p className="text-sm font-medium text-[#212c46]">Click to upload or drag & drop</p>
           <p className="text-[10px] text-[#7a8b95] mt-1">SVG, PNG, JPG or GIF (max. 5MB)</p>
        </div>
      </div>
      <button onClick={onClose} className="w-full mt-2 bg-[#c27848] text-white py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.1em] hover:bg-[#a15f33] transition-colors">
        PUBLISH UPDATE
      </button>
    </div>
  );
};

const AddStaffForm = ({ onClose }: any) => {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-[10px] font-black tracking-widest text-[#7a8b95] mb-1 block">EMPLOYEE NAME</label>
        <input type="text" className="w-full border border-[#eaeaec] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#3f809e]" placeholder="e.g. สมศรี ใจดี" />
      </div>
      <div>
        <label className="text-[10px] font-black tracking-widest text-[#7a8b95] mb-1 block">ROLE / POSITION</label>
        <input type="text" className="w-full border border-[#eaeaec] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#3f809e]" placeholder="e.g. QC MANAGER" />
      </div>
      <div>
        <label className="text-[10px] font-black tracking-widest text-[#7a8b95] mb-1 block">DEPARTMENT</label>
        <input type="text" className="w-full border border-[#eaeaec] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#3f809e]" placeholder="e.g. Quality Assurance" />
      </div>
      <div>
        <label className="text-[10px] font-black tracking-widest text-[#7a8b95] mb-1 block">AVATAR / PHOTO</label>
        <div className="border border-[#eaeaec] rounded-xl p-3 flex items-center gap-3">
           <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
             <UserPlus size={16} className="text-[#a2aeb6]" />
           </div>
           <button className="text-[10px] font-black tracking-widest text-[#3f809e] bg-[#3f809e]/10 px-3 py-1.5 rounded-lg hover:bg-[#3f809e]/20 transition-all">UPLOAD PHOTO</button>
        </div>
      </div>
      <button onClick={onClose} className="w-full mt-2 bg-[#3f809e] text-white py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.1em] hover:bg-[#2e627a] transition-colors">
        SAVE NEW MEMBER
      </button>
    </div>
  );
};

const AddBirthdayForm = ({ onClose }: any) => {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-[10px] font-black tracking-widest text-[#7a8b95] mb-1 block">SELECT EMPLOYEE</label>
        <select className="w-full border border-[#eaeaec] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#c17849]">
          <option>อภิรดี มีสุข (Accounting)</option>
          <option>ชวาล ยิ่งใหญ่ (Logistics)</option>
        </select>
      </div>
      <div>
        <label className="text-[10px] font-black tracking-widest text-[#7a8b95] mb-1 block">BIRTH DATE</label>
        <input type="date" className="w-full border border-[#eaeaec] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#c17849]" />
      </div>
      <button onClick={onClose} className="w-full mt-4 bg-[#c17849] text-white py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.1em] hover:bg-[#a56133] transition-colors">
        ADD BIRTHDAY
      </button>
    </div>
  );
};

const WelcomeModalContent = ({ member, onClose }: any) => {
  const [activeTab, setActiveTab] = useState('info');

  return (
    <div className="flex h-[320px] -mx-4 md:-mx-6 -mb-6">
       {/* Sidebar */}
       <div className="w-24 md:w-32 border-r border-[#eaeaec] bg-[#fdfdfd] flex flex-col gap-2 p-4 rounded-bl-[24px]">
          <button onClick={() => setActiveTab('info')} className={`text-[10px] font-black uppercase tracking-widest p-2 rounded-lg text-left transition-colors ${activeTab==='info' ? 'bg-[#3f809e]/10 text-[#3f809e]' : 'text-[#7a8b95] hover:bg-gray-100'}`}>INFO</button>
          <button onClick={() => setActiveTab('write')} className={`text-[10px] font-black uppercase tracking-widest p-2 rounded-lg text-left transition-colors ${activeTab==='write' ? 'bg-[#3f809e]/10 text-[#3f809e]' : 'text-[#7a8b95] hover:bg-gray-100'}`}>GREET</button>
          <button onClick={() => setActiveTab('board')} className={`text-[10px] font-black uppercase tracking-widest p-2 rounded-lg text-left transition-colors ${activeTab==='board' ? 'bg-[#3f809e]/10 text-[#3f809e]' : 'text-[#7a8b95] hover:bg-gray-100'}`}>BOARD</button>
       </div>
       {/* Content */}
       <div className="flex-1 flex flex-col overflow-y-auto w-full h-full p-4 md:p-6 bg-white rounded-br-[24px] relative">
          {activeTab === 'info' && (
             <div className="flex flex-col items-center justify-center h-full animate-fadeIn">
                <img src={member.pic} className="w-20 h-20 md:w-24 md:h-24 rounded-full mb-4 shadow-md object-cover border-4 border-white" />
                <h2 className="text-xl md:text-2xl font-black text-[#212c46] tracking-tight text-center leading-none">{member.name}</h2>
                <p className="text-[#3f809e] text-[10px] font-black uppercase tracking-widest mt-2 mb-1">{member.role}</p>
                <p className="text-[#7a8b95] text-[11px] font-medium text-center max-w-[200px]">{member.dept}</p>
                <p className="text-[#212c46] text-[9px] font-black mt-6 uppercase tracking-widest bg-[#f0f6f9] border border-[#d6e7f0] px-3 py-1.5 rounded-full">Started: {member.date}</p>
             </div>
          )}
          {activeTab === 'write' && (
             <div className="w-full h-full flex flex-col animate-fadeIn">
               <p className="text-[9px] font-black text-[#212c46] uppercase tracking-widest mb-3">SAY HELLO TO {member.name.split(' ')[0]}</p>
               <div className="relative flex-1 flex flex-col min-h-0">
                 <textarea className="w-full flex-1 border border-[#eaeaec] rounded-xl px-4 py-3 pb-12 text-sm outline-none focus:border-[#3f809e] resize-none bg-[#fdfdfd] shadow-sm mb-2" placeholder="Type a welcome message... (Emojis supported 👍)"></textarea>
                 <button className="absolute bottom-6 right-3 bg-[#3f809e] hover:bg-[#2e627a] text-white px-4 py-2 text-[10px] uppercase font-black tracking-widest rounded-lg transition-colors shadow-sm flex items-center gap-2">
                   <Send size={12} /> SEND
                 </button>
               </div>
             </div>
          )}
          {activeTab === 'board' && (
             <div className="w-full h-full flex flex-col animate-fadeIn relative">
                <p className="text-[9px] font-black text-[#a2aeb6] uppercase tracking-widest mb-3 sticky top-0 bg-white z-10 py-1">RECENT GREETINGS (2)</p>
                <div className="flex flex-col gap-3 pb-4">
                   <div className="border border-[#eaeaec] rounded-xl p-3 bg-[#fcfcfc] shadow-sm flex flex-col gap-2">
                     <div className="flex justify-between items-center">
                       <span className="font-bold text-xs text-[#212c46]">วิชัย สุขใจ</span>
                       <span className="text-[9px] text-[#a2aeb6] font-medium tracking-widest">10m ago</span>
                     </div>
                     <p className="text-[#7a8b95] text-xs">Welcome to the team! Glad to have you here.</p>
                   </div>
                   <div className="border border-[#eaeaec] rounded-xl p-3 bg-[#fcfcfc] shadow-sm flex flex-col gap-2">
                     <div className="flex justify-between items-center">
                       <span className="font-bold text-xs text-[#212c46]">LAW Team</span>
                       <span className="text-[9px] text-[#a2aeb6] font-medium tracking-widest">20m ago</span>
                     </div>
                     <p className="text-[#7a8b95] text-xs">We are excited to see your impact at MEAT PRO.</p>
                   </div>
                </div>
             </div>
          )}
       </div>
    </div>
  );
};

const BirthdayModalContent = ({ bday, onClose }: any) => {
  const [activeTab, setActiveTab] = useState('info');

  return (
    <div className="flex h-[320px] -mx-4 md:-mx-6 -mb-6 bg-[#fcfaf2] rounded-b-[24px]">
       {/* Sidebar */}
       <div className="w-24 md:w-32 border-r border-[#f0eee4] flex flex-col gap-2 p-4 rounded-bl-[24px]">
          <button onClick={() => setActiveTab('info')} className={`text-[10px] font-black uppercase tracking-widest p-2 rounded-lg text-left transition-colors ${activeTab==='info' ? 'bg-[#c17849]/10 text-[#a94228]' : 'text-[#bca372] hover:bg-white/50'}`}>INFO</button>
          <button onClick={() => setActiveTab('write')} className={`text-[10px] font-black uppercase tracking-widest p-2 rounded-lg text-left transition-colors ${activeTab==='write' ? 'bg-[#c17849]/10 text-[#a94228]' : 'text-[#bca372] hover:bg-white/50'}`}>WISHES</button>
          <button onClick={() => setActiveTab('board')} className={`text-[10px] font-black uppercase tracking-widest p-2 rounded-lg text-left transition-colors ${activeTab==='board' ? 'bg-[#c17849]/10 text-[#a94228]' : 'text-[#bca372] hover:bg-white/50'}`}>BOARD</button>
       </div>
       {/* Content */}
       <div className="flex-1 flex flex-col overflow-y-auto w-full h-full p-4 md:p-6 relative">
          {activeTab === 'info' && (
             <div className="flex flex-col items-center justify-center h-full animate-fadeIn">
                <img src={bday.pic} className="w-20 h-20 md:w-24 md:h-24 rounded-full mb-4 shadow-md object-cover border-4 border-white" />
                <p className="text-[9px] font-black text-[#bca372] uppercase tracking-widest mb-1.5">HAPPY BIRTHDAY</p>
                <h2 className="text-xl md:text-2xl font-black text-[#212c46] tracking-tight text-center leading-none mb-2">{bday.name}</h2>
                <p className="text-[#7a8b95] text-[11px] font-medium text-center">{bday.dept}</p>
                <p className="text-[#212c46] text-[11px] font-black mt-2">{bday.date}</p>
             </div>
          )}
          {activeTab === 'write' && (
             <div className="w-full h-full flex flex-col animate-fadeIn">
               <p className="text-[9px] font-black text-[#bca372] uppercase tracking-widest mb-3">POST A GREETING</p>
               <div className="relative flex-1 flex flex-col min-h-0">
                 <textarea className="w-full flex-1 border border-[#f0eee4] rounded-xl px-4 py-3 pb-12 text-sm outline-none focus:border-[#c17849] resize-none bg-white shadow-sm mb-2" placeholder="Write your wishes here... (Emojis supported 🎉)"></textarea>
                 <button className="absolute bottom-6 right-3 bg-[#c17849] hover:bg-[#a56133] text-white px-4 py-2 text-[10px] uppercase font-black tracking-widest rounded-lg transition-colors shadow-sm flex items-center gap-2">
                   <Send size={12} /> SEND
                 </button>
               </div>
             </div>
          )}
          {activeTab === 'board' && (
             <div className="w-full h-full flex flex-col animate-fadeIn relative">
                <p className="text-[9px] font-black text-[#bca372] uppercase tracking-widest mb-3 sticky top-0 bg-[#fcfaf2] z-10 py-1">GREETINGS BOARD</p>
                <div className="flex flex-col gap-3 pb-4">
                   <div className="bg-white rounded-xl p-3 shadow-sm flex flex-col gap-3 border border-[#eaeaec]">
                     <div className="flex items-center gap-3 border-b border-[#f0eee4]/50 pb-2">
                         <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop" className="w-8 h-8 rounded-full border border-[#eaeaec]"/>
                         <div className="flex flex-col flex-1">
                           <div className="flex justify-between items-center w-full">
                             <span className="font-bold text-xs text-[#212c46]">วิชัย สุขใจ</span>
                             <span className="text-[9px] text-[#a2aeb6] font-medium tracking-widest">10m ago</span>
                           </div>
                         </div>
                     </div>
                     <p className="text-[#7a8b95] text-xs italic">"Wishing you a fantastic birthday and a wonderful year ahead! 🎉"</p>
                   </div>
                </div>
             </div>
          )}
       </div>
    </div>
  );
};

const HeroBanner = () => {
  const bgImage = "https://t4.ftcdn.net/jpg/18/84/61/59/360_F_1884615948_JTno5zhY2QgPBKpkKhYoOGX84ucB2lXQ.jpg";
  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-xl group bg-[#212c46] border border-[#414757]">
      <div className="absolute inset-0 transform transition-transform duration-[2000ms] group-hover:scale-105">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-80"
          style={{ backgroundImage: `url(${bgImage})`, backgroundPosition: 'center' }}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#212c46]/80 via-[#212c46]/40 to-transparent" />
      <div className="relative z-10 h-full flex flex-col md:flex-row items-center justify-between p-4 md:p-6 w-full gap-6">
        <div className="flex flex-col justify-center flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Factory size={12} className="text-[#a94228]" />
            <span className="text-[9px] text-[#a94228] font-black uppercase tracking-[0.2em] drop-shadow-sm font-sans">MEAT PRODUCTION HUB</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-none mb-3 drop-shadow-md font-sans uppercase">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a94228] to-[#d96245]">GLOBAL LEADERS</span> IN MEAT TECHNOLOGY
          </h2>
          <div className="mb-6">
            <p className="text-white/90 text-xs font-medium leading-relaxed max-w-2xl font-sans">
              A state-of-the-art facility powered by world-class innovation.<br/>Uncompromising commitment to Food Hygiene, Safety, and Product Quality.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <button className="bg-[#b91c1c] hover:bg-[#991b1b] border border-[#a94228]/30 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all flex items-center gap-2 shadow-lg">
              <ShieldCheck size={12} /> Food Safety
            </button>
            <div className="bg-white/5 border border-white/10 px-4 py-2 text-center rounded-xl flex items-center gap-2 shadow-inner backdrop-blur-md">
              <ShieldCheck size={14} className="text-[#657f4d]" />
              <span className="text-white font-black tracking-tighter text-sm font-sans">ISO 9001</span>
              <span className="text-[8px] text-white/50 font-bold uppercase tracking-widest leading-none mt-0.5 font-sans">Compliant</span>
            </div>
          </div>
        </div>
        <div className="shrink-0 flex justify-center items-center">
          <a 
            href="/copilot"
            className="group/ai flex flex-col items-center gap-2 bg-[#1d2636] border border-[#a94228]/30 rounded-[20px] px-8 py-5 shadow-2xl hover:-translate-y-1 transition-transform"
          >
            <div className="relative">
               <div className="absolute inset-0 bg-[#a94228]/20 blur-xl rounded-full scale-150 animate-pulse" />
               <BrainCircuit size={40} className="text-[#a94228] relative z-10 group-hover/ai:scale-110 transition-transform duration-500" />
            </div>
            <span className="text-[#a94228] text-[13px] font-black uppercase tracking-[0.2em] mt-1 font-sans">MES COPILOT</span>
            <span className="text-[8px] text-white/40 font-bold tracking-[0.4em] font-sans">AI ASSISTANT</span>
          </a>
        </div>
      </div>
    </div>
  );
};

const HRMetricCard = ({ title, value, subtext, icon: Icon, color, subColor }: any) => (
  <div className="bg-white rounded-[16px] p-4 shadow-sm border border-[#eaeaec] relative overflow-hidden group hover:shadow-md transition-shadow">
    <div className="absolute right-0 top-0 opacity-5 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
      <Icon size={120} style={{ color }} />
    </div>
    <div className="relative z-10">
      <p className="text-[10px] font-bold text-[#7a8b95] uppercase tracking-wider mb-2">{title}</p>
      <h3 className="text-3xl font-black text-[#212c46] truncate">{value}</h3>
      <p className="text-[11px] font-bold mt-3 flex items-center gap-1.5" style={{ color: subColor || '#7a8b95' }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: subColor || color }}></span>
        {subtext}
      </p>
    </div>
    <div className="absolute top-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center border border-[#eaeaec] bg-white shadow-sm">
      <Icon size={18} style={{ color }} />
    </div>
  </div>
);

const NewsCard = ({ tag, title, description, date, isNew, onClick }: any) => (
  <button onClick={onClick} className="bg-white rounded-[16px] shadow-sm border border-[#eaeaec] flex flex-col group relative h-[180px] w-full text-center transition-all hover:shadow-md hover:border-[#d0d0ce] overflow-hidden p-3">
    {isNew && (
      <div className="absolute top-3 -left-[30px] bg-[#b44837] text-white text-[9px] font-black py-1 w-[100px] -rotate-45 text-center shadow-sm z-10 block tracking-wider">
        NEW
      </div>
    )}
    <div className="flex flex-col items-center flex-1 w-full mt-1.5">
      <span className="text-[#37495e] text-[10px] font-black uppercase tracking-widest mb-1">{tag}</span>
      <h4 className="text-[11px] font-medium text-[#7a8b95] mb-2">{title}</h4>
      <p className="text-[12px] text-[#212c46] font-bold leading-tight line-clamp-3 px-1">{description}</p>
    </div>
    
    <div className="mt-auto w-full bg-[#37495e] text-white py-1.5 rounded-lg flex items-center justify-center text-[10px] font-bold tracking-widest uppercase">
      Date &bull; {date}
    </div>
  </button>
);

export default function Home() {
  const { user } = useAuth();
  const [feedIndex, setFeedIndex] = useState(0);
  const [modalState, setModalState] = useState<{isOpen: boolean, title: string, content: any, modalClass?: string, headerClass?: string, hideHeader?: boolean}>({isOpen: false, title: '', content: null});

  const openModal = (title: string, content: any, params: { modalClass?: string, headerClass?: string, hideHeader?: boolean } = {}) => {
    setModalState({ isOpen: true, title, content, ...params });
  };

  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  const currentUser = {
      name: user?.name || 'SUPER ADMIN',
      position: user?.role || 'DEVELOPER',
      avatar: user?.avatar || 'https://drive.google.com/thumbnail?id=1Z_fRbN9S4aA7OkHb3mlim_t60wIT4huY&sz=w400'
  };

  const hrMetrics = [
    { title: 'PRODUCTION YIELD', value: '115.4 T', subtext: 'Target: 120.0 Tons/Day', icon: Factory, color: '#3f809e', subColor: '#3f809e' },
    { title: 'QUALITY PASS RATE', value: '98.5%', subtext: 'Target: >99.0%', icon: ShieldCheck, color: '#b58c4f', subColor: '#b58c4f' },
    { title: 'PENDING ORDERS', value: '42', subtext: 'Require dispatch today', icon: Box, color: '#d55a6d', subColor: '#d55a6d' },
    { title: 'INVENTORY CAPACITY', value: '82%', subtext: 'Cold Storage Room A', icon: Archive, color: '#e08365', subColor: '#e08365' }
  ];

  const newsFeeds = [
    { tag: 'COMPANY UPDATE', title: 'Q1 Production Summary', description: 'Review the key takeaways and yield targets from our recent Q1 performance review. Production has exceeded targets by 4%.', date: '12 May 2026' },
    { tag: 'HR ANNOUNCEMENT', title: 'New Safety Protocol', description: 'Review the updated guidelines for factory floor hygiene and mandatory PPE usage in high-risk zones.', date: '14 May 2026' },
    { tag: 'EVENT', title: 'Annual Food Expo', description: 'Join us for our annual showcase at the International Food Expo. We will be featuring our new plant-based alternatives.', date: '20 May 2026' },
    { tag: 'TRAINING', title: 'Food Safety Workshop', description: 'Mandatory GHPs/HACCP training for all line operators next month. Please check your schedule and confirm attendance.', date: '02 Jun 2026' },
    { tag: 'COMPANY UPDATE', title: 'New Meat Grinder Installed', description: 'Line 2 capacity increased with the new industrial meat grinder, capable of processing up to 2 tons per hour.', date: '05 Jun 2026' },
    { tag: 'HR ANNOUNCEMENT', title: 'OT Request Procedure', description: 'Updated procedure for requesting overtime during peak season. All requests must be submitted 48 hours in advance.', date: '10 Jun 2026' },
  ];

  const newFamilyMembers = [
    { name: 'พิมพรรณ สวยงาม', role: 'QC SUPERVISOR', dept: 'Quality Assurance', date: '01 JUN', pic: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop', details: 'ยินดีต้อนรับคุณพิมพรรณ สู่ทีม QA มีประสบการณ์ด้านตรวจสอบคุณภาพอาหารกว่า 5 ปี' },
    { name: 'ธนวัฒน์ มาดี', role: 'PRODUCTION ENG', dept: 'Production', date: '02 JUN', pic: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop', details: 'คุณธนวัฒน์มาร่วมทีมผลิตเพื่อดูแลการเพิ่มประสิทธิภาพเครื่องจักร' },
    { name: 'เกริกพล ขยันงาน', role: 'MAINTENANCE', dept: 'Engineering', date: '05 JUN', pic: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop', details: 'คุณเกริกพลจะมาช่วยดูแลระบบทำความเย็นและเครื่องจักรหลักในสายการผลิต' }
  ];

  const birthdays = [
    { name: 'อภิรดี มีสุข', dept: 'Packaging', date: '10 Jun', pic: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop' },
    { name: 'ชวาล ยิ่งใหญ่', dept: 'Logistics', date: '12 Jun', pic: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop' }
  ];

  const corporateNews = [
    { title: 'ยอดผลิตและส่งออกเนื้อแปรรูป ไตรมาส 1 / 2026', tag: 'COMPANY UPDATE', author: 'CEO OFFICE', img: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400&h=200&fit=crop', date: '08 May 2026', desc: 'ผลประกอบการไตรมาสแรกเติบโตขึ้น 15% จากกลุ่มผลิตภัณฑ์ไส้กรอกและเบคอน ขอบคุณพนักงานทุกท่านที่ช่วยกันขับเคลื่อนองค์กรให้บรรลุเป้าหมายที่ตั้งไว้ ทางบริษัทเตรียมจัดโบนัสพิเศษให้กับทุกแผนกที่ทำยอดทะลุเป้า', fullText: 'รายงานผลประกอบการประจำไตรมาสที่ 1 ประจำปี 2026\n\nคณะกรรมการและผู้บริหารขอแสดงความยินดีกับความสำเร็จในไตรมาสแรกของปี ซึ่งขับเคลื่อนโดยความทุ่มเทของพนักงานทุกระดับ โดยเฉพาะแผนกผลิตที่มีประสิทธิภาพสูงขึ้น 15% (OEE) และแผนกขายที่ขยายตลาดไปสู่กลุ่มประเทศ CLMV ได้อย่างยอดเยี่ยม ส่งผลให้ยอดสั่งซื้อล่วงหน้าสำหรับไตรมาสถัดไปเต็มกำลังการผลิตแล้ว' },
    { title: 'อัปเดตมาตรฐานสากล ISO 22000 และ HACCP', tag: 'QA ANNOUNCEMENT', author: 'QUALITY TEAM', img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=200&fit=crop', date: '05 May 2026', desc: 'เพื่อให้สอดคล้องกับข้อกำหนดใหม่ ขอให้ทุกแผนกศึกษาคู่มือความปลอดภัยอาหารและแนวทางปฏิบัติอย่างเคร่งครัด รวมถึงเข้าร่วมการอบรมที่จะจัดขึ้นในเดือนหน้า', fullText: 'ประกาศจากแผนกควบคุมคุณภาพ (QC/QA)\n\nบริษัทจะมีการปรับปรุงมาตรฐานการจัดการความปลอดภัยอาหาร ISO 22000:2018 ให้เป็นฉบับล่าสุด และยกระดับมาตรฐาน HACCP ให้ครอบคลุมทุกสายการผลิตเนื้อสัตว์แปรรูปใหม่ทั้งหมด เพื่อรองรับการส่งออกไปยังยุโรป ฝ่ายผลิตและคลังสินค้าโปรดให้ความร่วมมือในการตรวจประเมินภายใน (Internal Audit) กลางเดือนหน้า' },
    { title: 'เชิญร่วมงาน Townhall ประจำเดือน ซีซั่นหน้าฝน', tag: 'EVENT', author: 'INTERNAL COMMS', img: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=400&h=200&fit=crop', date: '01 May 2026', desc: 'พบปะพูดคุยกับผู้บริหารและรับฟังทิศทางของบริษัท พร้อมกิจกรรมและซุ้มอาหารสุดพิเศษมากมายที่จัดเตรียมไว้เพื่อทุกคน', fullText: 'คำเชิญเข้าร่วมประชุมพนักงาน (Townhall Meeting)\n\nเนื่องในโอกาสสิ้นสุดไตรมาสแรก ผู้บริหารขอเชิญชวนพนักงานทุกระดับเข้าร่วมงาน Townhall ในวันศุกร์นี้เพื่อรับฟังแถลงการณ์ทิศทางธุรกิจ พร้อมร่วมสนุกกับกิจกรรมมอบรางวัลพนักงานดีเด่น และซุ้มอาหารสุดพิเศษ (หมูกระทะและสุกี้) พิเศษ! มีการจับฉลากของรางวัลมากมาย อย่าลืมเข้าร่วมกันนะ' }
  ];

  const corporateAlerts = [
    { title: 'กำหนดการล้างเครื่องจักรประจำเดือน', desc: 'Production Line 1 will be stopped for deep cleaning this weekend. All relevant staff please stand by.', icon: CalendarClock, type: 'warning' },
    { title: 'สวัสดิการตรวจสุขภาพประจำปี', desc: 'Annual health check-up schedule is available. Please book your slot before end of the month in the HR portal.', icon: Info, type: 'info' }
  ];

  const handlePrevFeed = () => {
    setFeedIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextFeed = () => {
    setFeedIndex(prev => Math.min(newsFeeds.length - 4, prev + 1));
  };

  const renderModalContent = () => {
    return (
      <div className="text-sm text-[#7a8b95] whitespace-pre-wrap leading-relaxed">
        {modalState.content}
      </div>
    );
  };

  return (
    <div className="pt-4 flex flex-col gap-6 animate-fadeIn max-w-[1532px] mx-auto px-4 sm:px-8 w-full font-sans">
      <div className="flex flex-row justify-between items-center gap-4">
          <div className="flex flex-col justify-center">
              <h1 className="text-3xl md:text-4xl text-[#212c46] tracking-tight uppercase font-black leading-none font-sans">
                  Morning, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#b58c4f] to-[#b7a159] font-black">{currentUser.name}!</span>
              </h1>
              <p className="text-[#748ea1] text-[10px] font-black uppercase tracking-widest mt-2 flex items-center gap-1.5 leading-none">
                  <TrendingUp size={14} className="text-[#d96245]" /> Prod. Yield Rate: <span className="text-[#3f809e]">High (98.2%)</span>
              </p>
          </div>
          <div className="flex gap-3">
              <button onClick={() => openModal('CASE LOOKUP', <div className="text-sm">ระบบค้นหากรณีปัญหากำลังปรับปรุง</div>)} className="bg-white border border-[#eaeaec] hover:border-[#b58c4f] text-[#212c46] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all flex items-center gap-2 shadow-sm">
                 <Bell size={14} /> CASE LOOKUP
              </button>
              <button onClick={() => openModal('NEW CASE FILE', <div className="text-sm">ระบบเปิดกรณีปัญหาใหม่กำลังปรับปรุง</div>)} className="bg-[#3f809e] hover:bg-[#2e627a] border border-[#3f809e] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all flex items-center gap-2 shadow-sm">
                 <ShieldCheck size={14} /> NEW CASE FILE
              </button>
          </div>
      </div>

      <HeroBanner />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {hrMetrics.map((metric, idx) => (
              <HRMetricCard key={idx} {...metric} />
          ))}
      </div>

      {/* LATEST NEWS FEEDS CAROUSEL */}
      <div className="bg-[#edece8] border border-[#dcdad4] rounded-2xl p-4 shadow-sm flex flex-col mt-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[#212c46] text-sm font-black uppercase tracking-widest flex items-center gap-2">
             <Newspaper size={16} className="text-[#3f809e]"/> LATEST NEWS FEEDS
          </h3>
          <button onClick={() => openModal('ADD NEWS', <div className="text-sm px-2">กำลังโหลดหน้าเพิ่มข่าวฟีด...</div>)} className="bg-white border border-[#eaeaec] text-[#212c46] text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg hover:border-[#7a8b95] transition-colors flex items-center gap-1.5 shadow-sm">
             <Plus size={14} strokeWidth={3} /> ADD NEWS
          </button>
        </div>
        
        <div className="relative">
          <button 
             onClick={handlePrevFeed}
             disabled={feedIndex === 0}
             className="absolute -left-4 top-1/2 -translate-y-1/2 bg-[#7a8b95] disabled:opacity-30 disabled:hover:bg-[#7a8b95] text-white flex justify-center items-center rounded p-2 z-10 hover:bg-[#37495e] transition-colors shadow-sm w-9 h-14 border border-[#5d6a72]">
              <ChevronLeft size={24} />
          </button>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-2 transition-all duration-300">
              {newsFeeds.slice(feedIndex, feedIndex + 4).map((feed, idx) => (
                  <NewsCard key={idx} {...feed} isNew={feedIndex + idx < 2} onClick={() => openModal(`${feed.tag}`, <div className="text-left px-2"><h3 className="font-black text-[#212c46] text-xl mb-4 text-balance leading-tight">{feed.title}</h3><p className="text-sm leading-relaxed text-[#414757]">{feed.description}</p><p className="mt-8 pt-4 border-t border-[#eaeaec] text-[10px] font-black tracking-widest text-[#a2aeb6] uppercase">DATE: {feed.date}</p></div>)} />
              ))}
          </div>

          <button 
             onClick={handleNextFeed}
             disabled={feedIndex >= newsFeeds.length - 4}
             className="absolute -right-4 top-1/2 -translate-y-1/2 bg-[#7a8b95] disabled:opacity-30 disabled:hover:bg-[#7a8b95] text-white flex justify-center items-center rounded p-2 z-10 hover:bg-[#37495e] transition-colors shadow-sm w-9 h-14 border border-[#5d6a72]">
              <ChevronRight size={24} />
          </button>
        </div>

        <div className="flex justify-center mt-6 gap-2 items-center">
           {Array.from({ length: newsFeeds.length - 3 }).map((_, idx) => (
               <button
                  key={idx}
                  onClick={() => setFeedIndex(idx)}
                  className={`rounded-full transition-all flex-shrink-0 ${
                      feedIndex === idx 
                        ? 'w-[14px] h-[14px] border border-[#37495e] flex justify-center items-center bg-transparent relative outline-none shadow-sm' 
                        : 'w-2 h-2 bg-[#a2aeb6] hover:bg-[#7a8b95] outline-none border-none shadow-sm'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
               >
                 {feedIndex === idx && <div className="w-1.5 h-1.5 bg-[#37495e] rounded-full"></div>}
               </button>
           ))}
        </div>
      </div>

      {/* NEW SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* OUR NEW FAMILY MEMBERS */}
        <div className="lg:col-span-2 bg-[#edece8] border border-[#dcdad4] rounded-2xl p-4 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[#212c46] text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <UserPlus size={16} className="text-[#3f809e]"/> OUR NEW FAMILY MEMBERS
            </h3>
            <div className="flex gap-2">
              <button onClick={() => openModal('ADD NEW STAFF', <AddStaffForm onClose={closeModal} />)} className="text-[#3f809e] text-[9px] font-black uppercase tracking-widest bg-[#3f809e]/10 px-4 py-1.5 rounded-full hover:bg-[#3f809e]/20 transition-colors flex items-center gap-1.5">
                <Plus size={12} /> ADD STAFF
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {newFamilyMembers.map((member, idx) => (
              <button key={idx} onClick={() => openModal(`✨ WELCOME TO THE TEAM`, <WelcomeModalContent member={member} onClose={closeModal} />)} className="bg-white border border-[#eaeaec] rounded-xl p-3 flex flex-col items-center shadow-sm hover:shadow-md hover:border-[#3f809e]/50 transition-all text-left w-full group">
                <div className="relative mb-3">
                  <img src={member.pic} alt={member.name} className="w-16 h-16 rounded-xl object-cover shadow-sm border border-[#eaeaec] group-hover:scale-105 transition-transform" />
                  <div className="absolute -bottom-2 -right-2 bg-[#3f809e] text-white p-1 rounded-md border border-white">
                    <BrainCircuit size={12} />
                  </div>
                </div>
                <h4 className="text-[#212c46] font-black text-sm mb-0.5 group-hover:text-[#3f809e] transition-colors">{member.name}</h4>
                <p className="text-[#3f809e] text-[9px] font-black uppercase tracking-widest mb-1">{member.role}</p>
                <p className="text-[#7a8b95] text-[10px] font-medium">{member.dept}</p>
                <div className="w-full flex justify-between items-center mt-4 pt-3 border-t border-[#f3f3f1]">
                  <span className="text-[#7a8b95] text-[9px] font-black uppercase tracking-widest">JOIN</span>
                  <span className="text-[#212c46] text-[10px] font-black uppercase tracking-widest">{member.date}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* BIRTHDAY WISHES */}
        <div className="bg-[#edece8] border border-[#dcdad4] rounded-2xl p-4 shadow-sm flex flex-col">
          <h3 className="text-[#212c46] text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-4">
             <PartyPopper size={16} className="text-[#c17849]" /> BIRTHDAY WISHES
          </h3>
          <div className="flex flex-col gap-3 flex-1">
            {birthdays.map((bday, idx) => (
              <button key={idx} onClick={() => openModal('', <BirthdayModalContent bday={bday} onClose={closeModal} />, { modalClass: 'bg-[#fcfaf2]', hideHeader: true })} className="bg-white border border-[#eaeaec] rounded-xl p-2.5 flex items-center justify-between shadow-sm hover:border-[#c17849]/50 hover:shadow-md transition-all group w-full text-left">
                <div className="flex items-center gap-3">
                  <img src={bday.pic} alt={bday.name} className="w-10 h-10 rounded-full object-cover border border-[#eaeaec]" />
                  <div>
                    <h4 className="text-[#212c46] font-black text-xs group-hover:text-[#c17849] transition-colors">{bday.name}</h4>
                    <p className="text-[#7a8b95] text-[10px]">{bday.dept}</p>
                  </div>
                </div>
                <span className="text-[#c17849] text-[10px] font-black uppercase tracking-widest">{bday.date}</span>
              </button>
            ))}
          </div>
          <button onClick={() => openModal('ADD NEW BIRTHDAY', <AddBirthdayForm onClose={closeModal} />)} className="w-full mt-4 bg-[#bca372] hover:bg-[#a68c5b] text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-colors flex items-center justify-center gap-2 shadow-sm">
             <Plus size={14} /> ADD BIRTHDAY
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CORPORATE NEWS BOARD */}
        <div className="lg:col-span-2 bg-[#edece8] border border-[#dcdad4] rounded-2xl p-4 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[#212c46] text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <Globe size={16} className="text-[#3f809e]"/> CORPORATE NEWS BOARD
            </h3>
            <div className="flex gap-2">
              <button onClick={() => openModal('ADD NEW UPDATE', <AddUpdateForm onClose={closeModal} />)} className="bg-[#c27848] text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm hover:bg-[#a15f33] transition-colors">
                <Plus size={12} /> ADD UPDATE
              </button>
              <button onClick={() => openModal('ALL UPDATES', <div className="text-sm">กำลังโหลดฐานข้อมูลข่าวสารทั้งหมด...</div>)} className="bg-white border border-[#eaeaec] text-[#212c46] text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg hover:border-[#7a8b95] transition-colors">
                ALL
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {corporateNews.map((news, idx) => (
              <button key={idx} onClick={() => openModal(news.title, <div className="text-left"><img src={news.img} className="w-full h-48 object-cover rounded-xl mb-6 shadow-sm" /><p className="text-sm leading-relaxed">{news.fullText}</p><div className="flex justify-between mt-6 pt-4 border-t border-[#eaeaec] text-[10px] font-black tracking-widest text-[#a2aeb6] uppercase"><span>BY: {news.author}</span><span>{news.date}</span></div></div>)} className="bg-white border border-[#eaeaec] rounded-xl overflow-hidden shadow-sm flex flex-col h-[300px] text-left hover:shadow-lg hover:border-[#3f809e]/50 transition-all group w-full">
                <div className="relative h-32 shrink-0 w-full overflow-hidden">
                  <div className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-700" style={{backgroundImage: `url(${news.img})`}}></div>
                  <div className="absolute bottom-2 left-2 flex gap-1">
                    <span className="bg-[#3f809e] text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm">{news.tag}</span>
                    <span className="bg-[#212c46]/80 backdrop-blur-sm text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm">{news.date}</span>
                  </div>
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-[#212c46] font-black text-sm mb-2 leading-snug group-hover:text-[#3f809e] transition-colors">{news.title}</h4>
                    <p className="text-[#7a8b95] text-[11px] mb-2 line-clamp-3 leading-relaxed">{news.desc}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[#a2aeb6] mt-2">
                     <Users size={10} /> {news.author}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* CORPORATE ALERT */}
        <div className="bg-[#edece8] border border-[#dcdad4] rounded-2xl p-4 shadow-sm flex flex-col">
          <h3 className="text-[#212c46] text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-4">
             <AlertCircle size={16} className="text-[#a94228]" /> CORPORATE ALERT
          </h3>
          <div className="flex flex-col gap-4">
            {corporateAlerts.map((alert, idx) => (
              <button key={idx} onClick={() => openModal(alert.title, <div className="text-sm mt-2">{alert.desc}</div>)} className={`border rounded-xl p-3 flex flex-col gap-2 text-left hover:shadow-md transition-shadow ${alert.type === 'warning' ? 'bg-white border-[#f0d4d1] hover:border-[#a94228]' : 'bg-white border-[#d6e7f0] hover:border-[#3f809e]'}`}>
                <div className={`flex items-center gap-2 ${alert.type === 'warning' ? 'text-[#a94228]' : 'text-[#3f809e]'}`}>
                  <alert.icon size={16} />
                  <h4 className="font-black text-xs">{alert.title}</h4>
                </div>
                <p className={`text-[10px] pl-6 pb-2 border-b leading-relaxed ${alert.type === 'warning' ? 'text-[#c76551] border-[#f0d4d1]/50' : 'text-[#5b95ae] border-[#d6e7f0]/50'}`}>
                  {alert.desc}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <DraggableModal 
        isOpen={modalState.isOpen} 
        onClose={closeModal} 
        title={modalState.title}
        className={modalState.modalClass}
        headerClassName={modalState.headerClass}
        hideHeader={modalState.hideHeader}
      >
        {renderModalContent()}
      </DraggableModal>

    </div>
  );
}

