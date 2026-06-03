import React, { useState, useEffect } from 'react';
import { Sparkles, BrainCircuit, RefreshCw, AlertTriangle, ChevronRight, CheckCircle2, ShieldAlert, Award } from 'lucide-react';
import { DraggableModal } from '../../components/shared/DraggableModal';

const THEME = {
  primary: '#212c46',
  accent: '#a94228',
  gold: '#b58c4f',
  success: '#657f4d',
  info: '#3f809e',
  warning: '#d96245',
  glassWhite: 'rgba(255, 255, 255, 0.88)'
};

export interface OeeRecommendation {
  title: string;
  metric: 'Availability' | 'Performance' | 'Quality' | 'General';
  description: string;
  actionSteps: string;
  priority: 'High' | 'Medium' | 'Low';
}

const CURRENT_OEE_MACHINES_DATA = [
  {
    id: 'VCM-101',
    name: 'Vacuum Stuffing Machine 1',
    line: 'Sausage Line A',
    status: 'Running',
    operatingMins: 420,
    plannedMins: 480,
    idealCycleTime: 0.12,
    actualOutput: 3100,
    defectOutput: 45,
    availability: 87.5,
    performance: 79.7,
    quality: 98.5,
    oee: 68.7
  },
  {
    id: 'SMK-201',
    name: 'Smokehouse Chamber 1',
    line: 'Sausage Line A',
    status: 'Running',
    operatingMins: 390,
    plannedMins: 480,
    idealCycleTime: 0.25,
    actualOutput: 1480,
    defectOutput: 15,
    availability: 81.3,
    performance: 94.9,
    quality: 99.0,
    oee: 76.4
  },
  {
    id: 'MIX-301',
    name: 'Mixing & Bowl Cutter',
    line: 'Prep Line X',
    status: 'Idle',
    operatingMins: 310,
    plannedMins: 480,
    idealCycleTime: 0.08,
    actualOutput: 3450,
    defectOutput: 20,
    availability: 64.6,
    performance: 89.0,
    quality: 99.4,
    oee: 57.1
  },
  {
    id: 'PKG-401',
    name: 'Multihead Weigher Packer',
    line: 'Packing Line 1',
    status: 'Stopped',
    operatingMins: 240,
    plannedMins: 480,
    idealCycleTime: 0.05,
    actualOutput: 4120,
    defectOutput: 110,
    availability: 50.0,
    performance: 85.8,
    quality: 97.3,
    oee: 41.7
  },
  {
    id: 'MTD-501',
    name: 'Metal Detector System',
    line: 'Packing Line 1',
    status: 'Running',
    operatingMins: 450,
    plannedMins: 480,
    idealCycleTime: 0.01,
    actualOutput: 4200,
    defectOutput: 5,
    availability: 93.8,
    performance: 9.3,
    quality: 99.9,
    oee: 8.7
  }
];

const CURRENT_PLANT_OEE_METRICS = {
  oee: 74.4,
  availability: 75.6,
  performance: 91.2,
  quality: 98.8
};

const CURRENT_OEE_TREND_DATA = [
  { name: 'Mon', oee: 75, availability: 82, performance: 90, quality: 98, target: 85 },
  { name: 'Tue', oee: 78, availability: 84, performance: 91, quality: 98.2, target: 85 },
  { name: 'Wed', oee: 82, availability: 86, performance: 92, quality: 98.5, target: 85 },
  { name: 'Thu', oee: 76, availability: 81, performance: 89, quality: 97.8, target: 85 },
  { name: 'Fri', oee: 79, availability: 83, performance: 90, quality: 98.1, target: 85 },
  { name: 'Sat', oee: 84, availability: 88, performance: 91, quality: 98.8, target: 85 },
  { name: 'Sun', oee: 78, availability: 82, performance: 90, quality: 98.0, target: 85 }
];

