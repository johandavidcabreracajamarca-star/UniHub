import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { chatService } from '../services/chatService';
import type { Conversation, Message } from '../types';
import { RowSkeleton } from '../components/StateViews';

const POLL_MS = 8000;

export function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    if (!id || !profile) return;
    const [list, conversations] = await Promise.all([
      chatService.listMessages(id),
      chatService.listForUser(profile.id),
    ]);
    setMessages(list);
    setConversation(conversations.find((c) => c.id === id) ?? null);
    setLoading(false);
    await chatService.markRead(id, profile.id);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, profile]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !profile || !text.trim() || sending) return;
    setSending(true);
    setError(null);
    const { error } = await chatService.send(id, profile.id, text);
    setSending(false);
    if (error) {
      setError(error);
      return;
    }
    setText('');
    load();
  };

  if (loading) return <RowSkeleton count={3} />;

  const isSellerSide = conversation && conversation.buyer_id !== profile?.id;
  const title = isSellerSide
    ? conversation?.buyer?.full_name ?? 'Estudiante'
    : conversation?.business?.name ?? 'Emprendimiento';

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col md:h-[calc(100vh-64px)] md:max-w-2xl md:mx-auto">
      <div className="flex items-center gap-2 border-b border-ink/8 bg-white px-4 py-3">
        <button
          onClick={() => navigate('/messages')}
          className="flex h-9 w-9 items-center justify-center rounded-control text-ink/60 hover:bg-ink/5"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-base font-semibold text-ink truncate">{title}</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-2">
          {messages.map((m) => {
            const mine = m.sender_id === profile?.id;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-card px-3.5 py-2 text-sm ${
                    mine ? 'bg-primary text-white' : 'bg-white border border-ink/8 text-ink'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="border-t border-ink/8 bg-white p-3">
        {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe un mensaje…"
            className="flex-1 rounded-control border border-ink/15 bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/35 focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
