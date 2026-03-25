import { Tabs } from 'expo-router';
import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2e7d32', // Unified Team Lead Green
        headerShown: true,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ask AI',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons size={28} name="robot" color={color} />,
        }}
      />
      <Tabs.Screen
        name="disease-scan"
        options={{
          title: 'Scan Crop',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons size={28} name="leaf" color={color} />,
        }}
      />
      <Tabs.Screen
        name="weather-irrigation"
        options={{
          title: 'Weather',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons size={28} name="weather-cloudy" color={color} />,
        }}
      />
      <Tabs.Screen
        name="market-prices"
        options={{
          title: 'Mandi',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons size={28} name="storefront" color={color} />,
        }}
      />
      <Tabs.Screen
        name="schemes"
        options={{
          title: 'Schemes',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons size={28} name="file-document-outline" color={color} />,
        }}
      />
    </Tabs>
  );
}
