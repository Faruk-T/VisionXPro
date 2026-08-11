
import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';
import ProtectedRoutes, { ShopRouteGuard } from './routes/ProtectedRoutes';
import Sidebar from './components/Sidebar';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuthStore } from './store/authStore';
import { Glasses } from 'lucide-react';

import AdminOrganizations from './pages/Admin/Organizations';
import AdminSettings from './pages/Admin/Settings';
import AdminDashboard from './pages/Admin/AdminDashboard';
import PointOfSale from './pages/Shop/PointOfSale';
import Inventory from './pages/Shop/Inventory';
import Appointments from './pages/Shop/Appointments';
import Finance from './pages/Shop/Finance';
import Orders from './pages/Shop/Orders';
import OpticOrder from './pages/Shop/OpticOrder';
import Customers from './pages/Shop/Customers';
import Settings from './pages/Shop/Settings';
import Labels from './pages/Shop/Labels';

import Dashboard from './pages/Shop/Dashboard';

import PublicLayout from './components/Public/PublicLayout';
import Home from './pages/Public/Home';
import Stores from './pages/Public/Stores';
import Ecommerce from './pages/Public/Ecommerce';

// Corporate Components
import CorporateDashboard from './pages/Corporate/CorporateDashboard';
import CorporateStores from './pages/Corporate/CorporateStores';
import CorporateTransfers from './pages/Corporate/CorporateTransfers';
import CorporateSettings from './pages/Corporate/CorporateSettings';

// Admin components are now imported from pages/Admin

function MainLayout() {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const isPos = location.pathname === '/dashboard/pos';
  const isInventory = location.pathname === '/dashboard/inventory';
  const noPadding = isPos || isInventory;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <header className="bg-white shadow-sm border-b border-gray-100 relative z-20">
        <div className="max-w-full mx-auto py-3 px-4 pl-14 md:pl-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2 tracking-tight">
            <Glasses className="w-6 h-6 text-blue-600 drop-shadow-sm" />
            Vision X Pro
          </h1>
          <div className="flex gap-4 items-center">
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-gray-900">{user?.fullName}</span>
              <span className="text-xs font-semibold text-gray-500">
                {user?.role === 'ShopStaff' ? (user.jobTitle || 'Personel') : user?.role}
              </span>
            </div>
            <div className="h-8 w-px bg-gray-200 mx-2"></div>
            <button onClick={logout} className="text-sm font-semibold text-red-600 hover:text-red-700 transition-colors focus:outline-none bg-red-50 px-3 py-1.5 rounded-lg">Çıkış Yap</button>
          </div>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className={`flex-1 overflow-y-auto ${noPadding ? '' : 'p-6 lg:p-8'}`}>
          <div className="h-full w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

const RoleBasedDashboard = () => {
  const user = useAuthStore((state) => state.user);
  if (user?.role === 'SuperAdmin') return <AdminDashboard />;
  if (user?.role === 'CorporateOwner') return <CorporateDashboard />;
  if (user?.role === 'ShopOwner' || user?.role === 'ShopStaff') return <Dashboard />;
  return <Dashboard />;
};

function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/stores" element={<Stores />} />
          <Route path="/ecommerce" element={<Ecommerce />} />
        </Route>

        {/* All authenticated users */}
        <Route element={<ProtectedRoutes />}>
          <Route path="/dashboard" element={<MainLayout />}>
            <Route index element={<RoleBasedDashboard />} />
            
            {/* SuperAdmin Only */}
            <Route element={<ProtectedRoutes allowedRoles={['SuperAdmin']} />}>
              <Route path="admin/organizations" element={<AdminOrganizations />} />
              <Route path="admin/settings" element={<AdminSettings />} />
            </Route>

            {/* Corporate Owner Only */}
            <Route element={<ProtectedRoutes allowedRoles={['CorporateOwner', 'SuperAdmin']} />}>
              <Route path="corporate/stores" element={<CorporateStores />} />
              <Route path="corporate/transfers" element={<CorporateTransfers />} />
              <Route path="corporate/settings" element={<CorporateSettings />} />
            </Route>
            
            {/* Mağaza — ShopOwner tam erişim, ShopStaff yetkiye göre */}
            <Route element={<ProtectedRoutes allowedRoles={['ShopOwner', 'ShopStaff']} />}>
              <Route element={<ShopRouteGuard segment="pos" />}>
                <Route path="pos" element={<PointOfSale />} />
              </Route>
              <Route element={<ShopRouteGuard segment="optic-order" />}>
                <Route path="optic-order" element={<OpticOrder />} />
              </Route>
              <Route element={<ShopRouteGuard segment="orders" />}>
                <Route path="orders" element={<Orders />} />
              </Route>
              <Route element={<ShopRouteGuard segment="customers" />}>
                <Route path="customers" element={<Customers />} />
              </Route>
              <Route element={<ShopRouteGuard segment="finance" />}>
                <Route path="finance" element={<Finance />} />
              </Route>
              <Route element={<ShopRouteGuard segment="inventory" />}>
                <Route path="inventory" element={<Inventory />} />
              </Route>
              <Route element={<ShopRouteGuard segment="appointments" />}>
                <Route path="appointments" element={<Appointments />} />
              </Route>
              <Route element={<ShopRouteGuard segment="labels" />}>
                <Route path="labels" element={<Labels />} />
              </Route>
            </Route>

            {/* Yalnızca mağaza sahibi */}
            <Route element={<ProtectedRoutes allowedRoles={['ShopOwner']} />}>
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Customer Only */}
            <Route element={<ProtectedRoutes allowedRoles={['Customer']} />}>
              <Route path="my-prescriptions" element={<div>Reçetelerim Yapım Aşamasında</div>} />
              <Route path="my-appointments" element={<div>Randevularım Yapım Aşamasında</div>} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
