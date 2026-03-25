import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { COLORS, RADIUS, SHADOW } from '../constants/appTheme';
import { shared } from '../constants/sharedStyles';

const REMEDIES = [
  'Spray Mancozeb 75WP @ 2g/L water every 7 days',
  'Remove infected leaves immediately to prevent spread',
  'Ensure proper spacing for air circulation in field',
];

const PREV_SCANS = [
  { icon: '🌾', name: 'Wheat — Rust Disease',  date: 'Mar 22 · Field 2', ok: false, badge: 'Treat'  },
  { icon: '🍅', name: 'Tomato — Healthy',       date: 'Mar 20 · Field 1', ok: true,  badge: 'Good'   },
  { icon: '🌽', name: 'Maize — Smut Detected',  date: 'Mar 18 · Field 3', ok: false, badge: 'Urgent' },
];

export default function DiseaseScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Header / Scan Area ── */}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>🔬 Disease Detection</Text>
          <Text style={styles.pageSub}>AI-powered leaf analysis</Text>

          <TouchableOpacity
            style={styles.scanArea}
            activeOpacity={0.8}
            onPress={() => Alert.alert('Camera', 'Camera integration goes here (expo-camera)')}
          >
            <Text style={{ fontSize: 44 }}>📸</Text>
            <Text style={styles.scanText}>Tap to Scan Leaf</Text>
            <Text style={styles.scanSub}>Camera · Gallery · or drag image</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>

          {/* ── AI Result Card ── */}
          <View style={styles.resultCard}>
            <View style={styles.resultBadge}>
              <Text style={styles.resultBadgeText}>⚡ AI RESULT</Text>
            </View>
            <View style={styles.resultTop}>
              <View style={styles.resultImg}><Text style={{ fontSize: 28 }}>🌿</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.resultName}>Leaf Blight Detected</Text>
                <Text style={styles.resultConf}>94.2% Confidence</Text>
                <View style={styles.severityBadge}>
                  <Text style={styles.severityText}>⚠ Moderate Severity</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.remedyTitle}>Recommended Treatment</Text>
            {REMEDIES.map((r, i) => (
              <View key={i} style={styles.remedyRow}>
                <View style={styles.remedyDot} />
                <Text style={styles.remedyText}>{r}</Text>
              </View>
            ))}
          </View>

          {/* ── Previous Scans ── */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Previous Scans</Text>
            <Text style={styles.seeAll}>View all</Text>
          </View>

          {PREV_SCANS.map((s, i) => (
            <View key={i} style={styles.prevCard}>
              <View style={styles.prevThumb}>
                <Text style={{ fontSize: 20 }}>{s.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.prevName}>{s.name}</Text>
                <Text style={styles.prevDate}>{s.date}</Text>
              </View>
              <View style={[shared.badge, s.ok ? shared.badgeGreen : shared.badgeRed]}>
                <Text style={[shared.badgeText, { color: s.ok ? COLORS.green800 : COLORS.red }]}>
                  {s.badge}
                </Text>
              </View>
            </View>
          ))}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    shared.safe,
  header: {
    backgroundColor: COLORS.green900,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  pageTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 2 },
  pageSub:   { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '500', marginBottom: 16 },

  scanArea: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)',
    borderStyle: 'dashed', borderRadius: RADIUS.lg,
    height: 160, alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  scanText: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '700' },
  scanSub:  { color: 'rgba(255,255,255,0.6)', fontSize: 10 },

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

  resultTop:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12, marginTop: 6 },
  resultImg: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: COLORS.green200,
    alignItems: 'center', justifyContent: 'center',
  },
  resultName:     { fontSize: 14, fontWeight: '800', color: COLORS.gray800 },
  resultConf:     { fontSize: 11, color: COLORS.green600, fontWeight: '600', marginTop: 2 },
  severityBadge:  { backgroundColor: COLORS.redBg, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginTop: 4 },
  severityText:   { fontSize: 10, color: COLORS.red, fontWeight: '700' },

  divider: { height: 1, backgroundColor: COLORS.green200, marginBottom: 10 },

  remedyTitle: { fontSize: 11, fontWeight: '700', color: COLORS.gray800, marginBottom: 8 },
  remedyRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  remedyDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.green600, marginTop: 5, flexShrink: 0 },
  remedyText:  { fontSize: 10.5, color: COLORS.gray600, lineHeight: 16, flex: 1, fontWeight: '500' },

  sectionRow:   shared.sectionRow,
  sectionTitle: shared.sectionTitle,
  seeAll:       shared.seeAll,

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
  prevName:    { fontSize: 11.5, fontWeight: '700', color: COLORS.gray800 },
  prevDate:    { fontSize: 10, color: COLORS.gray600, marginTop: 2 },
  badge:       shared.badge,
  badgeGreen:  shared.badgeGreen,
  badgeRed:    shared.badgeRed,
  badgeText:   shared.badgeText,
});
