import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { chatService } from '../services/chatService';
import type { Conversation } from '../types';
import { ImagePlaceholder } from '../components/ImagePlaceholder';
import { EmptyState } from '../components/StateViews';
import { formatDateTime } from '../utils/format';

export function ConversationsPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    chatService.listForUser(profile.id).then((list) => {
      setConversations(list);
      setLoading(false);
    });
  }, [profile]);

  const isSellerSide = (c: Conversation) => c.buyer_id !== profile?.id;

  return (
    <div className="px-4 pt-4 pb-8 md:px-6 md:pt-6 md:max-w-2xl md:mx-auto">
      <h1 className="mb-5 font-serif text-2xl font-semibold text-ink">Mensajes</h1>

      {loading && (
        <div className="flex flex-col gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-card bg-white/60" />
          ))}
        </div>
      )}

      {!loading && conversations.length === 0 && (
        <EmptyState
          icon={<MessageCircle size={22} />}
          title="Aún no tienes conversaciones."
          description="Escríbele a un emprendimiento desde su perfil para empezar a chatear."
        />
      )}

      {!loading && conversations.length > 0 && (
        <div className="flex flex-col gap-2">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => navigate(`/messages/${c.id}`)}
              className="flex w-full items-center gap-3 rounded-card border border-ink/8 bg-white p-3.5 text-left shadow-card hover:bg-ink/5 transition-colors"
            >
              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-surface">
                {c.business?.logo?.trim() ? (
                  <img src={c.business.logo} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImagePlaceholder category="otros" className="h-full w-full" iconSize={16} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink truncate">
                  {isSellerSide(c) ? c.buyer?.full_name ?? 'Estudiante' : c.business?.name ?? 'Emprendimiento'}
                </p>
                <p className="text-xs text-ink/40">{formatDateTime(c.last_message_at)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
