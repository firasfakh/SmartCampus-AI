import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { chatService } from '../../services/chatService';
import { Conversation, Message, LanguageCode, SourceCitation } from '../../types';
import { 
  Send, 
  Mic, 
  MicOff, 
  Sparkles, 
  FileText, 
  Compass, 
  Plus, 
  RotateCcw, 
  Globe, 
  User, 
  Check, 
  Info,
  ExternalLink,
  Bot
} from 'lucide-react';

interface ChatAssistantPageProps {
  onNavigate: (page: string) => void;
}

export const ChatAssistantPage: React.FC<ChatAssistantPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { language, setLanguage, isRTL } = useLanguage();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('conv-default');
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  
  // Citation Modal
  const [activeCitation, setActiveCitation] = useState<SourceCitation | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadConversations = async () => {
      const convos = await chatService.getConversations();
      setConversations(convos);
      if (convos.length > 0) {
        setActiveConversationId(convos[0].id);
      }
    };
    loadConversations();
  }, []);

  const activeConversation = conversations.find(c => c.id === activeConversationId) || conversations[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages, isTyping]);

  const handleSend = async () => {
    if (!inputMessage.trim() || isTyping) return;

    const textToSend = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    try {
      await chatService.sendMessage(activeConversationId, textToSend, language);
      // Refresh local conversations
      const updatedConvos = await chatService.getConversations();
      setConversations(updatedConvos);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleVoiceToggle = async () => {
    if (!isRecording) {
      setIsRecording(true);
      // Simuler l'enregistrement vocal pendant 3 secondes
      setTimeout(async () => {
        setIsRecording(false);
        setIsTyping(true);
        const transcription = await chatService.transcribeAudio(new Blob());
        await chatService.sendMessage(activeConversationId, transcription.text, transcription.language);
        const updatedConvos = await chatService.getConversations();
        setConversations(updatedConvos);
        setIsTyping(false);
      }, 3000);
    } else {
      setIsRecording(false);
    }
  };

  const handleNewConversation = () => {
    const newConvo: Conversation = {
      id: `conv-${Date.now()}`,
      title: `Session d'orientation #${conversations.length + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: "Nouvelle session d'orientation démarrée. Quelle formation ou spécialité de l'IIT ou de l'ISB souhaitez-vous explorer aujourd'hui ?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          language,
        }
      ]
    };
    const updated = [newConvo, ...conversations];
    setConversations(updated);
    setActiveConversationId(newConvo.id);
    localStorage.setItem('smartcampus_convos', JSON.stringify(updated));
  };

  return (
    <div className="h-[calc(100vh-4rem)] bg-slate-100 flex overflow-hidden">
      
      {/* Left Sidebar: Conversations & Progressive Memory */}
      <div className="w-80 bg-white border-r border-slate-200 hidden md:flex flex-col justify-between">
        
        {/* Top: New session & List */}
        <div className="p-4 space-y-4 overflow-y-auto">
          <button
            onClick={handleNewConversation}
            className="w-full py-2.5 px-4 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Conversation</span>
          </button>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
              Historique des Sessions
            </h4>
            <div className="space-y-1">
              {conversations.map(convo => {
                const isActive = convo.id === activeConversationId;
                return (
                  <button
                    key={convo.id}
                    onClick={() => setActiveConversationId(convo.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition flex items-center justify-between ${
                      isActive ? 'bg-sky-50 text-navy-900 font-bold border border-sky-100' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{convo.title}</span>
                    <span className="text-[10px] text-slate-400 ml-2">
                      {convo.messages.length} msg
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Progressive Profile Extraction Memory */}
          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-sky-600" />
              Mémoire de l'Orientation
            </h4>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs space-y-2">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500">Niveau actuel :</span>
                <span className="font-semibold text-navy-900">Baccalauréat 2026</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500">Section :</span>
                <span className="font-semibold text-sky-700">Mathématiques</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500">Intérêt principal :</span>
                <span className="font-semibold text-teal-700">Génie Informatique & IA</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500">Affinité calculée :</span>
                <span className="font-bold text-emerald-600">94% (IIT-ING-INFO)</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom: Quick Link to Recommendations */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={() => onNavigate('recommendations')}
            className="w-full py-2 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-navy-900 font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Voir mes Recommandations</span>
          </button>
        </div>

      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-100 h-full">
        
        {/* Chat Header Bar */}
        <div className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-navy-900 text-sky-400 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-navy-900">Conseiller Virtuel SmartCampus AI</h2>
              <p className="text-[10px] text-teal-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Connecté à la base RAG officielle IIT & ISB 2026
              </p>
            </div>
          </div>

          {/* Language Switcher pill */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs font-medium">
            <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Langue :</span>
            <button
              onClick={() => setLanguage('fr')}
              className={`px-2 py-0.5 rounded text-[11px] ${language === 'fr' ? 'bg-white font-bold text-navy-900 shadow-xs' : 'text-slate-500'}`}
            >
              FR
            </button>
            <button
              onClick={() => setLanguage('ar_tn')}
              className={`px-2 py-0.5 rounded text-[11px] ${language === 'ar_tn' ? 'bg-white font-bold text-navy-900 shadow-xs' : 'text-slate-500'}`}
            >
              تونسية
            </button>
            <button
              onClick={() => setLanguage('arabizi')}
              className={`px-2 py-0.5 rounded text-[11px] ${language === 'arabizi' ? 'bg-white font-bold text-navy-900 shadow-xs' : 'text-slate-500'}`}
            >
              Arabizi
            </button>
          </div>
        </div>

        {/* Message stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {activeConversation?.messages.map(msg => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-2xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold shadow-xs ${
                  isUser ? 'bg-sky-600 text-white' : 'bg-navy-900 text-teal-400'
                }`}>
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div className="space-y-1.5">
                  <div className={`p-4 rounded-2xl text-xs leading-relaxed shadow-xs ${
                    isUser 
                      ? 'bg-sky-600 text-white rounded-tr-none' 
                      : 'bg-white text-slate-800 rounded-tl-none border border-slate-200'
                  }`}>
                    <p className="whitespace-pre-line">{msg.content}</p>
                    
                    {/* Timestamp */}
                    <div className={`mt-2 text-[10px] flex items-center justify-end gap-1 ${
                      isUser ? 'text-sky-200' : 'text-slate-400'
                    }`}>
                      <span>{msg.timestamp}</span>
                    </div>
                  </div>

                  {/* RAG Source Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-sky-600" />
                        Sources officielles certifiées :
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.citations.map((citation, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveCitation(citation)}
                            className="text-[11px] bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded hover:bg-sky-100 transition flex items-center gap-1"
                          >
                            <span>{citation.documentTitle}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-3 max-w-md mr-auto animate-in fade-in">
              <div className="w-8 h-8 rounded-xl bg-navy-900 text-teal-400 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-slate-200">
          <div className="max-w-4xl mx-auto flex items-center gap-2">
            
            {/* Voice Recording Button (Whisper Speech-to-Text) */}
            <button
              onClick={handleVoiceToggle}
              className={`p-2.5 rounded-xl border transition ${
                isRecording 
                  ? 'bg-red-500 border-red-500 text-white animate-pulse' 
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
              }`}
              title={isRecording ? "Enregistrement en cours (parlez maintenant)..." : "Poser une question à la voix (Français ou Derja)"}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-sky-600" />}
            </button>

            {/* Input field */}
            <input
              type="text"
              placeholder={isRecording ? "Écoute en cours via Whisper STT..." : "Posez votre question (ex: Quels sont les frais du Cycle Ingénieur ? Conditions d'admission ?)..."}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isRecording}
              className="flex-1 py-2.5 px-4 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
            />

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={!inputMessage.trim() || isTyping}
              className="p-2.5 bg-navy-900 hover:bg-navy-800 disabled:opacity-40 text-white rounded-xl shadow-xs transition"
            >
              <Send className="w-4 h-4" />
            </button>

          </div>
          <p className="text-[10px] text-center text-slate-400 mt-2">
            L'assistant SmartCampus AI fournit des conseils d'orientation fondés sur les référentiels officiels de l'IIT et de l'ISB.
          </p>
        </div>

      </div>

      {/* Citation Detail Modal */}
      {activeCitation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                  Document Officiel RAG
                </span>
                <h3 className="text-sm font-bold text-navy-900 mt-1">{activeCitation.documentTitle}</h3>
                <p className="text-xs text-slate-500">{activeCitation.section}</p>
              </div>
              <button
                onClick={() => setActiveCitation(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed italic mb-4">
              "{activeCitation.snippet}"
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setActiveCitation(null)}
                className="px-4 py-1.5 rounded-lg bg-navy-900 text-white text-xs font-semibold hover:bg-navy-800 transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

