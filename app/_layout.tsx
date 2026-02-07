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
        <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
        <Stack.Screen name="my-orders" options={{ title: 'My Orders' }} />
        <Stack.Screen name="order-detail" options={{ title: 'Order Details' }} />
        <Stack.Screen name="admin-orders" options={{ title: 'Manage Orders' }} />
        <Stack.Screen name="admin-order-detail" options={{ title: 'Order Details' }} />
      </Stack>
    </PaperProvider>
  );
}
