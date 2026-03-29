/**
 * screens/SchemesScreen.js
 * Production-grade Government Schemes Screen.
 * Dual-mode: Browse all MASTER_SCHEMES (instant) + AI bulk eligibility check via Flask.
 * Per-scheme 4-step eligibility wizard via EligibilityModal.
 */
import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { COLORS, FONTS, RADIUS, SHADOW, SPACING } from '../constants/appTheme';
import { shared } from '../constants/sharedStyles';
import { LanguageContext } from '../context/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchSchemes, fetchEligibleSchemes, MASTER_SCHEMES } from '../services/schemeService';
import EligibilityModal from '../components/EligibilityModal';

// ── Constants ─────────────────────────────────────────────────────
const FILTER_TABS = ['All', 'Insurance', 'Subsidies', 'Loans', 'General'];
const STATES = ['Telangana', 'Andhra Pradesh', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Madhya Pradesh', 'Other'];
const CATEGORIES = ['General', 'OBC', 'SC', 'ST', 'Minority'];
const CROPS = ['Rice', 'Wheat', 'Cotton', 'Maize', 'Tomato', 'Chilli', 'Soybean', 'Sugarcane', 'Groundnut', 'Other'];

const CATEGORY_STYLE = {
  Insurance: { bg: '#E3F2FD', text: '#1565C0' },
  Subsidies: { bg: '#E8F5E9', text: '#2E7D32' },
  Loans:     { bg: '#FFF3E0', text: '#E65100' },
  Training:  { bg: '#F3E5F5', text: '#6A1B9A' },
  General:   { bg: '#F5F5F5', text: '#424242' },
};

export default function SchemesScreen() {
  const { t, language } = useContext(LanguageContext);

  // ── Browse mode state ─────────────────────────────────────────
  const [allSchemes, setAllSchemes]   = useState(MASTER_SCHEMES); // instant load
  const [filtered, setFiltered]       = useState(MASTER_SCHEMES);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [loadingSchemes, setLoadingSchemes] = useState(false);
  const [refreshing, setRefreshing]   = useState(false);
  const [dataSource, setDataSource]   = useState('master');

  // ── Eligibility Modal ─────────────────────────────────────────
  const [modalVisible, setModalVisible]   = useState(false);
  const [selectedScheme, setSelectedScheme] = useState(null);

  // ── AI Bulk Eligibility form state ────────────────────────────
  const [showForm, setShowForm]   = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eligibleSchemes, setEligibleSchemes] = useState([]);
  const [formError, setFormError] = useState(null);
  const [name, setName]           = useState('');
  const [state, setState]         = useState('');
  const [landAcres, setLandAcres] = useState('');
  const [crop, setCrop]           = useState('');
  const [category, setCategory]   = useState('');

  // ── Load & persist farmer profile ─────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem('kisan_farmer_profile').then(saved => {
      if (saved) {
        try {
          const p = JSON.parse(saved);
          if (p.name) setName(p.name);
          if (p.state) setState(p.state);
          if (p.landAcres) setLandAcres(p.landAcres);
          if (p.crop) setCrop(p.crop);
          if (p.category) setCategory(p.category);
        } catch (e) {}
      }
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('kisan_farmer_profile', JSON.stringify({ name, state, landAcres, crop, category }));
  }, [name, state, landAcres, crop, category]);

  // ── Load schemes from Firestore/API ───────────────────────────
  const loadSchemes = useCallback(async (force = false) => {
    if (allSchemes.length === 0) setLoadingSchemes(true);
    const { data, source } = await fetchSchemes(30, force);
    setAllSchemes(data);
    applyFilters(data, searchQuery, activeFilter);
    setDataSource(source);
    setLoadingSchemes(false);
    setRefreshing(false);
  }, [searchQuery, activeFilter]);

  useEffect(() => { loadSchemes(); }, []);

  const onRefresh = () => { setRefreshing(true); loadSchemes(true); };

  // ── Filter & Search ───────────────────────────────────────────
  const applyFilters = (schemes, query, filter) => {
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
    setFiltered(result);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    applyFilters(allSchemes, text, activeFilter);
  };

  const handleFilter = (f) => {
    setActiveFilter(f);
    applyFilters(allSchemes, searchQuery, f);
  };

  // ── Open per-scheme eligibility modal ─────────────────────────
  const openEligibilityCheck = (scheme) => {
    setSelectedScheme(scheme);
    setModalVisible(true);
  };

  // ── AI Bulk form submit ───────────────────────────────────────
  const handleBulkSubmit = async () => {
    if (!name.trim() || !state || !landAcres.trim() || !crop || !category) {
      Alert.alert('Missing Details', 'Please fill all required fields.');
      return;
    }
    setIsSubmitting(true);
    setFormError(null);
    const profile = { name: name.trim(), state, land_acres: landAcres, crop, category, language };
    const result = await fetchEligibleSchemes(profile);
    setIsSubmitting(false);
    if (result.success) {
      setEligibleSchemes(result.schemes);
      setShowForm(false);
    } else {
      setFormError(result.error);
    }
  };

  const ChipSelector = ({ label, options, selected, onSelect }) => (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {options.map((opt, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.chip, selected === opt && styles.chipActive]}
            onPress={() => onSelect(opt)}
          >
            <Text style={[styles.chipText, selected === opt && styles.chipTextActive]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const srcBadge = dataSource === 'live' ? '● LIVE'
    : dataSource === 'cache' ? '📦 CACHED'
    : '🗃 MASTER';

  return (
    <SafeAreaView style={styles.safe}>

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>{t('schemesTitle') || 'Govt Schemes'}</Text>
        <Text style={styles.pageSub}>Agricultural Benefits & Subsidies</Text>

        {/* Search bar */}
        <View style={styles.searchContainer}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search schemes, ministry, state..."
            placeholderTextColor={COLORS.gray400}
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

      {/* ── FILTER TABS ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={styles.filterRow} contentContainerStyle={{ paddingRight: 20 }}>
        {FILTER_TABS.map((f, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            onPress={() => handleFilter(f)}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
        {/* AI Eligibility button */}
        <TouchableOpacity
          style={[styles.filterChip, { backgroundColor: '#4A148C', borderColor: '#4A148C' }]}
          onPress={() => setShowForm(!showForm)}
        >
          <Text style={[styles.filterText, { color: '#fff' }]}>🤖 AI Check</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── MAIN SCROLL AREA ── */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.green800} />}
      >
        {/* Status row */}
        <View style={styles.statusRow}>
          <Text style={styles.resultCount}>{filtered.length} schemes identified</Text>
          <View style={[styles.sourceBadge, dataSource === 'live' ? styles.sourceLive : styles.sourceCached]}>
            <Text style={styles.sourceText}>{srcBadge}</Text>
          </View>
        </View>

        {/* ── AI BULK FORM ── */}
        {showForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>🤖 AI Eligibility Check</Text>
            <Text style={styles.formDesc}>Enter your details to find ALL schemes you qualify for via AI</Text>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Full Name *</Text>
              <TextInput style={styles.textInput} placeholder="e.g. Ravi Kumar"
                placeholderTextColor={COLORS.gray300} value={name} onChangeText={setName} />
            </View>

            <ChipSelector label="State *" options={STATES} selected={state} onSelect={setState} />
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Land Size (acres) *</Text>
              <TextInput style={styles.textInput} placeholder="e.g. 2.5" keyboardType="numeric"
                placeholderTextColor={COLORS.gray300} value={landAcres} onChangeText={setLandAcres} />
            </View>
            <ChipSelector label="Primary Crop *" options={CROPS} selected={crop} onSelect={setCrop} />
            <ChipSelector label="Category *" options={CATEGORIES} selected={category} onSelect={setCategory} />

            <TouchableOpacity style={styles.submitBtn} onPress={handleBulkSubmit} disabled={isSubmitting}>
              {isSubmitting
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.submitBtnText}>{t('findEligible') || 'Find Eligible Schemes →'}</Text>
              }
            </TouchableOpacity>
            {formError && <Text style={styles.errorText}>{formError}</Text>}

            {/* AI Results */}
            {eligibleSchemes.length > 0 && (
              <View style={{ marginTop: 16 }}>
                <Text style={styles.aiResultTitle}>✅ {eligibleSchemes.length} schemes found by AI</Text>
                {eligibleSchemes.map((s, i) => (
                  <View key={i} style={styles.aiResultCard}>
                    <Text style={styles.aiResultName}>{s.name}</Text>
                    {s.benefit && <Text style={styles.aiResultBenefit}>{s.benefit}</Text>}
                    {s.desc && <Text style={styles.aiResultDesc}>{s.desc}</Text>}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── LOADING ── */}
        {loadingSchemes && !refreshing && (
          <ActivityIndicator size="large" color={COLORS.green800} style={{ marginTop: 40 }} />
        )}

        {/* ── SCHEMES LIST ── */}
        {!loadingSchemes && filtered.map((s, i) => {
          const cat = CATEGORY_STYLE[s.category] || CATEGORY_STYLE.General;
          return (
            <View key={s.id || i} style={styles.schemeCard}>
              <View style={styles.schemeTagRow}>
                <View style={[styles.categoryTag, { backgroundColor: cat.bg }]}>
                  <Text style={[styles.categoryTagText, { color: cat.text }]}>{s.category?.toUpperCase()}</Text>
                </View>
                <View style={[styles.stateBadge, { backgroundColor: s.state === 'Central' ? '#E3F2FD' : '#E8F5E9' }]}>
                  <Text style={[styles.stateBadgeText, { color: s.state === 'Central' ? '#1565C0' : '#2E7D32' }]}>
                    {s.badge || s.state}
                  </Text>
                </View>
              </View>

              <Text style={styles.schemeName}>{s.schemeName}</Text>
              <Text style={styles.schemeMinistry}>🏛 {s.ministry}</Text>
              <Text style={styles.schemeDesc} numberOfLines={3}>{s.description}</Text>

              {s.tagline && (
                <View style={styles.taglineBox}>
                  <Text style={styles.taglineText}>✦ {s.tagline}</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.eligibilityBtn}
                onPress={() => openEligibilityCheck(s)}
              >
                <Text style={styles.eligibilityBtnText}>Check My Eligibility →</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* ── EMPTY STATE ── */}
        {!loadingSchemes && filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>🔎</Text>
            <Text style={styles.emptyText}>No matching schemes found.</Text>
            <TouchableOpacity onPress={() => { handleFilter('All'); handleSearch(''); }}>
              <Text style={{ color: COLORS.green800, fontFamily: FONTS.bodyBold, marginTop: 12 }}>
                Clear all filters
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── ELIGIBILITY MODAL ── */}
      <EligibilityModal
        visible={modalVisible}
        scheme={selectedScheme}
        onClose={() => { setModalVisible(false); setSelectedScheme(null); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { ...shared.safe },
  header: {
    backgroundColor: '#4A148C',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20,
  },
  pageTitle: shared.pageTitle,
  pageSub: shared.pageSub,
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    paddingHorizontal: 12, marginTop: 16, height: 46,
    ...SHADOW.card,
  },
  searchInput: { flex: 1, fontFamily: FONTS.bodyMed, fontSize: 14, color: COLORS.gray800 },
  clearIcon: { fontSize: 16, color: COLORS.gray600, padding: 4 },

  filterRow: { paddingVertical: 12, paddingLeft: 16, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  filterChip: {
    backgroundColor: COLORS.white, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8, marginRight: 8,
    borderWidth: 1.5, borderColor: COLORS.gray100,
  },
  filterChipActive: { backgroundColor: COLORS.green800, borderColor: COLORS.green800 },
  filterText: { fontFamily: FONTS.bodyBold, fontSize: 12, color: COLORS.gray600 },
  filterTextActive: { color: COLORS.white },

  content: { flex: 1, paddingHorizontal: 16 },

  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 12 },
  resultCount: { fontFamily: FONTS.bodyBold, fontSize: 11, color: COLORS.gray600 },
  sourceBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  sourceLive: { backgroundColor: COLORS.green100 },
  sourceCached: { backgroundColor: '#F0F3F6' },
  sourceText: { fontFamily: FONTS.bodyBold, fontSize: 9, color: '#444' },

  // ── AI FORM ──
  formCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: 16, marginBottom: 16, ...SHADOW.card,
    borderWidth: 1.5, borderColor: '#CE93D8',
  },
  formTitle: { fontSize: 16, fontFamily: FONTS.headingXl || FONTS.bodyBold, color: '#4A148C', marginBottom: 4 },
  formDesc: { fontSize: 12, color: COLORS.gray600, fontFamily: FONTS.body, marginBottom: 12, lineHeight: 18 },
  fieldBlock: { marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontFamily: FONTS.bodyBold, color: COLORS.gray800, marginBottom: 6 },
  textInput: {
    backgroundColor: COLORS.gray100, borderRadius: RADIUS.sm,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 13, color: COLORS.gray800, fontFamily: FONTS.bodyMed,
  },
  chip: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20,
    backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.gray100, marginRight: 8,
  },
  chipActive: { backgroundColor: '#4A148C', borderColor: '#4A148C' },
  chipText: { fontSize: 12, fontFamily: FONTS.bodySemi || FONTS.bodyMed, color: COLORS.gray600 },
  chipTextActive: { color: '#fff' },
  submitBtn: {
    backgroundColor: COLORS.green800, borderRadius: RADIUS.sm,
    paddingVertical: 14, alignItems: 'center', marginTop: 8,
  },
  submitBtnText: { color: '#fff', fontSize: 15, fontFamily: FONTS.bodyBold },
  errorText: { fontSize: 12, color: COLORS.red, marginTop: 8, fontFamily: FONTS.bodyMed, textAlign: 'center' },
  aiResultTitle: { fontFamily: FONTS.bodyBold, fontSize: 13, color: COLORS.green800, marginBottom: 10 },
  aiResultCard: {
    backgroundColor: COLORS.green50, borderRadius: RADIUS.md,
    padding: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: COLORS.green800,
  },
  aiResultName: { fontFamily: FONTS.bodyBold, fontSize: 13, color: COLORS.gray800, marginBottom: 2 },
  aiResultBenefit: { fontFamily: FONTS.bodySemi || FONTS.bodyMed, fontSize: 11, color: COLORS.green800, marginBottom: 4 },
  aiResultDesc: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.gray600, lineHeight: 16 },

  // ── SCHEME CARDS ──
  schemeCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: 20, marginBottom: 14, ...SHADOW.card,
  },
  schemeTagRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  categoryTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  categoryTagText: { fontFamily: FONTS.bodyBold, fontSize: 9 },
  stateBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  stateBadgeText: { fontFamily: FONTS.bodyBold, fontSize: 9 },
  schemeName: { fontFamily: FONTS.headingXl || FONTS.bodyBold, fontSize: 16, color: COLORS.gray800, marginBottom: 4 },
  schemeMinistry: { fontFamily: FONTS.bodyBold, fontSize: 11, color: COLORS.gray600, marginBottom: 8 },
  schemeDesc: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.gray600, lineHeight: 20, marginBottom: 10 },
  taglineBox: { backgroundColor: COLORS.green50, borderRadius: 8, padding: 8, marginBottom: 12 },
  taglineText: { fontFamily: FONTS.bodySemi || FONTS.bodyMed, fontSize: 12, color: COLORS.green800, fontStyle: 'italic' },
  eligibilityBtn: {
    backgroundColor: COLORS.green100, paddingVertical: 14,
    borderRadius: RADIUS.lg, alignItems: 'center',
  },
  eligibilityBtnText: { fontFamily: FONTS.bodyBold, fontSize: 13, color: COLORS.green800 },

  // ── EMPTY ──
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontFamily: FONTS.bodyMed, fontSize: 14, color: COLORS.gray600 },
});
