import React from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, RADIUS, SHADOW } from '../constants/appTheme';
import { shared } from '../constants/sharedStyles';

interface Props {
  navigation: { navigate: (route: string) => void };
}

const FORECAST = [
  { day: 'Today', temp: '28°C', desc: 'Partly Cloudy', icon: '⛅' },
  { day: 'Tomorrow', temp: '26°C', desc: 'Heavy Rain', icon: '🌧' },
  { day: 'Friday', temp: '29°C', desc: 'Sunny', icon: '☀️' },
];

export default function WeatherScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={shared.pageTitle}>Weather</Text>
        <Text style={shared.pageSub}>Yellandu, Telangana</Text>
      </View>
      <ScrollView style={shared.content}>
        <View style={styles.mainCard}>
          <Text style={{ fontSize: 64, textAlign: 'center' }}>⛅</Text>
          <Text style={styles.mainTemp}>28°C</Text>
          <Text style={styles.mainDesc}>Partly Cloudy</Text>
          
          <View style={styles.row}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Humidity</Text>
              <Text style={styles.statVal}>72%</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Wind</Text>
              <Text style={styles.statVal}>12 km/h</Text>
            </View>
          </View>
        </View>

        <Text style={shared.sectionTitle}>3-Day Forecast</Text>
        {FORECAST.map((fi, i) => (
          <View key={i} style={styles.dayCard}>
            <Text style={styles.dayText}>{fi.day}</Text>
            <Text style={{ fontSize: 24 }}>{fi.icon}</Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.dayTemp}>{fi.temp}</Text>
              <Text style={styles.dayDesc}>{fi.desc}</Text>
            </View>
          </View>
        ))}

        <Text style={[shared.sectionTitle, { marginTop: 16 }]}>Irrigation Advice</Text>
        <View style={[styles.mainCard, { borderColor: COLORS.orange, borderWidth: 2 }]}>
          <Text style={styles.alertText}>Delay watering today. Rain expected tomorrow.</Text>
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
  header: {
    backgroundColor: COLORS.green900,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24,
    borderBottomLeftRadius: RADIUS.xl, borderBottomRightRadius: RADIUS.xl,
  },
  mainCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: 24, marginBottom: 24, ...SHADOW.card,
  },
  mainTemp: { fontFamily: FONTS.sansExtra, fontSize: 42, color: COLORS.gray800, textAlign: 'center', marginVertical: 8 },
  mainDesc: { fontFamily: FONTS.sans, fontSize: 16, color: COLORS.gray600, textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 24, borderTopWidth: 1, borderColor: COLORS.gray100, paddingTop: 16 },
  statBox: { alignItems: 'center' },
  statLabel: { fontFamily: FONTS.sans, fontSize: 12, color: COLORS.gray600, marginBottom: 4 },
  statVal: { fontFamily: FONTS.sansBold, fontSize: 16, color: COLORS.gray800 },
  dayCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 16, marginBottom: 12, ...SHADOW.card
  },
  dayText: { fontFamily: FONTS.sansBold, fontSize: 14, color: COLORS.gray800, width: 80 },
  dayTemp: { fontFamily: FONTS.sansExtra, fontSize: 16, color: COLORS.gray800 },
  dayDesc: { fontFamily: FONTS.sans, fontSize: 11, color: COLORS.gray600 },
  alertText: { fontFamily: FONTS.sansBold, fontSize: 13, color: '#D84315', textAlign: 'center' }
});
