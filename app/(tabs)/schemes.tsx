import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SchemesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Government Schemes</Text>
      <Text style={styles.subtitle}>Feature currently pending Backend API integration for Govt Policies.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#efebe9', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#5d4037', marginBottom: 10 },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#8d6e63' }
});
