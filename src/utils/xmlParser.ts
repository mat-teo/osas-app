// src/utils/xmlParser.ts
import { Question, Group, Answer, Score, QuestionnaireModule } from '../types';

const { parseString } = require('react-native-xml2js');

export const normalizeKey = (text: string): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
};

const parseAnswers = (rawAnswers: any[]): Answer[] => {
  if (!Array.isArray(rawAnswers)) rawAnswers = [rawAnswers];
  return rawAnswers.map((a: any) => ({
    id: a.$?.IdRisposta || '',
    questionId: a.$?.IdDomanda || '',
    text: a.$?.Testo || a._ || '', 
    order: parseInt(a.$?.Ordine, 10) || 0,
  }));
};

const parseQuestions = (rawQuestions: any[]): Question[] => {
  if (!Array.isArray(rawQuestions)) rawQuestions = [rawQuestions];
  return rawQuestions.map((q: any) => {
    const attrs = q.$ || {};
    const rawAnswers = q?.RisposteElenco?.[0]?.RispostaElenco || [];
    const textKey = normalizeKey(attrs.Testo || '');
    
    // Controlla l'attributo "Modificabile" dall'XML
    // Se è "false" imposta isEditable = false, altrimenti di default è true
    const isEditable = attrs.Modificabile !== undefined ? attrs.Modificabile === 'true' : true;

    return {
      id: attrs.IdDomanda || textKey,
      originalId: attrs.IdDomanda || '',
      groupId: attrs.IdGruppo || '',
      text: attrs.Testo || '',
      order: parseInt(attrs.Ordine, 10) || 0,
      isDropdown: attrs.Tendina === 'true',
      isRequired: attrs.Obbligatorio === 'true',
      type: attrs.Tipo || (attrs.Tendina === 'true' ? 'select' : 'text'),
      condition: attrs.Condizione || '',
      isEditable: isEditable, 
      answers: parseAnswers(rawAnswers),
    };
  });
};

const parseGroups = (rawGroups: any[]): Group[] => {
  if (!Array.isArray(rawGroups)) rawGroups = [rawGroups];
  return rawGroups.map((g: any) => {
    const attrs = g.$ || {};
    const rawQuestions = g?.QuestionarioDomande?.[0]?.QuestionarioDomanda || [];
    return {
      id: attrs.IdGruppo || '',
      moduleId: attrs.IdModulo || '',
      title: attrs.Descrizione || '',
      order: parseInt(attrs.Ordine, 10) || 0,
      questions: parseQuestions(rawQuestions),
    };
  });
};

const parseScores = (rawScores: any[]): Score[] => {
  if (!Array.isArray(rawScores)) rawScores = [rawScores];
  return rawScores.map((s: any) => ({
    questionId: s.$?.IdDomanda || '',
    moduleId: s.$?.IdModulo || '',
    answerText: s.$?.TestoRisp || '',
    value: parseInt(s.$?.Valore, 10) || 0,
  }));
};

export const parseQuestionnaireXML = (xml: string): QuestionnaireModule => {
  let result: any;
  parseString(xml, (err: any, res: any) => {
    if (err) throw err;
    result = res;
  });

  const module = result?.QuestionarioModulo || {};
  const attrs = module.$ || {};
  const rawGroups = module?.QuestionarioGruppi?.[0]?.QuestionarioGruppo || [];
  const rawScores = module?.QuestionarioRispostePunteggio?.[0]?.QuestionarioRispostaPunteggio || [];

  return {
    id: attrs.IdModulo || '',
    title: attrs.Descrizione || '',
    type: attrs.Tipologia || '',
    groups: parseGroups(rawGroups),
    scores: parseScores(rawScores),
  };
};