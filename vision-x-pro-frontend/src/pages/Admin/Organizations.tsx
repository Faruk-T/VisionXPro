import React, { useState, useEffect } from 'react';
import { Building2, Users as UsersIcon, AlertTriangle, Plus, Key, Calendar, Mail, FileText, CheckCircle, XCircle, Trash2 } from 'lucide-react';


interface OrgStats {
  totalOrganizations: number;
  expiringLicensesCount: number;
  totalCustomers: number;
}

interface Organization {
  id: string;
  name: string;
  taxNumber?: string;
  isActive: boolean;
  licenseStartDate?: string;
  licenseEndDate?: string;
  branchCount: number;
  customerCount: number;
}

interface OrgUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  branchName: string;
}

export default function AdminOrganizations() {
  const [stats, setStats] = useState<OrgStats>({ totalOrganizations: 0, expiringLicensesCount: 0, totalCustomers: 0 });
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
  const [newLicenseDate, setNewLicenseDate] = useState('');
  
  const [loading, setLoading] = useState(true);

  // Add Form State
  const [formData, setFormData] = useState({
    name: '',
    taxNumber: '',
    city: 'İstanbul',
    subscriptionPlan: 'Pro',
    licenseEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    adminEmail: '',
    adminPassword: ''
  });

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { 'Authorization': `Bearer ${token}` };
  };

  const fetchStatsAndOrgs = async () => {
    try {
      const headers = getAuthHeader();
      const statsRes = await fetch('http://localhost:5069/api/organizations/stats', { headers });
      if (statsRes.ok) setStats(await statsRes.json());
      
      const orgsRes = await fetch('http://localhost:5069/api/organizations', { headers });
      if (orgsRes.ok) setOrganizations(await orgsRes.json());
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsAndOrgs();
  }, []);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5069/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setIsAddModalOpen(false);
        fetchStatsAndOrgs();
        alert('Mağaza başarıyla eklendi!');
      } else {
        const error = await res.json();
        alert('Hata: ' + (error.message || 'Ters giden bir şeyler var.'));
      }
    } catch (e) {
      alert('Sunucuya bağlanırken hata oluştu.');
    }
  };

  const handleDeleteOrg = async (orgId: string, orgName: string) => {
    if (!window.confirm(`${orgName} mağazasını kalıcı olarak sistemden silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`)) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:5069/api/organizations/${orgId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });

      if (res.ok) {
        alert('Mağaza ve tüm kullanıcıları sistemden başarıyla silindi.');
        fetchStatsAndOrgs();
      } else {
        const err = await res.json();
        alert('Hata: ' + (err.message || 'Silme işlemi başarısız.'));
      }
    } catch (e) {
      alert('Sunucuya bağlanırken hata oluştu.');
    }
  };

  const openDetailModal = async (org: Organization) => {
    setSelectedOrg(org);
    setNewLicenseDate(org.licenseEndDate ? org.licenseEndDate.split('T')[0] : '');
    
    // Fetch users for this org
    try {
      const res = await fetch(`http://localhost:5069/api/organizations/${org.id}/users`, { headers: getAuthHeader() });
      if (res.ok) setOrgUsers(await res.json());
    } catch (error) {
      console.error("Failed to fetch org users:", error);
    }
  };

  const handleExtendLicense = async () => {
    if (!selectedOrg) return;
    try {
      const res = await fetch(`http://localhost:5069/api/organizations/${selectedOrg.id}/license`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ newEndDate: newLicenseDate })
      });
      
      if (res.ok) {
        alert('Lisans süresi başarıyla uzatıldı!');
        setSelectedOrg(null);
        fetchStatsAndOrgs();
      } else {
        alert('Lisans güncellenemedi.');
      }
    } catch (e) {
      alert('Sunucuya bağlanırken hata oluştu.');
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!selectedOrg) return;
    const newPassword = prompt("Bu kullanıcı için yeni bir şifre belirleyin:");
    if (!newPassword) return;

    try {
      const res = await fetch(`http://localhost:5069/api/organizations/${selectedOrg.id}/users/${userId}/reset-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ newPassword })
      });
      
      if (res.ok) {
        alert('Personel şifresi başarıyla güncellendi!');
      } else {
        alert('Şifre güncellenemedi.');
      }
    } catch (e) {
      alert('Sunucuya bağlanırken hata oluştu.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Lisanslar & Mağazalar</h2>
          <p className="text-gray-500 font-medium mt-1">Sisteme kayıtlı şubeleri yönetin ve lisans atamalarını kontrol edin.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 hover:shadow-lg transition-all transform hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          Yeni Mağaza Ekle
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <p className="text-gray-500 font-medium">Toplam Mağaza</p>
            <h3 className="text-3xl font-bold text-gray-900">{stats.totalOrganizations}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <p className="text-gray-500 font-medium">Yaklaşan Lisans Bitişleri (7 Gün)</p>
            <h3 className="text-3xl font-bold text-gray-900">{stats.expiringLicensesCount}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
            <UsersIcon className="w-7 h-7" />
          </div>
          <div>
            <p className="text-gray-500 font-medium">Toplam Müşteri Hacmi</p>
            <h3 className="text-3xl font-bold text-gray-900">{stats.totalCustomers}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Aktif Mağazalar Listesi</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/50 text-gray-700 font-semibold border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Mağaza Adı</th>
                <th className="px-6 py-4">Paket</th>
                <th className="px-6 py-4 text-center">Şube/Şb.</th>
                <th className="px-6 py-4 text-center">Bitiş Tarihi</th>
                <th className="px-6 py-4 text-center">Durum</th>
                <th className="px-6 py-4 text-center">Aksiyon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Yükleniyor...</td></tr>
              ) : organizations.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Sistemde henüz mağaza kaydı yok.</td></tr>
              ) : (
                organizations.map(org => {
                  const isExpired = org.licenseEndDate ? new Date(org.licenseEndDate) < new Date() : false;
                  return (
                  <tr key={org.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${isExpired ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'} flex items-center justify-center font-bold`}>
                        {org.name.charAt(0)}
                      </div>
                      {org.name}
                    </td>
                    <td className="px-6 py-4"><span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold">PRO</span></td>
                    <td className="px-6 py-4 text-center font-medium">{org.branchCount} Şube</td>
                    <td className={`px-6 py-4 text-center font-bold ${isExpired ? 'text-red-500' : 'text-gray-900'}`}>
                      {org.licenseEndDate ? new Date(org.licenseEndDate).toLocaleDateString() : '-'}
                      {isExpired && <span className="block text-[10px] text-red-600 uppercase mt-0.5">Süreli Doldu</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {org.isActive ? (
                        <span className="inline-flex flex-col items-center gap-1"><CheckCircle className="w-5 h-5 text-emerald-500"/></span>
                      ) : (
                        <span className="inline-flex items-center gap-1"><XCircle className="w-5 h-5 text-red-500"/></span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => openDetailModal(org)} className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg transition-colors text-xs">
                          Detay Yönet
                        </button>
                        <button onClick={() => handleDeleteOrg(org.id, org.name)} className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-lg transition-colors text-xs" title="Mağazayı Sil">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-900 -tracking-tight">Yeni Mağaza Ekle</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateOrg} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Mağaza (Firma) Adı</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium" placeholder="Optik Mağazası A.Ş." />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Vergi Numarası / TC</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input type="text" value={formData.taxNumber} onChange={e => setFormData({...formData, taxNumber: e.target.value})} className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium" placeholder="1234567890" />
                  </div>
                </div>
              </div>

              <div className="p-4 border border-blue-100 bg-blue-50/50 rounded-xl space-y-4">
                <h4 className="font-bold text-blue-900 text-sm flex items-center gap-2">
                  <Key className="w-4 h-4" /> Mağaza Sahibi (Admin) Bilgileri
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">E-posta Adresi</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input required type="email" value={formData.adminEmail} onChange={e => setFormData({...formData, adminEmail: e.target.value})} className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium" placeholder="patron@magaza.com" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Geçici Şifre</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input required type="text" value={formData.adminPassword} onChange={e => setFormData({...formData, adminPassword: e.target.value})} className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all font-bold tracking-wide" placeholder="GuvencLiSifre!123" />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">Sistem BCrypt ile şifreleyecektir.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Lisans Bitiş Tarihi</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input required type="date" value={formData.licenseEndDate} onChange={e => setFormData({...formData, licenseEndDate: e.target.value})} className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium text-gray-700" />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition">İptal</button>
                <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md hover:shadow-lg transition">Sistemi Kur & Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail & License Modal */}
      {selectedOrg && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-900 -tracking-tight flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" /> {selectedOrg.name} 
              </h3>
              <button onClick={() => setSelectedOrg(null)} className="text-gray-400 hover:text-gray-600 transition">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Sol Yarı: Lisans & Sistem */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50/50 p-6 rounded-[1.5rem] border border-indigo-100 flex flex-col items-center justify-center text-center relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-2xl opacity-60"></div>
                   <div className="w-16 h-16 bg-white shadow-sm rounded-2xl flex items-center justify-center text-indigo-600 mb-4 z-10 border border-indigo-50">
                      <Calendar className="w-8 h-8" />
                   </div>
                   <h4 className="font-extrabold text-indigo-950 text-lg mb-1 z-10">Lisans Yenileme Merkezi</h4>
                   <p className="text-xs text-indigo-700 font-medium mb-6 z-10">Mevcut abonelik bittiğinde kurum personeli sisteme giriş yapamaz. Süreyi buradan uzatın.</p>
                   
                   <div className="w-full relative z-10 text-left">
                     <label className="block text-[10px] font-black uppercase tracking-wider text-indigo-400 mb-1.5 ml-1">Yeni Bitiş Tarihi</label>
                     <div className="relative">
                       <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                       <input type="date" value={newLicenseDate} onChange={e => setNewLicenseDate(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 transition-all font-bold text-indigo-900 shadow-sm text-sm" />
                     </div>
                   </div>
                   
                   <button onClick={handleExtendLicense} className="w-full mt-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all z-10">
                     Süreyi Uzat & Onayla
                   </button>
                </div>
              </div>

              {/* Sağ Yarı: Personel Yönetimi */}
              <div className="lg:col-span-7 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                   <h4 className="font-extrabold text-slate-800 flex items-center gap-2">
                     <UsersIcon className="w-5 h-5 text-slate-400" /> Aktif Personel & Kullanıcılar
                   </h4>
                   <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">{orgUsers.length} Kişi</span>
                </div>
                
                <div className="flex-1 bg-slate-50/50 border border-slate-200 rounded-[1.5rem] overflow-hidden flex flex-col">
                  <div className="max-h-[320px] overflow-y-auto p-2 scrollbar-hide">
                    {orgUsers.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                         <AlertTriangle className="w-8 h-8 mb-3 text-slate-300" />
                         <span className="text-sm font-bold">Hiç çalışan bulunamadı.</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {orgUsers.map(u => (
                          <div key={u.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex justify-between items-center hover:shadow-sm transition-all group">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm border border-slate-200">
                                  {u.fullName.charAt(0)}
                               </div>
                               <div>
                                 <p className="text-sm font-extrabold text-slate-800">{u.fullName}</p>
                                 <p className="text-xs font-semibold text-slate-500 mt-0.5 flex items-center gap-1.5">
                                    <Mail className="w-3 h-3" /> {u.email}
                                 </p>
                               </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <div className="text-right hidden sm:block">
                                 <p className="text-[10px] uppercase tracking-widest font-black text-slate-400">{u.role}</p>
                                 <p className="text-xs font-bold text-slate-600">{u.branchName || 'Merkez'}</p>
                              </div>
                              <div className="w-px h-8 bg-slate-100 hidden sm:block mx-2"></div>
                              <button onClick={() => handleResetPassword(u.id)} className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 group-hover:border-slate-300" title="Şifre Sıfırla">
                                <Key className="w-3.5 h-3.5" /> Şifreyi Ez
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
