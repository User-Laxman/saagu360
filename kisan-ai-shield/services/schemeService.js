// services/schemeService.js
// COMPLETE REWRITE — Master Schemes + Robust AI Parsing

import axios from 'axios';
import Constants from 'expo-constants';
import { db } from '../firebase/config';
import {
  collection, doc, getDocs, setDoc,
  getDoc, serverTimestamp
} from 'firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = '579b464db66ec23bdd00000143047e5301a841ff4d7fe09facee214a';
const SCHEMES_API_URL = 'https://api.data.gov.in/resource/47a0970a-9fef-427d-8cdd-767085fda87b';
const GEMINI_KEY = Constants.expoConfig?.extra?.geminiApiKey || '';
const CACHE_MS = 24 * 60 * 60 * 1000;

// ════════════════════════════════════════════════
// MASTER SCHEME DATABASE — Real Indian Schemes
// These ALWAYS load. API data merges on top.
// ════════════════════════════════════════════════
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
      'Rythu Bima is a life insurance scheme launched by the Government of Telangana on 14th August 2018. ' +
      'It provides ₹5,00,000 financial relief to the family/nominee of a farmer in case of death due to any reason — natural or accidental. ' +
      'The Government pays the full premium through LIC of India. No farmer pays any premium. ' +
      'More than 50 lakh farmers of Telangana are enrolled under this scheme.',
    eligibilityCriteria:
      '• Must be a permanent resident of Telangana\n' +
      '• Age between 18 to 59 years\n' +
      '• Must be a Pattadar Passbook holder OR have RoFR (Recognition of Forest Rights) Patta\n' +
      '• Land details must be in the Dharani land records database\n' +
      '• Tenant/rental farmers are NOT eligible\n' +
      '• Can enrol in single policy only\n' +
      '• Farmer must be aged below 60 to enrol',
    benefits:
      '• ₹5,00,000 paid to nominee on farmer\'s death (any cause)\n' +
      '• Government pays 100% premium — farmer pays nothing\n' +
      '• Claim settled within 10 days\n' +
      '• Money transferred directly to nominee\'s bank account\n' +
      '• Covers both natural and accidental death',
    applicationProcess:
      '1. Contact your local Agriculture Extension Officer (AEO)\n' +
      '2. AEO visits your home and fills Enrolment Form (Annexure I)\n' +
      '3. Provide nominee details, Aadhaar card, Pattadar Passbook\n' +
      '4. AEO uploads details to Rythu Bima portal\n' +
      '5. Mandal Agriculture Officer verifies\n' +
      '6. LIC generates unique Insurance ID — SMS sent to your mobile',
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
    tagline: '₹5,000 per acre per season direct support for all Telangana farmers.',
    description:
      'Rythu Bandhu is Telangana\'s flagship farm investment support scheme. ' +
      'The government directly transfers ₹5,000 per acre per crop season (Kharif and Rabi) ' +
      'to all pattadar farmers before the season starts. This ensures farmers can buy seeds, ' +
      'fertilisers, and pesticides without taking loans. ₹10,000 per acre per year total.',
    eligibilityCriteria:
      '• Must be a landholding farmer in Telangana\n' +
      '• Must hold a valid Pattadar Passbook\n' +
      '• Land must be registered in Dharani portal\n' +
      '• Both Kharif and Rabi seasons covered\n' +
      '• Tenant farmers are NOT eligible (only pattadars)',
    benefits:
      '• ₹5,000 per acre per season (Kharif + Rabi)\n' +
      '• ₹10,000 per acre per year total\n' +
      '• Directly credited to bank account before season\n' +
      '• No application needed — automatic based on land records',
    applicationProcess:
      '1. No separate application needed\n' +
      '2. Automatically credited based on Dharani land records\n' +
      '3. Ensure bank account is linked to Aadhaar\n' +
      '4. Check status at rythubandhu.telangana.gov.in',
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
      'PM-KISAN provides income support of ₹6,000 per year to all landholding farmer families in India. ' +
      'The amount is paid in 3 equal installments of ₹2,000 every 4 months directly to the farmer\'s bank account. ' +
      'Over 11 crore farmers across India are enrolled. The scheme started from December 2018.',
    eligibilityCriteria:
      '• All landholding farmer families with cultivable agricultural land\n' +
      '• Both husband and wife can benefit if land is in both names\n' +
      '• Small and marginal farmers with up to 2 hectares (5 acres) get priority\n' +
      '• EXCLUDED: Institutional land holders, current/former government employees, ' +
        'income tax payers, lawyers, doctors, engineers earning above ₹10,000/month',
    benefits:
      '• ₹6,000 per year in 3 installments of ₹2,000 each\n' +
      '• Directly to Aadhaar-linked bank account\n' +
      '• No intermediaries — DBT (Direct Benefit Transfer)',
    applicationProcess:
      '1. Visit pmkisan.gov.in or nearest CSC (Common Service Centre)\n' +
      '2. Submit: Aadhaar, bank account, land ownership documents\n' +
      '3. Self-register at pmkisan.gov.in → Farmer Corner → New Farmer Registration\n' +
      '4. Or apply through local Patwari/Lekhpal',
    requiredDocuments: ['Aadhaar Card', 'Land Ownership Documents', 'Bank Passbook', 'Mobile Number'],
    applicationLink: 'https://pmkisan.gov.in',
    helpline: '155261 / 011-24300606',
    isActive: true,
  },
  {
    id: 'pmfby',
    schemeName: 'Pradhan Mantri Fasal Bima Yojana',
    fullTitle: 'Pradhan Mantri Fasal Bima Yojana (PMFBY) — Crop Insurance',
    ministry: 'Ministry of Agriculture & Farmers Welfare, Government of India',
    category: 'Insurance',
    state: 'Central',
    deadline: 'Season-based (Kharif: July, Rabi: December)',
    badge: 'Central',
    tagline: 'Crop insurance — pay just 2% premium, get full loss coverage.',
    description:
      'PMFBY is India\'s largest crop insurance scheme. Farmers pay only 2% of the sum insured for Kharif ' +
      'crops, 1.5% for Rabi crops, and 5% for commercial/horticultural crops. ' +
      'The remaining premium is shared equally between Central and State governments. ' +
      'It covers yield losses due to drought, flood, pest, disease, hailstorm, and more.',
    eligibilityCriteria:
      '• All farmers growing notified crops in notified areas\n' +
      '• Mandatory for farmers with KCC (Kisan Credit Card) crop loans\n' +
      '• Voluntary for non-loanee farmers\n' +
      '• Both sharecroppers and tenant farmers are eligible\n' +
      '• Must enrol before cut-off date of each season',
    benefits:
      '• Full crop loss compensation based on area yield\n' +
      '• Kharif premium: only 2% of sum insured\n' +
      '• Rabi premium: only 1.5% of sum insured\n' +
      '• Post-harvest losses also covered (up to 14 days)\n' +
      '• Prevented sowing/planting losses covered\n' +
      '• Localised calamities (hailstorm, landslide) covered',
    applicationProcess:
      '1. Visit nearest bank, CSC, or insurance company office\n' +
      '2. Or apply online at pmfby.gov.in\n' +
      '3. Submit: Aadhaar, bank account, land/sowing certificate, crop details\n' +
      '4. Enrol before deadline (Kharif: last date of July, Rabi: December)',
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
      'The Kisan Credit Card (KCC) provides farmers with flexible and timely credit for agricultural needs. ' +
      'Farmers get a revolving credit limit (like a credit card) to buy seeds, fertilisers, pesticides, ' +
      'and meet other crop production needs. Interest subvention reduces effective interest to just 4% p.a.',
    eligibilityCriteria:
      '• All farmers — individual/joint borrowers who own or lease agricultural land\n' +
      '• Tenant farmers, oral lessees, and share croppers also eligible\n' +
      '• Self Help Groups (SHGs) and Joint Liability Groups (JLGs) are eligible\n' +
      '• Fishermen and animal husbandry farmers also covered\n' +
      '• No upper land limit',
    benefits:
      '• Credit up to ₹3 lakh at 7% p.a. (effectively 4% with 3% govt subvention)\n' +
      '• Flexible repayment aligned with harvest season\n' +
      '• No collateral up to ₹1.6 lakh\n' +
      '• Personal accident insurance of ₹50,000 included\n' +
      '• Can also be used for allied activities (poultry, fishery)',
    applicationProcess:
      '1. Visit nearest bank (SBI, Bank of Baroda, NABARD branches, RRBs)\n' +
      '2. Fill KCC application form\n' +
      '3. Submit land documents, Aadhaar, passport photo\n' +
      '4. Bank verifies and issues KCC within 2 weeks\n' +
      '5. Or apply via pmkisan.gov.in → Farmer Corner → KCC Form',
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
      'PM KUSUM provides 60% central + state subsidy on solar irrigation pumps. ' +
      'Farmers pay only 10% of cost; 30% can be bank loan. ' +
      'Component A: 10,000 MW decentralised solar plants on barren land. ' +
      'Component B: 20 lakh standalone solar pumps to replace diesel pumps. ' +
      'Component C: Solarisation of 15 lakh grid-connected pumps.',
    eligibilityCriteria:
      '• Any farmer with agricultural land\n' +
      '• Priority to water-stressed/dark zone districts\n' +
      '• Must not have existing solar pump under this scheme\n' +
      '• Land must be suitable for solar panel installation',
    benefits:
      '• 30% Central Government subsidy\n' +
      '• 30% State Government subsidy (Telangana adds more)\n' +
      '• Farmer pays only 10% of cost\n' +
      '• 30% bank loan available at subsidised rates\n' +
      '• Saves ₹40,000–₹60,000/year in diesel costs\n' +
      '• Excess electricity can be sold to DISCOM',
    applicationProcess:
      '1. Apply through state DISCOM or State Renewable Energy Agency\n' +
      '2. In Telangana: Apply through TSREDCO (Telangana State Renewable Energy Development Corporation)\n' +
      '3. Submit land documents, Aadhaar, electricity bill\n' +
      '4. DISCOM verifies feasibility\n' +
      '5. Pump installed by empanelled vendor',
    requiredDocuments: ['Aadhaar Card', 'Land Records', 'Bank Account', 'Electricity Bill'],
    applicationLink: 'https://pmkusum.mnre.gov.in',
    helpline: '1800-180-3333',
    isActive: true,
  },
  {
    id: 'soil_health_card',
    schemeName: 'Soil Health Card Scheme',
    fullTitle: 'Soil Health Card Scheme — Know Your Soil, Grow Better Crops',
    ministry: 'Ministry of Agriculture & Farmers Welfare, Government of India',
    category: 'General',
    state: 'Central',
    deadline: 'Ongoing',
    badge: 'Central',
    tagline: 'Free soil testing and personalised fertiliser recommendations for every farmer.',
    description:
      'The Soil Health Card scheme provides every farmer with a Soil Health Card every 2 years. ' +
      'The card shows the status of 12 nutrients in the soil and gives recommendations on ' +
      'what fertilisers to use and in what quantity. This reduces fertiliser waste and increases crop yield.',
    eligibilityCriteria:
      '• All farmers with agricultural land\n' +
      '• No income or land size restriction\n' +
      '• Both landowner and tenant farmers can apply\n' +
      '• Card is issued every 2 years per farm plot',
    benefits:
      '• FREE soil testing — 12 parameters tested\n' +
      '• Personalised fertiliser recommendation\n' +
      '• Reduces fertiliser cost by 10–15%\n' +
      '• Increases crop yield by up to 20%\n' +
      '• Reduces soil degradation',
    applicationProcess:
      '1. Contact your local Agriculture Extension Officer or Krishi Vigyan Kendra (KVK)\n' +
      '2. Soil sample collected from your field\n' +
      '3. Tested at government soil lab\n' +
      '4. Card issued within 3–4 weeks\n' +
      '5. Check online at soilhealth.dac.gov.in using mobile number',
    requiredDocuments: ['Aadhaar Card', 'Land Details (Survey Number)'],
    applicationLink: 'https://soilhealth.dac.gov.in',
    helpline: '1800-180-1551',
    isActive: true,
  },
  {
    id: 'pkvy',
    schemeName: 'PKVY — Organic Farming',
    fullTitle: 'Paramparagat Krishi Vikas Yojana (PKVY) — Organic Farming Scheme',
    ministry: 'Ministry of Agriculture & Farmers Welfare, Government of India',
    category: 'Subsidies',
    state: 'Central',
    deadline: 'Ongoing',
    badge: 'Central',
    tagline: '₹50,000 per acre over 3 years to switch to organic farming.',
    description:
      'PKVY promotes organic farming by providing financial assistance and training to farmer clusters. ' +
      'Groups of 50 farmers form a cluster covering 50 acres. The scheme provides ₹50,000 per acre ' +
      'over 3 years for certification, input production, and value addition. Organic produce gets ' +
      'premium market prices.',
    eligibilityCriteria:
      '• Farmers willing to switch to or continue organic farming\n' +
      '• Must form a cluster of at least 50 farmers (50 acres)\n' +
      '• 3-year commitment required for certification\n' +
      '• Applicable in notified areas/districts',
    benefits:
      '• ₹50,000 per acre over 3 years (₹31,000 for organic inputs, ₹8,800 for certification, rest for value addition)\n' +
      '• Free training and capacity building\n' +
      '• Help with organic certification (PGS-India)\n' +
      '• Market linkage support for organic produce',
    applicationProcess:
      '1. Form a cluster of 50 farmers in your village\n' +
      '2. Contact District Agriculture Officer\n' +
      '3. Register cluster on pgsindia-ncof.gov.in\n' +
      '4. Attend 3-day training programme\n' +
      '5. Begin organic transition with support',
    requiredDocuments: ['Aadhaar Card', 'Land Records', 'Farmer Group Registration'],
    applicationLink: 'https://pgsindia-ncof.gov.in',
    helpline: '1800-180-1551',
    isActive: true,
  },
];

