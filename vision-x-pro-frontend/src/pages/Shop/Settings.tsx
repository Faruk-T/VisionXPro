import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Globe, HeartPulse, Receipt, Save, 
  ShieldCheck, Smartphone, Settings as SettingsIcon, Link2,
  MessageSquare, BellRing, Gift, Loader2, AlertTriangle,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import api from '../../lib/api';
import CompliancePendingQueue from '../../components/CompliancePendingQueue';

interface SettingsData {
  storeName: string;
  taxOffice: string;
  taxNumber: string;
  phone: string;
  address: string;
  medulaFacilityCode: string;
  medulaPassword: string;
  medulaRegistryNo: string;
  utsToken: string;
  utsGlnCode: string;
  smsProvider: string;
  smsApiToken: string;
  smsSenderHeader: string;
  smsReadyNotification: boolean;
  smsBirthdayCampaign: boolean;
  receiptFooter: string;
  showPriceOnLabel: boolean;
}

const defaultSettings: SettingsData = {
  storeName: '',
  taxOffice: '',
  taxNumber: '',
  phone: '',
  address: '',
  medulaFacilityCode: '',
  medulaPassword: '',
  medulaRegistryNo: '',
  utsToken: '',
  utsGlnCode: '',
  smsProvider: 'NetGsm T.A.Ş.',
  smsApiToken: '',
  smsSenderHeader: 'VISIONXPRO',
  smsReadyNotification: true,
  smsBirthdayCampaign: true,
  receiptFooter: 'Bizi tercih ettiğiniz için teşekkür ederiz. Değişim işlemi 15 gün içinde fiş ile yapılmaktadır.',
  showPriceOnLabel: true,
};

