import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  ActivityIndicator,
  Chip,
  ProgressBar,
  IconButton,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import {
  analyzeSpaceForProduct,
  SpaceAnalysisResult,
  ProductDetails,
} from '../../api/geminiService';

interface SpaceAnalyzerProps {
  product: ProductDetails;
  onClose?: () => void;
}

export default function SpaceAnalyzer({ product, onClose }: SpaceAnalyzerProps) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<SpaceAnalysisResult | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      setHasPermission(
        cameraPermission.status === 'granted' && mediaPermission.status === 'granted'
      );
    } catch (error) {
      console.error('Error requesting permissions:', error);
      setHasPermission(false);
    }
  };

  const captureImage = async () => {
    if (hasPermission === false) {
      Alert.alert(
        'Permission Required',
        'Please grant camera permissions to use this feature'
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setAnalysis(null); // Reset previous analysis
      }
    } catch (error: any) {
      console.error('Error capturing image:', error);
      Alert.alert('Error', 'Failed to capture image');
    }
  };

  const pickImage = async () => {
    if (hasPermission === false) {
      Alert.alert(
        'Permission Required',
        'Please grant media library permissions to use this feature'
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setAnalysis(null); // Reset previous analysis
      }
    } catch (error: any) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const analyzeSpace = async () => {
    if (!imageUri) {
      Alert.alert('No Image', 'Please capture or select an image first');
      return;
    }

    try {
      setAnalyzing(true);
      console.log('🤖 Starting AI analysis...');
      
      const result = await analyzeSpaceForProduct(imageUri, product);
      
      setAnalysis(result);
      console.log('✅ Analysis complete:', result);
    } catch (error: any) {
      console.error('Analysis error:', error);
      Alert.alert('Analysis Failed', error.message || 'Please try again');
    } finally {
      setAnalyzing(false);
    }
  };

  const getSuitabilityColor = (score: number): string => {
    if (score >= 80) return '#10b981'; // Green
    if (score >= 60) return '#f59e0b'; // Orange
    if (score >= 40) return '#ef4444'; // Red
    return '#dc2626'; // Dark red
  };

  const getMatchColor = (match: string): string => {
    switch (match.toLowerCase()) {
      case 'excellent':
        return '#10b981';
      case 'good':
        return '#84cc16';
      case 'fair':
        return '#f59e0b';
      case 'poor':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="scan-outline" size={28} color="#4285f4" />
          <Text variant="headlineSmall" style={styles.title}>
            AI Space Analyzer
          </Text>
        </View>
        {onClose && (
          <IconButton icon="close" size={24} onPress={onClose} />
        )}
      </View>

      <Card style={styles.productCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.productName}>
            Analyzing for: {product.name}
          </Text>
          <Text variant="bodySmall" style={styles.productCategory}>
            {product.category}
            {product.color && ` • ${product.color}`}
            {product.material && ` • ${product.material}`}
          </Text>
        </Card.Content>
      </Card>

      {/* Image Capture Section */}
      {!imageUri ? (
        <View style={styles.captureSection}>
          <Ionicons name="camera-outline" size={80} color="#9ca3af" />
          <Text variant="titleMedium" style={styles.captureText}>
            Capture Your Space
          </Text>
          <Text variant="bodyMedium" style={styles.captureSubtext}>
            Take or select a photo of the room where you want to place this item
          </Text>

          <View style={styles.captureButtons}>
            <Button
              mode="contained"
              icon="camera"
              onPress={captureImage}
              style={styles.button}
            >
              Take Photo
            </Button>
            <Button
              mode="outlined"
              icon="image"
              onPress={pickImage}
              style={styles.button}
            >
              Choose from Gallery
            </Button>
          </View>
        </View>
      ) : (
        <View style={styles.imageSection}>
          <Image source={{ uri: imageUri }} style={styles.image} />
          <View style={styles.imageActions}>
            <Button mode="text" icon="close" onPress={() => setImageUri(null)}>
              Remove
            </Button>
            <Button mode="text" icon="refresh" onPress={captureImage}>
              Retake
            </Button>
          </View>

          {!analysis && (
            <Button
              mode="contained"
              onPress={analyzeSpace}
              loading={analyzing}
              disabled={analyzing}
              style={styles.analyzeButton}
              icon="star-outline"
            >
              {analyzing ? 'Analyzing with AI...' : 'Analyze Space'}
            </Button>
          )}
        </View>
      )}

      {/* Analysis Results */}
      {analyzing && (
        <Card style={styles.loadingCard}>
          <Card.Content>
            <ActivityIndicator size="large" color="#4285f4" />
            <Text variant="titleMedium" style={styles.loadingText}>
              AI is analyzing your space...
            </Text>
            <Text variant="bodySmall" style={styles.loadingSubtext}>
              Evaluating colors, style, and compatibility
            </Text>
          </Card.Content>
        </Card>
      )}

      {analysis && !analyzing && (
        <View style={styles.resultsSection}>
          {/* Suitability Score */}
          <Card style={styles.scoreCard}>
            <Card.Content>
              <View style={styles.scoreHeader}>
                <Text variant="titleLarge">Suitability Score</Text>
                <Text
                  variant="displaySmall"
                  style={[
                    styles.scoreValue,
                    { color: getSuitabilityColor(analysis.suitabilityScore) },
                  ]}
                >
                  {analysis.suitabilityScore}%
                </Text>
              </View>
              <ProgressBar
                progress={analysis.suitabilityScore / 100}
                color={getSuitabilityColor(analysis.suitabilityScore)}
                style={styles.progressBar}
              />
              <View style={styles.suitabilityBadge}>
                <Ionicons
                  name={analysis.suitable ? 'checkmark-circle' : 'close-circle'}
                  size={24}
                  color={analysis.suitable ? '#10b981' : '#ef4444'}
                />
                <Text
                  variant="titleMedium"
                  style={[
                    styles.suitabilityText,
                    { color: analysis.suitable ? '#10b981' : '#ef4444' },
                  ]}
                >
                  {analysis.suitable ? 'Suitable for this space' : 'Not ideal for this space'}
                </Text>
              </View>
            </Card.Content>
          </Card>

          {/* Match Details */}
          <Card style={styles.matchCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Compatibility Analysis
              </Text>
              
              <View style={styles.matchRow}>
                <View style={styles.matchItem}>
                  <Text variant="bodyMedium" style={styles.matchLabel}>
                    Color Match
                  </Text>
                  <Chip
                    mode="flat"
                    style={[
                      styles.matchChip,
                      { backgroundColor: getMatchColor(analysis.colorMatch) + '20' },
                    ]}
                    textStyle={{ color: getMatchColor(analysis.colorMatch) }}
                  >
                    {analysis.colorMatch.toUpperCase()}
                  </Chip>
                </View>

                <View style={styles.matchItem}>
                  <Text variant="bodyMedium" style={styles.matchLabel}>
                    Style Match
                  </Text>
                  <Chip
                    mode="flat"
                    style={[
                      styles.matchChip,
                      { backgroundColor: getMatchColor(analysis.styleMatch) + '20' },
                    ]}
                    textStyle={{ color: getMatchColor(analysis.styleMatch) }}
                  >
                    {analysis.styleMatch.toUpperCase()}
                  </Chip>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Reasoning */}
          <Card style={styles.reasoningCard}>
            <Card.Content>
              <View style={styles.reasoningHeader}>
                <Ionicons name="bulb-outline" size={24} color="#f59e0b" />
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  AI Insights
                </Text>
              </View>
              <Text variant="bodyMedium" style={styles.reasoningText}>
                {analysis.reasoning}
              </Text>
            </Card.Content>
          </Card>

          {/* Recommendations */}
          <Card style={styles.recommendationsCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Recommendations
              </Text>
              {analysis.recommendations.map((rec, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#10b981" />
                  <Text variant="bodyMedium" style={styles.recommendationText}>
                    {rec}
                  </Text>
                </View>
              ))}
            </Card.Content>
          </Card>

          {/* Alternative Colors */}
          <Card style={styles.colorsCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Alternative Colors for This Space
              </Text>
              <View style={styles.colorChips}>
                {analysis.alternativeColors.map((color, index) => (
                  <Chip
                    key={index}
                    mode="outlined"
                    icon="palette"
                    style={styles.colorChip}
                  >
                    {color}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>

          {/* Action Button */}
          <Button
            mode="contained"
            icon="refresh"
            onPress={() => {
              setImageUri(null);
              setAnalysis(null);
            }}
            style={styles.newAnalysisButton}
          >
            Analyze Another Space
          </Button>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontWeight: 'bold',
  },
  productCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  productName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  productCategory: {
    color: '#6b7280',
  },
  captureSection: {
    alignItems: 'center',
    padding: 32,
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
  },
  captureText: {
    marginTop: 16,
    fontWeight: '600',
  },
  captureSubtext: {
    marginTop: 8,
    textAlign: 'center',
    color: '#6b7280',
  },
  captureButtons: {
    marginTop: 24,
    gap: 12,
    width: '100%',
  },
  button: {
    width: '100%',
  },
  imageSection: {
    margin: 16,
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  analyzeButton: {
    marginTop: 16,
  },
  loadingCard: {
    margin: 16,
    padding: 24,
    elevation: 2,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '600',
  },
  loadingSubtext: {
    textAlign: 'center',
    marginTop: 8,
    color: '#6b7280',
  },
  resultsSection: {
    padding: 16,
    gap: 16,
  },
  scoreCard: {
    elevation: 3,
    backgroundColor: '#fff',
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreValue: {
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 16,
  },
  suitabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  suitabilityText: {
    fontWeight: '600',
  },
  matchCard: {
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  matchRow: {
    flexDirection: 'row',
    gap: 16,
  },
  matchItem: {
    flex: 1,
  },
  matchLabel: {
    color: '#6b7280',
    marginBottom: 8,
  },
  matchChip: {
    alignSelf: 'flex-start',
  },
  reasoningCard: {
    elevation: 2,
  },
  reasoningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  reasoningText: {
    lineHeight: 22,
    color: '#374151',
  },
  recommendationsCard: {
    elevation: 2,
  },
  recommendationItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  recommendationText: {
    flex: 1,
    lineHeight: 20,
  },
  colorsCard: {
    elevation: 2,
  },
  colorChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorChip: {
    marginBottom: 4,
  },
  newAnalysisButton: {
    marginTop: 8,
    marginBottom: 24,
  },
});
