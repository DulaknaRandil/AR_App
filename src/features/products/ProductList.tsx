import React, { useEffect, useState } from 'react';
import { FlatList, View, StyleSheet, Alert, RefreshControl } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { supabase } from '../../api/supabaseClient';
import ProductCard from './ProductCard';
import { Product } from '../../types';

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  if (products.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="titleLarge">No products available</Text>
        <Text variant="bodyMedium" style={styles.emptyText}>
          Check back later for new items
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={products}
      renderItem={({ item }) => <ProductCard product={item} />}
      keyExtractor={(item) => item.id}
      numColumns={2}
      contentContainerStyle={styles.listContainer}
      columnWrapperStyle={styles.columnWrapper}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    padding: 8,
  },
  columnWrapper: {
    gap: 12,
    paddingHorizontal: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 8,
    color: '#666',
  },
});
