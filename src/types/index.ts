// src/types/index.ts

export interface Answer {
  id: string;
  questionId: string;
  text: string;
  order: number;
}

export interface Question {
  id: string;
  originalId?: string; 
  groupId: string;
  text: string;
  order: number;
  isDropdown: boolean;
  isRequired: boolean;
  type: 'text' | 'number' | 'date' | 'select' | 'guardian_select'; // 👈 Aggiunto guardian_select
  condition?: string;
  isEditable?: boolean;
  answers: Answer[];
}

export interface Group {
  id: string;
  moduleId: string;
  title: string;
  order: number;
  questions: Question[];
}

export interface Score {
  questionId: string;
  moduleId: string;
  answerText: string;
  value: number;
}

export interface QuestionnaireModule {
  id: string;
  title: string;
  type: string;
  groups: Group[];
  scores: Score[];
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  fiscalCode: string;
  birthDate: string;
  gender: 'male' | 'female';
  weight: number;
  height: number;
  isAdult: boolean;
  guardianId?: string; 
  birthPlace?: string;
  isPregnant?: string;
  smoking?: string;
  alcohol?: string;
  physicalActivity?: string;
  coffee?: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionnaireAnswers {
  [questionId: string]: string;
}
export interface ProfileSnapshot {
  weight: number;
  height: number;
  isPregnant?: string;
  smoking?: string;
  alcohol?: string;
  physicalActivity?: string;
  coffee?: number;
}

export interface SavedQuestionnaireResult {
  id: string;
  profileId: string;
  moduleType: string;
  answers: Record<string, string>;
  score?: number;
  snapshot: ProfileSnapshot; 
  submittedAt: string;
}