const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add AR-specific asset extensions
config.resolver.assetExts.push('obj', 'mtl', 'gltf', 'glb', 'bin', 'arobject', 'vrx');

// Ensure source extensions include js/jsx/ts/tsx
config.resolver.sourceExts = config.resolver.sourceExts || ['js', 'jsx', 'json', 'ts', 'tsx'];

module.exports = config;
