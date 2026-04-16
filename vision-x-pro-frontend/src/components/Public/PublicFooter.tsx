import { Glasses } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PublicFooter() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-16 border-t border-slate-800">
      <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
              <Glasses className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight leading-none">Vision X Pro</h2>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-0.5 block">Dijital Sağlık</span>
            </div>
          </div>
          <p className="text-sm font-medium leading-relaxed text-slate-400">
            Göz sağlığınız için profesyonel optik hizmetleri sunan modern mağaza ağımızla her an yanınızdayız. Platformumuz üzerinden en yakın optisyeni bulabilir ve anında randevu alabilirsiniz.
          </p>
        </div>
        
        <div>
          <h4 className="text-white font-bold mb-6 flex items-center gap-2">Hızlı Linkler</h4>
          <ul className="space-y-4 text-sm font-medium">
            <li><Link to="/stores" className="hover:text-indigo-400 transition-colors">Mağazaları Keşfedin</Link></li>
            <li><Link to="/login" className="hover:text-indigo-400 transition-colors">Mağaza Girişi</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6 flex items-center gap-2">Hizmetlerimiz</h4>
          <ul className="space-y-4 text-sm font-medium text-slate-400">
            <li>Gözlük Seçimi ve Odaklama</li>
            <li>Kontakt Lens Muayenesi</li>
            <li>Çerçeve Onarımı</li>
            <li>Optik Sağlık Danışmanlığı</li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6 flex items-center gap-2">İletişim & Destek</h4>
          <ul className="space-y-4 text-sm font-medium text-slate-400">
            <li>
               <p className="text-white mb-1">E-Posta</p>
               <a href="mailto:destek@visionxpro.com" className="hover:text-indigo-400 transition-colors">destek@visionxpro.com</a>
            </li>
            <li>
               <p className="text-white mb-1">İletişim Numaramız</p>
               <span>+90 850 123 45 67</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-[1400px] mx-auto px-6 mt-16 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-semibold">
         <p>© 2026 Vision X Pro Platformu. Tüm hakları gizlidir.</p>
         <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Gizlilik Politikası</a>
            <a href="#" className="hover:text-white transition-colors">Kullanıcı Şartları</a>
         </div>
      </div>
    </footer>
  );
}
