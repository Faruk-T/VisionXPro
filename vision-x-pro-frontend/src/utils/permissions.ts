import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  ShoppingCart,
  Focus,
  Package,
  Users as UsersIcon,
  Target,
  Calendar,
  DollarSign,
  Printer,
  Settings,
} from 'lucide-react';

export const PERMISSIONS = {
  POS: 'POS',
  STOCK: 'Stok',
  REPORTS: 'Raporlar',
  RETURNS: 'İade',
  OPTIC_ORDER: 'Optik Sipariş',
  PRESCRIPTION: 'Reçete',
  FINANCE: 'Kasa İşlemleri',
  APPOINTMENTS: 'Randevu',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export interface ShopMenuItem {
  label: string;
  path: string;
  icon: LucideIcon;
  /** null = her mağaza kullanıcısına açık (dashboard) */
  permission: Permission | null;
}

export const SHOP_MENU: ShopMenuItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: null },
  { label: 'POS Satış', path: '/dashboard/pos', icon: ShoppingCart, permission: PERMISSIONS.POS },
  { label: 'Optik Sipariş', path: '/dashboard/optic-order', icon: Focus, permission: PERMISSIONS.OPTIC_ORDER },
  { label: 'Siparişler', path: '/dashboard/orders', icon: Package, permission: PERMISSIONS.REPORTS },
  { label: 'Müşteriler', path: '/dashboard/customers', icon: UsersIcon, permission: PERMISSIONS.PRESCRIPTION },
  { label: 'Katalog & Stok', path: '/dashboard/inventory', icon: Target, permission: PERMISSIONS.STOCK },
  { label: 'Randevular', path: '/dashboard/appointments', icon: Calendar, permission: PERMISSIONS.APPOINTMENTS },
  { label: 'Finans', path: '/dashboard/finance', icon: DollarSign, permission: PERMISSIONS.FINANCE },
  { label: 'Ürün Etiketi', path: '/dashboard/labels', icon: Printer, permission: PERMISSIONS.STOCK },
  { label: 'Ayarlar', path: '/dashboard/settings', icon: Settings, permission: null },
];

const OWNER_ONLY_PATHS = new Set(['/dashboard/settings']);

export function hasPermission(permissions: string[] | undefined, required: Permission): boolean {
  if (!permissions?.length) return false;
  return permissions.some((p) => p.toLowerCase() === required.toLowerCase());
}

export function canAccessShopPath(
  role: string,
  permissions: string[] | undefined,
  path: string
): boolean {
  if (role === 'ShopOwner' || role === 'SuperAdmin') return true;
  if (role !== 'ShopStaff') return false;

  if (OWNER_ONLY_PATHS.has(path)) return false;

  const item = SHOP_MENU.find((m) => m.path === path);
  if (!item) return true;
  if (item.permission === null) return true;
  return hasPermission(permissions, item.permission);
}

export function getShopMenuForUser(role: string, permissions: string[] = []): ShopMenuItem[] {
  if (role === 'ShopOwner') {
    return SHOP_MENU;
  }
  if (role !== 'ShopStaff') return [];

  return SHOP_MENU.filter((item) => {
    if (OWNER_ONLY_PATHS.has(item.path)) return false;
    if (item.permission === null) return true;
    return hasPermission(permissions, item.permission);
  });
}

/** Route → gerekli yetki eşlemesi (ProtectedRoutes için) */
export const ROUTE_PERMISSIONS: Record<string, Permission | null> = Object.fromEntries(
  SHOP_MENU.map((m) => [m.path.replace('/dashboard', '').replace(/^\//, '') || 'index', m.permission])
);

export function routeKeyToPermission(routeSegment: string): Permission | null {
  const map: Record<string, Permission | null> = {
    pos: PERMISSIONS.POS,
    'optic-order': PERMISSIONS.OPTIC_ORDER,
    orders: PERMISSIONS.REPORTS,
    customers: PERMISSIONS.PRESCRIPTION,
    inventory: PERMISSIONS.STOCK,
    appointments: PERMISSIONS.APPOINTMENTS,
    finance: PERMISSIONS.FINANCE,
    labels: PERMISSIONS.STOCK,
    settings: null,
  };
  return map[routeSegment] ?? null;
}
