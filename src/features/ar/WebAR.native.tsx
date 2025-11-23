import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Stub component for native platforms
export default function WebAR() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Web AR is not available on native platforms</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  text: {
    color: '#fff',
    fontSize: 16,
  },
});
