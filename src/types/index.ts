// src/types/index.ts

export interface Answer {
  id: string;
  questionId: string;
  text: string;
  order: number;
}

export interface Question {
  id: string;
  groupId: string;
  text: string;
  order: number;
  isDropdown: boolean;
  isRequired: boolean;
  type: 'text' | 'number' | 'date' | 'select';
  condition?: string;
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