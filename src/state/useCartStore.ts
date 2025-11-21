import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../api/supabaseClient';

interface CartItem {
  variant_id?: string;
  product_id: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addToCart: (variant_id: string, quantity: number) => void;
  addItem: (product_id: string, quantity?: number) => Promise<void>;
  removeFromCart: (variant_id: string) => void;
  updateQuantity: (variant_id: string, quantity: number) => void;
  clearCart: () => void;
  getCartCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: async (product_id: string, quantity: number = 1) => {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Add to database cart
          const { error } = await supabase
            .from('cart_items')
            .upsert({ 
              user_id: user.id, 
              product_id, 
              quantity 
            }, {
              onConflict: 'user_id,product_id'
            });
            
          if (error) throw error;
        }
        
        // Also update local state
        set((state) => {
          const existingItem = state.items.find((item) => item.product_id === product_id);
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.product_id === product_id 
                  ? { ...item, quantity: item.quantity + quantity } 
                  : item
              ),
            };
          }
          return { items: [...state.items, { product_id, quantity }] };
        });
      },
      
      addToCart: (variant_id, quantity) =>
        set((state) => {
          const existingItem = state.items.find((item) => item.variant_id === variant_id);
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.variant_id === variant_id ? { ...item, quantity: item.quantity + quantity } : item
              ),
            };
          }
          return { items: [...state.items, { variant_id, product_id: '', quantity }] };
        }),
        
      removeFromCart: (variant_id) =>
        set((state) => ({
          items: state.items.filter((item) => item.variant_id !== variant_id),
        })),
        
      updateQuantity: (variant_id, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.variant_id === variant_id ? { ...item, quantity } : item
          ),
        })),
        
      clearCart: () => set({ items: [] }),
      
      getCartCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
