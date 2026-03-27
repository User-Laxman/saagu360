import React, { useContext } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, RADIUS, SHADOW, SPACING } from '../constants/appTheme';
import { shared } from '../constants/sharedStyles';
import { LanguageContext } from '../context/LanguageContext';
import { fetchWeather } from '../services/weatherService';
import { useQuery } from '@tanstack/react-query';

const getWeatherEmoji = (main) => {
    const map = {
        'Clear': '☀', 'Clouds': '⛅', 'Rain': '🌧', 'Drizzle': '🌦', 'Thunderstorm': '⛈', 'Snow': '❄'
    };
    return map[main] || '⛅';
};

const FORECAST = [
  { day: 'Today', icon: '⛅', temp: '28°', today: true  },
  { day: 'Wed',   icon: '🌧', temp: '24°', today: false },
  { day: 'Thu',   icon: '🌦', temp: '26°', today: false },
  { day: 'Fri',   icon: '☀',  temp: '32°', today: false },
  { day: 'Sat',   icon: '☀',  temp: '33°', today: false },
  { day: 'Sun',   icon: '⛅', temp: '29°', today: false },
];

const IRRIG_TIPS = [
  '✅  Soil moisture is adequate (72%)',
  '🌧  Rain expected tomorrow — skip today',
  '⏰  Next irrigation: Thursday 5–7 AM',
  '💡  Save ~40L water per crop row today',
];

