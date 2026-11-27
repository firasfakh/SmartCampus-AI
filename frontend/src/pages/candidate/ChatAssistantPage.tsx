// SmartCampus AI — Assistant d'orientation.
// SA-24/25 : utilisable sans compte (session visiteur) · SA-26 : historique et mémoire réels
// SA-29 : rattachement de l'historique visiteur après connexion.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Archive, Bot, Compass, History, Info, Loader2, Mic, Plus, Send, Sparkles, User, UserPlus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ApiError, errorMessage } from '../../services/api';
import {
  chatService, ConversationMemory, ConversationSummary, VisitorSessionInfo,
} from '../../services/chatService';
import { Message } from '../../types';

interface ChatAssistantPageProps {
  onNavigate: (page: string) => void;
}

const SUGGESTIONS = [
  'Quelles formations proposez-vous ?',
  "J'ai un bac math et j'aime l'informatique",
  'Quels sont les frais du cycle ingénieur en génie informatique ?',
  "Conditions d'admission en génie civil ?",
  'Quels débouchés pour le master finance ?',
];

export const ChatAssistantPage: React.FC<ChatAssistantPageProps> = ({ onNavigate }) => {
  const { user, role, isLoading: authLoading, pendingClaim } = useAuth();
  const { error: toastError } = useToast();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [memory, setMemory] = useState<ConversationMemory | null>(null);
  const [visitor, setVisitor] = useState<VisitorSessionInfo | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [fatal, setFatal] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const isVisitor = !user;
  const isStaff = !!user && role !== 'candidate';

  const refreshVisitor = useCallback(async () => {
    if (isVisitor) setVisitor(await chatService.getVisitorSession());
  }, [isVisitor]);

  const openConversation = useCallback(async (id: string) => {
    setActiveId(id);
    setBlocked(null);
    const [msgs, mem] = await Promise.all([chatService.getMessages(id), chatService.getMemory(id)]);
    setMessages(msgs);
    setMemory(mem);
  }, []);

  // Un seul chargement à la fois (React.StrictMode exécute les effets deux fois en développement).
  const loadingRef = useRef(false);

  /** Chargement initial : session visiteur si besoin, puis conversations. */
  const load = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setFatal(null);
    try {
      if (isVisitor) setVisitor(await chatService.ensureVisitorSession());
      let list = await chatService.listConversations();
      if (list.length === 0) list = [await chatService.createConversation()];
      setConversations(list);
      const first = list.find(c => c.status === 'active') || list[0];
      await openConversation(first.id);
    } catch (e) {
      setFatal(errorMessage(e));
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [isVisitor, openConversation]);

  useEffect(() => {
    if (authLoading || isStaff) return;
    void load();
    // Recharger quand l'utilisateur se connecte / se déconnecte, ou après un rattachement.
  }, [authLoading, isStaff, user?.id, pendingClaim === null, load]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const activeConversation = conversations.find(c => c.id === activeId) || null;

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || !activeId || sending) return;
    setInput('');
    setSending(true);
    // Affichage immédiat du message (optimiste), remplacé par la version serveur.
    const tempId = `tmp-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: tempId, role: 'user', content,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    }]);
    try {
      const r = await chatService.sendMessage(activeId, content);
      setMessages(prev => [...prev.filter(m => m.id !== tempId), r.userMessage, r.assistantMessage]);
      setConversations(prev => [
        { ...r.conversation, messageCount: (prev.find(c => c.id === activeId)?.messageCount ?? 0) + 2 },
        ...prev.filter(c => c.id !== activeId),
      ]);
      setMemory(await chatService.getMemory(activeId));
      void refreshVisitor();
    } catch (e) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInput(content);
      if (e instanceof ApiError && e.status === 429) setBlocked(e.message);
      else if (e instanceof ApiError && e.status === 401 && isVisitor) {
        chatService.forgetVisitorSession();
        toastError('Session visiteur expirée', 'Une nouvelle session a été créée.');
        void load();
      } else toastError('Message non envoyé', errorMessage(e));
    } finally {
      setSending(false);
    }
  };

  const handleNewConversation = async () => {
    try {
      const created = await chatService.createConversation();
      setConversations(prev => [created, ...prev]);
      setMessages([]);
      setMemory(null);
      setActiveId(created.id);
      setBlocked(null);
      void refreshVisitor();
    } catch (e) {
      if (e instanceof ApiError && e.status === 429) setBlocked(e.message);
      else toastError('Création impossible', errorMessage(e));
    }
  };

  const handleArchive = async () => {
    if (!activeId) return;
    try {
      await chatService.archiveConversation(activeId);
      setConversations(prev => prev.map(c => (c.id === activeId ? { ...c, status: 'archived' } : c)));
    } catch (e) {
      toastError('Archivage impossible', errorMessage(e));
    }
  };

  // ------------------------------------------------------------------ rendus particuliers

  if (isStaff) {
    return (
      <div className="max-w-lg mx-auto my-16 p-6 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
        <Info className="w-8 h-8 text-sky-600 mx-auto" />
        <h2 className="font-bold text-navy-900">Assistant réservé aux candidats</h2>
        <p className="text-sm text-slate-600">
          Les comptes internes consultent les échanges des candidats depuis leur espace de travail.
        </p>
      </div>
    );
  }

  if (loading || authLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center text-slate-500 gap-2 text-sm">
        <Loader2 className="w-5 h-5 animate-spin" /> Chargement de l'assistant…
      </div>
    );
  }

  if (fatal) {
    return (
      <div className="max-w-lg mx-auto my-16 p-6 bg-white rounded-2xl border border-red-200 text-center space-y-3">
        <h2 className="font-bold text-red-700">Assistant indisponible</h2>
        <p className="text-sm text-slate-600">{fatal}</p>
        <button onClick={() => void load()} className="px-4 py-2 rounded-lg bg-navy-900 text-white text-xs font-bold">
          Réessayer
        </button>
      </div>
    );
  }

  const usage = visitor?.usage;
  const isArchived = activeConversation?.status !== 'active';
  const hints = memory?.profile_hints;

  return (
    <div className="h-[calc(100vh-4rem)] bg-slate-100 flex overflow-hidden">
      {/* Colonne gauche : conversations + mémoire */}
      <aside className="w-80 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          <button
            onClick={handleNewConversation}
            className="w-full py-2.5 px-4 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> Nouvelle conversation
          </button>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" /> Historique
            </h4>
            <div className="space-y-1">
              {conversations.map(c => (
                <button
                  key={c.id}
                  onClick={() => void openConversation(c.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition flex items-center justify-between gap-2 ${
                    c.id === activeId ? 'bg-sky-50 text-navy-900 font-bold border border-sky-100' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">{c.title}</span>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {c.status !== 'active' ? 'archivée' : `${c.messageCount} msg`}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* SA-26 : mémoire de travail réelle, extraite des messages */}
          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-sky-600" /> Ce que l'assistant a retenu
            </h4>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-[11px] space-y-2">
              <MemoryRow label="Niveau" value={hints?.level} />
              <MemoryRow label="Section" value={hints?.section} />
              <MemoryRow label="Centres d'intérêt" value={hints?.interests.join(', ')} />
              <p className="text-[10px] text-slate-400 pt-1">
                Indices déduits de vos messages ({memory?.messages.length ?? 0}/{memory?.window_size ?? 20} derniers
                messages en mémoire), à confirmer dans votre profil.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-500 space-y-2">
          {isVisitor ? (
            <>
              <p>
                Mode visiteur{usage ? ` · ${usage.user_messages}/${usage.max_user_messages} messages` : ''}
                {visitor ? ` · expire le ${new Date(visitor.expires_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}` : ''}
              </p>
              <button
                onClick={() => onNavigate('register')}
                className="w-full py-2 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-navy-900 font-semibold text-xs flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5 text-teal-600" /> Créer un compte pour garder l'historique
              </button>
            </>
          ) : (
            <button
              onClick={() => onNavigate('recommendations')}
              className="w-full py-2 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-navy-900 font-semibold text-xs flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" /> Voir mes recommandations
            </button>
          )}
        </div>
      </aside>

      {/* Zone principale */}
      <section className="flex-1 flex flex-col h-full min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-navy-900 text-sky-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-bold text-navy-900 truncate">
                {activeConversation?.title || 'Conseiller virtuel SmartCampus AI'}
              </h2>
              <p className="text-[10px] text-amber-700" title="L'agent IA (LangGraph + RAG) remplacera ce moteur provisoire.">
                Version provisoire : réponses issues du catalogue IIT &amp; ISB
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Sélecteur mobile */}
            <select
              className="md:hidden text-xs border border-slate-200 rounded-lg px-2 py-1 max-w-[9rem]"
              value={activeId ?? ''}
              onChange={e => void openConversation(e.target.value)}
              aria-label="Conversation"
            >
              {conversations.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <button onClick={handleNewConversation} className="md:hidden p-2 rounded-lg border border-slate-200" aria-label="Nouvelle conversation">
              <Plus className="w-4 h-4" />
            </button>
            {!isArchived && messages.length > 0 && (
              <button onClick={handleArchive} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50" title="Archiver la conversation">
                <Archive className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 && (
            <div className="max-w-xl mx-auto text-center space-y-4 pt-6">
              <div className="w-12 h-12 rounded-2xl bg-navy-900 text-teal-400 flex items-center justify-center mx-auto">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-navy-900">Bonjour ! Comment puis-je vous orienter ?</h3>
              <p className="text-xs text-slate-500">
                Posez vos questions sur les formations, les frais, les conditions d'admission ou les débouchés.
                {isVisitor && ' Aucun compte n’est nécessaire pour commencer.'}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => void handleSend(s)}
                    disabled={sending || isArchived}
                    className="text-[11px] px-3 py-1.5 rounded-full bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50 text-slate-700 transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}

          {sending && (
            <div className="flex gap-3 max-w-md mr-auto">
              <div className="w-8 h-8 rounded-xl bg-navy-900 text-teal-400 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {blocked && (
          <div className="mx-4 mb-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>{blocked}</span>
            {isVisitor && (
              <button onClick={() => onNavigate('register')} className="px-3 py-1.5 rounded-lg bg-navy-900 text-white font-bold shrink-0">
                Créer mon compte
              </button>
            )}
          </div>
        )}

        <div className="p-4 bg-white border-t border-slate-200">
          <form
            className="max-w-4xl mx-auto flex items-center gap-2"
            onSubmit={e => { e.preventDefault(); void handleSend(); }}
          >
            <button
              type="button"
              disabled
              className="p-2.5 rounded-xl border bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed"
              title="Bientôt : questions à la voix (transcription Whisper)"
              aria-label="Saisie vocale (bientôt disponible)"
            >
              <Mic className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              maxLength={4000}
              disabled={isArchived}
              placeholder={isArchived ? 'Conversation archivée : créez-en une nouvelle.' : 'Posez votre question (français, tunisien ou arabizi)…'}
              className="flex-1 py-2.5 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending || isArchived}
              className="p-2.5 bg-navy-900 hover:bg-navy-800 disabled:opacity-40 text-white rounded-xl transition"
              aria-label="Envoyer"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
          <p className="text-[10px] text-center text-slate-400 mt-2">
            Les informations données sont indicatives ; les décisions d'admission sont toujours validées par un responsable.
          </p>
        </div>
      </section>
    </div>
  );
};

const MemoryRow: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
  <div className="flex justify-between gap-2">
    <span className="text-slate-500 shrink-0">{label} :</span>
    <span className={`text-right font-semibold ${value ? 'text-navy-900' : 'text-slate-300'}`}>{value || '—'}</span>
  </div>
);

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === 'user';
  return (
    <div className={`flex gap-3 max-w-2xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
        isUser ? 'bg-sky-600 text-white' : 'bg-navy-900 text-teal-400'
      }`}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
        isUser ? 'bg-sky-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-200'
      }`}>
        <p className="whitespace-pre-line break-words">{message.content}</p>
        <div className={`mt-2 text-[10px] text-right ${isUser ? 'text-sky-200' : 'text-slate-400'}`}>
          {message.timestamp}
        </div>
      </div>
    </div>
  );
};
