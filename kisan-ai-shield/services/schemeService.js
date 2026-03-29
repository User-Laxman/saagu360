/**
 * services/schemeService.js
 * Production-grade Government Scheme service.
 *
 * Features:
 * - MASTER_SCHEMES: 8 real Indian agricultural schemes (always available offline)
 * - fetchSchemes(): Firestore cache (24hr) → data.gov.in API → master fallback
 * - checkSingleSchemeEligibility(): Gemini AI → rule-based fallback
 * - fetchEligibleSchemes(): Flask LLM for bulk eligibility check (our custom endpoint)
 */
import axios from 'axios';
import { db } from '../firebase/config';
import {
  collection, doc, getDocs, setDoc,
  getDoc, serverTimestamp,
} from 'firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BASE_URL } from './apiConfig';

// ── Config ────────────────────────────────────────────────────────
const SCHEMES_API_URL  = process.env.EXPO_PUBLIC_SCHEMES_API_URL
  || 'https://api.data.gov.in/resource/47a0970a-9fef-427d-8cdd-767085fda87b';
const DATA_GOV_KEY     = process.env.EXPO_PUBLIC_DATA_GOV_API_KEY
  || '579b464db66ec23bdd00000143047e5301a841ff4d7fe09facee214a';
const GEMINI_KEY       = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const CACHE_MS         = 24 * 60 * 60 * 1000; // 24 hours

