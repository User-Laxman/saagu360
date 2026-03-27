/**
 * Shared style objects reused across multiple screens.
 * Exported as plain objects (NOT StyleSheet.create) so they can
 * safely be spread inside each screen's own StyleSheet.create().
 */
import { COLORS, FONTS, RADIUS, SHADOW, SPACING } from './appTheme';
import { Platform, StatusBar } from 'react-native';

export const shared = {
  // ── Layout ───────────────────────────────────────────────────────────
  safe: {
    flex: 1,
    backgroundColor: COLORS.green50,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  content: {
    padding: SPACING.lg,
  },

  // ── Section headings ─────────────────────────────────────────────────
  sectionTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: COLORS.gray800,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  seeAll: {
    fontFamily: FONTS.bodySemi,
    fontSize: 13,
    color: COLORS.green600,
  },

  // ── Status badges ────────────────────────────────────────────────────
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeGreen: {
    backgroundColor: COLORS.green100,
  },
  badgeRed: {
    backgroundColor: COLORS.redBg,
  },
  badgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
  },

  // ── Page header text (Disease, Market, Schemes) ───────────────────────
  pageTitle: {
    color: '#fff',
    fontFamily: FONTS.headingXl,
    fontSize: 25,
    marginBottom: 2,
  },
  pageSub: {
    color: 'rgba(255,255,255,0.85)',
    fontFamily: FONTS.bodyMed,
    fontSize: 13,
    marginBottom: 8,
  },
};
