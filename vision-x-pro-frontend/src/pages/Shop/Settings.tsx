import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Globe, HeartPulse, Receipt, Save, 
  ShieldCheck, Smartphone, Settings as SettingsIcon, Link2,
  MessageSquare, Users, BellRing, Gift, UserPlus, Key
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('genel');
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 800)),
      {
        loading: 'Sistemle senkronize ediliyor...',
        success: 'Ayarlar başarıyla kaydedildi!',
        error: 'Kaydedilirken hata oluştu.',
      }
    );
  };

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
             <TabButton id="staff" icon={<Users />} title="Personel & Yetki" desc="Kadronuz ve primler" active={activeTab} setActive={setActiveTab} />
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
                        <InputGroup label="Şube Resmi Adı" defaultValue="Merkez Optik Tic. Ltd. Şti." />
                        <InputGroup label="Vergi Dairesi" defaultValue="Marmara V.D." />
                        <InputGroup label="Vergi/TC Kimlik Numarası" defaultValue="1234567890" />
                        <InputGroup label="İletişim Telefonu" defaultValue="0212 555 44 33" icon={<Smartphone/>} />
                        <div className="col-span-1 md:col-span-2">
                          <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2 block">Tam Adres</label>
                          <textarea className="w-full text-sm font-bold py-3 px-4 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/20 border border-white/60 bg-white/60 shadow-sm" rows={3}>Atatürk Mah. İstiklal Cad. No: 123 Kadıköy/İstanbul</textarea>
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
                        <div className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-black rounded-lg border border-emerald-200">
                          Medula Servisi Aktif
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                        <InputGroup label="Medula Tesis Kodu" defaultValue="11340001" />
                        <InputGroup label="Sistem Şifresi" type="password" defaultValue="*********" />
                        <InputGroup label="E-Devlet Sicil No" defaultValue="412356" />
                      </div>
                      <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 flex gap-3 text-sm font-bold mt-4">
                        <ShieldCheck className="w-5 h-5 shrink-0" />
                        <p>Şifreleriniz 256-bit AES ile şifrelenerek saklanmaktadır. SGK şifreni değiştiğinde lütfen burayı da güncelleyin.</p>
                      </div>
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
                        <InputGroup label="ÜTS Sistem Jetonu (Token)" type="password" defaultValue="uts_liv_19284758a9dk" />
                        <InputGroup label="Kurum Gln Numarası" defaultValue="8681234567890" />
                        <div className="col-span-1 md:col-span-2 pt-2">
                           <button type="button" onClick={() => toast.success('ÜTS sunucularıyla bağlantı başarılı! (0.42ms)')} className="px-5 py-2.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors rounded-xl text-sm font-black shadow-sm flex items-center gap-2">
                             <Link2 className="w-4 h-4" /> Bağlantıyı Sına
                           </button>
                        </div>
                      </div>
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
                          <textarea className="w-full text-sm font-bold py-3 px-4 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/20 border border-white/60 bg-white/60 shadow-sm" rows={2} defaultValue="Bizi tercih ettiğiniz için teşekkür ederiz. Değişim işlemi 15 gün içinde fiş ile yapılmaktadır."></textarea>
                        </div>
                        <div className="col-span-1 md:col-span-2">
                           <label className="flex items-center gap-3 p-4 bg-white/80 rounded-xl border border-white shadow-sm cursor-pointer hover:bg-white transition-colors">
                             <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 border-gray-300" />
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
                            <InputGroup label="Sağlayıcı (Provider)" defaultValue="NetGsm T.A.Ş." />
                            <InputGroup label="API Token / Anahtar" type="password" defaultValue="netgsm_live_token_77a9dk" />
                            <InputGroup label="Gönderici Başlığı (Header)" defaultValue="VISIONXPRO" />
                         </div>
                         <div className="mt-4 pt-4 border-t border-slate-200 relative z-10 flex gap-3 items-center">
                            <button type="button" onClick={() => toast.success('Test mesajı 0555***4433 numarasına iletildi!', { icon: '📲' })} className="px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-700 transition-colors rounded-xl text-sm font-black shadow-md flex items-center gap-2">Test SMS'i Gönder</button>
                            <span className="text-xs font-bold text-slate-500">Mevcut Bakiye: 4,850 SMS</span>
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <label className="flex items-start gap-4 p-5 bg-white/80 rounded-2xl border border-white shadow-sm cursor-pointer hover:bg-white transition-colors relative group">
                           <input type="checkbox" defaultChecked className="mt-1 w-5 h-5 rounded text-blue-600 focus:ring-blue-500 focus:ring-offset-0 border-gray-300" />
                           <div>
                             <div className="p-2 bg-blue-100 text-blue-600 rounded-xl w-10 h-10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><BellRing className="w-5 h-5"/></div>
                             <p className="text-sm font-black text-slate-800">Gözlüğünüz Hazır Bildirimi</p>
                             <p className="text-xs font-semibold text-slate-500 mt-1 leading-relaxed">Siparişi 'Teslimata Hazır' konumuna aldığınızda ilgili hastaya direkt bilgi mesajı gider.</p>
                           </div>
                         </label>
                         
                         <label className="flex items-start gap-4 p-5 bg-white/80 rounded-2xl border border-white shadow-sm cursor-pointer hover:bg-white transition-colors relative group">
                           <input type="checkbox" defaultChecked className="mt-1 w-5 h-5 rounded text-rose-600 focus:ring-rose-500 focus:ring-offset-0 border-gray-300" />
                           <div>
                             <div className="p-2 bg-rose-100 text-rose-600 rounded-xl w-10 h-10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Gift className="w-5 h-5"/></div>
                             <p className="text-sm font-black text-slate-800">Doğum Günü & Kampanya Taraması</p>
                             <p className="text-xs font-semibold text-slate-500 mt-1 leading-relaxed">Günde bir kez veritabanı taranır ve doğum günü olan müşterilere ön tanımlı mesaj atılır.</p>
                           </div>
                         </label>
                      </div>
                   </motion.div>
                 )}

                 {activeTab === 'staff' && (
                   <motion.div key="staff" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} className="space-y-8">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                             <Users className="w-6 h-6 text-purple-500"/>
                             Personel İzleme ve Prim Sistemi
                          </h3>
                          <p className="text-slate-500 text-sm font-bold mt-1">Optisyen ve satış personeli listesi ile komisyon oranları.</p>
                        </div>
                        <button type="button" onClick={() => setIsStaffModalOpen(true)} className="px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors rounded-xl text-sm font-black flex items-center gap-2 shadow-sm">
                          <UserPlus className="w-4 h-4"/> Personel Ekle
                        </button>
                      </div>

                      <div className="space-y-4">
                         
                         <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-purple-300 transition-all group">
                           <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-500 text-lg border border-slate-200 group-hover:bg-purple-500 group-hover:text-white transition-colors">FY</div>
                             <div>
                               <p className="font-black text-slate-800">Faruk Yıldız</p>
                               <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">Mağaza Müdürü / Optisyen</span>
                             </div>
                           </div>
                           <div className="flex items-center gap-6">
                              <div className="text-right">
                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Aylık Sistem Primi</p>
                                <p className="font-extrabold text-slate-700">%5 (Sadece Özel Camlar)</p>
                              </div>
                              <button type="button" onClick={() => setIsStaffModalOpen(true)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:text-purple-600 hover:bg-purple-50 border border-slate-200 flex items-center justify-center transition-colors"><SettingsIcon className="w-5 h-5"/></button>
                           </div>
                         </div>

                         <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-purple-300 transition-all group">
                           <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-500 text-lg border border-slate-200 group-hover:bg-purple-500 group-hover:text-white transition-colors">CA</div>
                             <div>
                               <p className="font-black text-slate-800">Cem Algın</p>
                               <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">Satış Elemanı</span>
                             </div>
                           </div>
                           <div className="flex items-center gap-6">
                              <div className="text-right">
                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Aylık Sistem Primi</p>
                                <p className="font-extrabold text-slate-700">Gelişim Primi Yok</p>
                              </div>
                              <button type="button" onClick={() => setIsStaffModalOpen(true)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:text-purple-600 hover:bg-purple-50 border border-slate-200 flex items-center justify-center transition-colors"><SettingsIcon className="w-5 h-5"/></button>
                           </div>
                         </div>

                      </div>

                      <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-100 flex gap-4 mt-6">
                         <div className="w-10 h-10 rounded-xl bg-indigo-200/50 text-indigo-600 flex items-center justify-center shrink-0"><Key className="w-5 h-5"/></div>
                         <div>
                           <h5 className="font-black text-indigo-900 text-sm">Gelişmiş Kasa İzni Güvenliği</h5>
                           <p className="text-xs font-semibold text-indigo-700/80 mt-1 leading-relaxed">Satış elemanları rolündeki çalışanlar 'Dashboard' gibi ciro odaklı sayfaları göremezler. POS ekranına girişlerinde Z-Raporu alma tuşları sadece Mağaza Müdürü şifresi ile aktif olur.</p>
                         </div>
                      </div>

                   </motion.div>
                 )}

               </AnimatePresence>
             </div>

              {/* FIXED BOTTOM BAR */}
             <div className="pt-6 mt-6 border-t border-white/80 flex justify-end">
                <button type="submit" className="px-8 py-3.5 bg-indigo-600/90 backdrop-blur-md shadow-[0_8px_20px_rgba(79,70,229,0.3)] rounded-2xl text-sm font-black text-white border border-indigo-400/30 hover:bg-indigo-700 hover:shadow-[0_12px_25px_rgba(79,70,229,0.4)] transition-all flex items-center gap-2">
                  <Save className="w-4 h-4" /> Değişiklikleri Güvenle Kaydet
                </button>
             </div>
           </form>
        </div>

      </div>

      {/* STAFF MODAL */}
      <AnimatePresence>
        {isStaffModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }} 
               animate={{ opacity: 1, scale: 1, y: 0 }} 
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="bg-white border border-slate-200 shadow-2xl rounded-[2.5rem] p-8 w-full max-w-md relative flex flex-col overflow-hidden"
            >
               <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[40px] pointer-events-none"></div>
               
               <button onClick={() => setIsStaffModalOpen(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
               </button>

               <div className="flex items-center gap-3 mb-8 w-full relative z-10">
                  <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center shadow-inner"><UserPlus className="w-6 h-6"/></div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800">Personel Düzenle</h3>
                    <p className="text-xs font-bold text-slate-500 mt-0.5">Yetki ve sistem prim oranını yönetin.</p>
                  </div>
               </div>
               
               <div className="space-y-5 relative z-10">
                  <InputGroup label="Ad Soyad" defaultValue="Yeni Personel" />
                  
                  <div>
                    <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2 block">Rol / Ünvan</label>
                    <select className="w-full text-sm font-bold py-3.5 px-4 rounded-xl outline-none focus:ring-4 focus:ring-purple-500/20 border border-slate-200 bg-slate-50 text-slate-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all">
                       <option>Satış Elemanı</option>
                       <option>Kalfa</option>
                       <option>Mesul Müdür (Optisyen)</option>
                    </select>
                  </div>

                  <InputGroup label="Özel Cam Satış Primi (%)" type="number" defaultValue="2" />

                  <label className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl border border-purple-100 cursor-pointer hover:bg-purple-100/50 transition-colors mt-2">
                     <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500 focus:ring-offset-0 border-purple-300" />
                     <div>
                       <p className="text-sm font-black text-purple-900">Sadece POS ve Satışa Erişsin</p>
                       <p className="text-[10px] font-bold text-purple-700/80 mt-1">Dashboard ve ciro ekranı gizlenir.</p>
                     </div>
                  </label>
               </div>
               
               <div className="mt-8 pt-6 border-t border-slate-100 flex gap-3 relative z-10">
                 <button onClick={() => setIsStaffModalOpen(false)} type="button" className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">İptal</button>
                 <button onClick={() => {
                     toast.success('Personel başarıyla kaydedildi!');
                     setIsStaffModalOpen(false);
                 }} type="button" className="flex-1 py-3.5 bg-purple-600 text-white font-black rounded-xl hover:bg-purple-700 shadow-[0_4px_15px_rgba(147,51,234,0.3)] transition-all">Kaydet</button>
               </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

function InputGroup({ label, type = "text", defaultValue, icon }: any) {
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
          defaultValue={defaultValue} 
          className={`w-full text-sm font-bold py-3.5 ${icon ? 'pl-11 pr-4' : 'px-4'} rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/20 border border-white/60 bg-white/60 text-slate-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all focus:bg-white`} 
        />
      </div>
    </div>
  );
}
