import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, GraduationCap, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/Button';
import { demoUniversities, demoFaculties } from '../data/demoData';

export function ProfilePage() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  if (!profile) return null;

  const university = demoUniversities.find((u) => u.id === profile.university_id);
  const faculty = demoFaculties.find((f) => f.id === profile.faculty_id);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="px-4 pt-4 pb-6 md:px-6 md:pt-6 md:max-w-lg md:mx-auto">
      <h1 className="mb-5 text-xl font-bold text-ink">Perfil</h1>

      <div className="flex items-center gap-3 rounded-card border border-ink/8 bg-white p-4 shadow-card">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-secondary-light text-xl font-bold text-secondary">
          {profile.full_name[0]?.toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="text-base font-semibold text-ink truncate">{profile.full_name}</p>
          <p className="text-sm text-ink/50 truncate">{profile.email}</p>
          <span className="mt-1 inline-flex items-center rounded-full bg-primary-light px-2 py-0.5 text-xs font-medium text-primary-dark capitalize">
            {profile.role}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-col divide-y divide-ink/6 rounded-card border border-ink/8 bg-white shadow-card">
        <InfoRow icon={<GraduationCap size={16} />} label="Universidad" value={university?.name ?? '—'} />
        <InfoRow icon={<ShieldCheck size={16} />} label="Facultad" value={faculty?.name ?? '—'} />
        <InfoRow icon={<Mail size={16} />} label="Correo institucional" value={profile.email} />
      </div>

      {profile.role === 'emprendedor' && (
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-4 flex w-full items-center justify-between rounded-card border border-ink/8 bg-white p-4 shadow-card hover:bg-ink/5 transition-colors"
        >
          <span className="flex items-center gap-3 text-sm font-medium text-ink">
            <span className="flex h-9 w-9 items-center justify-center rounded-control bg-accent-light text-accent">
              <LayoutDashboard size={17} />
            </span>
            Panel del emprendedor
          </span>
          <span className="text-ink/30">›</span>
        </button>
      )}

      <Button variant="outline" fullWidth className="mt-6" icon={<LogOut size={16} />} onClick={handleLogout}>
        Cerrar sesión
      </Button>
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
