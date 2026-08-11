import { useState, useEffect } from 'react';
import { Users, Shield, Clock, Plus, Settings2, Edit, X, Save } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { api } from '../../lib/api';

const JOB_TITLES = ['Mağaza Müdürü', 'Satış Danışmanı', 'Optisyen', 'Kasiyer', 'Stok Sorumlusu'];

export default function CorporateSettings() {
  const [activeTab, setActiveTab] = useState<'personnel' | 'roles' | 'shifts'>('personnel');
  const [employees, setEmployees] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    fullName: '',
    email: '',
    password: '',
    branchId: '',
    jobTitle: 'Satış Danışmanı',
  });

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const data = await api.get<any[]>('/corporate/employees');
      setEmployees(data);
    } catch {
      toast.error('Çalışan listesi alınamadı.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const data = await api.get<any[]>('/corporate/branches');
      setBranches(data);
      if (data.length && !newEmployee.branchId) {
        setNewEmployee(prev => ({ ...prev, branchId: data[0].id }));
      }
    } catch {
      /* branches optional for display */
    }
  };

  useEffect(() => {
    if (activeTab === 'personnel') {
      fetchEmployees();
      fetchBranches();
    }
  }, [activeTab]);

  const handleAddEmployee = async () => {
    if (!newEmployee.fullName.trim() || !newEmployee.email.trim() || !newEmployee.password.trim()) {
      toast.error('Ad soyad, e-posta ve şifre zorunludur.');
      return;
    }
    if (!newEmployee.branchId) {
      toast.error('Lütfen bir şube seçin.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/corporate/employees', {
        fullName: newEmployee.fullName,
        email: newEmployee.email,
        password: newEmployee.password,
        branchId: newEmployee.branchId,
        jobTitle: newEmployee.jobTitle,
      });
      toast.success('Personel eklendi.');
      setShowAddModal(false);
      setNewEmployee({ fullName: '', email: '', password: '', branchId: branches[0]?.id ?? '', jobTitle: 'Satış Danışmanı' });
      fetchEmployees();
    } catch (e: any) {
      toast.error(e.message || 'Personel eklenemedi.');
    } finally {
      setSaving(false);
    }
  };

  const [roles] = useState([
    { id: 1, name: 'Mağaza Müdürü', permissions: ['POS', 'Stok', 'Raporlar', 'İade'] },
    { id: 2, name: 'Satış Danışmanı', permissions: ['POS', 'Stok'] },
    { id: 3, name: 'Optisyen', permissions: ['Optik Sipariş', 'Stok', 'Reçete'] }
  ]);

  const allPermissions = ['POS', 'Stok', 'Raporlar', 'İade', 'Optik Sipariş', 'Reçete', 'Kasa İşlemleri'];

  return (
    <div className="min-h-full bg-slate-50 p-6 lg:p-10 font-sans">
      <Toaster position="top-right" />
      
      <div className="mb-8">
         <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
           <Settings2 className="w-8 h-8 text-indigo-600" />
           Kurumsal İK ve Ayarlar
         </h1>
         <p className="text-slate-500 font-medium mt-1">Personel, Yetkilendirme, Maaş/Prim ve Vardiya Yönetimi.</p>
      </div>

      <div className="flex gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
         <button onClick={() => setActiveTab('personnel')} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${activeTab === 'personnel' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
           <Users className="w-5 h-5"/> Personel Yönetimi
         </button>
         <button onClick={() => setActiveTab('roles')} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${activeTab === 'roles' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
           <Shield className="w-5 h-5"/> Yetkilendirme & Roller
         </button>
         <button onClick={() => setActiveTab('shifts')} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${activeTab === 'shifts' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
           <Clock className="w-5 h-5"/> Vardiya Takibi
         </button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8">
         {activeTab === 'personnel' && (
           <div>
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-black text-slate-800">Personel Listesi</h2>
                 <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-emerald-600">
                   <Plus className="w-4 h-4"/> Yeni Personel
                 </button>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-widest">
                    <th className="p-4 rounded-l-xl">Ad Soyad</th>
                    <th className="p-4">Rol & Şube</th>
                    <th className="p-4">Durum</th>
                    <th className="p-4 rounded-r-xl text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-400 font-bold">Yükleniyor...</td>
                    </tr>
                  ) : employees.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-400 font-bold">Kayıtlı personel bulunamadı.</td>
                    </tr>
                  ) : (
                    employees.map(s => (
                      <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-4">
                          <p className="font-bold text-slate-800">{s.fullName}</p>
                          <p className="text-xs font-mono text-slate-400">{s.email}</p>
                        </td>
                        <td className="p-4">
                          <span className="inline-block px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded mb-1">{s.role}</span>
                          <p className="text-xs font-semibold text-slate-500">{s.branchName}</p>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${s.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {s.isActive ? 'Aktif' : 'Pasif'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button onClick={()=>toast('Düzenleme yakında.')} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Edit className="w-4 h-4"/></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
           </div>
         )}

         {activeTab === 'roles' && (
           <div>
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-black text-slate-800">Roller ve Modül Yetkileri</h2>
                 <p className="text-xs text-slate-400 font-medium">Yetki kısıtlamaları bir sonraki sürümde aktif olacak.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                 {roles.map(r => (
                   <div key={r.id} className="border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-shadow bg-slate-50">
                     <h3 className="text-lg font-black text-slate-800 mb-4">{r.name}</h3>
                     <div className="space-y-2">
                       {allPermissions.map(p => {
                         const hasPerm = r.permissions.includes(p);
                         return (
                           <label key={p} className="flex items-center gap-3 cursor-not-allowed opacity-80">
                             <input type="checkbox" checked={hasPerm} readOnly className="w-4 h-4 text-indigo-600 rounded border-slate-300"/>
                             <span className={`text-sm font-bold ${hasPerm ? 'text-slate-700' : 'text-slate-400'}`}>{p}</span>
                           </label>
                         )
                       })}
                     </div>
                   </div>
                 ))}
              </div>
           </div>
         )}

         {activeTab === 'shifts' && (
           <div className="text-center py-12">
              <Clock className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h2 className="text-2xl font-black text-slate-800 mb-2">Vardiya Takip Modülü</h2>
              <p className="text-slate-500 font-medium">Mağazalarınızdaki personellerin giriş-çıkış saatleri ve vardiya planlamaları burada görüntülenecektir.</p>
           </div>
         )}
      </div>

      {/* Personel Ekleme Modalı */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 bg-indigo-600 flex justify-between items-center">
              <h3 className="text-xl font-black text-white flex items-center gap-2"><UserPlusIcon /> Yeni Personel</h3>
              <button onClick={() => setShowAddModal(false)} className="text-white/80 hover:text-white p-2"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Ad Soyad</label>
                <input value={newEmployee.fullName} onChange={e => setNewEmployee({...newEmployee, fullName: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 font-medium" placeholder="Ahmet Yılmaz" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">E-Posta (Giriş)</label>
                <input type="email" value={newEmployee.email} onChange={e => setNewEmployee({...newEmployee, email: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 font-medium" placeholder="personel@firma.com" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Geçici Şifre</label>
                <input type="password" value={newEmployee.password} onChange={e => setNewEmployee({...newEmployee, password: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 font-medium" placeholder="••••••••" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Görev</label>
                  <select value={newEmployee.jobTitle} onChange={e => setNewEmployee({...newEmployee, jobTitle: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 font-medium">
                    {JOB_TITLES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Şube</label>
                  <select value={newEmployee.branchId} onChange={e => setNewEmployee({...newEmployee, branchId: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 font-medium">
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
              <button onClick={() => setShowAddModal(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200">İptal</button>
              <button onClick={handleAddEmployee} disabled={saving} className="px-5 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-60">
                <Save className="w-4 h-4"/> {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserPlusIcon() {
  return <Plus className="w-5 h-5" />;
}
