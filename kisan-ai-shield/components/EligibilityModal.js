/**
 * components/EligibilityModal.js
 * 4-step AI Eligibility Wizard for Government Schemes.
 * Uses our design system tokens (COLORS, FONTS, RADIUS).
 *
 * Steps: Info → Profile Form → AI Loading → Result
 */
import React, { useState, useCallback } from 'react';
import {
  Modal, View, Text, TextInput, ScrollView,
  TouchableOpacity, ActivityIndicator, StyleSheet, Switch,
} from 'react-native';
import { checkSingleSchemeEligibility, saveEligibilityResult } from '../services/schemeService';
import { COLORS, FONTS, RADIUS } from '../constants/appTheme';

export default function EligibilityModal({ visible, scheme, onClose }) {
  const [step, setStep] = useState('info'); // 'info' | 'form' | 'loading' | 'result'
  const [result, setResult] = useState(null);
  const [profile, setProfile] = useState({
    name: '',
    state: 'Telangana',
    landHolding: '',
    annualIncome: '',
    cropType: '',
    age: '',
    caste: 'General',
    hasPattadar: true,
    bankAccountLinked: true,
  });

  if (!scheme) return null;

  const handleClose = useCallback(() => {
    setStep('info');
    setResult(null);
    onClose();
  }, [onClose]);

  const handleCheck = async () => {
    if (!profile.landHolding || !profile.annualIncome || !profile.age) {
      alert('Please fill Land Holding, Annual Income, and Age fields.');
      return;
    }
    setStep('loading');
    const farmerProfile = {
      ...profile,
      landHolding: parseFloat(profile.landHolding) || 0,
      annualIncome: parseFloat(profile.annualIncome) || 0,
      age: parseInt(profile.age) || 35,
      cropType: profile.cropType.split(',').map(c => c.trim()).filter(Boolean),
    };
    const res = await checkSingleSchemeEligibility(farmerProfile, scheme);
    // Save result silently to Firestore
    saveEligibilityResult(res, farmerProfile).catch(() => {});
    setResult(res);
    setStep('result');
  };

  const statusColor = { Eligible: '#2E7D32', 'Partially Eligible': '#F57F17', 'Not Eligible': '#C62828' };
  const statusBg    = { Eligible: '#E8F5E9', 'Partially Eligible': '#FFFDE7', 'Not Eligible': '#FFEBEE' };
  const statusIcon  = { Eligible: '✅', 'Partially Eligible': '⚠️', 'Not Eligible': '❌' };
  const currentStatus = result?.eligibilityStatus || 'Unknown';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={s.root}>

        {/* ── HEADER ── */}
        <View style={s.header}>
          <TouchableOpacity onPress={handleClose} style={s.closeBtn}>
            <Text style={s.closeX}>✕</Text>
          </TouchableOpacity>

          <View style={s.badgeRow}>
            <View style={[s.badge, { backgroundColor: scheme.state === 'Central' ? '#1565C0' : '#2E7D32' }]}>
              <Text style={s.badgeText}>{scheme.badge || scheme.state}</Text>
            </View>
            <View style={[s.badge, { backgroundColor: '#555' }]}>
              <Text style={s.badgeText}>{scheme.category}</Text>
            </View>
          </View>

          <Text style={s.schemeName}>{scheme.schemeName}</Text>
          <Text style={s.ministry}>🏛 {scheme.ministry}</Text>
          <Text style={s.tagline}>✦ {scheme.tagline}</Text>

          {/* Progress Steps */}
          <View style={s.steps}>
            {[
              { id: 'info', label: 'Info' },
              { id: 'form', label: 'Profile' },
              { id: 'result', label: 'Result' },
            ].map((st, i) => {
              const active = step === st.id || (step === 'loading' && st.id === 'result');
              const done =
                (i === 0 && ['form', 'loading', 'result'].includes(step)) ||
                (i === 1 && ['loading', 'result'].includes(step));
              return (
                <React.Fragment key={st.label}>
                  <View style={[s.stepDot, done && s.stepDone, active && s.stepActive]}>
                    <Text style={s.stepDotText}>{done ? '✓' : i + 1}</Text>
                  </View>
                  <Text style={s.stepLabel}>{st.label}</Text>
                  {i < 2 && <View style={[s.stepLine, done && s.stepLineDone]} />}
                </React.Fragment>
              );
            })}
          </View>
        </View>

        <ScrollView style={s.body} showsVerticalScrollIndicator={false}>

          {/* ════ STEP 1: SCHEME INFO ════ */}
          {step === 'info' && (
            <View>
              <Section title="📋 What is this scheme?">
                <Text style={s.bodyText}>{scheme.description}</Text>
              </Section>
              <Section title="💰 Benefits">
                <Text style={s.bodyText}>{scheme.benefits}</Text>
              </Section>
              <Section title="✅ Who Can Apply">
                <Text style={s.bodyText}>{scheme.eligibilityCriteria}</Text>
              </Section>
              {scheme.applicationProcess && (
                <Section title="📝 How to Apply">
                  <Text style={s.bodyText}>{scheme.applicationProcess}</Text>
                </Section>
              )}
              {scheme.requiredDocuments?.length > 0 && (
                <Section title="📂 Documents Needed">
                  {scheme.requiredDocuments.map((d, i) => (
                    <Text key={i} style={s.docItem}>📄 {d}</Text>
                  ))}
                </Section>
              )}
              <View style={s.infoRow}>
                {scheme.helpline && (
                  <View style={s.infoChip}>
                    <Text style={s.infoChipLabel}>📞 Helpline</Text>
                    <Text style={s.infoChipValue}>{scheme.helpline}</Text>
                  </View>
                )}
                <View style={s.infoChip}>
                  <Text style={s.infoChipLabel}>📅 Deadline</Text>
                  <Text style={s.infoChipValue}>{scheme.deadline}</Text>
                </View>
              </View>
              <TouchableOpacity style={s.primaryBtn} onPress={() => setStep('form')}>
                <Text style={s.primaryBtnText}>Check My Eligibility for {scheme.schemeName} →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ════ STEP 2: FARMER PROFILE FORM ════ */}
          {step === 'form' && (
            <View>
              <Text style={s.formHeading}>
                Your Profile — AI will check eligibility for{'\n'}
                <Text style={s.formHeadingScheme}>{scheme.schemeName}</Text>
              </Text>

              <Label text="Your Name" />
              <Input placeholder="e.g. Ramaiah" value={profile.name}
                onChangeText={t => setProfile({ ...profile, name: t })} />

              <Label text="State *" />
              <ChipRow
                options={['Telangana', 'Andhra Pradesh', 'Maharashtra', 'Karnataka', 'Other']}
                selected={profile.state}
                onSelect={v => setProfile({ ...profile, state: v })}
              />

              <Label text="Land Holding (Acres) *" />
              <Input placeholder="e.g. 2.5" keyboardType="decimal-pad"
                value={profile.landHolding}
                onChangeText={t => setProfile({ ...profile, landHolding: t })} />

              <Label text="Annual Income (₹) *" />
              <Input placeholder="e.g. 85000" keyboardType="number-pad"
                value={profile.annualIncome}
                onChangeText={t => setProfile({ ...profile, annualIncome: t })} />

              <Label text="Age *" />
              <Input placeholder="e.g. 45" keyboardType="number-pad"
                value={profile.age}
                onChangeText={t => setProfile({ ...profile, age: t })} />

              <Label text="Crops You Grow" />
              <Input placeholder="e.g. Rice, Cotton, Maize"
                value={profile.cropType}
                onChangeText={t => setProfile({ ...profile, cropType: t })} />

              <Label text="Caste Category" />
              <ChipRow
                options={['General', 'OBC', 'SC', 'ST']}
                selected={profile.caste}
                onSelect={v => setProfile({ ...profile, caste: v })}
              />

              <View style={s.switchRow}>
                <Text style={s.switchLabel}>Have Pattadar Passbook?</Text>
                <Switch
                  value={profile.hasPattadar}
                  onValueChange={v => setProfile({ ...profile, hasPattadar: v })}
                  trackColor={{ true: COLORS.green800 }}
                />
              </View>
              <View style={s.switchRow}>
                <Text style={s.switchLabel}>Bank Account Linked to Aadhaar?</Text>
                <Switch
                  value={profile.bankAccountLinked}
                  onValueChange={v => setProfile({ ...profile, bankAccountLinked: v })}
                  trackColor={{ true: COLORS.green800 }}
                />
              </View>

              <TouchableOpacity style={s.primaryBtn} onPress={handleCheck}>
                <Text style={s.primaryBtnText}>🤖 Analyse Eligibility for {scheme.schemeName}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.backBtn} onPress={() => setStep('info')}>
                <Text style={s.backBtnText}>← Back to Scheme Details</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ════ STEP 3: LOADING ════ */}
          {step === 'loading' && (
            <View style={s.loadingBox}>
              <ActivityIndicator size="large" color={COLORS.green800} />
              <Text style={s.loadingTitle}>Analysing eligibility...</Text>
              <Text style={s.loadingScheme}>{scheme.schemeName}</Text>
              <Text style={s.loadingSub}>AI is checking your profile against official criteria</Text>
            </View>
          )}

          {/* ════ STEP 4: RESULT ════ */}
          {step === 'result' && result && (
            <View>
              <View style={[s.resultCard, { backgroundColor: statusBg[currentStatus] || '#F5F5F5' }]}>
                <Text style={s.resultIcon}>{statusIcon[currentStatus] || '❓'}</Text>
                <Text style={[s.resultStatus, { color: statusColor[currentStatus] || '#333' }]}>
                  {result.eligibilityStatus}
                </Text>
                <Text style={s.resultSchemeName}>{scheme.schemeName}</Text>
                <Text style={s.resultHeadline}>{result.headline}</Text>
                <View style={s.scoreChip}>
                  <Text style={s.scoreLabel}>Eligibility Score: </Text>
                  <Text style={[s.scoreValue, { color: statusColor[currentStatus] }]}>
                    {result.eligibilityScore}/100
                  </Text>
                </View>
              </View>

              <Section title="📊 Why this result?">
                <Text style={s.bodyText}>{result.reason}</Text>
              </Section>

              {result.estimatedBenefit && (
                <View style={s.benefitCard}>
                  <Text style={s.benefitLabel}>💰 Your Estimated Benefit</Text>
                  <Text style={s.benefitValue}>{result.estimatedBenefit}</Text>
                </View>
              )}

              {result.matchedCriteria?.length > 0 && (
                <Section title="✅ Criteria You Meet">
                  {result.matchedCriteria.map((c, i) => (
                    <View key={i} style={s.criteriaRow}>
                      <Text style={s.criteriaGreen}>✓</Text>
                      <Text style={s.criteriaText}>{c}</Text>
                    </View>
                  ))}
                </Section>
              )}

              {result.missingRequirements?.length > 0 && (
                <Section title="❌ What You Still Need">
                  {result.missingRequirements.map((r, i) => (
                    <View key={i} style={s.criteriaRow}>
                      <Text style={s.criteriaRed}>✗</Text>
                      <Text style={s.criteriaText}>{r}</Text>
                    </View>
                  ))}
                </Section>
              )}

              <View style={s.actionCard}>
                <Text style={s.actionTitle}>🚀 Next Step</Text>
                <Text style={s.actionText}>{result.actionRequired}</Text>
                {result.nearestOffice && (
                  <Text style={s.actionOffice}>📍 Go to: {result.nearestOffice}</Text>
                )}
                {result.timeToApply && (
                  <Text style={s.actionTime}>⏰ {result.timeToApply}</Text>
                )}
              </View>

              <TouchableOpacity
                style={s.retryBtn}
                onPress={() => { setStep('form'); setResult(null); }}
              >
                <Text style={s.retryText}>Try Different Details</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.primaryBtn} onPress={handleClose}>
                <Text style={s.primaryBtnText}>Done ✓</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Sub-components ────────────────────────────────────────────────
const Section = ({ title, children }) => (
  <View style={s.section}>
    <Text style={s.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const Label = ({ text }) => <Text style={s.label}>{text}</Text>;

const Input = (props) => (
  <TextInput style={s.input} placeholderTextColor="#aaa" {...props} />
);

const ChipRow = ({ options, selected, onSelect }) => (
  <View style={s.chipRow}>
    {options.map(opt => (
      <TouchableOpacity
        key={opt}
        style={[s.chip, selected === opt && s.chipActive]}
        onPress={() => onSelect(opt)}
      >
        <Text style={[s.chipText, selected === opt && s.chipTextActive]}>{opt}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

// ── Styles ────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  header: { backgroundColor: COLORS?.green900 || '#1B5E20', padding: 20, paddingTop: 50, paddingBottom: 12 },
  closeBtn: { alignSelf: 'flex-end', padding: 8, marginBottom: 4 },
  closeX: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: '#fff', fontSize: 11, fontFamily: FONTS?.sansBold || 'System' },
  schemeName: { color: '#fff', fontSize: 24, fontFamily: FONTS?.sansExtra || 'System', lineHeight: 30, marginBottom: 4 },
  ministry: { color: '#C8E6C9', fontSize: 12, marginBottom: 6, fontFamily: FONTS?.sans || 'System' },
  tagline: { color: '#E8F5E9', fontSize: 13, fontStyle: 'italic', marginBottom: 12, fontFamily: FONTS?.sans || 'System' },
  steps: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  stepDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#4CAF50', alignItems: 'center', justifyContent: 'center' },
  stepActive: { backgroundColor: '#fff' },
  stepDone: { backgroundColor: '#81C784' },
  stepDotText: { color: '#1B5E20', fontSize: 11, fontFamily: FONTS?.sansBold || 'System' },
  stepLabel: { color: '#C8E6C9', fontSize: 10, marginHorizontal: 4, fontFamily: FONTS?.sans || 'System' },
  stepLine: { flex: 1, height: 1, backgroundColor: '#4CAF50' },
  stepLineDone: { backgroundColor: '#81C784' },

  body: { flex: 1, padding: 20 },
  section: { marginBottom: 20, backgroundColor: '#F9FBF9', borderRadius: 12, padding: 14 },
  sectionTitle: { fontSize: 14, fontFamily: FONTS?.sansBold || 'System', color: '#1B5E20', marginBottom: 8 },
  bodyText: { fontSize: 14, color: '#444', lineHeight: 22, fontFamily: FONTS?.sans || 'System' },
  docItem: { fontSize: 13, color: '#555', marginBottom: 4, fontFamily: FONTS?.sans || 'System' },
  infoRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  infoChip: { flex: 1, backgroundColor: '#E8F5E9', borderRadius: 10, padding: 12 },
  infoChipLabel: { fontSize: 11, color: '#555', marginBottom: 4, fontFamily: FONTS?.sans || 'System' },
  infoChipValue: { fontSize: 13, fontFamily: FONTS?.sansBold || 'System', color: '#1B5E20' },

  formHeading: { fontSize: 15, color: '#555', marginBottom: 20, lineHeight: 22, fontFamily: FONTS?.sans || 'System' },
  formHeadingScheme: { color: '#1B5E20', fontFamily: FONTS?.sansExtra || 'System' },
  label: { fontSize: 13, fontFamily: FONTS?.sansBold || 'System', color: '#444', marginBottom: 6, marginTop: 14 },
  input: {
    borderWidth: 1.5, borderColor: '#C8E6C9', borderRadius: 10,
    padding: 12, fontSize: 15, color: '#333', backgroundColor: '#FAFAFA',
    fontFamily: FONTS?.sans || 'System',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#C8E6C9', backgroundColor: '#fff', marginBottom: 4 },
  chipActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  chipText: { fontSize: 13, color: '#555', fontFamily: FONTS?.sans || 'System' },
  chipTextActive: { color: '#fff', fontFamily: FONTS?.sansBold || 'System' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  switchLabel: { fontSize: 14, color: '#444', flex: 1, fontFamily: FONTS?.sans || 'System' },

  primaryBtn: { backgroundColor: '#2E7D32', borderRadius: RADIUS?.lg || 14, padding: 16, alignItems: 'center', marginTop: 24 },
  primaryBtnText: { color: '#fff', fontFamily: FONTS?.sansBold || 'System', fontSize: 15 },
  backBtn: { alignItems: 'center', marginTop: 12 },
  backBtnText: { color: '#555', fontSize: 14, fontFamily: FONTS?.sans || 'System' },

  loadingBox: { alignItems: 'center', paddingTop: 80 },
  loadingTitle: { fontSize: 20, fontFamily: FONTS?.sansBold || 'System', color: '#2E7D32', marginTop: 20 },
  loadingScheme: { fontSize: 14, color: '#2E7D32', fontFamily: FONTS?.sansBold || 'System', marginTop: 8, textAlign: 'center' },
  loadingSub: { fontSize: 13, color: '#999', marginTop: 8, textAlign: 'center', fontFamily: FONTS?.sans || 'System' },

  resultCard: { borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20 },
  resultIcon: { fontSize: 44, marginBottom: 8 },
  resultStatus: { fontSize: 22, fontFamily: FONTS?.sansExtra || 'System', marginBottom: 4 },
  resultSchemeName: { fontSize: 15, fontFamily: FONTS?.sansBold || 'System', color: '#333', marginBottom: 6, textAlign: 'center' },
  resultHeadline: { fontSize: 14, color: '#555', textAlign: 'center', marginBottom: 12, fontFamily: FONTS?.sans || 'System' },
  scoreChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  scoreLabel: { fontSize: 13, color: '#555', fontFamily: FONTS?.sans || 'System' },
  scoreValue: { fontSize: 18, fontFamily: FONTS?.sansExtra || 'System' },

  benefitCard: { backgroundColor: '#E8F5E9', borderRadius: 12, padding: 16, marginBottom: 16 },
  benefitLabel: { fontSize: 12, color: '#555', marginBottom: 4, fontFamily: FONTS?.sans || 'System' },
  benefitValue: { fontSize: 20, fontFamily: FONTS?.sansExtra || 'System', color: '#1B5E20' },

  criteriaRow: { flexDirection: 'row', marginBottom: 6, alignItems: 'flex-start' },
  criteriaGreen: { color: '#2E7D32', fontFamily: FONTS?.sansExtra || 'System', marginRight: 8, fontSize: 16 },
  criteriaRed: { color: '#C62828', fontFamily: FONTS?.sansExtra || 'System', marginRight: 8, fontSize: 16 },
  criteriaText: { flex: 1, fontSize: 14, color: '#444', lineHeight: 20, fontFamily: FONTS?.sans || 'System' },

  actionCard: { backgroundColor: '#E3F2FD', borderRadius: 12, padding: 16, marginBottom: 16 },
  actionTitle: { fontSize: 14, fontFamily: FONTS?.sansBold || 'System', color: '#1565C0', marginBottom: 8 },
  actionText: { fontSize: 14, color: '#333', lineHeight: 20, marginBottom: 6, fontFamily: FONTS?.sans || 'System' },
  actionOffice: { fontSize: 13, color: '#555', marginBottom: 4, fontFamily: FONTS?.sans || 'System' },
  actionTime: { fontSize: 13, color: '#E65100', fontFamily: FONTS?.sansBold || 'System' },

  retryBtn: { borderWidth: 1.5, borderColor: '#2E7D32', borderRadius: RADIUS?.lg || 14, padding: 14, alignItems: 'center', marginBottom: 12 },
  retryText: { color: '#2E7D32', fontFamily: FONTS?.sansBold || 'System' },
});