export default function Settings() {
  const [activeTab, setActiveTab] = useState('genel');
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [complianceStatus, setComplianceStatus] = useState<any>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.get<SettingsData>('/shop-settings');
        setSettings({ ...defaultSettings, ...data });
      } catch (err) {
        console.error('Ayarlar yüklenemedi:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
    api.get('/compliance/status').then(setComplianceStatus).catch(() => {});
  }, []);

  const updateField = (field: keyof SettingsData, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.put('/shop-settings', settings);
      toast.success('Ayarlar başarıyla kaydedildi!');
    } catch (err: any) {
      toast.error(err.message || 'Kaydedilirken hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] p-6 lg:p-8 relative overflow-hidden bg-gradient-to-br from-[#F8FAFC] via-[#E2E8F0] to-[#CBD5E1] flex flex-col font-sans">
      <Toaster position="top-right" />
      
      {/* VIBRANT AMBIENT GLOWS */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[60%] bg-gradient-to-bl from-indigo-300/40 via-purple-300/30 to-pink-300/40 rounded-full blur-[120px] mix-blend-multiply opacity-80"></div>
        <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[50%] bg-gradient-to-tr from-cyan-300/30 to-blue-200/30 rounded-full blur-[140px] mix-blend-multiply opacity-80"></div>
      </div>

      <div className="relative z-10 w-full max-w-[1600px] mx-auto flex flex-col md:flex-row gap-8 h-full">
        
        {/* SETTINGS SIDEBAR */}
        <div className="w-full md:w-80 bg-white/60 backdrop-blur-3xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] p-6 flex flex-col h-fit">
           <div className="mb-6 pb-6 border-b border-white/80">
              <div className="inline-flex items-center justify-center px-4 py-1.5 mb-4 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black tracking-widest uppercase border border-indigo-100 shadow-sm">
                 <SettingsIcon className="w-3.5 h-3.5 mr-1.5 text-indigo-500 animate-spin-slow" /> Yönetim
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Sistem Ayarları</h2>
              <p className="text-slate-500 text-sm font-bold mt-1">Optik mağaza entegrasyonu</p>
           </div>
           
           <nav className="flex flex-col gap-2">
             <TabButton id="genel" icon={<Building2 />} title="Genel Şube" desc="Mağaza profiliniz" active={activeTab} setActive={setActiveTab} />
             <TabButton id="medula" icon={<HeartPulse />} title="Medula (SGK)" desc="Hastane ve Sağlık" active={activeTab} setActive={setActiveTab} />
             <TabButton id="uts" icon={<Globe />} title="Ürün Takip (ÜTS)" desc="Bakanlık Bildirimleri" active={activeTab} setActive={setActiveTab} />
             <TabButton id="fatura" icon={<Receipt />} title="Satış ve Fiş" desc="Matbu evrak dizaynı" active={activeTab} setActive={setActiveTab} />
             <TabButton id="sms" icon={<MessageSquare />} title="SMS & İletişim" desc="Otomatik mesajlar" active={activeTab} setActive={setActiveTab} />
           </nav>
        </div>

        {/* SETTINGS CONTENT */}
        <div className="flex-1 bg-white/60 backdrop-blur-3xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] p-8 flex flex-col overflow-hidden relative">
           <form onSubmit={handleSave} className="flex flex-col h-full">
             
             <div className="flex-1">
               <AnimatePresence mode="wait">
                 {activeTab === 'genel' && (
                   <motion.div key="genel" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} className="space-y-8">
                      <div>
                        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                           <Building2 className="w-6 h-6 text-indigo-500"/>
                           Mağaza Kurumsal Kimliği
                        </h3>
                        <p className="text-slate-500 text-sm font-bold mt-1">Fatura, fiş ve raporlarda basılacak resmi isminizi belirleyin.</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputGroup label="Şube Resmi Adı" value={settings.storeName} onChange={v => updateField('storeName', v)} />
                        <InputGroup label="Vergi Dairesi" value={settings.taxOffice} onChange={v => updateField('taxOffice', v)} />
                        <InputGroup label="Vergi/TC Kimlik Numarası" value={settings.taxNumber} onChange={v => updateField('taxNumber', v)} />
                        <InputGroup label="İletişim Telefonu" value={settings.phone} onChange={v => updateField('phone', v)} icon={<Smartphone/>} />
                        <div className="col-span-1 md:col-span-2">
                          <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2 block">Tam Adres</label>
                          <textarea 
                            value={settings.address} 
                            onChange={e => updateField('address', e.target.value)}
                            className="w-full text-sm font-bold py-3 px-4 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/20 border border-white/60 bg-white/60 shadow-sm" 
                            rows={3}
                          />
                        </div>
                      </div>
                   </motion.div>
                 )}

                 {activeTab === 'medula' && (
                   <motion.div key="medula" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} className="space-y-8">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                             <HeartPulse className="w-6 h-6 text-rose-500"/>
                             SGK Optik Medula Entegrasyonu
                          </h3>
                          <p className="text-slate-500 text-sm font-bold mt-1">Cam ve Çerçeve haklarını anlık sorgulamak için.</p>
                        </div>
                        <div className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-black rounded-lg border border-amber-200">
                          Kimlik bilgisi kayıt (API yok)
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                        <InputGroup label="Medula Tesis Kodu" value={settings.medulaFacilityCode} onChange={v => updateField('medulaFacilityCode', v)} />
                        <InputGroup label="Sistem Şifresi" type="password" value={settings.medulaPassword} onChange={v => updateField('medulaPassword', v)} />
                        <InputGroup label="E-Devlet Sicil No" value={settings.medulaRegistryNo} onChange={v => updateField('medulaRegistryNo', v)} />
                      </div>
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3 text-amber-900 text-sm font-medium mt-4">
                        <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
                        <div>
                          <p className="font-black">Hazırlık modu aktif</p>
                          <p className="mt-1 text-amber-800/90">Canlı Medula sorgusu yok. SGK tutarı POS’ta girilir; satış sonrası bildirim kuyruğuna düşer.</p>
                          {complianceStatus && (
                            <p className="mt-2 text-xs font-bold">
                              Bekleyen Medula: {complianceStatus.pendingMedula ?? 0} •
                              Kimlik: {complianceStatus.medulaConfigured ? 'Kayıtlı' : 'Eksik'}
                            </p>
                          )}
                        </div>
                      </div>
                      <CompliancePendingQueue type="Medula" />
                   </motion.div>
                 )}

                 {activeTab === 'uts' && (
                   <motion.div key="uts" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} className="space-y-8">
                      <div>
                        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                           <Globe className="w-6 h-6 text-blue-500"/>
                           Ürün Takip Sistemi (ÜTS)
                        </h3>
                        <p className="text-slate-500 text-sm font-bold mt-1">Stok bildirimleri ve satışı yapılan barkodların düşülme ayarları.</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                        <InputGroup label="ÜTS Sistem Jetonu (Token)" type="password" value={settings.utsToken} onChange={v => updateField('utsToken', v)} />
                        <InputGroup label="Kurum Gln Numarası" value={settings.utsGlnCode} onChange={v => updateField('utsGlnCode', v)} />
                        <div className="col-span-1 md:col-span-2 pt-2 space-y-3">
                           <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex gap-3 text-blue-900 text-sm font-medium">
                             <AlertTriangle className="w-5 h-5 shrink-0" />
                             <div>
                               <p className="font-black">ÜTS hazırlık modu</p>
                               <p className="mt-1">ÜTS’li ürün satışında kare kodlar otomatik kuyruğa eklenir. Stokta ÜTS kodu olan ürünler envanterde mavi rozetle işaretlenir.</p>
                               {complianceStatus && (
                                 <p className="mt-2 text-xs font-bold">
                                   Bekleyen ÜTS: {complianceStatus.pendingUts ?? 0} •
                                   Token/GLN: {complianceStatus.utsConfigured ? 'Kayıtlı' : 'Eksik'}
                                 </p>
                               )}
                             </div>
                           </div>
                           <button type="button" onClick={() => toast('Canlı ÜTS API bağlantısı bir sonraki sürümde. Token/GLN kayıt altına alınır.', { className: 'bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-semibold text-sm' })} className="px-5 py-2.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors rounded-xl text-sm font-black shadow-sm flex items-center gap-2">
                             <Link2 className="w-4 h-4" /> Bağlantıyı Sına (Simülasyon)
                           </button>
                        </div>
                      </div>
                      <CompliancePendingQueue type="UTS" />
                   </motion.div>
                 )}

                 {activeTab === 'fatura' && (
                   <motion.div key="fatura" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} className="space-y-8">
                      <div>
                        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                           <Receipt className="w-6 h-6 text-emerald-500"/>
                           Fiş & Termal Çıktı Tasarımı
                        </h3>
                        <p className="text-slate-500 text-sm font-bold mt-1">Müşteriye verilen bilgi fişi taslağı.</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-1 md:col-span-2">
                          <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2 block">Fiş Alt Bilgi Notu (Footer)</label>
                          <textarea 
                            value={settings.receiptFooter}
                            onChange={e => updateField('receiptFooter', e.target.value)}
                            className="w-full text-sm font-bold py-3 px-4 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/20 border border-white/60 bg-white/60 shadow-sm" 
                            rows={2}
                          />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                           <label className="flex items-center gap-3 p-4 bg-white/80 rounded-xl border border-white shadow-sm cursor-pointer hover:bg-white transition-colors">
                             <input 
                               type="checkbox" 
                               checked={settings.showPriceOnLabel}
                               onChange={e => updateField('showPriceOnLabel', e.target.checked)}
                               className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 border-gray-300" 
                             />
                             <div>
                               <p className="text-sm font-black text-slate-800">Termal etikette (barkod) raf fiyatı gösterilsin</p>
                               <p className="text-xs font-semibold text-slate-500 mt-1">Ürün barkodlarını rafta sergilerken fiyat açık yazılsın.</p>
                             </div>
                           </label>
                        </div>
                      </div>
                   </motion.div>
                 )}

                 {activeTab === 'sms' && (
                   <motion.div key="sms" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} className="space-y-8">
                      <div>
                        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                           <MessageSquare className="w-6 h-6 text-blue-500"/>
                           SMS Bildirim ve Pazarlama (CRM)
                        </h3>
                        <p className="text-slate-500 text-sm font-bold mt-1">NetGsm üzerinden müşterilere anlık hazırlık ve doğum günü mesajı.</p>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-4 opacity-10"><MessageSquare className="w-32 h-32"/></div>
                         <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10"><Link2 className="w-4 h-4"/> Servis Ayarları</h4>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                            <InputGroup label="Sağlayıcı (Provider)" value={settings.smsProvider} onChange={v => updateField('smsProvider', v)} />
                            <InputGroup label="API Token / Anahtar" type="password" value={settings.smsApiToken} onChange={v => updateField('smsApiToken', v)} />
                            <InputGroup label="Gönderici Başlığı (Header)" value={settings.smsSenderHeader} onChange={v => updateField('smsSenderHeader', v)} />
                         </div>
                         <div className="mt-4 pt-4 border-t border-slate-200 relative z-10 flex gap-3 items-center">
                            <button type="button" onClick={() => toast('SMS gönderimi bu sürümde bağlı değil; sağlayıcı bilgileri kayıt için tutulur.', { className: 'bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-semibold text-sm' })} className="px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-700 transition-colors rounded-xl text-sm font-black shadow-md flex items-center gap-2">Test SMS'i Gönder</button>
                            <span className="text-xs font-bold text-slate-500">Mevcut Bakiye: 4,850 SMS</span>
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <label className="flex items-start gap-4 p-5 bg-white/80 rounded-2xl border border-white shadow-sm cursor-pointer hover:bg-white transition-colors relative group">
                           <input 
                             type="checkbox" 
                             checked={settings.smsReadyNotification}
                             onChange={e => updateField('smsReadyNotification', e.target.checked)}
                             className="mt-1 w-5 h-5 rounded text-blue-600 focus:ring-blue-500 focus:ring-offset-0 border-gray-300" 
                           />
                           <div>
                             <div className="p-2 bg-blue-100 text-blue-600 rounded-xl w-10 h-10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><BellRing className="w-5 h-5"/></div>
                             <p className="text-sm font-black text-slate-800">Gözlüğünüz Hazır Bildirimi</p>
                             <p className="text-xs font-semibold text-slate-500 mt-1 leading-relaxed">Siparişi 'Teslimata Hazır' konumuna aldığınızda ilgili hastaya direkt bilgi mesajı gider.</p>
                           </div>
                         </label>
                         
                         <label className="flex items-start gap-4 p-5 bg-white/80 rounded-2xl border border-white shadow-sm cursor-pointer hover:bg-white transition-colors relative group">
                           <input 
                             type="checkbox" 
                             checked={settings.smsBirthdayCampaign}
                             onChange={e => updateField('smsBirthdayCampaign', e.target.checked)}
                             className="mt-1 w-5 h-5 rounded text-rose-600 focus:ring-rose-500 focus:ring-offset-0 border-gray-300" 
                           />
                           <div>
                             <div className="p-2 bg-rose-100 text-rose-600 rounded-xl w-10 h-10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Gift className="w-5 h-5"/></div>
                             <p className="text-sm font-black text-slate-800">Doğum Günü & Kampanya Taraması</p>
                             <p className="text-xs font-semibold text-slate-500 mt-1 leading-relaxed">Günde bir kez veritabanı taranır ve doğum günü olan müşterilere ön tanımlı mesaj atılır.</p>
                           </div>
                         </label>
                      </div>
                   </motion.div>
                 )}

               </AnimatePresence>
             </div>

              {/* FIXED BOTTOM BAR */}
             <div className="pt-6 mt-6 border-t border-white/80 flex justify-end">
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="px-8 py-3.5 bg-indigo-600/90 backdrop-blur-md shadow-[0_8px_20px_rgba(79,70,229,0.3)] rounded-2xl text-sm font-black text-white border border-indigo-400/30 hover:bg-indigo-700 hover:shadow-[0_12px_25px_rgba(79,70,229,0.4)] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Güvenle Kaydet'}
                </button>
             </div>
           </form>
        </div>

      </div>

    </div>
  );
}

