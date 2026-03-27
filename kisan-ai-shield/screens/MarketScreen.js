import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SHADOW, SPACING } from '../constants/appTheme';
import { shared } from '../constants/sharedStyles';
import { LanguageContext } from '../context/LanguageContext';
import { getLocalPrices, fetchMandiPricesFromAI } from '../services/mandiService';
import LanguageSelector from '../components/LanguageSelector';

export default function MarketScreen() {
  const { t, language } = useContext(LanguageContext);
  const [search, setSearch] = useState('');
  const [activeMandi, setActiveMandi] = useState('Khammam');
  const [isLoading, setIsLoading] = useState(false);

  // Load instant local data immediately
  const localData = getLocalPrices(activeMandi);
  const [prices, setPrices] = useState(localData.prices);
  const [signal, setSignal] = useState(localData.signal);

  const loadPrices = async (mandiStr) => {
    // Instantly show local data
    const local = getLocalPrices(mandiStr);
    setPrices(local.prices);
    setSignal(local.signal);

    // Then try AI upgrade in background
    setIsLoading(true);
    const aiData = await fetchMandiPricesFromAI(mandiStr, language);
    if (aiData && aiData.prices && aiData.prices.length > 0) {
      setPrices(aiData.prices);
      if (aiData.signal) setSignal(aiData.signal);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadPrices(activeMandi);
  }, [activeMandi, language]);

  const filtered = prices.filter(p =>
    (p.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>{t('mandiTitle')}</Text>
          <Text style={styles.pageSub}>{t('mandiSub')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={styles.liveRow}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>{isLoading ? "Fetching markets..." : "Live Data"}</Text>
            </View>
            <TouchableOpacity 
              onPress={() => loadPrices(activeMandi)} 
              disabled={isLoading}
              style={{ backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 }}
            >
              <Text style={{ color: '#E65100', fontSize: 11, fontWeight: '800' }}>
                {isLoading ? '↻ Syncing...' : '↻ Refresh'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>

          {/* ── Sell Signal ── */}
          {signal && !isLoading && (
            <View style={styles.sellCard}>
              <Text style={{ fontSize: 22 }}>{signal.emoji || '💡'}</Text>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.sellTitle}>{signal.title}</Text>
                <Text style={styles.sellDesc}>{signal.desc}</Text>
              </View>
              <Text style={styles.sellArrow}>→</Text>
            </View>
          )}

          {/* ── Search ── */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={COLORS.gray400} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('searchPlaceholder')}
              placeholderTextColor={COLORS.gray400}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* ── Market Table ── */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>{activeMandi} Mandi Rates</Text>
            {isLoading && <ActivityIndicator size="small" color="#E65100" />}
          </View>
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
                <Text style={styles.emptyText}>No crops found for "{search}"</Text>
              </View>
            )}
          </View>

          {/* ── Mandi Selector ── */}
          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Nearby Mandis</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['Khammam', 'Bhadrachalam', 'Kothagudem', 'Hyderabad', 'Warangal', 'Nizamabad'].map((m, i) => (
              <TouchableOpacity key={i} onPress={() => setActiveMandi(m)} style={[styles.mandiChip, activeMandi === m && styles.mandiChipActive]}>
                <Text style={[styles.mandiName, activeMandi === m && styles.mandiNameActive]}>📍 {m}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

        </View>
      </ScrollView>

      {/* Floating Action Button seamlessly injected */}
      <LanguageSelector />
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
  liveText:  { color: '#fff', fontSize: 11, fontFamily: FONTS.bodySemi },

  content: shared.content,

  sellCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.green50,
    borderWidth: 2, borderColor: COLORS.green200,
    borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md,
  },
  sellTitle:  { fontSize: 13, fontFamily: FONTS.bodyBold, color: COLORS.green800 },
  sellDesc:   { fontSize: 11, color: COLORS.green800, fontFamily: FONTS.bodyMed, marginTop: 2 },
  sellArrow:  { fontSize: 18, color: COLORS.green600, fontFamily: FONTS.bodyBold },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.white, borderRadius: RADIUS.md,
    padding: 10, marginBottom: 14,
    borderWidth: 1.5, borderColor: COLORS.gray100, ...SHADOW.card,
  },
  searchInput: { flex: 1, fontSize: 13, color: COLORS.gray800, fontFamily: FONTS.bodyMed },

  sectionTitle: shared.sectionTitle,

  table: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    overflow: 'hidden', ...SHADOW.card,
    borderWidth: 1.5, borderColor: COLORS.gray100, marginBottom: SPACING.sm,
  },
  tableHeader: {
    flexDirection: 'row', backgroundColor: COLORS.green900,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  colHead: { fontSize: 10, fontFamily: FONTS.bodyBold, color: 'rgba(255,255,255,0.85)' },
  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: COLORS.gray100,
  },
  tableRowAlt: { backgroundColor: COLORS.green50 },
  cropCell:    { flexDirection: 'row', alignItems: 'center', gap: 7 },
  cropName:    { fontSize: 12, fontFamily: FONTS.bodyBold, color: COLORS.gray800 },
  priceCell:   { fontSize: 13, fontFamily: FONTS.headingXl, color: COLORS.gray800 },
  changeBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 20 },
  changeUp:    { backgroundColor: COLORS.green100 },
  changeDn:    { backgroundColor: COLORS.redBg },
  changeText:  { fontSize: 11, fontFamily: FONTS.bodyBold },
  emptyRow:    { padding: SPACING.xl, alignItems: 'center' },
  emptyText:   { fontSize: 13, color: COLORS.gray800, fontStyle: 'italic', fontFamily: FONTS.body },

  mandiChip: {
    backgroundColor: COLORS.white, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 10,
    marginRight: 8, borderWidth: 1.5, borderColor: COLORS.gray100,
  },
  mandiChipActive: { backgroundColor: COLORS.green800, borderColor: COLORS.green800 },
  mandiName:       { fontSize: 12, fontFamily: FONTS.bodySemi, color: COLORS.gray600 },
  mandiNameActive: { color: '#fff' },
});
