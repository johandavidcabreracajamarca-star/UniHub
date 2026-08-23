import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { TopNav } from './TopNav';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-surface">
      <TopNav />
      <main className="mx-auto max-w-desktop pb-24 md:pb-10">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
