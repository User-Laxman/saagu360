import { View, Text, StyleSheet } from 'react-native';

export default function SchemesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Govt. Schemes</Text>
      <Text style={styles.subtitle}>Discover available support</Text>
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
    color: '#6A1B9A',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
});
