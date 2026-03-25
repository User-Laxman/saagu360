import React, { useState } from 'react';
import { View, Text, Button, Image, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { predictDisease } from '../../services/diseaseService';

export default function DiseaseScanScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
      setResult(null);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need camera permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
      setResult(null);
    }
  };

  const handleScan = async () => {
    if (!image) return;
    setLoading(true);
    setResult("Analyzing crop disease...");
    const aiResult = await predictDisease(image);
    setResult(aiResult);
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>AI Crop Disease Scanner</Text>
      
      <View style={styles.buttonRow}>
        <View style={styles.btn}><Button title="Gallery" onPress={pickImage} color="#2e7d32" /></View>
        <View style={styles.btn}><Button title="Camera" onPress={takePhoto} color="#2e7d32" /></View>
      </View>

      {image && <Image source={{ uri: image }} style={styles.image} />}

      {image && (
        <View style={styles.scanContainer}>
          <Button title="Analyze Disease" onPress={handleScan} color="#f57c00" />
        </View>
      )}

      {loading && <ActivityIndicator size="large" color="#2e7d32" style={styles.loader} />}

      {result && !loading && (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>{result}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, alignItems: 'center', backgroundColor: '#f9fbe7' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#33691e' },
  buttonRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  btn: { flex: 1, marginHorizontal: 5 },
  image: { width: 300, height: 300, borderRadius: 10, marginVertical: 20 },
  scanContainer: { marginVertical: 10, width: '100%' },
  loader: { marginTop: 20 },
  resultBox: { marginTop: 20, padding: 20, backgroundColor: '#fff', borderRadius: 10, elevation: 3, width: '100%' },
  resultText: { fontSize: 18, color: '#1b5e20', textAlign: 'center' }
});
