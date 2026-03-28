import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, StyleSheet, 
  Platform, StatusBar, ActivityIndicator, TextInput, RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, RADIUS, SHADOW } from '../constants/appTheme';
import { shared } from '../constants/sharedStyles';
import { getMarketPrices, searchCrops } from '../services/marketService';

interface Props {
  navigation?: { navigate: (route: string, params?: any) => void };
}

export default function MarketScreen({ navigation }: Props) {
  const [allPrices, setAllPrices] = useState<any[]>([]);
  const [displayPrices, setDisplayPrices] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [dataSource, setDataSource] = useState('');

  useEffect(() => {
    getPrices();
    // Auto-refresh every 30 minutes
    const interval = setInterval(getPrices, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getPrices = async (force = false) => {
    setLoading(true);
    const { data, source, error } = await getMarketPrices(100, force);
    if (!error) {
      setAllPrices(data);
      setDisplayPrices(data);
      setDataSource(source);
      setLastRefreshed(new Date());
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await getPrices(true); // Force real-time fetch
    setRefreshing(false);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setDisplayPrices(allPrices);
      return;
    }
    const results = searchCrops(allPrices, text);
    setDisplayPrices(results);
  };

  const getTimeString = () => {
    if (!lastRefreshed) return '';
    return lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.green900} />
      <View style={styles.header}>
        <Text style={shared.pageTitle}>Mandi Prices</Text>
        <Text style={shared.pageSub}>Real-time market rates (Telangana focus)</Text>

        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search crop or mandi location..."
            placeholderTextColor={COLORS.gray600}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{dataSource === 'api' ? '● Live' : '📦 Cached'}</Text>
        </View>
        <Text style={styles.lastUpdated}>Updated at {getTimeString()}</Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.unitText}>All prices in ₹/KG</Text>
      </View>

      <ScrollView 
        style={shared.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.green800} />
        }
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={COLORS.green800} style={{ marginTop: 40 }} />
        ) : displayPrices.length > 0 ? (
          displayPrices.map((crop, i) => {
            const isUp = crop.trend === 'Up';
            const isDown = crop.trend === 'Down';
            const trendColor = isUp ? COLORS.green800 : isDown ? COLORS.red : COLORS.gray600;

            return (
              <View key={i} style={styles.priceCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.cropInfo}>
                    <Text style={styles.cropIcon}>{getCropEmoji(crop.displayName)}</Text>
                    <View>
                      <Text style={styles.cropNameTitle}>{crop.displayName}</Text>
                      <Text style={styles.mandiLocation}>📍 {crop.topMarket}, {crop.state}</Text>
                    </View>
                  </View>
                  <View style={styles.trendContainer}>
                     <Text style={[styles.trendIcon, { color: trendColor }]}>
                       {isUp ? '▲' : isDown ? '▼' : '●'}
                     </Text>
                     <Text style={[styles.trendText, { color: trendColor }]}>
                       {crop.changePercent !== 'New' ? crop.changePercent : 'NEW'}
                     </Text>
                  </View>
                </View>

                <View style={styles.priceGrid}>
                   <View style={styles.priceItem}>
                     <Text style={styles.priceLabel}>TODAY</Text>
                     <Text style={styles.priceMain}>₹{crop.modalPricePerKg.toFixed(2)}</Text>
                   </View>
                   <View style={styles.priceItem}>
                     <Text style={styles.priceLabel}>RANGE</Text>
                     <Text style={styles.priceSub}>₹{crop.minPricePerKg} - ₹{crop.maxPricePerKg}</Text>
                   </View>
                   <View style={styles.priceItem}>
                     <Text style={styles.priceLabel}>QTL RATE</Text>
                     <Text style={styles.priceSub}>₹{crop.modalPricePerQuintal.toLocaleString('en-IN')}</Text>
                   </View>
                </View>

                <View style={styles.mandiSummary}>
                   <Text style={styles.mandiCount}>{crop.mandiCount} markets reporting today</Text>
                   <Text style={styles.arrivalDate}>{crop.arrivalDate}</Text>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>🌾</Text>
            <Text style={styles.emptyText}>No crop data found.</Text>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const getCropEmoji = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('rice') || n.includes('paddy')) return '🌾';
  if (n.includes('wheat')) return '🍞';
  if (n.includes('tomato')) return '🍅';
  if (n.includes('onion')) return '🧅';
  if (n.includes('potato')) return '🥔';
  if (n.includes('cotton')) return '☁️';
  if (n.includes('maize') || n.includes('corn')) return '🌽';
  if (n.includes('soybean')) return '🌱';
  if (n.includes('sugarcane')) return '🎋';
  if (n.includes('groundnut')) return '🥜';
  if (n.includes('turmeric')) return '🧂';
  if (n.includes('chilli')) return '🌶️';
  if (n.includes('banana')) return '🍌';
  if (n.includes('mango')) return '🥭';
  if (n.includes('sorghum') || n.includes('jowar')) return '🥣';
  return '🍃';
};

const styles = StyleSheet.create({
  safe: {
    flex: 1, backgroundColor: COLORS.green50,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    backgroundColor: COLORS.green900,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20,
    borderBottomLeftRadius: RADIUS.xl, borderBottomRightRadius: RADIUS.xl,
  },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    paddingHorizontal: 12, marginTop: 16, height: 46,
    ...SHADOW.card,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontFamily: FONTS.sans, fontSize: 14, color: COLORS.gray800 },
  clearIcon: { fontSize: 16, color: COLORS.gray600, padding: 4 },

  infoRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12 },
  statusBadge: { backgroundColor: COLORS.green100, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontFamily: FONTS.sansExtra, fontSize: 8, color: COLORS.green800 },
  lastUpdated: { fontFamily: FONTS.sans, fontSize: 11, color: COLORS.gray600, marginLeft: 8 },
  unitText: { fontFamily: FONTS.sansBold, fontSize: 11, color: COLORS.blue },

  priceCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: 16, marginBottom: 16, ...SHADOW.card,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  cropInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cropIcon: { fontSize: 32 },
  cropNameTitle: { fontFamily: FONTS.sansExtra, fontSize: 16, color: COLORS.gray800 },
  mandiLocation: { fontFamily: FONTS.sans, fontSize: 12, color: COLORS.gray600 },
  
  trendContainer: { alignItems: 'flex-end' },
  trendIcon: { fontSize: 16, marginBottom: 2 },
  trendText: { fontFamily: FONTS.sansBold, fontSize: 11 },

  priceGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.gray100 },
  priceItem: { flex: 1, alignItems: 'center' },
  priceLabel: { fontFamily: FONTS.sansBold, fontSize: 9, color: COLORS.gray600, marginBottom: 4 },
  priceMain: { fontFamily: FONTS.sansExtra, fontSize: 18, color: COLORS.green800 },
  priceSub: { fontFamily: FONTS.sansBold, fontSize: 12, color: COLORS.gray800 },

  mandiSummary: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  mandiCount: { fontFamily: FONTS.sans, fontSize: 10, color: COLORS.gray600 },
  arrivalDate: { fontFamily: FONTS.sans, fontSize: 10, color: COLORS.gray600 },

  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontFamily: FONTS.sansBold, fontSize: 14, color: COLORS.gray600 },
});
