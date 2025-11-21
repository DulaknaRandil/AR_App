import React, { Suspense, lazy } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator, Text } from 'react-native';

// Lazy load AR components based on platform
const NativeAR = lazy(() => 
  Platform.OS !== 'web' 
    ? import('../src/features/ar/NativeAR')
    : Promise.resolve({ default: () => null })
);

const WebAR = lazy(() => 
  Platform.OS === 'web' 
    ? import('../src/features/ar/WebAR')
    : Promise.resolve({ default: () => null })
);

export default function ARScreen() {
  console.log('ARScreen component rendering, Platform:', Platform.OS);
  
  return (
    <View style={styles.container}>
      <Suspense fallback={<LoadingFallback />}>
        {Platform.OS === 'web' ? <WebAR /> : <NativeAR />}
      </Suspense>
    </View>
  );
}

function LoadingFallback() {
  console.log('AR Loading Fallback displayed');
  
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#4285f4" />
      <Text style={styles.loadingText}>Loading AR Experience...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    marginTop: 16,
    color: '#fff',
    fontSize: 16,
  },
});