// ════════════════════════════════════════════════════════════════
// MASTER SCHEMES DATABASE — Real Indian Agricultural Schemes
// These load instantly with zero network dependency.
// ════════════════════════════════════════════════════════════════
export const MASTER_SCHEMES = [
  {
    id: 'rythu_bima',
    schemeName: 'Rythu Bima',
    fullTitle: 'Farmers Group Life Insurance Scheme (Rythu Bima)',
    ministry: 'Government of Telangana / LIC of India',
    category: 'Insurance',
    state: 'Telangana',
    deadline: 'Ongoing',
    badge: 'State',
    tagline: '₹5 lakh life insurance coverage for all Telangana farmers.',
    description:
      'Rythu Bima provides ₹5,00,000 financial relief to the family of a farmer in case of death due to any reason. '
      + 'The Government pays the full premium through LIC of India. Over 50 lakh Telangana farmers are enrolled.',
    eligibilityCriteria:
      '• Permanent resident of Telangana\n'
      + '• Age between 18 to 59 years\n'
      + '• Must hold Pattadar Passbook or RoFR Patta\n'
      + '• Land must be in Dharani land records\n'
      + '• Tenant/rental farmers are NOT eligible',
    benefits:
      '• ₹5,00,000 paid to nominee on farmer\'s death (any cause)\n'
      + '• Government pays 100% premium — farmer pays nothing\n'
      + '• Claim settled within 10 days\n'
      + '• Money transferred directly to nominee\'s bank account',
    applicationProcess:
      '1. Contact your local Agriculture Extension Officer (AEO)\n'
      + '2. Provide nominee details, Aadhaar card, Pattadar Passbook\n'
      + '3. AEO uploads details to Rythu Bima portal\n'
      + '4. LIC generates unique Insurance ID sent to your mobile',
    requiredDocuments: ['Aadhaar Card', 'Pattadar Passbook', 'Nominee Aadhaar', 'Bank Account Details'],
    applicationLink: 'https://rythubandhu.telangana.gov.in',
    helpline: '040-23383520',
    isActive: true,
  },
  {
    id: 'rythu_bandhu',
    schemeName: 'Rythu Bandhu',
    fullTitle: 'Agriculture Investment Support Scheme (Rythu Bandhu)',
    ministry: 'Government of Telangana — Agriculture Department',
    category: 'Subsidies',
    state: 'Telangana',
    deadline: 'Ongoing — Every Season',
    badge: 'State',
    tagline: '₹5,000 per acre per season direct support for Telangana farmers.',
    description:
      'Rythu Bandhu transfers ₹5,000 per acre per crop season (Kharif and Rabi) '
      + 'to all pattadar farmers before the season starts. ₹10,000/acre/year total.',
    eligibilityCriteria:
      '• Must be a landholding farmer in Telangana\n'
      + '• Must hold a valid Pattadar Passbook\n'
      + '• Land must be registered in Dharani portal\n'
      + '• Tenant farmers are NOT eligible (only pattadars)',
    benefits:
      '• ₹5,000 per acre per season (Kharif + Rabi)\n'
      + '• ₹10,000 per acre per year total\n'
      + '• Directly credited to bank account before season\n'
      + '• No application needed — automatic based on land records',
    applicationProcess:
      '1. No separate application needed\n'
      + '2. Automatically credited based on Dharani land records\n'
      + '3. Ensure bank account is linked to Aadhaar',
    requiredDocuments: ['Pattadar Passbook', 'Aadhaar Card', 'Bank Passbook'],
    applicationLink: 'https://rythubandhu.telangana.gov.in',
    helpline: '1800-425-2977',
    isActive: true,
  },
  {
    id: 'pm_kisan',
    schemeName: 'PM-KISAN Samman Nidhi',
    fullTitle: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
    ministry: 'Ministry of Agriculture & Farmers Welfare, Government of India',
    category: 'Subsidies',
    state: 'Central',
    deadline: 'Ongoing',
    badge: 'Central',
    tagline: '₹6,000 per year directly to all landholding farmer families.',
    description:
      'PM-KISAN provides income support of ₹6,000 per year to all landholding farmer families in India. '
      + 'Paid in 3 equal installments of ₹2,000 every 4 months. Over 11 crore farmers enrolled.',
    eligibilityCriteria:
      '• All landholding farmer families with cultivable agricultural land\n'
      + '• Small and marginal farmers (up to 2 hectares) get priority\n'
      + '• EXCLUDED: Government employees, Income Tax payers, doctors, lawyers earning >₹10,000/month',
    benefits:
      '• ₹6,000 per year in 3 installments of ₹2,000 each\n'
      + '• Directly to Aadhaar-linked bank account\n'
      + '• No intermediaries — Direct Benefit Transfer (DBT)',
    applicationProcess:
      '1. Visit pmkisan.gov.in or nearest CSC\n'
      + '2. Self-register at pmkisan.gov.in → Farmer Corner → New Farmer Registration\n'
      + '3. Submit: Aadhaar, bank account, land ownership documents',
    requiredDocuments: ['Aadhaar Card', 'Land Ownership Documents', 'Bank Passbook', 'Mobile Number'],
    applicationLink: 'https://pmkisan.gov.in',
    helpline: '155261 / 011-24300606',
    isActive: true,
  },
  {
    id: 'pmfby',
    schemeName: 'PM Fasal Bima Yojana',
    fullTitle: 'Pradhan Mantri Fasal Bima Yojana (PMFBY) — Crop Insurance',
    ministry: 'Ministry of Agriculture & Farmers Welfare, Government of India',
    category: 'Insurance',
    state: 'Central',
    deadline: 'Season-based (Kharif: July, Rabi: December)',
    badge: 'Central',
    tagline: 'Crop insurance — pay just 2% premium, get full loss coverage.',
    description:
      'PMFBY is India\'s largest crop insurance scheme. Farmers pay only 2% for Kharif crops, 1.5% for Rabi. '
      + 'Covers yield losses due to drought, flood, pest, disease, and hailstorm.',
    eligibilityCriteria:
      '• All farmers growing notified crops in notified areas\n'
      + '• Mandatory for farmers with KCC (Kisan Credit Card) crop loans\n'
      + '• Voluntary for non-loanee farmers\n'
      + '• Both sharecroppers and tenant farmers are eligible',
    benefits:
      '• Full crop loss compensation based on area yield\n'
      + '• Kharif premium: only 2% of sum insured\n'
      + '• Rabi premium: only 1.5% of sum insured\n'
      + '• Post-harvest losses also covered (up to 14 days)',
    applicationProcess:
      '1. Visit nearest bank, CSC, or apply at pmfby.gov.in\n'
      + '2. Submit: Aadhaar, bank account, land/sowing certificate, crop details\n'
      + '3. Enrol before seasonal deadline',
    requiredDocuments: ['Aadhaar Card', 'Bank Account', 'Land Records / Khasra', 'Sowing Certificate'],
    applicationLink: 'https://pmfby.gov.in',
    helpline: '1800-200-7710',
    isActive: true,
  },
  {
    id: 'kcc',
    schemeName: 'Kisan Credit Card (KCC)',
    fullTitle: 'Kisan Credit Card Scheme — Low Interest Crop Credit',
    ministry: 'Ministry of Finance / NABARD / RBI',
    category: 'Loans',
    state: 'Central',
    deadline: 'Ongoing',
    badge: 'Central',
    tagline: 'Up to ₹3 lakh crop credit at just 4% interest per year.',
    description:
      'KCC provides farmers with flexible credit for seeds, fertilizers, and pesticides. '
      + 'Interest subvention reduces effective interest to just 4% p.a. on amounts up to ₹3 lakh.',
    eligibilityCriteria:
      '• All farmers — individual/joint borrowers with agricultural land\n'
      + '• Tenant farmers, oral lessees, and sharecroppers also eligible\n'
      + '• SHGs and JLGs are eligible\n'
      + '• No upper land limit',
    benefits:
      '• Credit up to ₹3 lakh at 7% p.a. (effectively 4% with 3% govt subvention)\n'
      + '• No collateral up to ₹1.6 lakh\n'
      + '• Personal accident insurance of ₹50,000 included\n'
      + '• Flexible repayment aligned with harvest season',
    applicationProcess:
      '1. Visit nearest bank (SBI, BoB, NABARD branches, RRBs)\n'
      + '2. Fill KCC application form\n'
      + '3. Submit land documents, Aadhaar, passport photo\n'
      + '4. Bank verifies and issues KCC within 2 weeks',
    requiredDocuments: ['Aadhaar Card', 'Land Records', 'Passport Photo', 'Income Proof'],
    applicationLink: 'https://www.nabard.org/content.aspx?id=591',
    helpline: '1800-180-1111',
    isActive: true,
  },
  {
    id: 'pm_kusum',
    schemeName: 'PM KUSUM Yojana',
    fullTitle: 'Pradhan Mantri Kisan Urja Suraksha evam Utthaan Mahabhiyan (PM KUSUM)',
    ministry: 'Ministry of New and Renewable Energy, Government of India',
    category: 'Subsidies',
    state: 'Central',
    deadline: 'Ongoing',
    badge: 'Central',
    tagline: '90% subsidy on solar pumps — reduce diesel cost by ₹50,000/year.',
    description:
      'PM KUSUM provides 60% central + state subsidy on solar irrigation pumps. '
      + 'Farmers pay only 10%; 30% can be a bank loan. Saves ₹40,000–₹60,000/year in diesel costs.',
    eligibilityCriteria:
      '• Any farmer with agricultural land\n'
      + '• Priority to water-stressed/dark zone districts\n'
      + '• Must not have existing solar pump under this scheme',
    benefits:
      '• 30% Central Government subsidy + 30% State subsidy\n'
      + '• Farmer pays only 10% of cost\n'
      + '• 30% bank loan at subsidised rates\n'
      + '• Excess electricity can be sold to DISCOM',
    applicationProcess:
      '1. Apply through state DISCOM or State Renewable Energy Agency\n'
      + '2. In Telangana: Apply through TSREDCO\n'
      + '3. Submit land documents, Aadhaar, electricity bill',
    requiredDocuments: ['Aadhaar Card', 'Land Records', 'Bank Account', 'Electricity Bill'],
    applicationLink: 'https://pmkusum.mnre.gov.in',
    helpline: '1800-180-3333',
    isActive: true,
  },
  {
    id: 'soil_health_card',
    schemeName: 'Soil Health Card',
    fullTitle: 'Soil Health Card Scheme — Know Your Soil, Grow Better Crops',
    ministry: 'Ministry of Agriculture & Farmers Welfare, Government of India',
    category: 'General',
    state: 'Central',
    deadline: 'Ongoing',
    badge: 'Central',
    tagline: 'Free soil testing and personalised fertiliser recommendations.',
    description:
      'Every farmer gets a Soil Health Card every 2 years showing the status of 12 nutrients in the soil '
      + 'with recommendations on fertiliser type and quantity. Reduces cost by 10–15%, increases yield up to 20%.',
    eligibilityCriteria:
      '• All farmers with agricultural land\n'
      + '• No income or land size restriction\n'
      + '• Both landowner and tenant farmers can apply',
    benefits:
      '• FREE soil testing — 12 parameters\n'
      + '• Personalised fertiliser recommendation\n'
      + '• Reduces fertiliser cost by 10–15%\n'
      + '• Increases crop yield by up to 20%',
    applicationProcess:
      '1. Contact local Agriculture Extension Officer or Krishi Vigyan Kendra\n'
      + '2. Soil sample collected from your field\n'
      + '3. Card issued within 3–4 weeks',
    requiredDocuments: ['Aadhaar Card', 'Land Details (Survey Number)'],
    applicationLink: 'https://soilhealth.dac.gov.in',
    helpline: '1800-180-1551',
    isActive: true,
  },
  {
    id: 'pkvy',
    schemeName: 'PKVY Organic Farming',
    fullTitle: 'Paramparagat Krishi Vikas Yojana (PKVY)',
    ministry: 'Ministry of Agriculture & Farmers Welfare, Government of India',
    category: 'Subsidies',
    state: 'Central',
    deadline: 'Ongoing',
    badge: 'Central',
    tagline: '₹50,000 per acre over 3 years to switch to organic farming.',
    description:
      'PKVY promotes organic farming with ₹50,000/acre over 3 years for clusters of 50 farmers. '
      + 'Helps with certification, organic inputs, and value addition. Organic produce gets premium prices.',
    eligibilityCriteria:
      '• Farmers willing to switch to organic farming\n'
      + '• Must form a cluster of at least 50 farmers (50 acres)\n'
      + '• 3-year commitment required for certification',
    benefits:
      '• ₹50,000 per acre over 3 years\n'
      + '• Free training and capacity building\n'
      + '• Help with organic certification (PGS-India)\n'
      + '• Market linkage support',
    applicationProcess:
      '1. Form a cluster of 50 farmers in your village\n'
      + '2. Contact District Agriculture Officer\n'
      + '3. Register cluster on pgsindia-ncof.gov.in',
    requiredDocuments: ['Aadhaar Card', 'Land Records', 'Farmer Group Registration'],
    applicationLink: 'https://pgsindia-ncof.gov.in',
    helpline: '1800-180-1551',
    isActive: true,
  },
];

