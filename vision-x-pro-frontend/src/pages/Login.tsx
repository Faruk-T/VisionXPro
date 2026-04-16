import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Glasses } from 'lucide-react';

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
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5069/api/auth/login', {
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
          branchId: data.branchId
        };
        login(data.token, userPayload);
        navigate('/dashboard');
      } else {
        const errorData = await res.json();
        alert('Giriş başarısız: ' + (errorData.message || 'Geçersiz bilgiler'));
      }
    } catch (err) {
      alert('Sunucuya bağlanırken hata oluştu. Lütfen bağlantınızı kontrol edin.');
    }
  };

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
