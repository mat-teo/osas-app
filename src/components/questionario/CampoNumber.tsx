// src/components/questionario/CampoNumber.tsx
import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

interface Props {
  id: string;
  label: string;
  value: string;
  onChange: (id: string, value: string) => void;
  readonly?: boolean;
  required?: boolean;
  placeholder?: string;
}

const CampoNumber: React.FC<Props> = ({
  id,
  label,
  value,
  onChange,
  readonly = false,
  required = false,
  placeholder,
}) => {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label} {required && '*'}
      </Text>
      <TextInput
        style={[styles.input, readonly && styles.inputReadonly]}
        value={value}
        onChangeText={(text) => onChange(id, text)}
        placeholder={placeholder || `Inserisci ${label.toLowerCase()}`}
        keyboardType="numeric"
        editable={!readonly}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  inputReadonly: {
    backgroundColor: '#f0f0f0',
    color: '#666',
  },
});

export default CampoNumber;