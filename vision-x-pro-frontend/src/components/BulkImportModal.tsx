import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, FileText, Download, Sparkles, 
  X, HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const sampleCatalogCsv = `Barkod,Ürün Adı,Kategori,Marka,Alış Fiyatı,Satış Fiyatı,Miktar,Menşei
869001000101,Ray-Ban Aviator RB3025,Çerçeve,Ray-Ban,1800,3450,10,İtalya
869001000102,Vogue Eyewear VO5333,Çerçeve,Vogue,1100,2250,8,İtalya
869001000103,Osse OS3452 Titanyum,Çerçeve,Osse,900,1950,15,Türkiye
869001000104,Hawk HW1980 Asetat,Çerçeve,Hawk,650,1450,12,Türkiye
869001000201,1.50 CR-39 Organik Standart Cam,Cam,VisionX,150,450,50,Türkiye
869001000202,1.56 Anti-Refle Kaplamalı Cam,Cam,VisionX Pro,280,750,40,Türkiye
869001000203,1.60 BlueCut Mavi Işık Korumalı Cam,Cam,Novax,550,1450,30,Türkiye
869001000204,1.67 Crizal Sapphire Asferik İnce Cam,Cam,Essilor,1200,3200,20,Fransa
869001000205,1.74 Ultra Thin Hi-Index Cam,Cam,Hoya,1900,4800,15,Japonya
869001000301,Opti-Free Express 355ml Lens Solüsyonu,Solüsyon,Alcon,85,180,25,ABD`;

export default function BulkImportModal({ isOpen, onClose, onSuccess }: BulkImportModalProps) {
  const [csvText, setCsvText] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const template = `Barkod,Ürün Adı,Kategori,Marka,Alış Fiyatı,Satış Fiyatı,Miktar,Menşei\n869000000001,Örnek Gözlük Çerçevesi,Çerçeve,Marka,500,1200,10,Türkiye\n869000000002,1.56 Anti-Refle Cam,Cam,VisionX,200,600,20,Türkiye`;
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'visionx_urun_sablonu.csv';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Örnek CSV şablonu indirildi.');
  };

  const handleLoadSampleCatalog = () => {
    setCsvText(sampleCatalogCsv);
    toast.success('Popüler cam ve çerçeve ürünleri editöre yüklendi!');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvText(content);
      toast.success(`${file.name} başarıyla okundu.`);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    if (!csvText.trim()) {
      toast.error('Lütfen CSV içeriği yapıştırın veya dosya yükleyin.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/products/import', { csvContent: csvText });
      toast.success(res.message || 'Ürünler başarıyla içe aktarıldı!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Toplu içe aktarma başarısız oldu.');
    } finally {
      setLoading(false);
    }
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
          <div className="bg-slate-900 text-white p-6 relative">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 rounded-2xl">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight">Toplu Ürün ve Stok İçe Aktarma</h2>
                <p className="text-xs text-slate-400">Excel / CSV dosyalarından hızlı envanter yükleme</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-1.5 transition shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  Şablon CSV İndir
                </button>
                <button
                  type="button"
                  onClick={handleLoadSampleCatalog}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 flex items-center gap-1.5 transition shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Örnek Optik Kataloğu Yükle
                </button>
              </div>

              <label className="cursor-pointer px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-sm">
                <FileText className="w-3.5 h-3.5" />
                Dosya Seç (.csv)
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Textarea */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  CSV Verisi
                </label>
                <span className="text-[11px] text-slate-400">Virgül (,) ile ayrılmış sütunlar</span>
              </div>
              <textarea
                rows={10}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Barkod,Ürün Adı,Kategori,Marka,Alış Fiyatı,Satış Fiyatı,Miktar,Menşei&#10;869001000101,Ray-Ban Aviator,Çerçeve,Ray-Ban,1800,3450,10,İtalya"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition"
              />
            </div>

            <div className="text-[11px] text-slate-500 bg-blue-50/60 p-3 rounded-xl border border-blue-100 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                Mevcut bir barkod ile eşleşen ürünlerin satış ve alış fiyatları güncellenir, miktarları mevcut şube stoklarına eklenir. Yeni ürünler doğrudan kataloğa ve şubenize kaydedilir.
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-slate-600 hover:bg-slate-200 font-bold text-sm rounded-xl transition"
            >
              Vazgeç
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !csvText.trim()}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 transition disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {loading ? 'İçe Aktarılıyor...' : 'Ürünleri Envantere Aktar'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
