// src/components/questionario/CampoSelect.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Answer } from '../../types';

interface Props {
  id: string;
  label: string;
  value: string;
  onChange: (id: string, value: string) => void;
  options: Answer[];
  required?: boolean;
  readonly?: boolean;
}

const CampoSelect: React.FC<Props> = ({
  id,
  label,
  value,
  onChange,
  options,
  required = false,
  readonly = false,
}) => {
  if (readonly) {
    const selected = options.find(o => o.id === value);
    return (
      <View style={styles.field}>
        <Text style={styles.label}>{label} {required && '*'}</Text>
        <Text style={styles.readonlyValue}>{selected?.text || 'Not selected'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label} {required && '*'}</Text>
      <View style={styles.optionsContainer}>
        {options.map((opt) => {
          const isSelected = value === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              style={[styles.option, isSelected && styles.optionSelected]}
              onPress={() => onChange(id, opt.id)}
            >
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                {opt.text}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  field: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#2D3748', marginBottom: 8 },
  optionsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  option: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#CBD5E0',
    backgroundColor: '#F7FAFC',
    marginRight: 10,
    marginBottom: 10,
  },
  optionSelected: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  optionText: {
    fontSize: 15,
    color: '#4A5568',
  },
  optionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  readonlyValue: { fontSize: 16, color: '#2D3748', paddingVertical: 8 },
});

export default CampoSelect;