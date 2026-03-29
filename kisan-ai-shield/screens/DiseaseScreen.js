import React, { useState, useContext, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { predictDisease } from '../services/diseaseService';
import { COLORS, FONTS, RADIUS, SHADOW, SPACING } from '../constants/appTheme';
import { shared } from '../constants/sharedStyles';
import { LanguageContext } from '../context/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveDiseaseLog } from '../firebase/helpers';

export default function DiseaseScreen() {
  const router = useRouter();
  const { t, language } = useContext(LanguageContext);
  const [imageUri, setImageUri] = useState(null);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);

  // Load persisted scan history on mount
  useEffect(() => {
    AsyncStorage.getItem('kisan_scan_history').then(saved => {
      if (saved) {
        try { setScanHistory(JSON.parse(saved)); } catch(e) {}
      }
    });
  }, []);

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

  const clearScan = () => {
    setImageUri(null);
    setResult(null);
  };

  const analyzeImage = async (uri) => {
    setIsLoading(true);
    try {
      const aiResult = await predictDisease(uri, language);
      setResult(aiResult);
      // Add to history and persist locally
      setScanHistory(prev => {
        const updated = [
          { result: aiResult, time: new Date().toLocaleTimeString(), uri: uri },
          ...prev.slice(0, 4),
        ];
        AsyncStorage.setItem('kisan_scan_history', JSON.stringify(updated));
        return updated;
      });
      // Also persist to Firestore (cloud backup)
      if (aiResult?.success) {
        saveDiseaseLog({
          diagnosis:      aiResult.diagnosis,
          confidence:     aiResult.confidence,
          severity:       aiResult.severity,
          recommendation: aiResult.recommendation,
          isHealthy:      aiResult.is_healthy || false,
          language,
        }).catch(() => {}); // Silent — never block UI on logging failure
      }
    } catch (e) {
      setResult({ success: false, error: 'Analysis failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Parse result object for display
  const parsedDiagnosis   = result?.success ? result.diagnosis : (result?.error || null);
  const parsedConfidence  = result?.success && result.confidence != null
    ? `${(result.confidence * 100).toFixed(1)}%`
    : null;
  const parsedSeverity    = result?.success ? (result.severity || 'Moderate') : null;
  const parsedRecommend   = result?.success ? result.recommendation : null;

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
              {result ? (
                <TouchableOpacity style={[styles.rescanBtn, { backgroundColor: '#e53935' }]} onPress={clearScan}>
                  <Text style={styles.rescanText}>Refresh Scanner</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity style={styles.rescanBtn} onPress={() => pickImage(true)}>
                    <Text style={styles.rescanText}>{t('cameraRef')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rescanBtn} onPress={() => pickImage(false)}>
                    <Text style={styles.rescanText}>{t('galleryRef')}</Text>
                  </TouchableOpacity>
                </>
              )}
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
                  <View style={[
                    styles.severityBadge,
                    parsedSeverity === 'High' && { backgroundColor: COLORS.redBg },
                    parsedSeverity === 'Moderate' && { backgroundColor: COLORS.amberBg },
                    parsedSeverity === 'Unknown' && { backgroundColor: COLORS.gray100 },
                  ]}>
                    <Text style={[
                      styles.severityText,
                      parsedSeverity === 'High' && { color: COLORS.red },
                      parsedSeverity === 'Moderate' && { color: COLORS.orange },
                      parsedSeverity === 'Unknown' && { color: COLORS.gray600 },
                    ]}>
                      {parsedSeverity === 'High' ? '⚠ High Severity'
                        : parsedSeverity === 'Moderate' ? '⚡ Moderate'
                        : parsedSeverity === 'Low' ? '✅ Low Risk'
                        : '❓ Unknown'}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.divider} />
              <Text style={styles.remedyTitle}>{t('nextStep')}</Text>
              <Text style={styles.remedyText}>
                {parsedRecommend || 'Ask the AI chatbot for detailed treatment advice based on this diagnosis.'}
              </Text>
              
              <TouchableOpacity
                style={[styles.rescanBtn, { backgroundColor: COLORS.green600, marginTop: 16 }]}
                onPress={() => router.push({ 
                  pathname: '/ask-ai', 
                  params: { query: `I scanned my crop and your vision model detected: ${parsedDiagnosis || 'a disease'}. Can you give me a detailed 3-step treatment and precaution plan for it?` } 
                })}
              >
                <Text style={styles.rescanText}>🤖 Ask AI About This Disease</Text>
              </TouchableOpacity>
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
                    <Text style={{ fontSize: 20 }}>{s.result?.success ? '🌿' : '⚠️'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.prevName}>{s.result?.diagnosis || s.result?.error || 'Unknown'}</Text>
                    <Text style={styles.prevDate}>{s.time}</Text>
                  </View>
                  <View style={[shared.badge, s.result?.success ? shared.badgeGreen : shared.badgeRed]}>
                    <Text style={[shared.badgeText, { color: s.result?.success ? COLORS.green800 : COLORS.red }]}>
                      {s.result?.success ? 'Done' : 'Error'}
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
  pageTitle: { color: '#fff', fontSize: 21, fontFamily: FONTS.headingXl, marginBottom: 2 },
  pageSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: FONTS.bodyMed, marginBottom: SPACING.lg },

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
  scanText: { color: 'rgba(255,255,255,0.9)', fontSize: 15, fontFamily: FONTS.bodyBold },
  scanSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontFamily: FONTS.body },

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
  resultName: { fontSize: 15, fontFamily: FONTS.headingXl, color: COLORS.gray800 },
  resultConf: { fontSize: 12, color: COLORS.green600, fontFamily: FONTS.bodySemi, marginTop: 2 },
  severityBadge: { backgroundColor: COLORS.redBg, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginTop: 4 },
  severityText: { fontSize: 11, color: COLORS.red, fontFamily: FONTS.bodyBold },
  divider: { height: 1, backgroundColor: COLORS.green200, marginBottom: 10 },
  remedyTitle: { fontSize: 12, fontFamily: FONTS.bodyBold, color: COLORS.gray800, marginBottom: 6 },
  remedyText: { fontSize: 12, color: COLORS.gray800, lineHeight: 18, fontFamily: FONTS.bodyMed },

  emptyState: {
    alignItems: 'center', paddingVertical: 40, gap: 8,
  },
  emptyTitle: { fontSize: 16, fontFamily: FONTS.heading, color: COLORS.gray800 },
  emptyDesc: { fontSize: 12, color: COLORS.gray600, textAlign: 'center', lineHeight: 18, paddingHorizontal: 20, fontFamily: FONTS.body },

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
  prevName: { fontSize: 13, fontFamily: FONTS.bodyBold, color: COLORS.gray800 },
  prevDate: { fontSize: 11, color: COLORS.gray800, marginTop: 2, fontFamily: FONTS.body },
});
