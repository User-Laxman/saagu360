import { useRouter } from 'expo-router';
import WeatherScreen from '../../screens/WeatherScreen';

export default function TabWeatherIrrigation() {
  const router = useRouter();
  const navigationShim = {
    navigate: (route: string) => router.push(`/${route.toLowerCase()}` as any),
  };
  return <WeatherScreen navigation={navigationShim as any} />;
}
