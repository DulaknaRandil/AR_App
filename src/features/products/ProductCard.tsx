import React from 'react';
import { View, StyleSheet, Image, Alert } from 'react-native';
import { Card, Text, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Product } from '../../types';
import { useCartStore } from '../../state/useCartStore';

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const { addItem } = useCartStore();

  const handleAddToCart = async (e: any) => {
    e.stopPropagation();
    try {
      await addItem(product.id);
      Alert.alert('Success', `${product.name} added to cart!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to add to cart');
    }
  };

  const handleViewInAR = (e: any) => {
    e.stopPropagation();
    router.push({
      pathname: '/ar',
      params: { 
        modelUrl: product.model_url || '',
        productId: product.id 
      },
    });
  };

  const handleCardPress = () => {
    router.push({
      pathname: `/product/${product.id}`,
    });
  };

  return (
    <Card style={styles.card} onPress={handleCardPress}>
      <Image
        source={{ uri: product.image_url || product.thumbnail_url }}
        style={styles.image}
        resizeMode="cover"
      />
      
      <Card.Content style={styles.content}>
        <Text variant="titleSmall" style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        
        <Text variant="bodySmall" style={styles.category}>
          {product.category || 'Furniture'}
        </Text>
        
        <Text variant="titleMedium" style={styles.price}>
          ${product.price}
        </Text>
        
        <View style={styles.actions}>
          <IconButton
            icon="cart-plus"
            size={20}
            mode="contained"
            onPress={handleAddToCart}
            style={styles.cartButton}
          />
          
          <IconButton
            icon="rotate-3d-variant"
            size={20}
            mode="contained"
            onPress={handleViewInAR}
            style={styles.arButton}
            iconColor="#fff"
          />
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    marginVertical: 6,
    maxWidth: '50%',
  },
  image: {
    width: '100%',
    height: 150,
    backgroundColor: '#f0f0f0',
  },
  content: {
    padding: 12,
  },
  name: {
    fontWeight: 'bold',
    marginBottom: 4,
    minHeight: 40,
  },
  category: {
    color: '#666',
    marginBottom: 8,
  },
  price: {
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  cartButton: {
    flex: 1,
    margin: 0,
  },
  arButton: {
    flex: 1,
    margin: 0,
    backgroundColor: '#6200ea',
  },
});
