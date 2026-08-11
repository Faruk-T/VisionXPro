import { useState, useEffect, useMemo } from 'react';
import { Building2, MapPin, TrendingUp, ShoppingBag, Plus, Phone, Mail, X, Save } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { api } from '../../lib/api';
import { turkeyCities } from '../../utils/turkey_cities';

export default function CorporateStores() {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newBranch, setNewBranch] = useState({ name: '', city: 'İstanbul', district: 'Kadıköy' });

  const sortedProvinces = useMemo(() => Object.keys(turkeyCities).sort((a, b) => a.localeCompare(b, 'tr')), []);

  const fetchBranches = async () => {
    try {
      const data = await api.get('/corporate/dashboard');
      setBranches(data.branches || []);
    } catch {
      toast.error('Şubeler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleAddBranch = async () => {
    if (!newBranch.name.trim()) {
      toast.error('Şube adı zorunludur.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/corporate/branches', {
        name: newBranch.name,
        city: newBranch.city,
        district: newBranch.district,
      });
      toast.success('Yeni şube eklendi.');
      setShowAddModal(false);
      setNewBranch({ name: '', city: 'İstanbul', district: 'Kadıköy' });
      setLoading(true);
      await fetchBranches();
    } catch (e: any) {
      toast.error(e.message || 'Şube eklenemedi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-50 p-6 lg:p-10 font-sans">
      <Toaster position="top-right" />
      
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-indigo-600" />
            Kurumsal Şubeler
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Şubelerinizin lokasyon, ciro ve satış bilgilerini izleyin.
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)} 
          className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 flex items-center gap-2 transition-all"
        >
          <Plus className="w-5 h-5"/> Yeni Şube Tanımla
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full py-20 text-center text-slate-400 font-bold">
            Şubeler yükleniyor...
          </div>
        ) : branches.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-400 font-bold">
            Henüz şube yok. &quot;Yeni Şube Tanımla&quot; ile ekleyin.
          </div>
        ) : (
          branches.map((branch: any) => (
            <div key={branch.branchId} className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm hover:shadow-xl transition-all group flex flex-col">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 group-hover:text-indigo-600 transition-colors">
                    {branch.branchName}
                  </h3>
                  <p className="text-xs font-semibold text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" /> {branch.city || '—'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-1">Ciro</p>
                  <p className="font-bold text-slate-800 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-emerald-500" /> ₺{(branch.revenue ?? 0).toLocaleString('tr-TR')}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-1">Siparişler</p>
                  <p className="font-bold text-slate-800 flex items-center gap-1">
                    <ShoppingBag className="w-4 h-4 text-indigo-500" /> {branch.orderCount ?? 0} Adet
                  </p>
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-slate-100 space-y-3">
                <p className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" /> Kurumsal yönetim altında
                </p>
                <p className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" /> {(branch.city || 'sube').toLowerCase()}@visionxpro.com
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 bg-indigo-600 flex justify-between items-center">
              <h3 className="text-xl font-black text-white">Yeni Şube</h3>
              <button onClick={() => setShowAddModal(false)} className="text-white/80 hover:text-white p-2"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Şube Adı</label>
                <input value={newBranch.name} onChange={e => setNewBranch({...newBranch, name: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 font-medium" placeholder="Ali Optik 2" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">İl</label>
                <select
                  value={newBranch.city}
                  onChange={e => {
                    const city = e.target.value;
                    const districts = turkeyCities[city as keyof typeof turkeyCities] || [];
                    setNewBranch({ ...newBranch, city, district: districts[0] || '' });
                  }}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 font-medium"
                >
                  {sortedProvinces.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">İlçe</label>
                <select value={newBranch.district} onChange={e => setNewBranch({...newBranch, district: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 font-medium">
                  {(turkeyCities[newBranch.city as keyof typeof turkeyCities] || []).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
              <button onClick={() => setShowAddModal(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200">İptal</button>
              <button onClick={handleAddBranch} disabled={saving} className="px-5 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-60">
                <Save className="w-4 h-4"/> {saving ? 'Ekleniyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
