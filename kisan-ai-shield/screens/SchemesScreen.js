import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { COLORS, RADIUS, SHADOW } from '../constants/appTheme';
import { shared } from '../constants/sharedStyles';

const FILTERS = ['All', 'Insurance', 'Subsidies', 'Credit', 'Central'];

const SCHEMES = [
  {
    icon: '🌾', iconBg: COLORS.green100,
    name: 'PM-KISAN Samman Nidhi',
    ministry: 'Min. of Agriculture · Central',
    tags: [{ label: '₹6,000/yr', color: COLORS.green100, text: COLORS.green800 },
           { label: 'Direct Transfer', color: COLORS.blueBg, text: COLORS.blue }],
    desc: 'Annual income support of ₹6,000 in 3 instalments to all landholding farmer families across India.',
    filter: 'Central',
  },
  {
    icon: '🛡', iconBg: '#E3F2FD',
    name: 'PM Fasal Bima Yojana',
    ministry: 'Min. of Agriculture · Insurance',
    tags: [{ label: 'Low Premium', color: COLORS.amberBg, text: COLORS.orange },
           { label: 'Crop Insurance', color: COLORS.blueBg, text: COLORS.blue }],
    desc: 'Crop insurance providing financial support to farmers suffering losses due to natural calamities, pests & diseases.',
    filter: 'Insurance',
  },
  {
    icon: '⚡', iconBg: COLORS.amberBg,
    name: 'PM Kusum Yojana',
    ministry: 'Min. of New & Renewable Energy',
    tags: [{ label: 'Solar Pump', color: COLORS.green100, text: COLORS.green800 },
           { label: '90% Subsidy', color: COLORS.amberBg, text: COLORS.orange }],
    desc: 'Solar-powered irrigation pump subsidy up to 90% for small and marginal farmers to reduce diesel costs.',
    filter: 'Subsidies',
  },
  {
    icon: '🏦', iconBg: '#E8EAF6',
    name: 'Kisan Credit Card (KCC)',
    ministry: 'NABARD · Ministry of Finance',
    tags: [{ label: 'Low Interest', color: '#E8EAF6', text: '#3949AB' },
           { label: 'Credit', color: COLORS.green100, text: COLORS.green800 }],
    desc: 'Short-term credit at 4% interest rate for crop production, post-harvest, and maintenance of farm assets.',
    filter: 'Credit',
  },
  {
    icon: '🌊', iconBg: '#E0F7FA',
    name: 'Pradhan Mantri Krishi Sinchayee',
    ministry: 'Min. of Jal Shakti',
    tags: [{ label: 'Irrigation', color: '#E0F7FA', text: '#00838F' },
           { label: 'Subsidies', color: COLORS.green100, text: COLORS.green800 }],
    desc: 'Improve water use efficiency on farms with financial assistance for drip and sprinkler irrigation systems.',
    filter: 'Subsidies',
  },
];

export default function SchemesScreen() {
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = activeFilter === 'All'
    ? SCHEMES
    : SCHEMES.filter(s => s.filter === activeFilter);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.cloudBg}>🏛</Text>
          <Text style={styles.pageTitle}>Govt Schemes 🏛</Text>
          <Text style={styles.pageSub}>Benefits available for you · Updated Mar 2026</Text>
          <View style={styles.eligRow}>
            <Text style={styles.eligText}>✅  3 schemes you're eligible for</Text>
          </View>
        </View>

        <View style={styles.content}>

          {/* ── Filter Chips ── */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            {FILTERS.map((f, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
                onPress={() => setActiveFilter(f)}
              >
                <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ── Scheme Cards ── */}
          {filtered.map((s, i) => (
            <View key={i} style={styles.schemeCard}>
              <View style={styles.scTop}>
                <View style={[styles.scIcon, { backgroundColor: s.iconBg }]}>
                  <Text style={{ fontSize: 22 }}>{s.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.scName}>{s.name}</Text>
                  <Text style={styles.scMinistry}>{s.ministry}</Text>
                </View>
              </View>

              <View style={styles.scTags}>
                {s.tags.map((tag, j) => (
                  <View key={j} style={[styles.scTag, { backgroundColor: tag.color }]}>
                    <Text style={[styles.scTagText, { color: tag.text }]}>{tag.label}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.scDesc}>{s.desc}</Text>

              <TouchableOpacity
                style={styles.applyBtn}
                activeOpacity={0.85}
                onPress={() => Alert.alert('Apply', `Opening eligibility check for ${s.name}`)}
              >
                <Text style={styles.applyBtnText}>Check Eligibility & Apply →</Text>
              </TouchableOpacity>
            </View>
          ))}

          {filtered.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 32 }}>🔍</Text>
              <Text style={styles.emptyText}>No schemes in this category</Text>
            </View>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: shared.safe,
  header: {
    backgroundColor: '#4A148C',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24,
    overflow: 'hidden',
  },
  cloudBg:   { position: 'absolute', top: 10, right: 16, fontSize: 60, opacity: 0.15 },
  pageTitle: shared.pageTitle,
  pageSub:   shared.pageSub,
  eligRow:   {
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5, alignSelf: 'flex-start',
  },
  eligText: { color: '#fff', fontSize: 11, fontWeight: '600' },

  content: shared.content,

  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.gray100,
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: '#4A148C', borderColor: '#4A148C' },
  filterText:       { fontSize: 11, fontWeight: '600', color: COLORS.gray600 },
  filterTextActive: { color: '#fff' },

  schemeCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: 14, marginBottom: 12, ...SHADOW.card,
    borderWidth: 1.5, borderColor: COLORS.gray100,
  },
  scTop:     { flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'flex-start' },
  scIcon:    { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  scName:    { fontSize: 12.5, fontWeight: '800', color: COLORS.gray800, lineHeight: 18 },
  scMinistry:{ fontSize: 10, color: COLORS.gray600, fontWeight: '500', marginTop: 2 },
  scTags:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  scTag:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  scTagText: { fontSize: 9, fontWeight: '700' },
  scDesc:    { fontSize: 10.5, color: COLORS.gray600, lineHeight: 16, marginBottom: 12, fontWeight: '500' },
  applyBtn: {
    backgroundColor: COLORS.green800, borderRadius: RADIUS.sm,
    paddingVertical: 10, alignItems: 'center',
  },
  applyBtnText: { color: '#fff', fontSize: 11.5, fontWeight: '700' },

  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText:  { fontSize: 13, color: COLORS.gray600, fontWeight: '500' },
});
