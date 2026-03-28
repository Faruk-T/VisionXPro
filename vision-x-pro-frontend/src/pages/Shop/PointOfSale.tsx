import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Trash2, Box, QrCode, User, 
  CreditCard, Banknote, Loader2, X, RefreshCcw, FileText, Zap
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function PointOfSale() {
  const [cart, setCart] = useState<any[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);

  // Modals
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const [showZReport, setShowZReport] = useState(false);
  const [zReportData, setZReportData] = useState<any>(null);
  
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountInput, setDiscountInput] = useState('');

  const handleNumpad = (val: string) => {
    if (val === 'C') {
      setBarcodeInput('');
    } else if (val === 'Ekle') {
      handleSearchBarcode();
    } else {
      setBarcodeInput(prev => prev + val);
    }
  };

  const addItemToCart = (product: any) => {
    if (product.quantity <= 0) {
      toast.error("Ürün stokta yok!", { className: 'bg-red-50 text-red-700 border border-red-200 shadow-xl rounded-2xl font-bold' });
      return;
    }
    setCart(prev => {
      const existing = prev.find(p => (p.productId || p.ProductId) === (product.productId || product.ProductId || product.Id));
      if (existing) {
        if (existing.cartQuantity >= product.quantity) {
          toast.error("Maksimum stok adedine ulaştınız!", { className: 'bg-orange-50 text-orange-700 border border-orange-200 shadow-xl rounded-2xl font-bold' });
          return prev;
        }
        return prev.map(p => (p.productId || p.ProductId) === (product.productId || product.ProductId || product.Id) 
          ? { ...p, cartQuantity: p.cartQuantity + 1 } : p);
      } else {
        return [...prev, { ...product, productId: product.productId || product.ProductId || product.Id, cartQuantity: 1 }];
      }
    });
    toast.success("Ürün eklendi!", { className: 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xl rounded-2xl font-bold' });
  };

  const handleSearchBarcode = async () => {
    if (!barcodeInput.trim()) return;
    setIsSearching(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5069/api/products/search?barcode=${barcodeInput}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const product = await res.json();
        addItemToCart(product);
        setBarcodeInput('');
      } else {
        toast.error("Barkod bulunamadı.", { className: 'bg-red-50 text-red-700 border border-red-200 shadow-xl rounded-2xl font-bold' });
      }
    } catch(err) {
      toast.error("Bağlantı hatası.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleRemoveItem = (productId: string) => {
    setCart(prev => prev.filter(p => p.productId !== productId));
  };

  const handleClearCart = () => setCart([]);

  const handleCheckout = async (method: string) => {
    if (cart.length === 0) {
      toast.error("Sepet boş!", { className: 'bg-orange-50 text-orange-700 border border-orange-200 shadow-xl rounded-2xl font-bold' });
      return;
    }
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const totalAmt = cart.reduce((acc, curr) => acc + (curr.salePrice * curr.cartQuantity), 0) - globalDiscount;
      
      const payload = {
        totalAmount: totalAmt > 0 ? totalAmt : 0,
        discountAmount: globalDiscount,
        paymentMethod: method,
        items: cart.map(c => ({ productId: c.productId, quantity: c.cartQuantity, unitPrice: c.salePrice }))
      };

      const res = await fetch(`http://localhost:5069/api/orders`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const result = await res.json();
        toast.success(`Satış Onaylandı! Fiş No: ${result.orderNumber}`, { className: 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xl rounded-2xl font-bold' });
        
        setCompletedOrder({
          orderNumber: result.orderNumber,
          items: [...cart],
          total: payload.totalAmount,
          discount: payload.discountAmount,
          method: method,
          date: new Date().toLocaleString('tr-TR')
        });

        setCart([]);
        setBarcodeInput('');
        setGlobalDiscount(0);
      } else {
        toast.error("İşlem başarısız.");
      }
    } catch(err) {
      toast.error("Bağlantı sorunu.");
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchZReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5069/api/orders/today', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setZReportData(data);
        setShowZReport(true);
      }
    } catch(err) { }
  };

  const fetchInventoryItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5069/api/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setInventoryList(await res.json());
        setShowProductSearch(true);
      }
    } catch(err) { }
  };

  const printReceipt = () => window.print();

  const panelVariants: any = { hidden: { opacity: 0, scale: 0.98, y: 30 }, visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } } };
  const btnTap = { scale: 0.92 };
  
  const subtotal = cart.reduce((acc, curr) => acc + (curr.salePrice * curr.cartQuantity), 0);
  const total = (subtotal - globalDiscount) > 0 ? (subtotal - globalDiscount) : 0;

  return (
    <div className="font-sans min-h-full p-4 md:p-8 lg:p-10 relative overflow-hidden bg-[#0A0F1C]">
      <Toaster position="top-right" />
      
      {/* Printable Receipt */}
      <div className="hidden print:block absolute inset-0 bg-white z-[9999] p-8 text-black font-mono">
         {completedOrder && (
           <div className="max-w-xs mx-auto text-sm">
             <div className="text-center font-bold text-xl mb-2">VISION X PRO OPTİK</div>
             <div className="text-center text-xs mb-4">Mersis: 012345678900000<br/>{completedOrder.date}</div>
             <div className="border-b border-dashed border-black mb-2 pb-2">Fiş No: {completedOrder.orderNumber}</div>
             <table className="w-full text-left mb-2">
               <thead><tr><th>Ürün</th><th className="text-right">Tutar</th></tr></thead>
               <tbody>
                 {completedOrder.items.map((it:any, idx:number) => (
                   <tr key={idx}><td className="py-1">{it.name} <br/><span className="text-[10px]">x{it.cartQuantity} Adet</span></td><td className="text-right py-1">{(it.salePrice * it.cartQuantity).toLocaleString('tr-TR')} ₺</td></tr>
                 ))}
               </tbody>
             </table>
             <div className="border-t border-dashed border-black pt-2 flex justify-between"><span>Ara Toplam:</span><span>{subtotal.toLocaleString('tr-TR')} ₺</span></div>
             {completedOrder.discount > 0 && <div className="flex justify-between"><span>İskonto:</span><span>-{completedOrder.discount.toLocaleString('tr-TR')} ₺</span></div>}
             <div className="flex justify-between font-bold text-lg mt-1 pt-1 border-t border-black"><span>TOPLAM:</span><span>{completedOrder.total.toLocaleString('tr-TR')} ₺</span></div>
             <div className="text-center mt-6 text-xs">Mali değeri yoktur. Bilgi Fişidir.<br/>Bizi tercih ettiğiniz için teşekkürler!</div>
           </div>
         )}
      </div>

      {/* Vibrant Cosmic Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 print:hidden">
        <motion.div animate={{ rotate: 360, scale: [1, 1.1, 1] }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }} className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] bg-gradient-to-br from-indigo-500/40 via-purple-500/30 to-rose-500/40 rounded-full blur-[140px] mix-blend-screen"></motion.div>
        <motion.div animate={{ rotate: -360, scale: [1, 1.2, 1] }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }} className="absolute bottom-[0%] -right-[15%] w-[65%] h-[75%] bg-gradient-to-tl from-cyan-400/30 via-blue-500/40 to-teal-400/30 rounded-full blur-[150px] mix-blend-screen"></motion.div>
      </div>

      <div className="relative z-10 mx-auto max-w-[1700px] h-full flex flex-col gap-6 print:hidden">
        
        {/* Header Ribbon */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-end backdrop-blur-3xl bg-white/5 p-6 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-rose-500"></div>
          <div>
            <div className="inline-flex items-center justify-center px-4 py-1.5 mb-3 rounded-full bg-gradient-to-r from-purple-500/20 to-rose-500/20 text-rose-200 text-xs font-extrabold tracking-widest uppercase border border-white/10 shadow-inner">
              <Zap className="w-3 h-3 mr-1.5 text-rose-400" /> VISION X PRO VIP
            </div>
            <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">Kozmik Satış Paneli</h2>
          </div>
          
          <div className="flex gap-4">
             <motion.button onClick={fetchZReport} whileHover={{ scale: 1.05 }} whileTap={btnTap} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-white/10 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.2)] rounded-2xl text-sm font-bold hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:bg-white/10 transition-all">
               <FileText className="w-4 h-4" /> Z Raporu
             </motion.button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start h-full pb-10">
          
          {/* CART PANE (Left) */}
          <motion.div variants={panelVariants} initial="hidden" animate="visible" transition={{ delay: 0.1 }} className="xl:col-span-4 h-full min-h-[750px] flex flex-col bg-slate-900/60 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-[3rem] overflow-hidden relative ring-1 ring-white/5">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
            
            <div className="p-8 pb-6 border-b border-white/10 flex justify-between items-center relative z-10">
              <div>
                <h3 className="text-2xl font-bold text-white drop-shadow-md">Alışveriş Sepeti</h3>
                <p className="text-xs text-indigo-300 font-bold tracking-widest uppercase mt-1">İçerik: {cart.length} Ürün</p>
              </div>
               <motion.button onClick={handleClearCart} whileHover={{ scale: 1.1, rotate: 10 }} whileTap={btnTap} className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-lg" title="Sepeti Boşalt">
                <Trash2 className="w-5 h-5" />
              </motion.button>
            </div>
            
            <div className="px-8 py-4 bg-black/20 flex justify-between text-[11px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-white/5 relative z-10">
              <div className="flex-1">Ürün/Barkod</div><div className="w-16 text-center">Miktar</div><div className="w-20 text-right">Tutar</div><div className="w-8 ml-2"></div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 relative z-10 scrollbar-hide">
               {cart.length === 0 ? (
                 <div className="flex-1 flex flex-col items-center justify-center gap-5">
                   <motion.div animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }} className="w-32 h-32 rounded-full border border-indigo-500/30 bg-indigo-500/10 flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.2)]">
                      <Box className="w-12 h-12 text-indigo-400 drop-shadow-lg" />
                   </motion.div>
                   <p className="text-indigo-200/50 font-semibold text-sm text-center tracking-wide">Henüz ürün eklenmedi.<br/><span className="text-xs font-normal">Işık hızında sipariş için barkod okutun.</span></p>
                 </div>
               ) : (
                 <AnimatePresence>
                   {cart.map(item => (
                     <motion.div initial={{ opacity: 0, x: -30, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} key={item.productId} className="flex justify-between items-center bg-white/5 border border-white/10 p-5 rounded-3xl shadow-xl hover:bg-white/10 hover:border-indigo-500/50 transition-all overflow-hidden relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/0 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex-1 relative z-10">
                           <p className="font-bold text-white text-md drop-shadow-md">{item.name}</p>
                           <p className="text-[10px] font-extrabold text-cyan-300 bg-cyan-900/40 border border-cyan-500/30 inline-block px-2 py-0.5 rounded-md mt-1.5 shadow-sm">{item.barcode}</p>
                        </div>
                        <div className="w-14 text-center text-sm font-extrabold text-white bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg px-2 py-1.5 rounded-xl border border-white/20 mr-2 relative z-10">x{item.cartQuantity}</div>
                        <div className="w-24 text-right font-black text-white text-lg drop-shadow-lg relative z-10">₺{(item.salePrice * item.cartQuantity).toLocaleString('tr-TR')}</div>
                        <button onClick={() => handleRemoveItem(item.productId)} className="ml-3 p-2.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl hover:bg-rose-500 hover:shadow-lg hover:shadow-rose-500/50 transition-all relative z-10">
                           <X className="w-4 h-4"/>
                        </button>
                     </motion.div>
                   ))}
                 </AnimatePresence>
               )}
            </div>

            <div className="p-8 bg-black/30 border-t border-white/10 relative overflow-hidden backdrop-blur-2xl z-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-bl-full -z-10 blur-[80px]"></div>
              
              <div className="space-y-4 mb-2">
                <div className="flex justify-between text-sm text-indigo-200 font-semibold">
                  <span>Ara Toplam</span><span className="font-bold text-white">₺{subtotal.toLocaleString('tr-TR', {minimumFractionDigits:2})}</span>
                </div>
                <div className="flex justify-between text-sm text-rose-400 font-semibold cursor-pointer hover:font-bold transition-all" onClick={() => setShowDiscount(true)}>
                  <span className="border-b border-dashed border-rose-400/50 pb-0.5">İskonto Tanımla</span>
                  <span className="font-bold">- ₺{globalDiscount.toLocaleString('tr-TR', {minimumFractionDigits:2})}</span>
                </div>
                <div className="flex justify-between items-end pt-5 mt-3 border-t border-white/10">
                  <span className="font-bold text-white text-xl">Toplam Tutar</span>
                  <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-indigo-300 to-purple-300 drop-shadow-[0_0_20px_rgba(99,102,241,0.5)]">₺{total.toLocaleString('tr-TR', {minimumFractionDigits:2})}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* MAIN ACTIONS (Right) */}
          <div className="xl:col-span-8 flex flex-col gap-8 h-full">
             
             {/* TOP PANEL: BARCODE & NUMPAD */}
             <motion.div variants={panelVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }} className="bg-slate-900/60 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-[3rem] p-8 lg:p-10 flex flex-col md:flex-row gap-12 ring-1 ring-white/5 relative overflow-hidden">
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none"></div>
                
                {/* Input & Features */}
                <div className="flex-1 flex flex-col relative z-10">
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-md">Seri İşlem</h3>
                     <motion.button whileTap={btnTap} className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 shadow-inner text-sm font-bold text-cyan-300 flex items-center gap-2 hover:bg-white/10 transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                        <QrCode className="w-4 h-4"/> Okuyucu Aktif
                     </motion.button>
                  </div>
                  
                  <div className="relative group mb-10 flex-1 flex flex-col justify-center">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-[2.5rem] blur-xl opacity-30 group-focus-within:opacity-60 transition-opacity duration-500"></div>
                    <form onSubmit={(e) => { e.preventDefault(); handleSearchBarcode(); }} className="relative flex items-center bg-black/40 border border-white/20 rounded-[2.5rem] overflow-hidden focus-within:border-cyan-400 focus-within:ring-4 focus-within:ring-cyan-400/20 transition-all shadow-2xl backdrop-blur-md">
                       <Search className="w-8 h-8 text-cyan-300 ml-8 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                       <input 
                         type="text" 
                         value={barcodeInput}
                         onChange={e => setBarcodeInput(e.target.value)}
                         className="w-full bg-transparent border-none py-8 px-6 text-4xl font-black text-white focus:outline-none placeholder-white/20 tracking-widest"
                         placeholder="1010..."
                       />
                       {barcodeInput && (
                         <button type="button" onClick={() => setBarcodeInput('')} className="mr-6 p-4 text-white/40 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all">
                           <X className="w-8 h-8"/>
                         </button>
                       )}
                    </form>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <motion.button onClick={fetchInventoryItems} whileHover={{ y: -5, scale: 1.02 }} whileTap={btnTap} className="py-4 px-3 bg-gradient-to-b from-white/10 to-white/5 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-2xl text-[13px] font-bold text-slate-200 hover:text-white hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all text-center">Ürün Seç</motion.button>
                     <motion.button onClick={() => toast("Satış Sorumlusu başarıyla 'Faruk Y.' olarak atandı.", { className: 'bg-indigo-50 text-indigo-700 font-bold rounded-xl' })} whileHover={{ y: -5, scale: 1.02 }} whileTap={btnTap} className="py-4 px-3 bg-gradient-to-b from-white/10 to-white/5 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-2xl text-[13px] font-bold text-slate-200 hover:text-white hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all text-center">Sorumlu</motion.button>
                     <motion.button onClick={() => setShowDiscount(true)} whileHover={{ y: -5, scale: 1.02 }} whileTap={btnTap} className="py-4 px-3 bg-gradient-to-b from-white/10 to-white/5 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-2xl text-[13px] font-bold text-slate-200 hover:text-white hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all text-center">İskonto</motion.button>
                     <motion.button onClick={handleClearCart} whileHover={{ y: -5, scale: 1.02 }} whileTap={btnTap} className="py-4 px-3 bg-gradient-to-b from-white/10 to-white/5 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-2xl text-[13px] font-bold text-rose-300 hover:text-rose-100 hover:border-rose-400/50 hover:shadow-[0_0_20px_rgba(244,63,94,0.3)] transition-all text-center">Sepeti Boşalt</motion.button>
                  </div>
                </div>

                {/* Sleek Dark Numpad */}
                <div className="md:w-[360px] shrink-0 relative z-10">
                  <div className="grid grid-cols-4 gap-4">
                    {['7','8','9','4','5','6','1','2','3'].map(num => (
                       <motion.button key={num} onClick={() => handleNumpad(num)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="aspect-square bg-white/5 border border-white/10 shadow-inner rounded-[1.5rem] text-4xl font-semibold text-white hover:bg-white/20 hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] transition-all flex items-center justify-center">
                         {num}
                       </motion.button>
                    ))}
                    <motion.button onClick={() => handleNumpad('C')} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="col-start-4 row-start-1 aspect-square bg-rose-500/20 border border-rose-500/50 shadow-inner rounded-[1.5rem] text-3xl font-extrabold text-rose-400 hover:bg-rose-500 hover:text-white hover:shadow-[0_0_25px_rgba(244,63,94,0.5)] transition-all flex items-center justify-center">
                      C
                    </motion.button>
                    <motion.button onClick={() => handleNumpad('*')} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="col-start-4 row-start-2 aspect-square bg-white/5 border border-white/10 shadow-inner rounded-[1.5rem] text-4xl font-semibold text-white hover:bg-white/20 transition-all flex items-center justify-center">
                      *
                    </motion.button>
                     <motion.button onClick={() => handleNumpad('.')} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="col-start-4 row-start-3 aspect-square bg-white/5 border border-white/10 shadow-inner rounded-[1.5rem] text-4xl font-semibold text-white hover:bg-white/20 transition-all flex items-center justify-center">
                      .
                    </motion.button>
                    <motion.button onClick={() => handleNumpad('0')} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="col-span-2 aspect-[2/0.9] bg-white/5 border border-white/10 shadow-inner rounded-[1.5rem] text-4xl font-semibold text-white hover:bg-white/20 transition-all flex items-center justify-center">
                      0
                    </motion.button>
                    <motion.button onClick={() => handleNumpad('Ekle')} disabled={isSearching} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="col-span-2 aspect-[2/0.9] bg-gradient-to-br from-cyan-400 to-blue-600 disabled:opacity-50 border border-white/20 rounded-[1.5rem] text-2xl font-black text-white shadow-[0_15px_30px_rgba(6,182,212,0.4)] hover:shadow-[0_20px_40px_rgba(6,182,212,0.6)] transition-all flex items-center justify-center gap-3">
                       {isSearching ? <Loader2 className="w-8 h-8 animate-spin"/> : <>Ekle <Search className="w-6 h-6"/></>}
                    </motion.button>
                  </div>
                </div>

             </motion.div>

             {/* BOTTOM PANELS */}
             <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 flex-1">
                
                {/* PAYMENT BLOCK */}
                <motion.div variants={panelVariants} initial="hidden" animate="visible" transition={{ delay: 0.3 }} className="bg-slate-900/60 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-[3rem] p-8 lg:p-10 flex flex-col justify-between ring-1 ring-white/5 overflow-hidden relative">
                   <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-[80px] pointer-events-none"></div>
                   
                   <h4 className="text-2xl font-black text-white mb-8 flex items-center gap-4 drop-shadow-md">
                     <div className="p-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl shadow-inner"><Banknote className="w-6 h-6"/></div> Ödeme Al
                   </h4>
                   <div className="grid grid-cols-2 gap-5 relative z-10">
                      <motion.button disabled={isProcessing} onClick={() => handleCheckout('Nakit')} whileHover={{ y: -5, scale: 1.02 }} whileTap={btnTap} className="h-32 bg-gradient-to-br from-emerald-400 to-teal-600 disabled:opacity-50 text-white rounded-[2rem] font-bold shadow-[0_10px_30px_rgba(16,185,129,0.4)] hover:shadow-[0_15px_40px_rgba(16,185,129,0.6)] border border-white/20 transition-all flex flex-col items-center justify-center gap-2">
                         <Banknote className="w-10 h-10 mb-1 drop-shadow-md" /> NAKİT
                      </motion.button>
                      <motion.button disabled={isProcessing} onClick={() => handleCheckout('Kredi Kartı')} whileHover={{ y: -5, scale: 1.02 }} whileTap={btnTap} className="h-32 bg-gradient-to-br from-blue-500 to-indigo-600 disabled:opacity-50 text-white rounded-[2rem] font-bold shadow-[0_10px_30px_rgba(59,130,246,0.4)] hover:shadow-[0_15px_40px_rgba(59,130,246,0.6)] border border-white/20 transition-all flex flex-col items-center justify-center gap-2">
                         <CreditCard className="w-10 h-10 mb-1 drop-shadow-md" /> KART
                      </motion.button>
                      <motion.button disabled={isProcessing} onClick={() => handleCheckout('Havale')} whileHover={{ y: -3 }} whileTap={btnTap} className="col-span-2 py-5 bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 border border-purple-500/30 disabled:opacity-50 text-purple-200 rounded-2xl font-bold shadow-inner hover:bg-purple-500/30 transition-all flex items-center justify-center gap-3 text-lg">
                         <RefreshCcw className="w-5 h-5" /> HAVALE / EFT İLE TAMAMLA
                      </motion.button>
                   </div>
                </motion.div>

                {/* CUSTOMER CRM */}
                <motion.div variants={panelVariants} initial="hidden" animate="visible" transition={{ delay: 0.4 }} className="bg-slate-900/60 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-[3rem] p-8 lg:p-10 flex flex-col ring-1 ring-white/5 overflow-hidden relative">
                   <div className="absolute -bottom-10 -right-10 w-52 h-52 bg-pink-500/20 rounded-full blur-[80px] pointer-events-none"></div>

                   <div className="flex justify-between items-center mb-6 relative z-10">
                      <h4 className="text-2xl font-black text-white flex items-center gap-4 drop-shadow-md">
                        <div className="p-3 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-2xl shadow-inner"><User className="w-6 h-6"/></div> Müşteri (CRM)
                      </h4>
                   </div>

                   <div className="space-y-4 flex-1 flex flex-col justify-end relative z-10">
                      <div className="p-8 rounded-[2rem] bg-black/40 border border-white/10 shadow-inner flex flex-col items-center justify-center gap-4 text-slate-400 my-auto">
                         <div className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shadow-lg mb-2">
                           <User className="w-10 h-10 text-slate-500" />
                         </div>
                         <span className="text-md font-bold text-center text-white/80">Kayıtsız Hızlı Satış Modu<br/><span className="text-xs font-medium text-slate-500">(Ziyaretçi Müşteri)</span></span>
                      </div>
                   </div>
                </motion.div>

             </div>
          </div>
        </div>
      </div>

      {/* ----------------- MODALS ----------------- */}
      <AnimatePresence>
        
        {/* Receipt / Fiş Modal */}
        {completedOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 print:hidden">
            <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col relative text-white border border-white/10 drop-shadow-[0_0_50px_rgba(16,185,129,0.3)]">
              <div className="p-10 text-center bg-gradient-to-b from-emerald-900/50 to-slate-900 border-b border-white/10 flex flex-col items-center relative overflow-hidden">
                 <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                 <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 text-white rounded-full flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(16,185,129,0.5)] border-4 border-slate-900">
                    <FileText className="w-10 h-10 drop-shadow-md" />
                 </div>
                 <h2 className="text-3xl font-black text-white mb-2 drop-shadow-md">BAŞARILI!</h2>
                 <p className="text-lg font-bold text-emerald-400 bg-emerald-900/30 px-4 py-1 rounded-xl border border-emerald-500/20">{completedOrder.orderNumber}</p>
                 <p className="text-xs font-medium text-slate-400 mt-4">{completedOrder.date}</p>
              </div>
              <div className="p-8">
                 <div className="max-h-52 overflow-y-auto mb-6 border-b border-dashed border-white/20 pb-4 scrollbar-hide">
                    {completedOrder.items.map((it:any, idx:number) => (
                      <div key={idx} className="flex justify-between items-center mb-3 text-sm font-medium">
                        <div>
                          <p className="text-white font-bold">{it.name}</p>
                          <p className="text-[11px] text-cyan-400 font-bold bg-cyan-900/30 px-1.5 py-0.5 rounded mt-1 inline-block border border-cyan-500/20">x{it.cartQuantity} Adet</p>
                        </div>
                        <p className="font-extrabold text-white text-lg">{(it.salePrice * it.cartQuantity).toLocaleString('tr-TR')} ₺</p>
                      </div>
                    ))}
                 </div>
                 
                 <div className="flex justify-between text-sm text-slate-400 mb-2 font-medium">Ara Toplam: <b className="text-white">{subtotal.toLocaleString('tr-TR')} ₺</b></div>
                 {completedOrder.discount > 0 && <div className="flex justify-between text-sm text-rose-400 mb-2 font-bold">İskonto: <b>-{completedOrder.discount.toLocaleString('tr-TR')} ₺</b></div>}
                 <div className="flex justify-between text-2xl text-white font-black mt-4 pt-4 border-t border-white/20">
                    <span>TOPLAM:</span> <span className="text-emerald-400 drop-shadow-md">{completedOrder.total.toLocaleString('tr-TR')} ₺</span>
                 </div>
                 <div className="text-center mt-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Ödeme Tipi: {completedOrder.method}</div>
              </div>
              <div className="p-6 bg-slate-800 border-t border-white/10 grid grid-cols-2 gap-4">
                 <button onClick={() => setCompletedOrder(null)} className="py-4 font-bold text-slate-300 bg-slate-900 border border-white/10 rounded-2xl hover:bg-slate-700 hover:text-white transition-colors shadow-inner">Ekranı Kapat</button>
                 <button onClick={printReceipt} className="py-4 font-black text-slate-900 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-2xl hover:brightness-110 transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2"><FileText className="w-5 h-5"/> Fiş Yazdır</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Z Raporu Modal */}
        {showZReport && zReportData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 print:hidden">
            <motion.div initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col border border-white/10">
               <div className="p-8 bg-gradient-to-r from-indigo-900 to-purple-900 text-white flex justify-between items-center border-b border-white/10">
                  <div>
                    <h2 className="text-2xl font-black drop-shadow-md">Kozmik Z-Raporu</h2>
                    <p className="text-sm text-indigo-200 mt-1 font-semibold">Günün Satış Bilançosu</p>
                  </div>
                  <button onClick={() => setShowZReport(false)} className="text-white/50 hover:text-white bg-white/5 p-3 rounded-xl border border-white/10 transition-colors"><X className="w-6 h-6"/></button>
               </div>
               <div className="p-8 grid grid-cols-2 gap-6 bg-slate-800">
                  <div className="bg-slate-900/50 p-6 rounded-[2rem] border border-white/5 shadow-inner text-center">
                     <p className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-widest">Sistem Cirosu</p>
                     <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 drop-shadow-md">{zReportData.totalRevenue.toLocaleString('tr-TR')} ₺</p>
                  </div>
                  <div className="bg-slate-900/50 p-6 rounded-[2rem] border border-white/5 shadow-inner text-center">
                     <p className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-widest">Adet / Hacim</p>
                     <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 drop-shadow-md">{zReportData.totalOrders} Sipariş</p>
                  </div>
               </div>
               <div className="p-8 pt-4 bg-slate-800 overflow-y-auto max-h-72 scrollbar-hide">
                  <h3 className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-widest border-b border-white/5 pb-2">Canlı İşlem Logu</h3>
                  {zReportData.ordersList.length === 0 ? (
                    <p className="text-sm text-slate-400 font-medium py-4 text-center">Gölge sessiz, henüz işlem yok.</p>
                  ) : zReportData.ordersList.map((ord:any, i:number) => (
                    <div key={i} className="flex justify-between items-center py-4 border-b border-white/5 last:border-0 hover:bg-white/5 px-4 rounded-2xl transition-colors cursor-default">
                       <div className="flex items-center gap-4">
                         <div className="bg-slate-700/50 px-3 py-1 rounded-lg text-xs font-bold text-slate-300 border border-white/5">{ord.time}</div>
                         <span className="font-bold text-white tracking-wide">{ord.orderNumber}</span>
                       </div>
                       <div className="font-black text-cyan-400 text-lg">{ord.totalAmount.toLocaleString('tr-TR')} ₺</div>
                    </div>
                  ))}
               </div>
            </motion.div>
          </motion.div>
        )}

        {/* Product Search Modal */}
        {showProductSearch && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 print:hidden">
            <motion.div initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col h-[75vh] border border-white/10">
               <div className="p-8 border-b border-white/10 flex justify-between items-center bg-slate-800">
                  <h2 className="text-2xl font-black text-white tracking-wide">Katalog Taraması</h2>
                  <button onClick={() => setShowProductSearch(false)} className="text-slate-400 hover:text-white bg-white/5 p-3 rounded-xl border border-white/10"><X className="w-6 h-6"/></button>
               </div>
               <div className="p-6 bg-slate-900/50 border-b border-white/5 shadow-inner">
                  <div className="flex bg-black/40 items-center px-6 py-4 rounded-[2rem] border border-white/10 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all">
                    <Search className="w-6 h-6 text-cyan-500 mr-4" />
                    <input type="text" placeholder="Radardan ürün adı veya kod arayın..." className="bg-transparent border-none outline-none w-full text-lg font-bold text-white placeholder-white/20" />
                  </div>
               </div>
               <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3 bg-slate-800 scrollbar-hide">
                  {inventoryList.map((prod:any) => (
                    <div key={prod.id || prod.productId} className="flex justify-between items-center p-5 bg-white/5 border border-white/10 rounded-[1.5rem] hover:bg-white/10 hover:border-cyan-500/50 transition-all group">
                       <div>
                         <h4 className="font-bold text-white text-lg">{prod.name}</h4>
                         <div className="flex items-center gap-3 mt-2">
                           <span className="text-[11px] font-black text-slate-800 bg-cyan-400 px-2.5 py-1 rounded-md drop-shadow-md">{prod.barcode}</span>
                           <span className="text-xs font-bold text-slate-400">Canlı Stok: <span className="text-white">{prod.quantity}</span> Adet</span>
                         </div>
                       </div>
                       <div className="flex items-center gap-6">
                         <span className="font-black text-2xl text-white drop-shadow-md">{prod.salePrice.toLocaleString('tr-TR')} ₺</span>
                         <button onClick={() => { addItemToCart({...prod, productId: prod.id}); setShowProductSearch(false); }} className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all">ZIMBALA</button>
                       </div>
                    </div>
                  ))}
               </div>
            </motion.div>
          </motion.div>
        )}

        {/* Global Discount Modal */}
        {showDiscount && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 print:hidden">
            <motion.div initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-10 border border-white/10 text-center relative">
               <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/20 rounded-bl-full blur-[50px] pointer-events-none"></div>
               <h2 className="text-3xl font-black text-white mb-2 drop-shadow-md relative z-10">Özel İskonto</h2>
               <p className="text-sm font-semibold text-rose-300 mb-8 relative z-10">Müşteriye özel net TL bazlı indirim uygulayın.</p>
               <input 
                 type="number" 
                 min="0"
                 placeholder="Örn: 150" 
                 value={discountInput}
                 onChange={(e) => setDiscountInput(e.target.value)}
                 className="w-full bg-black/50 border-2 border-white/10 py-5 px-6 rounded-2xl text-3xl font-black text-white focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 transition-all mb-8 text-center shadow-inner relative z-10"
               />
               <div className="grid grid-cols-2 gap-4 relative z-10">
                 <button onClick={() => setShowDiscount(false)} className="py-4 font-bold text-slate-300 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors">Vazgeç</button>
                 <button onClick={() => { setGlobalDiscount(parseFloat(discountInput) || 0); setShowDiscount(false); setDiscountInput(''); }} className="py-4 font-black text-white bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl shadow-[0_0_20px_rgba(244,63,94,0.5)] hover:shadow-[0_0_30px_rgba(244,63,94,0.7)] hover:brightness-110 transition-all text-lg">Uygula</button>
               </div>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
