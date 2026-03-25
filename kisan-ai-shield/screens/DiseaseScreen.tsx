import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, RADIUS, SHADOW } from '../constants/appTheme';
import { shared } from '../constants/sharedStyles';

interface Props {
  navigation: { navigate: (route: string) => void };
}

const REMEDIES = [
  { crop: 'Maize', disease: 'Common Smut', remedy: 'Remove galls before they burst. Apply fungicide as preventative.' },
];

export default function DiseaseScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={shared.pageTitle}>Scan Disease</Text>
        <Text style={shared.pageSub}>AI-powered leaf analysis</Text>
      </View>
      <ScrollView style={shared.content}>
        <View style={styles.scannerBox}>
          <Text style={{ fontSize: 60, marginBottom: 16 }}>📷</Text>
          <Text style={styles.scanTitle}>Point camera at a leaf</Text>
          <Text style={styles.scanDesc}>Make sure the leaf is well-lit and in focus.</Text>
          <TouchableOpacity style={styles.scanBtn}>
            <Text style={styles.scanBtnText}>Tap to Scan</Text>
          </TouchableOpacity>
        </View>

        <Text style={[shared.sectionTitle, { marginTop: 12 }]}>Previous Scans</Text>
        {REMEDIES.map((r, i) => (
          <View key={i} style={styles.historyCard}>
            <View style={styles.historyLeft}>
              <Text style={{ fontSize: 28 }}>🌽</Text>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.histCrop}>{r.crop} · <Text style={{ color: COLORS.orange }}>{r.disease}</Text></Text>
                <Text style={styles.histRemedy}>{r.remedy}</Text>
              </View>
            </View>
          </View>
        ))}
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
  scanTitle: { fontFamily: FONTS.sansExtra, fontSize: 16, color: COLORS.gray800, marginBottom: 4 },
  scanDesc: { fontFamily: FONTS.sans, fontSize: 13, color: COLORS.gray600, textAlign: 'center', marginBottom: 24 },
  scanBtn: { backgroundColor: COLORS.green800, paddingHorizontal: 32, paddingVertical: 14, borderRadius: RADIUS.lg },
  scanBtnText: { fontFamily: FONTS.sansBold, fontSize: 14, color: COLORS.white },
  historyCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: 16, marginBottom: 12, ...SHADOW.card
  },
  historyLeft: { flexDirection: 'row', alignItems: 'center' },
  histCrop: { fontFamily: FONTS.sansBold, fontSize: 14, color: COLORS.gray800, marginBottom: 4 },
  histRemedy: { fontFamily: FONTS.sans, fontSize: 12, color: COLORS.gray600, lineHeight: 18 },
});
