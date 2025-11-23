# AI Space Analyzer Feature

## Overview
The AI Space Analyzer uses Google Gemini Vision AI to analyze room photos and determine if furniture items are suitable for specific spaces.

## Features

### 📸 Photo Capture
- Take photos directly with camera
- Select existing photos from gallery
- Edit and crop images before analysis

### 🤖 AI Analysis
The AI analyzes:
- **Color Harmony**: Does the item's color match the room's palette?
- **Style Compatibility**: Does the item fit the room's aesthetic?
- **Suitability Score**: 0-100 rating of how well the item fits
- **Alternative Colors**: Suggestions for better color matches
- **Recommendations**: Specific advice for placement and alternatives

### 📊 Results Display
- Visual suitability score with progress bar
- Color match and style match ratings (Excellent/Good/Fair/Poor)
- Detailed AI reasoning
- Actionable recommendations
- Alternative color suggestions

## How to Use

1. **Navigate to Product Page**: Browse products and click on any item
2. **Click "AI Space Analyzer"**: Located below the "Add to Cart" button
3. **Capture Room Photo**: 
   - Tap "Take Photo" to use camera
   - Or tap "Choose from Gallery" to select existing photo
4. **Analyze Space**: Click "Analyze Space" button
5. **View Results**: See comprehensive AI analysis with scores and recommendations

## Technical Details

### API Integration
- **Service**: Google Gemini 1.5 Flash (Vision model)
- **API Key**: Securely configured in `geminiService.ts`
- **Model**: `gemini-1.5-flash` with vision capabilities

### Components
- `SpaceAnalyzer.tsx` - Main analysis component
- `geminiService.ts` - AI service integration
- `space-analyzer.tsx` - Screen wrapper

### Permissions Required
- Camera access (for taking photos)
- Photo library access (for selecting images)

### Data Flow
```
Product Page → Space Analyzer Screen → Capture Image → 
Gemini AI Analysis → Results Display
```

## Example Analysis Output

```json
{
  "suitable": true,
  "suitabilityScore": 85,
  "colorMatch": "excellent",
  "styleMatch": "good",
  "recommendations": [
    "Place near the window for natural lighting",
    "Consider adding matching cushions",
    "Pairs well with existing wooden furniture"
  ],
  "alternativeColors": ["Navy Blue", "Sage Green", "Warm Gray"],
  "reasoning": "The beige sofa complements the neutral tones..."
}
```

## Product Information Used in Analysis
- Product name and description
- Category (Chair, Sofa, Table, etc.)
- Color and material
- Dimensions
- Price point

## Benefits
- **Confident Purchasing**: Know if items match before buying
- **Color Coordination**: Get expert color matching advice
- **Style Harmony**: Ensure design consistency
- **Personalized Recommendations**: AI-powered suggestions specific to your space

## Future Enhancements
- Multiple angle analysis
- Room type detection
- Size/scale recommendations
- Virtual staging preview
- Save analysis history
