import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Search, Filter, Mail, Phone, MapPin, 
  CalendarDays, Glasses, FileText, Gift, ChevronRight,
  UserPlus, Plus, Activity, Star, Eye, Calendar, User, X, Printer,
  Save, AlertCircle
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import api from '../../lib/api';

const segmentConfig: any = {
  'VIP': { color: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200', icon: Star },
  'Standart': { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: User },
  'Riskli': { color: 'bg-rose-100 text-rose-700 border-rose-200', icon: Activity },
};

/** Web randevusu veya randevu kanalından gelen kayıtlar (mağaza CRM'inden ayrılsın diye). */
function isRandevuluSource(source?: string) {
  const s = (source || '').toLowerCase();
  return s === 'randevu' || s === 'randevulu' || s.startsWith('randevu');
}

function customerCreatedAtMs(c: any): number {
  if (c?.createdAt) {
    const t = new Date(c.createdAt).getTime();
    if (!Number.isNaN(t)) return t;
  }
  return 0;
}

const SOURCE_TABS = [
  { key: 'Tümü', label: 'Tümü' },
  { key: 'Randevulu', label: 'Randevulu müşteriler' },
  { key: 'Mağaza', label: 'Mağaza müşterileri' },
] as const;

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [activeSource, setActiveSource] = useState<(typeof SOURCE_TABS)[number]['key']>('Tümü');
  const [segmentFilter, setSegmentFilter] = useState('Tümü');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortOption, setSortOption] = useState('newest'); // newest, oldest, highest_spent

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', address: '', segment: 'Standart', source: 'Manuel' });
  const [loading, setLoading] = useState(true);

  // Reçete Ekleme Modalı State
  const [isRxModalOpen, setIsRxModalOpen] = useState(false);
  const [compareRxIds, setCompareRxIds] = useState<string[]>([]);
  const [newRx, setNewRx] = useState({
    type: 'Optik', // Optik veya Lens
    doctor: '', clinic: '',
    rSph: '', rCyl: '', rAxs: '',
    lSph: '', lCyl: '', lAxs: ''
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await api.get('/customers');
      setCustomers(data);
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    setCompareRxIds([]);
  }, [selectedCustomer?.id]);

  useEffect(() => {
    if (!isFilterOpen) return;
    const close = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [isFilterOpen]);

  let filtered = customers.filter(c => {
    if (activeSource === 'Randevulu' && !isRandevuluSource(c.source)) return false;
    if (activeSource === 'Mağaza' && isRandevuluSource(c.source)) return false;
    if (segmentFilter !== 'Tümü' && c.status !== segmentFilter) return false;
    const q = search.trim().toLowerCase();
    if (q && !c.name?.toLowerCase().includes(q) && !String(c.phone || '').includes(search.trim())) return false;
    return true;
  });

  if (sortOption === 'highest_spent') {
    filtered = [...filtered].sort((a, b) => b.totalSpent - a.totalSpent);
  } else if (sortOption === 'oldest') {
    filtered = [...filtered].sort((a, b) => customerCreatedAtMs(a) - customerCreatedAtMs(b));
  } else {
    filtered = [...filtered].sort((a, b) => customerCreatedAtMs(b) - customerCreatedAtMs(a));
  }

  return (
    <div className="min-h-full bg-slate-50/50 flex flex-col pt-4 relative">
      <Toaster position="top-right" />
      
      {/* HEADER & FILTERS */}
      <div className="px-6 lg:px-10 mb-8">
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                <Users className="w-8 h-8 text-indigo-600" />
                {activeSource === 'Randevulu' ? 'Randevulu Müşteriler' : activeSource === 'Mağaza' ? 'Mağaza Müşterileri' : 'Müşteri Yönetimi'}
              </h1>
              <p className="text-slate-500 font-medium mt-1">
                <span className="font-bold text-slate-600">Randevulu müşteriler</span> ile <span className="font-bold text-slate-600">mağaza kayıtlarını</span> üstteki sekmelerden ayırın; arama ve gelişmiş filtre ile daraltın.
              </p>
            </div>
            <div className="flex gap-3 relative" ref={filterRef}>
               <button
                 type="button"
                 className={`px-5 py-3 rounded-2xl text-sm font-bold border shadow-sm transition-colors flex items-center gap-2 ${isFilterOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-800' : 'text-slate-600 bg-white border-slate-200 hover:bg-slate-50'}`}
                 onClick={() => setIsFilterOpen(!isFilterOpen)}
               >
                 <Filter className="w-4 h-4"/> Gelişmiş Filtre
               </button>

               <AnimatePresence>
                 {isFilterOpen && (
                   <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-14 right-0 bg-white rounded-xl shadow-xl border border-slate-200 p-4 w-72 z-[100]">
                      
                      <h4 className="font-bold text-slate-800 mb-3 text-sm">Sıralama Ölçütü</h4>
                      <div className="space-y-2 mb-4 pb-4 border-b border-slate-100">
                         <label className="flex items-center gap-2 text-sm text-slate-600 font-medium cursor-pointer p-2 hover:bg-slate-50 rounded-lg">
                           <input type="radio" name="sort" checked={sortOption==='newest'} onChange={() => setSortOption('newest')} className="text-indigo-600 focus:ring-indigo-500" /> En Yeni Kayıtlar
                         </label>
                         <label className="flex items-center gap-2 text-sm text-slate-600 font-medium cursor-pointer p-2 hover:bg-slate-50 rounded-lg">
                           <input type="radio" name="sort" checked={sortOption==='oldest'} onChange={() => setSortOption('oldest')} className="text-indigo-600 focus:ring-indigo-500" /> En Eski Kayıtlar
                         </label>
                         <label className="flex items-center gap-2 text-sm text-slate-600 font-medium cursor-pointer p-2 hover:bg-slate-50 rounded-lg">
                           <input type="radio" name="sort" checked={sortOption==='highest_spent'} onChange={() => setSortOption('highest_spent')} className="text-indigo-600 focus:ring-indigo-500" /> Ciroya Göre (Azalan)
                         </label>
                      </div>

                      <h4 className="font-bold text-slate-800 mb-3 text-sm">Müşteri Tipi</h4>
                      <div className="space-y-2">
                         <label className="flex items-center gap-2 text-sm text-slate-600 font-medium cursor-pointer p-2 hover:bg-slate-50 rounded-lg">
                           <input type="radio" name="segment" checked={segmentFilter==='Tümü'} onChange={() => setSegmentFilter('Tümü')} className="text-indigo-600 focus:ring-indigo-500" /> Tüm Müşteriler
                         </label>
                         <label className="flex items-center gap-2 text-sm text-slate-600 font-medium cursor-pointer p-2 hover:bg-slate-50 rounded-lg">
                           <input type="radio" name="segment" checked={segmentFilter==='VIP'} onChange={() => setSegmentFilter('VIP')} className="text-indigo-600 focus:ring-indigo-500" /> Sadece VIP
                         </label>
                         <label className="flex items-center gap-2 text-sm text-slate-600 font-medium cursor-pointer p-2 hover:bg-slate-50 rounded-lg">
                           <input type="radio" name="segment" checked={segmentFilter==='Standart'} onChange={() => setSegmentFilter('Standart')} className="text-indigo-600 focus:ring-indigo-500" /> Standart
                         </label>
                      </div>
                   </motion.div>
                 )}
               </AnimatePresence>

               <button type="button" onClick={() => setIsAddModalOpen(true)} className="px-5 py-3 rounded-2xl text-sm font-bold text-white bg-indigo-600 shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors flex items-center gap-2">
                 <UserPlus className="w-4 h-4"/> Yeni Kayıt
               </button>
            </div>
         </div>

         <div className="flex flex-col md:flex-row gap-4">
            <div className="flex bg-white py-1.5 px-1.5 border border-slate-200 rounded-2xl shadow-sm overflow-x-auto scrollbar-hide shrink-0">
               {SOURCE_TABS.map(({ key, label }) => (
                 <button 
                  type="button"
                  key={key}
                  onClick={() => setActiveSource(key)}
                  className={`px-5 py-2 whitespace-nowrap rounded-xl text-sm font-bold transition-all ${activeSource === key ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
                 >
                   {label}
                 </button>
               ))}
            </div>
            <div className="flex-1 relative group w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="text" 
                placeholder="İsim, TC Kimlik veya Telefon Numarası Ara (Örn: 0532...)" 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-full bg-white border border-slate-200 py-3 pl-12 pr-4 text-sm font-medium rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
              />
            </div>
         </div>
      </div>

      {/* CUSTOMER LISTING (TABLE / CARDS) */}
      <div className="flex-1 overflow-x-hidden overflow-y-auto px-6 lg:px-10 pb-10">
         <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
               {loading ? (
                 <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
                    <span className="text-lg font-bold text-slate-500 animate-pulse">Müşteriler yükleniyor...</span>
                 </div>
               ) : filtered.length === 0 ? (
                 <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
                    <Users className="w-16 h-16 mb-4 text-slate-300" />
                    <p className="text-lg font-bold text-slate-500">Müşteri kaydı bulunamadı.</p>
                 </div>
               ) : filtered.map((c: any, i: number) => {
                 const SegIcon = segmentConfig[c.status]?.icon || segmentConfig['Standart'].icon;
                 return (
                   <motion.div 
                     layout
                     initial={{ opacity: 0, scale: 0.95, y: 20 }}
                     animate={{ opacity: 1, scale: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.95 }}
                     transition={{ duration: 0.3, delay: i * 0.05 }}
                     key={c.id} 
                     onClick={() => setSelectedCustomer(c)}
                     className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-indigo-200 transition-all cursor-pointer group flex flex-col relative overflow-hidden"
                   >
                     {/* CRM Decorator */}
                     <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-50 to-transparent -z-10 rounded-bl-full"></div>
                     
                     <div className="flex justify-between items-start mb-5">
                       <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xl border border-slate-200 shadow-inner group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                           {c.name.charAt(0)}
                         </div>
                         <div>
                           <h3 className="text-lg font-black text-slate-800">{c.name}</h3>
                           <span className={`mt-1 inline-block text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${isRandevuluSource(c.source) ? 'bg-amber-50 text-amber-900 border-amber-200' : 'bg-emerald-50 text-emerald-900 border-emerald-200'}`}>
                             {isRandevuluSource(c.source) ? 'Randevulu kayıt' : 'Mağaza kaydı'}
                           </span>
                         </div>
                       </div>
                        <div className={`px-2.5 py-1.5 rounded-xl border flex items-center justify-center ${segmentConfig[c.status]?.color || segmentConfig['Standart'].color}`}>
                          {SegIcon && <SegIcon className="w-4 h-4" />}
                        </div>
                     </div>

                     <div className="space-y-3 mb-6">
                       <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                         <Phone className="w-4 h-4 text-slate-400" /> {c.phone}
                       </div>
                       <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                         <CalendarDays className="w-4 h-4 text-slate-400" /> Son Ziyaret: <span className="font-bold">{c.lastVisit}</span>
                       </div>
                       <div className="flex items-center gap-3 text-sm font-medium text-indigo-600">
                         <Gift className="w-4 h-4 text-indigo-400" /> Yaşam Boyu Ciro: <span className="font-extrabold text-indigo-700">₺{c.totalSpent.toLocaleString('tr-TR')}</span>
                       </div>
                     </div>

                     <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                        <div className="flex gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); toast.loading('WhatsApp yönlendiriliyor...', {duration: 2000}); }}
                            className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-green-600 hover:bg-green-50 transition-colors tooltip text-xs font-bold" aria-label="WhatsApp / SMS"
                          >
                            <Phone className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); toast.success('E-Posta taslağı hazır.'); }}
                            className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors tooltip" aria-label="E-Posta"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-sm font-bold text-indigo-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Profili İncele <ChevronRight className="w-4 h-4" />
                        </div>
                     </div>
                   </motion.div>
                 );
               })}
            </AnimatePresence>
         </div>
      </div>

      {/* CUSTOMER DETAIL PROFILE PANEL */}
      <AnimatePresence>
         {selectedCustomer && (
           <>
             {/* Backdrop */}
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setSelectedCustomer(null)}
               className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
             />
             
             {/* Panel */}
             <motion.div 
               initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="fixed top-0 right-0 w-full md:w-[650px] h-full bg-slate-50 shadow-2xl z-50 flex flex-col border-l border-slate-200/50"
             >
                {/* Header Profile */}
                <div className="p-8 lg:p-10 bg-slate-800 shrink-0 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -z-10 mix-blend-screen"></div>
                   
                   <div className="flex justify-between items-start">
                     <div className="flex items-center gap-6">
                       <div className="w-20 h-20 rounded-[1.5rem] bg-slate-700 flex items-center justify-center text-white font-black text-3xl border border-white/10 shadow-xl">
                         {selectedCustomer.name.charAt(0)}
                       </div>
                       <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedCustomer.id}</span>
                            <span className={`px-2 py-0.5 rounded-md border text-[10px] font-extrabold uppercase ${
                              selectedCustomer.status === 'VIP' ? 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30' : 
                              selectedCustomer.status === 'Standart' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 
                              'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            }`}>
                              {selectedCustomer.status}
                            </span>
                          </div>
                          <h2 className="text-3xl font-black text-white tracking-tight">{selectedCustomer.name}</h2>
                          <div className="flex items-center gap-4 mt-3">
                             <span className="text-sm font-medium text-slate-300 flex items-center gap-1.5"><Phone className="w-4 h-4 text-slate-400"/> {selectedCustomer.phone}</span>
                             <span className="text-sm font-medium text-slate-300 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400"/> Harita</span>
                          </div>
                       </div>
                     </div>
                     <button onClick={() => setSelectedCustomer(null)} className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-2xl flex items-center justify-center transition-colors">
                       <X className="w-5 h-5" />
                     </button>
                   </div>
                </div>

                {/* Lifetime Stats */}
                <div className="px-8 lg:px-10 py-6 bg-slate-900 border-b border-white/5 flex gap-8 shrink-0">
                   <div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Yaşam Boyu Değer</p>
                     <p className="text-2xl font-black text-white mt-1">₺{selectedCustomer.totalSpent.toLocaleString('tr-TR')}</p>
                   </div>
                   <div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Son Ziyaret</p>
                     <p className="text-2xl font-black text-white mt-1">{selectedCustomer.lastVisit}</p>
                   </div>
                   <div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alışveriş Adedi</p>
                     <p className="text-2xl font-black text-white mt-1">{selectedCustomer.pastOrders.length}</p>
                   </div>
                </div>

                {/* Content Tabs area */}
                <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-10">
                   
                   {/* DİJİTAL OPTİK REÇETELERİ (RX) */}
                   <section>
                      <div className="flex justify-between items-center mb-5">
                         <h4 className="text-lg font-black text-slate-800 flex items-center gap-2">
                           <Eye className="w-5 h-5 text-indigo-600"/> Dijital Reçete(RX) Arşivi
                         </h4>
                         <button onClick={() => setIsRxModalOpen(true)} className="text-indigo-600 text-sm font-bold flex items-center gap-1 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-xl"><Plus className="w-4 h-4"/> Yeni Reçete Ekle</button>
                      </div>

                      {compareRxIds.length === 2 && (
                        <div className="mb-5 p-5 rounded-2xl bg-amber-50 border border-amber-200">
                          <p className="text-xs font-black text-amber-800 uppercase tracking-widest mb-3">Reçete Karşılaştırma</p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {compareRxIds.map(rid => {
                              const px = selectedCustomer.prescriptions.find((p: any) => p.id === rid);
                              if (!px) return null;
                              return (
                                <div key={rid} className="bg-white rounded-xl p-4 border border-amber-100">
                                  <p className="font-black text-slate-800 mb-1">{px.date}</p>
                                  <p className="text-xs text-slate-500 mb-2">{px.doctor}</p>
                                  <p className="text-[11px] font-bold text-slate-700">Sağ SPH {px.right?.sph ?? '-'} / Sol SPH {px.left?.sph ?? '-'}</p>
                                  <p className="text-[11px] font-bold text-slate-600 mt-1">CYL {px.right?.cyl ?? '-'} / {px.left?.cyl ?? '-'}</p>
                                </div>
                              );
                            })}
                          </div>
                          <button type="button" onClick={() => setCompareRxIds([])} className="mt-3 text-xs font-bold text-amber-700 hover:underline">Karşılaştırmayı temizle</button>
                        </div>
                      )}
                      
                      {selectedCustomer.prescriptions.length === 0 ? (
                        <div className="bg-white rounded-2xl p-8 border border-slate-200 border-dashed text-center text-slate-500 font-medium text-sm">
                           Bu müşteriye ait kayıtlı reçete bulunmuyor.
                        </div>
                      ) : selectedCustomer.prescriptions.map((px:any) => (
                        <div key={px.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 relative overflow-hidden group">
                           <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                           
                           <div className="flex justify-between items-start mb-4">
                              <div>
                                <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-1 rounded inline-block mb-1 border border-indigo-100">{px.id} • {px.date}</span>
                                <p className="text-sm font-bold text-slate-700">{px.doctor} / {px.clinic}</p>
                              </div>
                              <button onClick={() => toast('Reçete yazıcıya gönderildi.', {icon: '🖨️'})} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors">
                                <Printer className="w-4 h-4"/>
                              </button>
                              <button
                                type="button"
                                onClick={() => setCompareRxIds(prev => {
                                  if (prev.includes(px.id)) return prev.filter(x => x !== px.id);
                                  if (prev.length >= 2) return [prev[1], px.id];
                                  return [...prev, px.id];
                                })}
                                className={`ml-2 text-[10px] font-black uppercase px-2 py-1 rounded-lg border ${compareRxIds.includes(px.id) ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                              >
                                Karşılaştır
                              </button>
                           </div>

                           <div className="grid grid-cols-2 gap-4">
                              <div className="bg-slate-50 border border-slate-100 rounded-[1rem] p-4 text-center">
                                 <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-3">SAĞ GÖZ (OD)</p>
                                 <div className="flex justify-center gap-4">
                                    <div><span className="block text-[10px] text-slate-400 mb-0.5">SPH</span><span className="font-bold text-slate-800 text-sm">{px.right.sph || '-'}</span></div>
                                    <div><span className="block text-[10px] text-slate-400 mb-0.5">CYL</span><span className="font-bold text-slate-800 text-sm">{px.right.cyl || '-'}</span></div>
                                    <div><span className="block text-[10px] text-slate-400 mb-0.5">AXS</span><span className="font-bold text-slate-800 text-sm">{px.right.axis || '-'}</span></div>
                                 </div>
                              </div>
                              <div className="bg-slate-50 border border-slate-100 rounded-[1rem] p-4 text-center">
                                 <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-3">SOL GÖZ (OS)</p>
                                 <div className="flex justify-center gap-4">
                                    <div><span className="block text-[10px] text-slate-400 mb-0.5">SPH</span><span className="font-bold text-slate-800 text-sm">{px.left.sph || '-'}</span></div>
                                    <div><span className="block text-[10px] text-slate-400 mb-0.5">CYL</span><span className="font-bold text-slate-800 text-sm">{px.left.cyl || '-'}</span></div>
                                    <div><span className="block text-[10px] text-slate-400 mb-0.5">AXS</span><span className="font-bold text-slate-800 text-sm">{px.left.axis || '-'}</span></div>
                                 </div>
                              </div>
                           </div>
                        </div>
                      ))}
                   </section>

                   {/* ALIŞVERİŞ GEÇMİŞİ */}
                   <section>
                      <h4 className="text-lg font-black text-slate-800 mb-5 flex items-center gap-2">
                         <FileText className="w-5 h-5 text-slate-500"/> Alışveriş Geçmişi
                      </h4>
                      <div className="space-y-3">
                         {selectedCustomer.pastOrders.map((ord:any, idx:number) => (
                           <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center hover:border-indigo-200 transition-colors">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                                    <Glasses className="w-5 h-5 text-slate-400"/>
                                 </div>
                                 <div>
                                    <p className="font-bold text-slate-700 text-sm">{ord.product}</p>
                                    <p className="text-xs font-semibold text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3"/> {ord.date} • {ord.id}</p>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className="font-black text-slate-800">₺{ord.amount.toLocaleString('tr-TR')}</p>
                              </div>
                           </div>
                         ))}
                      </div>
                   </section>

                </div>

                {/* Footer Quick Actions */}
                <div className="p-6 bg-white border-t border-slate-200 shrink-0 flex gap-4">
                   <button onClick={() => toast.success('E-Posta programı açılıyor.')} className="flex-1 bg-white border border-slate-200 text-slate-700 py-4 rounded-2xl font-bold shadow-sm hover:bg-slate-50 flex justify-center items-center gap-2">
                     <Mail className="w-4 h-4"/> E-Posta
                   </button>
                   <button type="button" onClick={() => { toast.loading('POS ekranına yönlendiriliyor...', { duration: 600 }); setTimeout(() => navigate('/dashboard/pos'), 400); }} className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2">
                     <Plus className="w-5 h-5"/> Hızlı Satış Başlat
                   </button>
                </div>
             </motion.div>
           </>
         )}
      </AnimatePresence>

      {/* NEW CUSTOMER MODAL */}
      <AnimatePresence>
        {isAddModalOpen && (
          <>
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddModalOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]" />
             <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                 className="bg-white rounded-[2rem] w-full max-w-xl shadow-2xl pointer-events-auto overflow-hidden flex flex-col"
               >
                 <div className="p-6 lg:p-8 bg-indigo-600 flex justify-between items-start relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                    <div>
                      <h2 className="text-2xl font-black text-white flex items-center gap-2"><UserPlus className="w-6 h-6"/> Yeni Müşteri Kaydı</h2>
                      <p className="text-indigo-100 font-medium text-sm mt-1">Sisteme yeni bir hasta/müşteri profili ekleyin.</p>
                    </div>
                    <button onClick={() => setIsAddModalOpen(false)} className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors relative z-10"><X className="w-5 h-5"/></button>
                 </div>
                 
                 <div className="p-6 lg:p-8 space-y-5 bg-slate-50/50">
                    <div>
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Ad Soyad</label>
                       <input type="text" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300" placeholder="Örn: Hasan Yılmaz" />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                       <div>
                         <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Telefon</label>
                         <input type="text" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300" placeholder="05XX XXX XX XX" />
                       </div>
                       <div>
                         <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">E-Posta (Opsiyonel)</label>
                         <input type="email" value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300" placeholder="ornek@mail.com" />
                       </div>
                    </div>
                    <div>
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Adres Bilgisi</label>
                       <textarea value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all min-h-[80px] placeholder:text-slate-300 resize-none" placeholder="Mahalle, sokak, şehir..." />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                       <div>
                         <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Müşteri Segmenti</label>
                         <select value={newCustomer.segment} onChange={e => setNewCustomer({...newCustomer, segment: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all">
                           <option value="Standart">Standart Müşteri</option>
                           <option value="VIP">VIP Müşteri</option>
                         </select>
                       </div>
                       <div>
                         <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Kayıt Kaynağı</label>
                         <select value={newCustomer.source} onChange={e => setNewCustomer({...newCustomer, source: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all">
                           <option value="Manuel">Manuel Kayıt</option>
                           <option value="Randevu">Randevudan</option>
                         </select>
                       </div>
                    </div>
                    
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-700 text-sm font-medium">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      KVKK Metni okutulmalı ve onay alındıktan sonra sisteme kaydedilmelidir.
                    </div>
                 </div>

                 <div className="p-6 bg-white border-t border-slate-100 flex justify-end gap-3">
                    <button onClick={() => setIsAddModalOpen(false)} className="px-5 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">İptal</button>
                    <button 
                       onClick={async () => {
                         if(!newCustomer.name || !newCustomer.phone) {
                           toast.error('Lütfen en az Ad Soyad ve Telefon bilgisini giriniz.');
                           return;
                         }
                         try {
                            await api.post('/customers', {
                              name: newCustomer.name,
                              phone: newCustomer.phone,
                              email: newCustomer.email,
                              address: newCustomer.address,
                              segment: newCustomer.segment,
                              source: newCustomer.source
                            });
                            toast.success(`${newCustomer.name} başarıyla kaydedildi.`);
                            setIsAddModalOpen(false);
                            setNewCustomer({ name: '', phone: '', email: '', address: '', segment: 'Standart', source: 'Manuel' });
                            fetchCustomers();
                         } catch(err: any) {
                            toast.error(err.message || 'Kayıt başarısız.');
                         }
                       }}
                       className="px-6 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all"
                     >
                      <Save className="w-4 h-4"/> Kaydet
                    </button>
                 </div>
               </motion.div>
             </div>
          </>
        )}
      </AnimatePresence>

      {/* NEW PRESCRIPTION MODAL */}
      <AnimatePresence>
        {isRxModalOpen && (
          <>
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsRxModalOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80]" />
             <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 pointer-events-none">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                 className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl pointer-events-auto overflow-hidden flex flex-col"
               >
                 <div className="p-6 bg-indigo-600 flex justify-between items-start relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                    <div>
                      <h2 className="text-xl font-black text-white flex items-center gap-2"><Eye className="w-5 h-5"/> Yeni Reçete Kaydı</h2>
                    </div>
                    <button onClick={() => setIsRxModalOpen(false)} className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors"><X className="w-5 h-5"/></button>
                 </div>
                 
                 <div className="p-6 space-y-4 bg-slate-50/50 max-h-[70vh] overflow-y-auto">
                    <div className="flex gap-4">
                       <button onClick={() => setNewRx({...newRx, type: 'Optik'})} className={`flex-1 py-3 rounded-xl font-bold border-2 transition-colors ${newRx.type === 'Optik' ? 'border-indigo-600 text-indigo-700 bg-indigo-50' : 'border-slate-200 text-slate-500 bg-white'}`}>Gözlük Reçetesi (Optik)</button>
                       <button onClick={() => setNewRx({...newRx, type: 'Lens'})} className={`flex-1 py-3 rounded-xl font-bold border-2 transition-colors ${newRx.type === 'Lens' ? 'border-indigo-600 text-indigo-700 bg-indigo-50' : 'border-slate-200 text-slate-500 bg-white'}`}>Kontakt Lens Reçetesi</button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div>
                         <label className="text-xs font-bold text-slate-500 block mb-1">Doktor Adı</label>
                         <input type="text" value={newRx.doctor} onChange={e => setNewRx({...newRx, doctor: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 font-medium" />
                       </div>
                       <div>
                         <label className="text-xs font-bold text-slate-500 block mb-1">Hastane / Klinik</label>
                         <input type="text" value={newRx.clinic} onChange={e => setNewRx({...newRx, clinic: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 font-medium" />
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mt-4">
                       <div className="border border-slate-200 rounded-xl p-4 bg-white">
                         <h5 className="font-black text-indigo-600 mb-3 text-center">SAĞ GÖZ (OD)</h5>
                         <div className="space-y-3">
                            <div className="flex items-center gap-2">
                               <label className="w-12 text-xs font-bold text-slate-500">SPH</label>
                               <input type="number" step="0.25" value={newRx.rSph} onChange={e => setNewRx({...newRx, rSph: e.target.value})} className="flex-1 border border-slate-200 rounded-lg px-2 py-1 text-center" />
                            </div>
                            <div className="flex items-center gap-2">
                               <label className="w-12 text-xs font-bold text-slate-500">CYL</label>
                               <input type="number" step="0.25" value={newRx.rCyl} onChange={e => setNewRx({...newRx, rCyl: e.target.value})} className="flex-1 border border-slate-200 rounded-lg px-2 py-1 text-center" />
                            </div>
                            <div className="flex items-center gap-2">
                               <label className="w-12 text-xs font-bold text-slate-500">AXIS</label>
                               <input type="number" value={newRx.rAxs} onChange={e => setNewRx({...newRx, rAxs: e.target.value})} className="flex-1 border border-slate-200 rounded-lg px-2 py-1 text-center" />
                            </div>
                         </div>
                       </div>
                       <div className="border border-slate-200 rounded-xl p-4 bg-white">
                         <h5 className="font-black text-indigo-600 mb-3 text-center">SOL GÖZ (OS)</h5>
                         <div className="space-y-3">
                            <div className="flex items-center gap-2">
                               <label className="w-12 text-xs font-bold text-slate-500">SPH</label>
                               <input type="number" step="0.25" value={newRx.lSph} onChange={e => setNewRx({...newRx, lSph: e.target.value})} className="flex-1 border border-slate-200 rounded-lg px-2 py-1 text-center" />
                            </div>
                            <div className="flex items-center gap-2">
                               <label className="w-12 text-xs font-bold text-slate-500">CYL</label>
                               <input type="number" step="0.25" value={newRx.lCyl} onChange={e => setNewRx({...newRx, lCyl: e.target.value})} className="flex-1 border border-slate-200 rounded-lg px-2 py-1 text-center" />
                            </div>
                            <div className="flex items-center gap-2">
                               <label className="w-12 text-xs font-bold text-slate-500">AXIS</label>
                               <input type="number" value={newRx.lAxs} onChange={e => setNewRx({...newRx, lAxs: e.target.value})} className="flex-1 border border-slate-200 rounded-lg px-2 py-1 text-center" />
                            </div>
                         </div>
                       </div>
                    </div>
                 </div>

                 <div className="p-6 bg-white border-t border-slate-100 flex justify-end gap-3">
                    <button onClick={() => setIsRxModalOpen(false)} className="px-5 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">İptal</button>
                    <button 
                       onClick={async () => {
                         try {
                            await api.post('/prescriptions', {
                              customerId: selectedCustomer.id,
                              doctorName: newRx.doctor,
                              hospitalName: newRx.clinic,
                              rightSph: newRx.rSph ? parseFloat(newRx.rSph) : null,
                              rightCyl: newRx.rCyl ? parseFloat(newRx.rCyl) : null,
                              rightAxis: newRx.rAxs ? parseInt(newRx.rAxs) : null,
                              leftSph: newRx.lSph ? parseFloat(newRx.lSph) : null,
                              leftCyl: newRx.lCyl ? parseFloat(newRx.lCyl) : null,
                              leftAxis: newRx.lAxs ? parseInt(newRx.lAxs) : null
                            });
                            toast.success('Reçete başarıyla kaydedildi.');
                            setIsRxModalOpen(false);
                            setNewRx({
                              type: 'Optik', doctor: '', clinic: '',
                              rSph: '', rCyl: '', rAxs: '',
                              lSph: '', lCyl: '', lAxs: ''
                            });
                            // Refresh customer details to display new prescription
                            const updated = await api.get('/customers');
                            setCustomers(updated);
                            const updatedSelected = updated.find((cust: any) => cust.id === selectedCustomer.id);
                            if (updatedSelected) {
                              setSelectedCustomer(updatedSelected);
                            }
                         } catch(err: any) {
                            toast.error(err.message || 'Reçete kaydedilemedi.');
                         }
                       }}
                       className="px-6 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                     >
                      Kaydet
                    </button>
                 </div>
               </motion.div>
             </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