// ════════════════════════════════════════════════
// MAIN FETCH — Always returns MASTER_SCHEMES +
//              any extra schemes from API
// ════════════════════════════════════════════════
export const fetchSchemes = async (limit = 20, force = false) => {
  try {
    // Check Firestore cache first (unless forced)
    if (!force) {
      const cacheRef = doc(db, 'meta', 'schemes_cache');
      const cacheSnap = await getDoc(cacheRef);

      if (cacheSnap.exists()) {
        const lastUpdated = cacheSnap.data().lastUpdated?.toDate();
        const age = lastUpdated ? Date.now() - lastUpdated.getTime() : Infinity;
        if (age < CACHE_MS) {
          const snap = await getDocs(collection(db, 'schemes'));
          
          // Strict Filter: Never serve 'Unknown Scheme' from cache
          const cached = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(s => 
              s.schemeName && 
              s.schemeName !== 'Unknown Scheme' && 
              s.schemeName.length > 5 &&
              !s.schemeName.toLowerCase().includes('unknown')
            );

          if (cached.length >= MASTER_SCHEMES.length) {
            console.log("Serving schemes from cache (title-verified)");
            return { data: cached, error: null, source: 'cache' };
          }
        }
      }
    }

    // Always start with master schemes (guaranteed to have titles)
    let allSchemes = [...MASTER_SCHEMES];

    // Try to fetch additional schemes from API
    try {
      console.log(`Fetching live schemes from data.gov.in (Force: ${force})...`);
      const response = await axios.get(SCHEMES_API_URL, {
        params: { 'api-key': API_KEY, format: 'json', limit },
        timeout: 10000,
      });

      const rootTitle = response.data?.title || 'Government Scheme';
      const rawRecords = response.data?.records || [];

      // Extract a cleaner name from the global title (e.g. "PM KISAN")
      const defaultTitle = rootTitle.split('under')[1]?.trim().split(' ')[0] || 
                          rootTitle.split('of')[1]?.trim().split(' ')[0] || 
                          'PM-KISAN';

      // Auto-detect and parse API records
      const apiSchemes = rawRecords
        .map((record, i) => autoParseSchemeRecord(record, i, defaultTitle))
        .filter(s =>
          s.schemeName &&
          s.schemeName !== 'Unknown Scheme' &&
          s.schemeName.length > 5 &&
          !s.schemeName.toLowerCase().includes('unknown') &&
          // Don't duplicate master schemes
          !MASTER_SCHEMES.some(m =>
            m.schemeName.toLowerCase().includes(s.schemeName.toLowerCase().split(' ')[0])
          )
        );

      if (apiSchemes.length > 0) {
        allSchemes = [...MASTER_SCHEMES, ...apiSchemes];
      }

    } catch (apiError) {
      console.warn('[schemeService] API call failed, using master schemes:', apiError.message);
    }

    // Save to Firestore (only sanitized results)
    await Promise.all(allSchemes.map(scheme =>
      setDoc(doc(db, 'schemes', scheme.id.toString()), {
        ...scheme,
        cachedAt: serverTimestamp(),
      }).catch(() => {})
    ));

    await setDoc(doc(db, 'meta', 'schemes_cache'), {
      lastUpdated: serverTimestamp(),
      count: allSchemes.length,
    }).catch(() => {});

    return { data: allSchemes, error: null, source: 'live' };

  } catch (error) {
    console.error('[schemeService] Critical error:', error);
    return { data: MASTER_SCHEMES, error: error.message, source: 'master' };
  }
};

