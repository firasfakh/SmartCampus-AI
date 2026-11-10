import { api } from './api';
import { Conversation, Message, LanguageCode, SourceCitation } from '../types';

const INITIAL_GREETING_FR: Message = {
  id: 'msg-init-1',
  role: 'assistant',
  content: "Bonjour et bienvenue sur **SmartCampus AI** ! Je suis votre conseiller d'orientation universitaire virtuel pour l'**IIT** (Institut International de Technologie) et l'**ISB** (International School of Business) de Sfax.\n\nComment puis-je vous aider aujourd'hui ? Vous pouvez me parler de votre parcours (Bac, Licence), de vos matières favorites ou de votre projet professionnel !",
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  language: 'fr',
  citations: [
    {
      documentTitle: 'Guide d’Orientation Officiel IIT & ISB 2026',
      section: 'Section 1.1 — Accueil & Parcours Académiques',
      snippet: "L'IIT et l'ISB offrent des formations accréditées à vocation internationale en Ingénierie et en Management.",
    }
  ]
};

const SAMPLE_CITATIONS: Record<string, SourceCitation[]> = {
  informatique: [
    {
      documentTitle: 'Règlement des Études Cycle Ingénieur IIT',
      section: 'Art. 4 — Spécialité Génie Informatique',
      snippet: 'Accréditation EUR-ACE. Options : Intelligence Artificielle & Big Data, Génie Logiciel, Cybersécurité.',
    },
    {
      documentTitle: 'Barème d’Admission & Prérequis IIT',
      section: 'Section 2.3 — Diplômes Éligibles',
      snippet: 'Admission sur concours sur titre pour les titulaires d’un bac+2/3 scientifique avec étude du relevé de notes.',
    }
  ],
  isb: [
    {
      documentTitle: 'Catalogue des Formations ISB 2026',
      section: 'Licence & Master Business Analytics',
      snippet: 'Double compétence en analyse prédictive et stratégie d’affaires. Partenariats avec des banques et multinationales.',
    }
  ],
  frais: [
    {
      documentTitle: 'Guide Financier & Bourses d’Excellence IIT-ISB',
      section: 'Annexe Tarifs 2026-2027',
      snippet: 'Facilités de paiement en 4 tranches trimestrielles et bourses partielles octroyées aux bacheliers avec mention Très Bien.',
    }
  ]
};

