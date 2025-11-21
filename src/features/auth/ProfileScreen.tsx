import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Card, ActivityIndicator } from 'react-native-paper';
import { useAuthStore } from '../../state/useAuthStore';
import { supabase } from '../../api/supabaseClient';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const session = useAuthStore((state) => state.session);
  const setSession = useAuthStore((state) => state.setSession);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [profile, setProfile] = useState({
    full_name: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    postal_code: ''
  });

  useEffect(() => {
    if (!session) {
      router.replace('/login');
      return;
    }
    fetchProfile();
  }, [session]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session?.user.id)
        .single();

      if (error) throw error;
      
      if (data) {
        setProfile({
          full_name: data.full_name || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          country: data.country || '',
          postal_code: data.postal_code || ''
        });
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          address: profile.address,
          city: profile.city,
          country: profile.country,
          postal_code: profile.postal_code,
          updated_at: new Date().toISOString()
        })
        .eq('id', session?.user.id);

      if (error) throw error;
      
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      router.replace('/login');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Profile</Text>
      
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="bodyMedium" style={styles.label}>Email</Text>
          <Text variant="bodyLarge" style={styles.email}>{session?.user.email}</Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <TextInput
            label="Full Name"
            value={profile.full_name}
            onChangeText={(text) => setProfile({ ...profile, full_name: text })}
            mode="outlined"
            style={styles.input}
          />
          
          <TextInput
            label="Phone"
            value={profile.phone}
            onChangeText={(text) => setProfile({ ...profile, phone: text })}
            mode="outlined"
            style={styles.input}
            keyboardType="phone-pad"
          />
          
          <TextInput
            label="Address"
            value={profile.address}
            onChangeText={(text) => setProfile({ ...profile, address: text })}
            mode="outlined"
            style={styles.input}
            multiline
          />
          
          <TextInput
            label="City"
            value={profile.city}
            onChangeText={(text) => setProfile({ ...profile, city: text })}
            mode="outlined"
            style={styles.input}
          />
          
          <TextInput
            label="Country"
            value={profile.country}
            onChangeText={(text) => setProfile({ ...profile, country: text })}
            mode="outlined"
            style={styles.input}
          />
          
          <TextInput
            label="Postal Code"
            value={profile.postal_code}
            onChangeText={(text) => setProfile({ ...profile, postal_code: text })}
            mode="outlined"
            style={styles.input}
          />
          
          <Button 
            mode="contained" 
            onPress={handleSave}
            loading={saving}
            disabled={saving}
            style={styles.saveButton}
          >
            Save Changes
          </Button>
        </Card.Content>
      </Card>

      <Button 
        mode="outlined" 
        onPress={handleLogout}
        style={styles.logoutButton}
        textColor="#ef4444"
      >
        Logout
      </Button>
    </ScrollView>
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
  card: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  label: {
    color: '#666',
    marginBottom: 4,
  },
  email: {
    fontWeight: '600',
  },
  input: {
    marginBottom: 12,
  },
  saveButton: {
    marginTop: 8,
  },
  logoutButton: {
    margin: 16,
    borderColor: '#ef4444',
  },
});
