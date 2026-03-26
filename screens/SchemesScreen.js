import React, { useState, useContext } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { COLORS, RADIUS, SHADOW } from '../constants/appTheme';
import { shared } from '../constants/sharedStyles';
import { fetchEligibleSchemes } from '../services/schemeService';
import { LanguageContext } from '../context/LanguageContext';

const STATES = [
  'Telangana', 'Andhra Pradesh', 'Maharashtra', 'Karnataka',
  'Tamil Nadu', 'Madhya Pradesh', 'Uttar Pradesh', 'Rajasthan',
  'Punjab', 'Gujarat', 'Bihar', 'West Bengal', 'Other',
];
const CATEGORIES = ['General', 'OBC', 'SC', 'ST', 'Minority'];
const CROPS = ['Rice', 'Wheat', 'Cotton', 'Maize', 'Tomato', 'Chilli', 'Soybean', 'Sugarcane', 'Groundnut', 'Other'];
const IRRIGATION_TYPES = ['Rainfed', 'Canal', 'Borewell', 'Drip', 'Sprinkler', 'Mixed'];

const TAG_COLORS = [
  { bg: COLORS.green100, text: COLORS.green800 },
  { bg: COLORS.blueBg, text: COLORS.blue },
  { bg: COLORS.amberBg, text: COLORS.orange },
  { bg: COLORS.purpleBg, text: COLORS.purple },
];

