import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function WeatherIrrigationScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weather & Smart Irrigation</Text>
      <Text style={styles.subtitle}>Feature currently pending Backend API integration for Climate Alerts.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#e3f2fd', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1565c0', marginBottom: 10 },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#42a5f5' }
});
