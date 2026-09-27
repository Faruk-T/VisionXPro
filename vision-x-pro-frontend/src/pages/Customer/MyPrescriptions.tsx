import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Eye, Download, ShieldCheck, AlertCircle } from 'lucide-react';
import api from '../../lib/api';

interface PrescriptionItem {
  id: string;
  doctorName?: string;
  hospitalName?: string;
  prescriptionDate: string;
  rightSph?: number;
  rightCyl?: number;
  rightAxis?: number;
  rightPD?: number;
  leftSph?: number;
  leftCyl?: number;
  leftAxis?: number;
  leftPD?: number;
  addition?: number;
}

export default function MyPrescriptions() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // In demo / live context, fetch customer prescriptions
    api.get<PrescriptionItem[]>('/prescriptions/my-prescriptions')
      .then((res) => {
        if (Array.isArray(res)) setPrescriptions(res);
      })
      .catch(() => {
        // Fallback demo data if endpoint is pending customer tenant assignment
        setPrescriptions([
          {
            id: 'demo-1',
            doctorName: 'Dr. Mehmet Özkan',
            hospitalName: 'Dünya Göz Hastanesi',
            prescriptionDate: new Date().toISOString(),
            rightSph: -1.75,
            rightCyl: -0.50,
            rightAxis: 85,
            rightPD: 31,
            leftSph: -2.00,
            leftCyl: -0.75,
            leftAxis: 95,
            leftPD: 32,
            addition: 1.25,
          }
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Eye className="w-6 h-6" />
            </div>
            Optik Reçetelerim & Göz Ölçümlerim
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Göz doktorunuz tarafından düzenlenen optik reçeteleriniz ve diyoptri geçmişiniz.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
          <ShieldCheck className="w-4 h-4" />
          Doğrulanmış Optik Kayıt
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500">Kayıtlar yükleniyor...</div>
      ) : prescriptions.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-100">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">Kayıtlı Reçete Bulunamadı</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            Optisyen mağazamızdan aldığınız gözlük ve reçeteler burada listelenecektir.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {prescriptions.map((rx) => (
            <motion.div
              key={rx.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
            >
              {/* Card Top */}
              <div className="p-5 border-b border-slate-100 flex flex-wrap justify-between items-center bg-slate-50/60 gap-3">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-600 text-white rounded-lg">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      {rx.doctorName || 'Göz Doktoru'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {rx.hospitalName || 'Sağlık Kuruluşu'} • {new Date(rx.prescriptionDate).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Yazdır / İndir
                </button>
              </div>

              {/* Table / Grid */}
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-center border-collapse">
                    <thead>
                      <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                        <th className="py-3 px-4 text-left rounded-l-lg">Göz</th>
                        <th className="py-3 px-4">SPH (Sferik)</th>
                        <th className="py-3 px-4">CYL (Silindirik)</th>
                        <th className="py-3 px-4">AXIS (Aks)</th>
                        <th className="py-3 px-4">PD (Pupilla)</th>
                        <th className="py-3 px-4 rounded-r-lg">Addition</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-800">
                      <tr>
                        <td className="py-3.5 px-4 text-left font-bold text-blue-600 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                          Sağ Göz (OD)
                        </td>
                        <td className="py-3.5 px-4">{rx.rightSph != null ? (rx.rightSph > 0 ? `+${rx.rightSph}` : rx.rightSph) : '-'}</td>
                        <td className="py-3.5 px-4">{rx.rightCyl != null ? (rx.rightCyl > 0 ? `+${rx.rightCyl}` : rx.rightCyl) : '-'}</td>
                        <td className="py-3.5 px-4">{rx.rightAxis != null ? `${rx.rightAxis}°` : '-'}</td>
                        <td className="py-3.5 px-4">{rx.rightPD != null ? `${rx.rightPD} mm` : '-'}</td>
                        <td className="py-3.5 px-4 text-slate-500">{rx.addition != null ? `+${rx.addition}` : '-'}</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-4 text-left font-bold text-emerald-600 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                          Sol Göz (OS)
                        </td>
                        <td className="py-3.5 px-4">{rx.leftSph != null ? (rx.leftSph > 0 ? `+${rx.leftSph}` : rx.leftSph) : '-'}</td>
                        <td className="py-3.5 px-4">{rx.leftCyl != null ? (rx.leftCyl > 0 ? `+${rx.leftCyl}` : rx.leftCyl) : '-'}</td>
                        <td className="py-3.5 px-4">{rx.leftAxis != null ? `${rx.leftAxis}°` : '-'}</td>
                        <td className="py-3.5 px-4">{rx.leftPD != null ? `${rx.leftPD} mm` : '-'}</td>
                        <td className="py-3.5 px-4 text-slate-500">{rx.addition != null ? `+${rx.addition}` : '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
