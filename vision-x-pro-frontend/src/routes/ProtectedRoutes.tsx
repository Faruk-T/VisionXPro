import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { canAccessShopPath, routeKeyToPermission, hasPermission } from '../utils/permissions';

interface ProtectedRoutesProps {
  allowedRoles?: string[];
  /** Mağaza personeli için gerekli modül yetkisi */
  requiredPermission?: string;
}

const ProtectedRoutes = ({ allowedRoles, requiredPermission }: ProtectedRoutesProps) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requiredPermission && user) {
    if (user.role === 'ShopOwner' || user.role === 'SuperAdmin') {
      return <Outlet />;
    }
    if (user.role === 'ShopStaff' && !hasPermission(user.permissions, requiredPermission as any)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <Outlet />;
};

/** Tek bir route segmenti için yetki kontrolü (App.tsx içinde kullanım) */
export function ShopRouteGuard({ segment }: { segment: string }) {
  const user = useAuthStore((state) => state.user);
  if (!user) return <Navigate to="/login" replace />;

  const path = segment ? `/dashboard/${segment}` : '/dashboard';
  const perm = routeKeyToPermission(segment);

  if (user.role === 'ShopOwner' || user.role === 'SuperAdmin') {
    return <Outlet />;
  }

  if (user.role === 'ShopStaff') {
    if (segment === 'settings') return <Navigate to="/unauthorized" replace />;
    if (perm && !hasPermission(user.permissions, perm)) {
      return <Navigate to="/unauthorized" replace />;
    }
    if (!canAccessShopPath(user.role, user.permissions, path)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <Outlet />;
}

export default ProtectedRoutes;
