import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, StatusBar, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { predictDisease } from '../services/diseaseService';
import { COLORS, FONTS, RADIUS, SHADOW } from '../constants/appTheme';
import { shared } from '../constants/sharedStyles';

interface Props {
  navigation: { navigate: (route: string) => void };
}

const REMEDIES = [
  { crop: 'Maize', disease: 'Common Smut', remedy: 'Remove galls before they burst. Apply fungicide as preventative.' },
];

export default function DiseaseScreen({ navigation }: Props) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scanHistory, setScanHistory] = useState<any[]>([]);

  const pickImage = async (fromCamera = false) => {
    let pickerResult;
    if (fromCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
      pickerResult = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    } else {
      pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
      });
    }

    if (!pickerResult.canceled && pickerResult.assets?.length > 0) {
      const uri = pickerResult.assets[0].uri;
      setImageUri(uri);
      setResult(null);
      analyzeImage(uri);
    }
  };

  const analyzeImage = async (uri: string) => {
    setIsLoading(true);
    try {
      const aiResult = await predictDisease(uri);
      setResult(aiResult);
      setScanHistory(prev => [
        { text: aiResult, time: new Date().toLocaleTimeString(), ok: !aiResult.includes('unreachable') },
        ...prev.slice(0, 4),
      ]);
    } catch (e) {
      setResult('Analysis failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const parsedDiagnosis = result ? result.split('\n')[0] : null;
  const parsedConfidence = result && result.includes('Confidence') ? result.split('Confidence: ')[1] : null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={shared.pageTitle}>Scan Disease</Text>
        <Text style={shared.pageSub}>AI-powered leaf analysis</Text>
      </View>
      <ScrollView style={shared.content} showsVerticalScrollIndicator={false}>
        
        {imageUri ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
            {isLoading && (
              <View style={styles.previewOverlay}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.previewOverlayText}>Analyzing...</Text>
              </View>
            )}
            {!isLoading && (
              <TouchableOpacity style={styles.rescanOverlay} onPress={() => setImageUri(null)}>
                <Text style={styles.rescanText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.scannerBox}>
            <Text style={{ fontSize: 60, marginBottom: 16 }}>📷</Text>
            <Text style={styles.scanTitle}>Point camera at a leaf</Text>
            <Text style={styles.scanDesc}>Make sure the leaf is well-lit and in focus.</Text>
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.scanBtn} onPress={() => pickImage(true)}>
                <Text style={styles.scanBtnText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.scanBtn, { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.green800 }]} onPress={() => pickImage(false)}>
                <Text style={[styles.scanBtnText, { color: COLORS.green800 }]}>Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {result && (
          <View style={styles.resultCard}>
            <View style={styles.resultBadge}>
              <Text style={styles.resultBadgeText}>⚡ AI RESULT</Text>
            </View>
            <View style={styles.resultTop}>
              <View style={styles.resultImg}><Text style={{ fontSize: 28 }}>🌿</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.resultName}>{parsedDiagnosis}</Text>
                {parsedConfidence && <Text style={styles.resultConf}>{parsedConfidence} Confidence</Text>}
                <View style={styles.severityBadge}>
                  <Text style={styles.severityText}>
                    {parsedConfidence && parseFloat(parsedConfidence) > 85 ? '⚠ High Severity' : '✅ Moderate'}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.divider} />
            <Text style={styles.remedyTitle}>Next Steps</Text>
            <Text style={styles.remedyText}>
              Apply recommended fertilizer. Keep the infected area dry. Consult local authorities if spread continues.
            </Text>
          </View>
        )}

        <Text style={[shared.sectionTitle, { marginTop: 12 }]}>Scan History</Text>
        {scanHistory.length > 0 ? scanHistory.map((s, i) => (
          <View key={i} style={styles.historyCard}>
            <View style={styles.historyLeft}>
              <Text style={{ fontSize: 28 }}>{s.ok ? '🌿' : '⚠️'}</Text>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.histCrop}>{s.text.split('\n')[0]}</Text>
                <Text style={styles.histRemedy}>{s.time}</Text>
              </View>
            </View>
          </View>
        )) : (
          <View style={styles.historyCard}>
             <Text style={styles.histRemedy}>No recent scans found.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1, backgroundColor: COLORS.green50,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    backgroundColor: COLORS.green900,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24,
    borderBottomLeftRadius: RADIUS.xl, borderBottomRightRadius: RADIUS.xl,
  },
  scannerBox: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: 32, alignItems: 'center', marginBottom: 24,
    borderWidth: 2, borderColor: COLORS.green200, borderStyle: 'dashed',
    ...SHADOW.card,
  },
  previewWrap: {
    borderRadius: RADIUS.xl, overflow: 'hidden', position: 'relative', height: 200, marginBottom: 16,
    ...SHADOW.card,
  },
  previewImage: { width: '100%', height: '200%' }, // Zoom in a bit for effect
  previewOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  previewOverlayText: { color: COLORS.white, fontFamily: FONTS.sansBold, marginTop: 10 },
  rescanOverlay: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
  },
  rescanText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  btnRow: { flexDirection: 'row', gap: 12 },
  scanTitle: { fontFamily: FONTS.sansExtra, fontSize: 16, color: COLORS.gray800, marginBottom: 4 },
  scanDesc: { fontFamily: FONTS.sans, fontSize: 13, color: COLORS.gray600, textAlign: 'center', marginBottom: 24 },
  scanBtn: { backgroundColor: COLORS.green800, paddingHorizontal: 24, paddingVertical: 12, borderRadius: RADIUS.lg, flex: 1, alignItems: 'center' },
  scanBtnText: { fontFamily: FONTS.sansBold, fontSize: 14, color: COLORS.white },

  resultCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: 18, marginBottom: 20,
    borderWidth: 1, borderColor: COLORS.green200, position: 'relative',
    ...SHADOW.card
  },
  resultBadge: {
    position: 'absolute', top: -1, right: 16, backgroundColor: COLORS.green800,
    paddingHorizontal: 10, paddingVertical: 4, borderBottomLeftRadius: 10, borderBottomRightRadius: 10,
  },
  resultBadgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  resultTop: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  resultImg: { width: 56, height: 56, borderRadius: 14, backgroundColor: COLORS.green100, alignItems: 'center', justifyContent: 'center' },
  resultName: { fontFamily: FONTS.sansBold, fontSize: 15, color: COLORS.gray800 },
  resultConf: { fontFamily: FONTS.sans, fontSize: 12, color: COLORS.green700, marginTop: 2 },
  severityBadge: { backgroundColor: COLORS.redBg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginTop: 6 },
  severityText: { fontFamily: FONTS.sansBold, fontSize: 10, color: COLORS.red },
  divider: { height: 1, backgroundColor: COLORS.gray100, marginVertical: 12 },
  remedyTitle: { fontFamily: FONTS.sansBold, fontSize: 12, color: COLORS.gray800, marginBottom: 6 },
  remedyText: { fontFamily: FONTS.sans, fontSize: 11.5, color: COLORS.gray600, lineHeight: 18 },

  historyCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: 16, marginBottom: 12, ...SHADOW.card
  },
  historyLeft: { flexDirection: 'row', alignItems: 'center' },
  histCrop: { fontFamily: FONTS.sansBold, fontSize: 14, color: COLORS.gray800, marginBottom: 4 },
  histRemedy: { fontFamily: FONTS.sans, fontSize: 12, color: COLORS.gray600, lineHeight: 18 },
});
