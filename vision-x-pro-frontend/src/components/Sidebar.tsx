import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  Building2, 
  Settings, 
  ShoppingCart, 
  Package, 
  Calendar, 
  Wallet,
  FileText,
  User as UserIcon,
  ShieldCheck,
  CreditCard,
  Target,
  Users as UsersIcon,
  ShieldAlert,
  Printer,
  LayoutDashboard,
  Barcode
} from 'lucide-react';

const roleMenus = {
  SuperAdmin: [
    { label: 'Sistem Özeti', path: '/', icon: ShieldCheck },
    { label: 'Mağazalar & Lisanslar', path: '/admin/organizations', icon: Building2 },
    { label: 'Sistem Ayarları', path: '/admin/settings', icon: Settings },
  ],
  ShopOwner: [
    { label: 'POS Sipariş', path: '/pos', icon: ShoppingCart },
    { label: 'Satış', path: '/sales', icon: CreditCard },
    { label: 'Sipariş', path: '/orders', icon: Package },
    { label: 'Müşteri Yönetimi', path: '/customers', icon: UsersIcon },
    { label: 'Randevu', path: '/appointments', icon: Calendar },
    { label: 'Stok Yönetimi', path: '/inventory', icon: Target },
    { label: 'UTS', path: '/uts', icon: ShieldCheck },
    { label: 'UTS Ayarları', path: '/uts-settings', icon: Settings },
    { label: 'MEDULA', path: '/medula', icon: ShieldAlert },
    { label: 'Ürün Etiketi Oluştur', path: '/labels', icon: Printer },
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Mağaza Ayarları', path: '/shop-settings', icon: Settings },
  ],
  Customer: [
    { label: 'Müşteri Özeti', path: '/', icon: UserIcon },
    { label: 'Reçetelerim', path: '/my-prescriptions', icon: FileText },
    { label: 'Randevularım', path: '/my-appointments', icon: Calendar },
  ]
};

export default function Sidebar() {
  const user = useAuthStore((state) => state.user);
  
  // Default to Customer if no role mapping
  const menuItems = roleMenus[user?.role as keyof typeof roleMenus] || roleMenus['Customer'];

  return (
    <div className="w-64 bg-white border-r h-[calc(100vh-64px)] overflow-y-auto hidden md:block shadow-sm z-10 flex-shrink-0">
      <nav className="p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => 
                `flex items-center gap-3 px-3 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  isActive 
                  ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
