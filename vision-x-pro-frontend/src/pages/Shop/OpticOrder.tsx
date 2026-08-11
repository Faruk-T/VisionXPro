import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Search, Glasses, Eye, CheckCircle2, 
  ChevronRight, ArrowLeft, Printer, FileText, QrCode,
  Shield, Sun, Droplets, Zap, Star
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import api from '../../lib/api';

const catalogLenses = [
  { id: 'c1', brand: 'VisionX', name: '1.50 Standart', index: '1.50', features: ['Temel Koruma', 'UV400', 'Günlük kullanım'], price: 450, minSph: 0, maxSph: 2, isRecommended: false },
  { id: 'c2', brand: 'VisionX', name: '1.56 Anti-Reflekte', index: '1.56', features: ['Anti-Reflekte', 'UV400', 'Parlama azaltma'], price: 750, minSph: 2, maxSph: 4, isRecommended: false },
  { id: 'c3', brand: 'VisionX Pro', name: '1.60 BlueCut Aspheric', index: '1.60', features: ['Mavi Işık Koruması', 'İnceltilmiş', 'Asferik Tasarım'], price: 1450, minSph: 4, maxSph: 6, isRecommended: true },
  { id: 'c4', brand: 'Essilor', name: '1.67 Crizal Sapphire', index: '1.67', features: ['Çizilmeye Dirençli', 'Su/Toz İtici', 'Ekstra İnceltilmiş'], price: 3200, minSph: 6, maxSph: 10, isRecommended: false },
  { id: 'c5', brand: 'Hoya', name: '1.74 Ultra Thin', index: '1.74', features: ['Ultra ince', 'Yüksek diyoptri', 'Estetik kenar'], price: 4800, minSph: 8, maxSph: 12, isRecommended: false },
  { id: 'c6', brand: 'Zeiss', name: 'Progressive SmartLife', index: 'Progresif', features: ['Uzak-Yakın', 'Digital Zone', 'Yaşa uygun'], price: 5200, minSph: 0, maxSph: 12, isRecommended: false },
];

function maxAbsSph(rx: any): number {
  const vals = [rx?.right?.sph, rx?.left?.sph].map(v => parseFloat(String(v ?? 0))).filter(n => !Number.isNaN(n));
  return vals.length ? Math.max(...vals.map(Math.abs)) : 0;
}

function suggestIndex(sph: number): string {
  if (sph >= 6) return '1.67';
  if (sph >= 4) return '1.60';
  if (sph >= 2) return '1.56';
  return '1.50';
}

function fmtRx(v: number | string | null | undefined) {
  if (v === null || v === undefined || v === '') return '-';
  return String(v);
}

