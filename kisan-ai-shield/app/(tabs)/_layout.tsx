import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#2E7D32', // Green for agriculture
        tabBarInactiveTintColor: '#888',
        tabBarStyle: Platform.select({
          ios: { paddingBottom: 20, paddingTop: 10, height: 70 },
          android: { paddingBottom: 10, paddingTop: 10, height: 65 },
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="home" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="disease-scan"
        options={{
          title: 'Scan Crop',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="leaf" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="weather-irrigation"
        options={{
          title: 'Weather',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="weather-partly-cloudy" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="market-prices"
        options={{
          title: 'Mandi',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="currency-inr" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="schemes"
        options={{
          title: 'Schemes',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="bank" size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}
