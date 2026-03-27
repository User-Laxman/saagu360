import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, Animated, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, RADIUS, SHADOW, SPACING } from '../constants/appTheme';
import { shared } from '../constants/sharedStyles';
import { LanguageContext } from '../context/LanguageContext';
import { fetchWeather } from '../services/weatherService';
import LanguageSelector from '../components/LanguageSelector';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ALL_CROPS = [
  { emoji: '🌾', name: 'Wheat' },
  { emoji: '🌽', name: 'Maize' },
  { emoji: '🍅', name: 'Tomato' },
  { emoji: '🧅', name: 'Onion' },
  { emoji: '🫑', name: 'Chilli' },
  { emoji: '🌿', name: 'Soybean' },
  { emoji: '🥜', name: 'Groundnut' },
  { emoji: '🌻', name: 'Sunflower' },
  { emoji: '🍚', name: 'Rice' },
  { emoji: '🥒', name: 'Cucumber' },
  { emoji: '🍋', name: 'Lemon' },
  { emoji: '🍌', name: 'Banana' },
];

const DEFAULT_CROPS = [
  { emoji: '🌾', name: 'Wheat' },
  { emoji: '🌽', name: 'Maize' },
  { emoji: '🍅', name: 'Tomato' },
];

const STORAGE_KEY = 'kisan_my_crops';

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useContext(LanguageContext);
  const [activeCrop, setActiveCrop] = useState(0);
  const [myCrops, setMyCrops] = useState(DEFAULT_CROPS);
  const [weatherData, setWeatherData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);

  // Animations
  const weatherFade = useRef(new Animated.Value(0)).current;
  const cardScales = useRef([0,1,2,3].map(() => new Animated.Value(1))).current;

  // Helper: relative time string
  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  // Load dynamic activity from AsyncStorage
  const loadRecentActivity = async () => {
    const items = [];
    try {
      // Pull scan history
      const scans = await AsyncStorage.getItem('kisan_scan_history');
      if (scans) {
        JSON.parse(scans).forEach(s => {
          items.push({
            icon: s.result?.success ? '🌿' : '⚠️',
            title: s.result?.diagnosis || s.result?.error || 'Crop Scan',
            sub: s.time || '',
            badge: s.result?.success ? 'OK' : 'Act',
            ok: !!s.result?.success,
            ts: s.timestamp || Date.now(),
          });
        });
      }
      // Pull chat messages (last few bot responses)
      const chats = await AsyncStorage.getItem('kisan_chat_history');
      if (chats) {
        const msgs = JSON.parse(chats).filter(m => m.role === 'user').slice(-2);
        msgs.forEach(m => {
          items.push({
            icon: '🤖',
            title: `Asked: "${m.text.slice(0, 35)}${m.text.length > 35 ? '...' : ''}"`,
            sub: 'AI Chat',
            badge: 'Done',
            ok: true,
            ts: parseInt(m.id) || Date.now(),
          });
        });
      }
    } catch (e) {}
    // Sort by most recent, take top 5
    items.sort((a, b) => b.ts - a.ts);
    setRecentActivity(items.slice(0, 5));
  };

  const loadWeather = async () => {
    setIsRefreshing(true);
    const data = await fetchWeather();
    if (data) {
      setWeatherData(data.current);
      // Fade in weather pill
      Animated.timing(weatherFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadWeather();
    loadRecentActivity();
    // Load saved crops
    AsyncStorage.getItem(STORAGE_KEY).then(saved => {
      if (saved) {
        try { setMyCrops(JSON.parse(saved)); } catch(e) {}
      }
    });
  }, []);

  // Add a crop
  const handleAddCrop = () => {
    const available = ALL_CROPS.filter(c => !myCrops.find(m => m.name === c.name));
    if (available.length === 0) {
      Alert.alert(t('allCropsAdded'), t('allCropsAddedDesc'));
      return;
    }
    // Show picker with up to 6 options
    const options = available.slice(0, 6).map(c => `${c.emoji} ${c.name}`);
    options.push(t('cancel'));
    Alert.alert(
      t('addCropTitle'),
      t('addCropDesc'),
      options.map((opt, i) => ({
        text: opt,
        style: i === options.length - 1 ? 'cancel' : 'default',
        onPress: i < options.length - 1 ? () => {
          const crop = available[i];
          const updated = [...myCrops, crop];
          setMyCrops(updated);
          setActiveCrop(updated.length - 1);
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } : undefined,
      }))
    );
  };

  // Remove a crop (long press)
  const handleRemoveCrop = (idx) => {
    if (myCrops.length <= 1) return; // keep at least 1
    Alert.alert(
      t('removeCrop'),
      `${t('removeCropDesc')} ${myCrops[idx].emoji} ${myCrops[idx].name}?`,
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('remove'), style: 'destructive', onPress: () => {
          const updated = myCrops.filter((_, i) => i !== idx);
          setMyCrops(updated);
          setActiveCrop(0);
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        }},
      ]
    );
  };

  const onPressIn = (i) => {
    Animated.spring(cardScales[i], { toValue: 0.95, useNativeDriver: true }).start();
  };
  const onPressOut = (i) => {
    Animated.spring(cardScales[i], { toValue: 1, friction: 3, useNativeDriver: true }).start();
  };

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
      return { icon: '❄️', title: 'Cold Temp Alert', desc: 'Monitor for frost if temperatures drop further tonight.', colors: { bg: COLORS.blueBg, border: '#90CAF9', title: COLORS.blue, desc: '#0D47A1' } };
    }
    return { icon: '✅', title: 'Optimal Weather', desc: 'Current conditions are safe for all routine farm activities.', colors: { bg: COLORS.green50, border: COLORS.green200, title: COLORS.green800, desc: COLORS.green800 } };
  };

  const alert = getAlertConfig(weatherData);

  const quickActions = [
    { emoji: '🔬', label: t('scanDisease'), sub: t('pointCamera'), route: '/disease-scan', green: true },
    { emoji: '🌦', label: t('weather'), sub: t('irrigationAdvice'), route: '/weather-irrigation', live: true },
    { emoji: '📈', label: t('mandiPrices'), sub: t('todaysRates'), route: '/market-prices' },
    { emoji: '🏛', label: t('schemes'), sub: t('schemesSub'), route: '/schemes' },
  ];

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
              <Text style={styles.name}>{t('farmName')}</Text>
            </View>
            <View style={styles.avatar}><Text style={{ fontSize: 22 }}>👨‍🌾</Text></View>
          </View>
          {/* Weather Pill with fade animation */}
          <Animated.View style={[styles.weatherPill, { opacity: weatherData ? weatherFade : 1 }]}>
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
              <Text style={{ color: '#fff', fontSize: 12, fontFamily: FONTS.bodyMed }}>{isRefreshing ? t('locating') : t('loadingWeather')}</Text>
            )}
          </Animated.View>
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
            <TouchableOpacity onPress={handleAddCrop}>
              <Text style={styles.seeAll}>{t('addCrop')}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.lg }}>
            {myCrops.map((c, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.cropChip, activeCrop === i && styles.cropChipActive]}
                onPress={() => setActiveCrop(i)}
                onLongPress={() => handleRemoveCrop(i)}
              >
                <Text style={{ fontSize: 13 }}>{c.emoji}</Text>
                <Text style={[styles.cropName, activeCrop === i && styles.cropNameActive]}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ── Section Divider ── */}
          <View style={styles.sectionDivider} />

          {/* ── Quick Actions with scale animations ── */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>{t('quickActions')}</Text>
            <TouchableOpacity onPress={() => router.push('/disease-scan')}>
              <Text style={styles.seeAll}>{t('seeAll')}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.featGrid}>
            {quickActions.map((qa, i) => (
              <Animated.View key={i} style={[{ width: '47.5%' }, { transform: [{ scale: cardScales[i] }] }]}>
                <TouchableOpacity
                  style={[styles.featCard, qa.green && styles.featCardGreen]}
                  onPress={() => router.push(qa.route)}
                  onPressIn={() => onPressIn(i)}
                  onPressOut={() => onPressOut(i)}
                  activeOpacity={1}
                >
                  {qa.live && <View style={styles.liveBadge}><Text style={styles.liveBadgeText}>LIVE</Text></View>}
                  <Text style={styles.featEmoji}>{qa.emoji}</Text>
                  <Text style={[styles.featLabel, qa.green && { color: '#fff' }]}>{qa.label}</Text>
                  <Text style={[styles.featSub, qa.green && { color: 'rgba(255,255,255,0.75)' }]}>{qa.sub}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          {/* ── Section Divider ── */}
          <View style={styles.sectionDivider} />

          {/* ── Recent Activity (Dynamic) ── */}
          <View style={[styles.sectionRow, { marginTop: SPACING.xs }]}>
            <Text style={styles.sectionTitle}>{t('recentActivity')}</Text>
          </View>
          {recentActivity.length > 0 ? (
            recentActivity.map((a, i) => (
              <View key={i} style={styles.activityCard}>
                <View style={styles.actThumb}><Text style={{ fontSize: 18 }}>{a.icon}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actTitle} numberOfLines={1}>{a.title}</Text>
                  <Text style={styles.actSub}>{a.sub}</Text>
                </View>
                <View style={[shared.badge, a.ok ? shared.badgeGreen : shared.badgeRed]}>
                  <Text style={[shared.badgeText, { color: a.ok ? COLORS.green800 : COLORS.red }]}>
                    {a.badge}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyActivity}>
              <Text style={{ fontSize: 28 }}>📋</Text>
              <Text style={styles.emptyText}>{t('noActivityYet')}</Text>
            </View>
          )}

        </View>
      </ScrollView>

      <LanguageSelector />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   shared.safe,
  scroll: { flex: 1 },
  header: {
    backgroundColor: COLORS.green800,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
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
  greet:      { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontFamily: FONTS.bodyMed },
  name:       { color: '#fff', fontSize: 20, fontFamily: FONTS.headingXl, marginTop: 2 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.green400,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  weatherPill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14, padding: SPACING.md,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  weatherTemp: { color: '#fff', fontSize: 22, fontFamily: FONTS.headingXl },
  weatherDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontFamily: FONTS.bodyMed },
  humidity:    { color: '#A5D6A7', fontSize: 12, fontFamily: FONTS.bodySemi },
  location:    { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontFamily: FONTS.body },

  content: shared.content,

  alertCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.amberBg,
    borderWidth: 1.5, borderColor: '#FFE082',
    borderRadius: RADIUS.lg, padding: SPACING.md,
    marginBottom: 14,
  },
  alertTitle: { fontSize: 13, fontFamily: FONTS.bodyBold, color: '#E65100' },
  alertDesc:  { fontSize: 11, color: '#BF360C', fontFamily: FONTS.bodyMed, marginTop: 2 },

  sectionDivider: {
    height: 1, backgroundColor: COLORS.green200,
    marginVertical: SPACING.lg, opacity: 0.5,
  },

  sectionRow:    shared.sectionRow,
  sectionTitle:  { fontSize: 14, fontFamily: FONTS.bodyBold, color: COLORS.gray800, letterSpacing: 0.3 },
  seeAll:        shared.seeAll,

  cropChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.green100,
    borderWidth: 1.5, borderColor: COLORS.green200,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10,
    marginRight: 8,
  },
  cropChipActive: { backgroundColor: COLORS.green800, borderColor: COLORS.green800 },
  cropName:       { fontSize: 12, fontFamily: FONTS.bodySemi, color: COLORS.green800 },
  cropNameActive: { color: '#fff' },

  featGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  featCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg, padding: 14,
    borderWidth: 1.5, borderColor: COLORS.green100,
    ...SHADOW.card, position: 'relative',
  },
  featCardGreen: { backgroundColor: COLORS.green800, borderColor: 'transparent' },
  featEmoji: { fontSize: 26, marginBottom: SPACING.sm },
  featLabel: { fontSize: 13, fontFamily: FONTS.bodyBold, color: COLORS.gray800 },
  featSub:   { fontSize: 11, color: COLORS.gray800, marginTop: 2, fontFamily: FONTS.bodyMed },
  liveBadge: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: COLORS.amber, borderRadius: 20,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  liveBadgeText: { fontSize: 9, fontFamily: FONTS.bodyBold, color: '#fff' },

  activityCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.md, ...SHADOW.card,
  },
  actThumb: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: COLORS.green100,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  actTitle:  { fontSize: 13, fontFamily: FONTS.bodyBold, color: COLORS.gray800 },
  actSub:    { fontSize: 11, color: COLORS.gray800, marginTop: 1, fontFamily: FONTS.body },
  emptyActivity: {
    alignItems: 'center', paddingVertical: 30, gap: 8,
    backgroundColor: COLORS.white, borderRadius: RADIUS.md,
    ...SHADOW.soft, marginBottom: SPACING.sm,
  },
  emptyText: { fontSize: 13, color: COLORS.gray800, fontFamily: FONTS.bodyMed },
});
