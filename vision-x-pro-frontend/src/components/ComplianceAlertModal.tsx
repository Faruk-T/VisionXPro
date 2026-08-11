import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Globe, HeartPulse, X, ExternalLink, CheckCircle2 } from 'lucide-react';

export interface ComplianceAlert {
  type: 'UTS' | 'Medula' | string;
  productName?: string;
  utsCode?: string | null;
  quantity?: number;
  sgkAmount?: number;
  message: string;
}

interface Props {
  open: boolean;
  orderNumber?: string;
  alerts: ComplianceAlert[];
  onClose: () => void;
}

export default function ComplianceAlertModal({ open, orderNumber, alerts, onClose }: Props) {
  if (!open || alerts.length === 0) return null;

  const utsItems = alerts.filter(a => a.type === 'UTS');
  const medulaItems = alerts.filter(a => a.type === 'Medula');

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.92, y: 24 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 24 }}
            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-amber-200"
          >
            <div className="p-6 bg-gradient-to-r from-amber-500 to-orange-600 text-white flex justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ShieldAlert className="w-6 h-6" />
                  <h2 className="text-xl font-black">Resmi Bildirim Gerekli</h2>
                </div>
                <p className="text-amber-100 text-sm font-medium">
                  Satış kaydedildi{orderNumber ? ` (${orderNumber})` : ''}. Aşağıdaki işlemleri resmi portallarda manuel tamamlayın.
                </p>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <p className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3">
                Canlı ÜTS/Medula API henüz bağlı değil. Bildirimler Ayarlar → ÜTS/Medula kuyruğuna eklendi; işlem yaptıktan sonra oradan «Tamamlandı» işaretleyin.
              </p>

              {utsItems.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-black text-blue-800 flex items-center gap-2">
                    <Globe className="w-4 h-4" /> ÜTS — Verme Bildirimi
                  </h3>
                  {utsItems.map((item, i) => (
                    <div key={i} className="p-4 rounded-xl border-2 border-blue-100 bg-blue-50/50">
                      <p className="font-bold text-slate-800">{item.productName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Adet: {item.quantity ?? 1}</p>
                      <div className="mt-2 font-mono text-sm font-black text-blue-700 bg-white px-3 py-2 rounded-lg border border-blue-200 break-all">
                        {item.utsCode}
                      </div>
                      <p className="text-xs font-semibold text-slate-600 mt-2">{item.message}</p>
                    </div>
                  ))}
                  <a
                    href="https://utsuygulama.saglik.gov.tr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> ÜTS portalını aç
                  </a>
                </div>
              )}

              {medulaItems.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-black text-rose-800 flex items-center gap-2">
                    <HeartPulse className="w-4 h-4" /> Medula (SGK)
                  </h3>
                  {medulaItems.map((item, i) => (
                    <div key={i} className="p-4 rounded-xl border-2 border-rose-100 bg-rose-50/50">
                      <p className="font-bold text-slate-800">SGK Optik Provizyon</p>
                      {item.sgkAmount != null && (
                        <p className="text-lg font-black text-rose-700 mt-1">₺{item.sgkAmount.toLocaleString('tr-TR')}</p>
                      )}
                      <p className="text-xs font-semibold text-slate-600 mt-2">{item.message}</p>
                    </div>
                  ))}
                  <p className="text-xs font-bold text-slate-500">Medula erişimi SGK tarafından sağlanır; tesis kodunuz Ayarlar’da kayıtlıdır.</p>
                </div>
              )}
            </div>

            <div className="p-5 bg-slate-50 border-t flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Anladım, devam et
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
