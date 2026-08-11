import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, PieChart, Pie, Cell, Tooltip, ResponsiveContainer, CartesianGrid, XAxis, YAxis } from 'recharts';
import { 
  TrendingUp, Users, Package, Wallet, 
  AlertTriangle, Bell, Clock, CalendarDays, ShoppingBag 
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

const COLORS = ['#10B981', '#3B82F6', '#8B5CF6'];

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState('');
  
  const [financeData, setFinanceData] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Günaydın');
    else if (hour < 18) setGreeting('İyi Günler');
    else setGreeting('İyi Akşamlar');
    
    // Fetch Real Data
    const fetchData = async () => {
      try {
        const fData = await api.get('/Orders/finance');
        setFinanceData(fData);

        const pData = await api.get('/Products');
        if (Array.isArray(pData)) {
           const lowStock = pData.filter((p: any) => p.quantity <= 3);
           const generatedAlerts = lowStock.map((p: any, idx: number) => ({
              id: idx,
              type: 'warning',
              msg: `${p.name} stok uyarısı: Sadece ${p.quantity} adet kaldı!`
           }));
           setAlerts(generatedAlerts);
        }
      } catch (err) {
        console.error("Dashboard veri çekme hatası:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const revenueChartData = financeData ? [
    { name: 'Nakit', value: financeData.cashVault || 0 },
    { name: 'Kredi Kartı', value: financeData.cardVault || 0 },
    { name: 'Havale / Diğer', value: financeData.transferVault || 0 },
  ].filter(d => d.value > 0) : [];
  
  // Eğer ciro yoksa grafiğin dolması için boş bir state atayalım
  const finalPieData = revenueChartData.length > 0 ? revenueChartData : [{ name: 'Veri Yok', value: 1 }];

  return (
    <div className="min-h-[calc(100vh-80px)] p-6 lg:p-8 relative overflow-hidden bg-gradient-to-br from-[#F8FAFC] via-[#E2E8F0] to-[#CBD5E1] flex flex-col font-sans gap-8">
      
      {/* VIBRANT AMBIENT GLOWS */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[70%] bg-gradient-to-bl from-blue-300/40 via-indigo-300/30 to-purple-300/40 rounded-full blur-[120px] mix-blend-multiply opacity-80"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[60%] bg-gradient-to-tr from-emerald-300/30 to-cyan-200/30 rounded-full blur-[140px] mix-blend-multiply opacity-80"></div>
      </div>

      <div className="relative z-10 w-full max-w-[1600px] mx-auto flex flex-col gap-8">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end bg-white/60 backdrop-blur-3xl p-8 rounded-[2rem] border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.05)]">
          <div>
            <div className="inline-flex items-center justify-center px-4 py-1.5 mb-4 rounded-full bg-white/70 text-indigo-700 text-[10px] font-black tracking-widest uppercase border border-white/60 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span> Sistem Aktif
            </div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">
              {greeting}, {user?.fullName?.split(' ')[0]} 👋
            </h1>
            <p className="text-slate-500 mt-2 font-bold text-sm">İşleriniz bugün harika görünüyor. İşte güncel mağaza özetiniz.</p>
          </div>
          
          <div className="flex gap-4 mt-6 md:mt-0 relative z-20">
             <button
               type="button"
               onClick={() => navigate('/dashboard/appointments')}
               className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white/80 backdrop-blur-md border border-white shadow-sm rounded-2xl text-sm font-bold text-slate-700 hover:bg-white transition-all cursor-pointer"
             >
               <CalendarDays className="w-4 h-4" /> Randevular
             </button>
             <button
               type="button"
               onClick={() => {
                 navigate('/dashboard/pos');
                 window.scrollTo(0, 0);
               }}
               className="flex items-center justify-center gap-2 px-8 py-3.5 bg-indigo-600/90 backdrop-blur-md shadow-[0_8px_20px_rgba(79,70,229,0.3)] rounded-2xl text-sm font-black text-white border border-indigo-400/30 hover:bg-indigo-700 hover:shadow-[0_12px_25px_rgba(79,70,229,0.4)] transition-all active:scale-[0.98] cursor-pointer"
             >
               <ShoppingBag className="w-4 h-4" /> Yeni Satış Yap
             </button>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
           <MetricCard 
              icon={<Wallet className="text-blue-500 w-6 h-6"/>}
              title="Bugünkü Kasa / Ciro"
              value={`₺${(financeData?.totalRevenue || 0).toLocaleString('tr-TR')}`}
              trend="Canlı" trendUp={true}
           />
           <MetricCard 
              icon={<TrendingUp className="text-emerald-500 w-6 h-6"/>}
              title="Ortalama Sepet"
              value={`₺${(financeData?.averageCart || 0).toLocaleString('tr-TR')}`}
              trend="Canlı" trendUp={true}
           />
           <MetricCard 
              icon={<Package className="text-amber-500 w-6 h-6"/>}
              title="Kasadaki Nakit"
              value={`₺${(financeData?.cashVault || 0).toLocaleString('tr-TR')}`}
              trend="Nakit" trendUp={true}
           />
           <MetricCard 
              icon={<Users className="text-purple-500 w-6 h-6"/>}
              title="Pos / Kredi Kartı"
              value={`₺${(financeData?.cardVault || 0).toLocaleString('tr-TR')}`}
              trend="POS" trendUp={true}
           />
           <MetricCard 
              icon={<Wallet className="text-rose-500 w-6 h-6"/>}
              title="Bekleyen SGK Alacağı"
              value={`₺${(financeData?.sgkVault || 0).toLocaleString('tr-TR')}`}
              trend="Kurum" trendUp={true}
           />
        </div>

        {/* CHARTS ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-white/60 backdrop-blur-3xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] p-6 lg:p-8 flex flex-col">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500"/>
              Haftalık Cirolar Analizi (Nakit vs SGK)
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={financeData?.weeklyRevenue || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)"/>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 700}}/>
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 700}}/>
                  <Tooltip wrapperClassName="rounded-xl shadow-xl font-bold border-none" />
                  <Area type="monotone" dataKey="ciro" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" name="Günlük Ciro" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Alerts & Pie Chart */}
          <div className="flex flex-col gap-6">
            <div className="bg-white/60 backdrop-blur-3xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] p-6 flex flex-col">
              <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                 <Wallet className="w-5 h-5 text-indigo-500"/>
                 Tahsilat Dağılımı
              </h3>
              <div className="h-[200px] w-full mt-2 relative">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={finalPieData}
                      cx="50%" cy="50%"
                      innerRadius={60} outerRadius={80}
                      paddingAngle={5}
                      dataKey="value" stroke="none"
                    >
                      {finalPieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip wrapperClassName="rounded-xl shadow-xl border-none font-bold" />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text for Pie Chart */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-lg font-black text-slate-800">Ciro</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Dağılımı</span>
                </div>
              </div>
              <div className="flex justify-center flex-wrap gap-4 mt-2">
                 {revenueChartData.map((t, idx) => (
                    <div key={t.name} className="flex items-center gap-1.5">
                       <span className="w-3 h-3 rounded-full shadow-sm" style={{backgroundColor: COLORS[idx % COLORS.length]}}></span>
                       <span className="text-[10px] font-black text-slate-600 uppercase tracking-wide">{t.name}</span>
                    </div>
                 ))}
                 {revenueChartData.length === 0 && <span className="text-[10px] font-bold text-slate-400">Henüz satış yapılmadı.</span>}
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur-3xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] p-6 flex-1 flex flex-col">
              <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-widest">
                 <Bell className="w-4 h-4 text-rose-500"/>
                 Stok Uyarıları
              </h3>
              <div className="flex flex-col gap-3 overflow-y-auto max-h-[160px] pr-2">
                 {isLoading && <p className="text-xs text-slate-500 font-bold">Uyarılar yükleniyor...</p>}
                 {!isLoading && alerts.length === 0 && (
                     <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl text-xs font-bold text-center">Tüm stoklarınız güvende! Hiçbir ürün bitmek üzere değil.</div>
                 )}
                 {!isLoading && alerts.map(alert => (
                    <div key={alert.id} className="p-3 bg-white/80 border border-white shadow-sm rounded-2xl flex gap-3 items-start hover:shadow-md transition-shadow cursor-default">
                       {alert.type === 'warning' ? <Package className="w-5 h-5 text-amber-500 mt-0.5 shrink-0"/> : 
                        alert.type === 'danger' ? <AlertTriangle className="w-5 h-5 text-rose-500 mt-0.5 shrink-0"/> :
                        <Clock className="w-5 h-5 text-blue-500 mt-0.5 shrink-0"/>
                       }
                       <p className="text-xs font-bold text-slate-700 leading-relaxed">{alert.msg}</p>
                    </div>
                 ))}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

function MetricCard({ icon, title, value, trend, trendUp }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/60 backdrop-blur-3xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[2rem] p-6 flex flex-col relative overflow-hidden group hover:bg-white/80 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 bg-white border border-white shadow-sm rounded-2xl flex items-center justify-center">
          {icon}
        </div>
        <div className={`px-2.5 py-1 rounded-lg border text-[10px] font-black tracking-widest shadow-sm ${trendUp ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
          {trend}
        </div>
      </div>
      <div>
        <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-2xl font-black text-slate-800 tracking-tight">{value}</h3>
      </div>
    </motion.div>
  );
}
