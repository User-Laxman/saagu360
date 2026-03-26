import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { fetchWeatherData } from '../../services/weatherService';
import { fetchMarketPrices } from '../../services/marketService';

export default function DashboardScreen() {
  const [weatherData, setWeatherData] = useState<any>(null);
  const [marketData, setMarketData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        let cityToFetch = 'Hyderabad'; // Default if GPS is denied
        let fetchLat = null;
        let fetchLon = null;

        // Request Farmer's explicit GPS permission
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          try {
            // Use getLastKnownPositionAsync because Android Emulators often hang forever
            // trying to get a fresh satellite lock indoors.
            let location = await Location.getLastKnownPositionAsync({});

            // If the phone has no memory of a prior location, force a low-accuracy fetch
            if (!location) {
               location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Lowest });
            }

            if (location) {
              fetchLat = location.coords.latitude;
              fetchLon = location.coords.longitude;

              let geocodeCode = await Location.reverseGeocodeAsync({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude
            });

            if (geocodeCode.length > 0) {
               // Use city, or subregion fallback if city doesn't exist
               cityToFetch = geocodeCode[0].city || geocodeCode[0].subregion || 'Hyderabad';
               console.log("📍 Successfully unlocked Location:", cityToFetch);
            }
            } // Close if(location)
          } catch (err) {
            console.log("GPS Location Error:", err);
          }
        }

        const weather = await fetchWeatherData(fetchLat, fetchLon, cityToFetch);
        const market = await fetchMarketPrices();
        setWeatherData(weather);
        setMarketData(market);
      } catch (error) {
        console.error("Dashboard Load Error:", error);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Syncing Farm Data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Welcome back, Kisan!</Text>
      <Text style={styles.subtitle}>Your Daily Farm Shield Dashboard</Text>

      {/* Weather Card */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>🌦️ Live Weather & Irrigation</Text>
        <Text style={styles.text}>📍 Farm Location: {weatherData?.city}</Text>
        <Text style={styles.text}>Condition: {weatherData?.description} ({weatherData?.temp}°C)</Text>
        <Text style={[styles.text, {fontWeight: 'bold', color: weatherData?.rain > 50 ? '#D32F2F' : '#1976D2'}]}>
          Rain Probability: {weatherData?.rain}%
          {weatherData?.rain > 50 ? ' (Do NOT Irrigate Today)' : ' (Safe to Irrigate)'}
        </Text>
      </View>

      {/* Market Card */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>📈 Mandi Highlights ({marketData?.market})</Text>
        {marketData?.crops.slice(0, 3).map((crop: any, index: number) => (
          <View key={index} style={styles.row}>
            <Text style={styles.text}>{crop.name}: ₹{crop.currentPrice}</Text>
            <Text style={{color: crop.trend === 'up' ? 'green' : 'red'}}>
              {crop.trend === 'up' ? '▲' : '▼'} {Math.abs(crop.changePercent)}%
            </Text>
          </View>
        ))}
        <Text style={styles.muted}>Source: {marketData?.source}</Text>
      </View>

      {/* Placeholder for Member B */}
      <View style={[styles.card, {backgroundColor: '#E8F5E9'}]}>
        <Text style={styles.cardHeader}>📷 Quick Disease Scan</Text>
        <Text style={styles.muted}>Waiting for AI Integration...</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5FCFF',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2E7D32',
  },
  text: {
    fontSize: 16,
    marginBottom: 4,
    color: '#444',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  muted: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#2E7D32',
  }
});
