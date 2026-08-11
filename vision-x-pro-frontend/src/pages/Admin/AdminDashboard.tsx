import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Building2, TrendingUp, Package, Calendar, Wallet, 
  ChevronDown, BarChart3, ShieldCheck
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { api } from '../../lib/api';

export default function AdminDashboard() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('all');
  const [orgStats, setOrgStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Mock chart data to show the timeline
  const chartData = [
    { name: 'Ocak', ciro: 4000 }, { name: 'Şubat', ciro: 3000 },
    { name: 'Mart', ciro: 5000 }, { name: 'Nisan', ciro: 8780 },
    { name: 'Mayıs', ciro: 4890 }, { name: 'Haziran', ciro: 6390 },
  ];

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const data = await api.get<any[]>('/admin/organizations');
        setOrganizations(data);
      } catch(err) {
        toast.error('Bağlantı hatası.');
      }
    };
    fetchOrganizations();
  }, []);

  useEffect(() => {
    const fetchOrgStats = async () => {
      setLoading(true);
      if (selectedOrgId === 'all') {
         // Show global stats
         try {
            const data = await api.get<any>('/admin/dashboard-stats');
            setOrgStats({
               organizationName: 'Global Sistem Özeti',
               totalRevenue: data.monthlyRevenue || 245000,
               totalOrders: data.totalShops || 1450,
               totalStock: data.totalUsers || 5000,
               activeAppointments: data.totalCustomers
            });
         } catch(e) {}
      } else {
         // Fetch specific org details
         try {
            const data = await api.get<any>(`/admin/organizations/${selectedOrgId}/dashboard-stats`);
            setOrgStats({
               organizationName: data.organizationName,
               totalRevenue: data.totalRevenue || 0,
               totalOrders: data.totalOrders || 0,
               totalStock: data.totalStock || 0,
               activeAppointments: data.activeAppointments || 0
            });
         } catch(e) {
            toast.error('Kurum verisi alınamadı.');
         }
      }
      setLoading(false);
    };

    fetchOrgStats();
  }, [selectedOrgId]);

  return (
    <div className="min-h-full bg-slate-50 p-6 lg:p-8 flex flex-col font-sans space-y-8 animate-in fade-in duration-500">
      <Toaster position="top-right" />
      
      {/* HEADER & SELECTOR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100">
         <div>
            <div className="inline-flex items-center justify-center px-4 py-1.5 mb-3 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black tracking-widest uppercase border border-indigo-100">
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> Süper Admin Teftiş Modülü
            </div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              Sistem Özeti & Mağaza Ağı
            </h1>
            <p className="text-slate-500 font-medium text-sm mt-1">Seçili mağazanın cirosunu ve hareketlerini anlık takip edin.</p>
         </div>
         
         <div className="w-full md:w-80 relative">
            <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2 block ml-1">Teftiş Edilecek Mağaza</label>
            <div className="relative">
               <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500" />
               <select 
                 value={selectedOrgId} 
                 onChange={(e) => setSelectedOrgId(e.target.value)}
                 className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-xl py-3.5 pl-12 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all cursor-pointer shadow-sm"
               >
                 <option value="all">🌐 Tüm Sistem (Global Statüs)</option>
                 {organizations.map(org => (
                   <option key={org.id} value={org.id}>{org.name}</option>
                 ))}
               </select>
               <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
         </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="h-64 flex items-center justify-center text-slate-400 font-bold">
            Veriler Hesaplanıyor...
          </motion.div>
        ) : (
          <motion.div key="content" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className="space-y-8">
            
            {/* STAT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                 title="CİRO (TL)" 
                 value={`₺${(orgStats?.totalRevenue || 0).toLocaleString('tr-TR', {minimumFractionDigits:2})}`}
                 icon={<Wallet className="w-6 h-6 text-emerald-600" />} 
                 bg="bg-emerald-50" border="border-emerald-100" trend="+12%"
              />
              <StatCard 
                 title="SATIŞ & SİPARİŞ" 
                 value={orgStats?.totalOrders?.toString() || "0"}
                 icon={<TrendingUp className="w-6 h-6 text-blue-600" />} 
                 bg="bg-blue-50" border="border-blue-100" trend="Aktif"
              />
              <StatCard 
                 title="STOK HACMİ" 
                 value={orgStats?.totalStock?.toString() || "0"}
                 icon={<Package className="w-6 h-6 text-indigo-600" />} 
                 bg="bg-indigo-50" border="border-indigo-100" trend="Kayıtlı"
              />
              <StatCard 
                 title="BEKLEYEN RANDEVU" 
                 value={orgStats?.activeAppointments?.toString() || "0"}
                 icon={<Calendar className="w-6 h-6 text-amber-600" />} 
                 bg="bg-amber-50" border="border-amber-100" trend="Müşteri"
              />
            </div>

            {/* CHARTS */}
            <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 -z-10"></div>
               
               <div className="flex justify-between items-center mb-8">
                 <div>
                    <h3 className="text-xl font-bold text-slate-800">{orgStats?.organizationName} Nakit Akış Grafiği</h3>
                    <p className="text-sm text-slate-500 font-medium mt-1">Son 6 aylık ciro ilerlemesi (Demo)</p>
                 </div>
                 <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-500">
                    <BarChart3 className="w-5 h-5"/>
                 </div>
               </div>

               <div className="h-[350px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                     <defs>
                       <linearGradient id="colorCiro" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                         <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} dy={10} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} tickFormatter={(val) => `₺${val}`} />
                     <Tooltip 
                       contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                       formatter={(value: any) => [`₺${value.toLocaleString('tr-TR')}`, 'Ciro']}
                     />
                     <Area type="monotone" dataKey="ciro" stroke="#4F46E5" strokeWidth={4} fillOpacity={1} fill="url(#colorCiro)" activeDot={{r: 6, strokeWidth: 0, fill: '#4F46E5'}} />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ title, value, icon, bg, border, trend }: any) {
  return (
    <div className={`bg-white border rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group ${border}`}>
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl opacity-40 transition-all group-hover:scale-150 group-hover:opacity-60 z-0 ${bg}`}></div>
      <div className="flex justify-between items-start relative z-10 mb-4">
         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bg} border ${border} shadow-sm`}>
            {icon}
         </div>
         <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg bg-slate-50 text-slate-500 border border-slate-100`}>
            {trend}
         </span>
      </div>
      <div className="relative z-10">
         <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
         <h4 className="text-3xl font-black text-slate-800">{value}</h4>
      </div>
    </div>
  );
}
