import React from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, RADIUS, SHADOW } from '../constants/appTheme';
import { shared } from '../constants/sharedStyles';

interface Props {
  navigation: { navigate: (route: string) => void };
}

const PRICES = [
  { crop: 'Wheat', price: '₹2,125', trend: '+12', up: true },
  { crop: 'Maize', price: '₹1,962', trend: '-5', up: false },
  { crop: 'Tomato', price: '₹1,200', trend: '+45', up: true },
];

export default function MarketScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={shared.pageTitle}>Mandi Prices</Text>
        <Text style={shared.pageSub}>Live agricultural rates</Text>
      </View>
      <ScrollView style={shared.content}>
        <View style={styles.searchBox}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput placeholder="Search crop or mandi..." style={styles.input} placeholderTextColor={COLORS.gray600} />
        </View>

        <Text style={[shared.sectionTitle, { marginTop: 12 }]}>Today's Market (Quintal)</Text>
        
        {PRICES.map((p, i) => (
          <View key={i} style={styles.priceCard}>
            <Text style={styles.cropName}>{p.crop}</Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.priceText}>{p.price}</Text>
              <Text style={[styles.trendText, { color: p.up ? COLORS.green800 : COLORS.red }]}>
                {p.up ? '▲' : '▼'} {p.trend}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1, backgroundColor: COLORS.green50,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    backgroundColor: COLORS.green900,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24,
    borderBottomLeftRadius: RADIUS.xl, borderBottomRightRadius: RADIUS.xl,
  },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: RADIUS.md, paddingHorizontal: 16, paddingVertical: 12,
    marginBottom: 20, ...SHADOW.card,
  },
  input: { flex: 1, fontFamily: FONTS.sans, fontSize: 14, color: COLORS.gray800 },
  priceCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 16, marginBottom: 12, ...SHADOW.card
  },
  cropName: { fontFamily: FONTS.sansBold, fontSize: 16, color: COLORS.gray800 },
  priceText: { fontFamily: FONTS.sansExtra, fontSize: 18, color: COLORS.gray800 },
  trendText: { fontFamily: FONTS.sansBold, fontSize: 12, marginTop: 4 },
});
