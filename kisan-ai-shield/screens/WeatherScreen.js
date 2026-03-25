import React from 'react';
import {
  View, Text, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { COLORS, RADIUS, SHADOW } from '../constants/appTheme';
import { shared } from '../constants/sharedStyles';

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
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.cloudBg}><Text style={{ fontSize: 80, opacity: 0.15 }}>☁</Text></View>

          <Text style={styles.location}>📍 Yellandu, Telangana</Text>

          <View style={styles.mainWeather}>
            <Text style={styles.tempBig}>28°</Text>
            <Text style={styles.condition}>Partly Cloudy</Text>
            <Text style={styles.feelsLike}>Feels like 31° · Humidity 72%</Text>

            <View style={styles.statsRow}>
              {[['💧 72%', 'Humidity'], ['🌬 14 km/h', 'Wind'], ['☀ UV 9', 'UV Index']].map(([val, label], i) => (
                <View key={i} style={styles.statItem}>
                  <Text style={styles.statVal}>{val}</Text>
                  <Text style={styles.statLabel}>{label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.content}>

          {/* ── 7-Day Forecast ── */}
          <Text style={styles.sectionTitle}>7-Day Forecast</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {FORECAST.map((f, i) => (
              <View key={i} style={[styles.fcCard, f.today && styles.fcCardToday]}>
                <Text style={[styles.fcDay, f.today && styles.fcDayToday]}>{f.day}</Text>
                <Text style={{ fontSize: 22 }}>{f.icon}</Text>
                <Text style={styles.fcTemp}>{f.temp}</Text>
              </View>
            ))}
          </ScrollView>

          {/* ── Irrigation Card ── */}
          <View style={styles.irrigCard}>
            <View style={styles.irrigHead}>
              <Text style={{ fontSize: 22 }}>💧</Text>
              <Text style={styles.irrigHeadText}>Irrigation Advice — Today</Text>
            </View>
            <View style={styles.irrigStatus}>
              <Text style={styles.irrigStatusLabel}>Recommendation</Text>
              <Text style={styles.irrigStatusVal}>⏸  Hold Irrigation</Text>
            </View>
            <View style={{ gap: 6 }}>
              {IRRIG_TIPS.map((tip, i) => (
                <Text key={i} style={styles.irrigTip}>{tip}</Text>
              ))}
            </View>
          </View>

          {/* ── Storm Alert ── */}
          <View style={styles.stormAlert}>
            <Text style={{ fontSize: 24 }}>⛈</Text>
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.alertTitle}>Storm Alert — Tomorrow</Text>
              <Text style={styles.alertDesc}>Expected 60mm rainfall · Protect seedlings</Text>
            </View>
          </View>

          {/* ── Weekly Rain Bar Chart ── */}
          <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Rainfall This Week (mm)</Text>
          <View style={styles.barChart}>
            {[
              { day: 'Mon', mm: 0,  emoji: '☀' },
              { day: 'Tue', mm: 5,  emoji: '🌦' },
              { day: 'Wed', mm: 40, emoji: '🌧' },
              { day: 'Thu', mm: 10, emoji: '⛅' },
              { day: 'Fri', mm: 0,  emoji: '☀' },
              { day: 'Sat', mm: 0,  emoji: '☀' },
              { day: 'Sun', mm: 0,  emoji: '☀' },
            ].map((b, i) => (
              <View key={i} style={styles.barCol}>
                <Text style={styles.barMm}>{b.mm > 0 ? `${b.mm}` : ''}</Text>
                <View style={[styles.barFill, { height: Math.max(4, b.mm * 2), backgroundColor: b.mm > 20 ? '#1565C0' : COLORS.green400 }]} />
                <Text style={styles.barDay}>{b.day}</Text>
                <Text style={{ fontSize: 10 }}>{b.emoji}</Text>
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
    backgroundColor: '#1565C0',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28,
    overflow: 'hidden',
  },
  cloudBg:     { position: 'absolute', top: 10, right: 10 },
  location:    { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600', marginBottom: 12 },
  mainWeather: { alignItems: 'center' },
  tempBig:     { color: '#fff', fontSize: 60, fontWeight: '800', lineHeight: 68 },
  condition:   { color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 2 },
  feelsLike:   { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '500', marginTop: 4, marginBottom: 16 },
  statsRow:    { flexDirection: 'row', gap: 24 },
  statItem:    { alignItems: 'center' },
  statVal:     { color: '#fff', fontSize: 14, fontWeight: '800' },
  statLabel:   { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '500', marginTop: 2 },

  content:      shared.content,
  sectionTitle: shared.sectionTitle,

  fcCard: {
    alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: RADIUS.md, padding: 12,
    marginRight: 8, minWidth: 66,
    borderWidth: 1.5, borderColor: COLORS.gray100,
    ...SHADOW.card, gap: 4,
  },
  fcCardToday: { backgroundColor: '#E3F2FD', borderColor: '#90CAF9' },
  fcDay:       { fontSize: 10, fontWeight: '600', color: COLORS.gray600 },
  fcDayToday:  { color: '#1565C0', fontWeight: '800' },
  fcTemp:      { fontSize: 13, fontWeight: '800', color: COLORS.gray800 },

  irrigCard: {
    backgroundColor: COLORS.green50,
    borderWidth: 2, borderColor: COLORS.green200,
    borderRadius: RADIUS.xl, padding: 14, marginBottom: 12,
  },
  irrigHead:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  irrigHeadText:  { fontSize: 13, fontWeight: '700', color: COLORS.green800 },
  irrigStatus: {
    backgroundColor: COLORS.green800, borderRadius: 12,
    padding: 10, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
  },
  irrigStatusLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600' },
  irrigStatusVal:   { color: '#fff', fontSize: 13, fontWeight: '800' },
  irrigTip:         { fontSize: 10.5, color: COLORS.gray600, fontWeight: '500', lineHeight: 16 },

  stormAlert: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.amberBg,
    borderWidth: 1.5, borderColor: '#FFE082',
    borderRadius: RADIUS.lg, padding: 12, marginBottom: 16,
  },
  alertTitle: { fontSize: 12, fontWeight: '700', color: '#E65100' },
  alertDesc:  { fontSize: 10, color: '#BF360C', fontWeight: '500', marginTop: 2 },

  barChart: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: 16, ...SHADOW.card, height: 130,
  },
  barCol:   { alignItems: 'center', flex: 1, justifyContent: 'flex-end', gap: 3 },
  barMm:    { fontSize: 8, color: '#1565C0', fontWeight: '700' },
  barFill:  { width: 14, borderRadius: 4, minHeight: 4 },
  barDay:   { fontSize: 9, color: COLORS.gray600, fontWeight: '600' },
});
