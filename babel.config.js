module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Must be listed last -- reanimated's babel plugin rewrites worklets
    // and needs every other transform to have already run.
    'react-native-reanimated/plugin',
  ],
};