// ════════════════════════════════════════════════════════════════
// FETCH SCHEMES with Firestore cache + data.gov.in API
// ════════════════════════════════════════════════════════════════
export const fetchSchemes = async (limit = 20, force = false) => {
  // ── Step 1: Firestore cache (24hr) ─────────────────────────
  if (!force) {
    try {
      const cacheSnap = await getDoc(doc(db, 'meta', 'schemes_cache'));
      if (cacheSnap.exists()) {
        const lastUpdated = cacheSnap.data().lastUpdated?.toDate();
        const age = lastUpdated ? Date.now() - lastUpdated.getTime() : Infinity;
        if (age < CACHE_MS) {
          const snap = await getDocs(collection(db, 'schemes'));
          const cached = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(s => s.schemeName && s.schemeName.length > 5);
          if (cached.length >= MASTER_SCHEMES.length) {
            console.log('[schemeService] Serving from Firestore cache');
            return { data: cached, error: null, source: 'cache' };
          }
        }
      }
    } catch (e) {
      console.warn('[schemeService] Cache check failed:', e.message);
    }
  }

  // ── Always start with MASTER_SCHEMES (guaranteed quality) ──
  let allSchemes = [...MASTER_SCHEMES];

  // ── Step 2: Merge additional schemes from data.gov.in API ─
  try {
    const res = await axios.get(SCHEMES_API_URL, {
      params: { 'api-key': DATA_GOV_KEY, format: 'json', limit },
      timeout: 10000,
    });
    const rawRecords = res.data?.records || [];
    const apiSchemes = rawRecords
      .map((record, i) => autoParseSchemeRecord(record, i))
      .filter(s =>
        s.schemeName &&
        s.schemeName.length > 5 &&
        !MASTER_SCHEMES.some(m =>
          m.schemeName.toLowerCase().includes(s.schemeName.toLowerCase().split(' ')[0])
        )
      );
    if (apiSchemes.length > 0) {
      allSchemes = [...MASTER_SCHEMES, ...apiSchemes];
    }
  } catch (e) {
    console.warn('[schemeService] API augmentation skipped:', e.message);
  }

  // ── Step 3: Save to Firestore ──────────────────────────────
  try {
    await Promise.all(allSchemes.map(s =>
      setDoc(doc(db, 'schemes', s.id.toString()), { ...s, cachedAt: serverTimestamp() }).catch(() => {})
    ));
    await setDoc(doc(db, 'meta', 'schemes_cache'), {
      lastUpdated: serverTimestamp(),
      count: allSchemes.length,
    }).catch(() => {});
  } catch (e) { /* silent */ }

  return { data: allSchemes, error: null, source: 'live' };
};

