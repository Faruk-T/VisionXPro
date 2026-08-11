import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, ShoppingCart, Star, Filter, ArrowRight, Tag, Heart, User, 
  X, Plus, Minus, Trash2, CheckCircle2, MapPin, CreditCard, ShoppingBag 
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import api from '../../lib/api';

export default function Ecommerce() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Checkout Multi-step States: 'cart' | 'address' | 'payment' | 'success'
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'address' | 'payment' | 'success'>('cart');
  const [deliveryInfo, setDeliveryInfo] = useState({ name: '', phone: '', city: 'İstanbul', district: 'Kadıköy', address: '', note: '' });
  const [paymentInfo, setPaymentInfo] = useState({ cardHolder: '', cardNumber: '', cardExpiry: '', cardCvv: '' });
  const [completedOrderInfo, setCompletedOrderInfo] = useState<any>(null);
  const [pastOrders, setPastOrders] = useState<any[]>([]);
  const [showPastOrders, setShowPastOrders] = useState(false);

  // Discount / Pricing
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscountPercent, setAppliedDiscountPercent] = useState(0);

  // Lightbox / Detail modal state
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Güneş Gözlüğü');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [sortBy, setSortBy] = useState('Önerilen Sıralama');
  const [favorites, setFavorites] = useState<number[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await api.get('/public/sunglasses');
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data.map((p: any, idx: number) => ({
            id: p.productId ?? p.id ?? idx,
            productId: p.productId ?? p.id,
            orgId: p.orgId,
            branchId: p.branchId,
            name: p.name,
            category: p.category || 'Güneş Gözlüğü',
            brand: p.brand || 'Marka',
            price: p.price ?? p.salePrice ?? 0,
            oldPrice: null,
            rating: 4.5,
            reviews: 0,
            image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=800',
            isNew: false,
            frameColor: p.origin || 'Belirtilmedi',
            lensColor: 'UV400',
            dimensions: p.barcode || '',
            description: `${p.name} — mağaza stokundan canlı listeleme. ÜTS: ${p.utsCode ? 'Kayıtlı' : 'Yok'}.`,
            stock: p.quantity,
          })));
        } else {
          setProducts([]);
        }
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
    const saved = localStorage.getItem('ecom_orders');
    if (saved) {
      try { setPastOrders(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
    toast.success(`${product.name} sepete eklendi!`, {
      style: { borderRadius: '16px', background: '#333', color: '#fff', fontWeight: 'bold' }
    });
  };

  const updateCartQty = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const nextQty = item.qty + delta;
        return nextQty > 0 ? { ...item, qty: nextQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
    toast.error('Ürün sepetten çıkarıldı.');
  };

  const applyCoupon = () => {
    if (couponCode.toUpperCase() === 'VISION10') {
      setAppliedDiscountPercent(10);
      toast.success('%10 kupon indirimi uygulandı!');
    } else {
      toast.error('Geçersiz veya süresi dolmuş kupon kodu.');
    }
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
  };

  const toggleFavorite = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (favorites.includes(id)) {
      setFavorites(prev => prev.filter(f => f !== id));
      toast('Favorilerden çıkarıldı', { icon: '💔' });
    } else {
      setFavorites(prev => [...prev, id]);
      toast.success('Favorilere eklendi!', { icon: '❤️' });
    }
  };

  const filteredProducts = products.filter(p => {
    if (activeCategory !== 'Tümü' && p.category !== activeCategory && activeCategory !== 'İndirimli Ürünler' && activeCategory !== 'Yeni Sezon') {
      return false;
    }
    if (activeCategory === 'İndirimli Ürünler' && !p.oldPrice) return false;
    if (activeCategory === 'Yeni Sezon' && !p.isNew) return false;

    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      if (!p.name.toLowerCase().includes(lowerQ) && !p.brand.toLowerCase().includes(lowerQ)) return false;
    }

    if (selectedBrands.length > 0 && !selectedBrands.includes(p.brand)) return false;

    if (minPrice !== '' && p.price < minPrice) return false;
    if (maxPrice !== '' && p.price > maxPrice) return false;

    return true;
  }).sort((a, b) => {
    if (sortBy === 'En Düşük Fiyat') return a.price - b.price;
    if (sortBy === 'En Yüksek Fiyat') return b.price - a.price;
    if (sortBy === 'En Yeniler') return (a.isNew === b.isNew) ? 0 : a.isNew ? -1 : 1;
    return 0;
  });

  // Calculation details
  const cartSubtotal = cart.reduce((a, c) => a + (c.price * c.qty), 0);
  const discountAmount = Math.round(cartSubtotal * (appliedDiscountPercent / 100));
  const shippingFee = cartSubtotal > 2000 || cartSubtotal === 0 ? 0 : 50;
  const cartTotal = cartSubtotal - discountAmount + shippingFee;

  const handleCheckoutSubmit = async () => {
    if (checkoutStep === 'address') {
      if (!deliveryInfo.name || !deliveryInfo.phone || !deliveryInfo.address) {
        toast.error('Lütfen tüm zorunlu adres alanlarını doldurunuz!');
        return;
      }
      setCheckoutStep('payment');
    } else if (checkoutStep === 'payment') {
      if (!paymentInfo.cardHolder || !paymentInfo.cardNumber || !paymentInfo.cardExpiry || !paymentInfo.cardCvv) {
        toast.error('Lütfen geçerli kart bilgilerini giriniz!');
        return;
      }

      const first = cart[0];
      if (!first?.orgId || !first?.branchId || !first?.productId) {
        toast.error('Sepetteki ürünler mağaza stokundan gelmiyor. Lütfen stokta güneş gözlüğü olduğundan emin olun.');
        return;
      }

      const address = `${deliveryInfo.address}, ${deliveryInfo.district}, ${deliveryInfo.city}`;

      try {
        const result = await api.post('/public/orders', {
          orgId: first.orgId,
          branchId: first.branchId,
          customerName: deliveryInfo.name,
          phone: deliveryInfo.phone,
          address,
          paymentMethod: 'Kredi Kartı',
          paidAmount: cartTotal,
          discountAmount,
          items: cart.map(c => ({
            productId: c.productId,
            quantity: c.qty,
            unitPrice: c.price,
          })),
        });

        const newOrder = {
          orderNumber: result.orderNumber,
          date: new Date().toLocaleDateString('tr-TR'),
          items: [...cart],
          subtotal: cartSubtotal,
          discount: discountAmount,
          shipping: shippingFee,
          total: cartTotal,
          delivery: { ...deliveryInfo },
        };

        const nextOrders = [newOrder, ...pastOrders];
        setPastOrders(nextOrders);
        localStorage.setItem('ecom_orders', JSON.stringify(nextOrders));
        setCompletedOrderInfo(newOrder);

        toast.success('Ödeme onaylandı! Sipariş mağazaya iletildi.', { icon: '💳' });
        setCheckoutStep('success');
        setCart([]);
      } catch (err: any) {
        toast.error(err.message || 'Sipariş kaydedilemedi.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pt-20">
      <Toaster position="bottom-right" />
      
      {/* Trendyol Style Header */}
      <div className="bg-white border-b border-slate-200 sticky top-[64px] z-30 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-4 md:gap-8">
           <div className="hidden md:flex items-center gap-6">
              <span className="font-black text-xl text-orange-600 tracking-tight flex items-center gap-1.5 cursor-pointer" onClick={() => setActiveCategory('Tümü')}>
                <ShoppingBag className="w-6 h-6" /> VisionX Market
              </span>
           </div>
           
           <div className="flex-1 max-w-3xl relative">
              <input 
                type="text" 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                placeholder="Güneş gözlüğü marka, model veya özellik arayın..." 
                className="w-full bg-slate-100 border-2 border-slate-100 focus:bg-white focus:border-orange-500 rounded-xl py-3 pl-5 pr-12 text-sm font-bold text-slate-700 outline-none transition-all" 
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500" />
           </div>

           <div className="flex items-center gap-4">
              <button onClick={() => setShowPastOrders(true)} className="flex flex-col items-center text-slate-600 hover:text-orange-600 transition-colors">
                <User className="w-6 h-6 mb-1"/>
                <span className="text-[10px] font-bold">Siparişlerim</span>
              </button>
              <button onClick={() => { setIsCartOpen(true); setCheckoutStep('cart'); }} className="flex flex-col items-center text-slate-600 hover:text-orange-600 transition-colors relative">
                <div className="relative">
                  <ShoppingCart className="w-6 h-6 mb-1"/>
                  {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">{cart.reduce((a,c) => a + c.qty, 0)}</span>}
                </div>
                <span className="text-[10px] font-bold">Sepetim</span>
              </button>
           </div>
        </div>
        
        {/* Category bar */}
        <div className="border-t border-slate-100 hidden md:block">
           <div className="max-w-[1400px] mx-auto px-8 py-3 flex gap-8 text-sm font-bold text-slate-600">
              {['Tümü', 'Güneş Gözlüğü', 'Optik Çerçeveler', 'Kontakt Lensler', 'İndirimli Ürünler', 'Yeni Sezon'].map(cat => (
                 <button key={cat} onClick={() => setActiveCategory(cat)} className={`hover:text-orange-600 pb-1 flex items-center gap-1 transition-all ${activeCategory === cat ? 'text-orange-600 border-b-2 border-orange-600' : ''} ${cat === 'İndirimli Ürünler' ? 'text-rose-500 hover:text-rose-600' : ''}`}>
                   {cat === 'İndirimli Ürünler' && <Tag className="w-4 h-4"/>} {cat}
                 </button>
              ))}
           </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 flex gap-8">
        {/* Sidebar Filters */}
        <div className="w-64 hidden lg:block shrink-0">
           <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-[180px]">
              <h3 className="font-black text-slate-800 text-lg mb-6 flex items-center gap-2"><Filter className="w-5 h-5 text-orange-500"/> Filtreler</h3>
              
              <div className="mb-6">
                 <h4 className="font-bold text-slate-700 mb-3 text-sm">Marka</h4>
                 <div className="space-y-2">
                   {['Ray-Ban', 'Oakley', 'Prada', 'Gucci', 'Tom Ford', 'Persol', 'Johnson & Johnson'].map(brand => (
                     <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                       <div onClick={() => toggleBrand(brand)} className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${selectedBrands.includes(brand) ? 'bg-orange-500 border-orange-500' : 'border-slate-300 group-hover:border-orange-500'}`}>
                         {selectedBrands.includes(brand) && <div className="w-2.5 h-2.5 bg-white rounded-sm"></div>}
                       </div>
                       <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">{brand}</span>
                     </label>
                   ))}
                 </div>
              </div>

              <div className="mb-6">
                 <h4 className="font-bold text-slate-700 mb-3 text-sm">Fiyat Aralığı</h4>
                 <div className="flex gap-2">
                    <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value ? Number(e.target.value) : '')} placeholder="En Az" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-orange-500"/>
                    <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value ? Number(e.target.value) : '')} placeholder="En Çok" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-orange-500"/>
                 </div>
              </div>
           </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1">
           {/* Campaign Banner */}
           <div className="w-full h-48 md:h-64 rounded-3xl mb-8 overflow-hidden relative group cursor-pointer">
              <img src="https://images.unsplash.com/photo-1512413916892-db01121d59cc?auto=format&fit=crop&q=80&w=2000" alt="Kampanya" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"/>
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent flex items-center px-10 md:px-16">
                 <div>
                   <span className="inline-block px-3 py-1 bg-rose-500 text-white text-xs font-black tracking-widest uppercase rounded-lg mb-4">Büyük Yaz İndirimi</span>
                   <h2 className="text-4xl md:text-5xl font-black text-white mb-2 leading-tight">Yaz Modasında<br/>%50'ye Varan İndirim</h2>
                   <p className="text-white/80 font-medium mb-6">Seçili tasarım güneş gözlüklerinde geçerlidir.</p>
                   <button onClick={() => setActiveCategory('İndirimli Ürünler')} className="px-6 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-orange-500 hover:text-white transition-colors flex items-center gap-2 relative z-10">
                     Hemen İncele <ArrowRight className="w-4 h-4"/>
                   </button>
                 </div>
              </div>
           </div>

           {/* Products Header */}
           <div id="products-grid" className="flex justify-between items-center mb-6 pt-4">
              <h1 className="text-2xl font-black text-slate-800">{activeCategory} <span className="text-slate-400 text-sm font-medium">({filteredProducts.length} Ürün)</span></h1>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:border-orange-500 cursor-pointer">
                <option>Önerilen Sıralama</option>
                <option>En Düşük Fiyat</option>
                <option>En Yüksek Fiyat</option>
                <option>En Yeniler</option>
              </select>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                Array(6).fill(0).map((_,i) => <div key={i} className="bg-white rounded-2xl h-96 animate-pulse border border-slate-100"></div>)
              ) : filteredProducts.length === 0 ? (
                <div className="col-span-full py-20 text-center flex flex-col items-center text-slate-400">
                   <Search className="w-16 h-16 mb-4 text-slate-300"/>
                   <h3 className="text-xl font-black text-slate-500">Ürün Bulunamadı</h3>
                   <button onClick={() => { setSearchQuery(''); setSelectedBrands([]); setMinPrice(''); setMaxPrice(''); setActiveCategory('Tümü'); }} className="mt-6 px-6 py-2 bg-orange-50 text-orange-600 font-bold rounded-xl hover:bg-orange-100 transition-colors">Aramayı Temizle</button>
                </div>
              ) : filteredProducts.map(product => (
                 <div 
                   key={product.id} 
                   onClick={() => setSelectedProduct(product)}
                   className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-orange-200 transition-all group flex flex-col cursor-pointer"
                 >
                    <div className="relative h-64 overflow-hidden bg-slate-100 p-8">
                       {product.isNew && <span className="absolute top-4 left-4 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md z-10">YENİ</span>}
                       <button 
                         onClick={(e) => toggleFavorite(e, product.id)} 
                         className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all z-10 ${favorites.includes(product.id) ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-white text-slate-400 hover:text-rose-500 hover:shadow-md'}`}
                       >
                         <Heart className="w-4 h-4"/>
                       </button>
                       <img src={product.image} alt={product.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"/>
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                       <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{product.brand}</p>
                       <h3 className="font-bold text-slate-800 text-lg mb-2 line-clamp-1">{product.name}</h3>
                       
                       <div className="flex items-center gap-1 mb-4">
                          <Star className="w-4 h-4 text-orange-400 fill-orange-400"/>
                          <span className="text-sm font-bold text-slate-700">{product.rating}</span>
                          <span className="text-xs text-slate-400">({product.reviews})</span>
                       </div>

                       <div className="mt-auto">
                          {product.oldPrice ? (
                             <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-bold text-slate-400 line-through">₺{product.oldPrice.toLocaleString('tr-TR')}</span>
                                <span className="text-xs font-black text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">%{Math.round((1 - product.price / product.oldPrice) * 100)} İNDİRİM</span>
                             </div>
                          ) : <div className="h-6"></div>}
                          <div className="flex justify-between items-end">
                             <span className="text-2xl font-black text-orange-600">₺{product.price.toLocaleString('tr-TR')}</span>
                             <button 
                               onClick={(e) => { e.stopPropagation(); addToCart(product); }} 
                               className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center hover:bg-orange-500 hover:text-white transition-colors"
                             >
                               <ShoppingCart className="w-5 h-5"/>
                             </button>
                          </div>
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </div>

      {/* Slide-over Cart & Checkout */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}></div>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="w-full max-w-md bg-white h-full shadow-2xl relative flex flex-col z-10">
               
               {/* Cart Header */}
               <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <ShoppingCart className="w-6 h-6 text-orange-500"/> 
                    {checkoutStep === 'cart' && `Sepetim (${cart.length})`}
                    {checkoutStep === 'address' && 'Teslimat Adresi'}
                    {checkoutStep === 'payment' && 'Kart ile Ödeme'}
                    {checkoutStep === 'success' && 'Sipariş Alındı!'}
                  </h2>
                  <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-slate-800"><X className="w-6 h-6"/></button>
               </div>

               {/* Cart Step Content */}
               <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {checkoutStep === 'cart' && (
                     cart.length === 0 ? (
                        <div className="text-center text-slate-500 mt-20">
                          <ShoppingCart className="w-16 h-16 mx-auto text-slate-200 mb-4"/>
                          <p className="font-bold">Sepetiniz şu an boş.</p>
                        </div>
                     ) : (
                       <div className="space-y-4">
                          {cart.map((item) => (
                             <div key={item.id} className="flex gap-4 p-4 border border-slate-200 rounded-2xl relative group bg-white hover:border-orange-200 transition-colors">
                                <div className="w-20 h-20 bg-slate-50 rounded-xl p-2 shrink-0 flex items-center justify-center">
                                   <img src={item.image} alt={item.name} className="max-h-full max-w-full object-contain"/>
                                </div>
                                <div className="flex-1 flex flex-col justify-between">
                                   <div>
                                      <p className="text-[10px] font-black text-slate-400 uppercase">{item.brand}</p>
                                      <h4 className="font-bold text-slate-800 text-sm leading-tight line-clamp-1">{item.name}</h4>
                                   </div>
                                   <div className="flex justify-between items-center mt-2">
                                      <span className="font-black text-orange-600 text-base">₺{item.price.toLocaleString('tr-TR')}</span>
                                      
                                      <div className="flex items-center border border-slate-200 rounded-lg">
                                         <button onClick={() => updateCartQty(item.id, -1)} className="p-1.5 hover:bg-slate-100 transition-colors text-slate-500"><Minus className="w-3.5 h-3.5"/></button>
                                         <span className="px-2.5 text-xs font-black text-slate-700">{item.qty}</span>
                                         <button onClick={() => updateCartQty(item.id, 1)} className="p-1.5 hover:bg-slate-100 transition-colors text-slate-500"><Plus className="w-3.5 h-3.5"/></button>
                                      </div>
                                   </div>
                                </div>
                                <button onClick={() => removeFromCart(item.id)} className="absolute top-3 right-3 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                             </div>
                          ))}

                          {/* Coupon Code Section */}
                          <div className="pt-4 border-t border-slate-100">
                             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">İndirim Kuponu</label>
                             <div className="flex gap-2">
                                <input 
                                  type="text" 
                                  value={couponCode} 
                                  onChange={e => setCouponCode(e.target.value)} 
                                  placeholder="Örn: VISION10" 
                                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-800 outline-none uppercase"
                                />
                                <button onClick={applyCoupon} className="px-5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black transition-colors">Uygula</button>
                             </div>
                             <p className="text-[10px] text-slate-400 mt-1.5">Denemek için <b>VISION10</b> kodunu kullanabilirsiniz (%10 indirim sağlar).</p>
                          </div>
                       </div>
                     )
                  )}

                  {checkoutStep === 'address' && (
                     <div className="space-y-4">
                        <button onClick={() => setCheckoutStep('cart')} className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1 hover:text-orange-500"><ArrowRight className="w-3.5 h-3.5 rotate-180"/> Sepete Geri Dön</button>
                        <h3 className="text-lg font-black text-slate-800 border-b pb-2 flex items-center gap-2"><MapPin className="w-5 h-5 text-orange-500"/> Adres ve Teslimat</h3>
                        
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">Ad Soyad *</label>
                          <input type="text" required value={deliveryInfo.name} onChange={e=>setDeliveryInfo({...deliveryInfo, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl outline-none focus:border-orange-500 font-bold text-sm text-slate-800" placeholder="Hasan Kaya"/>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">Telefon Numarası *</label>
                          <input type="tel" required value={deliveryInfo.phone} onChange={e=>setDeliveryInfo({...deliveryInfo, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl outline-none focus:border-orange-500 font-bold text-sm text-slate-800" placeholder="0555 123 4567"/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Şehir *</label>
                            <input type="text" required value={deliveryInfo.city} onChange={e=>setDeliveryInfo({...deliveryInfo, city: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl outline-none focus:border-orange-500 font-bold text-sm text-slate-800" />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">İlçe *</label>
                            <input type="text" required value={deliveryInfo.district} onChange={e=>setDeliveryInfo({...deliveryInfo, district: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl outline-none focus:border-orange-500 font-bold text-sm text-slate-800" />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">Açık Adres *</label>
                          <textarea required value={deliveryInfo.address} onChange={e=>setDeliveryInfo({...deliveryInfo, address: e.target.value})} rows={3} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl outline-none focus:border-orange-500 font-medium text-sm text-slate-800" placeholder="Mahalle, Cadde, Sokak, Daire ve Apartman bilgileri..."></textarea>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">Sipariş / Kargo Notu</label>
                          <input type="text" value={deliveryInfo.note} onChange={e=>setDeliveryInfo({...deliveryInfo, note: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl outline-none focus:border-orange-500 font-medium text-sm text-slate-800" placeholder="Güvenliğe bırakılsın, gelmeden aransın vb."/>
                        </div>
                     </div>
                  )}

                  {checkoutStep === 'payment' && (
                     <div className="space-y-4">
                        <button onClick={() => setCheckoutStep('address')} className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1 hover:text-orange-500"><ArrowRight className="w-3.5 h-3.5 rotate-180"/> Adres Bilgilerine Dön</button>
                        <h3 className="text-lg font-black text-slate-800 border-b pb-2 flex items-center gap-2"><CreditCard className="w-5 h-5 text-orange-500"/> Kredi / Banka Kartı</h3>
                        
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden mb-6 flex flex-col justify-between h-44">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
                          <div className="flex justify-between items-start">
                             <span className="font-extrabold text-xs tracking-widest text-slate-300">VISIONX PREMIUM CARD</span>
                             <CreditCard className="w-8 h-8 text-white/50" />
                          </div>
                          <div>
                             <p className="text-lg font-mono tracking-widest text-slate-100">{paymentInfo.cardNumber || '•••• •••• •••• ••••'}</p>
                          </div>
                          <div className="flex justify-between items-end">
                             <div>
                               <p className="text-[8px] text-slate-400 uppercase">KART SAHİBİ</p>
                               <p className="text-xs font-bold tracking-wide uppercase truncate max-w-[150px]">{paymentInfo.cardHolder || 'AD SOYAD'}</p>
                             </div>
                             <div>
                               <p className="text-[8px] text-slate-400 uppercase text-right">SKT</p>
                               <p className="text-xs font-bold tracking-wide">{paymentInfo.cardExpiry || 'AA/YY'}</p>
                             </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">Kart Üzerindeki İsim</label>
                          <input type="text" value={paymentInfo.cardHolder} onChange={e=>setPaymentInfo({...paymentInfo, cardHolder: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl outline-none focus:border-orange-500 font-bold text-sm text-slate-800 uppercase" placeholder="AHMET YILMAZ"/>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">Kart Numarası</label>
                          <input type="text" maxLength={19} value={paymentInfo.cardNumber} onChange={e=>setPaymentInfo({...paymentInfo, cardNumber: e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim()})} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl outline-none focus:border-orange-500 font-bold text-sm text-slate-800" placeholder="5412 7500 0000 0000"/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Son Kullanma (AA/YY)</label>
                            <input type="text" maxLength={5} value={paymentInfo.cardExpiry} onChange={e=>setPaymentInfo({...paymentInfo, cardExpiry: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl outline-none focus:border-orange-500 font-bold text-sm text-slate-800 text-center" placeholder="12/28"/>
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">CVV</label>
                            <input type="password" maxLength={3} value={paymentInfo.cardCvv} onChange={e=>setPaymentInfo({...paymentInfo, cardCvv: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl outline-none focus:border-orange-500 font-bold text-sm text-slate-800 text-center" placeholder="•••"/>
                          </div>
                        </div>
                     </div>
                  )}

                  {checkoutStep === 'success' && completedOrderInfo && (
                     <div className="text-center py-10 space-y-6">
                        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-100 shadow-lg animate-bounce">
                           <CheckCircle2 className="w-12 h-12" />
                        </div>
                        <div>
                           <h3 className="text-2xl font-black text-slate-800">Siparişiniz Alındı!</h3>
                           <p className="text-sm font-semibold text-slate-500 mt-1">Harika bir güneş gözlüğü tercihi yaptınız.</p>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left text-sm space-y-2">
                           <p className="font-bold text-slate-700 flex justify-between"><span>Sipariş Kodu:</span> <span className="text-orange-600 font-black">{completedOrderInfo.orderNumber}</span></p>
                           <p className="font-semibold text-slate-500 flex justify-between"><span>Tarih:</span> <span className="text-slate-800 font-bold">{completedOrderInfo.date}</span></p>
                           <p className="font-semibold text-slate-500 flex justify-between"><span>Ödeme Yöntemi:</span> <span className="text-slate-800 font-bold">Kredi Kartı</span></p>
                           <p className="font-semibold text-slate-500 flex justify-between"><span>Kargo Durumu:</span> <span className="text-emerald-600 font-bold">Hazırlanıyor (Bugün Kargoda)</span></p>
                           <div className="border-t pt-2 mt-2">
                              <p className="font-bold text-slate-700 flex justify-between text-base"><span>Toplam Ödeme:</span> <span className="text-slate-900 font-black">₺{completedOrderInfo.total.toLocaleString('tr-TR')}</span></p>
                           </div>
                        </div>

                        <div className="text-left text-xs font-semibold text-slate-500 bg-orange-50 p-4 border border-orange-100 rounded-xl leading-relaxed">
                          Siparişiniz VisionX SaaS platformumuzun merkez kargo deposuna iletilmiştir. Sipariş detaylarınızı <b>Siparişlerim</b> sayfasından dilediğiniz an inceleyebilirsiniz.
                        </div>

                        <button 
                          onClick={() => { setIsCartOpen(false); setCheckoutStep('cart'); }} 
                          className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl shadow-lg transition-colors"
                        >
                          Alışverişe Devam Et
                        </button>
                     </div>
                  )}
               </div>

               {/* Cart Summary / Totals */}
               {cart.length > 0 && checkoutStep !== 'success' && (
                 <div className="p-6 border-t border-slate-100 bg-white">
                   <div className="space-y-2 mb-4 text-sm font-semibold text-slate-500">
                      <div className="flex justify-between">
                         <span>Ara Toplam:</span>
                         <span className="text-slate-800 font-bold">₺{cartSubtotal.toLocaleString('tr-TR')}</span>
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-rose-500 font-bold">
                           <span>Kupon İndirimi (%{appliedDiscountPercent}):</span>
                           <span>-₺{discountAmount.toLocaleString('tr-TR')}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                         <span>Kargo Ücreti:</span>
                         <span className="text-slate-800 font-bold">{shippingFee === 0 ? 'Ücretsiz' : `₺${shippingFee}`}</span>
                      </div>
                      <div className="flex justify-between text-lg font-black text-slate-800 pt-3 border-t">
                         <span>Genel Toplam:</span>
                         <span className="text-orange-600">₺{cartTotal.toLocaleString('tr-TR')}</span>
                      </div>
                   </div>

                   {checkoutStep === 'cart' && (
                     <button onClick={() => setCheckoutStep('address')} className="w-full py-4 bg-orange-500 text-white font-black rounded-2xl hover:bg-orange-600 shadow-lg shadow-orange-200 transition-colors flex items-center justify-center gap-2">
                       Alışverişi Tamamla <ArrowRight className="w-4 h-4" />
                     </button>
                   )}
                   {checkoutStep === 'address' && (
                     <button onClick={handleCheckoutSubmit} className="w-full py-4 bg-orange-500 text-white font-black rounded-2xl hover:bg-orange-600 shadow-lg shadow-orange-200 transition-colors flex items-center justify-center gap-2">
                       Ödeme Sayfasına Geç <ArrowRight className="w-4 h-4" />
                     </button>
                   )}
                   {checkoutStep === 'payment' && (
                     <button onClick={handleCheckoutSubmit} className="w-full py-4 bg-emerald-500 text-white font-black rounded-2xl hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-colors flex items-center justify-center gap-2">
                       Ödemeyi Tamamla & Onayla (₺{cartTotal.toLocaleString('tr-TR')})
                     </button>
                   )}
                 </div>
               )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Detail Lightbox (Açıklama Modülü) */}
      <AnimatePresence>
         {selectedProduct && (
           <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedProduct(null)} className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm" />
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-6 pointer-events-none">
                 <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl pointer-events-auto flex flex-col md:flex-row overflow-hidden relative border border-slate-100 max-h-[90vh]">
                    
                    {/* Close Button */}
                    <button onClick={() => setSelectedProduct(null)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors z-20"><X className="w-5 h-5"/></button>

                    {/* Image Area */}
                    <div className="md:w-1/2 bg-slate-100 p-8 flex items-center justify-center relative overflow-hidden select-none min-h-[300px]">
                       <img src={selectedProduct.image} alt={selectedProduct.name} className="max-h-[350px] w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"/>
                       <div className="absolute bottom-6 left-6 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-black text-slate-500 border border-slate-200 shadow-sm">
                         Ekartman: {selectedProduct.dimensions.split(' ')[0]}
                       </div>
                    </div>

                    {/* Details Info Area */}
                    <div className="md:w-1/2 p-8 md:p-10 flex flex-col justify-between overflow-y-auto max-h-[80vh] md:max-h-full">
                       <div className="space-y-6">
                          <div>
                            <span className="bg-orange-50 text-orange-600 border border-orange-100 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest mb-2 inline-block">{selectedProduct.brand}</span>
                            <h2 className="text-2xl md:text-3xl font-black text-slate-800 leading-tight">{selectedProduct.name}</h2>
                            
                            <div className="flex items-center gap-1.5 mt-2">
                               <Star className="w-4 h-4 text-orange-400 fill-orange-400"/>
                               <span className="text-sm font-bold text-slate-700">{selectedProduct.rating}</span>
                               <span className="text-xs text-slate-400">({selectedProduct.reviews} Müşteri Yorumu)</span>
                            </div>
                          </div>

                          <div className="border-t border-b border-slate-100 py-4 space-y-2.5">
                             <div className="flex justify-between text-xs font-semibold text-slate-500">
                                <span>Çerçeve Rengi:</span> <span className="text-slate-800 font-bold">{selectedProduct.frameColor}</span>
                             </div>
                             <div className="flex justify-between text-xs font-semibold text-slate-500">
                                <span>Cam Özelliği:</span> <span className="text-slate-800 font-bold">{selectedProduct.lensColor}</span>
                             </div>
                             <div className="flex justify-between text-xs font-semibold text-slate-500">
                                <span>Ölçüler (Ekartman):</span> <span className="text-slate-800 font-bold">{selectedProduct.dimensions}</span>
                             </div>
                             <div className="flex justify-between text-xs font-semibold text-slate-500">
                                <span>Cam Filtresi:</span> <span className="text-emerald-600 font-black">UV400 Koruma</span>
                             </div>
                          </div>

                          <div>
                             <h4 className="text-sm font-black text-slate-800 mb-2 uppercase tracking-wide">Ürün Açıklaması</h4>
                             <p className="text-xs font-medium text-slate-500 leading-relaxed">{selectedProduct.description}</p>
                          </div>
                       </div>

                       <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between gap-6">
                          <div>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">FİYAT</p>
                             <span className="text-3xl font-black text-orange-600">₺{selectedProduct.price.toLocaleString('tr-TR')}</span>
                          </div>
                          <button 
                            onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }} 
                            className="px-8 py-4 bg-orange-500 text-white font-black rounded-2xl hover:bg-orange-600 shadow-lg shadow-orange-200 transition-colors flex items-center gap-2"
                          >
                             <ShoppingCart className="w-5 h-5"/> Sepete Ekle
                          </button>
                       </div>
                    </div>

                 </motion.div>
              </div>
           </>
         )}
      </AnimatePresence>

      {/* Past Orders List Modal */}
      <AnimatePresence>
         {showPastOrders && (
           <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPastOrders(false)} className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm" />
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
                 <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl pointer-events-auto flex flex-col overflow-hidden border border-slate-100 max-h-[80vh]">
                    
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                       <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><ShoppingBag className="w-6 h-6 text-orange-500" /> Sipariş Geçmişim</h3>
                       <button onClick={() => setShowPastOrders(false)} className="text-slate-400 hover:text-slate-800"><X className="w-6 h-6"/></button>
                    </div>

                    <div className="p-6 overflow-y-auto space-y-4 flex-1">
                       {pastOrders.length === 0 ? (
                          <div className="text-center py-12 text-slate-400">
                             <ShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                             <p className="font-bold">Henüz verilmiş bir siparişiniz bulunmamaktadır.</p>
                          </div>
                       ) : (
                          pastOrders.map((order, index) => (
                             <div key={index} className="border border-slate-200 rounded-2xl p-5 space-y-3 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                <div className="flex justify-between items-center text-sm">
                                   <div>
                                      <p className="font-black text-slate-800">{order.orderNumber}</p>
                                      <p className="text-xs font-semibold text-slate-400 mt-0.5">Tarih: {order.date}</p>
                                   </div>
                                   <span className="px-3 py-1 bg-emerald-50 text-emerald-600 font-bold text-xs rounded-full">Kargoya Verildi</span>
                                </div>

                                <div className="space-y-2 border-t pt-2.5">
                                   {order.items.map((it: any, i: number) => (
                                      <div key={i} className="flex justify-between text-xs font-bold text-slate-600">
                                         <span>{it.name} (x{it.qty})</span>
                                         <span>₺{(it.price * it.qty).toLocaleString('tr-TR')}</span>
                                      </div>
                                   ))}
                                </div>

                                <div className="flex justify-between text-sm font-black text-slate-800 border-t pt-2.5">
                                   <span>Toplam Ödeme:</span>
                                   <span className="text-orange-600">₺{order.total.toLocaleString('tr-TR')}</span>
                                </div>
                             </div>
                          ))
                       )}
                    </div>
                 </motion.div>
              </div>
           </>
         )}
      </AnimatePresence>
    </div>
  );
}
