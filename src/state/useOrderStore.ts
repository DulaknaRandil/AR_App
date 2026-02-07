import { create } from 'zustand';
import {
  Order,
  fetchMyOrders,
  fetchOrderDetail,
  adminFetchAllOrders,
  adminFetchOrderDetail,
} from '../api/orderService';

interface OrderState {
  // Customer
  myOrders: Order[];
  selectedOrder: Order | null;
  loading: boolean;
  error: string | null;

  // Admin
  adminOrders: Order[];
  adminSelectedOrder: Order | null;
  adminLoading: boolean;
  statusFilter: string;

  // Customer actions
  loadMyOrders: () => Promise<void>;
  loadOrderDetail: (orderId: string) => Promise<void>;

  // Admin actions
  loadAdminOrders: (statusFilter?: string) => Promise<void>;
  loadAdminOrderDetail: (orderId: string) => Promise<void>;
  setStatusFilter: (filter: string) => void;

  // Shared
  clearError: () => void;
  clearSelectedOrder: () => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  myOrders: [],
  selectedOrder: null,
  loading: false,
  error: null,

  adminOrders: [],
  adminSelectedOrder: null,
  adminLoading: false,
  statusFilter: 'all',

  loadMyOrders: async () => {
    set({ loading: true, error: null });
    try {
      const orders = await fetchMyOrders();
      set({ myOrders: orders, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  loadOrderDetail: async (orderId: string) => {
    set({ loading: true, error: null });
    try {
      const order = await fetchOrderDetail(orderId);
      set({ selectedOrder: order, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  loadAdminOrders: async (statusFilter?: string) => {
    const filter = statusFilter ?? get().statusFilter;
    set({ adminLoading: true, statusFilter: filter });
    try {
      const orders = await adminFetchAllOrders(filter);
      set({ adminOrders: orders, adminLoading: false });
    } catch (err: any) {
      set({ error: err.message, adminLoading: false });
    }
  },

  loadAdminOrderDetail: async (orderId: string) => {
    set({ adminLoading: true, error: null });
    try {
      const order = await adminFetchOrderDetail(orderId);
      set({ adminSelectedOrder: order, adminLoading: false });
    } catch (err: any) {
      set({ error: err.message, adminLoading: false });
    }
  },

  setStatusFilter: (filter: string) => {
    set({ statusFilter: filter });
    get().loadAdminOrders(filter);
  },

  clearError: () => set({ error: null }),
  clearSelectedOrder: () => set({ selectedOrder: null, adminSelectedOrder: null }),
}));
