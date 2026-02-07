import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import {
  Text,
  Card,
  Chip,
  Button,
  ActivityIndicator,
  Divider,
  TextInput,
  Portal,
  Modal,
  RadioButton,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useAuthStore } from '../src/state/useAuthStore';
import { useOrderStore } from '../src/state/useOrderStore';
import {
  adminConfirmOrder,
  adminCancelOrder,
  adminCreateShipment,
  adminUpdateDeliveryStatus,
  adminMarkDelivered,
} from '../src/api/orderService';

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

export default function AdminOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useAuthStore((s) => s.session);
  const { adminSelectedOrder, adminLoading, loadAdminOrderDetail } = useOrderStore();

  const [actionLoading, setActionLoading] = useState(false);

  // Shipment modal
  const [shipModalVisible, setShipModalVisible] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState('own_delivery');
  const [courierName, setCourierName] = useState('');
  const [trackingId, setTrackingId] = useState('');
  const [deliveryCharge, setDeliveryCharge] = useState('0');
  const [expectedDate, setExpectedDate] = useState('');

  // Deliver modal
  const [deliverModalVisible, setDeliverModalVisible] = useState(false);
  const [receiverName, setReceiverName] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Cancel modal
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (!session) {
      router.replace('/login');
      return;
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      if (id) loadAdminOrderDetail(id);
    }, [id])
  );

  const refreshOrder = () => {
    if (id) loadAdminOrderDetail(id);
  };

  const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  // ---- ACTIONS ----

  const handleConfirm = () => {
    Alert.alert('Confirm Order', 'Are you sure you want to confirm this order?', [
      { text: 'Cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          setActionLoading(true);
          try {
            await adminConfirmOrder(id!);
            Alert.alert('Success', 'Order confirmed');
            refreshOrder();
          } catch (err: any) {
            Alert.alert('Error', err.message);
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleCreateShipment = async () => {
    if (!trackingId.trim() && deliveryMethod === 'partner_courier') {
      Alert.alert('Required', 'Please enter a tracking ID for partner courier');
      return;
    }

    setActionLoading(true);
    try {
      await adminCreateShipment({
        order_id: id!,
        delivery_method: deliveryMethod,
        courier_name: courierName.trim() || undefined,
        tracking_id: trackingId.trim() || undefined,
        delivery_charge: parseFloat(deliveryCharge) || 0,
        expected_delivery_date: expectedDate.trim() || undefined,
      });
      setShipModalVisible(false);
      Alert.alert('Success', 'Shipment created');
      refreshOrder();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = (status: string) => {
    const labels: Record<string, string> = {
      picked_up: 'Picked Up',
      in_transit: 'In Transit',
      out_for_delivery: 'Out for Delivery',
    };

    Alert.alert(
      'Update Status',
      `Mark this order as "${labels[status]}"?`,
      [
        { text: 'Cancel' },
        {
          text: 'Update',
          onPress: async () => {
            setActionLoading(true);
            try {
              await adminUpdateDeliveryStatus(id!, status);
              Alert.alert('Success', `Order marked as ${labels[status]}`);
              refreshOrder();
            } catch (err: any) {
              Alert.alert('Error', err.message);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleMarkDelivered = async () => {
    setActionLoading(true);
    try {
      await adminMarkDelivered(id!, receiverName.trim() || undefined, deliveryNotes.trim() || undefined);
      setDeliverModalVisible(false);
      Alert.alert('Success', 'Order marked as delivered');
      refreshOrder();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      Alert.alert('Required', 'Please enter a cancellation reason');
      return;
    }
    setActionLoading(true);
    try {
      await adminCancelOrder(id!, cancelReason.trim());
      setCancelModalVisible(false);
      Alert.alert('Success', 'Order cancelled');
      refreshOrder();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (adminLoading || !adminSelectedOrder) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const order = adminSelectedOrder;
  const shipment = order.order_shipments?.[0];
  const canConfirm = order.status === 'pending';
  const canShip = order.status === 'confirmed';
  const canUpdateDelivery = ['shipped', 'picked_up', 'in_transit'].includes(order.status);
  const canDeliver = ['shipped', 'picked_up', 'in_transit', 'out_for_delivery'].includes(order.status);
  const canCancel = ['pending', 'confirmed'].includes(order.status);
  const isTerminal = ['delivered', 'cancelled'].includes(order.status);

  return (
    <>
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
            size={36}
            color={STATUS_COLORS[order.status] || '#666'}
          />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text
              variant="titleLarge"
              style={{ color: STATUS_COLORS[order.status], fontWeight: 'bold' }}
            >
              {STATUS_LABELS[order.status] || order.status}
            </Text>
            <Text variant="bodySmall" style={{ color: '#666' }}>
              #{order.id.slice(0, 8).toUpperCase()} • {formatDateTime(order.created_at)}
            </Text>
          </View>
        </View>

        {/* Customer Info */}
        <Card style={styles.card}>
          <Card.Title title="Customer" />
          <Card.Content>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Name</Text>
              <Text style={styles.value}>{(order as any).profiles?.full_name || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{(order as any).profiles?.email || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Phone</Text>
              <Text style={styles.value}>{order.contact_number || (order as any).profiles?.phone || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Address</Text>
              <Text style={[styles.value, { flex: 1 }]}>{order.delivery_address || 'N/A'}</Text>
            </View>
            {order.customer_notes && (
              <View style={styles.detailRow}>
                <Text style={styles.label}>Notes</Text>
                <Text style={[styles.value, { flex: 1 }]}>{order.customer_notes}</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Order Items */}
        <Card style={styles.card}>
          <Card.Title title="Order Items" />
          <Card.Content>
            {order.order_items?.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Image
                  source={{ uri: item.products?.image_url || 'https://via.placeholder.com/45' }}
                  style={styles.itemImage}
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text variant="bodyMedium" numberOfLines={1}>{item.products?.name}</Text>
                  <Text variant="bodySmall" style={{ color: '#666' }}>
                    Qty: {item.quantity} × LKR {item.price.toFixed(2)}
                  </Text>
                </View>
                <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
                  LKR {(item.price * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))}
            <Divider style={{ marginVertical: 10 }} />
            <View style={styles.detailRow}>
              <Text variant="titleMedium">Total</Text>
              <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#059669' }}>
                LKR {order.total_amount.toFixed(2)}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Shipment Info */}
        {shipment && (
          <Card style={styles.card}>
            <Card.Title title="Shipment" />
            <Card.Content>
              <View style={styles.detailRow}>
                <Text style={styles.label}>Method</Text>
                <Text style={styles.value}>
                  {shipment.delivery_method === 'own_delivery' ? 'Own Delivery' : 'Partner Courier'}
                </Text>
              </View>
              {shipment.courier_name && (
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Courier</Text>
                  <Text style={styles.value}>{shipment.courier_name}</Text>
                </View>
              )}
              {shipment.tracking_id && (
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Tracking ID</Text>
                  <Text style={styles.value}>{shipment.tracking_id}</Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Text style={styles.label}>Delivery Charge</Text>
                <Text style={styles.value}>LKR {shipment.delivery_charge.toFixed(2)}</Text>
              </View>
              {shipment.expected_delivery_date && (
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Expected</Text>
                  <Text style={styles.value}>{shipment.expected_delivery_date}</Text>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Tracking History */}
        {order.order_tracking && order.order_tracking.length > 0 && (
          <Card style={styles.card}>
            <Card.Title title="Tracking History" />
            <Card.Content>
              {order.order_tracking.map((track, index) => (
                <View key={track.id} style={styles.trackingItem}>
                  <View style={styles.trackingDot}>
                    <View
                      style={[
                        styles.dot,
                        {
                          backgroundColor:
                            index === 0 ? STATUS_COLORS[track.status] || '#666' : '#ccc',
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
                      style={{ fontWeight: index === 0 ? '700' : '400' }}
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

        {/* Action Buttons */}
        {!isTerminal && (
          <Card style={styles.card}>
            <Card.Title title="Actions" />
            <Card.Content>
              {canConfirm && (
                <Button
                  mode="contained"
                  onPress={handleConfirm}
                  loading={actionLoading}
                  disabled={actionLoading}
                  icon="check-circle"
                  style={[styles.actionBtn, { backgroundColor: '#3b82f6' }]}
                >
                  Confirm Order
                </Button>
              )}

              {canShip && (
                <Button
                  mode="contained"
                  onPress={() => setShipModalVisible(true)}
                  loading={actionLoading}
                  disabled={actionLoading}
                  icon="truck"
                  style={[styles.actionBtn, { backgroundColor: '#8b5cf6' }]}
                >
                  Create Shipment
                </Button>
              )}

              {canUpdateDelivery && (
                <View>
                  <Text variant="labelLarge" style={{ marginBottom: 8, color: '#555' }}>
                    Update Delivery Status:
                  </Text>
                  <View style={styles.statusButtons}>
                    {order.status !== 'picked_up' &&
                      order.status !== 'in_transit' &&
                      order.status !== 'out_for_delivery' && (
                        <Button
                          mode="outlined"
                          onPress={() => handleUpdateStatus('picked_up')}
                          disabled={actionLoading}
                          compact
                          style={styles.statusBtn}
                        >
                          Picked Up
                        </Button>
                      )}
                    {order.status !== 'in_transit' &&
                      order.status !== 'out_for_delivery' && (
                        <Button
                          mode="outlined"
                          onPress={() => handleUpdateStatus('in_transit')}
                          disabled={actionLoading}
                          compact
                          style={styles.statusBtn}
                        >
                          In Transit
                        </Button>
                      )}
                    {order.status !== 'out_for_delivery' && (
                      <Button
                        mode="outlined"
                        onPress={() => handleUpdateStatus('out_for_delivery')}
                        disabled={actionLoading}
                        compact
                        style={styles.statusBtn}
                      >
                        Out for Delivery
                      </Button>
                    )}
                  </View>
                </View>
              )}

              {canDeliver && (
                <Button
                  mode="contained"
                  onPress={() => setDeliverModalVisible(true)}
                  loading={actionLoading}
                  disabled={actionLoading}
                  icon="check-decagram"
                  style={[styles.actionBtn, { backgroundColor: '#10b981', marginTop: 12 }]}
                >
                  Mark as Delivered
                </Button>
              )}

              {canCancel && (
                <Button
                  mode="outlined"
                  onPress={() => setCancelModalVisible(true)}
                  disabled={actionLoading}
                  icon="close-circle"
                  textColor="#ef4444"
                  style={[styles.actionBtn, { borderColor: '#ef4444', marginTop: 12 }]}
                >
                  Cancel Order
                </Button>
              )}
            </Card.Content>
          </Card>
        )}

        <Button
          mode="outlined"
          onPress={() => router.push('/admin-orders')}
          style={{ margin: 16 }}
        >
          Back to Orders
        </Button>
      </ScrollView>

      {/* ---- MODALS ---- */}

      {/* Create Shipment Modal */}
      <Portal>
        <Modal
          visible={shipModalVisible}
          onDismiss={() => setShipModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <ScrollView>
            <Text variant="headlineSmall" style={styles.modalTitle}>
              Create Shipment
            </Text>

            <Text variant="labelLarge" style={{ marginBottom: 8 }}>
              Delivery Method
            </Text>
            <RadioButton.Group
              value={deliveryMethod}
              onValueChange={setDeliveryMethod}
            >
              <View style={styles.radioRow}>
                <RadioButton value="own_delivery" />
                <Text>Own Delivery</Text>
              </View>
              <View style={styles.radioRow}>
                <RadioButton value="partner_courier" />
                <Text>Partner Courier</Text>
              </View>
            </RadioButton.Group>

            {deliveryMethod === 'partner_courier' && (
              <TextInput
                label="Courier Name"
                value={courierName}
                onChangeText={setCourierName}
                mode="outlined"
                style={styles.input}
              />
            )}

            <TextInput
              label="Tracking ID"
              value={trackingId}
              onChangeText={setTrackingId}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Delivery Charge (LKR)"
              value={deliveryCharge}
              onChangeText={setDeliveryCharge}
              mode="outlined"
              keyboardType="decimal-pad"
              style={styles.input}
            />

            <TextInput
              label="Expected Delivery Date (YYYY-MM-DD)"
              value={expectedDate}
              onChangeText={setExpectedDate}
              mode="outlined"
              placeholder="2026-02-15"
              style={styles.input}
            />

            <View style={styles.modalActions}>
              <Button mode="outlined" onPress={() => setShipModalVisible(false)}>
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleCreateShipment}
                loading={actionLoading}
                disabled={actionLoading}
              >
                Create Shipment
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>

      {/* Mark Delivered Modal */}
      <Portal>
        <Modal
          visible={deliverModalVisible}
          onDismiss={() => setDeliverModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Mark as Delivered
          </Text>

          <TextInput
            label="Receiver Name (Optional)"
            value={receiverName}
            onChangeText={setReceiverName}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Delivery Notes (Optional)"
            value={deliveryNotes}
            onChangeText={setDeliveryNotes}
            mode="outlined"
            multiline
            numberOfLines={2}
            style={styles.input}
          />

          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setDeliverModalVisible(false)}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleMarkDelivered}
              loading={actionLoading}
              disabled={actionLoading}
              buttonColor="#10b981"
            >
              Confirm Delivery
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Cancel Order Modal */}
      <Portal>
        <Modal
          visible={cancelModalVisible}
          onDismiss={() => setCancelModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Cancel Order
          </Text>

          <TextInput
            label="Cancellation Reason *"
            value={cancelReason}
            onChangeText={setCancelReason}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />

          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setCancelModalVisible(false)}>
              Go Back
            </Button>
            <Button
              mode="contained"
              onPress={handleCancelOrder}
              loading={actionLoading}
              disabled={actionLoading}
              buttonColor="#ef4444"
            >
              Cancel Order
            </Button>
          </View>
        </Modal>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 12,
  },
  card: { marginHorizontal: 16, marginBottom: 12, elevation: 2 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: { color: '#888', fontSize: 14 },
  value: { fontWeight: '600', fontSize: 14 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  itemImage: { width: 45, height: 45, borderRadius: 6 },
  trackingItem: { flexDirection: 'row', minHeight: 56 },
  trackingDot: { alignItems: 'center', width: 20 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  trackingLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 3,
  },
  trackingContent: { flex: 1, marginLeft: 10, paddingBottom: 12 },
  actionBtn: { marginBottom: 8, borderRadius: 8 },
  statusButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusBtn: { borderRadius: 8 },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 12,
    maxHeight: '85%',
  },
  modalTitle: { fontWeight: 'bold', marginBottom: 16 },
  input: { marginBottom: 12 },
  radioRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
});
