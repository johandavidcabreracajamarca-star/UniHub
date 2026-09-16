import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { notificationService } from '../services/notificationService';
import { EmptyState } from './StateViews';
import type { Notification } from '../types';
import { formatDateTime } from '../utils/format';
import { areNotificationsMuted } from '../utils/notificationPrefs';

const POLL_MS = 60000;

export function NotificationBell() {
  const { profile } = useAuth();
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
    return () => clearInterval(interval);
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
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink/60 hover:bg-ink/5"
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
        <div className="absolute right-0 z-50 mt-2 max-h-96 w-80 max-w-[90vw] overflow-y-auto rounded-card border border-ink/8 bg-white shadow-card-hover">
          <div className="border-b border-ink/8 px-4 py-3">
            <p className="text-sm font-semibold text-ink">Notificaciones</p>
          </div>

          {loading && <p className="px-4 py-6 text-center text-sm text-ink/40">Cargando...</p>}

          {!loading && notifications.length === 0 && (
            <EmptyState
              icon={<Bell size={20} />}
              title="No tienes notificaciones."
              description="Aquí verás avisos cuando cambien tus pedidos."
            />
          )}

          {!loading &&
            notifications.map((n) => (
              <div key={n.id} className="border-b border-ink/5 px-4 py-3 last:border-0">
                <p className="text-sm text-ink">{n.message}</p>
                <p className="mt-0.5 text-xs text-ink/40">{formatDateTime(n.created_at)}</p>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
