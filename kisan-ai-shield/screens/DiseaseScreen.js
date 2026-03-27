import React, { useState, useContext } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { predictDisease } from '../services/diseaseService';
import { COLORS, RADIUS, SHADOW } from '../constants/appTheme';
import { shared } from '../constants/sharedStyles';
import { LanguageContext } from '../context/LanguageContext';

export default function DiseaseScreen() {
  const { t, language } = useContext(LanguageContext);
  const [imageUri, setImageUri] = useState(null);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);

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

  const analyzeImage = async (uri) => {
    setIsLoading(true);
    try {
      const aiResult = await predictDisease(uri, language);
      setResult(aiResult);
      // Add to history
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

  // Parse result string for display
  const parsedDiagnosis = result ? result.split('\n')[0] : null;
  const parsedConfidence = result && result.includes('Confidence') ? result.split('Confidence: ')[1] : null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Header / Scan Area ── */}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>{t('diseaseTitle')}</Text>
          <Text style={styles.pageSub}>{t('diseaseSub')}</Text>

          {imageUri ? (
            <View style={styles.previewWrap}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
              {isLoading && (
                <View style={styles.previewOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={styles.previewOverlayText}>{t('aiTyping')}</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.scanButtonsRow}>
              <TouchableOpacity style={styles.scanArea} activeOpacity={0.8} onPress={() => pickImage(true)}>
                <Text style={{ fontSize: 36 }}>📸</Text>
                <Text style={styles.scanText}>{t('cameraRef')}</Text>
                <Text style={styles.scanSub}>Take a photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.scanArea} activeOpacity={0.8} onPress={() => pickImage(false)}>
                <Text style={{ fontSize: 36 }}>🖼️</Text>
                <Text style={styles.scanText}>{t('galleryRef')}</Text>
                <Text style={styles.scanSub}>Pick from photos</Text>
              </TouchableOpacity>
            </View>
          )}

          {imageUri && !isLoading && (
            <View style={styles.rescanRow}>
              <TouchableOpacity style={styles.rescanBtn} onPress={() => pickImage(true)}>
                <Text style={styles.rescanText}>{t('cameraRef')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rescanBtn} onPress={() => pickImage(false)}>
                <Text style={styles.rescanText}>{t('galleryRef')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.content}>

          {/* ── AI Result Card ── */}
          {result && (
            <View style={styles.resultCard}>
              <View style={styles.resultBadge}>
                <Text style={styles.resultBadgeText}>{t('aiResult')}</Text>
              </View>
              <View style={styles.resultTop}>
                <View style={styles.resultImg}><Text style={{ fontSize: 28 }}>🌿</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultName}>{parsedDiagnosis || 'Analysis Complete'}</Text>
                  {parsedConfidence && <Text style={styles.resultConf}>{parsedConfidence} Confidence</Text>}
                  <View style={styles.severityBadge}>
                    <Text style={styles.severityText}>
                      {parsedConfidence && parseFloat(parsedConfidence) > 85 ? '⚠ High Severity' : '✅ Moderate'}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.divider} />
              <Text style={styles.remedyTitle}>{t('nextStep')}</Text>
              <Text style={styles.remedyText}>
                Ask the AI chatbot for detailed treatment advice based on this diagnosis.
              </Text>
            </View>
          )}

          {!result && !isLoading && (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 40 }}>🌱</Text>
              <Text style={styles.emptyTitle}>No Scan Yet</Text>
              <Text style={styles.emptyDesc}>
                Take a photo or select an image from your gallery to detect crop diseases instantly.
              </Text>
            </View>
          )}

          {/* ── Scan History ── */}
          {scanHistory.length > 0 && (
            <>
              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>Recent Scans</Text>
              </View>
              {scanHistory.map((s, i) => (
                <View key={i} style={styles.prevCard}>
                  <View style={styles.prevThumb}>
                    <Text style={{ fontSize: 20 }}>{s.ok ? '🌿' : '⚠️'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.prevName}>{s.text.split('\n')[0]}</Text>
                    <Text style={styles.prevDate}>{s.time}</Text>
                  </View>
                  <View style={[shared.badge, s.ok ? shared.badgeGreen : shared.badgeRed]}>
                    <Text style={[shared.badgeText, { color: s.ok ? COLORS.green800 : COLORS.red }]}>
                      {s.ok ? 'Done' : 'Error'}
                    </Text>
                  </View>
                </View>
              ))}
            </>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: shared.safe,
  header: {
    backgroundColor: COLORS.green900,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  pageTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 2 },
  pageSub: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '500', marginBottom: 16 },

  scanButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  scanArea: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)',
    borderStyle: 'dashed', borderRadius: RADIUS.lg,
    height: 140, alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  scanText: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '700' },
  scanSub: { color: 'rgba(255,255,255,0.6)', fontSize: 10 },

  previewWrap: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: RADIUS.lg,
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.lg,
  },
  previewOverlayText: { color: '#fff', fontSize: 13, fontWeight: '600', marginTop: 8 },

  rescanRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  rescanBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingVertical: 8,
    alignItems: 'center',
  },
  rescanText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  content: shared.content,

  resultCard: {
    backgroundColor: COLORS.green50,
    borderWidth: 2, borderColor: COLORS.green200,
    borderRadius: RADIUS.xl, padding: 14,
    marginBottom: 16, position: 'relative',
  },
  resultBadge: {
    position: 'absolute', top: -1, right: 14,
    backgroundColor: COLORS.green800,
    paddingHorizontal: 10, paddingVertical: 4,
    borderBottomLeftRadius: 10, borderBottomRightRadius: 10,
  },
  resultBadgeText: { color: '#fff', fontSize: 8.5, fontWeight: '800', letterSpacing: 0.5 },
  resultTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12, marginTop: 6 },
  resultImg: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: COLORS.green200,
    alignItems: 'center', justifyContent: 'center',
  },
  resultName: { fontSize: 14, fontWeight: '800', color: COLORS.gray800 },
  resultConf: { fontSize: 11, color: COLORS.green600, fontWeight: '600', marginTop: 2 },
  severityBadge: { backgroundColor: COLORS.redBg, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginTop: 4 },
  severityText: { fontSize: 10, color: COLORS.red, fontWeight: '700' },
  divider: { height: 1, backgroundColor: COLORS.green200, marginBottom: 10 },
  remedyTitle: { fontSize: 11, fontWeight: '700', color: COLORS.gray800, marginBottom: 6 },
  remedyText: { fontSize: 10.5, color: COLORS.gray600, lineHeight: 16, fontWeight: '500' },

  emptyState: {
    alignItems: 'center', paddingVertical: 40, gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.gray800 },
  emptyDesc: { fontSize: 12, color: COLORS.gray600, textAlign: 'center', lineHeight: 18, paddingHorizontal: 20 },

  sectionRow: shared.sectionRow,
  sectionTitle: shared.sectionTitle,

  prevCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: RADIUS.md,
    padding: 12, marginBottom: 8, ...SHADOW.card,
  },
  prevThumb: {
    width: 42, height: 42, borderRadius: 10,
    backgroundColor: COLORS.green100,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  prevName: { fontSize: 11.5, fontWeight: '700', color: COLORS.gray800 },
  prevDate: { fontSize: 10, color: COLORS.gray600, marginTop: 2 },
});
