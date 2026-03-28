import React from 'react';
import { Settings, Shield, Globe, Database } from 'lucide-react';

export default function AdminSettings() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Sistem Ayarları</h2>
        <p className="text-gray-500 font-medium mt-1">Vision X Pro ana sunucu ve güvenlik konfigürasyonları.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 space-y-4 hover:shadow-md transition">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Globe className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Uygulama Domaini</h3>
          <p className="text-sm text-gray-500">app.visionxpro.com üzerinden gelen yönlendirmeler ve izinler.</p>
          <button className="text-sm font-semibold text-blue-600">Ayarları Yönet &rarr;</button>
        </div>
        
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 space-y-4 hover:shadow-md transition">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Güvenlik Politikası</h3>
          <p className="text-sm text-gray-500">JWT Token süreleri, CORS kuralları ve Rate Limiting ayarları.</p>
          <button className="text-sm font-semibold text-red-600">Ayarları Yönet &rarr;</button>
        </div>

        <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 space-y-4 hover:shadow-md transition">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
            <Database className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Yedekleme (Backup)</h3>
          <p className="text-sm text-gray-500">Tüm organizasyonların MSSQL logları ve periyodik sunucu yedekleri.</p>
          <button className="text-sm font-semibold text-purple-600">Şimdi Yedekle &rarr;</button>
        </div>
      </div>
    </div>
  );
}
