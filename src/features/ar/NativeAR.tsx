import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Platform, Text, ActivityIndicator, NativeModules, TouchableOpacity, Alert } from 'react-native';
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

// Helper function to get the correct 3D model based on product name
const getModelSource = (productName?: string) => {
  if (!productName) {
    console.log('No product name provided, defaulting to chair.glb');
    return require('../../../assets/chair.glb');
  }
  
  const productLower = productName.toLowerCase();
  console.log('Loading model for product:', productName);
  
  // Match product names to their corresponding 3D models
  if (productLower.includes('sofa') || productLower.includes('couch')) {
    console.log('✅ Selected model: coffee_table.glb (temporary placeholder for sofa)');
    console.log('⚠️ NOTE: soviet_sofa.glb has Viro compatibility issues');
    console.log('💡 SOLUTION: Use a GLB converter to make soviet_sofa.glb Viro-compatible');
    console.log('   - Try: https://glb.xproduct.io/ or Blender export as GLB 2.0');
    // Using coffee_table as temporary working substitute until sofa is fixed
    return require('../../../assets/coffee_table.glb');
  } else if (productLower.includes('coffee') && productLower.includes('table')) {
    console.log('✅ Selected model: coffee_table.glb');
    return require('../../../assets/coffee_table.glb');
  } else if (productLower.includes('office') && productLower.includes('table')) {
    console.log('✅ Selected model: office_table.glb');
    return require('../../../assets/cabinet.glb');
  } else if (productLower.includes('audrey') || productLower.includes('pantry')) {
    console.log('✅ Selected model: cabinet.glb');
    return require('../../../assets/cabinet.glb');
  } else if (productLower.includes('chair') || productLower.includes('seat')) {
    console.log('✅ Selected model: chair.glb');
    return require('../../../assets/chair.glb');
  } else if (productLower.includes('table')) {
    console.log('✅ Selected model: coffee_table.glb (default table)');
    return require('../../../assets/coffee_table.glb');
  }
  
  // Default to chair if no match
  console.log('⚠️ No specific model match, defaulting to chair.glb');
  return require('../../../assets/chair.glb');
};

// Helper function to get initial scale based on product type
const getInitialScale = (productName?: string): number => {
  if (!productName) return 0.2;
  
  const productLower = productName.toLowerCase();
  
  // Different models may need different initial scales
  if (productLower.includes('sofa') || productLower.includes('couch')) {
    console.log('📏 Using initial scale 1.0 for sofa');
    return 1.0; // Sofas typically need larger scale
  } else if (productLower.includes('office') && productLower.includes('table')) {
    console.log('📏 Using initial scale 0.01 for office table');
    return 1.0; // Office tables are extremely large, need very small initial scale
  } else if (productLower.includes('table')) {
    console.log('📏 Using initial scale 0.5 for table');
    return 0.5; // Tables need medium scale
  } else if (productLower.includes('cabinet') || productLower.includes('storage')) {
    console.log('📏 Using initial scale 0.3 for cabinet');
    return 0.3; // Cabinets need slightly larger than chairs
  } else if (productLower.includes('chair') || productLower.includes('seat')) {
    console.log('📏 Using initial scale 0.2 for chair');
    return 0.2; // Chairs work well at 0.2
  }
  
  return 0.2; // Default scale
};