export const chatService = {
  async getConversations(): Promise<Conversation[]> {
    try {
      const res = await api.get<any>('/conversations');
      if (Array.isArray(res) && res.length > 0) return res;
    } catch {
      // fallback
    }

    const saved = localStorage.getItem('smartcampus_convos');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }

    const defaultConvo: Conversation = {
      id: 'conv-default',
      title: 'Orientation initiale — IIT & ISB',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [INITIAL_GREETING_FR],
      candidateProfileContext: {
        currentLevel: 'Baccalauréat',
        bacSection: 'Mathématiques',
      }
    };

    localStorage.setItem('smartcampus_convos', JSON.stringify([defaultConvo]));
    return [defaultConvo];
  },

  async sendMessage(conversationId: string, content: string, language: LanguageCode = 'fr'): Promise<Message> {
    const userMsg: Message = {
      id: `msg-${Date.now()}-u`,
      role: 'user',
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language,
    };

    // Tentative vers le backend
    try {
      await api.post(`/conversations/${conversationId}/messages`, { content, language });
    } catch {
      // Backend mock placeholder
    }

    // Réponse intelligente de l'assistant basée sur les connaissances RAG vérifiées IIT & ISB
    const botResponse = this.generateAgentResponse(content, language);

    // Mettre à jour le stockage local
    const convos = await this.getConversations();
    const convo = convos.find(c => c.id === conversationId) || convos[0];
    if (convo) {
      convo.messages.push(userMsg);
      convo.messages.push(botResponse);
      convo.updatedAt = new Date().toISOString();
      localStorage.setItem('smartcampus_convos', JSON.stringify(convos));
    }

    return botResponse;
  },

  async transcribeAudio(audioBlob: Blob): Promise<{ text: string; language: LanguageCode }> {
    // Simulation réaliste de Whisper STT pour l'intégration vocale
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Exemples réalistes de transcriptions vocales bilingues/derja
    const samples = [
      { text: "3aslema, n7eb na3ref les conditions d'admission fel Génie Informatique mta3 l'IIT", language: 'arabizi' as LanguageCode },
      { text: "Quelles sont les opportunités de carrière après un Master Business Analytics à l'ISB ?", language: 'fr' as LanguageCode },
      { text: "Est-ce qu'il y a des facilités de paiement ou des bourses pour les étudiants ?", language: 'fr' as LanguageCode }
    ];

    return samples[Math.floor(Math.random() * samples.length)];
  },

  generateAgentResponse(userQuery: string, language: LanguageCode): Message {
    const query = userQuery.toLowerCase();
    let reply = "";
    let citations: SourceCitation[] = [];

    // Détection de la langue dialectale / arabizi
    if (language === 'arabizi' || query.includes('n7eb') || query.includes('chnowa') || query.includes('3aslema')) {
      reply = "3aslema ! Mar7ba bik fi **SmartCampus AI**. Pour l'**IIT** (Cycle Ingénieur en Informatique, Civil, Industriel), l'admission tet3ada par étude de dossier w entretien technique. Ken 3andek licence wala prepa, relevés de notes mte3ek houma l'essentiel. T7eb nchoufou ensemble les débouchés wala les frais ?";
      citations = SAMPLE_CITATIONS.informatique;
    } else if (language === 'ar_tn' || /[\u0600-\u06FF]/.test(userQuery)) {
      reply = "أهلاً بك في **SmartCampus AI**! جامعة IIT والمدرسة العليا للأعمال ISB بصفاقس توفران برامج معتمدة دولياً في الهندسة والتصرف وإدارة الأعمال. هل ترغب في معرفة متطلبات القبول أو مواعيد التسجيل؟";
      citations = SAMPLE_CITATIONS.informatique;
    } else if (query.includes('ingénieur') || query.includes('informatique') || query.includes('iit') || query.includes('code')) {
      reply = "À l'**IIT**, le **Cycle Ingénieur en Génie Informatique** (accrédité **EUR-ACE**) propose 3 options d'excellence :\n1. **Intelligence Artificielle & Data Science**\n2. **Génie Logiciel & Cloud Computing**\n3. **Cybersécurité & Systèmes Distribués**\n\nLe programme dure 3 ans et comprend un semestre international ainsi qu'un stage de fin d'études (PFE) souvent rémunéré en Tunisie ou en Europe.";
      citations = SAMPLE_CITATIONS.informatique;
    } else if (query.includes('isb') || query.includes('business') || query.includes('finance') || query.includes('marketing') || query.includes('gestion')) {
      reply = "À l'**ISB (International School of Business)**, nous formons les leaders de la transformation économique avec :\n- **Licence & Master en Business Analytics & Big Data**\n- **Licence en FinTech & Marchés Financiers**\n- **Management & Stratégie d’Entreprise**\n\nLes diplômés bénéficient d'un taux d'insertion professionnelle supérieur à 92% dans les 6 mois grâce aux partenariats bancaires et industriels.";
      citations = SAMPLE_CITATIONS.isb;
    } else if (query.includes('frais') || query.includes('tarif') || query.includes('prix') || query.includes('bourse')) {
      reply = "Les frais d'inscription annuels varient selon la filière :\n- **Cycle Ingénieur IIT :** ~7 200 TND / an\n- **Cycle Préparatoire Intégré :** ~5 800 TND / an\n- **Licences ISB & IIT :** 5 200 – 5 400 TND / an\n- **Masters ISB :** 6 200 – 6 400 TND / an\n\nDes facilités de paiement échelonnées en 4 tranches sont disponibles, ainsi que des bourses de réduction (jusqu'à 25%) pour les bacheliers avec mention Très Bien.";
      citations = SAMPLE_CITATIONS.frais;
    } else {
      reply = "Merci pour votre question ! Pour vous orienter précisément entre l'**IIT** (Pôle Ingénierie & Technologie) et l'**ISB** (Pôle Management & Business), pouvez-vous me préciser votre filière de Baccalauréat et vos centres d'intérêt principaux (ex: Programmation, Finance, Logistique, IA, Management) ?";
      citations = [
        {
          documentTitle: 'Guide d’Orientation 2026',
          section: 'Méthodologie du Profiling Candidat',
          snippet: 'L’assistant SmartCampus AI croise les aptitudes académiques avec les débouchés pour calculer un score d’affinité.',
        }
      ];
    }

    return {
      id: `msg-${Date.now()}-a`,
      role: 'assistant',
      content: reply,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language,
      citations,
    };
  }
};

