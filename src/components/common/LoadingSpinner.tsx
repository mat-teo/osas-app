// src/components/common/LoadingSpinner.tsx
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

interface Props {
  text?: string;
  color?: string;
  size?: 'small' | 'large';
}

const LoadingSpinner: React.FC<Props> = ({ text = 'Caricamento...', color = '#6C63FF', size = 'large' }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});

export default LoadingSpinner;