const createARScene = (
  ViroModule: ViroModuleType, 
  onModelLoadStart: () => void, 
  onModelLoadEnd: () => void, 
  onModelLoadError: () => void,
  scaleRef: React.MutableRefObject<[number, number, number]>,
  productName?: string
) => {
  const {
    ViroARScene,
    Viro3DObject,
    ViroAmbientLight,
    ViroARPlaneSelector,
    ViroNode,
    ViroSpotLight,
    ViroText,
  } = ViroModule;

  const ARScene = () => {
  const [isModelPlaced, setIsModelPlaced] = useState(false);
  const [placedPosition, setPlacedPosition] = useState<[number, number, number] | null>(null);
  const [modelRotation, setModelRotation] = useState<[number, number, number]>([0, 0, 0]);
  const [modelScale, setModelScale] = useState<[number, number, number]>(scaleRef.current);
  const [modelError, setModelError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [hasShownAlert, setHasShownAlert] = useState(false);

    const modelSource = getModelSource(productName);
    console.log('AR: Using local bundled model from assets/ for:', productName || 'default chair');
    
    // Update scale when external ref changes
    useEffect(() => {
      setModelScale(scaleRef.current);
    }, [scaleRef.current[0]]);

    const onRotate = (rotateState: number, rotationFactor: number) => {
      if (rotateState === 2) { // Continuous rotation
        setModelRotation(currentRotation => [
          currentRotation[0],
          currentRotation[1] + rotationFactor,
          currentRotation[2],
        ]);
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
        
        <ViroARPlaneSelector onPlaneSelected={(anchorPosition?: any) => {
          console.log('🎯 onPlaneSelected:', anchorPosition);
          // Extract the actual position array from the anchor object
          let actualPosition: [number, number, number];
          
          if (anchorPosition && anchorPosition.position && Array.isArray(anchorPosition.position)) {
            // Position is in anchorPosition.position array
            actualPosition = [anchorPosition.position[0], anchorPosition.position[1], anchorPosition.position[2]];
            console.log('📍 Placing model at plane position:', actualPosition);
          } else if (anchorPosition && Array.isArray(anchorPosition)) {
            // Position is directly the array
            actualPosition = [anchorPosition[0], anchorPosition[1], anchorPosition[2]];
            console.log('📍 Placing model at position:', actualPosition);
          } else {
            // Default position 1 meter in front
            actualPosition = [0, -0.5, -1];
            console.log('📍 Using default position:', actualPosition);
          }
          
          setPlacedPosition(actualPosition);
          setIsModelPlaced(true);
        }}>
          {isModelPlaced && (
            <ViroNode
              position={placedPosition ?? [0, 0, -1]} // Use the actual plane-selected position
              dragType="FixedToWorld"
              onDrag={() => {
                console.log('📦 Model is being dragged');
              }}
            >
              {/* Debug markers */}
              <ViroText
                text="⬆️ UP"
                scale={[0.2, 0.2, 0.2]}
                position={[0, 0.5, 0]}
                style={{ color: '#00ff00', fontSize: 30, fontWeight: 'bold' }}
              />
              <ViroText
                text="⬇️ DOWN"
                scale={[0.2, 0.2, 0.2]}
                position={[0, -0.5, 0]}
                style={{ color: '#ff0000', fontSize: 30, fontWeight: 'bold' }}
              />
              <ViroText
                text={`Scale: ${modelScale[0].toFixed(2)}`}
                scale={[0.15, 0.15, 0.15]}
                position={[0, 0.7, 0]}
                style={{ color: '#ffffff', fontSize: 20 }}
              />
              {!modelError && (
                <Viro3DObject
                  source={modelSource}
                  position={[0, 0, 0]}
                  rotation={modelRotation}
                  scale={modelScale}
                  type="GLB"
                  onRotate={onRotate}
                  onLoadStart={() => {
                    if (!isLoading && !modelLoaded) {
                      console.log('🔄 Loading model for:', productName || 'default');
                      setIsLoading(true);
                      setModelError(false);
                      setModelLoaded(false);
                      onModelLoadStart();
                    }
                  }}
                  onLoadEnd={() => {
                    if (!modelLoaded) {
                      console.log('✅ Model loaded successfully for:', productName || 'default');
                      console.log('📏 Current scale:', modelScale);
                      console.log('📍 Current position:', placedPosition);
                      console.log('🔄 Current rotation:', modelRotation);
                      console.log('💡 TIP: If you see the green UP and red DOWN markers but no model:');
                      console.log('   - Try pinching OUT with 2 fingers to make it bigger');
                      console.log('   - The model might be very small or very large');
                      console.log('   - Look around the markers - model might be offset');
                      setIsLoading(false);
                      setModelLoaded(true);
                      onModelLoadEnd();
                      // Show success alert only once
                      if (!hasShownAlert) {
                        setHasShownAlert(true);
                        setTimeout(() => {
                          Alert.alert(
                            '✅ Model Loaded',
                            `${productName || 'Model'} loaded!\n\nLook for GREEN (UP) and RED (DOWN) markers.\n\nUse + and - buttons to resize\nCurrent scale: ${modelScale[0].toFixed(2)}`,
                            [{ text: 'Got it!' }]
                          );
                        }, 100);
                      }
                    }
                  }}
                  onError={(event) => {
                    // Sometimes onError fires even after successful load - ignore if already loaded
                    if (modelLoaded) {
                      console.log('⚠️ Ignoring error event - model already loaded successfully');
                      return;
                    }
                    console.error('❌ Model loading failed for:', productName || 'default');
                    console.error('Error type:', event?.nativeEvent?.error || 'Unknown error');
                    console.error('Check if the GLB file is a valid GLB/GLTF 2.0 file');
                    console.error('Try validating at: https://gltf-viewer.donmccurdy.com/');
                    setModelError(true);
                    setIsLoading(false);
                    onModelLoadError();
                    // Show error alert
                    Alert.alert(
                      '❌ Model Error',
                      `Failed to load ${productName || 'model'}. Please check if the file is valid.`,
                      [{ text: 'OK' }]
                    );
                  }}
                />
              )}
              {modelError && (
                <ViroText
                  text={`⚠️ Model Error\n${productName || 'Model'} failed to load\nCheck if GLB file is valid`}
                  scale={[0.5, 0.5, 0.5]}
                  position={[0, 0.5, 0]}
                  style={{ color: '#ff0000', fontSize: 30, fontWeight: 'bold' }}
                />
              )}
              {isLoading && !modelError && (
                <ViroText
                  text="Loading 3D Model..."
                  scale={[0.4, 0.4, 0.4]}
                  position={[0, 0.5, 0]}
                  style={{ color: '#4285f4', fontSize: 30, fontWeight: 'bold' }}
                />
              )}
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

  const params = useLocalSearchParams<{ productId?: string; productName?: string }>();
  const [viroModule, setViroModule] = useState<ViroModuleType | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);

  console.log('NativeAR launched for product:', params.productName || 'Unknown');

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
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [modelLoadSuccess, setModelLoadSuccess] = useState(false);
  
  // Get initial scale based on product type
  const initialScale = useMemo(() => getInitialScale(params.productName), [params.productName]);
  const [currentScale, setCurrentScale] = useState(initialScale);
  const scaleRef = React.useRef<[number, number, number]>([initialScale, initialScale, initialScale]);
  
  const handleScaleIncrease = () => {
    const newScale = Math.min(currentScale + 0.1, 10.0);
    setCurrentScale(newScale);
    scaleRef.current = [newScale, newScale, newScale];
    console.log('➕ Scale increased to:', newScale.toFixed(2));
  };
  
  const handleScaleDecrease = () => {
    const newScale = Math.max(currentScale - 0.1, 0.01);
    setCurrentScale(newScale);
    scaleRef.current = [newScale, newScale, newScale];
    console.log('➖ Scale decreased to:', newScale.toFixed(2));
  };
  
  const ARScene = useMemo(() => {
    if (!viroModule) return null;
    return createARScene(
      viroModule,
      () => setIsModelLoading(true),
      () => {
        setIsModelLoading(false);
        setModelLoadSuccess(true);
      },
      () => {
        setIsModelLoading(false);
        setModelLoadSuccess(false);
      },
      scaleRef,
      params.productName // Pass product name to AR scene
    );
  }, [viroModule, params.productName]);

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
      
      {/* Loading Overlay */}
      {isModelLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loaderCard}>
            <ActivityIndicator size="large" color="#4285f4" />
            <Text style={styles.loaderText}>Loading 3D Model...</Text>
            <Text style={styles.loaderSubtext}>Please wait</Text>
          </View>
        </View>
      )}
      
      {/* Instructions Overlay */}
      {showInstructions && !isModelLoading && (
        <View style={styles.instructionsOverlay}>
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsTitle}>
              {params.productName ? `🪑 ${params.productName} AR` : '🪑 AR Furniture Controls'}
            </Text>
            <Text style={styles.instructionText}>➕➖ Use + and - buttons to resize</Text>
            <Text style={styles.instructionText}>🔄 Use 2 fingers to ROTATE - spin model</Text>
            <Text style={styles.instructionText}>👆 Use 1 finger to DRAG - move around</Text>
            <Text style={styles.instructionText}>📍 Tap a surface to place model</Text>
            
            <TouchableOpacity 
              style={styles.gotItButton}
              onPress={() => setShowInstructions(false)}
            >
              <Text style={styles.gotItText}>Start AR Experience</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Scale Control Buttons */}
      {!isModelLoading && (
        <View style={styles.scaleControls}>
          <TouchableOpacity 
            style={styles.scaleButton}
            onPress={handleScaleDecrease}
          >
            <Text style={styles.scaleButtonText}>-</Text>
          </TouchableOpacity>
          <View style={styles.scaleDisplay}>
            <Text style={styles.scaleDisplayText}>{currentScale.toFixed(1)}x</Text>
          </View>
          <TouchableOpacity 
            style={styles.scaleButton}
            onPress={handleScaleIncrease}
          >
            <Text style={styles.scaleButtonText}>+</Text>
          </TouchableOpacity>
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    zIndex: 1000,
  },
  loaderCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    minWidth: 200,
  },
  loaderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  loaderSubtext: {
    color: '#999',
    fontSize: 14,
    marginTop: 8,
  },
  scaleControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  scaleButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4285f4',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  scaleButtonText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  scaleDisplay: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  scaleDisplayText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