// ════════════════════════════════════════════════
// AUTO-PARSE — Tries every possible API field name
// ════════════════════════════════════════════════
const autoParseSchemeRecord = (record, index, defaultTitle) => {
  // Flatten nested objects for easier searching
  const flat = flattenObject(record);
  const keys = Object.keys(flat).map(k => k.toLowerCase());
  const vals = Object.values(flat);

  // Helper: find value by trying multiple key patterns
  const find = (...patterns) => {
    for (const pattern of patterns) {
      for (let i = 0; i < keys.length; i++) {
        if (keys[i].includes(pattern.toLowerCase())) {
          const val = vals[i];
          if (val && String(val).trim().length > 2) return String(val).trim();
        }
      }
    }
    return null;
  };

  const schemeName = find(
    'scheme_name', 'schemename', 'scheme name', 'name', 'title',
    'scheme', 'yojana', 'program', 'programme'
  ) || defaultTitle; // Use the root title from API

  const ministry = find(
    'ministry', 'department', 'dept', 'nodal', 'implementing'
  ) || 'Government of India';

  // Extract a richer description from the record context
  const description = find(
    'description', 'objective', 'details', 'about', 'overview',
    'purpose', 'summary', 'info', 'district', 'state'
  ) || `Government welfare support record for ${defaultTitle}.`;

  const eligibility = find(
    'eligibility', 'who_can', 'beneficiar', 'criteria', 'eligible',
    'target', 'applicable'
  ) || 'Contact local agriculture office for eligibility.';

  const benefits = find(
    'benefit', 'assistance', 'incentive', 'amount', 'grant',
    'support', 'financial'
  ) || 'Refer to official scheme document.';

  const state = find('state', 'applicable_state', 'coverage') || 'Central';

  const fullText = JSON.stringify(record).toLowerCase();
  const category = detectCategory(fullText);

  return {
    id: `api_${record.id || record._id || index}`,
    schemeName: schemeName,
    fullTitle: schemeName,
    ministry,
    description,
    eligibilityCriteria: eligibility,
    benefits,
    applicationLink: find('link', 'url', 'website') || 'https://india.gov.in',
    category,
    state,
    deadline: find('last_date', 'deadline', 'end_date', 'validity') || 'Ongoing',
    badge: state === 'Central' ? 'Central' : 'State',
    tagline: description.length > 80 ? description.substring(0, 80) + '...' : description,
    requiredDocuments: ['Aadhaar Card', 'Land Records', 'Bank Account'],
    applicationProcess: 'Visit your nearest Common Service Centre (CSC) or Agriculture Office.',
    helpline: '1800-180-1551',
    isActive: true,
  };
};

