/// <reference path="../../types/model-viewer.d.ts" />
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

// Web AR using model-viewer (WebXR)
// Type definitions are in src/types/model-viewer.d.ts (global)
export default function WebAR() {
  const { modelUrl } = useLocalSearchParams();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    let cancelled = false;

    const initModelViewer = async () => {
      try {
        if (typeof window === 'undefined') {
          return;
        }

        if (!window.customElements?.get('model-viewer')) {
          await import('@google/model-viewer');
        }

        if (!cancelled) {
          setIsReady(true);
        }
      } catch (error) {
        console.warn('Failed to load @google/model-viewer', error);
        if (!cancelled) {
          setLoadError('Failed to load 3D viewer. Check console for details.');
        }
      }
    };

    initModelViewer();

    return () => {
      cancelled = true;
    };
  }, []);

  if (Platform.OS !== 'web') {
    return null;
  }

  if (loadError) {
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.messageTitle}>Unable to load Web AR</Text>
        <Text style={styles.messageBody}>{loadError}</Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285f4" />
        <Text style={styles.loadingText}>Loading Web AR viewer...</Text>
      </View>
    );
  }

  if (!modelUrl) {
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.messageTitle}>No model selected</Text>
        <Text style={styles.messageBody}>
          We couldn't find a 3D model URL for this product.
        </Text>
        <Text style={styles.messageHint}>
          Ensure the product has a valid `model_url` field in Supabase.
        </Text>
      </View>
    );
  }

  useEffect(() => {
    if (!isReady || !modelUrl || Platform.OS !== 'web') {
      return;
    }

    const root = containerRef.current;
    if (!root) return;

    root.innerHTML = '';

    Object.assign(root.style, {
      width: '100%',
      height: '100%',
      position: 'relative',
    });

    // Determine model URL - if no modelUrl or not a URL, use local asset
    let finalModelUrl = modelUrl as string;
    if (!modelUrl || (!finalModelUrl.startsWith('http://') && !finalModelUrl.startsWith('https://'))) {
      // For web, we need to use the asset via require and get its path
      // Since we're in web context, we'll use a placeholder or show error
      finalModelUrl = '/assets/Ir6mG6RXsTF6I_B2ZPQcW.glb';
    }

    const viewer = document.createElement('model-viewer');
    viewer.setAttribute('src', finalModelUrl);
    viewer.setAttribute('ar', '');
    viewer.setAttribute('ar-modes', 'webxr scene-viewer quick-look');
    viewer.setAttribute('camera-controls', '');
    viewer.setAttribute('shadow-intensity', '1');
    viewer.setAttribute('auto-rotate', '');
    viewer.setAttribute('loading', 'eager');
    viewer.setAttribute('exposure', '1');
    viewer.style.width = '100%';
    viewer.style.height = '100%';
    viewer.style.backgroundColor = '#000';

    const button = document.createElement('button');
    button.slot = 'ar-button';
    button.textContent = 'View in Your Space';
    Object.assign(button.style, arButtonStyles);

    viewer.appendChild(button);
    root.appendChild(viewer);

    const styleTag = document.createElement('style');
    styleTag.textContent = modelViewerStyles;
    root.appendChild(styleTag);

    return () => {
      root.innerHTML = '';
    };
  }, [isReady, modelUrl]);

  return (
    <View style={styles.container}>
      <View style={styles.webRoot}>
        <div ref={containerRef} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  webRoot: {
    flex: 1,
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
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 24,
  },
  messageTitle: {
    fontSize: 22,
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  messageBody: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 12,
  },
  messageHint: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});

const modelViewerStyles = `
  model-viewer {
    width: 100%;
    height: 100%;
    background-color: #000;
  }

  model-viewer #ar-button {
    position: absolute;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #4285f4;
    color: white;
    padding: 12px 24px;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    cursor: pointer;
    z-index: 1000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    transition: background-color 0.2s;
  }

  model-viewer #ar-button:hover {
    background-color: #3367d6;
  }

  model-viewer #ar-button:active {
    background-color: #2a56c6;
  }
`;

const arButtonStyles: Partial<CSSStyleDeclaration> = {
  position: 'absolute',
  bottom: '16px',
  left: '50%',
  transform: 'translateX(-50%)',
  backgroundColor: '#4285f4',
  color: '#fff',
  padding: '12px 24px',
  border: 'none',
  borderRadius: '4px',
  fontSize: '16px',
  cursor: 'pointer',
  zIndex: '1000',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  transition: 'background-color 0.2s',
};
