import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

interface PendingItem {
  id: string;
  orderNumber: string;
  notificationType: string;
  productName: string;
  utsCode?: string;
  quantity: number;
  customerName: string;
  status: string;
  createdAt: string;
}

export default function CompliancePendingQueue({ type }: { type: 'UTS' | 'Medula' }) {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get<PendingItem[]>(`/compliance/pending?type=${type}`);
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [type]);

  const markDone = async (id: string) => {
    try {
      await api.put(`/compliance/${id}/complete`, {});
      toast.success('Bildirim tamamlandı.');
      load();
    } catch (e: any) {
      toast.error(e.message || 'İşlem başarısız.');
    }
  };

  const pending = items.filter(i => i.status === 'Bekliyor');

  return (
    <div className="mt-8 border-t border-slate-200 pt-6">
      <h4 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
        <Clock className="w-4 h-4 text-amber-500" />
        Bekleyen {type} Bildirimleri ({pending.length})
      </h4>
      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm font-medium py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Yükleniyor...
        </div>
      ) : pending.length === 0 ? (
        <p className="text-sm text-slate-500 font-medium py-2">Bekleyen bildirim yok.</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {pending.map(item => (
            <div key={item.id} className="flex items-center justify-between gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{item.productName}</p>
                <p className="text-xs text-slate-500">{item.orderNumber} • {item.customerName} • {item.createdAt}</p>
                {item.utsCode && (
                  <p className="text-xs font-mono font-bold text-blue-700 mt-1">{item.utsCode}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => markDone(item.id)}
                className="shrink-0 px-3 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Tamamlandı
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
