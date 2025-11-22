import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Alert, Image } from 'react-native';
import { Text, Button, Card, IconButton, ActivityIndicator } from 'react-native-paper';
import { useCartStore } from '../../src/state/useCartStore';
import { supabase } from '../../src/api/supabaseClient';
import { useAuthStore } from '../../src/state/useAuthStore';
import { router } from 'expo-router';

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

export default function CartScreen() {
  const [cartProducts, setCartProducts] = useState<CartProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const session = useAuthStore((state) => state.session);
  const { items, clearCart } = useCartStore();

  useEffect(() => {
    if (!session) {
      router.replace('/login');
      return;
    }
    fetchCartItems();
  }, [session, items]);

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          product_id,
          quantity,
          products (
            name,
            price,
            image_url,
            stock
          )
        `)
        .eq('user_id', session?.user.id);

      if (error) throw error;
      
      setCartProducts(data?.map((item: any) => ({
        ...item,
        product: item.products as any
      })) || []);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (id: string, product_id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', id);
        
      if (error) throw error;
      await fetchCartItems();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleRemoveItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      await fetchCartItems();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const calculateTotal = () => {
    return cartProducts.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  const handleCheckout = async () => {
    if (cartProducts.length === 0) {
      Alert.alert('Cart Empty', 'Add items to cart before checkout');
      return;
    }

    try {
      const total = calculateTotal();
      
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: session?.user.id,
          total_amount: total,
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartProducts.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.product.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart
      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', session?.user.id);

      clearCart();
      
      Alert.alert('Success', 'Order placed successfully!', [
        { text: 'OK', onPress: () => router.push('/(tabs)') }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const renderCartItem = ({ item }: { item: CartProduct }) => (
    <Card style={styles.cartItem}>
      <View style={styles.itemContent}>
        <Image 
          source={{ uri: item.product.image_url || 'https://via.placeholder.com/80' }} 
          style={styles.productImage}
        />
        <View style={styles.itemDetails}>
          <Text variant="titleMedium">{item.product.name}</Text>
          <Text variant="bodyLarge" style={styles.price}>LKR {item.product.price}</Text>
          <View style={styles.quantityControls}>
            <IconButton
              icon="minus"
              size={20}
              onPress={() => handleUpdateQuantity(item.id, item.product_id, item.quantity - 1)}
            />
            <Text variant="bodyLarge">{item.quantity}</Text>
            <IconButton
              icon="plus"
              size={20}
              onPress={() => handleUpdateQuantity(item.id, item.product_id, item.quantity + 1)}
              disabled={item.quantity >= item.product.stock}
            />
          </View>
        </View>
        <View style={styles.itemActions}>
          <Text variant="titleMedium" style={styles.subtotal}>
          LKR {(item.product.price * item.quantity).toFixed(2)}
          </Text>
          <IconButton
            icon="delete"
            iconColor="#ef4444"
            onPress={() => handleRemoveItem(item.id)}
          />
        </View>
      </View>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {cartProducts.length === 0 ? (
        <View style={styles.emptyCart}>
          <Text variant="titleLarge">Your cart is empty</Text>
          <Button mode="contained" onPress={() => router.push('/(tabs)')}>
            Continue Shopping
          </Button>
        </View>
      ) : (
        <FlatList
          data={cartProducts}
          renderItem={renderCartItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <Text variant="headlineMedium" style={styles.title}>Shopping Cart</Text>
          }
          ListFooterComponent={
            <Card style={styles.summaryCard}>
              <Card.Content>
                <View style={styles.summaryRow}>
                  <Text variant="titleLarge">Total:</Text>
                  <Text variant="titleLarge" style={styles.totalPrice}>
                    LKR {calculateTotal().toFixed(2)}
                  </Text>
                </View>
                <Button 
                  mode="contained" 
                  onPress={handleCheckout}
                  style={styles.checkoutButton}
                >
                  Checkout
                </Button>
              </Card.Content>
            </Card>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 16,
  },
  cartItem: {
    marginBottom: 12,
    marginHorizontal: 16,
  },
  itemContent: {
    flexDirection: 'row',
    padding: 12,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  price: {
    color: '#059669',
    fontWeight: '600',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemActions: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  subtotal: {
    fontWeight: 'bold',
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  summaryCard: {
    margin: 16,
    elevation: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  totalPrice: {
    color: '#059669',
    fontWeight: 'bold',
  },
  checkoutButton: {
    marginTop: 8,
  },
});
