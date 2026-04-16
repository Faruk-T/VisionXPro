import { motion } from 'framer-motion';
import { Eye, ShieldCheck, Heart, Sparkles, ChevronRight, Glasses } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* HERO SECTION */}
      <section className="relative pt-32 pb-40 overflow-hidden flex items-center justify-center min-h-[85vh]">
         <div className="absolute inset-0 bg-slate-900 z-0"></div>
         
         {/* AMAZING GRADIENT BACKGROUND - as requested by user instead of stock photo */}
         <div className="absolute inset-0 z-0 opacity-60">
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[70%] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full blur-[140px] mix-blend-screen animate-pulse-slow"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[80%] bg-gradient-to-tl from-cyan-400 via-blue-500 to-indigo-600 rounded-full blur-[150px] mix-blend-screen"></div>
            <div className="absolute top-[40%] right-[30%] w-[30%] h-[30%] bg-gradient-to-tr from-amber-400 to-rose-400 rounded-full blur-[120px] mix-blend-screen opacity-50"></div>
         </div>
         
         {/* Glassmorphism Overlay */}
         <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px] z-0"></div>

         <div className="max-w-[1200px] mx-auto px-6 relative z-10 text-center flex flex-col items-center">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }} className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-bold tracking-widest uppercase mb-8 shadow-2xl">
               <Sparkles className="w-4 h-4 text-amber-300"/> Sizin Optisyeniniz
            </motion.div>
            
            <motion.h1 initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="text-5xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-white tracking-tight leading-[1.1] mb-8 drop-shadow-lg">
              Görme Deneyiminizi <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-indigo-300">Mükemmelleştirin</span>
            </motion.h1>
            
            <motion.p initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.4 }} className="text-lg md:text-xl text-slate-300 font-medium max-w-2xl mb-12 leading-relaxed">
              Size en yakın optik mağazayı keşfedin, randevunuzu saniyeler içinde alın ve göz sağlığınız için en profesyonel hizmete ulaşın.
            </motion.p>
            
            <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.6 }} className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto justify-center">
               <Link to="/stores" className="px-10 py-5 rounded-2xl bg-white text-indigo-900 font-black text-lg hover:bg-indigo-50 hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] flex items-center justify-center gap-2">
                 Optik Mağazaları Keşfet <ChevronRight className="w-5 h-5"/>
               </Link>
            </motion.div>
         </div>
      </section>

      {/* ABOUT US / VALUES SECTION */}
      <section className="py-32 bg-white relative overflow-hidden">
         <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-b from-indigo-50/50 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
         
         <div className="max-w-[1400px] mx-auto px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-20">
               <h2 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight mb-6">Hakkımızda & Değerlerimiz</h2>
               <p className="text-lg text-slate-500 font-medium leading-relaxed">
                 Göz sağlığınız için en kaliteli hizmeti sunmak amacıyla yola çıktık. Modern teknoloji ve uzman kadromuzla görme deneyimini standartların üzerine taşıyoruz.
               </p>
            </div>

            <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="grid grid-cols-1 md:grid-cols-3 gap-8">
               
               {/* Güvenilirlik */}
               <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-[0_20px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_30px_60px_rgba(79,70,229,0.1)] hover:-translate-y-2 transition-all relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[100px] -z-10 group-hover:bg-indigo-100 transition-colors"></div>
                  <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mb-8 shadow-lg shadow-indigo-200">
                     <ShieldCheck className="w-10 h-10 text-white"/>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 mb-4">Güvenilirlik</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">
                    Müşterilerimizin güvenini kazanmak için her zaman şeffaf ve dürüst hizmet sunuyoruz. Kayıtlı optisyenlik müesseseleri güvencesi altındasınız.
                  </p>
               </motion.div>

               {/* İnovasyon */}
               <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-[0_20px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_30px_60px_rgba(168,85,247,0.1)] hover:-translate-y-2 transition-all relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-[100px] -z-10 group-hover:bg-purple-100 transition-colors"></div>
                  <div className="w-20 h-20 bg-purple-600 rounded-3xl flex items-center justify-center mb-8 shadow-lg shadow-purple-200">
                     <Sparkles className="w-10 h-10 text-white"/>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 mb-4">İnovasyon</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">
                    Sürekli gelişim ve teknolojik çözümlerle hizmet kalitemizi artırıyor, akıllı optik randevu sistemimizle sizi yormuyoruz.
                  </p>
               </motion.div>

               {/* Müşteri Odaklılık */}
               <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-[0_20px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_30px_60px_rgba(236,72,153,0.1)] hover:-translate-y-2 transition-all relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-bl-[100px] -z-10 group-hover:bg-pink-100 transition-colors"></div>
                  <div className="w-20 h-20 bg-pink-600 rounded-3xl flex items-center justify-center mb-8 shadow-lg shadow-pink-200">
                     <Heart className="w-10 h-10 text-white"/>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 mb-4">Müşteri Odaklılık</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">
                    Her hastanın ihtiyacını anlayarak kişiselleştirilmiş odaklama ve çerçeve çözümleri sunmak en büyük önceliğimiz.
                  </p>
               </motion.div>

            </motion.div>
         </div>
      </section>

      {/* SERVICES SECTION */}
      <section className="py-32 bg-slate-50 relative">
         <div className="max-w-[1400px] mx-auto px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-20">
               <h2 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight mb-6">Hizmetlerimiz</h2>
               <p className="text-lg text-slate-500 font-medium leading-relaxed">
                 Göz sağlığınız için kapsamlı ve profesyonel optik hizmetleri sunuyoruz. Reçetenizi ve stilinizi en iyi yansıtan ürünleri bir araya getirdik.
               </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm flex items-center gap-8 group hover:shadow-xl transition-shadow cursor-default">
                  <div className="w-32 h-32 bg-emerald-50 rounded-full flex items-center justify-center shrink-0 border border-emerald-100 group-hover:scale-105 transition-transform">
                     <Glasses className="w-12 h-12 text-emerald-600"/>
                  </div>
                  <div>
                     <h3 className="text-3xl font-black text-slate-800 mb-2">Gözlük & Çerçeve</h3>
                     <p className="text-slate-500 font-medium">Yüz hatlarınıza ve reçetenize en uygun ergonomik tasarım çerçeveler uzmanlarımız eşliğinde seçilir.</p>
                  </div>
               </div>
               
               <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm flex items-center gap-8 group hover:shadow-xl transition-shadow cursor-default">
                  <div className="w-32 h-32 bg-blue-50 rounded-full flex items-center justify-center shrink-0 border border-blue-100 group-hover:scale-105 transition-transform">
                     <Eye className="w-12 h-12 text-blue-600"/>
                  </div>
                  <div>
                     <h3 className="text-3xl font-black text-slate-800 mb-2">Kontakt Lens</h3>
                     <p className="text-slate-500 font-medium">Günlük, aylık veya renkli lens ihtiyaçlarınız için gerekli olan tüm korneal ölçümler profesyonelce tamamlanır.</p>
                  </div>
               </div>
            </div>
         </div>
      </section>

    </div>
  );
}
