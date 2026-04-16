import { Glasses, User, Compass } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function PublicHeader() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/50 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-105 transition-transform">
            <Glasses className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">Vision X Pro</h1>
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5 block">Sizin Optisyeniniz</span>
          </div>
        </Link>
        <nav className="hidden md:flex gap-8">
           <Link to="/" className={`text-sm font-bold transition-colors ${location.pathname === '/' ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-700'}`}>Anasayfa</Link>
           <Link to="/stores" className={`text-sm font-bold transition-colors ${location.pathname === '/stores' ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-700'}`}>Mağazaları Keşfedin</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/stores" className="hidden sm:flex px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200 shadow-sm items-center gap-2">
            <Compass className="w-4 h-4"/> Randevu Al
          </Link>
          <Link to="/login" className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-colors flex items-center gap-2">
            <User className="w-4 h-4"/> Mağaza Girişi
          </Link>
        </div>
      </div>
    </header>
  );
}
