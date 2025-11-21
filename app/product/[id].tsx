import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { Text, Button, Card, ActivityIndicator, Chip } from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../../src/api/supabaseClient';
import { useCartStore } from '../../src/state/useCartStore';
import { useAuthStore } from '../../src/state/useAuthStore';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  model_url: string;
  category: string;
  stock: number;
  material?: string;
  color?: string;
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const session = useAuthStore((state) => state.session);
  const { addItem } = useCartStore();

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (error: any) {
      Alert.alert('Error', error.message);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!session) {
      Alert.alert('Login Required', 'Please login to add items to cart', [
        { text: 'Cancel' },
        { text: 'Login', onPress: () => router.push('/login') }
      ]);
      return;
    }

    try {
      await addItem(product!.id, quantity);
      Alert.alert('Success', 'Product added to cart');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleViewInAR = () => {
    router.push({
      pathname: '/ar',
      params: {
        modelUrl: product?.model_url,
        productId: product?.id,
        productName: product?.name
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!product) return null;

  return (
    <ScrollView style={styles.container}>
      <Image 
        source={{ uri: product.image_url || 'https://via.placeholder.com/400' }} 
        style={styles.image}
      />
      
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.name}>{product.name}</Text>
        
        <View style={styles.chips}>
          {product.category && (
            <Chip mode="outlined" style={styles.chip}>{product.category}</Chip>
          )}
          {product.material && (
            <Chip mode="outlined" style={styles.chip}>{product.material}</Chip>
          )}
          {product.color && (
            <Chip mode="outlined" style={styles.chip}>{product.color}</Chip>
          )}
        </View>

        <Text variant="headlineSmall" style={styles.price}>${product.price}</Text>
        
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Description</Text>
            <Text variant="bodyMedium">{product.description}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Stock Information</Text>
            <Text variant="bodyMedium">
              {product.stock > 0 
                ? `${product.stock} items available` 
                : 'Out of stock'}
            </Text>
          </Card.Content>
        </Card>

        <View style={styles.quantitySection}>
          <Text variant="titleMedium">Quantity:</Text>
          <View style={styles.quantityControls}>
            <Button 
              mode="outlined" 
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
              compact
            >
              -
            </Button>
            <Text variant="titleMedium" style={styles.quantityText}>{quantity}</Text>
            <Button 
              mode="outlined" 
              onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}
              compact
              disabled={quantity >= product.stock}
            >
              +
            </Button>
          </View>
        </View>

        <View style={styles.actions}>
          <Button 
            mode="contained" 
            onPress={handleAddToCart}
            style={styles.button}
            disabled={product.stock === 0}
          >
            Add to Cart
          </Button>
          
          {product.model_url && (
            <Button 
              mode="outlined" 
              onPress={handleViewInAR}
              style={styles.button}
            >
              View in AR
            </Button>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 400,
    resizeMode: 'cover',
  },
  content: {
    padding: 16,
  },
  name: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  chip: {
    marginRight: 8,
  },
  price: {
    color: '#059669',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quantityText: {
    minWidth: 40,
    textAlign: 'center',
  },
  actions: {
    gap: 12,
  },
  button: {
    marginBottom: 8,
  },
});
