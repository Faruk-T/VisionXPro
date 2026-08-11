import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  TrendingUp, 
  Users, 
  AlertCircle, 
  Activity,
  ArrowRight,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../../lib/api';

export default function CorporateDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const result = await api.get('/corporate/dashboard');
        setData(result);
      } catch (error) {
        console.error('Failed to fetch corporate dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400 font-bold">
        Yükleniyor...
      </div>
    );
  }

  // Get max branch revenue for scaling
  const maxRevenue = data?.branches?.reduce((max: number, b: any) => b.revenue > max ? b.revenue : max, 0) || 1;

  // Chart data using the branches list
  const chartData = data?.branches?.map((b: any) => ({
    name: b.branchName.split(' ')[0], // Short name
    satis: b.revenue
  })) || [];

  return (
    <div className="h-full flex flex-col gap-8">
       {/* Header */}
       <div>
         <h1 className="text-3xl font-black text-slate-800 tracking-tight">Kurumsal Özet</h1>
         <p className="text-slate-500 font-medium mt-1">Tüm şubelerinizin (mağazalarınızın) anlık durumu ve birleştirilmiş raporları.</p>
       </div>

       {/* Top Stats */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Toplam Şube Sayısı" 
            value={data?.totalBranches?.toString() || "0"} 
            subtitle="Aktif çalışan mağazalarınız"
            icon={<Building2 className="w-6 h-6 text-indigo-600" />}
            color="bg-indigo-50 border-indigo-100"
          />
          <StatCard 
            title="Toplam Ciro" 
            value={`₺${(data?.totalRevenue || 0).toLocaleString('tr-TR')}`} 
            subtitle="Tüm zamanlar toplam tahsilat"
            icon={<TrendingUp className="w-6 h-6 text-emerald-600" />}
            color="bg-emerald-50 border-emerald-100"
          />
          <StatCard 
            title="Toplam Müşteri" 
            value={data?.totalCustomers?.toString() || "0"} 
            subtitle="Kayıtlı müşteri sayısı"
            icon={<Users className="w-6 h-6 text-blue-600" />}
            color="bg-blue-50 border-blue-100"
          />
          <StatCard 
            title="Toplam Stok Hacmi" 
            value={data?.totalStock?.toString() || "0"} 
            subtitle="Şubelerdeki toplam ürün adedi"
            icon={<AlertCircle className="w-6 h-6 text-rose-600" />}
            color="bg-rose-50 border-rose-100"
          />
       </div>

       <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 flex-1">
          {/* Chart Section */}
          <div className="xl:col-span-2 bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm flex flex-col">
             <div className="flex justify-between items-center mb-8">
               <div>
                 <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Activity className="w-5 h-5 text-indigo-500"/> Şube Satış Kıyaslaması</h2>
                 <p className="text-sm font-bold text-slate-500">Şubelerinizin toplam ciro dağılımı.</p>
               </div>
             </div>
             <div className="flex-1 min-h-[300px]">
                {chartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400">
                     Satış verisi bulunmuyor.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 700}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 700}} dx={-10} tickFormatter={(value) => `₺${value}`} />
                      <Tooltip cursor={{fill: '#F1F5F9'}} contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold', color: '#1E293B'}} />
                      <Bar dataKey="satis" fill="#6366F1" radius={[8, 8, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
             </div>
          </div>

          {/* Branch Performance */}
          <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm flex flex-col">
             <h2 className="text-xl font-black text-slate-800 mb-2">Şube Performansları</h2>
             <p className="text-sm font-bold text-slate-500 mb-6">Şubelerin ciro oranları</p>

             <div className="space-y-6 flex-1 overflow-y-auto max-h-[350px] pr-2">
                {data?.branches?.length === 0 ? (
                   <div className="text-center text-slate-400 py-8">Kayıtlı şube bulunamadı.</div>
                ) : (
                  data?.branches?.map((b: any) => (
                    <BranchRow 
                      key={b.branchId} 
                      name={b.branchName} 
                      sales={`₺${b.revenue.toLocaleString('tr-TR')}`} 
                      percent={Math.round((b.revenue / maxRevenue) * 100)} 
                      color="bg-indigo-500" 
                    />
                  ))
                )}
             </div>

             <button className="mt-8 w-full py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 border border-slate-200">
               Tüm Şube Raporları <ArrowRight className="w-4 h-4" />
             </button>
          </div>
       </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, color }: any) {
  return (
    <motion.div whileHover={{ y: -5 }} className={`p-6 rounded-[2rem] border ${color} relative overflow-hidden group`}>
       <div className="flex justify-between items-start mb-4 relative z-10">
         <div className={`p-3 bg-white/60 backdrop-blur-sm rounded-xl shadow-sm border border-white/80`}>
           {icon}
         </div>
       </div>
       <div className="relative z-10">
         <h3 className="text-3xl font-black text-slate-800 mb-1 tracking-tight">{value}</h3>
         <p className="text-sm font-bold text-slate-700 mb-1">{title}</p>
         <p className="text-xs font-semibold text-slate-500">{subtitle}</p>
       </div>
    </motion.div>
  );
}

function BranchRow({ name, sales, percent, color }: any) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
           <Building2 className="w-4 h-4 text-slate-400"/> {name}
        </span>
        <span className="font-black text-slate-900">{sales}</span>
      </div>
      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }} 
          animate={{ width: `${percent}%` }} 
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full ${color} rounded-full`}
        />
      </div>
    </div>
  );
}
