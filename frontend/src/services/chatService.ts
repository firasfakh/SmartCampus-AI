// SmartCampus AI — Conversations, session visiteur (SA-25), mémoire (SA-26), rattachement (SA-29).
import { api, ApiError, STORAGE_KEYS, storageGet, storageSet } from './api';
import { Message } from '../types';

export interface ConversationSummary {
  id: string;
  title: string;
  status: 'active' | 'archived' | 'closed';
  ownerType: 'visitor' | 'candidate';
  messageCount: number;
  createdAt: string;
  lastMessageAt: string | null;
}

export interface VisitorUsage {
  conversations: number;
  user_messages: number;
  max_conversations: number;
  max_user_messages: number;
}

export interface VisitorSessionInfo {
  session_id: string;
  expires_at: string;
  usage: VisitorUsage;
}

export interface ConversationMemory {
  window_size: number;
  messages: { role: string; content: string; sequence_no: number }[];
  profile_hints: { interests: string[]; level: string | null; section: string | null };
}

export interface AssistantMeta {
  generator: string;
  intent: string;
  language_detected: string;
  program_codes: string[];
}

type ApiConversation = {
  id: string; title: string; status: ConversationSummary['status'];
  owner_type: 'visitor' | 'candidate'; message_count?: number;
  created_at: string; last_message_at: string | null;
};

type ApiMessage = {
  id: string; role: Message['role']; content: string; created_at: string; sequence_no: number;
};

const toConversation = (c: ApiConversation): ConversationSummary => ({
  id: c.id,
  title: c.title,
  status: c.status,
  ownerType: c.owner_type,
  messageCount: c.message_count ?? 0,
  createdAt: c.created_at,
  lastMessageAt: c.last_message_at,
});

const toMessage = (m: ApiMessage): Message => ({
  id: m.id,
  role: m.role,
  content: m.content,
  timestamp: new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
});

// Partage des appels en cours : deux composants (ou le double rendu de React.StrictMode)
// qui demandent une session en même temps n'en créent qu'une seule.
let pendingVisitorSession: Promise<VisitorSessionInfo> | null = null;

export const chatService = {
  hasVisitorToken(): boolean {
    return !!storageGet(STORAGE_KEYS.visitorToken);
  },

  forgetVisitorSession(): void {
    storageSet(STORAGE_KEYS.visitorToken, null);
  },

  /** État de la session visiteur stockée, ou null si absente / expirée / déjà rattachée. */
  async getVisitorSession(): Promise<VisitorSessionInfo | null> {
    if (!this.hasVisitorToken()) return null;
    try {
      return await api.get<VisitorSessionInfo>('/sessions/visitor/me');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        this.forgetVisitorSession();
        return null;
      }
      throw error;
    }
  },

  /** SA-25 — garantit une session visiteur valide (si l'utilisateur n'est pas connecté). */
  ensureVisitorSession(): Promise<VisitorSessionInfo> {
    if (!pendingVisitorSession) {
      pendingVisitorSession = (async () => {
        const existing = await this.getVisitorSession();
        if (existing) return existing;
        const created = await api.post<{ session_token: string }>('/sessions/visitor');
        storageSet(STORAGE_KEYS.visitorToken, created.session_token);
        const info = await this.getVisitorSession();
        if (!info) throw new Error('La session visiteur n’a pas pu être créée.');
        return info;
      })().finally(() => { pendingVisitorSession = null; });
    }
    return pendingVisitorSession;
  },

  async listConversations(): Promise<ConversationSummary[]> {
    return (await api.get<ApiConversation[]>('/conversations/')).map(toConversation);
  },

  async createConversation(title?: string): Promise<ConversationSummary> {
    return toConversation(await api.post<ApiConversation>('/conversations/', title ? { title } : {}));
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    return (await api.get<ApiMessage[]>(`/conversations/${conversationId}/messages`)).map(toMessage);
  },

  async getMemory(conversationId: string): Promise<ConversationMemory> {
    return api.get<ConversationMemory>(`/conversations/${conversationId}/memory`);
  },

  async archiveConversation(conversationId: string): Promise<void> {
    await api.patch(`/conversations/${conversationId}`, { status: 'archived' });
  },

  /** Envoie le message et renvoie le message utilisateur + la réponse de l'assistant. */
  async sendMessage(conversationId: string, content: string): Promise<{
    conversation: ConversationSummary; userMessage: Message; assistantMessage: Message; meta: AssistantMeta;
  }> {
    const r = await api.post<{
      conversation: ApiConversation; user_message: ApiMessage; assistant_message: ApiMessage; assistant: AssistantMeta;
    }>(`/conversations/${conversationId}/messages`, { content });
    return {
      conversation: toConversation(r.conversation),
      userMessage: toMessage(r.user_message),
      assistantMessage: toMessage(r.assistant_message),
      meta: r.assistant,
    };
  },

  /** SA-29 — rattache l'historique visiteur au compte candidat connecté (consentement explicite). */
  async claimVisitorHistory(consent: boolean): Promise<{ transferred_conversations: number }> {
    const result = await api.post<{ transferred_conversations: number }>(
      '/sessions/visitor/claim', { consent },
    );
    this.forgetVisitorSession(); // le backend révoque l'ancien jeton
    return result;
  },
};
