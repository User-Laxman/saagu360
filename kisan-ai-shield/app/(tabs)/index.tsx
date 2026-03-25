import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform, StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { fetchWeatherData } from '../../services/weatherService';
import { fetchMarketPrices } from '../../services/marketService';
import { COLORS, FONTS, RADIUS, SHADOW } from '../../constants/appTheme';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning 🌤';
  if (h < 17) return 'Good Afternoon ☀️';
  return 'Good Evening 🌙';
}

function weatherEmoji(desc: string = ''): string {
  const d = desc.toLowerCase();
  if (d.includes('rain'))  return '🌧';
  if (d.includes('cloud')) return '⛅';
  if (d.includes('clear')) return '☀️';
  if (d.includes('storm')) return '⛈';
  return '🌤';
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const router = useRouter();
  const [weatherData, setWeatherData] = useState<any>(null);
  const [marketData, setMarketData]   = useState<any>(null);
  const [loading, setLoading]         = useState(true);
  const [activeCrop, setActiveCrop]   = useState(0);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        let city = 'Hyderabad', lat = null, lon = null;

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          try {
            let loc = await Location.getLastKnownPositionAsync({});
            if (!loc) loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Lowest });
            if (loc) {
              lat = loc.coords.latitude;
              lon = loc.coords.longitude;
              const geo = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
              if (geo.length > 0) city = geo[0].city || geo[0].subregion || 'Hyderabad';
            }
          } catch (_) {}
        }

        const [weather, market] = await Promise.all([
          fetchWeatherData(lat, lon, city),
          fetchMarketPrices(),
        ]);
        setWeatherData(weather);
        setMarketData(market);
      } catch (e) {
        console.error('Dashboard error', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Derived state
  const rainHigh  = (weatherData?.rain ?? 0) > 50;
  const cropChips = marketData?.crops?.slice(0, 4).map((c: any) => ({
    emoji: c.name === 'Wheat' ? '🌾' : c.name === 'Rice' ? '🌾' : c.name === 'Tomato' ? '🍅' : c.name === 'Onion' ? '🧅' : '🌽',
    name:  c.name,
    price: c.currentPrice,
    trend: c.trend,
  })) ?? [];

  // ── Loading ──
  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.green900} />
        <View style={styles.header}>
          <View style={styles.headerCircle1} />
          <View style={styles.headerCircle2} />
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greet}>{getGreeting()}</Text>
              <Text style={styles.name}>Kisan's Farm</Text>
            </View>
            <View style={styles.avatar}><Text style={{ fontSize: 22 }}>👨‍🌾</Text></View>
          </View>
          <View style={[styles.weatherPill, { justifyContent: 'center' }]}>
            <ActivityIndicator color={COLORS.white} />
            <Text style={[styles.weatherDesc, { marginLeft: 12 }]}>Syncing Farm Data…</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Full Dashboard ──
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.green900} />
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View style={styles.headerCircle1} />
          <View style={styles.headerCircle2} />

          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greet}>{getGreeting()}</Text>
              <Text style={styles.name}>Kisan's Farm</Text>
            </View>
            <View style={styles.avatar}>
              <Text style={{ fontSize: 22 }}>👨‍🌾</Text>
            </View>
          </View>

          {/* Live Weather Pill */}
          <View style={styles.weatherPill}>
            <Text style={{ fontSize: 32 }}>{weatherEmoji(weatherData?.description)}</Text>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.weatherTemp}>{weatherData?.temp ?? '--'}°C</Text>
              <Text style={styles.weatherDesc}>{weatherData?.description ?? 'Loading…'}</Text>
            </View>
            <View style={{ marginLeft: 'auto', alignItems: 'flex-end' }}>
              <Text style={styles.humidity}>💧 {weatherData?.humidity ?? '--'}%</Text>
              <Text style={styles.location}>📍 {weatherData?.city ?? 'Fetching…'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>

          {/* ── DYNAMIC ALERT CARD ── */}
          <View style={[styles.alertCard, rainHigh ? styles.alertRed : styles.alertGreen]}>
            <Text style={{ fontSize: 24 }}>{rainHigh ? '⚠️' : '✅'}</Text>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={[styles.alertTitle, { color: rainHigh ? '#D84315' : COLORS.green800 }]}>
                {rainHigh ? 'Heavy Rain Expected' : 'Good Day to Irrigate'}
              </Text>
              <Text style={styles.alertDesc}>
                {rainHigh
                  ? `Rain probability ${weatherData?.rain}% · Delay irrigation today`
                  : `Rain probability ${weatherData?.rain}% · Conditions are ideal`}
              </Text>
            </View>
          </View>

          {/* ── CROP MARKET CHIPS ── */}
          {cropChips.length > 0 && (
            <>
              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>Today's Mandi Rates</Text>
                <TouchableOpacity onPress={() => router.push('/market' as any)}>
                  <Text style={styles.seeAll}>See all →</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                {cropChips.map((c: any, i: number) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.cropChip, activeCrop === i && styles.cropChipActive]}
                    onPress={() => setActiveCrop(i)}
                  >
                    <Text style={{ fontSize: 16 }}>{c.emoji}</Text>
                    <View>
                      <Text style={[styles.cropName, activeCrop === i && styles.cropNameActive]}>{c.name}</Text>
                      <Text style={[styles.cropPrice, activeCrop === i && { color: COLORS.green200 }]}>
                        ₹{c.price}  {c.trend === 'up' ? '▲' : '▼'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {/* ── QUICK ACTIONS ── */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          <View style={styles.featGrid}>
            <TouchableOpacity
              style={[styles.featCard, styles.featCardGreen]}
              onPress={() => router.push('/disease' as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.featEmoji}>🔬</Text>
              <Text style={[styles.featLabel, { color: COLORS.white }]}>Scan Disease</Text>
              <Text style={[styles.featSub, { color: 'rgba(255,255,255,0.75)' }]}>Point camera at leaf</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.featCard}
              onPress={() => router.push('/weather' as any)}
              activeOpacity={0.8}
            >
              <View style={styles.liveBadge}><Text style={styles.liveBadgeText}>LIVE</Text></View>
              <Text style={styles.featEmoji}>🌦</Text>
              <Text style={styles.featLabel}>Weather</Text>
              <Text style={styles.featSub}>Irrigation advice</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.featCard}
              onPress={() => router.push('/market' as any)}
              activeOpacity={0.8}
            >
              <View style={styles.liveBadge}><Text style={styles.liveBadgeText}>LIVE</Text></View>
              <Text style={styles.featEmoji}>📈</Text>
              <Text style={styles.featLabel}>Mandi Prices</Text>
              <Text style={styles.featSub}>Today's rates</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.featCard}
              onPress={() => router.push('/schemes' as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.featEmoji}>🏛</Text>
              <Text style={styles.featLabel}>Schemes</Text>
              <Text style={styles.featSub}>Govt benefits</Text>
            </TouchableOpacity>
          </View>

          {/* ── AI SCAN PLACEHOLDER ── */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
          </View>
          <View style={styles.activityCard}>
            <View style={styles.actThumb}><Text style={{ fontSize: 20 }}>🌿</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actTitle}>AI Disease Scanner</Text>
              <Text style={styles.actSub}>Waiting for Member B's model…</Text>
            </View>
            <View style={styles.badgePending}>
              <Text style={styles.badgePendingText}>SOON</Text>
            </View>
          </View>
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.green50, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  scroll: { flex: 1 },

  // Header
  header: {
    backgroundColor: COLORS.green900,
    paddingHorizontal: 24, paddingTop: 20, paddingBottom: 32,
    borderBottomLeftRadius: RADIUS.xl, borderBottomRightRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  headerCircle1: { position: 'absolute', top: -40, right: -40, width: 200, height: 200, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 100 },
  headerCircle2: { position: 'absolute', bottom: -60, left: -20, width: 140, height: 140, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 70 },
  headerTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greet:         { color: COLORS.green200, fontFamily: FONTS.sans, fontSize: 14 },
  name:          { color: COLORS.white, fontFamily: FONTS.serif, fontSize: 28, marginTop: 4 },
  avatar:        { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.green400, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)' },

  // Weather Pill
  weatherPill:  { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: RADIUS.lg, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  weatherTemp:  { color: COLORS.white, fontFamily: FONTS.sansExtra, fontSize: 26 },
  weatherDesc:  { color: COLORS.green100, fontFamily: FONTS.sans, fontSize: 12, marginTop: 2 },
  humidity:     { color: COLORS.green200, fontFamily: FONTS.sansBold, fontSize: 12 },
  location:     { color: COLORS.green100, fontFamily: FONTS.sans, fontSize: 11, marginTop: 2 },

  content: { padding: 20 },

  // Alert
  alertCard:  { flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.md, padding: 16, borderLeftWidth: 4, marginBottom: 20, ...SHADOW.card },
  alertRed:   { backgroundColor: '#FFF8E1', borderLeftColor: COLORS.orange },
  alertGreen: { backgroundColor: '#E8F5E9', borderLeftColor: COLORS.green600 },
  alertTitle: { fontFamily: FONTS.sansBold, fontSize: 13 },
  alertDesc:  { fontFamily: FONTS.sans, fontSize: 11, color: COLORS.gray600, marginTop: 4 },

  // Sections
  sectionRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontFamily: FONTS.sansExtra, fontSize: 16, color: COLORS.gray800 },
  seeAll:       { fontFamily: FONTS.sansBold, fontSize: 13, color: COLORS.green800 },

  // Crop chips
  cropChip:       { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.white, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, marginRight: 10, ...SHADOW.card },
  cropChipActive: { backgroundColor: COLORS.green800 },
  cropName:       { fontFamily: FONTS.sansBold, fontSize: 13, color: COLORS.gray800 },
  cropNameActive: { color: COLORS.white },
  cropPrice:      { fontFamily: FONTS.sans, fontSize: 11, color: COLORS.gray600, marginTop: 2 },

  // Quick Actions Grid
  featGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  featCard:      { width: '47%', backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: 18, ...SHADOW.card, position: 'relative' },
  featCardGreen: { backgroundColor: COLORS.green800 },
  featEmoji:     { fontSize: 30, marginBottom: 12 },
  featLabel:     { fontFamily: FONTS.sansBold, fontSize: 14, color: COLORS.gray800 },
  featSub:       { fontFamily: FONTS.sans, fontSize: 11, color: COLORS.gray600, marginTop: 4 },
  liveBadge:     { position: 'absolute', top: 14, right: 14, backgroundColor: COLORS.orange, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  liveBadgeText: { fontFamily: FONTS.sansExtra, fontSize: 9, color: COLORS.white },

  // Activity
  activityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 16, marginBottom: 12, ...SHADOW.card },
  actThumb:     { width: 48, height: 48, borderRadius: 14, backgroundColor: COLORS.green100, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  actTitle:     { fontFamily: FONTS.sansBold, fontSize: 13, color: COLORS.gray800 },
  actSub:       { fontFamily: FONTS.sans, fontSize: 11, color: COLORS.gray600, marginTop: 4 },
  badgePending:     { backgroundColor: COLORS.amberBg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  badgePendingText: { fontFamily: FONTS.sansExtra, fontSize: 10, color: COLORS.amber },
});
