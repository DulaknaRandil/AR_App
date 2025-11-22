import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

// Direct imports - React.lazy() is not supported in React Native production builds
import NativeAR from '../src/features/ar/NativeAR';
import WebAR from '../src/features/ar/WebAR';

export default function ARScreen() {
  console.log('ARScreen component rendering, Platform:', Platform.OS);
  
  return (
    <View style={styles.container}>
      {Platform.OS === 'web' ? <WebAR /> : <NativeAR />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
