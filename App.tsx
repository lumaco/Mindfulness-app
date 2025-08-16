import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Tabs from './src/navigation/Tabs';
import { PaletteProvider } from './src/state/PaletteContext';
import { AmbienceProvider } from './src/state/AmbienceContext';
import { LogProvider } from './src/state/LogContext';
import { PrefsProvider } from './src/state/PrefsContext';
import OnboardingScreen from './src/screens/OnboardingScreen';
import { I18nProvider } from './src/state/I18nContext';

const KEY_ONB = 'onboarding.seen';

export default function App() {
  const [seen, setSeen] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem(KEY_ONB);
        setSeen(v === '1');
      } catch {
        setSeen(true);
      }
    })();
  }, []);

  const handleOnboardingDone = async () => {
    try { await AsyncStorage.setItem(KEY_ONB, '1'); } catch {}
    setSeen(true);
  };

  if (seen === null) return null;

  return (
    <NavigationContainer theme={DarkTheme}>
      <StatusBar style="light" />
      <I18nProvider>
        <PaletteProvider>
          <AmbienceProvider>
            <PrefsProvider>
              <LogProvider>
                {seen ? <Tabs /> : <OnboardingScreen onDone={handleOnboardingDone} />}
              </LogProvider>
            </PrefsProvider>
          </AmbienceProvider>
        </PaletteProvider>
      </I18nProvider>
    </NavigationContainer>
  );
}
