import React, { useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import {
  Text,
  Card,
  Chip,
  ActivityIndicator,
  Button,
} from 'react-native-paper';
import { router, useFocusEffect } from 'expo-router';
import { useAuthStore } from '../src/state/useAuthStore';
import { useOrderStore } from '../src/state/useOrderStore';
import { Order } from '../src/api/orderService';

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  shipped: '#8b5cf6',
  picked_up: '#6366f1',
  in_transit: '#0ea5e9',
  out_for_delivery: '#06b6d4',
  delivered: '#10b981',
  cancelled: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function MyOrdersScreen() {
  const session = useAuthStore((s) => s.session);
  const { myOrders, loading, loadMyOrders } = useOrderStore();

  useEffect(() => {
    if (!session) {
      router.replace('/login');
      return;
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      loadMyOrders();
    }, [])
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getItemCount = (order: Order) => {
    return order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <Card
      style={styles.orderCard}
      onPress={() => router.push(`/order-detail?id=${item.id}`)}
    >
      <Card.Content>
        <View style={styles.orderHeader}>
          <View>
            <Text variant="labelSmall" style={styles.orderId}>
              Order #{item.id.slice(0, 8).toUpperCase()}
            </Text>
            <Text variant="bodySmall" style={styles.dateText}>
              {formatDate(item.created_at)}
            </Text>
          </View>
          <Chip
            style={[
              styles.statusChip,
              { backgroundColor: (STATUS_COLORS[item.status] || '#666') + '20' },
            ]}
            textStyle={{ color: STATUS_COLORS[item.status] || '#666', fontSize: 12 }}
          >
            {STATUS_LABELS[item.status] || item.status}
          </Chip>
        </View>

        <View style={styles.orderInfo}>
          <Text variant="bodyMedium">
            {getItemCount(item)} item{getItemCount(item) !== 1 ? 's' : ''}
          </Text>
          <Text variant="titleMedium" style={styles.totalText}>
            LKR {item.total_amount.toFixed(2)}
          </Text>
        </View>

        {/* Show first 2 product names */}
        {item.order_items && item.order_items.length > 0 && (
          <Text variant="bodySmall" style={styles.productsText} numberOfLines={1}>
            {item.order_items
              .slice(0, 2)
              .map((oi) => oi.products?.name)
              .join(', ')}
            {item.order_items.length > 2
              ? ` +${item.order_items.length - 2} more`
              : ''}
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  if (!session) return null;

  return (
    <View style={styles.container}>
      <FlatList
        data={myOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadMyOrders} />
        }
        ListHeaderComponent={
          <Text variant="headlineMedium" style={styles.heading}>
            My Orders
          </Text>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text variant="titleMedium" style={styles.emptyText}>
                No orders yet
              </Text>
              <Button
                mode="contained"
                onPress={() => router.push('/(tabs)')}
                style={{ marginTop: 16 }}
              >
                Start Shopping
              </Button>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  heading: { padding: 16, fontWeight: 'bold' },
  listContent: { paddingBottom: 24 },
  orderCard: { marginHorizontal: 16, marginBottom: 12, elevation: 2 },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderId: { fontWeight: '700', color: '#333' },
  dateText: { color: '#888', marginTop: 2 },
  statusChip: { height: 28 },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  totalText: { fontWeight: 'bold', color: '#059669' },
  productsText: { color: '#666', marginTop: 8 },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#888' },
});
