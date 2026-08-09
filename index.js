/**
 * @format
 */

// Must be the first import in the app -- gesture-handler installs its
// native event listeners at import time.
import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