// ── Auto-parse API record with fuzzy field matching ───────────────
const autoParseSchemeRecord = (record, index) => {
  const flat = flattenObject(record);
  const keys = Object.keys(flat).map(k => k.toLowerCase());
  const vals = Object.values(flat);

  const find = (...patterns) => {
    for (const p of patterns)
      for (let i = 0; i < keys.length; i++)
        if (keys[i].includes(p.toLowerCase()) && vals[i] && String(vals[i]).trim().length > 2)
          return String(vals[i]).trim();
    return null;
  };

  const schemeName = find('scheme_name', 'schemename', 'name', 'title', 'yojana') || 'Government Scheme';
  const description = find('description', 'objective', 'details', 'about') || 'Government welfare support.';
  const state = find('state', 'applicable_state') || 'Central';

  return {
    id: `api_${record.id || index}`,
    schemeName,
    fullTitle: schemeName,
    ministry: find('ministry', 'department', 'nodal') || 'Government of India',
    description,
    eligibilityCriteria: find('eligibility', 'who_can', 'criteria') || 'Contact local agriculture office.',
    benefits: find('benefit', 'assistance', 'amount', 'grant') || 'Refer to official scheme document.',
    applicationLink: find('link', 'url', 'website') || 'https://india.gov.in',
    applicationProcess: 'Visit your nearest Common Service Centre (CSC) or Agriculture Office.',
    requiredDocuments: ['Aadhaar Card', 'Land Records', 'Bank Account'],
    category: detectCategory(JSON.stringify(record).toLowerCase()),
    state,
    deadline: find('last_date', 'deadline', 'validity') || 'Ongoing',
    badge: state === 'Central' ? 'Central' : 'State',
    tagline: description.length > 80 ? description.substring(0, 80) + '...' : description,
    helpline: '1800-180-1551',
    isActive: true,
  };
};

