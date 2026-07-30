// src/components/questionario/TutoreWarning.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  onAddTutore: () => void;
}

export const TutoreWarning: React.FC<Props> = ({ onAddTutore }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.title}>Tutore richiesto</Text>
      <Text style={styles.text}>
        Per procedere con il questionario di un minorenne, devi prima creare il profilo di un maggiorenne (genitore/tutore).
      </Text>
      <TouchableOpacity style={styles.button} onPress={onAddTutore}>
        <Text style={styles.buttonText}>➕ Aggiungi tutore</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 40,
  },
  icon: {
    fontSize: 60,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#e53e3e',
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    color: '#4a5568',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#6C63FF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});