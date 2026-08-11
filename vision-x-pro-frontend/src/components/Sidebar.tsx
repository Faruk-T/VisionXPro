import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  Building2, 
  Settings, 
  ShieldCheck,
  Users as UsersIcon,
  LayoutDashboard,
  ChevronLeft,
  Menu,
  X,
  Package,
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { getShopMenuForUser } from '../utils/permissions';

const roleMenus = {
  SuperAdmin: [
    { label: 'Sistem Özeti', path: '/dashboard', icon: ShieldCheck },
    { label: 'Mağazalar & Lisanslar', path: '/dashboard/admin/organizations', icon: Building2 },
    { label: 'Sistem Ayarları', path: '/dashboard/admin/settings', icon: Settings },
  ],
  CorporateOwner: [
    { label: 'Kurumsal Özet', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Şubelerim', path: '/dashboard/corporate/stores', icon: Building2 },
    { label: 'Şubeler Arası Transfer', path: '/dashboard/corporate/transfers', icon: Package },
    { label: 'Personel & İK', path: '/dashboard/corporate/settings', icon: UsersIcon },
  ],
  Customer: [
    { label: 'Müşteri Özeti', path: '/dashboard', icon: UsersIcon },
    { label: 'Reçetelerim', path: '/dashboard/my-prescriptions', icon: Settings },
    { label: 'Randevularım', path: '/dashboard/my-appointments', icon: Settings },
  ],
};

export default function Sidebar() {
  const user = useAuthStore((state) => state.user);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const menuItems = useMemo(() => {
    if (!user) return [];
    if (user.role === 'ShopOwner' || user.role === 'ShopStaff') {
      return getShopMenuForUser(user.role, user.permissions ?? []);
    }
    const fixed = roleMenus[user.role as keyof typeof roleMenus];
    return fixed ?? roleMenus.Customer;
  }, [user]);

  const navContent = (
    <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-hide">
      {menuItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard'}
            title={isCollapsed ? item.label : undefined}
            className={({ isActive }) => 
              `flex items-center ${isCollapsed && !isMobileOpen ? 'justify-center' : 'gap-3'} px-3 py-3 rounded-xl font-semibold transition-all duration-200 ${
                isActive 
                ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
              }`
            }
          >
            <Icon className={`w-5 h-5 flex-shrink-0`} />
            {(!isCollapsed || isMobileOpen) && <span className="truncate">{item.label}</span>}
          </NavLink>
        );
      })}
      {user?.role === 'ShopStaff' && (!isCollapsed || isMobileOpen) && (
        <p className="px-3 pt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {user.jobTitle || 'Personel'} — sınırlı erişim
        </p>
      )}
    </nav>
  );

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-3 left-4 z-50 bg-white border border-gray-200 shadow-sm p-2 rounded-lg text-gray-600 hover:text-blue-600 transition-colors"
        aria-label="Menüyü aç"
      >
        <Menu className="w-5 h-5" />
      </button>

      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <div className={`md:hidden fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <span className="font-bold text-gray-900">Menü</span>
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {navContent}
      </div>

      <div className={`relative bg-white border-r border-[#E2E8F0] h-[calc(100vh-64px)] hidden md:flex flex-col shadow-sm z-10 flex-shrink-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="absolute -right-3 top-6 z-20">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="bg-white border border-[#E2E8F0] shadow-sm text-gray-400 hover:text-blue-600 rounded-full p-1.5 transition-colors focus:outline-none"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
        {navContent}
      </div>
    </>
  );
}
