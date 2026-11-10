import { QCMTest, QCMQuestion } from '../types';

export const IIT_INFO_QCM_QUESTIONS: QCMQuestion[] = [
  {
    id: 'q1',
    question: "En programmation orientée objet, quel principe permet à une classe dérivée de redéfinir une méthode de sa classe mère ?",
    options: ["L'Encapsulation", "Le Polymorphisme", "L'Abstraction", "La Sérialisation"],
    correctOptionIndex: 1,
    category: 'Technique'
  },
  {
    id: 'q2',
    question: "Quelle est la complexité temporelle moyenne d'une recherche dans une table de hachage bien dimensionnée ?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    correctOptionIndex: 0,
    category: 'Technique'
  },
  {
    id: 'q3',
    question: "Complétez la suite logique : 2, 6, 12, 20, 30, ?",
    options: ["36", "40", "42", "48"],
    correctOptionIndex: 2,
    category: 'Logique'
  },
  {
    id: 'q4',
    question: "Choose the correct sentence in professional English:",
    options: [
      "We look forward to collaborating with your academic institution.",
      "We look forward to collaborate with your academic institution.",
      "We looking forward for collaborating with your academic institution.",
      "We are looking forward collaborate with your academic institution."
    ],
    correctOptionIndex: 0,
    category: 'Anglais'
  },
  {
    id: 'q5',
    question: "Parmi ces architectures, laquelle sépare clairement la vue, la logique métier et la couche de données ?",
    options: ["Architecture Monolithique sans couches", "Modèle MVC (Model-View-Controller)", "Pipeline ETL", "Client lourd exclusif"],
    correctOptionIndex: 1,
    category: 'Technique'
  }
];

export const qcmService = {
  async getPersonalizedTest(candidateId: string = 'cand-yassine-1'): Promise<QCMTest> {
    const saved = localStorage.getItem(`smartcampus_qcm_${candidateId}`);
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }

    const test: QCMTest = {
      id: 'qcm-iit-2026-01',
      candidateId,
      targetProgramId: 'iit-ing-info',
      programName: 'Cycle Ingénieur en Génie Informatique',
      institution: 'IIT',
      durationMinutes: 20,
      questions: IIT_INFO_QCM_QUESTIONS,
      status: 'completed',
      answers: {
        'q1': 1,
        'q2': 0,
        'q3': 2,
        'q4': 0,
        'q5': 1,
      },
      score: 85,
      strengths: [
        'Excellente maîtrise des concepts fondamentaux de la programmation orientée objet.',
        'Solide sens logique et raisonnement algorithmique.',
        'Très bonne aisance en anglais technique.'
      ],
      improvements: [
        'Approfondir les connaissances en architectures microservices et conteneurs Docker.'
      ],
      completedAt: '2026-11-08T15:20:00Z',
    };

    localStorage.setItem(`smartcampus_qcm_${candidateId}`, JSON.stringify(test));
    return test;
  },

  async submitAnswers(testId: string, answers: Record<string, number>): Promise<QCMTest> {
    const questions = IIT_INFO_QCM_QUESTIONS;
    let correctCount = 0;

    questions.forEach(q => {
      if (answers[q.id] === q.correctOptionIndex) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / questions.length) * 100);

    const result: QCMTest = {
      id: testId,
      candidateId: 'cand-yassine-1',
      targetProgramId: 'iit-ing-info',
      programName: 'Cycle Ingénieur en Génie Informatique',
      institution: 'IIT',
      durationMinutes: 20,
      questions,
      status: 'completed',
      answers,
      score,
      strengths: [
        'Aptitudes algorithmiques et logique déductive démontrées.',
        'Bases techniques solides pour le cycle ingénieur.'
      ],
      improvements: [
        'Poursuivre la pratique de la programmation système.'
      ],
      completedAt: new Date().toISOString()
    };

    localStorage.setItem('smartcampus_qcm_cand-yassine-1', JSON.stringify(result));
    return result;
  }
};

