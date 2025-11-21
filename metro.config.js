const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('obj', 'mtl', 'gltf', 'glb', 'bin', 'arobject', 'vrx');

module.exports = config;
