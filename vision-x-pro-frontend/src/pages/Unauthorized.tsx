import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function Unauthorized() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 p-10 max-w-md w-full text-center">
        <ShieldAlert className="w-16 h-16 text-amber-500 mb-4 mx-auto" />
        <h1 className="text-2xl font-black text-slate-800 mb-2">Yetkisiz Erişim</h1>
        <p className="text-slate-600 mb-6 font-medium">
          Bu modül için yetkiniz bulunmuyor. Kurumsal yöneticinizden rol/yetki tanımı isteyebilirsiniz.
        </p>
        <button 
          onClick={() => navigate('/dashboard')} 
          className="w-full px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-bold flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Panele Dön
        </button>
      </div>
    </div>
  );
}
