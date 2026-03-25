import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '../../components/haptic-tab';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="disease-scan"
        options={{
          title: 'Scan Crop',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="camera.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="weather-irrigation"
        options={{
          title: 'Weather',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="cloud.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="market-prices"
        options={{
          title: 'Mandi',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="cart.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="schemes"
        options={{
          title: 'Schemes',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="doc.text.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
