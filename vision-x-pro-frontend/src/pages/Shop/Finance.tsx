import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, TrendingUp, ArrowUpRight, 
  ArrowDownRight, CreditCard, Banknote, Download,
  PieChart as PieChartIcon, RefreshCw, X, Activity, Landmark
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function Finance() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [showChartModal, setShowChartModal] = useState(false);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5069/api/orders/finance', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setData(await res.json());
      } else {
        toast.error("Finans verileri alınamadı.");
      }
    } catch (err) {
      toast.error("Sunucuya bağlanılamadı.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0);
  };

  const btnTap = { scale: 0.95 };

  if (loading) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center bg-slate-50 gap-4">
        <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
        <span className="text-slate-500 font-medium tracking-wider animate-pulse">Kasa verileri derleniyor...</span>
      </div>
    );
  }

  const { cashVault = 0, cardVault = 0, transferVault = 0, totalRevenue = 0, averageCart = 0, recentTransactions = [], weeklyRevenue = [] } = data || {};

  // For the chart modal, reverse the array if backend sends it newest first, but backend sent it oldest first since we loop 6 down to 0. Wait, backend loops `i = 6 down to 0` with `date.AddDays(-i)`, so it's oldest first. Perfect.

  return (
    <div className="font-sans min-h-full p-6 lg:p-10 relative overflow-hidden bg-slate-50">
      <Toaster position="top-right" />
      
      {/* Dynamic Backgrounds */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-gradient-to-br from-indigo-200/50 to-blue-200/30 rounded-full blur-[140px] mix-blend-multiply"></div>
        <div className="absolute bottom-[0%] -right-[10%] w-[60%] h-[60%] bg-gradient-to-tl from-emerald-200/30 to-teal-200/30 rounded-full blur-[120px] mix-blend-multiply"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-[1600px] h-full flex flex-col gap-10">
        
        {/* Header Ribbon */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center backdrop-blur-xl bg-white/70 p-6 rounded-[2rem] shadow-sm border border-white ring-1 ring-slate-900/5">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center justify-center px-3 py-1 mb-1.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-extrabold tracking-widest uppercase border border-indigo-100">
                Resmi Mali Tablo
              </div>
              <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 tracking-tight">Finansal Merkez</h2>
            </div>
          </div>
          
          <div className="flex gap-4">
             <motion.button onClick={() => setShowChartModal(true)} whileHover={{ scale: 1.05 }} whileTap={btnTap} className="flex items-center gap-2 px-6 py-3 bg-white shadow-sm shadow-slate-200/50 rounded-2xl text-sm font-bold text-slate-700 border border-slate-200 hover:border-slate-300 transition-all hover:bg-slate-50">
               <Activity className="w-4 h-4 text-indigo-500" /> Ciro Analizi
             </motion.button>
             <motion.button onClick={() => setShowTransactionsModal(true)} whileHover={{ scale: 1.05 }} whileTap={btnTap} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-800 to-slate-900 shadow-lg shadow-slate-900/20 rounded-2xl text-sm font-bold text-white hover:shadow-xl hover:shadow-slate-900/30 transition-all">
               <ArrowDownRight className="w-4 h-4" /> Tüm Hareketler
             </motion.button>
          </div>
        </motion.div>

        {/* Global KPI Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="col-span-1 lg:col-span-2 bg-gradient-to-br from-indigo-600 via-blue-700 to-indigo-800 rounded-[2.5rem] p-10 shadow-2xl shadow-indigo-500/20 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div>
                  <p className="text-indigo-200 font-bold uppercase tracking-widest text-xs mb-2">Merkez Kasa Toplam Ciro</p>
                  <h3 className="text-6xl font-black tracking-tighter drop-shadow-md">{formatCurrency(totalRevenue)}</h3>
                </div>
                <div className="mt-8 flex items-center gap-4">
                  <span className="px-4 py-2 bg-white/10 rounded-xl text-sm font-bold flex items-center gap-2 backdrop-blur-md border border-white/20">
                    <TrendingUp className="w-4 h-4 text-emerald-300"/> Sağlıklı Büyüme
                  </span>
                  <span className="text-xs font-semibold text-indigo-200">Güncel Veriler Yansıtıldı</span>
                </div>
              </div>
           </motion.div>

           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 border border-white ring-1 ring-slate-900/5 flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-purple-100">
                  <PieChartIcon className="w-7 h-7 text-purple-600" />
                </div>
                <p className="text-xs font-bold text-slate-400 border-b border-dashed border-slate-200 pb-2 mb-3 uppercase tracking-widest">Sepet Ortalaması</p>
                <h3 className="text-4xl font-black text-slate-800 tracking-tight">{formatCurrency(averageCart)}</h3>
              </div>
              <p className="text-sm font-semibold text-slate-500 mt-4">Müşteri başına ortalama kazanç.</p>
           </motion.div>
        </div>

        {/* VAULTS / KASALAR */}
        <div>
          <h3 className="text-xl font-extrabold text-slate-800 mb-6 flex items-center gap-3">
             <Landmark className="w-6 h-6 text-emerald-600" /> Aktif Kasalar & Bakiyeler
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             <VaultCard 
               delay={0.3} title="Fiziksel Nakit Kasa" value={cashVault} 
               icon={<Banknote className="w-8 h-8 text-emerald-600" />} 
               bg="bg-gradient-to-br from-emerald-50 to-green-100" 
               borderColor="border-emerald-200" 
               textColor="text-emerald-900" 
             />
             <VaultCard 
               delay={0.4} title="Kredi Kartı (POS) Bloke" value={cardVault} 
               icon={<CreditCard className="w-8 h-8 text-blue-600" />} 
               bg="bg-gradient-to-br from-blue-50 to-indigo-100" 
               borderColor="border-blue-200" 
               textColor="text-blue-900" 
             />
             <VaultCard 
               delay={0.5} title="Banka Havale / EFT" value={transferVault} 
               icon={<Landmark className="w-8 h-8 text-purple-600" />} 
               bg="bg-gradient-to-br from-purple-50 to-fuchsia-100" 
               borderColor="border-purple-200" 
               textColor="text-purple-900" 
             />
          </div>
        </div>

      </div>

      {/* ----------------- MODALS ----------------- */}
      <AnimatePresence>
        
        {/* RECENT TRANSACTIONS MODAL */}
        {showTransactionsModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 print:hidden">
            <motion.div initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 30 }} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-100">
               <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Son Hareketler</h2>
                    <p className="text-sm font-semibold text-slate-500 mt-1">İşletmenizin en son gerçekleşen tüm finansal akışı.</p>
                  </div>
                  <button onClick={() => setShowTransactionsModal(false)} className="text-slate-400 hover:text-slate-700 bg-white shadow-sm p-3 rounded-2xl border border-slate-200 transition-colors"><X className="w-5 h-5"/></button>
               </div>
               <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-white space-y-4">
                  {recentTransactions.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 font-medium">Henüz bir hareket bulunmuyor.</div>
                  ) : recentTransactions.map((tx:any) => (
                    <div key={tx.id} className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center justify-between hover:shadow-md hover:border-indigo-100 transition-all group">
                       <div className="flex items-center gap-5">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                             {tx.type === 'income' ? <ArrowDownRight className="w-7 h-7"/> : <ArrowUpRight className="w-7 h-7"/>}
                          </div>
                          <div>
                             <h4 className="font-bold text-slate-800 text-lg group-hover:text-indigo-700 transition-colors">{tx.desc}</h4>
                             <p className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1.5 uppercase tracking-widest">
                                {tx.method === 'Nakit' ? <Banknote className="w-3.5 h-3.5"/> : <CreditCard className="w-3.5 h-3.5"/>} {tx.method} • <span className="text-slate-300">|</span> {tx.time}
                             </p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className={`text-xl font-black tracking-tight ${tx.type === 'income' ? 'text-emerald-500' : 'text-slate-800'}`}>
                             {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </p>
                       </div>
                    </div>
                  ))}
               </div>
               <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                  <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 shadow-sm rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors">
                     <Download className="w-4 h-4"/> Excel'e Aktar
                  </button>
               </div>
            </motion.div>
          </motion.div>
        )}

        {/* CHART / REVENUE ANALYSIS MODAL */}
        {showChartModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 print:hidden">
            <motion.div initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 30 }} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col border border-slate-100">
               <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-indigo-900 to-slate-900">
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Haftalık Ciro Analizi</h2>
                    <p className="text-sm font-semibold text-indigo-200 mt-1">Son 7 günün Satış Tahsilatı grafiği.</p>
                  </div>
                  <button onClick={() => setShowChartModal(false)} className="text-white bg-white/10 hover:bg-white/20 shadow-inner p-3 rounded-2xl border border-white/10 transition-colors"><X className="w-5 h-5"/></button>
               </div>
               <div className="p-8 bg-white h-[400px]">
                 {weeklyRevenue.length > 0 ? (
                    <div className="w-full h-full relative flex items-end justify-between px-4 pb-8 pt-4">
                       {weeklyRevenue.map((item: any, i: number) => {
                          const max = Math.max(...weeklyRevenue.map((d: any) => d.ciro), 1);
                          const height = `${(item.ciro / max) * 100}%`;
                          return (
                            <div key={i} className="relative flex flex-col items-center group w-1/8 h-full justify-end">
                               {/* Value Tooltip */}
                               <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-xl pointer-events-none whitespace-nowrap z-20">
                                  {formatCurrency(item.ciro)}
                                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                               </div>
                               
                               {/* Bar Graph */}
                               <motion.div initial={{ height: 0 }} animate={{ height }} transition={{ duration: 0.8, delay: i * 0.1, type: "spring" }} className="w-full max-w-[40px] bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-xl shadow-[0_0_15px_rgba(99,102,241,0.4)] relative">
                                  <div className="absolute top-0 left-0 w-full h-full bg-white/20 rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                               </motion.div>
                               
                               {/* Label */}
                               <span className="absolute -bottom-8 text-xs font-bold text-slate-500 mt-4 whitespace-nowrap">{item.name}</span>
                            </div>
                          )
                       })}
                       {/* Grid Lines */}
                       <div className="absolute top-0 left-0 w-full h-full border-t border-b border-slate-100 pointer-events-none flex flex-col justify-between z-0 opacity-50">
                          <div className="border-b border-dashed border-slate-200 w-full h-1/4"></div>
                          <div className="border-b border-dashed border-slate-200 w-full h-1/4"></div>
                          <div className="border-b border-dashed border-slate-200 w-full h-1/4"></div>
                       </div>
                    </div>
                 ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">Yeterli veri yok.</div>
                 )}
               </div>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

function VaultCard({ delay, title, value, icon, bg, borderColor, textColor }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className={`${bg} border ${borderColor} rounded-[2rem] p-8 relative overflow-hidden group shadow-lg shadow-slate-200/50`}>
      <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/40 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
      <div className="relative z-10">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-white/50 mb-6 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <p className={`text-[11px] font-extrabold uppercase tracking-widest mb-1 opacity-70 ${textColor}`}>{title}</p>
        <h3 className={`text-4xl font-black tracking-tight ${textColor}`}>
          {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value || 0)}
        </h3>
      </div>
    </motion.div>
  );
}
