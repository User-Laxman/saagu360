import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SHADOW } from '../constants/appTheme';
import { shared } from '../constants/sharedStyles';
import { LanguageContext } from '../context/LanguageContext';
import { fetchWeather } from '../services/weatherService';
import LanguageSelector from '../components/LanguageSelector';

const CROPS = [
  { emoji: '🌾', name: 'Wheat',  active: true  },
  { emoji: '🌽', name: 'Maize',  active: false },
  { emoji: '🍅', name: 'Tomato', active: false },
  { emoji: '🧅', name: 'Onion',  active: false },
  { emoji: '🫑', name: 'Chilli', active: false },
];

const ACTIVITY = [
  { icon: '🌿', title: 'Wheat scan completed',  sub: '2 hours ago · Healthy',  badge: 'OK',   ok: true  },
  { icon: '💧', title: 'Irrigation scheduled',   sub: 'Yesterday · 6 AM',       badge: 'Done', ok: true  },
  { icon: '⚠️', title: 'Maize — Smut Detected',  sub: 'Mar 18 · Field 3',       badge: 'Act',  ok: false },
];

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useContext(LanguageContext);
  const [activeCrop, setActiveCrop] = useState(0);
  const [weatherData, setWeatherData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadWeather = async () => {
    setIsRefreshing(true);
    const data = await fetchWeather();
    if (data) setWeatherData(data.current);
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadWeather();
  }, []);

  const getAlertConfig = (current) => {
    if (!current) return null;
    const cond = current.weather[0].main;
    const temp = current.main.temp;
    
    if (cond === 'Rain' || cond === 'Thunderstorm' || cond === 'Drizzle') {
      return { icon: '⚠️', title: 'Rain Expected', desc: 'Delay irrigation and pesticide sprays today.', colors: { bg: COLORS.amberBg, border: '#FFE082', title: '#E65100', desc: '#BF360C' } };
    }
    if (temp > 35) {
      return { icon: '🔥', title: 'Extreme Heat Warning', desc: 'Water crops early morning to prevent evaporation loss.', colors: { bg: '#FFEBEE', border: '#FFCDD2', title: '#C62828', desc: '#b71c1c' } };
    }
    if (temp < 15) {
      return { icon: '❄️', title: 'Cold Temp Alert', desc: 'Monitor for frost if temperatures drop further tonight.', colors: { bg: '#E3F2FD', border: '#90CAF9', title: '#1565C0', desc: '#0D47A1' } };
    }
    return { icon: '✅', title: 'Optimal Weather', desc: 'Current conditions are safe for all routine farm activities.', colors: { bg: COLORS.green50, border: COLORS.green200, title: COLORS.green800, desc: COLORS.green800 } };
  };

  const alert = getAlertConfig(weatherData);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerCircle1} />
          <View style={styles.headerCircle2} />
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greet}>{t('goodMorning')}</Text>
              <Text style={styles.name}>Ravi's Farm</Text>
            </View>
            <View style={styles.avatar}><Text style={{ fontSize: 22 }}>👨‍🌾</Text></View>
          </View>
          {/* Weather Pill */}
          <View style={styles.weatherPill}>
            {weatherData ? (
              <>
                <Text style={{ fontSize: 30 }}>⛅</Text>
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.weatherTemp}>{Math.round(weatherData.main.temp)}°C</Text>
                  <Text style={styles.weatherDesc}>{weatherData.weather[0].main} · {weatherData.name}</Text>
                </View>
                <View style={{ marginLeft: 'auto', alignItems: 'flex-end' }}>
                  <Text style={styles.humidity}>💧 {weatherData.main.humidity}%</Text>
                  <TouchableOpacity onPress={loadWeather} disabled={isRefreshing} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <Text style={[styles.location, { color: COLORS.green200 }]}>
                      {isRefreshing ? '↻ Syncing...' : '↻ Refresh GPS'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <Text style={{ color: '#fff', fontSize: 12 }}>{isRefreshing ? 'Locating...' : 'Loading weather...'}</Text>
            )}
          </View>
        </View>

        <View style={styles.content}>

          {/* ── Alert ── */}
          {alert && (
            <View style={[styles.alertCard, { backgroundColor: alert.colors.bg, borderColor: alert.colors.border }]}>
              <Text style={{ fontSize: 22 }}>{alert.icon}</Text>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={[styles.alertTitle, { color: alert.colors.title }]}>{alert.title}</Text>
                <Text style={[styles.alertDesc, { color: alert.colors.desc }]}>{alert.desc}</Text>
              </View>
            </View>
          )}

          {/* ── Crops ── */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>{t('myCrops')}</Text>
            <Text style={styles.seeAll}>+ Add</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {CROPS.map((c, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.cropChip, activeCrop === i && styles.cropChipActive]}
                onPress={() => setActiveCrop(i)}
              >
                <Text style={{ fontSize: 13 }}>{c.emoji}</Text>
                <Text style={[styles.cropName, activeCrop === i && styles.cropNameActive]}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ── Quick Actions ── */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>{t('quickActions')}</Text>
            <Text style={styles.seeAll}>See all</Text>
          </View>
          <View style={styles.featGrid}>
            <TouchableOpacity
              style={[styles.featCard, styles.featCardGreen]}
              onPress={() => router.push('/disease-scan')}
              activeOpacity={0.85}
            >
              <Text style={styles.featEmoji}>🔬</Text>
              <Text style={[styles.featLabel, { color: '#fff' }]}>{t('scanDisease')}</Text>
              <Text style={[styles.featSub, { color: 'rgba(255,255,255,0.75)' }]}>{t('pointCamera')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.featCard}
              onPress={() => router.push('/weather-irrigation')}
              activeOpacity={0.85}
            >
              <View style={styles.liveBadge}><Text style={styles.liveBadgeText}>LIVE</Text></View>
              <Text style={styles.featEmoji}>🌦</Text>
              <Text style={styles.featLabel}>{t('weather')}</Text>
              <Text style={styles.featSub}>{t('irrigationAdvice')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.featCard}
              onPress={() => router.push('/market-prices')}
              activeOpacity={0.85}
            >
              <Text style={styles.featEmoji}>📈</Text>
              <Text style={styles.featLabel}>{t('mandiPrices')}</Text>
              <Text style={styles.featSub}>Today's rates</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.featCard}
              onPress={() => router.push('/schemes')}
              activeOpacity={0.85}
            >
              <Text style={styles.featEmoji}>🏛</Text>
              <Text style={styles.featLabel}>{t('schemes')}</Text>
              <Text style={styles.featSub}>{t('schemesSub')}</Text>
            </TouchableOpacity>
          </View>

          {/* ── Recent Activity ── */}
          <View style={[styles.sectionRow, { marginTop: 4 }]}>
            <Text style={styles.sectionTitle}>{t('recentActivity')}</Text>
          </View>
          {ACTIVITY.map((a, i) => (
            <View key={i} style={styles.activityCard}>
              <View style={styles.actThumb}><Text style={{ fontSize: 18 }}>{a.icon}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actTitle}>{a.title}</Text>
                <Text style={styles.actSub}>{a.sub}</Text>
              </View>
              <View style={[shared.badge, a.ok ? shared.badgeGreen : shared.badgeRed]}>
                <Text style={[shared.badgeText, { color: a.ok ? COLORS.green800 : COLORS.red }]}>
                  {a.badge}
                </Text>
              </View>
            </View>
          ))}

        </View>
      </ScrollView>

      {/* FLOATING ACTION BUTTON CAREFULLY POSITIONED */}
      <LanguageSelector />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   shared.safe,
  scroll: { flex: 1 },
  header: {
    backgroundColor: COLORS.green800,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    overflow: 'hidden',
  },
  headerCircle1: {
    position: 'absolute', top: -30, right: -30,
    width: 160, height: 160,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 80,
  },
  headerCircle2: {
    position: 'absolute', bottom: -50, left: -20,
    width: 120, height: 120,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 60,
  },
  headerTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  greet:      { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '500' },
  name:       { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 2 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.green400,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  weatherPill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14, padding: 12,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  weatherTemp: { color: '#fff', fontSize: 22, fontWeight: '800' },
  weatherDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '500' },
  humidity:    { color: '#A5D6A7', fontSize: 11, fontWeight: '600' },
  location:    { color: 'rgba(255,255,255,0.8)', fontSize: 10 },

  content: shared.content,

  alertCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.amberBg,
    borderWidth: 1.5, borderColor: '#FFE082',
    borderRadius: RADIUS.lg, padding: 12,
    marginBottom: 14,
  },
  alertTitle: { fontSize: 12, fontWeight: '700', color: '#E65100' },
  alertDesc:  { fontSize: 10, color: '#BF360C', fontWeight: '500', marginTop: 2 },

  sectionRow:    shared.sectionRow,
  sectionTitle:  { fontSize: 13, fontWeight: '700', color: COLORS.gray800 },
  seeAll:        shared.seeAll,

  cropChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.green100,
    borderWidth: 1.5, borderColor: COLORS.green200,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
    marginRight: 8,
  },
  cropChipActive: { backgroundColor: COLORS.green800, borderColor: COLORS.green800 },
  cropName:       { fontSize: 11, fontWeight: '600', color: COLORS.green800 },
  cropNameActive: { color: '#fff' },

  featGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  featCard: {
    width: '47.5%', backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg, padding: 14,
    borderWidth: 1.5, borderColor: COLORS.green100,
    ...SHADOW.card, position: 'relative',
  },
  featCardGreen: { backgroundColor: COLORS.green800, borderColor: 'transparent' },
  featEmoji: { fontSize: 26, marginBottom: 8 },
  featLabel: { fontSize: 12, fontWeight: '700', color: COLORS.gray800 },
  featSub:   { fontSize: 10, color: COLORS.gray600, marginTop: 2, fontWeight: '500' },
  liveBadge: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: COLORS.amber, borderRadius: 20,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  liveBadgeText: { fontSize: 8, fontWeight: '700', color: '#fff' },

  activityCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: RADIUS.md,
    padding: 12, marginBottom: 8, ...SHADOW.card,
  },
  actThumb: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: COLORS.green100,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  actTitle:  { fontSize: 11.5, fontWeight: '700', color: COLORS.gray800 },
  actSub:    { fontSize: 10, color: COLORS.gray600, marginTop: 1 },
  badge:     shared.badge,
  badgeGreen:shared.badgeGreen,
  badgeRed:  shared.badgeRed,
  badgeText: shared.badgeText,
});
