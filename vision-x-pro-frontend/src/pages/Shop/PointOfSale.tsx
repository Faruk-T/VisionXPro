import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Trash2, Box, QrCode, User, 
  CreditCard, Banknote, Loader2, X, RefreshCcw, FileText, Zap
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import api from '../../lib/api';
import ComplianceAlertModal, { type ComplianceAlert } from '../../components/ComplianceAlertModal';

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
  const [complianceAlerts, setComplianceAlerts] = useState<ComplianceAlert[]>([]);
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [lastOrderNumber, setLastOrderNumber] = useState('');
  
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', segment: 'Standart' });

  const [showDiscount, setShowDiscount] = useState(false);
  const [, setDiscountPercent] = useState<number>(0);
  const [discountInput, setDiscountInput] = useState('');
  
  // Phase 4: SGK ve Kaparo (Partial Pay)
  const [sgkAmount, setSgkAmount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [isSgkActive, setIsSgkActive] = useState<boolean>(false);
  const [isPartialPay, setIsPartialPay] = useState<boolean>(false);
  
  const [showRepModal, setShowRepModal] = useState(false);
  const [repInput, setRepInput] = useState('');
  const [salesRep, setSalesRep] = useState('Merkez Kasiyer');
  const [employees, setEmployees] = useState<any[]>([]);
  const [scanMode, setScanMode] = useState(true);
  const [serialQty, setSerialQty] = useState(1);
  const barcodeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await api.get<any[]>('/dashboard/employees');
        setEmployees(data);
        if (data.length > 0) {
          setSalesRep(data[0].fullName);
          setRepInput(data[0].fullName);
        }
      } catch (err) {
        console.error('Failed to fetch employees', err);
      }
    };
    fetchEmployees();
  }, []);

  const handleNumpad = (val: string) => {
    if (val === 'C') {
      setBarcodeInput('');
    } else if (val === 'Ekle') {
      handleSearchBarcode();
    } else {
      setBarcodeInput(prev => prev + val);
    }
  };

  const resolvedProductId = (product: any) =>
    product?.productId ?? product?.ProductId ?? product?.id;

  const addItemToCart = (product: any, qty = 1) => {
    const pid = resolvedProductId(product);
    if (!pid) {
      toast.error('Ürün kimliği eksik; listeyi yenileyip tekrar deneyin.', { className: 'bg-red-50 text-red-700 border border-red-200 shadow-xl rounded-2xl font-bold' });
      return;
    }
    if (product.quantity <= 0) {
      toast.error("Ürün stokta yok!", { className: 'bg-red-50 text-red-700 border border-red-200 shadow-xl rounded-2xl font-bold' });
      return;
    }
    const addCount = Math.max(1, qty);
    setCart(prev => {
      const existing = prev.find(p => resolvedProductId(p) === pid);
      if (existing) {
        const nextQty = existing.cartQuantity + addCount;
        if (nextQty > product.quantity) {
          toast.error("Maksimum stok adedine ulaştınız!", { className: 'bg-orange-50 text-orange-700 border border-orange-200 shadow-xl rounded-2xl font-bold' });
          return prev;
        }
        return prev.map(p => resolvedProductId(p) === pid
          ? { ...p, cartQuantity: nextQty } : p);
      }
      if (addCount > product.quantity) {
        toast.error("Maksimum stok adedine ulaştınız!", { className: 'bg-orange-50 text-orange-700 border border-orange-200 shadow-xl rounded-2xl font-bold' });
        return prev;
      }
      return [...prev, { ...product, productId: pid, cartQuantity: addCount }];
    });
    toast.success(addCount > 1 ? `${addCount} adet eklendi!` : "Ürün eklendi!", { className: 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xl rounded-2xl font-bold' });
  };

  const handleSearchBarcode = async () => {
    if (!barcodeInput.trim()) return;
    setIsSearching(true);
    try {
      const product = await api.get(`/products/search?barcode=${barcodeInput}`);
      addItemToCart({ ...product, productId: product.productId ?? product.ProductId, quantity: product.quantity }, serialQty);
      setBarcodeInput('');
      if (scanMode) barcodeRef.current?.focus();
    } catch(err: any) {
      toast.error(err.message || "Barkod bulunamadı.", { className: 'bg-red-50 text-red-700 border border-red-200 shadow-xl rounded-2xl font-bold' });
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
    if (!selectedCustomer) {
      toast.error("Lütfen bir müşteri seçiniz!", { className: 'bg-red-50 text-red-700 border border-red-200 shadow-xl rounded-2xl font-bold' });
      return;
    }
    setIsProcessing(true);
    try {
      const totalAmt = cart.reduce((acc, curr) => acc + (curr.salePrice * curr.cartQuantity), 0) - globalDiscount;
      const finalPaidAmount = isPartialPay ? paidAmount : (totalAmt - (isSgkActive ? sgkAmount : 0));

      const payload = {
        totalAmount: totalAmt + globalDiscount,
        discountAmount: globalDiscount,
        paymentMethod: method,
        salesChannel: 'POS',
        salesRepresentative: salesRep,
        customerId: selectedCustomer.id,
        paidAmount: finalPaidAmount > 0 ? finalPaidAmount : 0,
        sgkAmount: isSgkActive ? sgkAmount : 0,
        items: cart.map(c => ({ productId: c.productId, quantity: c.cartQuantity, unitPrice: c.salePrice }))
      };

      if (payload.items.some((i: { productId?: string }) => !i.productId)) {
        toast.error('Sepette geçersiz ürün satırı var. Sepeti temizleyip yeniden ekleyin.');
        setIsProcessing(false);
        return;
      }

      const result = await api.post('/orders', payload);
      toast.success(`Satış Onaylandı! Fiş No: ${result.orderNumber}`, { className: 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xl rounded-2xl font-bold' });

      if (result.complianceAlerts?.length) {
        setComplianceAlerts(result.complianceAlerts);
        setLastOrderNumber(result.orderNumber);
        setShowComplianceModal(true);
      }
      
      setCompletedOrder({
        orderNumber: result.orderNumber,
        items: [...cart],
        total: payload.totalAmount,
        discount: payload.discountAmount,
        method: method,
        salesRep: salesRep,
        date: new Date().toLocaleString('tr-TR')
      });

      setCart([]);
      setBarcodeInput('');
      setGlobalDiscount(0);
      setSgkAmount(0);
      setPaidAmount(0);
      setIsSgkActive(false);
      setIsPartialPay(false);
      fetchInventoryItems();
      try {
        const refreshed = await api.get('/customers');
        setCustomersList(refreshed);
        const updated = refreshed.find((c: any) => c.id === selectedCustomer.id);
        if (updated) setSelectedCustomer(updated);
      } catch { /* keep current customer */ }
    } catch(err: any) {
      toast.error(err.message || "İşlem başarısız.");
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchZReport = async () => {
    try {
      const data = await api.get('/orders/today');
      setZReportData(data);
      setShowZReport(true);
    } catch(err) { }
  };

  const fetchInventoryItems = async () => {
    try {
      const data = await api.get('/products');
      setInventoryList(data);
      setShowProductSearch(true);
    } catch(err) { }
  };

  const fetchCustomersList = async () => {
    try {
      const data = await api.get('/customers');
      setCustomersList(data);
      setShowCustomerSearch(true);
    } catch(err) { }
  };

  const printReceipt = () => window.print();

  const panelVariants: any = { hidden: { opacity: 0, scale: 0.98, y: 30 }, visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } } };
  const btnTap = { scale: 0.92 };
  
  const subtotal = cart.reduce((acc, curr) => acc + (curr.salePrice * curr.cartQuantity), 0);
  const total = (subtotal - globalDiscount) > 0 ? (subtotal - globalDiscount) : 0;
  
  // Handlers for Discount
  const handleQuickDiscount = (percent: number) => {
    setDiscountPercent(percent);
    setDiscountInput(percent.toString());
  };

  const applyDiscountAndClose = () => {
    const rawVal = parseFloat(discountInput) || 0;
    // Calculate the total discount amount if 'discountInput' acts as percentage
    // Based on user's screenshot, input is "İskonto Oranı (%)"
    const pct = rawVal > 100 ? 100 : rawVal;
    const computedDiscount = subtotal * (pct / 100);
    setGlobalDiscount(computedDiscount);
    setDiscountPercent(pct);
    setShowDiscount(false);
  };

  return (
    <div className="font-sans min-h-full p-4 md:p-8 lg:p-10 relative overflow-hidden bg-[#F8FAFC]">
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
             <div className="text-[10px] mt-2 mb-4 border-b border-dashed border-black pb-2 text-center text-gray-700">Satış Sorumlusu: {completedOrder.salesRep}</div>
             <div className="text-center mt-2 text-xs">Mali değeri yoktur. Bilgi Fişidir.<br/>Bizi tercih ettiğiniz için teşekkürler!</div>
           </div>
         )}
      </div>

      {/* Vibrant Cosmic Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 print:hidden">
        <motion.div animate={{ rotate: 360, scale: [1, 1.1, 1] }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }} className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] bg-gradient-to-br from-indigo-200/40 via-purple-200/30 to-rose-200/40 rounded-full blur-[140px] mix-blend-multiply"></motion.div>
        <motion.div animate={{ rotate: -360, scale: [1, 1.2, 1] }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }} className="absolute bottom-[0%] -right-[15%] w-[65%] h-[75%] bg-gradient-to-tl from-cyan-200/30 via-blue-200/40 to-teal-200/30 rounded-full blur-[150px] mix-blend-multiply"></motion.div>
      </div>

      <div className="relative z-10 mx-auto max-w-[1700px] h-full flex flex-col gap-6 print:hidden">
        
        {/* Header Ribbon */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-end backdrop-blur-3xl bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-rose-500"></div>
          <div>
            <div className="inline-flex items-center justify-center px-4 py-1.5 mb-3 rounded-full bg-gradient-to-r from-purple-500/20 to-rose-500/20 text-rose-200 text-xs font-extrabold tracking-widest uppercase border border-slate-200 shadow-inner">
              <Zap className="w-3 h-3 mr-1.5 text-rose-600" /> VISION X PRO POS
            </div>
            <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-500 tracking-tight">Hızlı Satış Paneli</h2>
          </div>
          
          <div className="flex gap-4">
             <motion.button onClick={fetchZReport} whileHover={{ scale: 1.05 }} whileTap={btnTap} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-slate-200 text-purple-700 shadow-[0_0_20px_rgba(168,85,247,0.2)] rounded-2xl text-sm font-bold hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:bg-slate-100 transition-all">
               <FileText className="w-4 h-4" /> Z Raporu
             </motion.button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start h-full pb-10">
          
          {/* CART PANE (Left) */}
          <motion.div variants={panelVariants} initial="hidden" animate="visible" transition={{ delay: 0.1 }} className="xl:col-span-4 h-full min-h-[750px] flex flex-col bg-white/90 backdrop-blur-3xl border border-slate-200 shadow-2xl rounded-[3rem] overflow-hidden relative ring-1 ring-white/5">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
            
            <div className="p-8 pb-6 border-b border-slate-200 flex justify-between items-center relative z-10">
              <div>
                <h3 className="text-2xl font-bold text-slate-800 drop-shadow-md">Alışveriş Sepeti</h3>
                <p className="text-xs text-indigo-600 font-bold tracking-widest uppercase mt-1">İçerik: {cart.length} Ürün</p>
              </div>
               <motion.button onClick={handleClearCart} whileHover={{ scale: 1.1, rotate: 10 }} whileTap={btnTap} className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 text-rose-600 border border-rose-500/30 flex items-center justify-center hover:bg-rose-500 hover:text-slate-800 transition-all shadow-lg" title="Sepeti Boşalt">
                <Trash2 className="w-5 h-5" />
              </motion.button>
            </div>
            
            <div className="px-8 py-4 bg-slate-100 flex justify-between text-[11px] font-extrabold text-slate-500 uppercase tracking-widest border-b border-slate-100 relative z-10">
              <div className="flex-1">Ürün/Barkod</div><div className="w-16 text-center">Miktar</div><div className="w-20 text-right">Tutar</div><div className="w-8 ml-2"></div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 relative z-10 scrollbar-hide">
               {cart.length === 0 ? (
                 <div className="flex-1 flex flex-col items-center justify-center gap-5">
                   <motion.div animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }} className="w-32 h-32 rounded-full border border-indigo-500/30 bg-indigo-500/10 flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.2)]">
                      <Box className="w-12 h-12 text-indigo-400 drop-shadow-lg" />
                   </motion.div>
                   <p className="text-indigo-700/50 font-semibold text-sm text-center tracking-wide">Henüz ürün eklenmedi.<br/><span className="text-xs font-normal">Işık hızında sipariş için barkod okutun.</span></p>
                 </div>
               ) : (
                 <AnimatePresence>
                   {cart.map(item => (
                     <motion.div initial={{ opacity: 0, x: -30, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} key={item.productId} className="flex justify-between items-center bg-white border border-slate-200 p-5 rounded-3xl shadow-xl hover:bg-slate-100 hover:border-indigo-500/50 transition-all overflow-hidden relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/0 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex-1 relative z-10">
                           <p className="font-bold text-slate-800 text-md drop-shadow-md">{item.name}</p>
                           <p className="text-[10px] font-extrabold text-cyan-700 bg-cyan-900/40 border border-cyan-500/30 inline-block px-2 py-0.5 rounded-md mt-1.5 shadow-sm">{item.barcode}</p>
                        </div>
                        <div className="w-14 text-center text-sm font-extrabold text-slate-800 bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg px-2 py-1.5 rounded-xl border border-slate-200 mr-2 relative z-10">x{item.cartQuantity}</div>
                        <div className="w-24 text-right font-black text-slate-800 text-lg drop-shadow-lg relative z-10">₺{(item.salePrice * item.cartQuantity).toLocaleString('tr-TR')}</div>
                        <button onClick={() => handleRemoveItem(item.productId)} className="ml-3 p-2.5 text-slate-500 hover:text-slate-800 bg-white rounded-xl hover:bg-rose-500 hover:shadow-lg hover:shadow-rose-500/50 transition-all relative z-10">
                           <X className="w-4 h-4"/>
                        </button>
                     </motion.div>
                   ))}
                 </AnimatePresence>
               )}
            </div>

            <div className="p-8 bg-slate-50/80 border-t border-slate-200 relative overflow-hidden backdrop-blur-2xl z-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100 rounded-bl-full -z-10 blur-[80px]"></div>
              
              <div className="space-y-4 mb-2">
                <div className="flex justify-between text-sm text-indigo-700 font-semibold">
                  <span>Ara Toplam</span><span className="font-bold text-slate-800">₺{subtotal.toLocaleString('tr-TR', {minimumFractionDigits:2})}</span>
                </div>
                <div className="flex justify-between text-sm text-rose-600 font-semibold cursor-pointer hover:font-bold transition-all" onClick={() => setShowDiscount(true)}>
                  <span className="border-b border-dashed border-rose-400/50 pb-0.5">İskonto Tanımla</span>
                  <span className="font-bold">- ₺{globalDiscount.toLocaleString('tr-TR', {minimumFractionDigits:2})}</span>
                </div>
                
                <div className="flex justify-between text-sm text-emerald-600 font-semibold mt-2 cursor-pointer hover:font-bold transition-all" onClick={() => setIsSgkActive(!isSgkActive)}>
                  <span className="border-b border-dashed border-emerald-400/50 pb-0.5">SGK İndirimi {isSgkActive ? '(Aktif)' : '(Ekle)'}</span>
                  {isSgkActive && <span className="font-bold">- ₺{sgkAmount.toLocaleString('tr-TR', {minimumFractionDigits:2})}</span>}
                </div>
                {isSgkActive && (
                  <input type="number" min="0" value={sgkAmount} onChange={e => setSgkAmount(Number(e.target.value))} className="w-full mt-1 px-3 py-2 border border-emerald-200 rounded-xl text-sm font-bold text-emerald-700 bg-emerald-50 outline-none focus:ring-2 focus:ring-emerald-400/50" placeholder="Örn: 1500" />
                )}

                <div className="flex justify-between text-sm text-cyan-600 font-semibold mt-2 cursor-pointer hover:font-bold transition-all" onClick={() => setIsPartialPay(!isPartialPay)}>
                  <span className="border-b border-dashed border-cyan-400/50 pb-0.5">Kaparo / Kısmi Ödeme {isPartialPay ? '(Aktif)' : '(Peşin Alınacak)'}</span>
                  {isPartialPay && <span className="font-bold">₺{paidAmount.toLocaleString('tr-TR', {minimumFractionDigits:2})}</span>}
                </div>
                {isPartialPay && (
                  <input type="number" min="0" value={paidAmount} onChange={e => setPaidAmount(Number(e.target.value))} className="w-full mt-1 px-3 py-2 border border-cyan-200 rounded-xl text-sm font-bold text-cyan-700 bg-cyan-50 outline-none focus:ring-2 focus:ring-cyan-400/50" placeholder="Alınan Kaparo (Örn: 2000)" />
                )}

                <div className="flex justify-between items-end pt-4 mt-3 border-t border-slate-200">
                  <span className="font-bold text-slate-800 text-xl">Tahsil Edilecek</span>
                  <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 drop-shadow-md">₺{isPartialPay ? paidAmount.toLocaleString('tr-TR') : Math.max(0, total - (isSgkActive ? sgkAmount : 0)).toLocaleString('tr-TR')}</span>
                </div>
                {isPartialPay && (
                   <div className="flex justify-between text-xs text-rose-600 font-bold bg-rose-50 px-3 py-2 rounded-xl border border-rose-100">
                     <span>Kalan Bakiye (Borç)</span>
                     <span>₺{Math.max(0, total - (isSgkActive ? sgkAmount : 0) - paidAmount).toLocaleString('tr-TR')}</span>
                   </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* MAIN ACTIONS (Right) */}
          <div className="xl:col-span-8 flex flex-col gap-8 h-full">
             
             {/* TOP PANEL: BARCODE & NUMPAD */}
             <motion.div variants={panelVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }} className="bg-white/90 backdrop-blur-3xl border border-slate-200 shadow-2xl rounded-[3rem] p-8 lg:p-10 flex flex-col md:flex-row gap-12 ring-1 ring-white/5 relative overflow-hidden">
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-cyan-100 rounded-full blur-[100px] pointer-events-none"></div>
                
                {/* Input & Features */}
                <div className="flex-1 flex flex-col relative z-10">
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight drop-shadow-md">Seri İşlem</h3>
                     <motion.button
                       type="button"
                       whileTap={btnTap}
                       onClick={() => {
                         setScanMode(v => !v);
                         if (!scanMode) setTimeout(() => barcodeRef.current?.focus(), 50);
                       }}
                       className={`px-5 py-2.5 rounded-xl border shadow-inner text-sm font-bold flex items-center gap-2 transition-all ${scanMode ? 'bg-cyan-100 border-cyan-300 text-cyan-800' : 'bg-white border-slate-200 text-cyan-700 hover:bg-slate-100'}`}
                     >
                        <QrCode className="w-4 h-4"/> {scanMode ? 'Okuyucu Aktif' : 'Okuyucu Kapalı'}
                     </motion.button>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Seri Adet</label>
                    <input
                      type="number"
                      min={1}
                      value={serialQty}
                      onChange={e => setSerialQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-24 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-black text-slate-800 outline-none focus:border-cyan-400"
                    />
                    <span className="text-xs font-semibold text-slate-400">Her okutmada sepete eklenecek miktar</span>
                  </div>
                  
                  <div className="relative group mb-10 flex-1 flex flex-col justify-center">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-100 to-purple-100 rounded-[2.5rem] blur-xl opacity-30 group-focus-within:opacity-60 transition-opacity duration-500"></div>
                    <form onSubmit={(e) => { e.preventDefault(); handleSearchBarcode(); }} className="relative flex items-center bg-slate-50 border-slate-200 border border-slate-200 rounded-[2.5rem] overflow-hidden focus-within:border-cyan-400 focus-within:ring-4 focus-within:ring-cyan-400/20 transition-all shadow-2xl backdrop-blur-md">
                       <button type="button" onClick={fetchInventoryItems} className="ml-8 p-2 rounded-full hover:bg-slate-100 transition-colors focus:outline-none focus:ring-4 focus:ring-cyan-500/20 active:scale-95" title="Manuel Ürün Ara">
                         <Search className="w-8 h-8 text-cyan-700 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                       </button>
                       <input
                         ref={barcodeRef}
                         type="text"
                         value={barcodeInput}
                         onChange={e => setBarcodeInput(e.target.value)}
                         onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSearchBarcode(); } }}
                         autoFocus={scanMode}
                         className="w-full bg-transparent border-none py-8 px-6 text-4xl font-black text-slate-800 border-none outline-none placeholder-slate-300 tracking-widest"
                         placeholder="Barkod okutun..."
                       />
                       <div className="flex items-center gap-2 mr-6">
                         <button type="submit" disabled={isSearching || !barcodeInput.trim()} className="px-5 py-3 bg-cyan-500 disabled:opacity-40 text-white font-bold rounded-2xl hover:bg-cyan-600 transition-colors shadow-md">Ekle</button>
                         {barcodeInput && (
                           <button type="button" onClick={() => setBarcodeInput('')} className="p-3 text-slate-800/40 hover:text-rose-600 hover:bg-rose-500/10 rounded-2xl transition-all">
                             <X className="w-8 h-8"/>
                           </button>
                         )}
                       </div>
                    </form>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <motion.button onClick={fetchInventoryItems} whileHover={{ y: -5, scale: 1.02 }} whileTap={btnTap} className="py-4 px-3 bg-gradient-to-b from-white/10 to-white/5 border border-slate-200 shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-2xl text-[13px] font-bold text-slate-700 hover:text-slate-800 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all text-center">Ürün Seç</motion.button>
                     <motion.button onClick={() => setShowRepModal(true)} whileHover={{ y: -5, scale: 1.02 }} whileTap={btnTap} className="py-4 px-3 bg-gradient-to-b from-white/10 to-white/5 border border-slate-200 shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-2xl text-[13px] font-bold text-slate-700 hover:text-slate-800 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all text-center flex flex-col items-center justify-center -space-y-1">
                       <span>Sorumlu</span>
                       <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mt-1">{salesRep.split(' ')[0]}</span>
                     </motion.button>
                     <motion.button onClick={() => setShowDiscount(true)} whileHover={{ y: -5, scale: 1.02 }} whileTap={btnTap} className="py-4 px-3 bg-gradient-to-b from-white/10 to-white/5 border border-slate-200 shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-2xl text-[13px] font-bold text-slate-700 hover:text-slate-800 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all text-center">İskonto</motion.button>
                     <motion.button onClick={handleClearCart} whileHover={{ y: -5, scale: 1.02 }} whileTap={btnTap} className="py-4 px-3 bg-gradient-to-b from-white/10 to-white/5 border border-slate-200 shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-2xl text-[13px] font-bold text-rose-300 hover:text-rose-100 hover:border-rose-400/50 hover:shadow-[0_0_20px_rgba(244,63,94,0.3)] transition-all text-center">Sepeti Boşalt</motion.button>
                  </div>
                </div>

                {/* Sleek Dark Numpad */}
                <div className="md:w-[360px] shrink-0 relative z-10">
                  <div className="grid grid-cols-4 gap-4">
                    {['7','8','9','4','5','6','1','2','3'].map(num => (
                       <motion.button key={num} onClick={() => handleNumpad(num)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="aspect-square bg-white border border-slate-200 shadow-inner rounded-[1.5rem] text-4xl font-semibold text-slate-800 hover:bg-white/20 hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] transition-all flex items-center justify-center">
                         {num}
                       </motion.button>
                    ))}
                    <motion.button onClick={() => handleNumpad('C')} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="col-start-4 row-start-1 aspect-square bg-rose-100 border border-rose-500/50 shadow-inner rounded-[1.5rem] text-3xl font-extrabold text-rose-600 hover:bg-rose-500 hover:text-slate-800 hover:shadow-[0_0_25px_rgba(244,63,94,0.5)] transition-all flex items-center justify-center">
                      C
                    </motion.button>
                    <motion.button onClick={() => handleNumpad('*')} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="col-start-4 row-start-2 aspect-square bg-white border border-slate-200 shadow-inner rounded-[1.5rem] text-4xl font-semibold text-slate-800 hover:bg-white/20 transition-all flex items-center justify-center">
                      *
                    </motion.button>
                     <motion.button onClick={() => handleNumpad('.')} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="col-start-4 row-start-3 aspect-square bg-white border border-slate-200 shadow-inner rounded-[1.5rem] text-4xl font-semibold text-slate-800 hover:bg-white/20 transition-all flex items-center justify-center">
                      .
                    </motion.button>
                    <motion.button onClick={() => handleNumpad('0')} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="col-span-2 aspect-[2/0.9] bg-white border border-slate-200 shadow-inner rounded-[1.5rem] text-4xl font-semibold text-slate-800 hover:bg-white/20 transition-all flex items-center justify-center">
                      0
                    </motion.button>
                    <motion.button onClick={() => handleNumpad('Ekle')} disabled={isSearching} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="col-span-2 aspect-[2/0.9] bg-gradient-to-br from-cyan-400 to-blue-600 disabled:opacity-50 border border-slate-200 rounded-[1.5rem] text-2xl font-black text-slate-800 shadow-[0_15px_30px_rgba(6,182,212,0.4)] hover:shadow-[0_20px_40px_rgba(6,182,212,0.6)] transition-all flex items-center justify-center gap-3">
                       {isSearching ? <Loader2 className="w-8 h-8 animate-spin"/> : <>Ekle <Search className="w-6 h-6"/></>}
                    </motion.button>
                  </div>
                </div>

             </motion.div>

             {/* BOTTOM PANELS */}
             <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 flex-1">
                
                {/* PAYMENT BLOCK */}
                <motion.div variants={panelVariants} initial="hidden" animate="visible" transition={{ delay: 0.3 }} className="bg-white/90 backdrop-blur-3xl border border-slate-200 shadow-2xl rounded-[3rem] p-8 lg:p-10 flex flex-col justify-between ring-1 ring-white/5 overflow-hidden relative">
                   <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-100 rounded-full blur-[80px] pointer-events-none"></div>
                   
                   <h4 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-4 drop-shadow-md">
                     <div className="p-3 bg-emerald-100 text-emerald-600 border border-emerald-500/30 rounded-2xl shadow-inner"><Banknote className="w-6 h-6"/></div> Ödeme Al
                   </h4>
                   <div className="grid grid-cols-2 gap-5 relative z-10">
                      <motion.button disabled={isProcessing} onClick={() => handleCheckout('Nakit')} whileHover={{ y: -5, scale: 1.02 }} whileTap={btnTap} className="h-32 bg-gradient-to-br from-emerald-500 to-teal-600 disabled:opacity-50 text-white rounded-[2rem] font-bold shadow-[0_10px_30px_rgba(16,185,129,0.4)] hover:shadow-[0_15px_40px_rgba(16,185,129,0.6)] border border-slate-200 transition-all flex flex-col items-center justify-center gap-2">
                         <Banknote className="w-10 h-10 mb-1 drop-shadow-md" /> NAKİT
                      </motion.button>
                      <motion.button disabled={isProcessing} onClick={() => handleCheckout('Kredi Kartı')} whileHover={{ y: -5, scale: 1.02 }} whileTap={btnTap} className="h-32 bg-gradient-to-br from-blue-500 to-indigo-600 disabled:opacity-50 text-white rounded-[2rem] font-bold shadow-[0_10px_30px_rgba(59,130,246,0.4)] hover:shadow-[0_15px_40px_rgba(59,130,246,0.6)] border border-slate-200 transition-all flex flex-col items-center justify-center gap-2">
                         <CreditCard className="w-10 h-10 mb-1 drop-shadow-md" /> KART
                      </motion.button>
                      <motion.button disabled={isProcessing} onClick={() => handleCheckout('Havale')} whileHover={{ y: -3 }} whileTap={btnTap} className="col-span-2 py-5 bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 border border-purple-500/30 disabled:opacity-50 text-purple-700 rounded-2xl font-bold shadow-inner hover:bg-purple-500/30 transition-all flex items-center justify-center gap-3 text-lg">
                         <RefreshCcw className="w-5 h-5" /> HAVALE / EFT İLE TAMAMLA
                      </motion.button>
                   </div>
                </motion.div>

                {/* CUSTOMER CRM */}
                <motion.div variants={panelVariants} initial="hidden" animate="visible" transition={{ delay: 0.4 }} className="bg-white/90 backdrop-blur-3xl border border-slate-200 shadow-2xl rounded-[3rem] p-8 lg:p-10 flex flex-col ring-1 ring-white/5 overflow-hidden relative">
                   <div className="absolute -bottom-10 -right-10 w-52 h-52 bg-pink-100 rounded-full blur-[80px] pointer-events-none"></div>

                   <div className="flex justify-between items-center mb-6 relative z-10">
                      <h4 className="text-2xl font-black text-slate-800 flex items-center gap-4 drop-shadow-md">
                        <div className="p-3 bg-rose-100 text-rose-600 border border-rose-500/30 rounded-2xl shadow-inner"><User className="w-6 h-6"/></div> Müşteri (CRM)
                      </h4>
                   </div>

                   <div className="space-y-4 flex-1 flex flex-col justify-end relative z-10">
                      {selectedCustomer ? (
                        <div className="p-6 rounded-[2rem] bg-indigo-50 border border-indigo-200 shadow-inner flex flex-col gap-2 relative group cursor-pointer" onClick={fetchCustomersList}>
                           <div className="absolute top-4 right-4 bg-white p-2 rounded-xl shadow-sm text-indigo-600 font-bold text-xs group-hover:bg-indigo-100 transition-colors">Değiştir</div>
                           <h5 className="font-black text-xl text-indigo-900 drop-shadow-sm">{selectedCustomer.name}</h5>
                           <p className="text-sm font-semibold text-indigo-700/80">{selectedCustomer.phone}</p>
                           <div className="mt-2 text-xs font-bold bg-white/50 border border-indigo-200 inline-block px-3 py-1 rounded-lg text-indigo-800 shadow-sm w-max">
                             Segment: {selectedCustomer.status}
                           </div>
                           {selectedCustomer.pastOrders?.length > 0 && (
                             <div className="mt-4 pt-3 border-t border-indigo-200/60">
                               <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-2">Son alışverişler</p>
                               <div className="space-y-1.5 max-h-28 overflow-y-auto">
                                 {selectedCustomer.pastOrders.slice(0, 5).map((ord: any, i: number) => (
                                   <div key={i} className="text-xs font-semibold text-indigo-900/90 flex justify-between gap-2">
                                     <span className="truncate">{ord.product}</span>
                                     <span className="shrink-0">₺{Number(ord.amount).toLocaleString('tr-TR')}</span>
                                   </div>
                                 ))}
                               </div>
                             </div>
                           )}
                        </div>
                      ) : (
                        <div onClick={fetchCustomersList} className="p-8 rounded-[2rem] bg-slate-50 border-slate-200 border border-dashed hover:border-indigo-400 hover:bg-indigo-50/50 shadow-inner flex flex-col items-center justify-center gap-4 text-slate-500 my-auto cursor-pointer transition-all group">
                           <div className="w-16 h-16 rounded-full bg-white border border-slate-300 flex items-center justify-center shadow-md mb-2 group-hover:border-indigo-400 group-hover:text-indigo-600 transition-colors">
                             <Search className="w-8 h-8" />
                           </div>
                           <span className="text-md font-bold text-center text-slate-800/80 group-hover:text-indigo-700">Müşteri Seçimi Zorunlu<br/><span className="text-xs font-medium text-slate-500">(Satış için tıklayın)</span></span>
                        </div>
                      )}
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
            <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[3rem] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col relative text-slate-800 border border-slate-200 drop-shadow-[0_0_50px_rgba(16,185,129,0.3)]">
              <div className="p-10 text-center bg-gradient-to-b from-emerald-900/50 to-slate-900 border-b border-slate-200 flex flex-col items-center relative overflow-hidden">
                 <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                 <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-800 rounded-full flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(16,185,129,0.5)] border-4 border-slate-900">
                    <FileText className="w-10 h-10 drop-shadow-md" />
                 </div>
                 <h2 className="text-3xl font-black text-slate-800 mb-2 drop-shadow-md">BAŞARILI!</h2>
                 <p className="text-lg font-bold text-emerald-600 bg-emerald-900/30 px-4 py-1 rounded-xl border border-emerald-500/20">{completedOrder.orderNumber}</p>
                 <p className="text-xs font-medium text-slate-500 mt-4">{completedOrder.date}</p>
              </div>
              <div className="p-8">
                 <div className="max-h-52 overflow-y-auto mb-6 border-b border-dashed border-slate-200 pb-4 scrollbar-hide">
                    {completedOrder.items.map((it:any, idx:number) => (
                      <div key={idx} className="flex justify-between items-center mb-3 text-sm font-medium">
                        <div>
                          <p className="text-slate-800 font-bold">{it.name}</p>
                          <p className="text-[11px] text-cyan-700 font-bold bg-cyan-900/30 px-1.5 py-0.5 rounded mt-1 inline-block border border-cyan-500/20">x{it.cartQuantity} Adet</p>
                        </div>
                        <p className="font-extrabold text-slate-800 text-lg">{(it.salePrice * it.cartQuantity).toLocaleString('tr-TR')} ₺</p>
                      </div>
                    ))}
                 </div>
                 
                 <div className="flex justify-between text-sm text-slate-500 mb-2 font-medium">Ara Toplam: <b className="text-slate-800">{subtotal.toLocaleString('tr-TR')} ₺</b></div>
                 {completedOrder.discount > 0 && <div className="flex justify-between text-sm text-rose-600 mb-2 font-bold">İskonto: <b>-{completedOrder.discount.toLocaleString('tr-TR')} ₺</b></div>}
                 <div className="flex justify-between text-2xl text-slate-800 font-black mt-4 pt-4 border-t border-slate-200">
                    <span>TOPLAM:</span> <span className="text-emerald-600 drop-shadow-md">{completedOrder.total.toLocaleString('tr-TR')} ₺</span>
                 </div>
                 <div className="text-center mt-4 text-xs font-bold text-slate-500 uppercase tracking-widest flex justify-between">
                    <span>Ödeme Tipi: {completedOrder.method}</span>
                    <span>Sorumlu: {completedOrder.salesRep}</span>
                 </div>
              </div>
              <div className="p-6 bg-white border-t border-slate-200 grid grid-cols-2 gap-4">
                 <button onClick={() => setCompletedOrder(null)} className="py-4 font-bold text-slate-600 bg-white border border-slate-200 rounded-2xl hover:bg-slate-700 hover:text-slate-800 transition-colors shadow-inner">Ekranı Kapat</button>
                 <button onClick={printReceipt} className="py-4 font-black text-slate-900 bg-gradient-to-r from-emerald-400 to-teal-400 text-white rounded-2xl hover:brightness-110 transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2"><FileText className="w-5 h-5"/> Fiş Yazdır</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Z Raporu Modal */}
        {showZReport && zReportData && (() => {
          const totalRevenue = zReportData.totalRevenue ?? zReportData.TotalRevenue ?? 0;
          const totalOrders = zReportData.totalOrders ?? zReportData.TotalOrders ?? 0;
          const cashTotal = zReportData.cashTotal ?? 0;
          const cardTotal = zReportData.cardTotal ?? 0;
          const transferTotal = zReportData.transferTotal ?? 0;
          const sgkTotal = zReportData.sgkTotal ?? 0;
          const totalPaid = zReportData.totalPaid ?? 0;
          const ordersList = zReportData.ordersList ?? zReportData.OrdersList ?? [];
          return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 print:hidden">
            <motion.div initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col border border-slate-200">
               <div className="p-8 bg-gradient-to-r from-indigo-50 to-purple-50 text-slate-800 flex justify-between items-center border-b border-slate-200">
                  <div>
                    <h2 className="text-2xl font-black drop-shadow-md">Gün Sonu Z-Raporu</h2>
                    <p className="text-sm text-indigo-700 mt-1 font-semibold">Bugünkü satış özeti</p>
                  </div>
                  <button onClick={() => setShowZReport(false)} className="text-slate-800/50 hover:text-slate-800 bg-white p-3 rounded-xl border border-slate-200 transition-colors"><X className="w-6 h-6"/></button>
               </div>
               <div className="p-8 grid grid-cols-2 gap-6 bg-white">
                  <div className="p-6 rounded-[2rem] border border-slate-100 shadow-inner text-center">
                     <p className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-widest">Sistem Cirosu</p>
                     <p className="text-4xl font-black text-emerald-600">{Number(totalRevenue).toLocaleString('tr-TR')} ₺</p>
                  </div>
                  <div className="p-6 rounded-[2rem] border border-slate-100 shadow-inner text-center">
                     <p className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-widest">Adet / Tahsilat</p>
                     <p className="text-2xl font-black text-indigo-600">{totalOrders} sipariş</p>
                     <p className="text-sm font-bold text-slate-500 mt-1">Tahsil: {Number(totalPaid).toLocaleString('tr-TR')} ₺</p>
                  </div>
               </div>
               <div className="px-8 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm font-bold text-emerald-800">Nakit: {Number(cashTotal).toLocaleString('tr-TR')} ₺</div>
                  <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-sm font-bold text-blue-800">Kart: {Number(cardTotal).toLocaleString('tr-TR')} ₺</div>
                  <div className="rounded-xl bg-violet-50 border border-violet-100 px-4 py-3 text-sm font-bold text-violet-800">Havale: {Number(transferTotal).toLocaleString('tr-TR')} ₺</div>
                  <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm font-bold text-amber-800">SGK: {Number(sgkTotal).toLocaleString('tr-TR')} ₺</div>
               </div>
               <div className="p-8 pt-4 bg-white overflow-y-auto max-h-72 scrollbar-hide">
                  <h3 className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-widest border-b border-slate-100 pb-2">Bugünkü Siparişler</h3>
                  {ordersList.length === 0 ? (
                    <p className="text-sm text-slate-500 font-medium py-4 text-center">Bugün henüz sipariş yok.</p>
                  ) : ordersList.map((ord:any, i:number) => (
                    <div key={i} className="flex justify-between items-center py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 px-4 rounded-2xl transition-colors cursor-default">
                       <div className="flex items-center gap-4">
                         <div className="bg-slate-100 px-3 py-1 rounded-lg text-xs font-bold text-slate-600 border border-slate-100">{ord.time ?? ord.Time}</div>
                         <div>
                           <span className="font-bold text-slate-800 tracking-wide block">{ord.orderNumber ?? ord.OrderNumber}</span>
                           <span className="text-[10px] font-bold text-slate-400 uppercase">{ord.salesChannel ?? ''} · {ord.salesRepresentative ?? ord.salesRep ?? '—'}</span>
                         </div>
                       </div>
                       <div className="font-black text-cyan-700 text-lg">{Number(ord.totalAmount ?? ord.TotalAmount ?? 0).toLocaleString('tr-TR')} ₺</div>
                    </div>
                  ))}
               </div>
               <div className="p-6 border-t border-slate-100 print:hidden">
                 <button onClick={() => window.print()} className="w-full py-3 rounded-2xl bg-slate-800 text-white font-bold text-sm">Yazdır</button>
               </div>
            </motion.div>
          </motion.div>
          );
        })()}

        {/* Product Search Modal */}
        {showProductSearch && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 print:hidden">
            <motion.div initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col h-[75vh] border border-slate-200">
               <div className="p-8 border-b border-slate-200 flex justify-between items-center bg-white">
                  <h2 className="text-2xl font-black text-slate-800 tracking-wide">Katalog Taraması</h2>
                  <button onClick={() => setShowProductSearch(false)} className="text-slate-500 hover:text-slate-800 bg-white p-3 rounded-xl border border-slate-200"><X className="w-6 h-6"/></button>
               </div>
               <div className="p-6 bg-white0 border-b border-slate-100 shadow-inner">
                  <div className="flex bg-slate-50 border-slate-200 items-center px-6 py-4 rounded-[2rem] border border-slate-200 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all">
                    <Search className="w-6 h-6 text-cyan-700 mr-4" />
                    <input type="text" placeholder="Radardan ürün adı veya kod arayın..." className="bg-transparent border-none outline-none w-full text-lg font-bold text-slate-800 placeholder-white/20" />
                  </div>
               </div>
               <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3 bg-white scrollbar-hide">
                  {inventoryList.map((prod:any) => (
                    <div key={prod.productId || prod.id} className="flex justify-between items-center p-5 bg-white border border-slate-200 rounded-[1.5rem] hover:bg-slate-100 hover:border-cyan-500/50 transition-all group">
                       <div>
                         <h4 className="font-bold text-slate-800 text-lg">{prod.name}</h4>
                         <div className="flex items-center gap-3 mt-2">
                           <span className="text-[11px] font-black text-slate-800 bg-cyan-400 px-2.5 py-1 rounded-md drop-shadow-md">{prod.barcode}</span>
                           <span className="text-xs font-bold text-slate-500">Canlı Stok: <span className="text-slate-800">{prod.quantity}</span> Adet</span>
                         </div>
                       </div>
                       <div className="flex items-center gap-6">
                         <span className="font-black text-2xl text-slate-800 drop-shadow-md">{prod.salePrice.toLocaleString('tr-TR')} ₺</span>
                         <button onClick={() => { addItemToCart({ ...prod, productId: prod.productId }); setShowProductSearch(false); }} className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 text-slate-800 font-black text-sm rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all">ZIMBALA</button>
                       </div>
                    </div>
                  ))}
               </div>
            </motion.div>
          </motion.div>
        )}

        {/* Customer Search Modal */}
        {showCustomerSearch && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 print:hidden">
            <motion.div initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[3rem] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col h-[70vh] border border-slate-200">
               <div className="p-8 border-b border-slate-200 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-blue-50">
                  <h2 className="text-2xl font-black text-slate-800 tracking-wide flex items-center gap-3"><User className="w-6 h-6 text-indigo-600"/> Müşteri Seçimi</h2>
                  <button onClick={() => setShowCustomerSearch(false)} className="text-slate-500 hover:text-slate-800 bg-white p-3 rounded-xl border border-slate-200"><X className="w-6 h-6"/></button>
               </div>
               <div className="p-6 bg-white border-b border-slate-100 shadow-inner flex gap-4 items-center">
                  <div className="flex flex-1 bg-slate-50 border-slate-200 items-center px-6 py-4 rounded-[2rem] border border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                    <Search className="w-6 h-6 text-indigo-700 mr-4" />
                    <input type="text" placeholder="İsim veya Telefon arayın..." className="bg-transparent border-none outline-none w-full text-lg font-bold text-slate-800 placeholder-slate-400" />
                  </div>
                  {!isAddingCustomer && (
                    <button onClick={() => setIsAddingCustomer(true)} className="px-6 py-4 bg-indigo-600 text-white font-bold rounded-[2rem] hover:bg-indigo-700 transition-colors whitespace-nowrap">
                      Yeni Müşteri Ekle
                    </button>
                  )}
               </div>
               <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3 bg-white scrollbar-hide">
                  {isAddingCustomer ? (
                     <div className="space-y-4">
                        <div>
                          <label className="text-sm font-bold text-slate-700 mb-1 block">Ad Soyad</label>
                          <input type="text" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-slate-800 outline-none focus:border-indigo-500" placeholder="Örn: Ahmet Yılmaz"/>
                        </div>
                        <div>
                          <label className="text-sm font-bold text-slate-700 mb-1 block">Telefon</label>
                          <input type="tel" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-slate-800 outline-none focus:border-indigo-500" placeholder="Örn: 0555 123 45 67"/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-bold text-slate-700 mb-1 block">E-posta (Opsiyonel)</label>
                            <input type="email" value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-slate-800 outline-none focus:border-indigo-500" placeholder="Örn: ahmet@mail.com"/>
                          </div>
                          <div>
                            <label className="text-sm font-bold text-slate-700 mb-1 block">Müşteri Tipi</label>
                            <select value={newCustomer.segment} onChange={e => setNewCustomer({...newCustomer, segment: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-slate-800 outline-none focus:border-indigo-500">
                               <option value="Standart">Standart</option>
                               <option value="VIP">VIP</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-4 mt-6">
                           <button onClick={() => setIsAddingCustomer(false)} className="px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 flex-1">İptal</button>
                           <button onClick={async () => {
                               if (!newCustomer.name || !newCustomer.phone) {
                                 toast.error('Ad Soyad ve Telefon zorunludur!');
                                 return;
                               }
                               try {
                                 const data = await api.post('/customers', {
                                   name: newCustomer.name,
                                   phone: newCustomer.phone,
                                   email: newCustomer.email || undefined,
                                   segment: newCustomer.segment,
                                   source: 'Manuel-POS',
                                 });
                                 const created = {
                                   id: data.id,
                                   name: data.name ?? newCustomer.name,
                                   phone: data.phone ?? newCustomer.phone,
                                   status: newCustomer.segment,
                                   lastVisit: 'Bugün',
                                   source: 'Manuel-POS',
                                 };
                                 setCustomersList([created, ...customersList]);
                                 setSelectedCustomer(created);
                                 setNewCustomer({ name: '', phone: '', email: '', segment: 'Standart' });
                                 setIsAddingCustomer(false);
                                 setShowCustomerSearch(false);
                                 toast.success('Müşteri kaydedildi ve seçildi!');
                               } catch(err: any) {
                                 toast.error(err.message || 'Bağlantı hatası; müşteri kaydı yapılamadı.');
                               }
                           }} className="px-6 py-3 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 flex-1 shadow-lg shadow-emerald-200">Kaydet & Seç</button>
                        </div>
                     </div>
                  ) : (
                    <>
                      {customersList.map((cust:any) => (
                        <div key={cust.id} onClick={() => { setSelectedCustomer(cust); setShowCustomerSearch(false); }} className="flex justify-between items-center p-5 bg-white border border-slate-200 rounded-[1.5rem] hover:bg-indigo-50 hover:border-indigo-300 transition-all cursor-pointer group">
                           <div>
                             <h4 className="font-bold text-slate-800 text-lg group-hover:text-indigo-800">{cust.name}</h4>
                             <p className="text-sm font-semibold text-slate-500 mt-1">{cust.phone}</p>
                           </div>
                           <div className="flex flex-col items-end">
                             <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2.5 py-1 rounded-md mb-2">{cust.status}</span>
                             <span className="text-xs text-slate-400 font-medium">{cust.lastVisit}</span>
                           </div>
                        </div>
                      ))}
                      {customersList.length === 0 && (
                         <div className="text-center text-slate-500 font-bold py-10">Müşteri bulunamadı. Lütfen "Yeni Müşteri Ekle" butonuyla anında kayıt oluşturun.</div>
                      )}
                    </>
                  )}
               </div>
            </motion.div>
          </motion.div>
        )}

        {/* Advanced Discount Modal */}
        {showDiscount && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 print:hidden">
            <motion.div initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-orange-200 text-slate-800 relative">
               <div className="p-5 bg-orange-600 text-white flex items-center gap-3">
                 <span className="font-extrabold text-xl">₺</span>
                 <h2 className="text-xl font-black">Fiyat İskontosu</h2>
               </div>
               
               <div className="p-6 overflow-y-auto max-h-[75vh]">
                 
                 {/* Current Cart Summary */}
                 <div className="mb-6">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Mevcut Sepet</p>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col gap-3">
                       <div className="flex justify-between text-sm font-semibold text-slate-600">
                         <span>Toplam Ürün:</span> <span className="text-slate-800">{cart.length} adet</span>
                       </div>
                       <div className="flex justify-between text-sm font-semibold text-slate-600 border-t border-slate-200/50 pt-2">
                         <span>Toplam Tutar:</span> <span className="text-slate-800 font-black">₺{subtotal.toLocaleString('tr-TR', {minimumFractionDigits: 2})}</span>
                       </div>
                    </div>
                 </div>

                 {/* Discount Input */}
                 <div className="mb-6">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">İskonto Oranı (%)</p>
                    <input 
                      type="number" 
                      min="0"
                      max="100"
                      value={discountInput}
                      onChange={(e) => {
                         const val = parseFloat(e.target.value) || 0;
                         setDiscountInput(e.target.value);
                         setDiscountPercent(val);
                      }}
                      className="w-full bg-white border border-slate-300 py-4 px-4 rounded-xl text-lg font-bold text-slate-800 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all shadow-sm"
                      placeholder="0"
                    />
                 </div>

                 {/* Quick Discounts */}
                 <div className="mb-6">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Hızlı İskonto</p>
                    <div className="grid grid-cols-4 gap-3">
                       {[5, 10, 15, 20].map(pct => (
                          <button key={pct} onClick={() => handleQuickDiscount(pct)} className="py-2.5 bg-orange-100 text-orange-700 font-bold rounded-lg border border-orange-200 hover:bg-orange-200 transition-colors">%{pct}</button>
                       ))}
                    </div>
                 </div>

                 {/* Discount Preview */}
                 <div>
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">İskonto Önizleme</p>
                    <div className="bg-orange-50 rounded-xl p-5 border border-orange-100 flex flex-col gap-2">
                       <div className="flex justify-between text-sm font-semibold text-slate-600">
                         <span>Orijinal Tutar:</span> <span className="text-slate-800 font-bold">₺{subtotal.toLocaleString('tr-TR', {minimumFractionDigits: 2})}</span>
                       </div>
                       <div className="flex justify-between text-sm font-semibold text-slate-600">
                         <span>İskonto Tutarı:</span> <span className="text-orange-600 font-bold">-₺{(subtotal * ((parseFloat(discountInput)||0)/100)).toLocaleString('tr-TR', {minimumFractionDigits: 2})}</span>
                       </div>
                       <div className="flex justify-between font-black text-slate-800 text-lg mt-3 pt-3 border-t border-orange-200/50">
                         <span>Yeni Tutar:</span> <span className="text-emerald-600">₺{(subtotal - (subtotal * ((parseFloat(discountInput)||0)/100))).toLocaleString('tr-TR', {minimumFractionDigits: 2})}</span>
                       </div>
                    </div>
                 </div>

               </div>
               
               <div className="p-4 grid grid-cols-2 gap-4 border-t border-slate-100 bg-white">
                 <button onClick={() => setShowDiscount(false)} className="py-4 font-bold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">İptal</button>
                 <button onClick={applyDiscountAndClose} className="py-4 font-black text-white bg-[#EA580C] rounded-xl hover:bg-[#C2410C] transition-colors shadow-lg flex items-center justify-center gap-2">
                   <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> 
                   İskonto Uygula
                 </button>
               </div>
            </motion.div>
          </motion.div>
        )}

        {/* Sales Rep Modal */}
        {showRepModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 print:hidden">
            <motion.div initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 border border-slate-200 text-center">
               <div className="mx-auto w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                 <User className="w-8 h-8" />
               </div>
               <h2 className="text-2xl font-black text-slate-800 mb-2">Satış Sorumlusu</h2>
               <p className="text-sm text-slate-500 mb-6">Bu siparişi hangi optisyen / personel tamamlıyor?</p>
               <select 
                 value={repInput}
                 onChange={(e) => setRepInput(e.target.value)}
                 className="w-full bg-slate-50 border border-slate-300 py-3 px-4 rounded-xl text-lg font-bold text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 mb-6 text-center"
               >
                 <option value="">-- Personel Seçin --</option>
                 {employees.map(emp => (
                    <option key={emp.id} value={emp.fullName}>{emp.fullName} ({emp.role})</option>
                 ))}
                 <option value="Merkez Kasiyer">Merkez Kasiyer</option>
               </select>
               <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => setShowRepModal(false)} className="py-3 font-bold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors">Vazgeç</button>
                 <button onClick={() => { setSalesRep(repInput || 'Belirtilmedi'); setShowRepModal(false); }} className="py-3 font-black text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors">Yetkilendir</button>
               </div>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>

      <ComplianceAlertModal
        open={showComplianceModal}
        orderNumber={lastOrderNumber}
        alerts={complianceAlerts}
        onClose={() => setShowComplianceModal(false)}
      />
    </div>
  );
}
