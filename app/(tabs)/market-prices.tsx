import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MarketPricesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mandi Market Prices</Text>
      <Text style={styles.subtitle}>Feature currently pending Backend API integration for e-NAM APIs.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff8e1', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#f57f17', marginBottom: 10 },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#fbc02d' }
});
