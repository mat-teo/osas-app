// App.tsx
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppProvider } from './src/context/AppContext';
import { syncService } from './src/services/syncService';
import SplashScreen from './src/screens/SplashScreen';
import ProfilesListScreen from './src/screens/ProfileListScreen';
import QuestionarioScreen from './src/screens/QuestionarioScreen';
import ConfigScreen from './src/screens/ConfigScreen';
import ConnectScreen from './src/screens/ConnectScreen';
import HomeScreen from './src/screens/HomeScreen';
import { RootStackParamList } from './src/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  useEffect(() => {
    syncService.start();
    return () => { syncService.stop(); };
  }, []);

  return (
    <AppProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="ProfilesList" component={ProfilesListScreen} options={{ headerShown: true, title: 'I tuoi profili' }} />
          <Stack.Screen name="Questionario" component={QuestionarioScreen} options={{ headerShown: true, title: 'Questionario' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
};

export default App;