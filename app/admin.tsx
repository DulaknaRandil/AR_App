import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert, ScrollView } from 'react-native';
import { Text, Button, Card, FAB, Portal, Modal, TextInput, ActivityIndicator } from 'react-native-paper';
import { useAuthStore } from '../src/state/useAuthStore';
import { supabase } from '../src/api/supabaseClient';
import { router } from 'expo-router';

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

export default function AdminDashboard() {
  const session = useAuthStore((state) => state.session);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    model_url: '',
    category: '',
    stock: '',
    material: '',
    color: ''
  });

  useEffect(() => {
    if (!session) {
      router.replace('/login');
      return;
    }
    checkAdminStatus();
  }, [session]);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session?.user.id)
        .single();

      if (error) throw error;
      
      if (!data?.is_admin) {
        Alert.alert('Access Denied', 'You do not have admin privileges', [
          { text: 'OK', onPress: () => router.back() }
        ]);
        return;
      }
      
      setIsAdmin(true);
      fetchProducts();
    } catch (error: any) {
      Alert.alert('Error', error.message);
      router.back();
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        image_url: product.image_url,
        model_url: product.model_url,
        category: product.category,
        stock: product.stock.toString(),
        material: product.material || '',
        color: product.color || ''
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        image_url: '',
        model_url: '',
        category: '',
        stock: '',
        material: '',
        color: ''
      });
    }
    setModalVisible(true);
  };

  const handleSaveProduct = async () => {
    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        image_url: formData.image_url,
        model_url: formData.model_url,
        category: formData.category,
        stock: parseInt(formData.stock),
        material: formData.material || null,
        color: formData.color || null
      };

      if (editingProduct) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        Alert.alert('Success', 'Product updated successfully');
      } else {
        // Create new product
        const { error } = await supabase
          .from('products')
          .insert(productData);

        if (error) throw error;
        Alert.alert('Success', 'Product created successfully');
      }

      setModalVisible(false);
      fetchProducts();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);

              if (error) throw error;
              Alert.alert('Success', 'Product deleted successfully');
              fetchProducts();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <Card style={styles.productCard}>
      <Card.Title title={item.name} subtitle={`LKR ${item.price} | Stock: ${item.stock}`} />
      <Card.Content>
        <Text variant="bodyMedium">{item.category}</Text>
      </Card.Content>
      <Card.Actions>
        <Button onPress={() => handleOpenModal(item)}>Edit</Button>
        <Button textColor="#ef4444" onPress={() => handleDeleteProduct(item.id)}>Delete</Button>
      </Card.Actions>
    </Card>
  );

  if (!isAdmin || loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Admin Dashboard</Text>
      
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No products found</Text>
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => handleOpenModal()}
      />

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
          <View style={styles.modalScrollContent}>
            <Text variant="headlineSmall" style={styles.modalTitle}>
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </Text>

            <TextInput
              label="Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Description"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
            />

            <TextInput
              label="Price"
              value={formData.price}
              onChangeText={(text) => setFormData({ ...formData, price: text })}
              mode="outlined"
              keyboardType="decimal-pad"
              style={styles.input}
            />

            <TextInput
              label="Image URL"
              value={formData.image_url}
              onChangeText={(text) => setFormData({ ...formData, image_url: text })}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="3D Model URL"
              value={formData.model_url}
              onChangeText={(text) => setFormData({ ...formData, model_url: text })}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Category"
              value={formData.category}
              onChangeText={(text) => setFormData({ ...formData, category: text })}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Stock"
              value={formData.stock}
              onChangeText={(text) => setFormData({ ...formData, stock: text })}
              mode="outlined"
              keyboardType="number-pad"
              style={styles.input}
            />

            <TextInput
              label="Material (Optional)"
              value={formData.material}
              onChangeText={(text) => setFormData({ ...formData, material: text })}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Color (Optional)"
              value={formData.color}
              onChangeText={(text) => setFormData({ ...formData, color: text })}
              mode="outlined"
              style={styles.input}
            />

            <View style={styles.modalActions}>
              <Button mode="outlined" onPress={() => setModalVisible(false)}>
                Cancel
              </Button>
              <Button mode="contained" onPress={handleSaveProduct}>
                Save
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>
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
    padding: 16,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
  },
  productCard: {
    marginBottom: 12,
    elevation: 2,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: '90%',
  },
  modalScrollContent: {
    maxHeight: '100%',
  },
  modalTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
});
