import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  LayoutDashboard, Users, ShoppingCart, TrendingDown, Target, Truck, 
  BarChart2, Settings, Menu, ChevronRight, ChevronLeft, ChevronDown,
  AlertCircle, Building2, Clock, PackageCheck, PhoneCall, Mail,
  Calendar, Library, DollarSign, Award, Globe, Bell, Sparkles,
  Factory, CheckCircle2, FileText, ClipboardList, ShieldCheck, LogOut,
  Container, Database, FileSearch, Scale, Shield, CreditCard, Zap, Handshake,
  Filter, Megaphone, Briefcase, TrendingUp, MessageSquare, Percent, UserPlus,
  PartyPopper, Send, CheckSquare, GraduationCap, Info, User, AlertTriangle,
  Activity, Plus, BrainCircuit, Heart, CalendarDays, Banknote, Network
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DraggableModal } from '../../components/shared/DraggableModal';
import { OeeAiRecommendations } from './OeeAiRecommendations';

const THEME = {
  primary: '#212c46',
  accent: '#a94228',
  gold: '#b58c4f',
  success: '#657f4d',
  info: '#3f809e',
  warning: '#d96245',
  glassWhite: 'rgba(255, 255, 255, 0.88)'
};

const GlassCard = ({ children, className = '', hoverEffect = true, style = {} }: any) => (
    <div className={`rounded-xl p-4 backdrop-blur-xl shadow-[0_8px_30px_rgba(31,42,68,0.06)] border border-white/60 ${hoverEffect ? 'hover:-translate-y-1 transition-transform duration-300' : ''} ${className}`}
        style={{ backgroundColor: THEME.glassWhite, ...style }}>
        {children}
    </div>
);

const DeliveryStatusChart = () => {
    const data = [
        { name: 'Delivered', value: 14250, color: '#3f809e' },
        { name: 'Pending', value: 750, color: '#eaeaec' }
    ];
    return (
        <GlassCard className="lg:col-span-1 bg-white border-[#eaeaec]">
            <div className="flex justify-between items-center mb-2 relative z-10">
                <h2 className="text-sm font-black text-[#212c46] flex items-center gap-2 uppercase tracking-wide">
                    <Truck size={16} className="text-[#3f809e]" /> THIS MONTH'S DELIVERY
                </h2>
            </div>
            <div className="flex flex-col items-center justify-center h-[200px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={data} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                            {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px', fontWeight: 'bold' }} />
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-[#212c46]">95%</span>
                    <span className="text-[10px] font-bold text-[#7a8b95] uppercase">Delivered</span>
                </div>
            </div>
            <div className="flex justify-between items-center px-4 pt-2">
                <div className="text-center">
                    <p className="text-[10px] font-bold text-[#7a8b95] uppercase">Target</p>
                    <p className="text-sm font-black text-[#212c46]">15,000 Kg</p>
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-bold text-[#7a8b95] uppercase">Actual</p>
                    <p className="text-sm font-black text-[#3f809e]">14,250 Kg</p>
                </div>
            </div>
        </GlassCard>
    )
}

const LossChartByDept = () => {
    const chartData = [
        { name: 'Mixing', weight: 450, percentage: 1.2 },
        { name: 'Forming', weight: 320, percentage: 0.8 },
        { name: 'Steaming', weight: 150, percentage: 0.4 },
        { name: 'Packing', weight: 280, percentage: 0.8 },
    ];
    return (
        <GlassCard className="lg:col-span-2 bg-white border-[#eaeaec]">
            <div className="flex justify-between items-center mb-4 relative z-10">
                <h2 className="text-sm font-black text-[#212c46] flex items-center gap-2 uppercase tracking-wide">
                    <TrendingDown size={16} className="text-[#a94228]" /> PRODUCTION LOSS BY DEPT
                </h2>
                <div className="text-[10px] font-black text-[#a94228] bg-[#a94228]/10 px-3 py-1 rounded-lg uppercase">
                    TOTAL 1,200 KG (3.2%)
                </div>
            </div>
            <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} barSize={32}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaec" />
                        <XAxis dataKey="name" tick={{ fill: '#7a8b95', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="left" tick={{ fill: '#7a8b95', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fill: '#7a8b95', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
                        <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px', fontWeight: 'bold' }} cursor={{fill: '#f8f9fa'}} />
                        <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                        <Bar yAxisId="left" dataKey="weight" name="Loss Weight (Kg)" fill="#a94228" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="right" dataKey="percentage" name="Loss (%)" fill="#b58c4f" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </GlassCard>
    )
}

const Volume90DaysChart = () => {
    const data = [
        { month: 'Feb', actual: 42000, plan: 45000 },
        { month: 'Mar', actual: 48000, plan: 46000 },
        { month: 'Apr', actual: 52000, plan: 50000 },
    ];
    return (
        <GlassCard className="lg:col-span-2 bg-white border-[#eaeaec]">
            <div className="flex justify-between items-center mb-4 relative z-10">
                <h2 className="text-sm font-black text-[#212c46] flex items-center gap-2 uppercase tracking-wide">
                    <BarChart2 size={16} className="text-[#b58c4f]" /> 90 DAYS VOLUME TREND
                </h2>
            </div>
            <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barGap={0} barSize={24}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaec" />
                        <XAxis dataKey="month" tick={{ fill: '#7a8b95', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#7a8b95', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} tickFormatter={(v)=>(v/1000)+'k'} />
                        <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px', fontWeight: 'bold' }} cursor={{fill: '#f8f9fa'}} />
                        <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                        <Bar dataKey="plan" name="Planned (Kg)" fill="#eaeaec" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="actual" name="Produced (Kg)" fill="#212c46" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </GlassCard>
    )
}

export default function PerformanceDashboard() {
  const { user } = useAuth();
  const currentUser = {
      name: user?.name || 'MEAT PRO Developer',
      position: user?.role || 'PLANT MANAGER',
      avatar: user?.avatar || 'https://drive.google.com/thumbnail?id=1Z_fRbN9S4aA7OkHb3mlim_t60wIT4huY&sz=w400'
  };

  return (
    <div className="pt-4 flex flex-col gap-6 animate-fadeIn  mx-auto px-4 sm:px-8 w-full">
      <div className="flex flex-row justify-between items-center gap-4">
          <div className="flex flex-col justify-center">
              <h1 className="text-3xl md:text-4xl text-[#212c46] tracking-tight uppercase font-black leading-none">
                  PERFORMANCE DASHBOARD
              </h1>
              <p className="text-[#748ea1] text-[10px] font-black uppercase tracking-widest mt-2 flex items-center gap-1.5 leading-none">
                  <TrendingUp size={14} className="text-[#d96245]" /> Overview
              </p>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Volume90DaysChart />
          <OeeAiRecommendations />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <DeliveryStatusChart />
          <LossChartByDept />
      </div>
    </div>
  );
}


