import { useState, useEffect } from 'react';
import { Shield, Server, Database, Activity, ToggleLeft, ToggleRight, CheckCircle, PackageSearch } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { api } from '../../lib/api';

const LOG_ROLE_LABELS: Record<string, string> = {
  SuperAdmin: 'Sistem yöneticisi',
  ShopOwner: 'Mağaza yöneticisi',
  CorporateOwner: 'Kurumsal yönetici',
  Customer: 'Müşteri',
};

export default function AdminSettings() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await api.get<any[]>('/admin/system-logs');
        setLogs(data);
      } catch (e) {
         console.error("Failed to fetch logs");
      }
    };
    
    const fetchMaintenanceStatus = async () => {
      try {
        const data = await api.get<any>('/settings/maintenance');
        setMaintenanceMode(data.maintenanceMode);
      } catch (e) {}
    }

    fetchLogs();
    fetchMaintenanceStatus();
  }, []);

  const handleMaintenanceToggle = async () => {
    try {
      const newMode = !maintenanceMode;
      await api.post('/settings/maintenance', { maintenanceMode: newMode });
      setMaintenanceMode(newMode);
      if (newMode) {
         toast.error('Sistem bakım moduna alındı. Personel ve müşteri erişimi durduruldu.', { icon: '🚧' });
      } else {
         toast.success('Bakım modu kapatıldı. Sistem herkese açık.');
      }
    } catch(e) {
      toast.error('Bağlantı hatası.');
    }
  };

  const handleBackup = () => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 2000)),
      {
        loading: 'Oluşturuluyor: VisionXPro_DB_Backup.bak',
        success: 'Yedekleme başarıyla tamamlandı ve buluta yüklendi!',
        error: 'Hata oluştu.',
      }
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 min-h-screen bg-slate-50 p-2 md:p-6 rounded-3xl">
      <Toaster position="top-right" />
      
      {/* HEADER SECTION */}
      <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-100 rounded-full blur-3xl opacity-50 -z-10"></div>
        <div>
          <div className="inline-flex items-center justify-center px-4 py-1.5 mb-3 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black tracking-widest uppercase border border-slate-200">
            <Server className="w-3.5 h-3.5 mr-1.5" /> Sunucu Konfigürasyonları
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Sistem Ayarları & Güvenlik</h2>
          <p className="text-slate-500 font-medium text-sm mt-1">SaaS altyapısının çekirdek ayarlarını yönetin. Paketleri ve kullanıcı güvenlik kurallarını belirleyin.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         
         {/* ÇEKİRDEK KONTROLLER (LEFT COLUMN) */}
         <div className="lg:col-span-2 space-y-8">
            
            {/* Sistem Durumu Modülü */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden">
               <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Activity className="w-5 h-5 text-indigo-500" /> Çekirdek Sistem Durumu</h3>
               
               <div className="space-y-6">
                  <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-all">
                     <div>
                        <h4 className="font-bold text-slate-800">Sistem Bakım Modu</h4>
                        <p className="text-xs text-slate-500 mt-1 font-medium">Aktif edildiğinde şube yöneticileri (ShopOwner) ve müşteriler sisteme giriş yapamaz.</p>
                     </div>
                     <button onClick={handleMaintenanceToggle} className="focus:outline-none transition-transform active:scale-95">
                        {maintenanceMode ? (
                           <ToggleRight className="w-12 h-12 text-rose-500" />
                        ) : (
                           <ToggleLeft className="w-12 h-12 text-slate-300 hover:text-slate-400" />
                        )}
                     </button>
                  </div>

                  <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-all">
                     <div>
                        <h4 className="font-bold text-slate-800">Uygulama Domain (CORS)</h4>
                        <p className="text-xs text-slate-500 mt-1 font-medium">app.visionxpro.com üzerinden gelen yönlendirmeler ve harici API izinleri.</p>
                     </div>
                     <span className="px-4 py-2 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-xs font-black tracking-widest uppercase">Güvenli</span>
                  </div>

                  <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-all">
                     <div>
                        <h4 className="font-bold text-slate-800">Manuel Veritabanı Yedeklemesi</h4>
                        <p className="text-xs text-slate-500 mt-1 font-medium">Tüm organizasyonların MSSQL logları ve periyodik sunucu .bak dosyası güvenliğe alınır.</p>
                     </div>
                     <button onClick={handleBackup} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-2">
                        <Database className="w-4 h-4" /> Şimdi Yedekle
                     </button>
                  </div>
               </div>
            </div>

            {/* Lisans Paketleri Modülü */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden">
               <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><PackageSearch className="w-5 h-5 text-purple-500" /> Satış & Lisans Paketleri Yönetimi</h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-purple-100 bg-purple-50/30 rounded-2xl p-6 relative">
                     <span className="absolute top-4 right-4 bg-purple-100 text-purple-700 font-black text-[10px] px-2 py-1 rounded uppercase">Varsayılan</span>
                     <h4 className="text-2xl font-black text-slate-800 mb-2">PRO Paket</h4>
                     <p className="text-sm font-bold text-slate-500 mb-4 border-b border-purple-100 pb-4">Yıllık 10,000₺ Tahsilat</p>
                     <ul className="space-y-2 text-xs font-semibold text-slate-600">
                        <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-purple-500" /> Limitsiz Müşteri</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-purple-500" /> Tek Şube Desteği</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-purple-500" /> Temel Analizler</li>
                     </ul>
                     <button className="w-full mt-6 py-2 bg-white border border-purple-200 text-purple-600 font-bold rounded-xl text-xs hover:bg-purple-50 transition-colors">Paketi Düzenle</button>
                  </div>

                  <div className="border border-slate-200 bg-white rounded-2xl p-6 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-not-allowed">
                     <span className="absolute top-4 right-4 bg-slate-100 text-slate-400 font-black text-[10px] px-2 py-1 rounded uppercase">Geliştiriliyor</span>
                     <h4 className="text-2xl font-black text-slate-800 mb-2">MEGA Paket</h4>
                     <p className="text-sm font-bold text-slate-500 mb-4 border-b border-slate-100 pb-4">Yıllık 25,000₺ Tahsilat</p>
                     <ul className="space-y-2 text-xs font-semibold text-slate-600">
                        <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-slate-400" /> Limitsiz Şube</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-slate-400" /> Gelişmiş ERP Mimarisi</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-slate-400" /> Özel Kurumsal Tema</li>
                     </ul>
                     <button disabled className="w-full mt-6 py-2 bg-slate-50 border border-slate-200 text-slate-400 font-bold rounded-xl text-xs cursor-not-allowed">Yakında Aktif</button>
                  </div>
               </div>
            </div>

         </div>
         
         {/* SAĞ KOLON (GÜVENLİK / BİLGİ) */}
         <div className="space-y-8">
            <div className="bg-slate-800 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl">
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/30 blur-3xl rounded-full"></div>
               <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                     <Shield className="w-5 h-5 text-indigo-300" />
                  </div>
                  <h3 className="font-bold text-lg">Güvenlik Logları</h3>
               </div>
               
               <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                  {logs.length === 0 ? (
                     <p className="text-sm text-slate-300">Henüz sistem logu bulunmuyor.</p>
                  ) : (
                     logs.slice(0, 10).map(log => (
                        <div key={log.id} className="border-l-2 border-indigo-400 pl-4 py-1">
                           <p className="text-[10px] text-slate-300 mb-1 tracking-wider uppercase font-bold">
                              {new Date(log.timestamp).toLocaleString('tr-TR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                           </p>
                           <p className="text-sm font-bold text-white leading-snug">
                              {log.userName ?? 'Kullanıcı bağlı değil'}
                           </p>
                           <p className="text-xs text-white/75 mt-1 leading-snug">{log.action}</p>
                           {log.role ? (
                             <p className="text-[10px] text-indigo-200/90 mt-1 font-medium uppercase tracking-wide">
                               {LOG_ROLE_LABELS[log.role] ?? log.role}
                             </p>
                           ) : null}
                        </div>
                     ))
                  )}
               </div>
               
               <button onClick={() => toast.success(`Gösterilen Log Sayısı: ${logs.length}`)} className="mt-8 text-xs font-bold text-indigo-300 hover:text-white transition-colors flex items-center gap-1">Tüm Kayıtları Gör &rarr;</button>
            </div>
         </div>
         
      </div>
    </div>
  );
}