const flattenObject = (obj, prefix = '') => Object.keys(obj).reduce((acc, k) => {
  const key = prefix ? `${prefix}_${k}` : k;
  if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k]))
    Object.assign(acc, flattenObject(obj[k], key));
  else acc[key] = obj[k];
  return acc;
}, {});

const detectCategory = (text) => {
  if (text.includes('insurance') || text.includes('bima')) return 'Insurance';
  if (text.includes('loan') || text.includes('credit') || text.includes('kcc')) return 'Loans';
  if (text.includes('subsid') || text.includes('yojana') || text.includes('solar')) return 'Subsidies';
  if (text.includes('training') || text.includes('skill')) return 'Training';
  return 'General';
};

// ════════════════════════════════════════════════════════════════
// SINGLE SCHEME ELIGIBILITY — Gemini AI → Rule-based fallback
// ════════════════════════════════════════════════════════════════
export const checkSingleSchemeEligibility = async (farmerProfile, scheme) => {
  // ── Try Gemini AI ──────────────────────────────────────────
  if (GEMINI_KEY && GEMINI_KEY !== 'YOUR_GEMINI_KEY_HERE') {
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(buildEligibilityPrompt(farmerProfile, scheme));
      const raw = result.response.text().replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(raw);
      return parsed;
    } catch (e) {
      console.warn('[schemeService] Gemini eligibility failed:', e.message);
    }
  }

  // ── Rule-based fallback ────────────────────────────────────
  return buildFallbackEligibility(farmerProfile, scheme);
};

