import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, Clock, User, Phone, Plus, 
  Trash2, ChevronLeft, ChevronRight, X,
  Stethoscope, Check
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function Appointments() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newApt, setNewApt] = useState({ patient: '', phone: '', time: '09:00', type: 'Göz Muayenesi', doctor: 'Dr. Ahmet Bey' });

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5069/api/appointments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setAppointments(await res.json());
      }
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Get days in a month logic simplified for demo
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  const todaysAppointments = appointments.filter(a => a.date === selectedDate).sort((a,b) => a.time.localeCompare(b.time));

  return (
    <div className="min-h-full bg-slate-50/50 flex flex-col pt-4">
      <Toaster position="top-right" />
      
      {/* HEADER */}
      <div className="px-6 lg:px-10 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
         <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <CalendarIcon className="w-8 h-8 text-indigo-600" />
              Takvim & Randevular
            </h1>
            <p className="text-slate-500 font-medium mt-1">Göz muayenesi ve mağaza içi odaklama randevularınızı yönetin.</p>
         </div>
         <button onClick={() => setIsAddModalOpen(true)} className="px-5 py-3 rounded-2xl text-sm font-bold text-white bg-indigo-600 shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2">
            <Plus className="w-5 h-5"/> Yeni Randevu
         </button>
      </div>

      <div className="flex-1 px-6 lg:px-10 pb-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
         
         {/* LEFT COLUMN: CALENDAR WIDGET */}
         <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white border border-slate-200 rounded-[2rem] p-6 lg:p-8 shadow-sm">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-slate-800 text-lg">
                    {new Date(selectedDate).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                  </h3>
                  <div className="flex gap-2">
                     <button onClick={() => toast('Önceki aya geçiş (Yakında)')} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-full transition-colors"><ChevronLeft className="w-5 h-5 text-slate-400"/></button>
                     <button onClick={() => toast('Sonraki aya geçiş (Yakında)')} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-full transition-colors"><ChevronRight className="w-5 h-5 text-slate-400"/></button>
                  </div>
               </div>

               <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-black tracking-widest uppercase text-slate-400 mb-4">
                  <div>Pzt</div><div>Sal</div><div>Çar</div><div>Per</div><div>Cum</div><div>Cmt</div><div>Paz</div>
               </div>
               <div className="grid grid-cols-7 gap-y-3 gap-x-2 text-center text-sm font-bold text-slate-700">
                  {/* Empty slots for prefix days */}
                  <div></div><div></div><div></div><div></div><div></div><div></div>
                  {/* Days */}
                  {daysInMonth.map(day => {
                    const dDate = new Date(selectedDate);
                    const year = dDate.getFullYear();
                    const month = (dDate.getMonth() + 1).toString().padStart(2, '0');
                    const dateStr = `${year}-${month}-${day.toString().padStart(2, '0')}`;
                    const hasApt = appointments.some(a => a.date === dateStr);
                    const isSelected = dateStr === selectedDate;
                    
                    return (
                      <div 
                        key={day} 
                        onClick={() => setSelectedDate(dateStr)}
                        className={`aspect-square flex flex-col items-center justify-center rounded-xl cursor-pointer transition-all relative
                          ${isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:-translate-y-1' : 'hover:bg-slate-100 bg-transparent'}
                        `}
                      >
                         <span>{day}</span>
                         {hasApt && <div className={`w-1.5 h-1.5 rounded-full absolute bottom-1.5 ${isSelected ? 'bg-white' : 'bg-indigo-500'}`}></div>}
                      </div>
                    )
                  })}
               </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-[2.5rem] p-8 shadow-xl shadow-indigo-200 text-white relative overflow-hidden flex flex-col items-start">
               <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
               <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-900/30 rounded-full blur-2xl"></div>
               <h4 className="text-indigo-100 font-bold uppercase tracking-widest text-[10px] mb-3 border border-indigo-400/30 px-3 py-1 bg-white/5 rounded-lg">Aktif Gün Özeti</h4>
               <div className="text-5xl font-black mb-2 flex items-baseline gap-2">
                 {todaysAppointments.length} <span className="text-sm font-bold text-indigo-200">Kayıt</span>
               </div>
               <p className="text-sm text-indigo-100 font-medium">Seçili günde toplam randevu sayınız.</p>
            </div>
         </div>

         {/* RIGHT COLUMN: APPOINTMENT TIMELINE */}
         <div className="lg:col-span-8 bg-white border border-slate-200 rounded-[3rem] p-6 md:p-10 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
               <div>
                  <h3 className="text-2xl font-black text-slate-800">Ajanda: {selectedDate.split('-').reverse().join('.')}</h3>
                  <p className="text-sm text-slate-500 font-medium mt-1 inline-flex items-center gap-2"><Clock className="w-4 h-4"/> Randevu Saatleri & Detayları</p>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-4 scrollbar-hide space-y-6">
               <AnimatePresence>
                 {todaysAppointments.length === 0 ? (
                    <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="flex flex-col">
                       <div className="flex flex-col items-center justify-center py-12 text-slate-400 border-b border-slate-100 border-dashed mb-8">
                          <CalendarIcon className="w-16 h-16 mb-4 text-slate-200" />
                          <p className="text-xl font-black text-slate-500 mb-2">Bu güne ait randevu yok.</p>
                          <p className="text-sm font-semibold">Takvimdeki noktalı günlere tıklayarak ileriki randevularınızı görebilirsiniz.</p>
                       </div>
                       
                       {appointments.length > 0 && (
                          <div>
                             <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Sistemdeki Diğer Randevular</h4>
                             <div className="space-y-3">
                               {appointments.slice(0, 5).map(apt => (
                                 <div key={apt.id} onClick={() => setSelectedDate(apt.date)} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-100 cursor-pointer transition-colors">
                                   <div className="flex items-center gap-4">
                                     <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black">{apt.patient.charAt(0)}</div>
                                     <div>
                                        <p className="font-bold text-slate-800">{apt.patient}</p>
                                        <p className="text-xs font-semibold text-slate-500">{apt.date.split('-').reverse().join('.')} - {apt.time}</p>
                                     </div>
                                   </div>
                                   <ChevronRight className="w-5 h-5 text-slate-300" />
                                 </div>
                               ))}
                             </div>
                          </div>
                       )}
                    </motion.div>
                 ) : todaysAppointments.map((apt:any, idx:number) => {
                    const isPassed = apt.status === 'completed';
                    const isWaiting = apt.status === 'waiting';
                    return (
                      <motion.div 
                        key={apt.id} 
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: 0.05 * idx }} 
                        className="flex gap-6 group"
                      >
                         <div className="w-16 pt-3 text-right shrink-0">
                            <span className={`text-sm font-black ${isPassed ? 'text-slate-400' : 'text-slate-700'}`}>{apt.time}</span>
                         </div>
                         
                         <div className="relative shrink-0 flex flex-col items-center">
                            <div className="w-0.5 h-full bg-slate-100 absolute left-1/2 -translate-x-1/2"></div>
                            <div className={`relative z-10 w-5 h-5 rounded-full border-4 border-white shadow-sm mt-3 flex items-center justify-center
                               ${isPassed ? 'bg-emerald-500' : isWaiting ? 'bg-amber-500' : 'bg-indigo-500'}
                            `}></div>
                         </div>
                         
                         <div className={`flex-1 p-6 rounded-3xl border transition-all relative overflow-hidden ${
                            isPassed ? 'bg-slate-50 border-slate-200 opacity-75' : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-lg'
                         }`}>
                            {isWaiting && <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-[100px] -z-10"></div>}
                            
                            <div className="flex justify-between items-start mb-4">
                               <div className="flex items-center gap-4">
                                  <div className={`p-3 rounded-2xl ${isPassed ? 'bg-slate-200 text-slate-500' : 'bg-indigo-50 text-indigo-600'}`}>
                                    <User className="w-6 h-6"/>
                                  </div>
                                  <div>
                                     <h4 className={`text-xl font-black ${isPassed ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-800'}`}>{apt.patient}</h4>
                                     <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded uppercase tracking-wider">{apt.type}</span>
                                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider">{apt.doctor}</span>
                                     </div>
                                  </div>
                               </div>
                               
                               <div className="flex gap-2">
                                  {!isPassed && (
                                     <>
                                        <button 
                                          onClick={() => {
                                            setAppointments(appointments.map(a => a.id === apt.id ? {...a, status: 'completed'} : a));
                                            toast.success('Randevu tamamlandı olarak işaretlendi.');
                                          }}
                                          className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center transition-colors" title="Tamamlandı İşaretle"
                                        >
                                          <Check className="w-5 h-5"/>
                                        </button>
                                        <button 
                                          onClick={() => {
                                            setAppointments(appointments.filter(a => a.id !== apt.id));
                                            toast.error('Randevu iptal edildi.');
                                          }}
                                          className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-colors" title="İptal Et"
                                        >
                                          <Trash2 className="w-4 h-4"/>
                                        </button>
                                     </>
                                  )}
                               </div>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm font-bold text-slate-500 pt-4 border-t border-slate-100 border-dashed">
                               <a href={`tel:${apt.phone}`} className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors"><Phone className="w-4 h-4 text-slate-400"/> {apt.phone}</a>
                               <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                               <span className="text-slate-400">ID: {apt.id}</span>
                            </div>
                         </div>
                      </motion.div>
                    )
                 })}
               </AnimatePresence>
            </div>
         </div>
      </div>

      {/* YENI RANDEVU MODALI */}
      <AnimatePresence>
        {isAddModalOpen && (
          <>
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddModalOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]" />
             <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                 className="bg-white rounded-[2rem] w-full max-w-xl shadow-2xl pointer-events-auto overflow-hidden flex flex-col border border-slate-100"
               >
                 <div className="p-6 lg:p-8 bg-white border-b border-slate-100 flex justify-between items-start relative overflow-hidden">
                    <div>
                      <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2"><CalendarIcon className="w-6 h-6 text-indigo-600"/> Randevu Oluştur</h2>
                      <p className="text-slate-500 font-medium text-sm mt-1">Göz muayenesi veya lens kontrolü randevusu planlayın.</p>
                    </div>
                    <button onClick={() => setIsAddModalOpen(false)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 hover:text-slate-800 transition-colors"><X className="w-5 h-5"/></button>
                 </div>
                 
                 <div className="p-6 lg:p-8 space-y-5 bg-slate-50">
                    <div>
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Hasta / Müşteri Adı</label>
                       <input type="text" value={newApt.patient} onChange={e => setNewApt({...newApt, patient: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 font-bold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300" placeholder="Örn: Ayşe Kılıç" />
                    </div>
                    <div>
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Telefon Numarası</label>
                       <input type="text" value={newApt.phone} onChange={e => setNewApt({...newApt, phone: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 font-bold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300" placeholder="05XX XXX XX XX" />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                       <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Randevu Saati</label>
                          <select value={newApt.time} onChange={e => setNewApt({...newApt, time: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 font-bold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all">
                             <option value="09:00">09:00</option>
                             <option value="10:00">10:00</option>
                             <option value="11:30">11:30</option>
                             <option value="14:00">14:00</option>
                             <option value="16:00">16:00</option>
                          </select>
                       </div>
                       <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">İşlem Türü</label>
                          <select value={newApt.type} onChange={e => setNewApt({...newApt, type: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 font-bold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all">
                             <option value="Göz Muayenesi">Göz Muayenesi</option>
                             <option value="Gözlük Teslim">Gözlük Teslimi</option>
                             <option value="Lens Adaptasyonu">Lens Adaptasyonu</option>
                          </select>
                       </div>
                    </div>
                    
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-3 text-indigo-700 text-sm font-semibold">
                      <Stethoscope className="w-5 h-5 shrink-0" />
                      Randevu {selectedDate.split('-').reverse().join('.')} tarihine eklenecektir.
                    </div>
                 </div>

                 <div className="p-6 bg-white border-t border-slate-100 flex justify-end gap-3 rounded-b-[2rem]">
                    <button onClick={() => setIsAddModalOpen(false)} className="px-6 py-3.5 rounded-xl font-black text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Vazgeç</button>
                    <button 
                      onClick={async () => {
                        if(!newApt.patient) {
                          toast.error('Lütfen hasta adını giriniz.');
                          return;
                        }
                        try {
                           const token = localStorage.getItem('token');
                           const res = await fetch('http://localhost:5069/api/appointments', {
                             method: 'POST',
                             headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                             body: JSON.stringify({
                               patient: newApt.patient,
                               phone: newApt.phone,
                               date: selectedDate,
                               time: newApt.time,
                               type: newApt.type
                             })
                           });
                           if (res.ok) {
                             toast.success('Randevu başarıyla takvime eklendi!');
                             setIsAddModalOpen(false);
                             setNewApt({ patient: '', phone: '', time: '09:00', type: 'Göz Muayenesi', doctor: 'Dr. Ahmet Bey' });
                             fetchAppointments();
                           } else {
                             toast.error('Kayıt başarısız.');
                           }
                        } catch(err) {
                           toast.error('Bağlantı hatası.');
                        }
                      }}
                      className="px-8 py-3.5 rounded-xl font-black text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all"
                    >
                      <Plus className="w-5 h-5"/> Randevuyu Kaydet
                    </button>
                 </div>
               </motion.div>
             </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
