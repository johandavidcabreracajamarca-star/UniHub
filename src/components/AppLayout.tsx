import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { TopNav } from './TopNav';
import { Onboarding } from './Onboarding';
import { onboardingSeen } from '../utils/onboarding';
import { PushWelcome } from './PushPrompt';
import { useAuth } from '../hooks/useAuth';
import { pushService } from '../services/pushService';
import { LoadingScreen } from './LoadingScreen';

export function AppLayout() {
  const { profile, loading } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState(onboardingSeen);

  // Si este celular tiene los avisos activados, quedan a nombre de quien entró
  useEffect(() => {
    if (profile?.id) pushService.syncThisDevice().catch(() => {});
  }, [profile?.id]);

  // Las páginas públicas también esperan a saber si hay sesión, para no
  // mostrar "Entrar" un instante a quien ya inició sesión
  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-surface">
      <TopNav />
      <main className="mx-auto max-w-desktop pb-32 md:pb-10">
        <Outlet />
      </main>
      <BottomNav />
      {/* La bienvenida y la invitación a los avisos son para quien ya tiene
          cuenta; a quien llega sin cuenta (p. ej. por un link) no lo interrumpimos */}
      {profile && <Onboarding onDone={() => setOnboardingDone(true)} />}
      {profile && onboardingDone && <PushWelcome />}
    </div>
  );
}
