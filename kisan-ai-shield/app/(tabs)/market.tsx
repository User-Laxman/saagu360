import { useRouter } from 'expo-router';
import MarketScreen from '../../screens/MarketScreen';

export default function TabMarket() {
  const router = useRouter();
  const navigationShim = {
    navigate: (route: string) => router.push(`/${route.toLowerCase()}` as any),
  };
  return <MarketScreen navigation={navigationShim as any} />;
}
