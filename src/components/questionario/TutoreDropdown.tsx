// src/components/questionario/TutoreDropdown.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { LocalProfile } from '../../types';

interface Props {
  profile: LocalProfile | null;
  tutori: LocalProfile[];
  selectedTutore: string;
  onSelectTutore: (id: string) => void;
  showTutoreWarning: boolean;
  showDropdown: boolean;
  onToggleDropdown: () => void;
  onCloseDropdown: () => void;
}

export const TutoreDropdown: React.FC<Props> = ({
  profile,
  tutori,
  selectedTutore,
  onSelectTutore,
  showTutoreWarning,
  showDropdown,
  onToggleDropdown,
  onCloseDropdown,
}) => {
  // 🔥 MOSTRA SEMPRE SE CI SONO TUTORI E NON C'È WARNING
  if (tutori.length === 0 || showTutoreWarning) {
    return null;
  }

  // Se il profilo è maggiorenne (e non è null), nascondi
  if (profile && profile.isMaggiorenne) {
    return null;
  }

  const selected = tutori.find(t => t.id === selectedTutore);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>👤 Seleziona il tutore legale *</Text>
      <TouchableOpacity style={styles.dropdown} onPress={onToggleDropdown}>
        <Text style={styles.dropdownText}>
          {selected ? `${selected.nome} ${selected.cognome}` : 'Seleziona un tutore...'}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={showDropdown}
        transparent
        animationType="fade"
        onRequestClose={onCloseDropdown}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={onCloseDropdown}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleziona un tutore</Text>
            <FlatList
              data={tutori}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    selectedTutore === item.id && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    onSelectTutore(item.id);
                    onCloseDropdown();
                  }}
                >
                  <Text style={styles.modalItemText}>
                    {item.nome} {item.cognome}
                  </Text>
                  <Text style={styles.modalItemSubtext}>
                    {item.codice_fiscale} • {item.data_nascita}
                  </Text>
                  {selectedTutore === item.id && (
                    <Text style={styles.modalCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalClose} onPress={onCloseDropdown}>
              <Text style={styles.modalCloseText}>Annulla</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#6C63FF',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  arrow: {
    fontSize: 16,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalItem: {
    flexDirection: 'column',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemSelected: {
    backgroundColor: '#f0f4ff',
    borderWidth: 1,
    borderColor: '#6C63FF',
    borderRadius: 8,
  },
  modalItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
  },
  modalItemSubtext: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
  },
  modalCheck: {
    position: 'absolute',
    right: 16,
    top: 16,
    fontSize: 18,
    color: '#6C63FF',
    fontWeight: 'bold',
  },
  modalClose: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#999',
  },
});