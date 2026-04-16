import { Outlet } from 'react-router-dom';
import PublicHeader from './PublicHeader';
import PublicFooter from './PublicFooter';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <PublicHeader />
      <main className="flex-1 max-w-full overflow-hidden w-full">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
