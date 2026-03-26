import { View, Text, StyleSheet } from 'react-native';

export default function MarketPricesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Market Prices</Text>
      <Text style={styles.subtitle}>Live mandi rates</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E65100',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
});
