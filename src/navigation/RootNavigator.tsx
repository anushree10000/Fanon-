import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { StoryFeedScreen } from '../screens/StoryFeedScreen';
import { ChapterListScreen } from '../screens/ChapterListScreen';
import { ReaderScreen } from '../screens/ReaderScreen';
import { theme } from '../theme/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: theme.color.bg,
    card: theme.color.surface,
    text: theme.color.text,
    border: theme.color.border,
    primary: theme.color.accent,
  },
};

export function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: theme.color.surface },
          headerTitleStyle: { color: theme.color.text },
          headerTintColor: theme.color.text,
          contentStyle: { backgroundColor: theme.color.bg },
        }}>
        <Stack.Screen name="StoryFeed" component={StoryFeedScreen} options={{ title: 'Fanon' }} />
        <Stack.Screen
          name="ChapterList"
          component={ChapterListScreen}
          options={({ route }) => ({ title: route.params.storyTitle })}
        />
        <Stack.Screen
          name="Reader"
          component={ReaderScreen}
          options={{ headerShown: false, animation: 'fade' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
