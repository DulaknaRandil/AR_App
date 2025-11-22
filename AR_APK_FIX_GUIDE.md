# AR APK Crash Fix Guide

## Problem
The AR feature was crashing when building the app as an APK, even though it worked fine with `npx expo start`.

## Root Causes Fixed

### 1. ❌ React.lazy() Not Supported in React Native
**Problem:** The `ar.tsx` file was using `React.lazy()` for code splitting, which only works on web platforms. In React Native production builds, this causes immediate crashes.

**Fix:** Replaced lazy loading with direct imports in `app/ar.tsx`:
```tsx
// ❌ BEFORE (causes crash)
const NativeAR = lazy(() => import('../src/features/ar/NativeAR'));

// ✅ AFTER (works)
import NativeAR from '../src/features/ar/NativeAR';
```

### 2. ❌ NDK Version Conflicts
**Problem:** Specifying a specific `ndkVersion` in `app.json` can cause compatibility issues with Viro and other native modules.

**Fix:** Removed the hardcoded NDK version from `app.json` to let Expo use the compatible version automatically.

### 3. ❌ Missing Android Permissions
**Problem:** Storage permissions were missing, which Viro needs to cache AR assets.

**Fix:** Added required permissions in `app.json`:
```json
"permissions": [
  "android.permission.CAMERA",
  "android.permission.READ_EXTERNAL_STORAGE",
  "android.permission.WRITE_EXTERNAL_STORAGE"
]
```

### 4. ❌ Production Build Configuration
**Problem:** The production build wasn't explicitly configured for proper release builds.

**Fix:** Updated `eas.json` to use the proper gradle command:
```json
"production": {
  "android": {
    "buildType": "apk",
    "gradleCommand": ":app:assembleRelease"
  }
}
```

## How to Build Now

### Development Build (Testing)
```bash
# Clean install
npm install

# Start with dev client
npx expo start --clear
```

### Production APK Build
```bash
# Build production APK
eas build --profile production --platform android

# Or build locally (if you have Android SDK)
npx expo prebuild
npx expo run:android --variant release
```

## Testing Checklist

✅ Test AR on actual Android device (not emulator - AR needs real camera)
✅ Check app doesn't crash on opening AR screen
✅ Verify AR model loads and displays
✅ Test pinch, rotate, and drag gestures work
✅ Ensure plane detection works on surfaces

## Troubleshooting

### Issue: App still crashes on AR screen
**Solution:** 
1. Clear build cache: `npx expo start --clear`
2. Delete node_modules: `rm -rf node_modules && npm install`
3. Rebuild: `eas build --profile production --platform android --clear-cache`

### Issue: AR is slow/laggy
**Solutions:**
- Ensure you're testing on a physical device (not emulator)
- Check device has ARCore support (most Android 7.0+ devices)
- Optimize 3D model file size (GLB should be < 10MB)
- Reduce model polygon count if very complex

### Issue: "Native AR Not Available" message
**Solution:**
This means the build doesn't include Viro native modules. You need a custom dev client:
```bash
eas build --profile development --platform android
# Install the resulting APK on your device
# Then run: npx expo start --dev-client
```

### Issue: Model doesn't appear
**Solutions:**
1. Verify GLB file is in `assets/` folder
2. Check file path in NativeAR.tsx is correct
3. Move device slowly to detect horizontal surfaces
4. Ensure good lighting in room

## Performance Tips

1. **Optimize 3D Models:**
   - Use GLB format (not GLTF + separate files)
   - Keep file size under 5-10MB
   - Use texture atlases
   - Reduce polygon count

2. **Build Optimization:**
   - Always use production profile for release builds
   - Enable Hermes engine (enabled by default in Expo 50+)
   - Use APK instead of AAB for initial testing

3. **Device Requirements:**
   - Android 7.0 (API 24) or higher
   - ARCore support (check: https://developers.google.com/ar/devices)
   - Minimum 2GB RAM recommended
   - Good camera quality for better tracking

## What Changed

| File | Change | Why |
|------|--------|-----|
| `app/ar.tsx` | Removed React.lazy() | Not supported in RN production |
| `app.json` | Removed ndkVersion | Causes compatibility issues |
| `app.json` | Added storage permissions | Required for AR asset caching |
| `eas.json` | Added gradleCommand | Explicit release build config |
| `metro.config.js` | Added sourceExts config | Ensure proper module resolution |

## Next Steps

1. ✅ Build production APK with fixes
2. ✅ Test on physical Android device
3. ✅ Verify AR features work smoothly
4. 🔄 If still having issues, check Metro bundler logs during build
5. 🔄 Consider adding ProGuard rules if classes are being stripped

## Additional Resources

- [Expo EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [Viro React Documentation](https://github.com/NativeVision/viro)
- [ARCore Supported Devices](https://developers.google.com/ar/devices)
- [React Native Performance](https://reactnative.dev/docs/performance)
