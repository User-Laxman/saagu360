import { View, Text, StyleSheet } from 'react-native';

export default function DiseaseScanScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Disease Scan</Text>
      <Text style={styles.subtitle}>Capture a leaf to analyze</Text>
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
    color: '#2E7D32',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
});
