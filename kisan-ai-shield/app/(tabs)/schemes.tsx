import { useRouter } from 'expo-router';
import SchemesScreen from '../../screens/SchemesScreen';

export default function TabSchemes() {
  const router = useRouter();
  const navigationShim = {
    navigate: (route: string) => router.push(`/${route.toLowerCase()}` as any),
  };
  return <SchemesScreen navigation={navigationShim as any} />;
}
