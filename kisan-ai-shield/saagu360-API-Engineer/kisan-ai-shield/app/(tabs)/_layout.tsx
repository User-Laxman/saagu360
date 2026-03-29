import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SHADOW } from '../../constants/appTheme';

interface TabIconProps {
  emoji: string;
  label: string;
  focused: boolean;
}

function TabIcon({ emoji, label, focused }: TabIconProps) {
  return (
    <View style={styles.tabItem}>
      <Text style={styles.tabEmoji}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
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
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="disease-scan"
        options={{
          title: 'Scan Crop',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔬" label="Scan" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="weather-irrigation"
        options={{
          title: 'Weather',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🌦" label="Weather" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="market-prices"
        options={{
          title: 'Mandi',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" label="Market" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="schemes"
        options={{
          title: 'Schemes',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏛" label="Schemes" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{ href: null }}
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
    ...SHADOW.heavy,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabEmoji: { fontSize: 22 },
  tabLabel: {
    fontSize: 9.5,
    fontFamily: FONTS.sansExtra,
    color: COLORS.gray600,
  },
  tabLabelActive: { color: COLORS.green800 },
});
