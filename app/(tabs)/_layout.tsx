import { Tabs, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/state/useAuthStore';
import { supabase } from '../../src/api/supabaseClient';

export default function TabLayout() {
  const [isAdmin, setIsAdmin] = useState(false);
  const session = useAuthStore((state) => state.session);

  useEffect(() => {
    checkAdminStatus();
  }, [session]);

  const checkAdminStatus = async () => {
    if (!session) return;
    
    try {
      const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();

      setIsAdmin(data?.is_admin || false);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerRight: () => isAdmin ? (
            <IconButton
              icon="shield-crown"
              size={24}
              onPress={() => router.push('/admin')}
            />
          ) : null,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-outline" color={color} size={size ?? 24} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cart-outline" color={color} size={size ?? 24} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-outline" color={color} size={size ?? 24} />
          ),
        }}
      />
    </Tabs>
  );
}
