import { useNavigate } from 'react-router-dom';
import { useState, type ReactNode } from 'react';
import { ArrowLeft, User, Mail, Bell, HelpCircle, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { areNotificationsMuted, setNotificationsMuted } from '../utils/notificationPrefs';

export function SettingsPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [muted, setMuted] = useState(areNotificationsMuted());

  if (!profile) return null;

  const handleToggleMuted = () => {
    const next = !muted;
    setMuted(next);
    setNotificationsMuted(next);
  };

  return (
    <div className="px-4 pt-4 pb-8 md:px-6 md:pt-6 md:max-w-lg md:mx-auto">
      <div className="mb-5 flex items-center gap-2">
        <button
          onClick={() => navigate('/profile')}
          className="flex h-9 w-9 items-center justify-center rounded-control text-ink/60 hover:bg-ink/5"
          aria-label="Volver a perfil"
        >
          <ArrowLeft size={19} />
        </button>
        <h1 className="font-serif text-2xl font-semibold text-ink">Ajustes</h1>
      </div>

      <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-ink/40">Cuenta</p>
      <div className="flex flex-col divide-y divide-ink/6 rounded-card-lg border border-ink/8 bg-white shadow-card overflow-hidden">
        <InfoRow icon={<User size={17} />} label="Nombre" value={profile.full_name} />
        <InfoRow icon={<Mail size={17} />} label="Correo" value={profile.email} />
      </div>

      <p className="mb-2 mt-6 px-1 text-xs font-semibold uppercase tracking-wide text-ink/40">
        Notificaciones
      </p>
      <div className="rounded-card-lg border border-ink/8 bg-white p-4 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-control bg-surface text-ink/50">
              <Bell size={17} />
            </span>
            <div>
              <p className="text-sm font-medium text-ink">Silenciar notificaciones</p>
              <p className="mt-0.5 text-xs text-ink/50">En este dispositivo</p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={muted}
            onClick={handleToggleMuted}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
              muted ? 'bg-primary' : 'bg-ink/15'
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow-card transition-transform duration-200 ${
                muted ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      <p className="mb-2 mt-6 px-1 text-xs font-semibold uppercase tracking-wide text-ink/40">
        Soporte
      </p>
      <div className="rounded-card-lg border border-ink/8 bg-white shadow-card overflow-hidden">
        <button
          onClick={() => navigate('/help')}
          className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-ink/5"
        >
          <span className="flex items-center gap-3 text-sm font-medium text-ink">
            <span className="flex h-9 w-9 items-center justify-center rounded-control bg-surface text-ink/50">
              <HelpCircle size={17} />
            </span>
            Ayuda
          </span>
          <ChevronRight size={16} className="text-ink/30" />
        </button>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-control bg-surface text-ink/50">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-ink/40">{label}</p>
        <p className="text-sm font-medium text-ink truncate">{value}</p>
      </div>
    </div>
  );
}
