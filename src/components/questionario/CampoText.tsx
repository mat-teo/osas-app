// src/components/questionario/CampoText.tsx
import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

interface Props {
  id: string;
  label: string;
  value: string;
  onChange: (id: string, value: string) => void;
  type?: 'text' | 'number';
  required?: boolean;
  readonly?: boolean;
  placeholder?: string;
}

const CampoText: React.FC<Props> = ({
  id,
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  readonly = false,
  placeholder,
}) => {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label} {required && '*'}</Text>
      <TextInput
        style={[styles.input, readonly && styles.inputReadonly]}
        value={value}
        onChangeText={(text) => onChange(id, text)}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        editable={!readonly}
        keyboardType={type === 'number' ? 'numeric' : 'default'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  field: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#2d3748', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E0',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#F7FAFC',
  },
  inputReadonly: { backgroundColor: '#EDF2F7', color: '#718096' },
});

export default CampoText;