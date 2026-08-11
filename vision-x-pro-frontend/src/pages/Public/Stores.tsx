import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Store, ChevronRight, X, Phone, User, Calendar as CalIcon, Clock } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { turkeyCities } from '../../utils/turkey_cities';
import { api } from '../../lib/api';

export default function Stores() {
  const [stores, setStores] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Appointment Modal State
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [selectedDetailStore, setSelectedDetailStore] = useState<any>(null);
  const [apptData, setApptData] = useState({ name: '', phone: '', date: '', time: '10:00' });

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const data = await api.get<any[]>('/public/stores');
        setStores(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStores();
  }, []);

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apptData.name || !apptData.phone || !apptData.date) {
      toast.error('Lütfen tüm alanları doldurun.');
      return;
    }

    try {
      await api.post('/public/appointments', {
        OrgId: selectedStore.orgId,
        BranchId: selectedStore.id,
        PatientName: apptData.name,
        Phone: apptData.phone,
        Date: apptData.date,
        Time: apptData.time
      });

      toast.success(`${selectedStore.name} mağazasına randevunuz iletildi!`);
      setSelectedStore(null);
      setApptData({ name: '', phone: '', date: '', time: '10:00' });
    } catch (err: any) {
      toast.error(err.message || 'Randevu oluşturulamadı. Lütfen tekrar deneyin.');
    }
  };

  const filtered = stores.filter(s => {
    if (!cityFilter) return false;
    if (s.city !== cityFilter) return false;
    if (districtFilter && districtFilter !== 'Tüm İlçeler') {
      if (!s.district) return false;
      if (s.district !== districtFilter) return false;
    }
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleCityChange = (e: any) => {
    setCityFilter(e.target.value);
    setDistrictFilter(''); // Reset district when city changes
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-32">
      <Toaster position="top-right"/>
      
      {/* HEADER TİTLE */}
      <div className="max-w-[1400px] mx-auto px-6 mb-12 text-center">
         <div className="inline-flex items-center justify-center px-4 py-1.5 mb-4 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black tracking-widest uppercase border border-indigo-100">
           Bireysel Optik Platformu
         </div>
         <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight mb-4">Mağazalarımızı Keşfedin</h1>
         <p className="text-slate-500 font-medium text-lg">Size en yakın profesyonel optik mağazasını bulun ve randevunuzu hemen alın.</p>
      </div>

      {/* FILTERS */}
      <div className="max-w-[1200px] mx-auto px-6 mb-16">
         <div className="bg-white p-4 rounded-[2rem] border border-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col md:flex-row gap-4 relative z-20">
            <div className="flex-1 relative">
               <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
               <select value={cityFilter} onChange={handleCityChange} className="w-full bg-slate-50 border border-slate-100 py-4 pl-14 pr-5 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 cursor-pointer appearance-none">
                  <option value="" disabled>Lütfen Şehir Seçiniz</option>
                  {Object.keys(turkeyCities).map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
               </select>
            </div>

            <div className="flex-1 relative">
               <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300" />
               <select value={districtFilter} onChange={e=>setDistrictFilter(e.target.value)} disabled={!cityFilter} className="w-full bg-slate-50 border border-slate-100 py-4 pl-14 pr-5 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 cursor-pointer appearance-none disabled:opacity-50">
                  <option value="">Tüm İlçeler</option>
                  {cityFilter && turkeyCities[cityFilter as keyof typeof turkeyCities]?.map(district => (
                     <option key={district} value={district}>{district}</option>
                  ))}
               </select>
            </div>
            
            <div className="flex-[2] relative group">
               <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
               <input type="text" value={search} onChange={e=>setSearch(e.target.value)} disabled={!cityFilter} placeholder={cityFilter ? "Mağaza adı arayın..." : "Önce şehir seçiniz..."} className="w-full bg-slate-50 border border-slate-100 py-4 pl-14 pr-5 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-colors placeholder:text-slate-400 disabled:opacity-50" />
            </div>
         </div>
         <div className="text-center mt-6 flex flex-col items-center gap-2">
            <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100 shadow-sm">
              {filtered.length} Mağaza Bulundu
            </span>
            <p className="text-xs text-slate-500 font-medium max-w-xl">
              İlçe seçince yalnızca sisteme ilçe kaydı girilmiş şubeler listelenir. Eski kayıtlarda ilçe yoksa &quot;Tüm İlçeler&quot; ile arayın.
            </p>
         </div>
      </div>

      {/* STORES LIST */}
      <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {loading ? (
               <div className="col-span-full py-20 text-center text-slate-400 font-bold animate-pulse text-lg">Mağazalar aranıyor...</div>
            ) : !cityFilter ? (
               <div className="col-span-full py-20 flex flex-col items-center text-slate-400 font-bold text-lg">
                  <MapPin className="w-16 h-16 text-indigo-200 mb-4 animate-bounce" />
                  Öncelikle yaşadığınız şehri seçerek size en yakın optisyeni bulabilirsiniz.
               </div>
            ) : filtered.length === 0 ? (
               <div className="col-span-full py-20 text-center text-slate-400 font-bold text-lg">Arama kriterlerine uygun optisyen bulunamadı.</div>
            ) : filtered.map((store, i) => (
               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} key={store.id} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all group flex flex-col">
                  {/* Card Cover */}
                  <div className="h-32 bg-slate-100 relative overflow-hidden flex items-center justify-center border-b border-slate-100">
                     <Store className="w-16 h-16 text-slate-300 group-hover:scale-110 transition-transform" />
                     <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black text-slate-600 shadow-sm max-w-[70%] text-right truncate" title={[store.district, store.city].filter(Boolean).join(' / ')}>
                       {store.district ? `${store.district}, ${store.city}` : store.city}
                     </div>
                  </div>
                  
                  {/* Card Content */}
                  <div className="p-8 flex flex-col flex-1">
                     <h3 className="text-xl font-black text-slate-800 mb-1">{store.name}</h3>
                     <p className="text-xs font-bold text-slate-400 mb-5 flex items-center gap-1.5 line-clamp-1"><MapPin className="w-3.5 h-3.5"/> {store.address || 'Adres bilgisi mevcut değil.'}</p>
                     
                     <div className="flex flex-wrap gap-2 mb-8">
                        {store.services?.map((svc:string, idx:number) => (
                           <span key={idx} className="bg-slate-50 text-slate-500 border border-slate-100 px-2.5 py-1 rounded text-[10px] font-bold">{svc}</span>
                        ))}
                     </div>

                     <div className="mt-auto grid grid-cols-2 gap-3">
                        <button onClick={() => setSelectedDetailStore(store)} className="font-bold text-sm bg-slate-50 text-slate-600 hover:bg-slate-100 py-3.5 rounded-xl transition-colors text-center shadow-sm">
                           Detaylar
                        </button>
                        <button onClick={() => setSelectedStore(store)} className="font-bold text-sm bg-indigo-600 text-white hover:bg-indigo-700 py-3.5 rounded-xl transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 group/btn">
                           Randevu Al <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                     </div>
                  </div>
               </motion.div>
            ))}
         </AnimatePresence>
      </div>

      {/* APPOINTMENT MODAL */}
      <AnimatePresence>
         {selectedStore && (
           <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedStore(null)} className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm" />
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 xl:p-0 pointer-events-none">
                 <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl pointer-events-auto flex flex-col overflow-hidden relative border border-slate-100">
                    
                    {/* Header */}
                    <div className="bg-indigo-600 p-8 pb-10 relative overflow-hidden text-white border-b border-indigo-700">
                       <div className="absolute top-[-30px] right-[-30px] w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                       <div className="flex justify-between items-start">
                          <div>
                            <h2 className="text-2xl font-black flex items-center gap-2 mb-1"><Store className="w-6 h-6"/> {selectedStore.name}</h2>
                            <p className="text-indigo-200 text-sm font-semibold">{selectedStore.address || 'Mağaza adresinde sizi bekliyoruz.'}</p>
                          </div>
                          <button onClick={()=>setSelectedStore(null)} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"><X className="w-4 h-4"/></button>
                       </div>
                    </div>

                    {/* Form Component inside Modal */}
                    <form onSubmit={handleBookAppointment} className="p-8 pb-10 -mt-6 relative z-10 bg-white rounded-t-[2.5rem]">
                       <div className="space-y-5">
                          <div>
                             <label className="text-[10px] font-black text-slate-500 tracking-widest uppercase mb-2 block flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-indigo-400"/> Adınız Soyadınız</label>
                             <input required type="text" value={apptData.name} onChange={e=>setApptData({...apptData, name:e.target.value})} className="w-full bg-slate-50 border border-slate-100 py-4 px-5 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-300" placeholder="Örn: Hasan Yılmaz" />
                          </div>
                          <div>
                             <label className="text-[10px] font-black text-slate-500 tracking-widest uppercase mb-2 block flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-indigo-400"/> Telefon Numaranız</label>
                             <input required type="text" value={apptData.phone} onChange={e=>setApptData({...apptData, phone:e.target.value})} className="w-full bg-slate-50 border border-slate-100 py-4 px-5 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-300" placeholder="Size ulaşabileceğimiz numara" />
                          </div>
                          <div className="grid grid-cols-2 gap-5">
                             <div>
                                <label className="text-[10px] font-black text-slate-500 tracking-widest uppercase mb-2 block flex items-center gap-1.5"><CalIcon className="w-3.5 h-3.5 text-indigo-400"/> Randevu Tarihi</label>
                                <input required type="date" value={apptData.date} onChange={e=>setApptData({...apptData, date:e.target.value})} className="w-full bg-slate-50 border border-slate-100 py-4 px-5 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10" />
                             </div>
                             <div>
                                <label className="text-[10px] font-black text-slate-500 tracking-widest uppercase mb-2 block flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-indigo-400"/> Saat</label>
                                <input required type="time" value={apptData.time} onChange={e=>setApptData({...apptData, time:e.target.value})} className="w-full bg-slate-50 border border-slate-100 py-4 px-5 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10" />
                             </div>
                          </div>
                       </div>
                       
                       <div className="mt-10 flex gap-4">
                          <button type="button" onClick={()=>setSelectedStore(null)} className="flex-1 py-4 text-sm font-bold text-slate-500 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors">İptal</button>
                          <button type="submit" className="flex-[2] py-4 text-sm font-black text-white bg-indigo-600 rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex justify-center items-center gap-2">Randevumu Oluştur</button>
                       </div>
                    </form>
                 </motion.div>
              </div>
           </>
         )}
      </AnimatePresence>

      {/* DETAILS MODAL */}
      <AnimatePresence>
         {selectedDetailStore && (
           <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedDetailStore(null)} className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm" />
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 xl:p-0 pointer-events-none">
                 <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl pointer-events-auto flex flex-col overflow-hidden relative border border-slate-100">
                    
                    {/* Header */}
                    <div className="bg-slate-800 p-8 pb-10 relative overflow-hidden text-white border-b border-slate-700">
                       <div className="absolute top-[-30px] right-[-30px] w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                       <div className="flex justify-between items-start">
                          <div>
                            <h2 className="text-2xl font-black flex items-center gap-2 mb-1"><Store className="w-6 h-6"/> {selectedDetailStore.name}</h2>
                            <p className="text-slate-300 text-sm font-semibold">{selectedDetailStore.address || 'Mağaza adresi'}</p>
                          </div>
                          <button onClick={()=>setSelectedDetailStore(null)} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"><X className="w-4 h-4"/></button>
                       </div>
                    </div>

                    <div className="p-8 pb-10 -mt-6 relative z-10 bg-white rounded-t-[2.5rem]">
                       <div className="space-y-6">
                           <div>
                              <h4 className="text-sm font-bold text-slate-800 mb-2">Hizmetlerimiz</h4>
                              <div className="flex flex-wrap gap-2">
                                 {selectedDetailStore.services?.map((svc:string, idx:number) => (
                                    <span key={idx} className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1.5 rounded-lg text-xs font-bold">{svc}</span>
                                 ))}
                              </div>
                           </div>
                           
                           <div className="grid grid-cols-2 gap-4">
                              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                 <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-1">İl / İlçe</p>
                                 <p className="font-bold text-slate-700">
                                   {selectedDetailStore.district
                                     ? `${selectedDetailStore.district}, ${selectedDetailStore.city}`
                                     : selectedDetailStore.city}
                                 </p>
                              </div>
                              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                 <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-1">İletişim E-Posta</p>
                                 <p className="font-bold text-slate-700">{selectedDetailStore.email || '-'}</p>
                              </div>
                           </div>

                           <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                              <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-1">Kurumsal Bilgi</p>
                              <p className="text-sm font-medium text-slate-600 leading-relaxed">
                                 {selectedDetailStore.name}, her türlü optik reçete işleminizi, güneş gözlüğü seçimlerinizi ve kontakt lens denemelerinizi uzman kadromuz eşliğinde güvenle yaptırabileceğiniz resmi ve kayıtlı bir optisyenlik müessesesidir.
                              </p>
                           </div>
                       </div>
                       
                       <div className="mt-8 flex justify-end">
                          <button onClick={() => {
                             setSelectedStore(selectedDetailStore);
                             setSelectedDetailStore(null);
                          }} className="py-4 px-8 text-sm font-black text-white bg-indigo-600 rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2">
                             <CalIcon className="w-4 h-4"/> Hemen Randevu Al
                          </button>
                       </div>
                    </div>
                 </motion.div>
              </div>
           </>
         )}
      </AnimatePresence>

    </div>
  );
}
