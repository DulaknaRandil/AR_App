import { supabase } from './supabaseClient';

// ==================== TYPES ====================
export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: string;
  delivery_address: string;
  contact_number: string;
  customer_notes?: string;
  admin_notes?: string;
  shipping_address?: string;
  confirmed_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  // Joined
  profiles?: { full_name: string; email: string; phone: string };
  order_items?: OrderItem[];
  order_shipments?: OrderShipment[];
  order_tracking?: OrderTracking[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  created_at: string;
  // Joined
  products?: {
    name: string;
    image_url: string;
    category: string;
  };
}

export interface OrderShipment {
  id: string;
  order_id: string;
  delivery_method: string;
  courier_name?: string;
  tracking_id?: string;
  delivery_charge: number;
  expected_delivery_date?: string;
  actual_delivery_date?: string;
  receiver_name?: string;
  delivery_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderTracking {
  id: string;
  order_id: string;
  status: string;
  title: string;
  description?: string;
  updated_by?: string;
  created_at: string;
}

export interface CreateOrderPayload {
  delivery_address: string;
  contact_number: string;
  customer_notes?: string;
}

export interface CreateShipmentPayload {
  order_id: string;
  delivery_method: string;
  courier_name?: string;
  tracking_id?: string;
  delivery_charge: number;
  expected_delivery_date?: string;
}

// ==================== CUSTOMER APIs ====================

/**
 * Place a new order from the cart
 */
export const placeOrder = async (payload: CreateOrderPayload) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // 1. Fetch cart items with product details
  const { data: cartItems, error: cartError } = await supabase
    .from('cart_items')
    .select(`
      id, product_id, quantity,
      products ( name, price, stock, image_url )
    `)
    .eq('user_id', user.id);

  if (cartError) throw cartError;
  if (!cartItems || cartItems.length === 0) throw new Error('Cart is empty');

  // 2. Validate stock
  for (const item of cartItems) {
    const product = (item as any).products;
    if (item.quantity > product.stock) {
      throw new Error(`"${product.name}" only has ${product.stock} in stock`);
    }
  }

  // 3. Calculate total
  const totalAmount = cartItems.reduce(
    (sum: number, item: any) => sum + item.products.price * item.quantity, 0
  );

  // 4. Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      total_amount: totalAmount,
      status: 'pending',
      delivery_address: payload.delivery_address,
      contact_number: payload.contact_number,
      customer_notes: payload.customer_notes || null,
      shipping_address: payload.delivery_address,
    })
    .select()
    .single();

  if (orderError) throw orderError;

  // 5. Create order items
  const orderItems = cartItems.map((item: any) => ({
    order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    price: item.products.price,
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) throw itemsError;

  // 6. Add initial tracking entry
  await supabase.from('order_tracking').insert({
    order_id: order.id,
    status: 'pending',
    title: 'Order Placed',
    description: 'Your order has been placed successfully and is awaiting confirmation.',
  });

  // 7. Clear cart
  await supabase.from('cart_items').delete().eq('user_id', user.id);

  return order;
};

/**
 * Fetch customer's own orders
 */
export const fetchMyOrders = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id, product_id, quantity, price,
        products ( name, image_url, category )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Order[];
};

/**
 * Fetch single order with full details (for customer)
 */
export const fetchOrderDetail = async (orderId: string) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id, product_id, quantity, price,
        products ( name, image_url, category )
      ),
      order_shipments (*),
      order_tracking (*)
    `)
    .eq('id', orderId)
    .single();

  if (error) throw error;

  // Sort tracking by date
  if (data.order_tracking) {
    data.order_tracking.sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  return data as Order;
};

// ==================== ADMIN APIs ====================

/**
 * Admin: Fetch all orders
 */
export const adminFetchAllOrders = async (statusFilter?: string) => {
  let query = supabase
    .from('orders')
    .select(`
      *,
      profiles ( full_name, email, phone ),
      order_items (
        id, product_id, quantity, price,
        products ( name, image_url, category )
      ),
      order_shipments ( id, tracking_id, delivery_method )
    `)
    .order('created_at', { ascending: false });

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Order[];
};

/**
 * Admin: Fetch single order full detail
 */
export const adminFetchOrderDetail = async (orderId: string) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      profiles ( full_name, email, phone ),
      order_items (
        id, product_id, quantity, price,
        products ( name, image_url, category, stock )
      ),
      order_shipments (*),
      order_tracking (*)
    `)
    .eq('id', orderId)
    .single();

  if (error) throw error;

  if (data.order_tracking) {
    data.order_tracking.sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  return data as Order;
};

/**
 * Admin: Confirm an order
 */
