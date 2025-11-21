import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, Button, Text, ActivityIndicator } from 'react-native-paper';
import { supabase } from '../src/api/supabaseClient';
import { router } from 'expo-router';

function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendReset = async () => {
    if (!email) {
      Alert.alert('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      // Supabase v2: send password reset email with deep link back to the app
      const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'myapp://reset'
      });
      if (error) throw error;

      Alert.alert(
        'Email Sent',
        'If an account with that email exists, a password recovery email has been sent.'
      );
      router.replace('/login');
    } catch (error: any) {
      console.error('Reset password error:', error);
      Alert.alert('Error', error.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text variant="headlineSmall" style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter the email associated with your account and we'll send a recovery link.</Text>

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
          disabled={loading}
        />

        <Button
          mode="contained"
          onPress={handleSendReset}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Send Reset Email
        </Button>

        <Button mode="text" onPress={() => router.replace('/login')} disabled={loading}>
          Back to Sign In
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  content: {
    padding: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.8,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    marginBottom: 8,
  },
});

export default ForgotPasswordScreen;