// Flatten nested objects
const flattenObject = (obj, prefix = '') => {
  return Object.keys(obj).reduce((acc, k) => {
    const key = prefix ? `${prefix}_${k}` : k;
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      Object.assign(acc, flattenObject(obj[k], key));
    } else {
      acc[key] = obj[k];
    }
    return acc;
  }, {});
};

const detectCategory = (text) => {
  if (text.includes('insurance') || text.includes('bima') || text.includes('coverage')) return 'Insurance';
  if (text.includes('loan') || text.includes('credit') || text.includes('kcc')) return 'Loans';
  if (text.includes('subsid') || text.includes('yojana') || text.includes('support') ||
      text.includes('bandhu') || text.includes('samman') || text.includes('solar')) return 'Subsidies';
  if (text.includes('training') || text.includes('skill')) return 'Training';
  return 'General';
};

// ════════════════════════════════════════════════
// SINGLE SCHEME ELIGIBILITY — Gemini AI / NVIDIA AI
// ════════════════════════════════════════════════
export const checkSingleSchemeEligibility = async (farmerProfile, scheme) => {
  const nvidiaKey = Constants.expoConfig?.extra?.nvidiaApiKey || '';
  
  // Use NVIDIA Llama if available, else fallback to Gemini, else rule-based
  if (nvidiaKey) {
    try {
      console.log("[Eligibility] Using NVIDIA Llama AI...");
      const response = await axios.post(
        'https://integrate.api.nvidia.com/v1/chat/completions',
        {
          model: "meta/llama-3.1-70b-instruct",
          messages: [
            {
              role: "user",
              content: buildPrompt(farmerProfile, scheme)
            }
          ],
          temperature: 0.2,
          max_tokens: 1024,
          response_format: { type: "json_object" }
        },
        {
          headers: {
            'Authorization': `Bearer ${nvidiaKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = response.data.choices[0].message.content;
      return JSON.parse(result);
    } catch (err) {
      console.error('[Eligibility] NVIDIA AI error:', err.response?.data || err.message);
      // Fallback below
    }
  }

  if (GEMINI_KEY) {
    try {
      console.log("[Eligibility] Using Gemini AI...");
      const genAI = new GoogleGenerativeAI(GEMINI_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const result = await model.generateContent(buildPrompt(farmerProfile, scheme));
      const raw = result.response.text().replace(/```json|```/g, '').trim();
      return JSON.parse(raw);
    } catch (err) {
      console.error('[Eligibility] Gemini error:', err.message);
    }
  }

  return buildFallbackEligibility(farmerProfile, scheme);
};

const buildPrompt = (farmerProfile, scheme) => `
Respond with ONLY valid raw JSON — no markdown:
{
  "eligibilityStatus": "Eligible" OR "Partially Eligible" OR "Not Eligible",
  "eligibilityScore": <integer 0-100>,
  "headline": "<one bold line — e.g. 'You qualify for Rythu Bima!'>",
  "reason": "<2-3 sentences explaining why>",
  "estimatedBenefit": "<exact amount, e.g. '₹5,00,000'>",
  "matchedCriteria": ["<criteria meets>"],
  "missingRequirements": ["<what lacked>"],
  "actionRequired": "<specific next step>",
  "timeToApply": "<urgency>",
  "nearestOffice": "<application location>"
}

FARMER: ${JSON.stringify(farmerProfile)}
SCHEME: ${JSON.stringify(scheme)}`;

// Rule-based fallback when AI fails
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

  if (profile.landHolding > 0) { score += 15; matched.push('Has agricultural land'); }

  if (text.includes('pattadar') && !profile.hasPattadar) {
    score -= 20; missing.push('Pattadar Passbook required');
  } else if (profile.hasPattadar) {
    score += 10; matched.push('Has Pattadar Passbook');
  }

  if (profile.age >= 18 && profile.age <= 59) {
    score += 5; matched.push('Age is within 18–59 years');
  } else if (profile.age > 59) {
    score -= 30; missing.push('Age must be below 60 years');
  }

  const status = score >= 70 ? 'Eligible' : score >= 45 ? 'Partially Eligible' : 'Not Eligible';

  return {
    eligibilityStatus: status,
    eligibilityScore: Math.max(0, Math.min(100, score)),
    headline: status === 'Eligible'
      ? `You qualify for ${scheme.schemeName}!`
      : status === 'Partially Eligible'
      ? `You may qualify for ${scheme.schemeName} — check requirements`
      : `You may not qualify for ${scheme.schemeName} currently`,
    reason: `Based on your profile, you scored ${score}/100. ${missing.length > 0 ? 'Requirements missing.' : 'Criteria met.'}`,
    estimatedBenefit: scheme.benefits.split('\n')[0],
    matchedCriteria: matched,
    missingRequirements: missing,
    actionRequired: `Visit your nearest Agriculture Extension Officer with documents.`,
    timeToApply: scheme.deadline === 'Ongoing' ? 'Apply anytime' : `Apply before: ${scheme.deadline}`,
    nearestOffice: 'Mandal Agriculture Office',
  };
};
