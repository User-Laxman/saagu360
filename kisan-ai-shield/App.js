import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import HomeScreen    from './screens/HomeScreen';
import DiseaseScreen from './screens/DiseaseScreen';
import WeatherScreen from './screens/WeatherScreen';
import MarketScreen  from './screens/MarketScreen';
import SchemesScreen from './screens/SchemesScreen';
import { COLORS }   from './constants/theme';

const Tab = createBottomTabNavigator();

function TabIcon({ emoji, label, focused }) {
  return (
    <View style={styles.tabItem}>
      <Text style={styles.tabEmoji}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        {label}
      </Text>
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarShowLabel: false,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Home" focused={focused} /> }}
        />
        <Tab.Screen
          name="Disease"
          component={DiseaseScreen}
          options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🔬" label="Scan" focused={focused} /> }}
        />
        <Tab.Screen
          name="Weather"
          component={WeatherScreen}
          options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🌦" label="Weather" focused={focused} /> }}
        />
        <Tab.Screen
          name="Market"
          component={MarketScreen}
          options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📊" label="Market" focused={focused} /> }}
        />
        <Tab.Screen
          name="Schemes"
          component={SchemesScreen}
          options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏛" label="Schemes" focused={focused} /> }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#E8F5E9',
    borderTopWidth: 1.5,
    height: 68,
    paddingBottom: 8,
    paddingTop: 6,
    elevation: 16,
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabEmoji:  { fontSize: 20 },
  tabLabel:  { fontSize: 9.5, fontWeight: '600', color: '#546E7A' },
  tabLabelActive: { color: '#2E7D32' },
});
