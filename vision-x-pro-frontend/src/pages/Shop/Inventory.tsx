import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PackageSearch, Plus, 
  Search, Filter, Edit, Box, X, Sparkles, ArrowUpRight, ArrowDownRight, Layers
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function Inventory() {
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    barcode: '', name: '', category: 'Çerçeve', 
    brand: '', purchasePrice: '', salePrice: '', quantity: 1, serialNumber: '', utsCode: ''
  });

  const fetchInventory = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5069/api/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInventoryItems(data);
      }
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleOpenAdd = () => {
    setModalMode('add');
    setFormData({ barcode: '', name: '', category: 'Çerçeve', brand: '', purchasePrice: '', salePrice: '', quantity: 1, serialNumber: '', utsCode: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setModalMode('edit');
    setEditingProductId(item.productId);
    setFormData({ 
      barcode: item.barcode || '', 
      name: item.name || '', 
      category: item.category || 'Çerçeve', 
      brand: item.brand || '', 
      purchasePrice: item.purchasePrice?.toString() || '', 
      salePrice: item.salePrice?.toString() || '', 
      quantity: item.quantity || 1, 
      serialNumber: item.serialNumber || '', 
      utsCode: item.utsCode || '' 
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        purchasePrice: parseFloat(formData.purchasePrice || "0"),
        salePrice: parseFloat(formData.salePrice || "0"),
        quantity: parseInt(formData.quantity.toString() || "0")
      };
      
      let url = 'http://localhost:5069/api/products';
      let method = 'POST';

      if (modalMode === 'edit') {
        url = `http://localhost:5069/api/products/${editingProductId}`;
        method = 'PUT';
      }

      toast.loading('İşleniyor...', { id: 'invSave' });
      const res = await fetch(url, {
        method,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        toast.success(modalMode === 'add' ? 'Ürün eklendi.' : 'Değişiklikler kaydedildi.', { id: 'invSave' });
        setIsModalOpen(false);
        await fetchInventory(); 
      } else {
        toast.error('Kayıt başarısız.', { id: 'invSave' });
      }
    } catch(err) {
      toast.error('Sunucu Bağlantı Hatası', { id: 'invSave' });
    }
  };

  const filteredItems = inventoryItems.filter(item => 
    item.name?.toLowerCase().includes(search.toLowerCase()) || 
    item.barcode?.toLowerCase().includes(search.toLowerCase()) ||
    item.brand?.toLowerCase().includes(search.toLowerCase())
  );

  const tableVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 5 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] p-6 lg:p-8 relative overflow-hidden bg-gradient-to-br from-[#E0EAFC] via-[#CFDEF3] to-[#A1C4FD] flex flex-col font-sans">
      <Toaster position="top-right"/>
      
      {/* VIBRANT LIGHT AMBIENT GLOWS - VisionOS style background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[70%] bg-gradient-to-bl from-pink-300/60 via-purple-300/40 to-indigo-300/60 rounded-full blur-[120px] mix-blend-multiply opacity-80"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[60%] bg-gradient-to-tr from-cyan-300/50 to-emerald-200/40 rounded-full blur-[140px] mix-blend-multiply opacity-80"></div>
        <div className="absolute top-[30%] left-[20%] w-[40%] h-[40%] bg-gradient-to-tr from-amber-200/40 to-rose-200/40 rounded-full blur-[140px] mix-blend-multiply opacity-60"></div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1600px] h-full flex flex-col gap-8">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end bg-white/40 backdrop-blur-3xl p-8 rounded-[2rem] border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)]">
          <div className="mb-6 md:mb-0">
            <div className="inline-flex items-center justify-center px-4 py-1.5 mb-4 rounded-full bg-white/50 text-indigo-700 text-[10px] font-black tracking-widest uppercase border border-white/60 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-indigo-500" /> VisionOS Panel
            </div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              Katalog & Stok
            </h1>
            <p className="text-indigo-900/60 mt-2 font-bold text-sm">Gelişmiş optik barkod sistemiyle tam veri senkronizasyonu.</p>
          </div>
          
          <div className="flex gap-4 w-full md:w-auto">
             <motion.button onClick={() => toast('Filtreleme seçenekleri aktif değil.')} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-white/50 backdrop-blur-md border border-white/60 shadow-sm rounded-2xl text-sm font-bold text-indigo-900 hover:bg-white/80 transition-all">
               <Filter className="w-4 h-4" /> Filtreler
             </motion.button>
             <motion.button onClick={handleOpenAdd} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }} className="flex-[2] md:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600/90 backdrop-blur-md shadow-[0_8px_20px_rgba(79,70,229,0.3)] rounded-2xl text-sm font-black text-white border border-indigo-400/30 hover:bg-indigo-700 hover:shadow-[0_12px_25px_rgba(79,70,229,0.4)] transition-all">
               <Plus className="w-5 h-5" /> Yeni Ürün Ekle
             </motion.button>
          </div>
        </div>

        {/* METRICS WIDGETS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           <StatCard icon={<Layers className="text-indigo-500 w-6 h-6"/>} title="Toplam Çeşit" value={inventoryItems.length.toString()} trend="Model ve Renk" bg="bg-white/60" border="border-white/50" />
           <StatCard icon={<PackageSearch className="text-pink-500 w-6 h-6"/>} title="Fiziksel Adet" value={inventoryItems.reduce((acc, curr) => acc + curr.quantity, 0).toString()} trend="Canlı Sayım" bg="bg-white/60" border="border-white/50" />
           <StatCard icon={<ArrowDownRight className="text-emerald-500 w-6 h-6"/>} title="Stok Maliyeti" value={`₺${inventoryItems.reduce((acc, curr) => acc + (parseFloat(curr.purchasePrice) * curr.quantity || 0), 0).toLocaleString('tr-TR', {minimumFractionDigits:2})}`} trend="Genel Toplam" bg="bg-white/60" border="border-white/50" />
           <StatCard icon={<ArrowUpRight className="text-blue-500 w-6 h-6"/>} title="Satış Hedefi" value={`₺${inventoryItems.reduce((acc, curr) => acc + (parseFloat(curr.salePrice) * curr.quantity || 0), 0).toLocaleString('tr-TR', {minimumFractionDigits:2})}`} trend="Beklenen Gelir" bg="bg-white/60" border="border-white/50" />
        </div>

        {/* INVENTORY TABLE PANEL */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 bg-white/40 backdrop-blur-3xl border border-white/60 shadow-[0_12px_40px_rgba(0,0,0,0.06)] rounded-[2.5rem] p-6 lg:p-8 flex flex-col relative overflow-hidden">
           
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div className="relative group w-full max-w-lg">
                <Search className="absolute left-5 top-4 w-5 h-5 text-indigo-900/50 group-focus-within:text-indigo-600 transition-colors" />
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Barkod, İsim veya Marka ara..." 
                  className="w-full bg-white/60 backdrop-blur-md border border-white/60 py-4 pl-14 pr-6 rounded-2xl text-[14px] font-bold text-slate-800 placeholder:text-indigo-900/40 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all shadow-sm" 
                />
              </div>
              <div className="text-sm font-bold text-indigo-900/70 bg-white/50 backdrop-blur-md px-5 py-3 rounded-xl border border-white/60 flex items-center gap-2 shadow-sm">
                 <Box className="w-4 h-4 text-indigo-400"/>
                 <span className="text-indigo-700 font-black">{filteredItems.length}</span> Ürün Listeleniyor
              </div>
           </div>

           <div className="flex-1 bg-white/40 border border-white/60 rounded-[2rem] overflow-hidden flex flex-col shadow-inner backdrop-blur-sm">
             <div className="overflow-x-auto scrollbar-hide flex-1">
               <table className="w-full text-left text-sm text-slate-700">
                 <thead className="bg-white/50 backdrop-blur-md text-indigo-900/60 font-black uppercase tracking-widest text-[10px] border-b border-white/40">
                   <tr>
                     <th className="px-8 py-5">Barkod Kodu / UTS</th>
                     <th className="px-8 py-5">Ürün Modeli & Kategori</th>
                     <th className="px-8 py-5 text-right border-l border-white/40">Alış Fiyatı</th>
                     <th className="px-8 py-5 text-right">Satış Fiyatı</th>
                     <th className="px-8 py-5 text-center border-l border-white/40">Stok</th>
                     <th className="px-8 py-5 text-center">İşlem</th>
                   </tr>
                 </thead>
                 <motion.tbody variants={tableVariants} initial="hidden" animate="visible" className="divide-y divide-white/40">
                   {loading ? (
                     <tr><td colSpan={6} className="text-center py-20 font-bold text-indigo-900/50">SQL Veritabanı Taranıyor...</td></tr>
                   ) : filteredItems.length === 0 ? (
                     <tr><td colSpan={6} className="text-center py-20 font-bold text-indigo-900/50 flex flex-col items-center justify-center gap-4">
                        <Box className="w-12 h-12 text-indigo-300"/>
                        Aranan kriterlerde ürün yok.
                     </td></tr>
                   ) : (
                     filteredItems.map((item) => (
                       <motion.tr variants={rowVariants} key={item.id} className="hover:bg-white/60 transition-colors group">
                         <td className="px-8 py-5">
                           <div className="font-black text-slate-800 tracking-wider font-mono bg-white/70 shadow-sm inline-block px-3 py-1.5 rounded-lg border border-white">{item.barcode}</div>
                           <br/>
                           {item.utsCode ? <div className="text-[9px] font-black text-purple-700 bg-purple-100 inline-block px-2 py-0.5 rounded mt-2 border border-purple-200 shadow-sm">{item.utsCode}</div> : <></>}
                         </td>
                         <td className="px-8 py-5">
                           <div className="font-black text-slate-800 text-base">{item.name}</div>
                           <div className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-widest">{item.brand || 'MARKASIZ'} <span className="text-indigo-200 mx-1">•</span> {item.category}</div>
                         </td>
                         <td className="px-8 py-5 font-bold text-slate-500 text-right border-l border-white/30 border-dashed">₺{(parseFloat(item.purchasePrice) || 0).toLocaleString('tr-TR', {minimumFractionDigits:2})}</td>
                         <td className="px-8 py-5 font-black text-indigo-700 text-right">₺{(parseFloat(item.salePrice) || 0).toLocaleString('tr-TR', {minimumFractionDigits:2})}</td>
                         <td className="px-8 py-5 text-center border-l border-white/30 border-dashed">
                           <div className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black shadow-sm border ${item.quantity > 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-200/50' : 'bg-rose-50 text-rose-600 border-rose-200/50 shadow-[0_2px_10px_rgba(225,29,72,0.15)]'}`}>
                             {item.quantity} 
                             <span className="text-[10px] font-bold opacity-70">ADET</span>
                           </div>
                         </td>
                         <td className="px-8 py-5 text-center">
                            <button onClick={() => handleOpenEdit(item)} className="p-3 text-indigo-400 hover:text-indigo-700 hover:bg-white/80 rounded-2xl transition-all border border-transparent shadow-sm hover:border-white hover:shadow-md" title="Düzenle">
                               <Edit className="w-4 h-4"/>
                            </button>
                         </td>
                       </motion.tr>
                     ))
                   )}
                 </motion.tbody>
               </table>
             </div>
           </div>
        </motion.div>
      </div>

      {/* LIGHT FLUID MODAL - VisionOS Glass */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Darker backdrop blur overlay */}
            <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-xl" onClick={() => setIsModalOpen(false)}></div>
            
            <motion.div initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 30 }} className="bg-white/70 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.15)] w-full max-w-2xl overflow-hidden border border-white/80 relative z-10 flex flex-col">
              <div className="flex justify-between items-center p-8 bg-white/40 border-b border-white/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                     <PackageSearch className="w-6 h-6 text-indigo-600"/>
                     {modalMode === 'add' ? 'Merkezi Kayıt Cihazı' : 'Envanter Güncelleme'}
                  </h3>
                  <p className="text-indigo-900/60 text-sm font-semibold mt-1">Barkod veya manuel giriş ile SQL senkronizasyonu.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-2xl bg-white/60 text-slate-500 hover:text-slate-900 border border-white shadow-sm flex items-center justify-center transition-colors relative z-10"><X className="w-5 h-5"/></button>
              </div>
              <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-6 relative z-10">
                <div className="grid grid-cols-2 gap-6">
                   <div>
                     <label className="text-[10px] font-black tracking-widest text-indigo-900/50 uppercase mb-2 block">Cihaz Barkodu</label>
                     <input required type="text" value={formData.barcode} onChange={e=>setFormData({...formData, barcode: e.target.value})} className="w-full text-base font-black py-4 px-5 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 border border-white/60 bg-white/50 text-slate-800 transition-all font-mono shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" placeholder="Barkod Okutunuz..." />
                   </div>
                   <div>
                     <label className="text-[10px] font-black tracking-widest text-indigo-900/50 uppercase mb-2 block">ÜTS Kayıt No</label>
                     <input type="text" value={formData.utsCode} onChange={e=>setFormData({...formData, utsCode: e.target.value})} className="w-full text-base font-black py-4 px-5 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 border border-white/60 bg-white/50 text-slate-800 transition-all font-mono shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" placeholder="Opsiyonel"/>
                   </div>
                </div>
                <div>
                   <label className="text-[10px] font-black tracking-widest text-indigo-900/50 uppercase mb-2 block">Mavi/Katalog İsmi</label>
                   <input required type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full text-lg font-black py-4 px-5 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 border border-white/60 bg-white/70 text-slate-800 transition-all placeholder:text-slate-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" placeholder="Örn: Ray-Ban Hexagonal Gold"/>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                   <div>
                     <label className="text-[10px] font-black tracking-widest text-indigo-900/50 uppercase mb-2 block">Kategori Seçimi</label>
                     <select value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="w-full text-base font-bold py-4 px-5 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 border border-white/60 bg-white/50 text-slate-700 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                       <option>Çerçeve</option><option>Cam</option><option>Lens</option><option>Aksesuar</option>
                     </select>
                   </div>
                   <div>
                     <label className="text-[10px] font-black tracking-widest text-indigo-900/50 uppercase mb-2 block">Marka / Klasman</label>
                     <input type="text" value={formData.brand} onChange={e=>setFormData({...formData, brand: e.target.value})} className="w-full text-base font-bold py-4 px-5 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 border border-white/60 bg-white/50 text-slate-700 transition-all placeholder:text-slate-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" placeholder="Örn: Ray-Ban"/>
                   </div>
                </div>
                
                <div className="grid grid-cols-3 gap-6 bg-white/30 p-6 rounded-[2rem] border border-white/60 mt-2 shadow-[inset_0_2px_10px_rgba(0,0,0,0.01)]">
                   <div>
                     <label className="text-[10px] font-black tracking-widest text-rose-500 uppercase mb-2 block">Maliyet (₺)</label>
                     <input required type="number" step="0.01" value={formData.purchasePrice} onChange={e=>setFormData({...formData, purchasePrice: e.target.value})} className="w-full text-lg font-black py-3 px-4 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/30 border border-white bg-white/80 text-rose-700 transition-all shadow-sm" />
                   </div>
                   <div>
                     <label className="text-[10px] font-black tracking-widest text-indigo-600 uppercase mb-2 block">Tüketici (₺)</label>
                     <input required type="number" step="0.01" value={formData.salePrice} onChange={e=>setFormData({...formData, salePrice: e.target.value})} className="w-full text-lg font-black py-3 px-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/30 border border-white bg-white/80 text-indigo-800 transition-all shadow-sm" />
                   </div>
                   <div>
                     <label className="text-[10px] font-black tracking-widest text-emerald-600 uppercase mb-2 block">Sistem Stok</label>
                     <input required type="number" min="0" value={formData.quantity} onChange={e=>setFormData({...formData, quantity: parseInt(e.target.value)})} disabled={modalMode === 'edit'} className="w-full text-lg font-black py-3 px-4 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/30 border border-white bg-white/80 text-emerald-700 disabled:opacity-40 transition-all shadow-sm" />
                   </div>
                </div>

                <div className="mt-4 flex gap-4 pt-4 border-t border-white/40">
                   <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-4 flex-1 text-sm font-black text-slate-600 bg-white/50 hover:bg-white border border-white rounded-2xl transition-all shadow-sm">Vazgeç</button>
                   <button type="submit" className="px-6 py-4 flex-[2] bg-indigo-600 shadow-[0_4px_15px_rgba(79,70,229,0.3)] hover:shadow-[0_8px_25px_rgba(79,70,229,0.4)] hover:-translate-y-0.5 text-white text-sm font-black rounded-2xl transition-all flex items-center justify-center gap-2 border border-indigo-500/50">
                      <Sparkles className="w-4 h-4" />
                      {modalMode === 'add' ? 'Güvenli Kaydet' : 'Değişiklikleri Onayla'}
                   </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ icon, title, value, trend, bg, border }: any) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`${bg} backdrop-blur-2xl border ${border} shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-3xl p-6 lg:p-7 flex flex-col relative overflow-hidden group hover:bg-white/80 transition-colors`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 bg-white/80 border border-white shadow-sm rounded-2xl flex items-center justify-center`}>
          {icon}
        </div>
        <div className={`px-2.5 py-1 rounded-lg bg-white/60 border border-white text-[9px] font-black text-indigo-900/60 uppercase tracking-widest shadow-sm`}>
          {trend}
        </div>
      </div>
      <div>
        <p className="text-xs font-black text-indigo-900/50 uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-3xl font-black text-slate-800 group-hover:scale-105 transform origin-left transition-transform">{value}</h3>
      </div>
    </motion.div>
  );
}
