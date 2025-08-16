import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';

type Mode = 'gradient' | 'image' | 'blend';
type ImgName = 'beach' | 'rain';

export default function Background({
  mode = 'gradient',
  phase,
  halfSec,
  image = 'beach',
  imageA = 'beach',
  imageB = 'rain',
  blurIntensity = 30,
}: {
  mode?: Mode;
  phase: 'inhale' | 'exhale';
  halfSec: number;
  image?: ImgName;            // usato in mode="image"
  imageA?: ImgName;           // usato in mode="blend"
  imageB?: ImgName;           // usato in mode="blend"
  blurIntensity?: number;
}) {
  // progress: 0 = exhale, 1 = inhale (sincronizzato con il respiro)
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(phase === 'inhale' ? 1 : 0, {
      duration: Math.max(300, halfSec * 1000),
      easing: Easing.inOut(Easing.ease),
    });
  }, [phase, halfSec]);

  // Opacità per crossfade
  const topOpacity = useAnimatedStyle(() => ({ opacity: progress.value }));
  const bottomOpacity = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));

  // Ken Burns lentissimo per naturalezza
  const kb = useSharedValue(1.02);
  useEffect(() => {
    kb.value = withRepeat(
      withTiming(1.06, { duration: 45000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, []);
  const kbStyle = useAnimatedStyle(() => ({ transform: [{ scale: kb.value }] }));

  const imgSrc = (n: ImgName) =>
    n === 'rain'
      ? require('../../assets/bg/rain.jpg')
      : require('../../assets/bg/beach.jpg');

  const imgSingle = imgSrc(image);
  const imgA = imgSrc(imageA);
  const imgB = imgSrc(imageB);

  return (
    <>
      {mode === 'gradient' && (
        <>
          {/* Base: verde profondo → blu notte */}
          <LinearGradient
            colors={['#0b3a2a', '#0e1726']}
            style={StyleSheet.absoluteFill}
          />
          {/* Top: blu notte → indaco (crossfade col respiro) */}
          <Animated.View style={[StyleSheet.absoluteFill, topOpacity]}>
            <LinearGradient
              colors={['#0e1726', '#1b3358']}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </>
      )}

      {mode === 'image' && (
        <>
          <Animated.View style={[StyleSheet.absoluteFill, kbStyle]} pointerEvents="none">
            <Image
              source={imgSingle}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={200}
            />
          </Animated.View>
          <BlurView intensity={blurIntensity} tint="dark" style={StyleSheet.absoluteFill} />
          {/* Leggera tinta respirante */}
          <Animated.View style={[StyleSheet.absoluteFill, topOpacity]} pointerEvents="none">
            <LinearGradient
              colors={['rgba(0,0,0,0.30)', 'rgba(0,0,0,0.55)']}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </>
      )}

      {mode === 'blend' && (
        <>
          {/* Fondo: Image A (es. beach) */}
          <Animated.View style={[StyleSheet.absoluteFill, kbStyle, bottomOpacity]} pointerEvents="none">
            <Image
              source={imgA}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={200}
            />
          </Animated.View>

          {/* Top: Image B (es. rain) crossfade col respiro */}
          <Animated.View style={[StyleSheet.absoluteFill, kbStyle, topOpacity]} pointerEvents="none">
            <Image
              source={imgB}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={200}
            />
          </Animated.View>

          {/* Ammorbidisci e garantisci leggibilità */}
          <BlurView intensity={blurIntensity} tint="dark" style={StyleSheet.absoluteFill} />

          {/* Tinta scura che “respira” appena */}
          <Animated.View style={[StyleSheet.absoluteFill, topOpacity]} pointerEvents="none">
            <LinearGradient
              colors={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0.55)']}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </>
      )}
    </>
  );
}