const buildEligibilityPrompt = (profile, scheme) => `
Respond with ONLY valid raw JSON — no markdown code blocks:
{
  "eligibilityStatus": "Eligible" OR "Partially Eligible" OR "Not Eligible",
  "eligibilityScore": <integer 0-100>,
  "headline": "<one bold line>",
  "reason": "<2-3 sentences explaining why>",
  "estimatedBenefit": "<exact amount, e.g. '₹5,00,000'>",
  "matchedCriteria": ["<criteria met>"],
  "missingRequirements": ["<what is lacking>"],
  "actionRequired": "<specific next step>",
  "timeToApply": "<urgency>",
  "nearestOffice": "<application location>"
}

FARMER PROFILE: ${JSON.stringify(profile)}
SCHEME: ${JSON.stringify({ schemeName: scheme.schemeName, state: scheme.state, eligibilityCriteria: scheme.eligibilityCriteria, benefits: scheme.benefits, deadline: scheme.deadline })}`;

const buildFallbackEligibility = (profile, scheme) => {
  const text = (scheme.eligibilityCriteria + scheme.state).toLowerCase();
  let score = 50;
  const matched = [];
  const missing = [];

  if (scheme.state === 'Central' || scheme.state === profile.state) {
    score += 20; matched.push('Correct state/region');
  } else {
    score -= 20; missing.push(`Must be in ${scheme.state}`);
  }

  if (parseFloat(profile.landHolding) > 0) { score += 15; matched.push('Has agricultural land'); }

  if (text.includes('pattadar') && !profile.hasPattadar) {
    score -= 20; missing.push('Pattadar Passbook required');
  } else if (profile.hasPattadar) {
    score += 10; matched.push('Has Pattadar Passbook');
  }

  const age = parseInt(profile.age) || 35;
  if (age >= 18 && age <= 59) {
    score += 5; matched.push('Age within 18–59 years');
  } else if (age > 59) {
    score -= 30; missing.push('Age must be below 60');
  }

  if (profile.bankAccountLinked) { score += 5; matched.push('Bank account linked to Aadhaar'); }

  const status = score >= 70 ? 'Eligible' : score >= 45 ? 'Partially Eligible' : 'Not Eligible';

  return {
    eligibilityStatus: status,
    eligibilityScore: Math.max(0, Math.min(100, score)),
    headline: status === 'Eligible'
      ? `You qualify for ${scheme.schemeName}!`
      : `You may partially qualify for ${scheme.schemeName}`,
    reason: `Based on your profile, eligibility score is ${Math.max(0, Math.min(100, score))}/100. ${missing.length > 0 ? 'Some requirements are not met.' : 'Key criteria have been satisfied.'}`,
    estimatedBenefit: scheme.benefits.split('\n')[0].replace('•', '').trim(),
    matchedCriteria: matched,
    missingRequirements: missing,
    actionRequired: 'Visit your nearest Agriculture Extension Officer with the required documents.',
    timeToApply: scheme.deadline === 'Ongoing' ? 'Apply anytime' : `Apply before: ${scheme.deadline}`,
    nearestOffice: 'Mandal Agriculture Office or Common Service Centre (CSC)',
  };
};

// ════════════════════════════════════════════════════════════════
// BULK ELIGIBILITY — Our custom Flask endpoint (backward compat)
// ════════════════════════════════════════════════════════════════
export const fetchEligibleSchemes = async (farmerProfile) => {
  try {
    const res = await axios.post(`${BASE_URL}/schemes`, farmerProfile, {
      timeout: 60000,
    });
    if (res.data.success) {
      return { success: true, schemes: res.data.schemes };
    }
    return { success: false, error: res.data.error };
  } catch (e) {
    console.error('[schemeService] Bulk eligibility API failed:', e.message);
    return { success: false, error: 'Could not reach the Schemes AI. Ensure backend is running.' };
  }
};
