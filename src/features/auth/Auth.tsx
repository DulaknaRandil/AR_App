import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, TextInput, Text } from 'react-native-paper';
import { supabase } from '../../api/supabaseClient';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) alert(error.message);
    setLoading(false);
  }

  async function signUpWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) alert(error.message);
    setLoading(false);
  }

  return (
    <View>
      <View>
        <TextInput
          label="Email"
          onChangeText={(text) => setEmail(text)}
          value={email}
          placeholder="email@address.com"
          autoCapitalize={'none'}
        />
      </View>
      <View>
        <TextInput
          label="Password"
          onChangeText={(text) => setPassword(text)}
          value={password}
          secureTextEntry={true}
          placeholder="Password"
          autoCapitalize={'none'}
        />
      </View>
      <View>
        <Button disabled={loading} onPress={() => signInWithEmail()}>
          Sign in
        </Button>
      </View>
      <View>
        <Button disabled={loading} onPress={() => signUpWithEmail()}>
          Sign up
        </Button>
      </View>
    </View>
  );
}
