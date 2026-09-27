import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Search, Filter,
  MapPin, Phone, User, Calendar, CreditCard, ChevronRight,
  Eye, Printer, Truck, CheckCircle2, Clock, AlertCircle, Focus, Image as ImageIcon,
  RotateCcw, X, Download, Wrench,
  Share2, Award
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import api from '../../lib/api';
import { downloadCsv } from '../../utils/csvExport';
import DigitalWarrantyModal from '../../components/DigitalWarrantyModal';

const statusConfig: any = {
  'Tamamlandı': { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  'Yeni Sipariş': { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
  'Hazırlanıyor': { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Focus },
  'Atölyede/Montajda': { color: 'bg-cyan-100 text-cyan-700 border-cyan-200', icon: Wrench },
  'Kargolandı': { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Truck },
  'Teslim Edildi': { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  'İptal / İade': { color: 'bg-rose-100 text-rose-700 border-rose-200', icon: RotateCcw },
};

export default function Orders() {
  const [activeTab, setActiveTab] = useState('Tümü');
  const [channel, setChannel] = useState('Tümü');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWarrantyModal, setShowWarrantyModal] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await api.get('/orders/all');
      setOrders(data);
    } catch (err: any) {
      console.error("Siparişler çekilemedi", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (order: any, newStatus: string) => {
    try {
      await api.put(`/orders/${order.dbId}/status`, { status: newStatus });
      toast.success(`Durum güncellendi: ${newStatus}`);
      setOrders((prev: any[]) => prev.map(o => o.dbId === order.dbId ? { ...o, status: newStatus } : o));
      setSelectedOrder((prev: any) => prev ? { ...prev, status: newStatus } : null);
    } catch (err: any) {
      toast.error(err.message || 'Durum güncellenemedi.');
    }
  };

  const tabs = ['Tümü', 'Tamamlandı', 'Yeni Sipariş', 'Hazırlanıyor', 'Atölyede/Montajda', 'Kargolandı'];

  const orderChannel = (o: any) => o.source ?? o.salesChannel ?? '';

  const filteredOrders = orders.filter(o => {
    if (activeTab !== 'Tümü' && o.status !== activeTab) return false;
    if (channel !== 'Tümü' && orderChannel(o) !== channel) return false;
    if (search && !o.customer?.toLowerCase().includes(search.toLowerCase()) && !o.id?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const parseLensDetails = (raw: string | null | undefined) => {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  return (
    <div className="min-h-full bg-slate-50/50 flex flex-col pt-4">
      <Toaster position="top-right" />
      
      {/* HEADER & FILTERS */}
      <div className="px-6 lg:px-10 mb-8">
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                <Package className="w-8 h-8 text-indigo-600" />
                Sipariş Yönetimi
              </h1>
              <p className="text-slate-500 font-medium mt-1">Tüm satış kanallarından (POS, Optik, E-Ticaret) gelen siparişleri yönetin.</p>
            </div>
            <div className="flex bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm">
               {tabs.map(t => (
                 <button 
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === t ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                 >
                   {t}
                 </button>
               ))}
            </div>
         </div>

         <div className="flex gap-4 mb-4">
            <div className="flex bg-slate-200/50 p-1 rounded-2xl">
               {['Tümü', 'POS', 'Optik Sipariş', 'E-Ticaret'].map(ch => (
                 <button 
                  key={ch}
                  onClick={() => setChannel(ch)}
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${channel === ch ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                   {ch}
                 </button>
               ))}
            </div>
         </div>

         <div className="flex gap-4">
            <div className="flex-1 max-w-md relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Müşteri adı, telefon veya sipariş no (Örn: TR-108...) arayın..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 py-3.5 pl-12 pr-4 text-sm font-medium rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
              />
            </div>
            <button className="px-5 bg-white border border-slate-200 text-slate-700 rounded-2xl shadow-sm hover:bg-slate-50 transition-colors flex items-center gap-2 font-bold text-sm">
              <Filter className="w-4 h-4"/> Filtrele
            </button>
            <button onClick={() => {
               downloadCsv('siparisler.csv',
                 ['Sipariş No', 'Müşteri', 'Durum', 'Tarih', 'Tutar', 'Kanal', 'Ödeme'],
                 filteredOrders.map(o => [o.id, o.customer, o.status, o.date, o.amount, orderChannel(o), o.paymentMethod])
               );
            }} className="px-5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl shadow-sm hover:bg-emerald-100 transition-colors flex items-center gap-2 font-bold text-sm">
              <Download className="w-4 h-4"/> Excel
            </button>
         </div>
      </div>

      {/* ORDER LIST GRID */}
      <div className="flex-1 overflow-x-hidden overflow-y-auto px-6 lg:px-10 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
               {loading ? (
                 <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
                    <span className="text-lg font-bold text-slate-500 animate-pulse">Siparişler yükleniyor...</span>
                 </div>
               ) : filteredOrders.length === 0 ? (
                 <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
                    <AlertCircle className="w-16 h-16 mb-4 text-slate-300" />
                    <p className="text-lg font-bold text-slate-500">Bu kritere uygun sipariş bulunamadı.</p>
                 </div>
               ) : filteredOrders.map((order: any, i: number) => {
                 const StatusIcon = statusConfig[order.status]?.icon;
                 return (
                   <motion.div 
                     layout
                     initial={{ opacity: 0, scale: 0.95, y: 20 }}
                     animate={{ opacity: 1, scale: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.95 }}
                     transition={{ duration: 0.3, delay: i * 0.05 }}
                     key={order.id} 
                     onClick={() => setSelectedOrder(order)}
                     className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-indigo-200 transition-all cursor-pointer group flex flex-col relative overflow-hidden"
                   >
                     {/* Card Header */}
                     <div className="flex justify-between items-start mb-5">
                        <div>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 font-extrabold text-slate-600 text-[11px] uppercase tracking-widest rounded-lg mb-2`}>
                            {order.id}
                          </span>
                          <h3 className="text-xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{order.customer}</h3>
                          <p className="text-[11px] font-bold text-indigo-600 mt-1 uppercase tracking-wide">{orderChannel(order) || 'Kanal yok'}</p>
                        </div>
                        <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold ${statusConfig[order.status]?.color || 'bg-slate-100 text-slate-600'}`}>
                          {StatusIcon && <StatusIcon className="w-4 h-4" />} {order.status}
                        </div>
                     </div>

                     {/* Details Mini */}
                     <div className="space-y-2 mb-5 flex-1">
                        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                          <Calendar className="w-4 h-4 text-slate-400" /> {order.date}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                          <CreditCard className="w-4 h-4 text-slate-400" /> {order.paymentMethod} • <span className="font-extrabold text-slate-700">₺{order.amount.toLocaleString('tr-TR')}</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-slate-500 font-medium h-10 overflow-hidden line-clamp-2 leading-snug">
                          <Package className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" /> 
                          {order.items.map((i: any) => i.name).join(', ')}
                        </div>
                     </div>

                     {/* Card Footer */}
                     <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                        <div className="flex gap-2">
                          {order.prescriptionImg && <span className="px-2 py-1 bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-bold uppercase rounded-lg flex items-center gap-1"><ImageIcon className="w-3 h-3"/> Reçete Eki</span>}
                          {order.status === 'Kargolandı' && <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded-lg">Takip: {order.trackingNo}</span>}
                        </div>
                        <button className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                     </div>
                   </motion.div>
                 );
               })}
            </AnimatePresence>
         </div>
      </div>

      {/* ORDER DETAIL SLIDE-OVER */}
      <AnimatePresence>
         {selectedOrder && (
           <>
             {/* Backdrop */}
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setSelectedOrder(null)}
               className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
             />
             
             {/* Panel */}
             <motion.div 
               initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="fixed top-0 right-0 w-full md:w-[600px] h-full bg-slate-50 shadow-2xl z-50 flex flex-col border-l border-slate-200/50"
             >
                {/* Panel Header */}
                <div className="p-6 lg:p-8 bg-white border-b border-slate-100 flex justify-between items-start shrink-0 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -z-10"></div>
                   <div>
                     <div className="flex items-center gap-3 mb-2">
                       <span className="text-sm font-extrabold text-slate-400 uppercase tracking-widest">{selectedOrder.id}</span>
                       <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold ${statusConfig[selectedOrder.status]?.color}`}>
                         {selectedOrder.status}
                       </span>
                     </div>
                     <h2 className="text-3xl font-black text-slate-800 tracking-tight">{selectedOrder.customer}</h2>
                     <p className="text-slate-500 font-medium mt-1 flex items-center gap-2"><Calendar className="w-4 h-4"/> {selectedOrder.date}</p>
                   </div>
                   <button onClick={() => setSelectedOrder(null)} className="w-10 h-10 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 rounded-2xl flex items-center justify-center transition-colors shadow-sm">
                     <X className="w-5 h-5" />
                   </button>
                </div>

                {/* Panel Content */}
                <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8">
                   
                   {/* Customer Info Card */}
                   <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                      <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-indigo-500"/> Müşteri & Kargo
                      </h4>
                      <div className="space-y-4">
                        <div className="flex gap-3">
                           <Phone className="w-5 h-5 text-slate-400 mt-1 shrink-0" />
                           <div>
                             <p className="text-xs font-bold text-slate-400 uppercase mb-0.5">GSM</p>
                             <p className="font-semibold text-slate-700">{selectedOrder.phone}</p>
                           </div>
                        </div>
                        <div className="flex gap-3">
                           <MapPin className="w-5 h-5 text-slate-400 mt-1 shrink-0" />
                           <div>
                             <p className="text-xs font-bold text-slate-400 uppercase mb-0.5">Kargo Adresi</p>
                             <p className="font-semibold text-slate-700 leading-snug">{selectedOrder.address}</p>
                           </div>
                        </div>
                      </div>
                   </div>

                   {/* Order Items Info */}
                   <div>
                      <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2 px-2">
                        <Package className="w-5 h-5 text-slate-500"/> Sipariş İçeriği
                      </h4>
                      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
                         {selectedOrder.items?.map((item:any, idx:number) => {
                           const lens = parseLensDetails(item.lensDetails || item.attr);
                           const rx = item.rx || (lens?.right || lens?.left ? { right: lens.right, left: lens.left } : null);
                           return (
                           <div key={idx} className="p-6 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                              <div className="flex justify-between items-start mb-3">
                                 <div>
                                   <p className="font-black text-slate-800 text-lg leading-tight">
                                     {lens?.name ? `${lens.brand || ''} ${lens.name}`.trim() : item.name}
                                   </p>
                                   {lens?.index && (
                                     <p className="text-xs font-bold text-indigo-600 mt-1">İndeks {lens.index} · Lab cam</p>
                                   )}
                                   {!lens && item.attr && !item.attr.startsWith('{') && (
                                     <p className="text-xs font-bold text-slate-500 mt-1 px-2 py-0.5 bg-slate-100 rounded-md inline-block">{item.attr}</p>
                                   )}
                                 </div>
                                 <div className="text-right">
                                   <p className="font-black text-indigo-600">₺{item.price.toLocaleString('tr-TR')}</p>
                                   <p className="text-xs font-bold text-slate-400">Adet: {item.qty}</p>
                                 </div>
                              </div>
                              
                              {rx && (
                                <div className="mt-4 bg-blue-50/50 border border-blue-100 rounded-2xl p-4 relative overflow-hidden">
                                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-400"></div>
                                  <p className="text-[10px] uppercase font-black text-blue-800 mb-3 flex items-center gap-1.5"><Eye className="w-3.5 h-3.5"/> Optik Recete (RX) Parametreleri</p>
                                  <div className="grid grid-cols-2 gap-4">
                                     <div>
                                        <p className="text-[10px] font-bold text-slate-500 mb-1">SAĞ (OD)</p>
                                        <div className="bg-white border border-blue-200/50 rounded-xl p-2 flex gap-3 shadow-sm">
                                           <div><span className="text-[9px] text-slate-400 block">SPH</span><span className="font-bold text-sm text-slate-800">{rx.right?.sph ?? '-'}</span></div>
                                           <div><span className="text-[9px] text-slate-400 block">CYL</span><span className="font-bold text-sm text-slate-800">{rx.right?.cyl ?? '-'}</span></div>
                                           <div><span className="text-[9px] text-slate-400 block">AXS</span><span className="font-bold text-sm text-slate-800">{rx.right?.axis ?? '-'}</span></div>
                                        </div>
                                     </div>
                                     <div>
                                        <p className="text-[10px] font-bold text-slate-500 mb-1">SOL (OS)</p>
                                        <div className="bg-white border border-blue-200/50 rounded-xl p-2 flex gap-3 shadow-sm">
                                           <div><span className="text-[9px] text-slate-400 block">SPH</span><span className="font-bold text-sm text-slate-800">{rx.left?.sph ?? '-'}</span></div>
                                           <div><span className="text-[9px] text-slate-400 block">CYL</span><span className="font-bold text-sm text-slate-800">{rx.left?.cyl ?? '-'}</span></div>
                                           <div><span className="text-[9px] text-slate-400 block">AXS</span><span className="font-bold text-sm text-slate-800">{rx.left?.axis ?? '-'}</span></div>
                                        </div>
                                     </div>
                                  </div>
                                </div>
                              )}
                           </div>
                         );})}
                         <div className="p-6 bg-slate-50 flex justify-between items-center">
                           <div>
                             <p className="text-xs font-bold text-slate-400 uppercase">Ödeme ({selectedOrder.paymentMethod})</p>
                             <p className="text-xl font-black text-slate-800 mt-0.5 border-b-2 border-slate-300 pb-0.5 inline-block">Genel Toplam: ₺{selectedOrder.amount.toLocaleString('tr-TR')}</p>
                           </div>
                         </div>
                      </div>
                   </div>

                   {/* Reçete Eki */}
                   {selectedOrder.prescriptionImg && (
                      <div className="bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-100 rounded-[2rem] p-6 shadow-sm flex items-center justify-between">
                         <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-rose-200">
                             <ImageIcon className="w-6 h-6 text-rose-500" />
                           </div>
                           <div>
                             <h4 className="font-bold text-rose-900 leading-none">Müşteri Reçetesi Eklendi</h4>
                             <p className="text-xs font-semibold text-rose-600 mt-1">Sipariş onayından önce kontrol edin.</p>
                           </div>
                         </div>
                         <button className="px-4 py-2 bg-white text-rose-600 text-sm font-bold border border-rose-200 rounded-xl hover:bg-rose-50 transition-colors shadow-sm">Görüntüle</button>
                      </div>
                   )}
                </div>

                {/* Panel Footer Actions */}
                <div className="p-6 lg:p-8 bg-white border-t border-slate-100 shrink-0 grid grid-cols-2 gap-4">
                   <button className="flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-slate-200 font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors">
                     <Printer className="w-5 h-5"/> Sipariş Fişi Yazdır
                   </button>
                   {selectedOrder.status === 'Yeni Sipariş' && (
                     <button onClick={() => updateStatus(selectedOrder, 'Hazırlanıyor')} className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-indigo-600 font-bold text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">
                       <Focus className="w-5 h-5"/> Hazırlanıyor Olarak İşaretle
                     </button>
                   )}
                   {selectedOrder.status === 'Hazırlanıyor' && (
                     <button onClick={() => updateStatus(selectedOrder, 'Atölyede/Montajda')} className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-cyan-600 font-bold text-white hover:bg-cyan-700 shadow-lg shadow-cyan-200 transition-all">
                       <Wrench className="w-5 h-5"/> Atölyeye/Montaja Gönder
                     </button>
                   )}
                   {selectedOrder.status === 'Atölyede/Montajda' && (
                     <button onClick={() => updateStatus(selectedOrder, 'Kargolandı')} className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-purple-600 font-bold text-white hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all">
                       <Truck className="w-5 h-5"/> Kargoya Ver / Barkod Bas
                     </button>
                   )}
                   <button onClick={() => setShowWarrantyModal(true)} className="col-span-2 flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-slate-800 bg-slate-900 font-bold text-white hover:bg-slate-800 shadow-lg transition-all mt-2">
                     <Award className="w-5 h-5 text-amber-400"/> Dijital Garanti & Optik Kartı (QR Kodlu)
                   </button>
                   <button 
                     onClick={() => {
                       const phone = selectedOrder?.phone?.replace(/\D/g, '') || '';
                       const msg = encodeURIComponent(`Sayın ${selectedOrder?.customer || 'Müşterimiz'}, VisionX Pro Optik ${selectedOrder?.id || ''} numaralı siparişiniz güncellendi.\nDurum: ${selectedOrder?.status || ''}\nToplam: ₺${selectedOrder?.amount?.toLocaleString('tr-TR')}\nSağlıklı günlerde kullanmanızı dileriz.`);
                       if (phone) window.open(`https://wa.me/90${phone.startsWith('0') ? phone.slice(1) : phone}?text=${msg}`, '_blank');
                       else window.open(`https://wa.me/?text=${msg}`, '_blank');
                     }} 
                     className="col-span-2 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-emerald-600 font-bold text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all"
                   >
                     <Share2 className="w-5 h-5"/> WhatsApp ile Müşteriye Bilgi Gönder
                   </button>
                </div>
             </motion.div>
           </>
         )}
      </AnimatePresence>

      <DigitalWarrantyModal
        isOpen={showWarrantyModal}
        onClose={() => setShowWarrantyModal(false)}
        order={{
          orderNumber: selectedOrder?.id,
          customer: selectedOrder?.customer,
          customerPhone: selectedOrder?.phone,
          date: selectedOrder?.date,
          total: selectedOrder?.amount,
        }}
      />
    </div>
  );
}
