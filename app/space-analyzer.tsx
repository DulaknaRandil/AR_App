import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../src/api/supabaseClient';
import SpaceAnalyzer from '../src/features/ar/SpaceAnalyzer';
import { ProductDetails } from '../src/api/geminiService';

export default function SpaceAnalyzerScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;

      // Map database product to ProductDetails format
      const productDetails: ProductDetails = {
        name: data.name,
        description: data.description,
        category: data.category || 'Furniture',
        color: data.color,
        material: data.material,
        dimensions: data.dimensions,
        price: data.price,
      };

      setProduct(productDetails);
    } catch (error: any) {
      console.error('Error fetching product:', error);
      Alert.alert('Error', 'Failed to load product details', [
        { text: 'Go Back', onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4285f4" />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centered}>
        <Text>Product not found</Text>
      </View>
    );
  }

  return (
    <SpaceAnalyzer 
      product={product} 
      onClose={() => router.back()}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    color: '#6b7280',
  },
});
