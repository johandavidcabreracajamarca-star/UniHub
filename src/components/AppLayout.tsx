import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { TopNav } from './TopNav';
import { Onboarding } from './Onboarding';
import { useAuth } from '../hooks/useAuth';
import { pushService } from '../services/pushService';

export function AppLayout() {
  const { profile } = useAuth();

  // Si este celular tiene los avisos activados, quedan a nombre de quien entró
  useEffect(() => {
    if (profile?.id) pushService.syncThisDevice().catch(() => {});
  }, [profile?.id]);

  return (
    <div className="min-h-screen bg-surface">
      <TopNav />
      <main className="mx-auto max-w-desktop pb-32 md:pb-10">
        <Outlet />
      </main>
      <BottomNav />
      <Onboarding />
    </div>
  );
}
