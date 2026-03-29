import { useRouter } from 'expo-router';
import DiseaseScreen from '../../screens/DiseaseScreen';

export default function TabDiseaseScan() {
  const router = useRouter();
  const navigationShim = {
    navigate: (route: string) => router.push(`/${route.toLowerCase()}` as any),
  };
  return <DiseaseScreen navigation={navigationShim as any} />;
}