export default function SchemesScreen() {
  const { t, language } = useContext(LanguageContext);
  const [showForm, setShowForm] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [schemes, setSchemes] = useState([]);
  const [error, setError] = useState(null);

  // Form state
  const [name, setName] = useState('');
  const [state, setState] = useState('');
  const [landAcres, setLandAcres] = useState('');
  const [crop, setCrop] = useState('');
  const [category, setCategory] = useState('');
  const [irrigation, setIrrigation] = useState('');

  const handleSubmit = async () => {
    if (!name.trim() || !state || !landAcres.trim() || !crop || !category) {
      Alert.alert('Missing Details', 'Please fill in all required fields marked with *');
      return;
    }
    setIsLoading(true);
    setError(null);
    setShowForm(false);

    const profile = {
      name: name.trim(),
      state,
      land_acres: landAcres.trim(),
      crop,
      category,
      irrigation: irrigation || 'Unknown',
      language: language, // Pass selected language to the API
    };

    const result = await fetchEligibleSchemes(profile);
    setIsLoading(false);

    if (result.success) {
      setSchemes(result.schemes);
    } else {
      setError(result.error);
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
            <Text style={[styles.chipText, selected === opt && styles.chipTextActive]}>
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.cloudBg}>🏛</Text>
          <Text style={styles.pageTitle}>{t('schemesTitle')}</Text>
          <Text style={styles.pageSub}>{t('findSchemes')}</Text>
          {!showForm && schemes.length > 0 && (
            <View style={styles.eligRow}>
              <Text style={styles.eligText}>✅ {schemes.length} schemes found for you</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>

          {/* ── FARMER PROFILE FORM ── */}
          {showForm && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>{t('farmerProfile')}</Text>
              <Text style={styles.formDesc}>
                {t('findSchemes')}
              </Text>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>{t('fullName')}</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Ravi Kumar"
                  placeholderTextColor={COLORS.gray300}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <ChipSelector label={t('stateLabel')} options={STATES} selected={state} onSelect={setState} />

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>{t('landSize')}</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 2.5"
                  placeholderTextColor={COLORS.gray300}
                  value={landAcres}
                  onChangeText={setLandAcres}
                  keyboardType="numeric"
                />
              </View>

              <ChipSelector label={t('primaryCrop')} options={CROPS} selected={crop} onSelect={setCrop} />
              <ChipSelector label="Category *" options={CATEGORIES} selected={category} onSelect={setCategory} />
              <ChipSelector label="Irrigation Type" options={IRRIGATION_TYPES} selected={irrigation} onSelect={setIrrigation} />

              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.85}>
                <Text style={styles.submitBtnText}>{t('findEligible')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── LOADING ── */}
          {isLoading && (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color={COLORS.green800} />
              <Text style={styles.loadingText}>{t('aiTyping')}</Text>
            </View>
          )}

          {/* ── ERROR ── */}
          {error && (
            <View style={styles.errorCard}>
              <Text style={{ fontSize: 24 }}>⚠️</Text>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => { setShowForm(true); setError(null); }}>
                <Text style={styles.retryText}>← Edit Profile & Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── RESULTS ── */}
          {!showForm && !isLoading && schemes.length > 0 && (
            <>
              <TouchableOpacity style={styles.editProfileBtn} onPress={() => setShowForm(true)}>
                <Text style={styles.editProfileText}>{t('editProfile')}</Text>
              </TouchableOpacity>

              {schemes.map((s, i) => (
                <View key={i} style={styles.schemeCard}>
                  <View style={styles.scTop}>
                    <View style={[styles.scIcon, { backgroundColor: TAG_COLORS[i % TAG_COLORS.length].bg }]}>
                      <Text style={{ fontSize: 22 }}>
                        {['🌾', '🛡', '⚡', '🏦', '🌊'][i % 5]}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.scName}>{s.name}</Text>
                      {s.ministry ? <Text style={styles.scMinistry}>{s.ministry}</Text> : null}
                    </View>
                  </View>

                  <View style={styles.scTags}>
                    {s.benefit ? (
                      <View style={[styles.scTag, { backgroundColor: TAG_COLORS[i % TAG_COLORS.length].bg }]}>
                        <Text style={[styles.scTagText, { color: TAG_COLORS[i % TAG_COLORS.length].text }]}>
                          {s.benefit}
                        </Text>
                      </View>
                    ) : null}
                    {s.amount ? (
                      <View style={[styles.scTag, { backgroundColor: COLORS.green100 }]}>
                        <Text style={[styles.scTagText, { color: COLORS.green800 }]}>{s.amount}</Text>
                      </View>
                    ) : null}
                  </View>

                  {s.desc ? <Text style={styles.scDesc}>{s.desc}</Text> : null}
                </View>
              ))}
            </>
          )}

          {!showForm && !isLoading && schemes.length === 0 && !error && (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 32 }}>🔍</Text>
              <Text style={styles.emptyText}>No schemes found. Try adjusting your profile.</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => setShowForm(true)}>
                <Text style={styles.retryText}>← Edit Profile</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: shared.safe,
  header: {
    backgroundColor: '#4A148C',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24,
    overflow: 'hidden',
  },
  cloudBg: { position: 'absolute', top: 10, right: 16, fontSize: 60, opacity: 0.15 },
  pageTitle: shared.pageTitle,
  pageSub: shared.pageSub,
  eligRow: {
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5, alignSelf: 'flex-start',
  },
  eligText: { color: '#fff', fontSize: 11, fontWeight: '600' },

  content: shared.content,

  // ── Form ──
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 16,
    ...SHADOW.card,
    borderWidth: 1.5, borderColor: COLORS.gray100,
  },
  formTitle: { fontSize: 16, fontWeight: '800', color: COLORS.gray800, marginBottom: 4 },
  formDesc: { fontSize: 11, color: COLORS.gray600, marginBottom: 16, lineHeight: 16 },
  fieldBlock: { marginBottom: 14 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: COLORS.gray800, marginBottom: 6 },
  textInput: {
    backgroundColor: COLORS.gray100, borderRadius: RADIUS.sm,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 13, color: COLORS.gray800, fontWeight: '500',
  },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.gray100,
    marginRight: 8,
  },
  chipActive: { backgroundColor: '#4A148C', borderColor: '#4A148C' },
  chipText: { fontSize: 11, fontWeight: '600', color: COLORS.gray600 },
  chipTextActive: { color: '#fff' },
  submitBtn: {
    backgroundColor: COLORS.green800, borderRadius: RADIUS.sm,
    paddingVertical: 14, alignItems: 'center', marginTop: 8,
  },
  submitBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // ── Loading ──
  loadingState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  loadingText: { fontSize: 14, fontWeight: '700', color: COLORS.gray800 },
  loadingSub: { fontSize: 11, color: COLORS.gray600 },

  // ── Error ──
  errorCard: {
    alignItems: 'center', backgroundColor: COLORS.redBg,
    borderRadius: RADIUS.lg, padding: 20, gap: 10,
  },
  errorText: { fontSize: 12, color: COLORS.red, textAlign: 'center', fontWeight: '500' },

  // ── Results ──
  editProfileBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(74,20,140,0.1)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7, marginBottom: 14,
  },
  editProfileText: { fontSize: 11, fontWeight: '600', color: '#4A148C' },

  schemeCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: 14, marginBottom: 12, ...SHADOW.card,
    borderWidth: 1.5, borderColor: COLORS.gray100,
  },
  scTop: { flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'flex-start' },
  scIcon: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  scName: { fontSize: 12.5, fontWeight: '800', color: COLORS.gray800, lineHeight: 18 },
  scMinistry: { fontSize: 10, color: COLORS.gray600, fontWeight: '500', marginTop: 2 },
  scTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  scTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  scTagText: { fontSize: 9, fontWeight: '700' },
  scDesc: { fontSize: 10.5, color: COLORS.gray600, lineHeight: 16, fontWeight: '500' },

  // ── Empty / Retry ──
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 13, color: COLORS.gray600, fontWeight: '500', textAlign: 'center' },
  retryBtn: {
    backgroundColor: COLORS.green100, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8, marginTop: 8,
  },
  retryText: { fontSize: 12, fontWeight: '600', color: COLORS.green800 },
});
