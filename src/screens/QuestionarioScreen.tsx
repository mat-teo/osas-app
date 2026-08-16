// src/screens/QuestionarioScreen.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { QuestionarioNavigationProp, RootStackParamList } from '../navigation/types';
import {
  QuestionnaireModule,
  Group,
  Question,
  UserProfile,
  Answer,
  ProfileSnapshot,
} from '../types';
import { QuestionnaireService } from '../services/QuestionnaireService';
import { ProfileStorageService } from '../services/ProfileStorageService';
import { CampoText, CampoSelect, CampoDate } from '../components/questionario';
import { LoadingSpinner, Button } from '../components/common';

type QuestionarioRouteProp = RouteProp<RootStackParamList, 'Questionario'>;

const QuestionarioScreen = () => {
  const navigation = useNavigation<QuestionarioNavigationProp>();
  const route = useRoute<QuestionarioRouteProp>();
  const { profileId, tipo, snapshot: currentSnapshot } = route.params || {};
  const moduleType = tipo || 'anagrafica';

  // State
  const [module, setModule] = useState<QuestionnaireModule | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tutore State
  const [adultsList, setAdultsList] = useState<UserProfile[]>([]);
  const [guardianError, setGuardianError] = useState('');
  const [isMinorBlocked, setIsMinorBlocked] = useState(false);

  // Mappa di Risoluzione Dinamica delle Chiavi (da Testo/Tipo a ID Reale)
  const fieldKeyMap = useMemo(() => {
    const map: Record<string, string> = {};
    
    groups.forEach(group => {
      group.questions.forEach(q => {
        const textLower = q.text.toLowerCase();
        
        // Match basati sul testo della domanda o sul tipo
        if (q.type === 'date' || textLower.includes('data di nascita')) {
          map['data_di_nascita'] = q.id;
        } else if (q.type === 'guardian_select' || textLower.includes('tutore')) {
          map['seleziona_tutore_legale'] = q.id;
        } else if (textLower.includes('nome') && !textLower.includes('cognome')) {
          map['nome'] = q.id;
        } else if (textLower.includes('cognome')) {
          map['cognome'] = q.id;
        } else if (textLower.includes('codice fiscale')) {
          map['codice_fiscale'] = q.id;
        } else if (textLower.includes('sesso') || textLower.includes('genere')) {
          map['sesso'] = q.id;
        } else if (textLower.includes('luogo') && textLower.includes('nascita')) {
          map['luogo_di_nascita'] = q.id;
        } else if (textLower.includes('peso')) {
          map['peso_kg'] = q.id;
        } else if (textLower.includes('altezza')) {
          map['altezza_cm'] = q.id;
        } else if (textLower.includes('attesa') || textLower.includes('gravidanza')) {
          map['sei_in_dolce_attesa'] = q.id;
        } else if (textLower.includes('fumi') || textLower.includes('fumo')) {
          map['fumi'] = q.id;
        } else if (textLower.includes('alcol')) {
          map['consumi_alcolici'] = q.id;
        } else if (textLower.includes('attivita') || textLower.includes('attività') || textLower.includes('sport')) {
          map['pratici_attivita_fisica'] = q.id;
        } else if (textLower.includes('caffe') || textLower.includes('caffè')) {
          map['quante_tazze_di_caffe_al_giorno'] = q.id;
        }

        // Fallback per ID originali se già presenti
        map[q.id] = q.id;
        if (q.originalId) map[q.originalId] = q.id;
      });
    });

    return map;
  }, [groups]);

  // Dynamic Helper per ottenere un valore dallo stato `answers`
  const getAnswerValue = useCallback((semanticKey: string): string => {
    const realId = fieldKeyMap[semanticKey] || semanticKey;
    return answers[realId] || '';
  }, [answers, fieldKeyMap]);

  // Estrazione Snapshot completa delle risposte della sezione anagrafica/clinica
  const getSnapshotValues = useCallback((): ProfileSnapshot => {
    const weightVal = getAnswerValue('peso_kg') || answers['6'];
    const heightVal = getAnswerValue('altezza_cm') || answers['7'];
    const isPregnantVal = getAnswerValue('sei_in_dolce_attesa') || answers['9'];
    const smokingVal = getAnswerValue('fumi') || answers['10'];
    const alcoholVal = getAnswerValue('consumi_alcolici') || answers['11'];
    const physicalActivityVal = getAnswerValue('pratici_attivita_fisica') || answers['12'];
    const coffeeVal = getAnswerValue('quante_tazze_di_caffe_al_giorno') || answers['13'];

    return {
      weight: parseFloat(weightVal) || 0,
      height: parseFloat(heightVal) || 0,
      isPregnant: isPregnantVal || '',
      smoking: smokingVal || '',
      alcohol: alcoholVal || '',
      physicalActivity: physicalActivityVal || '',
      coffee: parseInt(coffeeVal, 10) || 0,
    };
  }, [answers, getAnswerValue]);

  // 1. Caricamento Modulo + Pre-popolamento Dati Utente Esistente
  const loadModuleAndProfile = useCallback(async () => {
    setLoading(true);
    try {
      const data = moduleType === 'anagrafica'
        ? await QuestionnaireService.loadAnagrafica()
        : await QuestionnaireService.loadBerlino();

      setModule(data);
      const sortedGroups = [...data.groups].sort((a, b) => a.order - b.order);
      setGroups(sortedGroups);

      // Inizializza tutti gli ID con stringa vuota
      const initialAnswers: Record<string, string> = {};
      sortedGroups.forEach(g => {
        g.questions.forEach(q => {
          initialAnswers[q.id] = '';
        });
      });

      // Mappa temporanea per matchare i dati salvati con gli ID numerici delle domande
      if (profileId && moduleType === 'anagrafica') {
        const existingProfile = await ProfileStorageService.getProfileById(profileId);
        if (existingProfile) {
          sortedGroups.forEach(g => {
            g.questions.forEach(q => {
              const textLower = q.text.toLowerCase();
              if (q.type === 'date' || textLower.includes('data di nascita')) {
                initialAnswers[q.id] = existingProfile.birthDate || '';
              } else if (q.type === 'guardian_select' || textLower.includes('tutore')) {
                initialAnswers[q.id] = existingProfile.guardianId || '';
              } else if (textLower.includes('nome') && !textLower.includes('cognome')) {
                initialAnswers[q.id] = existingProfile.firstName || '';
              } else if (textLower.includes('cognome')) {
                initialAnswers[q.id] = existingProfile.lastName || '';
              } else if (textLower.includes('codice fiscale')) {
                initialAnswers[q.id] = existingProfile.fiscalCode || '';
              } else if (textLower.includes('sesso') || textLower.includes('genere')) {
                // Mappatura sesso sugli ID numerici delle risposte dell'XML ("1" = Maschio, "2" = Femmina)
                const genderValue = existingProfile.gender?.toLowerCase() || '';
                if (genderValue === 'male' || genderValue === 'maschio') {
                  initialAnswers[q.id] = '1';
                } else if (genderValue === 'female' || genderValue === 'femmina') {
                  initialAnswers[q.id] = '2';
                } else {
                  initialAnswers[q.id] = '';
                }
              } else if (textLower.includes('luogo') && textLower.includes('nascita')) {
                initialAnswers[q.id] = existingProfile.birthPlace || '';
              } else if (textLower.includes('peso')) {
                initialAnswers[q.id] = existingProfile.weight ? existingProfile.weight.toString() : '';
              } else if (textLower.includes('altezza')) {
                initialAnswers[q.id] = existingProfile.height ? existingProfile.height.toString() : '';
              } else if (textLower.includes('attesa') || textLower.includes('gravidanza')) {
                initialAnswers[q.id] = existingProfile.isPregnant || '';
              } else if (textLower.includes('fumi') || textLower.includes('fumo')) {
                initialAnswers[q.id] = existingProfile.smoking || '';
              } else if (textLower.includes('alcol')) {
                initialAnswers[q.id] = existingProfile.alcohol || '';
              } else if (textLower.includes('attivita') || textLower.includes('attività')) {
                initialAnswers[q.id] = existingProfile.physicalActivity || '';
              } else if (textLower.includes('caffe') || textLower.includes('caffè')) {
                initialAnswers[q.id] = existingProfile.coffee ? existingProfile.coffee.toString() : '0';
              }
            });
          });
        }
      }

      setAnswers(initialAnswers);
    } catch (error) {
      console.error('Errore caricamento modulo:', error);
      Alert.alert('Errore', 'Impossibile caricare il modulo.');
    } finally {
      setLoading(false);
    }
  }, [moduleType, profileId]);

  useEffect(() => {
    loadModuleAndProfile();
  }, [loadModuleAndProfile]);

  // 2. Controllo Data di Nascita e Tutore (Usa la data risolta dinamicamente)
  const birthDateValue = getAnswerValue('data_di_nascita');

  useEffect(() => {
    if (moduleType === 'anagrafica' && birthDateValue) {
      const isAdult = ProfileStorageService.isAdult(birthDateValue);

      if (!isAdult) {
        ProfileStorageService.getAdults().then(adults => {
          setAdultsList(adults);
          if (adults.length === 0) {
            setGuardianError('⚠️ Nessun maggiorenne presente. Inserire prima il profilo di un tutore adulto.');
            setIsMinorBlocked(true);
          } else {
            setGuardianError('');
            setIsMinorBlocked(false);
            const guardianRealId = fieldKeyMap['seleziona_tutore_legale'];
            if (adults.length === 1 && guardianRealId && !answers[guardianRealId]) {
              setAnswers(prev => ({ ...prev, [guardianRealId]: adults[0].id }));
            }
          }
        });
      } else {
        setGuardianError('');
        setIsMinorBlocked(false);
      }
    }
  }, [birthDateValue, moduleType, fieldKeyMap]);

  // 3. Valutazione Condizioni XML
  const isFieldVisible = (question: Question): boolean => {
    if (!question.condition) return true;

    if (question.condition === '4 == minore' || question.condition.includes('minore')) {
      return birthDateValue ? !ProfileStorageService.isAdult(birthDateValue) : false;
    }

    const [targetOriginalId, expectedValue] = question.condition.split('==').map(s => s.trim());
    const realTargetId = fieldKeyMap[targetOriginalId] || targetOriginalId;

    const actualAnswer = answers[realTargetId];
    if (!actualAnswer) return false;

    return actualAnswer === expectedValue || actualAnswer.toLowerCase() === expectedValue.toLowerCase();
  };

  const handleChange = useCallback((id: string, value: string) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  }, []);

  // 4. Calcolo Punteggio Berlino
  const calculateBerlinScore = useCallback((): number => {
    if (!module || !module.scores) return 0;
    let totalScore = 0;

    groups.forEach(group => {
      group.questions.forEach(question => {
        const selectedAnswerId = answers[question.id];
        if (!selectedAnswerId) return;

        const selectedAnswerObj = question.answers.find(ans => ans.id === selectedAnswerId || ans.text === selectedAnswerId);
        if (!selectedAnswerObj) return;

        const scoreObj = module.scores?.find(
          s => (s.questionId === (question.originalId || question.id)) && s.answerText === selectedAnswerObj.text
        );

        if (scoreObj) {
          totalScore += scoreObj.value;
        }
      });
    });

    return totalScore;
  }, [module, groups, answers]);

  // 5. Salvataggio / Submit (Con Estrazione Valori e Inoltro Snapshot Completo)
  const handleSubmit = useCallback(async () => {
    if (moduleType === 'anagrafica') {
      if (isMinorBlocked) {
        Alert.alert('Azione Bloccata', 'Inserisci prima un tutore maggiorenne nel sistema.');
        return;
      }

      const allQuestions = groups.flatMap(g => g.questions);
      for (const q of allQuestions) {
        if (q.isRequired && isFieldVisible(q)) {
          const val = answers[q.id];
          if (!val || val.trim() === '') {
            Alert.alert('Campo Obbligatorio', `Il campo "${q.text}" è obbligatorio.`);
            return;
          }
        }
      }

      setIsSubmitting(true);
      try {
        const birthDate = getAnswerValue('data_di_nascita') || answers['4'];
        const firstName = getAnswerValue('nome') || answers['1'];
        const lastName = getAnswerValue('cognome') || answers['2'];
        const fiscalCode = getAnswerValue('codice_fiscale') || answers['3'];
        const genderRaw = getAnswerValue('sesso') || answers['5'];
        const guardianId = getAnswerValue('seleziona_tutore_legale') || answers['14'];
        const birthPlace = getAnswerValue('luogo_di_nascita') || answers['8'];

        // Estrazione dello snapshot con tutti i campi fisiologici
        const snapshot = getSnapshotValues();

        let targetProfileId = profileId;

        if (profileId) {
          await ProfileStorageService.updateMutableProfileData(profileId, snapshot);
        } else {
          const isAdult = ProfileStorageService.isAdult(birthDate);
          const isMale = genderRaw === '1' || genderRaw === 'Maschio';

          const newProfile = await ProfileStorageService.saveProfile({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            fiscalCode: fiscalCode.trim().toUpperCase(),
            birthDate: birthDate,
            gender: isMale ? 'male' : 'female',
            isAdult,
            guardianId: !isAdult ? guardianId : undefined,
            birthPlace: birthPlace,
            ...snapshot,
          });

          targetProfileId = newProfile.id;
        }

        // Passaggio dello snapshot al modulo successivo
        navigation.replace('Questionario', {
          profileId: targetProfileId,
          tipo: 'berlino',
          snapshot: snapshot,
        });
      } catch (error) {
        console.error('Errore salvataggio:', error);
        Alert.alert('Errore', 'Impossibile salvare i dati anagrafici.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      try {
        const score = calculateBerlinScore();

        if (profileId) {
          await ProfileStorageService.saveQuestionnaireResult(
            profileId,
            moduleType,
            answers,
            score,
            currentSnapshot
          );
        }

        Alert.alert(
          'Completato!',
          `Questionario inviato con successo!\nPunteggio Totale OSAS: ${score}`,
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'ProfilesList' }],
                });
              },
            },
          ]
        );
      } catch (error) {
        console.error('Errore durante il salvataggio del questionario:', error);
        Alert.alert('Errore', 'Impossibile salvare il questionario.');
      }
    }
  }, [
    answers,
    groups,
    moduleType,
    isMinorBlocked,
    navigation,
    profileId,
    currentSnapshot,
    calculateBerlinScore,
    getAnswerValue,
    getSnapshotValues,
  ]);

  const renderQuestion = (question: Question) => {
    const value = answers[question.id] || '';
    if (!isFieldVisible(question)) return null;

    // Disabilita se è un retake (profileId presente) E l'XML specifica Modificabile="false"
    const isFieldDisabled = Boolean(profileId) && question.isEditable === false;

    const props = {
      id: question.id,
      label: question.text,
      value,
      onChange: handleChange,
      required: question.isRequired,
      disabled: isFieldDisabled,
      readonly: isFieldDisabled,
    };

    if (question.type === 'text') {
      return <CampoText key={question.id} {...props} />;
    }
    if (question.type === 'number') {
      return <CampoText key={question.id} {...props} type="number" />;
    }
    if (question.type === 'date') {
      return <CampoDate key={question.id} {...props} />;
    }
    
    if (question.type === 'guardian_select') {
      const options: Answer[] = adultsList.map((adult, index) => ({
        id: adult.id,
        questionId: question.id,
        text: `${adult.firstName} ${adult.lastName} (${adult.fiscalCode})`,
        order: index,
      }));

      return (
        <CampoSelect
          key={question.id}
          {...props}
          options={options}
        />
      );
    }

    if (question.type === 'select' || question.isDropdown) {
      return (
        <CampoSelect
          key={question.id}
          {...props}
          options={question.answers}
        />
      );
    }
    return null;
  };

  if (loading) return <LoadingSpinner text="Caricamento..." />;

  const currentGroup = groups[currentStep];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.stepIndicator}>
        {currentStep + 1} / {groups.length}
      </Text>
      <Text style={styles.sectionTitle}>
        {moduleType === 'anagrafica'
          ? profileId
            ? '🔄 Aggiorna Condizione Clinica'
            : '📝 Dati Anagrafici'
          : currentGroup?.title}
      </Text>

      {moduleType === 'anagrafica' && guardianError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{guardianError}</Text>
        </View>
      ) : null}

      {currentGroup?.questions.map(renderQuestion)}

      <View style={styles.buttonRow}>
        {currentStep > 0 && (
          <Button
            title="Indietro"
            onPress={() => setCurrentStep(prev => prev - 1)}
            variant="secondary"
            style={styles.buttonHalf}
          />
        )}
        <Button
          title={
            currentStep < groups.length - 1
              ? 'Avanti'
              : moduleType === 'anagrafica'
              ? 'Conferma Dati e Prosegui'
              : 'Invia Questionario'
          }
          onPress={
            currentStep < groups.length - 1
              ? () => setCurrentStep(prev => prev + 1)
              : handleSubmit
          }
          disabled={isMinorBlocked}
          loading={isSubmitting}
          style={isMinorBlocked ? [styles.buttonHalf, styles.buttonDisabled] : styles.buttonHalf}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  contentContainer: { padding: 20, paddingBottom: 40 },
  stepIndicator: { fontSize: 14, color: '#6C63FF', marginBottom: 8 },
  sectionTitle: { fontSize: 24, fontWeight: 'bold', color: '#2D3748', marginBottom: 16 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, gap: 12 },
  buttonHalf: { flex: 1 },
  buttonDisabled: { opacity: 0.5 },
  errorBox: {
    backgroundColor: '#FED7D7',
    borderColor: '#E53E3E',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#9B2C2C',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default QuestionarioScreen;