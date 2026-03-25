import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, RADIUS, SHADOW } from '../constants/appTheme';

interface HomeScreenProps {
  navigation: { navigate: (route: string) => void };
}

const CROPS = [
  { emoji: '🌾', name: 'Wheat',  active: true  },
  { emoji: '🌽', name: 'Maize',  active: false },
  { emoji: '🍅', name: 'Tomato', active: false },
  { emoji: '🧅', name: 'Onion',  active: false },
];

const ACTIVITY = [
  { icon: '🌿', title: 'Wheat scan completed', sub: '2 hours ago · Healthy', badge: 'OK', ok: true },
];

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [activeCrop, setActiveCrop] = useState(0);

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
              <Text style={styles.greet}>Good Morning 🌤</Text>
              <Text style={styles.name}>Ravi's Farm</Text>
            </View>
            <View style={styles.avatar}>
              <Text style={{ fontSize: 22 }}>👨‍🌾</Text>
            </View>
          </View>
          
          {/* Weather Glass Pill */}
          <View style={styles.weatherPill}>
            <Text style={{ fontSize: 32 }}>⛅</Text>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.weatherTemp}>28°C</Text>
              <Text style={styles.weatherDesc}>Partly Cloudy · Yellandu</Text>
            </View>
            <View style={{ marginLeft: 'auto', alignItems: 'flex-end' }}>
              <Text style={styles.humidity}>💧 72%</Text>
              <Text style={styles.location}>Telangana</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>

          {/* ── ALERT CARD ── */}
          <View style={styles.alertCard}>
            <Text style={{ fontSize: 24 }}>⚠️</Text>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.alertTitle}>Heavy Rain Expected</Text>
              <Text style={styles.alertDesc}>Tomorrow 2–8 PM · Delay irrigation</Text>
            </View>
          </View>

          {/* ── MY CROPS ── */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>My Crops</Text>
            <Text style={styles.seeAll}>+ Add</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
            {CROPS.map((c, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.cropChip, activeCrop === i && styles.cropChipActive]}
                onPress={() => setActiveCrop(i)}
              >
                <Text style={{ fontSize: 14 }}>{c.emoji}</Text>
                <Text style={[styles.cropName, activeCrop === i && styles.cropNameActive]}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ── QUICK ACTIONS ── */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <Text style={styles.seeAll}>See all</Text>
          </View>
          <View style={styles.featGrid}>
            <TouchableOpacity
              style={[styles.featCard, styles.featCardGreen]}
              onPress={() => navigation.navigate('Disease')}
              activeOpacity={0.85}
            >
              <Text style={styles.featEmoji}>🔬</Text>
              <Text style={[styles.featLabel, { color: COLORS.white }]}>Scan Disease</Text>
              <Text style={[styles.featSub, { color: 'rgba(255,255,255,0.8)' }]}>Point camera at leaf</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.featCard}
              onPress={() => navigation.navigate('Weather')}
              activeOpacity={0.85}
            >
              <View style={styles.liveBadge}><Text style={styles.liveBadgeText}>LIVE</Text></View>
              <Text style={styles.featEmoji}>🌦</Text>
              <Text style={styles.featLabel}>Weather</Text>
              <Text style={styles.featSub}>Irrigation advice</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.featCard}
              onPress={() => navigation.navigate('Market')}
              activeOpacity={0.85}
            >
              <Text style={styles.featEmoji}>📈</Text>
              <Text style={styles.featLabel}>Mandi Prices</Text>
              <Text style={styles.featSub}>Today's rates</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.featCard}
              onPress={() => navigation.navigate('Schemes')}
              activeOpacity={0.85}
            >
              <Text style={styles.featEmoji}>🏛</Text>
              <Text style={styles.featLabel}>Schemes</Text>
              <Text style={styles.featSub}>Govt benefits</Text>
            </TouchableOpacity>
          </View>

          {/* ── RECENT ACTIVITY ── */}
          <View style={[styles.sectionRow, { marginTop: 8 }]}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
          </View>
          {ACTIVITY.map((a, i) => (
            <View key={i} style={styles.activityCard}>
              <View style={styles.actThumb}><Text style={{ fontSize: 20 }}>{a.icon}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actTitle}>{a.title}</Text>
                <Text style={styles.actSub}>{a.sub}</Text>
              </View>
              <View style={styles.badgeGreen}>
                <Text style={styles.badgeText}>{a.badge}</Text>
              </View>
            </View>
          ))}
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.green50,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scroll: { flex: 1 },
  
  // ── HEADER ──
  header: {
    backgroundColor: COLORS.green900,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  headerCircle1: {
    position: 'absolute', top: -40, right: -40,
    width: 200, height: 200,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 100,
  },
  headerCircle2: {
    position: 'absolute', bottom: -60, left: -20,
    width: 140, height: 140,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 70,
  },
  headerTop: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 24 
  },
  greet: { 
    color: COLORS.green200, 
    fontFamily: FONTS.sans, 
    fontSize: 14 
  },
  name: { 
    color: COLORS.white, 
    fontFamily: FONTS.serif, 
    fontSize: 28, 
    marginTop: 4 
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.green400,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)',
  },
  
  // ── WEATHER PILL ──
  weatherPill: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: RADIUS.lg, 
    padding: 16,
    flexDirection: 'row', 
    alignItems: 'center',
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.15)',
  },
  weatherTemp: { 
    color: COLORS.white, 
    fontFamily: FONTS.sansExtra, 
    fontSize: 26 
  },
  weatherDesc: { 
    color: COLORS.green100, 
    fontFamily: FONTS.sans, 
    fontSize: 12,
    marginTop: 2
  },
  humidity: { 
    color: COLORS.green200, 
    fontFamily: FONTS.sansBold, 
    fontSize: 12 
  },
  location: { 
    color: COLORS.green100, 
    fontFamily: FONTS.sans, 
    fontSize: 11,
    marginTop: 2
  },

  content: { padding: 20 },

  // ── ALERTS ──
  alertCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.amberBg,
    borderRadius: RADIUS.md, padding: 16,
    borderLeftWidth: 4, borderLeftColor: COLORS.orange,
    marginBottom: 20,
    ...SHADOW.card
  },
  alertTitle: { fontFamily: FONTS.sansBold, fontSize: 13, color: '#D84315' },
  alertDesc:  { fontFamily: FONTS.sans, fontSize: 11, color: '#E65100', marginTop: 4 },

  // ── TYPOGRAPHY & SECTIONS ──
  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    marginBottom: 14,
  },
  sectionTitle: { fontFamily: FONTS.sansExtra, fontSize: 16, color: COLORS.gray800 },
  seeAll: { fontFamily: FONTS.sansBold, fontSize: 13, color: COLORS.green800 },

  // ── CHIPS ──
  cropChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.white,
    borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10,
    marginRight: 10,
    ...SHADOW.card, elevation: 1
  },
  cropChipActive: { backgroundColor: COLORS.green800 },
  cropName:       { fontFamily: FONTS.sansBold, fontSize: 13, color: COLORS.gray800 },
  cropNameActive: { color: COLORS.white },

  // ── QUICK ACTIONS ──
  featGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  featCard: {
    width: '48%', backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl, padding: 18,
    ...SHADOW.card, position: 'relative',
  },
  featCardGreen: { backgroundColor: COLORS.green800 },
  featEmoji: { fontSize: 30, marginBottom: 12 },
  featLabel: { fontFamily: FONTS.sansBold, fontSize: 14, color: COLORS.gray800 },
  featSub:   { fontFamily: FONTS.sans, fontSize: 11, color: COLORS.gray600, marginTop: 4 },
  liveBadge: {
    position: 'absolute', top: 14, right: 14,
    backgroundColor: COLORS.orange, borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  liveBadgeText: { fontFamily: FONTS.sansExtra, fontSize: 9, color: COLORS.white },

  // ── ACTIVITY ──
  activityCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: 16, marginBottom: 12, ...SHADOW.card,
  },
  actThumb: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: COLORS.green50,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  actTitle: { fontFamily: FONTS.sansBold, fontSize: 13, color: COLORS.gray800 },
  actSub:   { fontFamily: FONTS.sans, fontSize: 11, color: COLORS.gray600, marginTop: 4 },
  badgeGreen:{
    backgroundColor: COLORS.green100,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: { fontFamily: FONTS.sansExtra, fontSize: 10, color: COLORS.green800 },
});
