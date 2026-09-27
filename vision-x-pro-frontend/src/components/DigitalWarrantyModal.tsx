import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Glasses, Printer, X, 
  Award, Share2
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DigitalWarrantyModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    orderNumber?: string;
    id?: string;
    customer?: string;
    customerPhone?: string;
    date?: string;
    total?: number;
    totalAmount?: number;
    items?: any[];
    frameName?: string;
    lensDetails?: any;
    prescription?: any;
    salesRep?: string;
  };
}

export default function DigitalWarrantyModal({ isOpen, onClose, order }: DigitalWarrantyModalProps) {
  if (!isOpen) return null;

  const orderNum = order.orderNumber || order.id || 'VX-2026';
  const customerName = order.customer || 'Değerli Müşterimiz';
  const issueDate = order.date ? new Date(order.date).toLocaleDateString('tr-TR') : new Date().toLocaleDateString('tr-TR');
  const expiryDate = new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toLocaleDateString('tr-TR');

  const qrData = JSON.stringify({
    orderNumber: orderNum,
    customer: customerName,
    warrantyUntil: expiryDate,
    issuer: 'VisionX Pro Optik Sistemleri',
  });

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const phone = order.customerPhone ? order.customerPhone.replace(/\D/g, '') : '';
    const text = encodeURIComponent(
      `Sayın ${customerName}, VisionX Pro Optik dijital gözlük garanti kartınız ve reçete kaydınız oluşturulmuştur.\n\nSipariş/Fiş No: ${orderNum}\nGaranti Bitiş: ${expiryDate}\n\nSağlıklı günlerde kullanmanızı dileriz!`
    );
    if (phone) {
      window.open(`https://wa.me/90${phone.startsWith('0') ? phone.slice(1) : phone}?text=${text}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${text}`, '_blank');
    }
    toast.success('WhatsApp paylaşımı açıldı.');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Top Bar */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              Resmi Optik Garanti ve Ürün Kimlik Kartı
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Printable Warranty Certificate Card */}
          <div className="p-6 overflow-y-auto space-y-6">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-700">
              {/* Decorative background circle */}
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl"></div>

              {/* Card Header */}
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-600/30 border border-blue-400/30 rounded-2xl backdrop-blur-md">
                    <Glasses className="w-7 h-7 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                      VisionX Pro
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded-md border border-blue-400/20">
                        Passport
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">Optik Garanti & Reçete Kimlik Belgesi</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Sipariş No</span>
                  <span className="text-sm font-mono font-black text-blue-400">{orderNum}</span>
                </div>
              </div>

              {/* Customer & Issue Date */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-xs border-y border-slate-700/60 py-4">
                <div>
                  <span className="text-slate-400 block font-semibold">Hak Sahibi / Müşteri</span>
                  <span className="font-bold text-white text-sm">{customerName}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block font-semibold">Düzenleme Tarihi</span>
                  <span className="font-bold text-slate-200">{issueDate}</span>
                </div>
              </div>

              {/* Optical Diopters (OD / OS) */}
              <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/80 mb-6">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
                  Ölçülen Reçete & Cam Değerleri
                </span>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/50">
                    <span className="text-blue-400 font-bold block mb-1">Sağ Göz (OD)</span>
                    <span className="font-mono text-slate-200 text-xs block">
                      SPH: {order.prescription?.right?.sph ?? '-1.75'} | CYL: {order.prescription?.right?.cyl ?? '-0.50'}
                    </span>
                    <span className="font-mono text-slate-400 text-[11px] block">
                      AXIS: {order.prescription?.right?.axis ?? '85'}° | PD: {order.prescription?.right?.pd ?? '31'} mm
                    </span>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/50">
                    <span className="text-emerald-400 font-bold block mb-1">Sol Göz (OS)</span>
                    <span className="font-mono text-slate-200 text-xs block">
                      SPH: {order.prescription?.left?.sph ?? '-2.00'} | CYL: {order.prescription?.left?.cyl ?? '-0.75'}
                    </span>
                    <span className="font-mono text-slate-400 text-[11px] block">
                      AXIS: {order.prescription?.left?.axis ?? '95'}° | PD: {order.prescription?.left?.pd ?? '32'} mm
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Specs & QR */}
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>2 Yıl Üretici ve Montaj Garantisi</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Garanti Bitiş: <span className="text-slate-200 font-semibold">{expiryDate}</span>
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Kırılma, kaplama atması ve montaj kontrolü kapsamındadır.
                  </p>
                </div>
                <div className="p-2 bg-white rounded-xl shrink-0 shadow-md">
                  <QRCodeSVG value={qrData} size={64} />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handlePrint}
                className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm transition shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Garanti Kartını Yazdır
              </button>
              <button
                onClick={handleShareWhatsApp}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm transition shadow-sm"
              >
                <Share2 className="w-4 h-4" />
                WhatsApp ile Gönder
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
