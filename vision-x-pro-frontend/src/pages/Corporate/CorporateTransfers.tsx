import { useState, useEffect, useCallback } from 'react';
import { ArrowRightLeft, Package, Building2, Search, CheckCircle2, Clock, XCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { api } from '../../lib/api';

export default function CorporateTransfers() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    fromBranchId: '',
    toBranchId: '',
    productId: '',
    quantity: 1,
  });

  const loadTransfers = useCallback(async () => {
    const data = await api.get<any[]>('/corporate/transfers');
    setTransfers(data);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const [t, b] = await Promise.all([
          api.get<any[]>('/corporate/transfers'),
          api.get<any[]>('/corporate/branches'),
        ]);
        setTransfers(t);
        setBranches(b);
      } catch {
        toast.error('Transfer verileri yüklenemedi.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const loadInventory = async (branchId: string) => {
    if (!branchId) {
      setInventory([]);
      return;
    }
    try {
      const items = await api.get<any[]>(`/corporate/inventory?branchId=${branchId}`);
      setInventory(items);
    } catch {
      setInventory([]);
    }
  };

  const handleFromBranchChange = (branchId: string) => {
    setForm(prev => ({ ...prev, fromBranchId: branchId, productId: '' }));
    loadInventory(branchId);
  };

  const submitTransfer = async () => {
    if (!form.fromBranchId || !form.toBranchId || !form.productId) {
      toast.error('Şube ve ürün seçimi zorunludur.');
      return;
    }
    try {
      await api.post('/corporate/transfers', {
        fromBranchId: form.fromBranchId,
        toBranchId: form.toBranchId,
        productId: form.productId,
        quantity: form.quantity,
      });
      toast.success('Transfer talebi oluşturuldu.');
      setIsModalOpen(false);
      setForm({ fromBranchId: '', toBranchId: '', productId: '', quantity: 1 });
      await loadTransfers();
    } catch (e: any) {
      toast.error(e.message || 'Talep oluşturulamadı.');
    }
  };

  const approveTransfer = async (id: string) => {
    try {
      await api.put(`/corporate/transfers/${id}/approve`, {});
      toast.success('Transfer onaylandı, stok güncellendi.');
      await loadTransfers();
    } catch (e: any) {
      toast.error(e.message || 'Onay başarısız.');
    }
  };

  const filtered = transfers.filter(t => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      t.productName?.toLowerCase().includes(q) ||
      t.fromBranch?.toLowerCase().includes(q) ||
      t.toBranch?.toLowerCase().includes(q) ||
      String(t.id).toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-full bg-slate-50 p-6 lg:p-10 font-sans">
      <Toaster position="top-right" />

      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <ArrowRightLeft className="w-8 h-8 text-indigo-600" />
            Şubeler Arası Transfer
          </h1>
          <p className="text-slate-500 font-medium mt-1">Mağazalarınız arasındaki stok taleplerini yönetin ve onaylayın.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 flex items-center gap-2 transition-all"
        >
          <Package className="w-5 h-5" /> Yeni Transfer Talebi
        </button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-xl font-black text-slate-800">Transfer Geçmişi</h2>
          <div className="flex bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 w-full md:w-64 focus-within:border-indigo-500 transition-all">
            <Search className="w-5 h-5 text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Transfer ara..."
              className="bg-transparent border-none outline-none w-full text-sm font-bold text-slate-700"
            />
          </div>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-widest">
              <th className="p-4 rounded-l-xl">Transfer No & Tarih</th>
              <th className="p-4">Nereden → Nereye</th>
              <th className="p-4">Ürün & Miktar</th>
              <th className="p-4">Durum</th>
              <th className="p-4 rounded-r-xl text-right">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-4 text-center text-slate-400 font-bold">Yükleniyor...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="p-4 text-center text-slate-400 font-bold">Kayıt bulunamadı.</td></tr>
            ) : (
              filtered.map(t => (
                <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4">
                    <p className="font-bold text-slate-800">TRF-{String(t.id).substring(0, 8).toUpperCase()}</p>
                    <p className="text-xs font-semibold text-slate-500">
                      {new Date(t.transferDate || t.createdAt).toLocaleDateString('tr-TR')}
                    </p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-md flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> {t.fromBranch}
                      </span>
                      <ArrowRightLeft className="w-3 h-3 text-slate-400" />
                      <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-md flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> {t.toBranch}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-slate-800">{t.productName}</p>
                    <p className="text-xs font-bold text-indigo-600">{t.quantity} adet</p>
                  </td>
                  <td className="p-4">
                    {t.status === 'Bekliyor' || t.status === 'Pending' ? (
                      <span className="px-3 py-1 bg-amber-50 text-amber-600 text-xs font-black rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Bekliyor
                      </span>
                    ) : t.status === 'Onaylandı' || t.status === 'Approved' ? (
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-black rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Onaylandı
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-rose-50 text-rose-600 text-xs font-black rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> {t.status}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {t.status === 'Bekliyor' && (
                      <button
                        onClick={() => approveTransfer(t.id)}
                        className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700"
                      >
                        Onayla
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl p-8 w-full max-w-lg">
            <h2 className="text-2xl font-black text-slate-800 mb-6">Yeni Transfer Talebi</h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Çıkış Şubesi</label>
                <select
                  value={form.fromBranchId}
                  onChange={e => handleFromBranchChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-700 outline-none focus:border-indigo-500"
                >
                  <option value="">Seçiniz...</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} {b.city ? `(${b.city})` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Varış Şubesi</label>
                <select
                  value={form.toBranchId}
                  onChange={e => setForm(prev => ({ ...prev, toBranchId: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-700 outline-none focus:border-indigo-500"
                >
                  <option value="">Seçiniz...</option>
                  {branches.filter(b => b.id !== form.fromBranchId).map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Ürün (kaynak şube stoku)</label>
                <select
                  value={form.productId}
                  onChange={e => setForm(prev => ({ ...prev, productId: e.target.value }))}
                  disabled={!form.fromBranchId || inventory.length === 0}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-700 outline-none focus:border-indigo-500 disabled:opacity-50"
                >
                  <option value="">{inventory.length === 0 ? 'Stok yok' : 'Ürün seçin...'}</option>
                  {inventory.map(p => (
                    <option key={p.productId} value={p.productId}>
                      {p.barcode} — {p.name} (Stok: {p.quantity})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Miktar</label>
                <input
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={e => setForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-black text-slate-700 outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">
                İptal
              </button>
              <button onClick={submitTransfer} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700">
                Talep Oluştur
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
