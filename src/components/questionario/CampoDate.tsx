// src/components/questionario/CampoDate.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

interface Props {
  id: string;
  label: string;
  value: string;
  onChange: (id: string, value: string) => void;
  required?: boolean;
  readonly?: boolean;
}

// 🔧 Parsa una stringa 'YYYY-MM-DD' come data LOCALE (niente conversioni UTC)
const parseISODate = (iso: string): Date => {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
};

// 🔧 Formatta una Date come 'YYYY-MM-DD' usando i campi LOCALI
// (sostituisce selectedDate.toISOString().split('T')[0], che convertendo in UTC
// poteva far scivolare il giorno di ±1 per chi seleziona vicino alla mezzanotte)
const formatISODate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const CampoDate: React.FC<Props> = ({
  id,
  label,
  value,
  onChange,
  required = false,
  readonly = false,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  // 🔧 tempDate ora nasce dal valore esistente, non sempre da "oggi"
  const [tempDate, setTempDate] = useState<Date>(() => (value ? parseISODate(value) : new Date()));

  // 🔧 Se il valore esterno cambia (es. caricamento di un profilo già salvato),
  // risincronizza tempDate di conseguenza
  useEffect(() => {
    if (value) {
      setTempDate(parseISODate(value));
    }
  }, [value]);

  const displayValue = value ? parseISODate(value).toLocaleDateString('it-IT') : 'Seleziona data';

  const openPicker = () => {
    // Ancora la data di partenza al valore corrente ogni volta che si apre il picker
    setTempDate(value ? parseISODate(value) : new Date());
    setShowPicker(true);
  };

  // 🔧 Uso onChange (deprecato ma supportato in tutte le versioni della libreria).
  const handleValueChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    // Su Android il dialog si chiude da solo dopo la conferma/annullamento
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    // event.type === 'dismissed' quando l'utente annulla: non aggiornare nulla
    if (event.type === 'dismissed' || !selectedDate) return;
    setTempDate(selectedDate);
    onChange(id, formatISODate(selectedDate));
  };

  // 🔧 onDismiss viene chiamato quando l'utente annulla, senza selezionare nulla
  const handleDismiss = () => {
    setShowPicker(false);
  };

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
      <TouchableOpacity style={styles.dateButton} onPress={openPicker}>
        <Text style={[styles.dateText, !value && styles.placeholderText]}>
          {displayValue}
        </Text>
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          onChange={handleValueChange}
          onDismiss={handleDismiss}
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