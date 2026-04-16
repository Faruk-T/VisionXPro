import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PackageSearch, Plus, 
  Search, Filter, Edit, Box, X, Sparkles, Layers,
  LayoutGrid, List, Eye, ArrowUpRight, ArrowDownRight, Glasses, Droplets, Gem
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function Inventory() {
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeCategory, setActiveCategory] = useState('Tümü');
  
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

  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(search.toLowerCase()) || 
                          item.barcode?.toLowerCase().includes(search.toLowerCase()) ||
                          item.brand?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'Tümü' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['Tümü', 'Çerçeve', 'Cam', 'Lens', 'Aksesuar'];

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Çerçeve': return <Glasses className="w-5 h-5 text-indigo-500" />;
      case 'Lens': return <Droplets className="w-5 h-5 text-cyan-500" />;
      case 'Aksesuar': return <Gem className="w-5 h-5 text-amber-500" />;
      case 'Cam': return <Eye className="w-5 h-5 text-emerald-500" />;
      default: return <Box className="w-5 h-5 text-slate-400" />;
    }
  };

  const getCategoryBg = (cat: string) => {
    switch (cat) {
      case 'Çerçeve': return 'bg-indigo-50 text-indigo-700';
      case 'Lens': return 'bg-cyan-50 text-cyan-700';
      case 'Aksesuar': return 'bg-amber-50 text-amber-700';
      case 'Cam': return 'bg-emerald-50 text-emerald-700';
      default: return 'bg-slate-50 text-slate-700';
    }
  };

  return (
    <div className="min-h-full bg-[#FAFAFA] font-sans pb-16">
      <Toaster position="top-right"/>
      
      {/* Light Clean Header Section */}
      <div className="bg-white border-b border-slate-200/60 pt-8 pb-10 px-8 xl:px-12 relative overflow-hidden">
        {/* Subtle decorative blob */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-slate-100 to-transparent rounded-full blur-3xl opacity-50 pointer-events-none -z-10"></div>
        
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center justify-center px-3 py-1.5 mb-4 rounded-xl bg-slate-100 text-slate-600 text-[10px] font-bold tracking-widest uppercase shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
              Depo ve Mağaza
            </div>
            <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
              Katalog <span className="text-slate-300 font-light">&</span> Stok
            </h1>
            <p className="text-slate-500 mt-2 font-medium text-sm">Ürün yelpazenizi, stok maliyetlerinizi ve perakende satış fiyatlarınızı yönetin.</p>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
             <button onClick={() => toast('Toplu içe aktarma yakında eklenecek.')} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3.5 bg-white border border-slate-200 shadow-sm rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:shadow-md transition-all">
               İçe Aktar
             </button>
             <button onClick={handleOpenAdd} className="flex-[2] md:flex-none flex items-center justify-center gap-2 px-7 py-3.5 bg-slate-800 shadow-lg shadow-slate-200 rounded-2xl text-sm font-bold text-white hover:bg-slate-900 transition-all active:scale-95">
               <Plus className="w-4 h-4" /> Yeni Ürün Ekle
             </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-8 xl:px-12 mt-8 flex flex-col gap-8">
        
        {/* METRICS WIDGETS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
           <StatCard icon={<Layers className="text-indigo-600 w-5 h-5"/>} title="Toplam Çeşit" value={inventoryItems.length.toString()} bg="bg-white" />
           <StatCard icon={<PackageSearch className="text-rose-500 w-5 h-5"/>} title="Fiziksel Adet" value={inventoryItems.reduce((acc, curr) => acc + curr.quantity, 0).toString()} bg="bg-white" />
           <StatCard icon={<ArrowDownRight className="text-slate-500 w-5 h-5"/>} title="Stok Maliyeti" value={`₺${inventoryItems.reduce((acc, curr) => acc + (parseFloat(curr.purchasePrice) * curr.quantity || 0), 0).toLocaleString('tr-TR', {minimumFractionDigits:2})}`} bg="bg-white" />
           <StatCard icon={<ArrowUpRight className="text-emerald-500 w-5 h-5"/>} title="Satış Hedefi" value={`₺${inventoryItems.reduce((acc, curr) => acc + (parseFloat(curr.salePrice) * curr.quantity || 0), 0).toLocaleString('tr-TR', {minimumFractionDigits:2})}`} bg="bg-white" />
        </div>

        {/* TOOLBAR */}
        <div className="bg-white border border-slate-200 rounded-3xl p-3 flex flex-col xl:flex-row justify-between items-center gap-4 shadow-sm">
           
           {/* Category Pills */}
           <div className="flex gap-2 overflow-x-auto w-full xl:w-auto scrollbar-hide">
              {categories.map(cat => (
                 <button 
                   key={cat} 
                   onClick={() => setActiveCategory(cat)}
                   className={`px-5 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-slate-800 text-white shadow-md' : 'bg-transparent text-slate-500 hover:bg-slate-100'}`}
                 >
                   {cat}
                 </button>
              ))}
           </div>

           <div className="flex items-center gap-3 w-full xl:w-auto">
              <div className="relative group flex-1 xl:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Barkod, İsim..." 
                  className="w-full bg-slate-50 border border-slate-200 py-3 pl-11 pr-4 rounded-xl text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-300 transition-all" 
                />
              </div>

              <div className="flex bg-slate-100 p-1 rounded-xl">
                 <button onClick={() => setViewMode('grid')} className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                    <LayoutGrid className="w-5 h-5"/>
                 </button>
                 <button onClick={() => setViewMode('list')} className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                    <List className="w-5 h-5"/>
                 </button>
              </div>
           </div>
        </div>

        {/* INVENTORY VIEWS */}
        <AnimatePresence mode="wait">
           {loading ? (
             <div className="py-32 flex justify-center text-slate-400 font-bold">SQL Veritabanı Taranıyor...</div>
           ) : filteredItems.length === 0 ? (
             <div className="py-24 flex flex-col items-center justify-center bg-white border border-slate-200 border-dashed rounded-3xl text-slate-400">
               <PackageSearch className="w-16 h-16 mb-4 text-slate-200" />
               <p className="text-xl font-extrabold text-slate-500 mb-2">Gösterilecek ürün yok.</p>
               <p className="text-sm font-medium">Arama kriterlerini değiştirin veya yeni ürün ekleyin.</p>
             </div>
           ) : viewMode === 'grid' ? (
             
             /* GRID VIEW */
             <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0}} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredItems.map(item => (
                  <div key={item.id} className="bg-white rounded-[2rem] p-6 border border-slate-200/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col">
                     <div className="flex justify-between items-start mb-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${getCategoryBg(item.category)}`}>
                           {getCategoryIcon(item.category)}
                        </div>
                        <div className="flex flex-col items-end">
                           <span className="font-mono text-xs font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg">{item.barcode}</span>
                           {item.utsCode && <span className="text-[9px] font-black tracking-widest text-indigo-400 uppercase mt-2">{item.utsCode}</span>}
                        </div>
                     </div>
                     
                     <div className="mb-4">
                        <h3 className="font-extrabold text-slate-800 text-lg leading-tight mb-1">{item.name}</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.brand || 'Markasız'} • {item.category}</p>
                     </div>

                     <div className="mt-auto grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
                        <div>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Maliyet</p>
                           <p className="font-black text-slate-600">₺{(parseFloat(item.purchasePrice) || 0).toLocaleString('tr-TR')}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Satış</p>
                           <p className="font-black text-emerald-600">₺{(parseFloat(item.salePrice) || 0).toLocaleString('tr-TR')}</p>
                        </div>
                     </div>

                     <div className="flex justify-between items-center mt-5">
                        <div className={`px-3 py-1.5 rounded-xl text-xs font-black border flex items-center gap-1.5 ${item.quantity > 0 ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                           <Box className="w-3.5 h-3.5" /> {item.quantity} Adet
                        </div>
                        <button onClick={() => handleOpenEdit(item)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-800 hover:text-white flex items-center justify-center transition-colors shadow-sm">
                           <Edit className="w-4 h-4"/>
                        </button>
                     </div>
                  </div>
                ))}
             </motion.div>

           ) : (
             
             /* LIST VIEW */
             <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0}} className="bg-white rounded-[2rem] border border-slate-200/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm text-slate-700">
                   <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                     <tr>
                       <th className="px-8 py-5"># Barkod / ÜTS</th>
                       <th className="px-8 py-5">Ürün Modeli & Kategori</th>
                       <th className="px-8 py-5 text-right">Alış Fiyatı</th>
                       <th className="px-8 py-5 text-right">Satış Fiyatı</th>
                       <th className="px-8 py-5 text-center">Stok</th>
                       <th className="px-8 py-5 text-center">İşlem</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                     {filteredItems.map(item => (
                       <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                         <td className="px-8 py-5">
                           <div className="font-mono font-bold text-slate-600 text-xs bg-slate-100 inline-block px-2 py-1 rounded-md">{item.barcode}</div>
                           {item.utsCode && <div className="text-[9px] font-black text-indigo-400 mt-2">{item.utsCode}</div>}
                         </td>
                         <td className="px-8 py-5">
                           <div className="flex items-center gap-4">
                             <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${getCategoryBg(item.category)}`}>
                               {getCategoryIcon(item.category)}
                             </div>
                             <div>
                               <div className="font-black text-slate-800">{item.name}</div>
                               <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{item.brand || 'MARKASIZ'}</div>
                             </div>
                           </div>
                         </td>
                         <td className="px-8 py-5 font-bold text-slate-500 text-right text-xs">₺{(parseFloat(item.purchasePrice) || 0).toLocaleString('tr-TR', {minimumFractionDigits:2})}</td>
                         <td className="px-8 py-5 font-black text-slate-800 text-right text-sm">₺{(parseFloat(item.salePrice) || 0).toLocaleString('tr-TR', {minimumFractionDigits:2})}</td>
                         <td className="px-8 py-5 text-center">
                           <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black ${item.quantity > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
                             {item.quantity} 
                           </div>
                         </td>
                         <td className="px-8 py-5 text-center">
                            <button onClick={() => handleOpenEdit(item)} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-all" title="Düzenle">
                               <Edit className="w-5 h-5"/>
                            </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </motion.div>
           )}
        </AnimatePresence>
      </div>

      {/* LIGHT FLUID MODAL - Pure White Apple Style */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
            <motion.div initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 30 }} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 flex flex-col border border-slate-100">
              
              <div className="flex justify-between items-center p-8 bg-slate-50 border-b border-slate-100">
                <div>
                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                     <PackageSearch className="w-5 h-5 text-indigo-600"/>
                     {modalMode === 'add' ? 'Kataloğa Ürün Ekle' : 'Envanter Güncelleme'}
                  </h3>
                  <p className="text-slate-500 text-xs font-semibold mt-1">Barkod veya manuel giriş ile cihaz kaydını tamamlayın.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-2xl bg-white text-slate-400 hover:text-slate-800 hover:shadow shadow-sm flex items-center justify-center transition-all"><X className="w-5 h-5"/></button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-6">
                   <div>
                     <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2 block">Cihaz Barkodu</label>
                     <input required type="text" value={formData.barcode} onChange={e=>setFormData({...formData, barcode: e.target.value})} className="w-full text-sm font-bold py-3.5 px-4 rounded-xl outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-300 border border-slate-200 bg-white text-slate-800 transition-all font-mono" placeholder="Barkod Okutunuz..." />
                   </div>
                   <div>
                     <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2 block">ÜTS Kayıt No</label>
                     <input type="text" value={formData.utsCode} onChange={e=>setFormData({...formData, utsCode: e.target.value})} className="w-full text-sm font-bold py-3.5 px-4 rounded-xl outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-300 border border-slate-200 bg-white text-slate-800 transition-all font-mono" placeholder="Opsiyonel"/>
                   </div>
                </div>
                <div>
                   <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2 block">Model / Katalog İsmi</label>
                   <input required type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full text-base font-black py-4 px-5 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-300 border border-slate-200 bg-slate-50 text-slate-800 transition-all placeholder:text-slate-300" placeholder="Örn: Ray-Ban Hexagonal Gold"/>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                   <div>
                     <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2 block">Kategori Seçimi</label>
                     <select value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="w-full text-sm font-bold py-4 px-4 rounded-xl outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-300 border border-slate-200 bg-white text-slate-700 transition-all">
                       <option>Çerçeve</option><option>Cam</option><option>Lens</option><option>Aksesuar</option>
                     </select>
                   </div>
                   <div>
                     <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2 block">Marka / Klasman</label>
                     <input type="text" value={formData.brand} onChange={e=>setFormData({...formData, brand: e.target.value})} className="w-full text-sm font-bold py-4 px-4 rounded-xl outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-300 border border-slate-200 bg-white text-slate-700 transition-all placeholder:text-slate-300" placeholder="Örn: Ray-Ban"/>
                   </div>
                </div>
                
                <div className="grid grid-cols-3 gap-6 bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 mt-2">
                   <div>
                     <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2 block">Maliyet (₺)</label>
                     <input required type="number" step="0.01" value={formData.purchasePrice} onChange={e=>setFormData({...formData, purchasePrice: e.target.value})} className="w-full text-base font-black py-3 px-4 rounded-xl outline-none focus:ring-2 focus:ring-slate-200 border border-slate-200 bg-white text-slate-600 transition-all" />
                   </div>
                   <div>
                     <label className="text-[10px] font-black tracking-widest text-indigo-500 uppercase mb-2 block">Perakende Fiyat (₺)</label>
                     <input required type="number" step="0.01" value={formData.salePrice} onChange={e=>setFormData({...formData, salePrice: e.target.value})} className="w-full text-base font-black py-3 px-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 border border-indigo-200 bg-white text-indigo-600 transition-all shadow-sm" />
                   </div>
                   <div>
                     <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2 block">Sistem Stok</label>
                     <input required type="number" min="0" value={formData.quantity} onChange={e=>setFormData({...formData, quantity: parseInt(e.target.value)})} disabled={modalMode === 'edit'} className="w-full text-base font-black py-3 px-4 rounded-xl outline-none focus:ring-2 focus:ring-slate-200 border border-slate-200 bg-white text-slate-600 disabled:opacity-50 transition-all" />
                   </div>
                </div>

                <div className="mt-4 flex gap-4 pt-4 border-t border-slate-100">
                   <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-4 flex-1 text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all">Vazgeç</button>
                   <button type="submit" className="px-6 py-4 flex-[2] bg-slate-800 shadow-[0_4px_15px_rgba(0,0,0,0.1)] hover:shadow-lg hover:-translate-y-0.5 text-white text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      {modalMode === 'add' ? 'Sisteme Ekle' : 'Değişiklikleri Onayla'}
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

function StatCard({ icon, title, value, bg }: any) {
  return (
    <div className={`${bg} border border-slate-200/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-3xl p-6 relative overflow-hidden group hover:border-slate-300 transition-all`}>
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-600">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-3xl font-extrabold text-slate-800">{value}</h3>
      </div>
    </div>
  );
}
