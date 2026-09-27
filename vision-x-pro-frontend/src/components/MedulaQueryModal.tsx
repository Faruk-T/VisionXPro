import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HeartPulse, Search, CheckCircle2, X, 
  User, Sparkles, Stethoscope
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

interface MedulaResult {
  success: boolean;
  queryTime: string;
  medulaPrescriptionNo: string;
  trackingNo: string;
  nationalId: string;
  patientName: string;
  patientPhone: string;
  prescriptionDate: string;
  doctorName: string;
  doctorRegistrationNo: string;
  hospitalName: string;
  diagnosis: string;
  isEntitled: boolean;
  entitlementStatus: string;
  sgkContribution: {
    frameCoverage: number;
    rightLensCoverage: number;
    leftLensCoverage: number;
    totalSgkAmount: number;
    notes: string;
  };
  diopters: {
    right: { sph: number; cyl: number; axis: number; pd: number };
    left: { sph: number; cyl: number; axis: number; pd: number };
    addition?: number;
    lensType: string;
  };
}

interface MedulaQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPrescription: (data: MedulaResult) => void;
}

export default function MedulaQueryModal({ isOpen, onClose, onApplyPrescription }: MedulaQueryModalProps) {
  const [nationalId, setNationalId] = useState('');
  const [prescriptionNo, setPrescriptionNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MedulaResult | null>(null);

  if (!isOpen) return null;

  const handleFillDemo = () => {
    setNationalId('12345678901');
    setPrescriptionNo('REC-2026-SGK-9842');
  };

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nationalId.trim() || nationalId.trim().length !== 11) {
      toast.error('Lütfen 11 haneli T.C. Kimlik Numarası giriniz.');
      return;
    }

    setLoading(true);
    try {
      const data = await api.post<MedulaResult>('/compliance/medula/query', {
        nationalId: nationalId.trim(),
        prescriptionNumber: prescriptionNo.trim() || undefined,
      });
      setResult(data);
      toast.success('SGK Medula e-Reçete başarıyla sorgulandı.');
    } catch (err: any) {
      toast.error(err.message || 'Medula sorgulaması başarısız oldu.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!result) return;
    onApplyPrescription(result);
    toast.success('e-Reçete ve SGK hak edişi siparişe aktarıldı!');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-6 relative">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">
                <HeartPulse className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight">SGK Medula Optik e-Reçete Sorgulama</h2>
                <p className="text-xs text-red-100 font-medium">T.C. Sosyal Güvenlik Kurumu Medula Entegrasyon Modülü</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            <form onSubmit={handleQuery} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    T.C. Kimlik No <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={11}
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ''))}
                    placeholder="11 haneli T.C. No"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-hidden transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    e-Reçete / Takip No <span className="text-slate-400 font-normal">(Opsiyonel)</span>
                  </label>
                  <input
                    type="text"
                    value={prescriptionNo}
                    onChange={(e) => setPrescriptionNo(e.target.value)}
                    placeholder="Örn: REC-2026-9842"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-hidden transition"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleFillDemo}
                  className="text-xs font-bold text-slate-500 hover:text-red-600 flex items-center gap-1.5 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Örnek SGK Reçetesi Doldur (Hızlı Test)
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md shadow-red-600/20 flex items-center gap-2 transition disabled:opacity-50"
                >
                  <Search className="w-4 h-4" />
                  {loading ? 'Medula Sorgulanıyor...' : 'Medula\'dan Sorgula'}
                </button>
              </div>
            </form>

            {/* Result View */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4"
              >
                {/* Status banner */}
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-emerald-900 block">{result.entitlementStatus}</span>
                      <span className="text-[11px] text-emerald-700 font-medium">Reçete No: {result.medulaPrescriptionNo} • Takip: {result.trackingNo}</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                    Müstehak
                  </span>
                </div>

                {/* Patient & Doctor */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-start gap-2.5">
                    <User className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-slate-400 block font-semibold">Hasta</span>
                      <span className="font-bold text-slate-800 text-sm">{result.patientName}</span>
                      <span className="text-slate-500 block">T.C: {result.nationalId}</span>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-start gap-2.5">
                    <Stethoscope className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-slate-400 block font-semibold">Hekim & Tesis</span>
                      <span className="font-bold text-slate-800">{result.doctorName}</span>
                      <span className="text-slate-500 block truncate">{result.hospitalName}</span>
                    </div>
                  </div>
                </div>

                {/* Eye Values Table */}
                <div className="bg-white p-4 rounded-xl border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                    <span>Reçete Diyoptri Değerleri</span>
                    <span className="text-blue-600 font-semibold lowercase">{result.diopters.lensType}</span>
                  </h4>
                  <table className="w-full text-center text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold">
                        <th className="py-2 px-2 text-left rounded-l-lg">Göz</th>
                        <th className="py-2 px-2">SPH</th>
                        <th className="py-2 px-2">CYL</th>
                        <th className="py-2 px-2">AXIS</th>
                        <th className="py-2 px-2 rounded-r-lg">PD</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                      <tr>
                        <td className="py-2 px-2 text-left font-bold text-blue-600">Sağ (OD)</td>
                        <td className="py-2 px-2">{result.diopters.right.sph}</td>
                        <td className="py-2 px-2">{result.diopters.right.cyl}</td>
                        <td className="py-2 px-2">{result.diopters.right.axis}°</td>
                        <td className="py-2 px-2">{result.diopters.right.pd} mm</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2 text-left font-bold text-emerald-600">Sol (OS)</td>
                        <td className="py-2 px-2">{result.diopters.left.sph}</td>
                        <td className="py-2 px-2">{result.diopters.left.cyl}</td>
                        <td className="py-2 px-2">{result.diopters.left.axis}°</td>
                        <td className="py-2 px-2">{result.diopters.left.pd} mm</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* SGK Coverage Financials */}
                <div className="bg-gradient-to-r from-red-50 to-rose-50 p-4 rounded-xl border border-red-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-red-900 block">SGK Hak Ediş / Katkı Payı</span>
                    <span className="text-[11px] text-red-700">Çerçeve: {result.sgkContribution.frameCoverage} ₺ + Camlar: {result.sgkContribution.rightLensCoverage + result.sgkContribution.leftLensCoverage} ₺</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-red-700">{result.sgkContribution.totalSgkAmount.toFixed(2)} ₺</span>
                    <span className="text-[10px] text-red-500 block font-semibold">Devlet Karşılama Tutarı</span>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={handleApply}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 text-sm transition"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Bu Reçeteyi ve SGK İndirimini Siparişe Aktar
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
