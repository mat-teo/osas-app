// src/components/questionario/CampoDate.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Props {
  id: string;
  label: string;
  value: string;
  onChange: (id: string, value: string) => void;
  required?: boolean;
  readonly?: boolean;
}

const CampoDate: React.FC<Props> = ({
  id,
  label,
  value,
  onChange,
  required = false,
  readonly = false,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  const displayValue = value ? new Date(value + 'T00:00:00').toLocaleDateString('it-IT') : 'Select date';

  if (readonly) {
    return (
      <View style={styles.field}>
        <Text style={styles.label}>{label} {required && '*'}</Text>
        <Text style={styles.readonlyValue}>{displayValue}</Text>
      </View>
    );
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label} {required && '*'}</Text>
      <TouchableOpacity style={styles.dateButton} onPress={() => setShowPicker(true)}>
        <Text style={[styles.dateText, !value && styles.placeholderText]}>
          {displayValue}
        </Text>
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          onChange={(_, selectedDate) => {
            setShowPicker(false);
            if (selectedDate) {
              const formatted = selectedDate.toISOString().split('T')[0];
              onChange(id, formatted);
              setTempDate(selectedDate);
            }
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  field: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#2d3748', marginBottom: 8 },
  dateButton: {
    borderWidth: 1,
    borderColor: '#CBD5E0',
    borderRadius: 10,
    padding: 14,
    backgroundColor: '#F7FAFC',
  },
  dateText: { fontSize: 16, color: '#2D3748' },
  placeholderText: { color: '#A0AEC0' },
  readonlyValue: { fontSize: 16, color: '#2D3748', paddingVertical: 8 },
});

export default CampoDate;