export function OeeAiRecommendations() {
  const [recommendations, setRecommendations] = useState<OeeRecommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRec, setActiveRec] = useState<OeeRecommendation | null>(null);
  const [loadStepIndex, setLoadStepIndex] = useState<number>(0);

  const loaderSteps = [
    'กำลังวิเคราะห์ค่า OEE เฉลี่ยของแต่ละไลน์พล็อต...',
    'กำลังประเมินจุดคอขวดที่ Mixing & Bowl Cutter...',
    'ตรวจสอบอัตรา Defect ของเครื่องบรรจุ Multihead Weigher...',
    'กำลังคำนวณข้อเสนอแนะเชิงลึกผ่านดัชนี OEE ด้วย Gemini API...'
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadStepIndex((prev) => (prev + 1) % loaderSteps.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const loadData = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    
    if (!forceRefresh) {
      const cached = localStorage.getItem('meatpro_oee_recommendations');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.length === 3) {
            setRecommendations(parsed);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error("Local storage decode error:", e);
        }
      }
    }

    try {
      const res = await fetch('/api/oee-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          machines: CURRENT_OEE_MACHINES_DATA,
          plantMetrics: CURRENT_PLANT_OEE_METRICS,
          trendData: CURRENT_OEE_TREND_DATA
        })
      });

      if (!res.ok) {
        throw new Error('ไม่สามารถประมวลผลคำแนะนำ OEE จากบลูพริ้นท์เซิร์ฟเวอร์ได้');
      }

      const data = await res.json();
      if (data && data.recommendations && data.recommendations.length > 0) {
        setRecommendations(data.recommendations.slice(0, 3));
        localStorage.setItem('meatpro_oee_recommendations', JSON.stringify(data.recommendations.slice(0, 3)));
      } else {
        throw new Error('ไม่พบรูปแบบข้อแนะนำที่สมบูรณ์จาก AI');
      }
    } catch (err: any) {
      setError(err?.message || 'ระบบวิเคราะห์ขัดข้องชั่วคราว');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getPriorityStyle = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return {
          bg: 'bg-red-50 text-[#a94228] border-red-200/50',
          dot: 'bg-[#a94228]',
          badge: 'ด่วนที่สุด (High Priority)'
        };
      case 'medium':
        return {
          bg: 'bg-amber-50 text-[#b58c4f] border-amber-200/50',
          dot: 'bg-[#b58c4f]',
          badge: 'ปานกลาง (Medium Priority)'
        };
      default:
        return {
          bg: 'bg-emerald-50 text-[#657f4d] border-emerald-200/50',
          dot: 'bg-[#657f4d]',
          badge: 'ทั่วไป (Low Priority)'
        };
    }
  };

  const getMetricBadgeStyle = (metric: string) => {
    switch (metric?.toLowerCase()) {
      case 'availability':
        return 'bg-blue-100/75 text-blue-800 border-blue-200';
      case 'performance':
        return 'bg-purple-100/75 text-purple-800 border-purple-200';
      case 'quality':
        return 'bg-rose-100/75 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100/75 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-[0_8px_30px_rgba(31,42,68,0.06)] border border-[#eaeaec] p-5 flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center mb-4 relative z-10">
        <h2 className="text-sm font-black text-[#212c46] flex items-center gap-2 uppercase tracking-wide">
          <BrainCircuit size={18} className="text-[#a94228]" /> AI OEE INSIGHTS
        </h2>
        <button
          onClick={() => loadData(true)}
          disabled={loading}
          title="บังคับวิเคราะห์ด้วย Gemini ใหม่"
          className="text-xs text-[#7a8b95] hover:text-[#212c46] transition-colors p-1.5 hover:bg-slate-50 rounded-lg disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center min-h-[220px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-6 text-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-[#a94228] animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles size={16} className="text-[#b58c4f] animate-pulse" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[11px] uppercase tracking-widest font-black text-[#212c46] animate-pulse">
                GEMINI AI ANALYZING
              </p>
              <p className="text-[10px] text-[#7a8b95] font-semibold h-4 transition-all duration-500 max-w-xs">
                {loaderSteps[loadStepIndex]}
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-rose-500 gap-3">
            <AlertTriangle size={32} />
            <div className="flex flex-col gap-1 px-4">
              <p className="text-xs font-bold uppercase">{error}</p>
              <button
                onClick={() => loadData(true)}
                className="mt-2 text-xs font-black text-white bg-[#a94228] hover:bg-[#a94228]/90 px-4 py-2 rounded-lg transition-colors uppercase self-center"
              >
                เชื่อมต่อใหม่อีกครั้ง
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="mb-1 text-[10px] font-bold text-[#7a8b95] uppercase tracking-widest flex items-center gap-1">
              <Sparkles size={11} className="text-[#b58c4f]" /> คำแนะนำ 3 ด้านเพื่อความคุ้มค่าเครื่องจักรสูงสุด
            </div>
            <div className="flex flex-col gap-2.5">
              {recommendations.map((rec, index) => {
                const priority = getPriorityStyle(rec.priority);
                return (
                  <button
                    key={index}
                    onClick={() => setActiveRec(rec)}
                    className="w-full text-left p-3 border border-slate-100 hover:border-[#a94228]/40 hover:bg-slate-50/50 rounded-xl transition-all cursor-pointer group flex flex-col gap-1.5"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#a94228] animate-pulse" />
                        <h4 className="text-[12px] font-black text-[#212c46] group-hover:text-[#a94228] transition-colors line-clamp-1">
                          {rec.title}
                        </h4>
                      </div>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md border ${priority.bg}`}>
                        {rec.priority}
                      </span>
                    </div>
                    
                    <p className="text-[10px] text-[#7a8b95] line-clamp-2 leading-relaxed">
                      {rec.description}
                    </p>

                    <div className="flex items-center justify-between mt-1 text-[8px] font-black uppercase tracking-wider">
                      <span className={`px-2 py-0.5 rounded border ${getMetricBadgeStyle(rec.metric)}`}>
                        {rec.metric}
                      </span>
                      <span className="text-[#a94228] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                        ดูแผนแก้ปัญหา <ChevronRight size={10} />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <DraggableModal
        isOpen={!!activeRec}
        onClose={() => setActiveRec(null)}
        title={activeRec ? activeRec.title : 'AI Action Details'}
        className="w-[95%] max-w-lg"
      >
        {activeRec && (
          <div className="p-1 flex flex-col gap-4 text-[#212c46]">
            {/* Header detail */}
            <div className="flex items-center justify-between gap-3 border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-lg border leading-none ${getPriorityStyle(activeRec.priority).bg}`}>
                  {getPriorityStyle(activeRec.priority).badge}
                </span>
                <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-lg border leading-none ${getMetricBadgeStyle(activeRec.metric)}`}>
                  {activeRec.metric} Pillar Focus
                </span>
              </div>
            </div>

            {/* Diagnostic */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-black text-[#7a8b95] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-[#a94228]" /> ปัญหาหน้างาน (Diagnostic Analysis)
              </span>
              <p className="text-[12px] leading-relaxed text-[#212c46] bg-slate-50 p-3 rounded-xl border border-slate-100">
                {activeRec.description}
              </p>
            </div>

            {/* Steps */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-black text-[#7a8b95] uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-[#657f4d]" /> แผนปฏิบัติหน้าที่พนักงาน (Action Steps)
              </span>
              <div className="text-[12px] text-[#212c46] bg-slate-50/50 p-4 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-wrap">
                {activeRec.actionSteps}
              </div>
            </div>

            {/* Footer design element */}
            <div className="flex items-center justify-between bg-[#212c46]/5 p-3 rounded-lg border border-slate-100 mt-2">
              <div className="flex items-center gap-2">
                <Award size={14} className="text-[#b58c4f]" />
                <span className="text-[9px] font-black text-[#212c46] uppercase">เป้าหมาย OEE: เพิ่มความคุ้มค่า &gt; 85%</span>
              </div>
              <button 
                onClick={() => setActiveRec(null)}
                className="text-[10px] font-black bg-[#212c46] hover:bg-[#212c46]/95 text-white uppercase px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                รับทราบบันทึกแผน
              </button>
            </div>
          </div>
        )}
      </DraggableModal>
    </div>
  );
}
