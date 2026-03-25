const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Enable tree-shaking and module resolution optimizations
config.transformer = {
  ...config.transformer,
  // Enable Hermes bytecode compiler for better performance and smaller bundle
  experimentalImportSupport: true,
  inlineRequires: true,
};

// Optimize resolver for faster module resolution
config.resolver = {
  ...config.resolver,
  // Exclude node_modules to prevent unnecessary file system checks
  blacklistRE: /node_modules\/(.)*\/node_modules/,
  // Prioritize resolution order for faster lookups
  sourceExts: ["jsx", "js", "tsx", "ts", "json"],
  assetExts: ["ttf", "otf", "png", "jpg", "jpeg", "gif", "svg", "webp"],
};

// Enable watchman for faster file watching during development
config.watchFolders = [];
config.maxWorkers = 4;

// Optimize serialization
config.serializer = {
  ...config.serializer,
  // Include only reachable modules in bundle
  getModulesRunBeforeMainModule: () => [require.resolve("expo/build/Expo.js")],
  // Optimize polyfills
  isThirdPartyModule: (module) => {
    // Treat all node_modules as third party
    return /node_modules/.test(module);
  },
};

module.exports = config;
