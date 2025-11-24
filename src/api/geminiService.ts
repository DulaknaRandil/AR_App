import { GoogleGenerativeAI } from '@google/generative-ai';
import * as FileSystem from 'expo-file-system/legacy';

// Initialize Gemini AI with API key
const API_KEY = _____API_KEY__; // Replace with your actual API key
const genAI = new GoogleGenerativeAI(API_KEY);

export interface SpaceAnalysisResult {
  suitable: boolean;
  suitabilityScore: number; // 0-100
  colorMatch: string;
  styleMatch: string;
  recommendations: string[];
  alternativeColors: string[];
  reasoning: string;
}

export interface ProductDetails {
  name: string;
  description: string;
  category: string;
  color?: string;
  material?: string;
  dimensions?: {
    width: number;
    height: number;
    depth: number;
  };
  price: number;
}

/**
 * Convert image URI to base64 for Gemini API
 */
async function imageToBase64(uri: string): Promise<string> {
  try {
    // Use legacy API to read file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw new Error('Failed to process image');
  }
}

/**
 * Analyze space suitability using Google Gemini Vision AI
 */
export async function analyzeSpaceForProduct(
  imageUri: string,
  productDetails: ProductDetails
): Promise<SpaceAnalysisResult> {
  try {
    console.log('🔍 Starting space analysis with Gemini AI...');
    console.log('Product:', productDetails.name);

    // Convert image to base64
    const base64Image = await imageToBase64(imageUri);

    // Get the Gemini model with vision capabilities
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

    // Construct detailed prompt for analysis
    const prompt = `
You are an expert interior designer and space analyzer. Analyze this room/space image and determine if the following furniture item would be suitable for this location.

**Product Details:**
- Name: ${productDetails.name}
- Category: ${productDetails.category}
- Description: ${productDetails.description}
${productDetails.color ? `- Color: ${productDetails.color}` : ''}
${productDetails.material ? `- Material: ${productDetails.material}` : ''}
${productDetails.dimensions ? `- Dimensions: ${productDetails.dimensions.width}W x ${productDetails.dimensions.height}H x ${productDetails.dimensions.depth}D cm` : ''}
- Price: LKR ${productDetails.price}

**Analysis Requirements:**
Analyze the space image and provide:

1. **Suitability Score (0-100)**: Rate how well this item fits the space
2. **Is Suitable (Yes/No)**: Based on score > 60
3. **Color Harmony**: Does the item's color match or complement the room's color scheme?
4. **Style Compatibility**: Does the item's style match the room's aesthetic?
5. **Alternative Colors**: Suggest 3 colors that would work better in this space
6. **Recommendations**: Provide 3-5 specific recommendations for placement or alternatives
7. **Detailed Reasoning**: Explain your analysis in 2-3 sentences

Consider:
- Existing color palette of the room
- Current furniture style and aesthetic
- Room lighting and ambiance
- Space dimensions and layout
- Overall design cohesion

**IMPORTANT: Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):**
{
  "suitable": true or false,
  "suitabilityScore": number between 0-100,
  "colorMatch": "excellent/good/fair/poor",
  "styleMatch": "excellent/good/fair/poor",
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "alternativeColors": ["color1", "color2", "color3"],
  "reasoning": "Your detailed explanation here"
}
`;

    // Generate content with image and prompt
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Image,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();
    
    console.log('📊 Raw Gemini response:', text);

    // Parse the JSON response
    // Remove markdown code blocks if present
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const analysis: SpaceAnalysisResult = JSON.parse(jsonText);

    console.log('✅ Space analysis complete:', {
      suitable: analysis.suitable,
      score: analysis.suitabilityScore,
      colorMatch: analysis.colorMatch,
    });

    return analysis;
  } catch (error: any) {
    console.error('❌ Error analyzing space:', error);
    
    // Return a fallback analysis if API fails
    return {
      suitable: true,
      suitabilityScore: 50,
      colorMatch: 'unknown',
      styleMatch: 'unknown',
      recommendations: [
        'Unable to analyze space due to technical error',
        'Please try again or consult with an interior designer',
        'Consider the room\'s existing color scheme manually',
      ],
      alternativeColors: ['Neutral White', 'Warm Beige', 'Light Gray'],
      reasoning: `Analysis failed: ${error.message}. Please ensure you have a clear photo of the space and try again.`,
    };
  }
}

/**
 * Get color recommendations for a specific room type
 */
export async function getColorRecommendations(
  imageUri: string,
  roomType: string = 'general'
): Promise<string[]> {
  try {
    const base64Image = await imageToBase64(imageUri);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
Analyze this ${roomType} space image and suggest 5 furniture colors that would harmonize well with the existing decor.

Respond ONLY with valid JSON array (no markdown):
["color1", "color2", "color3", "color4", "color5"]
`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Image,
        },
      },
    ]);

    const response = await result.response;
    let text = response.text().trim();
    
    // Clean up markdown if present
    if (text.startsWith('```json')) {
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (text.startsWith('```')) {
      text = text.replace(/```\n?/g, '');
    }

    const colors: string[] = JSON.parse(text);
    return colors;
  } catch (error) {
    console.error('Error getting color recommendations:', error);
    return ['White', 'Beige', 'Gray', 'Navy Blue', 'Olive Green'];
  }
}