export const adminConfirmOrder = async (orderId: string, adminNotes?: string) => {
  const { data: { user } } = await supabase.auth.getUser();

  const { error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      admin_notes: adminNotes || null,
    })
    .eq('id', orderId);

  if (updateError) throw updateError;

  // Deduct stock
  const { data: items } = await supabase
    .from('order_items')
    .select('product_id, quantity')
    .eq('order_id', orderId);

  if (items) {
    for (const item of items) {
      // Manually decrement stock
      const { data: product } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.product_id)
        .single();

      if (product) {
        await supabase
          .from('products')
          .update({ stock: Math.max(0, (product as any).stock - item.quantity) })
          .eq('id', item.product_id);
      }
    }
  }

  // Add tracking
  await supabase.from('order_tracking').insert({
    order_id: orderId,
    status: 'confirmed',
    title: 'Order Confirmed',
    description: 'Your order has been confirmed and is being prepared.',
    updated_by: user?.id,
  });
};

/**
 * Admin: Cancel an order
 */
export const adminCancelOrder = async (orderId: string, reason: string) => {
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('orders')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason,
    })
    .eq('id', orderId);

  if (error) throw error;

  await supabase.from('order_tracking').insert({
    order_id: orderId,
    status: 'cancelled',
    title: 'Order Cancelled',
    description: `Order cancelled. Reason: ${reason}`,
    updated_by: user?.id,
  });
};

/**
 * Admin: Create shipment for an order
 */
export const adminCreateShipment = async (payload: CreateShipmentPayload) => {
  const { data: { user } } = await supabase.auth.getUser();

  // Create shipment record
  const { data: shipment, error: shipError } = await supabase
    .from('order_shipments')
    .insert({
      order_id: payload.order_id,
      delivery_method: payload.delivery_method,
      courier_name: payload.courier_name || null,
      tracking_id: payload.tracking_id || null,
      delivery_charge: payload.delivery_charge,
      expected_delivery_date: payload.expected_delivery_date || null,
    })
    .select()
    .single();

  if (shipError) throw shipError;

  // Update order status
  const { error: orderError } = await supabase
    .from('orders')
    .update({ status: 'shipped' })
    .eq('id', payload.order_id);

  if (orderError) throw orderError;

  // Add tracking
  const trackingDesc = payload.tracking_id
    ? `Your order has been shipped. Tracking ID: ${payload.tracking_id}`
    : 'Your order has been shipped.';

  await supabase.from('order_tracking').insert({
    order_id: payload.order_id,
    status: 'shipped',
    title: 'Order Shipped',
    description: trackingDesc,
    updated_by: user?.id,
  });

  return shipment;
};

/**
 * Admin: Update delivery status (picked_up, in_transit, out_for_delivery)
 */
export const adminUpdateDeliveryStatus = async (
  orderId: string,
  status: string,
  description?: string
) => {
  const { data: { user } } = await supabase.auth.getUser();

  const statusTitles: Record<string, string> = {
    picked_up: 'Picked Up',
    in_transit: 'In Transit',
    out_for_delivery: 'Out for Delivery',
  };

  const statusDescriptions: Record<string, string> = {
    picked_up: 'Your order has been picked up by the courier.',
    in_transit: 'Your order is in transit to your location.',
    out_for_delivery: 'Your order is out for delivery. It will arrive soon!',
  };

  // Update order status
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);

  if (error) throw error;

  // Add tracking
  await supabase.from('order_tracking').insert({
    order_id: orderId,
    status,
    title: statusTitles[status] || status,
    description: description || statusDescriptions[status] || '',
    updated_by: user?.id,
  });
};

/**
 * Admin: Mark order as delivered
 */
export const adminMarkDelivered = async (
  orderId: string,
  receiverName?: string,
  notes?: string
) => {
  const { data: { user } } = await supabase.auth.getUser();

  const now = new Date().toISOString();

  // Update order
  const { error: orderError } = await supabase
    .from('orders')
    .update({
      status: 'delivered',
      delivered_at: now,
    })
    .eq('id', orderId);

  if (orderError) throw orderError;

  // Update shipment
  await supabase
    .from('order_shipments')
    .update({
      actual_delivery_date: now.split('T')[0],
      receiver_name: receiverName || null,
      delivery_notes: notes || null,
    })
    .eq('order_id', orderId);

  // Add tracking
  await supabase.from('order_tracking').insert({
    order_id: orderId,
    status: 'delivered',
    title: 'Delivered',
    description: receiverName
      ? `Your order has been delivered successfully. Received by: ${receiverName}`
      : 'Your order has been delivered successfully.',
    updated_by: user?.id,
  });
};
