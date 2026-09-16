import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { demoDb } from '../data/demoDb';
import { containsContactInfo } from '../utils/contactFilter';
import type { Business, Conversation, Message } from '../types';

export const chatService = {
  async getOrCreate(
    buyerId: string,
    businessId: string
  ): Promise<{ conversation: Conversation | null; error: string | null }> {
    if (isSupabaseConfigured && supabase) {
      const { data: existing } = await supabase
        .from('conversations')
        .select('*')
        .eq('buyer_id', buyerId)
        .eq('business_id', businessId)
        .maybeSingle();
      if (existing) return { conversation: existing as Conversation, error: null };

      const { data, error } = await supabase
        .from('conversations')
        .insert({ buyer_id: buyerId, business_id: businessId })
        .select()
        .single();
      if (error) return { conversation: null, error: error.message };
      return { conversation: data as Conversation, error: null };
    }

    const conversations = demoDb.getConversations();
    let conv = conversations.find((c) => c.buyer_id === buyerId && c.business_id === businessId);
    if (!conv) {
      conv = {
        id: `conv-${Date.now()}`,
        buyer_id: buyerId,
        business_id: businessId,
        created_at: new Date().toISOString(),
        last_message_at: new Date().toISOString(),
      };
      conversations.unshift(conv);
      demoDb.saveConversations(conversations);
    }
    return { conversation: conv, error: null };
  },

  async listForUser(userId: string): Promise<Conversation[]> {
    if (isSupabaseConfigured && supabase) {
      // La política conversations_select_participants ya limita esto a las
      // conversaciones donde el usuario es comprador o dueño del negocio,
      // así que no hace falta filtrar nada más aquí.
      const { data } = await supabase
        .from('conversations')
        .select('*, businesses(name, logo)')
        .order('last_message_at', { ascending: false });

      const rows =
        (data as (Conversation & { businesses?: { name: string; logo: string | null } | null })[]) ?? [];

      const buyerIds = [...new Set(rows.map((r) => r.buyer_id))];
      const { data: buyerProfiles } = buyerIds.length
        ? await supabase.from('profiles').select('id, full_name').in('id', buyerIds)
        : { data: [] as { id: string; full_name: string }[] };
      const nameById = new Map((buyerProfiles ?? []).map((p) => [p.id, p.full_name]));

      return rows.map((r) => ({
        ...r,
        business: r.businesses ? { name: r.businesses.name, logo: r.businesses.logo } : undefined,
        buyer: { full_name: nameById.get(r.buyer_id) ?? 'Estudiante' },
      }));
    }

    const conversations = demoDb.getConversations();
    const businesses = demoDb.getBusinesses();
    return conversations
      .filter(
        (c) =>
          c.buyer_id === userId ||
          businesses.find((b: Business) => b.id === c.business_id)?.owner_id === userId
      )
      .map((c) => ({ ...c, business: businesses.find((b: Business) => b.id === c.business_id) }))
      .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
  },

  async listMessages(conversationId: string): Promise<Message[]> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      return (data as Message[]) ?? [];
    }
    return demoDb
      .getMessages()
      .filter((m) => m.conversation_id === conversationId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },

  async send(conversationId: string, senderId: string, content: string): Promise<{ error: string | null }> {
    const trimmed = content.trim();
    if (!trimmed) return { error: 'Escribe un mensaje.' };

    const contactIssue = containsContactInfo(trimmed);
    if (contactIssue) return { error: contactIssue };

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: trimmed,
      });
      return { error: error ? error.message : null };
    }

    const messages = demoDb.getMessages();
    messages.push({
      id: `msg-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: senderId,
      content: trimmed,
      created_at: new Date().toISOString(),
      read: false,
    });
    demoDb.saveMessages(messages);

    const conversations = demoDb.getConversations();
    const idx = conversations.findIndex((c) => c.id === conversationId);
    if (idx !== -1) {
      conversations[idx] = { ...conversations[idx], last_message_at: new Date().toISOString() };
      demoDb.saveConversations(conversations);
    }
    return { error: null };
  },

  async markRead(conversationId: string, userId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .eq('read', false);
      return;
    }
    const messages = demoDb.getMessages();
    const updated = messages.map((m) =>
      m.conversation_id === conversationId && m.sender_id !== userId ? { ...m, read: true } : m
    );
    demoDb.saveMessages(updated);
  },

  async countUnread(userId: string): Promise<number> {
    const conversations = await chatService.listForUser(userId);
    if (conversations.length === 0) return 0;

    if (isSupabaseConfigured && supabase) {
      const ids = conversations.map((c) => c.id);
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .in('conversation_id', ids)
        .neq('sender_id', userId)
        .eq('read', false);
      return count ?? 0;
    }

    const messages = demoDb.getMessages();
    const ids = new Set(conversations.map((c) => c.id));
    return messages.filter((m) => ids.has(m.conversation_id) && m.sender_id !== userId && !m.read).length;
  },
};
