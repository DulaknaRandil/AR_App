import React, { useEffect, useCallback, useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import {
  Text,
  Card,
  Chip,
  ActivityIndicator,
  SegmentedButtons,
  Button,
} from 'react-native-paper';
import { router, useFocusEffect } from 'expo-router';
import { useAuthStore } from '../src/state/useAuthStore';
import { useOrderStore } from '../src/state/useOrderStore';
import { supabase } from '../src/api/supabaseClient';
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

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
];

export default function AdminOrdersScreen() {
  const session = useAuthStore((s) => s.session);
  const {
    adminOrders,
    adminLoading,
    statusFilter,
    loadAdminOrders,
    setStatusFilter,
  } = useOrderStore();

  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!session) {
      router.replace('/login');
      return;
    }
    checkAdmin();
  }, [session]);

  const checkAdmin = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session?.user.id)
        .single();

      if (!data?.is_admin) {
        router.back();
        return;
      }
      setIsAdmin(true);
      setChecking(false);
    } catch {
      router.back();
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (isAdmin) loadAdminOrders();
    }, [isAdmin])
  );

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getItemCount = (order: Order) =>
    order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const renderOrder = ({ item }: { item: Order }) => (
    <Card
      style={styles.orderCard}
      onPress={() => router.push(`/admin-order-detail?id=${item.id}`)}
    >
      <Card.Content>
        <View style={styles.orderHeader}>
          <View style={{ flex: 1 }}>
            <Text variant="labelSmall" style={styles.orderId}>
              #{item.id.slice(0, 8).toUpperCase()}
            </Text>
            <Text variant="bodyMedium" style={{ fontWeight: '600', marginTop: 2 }}>
              {(item as any).profiles?.full_name || 'Customer'}
            </Text>
            <Text variant="bodySmall" style={{ color: '#888' }}>
              {formatDate(item.created_at)}
            </Text>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Chip
              mode="flat"
              style={[
                styles.statusChip,
                { backgroundColor: (STATUS_COLORS[item.status] || '#666') + '20' },
              ]}
              textStyle={{
                color: STATUS_COLORS[item.status] || '#666',
                fontSize: 10,
                fontWeight: '600',
                lineHeight: 16,
              }}
            >
              {STATUS_LABELS[item.status] || item.status}
            </Chip>
            <Text variant="titleMedium" style={styles.totalText}>
              LKR {item.total_amount.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.orderFooter}>
          <Text variant="bodySmall" style={{ color: '#666' }}>
            {getItemCount(item)} item{getItemCount(item) !== 1 ? 's' : ''} •{' '}
            {item.delivery_address
              ? item.delivery_address.substring(0, 30) + '...'
              : 'No address'}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  if (checking || !isAdmin) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.heading}>
        Order Management
      </Text>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <SegmentedButtons
          value={statusFilter}
          onValueChange={setStatusFilter}
          buttons={FILTER_OPTIONS}
          density="small"
          style={styles.segmentedButtons}
        />
      </View>

      <FlatList
        data={adminOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={adminLoading} onRefresh={() => loadAdminOrders()} />
        }
        ListEmptyComponent={
          !adminLoading ? (
            <Text style={styles.emptyText}>No orders found</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heading: { paddingHorizontal: 16, paddingTop: 16, fontWeight: 'bold' },
  filterContainer: { 
    paddingHorizontal: 16, 
    paddingVertical: 10,
    marginBottom: 2,
  },
  segmentedButtons: { 
    height: 48,
  },
  listContent: { paddingBottom: 24 },
  orderCard: { marginHorizontal: 16, marginBottom: 10, elevation: 2 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  orderId: { fontWeight: '700', color: '#555' },
  statusChip: { 
    marginBottom: 8,
    
    paddingHorizontal: 12,
  },
  totalText: { fontWeight: 'bold', color: '#059669', marginTop: 4 },
  orderFooter: { marginTop: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 8 },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#888' },
});
