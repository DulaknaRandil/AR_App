import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, TextInput, Button, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../src/api/supabaseClient';

export default function ResetPassword() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const access_token = (params as any).access_token as string | undefined;
  const refresh_token = (params as any).refresh_token as string | undefined;

  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  useEffect(() => {
    // If the deep link provided an access token, set the session so the user is authenticated
    const init = async () => {
      try {
        if (access_token) {
          // Set session from token so we can call updateUser
          await supabase.auth.setSession({ access_token, refresh_token });
          console.log('Session set from deep link token');
        } else {
          console.log('No access_token in params; cannot set session automatically');
        }
      } catch (err) {
        console.error('Error setting session from token:', err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [access_token, refresh_token]);

  const handleChangePassword = async () => {
    if (!password || password.length < 6) {
      Alert.alert('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Passwords do not match');
      return;
    }

    setChanging(true);
    try {
      // Requires an authenticated session; we set it above from the deep link token
      const { data, error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      Alert.alert('Success', 'Password updated. Please sign in with your new password.');
      router.replace('/login');
    } catch (err: any) {
      console.error('Update password error:', err);
      Alert.alert('Error', err.message || 'Failed to update password');
    } finally {
      setChanging(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // If no access_token present, show instructions
  if (!access_token) {
    return (
      <View style={styles.container}>
        <Text variant="headlineSmall" style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>No reset token was found in the link. Please make sure you opened the link from the email, or request a new password reset.</Text>
        <Button mode="contained" onPress={() => router.replace('/forgot-password')}>Request Reset Email</Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>Choose a New Password</Text>
      <TextInput
        label="New password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Confirm password"
        secureTextEntry
        value={confirm}
        onChangeText={setConfirm}
        mode="outlined"
        style={styles.input}
      />
      <Button mode="contained" onPress={handleChangePassword} loading={changing} disabled={changing}>
        Set New Password
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#666',
  },
  input: {
    marginBottom: 12,
  },
});