export default function WeatherScreen() {
  const { t } = useContext(LanguageContext);
  const { data: weatherData, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['weather'],
    queryFn: async () => {
      const data = await fetchWeather();
      if (!data) return null;
      
      const daily = [];
      const seenDays = new Set();
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      data.forecast.list.forEach(item => {
          const date = new Date(item.dt * 1000);
          const dayStr = daysOfWeek[date.getDay()];
          if (date.getHours() >= 11 && date.getHours() <= 15 && !seenDays.has(dayStr)) {
              seenDays.add(dayStr);
              daily.push({
                  day: dayStr,
                  icon: getWeatherEmoji(item.weather[0].main),
                  temp: `${Math.round(item.main.temp)}°`,
                  today: daily.length === 0
              });
          }
      });
      return { current: data.current, forecastList: daily };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const currentWeather = weatherData?.current;
  const forecastList = weatherData?.forecastList || [];

  const getIrrigationAdvice = (current) => {
    if (!current) return { title: 'WAITING FOR METRICS', desc: 'Analyzing soil dynamics...' };
    const cond = current.weather[0].main;
    const temp = current.main.temp;
    
    if (cond === 'Rain' || cond === 'Thunderstorm' || cond === 'Drizzle') {
      return { title: 'NO WATERING NEEDED', desc: 'Atmospheric moisture is high. Natural rain detected.' };
    }
    if (temp >= 32) {
      return { title: 'HEAVY WATERING', desc: 'High temperatures detected. Increase core watering volume.' };
    }
    return { title: 'LIGHT WATERING', desc: 'Variables are extremely stable. Maintain regular schedule.' };
  };

  if (isLoading || !currentWeather) {
    return (
      <SafeAreaView style={[styles.safe, {justifyContent: 'center', alignItems: 'center'}]}>
        <ActivityIndicator size="large" color="#1565C0" />
        <Text style={{color: '#666', marginTop: 10}}>{isLoading ? 'Locating farm...' : 'Loading real-time weather...'}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.cloudBg}>🌤</Text>
          <Text style={styles.pageTitle}>{t('weatherTitle')}</Text>
          <View style={styles.locationRow}>
            <Text style={{ fontSize: 16 }}>📍</Text>
            <Text style={styles.locationText}>{currentWeather.name}</Text>
            <TouchableOpacity onPress={() => refetch()} disabled={isRefetching} style={{ marginLeft: 10, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
                {isRefetching ? '↻ Syncing...' : '↻ Refresh VIP'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mainWeather}>
            <Text style={styles.tempBig}>{Math.round(currentWeather.main.temp)}°</Text>
            <Text style={styles.condition}>{currentWeather.weather[0].main}</Text>
            <Text style={styles.feelsLike}>Feels like {Math.round(currentWeather.main.feels_like)}° · Humidity {currentWeather.main.humidity}%</Text>

            <View style={styles.statsRow}>
              {[[`💧 ${currentWeather.main.humidity}%`, 'Humidity'], [`🌬 ${currentWeather.wind.speed} m/s`, 'Wind'], ['☀ UV 9', 'UV Index']].map(([val, label], i) => (
                <View key={i} style={styles.statItem}>
                  <Text style={styles.statVal}>{val}</Text>
                  <Text style={styles.statLabel}>{label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.content}>

          {/* ── 5-Day Forecast ── */}
          <Text style={styles.sectionTitle}>5-Day Forecast</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {forecastList.map((f, i) => (
              <View key={i} style={[styles.fcCard, f.today && styles.fcCardToday]}>
                <Text style={[styles.fcDay, f.today && styles.fcDayToday]}>{f.day}</Text>
                <Text style={{ fontSize: 22 }}>{f.icon}</Text>
                <Text style={styles.fcTemp}>{f.temp}</Text>
              </View>
            ))}
          </ScrollView>

          {/* ── Irrigation Advice ── */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 10 }}>
            <Text style={styles.sectionTitle}>{t('irrigationToday')}</Text>
          </View>
          <View style={styles.stormAlert}>
            <View style={{ marginRight: 10 }}>
              <Text style={{ fontSize: 24 }}>💧</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>{t('recommendation')}: {getIrrigationAdvice(currentWeather).title}</Text>
              <Text style={styles.alertDesc}>{getIrrigationAdvice(currentWeather).desc}</Text>
            </View>
          </View>

          {/* ── Weekly Temp Bar Chart ── */}
          <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Temperature Trend (°C)</Text>
          <View style={styles.barChart}>
            {forecastList.slice(0, 5).map((b, i) => (
              <View key={i} style={styles.barCol}>
                <Text style={styles.barMm}>{parseInt(b.temp)}°</Text>
                <View style={[styles.barFill, { height: Math.max(4, parseInt(b.temp) * 1.5), backgroundColor: parseInt(b.temp) >= 30 ? '#E65100' : '#1565C0' }]} />
                <Text style={styles.barDay}>{b.day}</Text>
                <Text style={{ fontSize: 10 }}>{b.icon}</Text>
              </View>
            ))}
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   shared.safe,
  header: {
    backgroundColor: COLORS.blue,
    paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: 28,
    overflow: 'hidden',
  },
  pageTitle:   { fontSize: 25, fontFamily: FONTS.headingXl, color: '#fff', marginBottom: 6 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  locationText:{ color: 'rgba(255,255,255,0.9)', fontSize: 14, fontFamily: FONTS.bodySemi, marginLeft: 4 },
  cloudBg:     { position: 'absolute', top: 10, right: 10 },
  location:    { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontFamily: FONTS.bodySemi, marginBottom: SPACING.md },
  mainWeather: { alignItems: 'center' },
  tempBig:     { color: '#fff', fontSize: 60, fontFamily: FONTS.headingXl, lineHeight: 68 },
  condition:   { color: '#fff', fontSize: 16, fontFamily: FONTS.bodySemi, marginTop: 2 },
  feelsLike:   { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontFamily: FONTS.bodyMed, marginTop: 4, marginBottom: SPACING.lg },
  statsRow:    { flexDirection: 'row', gap: 24 },
  statItem:    { alignItems: 'center' },
  statVal:     { color: '#fff', fontSize: 14, fontFamily: FONTS.headingXl },
  statLabel:   { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontFamily: FONTS.bodyMed, marginTop: 2 },

  content:      shared.content,
  sectionTitle: shared.sectionTitle,

  fcCard: {
    alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: RADIUS.md, padding: SPACING.md,
    marginRight: SPACING.sm, minWidth: 66,
    borderWidth: 1.5, borderColor: COLORS.gray100,
    ...SHADOW.card, gap: 4,
  },
  fcCardToday: { backgroundColor: COLORS.blueBg, borderColor: '#90CAF9' },
  fcDay:       { fontSize: 11, fontFamily: FONTS.bodySemi, color: COLORS.gray600 },
  fcDayToday:  { color: COLORS.blue, fontFamily: FONTS.headingXl },
  fcTemp:      { fontSize: 14, fontFamily: FONTS.headingXl, color: COLORS.gray800 },

  irrigCard: {
    backgroundColor: COLORS.green50,
    borderWidth: 2, borderColor: COLORS.green200,
    borderRadius: RADIUS.xl, padding: 14, marginBottom: SPACING.md,
  },
  irrigHead:      { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: 10 },
  irrigHeadText:  { fontSize: 13, fontFamily: FONTS.bodyBold, color: COLORS.green800 },
  irrigStatus: {
    backgroundColor: COLORS.green800, borderRadius: RADIUS.md,
    padding: 10, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
  },
  irrigStatusLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontFamily: FONTS.bodySemi },
  irrigStatusVal:   { color: '#fff', fontSize: 13, fontFamily: FONTS.headingXl },
  irrigTip:         { fontSize: 10.5, color: COLORS.gray600, fontFamily: FONTS.bodyMed, lineHeight: 16 },

  stormAlert: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.amberBg,
    borderWidth: 1.5, borderColor: '#FFE082',
    borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.lg,
  },
  alertTitle: { fontSize: 13, fontFamily: FONTS.bodyBold, color: COLORS.orange },
  alertDesc:  { fontSize: 11, color: '#BF360C', fontFamily: FONTS.bodyMed, marginTop: 2 },

  barChart: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: SPACING.lg, ...SHADOW.card, height: 130,
  },
  barCol:   { alignItems: 'center', flex: 1, justifyContent: 'flex-end', gap: 3 },
  barMm:    { fontSize: 8, color: COLORS.blue, fontFamily: FONTS.bodyBold },
  barFill:  { width: 14, borderRadius: 4, minHeight: 4 },
  barDay:   { fontSize: 9, color: COLORS.gray600, fontWeight: '600' },
});
