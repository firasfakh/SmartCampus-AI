// SmartCampus AI — Types & Models

export type UserRole = 
  | 'visitor'
  | 'candidate'
  | 'academic_iit'
  | 'academic_isb'
  | 'interview_resp'
  | 'direction'
  | 'admin';

export type Institution = 'IIT' | 'ISB';

export type LanguageCode = 'fr' | 'ar_tn' | 'arabizi' | 'en';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  institution?: Institution;
  avatarUrl?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface Program {
  id: string;
  name: string;
  shortName: string;
  code: string;
  institution: Institution;
  level: 'Licence' | 'Master' | 'Ingénieur' | 'Doctorat';
  duration: string;
  description: string;
  prerequisites: string[];
  careerOpportunities: string[];
  curriculumHighlights: string[];
  tuitionPerYearTND: number;
  featured?: boolean;
}

export interface SourceCitation {
  documentTitle: string;
  section: string;
  snippet: string;
  url?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  language?: LanguageCode;
  audioUrl?: string;
  audioDuration?: number;
  citations?: SourceCitation[];
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  candidateProfileContext?: Partial<CandidateProfile>;
}

export interface CandidateProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  governorate?: string;
  currentLevel: string;
  bacSection?: 'Mathématiques' | 'Sciences Expérimentales' | 'Sciences Techniques' | 'Informatique' | 'Économie et Gestion' | 'Lettres' | 'Autre';
  bacYear?: number;
  bacAverage?: number;
  higherEducationLevel?: string;
  higherEducationInstitution?: string;
  interests: string[];
  preferredSubjects: string[];
  careerGoals: string;
  targetInstitution?: Institution;
  targetProgramId?: string;
  completenessPercentage: number;
}

export interface OrientationRecommendation {
  programId: string;
  program: Program;
  compatibilityScore: number; // 0 - 100
  reasons: string[];
  prerequisitesMet: boolean;
  academicStrengths: string[];
  careerMatch: string;
  suggestedAction: string;
}

export interface CandidateDocument {
  id: string;
  candidateId: string;
  documentType: 'cin' | 'bac_transcript' | 'bac_diploma' | 'higher_ed_transcripts' | 'cv' | 'motivation_letter';
  name: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  status: 'pending' | 'verified' | 'rejected' | 'supplement_needed';
  rejectionReason?: string;
}

export interface PreRegistrationDossier {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  institution: Institution;
  programId: string;
  programName: string;
  status: 'draft' | 'submitted' | 'under_review' | 'supplement_requested' | 'accepted' | 'rejected';
  submittedAt?: string;
  reviewedAt?: string;
  reviewerNotes?: string;
  personalInfoCompleted: boolean;
  academicInfoCompleted: boolean;
  documentsUploadedCount: number;
  documentsRequiredCount: number;
}

export interface QCMQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex?: number; // Only for evaluation
  category: 'Technique' | 'Logique' | 'Anglais' | 'Culture Générale / Business';
}

export interface QCMTest {
  id: string;
  candidateId: string;
  targetProgramId: string;
  programName: string;
  institution: Institution;
  durationMinutes: number;
  questions: QCMQuestion[];
  status: 'not_started' | 'in_progress' | 'completed';
  answers: Record<string, number>; // questionId -> selectedOptionIndex
  score?: number; // 0 - 100
  strengths?: string[];
  improvements?: string[];
  completedAt?: string;
}

export interface Appointment {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  programName: string;
  institution: Institution;
  date: string; // YYYY-MM-DD
  timeSlot: string; // HH:mm - HH:mm
  modality: 'in_person' | 'online_video';
  locationOrLink: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
}

export interface InterviewRecord {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  programName: string;
  institution: Institution;
  appointmentId: string;
  scheduledDate: string;
  scheduledTime: string;
  interviewerName: string;
  status: 'scheduled' | 'completed' | 'in_evaluation';
  qcmScore?: number;
  qcmStrengths?: string[];
  conversationSummary?: string;
  motivationScore?: number; // 1 to 5
  academicPotentialScore?: number; // 1 to 5
  communicationScore?: number; // 1 to 5
  observations?: string;
  decision: 'pending' | 'admitted' | 'conditionally_admitted' | 'refused' | 'supplement_requested';
  decisionRationale?: string;
}

export interface DirectionMetrics {
  totalConversations: number;
  totalCandidates: number;
  totalPreRegistrations: number;
  totalInterviewsCompleted: number;
  finalAdmissionsCount: number;
  iitCandidatesCount: number;
  isbCandidatesCount: number;
  iitPreRegistrationsCount: number;
  isbPreRegistrationsCount: number;
  conversionRate: number; // percentage
  topPrograms: { name: string; institution: Institution; candidateCount: number }[];
  funnelStages: { name: string; count: number; percentage: number }[];
  ragUsageCount: number;
  averageResponseTimeSeconds: number;
}

