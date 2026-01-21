// frontend/app/(tabs)/index.tsx
import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Fonts } from '@/constants/fonts';
import { AppColors } from '@/constants/colors';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      console.log("Navigating to Login...");
      router.replace('/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.splashContainer}>
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../assets/images/icon.png')} 
          style={styles.logo} 
          resizeMode="contain" 
        />
      </View>
      <Text style={styles.brandName}>Sign-Lingo</Text>
      <Text style={styles.tagline}>LEARN TO SIGN</Text>
      <ActivityIndicator size="large" color={AppColors.primary} style={{ marginTop: 30 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.background,
  },
  logoContainer: {
    width: 160,
    height: 160,
    borderRadius: 40,
    backgroundColor: AppColors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 24,
  },
  brandName: {
    fontSize: 36,
    ...Fonts.appName,
    color: AppColors.primary,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    ...Fonts.regular,
    color: AppColors.textSecondary,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
});