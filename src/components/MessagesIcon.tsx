import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { chatService } from '../services/chatService';
import { areNotificationsMuted } from '../utils/notificationPrefs';

const POLL_MS = 60000;

export function MessagesIcon() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!profile) return;
    const refresh = () => {
      if (areNotificationsMuted()) {
        setUnread(0);
        return;
      }
      chatService.countUnread(profile.id).then(setUnread);
    };
    refresh();
    const interval = setInterval(refresh, POLL_MS);
    return () => clearInterval(interval);
  }, [profile]);

  if (!profile) return null;

  return (
    <button
      onClick={() => navigate('/messages')}
      className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink/60 hover:bg-ink/5"
      aria-label="Mensajes"
    >
      <MessageCircle size={18} />
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  );
}
