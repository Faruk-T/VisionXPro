import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  Building2, 
  Settings, 
  ShoppingCart, 
  Package, 
  Calendar, 
  FileText,
  User as UserIcon,
  ShieldCheck,
  CreditCard,
  Target,
  Users as UsersIcon,
  Printer,
  LayoutDashboard,
  ChevronLeft
} from 'lucide-react';
import { useState } from 'react';

const roleMenus = {
  SuperAdmin: [
    { label: 'Sistem Özeti', path: '/dashboard', icon: ShieldCheck },
    { label: 'Mağazalar & Lisanslar', path: '/dashboard/admin/organizations', icon: Building2 },
    { label: 'Sistem Ayarları', path: '/dashboard/admin/settings', icon: Settings },
  ],
  ShopOwner: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Nakit & Finans', path: '/dashboard/sales', icon: CreditCard },
    { label: 'POS Satış', path: '/dashboard/pos', icon: ShoppingCart },
    { label: 'Siparişler', path: '/dashboard/orders', icon: Package },
    { label: 'Müşteri Yönetimi', path: '/dashboard/customers', icon: UsersIcon },
    { label: 'Katalog & Stok', path: '/dashboard/inventory', icon: Target },
    { label: 'Randevular', path: '/dashboard/appointments', icon: Calendar },
    { label: 'Sistem Ayarları', path: '/dashboard/settings', icon: Settings },
    { label: 'Ürün Etiketi', path: '/dashboard/labels', icon: Printer },
  ],
  Customer: [
    { label: 'Müşteri Özeti', path: '/dashboard', icon: UserIcon },
    { label: 'Reçetelerim', path: '/dashboard/my-prescriptions', icon: FileText },
    { label: 'Randevularım', path: '/dashboard/my-appointments', icon: Calendar },
  ]
};

export default function Sidebar() {
  const user = useAuthStore((state) => state.user);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Default to Customer if no role mapping
  const menuItems = roleMenus[user?.role as keyof typeof roleMenus] || roleMenus['Customer'];

  return (
    <div className={`relative bg-white border-r border-[#E2E8F0] h-[calc(100vh-64px)] hidden md:flex flex-col shadow-sm z-10 flex-shrink-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
      
      {/* Toggle Button */}
      <div className="absolute -right-3 top-6 z-20">
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="bg-white border border-[#E2E8F0] shadow-sm text-gray-400 hover:text-blue-600 rounded-full p-1.5 transition-colors focus:outline-none"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-hide">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              title={isCollapsed ? item.label : undefined}
              className={({ isActive }) => 
                `flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  isActive 
                  ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                }`
              }
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? 'mx-auto' : ''}`} />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
