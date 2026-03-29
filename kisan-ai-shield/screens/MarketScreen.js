/**
 * screens/MarketScreen.js
 * Production-grade Mandi Prices Screen.
 * Uses real data.gov.in APMC API with Firestore cache and AI fallback.
 */
import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, StyleSheet, SafeAreaView, RefreshControl,
} from 'react-native';
import { COLORS, FONTS, RADIUS, SHADOW, SPACING } from '../constants/appTheme';
import { shared } from '../constants/sharedStyles';
import { LanguageContext } from '../context/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';
import { getMarketPrices, searchCrops, getCropEmoji } from '../services/mandiService';

const SOURCE_LABELS = {
  api: { label: '● LIVE', color: COLORS.green800, bg: COLORS.green100 },
  cache: { label: '📦 CACHED', color: '#555', bg: '#F0F3F6' },
  stale_cache: { label: '⚠ STALE', color: '#E65100', bg: '#FFF3E0' },
  ai_fallback: { label: '🤖 AI DATA', color: '#6A1B9A', bg: '#F3E5F5' },
  fallback: { label: '📋 OFFLINE', color: '#555', bg: '#F0F3F6' },
};

export default function MarketScreen() {
  const { t } = useContext(LanguageContext);

  const [allPrices, setAllPrices] = useState([]);
  const [displayPrices, setDisplayPrices] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [dataSource, setDataSource] = useState('');
  const [error, setError] = useState(null);

  const loadPrices = useCallback(async (force = false) => {
    if (!force) setIsLoading(true);
    setError(null);
    const { data, source, error: err } = await getMarketPrices(100, force);
    setAllPrices(data);
    setDisplayPrices(data);
    setDataSource(source);
    setLastUpdated(new Date());
    if (err) setError(err);
    setIsLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadPrices();
    // Auto-refresh every 30 minutes
    const interval = setInterval(() => loadPrices(true), 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadPrices]);

  const handleSearch = (text) => {
    setSearch(text);
    if (!text.trim()) {
      setDisplayPrices(allPrices);
    } else {
      setDisplayPrices(searchCrops(allPrices, text));
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPrices(true);
  };

  const getTimeStr = () => {
    if (!lastUpdated) return '';
    return lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const src = SOURCE_LABELS[dataSource] || SOURCE_LABELS.fallback;

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>{t('mandiTitle') || 'Mandi Prices'}</Text>
        <Text style={styles.pageSub}>Real-time APMC rates · data.gov.in</Text>

        {/* Search bar */}
        <View style={styles.searchContainer}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search crop or mandi..."
            placeholderTextColor={COLORS.gray400}
            value={search}
            onChangeText={handleSearch}
          />
          {search !== '' && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── INFO ROW ── */}
      <View style={styles.infoRow}>
        <View style={[styles.sourceBadge, { backgroundColor: src.bg }]}>
          <Text style={[styles.sourceText, { color: src.color }]}>{src.label}</Text>
        </View>
        <Text style={styles.lastUpdatedText}>
          {lastUpdated ? `Updated ${getTimeStr()}` : 'Loading...'}
        </Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.unitLabel}>₹ / KG</Text>
      </View>

      {/* ── CONTENT ── */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.green800} />
        }
      >
        {isLoading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.green800} />
            <Text style={styles.loadingText}>Fetching mandi rates...</Text>
          </View>
        ) : displayPrices.length > 0 ? (
          displayPrices.map((crop, i) => {
            const isUp   = crop.trend === 'Up';
            const isDown = crop.trend === 'Down';
            const isNew  = crop.trend === 'New';
            const trendColor = isUp ? COLORS.green800 : isDown ? COLORS.red : COLORS.gray600;

            return (
              <View key={crop.id || i} style={styles.priceCard}>
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.cropInfo}>
                    <Text style={styles.cropEmoji}>
                      {crop.emoji || getCropEmoji(crop.displayName || crop.name)}
                    </Text>
                    <View>
                      <Text style={styles.cropName}>{crop.displayName || crop.name}</Text>
                      <Text style={styles.mandiLocation}>
                        📍 {crop.topMarket}{crop.state ? `, ${crop.state}` : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.trendContainer}>
                    <Text style={[styles.trendIcon, { color: trendColor }]}>
                      {isUp ? '▲' : isDown ? '▼' : '●'}
                    </Text>
                    <Text style={[styles.trendPct, { color: trendColor }]}>
                      {isNew ? 'NEW' : (crop.changePercent || '0%')}
                    </Text>
                  </View>
                </View>

                {/* Price Grid */}
                <View style={styles.priceGrid}>
                  <View style={styles.priceItem}>
                    <Text style={styles.priceLabel}>TODAY</Text>
                    <Text style={styles.priceMain}>
                      ₹{parseFloat(crop.modalPricePerKg || 0).toFixed(2)}
                    </Text>
                  </View>
                  <View style={[styles.priceItem, styles.priceItemBorder]}>
                    <Text style={styles.priceLabel}>RANGE</Text>
                    <Text style={styles.priceSub}>
                      ₹{(crop.minPricePerKg || 0).toFixed(2)} – ₹{(crop.maxPricePerKg || 0).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.priceItem}>
                    <Text style={styles.priceLabel}>QTL RATE</Text>
                    <Text style={styles.priceSub}>
                      ₹{(crop.modalPricePerQuintal || 0).toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                {/* Footer */}
                <View style={styles.cardFooter}>
                  <Text style={styles.mandiCount}>
                    {crop.mandiCount || 1} market{(crop.mandiCount || 1) > 1 ? 's' : ''} reporting
                  </Text>
                  <Text style={styles.arrivalDate}>{crop.arrivalDate || 'Today'}</Text>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>🌾</Text>
            <Text style={styles.emptyText}>
              {search ? `No crop found for "${search}"` : 'No price data available.'}
            </Text>
            {!search && (
              <TouchableOpacity onPress={onRefresh} style={styles.retryBtn}>
                <Text style={styles.retryText}>↻ Retry</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <LanguageSelector />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { ...shared.safe },
  header: {
    backgroundColor: '#E65100',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20,
  },
  pageTitle: shared.pageTitle,
  pageSub: shared.pageSub,
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    paddingHorizontal: 12, marginTop: 16, height: 46,
    ...SHADOW.card,
  },
  searchInput: { flex: 1, fontFamily: FONTS.bodyMed, fontSize: 14, color: COLORS.gray800 },
  clearIcon: { fontSize: 16, color: COLORS.gray600, padding: 4 },

  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.gray100,
  },
  sourceBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginRight: 8 },
  sourceText: { fontFamily: FONTS.bodyBold, fontSize: 9 },
  lastUpdatedText: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.gray600 },
  unitLabel: { fontFamily: FONTS.bodyBold, fontSize: 11, color: COLORS.blue || '#1565C0' },

  content: { flex: 1, paddingHorizontal: 16 },

  loadingBox: { alignItems: 'center', paddingTop: 60 },
  loadingText: { fontFamily: FONTS.bodyMed, fontSize: 13, color: COLORS.gray600, marginTop: 12 },

  priceCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: 16, marginTop: 12, marginBottom: 4, ...SHADOW.card,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  cropInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cropEmoji: { fontSize: 30 },
  cropName: { fontFamily: FONTS.headingXl || FONTS.bodyBold, fontSize: 16, color: COLORS.gray800 },
  mandiLocation: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.gray600, marginTop: 2 },
  trendContainer: { alignItems: 'flex-end' },
  trendIcon: { fontSize: 16, marginBottom: 2 },
  trendPct: { fontFamily: FONTS.bodyBold, fontSize: 11 },

  priceGrid: {
    flexDirection: 'row', paddingVertical: 12,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.gray100,
  },
  priceItem: { flex: 1, alignItems: 'center' },
  priceItemBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: COLORS.gray100 },
  priceLabel: { fontFamily: FONTS.bodyBold, fontSize: 9, color: COLORS.gray600, marginBottom: 4 },
  priceMain: { fontFamily: FONTS.headingXl || FONTS.bodyBold, fontSize: 18, color: COLORS.green800 },
  priceSub: { fontFamily: FONTS.bodyBold, fontSize: 12, color: COLORS.gray800 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  mandiCount: { fontFamily: FONTS.body, fontSize: 10, color: COLORS.gray600 },
  arrivalDate: { fontFamily: FONTS.body, fontSize: 10, color: COLORS.gray600 },

  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontFamily: FONTS.bodyMed, fontSize: 14, color: COLORS.gray600, textAlign: 'center' },
  retryBtn: {
    marginTop: 16, backgroundColor: COLORS.green100,
    paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20,
  },
  retryText: { fontFamily: FONTS.bodyBold, fontSize: 13, color: COLORS.green800 },
});
