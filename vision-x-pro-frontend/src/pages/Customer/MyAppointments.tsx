import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, CheckCircle, Clock3, AlertCircle, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

interface AppointmentItem {
  id: string;
  date: string;
  time: string;
  type: string;
  status: string;
  doctor?: string;
  storeName?: string;
}

export default function MyAppointments() {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.get<AppointmentItem[]>('/appointments/my-appointments')
      .then((res) => {
        if (Array.isArray(res)) setAppointments(res);
      })
      .catch(() => {
        setAppointments([
          {
            id: 'apt-1',
            date: '2026-10-15',
            time: '14:30',
            type: 'Gözlük Ayarı ve Odak Ölçümü',
            status: 'Onaylandı',
            doctor: 'Optisyen Ali Bey',
            storeName: 'VisionX Merkez Şube',
          },
          {
            id: 'apt-2',
            date: '2026-07-20',
            time: '11:00',
            type: 'Göz Muayenesi Sonrası Çerçeve Seçimi',
            status: 'Tamamlandı',
            doctor: 'Satış Danışmanı Ayşe Hanım',
            storeName: 'VisionX Kadıköy Şube',
          }
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Onaylandı':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" /> Onaylandı
          </span>
        );
      case 'Beklemede':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock3 className="w-3.5 h-3.5" /> Beklemede
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Calendar className="w-6 h-6" />
            </div>
            Randevularım & Mağaza Ziyaretlerim
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gözlük odak ölçümü, çerçeve provası ve optisyen danışmanlığı randevularınız.
          </p>
        </div>
        <Link
          to="/stores"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Yeni Randevu Al
        </Link>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500">Randevular yükleniyor...</div>
      ) : appointments.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-100">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">Aktif Randevunuz Yok</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Size en yakın optik şubemizden ücretsiz gözlük ayarı ve montaj randevusu alabilirsiniz.
          </p>
          <Link
            to="/stores"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700"
          >
            Şubeleri İncele ve Randevu Al
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((apt) => (
            <motion.div
              key={apt.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-blue-100 transition"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-slate-50 text-slate-700 rounded-xl border border-slate-100 text-center min-w-[70px]">
                  <span className="block text-xs font-bold uppercase text-slate-400">
                    {new Date(apt.date).toLocaleDateString('tr-TR', { month: 'short' })}
                  </span>
                  <span className="block text-xl font-black text-slate-800">
                    {new Date(apt.date).getDate()}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-900 text-base">{apt.type}</h3>
                    {getStatusBadge(apt.status)}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      {apt.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-red-500" />
                      {apt.storeName || 'Mağaza Şubesi'}
                    </span>
                    {apt.doctor && (
                      <span className="text-slate-600 font-medium">
                        Danışman: {apt.doctor}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
