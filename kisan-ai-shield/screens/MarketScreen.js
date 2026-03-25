import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { COLORS, RADIUS, SHADOW } from '../constants/appTheme';
import { shared } from '../constants/sharedStyles';

const PRICES = [
  { emoji: '🌾', name: 'Wheat',   price: '₹2,150', change: '+2.4%', up: true  },
  { emoji: '🌽', name: 'Maize',   price: '₹1,820', change: '-0.8%', up: false },
  { emoji: '🍅', name: 'Tomato',  price: '₹3,400', change: '+5.2%', up: true  },
  { emoji: '🧅', name: 'Onion',   price: '₹1,650', change: '-1.3%', up: false },
  { emoji: '🫑', name: 'Chilli',  price: '₹9,200', change: '+3.7%', up: true  },
  { emoji: '🌱', name: 'Soybean', price: '₹4,100', change: '+1.1%', up: true  },
  { emoji: '🥜', name: 'Groundnut', price: '₹5,800', change: '+0.6%', up: true },
  { emoji: '🌿', name: 'Cotton',  price: '₹7,300', change: '-2.1%', up: false },
];

export default function MarketScreen() {
  const [query, setQuery] = useState('');

  const filtered = PRICES.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.cloudBg}>📊</Text>
          <Text style={styles.pageTitle}>Mandi Prices 📊</Text>
          <Text style={styles.pageSub}>Real-time crop rates · Agmarknet</Text>
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Updated 15 min ago</Text>
          </View>
        </View>

        <View style={styles.content}>

          {/* ── Sell Signal ── */}
          <View style={styles.sellCard}>
            <Text style={{ fontSize: 22 }}>💡</Text>
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.sellTitle}>Sell Signal — Chilli</Text>
              <Text style={styles.sellDesc}>Prices up 12% this week · Good time to sell</Text>
            </View>
            <Text style={styles.sellArrow}>→</Text>
          </View>

          {/* ── Search ── */}
          <View style={styles.searchBar}>
            <Text style={{ fontSize: 16 }}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search crop or mandi..."
              placeholderTextColor={COLORS.gray300}
              value={query}
              onChangeText={setQuery}
            />
          </View>

          {/* ── Market Table ── */}
          <Text style={styles.sectionTitle}>Khammam Mandi Rates</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.colHead, { flex: 1.4 }]}>Crop</Text>
              <Text style={[styles.colHead, { flex: 1 }]}>₹ / Qtl</Text>
              <Text style={[styles.colHead, { flex: 1 }]}>Change</Text>
            </View>

            {/* Table Rows */}
            {filtered.map((p, i) => (
              <View key={i} style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt]}>
                <View style={[styles.cropCell, { flex: 1.4 }]}>
                  <Text style={{ fontSize: 16 }}>{p.emoji}</Text>
                  <Text style={styles.cropName}>{p.name}</Text>
                </View>
                <Text style={[styles.priceCell, { flex: 1 }]}>{p.price}</Text>
                <View style={{ flex: 1, alignItems: 'flex-start' }}>
                  <View style={[styles.changeBadge, p.up ? styles.changeUp : styles.changeDn]}>
                    <Text style={[styles.changeText, { color: p.up ? COLORS.green800 : COLORS.red }]}>
                      {p.up ? '▲' : '▼'} {p.change}
                    </Text>
                  </View>
                </View>
              </View>
            ))}

            {filtered.length === 0 && (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>No crops found for "{query}"</Text>
              </View>
            )}
          </View>

          {/* ── Mandi Selector ── */}
          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Nearby Mandis</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['Khammam', 'Bhadrachalam', 'Kothagudem', 'Hyderabad', 'Warangal'].map((m, i) => (
              <View key={i} style={[styles.mandiChip, i === 0 && styles.mandiChipActive]}>
                <Text style={[styles.mandiName, i === 0 && styles.mandiNameActive]}>📍 {m}</Text>
              </View>
            ))}
          </ScrollView>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: shared.safe,
  header: {
    backgroundColor: '#E65100',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24,
    overflow: 'hidden',
  },
  cloudBg:   { position: 'absolute', top: 10, right: 16, fontSize: 60, opacity: 0.18 },
  pageTitle: shared.pageTitle,
  pageSub:   shared.pageSub,
  liveRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot:   { width: 7, height: 7, borderRadius: 4, backgroundColor: '#A5D6A7' },
  liveText:  { color: '#fff', fontSize: 10, fontWeight: '600' },

  content: shared.content,

  sellCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.green50,
    borderWidth: 2, borderColor: COLORS.green200,
    borderRadius: RADIUS.lg, padding: 12, marginBottom: 12,
  },
  sellTitle:  { fontSize: 12, fontWeight: '700', color: COLORS.green800 },
  sellDesc:   { fontSize: 10, color: COLORS.green600, fontWeight: '500', marginTop: 2 },
  sellArrow:  { fontSize: 18, color: COLORS.green600, fontWeight: '700' },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.white, borderRadius: RADIUS.md,
    padding: 10, marginBottom: 14,
    borderWidth: 1.5, borderColor: COLORS.gray100, ...SHADOW.card,
  },
  searchInput: { flex: 1, fontSize: 12, color: COLORS.gray800, fontWeight: '500' },

  sectionTitle: shared.sectionTitle,

  table: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    overflow: 'hidden', ...SHADOW.card,
    borderWidth: 1.5, borderColor: COLORS.gray100, marginBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row', backgroundColor: COLORS.green900,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  colHead: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: COLORS.gray100,
  },
  tableRowAlt: { backgroundColor: COLORS.green50 },
  cropCell:    { flexDirection: 'row', alignItems: 'center', gap: 7 },
  cropName:    { fontSize: 11, fontWeight: '700', color: COLORS.gray800 },
  priceCell:   { fontSize: 12, fontWeight: '800', color: COLORS.gray800 },
  changeBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 20 },
  changeUp:    { backgroundColor: COLORS.green100 },
  changeDn:    { backgroundColor: COLORS.redBg },
  changeText:  { fontSize: 9.5, fontWeight: '700' },
  emptyRow:    { padding: 20, alignItems: 'center' },
  emptyText:   { fontSize: 12, color: COLORS.gray600, fontStyle: 'italic' },

  mandiChip: {
    backgroundColor: COLORS.white, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
    marginRight: 8, borderWidth: 1.5, borderColor: COLORS.gray100,
  },
  mandiChipActive: { backgroundColor: COLORS.green800, borderColor: COLORS.green800 },
  mandiName:       { fontSize: 11, fontWeight: '600', color: COLORS.gray600 },
  mandiNameActive: { color: '#fff' },
});
