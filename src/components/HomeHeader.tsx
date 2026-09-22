import { useNavigate } from 'react-router-dom';
import { Search, User } from 'lucide-react';
import { BrandMark } from './BrandMark';
import { useAuth } from '../hooks/useAuth';
import { NotificationBell } from './NotificationBell';
import { MessagesIcon } from './MessagesIcon';

export function HomeHeader() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const firstName = profile?.full_name?.trim().split(' ')[0];

  return (
    <div className="md:hidden relative overflow-hidden rounded-b-[38px] bg-primary px-5 pb-6 pt-5 text-white">
      <div className="pointer-events-none absolute -right-14 -top-16 h-52 w-52 rounded-full bg-white/[0.07]" />
      <div className="pointer-events-none absolute right-8 top-24 h-[70px] w-[70px] rounded-full bg-accent/90" />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <BrandMark size={36} className="rounded-[22%] ring-1 ring-white/25" />
          <span className="font-serif text-[22px] font-bold tracking-tight">UniHub</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MessagesIcon tone="light" />
          <NotificationBell tone="light" />
          <button
            onClick={() => navigate('/profile')}
            aria-label="Mi perfil"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-sm font-semibold text-primary"
          >
            {profile?.full_name?.[0]?.toUpperCase() ?? <User size={16} />}
          </button>
        </div>
      </div>

      <p className="relative mt-5 text-sm font-medium text-white/75">
        {firstName ? `Hola, ${firstName}` : 'Hola'}
      </p>
      <h1 className="relative mt-1 max-w-[16rem] font-serif text-[27px] font-semibold leading-[1.12] tracking-tight">
        Lo que emprende tu universidad
      </h1>

      <button
        onClick={() => navigate('/search')}
        className="relative mt-4 flex min-h-[50px] w-full items-center gap-2.5 rounded-2xl bg-white px-4 text-left text-[15px] text-ink/50 shadow-[0_8px_20px_rgba(20,32,18,0.25)]"
      >
        <Search size={18} />
        ¿Qué estás buscando?
      </button>
    </div>
  );
}
