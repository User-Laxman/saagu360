import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, StyleSheet, 
  Platform, StatusBar, ActivityIndicator, TextInput, RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, RADIUS, SHADOW } from '../constants/appTheme';
import { shared } from '../constants/sharedStyles';
import { fetchSchemes, MASTER_SCHEMES } from '../services/schemeService';
import EligibilityModal from '../components/EligibilityModal';

interface Props {
  navigation: { navigate: (route: string, params?: any) => void };
}

const FILTER_TABS = ['All', 'Insurance', 'Subsidies', 'Loans', 'Training', 'General'];

export default function SchemesScreen({ navigation }: Props) {
  const [allSchemes, setAllSchemes] = useState<any[]>(MASTER_SCHEMES);
  const [filteredSchemes, setFilteredSchemes] = useState<any[]>(MASTER_SCHEMES);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dataSource, setDataSource] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState<any>(null);

  useEffect(() => {
    loadSchemes();
  }, []);

  const loadSchemes = async (force = false) => {
    // If not forced and we have no data yet, show loading
    if (allSchemes.length === 0) setLoading(true);
    
    const { data, source } = await fetchSchemes(30, force);
    setAllSchemes(data);
    applyFilters(data, searchQuery, activeFilter);
    setDataSource(source);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSchemes(true); // Forced sync
    setRefreshing(false);
  };

  const applyFilters = (schemes: any[], query: string, filter: string) => {
    let result = [...schemes];

    if (filter !== 'All') {
      result = result.filter(s => s.category === filter);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(s =>
        s.schemeName?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.ministry?.toLowerCase().includes(q) ||
        s.benefits?.toLowerCase().includes(q) ||
        s.state?.toLowerCase().includes(q)
      );
    }

    setFilteredSchemes(result);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    applyFilters(allSchemes, text, activeFilter);
  };

  const handleFilter = (filter: string) => {
    setActiveFilter(filter);
    applyFilters(allSchemes, searchQuery, filter);
  };

  const openEligibilityCheck = (scheme: any) => {
    setSelectedScheme(scheme);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.green900} />
      <View style={styles.header}>
        <Text style={shared.pageTitle}>Schemes</Text>
        <Text style={shared.pageSub}>Smart Agricultural Benefits & Subsidies</Text>
        
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search schemes, ministry, or benefits..."
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

      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
          {FILTER_TABS.map((f, i) => (
            <TouchableOpacity 
              key={i} 
              style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
              onPress={() => handleFilter(f)}
            >
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        style={shared.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.green800} />
        }
      >
        <View style={styles.statusRow}>
          <Text style={styles.resultCount}>{filteredSchemes.length} schemes identified</Text>
          <View style={[styles.sourceBadge, dataSource === 'api' ? styles.sourceLive : styles.sourceCached]}>
             <Text style={styles.sourceText}>
               {dataSource === 'api' ? '● LIVE SYNC' : dataSource === 'cache' ? '📦 OFFLINE CACHE' : '⚠️ FALLBACK DATA'}
             </Text>
          </View>
        </View>

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={COLORS.green800} style={{ marginTop: 40 }} />
        ) : filteredSchemes.length > 0 ? (
          filteredSchemes.map((s, i) => (
            <View key={i} style={styles.schemeCard}>
              <View style={styles.tagRow}>
                <View style={[styles.tagBadge, getCategoryStyle(s.category)]}>
                  <Text style={styles.tagText}>{s.category.toUpperCase()}</Text>
                </View>
                <Text style={styles.deadline}>{s.state}</Text>
              </View>
              <Text style={styles.cardTitle}>{s.schemeName}</Text>
              <Text style={styles.ministry}>🏛 {s.ministry}</Text>
              <Text style={styles.cardDesc} numberOfLines={3}>{s.description}</Text>
              
              <TouchableOpacity 
                style={styles.applyBtn}
                onPress={() => openEligibilityCheck(s)}
              >
                <Text style={styles.applyBtnText}>Check My Eligibility →</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>🔎</Text>
            <Text style={styles.emptyText}>No matching schemes found.</Text>
            <TouchableOpacity onPress={() => handleFilter('All')} style={{ marginTop: 12 }}>
              <Text style={{ color: COLORS.green800, fontFamily: FONTS.sansBold }}>Clear all filters</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL INTEGRATION */}
      <EligibilityModal
        visible={modalVisible}
        scheme={selectedScheme}
        onClose={() => {
          setModalVisible(false);
          setSelectedScheme(null);
        }}
      />
    </SafeAreaView>
  );
}

const getCategoryStyle = (category: string) => {
  const map: any = {
    Insurance: { backgroundColor: '#E3F2FD' },
    Subsidies: { backgroundColor: '#E8F5E9' },
    Loans: { backgroundColor: '#FFF3E0' },
    Training: { backgroundColor: '#F3E5F5' },
    General: { backgroundColor: '#F5F5F5' },
  };
  return map[category] || map.General;
};

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
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    paddingHorizontal: 12, marginTop: 16, height: 46,
    ...SHADOW.card,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontFamily: FONTS.sans, fontSize: 14, color: COLORS.gray800 },
  clearIcon: { fontSize: 16, color: COLORS.gray600, padding: 4 },
  
  filterRow: { paddingVertical: 12, paddingLeft: 20 },
  filterChip: {
    backgroundColor: COLORS.white, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8, marginRight: 8,
    borderWidth: 1, borderColor: '#DCE2E8',
  },
  filterChipActive: { backgroundColor: COLORS.green800, borderColor: COLORS.green800 },
  filterText: { fontFamily: FONTS.sansBold, fontSize: 12, color: COLORS.gray600 },
  filterTextActive: { color: COLORS.white },

  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 },
  resultCount: { fontFamily: FONTS.sansBold, fontSize: 11, color: COLORS.gray600 },
  sourceBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  sourceLive: { backgroundColor: COLORS.green100 },
  sourceCached: { backgroundColor: '#F0F3F6' },
  sourceText: { fontFamily: FONTS.sansExtra, fontSize: 8, color: '#444', letterSpacing: 0.5 },

  schemeCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: 20, marginBottom: 16, ...SHADOW.card,
  },
  tagRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tagBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tagText: { fontFamily: FONTS.sansExtra, fontSize: 9, color: '#333' },
  deadline: { fontFamily: FONTS.sansBold, fontSize: 11, color: COLORS.green800 },
  cardTitle: { fontFamily: FONTS.sansExtra, fontSize: 16, color: COLORS.gray800, marginBottom: 4 },
  ministry: { fontFamily: FONTS.sansBold, fontSize: 11, color: COLORS.gray600, marginBottom: 8 },
  cardDesc: { fontFamily: FONTS.sans, fontSize: 13, color: COLORS.gray600, lineHeight: 20, marginBottom: 16 },
  applyBtn: { backgroundColor: COLORS.green100, paddingVertical: 14, borderRadius: RADIUS.lg, alignItems: 'center' },
  applyBtnText: { fontFamily: FONTS.sansBold, fontSize: 13, color: COLORS.green800 },

  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontFamily: FONTS.sansBold, fontSize: 14, color: COLORS.gray600 },
});
