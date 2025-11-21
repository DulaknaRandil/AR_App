# Cross-Platform AR Implementation

This app supports AR experiences on both **mobile (iOS/Android)** and **web browsers**.

## Platform-Specific AR Technologies

### Mobile (iOS/Android)
- **Technology**: ViroReact ([@reactvision/react-viro](https://github.com/NativeVision/viro))
- **Features**:
  - Native AR using ARKit (iOS) and ARCore (Android)
  - Plane detection and surface placement
  - 3D object rendering (GLB/GLTF models)
  - Gestures: pinch-to-scale, rotate, drag
  - Real-time lighting and shadows
- **Requirements**: Custom development build (EAS build) required

### Web
- **Technology**: Google's [model-viewer](https://modelviewer.dev/) with WebXR
- **Features**:
  - WebXR Device API for immersive AR
  - Scene Viewer (Android Chrome)
  - Quick Look (iOS Safari)
  - Camera controls and auto-rotation
  - AR button to place models in real space
- **Requirements**: 
  - Chrome 79+ (Android) with ARCore support
  - Safari 13+ (iOS) with AR Quick Look
  - WebXR-compatible device

## Architecture

```
app/ar.tsx                          # Platform-aware AR wrapper
  ├─ NativeAR (mobile)             # Loads src/features/ar/NativeAR.tsx
  └─ WebAR (web)                   # Loads src/features/ar/WebAR.tsx
```

### How It Works

1. **Platform Detection**: `app/ar.tsx` uses `Platform.OS` to determine runtime environment
2. **Conditional Loading**: Dynamic `require()` loads only the relevant AR component
3. **Fallback**: `Suspense` with loading indicator during AR initialization

## Usage

### From Product Detail Screen

```tsx
import { Link } from 'expo-router';

<Link
  href={{
    pathname: '/ar',
    params: {
      modelUrl: 'https://example.com/model.glb',
    },
  }}
>
  View in AR
</Link>
```

### Direct Navigation

```tsx
import { router } from 'expo-router';

router.push({
  pathname: '/ar',
  params: {
    modelUrl: 'https://cdn.example.com/furniture/chair.glb',
  },
});
```

## Testing

### Web (Local Development)

```bash
npm start -- --web
# or
npx expo start --web
```

Then open http://localhost:8081 in:
- **Chrome (Android)**: Supports WebXR on ARCore devices
- **Safari (iOS)**: Supports AR Quick Look on compatible devices
- **Desktop**: Shows camera controls (no AR button without WebXR support)

### Mobile (Development Build)

1. Build custom dev client:
   ```bash
   eas build --profile development --platform android
   # or
   eas build --profile development --platform ios
   ```

2. Install the development build on your physical device

3. Start the dev server:
   ```bash
   npx expo start --dev-client
   ```

4. Scan QR code from development build app

**Note**: ViroReact requires a custom development build and will not work in Expo Go.

## 3D Model Requirements

### Format
- **GLB** (recommended): Binary GLTF, single file
- **GLTF**: JSON with external assets (also supported)

### Optimization
- Keep file size under 5MB for web
- Use Draco compression for large models
- Optimize textures (power-of-2 dimensions)
- Limit polygon count (< 100k triangles for mobile)

### Testing Models
Free GLB models for testing:
- [Sketchfab](https://sketchfab.com/features/gltf) (downloadable GLB)
- [Google Poly Archive](https://poly.pizza/)
- [Khronos glTF Sample Models](https://github.com/KhronosGroup/glTF-Sample-Models)

## Browser Compatibility

| Platform | Browser | AR Mode | Notes |
|----------|---------|---------|-------|
| Android | Chrome 79+ | WebXR | Requires ARCore device |
| Android | Chrome | Scene Viewer | Fallback if WebXR unavailable |
| iOS | Safari 13+ | AR Quick Look | iOS 12+ devices with A9+ chip |
| Desktop | Any | Camera Controls | No AR, but 3D viewing works |

## Known Issues & Limitations

### Mobile
- **Expo Go**: ViroReact does not work in Expo Go. Must use custom dev build.
- **setJSMaterials error**: Fixed by platform detection—ViroReact only loads on native.
- **iOS**: Requires physical device with ARKit support (iPhone 6S+ or iPad 5+).
- **Android**: Requires ARCore-compatible device.

### Web
- **WebXR**: Limited browser support; primarily Chrome on Android.
- **iOS Safari**: Uses AR Quick Look instead of WebXR (opens native AR viewer).
- **Desktop**: No AR mode; shows 3D viewer with camera controls only.
- **model-viewer**: Requires internet to load the library (CDN or local bundle).

## Troubleshooting

### "Cannot read property 'setJSMaterials' of null"
**Cause**: ViroReact native module not available (running on web or in Expo Go).  
**Fix**: Platform detection now prevents loading ViroReact on web. For mobile, build a custom dev client.

### "Route './ar.tsx' is missing the required default export"
**Cause**: Missing or incorrect default export in `app/ar.tsx`.  
**Fix**: Ensured `export default function ARScreen()` is present.

### Web: Model not loading
1. Check modelUrl is publicly accessible (test in browser)
2. Check CORS headers (model-viewer requires CORS)
3. Open browser console for errors
4. Verify model is valid GLB/GLTF (use [glTF Validator](https://github.khronos.org/glTF-Validator/))

### Mobile: Black screen or crash
1. Ensure using custom dev build (not Expo Go)
2. Check device supports ARKit (iOS) or ARCore (Android)
3. Grant camera permissions in device settings
4. Check Metro bundler logs for errors

## Future Enhancements

- [ ] Add real-time color matching (camera frame analysis) on native
- [ ] Implement multi-model placement
- [ ] Add measurement tools (distance, dimensions)
- [ ] Save AR placement screenshots
- [ ] Share AR experiences via deep links
- [ ] Add hand gestures for advanced interactions
- [ ] Implement occlusion and depth mapping (LiDAR on supported devices)

## Resources

- [ViroReact Docs](https://docs.viromedia.com/)
- [model-viewer Docs](https://modelviewer.dev/)
- [WebXR Device API](https://www.w3.org/TR/webxr/)
- [ARCore Supported Devices](https://developers.google.com/ar/devices)
- [ARKit Requirements](https://developer.apple.com/documentation/arkit/verifying_device_support_and_user_permission)
