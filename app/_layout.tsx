import 'react-native-url-polyfill/auto';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';

export default function RootLayout() {
  return (
    <PaperProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="product/[id]" options={{ title: 'Product Details' }} />
        <Stack.Screen name="space-analyzer" options={{ title: 'AI Space Analyzer' }} />
      </Stack>
    </PaperProvider>
  );
}
