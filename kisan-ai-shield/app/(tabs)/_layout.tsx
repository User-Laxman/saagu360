import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useContext } from 'react';
import { COLORS, FONTS, SHADOW } from '../../constants/appTheme';
import { LanguageContext } from '../../context/LanguageContext';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      <Text style={styles.tabEmoji}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const { t } = useContext(LanguageContext);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('home'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label={t('home')} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="ask-ai"
        options={{
          title: t('askAI'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="🤖" label={t('askAI')} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="disease-scan"
        options={{
          title: t('scan'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔬" label={t('scan')} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="weather-irrigation"
        options={{
          title: t('weather'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="🌦" label={t('weather')} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="market-prices"
        options={{
          title: t('market'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" label={t('market')} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="schemes"
        options={{
          title: t('schemes'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏛" label={t('schemes')} focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopColor: 'transparent',
    borderTopWidth: 0,
    height: 70,
    paddingBottom: 10,
    paddingTop: 8,
    ...SHADOW.card,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    width: 58,
  },
  tabEmoji: { fontSize: 22 },
  tabLabel: {
    fontSize: 9,
    fontFamily: FONTS.bodyMed,
    color: COLORS.gray600,
    textAlign: 'center',
  },
  tabLabelActive: { color: COLORS.green800, fontFamily: FONTS.bodyBold },
});