export default function OpticOrder() {
  const [step, setStep] = useState(1);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedFrame, setSelectedFrame] = useState<any>(null);
  const [selectedLens, setSelectedLens] = useState<any>(null);
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [staffList, setStaffList] = useState<{ id: string; name: string }[]>([]);
  const [salesRep, setSalesRep] = useState('');
  const [showLensGuide, setShowLensGuide] = useState(true);
  
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', segment: 'Standart' });
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cData, pData, staff] = await Promise.all([
          api.get('/customers'),
          api.get('/products'),
          api.get('/dashboard/employees').catch(() => []),
        ]);
        setCustomers(cData);
        setProducts(pData);
        if (Array.isArray(staff) && staff.length > 0) {
          setStaffList(staff.map((e: any) => ({ id: e.id, name: e.fullName ?? e.name ?? 'Personel' })));
          setSalesRep(staff[0].fullName ?? staff[0].name ?? '');
        }
      } catch (err) {}
    };
    fetchData();
  }, []);

  useEffect(() => {
    const loadRx = async () => {
      if (!selectedCustomer?.id) {
        setPrescriptions([]);
        setSelectedPrescription(null);
        return;
      }
      try {
        const list = await api.get(`/prescriptions/customer/${selectedCustomer.id}`);
        setPrescriptions(Array.isArray(list) ? list : []);
        setSelectedPrescription(Array.isArray(list) && list.length > 0 ? list[0] : null);
      } catch {
        setPrescriptions([]);
        setSelectedPrescription(null);
      }
    };
    loadRx();
  }, [selectedCustomer?.id]);

  const handleNext = () => setStep(s => s + 1);
  const handlePrev = () => setStep(s => s - 1);

  const filteredCustomers = customers.filter(c => 
    search === '' || c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search) || c.nationalId?.includes(search)
  );

  const frames = products.filter(p =>
    p.category?.toLowerCase().includes('çerçeve') ||
    p.category?.toLowerCase().includes('gözlük') ||
    p.category?.toLowerCase().includes('gunes') ||
    p.category?.toLowerCase().includes('güneş') ||
    !p.category
  );

  const rxStrength = maxAbsSph(selectedPrescription);
  const suggestedIndex = suggestIndex(rxStrength);

  const lensOptions = useMemo(() => {
    const stockLenses = products
      .filter(p => {
        const c = (p.category || '').toLowerCase();
        return c.includes('cam') || c.includes('lens');
      })
      .map((p: any) => ({
        id: `stock-${p.productId}`,
        brand: p.brand || 'Stok Cam',
        name: p.name,
        index: p.brand || 'Stok',
        features: ['Stoktan seçim', p.barcode ? `Barkod: ${p.barcode}` : 'Anında montaj'].filter(Boolean),
        price: p.salePrice || 0,
        isRecommended: false,
        fromStock: true,
        productId: p.productId,
      }));

    const catalog = catalogLenses.map(l => ({
      ...l,
      isRecommended: l.index === suggestedIndex || l.isRecommended,
      fromStock: false,
      productId: null as string | null,
    }));

    return [...catalog, ...stockLenses];
  }, [products, suggestedIndex]);

  useEffect(() => {
    if (step !== 3 || selectedLens) return;
    const recommended = lensOptions.find(l => l.index === suggestedIndex) ?? lensOptions.find(l => l.isRecommended);
    if (recommended) setSelectedLens(recommended);
  }, [step, suggestedIndex, lensOptions, selectedLens]);

  const orderTotal = (selectedFrame?.salePrice || 0) + (selectedLens?.price || 0);

  const submitOrder = async () => {
    if (!selectedCustomer?.id || !selectedFrame?.productId || !selectedLens) {
      toast.error('Müşteri, çerçeve ve cam seçimi zorunludur.');
      return;
    }
    setIsSubmitting(true);
    try {
      const lensDetails = JSON.stringify({
        brand: selectedLens.brand,
        name: selectedLens.name,
        index: selectedLens.index,
        features: selectedLens.features,
        price: selectedLens.price,
        prescriptionId: selectedPrescription?.id ?? null,
        right: selectedPrescription?.right ?? null,
        left: selectedPrescription?.left ?? null,
        addition: selectedPrescription?.addition ?? null,
        doctorName: selectedPrescription?.doctorName ?? null,
        hospitalName: selectedPrescription?.hospitalName ?? null,
      });

      await api.post('/orders', {
        customerId: selectedCustomer.id,
        prescriptionId: selectedPrescription?.id || null,
        totalAmount: orderTotal,
        discountAmount: 0,
        paidAmount: 0,
        paymentMethod: 'Bekliyor',
        salesChannel: 'Optik Sipariş',
        salesRepresentative: salesRep || 'Belirtilmedi',
        items: [
          {
            productId: selectedFrame.productId,
            quantity: 1,
            unitPrice: selectedFrame.salePrice || 0,
          },
          selectedLens.fromStock && selectedLens.productId
            ? {
                productId: selectedLens.productId,
                quantity: 1,
                unitPrice: selectedLens.price || 0,
                lensDetails,
              }
            : {
                productId: '00000000-0000-0000-0000-000000000000',
                quantity: 1,
                unitPrice: selectedLens.price || 0,
                lensDetails,
                isServiceItem: true,
              },
        ],
      });
      toast.success('Optik sipariş oluşturuldu (çerçeve stoktan düşüldü, cam laboratuvar kalemi).');
      setStep(1);
      setSelectedCustomer(null);
      setSelectedFrame(null);
      setSelectedLens(null);
      setSelectedPrescription(null);
    } catch (err: any) {
      toast.error(err.message || 'Sipariş kaydedilemedi!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-full bg-[#F8FAFC] flex flex-col pt-4 px-6 lg:px-10 font-sans">
      <Toaster position="top-right" />
      
      <div className="mb-8">
         <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
           <Eye className="w-8 h-8 text-indigo-600" />
           Yeni Optik Sipariş
         </h1>
         <p className="text-slate-500 font-medium mt-1">Müşteri, reçete, çerçeve ve cam seçimini adım adım tamamlayın.</p>
      </div>

      <div className="flex items-center mb-8 bg-white p-4 rounded-[2rem] shadow-sm border border-slate-200 justify-between relative">
         <div className="absolute top-1/2 left-8 right-8 h-1 bg-slate-100 -translate-y-1/2 z-0"></div>
         <div className="absolute top-1/2 left-8 h-1 bg-indigo-500 -translate-y-1/2 z-0 transition-all duration-500" style={{ width: `${(step-1)*33.3}%` }}></div>
         
         {[
           { s: 1, label: 'Müşteri', icon: User },
           { s: 2, label: 'Çerçeve', icon: Glasses },
           { s: 3, label: 'Cam & RX', icon: Eye },
           { s: 4, label: 'A4 Form', icon: FileText },
         ].map(item => (
            <div key={item.s} className="relative z-10 flex flex-col items-center gap-2 bg-white px-2 cursor-default">
               <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-sm transition-colors border-4 border-white ${step >= item.s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                 <item.icon className="w-5 h-5"/>
               </div>
               <span className={`text-xs font-extrabold uppercase tracking-widest ${step >= item.s ? 'text-indigo-700' : 'text-slate-400'}`}>{item.label}</span>
            </div>
         ))}
      </div>

      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
           {step === 1 && (
             <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col gap-6">
                <div className="flex bg-white border-slate-200 items-center px-6 py-4 rounded-[2rem] border focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all shadow-sm">
                  <Search className="w-6 h-6 text-indigo-700 mr-4" />
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Müşteri İsim, TC veya Telefon ile arayın..." className="bg-transparent border-none outline-none w-full text-lg font-bold text-slate-800 placeholder-slate-400" />
                  {!isAddingCustomer && (
                     <button onClick={() => setIsAddingCustomer(true)} className="ml-4 px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-colors whitespace-nowrap">
                       Yeni Ekle
                     </button>
                  )}
                </div>
                
                {isAddingCustomer ? (
                   <div className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm">
                      <h3 className="text-xl font-black text-slate-800 mb-4">Yeni Müşteri Oluştur</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                         <div>
                           <label className="text-sm font-bold text-slate-700 mb-1 block">Ad Soyad</label>
                           <input type="text" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-slate-800 outline-none focus:border-indigo-500" placeholder="Örn: Ayşe Demir"/>
                         </div>
                         <div>
                           <label className="text-sm font-bold text-slate-700 mb-1 block">Telefon</label>
                           <input type="tel" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-slate-800 outline-none focus:border-indigo-500" placeholder="Örn: 0555 123 45 67"/>
                         </div>
                      </div>
                      <div className="flex gap-4">
                         <button onClick={() => setIsAddingCustomer(false)} className="px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 flex-1">İptal</button>
                         <button onClick={async () => { 
                              if(!newCustomer.name || !newCustomer.phone) { toast.error('Ad Soyad ve Telefon zorunludur!'); return; }
                              try {
                                 const created = await api.post('/customers', {
                                   name: newCustomer.name,
                                   phone: newCustomer.phone,
                                   segment: newCustomer.segment,
                                   source: 'Optik'
                                 });
                                 const updatedCustomers = await api.get('/customers');
                                 setCustomers(updatedCustomers);
                                 const match = updatedCustomers.find((c: any) => c.phone === newCustomer.phone);
                                 setSelectedCustomer(match || created);
                                 setNewCustomer({name:'', phone:'', email:'', segment: 'Standart'});
                                 setIsAddingCustomer(false);
                                 toast.success('Müşteri kaydedildi ve seçildi!');
                              } catch(err: any) {
                                 toast.error(err.message || 'Müşteri kaydedilemedi.');
                              }
                          }} className="px-6 py-3 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 flex-1 shadow-lg shadow-emerald-200">Kaydet & Seç</button>
                      </div>
                   </div>
                ) : (
                   <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-10">
                      {filteredCustomers.map(cust => (
                         <div 
                           key={cust.id} 
                           onClick={() => setSelectedCustomer(cust)}
                           className={`p-6 rounded-[2rem] border-2 transition-all cursor-pointer flex flex-col relative overflow-hidden ${selectedCustomer?.id === cust.id ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-slate-200 bg-white hover:border-indigo-300'}`}
                         >
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="text-xl font-black text-slate-800">{cust.name}</h3>
                              {selectedCustomer?.id === cust.id && <CheckCircle2 className="w-6 h-6 text-indigo-600" />}
                            </div>
                            <p className="text-sm font-semibold text-slate-500">{cust.phone}</p>
                            <div className="mt-4 flex gap-2">
                              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-1 rounded-md">{cust.status}</span>
                            </div>
                         </div>
                      ))}
                   </div>
                )}
             </motion.div>
           )}

           {step === 2 && (
             <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 overflow-y-auto pb-10">
                   {frames.map((prod:any) => (
                      <div 
                        key={prod.productId} 
                        onClick={() => setSelectedFrame(prod)}
                        className={`p-6 rounded-[2rem] border-2 transition-all cursor-pointer flex flex-col relative overflow-hidden ${selectedFrame?.productId === prod.productId ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-slate-200 bg-white hover:border-indigo-300'}`}
                      >
                         {prod.utsCode && (
                           <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                             <QrCode className="w-3 h-3"/> ÜTS Kayıtlı
                           </div>
                         )}

                         <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border border-slate-200 mb-4 shadow-sm">
                           <Glasses className="w-8 h-8 text-slate-400" />
                         </div>
                         <h3 className="text-lg font-black text-slate-800 leading-tight mb-1">{prod.name}</h3>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{prod.barcode}</p>
                         
                         <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-end">
                           <div>
                             <p className="text-[10px] font-semibold text-slate-500">Stok: {prod.quantity}</p>
                           </div>
                           <p className="text-xl font-black text-indigo-600">₺{(prod.salePrice || 0).toLocaleString('tr-TR')}</p>
                         </div>
                      </div>
                   ))}
                </div>
             </motion.div>
           )}

           {step === 3 && (
             <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full overflow-y-auto pb-10">
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 mb-6">
                   <h2 className="text-xl font-black text-slate-800 mb-1">Reçete Seçimi</h2>
                   <p className="text-sm text-slate-500 font-medium mb-4">Müşterinin kayıtlı reçetesini siparişe bağlayın (isteğe bağlı).</p>
                   {selectedPrescription && rxStrength > 0 && (
                     <div className="mb-4 p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-start gap-3">
                       <Zap className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5"/>
                       <div>
                         <p className="font-black text-indigo-900 text-sm">Reçeteye göre öneri: <span className="text-indigo-600">{suggestedIndex}</span> indeks cam</p>
                         <p className="text-xs font-semibold text-indigo-700/80 mt-1">En yüksek SPH: ±{rxStrength.toFixed(2)} — daha ince ve estetik kenar için uygun indeks otomatik işaretlendi.</p>
                       </div>
                     </div>
                   )}
                   {prescriptions.length === 0 ? (
                     <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 font-semibold">
                       Bu müşteriye ait reçete yok. Sipariş reçetesiz devam edebilir; CRM’den reçete ekleyebilirsiniz.
                     </p>
                   ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                       {prescriptions.map((rx: any) => (
                         <button
                           type="button"
                           key={rx.id}
                           onClick={() => setSelectedPrescription(rx)}
                           className={`text-left p-4 rounded-2xl border-2 transition-all ${selectedPrescription?.id === rx.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-slate-50 hover:border-indigo-300'}`}
                         >
                           <p className="font-black text-slate-800 text-sm">{rx.doctorName || 'Doktor belirtilmemiş'}</p>
                           <p className="text-xs text-slate-500 font-medium mt-0.5">{rx.hospitalName || 'Hastane yok'} · {rx.prescriptionDate ? new Date(rx.prescriptionDate).toLocaleDateString('tr-TR') : '-'}</p>
                           <p className="text-[11px] font-bold text-slate-600 mt-2">
                             Sağ SPH {fmtRx(rx.right?.sph)} / Sol SPH {fmtRx(rx.left?.sph)}
                             {rx.addition != null ? ` · ADD ${fmtRx(rx.addition)}` : ''}
                           </p>
                         </button>
                       ))}
                     </div>
                   )}
                </div>

                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                   <div>
                     <h2 className="text-xl font-black text-slate-800">Cam Karşılaştırma & Seçim</h2>
                     <p className="text-sm text-slate-500 font-medium">Laboratuvara iletilecek cam tipini seçiniz.</p>
                   </div>
                   <div className="flex flex-col sm:flex-row gap-3">
                     {staffList.length > 0 && (
                       <select value={salesRep} onChange={e => setSalesRep(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-400">
                         {staffList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                       </select>
                     )}
                     <button type="button" onClick={() => setShowLensGuide(v => !v)} className="px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-bold hover:bg-amber-100 transition-colors">
                       {showLensGuide ? 'Anlatımı Gizle' : 'Cam Anlatımı'}
                     </button>
                   </div>
                </div>

                {showLensGuide && (
                  <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { title: '1.50 – 1.56', desc: '±2,00 SPH altı hafif numaralar için ekonomik ve hafif cam.', icon: Sun },
                      { title: '1.60 – 1.67', desc: '±2,00 – ±6,00 arası orta-yüksek numarada inceltilmiş, estetik kenar.', icon: Shield },
                      { title: 'Progresif / 1.74', desc: 'Yüksek numara veya yakın-uzak (ADD) gerektiren reçeteler için premium.', icon: Eye },
                    ].map((g, i) => (
                      <div key={i} className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/50 border border-slate-200">
                        <g.icon className="w-6 h-6 text-indigo-600 mb-2"/>
                        <p className="font-black text-slate-800 text-sm mb-1">{g.title}</p>
                        <p className="text-xs font-semibold text-slate-600 leading-relaxed">{g.desc}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {lensOptions.map(lens => (
                       <div 
                         key={lens.id} 
                         onClick={() => setSelectedLens(lens)}
                         className={`p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer relative overflow-hidden group ${selectedLens?.id === lens.id ? 'border-indigo-500 bg-indigo-900 shadow-2xl scale-[1.02] text-white' : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xl'}`}
                       >
                          {selectedLens?.id === lens.id && (
                             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/30 rounded-full blur-[80px] pointer-events-none"></div>
                          )}

                          {lens.isRecommended && (
                            <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-400 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-bl-3xl shadow-lg z-10 flex items-center gap-1">
                              <Star className="w-3 h-3 fill-white" /> Tavsiye Edilen
                            </div>
                          )}
                          
                          <div className="relative z-10 mt-2">
                            <p className={`text-xs font-black uppercase tracking-widest mb-2 ${selectedLens?.id === lens.id ? 'text-indigo-300' : 'text-indigo-600'}`}>{lens.brand}</p>
                            <h3 className={`text-3xl font-black mb-4 tracking-tight ${selectedLens?.id === lens.id ? 'text-white' : 'text-slate-900'}`}>{lens.name}</h3>
                            
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-sm mb-8 ${selectedLens?.id === lens.id ? 'bg-indigo-800/50 border border-indigo-700 text-indigo-100' : 'bg-slate-50 border border-slate-200 text-slate-700'}`}>
                              <Eye className="w-4 h-4" /> İndeks: {lens.index}
                            </div>
                            
                            <div className="space-y-4 mb-10">
                              {lens.features.map((feat, i) => {
                                 let FIcon = CheckCircle2;
                                 if (feat.includes('UV')) FIcon = Sun;
                                 else if (feat.includes('Su') || feat.includes('Toz')) FIcon = Droplets;
                                 else if (feat.includes('Mavi')) FIcon = Shield;
                                 else if (feat.includes('Direnç')) FIcon = Zap;

                                 return (
                                   <div key={i} className={`flex items-center gap-3 text-sm font-bold ${selectedLens?.id === lens.id ? 'text-indigo-100' : 'text-slate-600'}`}>
                                     <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedLens?.id === lens.id ? 'bg-indigo-800/50 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`}>
                                        <FIcon className="w-4 h-4" />
                                     </div>
                                     {feat}
                                   </div>
                                 )
                              })}
                            </div>

                            <div className={`pt-6 border-t flex justify-between items-end ${selectedLens?.id === lens.id ? 'border-indigo-800' : 'border-slate-100'}`}>
                               <div>
                                 <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${selectedLens?.id === lens.id ? 'text-indigo-300' : 'text-slate-400'}`}>Çift Cam Fiyatı</p>
                                 <span className="text-4xl font-black">₺{lens.price.toLocaleString('tr-TR')}</span>
                               </div>
                               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${selectedLens?.id === lens.id ? 'bg-white text-indigo-900 shadow-lg scale-110' : 'bg-slate-50 text-slate-300 border border-slate-200'}`}>
                                  <CheckCircle2 className={`w-6 h-6 ${selectedLens?.id === lens.id ? 'opacity-100' : 'opacity-50'}`}/>
                               </div>
                            </div>
                          </div>
                       </div>
                    ))}
                 </div>
             </motion.div>
           )}

           {step === 4 && (
             <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full pb-10 flex flex-col lg:flex-row gap-8">
                <div className="flex-1 bg-white border border-slate-300 shadow-2xl p-10 lg:p-14 relative min-h-[800px] print:w-[210mm] print:h-[297mm] print:shadow-none print:border-none print:p-0">
                   <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-6">
                      <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">VISION X PRO OPTİK</h1>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Sipariş / Teslimat Formu (A4)</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-800 text-lg">Kanal: Optik Sipariş</p>
                        <p className="text-sm font-semibold text-slate-500">Tarih: {new Date().toLocaleDateString('tr-TR')}</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-8 mb-8">
                      <div className="border border-slate-300 p-5 rounded-xl">
                         <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Müşteri Bilgileri</h3>
                         <p className="font-bold text-slate-800 text-lg mb-1">{selectedCustomer?.name}</p>
                         <p className="text-sm font-medium text-slate-600">{selectedCustomer?.phone}</p>
                         <p className="text-sm font-medium text-slate-600 mt-2 line-clamp-2">{selectedCustomer?.nationalId || selectedCustomer?.address || 'TC / Adres kaydı yok'}</p>
                      </div>
                      <div className="border border-slate-300 p-5 rounded-xl">
                         <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Reçete / Doktor Bilgisi</h3>
                         <p className="font-bold text-slate-800 text-sm mb-1">{selectedPrescription?.doctorName || 'Dr. Belirtilmemiş'}</p>
                         <p className="text-sm font-medium text-slate-600 mb-2">{selectedPrescription?.hospitalName || 'Hastane Belirtilmemiş'}</p>
                         <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200 text-[10px] font-bold text-slate-600">
                           <div>Sağ SPH: {fmtRx(selectedPrescription?.right?.sph)} CYL: {fmtRx(selectedPrescription?.right?.cyl)} AX: {fmtRx(selectedPrescription?.right?.axis)} PD: {fmtRx(selectedPrescription?.right?.pd)}</div>
                           <div>Sol SPH: {fmtRx(selectedPrescription?.left?.sph)} CYL: {fmtRx(selectedPrescription?.left?.cyl)} AX: {fmtRx(selectedPrescription?.left?.axis)} PD: {fmtRx(selectedPrescription?.left?.pd)}</div>
                           <div className="col-span-2">ADD: {fmtRx(selectedPrescription?.addition)}</div>
                         </div>
                      </div>
                   </div>

                   <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 border-b border-slate-200 pb-2">Sipariş Detayı</h3>
                   <table className="w-full text-left mb-8 text-sm">
                      <thead>
                        <tr className="bg-slate-50 font-bold text-slate-600">
                           <th className="p-3 rounded-l-lg border-b border-slate-200">Ürün Tanımı</th>
                           <th className="p-3 border-b border-slate-200">Kategori</th>
                           <th className="p-3 border-b border-slate-200 text-right">Fiyat</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-100">
                           <td className="p-3 font-semibold text-slate-800">
                             {selectedFrame?.name || 'Çerçeve Seçilmedi'}
                             {selectedFrame?.utsCode && <span className="ml-2 text-[10px] text-emerald-600 border border-emerald-200 bg-emerald-50 px-1 py-0.5 rounded uppercase font-bold">ÜTS</span>}
                           </td>
                           <td className="p-3 text-slate-500">Çerçeve</td>
                           <td className="p-3 font-bold text-slate-800 text-right">₺{selectedFrame?.salePrice?.toLocaleString('tr-TR') || '0'}</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                           <td className="p-3 font-semibold text-slate-800">
                             {selectedLens?.brand} {selectedLens?.name || 'Cam Seçilmedi'}
                           </td>
                           <td className="p-3 text-slate-500">Optik Cam (Lab)</td>
                           <td className="p-3 font-bold text-slate-800 text-right">₺{selectedLens?.price?.toLocaleString('tr-TR') || '0'}</td>
                        </tr>
                      </tbody>
                   </table>

                   <div className="flex justify-end mb-12">
                      <div className="w-64">
                         <div className="flex justify-between text-sm font-bold text-slate-600 mb-2 border-b border-slate-200 pb-2">
                           <span>Ara Toplam:</span>
                           <span>₺{orderTotal.toLocaleString('tr-TR')}</span>
                         </div>
                         <div className="flex justify-between text-xl font-black text-slate-900 mt-2">
                           <span>GENEL TOPLAM:</span>
                           <span>₺{orderTotal.toLocaleString('tr-TR')}</span>
                         </div>
                      </div>
                   </div>

                   <div className="absolute bottom-10 left-10 right-10 border-t-2 border-slate-800 pt-6 flex justify-between items-end">
                      <div className="text-xs font-bold text-slate-500">Müşteri İmzası<br/><br/>______________________</div>
                      <div className="text-center">
                        <QrCode className="w-16 h-16 text-slate-800 mx-auto mb-2" />
                        <p className="text-[10px] font-bold text-slate-500">ÜTS: yalnızca kayıtlı ürün kodu (bildirim API yok)</p>
                      </div>
                      <div className="text-xs font-bold text-slate-500 text-right">Firma Yetkilisi İmzası<br/><br/>______________________</div>
                   </div>
                </div>

                <div className="w-full lg:w-80 flex flex-col gap-4 print:hidden">
                   <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
                      <h4 className="font-black text-slate-800 mb-4">İşlemler</h4>
                      <button onClick={() => window.print()} className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-900 transition-colors shadow-lg mb-3">
                         <Printer className="w-5 h-5"/> A4 Yazdır
                      </button>
                      <button
                        disabled={isSubmitting}
                        onClick={submitOrder}
                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50"
                      >
                         <CheckCircle2 className="w-5 h-5"/> Siparişi Onayla
                      </button>
                      <p className="text-[11px] text-slate-500 font-medium mt-3 leading-relaxed">
                        Onayda çerçeve stoğu düşer; cam kalemi laboratuvar hizmeti olarak kaydedilir (stok düşmez). Durum: Hazırlanıyor.
                      </p>
                   </div>
                </div>
             </motion.div>
           )}
        </AnimatePresence>
      </div>

      <div className="py-6 flex justify-between shrink-0 print:hidden mt-auto">
         <button onClick={handlePrev} disabled={step === 1} className="px-6 py-3 rounded-xl font-bold text-slate-600 border border-slate-200 bg-white shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50 flex items-center gap-2">
           <ArrowLeft className="w-4 h-4"/> Geri
         </button>
         
         {step < 4 ? (
           <button 
            onClick={handleNext} 
            disabled={
              (step === 1 && !selectedCustomer) || 
              (step === 2 && !selectedFrame) || 
              (step === 3 && !selectedLens)
            } 
            className="px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
           >
             İleri <ChevronRight className="w-4 h-4"/>
           </button>
         ) : null}
      </div>
    </div>
  );
}
