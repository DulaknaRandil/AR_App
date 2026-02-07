import React, { useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Image } from 'react-native';
import {
  Text,
  Card,
  Chip,
  ActivityIndicator,
  Divider,
  Button,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useAuthStore } from '../src/state/useAuthStore';
import { useOrderStore } from '../src/state/useOrderStore';

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

const STATUS_ICONS: Record<string, string> = {
  pending: 'clock-outline',
  confirmed: 'check-circle-outline',
  shipped: 'truck-outline',
  picked_up: 'package-variant',
  in_transit: 'truck-fast-outline',
  out_for_delivery: 'map-marker-radius-outline',
  delivered: 'check-decagram',
  cancelled: 'close-circle-outline',
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useAuthStore((s) => s.session);
  const { selectedOrder, loading, loadOrderDetail } = useOrderStore();

  useEffect(() => {
    if (!session) {
      router.replace('/login');
      return;
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      if (id) loadOrderDetail(id);
    }, [id])
  );

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (loading || !selectedOrder) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const order = selectedOrder;
  const shipment = order.order_shipments?.[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Status Banner */}
      <View
        style={[
          styles.statusBanner,
          { backgroundColor: (STATUS_COLORS[order.status] || '#666') + '15' },
        ]}
      >
        <MaterialCommunityIcons
          name={(STATUS_ICONS[order.status] || 'information-outline') as any}
          size={40}
          color={STATUS_COLORS[order.status] || '#666'}
        />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text variant="titleLarge" style={{ color: STATUS_COLORS[order.status], fontWeight: 'bold' }}>
            {STATUS_LABELS[order.status] || order.status}
          </Text>
          <Text variant="bodySmall" style={{ color: '#666', marginTop: 2 }}>
            Order #{order.id.slice(0, 8).toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Tracking Timeline */}
      {order.order_tracking && order.order_tracking.length > 0 && (
        <Card style={styles.card}>
          <Card.Title title="Tracking" />
          <Card.Content>
            {order.order_tracking.map((track, index) => (
              <View key={track.id} style={styles.trackingItem}>
                <View style={styles.trackingDot}>
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor:
                          index === 0
                            ? STATUS_COLORS[track.status] || '#666'
                            : '#ccc',
                      },
                    ]}
                  />
                  {index < order.order_tracking!.length - 1 && (
                    <View style={styles.trackingLine} />
                  )}
                </View>
                <View style={styles.trackingContent}>
                  <Text
                    variant="titleSmall"
                    style={{
                      fontWeight: index === 0 ? '700' : '400',
                      color: index === 0 ? '#333' : '#888',
                    }}
                  >
                    {track.title}
                  </Text>
                  {track.description && (
                    <Text variant="bodySmall" style={{ color: '#666', marginTop: 2 }}>
                      {track.description}
                    </Text>
                  )}
                  <Text variant="labelSmall" style={{ color: '#aaa', marginTop: 4 }}>
                    {formatDateTime(track.created_at)}
                  </Text>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Shipment Info */}
      {shipment && (
        <Card style={styles.card}>
          <Card.Title title="Shipment Details" />
          <Card.Content>
            {shipment.tracking_id && (
              <View style={styles.detailRow}>
                <Text variant="bodyMedium" style={styles.detailLabel}>Tracking ID</Text>
                <Text variant="bodyMedium" style={styles.detailValue}>
                  {shipment.tracking_id}
                </Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text variant="bodyMedium" style={styles.detailLabel}>Delivery Method</Text>
              <Text variant="bodyMedium" style={styles.detailValue}>
                {shipment.delivery_method === 'own_delivery'
                  ? 'Own Delivery'
                  : shipment.courier_name || 'Partner Courier'}
              </Text>
            </View>
            {shipment.delivery_charge > 0 && (
              <View style={styles.detailRow}>
                <Text variant="bodyMedium" style={styles.detailLabel}>Delivery Charge</Text>
                <Text variant="bodyMedium" style={styles.detailValue}>
                  LKR {shipment.delivery_charge.toFixed(2)}
                </Text>
              </View>
            )}
            {shipment.expected_delivery_date && (
              <View style={styles.detailRow}>
                <Text variant="bodyMedium" style={styles.detailLabel}>Expected Delivery</Text>
                <Text variant="bodyMedium" style={styles.detailValue}>
                  {formatDate(shipment.expected_delivery_date)}
                </Text>
              </View>
            )}
            {shipment.receiver_name && (
              <View style={styles.detailRow}>
                <Text variant="bodyMedium" style={styles.detailLabel}>Received By</Text>
                <Text variant="bodyMedium" style={styles.detailValue}>
                  {shipment.receiver_name}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Order Items */}
      <Card style={styles.card}>
        <Card.Title title="Items" />
        <Card.Content>
          {order.order_items?.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Image
                source={{ uri: item.products?.image_url || 'https://via.placeholder.com/50' }}
                style={styles.itemImage}
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text variant="bodyLarge" numberOfLines={1}>
                  {item.products?.name}
                </Text>
                <Text variant="bodySmall" style={{ color: '#666' }}>
                  Qty: {item.quantity} × LKR {item.price.toFixed(2)}
                </Text>
              </View>
              <Text variant="bodyLarge" style={{ fontWeight: '600', color: '#059669' }}>
                LKR {(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}

          <Divider style={{ marginVertical: 12 }} />

          <View style={styles.detailRow}>
            <Text variant="titleMedium">Total</Text>
            <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#059669' }}>
              LKR {order.total_amount.toFixed(2)}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Delivery Address */}
      <Card style={styles.card}>
        <Card.Title title="Delivery Address" />
        <Card.Content>
          <Text variant="bodyMedium">{order.delivery_address || order.shipping_address || 'N/A'}</Text>
          {order.contact_number && (
            <Text variant="bodyMedium" style={{ marginTop: 4 }}>
              Contact: {order.contact_number}
            </Text>
          )}
          {order.customer_notes && (
            <Text variant="bodySmall" style={{ color: '#666', marginTop: 8 }}>
              Notes: {order.customer_notes}
            </Text>
          )}
        </Card.Content>
      </Card>

      <Button
        mode="outlined"
        onPress={() => router.push('/my-orders')}
        style={{ margin: 16 }}
      >
        Back to My Orders
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    margin: 16,
    borderRadius: 12,
  },
  card: { marginHorizontal: 16, marginBottom: 12, elevation: 2 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: { color: '#666' },
  detailValue: { fontWeight: '600' },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemImage: { width: 50, height: 50, borderRadius: 8 },
  trackingItem: { flexDirection: 'row', minHeight: 60 },
  trackingDot: { alignItems: 'center', width: 24 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  trackingLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 4,
  },
  trackingContent: { flex: 1, marginLeft: 12, paddingBottom: 16 },
});
