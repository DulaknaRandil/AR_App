import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  TextInput,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import { router } from 'expo-router';
import { useAuthStore } from '../src/state/useAuthStore';
import { useCartStore } from '../src/state/useCartStore';
import { supabase } from '../src/api/supabaseClient';
import { placeOrder } from '../src/api/orderService';

interface CartProduct {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    name: string;
    price: number;
    image_url: string;
    stock: number;
  };
}

export default function CheckoutScreen() {
  const session = useAuthStore((s) => s.session);
  const { clearCart } = useCartStore();

  const [cartItems, setCartItems] = useState<CartProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  // Form
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');

  useEffect(() => {
    if (!session) {
      router.replace('/login');
      return;
    }
    loadCart();
    loadProfile();
  }, [session]);

  const loadCart = async () => {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id, product_id, quantity,
          products ( name, price, image_url, stock )
        `)
        .eq('user_id', session?.user.id);

      if (error) throw error;

      setCartItems(
        data?.map((item: any) => ({
          ...item,
          product: item.products,
        })) || []
      );
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('address, phone, city, country, postal_code')
        .eq('id', session?.user.id)
        .single();

      if (data) {
        if (data.address) {
          const parts = [data.address, data.city, data.country, data.postal_code]
            .filter(Boolean);
          setDeliveryAddress(parts.join(', '));
        }
        if (data.phone) setContactNumber(data.phone);
      }
    } catch {}
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const handlePlaceOrder = async () => {
    if (!deliveryAddress.trim()) {
      Alert.alert('Required', 'Please enter a delivery address');
      return;
    }
    if (!contactNumber.trim()) {
      Alert.alert('Required', 'Please enter a contact number');
      return;
    }

    setPlacing(true);
    try {
      await placeOrder({
        delivery_address: deliveryAddress.trim(),
        contact_number: contactNumber.trim(),
        customer_notes: customerNotes.trim() || undefined,
      });

      clearCart();

      Alert.alert(
        'Order Placed Successfully!',
        'Your order has been placed and is awaiting confirmation.',
        [{ text: 'View My Orders', onPress: () => router.replace('/my-orders') }]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (cartItems.length === 0) {
    return (
      <View style={styles.centered}>
        <Text variant="titleLarge">Your cart is empty</Text>
        <Button mode="contained" onPress={() => router.back()} style={{ marginTop: 16 }}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Order Summary */}
        <Text variant="headlineMedium" style={styles.heading}>
          Checkout
        </Text>

        <Card style={styles.card}>
          <Card.Title title="Order Summary" />
          <Card.Content>
            {cartItems.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Image
                  source={{ uri: item.product.image_url || 'https://via.placeholder.com/50' }}
                  style={styles.itemImage}
                />
                <View style={styles.itemInfo}>
                  <Text variant="bodyLarge" numberOfLines={1}>
                    {item.product.name}
                  </Text>
                  <Text variant="bodySmall" style={styles.mutedText}>
                    Qty: {item.quantity} × LKR {item.product.price.toFixed(2)}
                  </Text>
                </View>
                <Text variant="bodyLarge" style={styles.itemTotal}>
                  LKR {(item.product.price * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))}
            <Divider style={{ marginVertical: 12 }} />
            <View style={styles.totalRow}>
              <Text variant="titleMedium">Total</Text>
              <Text variant="titleMedium" style={styles.totalPrice}>
                LKR {subtotal.toFixed(2)}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Delivery Details */}
        <Card style={styles.card}>
          <Card.Title title="Delivery Details" />
          <Card.Content>
            <TextInput
              label="Delivery Address *"
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              placeholder="Street, City, Postal Code"
            />
            <TextInput
              label="Contact Number *"
              value={contactNumber}
              onChangeText={setContactNumber}
              mode="outlined"
              keyboardType="phone-pad"
              style={styles.input}
              placeholder="07X XXX XXXX"
            />
            <TextInput
              label="Notes (Optional)"
              value={customerNotes}
              onChangeText={setCustomerNotes}
              mode="outlined"
              multiline
              numberOfLines={2}
              style={styles.input}
              placeholder="Any special instructions..."
            />
          </Card.Content>
        </Card>

        {/* Place Order Button */}
        <Button
          mode="contained"
          onPress={handlePlaceOrder}
          loading={placing}
          disabled={placing}
          style={styles.placeOrderBtn}
          contentStyle={{ paddingVertical: 8 }}
          labelStyle={{ fontSize: 16 }}
        >
          Place Order
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heading: { padding: 16, fontWeight: 'bold' },
  card: { marginHorizontal: 16, marginBottom: 16, elevation: 2 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  itemImage: { width: 50, height: 50, borderRadius: 8 },
  itemInfo: { flex: 1, marginLeft: 12 },
  mutedText: { color: '#666' },
  itemTotal: { fontWeight: '600', color: '#059669' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalPrice: { fontWeight: 'bold', color: '#059669' },
  input: { marginBottom: 12 },
  placeOrderBtn: {
    marginHorizontal: 16,
    marginTop: 4,
    borderRadius: 8,
  },
});
