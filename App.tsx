// App.tsx
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppProvider } from './src/context/AppContext';
import { syncService } from './src/services/syncService';
import ConfigScreen from './src/screens/ConfigScreen';
import ConnectScreen from './src/screens/ConnectScreen';
import HomeScreen from './src/screens/HomeScreen';

// ESPORTA il tipo qui
export type RootStackParamList = {
  Config: undefined;
  Connect: { profileId?: number };
  Home: { serial: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  useEffect(() => {
    syncService.start();
    return () => {
      syncService.stop();
    };
  }, []);

  return (
    <AppProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Config">
          <Stack.Screen 
            name="Config" 
            component={ConfigScreen} 
            options={{ title: 'Configura Profilo' }} 
          />
          <Stack.Screen 
            name="Connect" 
            component={ConnectScreen} 
            options={{ title: 'Connetti Braccialetto' }} 
          />
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ title: 'Dashboard' }} 
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
};

export default App;