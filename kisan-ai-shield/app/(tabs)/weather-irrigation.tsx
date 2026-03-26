import { View, Text, StyleSheet } from 'react-native';

export default function WeatherIrrigationScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weather & Irrigation</Text>
      <Text style={styles.subtitle}>Smart watering advice</Text>
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
    color: '#0277BD',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
});
