import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Platform, Text, ActivityIndicator, NativeModules, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

type ViroModuleType = typeof import('@reactvision/react-viro');

const MissingNativeModuleMessage = () => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorTitle}>Native AR Not Available</Text>
    <Text style={styles.errorText}>
      This build does not include the Viro AR native module.
    </Text>
    <Text style={styles.errorText}>
      Build a custom development client with:
    </Text>
    <Text style={styles.errorCode}>eas build --profile development --platform android</Text>
    <Text style={styles.errorHint}>
      After installing the dev client, run `npx expo start --dev-client` and scan the QR code.
    </Text>
  </View>
);

const LoadingNativeAR = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#4285f4" />
    <Text style={styles.loadingText}>Preparing native AR...</Text>
  </View>
);

const createARScene = (ViroModule: ViroModuleType) => {
  const {
    ViroARScene,
    Viro3DObject,
    ViroAmbientLight,
    ViroARPlaneSelector,
    ViroNode,
    ViroSpotLight,
  } = ViroModule;

  const ARScene = () => {
  const [isModelPlaced, setIsModelPlaced] = useState(false);
  const [placedPosition, setPlacedPosition] = useState<[number, number, number] | null>(null);
  const [modelRotation, setModelRotation] = useState<[number, number, number]>([0, 0, 0]);
  const [modelScale, setModelScale] = useState<[number, number, number]>([0.3, 0.3, 0.3]);

    const onRotate = (rotateState: number, rotationFactor: number) => {
      if (rotateState === 2) { // Continuous rotation
        setModelRotation(currentRotation => [
          currentRotation[0],
          currentRotation[1] + rotationFactor,
          currentRotation[2],
        ]);
      }
    };

    const onPinch = (pinchState: number, scaleFactor: number) => {
      if (pinchState === 2) { // Continuous pinch
        const newScale = modelScale[0] * scaleFactor;
        const clampedScale = Math.max(0.05, Math.min(3.0, newScale));
        setModelScale([clampedScale, clampedScale, clampedScale]);
      }
    };

    return (
      <ViroARScene onTrackingUpdated={(state) => {
        // state values: 0=UNKNOWN,1=LIMITED,2=RELOCALIZING,3=TRACKING_NORMAL (Viro uses integers)
        console.log('onTrackingUpdated state =', state);
        if (state === 3 /* TRACKING_NORMAL */ && !isModelPlaced) {
          console.log('AR tracking is normal. Ready to place model. Move device slowly to find horizontal surfaces.');
        } else if (state !== 3) {
          console.log('AR tracking not yet normal. State:', state);
        }
      }}>
        <ViroAmbientLight color="#ffffff" intensity={1000} />
        
        <ViroARPlaneSelector onPlaneSelected={(position?: any, planeAnchor?: any) => {
          console.log('onPlaneSelected:', { position, planeAnchor });
          // position is [x,y,z] in world coordinates where the user tapped the plane
          if (position && Array.isArray(position)) {
            setPlacedPosition([position[0], position[1], position[2]]);
          }
          setIsModelPlaced(true);
        }}>
          {isModelPlaced && (
            <ViroNode
              position={placedPosition ?? [0, 0, 0]} // Use the actual plane-selected position
              dragType="FixedToWorld"
              onDrag={() => {}}
            >
              <Viro3DObject
                source={require('../../../assets/Ir6mG6RXsTF6I_B2ZPQcW.glb')}
                position={[0, 0, 0]}
                rotation={modelRotation}
                scale={modelScale}
                type="GLB"
                onRotate={onRotate}
                onPinch={onPinch}
                onLoadStart={() => console.log('Model loading...')}
                onLoadEnd={() => console.log('Model loaded!')}
                onError={(error) => console.error('Model error:', error)}
              />
            </ViroNode>
          )}
        </ViroARPlaneSelector>
      </ViroARScene>
    );
};

  return ARScene;
};

export default function NativeAR() {
  if (Platform.OS === 'web') {
    return null;
  }

  const [viroModule, setViroModule] = useState<ViroModuleType | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const ensureNativeModule = () => {
      console.log('Checking for Viro native modules...');
      const hasModule =
        !!NativeModules?.VRTARSceneNavigator ||
        !!NativeModules?.VRTARSceneNavigatorModule ||
        !!NativeModules?.VRTRenderingModule;

      console.log('Native modules check:', {
        VRTARSceneNavigator: !!NativeModules?.VRTARSceneNavigator,
        VRTARSceneNavigatorModule: !!NativeModules?.VRTARSceneNavigatorModule,
        VRTRenderingModule: !!NativeModules?.VRTRenderingModule,
        hasModule
      });

      if (!hasModule) {
        setLoadError('missing-native');
        return false;
      }
      return true;
    };

    const loadViro = async () => {
      try {
        console.log('Starting Viro module load...');
        if (!ensureNativeModule()) {
          return;
        }

        console.log('Importing @reactvision/react-viro...');
        const module = await import('@reactvision/react-viro');
        console.log('Viro module loaded successfully!');
        if (isMounted) {
          setViroModule(module);
        }
      } catch (error) {
        console.error('Failed to load ViroReact module:', error);
        if (isMounted) {
          setLoadError('load-failed');
        }
      }
    };

    loadViro();

    return () => {
      isMounted = false;
    };
  }, []);

  const ViroARSceneNavigator = useMemo(() => viroModule?.ViroARSceneNavigator, [viroModule]);
  const ARScene = useMemo(() => (viroModule ? createARScene(viroModule) : null), [viroModule]);

  if (loadError === 'missing-native') {
    return <MissingNativeModuleMessage />;
  }

  if (loadError === 'load-failed') {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Unable to load Viro AR</Text>
        <Text style={styles.errorText}>
          Something went wrong loading the ViroReact module.
        </Text>
        <Text style={styles.errorHint}>Check Metro logs for details.</Text>
      </View>
    );
  }

  if (!viroModule || !ViroARSceneNavigator || !ARScene) {
    return <LoadingNativeAR />;
  }

  return (
    <View style={styles.container}>
      <ViroARSceneNavigator
        autofocus={true}
        initialScene={{
          scene: ARScene,
        }}
        style={styles.f1}
      />
      
      {/* Instructions Overlay */}
      {showInstructions && (
        <View style={styles.instructionsOverlay}>
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsTitle}>🪑 AR Furniture Controls</Text>
            <Text style={styles.instructionText}>✌️ Use 2 fingers to PINCH - resize model</Text>
            <Text style={styles.instructionText}>� Use 2 fingers to ROTATE - spin model</Text>
            <Text style={styles.instructionText}>👆 Use 1 finger to DRAG - move around</Text>
            <Text style={styles.instructionText}>� The model appears in front of you</Text>
            
            <TouchableOpacity 
              style={styles.gotItButton}
              onPress={() => setShowInstructions(false)}
            >
              <Text style={styles.gotItText}>Start AR Experience</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  f1: { flex: 1 },
  container: {
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorCode: {
    fontSize: 14,
    color: '#4285f4',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    backgroundColor: '#1a1a1a',
    padding: 10,
    borderRadius: 4,
    marginVertical: 10,
  },
  errorHint: {
    fontSize: 14,
    color: '#888',
    marginTop: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  instructionsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  instructionsCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#333',
  },
  instructionsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 12,
    lineHeight: 24,
  },
  gotItButton: {
    backgroundColor: '#4285f4',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  gotItText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  hintOverlay: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    padding: 12,
  },
  hintText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
});
