import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, RADIUS, SHADOW } from '../constants/appTheme';
import { shared } from '../constants/sharedStyles';

interface Props {
  navigation: { navigate: (route: string) => void };
}

const FILTERS = ['All', 'Insurance', 'Subsidies', 'Credit', 'Central'];
const SCHEMES = [
  { title: 'PM KISAN Samman Nidhi', desc: '₹6000 annual income support for all landholding farmers.', tag: 'Central', deadline: '31 Mar' },
  { title: 'Rythu Bandhu', desc: '₹5000 per acre per season investment support scheme.', tag: 'State', deadline: 'Ongoing' },
  { title: 'PM Fasal Bima', desc: 'Crop insurance for yield losses from natural calamities.', tag: 'Insurance', deadline: '15 Jul' },
];

export default function SchemesScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={shared.pageTitle}>Schemes</Text>
        <Text style={shared.pageSub}>Government benefits & subsidies</Text>
      </View>
      <ScrollView style={shared.content} showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          {FILTERS.map((f, i) => (
            <TouchableOpacity key={i} style={[styles.filterChip, i === 0 && styles.filterChipActive]}>
              <Text style={[styles.filterText, i === 0 && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {SCHEMES.map((s, i) => (
          <View key={i} style={styles.schemeCard}>
            <View style={styles.tagRow}>
              <View style={styles.tagBadge}>
                <Text style={styles.tagText}>{s.tag}</Text>
              </View>
              <Text style={styles.deadline}>Ends {s.deadline}</Text>
            </View>
            <Text style={styles.cardTitle}>{s.title}</Text>
            <Text style={styles.cardDesc}>{s.desc}</Text>
            <TouchableOpacity style={styles.applyBtn}>
              <Text style={styles.applyBtnText}>Check Eligibility →</Text>
            </TouchableOpacity>
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
  filterChip: {
    backgroundColor: COLORS.white, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8, marginRight: 8,
    borderWidth: 1, borderColor: COLORS.gray300,
  },
  filterChipActive: { backgroundColor: COLORS.green800, borderColor: COLORS.green800 },
  filterText: { fontFamily: FONTS.sansBold, fontSize: 13, color: COLORS.gray600 },
  filterTextActive: { color: COLORS.white },
  schemeCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: 20, marginBottom: 16, ...SHADOW.card,
  },
  tagRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tagBadge: { backgroundColor: COLORS.blueBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tagText: { fontFamily: FONTS.sansExtra, fontSize: 9, color: COLORS.blue },
  deadline: { fontFamily: FONTS.sansBold, fontSize: 11, color: COLORS.red },
  cardTitle: { fontFamily: FONTS.sansExtra, fontSize: 16, color: COLORS.gray800, marginBottom: 6 },
  cardDesc: { fontFamily: FONTS.sans, fontSize: 13, color: COLORS.gray600, lineHeight: 20, marginBottom: 16 },
  applyBtn: { backgroundColor: COLORS.green100, paddingVertical: 12, borderRadius: RADIUS.lg, alignItems: 'center' },
  applyBtnText: { fontFamily: FONTS.sansBold, fontSize: 13, color: COLORS.green800 },
});
