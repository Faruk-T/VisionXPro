import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Printer, Tag, QrCode, Search, ScanBarcode, Box, Settings2, Info } from 'lucide-react';
import Barcode from 'react-barcode';

export default function Labels() {
  const [tab, setTab] = useState<'tek' | 'toplu'>('tek');
  
  // Form State
  const [productName, setProductName] = useState('Ray-Ban Hexagonal Altın Çerçeve');
  const [barcodeNum, setBarcodeNum] = useState('8681283991002');
  const [price, setPrice] = useState('3250.00');
  const [labelWidth, setLabelWidth] = useState(50);
  const [labelHeight, setLabelHeight] = useState(30);
  const [quantity, setQuantity] = useState(1);
  const [extraInfo, setExtraInfo] = useState('Güneş Gözlüğü - 2 Yıl Garanti');
  const [showPrice, setShowPrice] = useState(true);
  
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-[calc(100vh-80px)] p-6 lg:p-8 relative overflow-hidden bg-gradient-to-br from-[#F8FAFC] via-[#E2E8F0] to-[#CBD5E1] flex flex-col font-sans">
      
      {/* Printable Area - Moved OUTSIDE of #root via React Portal to prevent any ghost spaces */}
      {createPortal(
        <div id="printable-section" className="hidden print:flex flex-col">
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
               @page { size: ${labelWidth}mm ${labelHeight}mm; margin: 0; padding: 0; }
               body, html { 
                 margin: 0; 
                 padding: 0; 
                 background: white;
               }
               #root {
                 display: none !important; /* Uygulamanın tamamını gizler, ghost boşluk bırakmaz */
               }
               #printable-section {
                 display: flex !important;
                 flex-direction: column;
                 width: ${labelWidth}mm;
                 background: white;
               }
            }
          `}} />
          
          {Array.from({ length: quantity }).map((_, i) => (
            <div key={i} className="flex flex-col items-center justify-center bg-white" style={{ width: `${labelWidth}mm`, height: `${labelHeight}mm`, boxSizing: 'border-box', padding: '2mm', pageBreakAfter: i === quantity - 1 ? 'auto' : 'always' }}>
               <p style={{ fontSize: '10px', fontWeight: '900', color: 'black', textAlign: 'center', lineHeight: '1.2', marginBottom: '2px', fontFamily: 'sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{productName}</p>
               <div style={{ transform: 'scale(0.8)', transformOrigin: 'top center', marginBottom: '-5px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                 <Barcode value={barcodeNum || '000000'} format="CODE128" width={2} height={40} displayValue={false} margin={0} background="transparent" lineColor="#000" />
               </div>
               <p style={{ fontSize: '10px', fontWeight: 'bold', color: 'black', fontFamily: 'monospace', letterSpacing: '1px' }}>{barcodeNum}</p>
               <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-end', marginTop: 'auto' }}>
                  <p style={{ fontSize: '8px', color: '#000', fontWeight: 'bold' }}>{extraInfo}</p>
                  {showPrice && <p style={{ fontSize: '12px', fontWeight: '900', color: 'black' }}>{parseFloat(price).toLocaleString('tr-TR')} ₺</p>}
               </div>
            </div>
          ))}
        </div>,
        document.body
      )}

      {/* Screen UI */}
      <div className="relative z-10 w-full max-w-[1400px] mx-auto flex flex-col gap-8 h-full print:hidden">
        
        {/* HEADER */}
        <div className="bg-white/60 backdrop-blur-3xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] p-8 flex flex-col md:flex-row justify-between items-start md:items-center">
           <div>
              <div className="inline-flex items-center justify-center px-4 py-1.5 mb-2 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black tracking-widest uppercase border border-indigo-100 shadow-sm">
                 <Printer className="w-3.5 h-3.5 mr-1.5 text-indigo-500" /> Etiket Modülü
              </div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Ürün Etiketi Oluştur</h2>
              <p className="text-slate-500 text-sm font-bold mt-1">Raf ve ürün etiketlerinizi termal yazıcınıza uygun formatta tasarlayın ve basın.</p>
           </div>

           <div className="flex bg-slate-100/80 p-2 rounded-2xl border border-slate-200 mt-6 md:mt-0">
             <button onClick={() => setTab('tek')} className={`px-8 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${tab === 'tek' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>
               <Tag className="w-4 h-4" /> Tek Ürün
             </button>
             <button onClick={() => setTab('toplu')} className={`px-8 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${tab === 'toplu' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>
               <Box className="w-4 h-4" /> Toplu Ürün
             </button>
           </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex flex-col lg:flex-row gap-8 pb-32">
           
           {/* LEFT: FORM */}
           <div className="flex-[3] bg-white/60 backdrop-blur-3xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] p-8 flex flex-col h-fit relative">
               <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-100/50 rounded-full blur-[80px] pointer-events-none"></div>
               
               <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-6">
                 <ScanBarcode className="w-6 h-6 text-indigo-500"/> Etiket Bilgileri
               </h3>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                 
                 <div className="col-span-1 md:col-span-2">
                   <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2 block flex items-center gap-1"><Search className="w-3 h-3"/> Ürün Ara / Adı</label>
                   <input type="text" value={productName} onChange={e=>setProductName(e.target.value)} className="w-full bg-white/80 border border-slate-200 py-4 px-5 rounded-2xl text-lg font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all shadow-sm" placeholder="Aramak için yazın..." />
                 </div>

                 <div>
                   <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2 block flex items-center gap-1"><BarcodeIcon className="w-3 h-3"/> Barkod Numarası</label>
                   <input type="text" value={barcodeNum} onChange={e=>setBarcodeNum(e.target.value)} className="w-full bg-white/80 border border-slate-200 py-4 px-5 rounded-2xl text-md font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none font-mono transition-all shadow-sm" />
                 </div>

                 <div>
                   <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2 block flex items-center gap-1"><QrCode className="w-3 h-3"/> Barkod Tipi</label>
                   <select className="w-full bg-white/80 border border-slate-200 py-4 px-5 rounded-2xl text-md font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all shadow-sm appearance-none cursor-pointer">
                     <option>Görsel Barkod (Code128)</option>
                     <option>Karekod (QR Code)</option>
                   </select>
                 </div>

                 <div>
                   <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2 block flex items-center gap-1"><Tag className="w-3 h-3"/> Raf Fiyatı (₺)</label>
                   <input type="number" value={price} onChange={e=>setPrice(e.target.value)} className="w-full bg-white/80 border border-slate-200 py-4 px-5 rounded-2xl text-xl font-black text-rose-600 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all shadow-sm" />
                 </div>

                 <div>
                   <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2 block flex items-center gap-1"><Info className="w-3 h-3"/> Ek Bilgi Notu</label>
                   <input type="text" value={extraInfo} onChange={e=>setExtraInfo(e.target.value)} className="w-full bg-white/80 border border-slate-200 py-4 px-5 rounded-2xl text-md font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all shadow-sm" placeholder="Örn: Renk: Siyah" />
                 </div>

               </div>
               
           </div>

           {/* RIGHT: SETTINGS & PREVIEW */}
           <div className="flex-[2] flex flex-col gap-6">
              
              <div className="bg-white/60 backdrop-blur-3xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] p-8 relative">
                 <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-6">
                   <Settings2 className="w-6 h-6 text-purple-500"/> Boyut & Ayar
                 </h3>

                 <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2 block">Etiket Boyutu</label>
                      <select className="w-full bg-white/80 border border-slate-200 py-3.5 px-4 rounded-xl text-sm font-bold text-slate-700 outline-none mb-3 shadow-sm">
                        <option>Diğer (Özel Boyut)</option>
                        <option>40mm x 20mm (Standart Optik)</option>
                        <option>60mm x 40mm (Kargo)</option>
                      </select>
                      
                      <div className="grid grid-cols-2 gap-3 p-4 bg-purple-50/50 rounded-xl border border-purple-100">
                         <div>
                           <label className="text-[10px] font-black tracking-widest text-purple-600 uppercase mb-1 block">Genişlik (mm)</label>
                           <input type="number" value={labelWidth} onChange={e=>setLabelWidth(Number(e.target.value))} className="w-full bg-white border border-purple-200 py-2 px-3 rounded-lg text-sm font-bold text-slate-800 outline-none focus:border-purple-400 shadow-sm" />
                         </div>
                         <div>
                           <label className="text-[10px] font-black tracking-widest text-purple-600 uppercase mb-1 block">Yükseklik (mm)</label>
                           <input type="number" value={labelHeight} onChange={e=>setLabelHeight(Number(e.target.value))} className="w-full bg-white border border-purple-200 py-2 px-3 rounded-lg text-sm font-bold text-slate-800 outline-none focus:border-purple-400 shadow-sm" />
                         </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div>
                         <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2 block">Adet / Kopya</label>
                         <input type="number" min="1" value={quantity} onChange={e=>setQuantity(Number(e.target.value))} className="w-full bg-white/80 border border-slate-200 py-3.5 px-4 rounded-xl text-lg font-black text-slate-800 outline-none focus:border-indigo-400 shadow-sm" />
                       </div>
                       <div className="flex items-end pb-1">
                         <label className="flex items-center gap-3 p-3 bg-white/80 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:bg-white w-full h-[52px]">
                           <input type="checkbox" checked={showPrice} onChange={e=>setShowPrice(e.target.checked)} className="w-4 h-4 rounded text-indigo-600 border-gray-300" />
                           <span className="text-xs font-bold text-slate-800">Fiyat Göster</span>
                         </label>
                       </div>
                    </div>
                 </div>
              </div>

           </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="bg-white/90 backdrop-blur-3xl border border-white shadow-[0_-15px_40px_rgba(0,0,0,0.06)] rounded-t-[2.5rem] md:rounded-[2.5rem] p-6 flex flex-col md:flex-row justify-between items-center fixed bottom-0 md:bottom-6 left-0 md:left-6 lg:left-80 right-0 md:right-6 lg:right-8 z-40 gap-4 md:gap-0">
           <p className="text-sm font-bold text-slate-500 w-full md:w-auto text-center md:text-left">
              Şu an <span className="text-indigo-600 font-black bg-indigo-50 px-2 py-0.5 rounded-md">{quantity} Adet</span> termal etiket çıkartılmaya hazır.
           </p>
           
           <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
             <button onClick={() => setIsPreviewOpen(true)} className="px-8 py-3.5 bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold rounded-2xl hover:bg-indigo-100 shadow-sm flex items-center gap-2 transition-colors whitespace-nowrap">
                <Search className="w-5 h-5"/>
                TASARIMI GÖR (ÖNİZLEME)
             </button>
             <button onClick={handlePrint} className="px-10 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[0_8px_20px_rgba(99,102,241,0.4)] text-white font-black rounded-2xl flex items-center gap-3 hover:-translate-y-0.5 hover:shadow-[0_12px_25px_rgba(99,102,241,0.6)] transition-all whitespace-nowrap">
                <Printer className="w-6 h-6"/>
                YAZDIR (Print)
             </button>
           </div>
        </div>

      </div>

      {/* PREVIEW MODAL */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 print:hidden">
           <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="bg-slate-800 border border-slate-700 shadow-2xl rounded-[2.5rem] p-10 w-full max-w-lg relative flex flex-col items-center justify-center overflow-hidden">
               <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/20 rounded-full blur-[60px] pointer-events-none"></div>
               
               <button onClick={() => setIsPreviewOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-700/50 text-slate-300 hover:text-white rounded-full hover:bg-slate-600 transition-colors">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
               </button>

               <div className="flex items-center gap-3 mb-8 w-full">
                  <div className="w-10 h-10 bg-cyan-500/20 text-cyan-400 rounded-xl flex items-center justify-center"><Search className="w-5 h-5"/></div>
                  <div>
                    <h3 className="text-xl font-black text-white">Canlı İzleme</h3>
                    <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mt-0.5">TERMAL YAZICI FORMATI ({labelWidth}mm x {labelHeight}mm)</p>
                  </div>
               </div>
               
               {/* Simulated Label Canvas */}
               <div className="bg-white rounded shadow-[0_0_40px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center p-3 relative" 
                    style={{ 
                      width: '100%', 
                      maxWidth: '300px', 
                      aspectRatio: `${labelWidth} / ${labelHeight}` 
                    }}>
                  <p className="text-[10px] font-black text-center leading-tight mb-1 w-full truncate text-slate-900">{productName}</p>
                  <div className="scale-75 origin-top mb-1">
                    <Barcode value={barcodeNum || '000000'} format="CODE128" width={2} height={40} displayValue={false} margin={0} />
                  </div>
                  <p className="text-[10px] font-mono tracking-widest text-slate-800 font-bold -mt-3">{barcodeNum}</p>
                  
                  <div className="flex justify-between items-end w-full mt-auto pt-1">
                     <p className="text-[8px] text-slate-600 font-bold max-w-[60%] truncate">{extraInfo}</p>
                     {showPrice && <p className="text-sm font-black text-slate-900">{parseFloat(price).toLocaleString('tr-TR')} ₺</p>}
                  </div>
               </div>
               
               <button onClick={() => setIsPreviewOpen(false)} className="mt-10 px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors w-full">Önizlemeyi Kapat</button>
           </motion.div>
        </div>
      )}

    </div>
  );
}

function BarcodeIcon(props: any) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 5v14"/><path d="M8 5v14"/><path d="M12 5v14"/><path d="M17 5v14"/><path d="M21 5v14"/></svg>;
}
