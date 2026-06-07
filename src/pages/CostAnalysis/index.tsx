import React, { useState, useMemo } from 'react';
import * as Icons from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import KpiCard from '../../components/shared/KpiCard';
import UserGuideButton from '../../components/shared/UserGuideButton';
import { UserGuidePanel } from '../../components/shared/UserGuidePanel';
import { useCollection } from '../../services/useFirestore';
import { DraggableModal } from '../../components/shared/DraggableModal';

// --- Theme Configuration ---
const THEME = {
  bgMain: '#f3f3f1',
  primary: '#212c46',
  accent: '#a94228',
  gold: '#b58c4f',
  success: '#657f4d',
  danger: '#932c2e',
  skyBlue: '#3f809e',
  dustyBlue: '#7a8b95',
  indigo: '#414757',
  coolGray: '#eaeaec'
};

const getCategoryFromName = (name: string) => {
  const n = (name || "").toLowerCase();
  if (n.includes('bologna') || n.includes('โบโลน่า')) return 'Bologna';
  if (n.includes('sausage') || n.includes('ไส้กรอก') || n.includes('hotdog')) return 'Sausage';
  if (n.includes('meatball') || n.includes('ลูกชิ้น')) return 'Meatball';
  if (n.includes('ham') || n.includes('แฮม')) return 'Ham';
  if (n.includes('loaf')) return 'Loaf';
  if (n.includes('batter')) return 'Batter';
  return 'Other FG';
};

const COLORS = ['#212c46', '#b58c4f', '#a94228', '#3f809e', '#657f4d', '#7a8b95', '#d4af37'];

