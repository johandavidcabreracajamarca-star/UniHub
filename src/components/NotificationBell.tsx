import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Package, Store } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { notificationService } from '../services/notificationService';
import { EmptyState } from './StateViews';
import type { Notification } from '../types';
import { formatDateTime } from '../utils/format';
import { areNotificationsMuted } from '../utils/notificationPrefs';

const POLL_MS = 60000;

export function NotificationBell({ tone = 'default' }: { tone?: 'default' | 'light' }) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const refreshUnread = async () => {
    if (!profile) return;
    if (areNotificationsMuted()) {
      setUnread(0);
      return;
    }
    setUnread(await notificationService.countUnread(profile.id));
  };

  useEffect(() => {
    refreshUnread();
    const interval = setInterval(refreshUnread, POLL_MS);
    // Al volver a la app (p. ej. después de tocar un aviso) actualizamos de una vez
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshUnread();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next && profile) {
      setLoading(true);
      const list = await notificationService.listByUser(profile.id);
      setNotifications(list);
      setLoading(false);
      if (unread > 0) {
        await notificationService.markAllAsRead(profile.id);
        setUnread(0);
      }
    }
  };

  if (!profile) return null;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={handleOpen}
        className={`relative flex items-center justify-center rounded-full ${
        tone === 'light' ? 'h-10 w-10 bg-white/15 text-white hover:bg-white/25' : 'h-9 w-9 text-ink/60 hover:bg-ink/5'
      }`}
        aria-label="Notificaciones"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-4 top-[72px] z-50 max-h-[70vh] overflow-y-auto rounded-card md:absolute md:inset-x-auto md:right-0 md:top-auto md:mt-2 md:max-h-96 md:w-80 border border-ink/8 bg-white shadow-card-hover">
          <div className="border-b border-ink/8 px-4 py-3">
            <p className="text-sm font-semibold text-ink">Notificaciones</p>
          </div>

          {loading && <p className="px-4 py-6 text-center text-sm text-ink/40">Cargando...</p>}

          {!loading && notifications.length === 0 && (
            <EmptyState
              icon={<Bell size={20} />}
              title="No tienes notificaciones."
              description="Aquí verás avisos de tus pedidos y de tus ventas."
            />
          )}

          {!loading &&
            notifications.map((n) => {
              const link = n.link?.startsWith('/') ? n.link : '/orders';
              const isSale = link.startsWith('/dashboard');
              const Icon = isSale ? Store : Package;
              return (
                <button
                  key={n.id}
                  onClick={() => {
                    setOpen(false);
                    navigate(link);
                  }}
                  className="flex w-full items-start gap-3 border-b border-ink/5 px-4 py-3 text-left transition-colors last:border-0 hover:bg-ink/5"
                >
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      isSale ? 'bg-accent-light text-accent-dark' : 'bg-primary-light text-primary'
                    }`}
                  >
                    <Icon size={15} />
                  </span>
                  <span className="min-w-0">
                    {isSale && <span className="block text-xs font-semibold text-accent-dark">¡Nueva venta!</span>}
                    <span className="block text-sm text-ink">{n.message}</span>
                    <span className="mt-0.5 block text-xs text-ink/40">{formatDateTime(n.created_at)}</span>
                  </span>
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
}
