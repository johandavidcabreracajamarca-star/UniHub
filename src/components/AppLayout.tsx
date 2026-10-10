import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { TopNav } from './TopNav';
import { Onboarding } from './Onboarding';
import { onboardingSeen } from '../utils/onboarding';
import { PushWelcome } from './PushPrompt';
import { useAuth } from '../hooks/useAuth';
import { pushService } from '../services/pushService';

export function AppLayout() {
  const { profile } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState(onboardingSeen);

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
      <Onboarding onDone={() => setOnboardingDone(true)} />
      {/* Después de la bienvenida, invitamos a activar los avisos (una sola vez) */}
      {onboardingDone && <PushWelcome />}
    </div>
  );
}