function TrendAnalysisView() {
  const chartData = useMemo(() => {
    return [
      { month: 'JAN', year25: 14.5, year26: 12.5, vol25: 18500, vol26: 19100, energy25: 3.5, energy26: 3.2, labor25: 9.8, labor26: 8.5, water25: 1.2, water26: 0.8 },
      { month: 'FEB', year25: 14.2, year26: 12.9, vol25: 18200, vol26: 18800, energy25: 3.4, energy26: 3.3, labor25: 9.6, labor26: 8.8, water25: 1.2, water26: 0.8 },
      { month: 'MAR', year25: 13.8, year26: 13.1, vol25: 19000, vol26: 19500, energy25: 3.2, energy26: 3.4, labor25: 9.4, labor26: 9.0, water25: 1.2, water26: 0.7 },
      { month: 'APR', year25: 13.5, year26: 11.5, vol25: 19500, vol26: 20200, energy25: 3.0, energy26: 2.8, labor25: 9.3, labor26: 7.9, water25: 1.2, water26: 0.8 },
      { month: 'MAY', year25: 12.9, year26: 11.2, vol25: 20100, vol26: 21000, energy25: 2.8, energy26: 2.6, labor25: 9.0, labor26: 7.8, water25: 1.1, water26: 0.8 },
      { month: 'JUN', year25: 12.5, year26: 10.8, vol25: 21000, vol26: 21500, energy25: 2.6, energy26: 2.5, labor25: 8.8, labor26: 7.6, water25: 1.1, water26: 0.7 },
      { month: 'JUL', year25: 12.8, year26: null, vol25: 20800, vol26: null, energy25: 2.7, energy26: null, labor25: 9.0, labor26: null, water25: 1.1, water26: null },
      { month: 'AUG', year25: 13.1, year26: null, vol25: 20500, vol26: null, energy25: 2.9, energy26: null, labor25: 9.1, labor26: null, water25: 1.1, water26: null },
      { month: 'SEP', year25: 13.5, year26: null, vol25: 20000, vol26: null, energy25: 3.1, energy26: null, labor25: 9.3, labor26: null, water25: 1.1, water26: null },
      { month: 'OCT', year25: 13.8, year26: null, vol25: 19800, vol26: null, energy25: 3.3, energy26: null, labor25: 9.4, labor26: null, water25: 1.1, water26: null },
      { month: 'NOV', year25: 14.1, year26: null, vol25: 19200, vol26: null, energy25: 3.5, energy26: null, labor25: 9.5, labor26: null, water25: 1.1, water26: null },
      { month: 'DEC', year25: 14.3, year26: null, vol25: 18800, vol26: null, energy25: 3.6, energy26: null, labor25: 9.6, labor26: null, water25: 1.1, water26: null },
    ];
  }, []);

  const ChartCard = ({ title, dataKey25, dataKey26, unit, isVolume = false, formatVal = (v: any) => v }: any) => (
    <div className="bg-white rounded-xl shadow-sm border border-[#eaeaec] flex flex-col overflow-hidden">
      <div className="p-4 border-b border-[#eaeaec] bg-[#f8f9fa] flex items-center justify-between">
        <h2 className="text-[12px] font-black text-[#212c46] uppercase tracking-widest flex items-center gap-2">
          <Icons.LineChart className="text-[#b58c4f]" size={16} /> {title}
        </h2>
        <span className="px-3 py-1 bg-white border border-[#eaeaec] rounded-lg text-[10px] uppercase font-bold text-[#7a8b95] tracking-widest">
          {unit}
        </span>
      </div>
      <div className="p-6 h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }} barGap={0} barSize={12}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaec" />
            <XAxis dataKey="month" tick={{ fill: '#7a8b95', fontSize: 9, fontWeight: 700 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#7a8b95', fontSize: 9, fontWeight: 700 }} axisLine={false} tickLine={false} tickFormatter={formatVal} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #eaeaec', fontSize: '11px', fontWeight: 'bold' }} cursor={{fill: '#f8f9fa'}} />
            <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} verticalAlign="top" align="right" iconType="circle" />
            <Bar dataKey={dataKey25} name={`2025 ${isVolume ? 'Volume' : 'Cost'}`} fill="#eaeaec" radius={[2, 2, 0, 0]} />
            <Bar dataKey={dataKey26} name={`2026 ${isVolume ? 'Volume' : 'Cost'}`} fill={isVolume ? '#3f809e' : '#a94228'} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn">
      <div className="grid gap-4 md:grid-cols-3 mb-2">
        <KpiCard
          title="YTD AVG COST (2026)"
          value="12.00"
          unit="THB / KG"
          icon={Icons.TrendingDown}
          trend={{ value: -12.4, isPositive: true }}
          subtitle="COMPARED TO YTD 2025"
          className="border-t-4 border-t-[#657f4d]"
        />
        <KpiCard
          title="YTD AVG COST (2025)"
          value="13.70"
          unit="THB / KG"
          icon={Icons.History}
          trend={{ value: 0, isPositive: true }}
          subtitle="HISTORICAL BASELINE"
          className="border-t-4 border-t-[#7a8b95]"
        />
        <KpiCard
          title="PROJECTED ANNUAL SAVINGS"
          value="2.5M"
          unit="THB"
          icon={Icons.PiggyBank}
          trend={{ value: 15, isPositive: true }}
          subtitle="BASED ON CURRENT EFFICIENCY"
          className="border-t-4 border-t-[#3f809e]"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#eaeaec] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[#eaeaec] bg-[#f8f9fa] flex items-center justify-between">
          <h2 className="text-[12px] font-black text-[#212c46] uppercase tracking-widest flex items-center gap-2">
            <Icons.LineChart className="text-[#a94228]" size={16} /> TOTAL COST / KG (YEAR ON YEAR)
          </h2>
          <span className="px-3 py-1 bg-white border border-[#eaeaec] rounded-lg text-[10px] uppercase font-bold text-[#7a8b95] tracking-widest">
            THB / KG
          </span>
        </div>
        <div className="p-6 h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barGap={0} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaec" />
              <XAxis dataKey="month" tick={{ fill: '#7a8b95', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#7a8b95', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} tickFormatter={(val) => `฿${val}`} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #eaeaec', fontSize: '11px', fontWeight: 'bold' }} cursor={{fill: '#f8f9fa'}} />
              <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} verticalAlign="top" align="right" iconType="circle" />
              <Bar dataKey="year25" name="2025 Total Cost (THB/Kg)" fill="#eaeaec" radius={[4, 4, 0, 0]} />
              <Bar dataKey="year26" name="2026 Total Cost (THB/Kg)" fill="#a94228" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ChartCard 
          title="TOTAL VOLUME (MONTH)" 
          dataKey25="vol25" 
          dataKey26="vol26" 
          unit="KG" 
          isVolume={true} 
          formatVal={(val: any) => `${(val/1000).toFixed(1)}k`} 
        />
        <ChartCard 
          title="ENERGY COST / KG" 
          dataKey25="energy25" 
          dataKey26="energy26" 
          unit="THB / KG" 
          formatVal={(val: any) => `฿${val}`} 
        />
        <ChartCard 
          title="LABOR COST / KG" 
          dataKey25="labor25" 
          dataKey26="labor26" 
          unit="THB / KG" 
          formatVal={(val: any) => `฿${val}`} 
        />
        <ChartCard 
          title="WATER COST / KG" 
          dataKey25="water25" 
          dataKey26="water26" 
          unit="THB / KG" 
          formatVal={(val: any) => `฿${val}`} 
        />
      </div>
    </div>
  );
}

export default function CostAnalysis() {
  const [activeTab, setActiveTab] = useState('list_mode');
  const [mainTab, setMainTab] = useState<'monthly' | 'trend'>('monthly');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('2026-06');
  
  // Data for produced volumes (from Efficiency module)
  const { data: efficiencyData } = useCollection<any>('efficiency_summary_ledger');
  
  // Data for entered costs
  const { data: monthlyCosts, update: updateMonthlyCost, add: addMonthlyCost } = useCollection<any>('cost_analysis_monthly');

  // Input Modal state
  const [showInputModal, setShowInputModal] = useState(false);
  const [inputEnergy, setInputEnergy] = useState<number>(0);
  const [inputWater, setInputWater] = useState<number>(0);
  const [inputLabor, setInputLabor] = useState<number>(0);
  const [inputOther, setInputOther] = useState<number>(0);

  // Generate fallback data if firestore is empty for visual showcase
  const mockEfficiencyData = useMemo(() => {
    if (efficiencyData.length > 0) return efficiencyData;
    return [
      { date: '2026-06-01', productName: 'Smoked Garlic Bologna 1kg', volumeKg: 4500 },
      { date: '2026-06-02', productName: 'Cheese Sausage 200g', volumeKg: 6200 },
      { date: '2026-05-30', productName: 'Vienna Ham 2kg', volumeKg: 2800 },
      { date: '2026-06-05', productName: 'Frankfurter Chicken Sausage 500g', volumeKg: 4900 },
      { date: '2026-06-06', productName: 'Chicken Meatball 1kg', volumeKg: 3500 },
    ];
  }, [efficiencyData]);

  // Handle Month Selection
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    mockEfficiencyData.forEach(r => {
      if (r.date) months.add(r.date.substring(0, 7)); // e.g. "2026-06"
    });
    // Add current month if missing
    months.add('2026-06');
    months.add('2026-05');
    return Array.from(months).sort().reverse();
  }, [mockEfficiencyData]);

  // Aggregate Volume for Selected Month
  const monthlyVolumeData = useMemo(() => {
    const filtered = mockEfficiencyData.filter(r => r.date && r.date.startsWith(selectedMonth));
    const totalVolume = filtered.reduce((sum, r) => sum + (Number(r.volumeKg) || 0), 0);
    
    // Group by category based on MASTER ITEM assumption
    const categoryMap: Record<string, number> = {};
    filtered.forEach(r => {
      const cat = getCategoryFromName(r.productName || '');
      categoryMap[cat] = (categoryMap[cat] || 0) + (Number(r.volumeKg) || 0);
    });
    
    const byCategory = Object.keys(categoryMap).map(cat => ({
      category: cat,
      volumeKg: categoryMap[cat],
      sharePct: totalVolume > 0 ? (categoryMap[cat] / totalVolume) * 100 : 0
    })).sort((a, b) => b.volumeKg - a.volumeKg);

    return { totalVolume, byCategory };
  }, [mockEfficiencyData, selectedMonth]);

  // Pull costs for selected month
  const currentMonthCosts = useMemo(() => {
    const costDoc = monthlyCosts.find(c => c.id === selectedMonth);
    if (costDoc) return costDoc;
    // fallback static costs if no firestore entry
    if (selectedMonth === '2026-06') return { energy: 320000, water: 45000, labor: 1100000, other: 150000 };
    if (selectedMonth === '2026-05') return { energy: 280000, water: 41000, labor: 950000, other: 120000 };
    return { energy: 0, water: 0, labor: 0, other: 0 };
  }, [monthlyCosts, selectedMonth]);

  const totalMonthlyCost = currentMonthCosts.energy + currentMonthCosts.water + currentMonthCosts.labor + currentMonthCosts.other;
  const costPerKg = monthlyVolumeData.totalVolume > 0 ? totalMonthlyCost / monthlyVolumeData.totalVolume : 0;
  
  const energyPerKg = monthlyVolumeData.totalVolume > 0 ? currentMonthCosts.energy / monthlyVolumeData.totalVolume : 0;
  const laborPerKg = monthlyVolumeData.totalVolume > 0 ? currentMonthCosts.labor / monthlyVolumeData.totalVolume : 0;
  const waterPerKg = monthlyVolumeData.totalVolume > 0 ? currentMonthCosts.water / monthlyVolumeData.totalVolume : 0;

  // Open modal to edit current month's expenses
  const handleEditCosts = () => {
    setInputEnergy(currentMonthCosts.energy);
    setInputWater(currentMonthCosts.water);
    setInputLabor(currentMonthCosts.labor);
    setInputOther(currentMonthCosts.other);
    setShowInputModal(true);
  };

  const handleSaveCosts = async () => {
    const payload = {
      energy: Number(inputEnergy),
      water: Number(inputWater),
      labor: Number(inputLabor),
      other: Number(inputOther),
    };
    const exists = monthlyCosts.find(c => c.id === selectedMonth);
    if (exists) {
      await updateMonthlyCost(selectedMonth, payload);
    } else {
      await addMonthlyCost({ id: selectedMonth, ...payload });
    }
    setShowInputModal(false);
  };

  const chartDataPie = monthlyVolumeData.byCategory.map(item => ({
    name: item.category,
    value: item.volumeKg
  }));

  const chartDataBar = monthlyVolumeData.byCategory.map(item => {
    const share = item.volumeKg / monthlyVolumeData.totalVolume || 0;
    return {
      category: item.category,
      volume: item.volumeKg,
      energyCost: currentMonthCosts.energy * share,
      laborCost: currentMonthCosts.labor * share,
      waterCost: currentMonthCosts.water * share,
      otherCost: currentMonthCosts.other * share,
      totalCategoryCost: totalMonthlyCost * share
    };
  });

  return (
    <div className="flex flex-1 w-full flex-col animate-fadeIn bg-transparent space-y-4">
      <UserGuideButton onClick={() => setIsGuideOpen(true)} />
      <UserGuidePanel
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        title="COST ANALYSIS GUIDE"
        subtitle="MONTHLY COST & KPI MANUAL"
      >
        <div className="space-y-8 font-sans">
            <div>
                <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                    <Icons.Calculator size={16} className="text-[#3f809e]" /> 1. ภาพรวมการวิเคราะห์ต้นทุน (OVERVIEW)
                </h3>
                <p className="mb-4 text-[#414757]">
                    โมดูลนี้ใช้เพื่อสรุปต้นทุนการผลิตรายเดือน โดยระบบจะนำเอาข้อมูล <strong>ปริมาณการผลิต (Production Volume)</strong> ที่ถูกบันทึกมาจากสายการผลิตจริง มาจับคู่กับ ค่าใช้จ่าย (Expenses) ที่ผู้ใช้งานกรอกเข้าไปเพื่อหาราคาสุทธิแบบ <strong>THB / Kg</strong>
                </p>
                <div className="p-4 bg-[#fdf2f2] border border-[#f5c6cb] rounded-xl text-[#414757] text-[12px]">
                    ทุกการคำนวณจะถูกเฉลี่ย (Prorate) ไปยัง Category (หมวดหมู่สินค้าหลักจาก Master Data) โดยยึดหลักสัดส่วนสัดส่วนเปอร์เซ็นต์ยอดผลิต (Volume Share) ของเดือนนั้นๆ
                </div>
            </div>

            <div className="h-px bg-[#eaeaec] w-full" />

            <div>
                <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                    <Icons.FileEdit size={16} className="text-[#b58c4f]" /> 2. การบันทึกค่าใช้จ่ายรายเดือน (UPDATE COST)
                </h3>
                <div className="space-y-3">
                    <div className="p-3 bg-[#f8f9fa] border border-[#eaeaec] rounded-xl flex items-start gap-4 text-[12px]">
                        <div className="p-2 bg-[#b58c4f] text-white rounded-lg shrink-0"><Icons.Zap size={16} /></div>
                        <div>
                            <strong className="text-[#212c46]">Energy / Water / Labor Expense</strong>
                            <p className="text-[#7a8b95]">กดปุ่ม [ UPDATE {selectedMonth} COST ] ทางขวามือของตาราง Category Cost Allocation เพื่อแก้ไขค่าใช้จ่ายค่าไฟฟ้า น้ำ แรงงาน และอื่นๆ ให้ตรงกับบิลชำระของเดือนนั้นๆ</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-px bg-[#eaeaec] w-full" />

            <div>
                <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                    <Icons.LineChart size={16} className="text-[#688a58]" /> 3. โหมดการวิเคราะห์ (ANALYSIS MODES)
                </h3>
                <ul className="list-decimal pl-5 space-y-2 text-[#414757] text-[12px]">
                    <li><strong className="text-[#212c46]">MONTHLY COST:</strong> แสดงตัวเลขภาพรวมเจาะจงเดือนที่เลือก ช่วยให้เห็นว่า Category ไหนกินต้นทุนมากที่สุด</li>
                    <li><strong className="text-[#212c46]">TREND ANALYSIS:</strong> เปรียบเทียบตัวเลขแบบปีต่อปี (Year on Year) ช่วยวิเคราะห์แนวโน้มต้นทุนค่าแรงและค่าไฟที่อาจพุ่งสูงขึ้นตามซีซั่น</li>
                </ul>
            </div>
        </div>
      </UserGuidePanel>

      <div className="h-14 px-4 sm:px-8 flex flex-row items-center justify-between gap-4 z-20 shrink-0">
          <div className="flex items-center gap-5">
              <div className="relative flex items-center justify-center group cursor-default shrink-0">
                  <div className="absolute inset-0 bg-[#b58c4f] blur-[15px] opacity-20 rounded-full group-hover:opacity-60 transition-all duration-700"></div>
                  <div className="relative z-10 p-1.5 border border-[#b58c4f]/40 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm">
                      <Icons.Calculator size={28} strokeWidth={2.5} className="text-[#b58c4f]" />
                  </div>
              </div>
              <div>
                  <h3 className="font-black text-[#212c46] uppercase tracking-tighter leading-none font-exception-header" style={{ fontSize: '24px' }}>
                      MONTHLY <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#b58c4f] to-[#a94228]">COST ANALYSIS</span>
                  </h3>
                  <p className="text-[11px] font-bold text-[#4d5a44] uppercase tracking-[0.2em] mt-0.5 opacity-80 leading-none">
                      AGGREGATED MONTHLY EXPENSE ALLOCATION VS. CATEGORY VOLUME
                  </p>
              </div>
          </div>
          
          <div className="flex items-center gap-3">
            {mainTab === 'monthly' && (
              <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-[#eaeaec] shadow-sm shrink-0">
                <Icons.Calendar size={16} className="text-[#7a8b95] ml-2" />
                <span className="text-[11px] font-black uppercase text-[#7a8b95] tracking-widest leading-none">PERIOD:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-[#f3f3f1] border border-[#eaeaec] rounded-lg px-3 py-1.5 outline-none font-black text-[#212c46] uppercase tracking-wider cursor-pointer focus:border-[#b58c4f] text-[11px]"
                >
                  {availableMonths.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex bg-white p-1.5 rounded-xl border border-[#eaeaec] shadow-sm shrink-0">
                <button
                    onClick={() => setMainTab('monthly')}
                    className={`px-5 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${
                        mainTab === 'monthly' ? 'bg-[#212c46] text-white shadow-sm' : 'text-[#7a8b95] hover:text-[#212c46] hover:bg-[#f3f3f1]'
                    }`}
                >
                    MONTHLY COST
                </button>
                <button
                    onClick={() => setMainTab('trend')}
                    className={`px-5 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${
                        mainTab === 'trend' ? 'bg-[#212c46] text-white shadow-sm' : 'text-[#7a8b95] hover:text-[#212c46] hover:bg-[#f3f3f1]'
                    }`}
                >
                    TREND ANALYSIS
                </button>
            </div>
          </div>
      </div>

      <div className="px-4 sm:px-8  mx-auto w-full flex flex-col gap-6">
        {mainTab === 'monthly' ? (
          <>
            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-5 mb-3">
          <KpiCard
            title="TOTAL VOLUME (MONTH)"
            value={`${(monthlyVolumeData?.totalVolume || 0).toLocaleString()}`}
            unit="Kg"
            icon={Icons.Box}
            trend={{ value: 0, isPositive: true }}
            subtitle={`ACROSS ${monthlyVolumeData.byCategory.length} CATEGORIES`}
            className="border-t-4 border-t-[#212c46]"
          />
          <KpiCard
            title="TOTAL COST / KG"
            value={`${costPerKg.toFixed(2)}`}
            unit="THB"
            icon={Icons.Wallet}
            trend={{ value: 0, isPositive: true }}
            subtitle={costPerKg > 0 ? `TOTAL: ${(totalMonthlyCost/1000).toFixed(1)}k THB` : 'NO DATA'}
            className="border-t-4 border-t-[#a94228]"
          />
          <KpiCard
            title="ENERGY COST / KG"
            value={`${energyPerKg.toFixed(2)}`}
            unit="THB"
            icon={Icons.Zap}
            trend={{ value: 0, isPositive: false }}
            subtitle={`EXPENSE: ฿${(currentMonthCosts?.energy || 0).toLocaleString()}`}
            className="border-t-4 border-t-[#b58c4f]"
          />
          <KpiCard
            title="LABOR COST / KG"
            value={`${laborPerKg.toFixed(2)}`}
            unit="THB"
            icon={Icons.Users}
            trend={{ value: 0, isPositive: true }}
            subtitle={`EXPENSE: ฿${(currentMonthCosts?.labor || 0).toLocaleString()}`}
            className="border-t-4 border-t-[#3f809e]"
          />
          <KpiCard
            title="WATER COST / KG"
            value={`${waterPerKg.toFixed(2)}`}
            unit="THB"
            icon={Icons.Droplets}
            trend={{ value: 0, isPositive: true }}
            subtitle={`EXPENSE: ฿${(currentMonthCosts?.water || 0).toLocaleString()}`}
            className="border-t-4 border-t-[#3f809e]"
          />
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
          
          {/* CATEGORY AGGREGATION TABLE */}
          <div className="lg:col-span-8 bg-white rounded-xl shadow-sm border border-[#eaeaec] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[#eaeaec] bg-[#f8f9fa] flex items-center justify-between">
              <h2 className="text-[12px] font-black text-[#212c46] uppercase tracking-widest flex items-center gap-2">
                <Icons.Layers className="text-[#b58c4f]" size={16} /> Category Cost Allocation
              </h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleEditCosts}
                  className="bg-[#212c46] text-white hover:bg-[#b58c4f] transition-colors px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm"
                >
                  <Icons.Edit3 size={12} /> ENTER EXPENSES
                </button>
                <button 
                  onClick={() => setActiveTab(activeTab === 'list_mode' ? 'charts_mode' : 'list_mode')}
                  className="text-[10px] uppercase tracking-widest font-bold bg-white border border-[#eaeaec] px-3 py-1.5 rounded-lg text-[#414757] hover:bg-[#f3f3f1]"
                >
                  Toggle View
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto bg-white p-0">
              {activeTab === 'list_mode' ? (
                <table className="w-full text-left border-collapse min-w-[700px] table-font">
                  <thead className="sys-table-header">
                    <tr>
                      <th className="font-black uppercase tracking-widest">Master Category</th>
                      <th className="font-black uppercase tracking-widest text-right">Volume (Kg)</th>
                      <th className="font-black uppercase tracking-widest text-right">Energy (THB)</th>
                      <th className="font-black uppercase tracking-widest text-right">Labor (THB)</th>
                      <th className="font-black uppercase tracking-widest text-right ">Total Category Cost (THB)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eaeaec]">
                    {chartDataBar.length > 0 ? chartDataBar.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 whitespace-nowrap py-2.5">
                          <span className="font-black text-[#212c46] text-[12px] uppercase">{item.category}</span>
                        </td>
                        <td className="px-4 whitespace-nowrap text-right py-2.5">
                          <span className="text-[12px] font-bold text-[#414757]">{(item.volume || 0).toLocaleString()} Kg</span>
                        </td>
                        <td className="px-4 whitespace-nowrap text-right py-2.5">
                          <span className="text-[12px] font-bold text-[#b58c4f]">฿{(item.energyCost || 0).toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                        </td>
                        <td className="px-4 whitespace-nowrap text-right py-2.5">
                          <span className="text-[12px] font-bold text-[#3f809e]">฿{(item.laborCost || 0).toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                        </td>
                        <td className="px-4 whitespace-nowrap text-right py-2.5">
                          <span className="text-[13px] font-black text-[#a94228] bg-[#a94228]/10 px-3 py-1 rounded-lg">฿{(item.totalCategoryCost || 0).toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td className="text-center text-[12px] font-bold text-[#7a8b95] uppercase tracking-widest py-2.5 px-4">
                          No production volume detected for {selectedMonth}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {chartDataBar.length > 0 && (
                    <tfoot className="bg-[#f8f9fa] border-t-2 border-[#eaeaec]">
                      <tr>
                        <td className="px-4 whitespace-nowrap font-black text-[#212c46] text-[12px] uppercase text-right py-2.5">MONTHLY TOTAL</td>
                        <td className="px-4 whitespace-nowrap text-right font-black text-[#212c46] text-[12px] py-2.5">{(monthlyVolumeData?.totalVolume || 0).toLocaleString()} Kg</td>
                        <td className="px-4 whitespace-nowrap text-right font-black text-[#b58c4f] text-[12px] py-2.5">฿{(currentMonthCosts?.energy || 0).toLocaleString()}</td>
                        <td className="px-4 whitespace-nowrap text-right font-black text-[#3f809e] text-[12px] py-2.5">฿{(currentMonthCosts?.labor || 0).toLocaleString()}</td>
                        <td className="px-4 whitespace-nowrap text-right font-black text-[#a94228] text-[13px] py-2.5">฿{(totalMonthlyCost || 0).toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              ) : (
                <div className="p-6 h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartDataBar} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaec" />
                      <XAxis dataKey="category" tick={{ fill: '#7a8b95', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#7a8b95', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #eaeaec', fontSize: '11px', fontWeight: 'bold' }} />
                      <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                      <Bar dataKey="energyCost" name="Energy Cost Allocation" stackId="a" fill="#b58c4f" radius={[0, 0, 4, 4]} barSize={50} />
                      <Bar dataKey="laborCost" name="Labor Cost Allocation" stackId="a" fill="#3f809e" />
                      <Bar dataKey="waterCost" name="Water Cost Allocation" stackId="a" fill="#7a8b95" />
                      <Bar dataKey="otherCost" name="Other Cost Allocation" stackId="a" fill="#a94228" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL - VOLUME SHARE */}
          <div className="lg:col-span-4 bg-white rounded-xl shadow-sm border border-[#eaeaec] flex flex-col">
            <div className="p-4 border-b border-[#eaeaec] bg-[#f8f9fa]">
              <h2 className="text-[12px] font-black text-[#212c46] uppercase tracking-widest flex items-center gap-2">
                <Icons.PieChart className="text-[#3f809e]" size={16} /> Volume Capacity Share
              </h2>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              {monthlyVolumeData.totalVolume > 0 ? (
                <>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartDataPie}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {chartDataPie.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', background: '#212c46', color: '#fff', fontSize: '11px', fontWeight: 'bold' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {monthlyVolumeData.byCategory.map((cat, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[11px] font-bold pb-2 border-b border-[#eaeaec] last:border-0 uppercase tracking-widest text-[#414757]">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                          {cat.category}
                        </div>
                        <div>
                          <span>{(cat.volumeKg || 0).toLocaleString()} Kg</span>
                          <span className="text-[#7a8b95] ml-2 w-10 inline-block text-right">({cat.sharePct.toFixed(1)}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-[12px] font-bold text-[#7a8b95] uppercase tracking-widest">
                  No Volume Data Available
                </div>
              )}
            </div>
          </div>
        </div>
        </>
        ) : (
          <TrendAnalysisView />
        )}
      </div>

      {/* INPUT COST MODAL */}
      <DraggableModal
        isOpen={showInputModal}
        onClose={() => setShowInputModal(false)}
        width="max-w-[500px]"
        customHeader={
          <div className="bg-[#212c46] px-5 py-4 border-b-2 border-[#b58c4f] flex justify-between items-center">
            <div>
              <h3 className="text-[13px] font-black text-white uppercase tracking-widest leading-none">ENTER MONTHLY EXPENSES</h3>
              <p className="text-[9px] font-bold text-[#7a8b95] uppercase tracking-widest mt-1">PERIOD: {selectedMonth}</p>
            </div>
            <button onClick={() => setShowInputModal(false)} className="text-white/60 hover:text-white p-1"><Icons.X size={18} /></button>
          </div>
        }
      >
        <div className="p-6 bg-white space-y-5 font-sans">
          <div className="bg-[#f8f9fa] border border-[#eaeaec] p-4 rounded-xl flex justify-between items-center">
            <span className="text-[11px] font-black uppercase text-[#414757] tracking-widest">Total Produced Volume:</span>
            <span className="text-[14px] font-black text-[#212c46]">{(monthlyVolumeData?.totalVolume || 0).toLocaleString()} Kg</span>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-[#7a8b95] tracking-widest mb-1.5 flex items-center gap-1.5">
                <Icons.Zap size={14} className="text-[#b58c4f]" /> Total Energy Cost (THB)
              </label>
              <input 
                type="number" 
                value={inputEnergy} 
                onChange={e => setInputEnergy(Number(e.target.value))} 
                className="w-full bg-white border border-[#eaeaec] rounded-lg px-4 py-2 text-[13px] font-bold outline-none focus:border-[#b58c4f]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-[#7a8b95] tracking-widest mb-1.5 flex items-center gap-1.5">
                <Icons.Users size={14} className="text-[#3f809e]" /> Total Labor Cost (THB)
              </label>
              <input 
                type="number" 
                value={inputLabor} 
                onChange={e => setInputLabor(Number(e.target.value))} 
                className="w-full bg-white border border-[#eaeaec] rounded-lg px-4 py-2 text-[13px] font-bold outline-none focus:border-[#3f809e]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-[#7a8b95] tracking-widest mb-1.5 flex items-center gap-1.5">
                <Icons.Droplets size={14} className="text-[#3f809e]" /> Total Water Cost (THB)
              </label>
              <input 
                type="number" 
                value={inputWater} 
                onChange={e => setInputWater(Number(e.target.value))} 
                className="w-full bg-white border border-[#eaeaec] rounded-lg px-4 py-2 text-[13px] font-bold outline-none focus:border-[#3f809e]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-[#7a8b95] tracking-widest mb-1.5 flex items-center gap-1.5">
                <Icons.Settings size={14} className="text-[#a94228]" /> Other Manufacturing Costs (THB)
              </label>
              <input 
                type="number" 
                value={inputOther} 
                onChange={e => setInputOther(Number(e.target.value))} 
                className="w-full bg-white border border-[#eaeaec] rounded-lg px-4 py-2 text-[13px] font-bold outline-none focus:border-[#a94228]"
              />
            </div>
          </div>
          
          <div className="pt-2">
            <button 
              onClick={handleSaveCosts}
              className="w-full bg-[#212c46] text-white hover:bg-[#b58c4f] py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all"
            >
              Update Cost Parameters
            </button>
          </div>
        </div>
      </DraggableModal>
    </div>
  );
}