function TabButton({ id, icon, title, desc, active, setActive }: any) {
  const isActive = active === id;
  return (
    <button 
      onClick={() => setActive(id)}
      className={`w-full text-left p-4 rounded-2xl flex items-center gap-4 transition-all duration-300 border ${isActive ? 'bg-indigo-600 border-indigo-500 shadow-[0_8px_15px_rgba(79,70,229,0.3)] hover:-translate-y-0.5' : 'bg-transparent border-transparent hover:bg-white/50 hover:shadow-sm'}`}
    >
       <div className={`p-2.5 rounded-xl border shadow-sm ${isActive ? 'bg-white/20 border-white/20 text-white' : 'bg-white border-white text-slate-400'}`}>
         <div className="[&>svg]:w-5 [&>svg]:h-5">{icon}</div>
       </div>
       <div>
         <p className={`text-sm font-black ${isActive ? 'text-white' : 'text-slate-700'}`}>{title}</p>
         <p className={`text-[11px] font-bold mt-0.5 ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}>{desc}</p>
       </div>
    </button>
  );
}

function InputGroup({ label, type = "text", value, onChange, icon }: { label: string; type?: string; value: string; onChange: (v: string) => void; icon?: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2 block">{label}</label>
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors [&>svg]:w-5 [&>svg]:h-5">
            {icon}
          </div>
        )}
        <input 
          type={type} 
          value={value ?? ''} 
          onChange={e => onChange(e.target.value)}
          className={`w-full text-sm font-bold py-3.5 ${icon ? 'pl-11 pr-4' : 'px-4'} rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/20 border border-white/60 bg-white/60 text-slate-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all focus:bg-white`} 
        />
      </div>
    </div>
  );
}
