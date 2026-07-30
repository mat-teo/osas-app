// src/screens/QuestionarioScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { QuestionarioNavigationProp } from '../navigation/types';
import { QuestionnaireModule, Group, Question, UserProfile } from '../types';
import { QuestionnaireService } from '../services/QuestionnaireService';
import { ProfileStorageService } from '../services/ProfileStorageService';
import { CampoText, CampoSelect, CampoDate, TutoreDropdown } from '../components/questionario';
import { LoadingSpinner, Button } from '../components/common';
import { READONLY_FIELDS } from '../constants';

type ScreenParams = {
  profileId?: string;
  tipo?: 'anagrafica' | 'berlino';
};

const QuestionarioScreen = () => {
  const navigation = useNavigation<QuestionarioNavigationProp>();
  const route = useRoute();
  const params = route.params as ScreenParams | undefined;
  const profileId = params?.profileId;
  const moduleType = params?.tipo || 'anagrafica';
  const isNewProfile = !profileId;

  // State
  const [module, setModule] = useState<QuestionnaireModule | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Tutore state
  const [guardians, setGuardians] = useState<UserProfile[]>([]);
  const [selectedGuardian, setSelectedGuardian] = useState<string>('');
  const [showGuardianDropdown, setShowGuardianDropdown] = useState(false);
  const [guardianError, setGuardianError] = useState('');
  const [isMinorBlocked, setIsMinorBlocked] = useState(false);

  useEffect(() => {
    if (profileId) loadProfile(profileId);
    else setLoadingProfile(false);
  }, [profileId]);

  useEffect(() => {
    loadModule();
  }, [moduleType]);

  useEffect(() => {
    handleBirthDateValidation();
  }, [answers.birthDate, moduleType]);

  const loadProfile = useCallback(async (id: string) => {
    setLoadingProfile(true);
    try {
      const p = await ProfileStorageService.getProfileById(id);
      if (!p) return;
      setProfile(p);
      const prefill = {
        name: p.firstName,
        surname: p.lastName,
        fiscalCode: p.fiscalCode,
        birthDate: p.birthDate,
        gender: p.gender,
        weight: p.weight.toString(),
        height: p.height.toString(),
        birthPlace: p.birthPlace || '',
        isPregnant: p.isPregnant || '',
        smoking: p.smoking || '',
        alcohol: p.alcohol || '',
        physicalActivity: p.physicalActivity || '',
        coffee: p.coffee?.toString() || '',
      };
      setAnswers(prev => ({ ...prev, ...prefill }));

      if (!p.isAdult) {
        await handleGuardianCheck(p);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  const handleGuardianCheck = useCallback(async (p: UserProfile) => {
    const adults = await ProfileStorageService.getAdults();
    const available = adults.filter(a => a.id !== p.id);
    setGuardians(available);

    if (available.length === 0) {
      setGuardianError('⚠️ To create a profile for a minor, you must first add an adult guardian.');
      setIsMinorBlocked(true);
      setShowGuardianDropdown(false);
    } else {
      setGuardianError('');
      setIsMinorBlocked(false);
      setShowGuardianDropdown(true);
      if (available.length === 1) {
        setSelectedGuardian(available[0].id);
        setAnswers(prev => ({
          ...prev,
          guardianName: available[0].firstName,
          guardianSurname: available[0].lastName,
          guardianFiscalCode: available[0].fiscalCode,
        }));
      }
    }
  }, []);

  const handleBirthDateValidation = useCallback(() => {
    if (moduleType === 'anagrafica' && answers.birthDate) {
      const isAdult = ProfileStorageService.isAdult(answers.birthDate);
      if (!isAdult) {
        const checkAdults = async () => {
          const adults = await ProfileStorageService.getAdults();
          if (adults.length === 0) {
            setGuardianError('⚠️ Before creating a minor profile, you must add an adult guardian.');
            setIsMinorBlocked(true);
            setGuardians([]);
            setShowGuardianDropdown(false);
            setSelectedGuardian('');
          } else {
            setGuardianError('');
            setIsMinorBlocked(false);
            setGuardians(adults);
            setShowGuardianDropdown(true);
            if (adults.length === 1) {
              setSelectedGuardian(adults[0].id);
              setAnswers(prev => ({
                ...prev,
                guardianName: adults[0].firstName,
                guardianSurname: adults[0].lastName,
                guardianFiscalCode: adults[0].fiscalCode,
              }));
            }
          }
        };
        checkAdults();
      } else {
        setGuardianError('');
        setIsMinorBlocked(false);
        setSelectedGuardian('');
        setGuardians([]);
        setShowGuardianDropdown(false);
        const { guardianName, guardianSurname, guardianFiscalCode, guardianId, ...rest } = answers;
        setAnswers(rest);
      }
    }
  }, [answers.birthDate, moduleType]);

  const loadModule = useCallback(async () => {
    setLoading(true);
    try {
      const data = moduleType === 'anagrafica'
        ? await QuestionnaireService.loadAnagrafica()
        : await QuestionnaireService.loadBerlino();

      setModule(data);
      const sortedGroups = [...data.groups].sort((a, b) => a.order - b.order);
      setGroups(sortedGroups);

      const initialAnswers: Record<string, string> = {};
      data.groups.forEach(g => {
        g.questions.forEach(q => {
          initialAnswers[q.id] = '';
        });
      });

      if (profile && moduleType === 'anagrafica') {
        const profileData = {
          name: profile.firstName,
          surname: profile.lastName,
          fiscalCode: profile.fiscalCode,
          birthDate: profile.birthDate,
          gender: profile.gender,
          weight: profile.weight.toString(),
          height: profile.height.toString(),
        };
        setAnswers(prev => ({ ...prev, ...profileData, ...initialAnswers }));
      } else {
        setAnswers(prev => ({ ...prev, ...initialAnswers }));
      }
    } catch (error) {
      console.error('❌ Error loading questionnaire:', error);
      Alert.alert('Error', `Failed to load ${moduleType === 'anagrafica' ? 'anagrafica' : 'questionnaire'}`);
    } finally {
      setLoading(false);
    }
  }, [moduleType, profile]);

  const handleChange = useCallback((id: string, value: string) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  }, []);

  // src/screens/QuestionarioScreen.tsx - handleSubmit

  const handleSubmit = useCallback(async () => {
    if (moduleType === 'anagrafica') {
      if (isMinorBlocked) {
        Alert.alert('Guardian Required', 'You must add an adult guardian first.');
        return;
      }

      const isMinor = answers.birth_date && !ProfileStorageService.isAdult(answers.birth_date);
      if (isMinor && !selectedGuardian) {
        setGuardianError('⚠️ You must select a guardian to proceed.');
        return;
      }

      // 🔥 LE CHIAVI SONO GENERATE DINAMICAMENTE DAL TESTO DELLA DOMANDA
      // Non c'è nessuna mappa hardcodata
      const requiredFields = ['nome', 'cognome', 'codice_fiscale', 'data_di_nascita', 'sesso', 'peso', 'altezza'];
      for (const field of requiredFields) {
        if (!answers[field] || answers[field].trim() === '') {
          Alert.alert('Error', `Field "${field}" is required.`);
          return;
        }
      }

      setIsSubmitting(true);
      try {
        const isAdult = ProfileStorageService.isAdult(answers.data_di_nascita);
        const newProfile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'> = {
          firstName: answers.nome.trim(),
          lastName: answers.cognome.trim(),
          fiscalCode: answers.codice_fiscale.trim().toUpperCase(),
          birthDate: answers.data_di_nascita,
          gender: answers.sesso as 'male' | 'female',
          weight: parseFloat(answers.peso) || 0,
          height: parseFloat(answers.altezza) || 0,
          isAdult,
          birthPlace: answers.luogo_di_nascita || '',
          isPregnant: answers.sei_in_dolce_attesa || '',
          smoking: answers.fumi || '',
          alcohol: answers.consumi_alcolici || '',
          physicalActivity: answers.pratici_attivita_fisica || '',
          coffee: parseInt(answers.quante_tazze_di_caffe_al_giorno) || 0,
        };

        const saved = await ProfileStorageService.saveProfile(newProfile);

        Alert.alert(
          '✅ Profile Created!',
          `Profile for ${saved.firstName} ${saved.lastName} saved successfully.`,
          [
            {
              text: 'Continue to Questionnaire',
              onPress: () => {
                navigation.replace('Questionario', {
                  profileId: saved.id,
                  tipo: 'berlino',
                });
              },
            },
          ]
        );
      } catch (error) {
        console.error('Error saving profile:', error);
        Alert.alert('Error', 'Failed to save profile.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Berlino
      Alert.alert(
        '🎉 Thank You!',
        'Questionnaire completed successfully!',
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
    }
  }, [answers, moduleType, isMinorBlocked, selectedGuardian]);

  const isFieldReadonly = (fieldId: string): boolean => {
    return profile !== null && READONLY_FIELDS.includes(fieldId);
  };

  const isFieldVisible = (question: Question): boolean => {
    if (!question.condition) return true;
    const [field, condition] = question.condition.split(' == ');
    return answers[field] === condition;
  };

  const renderQuestion = (question: Question) => {
    const value = answers[question.id] || '';
    const isReadonly = isFieldReadonly(question.id);
    const isVisible = isFieldVisible(question);

    if (!isVisible) return null;

    const props = {
      id: question.id,
      label: question.text,
      value,
      onChange: handleChange,
      required: question.isRequired,
      readonly: isReadonly,
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

  if (loading || loadingProfile) {
    return <LoadingSpinner text="Loading..." />;
  }

  if (groups.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No sections found</Text>
        <Button title="Retry" onPress={loadModule} />
      </View>
    );
  }

  const currentGroup = groups[currentStep];
  if (!currentGroup) {
    return (
      <View style={styles.container}>
        <Text>Group not found</Text>
      </View>
    );
  }

  const visibleQuestions = currentGroup.questions.filter(isFieldVisible);
  const isButtonDisabled = isMinorBlocked || isSubmitting;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.stepIndicator}>
        {currentStep + 1} / {groups.length}
      </Text>
      <Text style={styles.sectionTitle}>
        {moduleType === 'anagrafica' ? '📝 Personal Information' : currentGroup.title}
      </Text>

      {moduleType === 'anagrafica' && guardianError && (
        <Text style={[styles.errorText, isMinorBlocked && styles.errorTextBlocked]}>
          {guardianError}
        </Text>
      )}

      {moduleType === 'anagrafica' && (
        <TutoreDropdown
          profile={profile}
          tutori={guardians}
          selectedTutore={selectedGuardian}
          onSelectTutore={(id) => {
            setSelectedGuardian(id);
            setGuardianError('');
            setIsMinorBlocked(false);
            const guardian = guardians.find(g => g.id === id);
            if (guardian) {
              setAnswers(prev => ({
                ...prev,
                guardianName: guardian.firstName,
                guardianSurname: guardian.lastName,
                guardianFiscalCode: guardian.fiscalCode,
              }));
            }
          }}
          showTutoreWarning={false}
          showDropdown={showGuardianDropdown}
          onToggleDropdown={() => setShowGuardianDropdown(!showGuardianDropdown)}
          onCloseDropdown={() => setShowGuardianDropdown(false)}
        />
      )}

      {visibleQuestions.map(renderQuestion)}

      <View style={styles.buttonRow}>
        {currentStep > 0 && (
          <Button
            title="Back"
            onPress={() => setCurrentStep(currentStep - 1)}
            variant="secondary"
            style={isButtonDisabled ? [styles.buttonHalf, styles.buttonDisabled] : styles.buttonHalf}
            disabled={isButtonDisabled}
          />
        )}
        <Button
          title={
            isSubmitting
              ? 'Saving...'
              : currentStep < groups.length - 1
              ? 'Next'
              : moduleType === 'anagrafica'
              ? 'Save Profile'
              : 'Submit'
          }
          onPress={
            currentStep < groups.length - 1
              ? () => setCurrentStep(currentStep + 1)
              : handleSubmit
          }
          loading={isSubmitting}
          disabled={isButtonDisabled}
          style={isButtonDisabled ? [styles.buttonHalf, styles.buttonDisabled] : styles.buttonHalf}
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
  buttonDisabled: { backgroundColor: '#A0AEC0', opacity: 0.6 },
  emptyText: { fontSize: 16, color: '#999', textAlign: 'center', padding: 20 },
  errorText: {
    fontSize: 14,
    color: '#E53E3E',
    backgroundColor: '#FFF5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FEB2B2',
    textAlign: 'center',
  },
  errorTextBlocked: {
    backgroundColor: '#FED7D7',
    borderColor: '#FC8181',
    fontWeight: 'bold',
  },
});

export default QuestionarioScreen;