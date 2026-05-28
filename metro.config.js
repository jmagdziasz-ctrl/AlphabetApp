const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Make sure Metro picks up png files from all asset folders
config.resolver.assetExts.push('png', 'jpg', 'jpeg', 'gif', 'webp');

module.exports = config;
