/**
 * Fanon comic reader.
 * @format
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { theme } from './src/theme/theme';

function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.color.bg }}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor={theme.color.bg} />
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
