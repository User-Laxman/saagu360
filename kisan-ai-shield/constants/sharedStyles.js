/**
 * Shared style objects reused across multiple screens.
 * Exported as plain objects (NOT StyleSheet.create) so they can
 * safely be spread inside each screen's own StyleSheet.create().
 *
 * Usage:
 *   import { shared } from '../constants/sharedStyles';
 *   const styles = StyleSheet.create({ safe: shared.safe, ... });
 *   // or directly in JSX:  style={shared.badge}
 */
import { COLORS, FONTS, RADIUS, SHADOW } from './appTheme';

export const shared = {
  // ── Layout ───────────────────────────────────────────────────────────
  safe: {
    flex: 1,
    backgroundColor: COLORS.green50,
  },
  content: {
    padding: 16,
  },

  // ── Section headings ─────────────────────────────────────────────────
  sectionTitle: {
    fontFamily: FONTS.sansExtra,
    fontSize: 14,
    color: COLORS.gray800,
    marginBottom: 10,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  seeAll: {
    fontFamily: FONTS.sansBold,
    fontSize: 12,
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
    fontFamily: FONTS.sansExtra,
    fontSize: 10,
  },

  // ── Page header text (Disease, Market, Schemes) ───────────────────────
  pageTitle: {
    color: '#fff',
    fontFamily: FONTS.serif,
    fontSize: 24,
    marginBottom: 2,
  },
  pageSub: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: FONTS.sans,
    fontSize: 12,
    marginBottom: 8,
  },
};
