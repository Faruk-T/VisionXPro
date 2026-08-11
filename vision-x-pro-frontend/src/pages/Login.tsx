import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Glasses } from 'lucide-react';
import { motion } from 'framer-motion';

const OpticianAvatar = ({ isPasswordFocused }: { isPasswordFocused: boolean }) => {
  return (
    <div className="relative w-32 h-32 mx-auto overflow-hidden rounded-full bg-blue-50 border-4 border-white shadow-xl flex items-end justify-center z-10 transition-transform hover:scale-105 duration-300 bg-gradient-to-b from-blue-50 to-blue-100">
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-sm">
        {/* Background / Body */}
        <path d="M 40 200 Q 100 140 160 200" fill="#1E3A8A" />
        
        {/* Face */}
        <circle cx="100" cy="100" r="55" fill="#FDE68A" />
        
        {/* Hair */}
        <path d="M 35 100 Q 100 -10 165 100 Q 165 60 100 35 Q 35 60 35 100" fill="#1F2937" />

        {/* Eyes & Glasses Group */}
        <g className="transition-all duration-500 ease-in-out" style={{ transform: isPasswordFocused ? 'translateY(5px)' : 'translateY(0)' }}>
          {/* Eyes */}
          {isPasswordFocused ? (
            <>
              {/* Closed Eyes */}
              <path d="M 72 95 Q 80 102 88 95" stroke="#1F2937" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M 112 95 Q 120 102 128 95" stroke="#1F2937" strokeWidth="3" fill="none" strokeLinecap="round" />
            </>
          ) : (
            <>
              {/* Open Eyes */}
              <circle cx="80" cy="95" r="5" fill="#1F2937" />
              <circle cx="120" cy="95" r="5" fill="#1F2937" />
            </>
          )}

          {/* Glasses Frame (Blue) */}
          <g>
            <circle cx="80" cy="95" r="18" fill="rgba(59, 130, 246, 0.1)" stroke="#2563EB" strokeWidth="5" />
            <circle cx="120" cy="95" r="18" fill="rgba(59, 130, 246, 0.1)" stroke="#2563EB" strokeWidth="5" />
            <path d="M 98 90 L 102 90" stroke="#2563EB" strokeWidth="5" strokeLinecap="round" />
            {/* Arms of glasses */}
            <path d="M 62 95 L 40 85" stroke="#2563EB" strokeWidth="5" strokeLinecap="round"/>
            <path d="M 138 95 L 160 85" stroke="#2563EB" strokeWidth="5" strokeLinecap="round"/>
          </g>
        </g>
        
        {/* Mouth */}
        <path 
          d={isPasswordFocused ? "M 92 125 Q 100 118 108 125" : "M 90 120 Q 100 135 110 120"} 
          stroke="#1F2937" strokeWidth="3" fill="none" strokeLinecap="round" 
          className="transition-all duration-300"
        />

        {/* Hands */}
        {/* Left hand moves from bottom up, Right hand moves from bottom up */}
        <g className="transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1)" style={{ transform: isPasswordFocused ? 'translateY(-30px)' : 'translateY(40px)' }}>
          <circle cx="78" cy="140" r="16" fill="#FCD34D" />
          <path d="M 72 135 L 75 145 M 78 132 L 80 145 M 84 135 L 83 145" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
        </g>
        <g className="transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) delay-75" style={{ transform: isPasswordFocused ? 'translateY(-30px)' : 'translateY(40px)' }}>
          <circle cx="122" cy="140" r="16" fill="#FCD34D" />
          <path d="M 116 135 L 117 145 M 122 132 L 120 145 M 128 135 L 125 145" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isLicenseExpired, setIsLicenseExpired] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5069/api';
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        const data = await res.json();
        const userPayload = {
          id: data.userId,
          fullName: data.fullName,
          email: email,
          role: data.role,
          organizationId: data.organizationId,
          branchId: data.branchId,
          jobTitle: data.jobTitle,
          permissions: data.permissions ?? [],
        };
        login(data.token, userPayload);
        navigate('/dashboard');
      } else {
        const errorData = await res.json().catch(() => ({} as Record<string, unknown>));
        const code = errorData.code as string | undefined;
        const message = typeof errorData.message === 'string' ? errorData.message : '';
        if (
          res.status === 402 ||
          code === 'LICENSE_EXPIRED' ||
          (res.status === 403 && (/lisans/i.test(message) || /license/i.test(message)))
        ) {
          setIsLicenseExpired(true);
          return;
        }
        alert('Giriş başarısız: ' + (message || 'Geçersiz bilgiler'));
      }
    } catch (err) {
      alert('Sunucuya bağlanırken hata oluştu. Lütfen bağlantınızı kontrol edin.');
    }
  };

  if (isLicenseExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        <motion.div
          className="absolute inset-0 opacity-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 1 }}
        >
          <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-fuchsia-500/30 blur-[120px]" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-cyan-500/25 blur-[120px]" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
          className="relative z-10 max-w-lg w-full bg-white/10 backdrop-blur-2xl border border-white/20 p-10 md:p-12 rounded-[2rem] text-center shadow-2xl"
        >
          <motion.div
            className="w-28 h-28 mx-auto rounded-full flex items-center justify-center mb-8 bg-gradient-to-br from-amber-500/30 to-red-600/40 border border-white/30 shadow-[0_0_48px_rgba(251,191,36,0.35)]"
            animate={{ scale: [1, 1.06, 1], rotate: [0, -2, 2, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Lock className="w-14 h-14 text-amber-300 drop-shadow-lg" strokeWidth={2.25} />
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">Lisansınız Süresini Tamamladı</h2>
          <p className="text-slate-300 text-base md:text-lg mb-10 leading-relaxed font-medium px-2">
            Bu hesap şu anda devre dışı. Sisteme yeniden giriş yapmak için lütfen <span className="text-white font-bold">Vision X Pro sistem yöneticinize</span> başvurun; lisansınız yenilendikten sonra erişiminiz otomatik olarak açılır.
          </p>
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsLicenseExpired(false)}
            className="px-10 py-3.5 bg-white text-slate-900 font-black rounded-xl hover:bg-slate-100 transition-colors shadow-[0_8px_30px_rgba(0,0,0,0.25)] text-sm uppercase tracking-wide"
          >
            Giriş sayfasına dön
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      
      {/* Abstract Background Design */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full blur-[100px] opacity-70"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-gradient-to-tl from-cyan-100 to-blue-50 rounded-full blur-[100px] opacity-70"></div>
        {/* Subtle dot pattern mimicking optics measurement grid */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMTU2LCAxNjMsIDE3NSLCAwLjIpIi8+PC9zdmc+')] opacity-50"></div>
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        
        {/* Animated Avatar */}
        <OpticianAvatar isPasswordFocused={isPasswordFocused} />
        
        <div className="mt-6 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center justify-center gap-2">
            <Glasses className="w-8 h-8 text-blue-600 drop-shadow-sm" />
            Vision X Pro
          </h2>
          <p className="mt-2 text-sm text-gray-600 font-medium">Optik Yönetim Sistemine Giriş</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/80 backdrop-blur-xl py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-white/50 ring-1 ring-gray-900/5">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">E-posta Adresi</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setIsPasswordFocused(false)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all shadow-sm hover:border-gray-300"
                  placeholder="ornek@visionxpro.com" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Şifre</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input 
                  type="password" 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all shadow-sm hover:border-gray-300"
                  placeholder="••••••••" 
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center">
                <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer" />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                  Beni Hatırla
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors">
                  Şifremi unuttum
                </a>
              </div>
            </div>

            <div className="pt-2">
              <button 
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-500/30 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform hover:-translate-y-0.5"
              >
                Sisteme Giriş Yap
              </button>
            </div>
          </form>
        </div>
        
        {/* Footer text */}
        <p className="mt-8 text-center text-xs text-gray-500">
          &copy; {new Date().getFullYear()} Vision X Pro. Tüm hakları saklıdır.
        </p>
      </div>
    </div>
  );
}
