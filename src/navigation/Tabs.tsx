import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import LogScreen from '../screens/LogScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../state/I18nContext';

const Tab = createBottomTabNavigator();

export default function Tabs() {
  const { t } = useI18n();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const name =
            route.name === 'home' ? 'home' :
            route.name === 'log' ? 'bar-chart' : 'settings';
          return <Ionicons name={name as any} size={size} color={color} />;
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="home" component={HomeScreen} options={{ title: t('tab.home') }} />
      <Tab.Screen name="log" component={LogScreen} options={{ title: t('tab.log') }} />
      <Tab.Screen name="settings" component={SettingsScreen} options={{ title: t('tab.settings') }} />
    </Tab.Navigator>
  );
}
