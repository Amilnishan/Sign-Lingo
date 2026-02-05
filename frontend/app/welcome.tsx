// frontend/app/welcome.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ViewStyle, TextStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Fonts } from '@/constants/fonts';
import { AppColors } from '@/constants/colors';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/onboarding' as any);
  };

  return (
    <View style={styles.container}>
      {/* Video Background */}
      <Video
        source={require('@/assets/videos/theme.mp4')}
        style={styles.backgroundVideo}
        shouldPlay
        isLooping
        isMuted
        resizeMode={ResizeMode.COVER}
      />

      {/* Gradient Overlay */}
      <LinearGradient
        colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
        style={styles.gradientOverlay}
      />

      {/* Content */}
      <View style={styles.contentContainer}>
        <View style={styles.topSection}>
          <Text style={styles.logo}>👋</Text>
          <Text style={styles.title}>Welcome to</Text>
          <Text style={styles.appName}>Sign-Lingo</Text>
          <Text style={styles.tagline}>
            Your AI-Powered Sign Language Tutor
          </Text>
        </View>

        <View style={styles.bottomSection}>
          <Text style={styles.description}>
            Master American Sign Language with real-time AI feedback, 
            interactive lessons, and gamified learning
          </Text>

          <TouchableOpacity 
            style={styles.getStartedButton}
            onPress={handleGetStarted}
            activeOpacity={0.8}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.skipButton}
            onPress={() => router.replace('/login')}
            activeOpacity={0.7}
          >
            <Text style={styles.skipText}>Already have an account? Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create<{
  container: ViewStyle;
  backgroundVideo: ViewStyle;
  gradientOverlay: ViewStyle;
  contentContainer: ViewStyle;
  topSection: ViewStyle;
  logo: TextStyle;
  title: TextStyle;
  appName: TextStyle;
  tagline: TextStyle;
  bottomSection: ViewStyle;
  description: TextStyle;
  getStartedButton: ViewStyle;
  getStartedText: TextStyle;
  skipButton: ViewStyle;
  skipText: TextStyle;
}>({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: width,
    height: height,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingTop: height * 0.15,
    paddingBottom: 50,
  },
  topSection: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    color: '#fff',
    ...Fonts.regular,
    marginBottom: 5,
  },
  appName: {
    fontSize: 48,
    color: '#fff',
    ...Fonts.bold,
    marginBottom: 15,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    ...Fonts.regular,
    textAlign: 'center',
  },
  bottomSection: {
    alignItems: 'center',
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    ...Fonts.regular,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  getStartedButton: {
    backgroundColor: AppColors.primary,
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  getStartedText: {
    color: '#fff',
    fontSize: 18,
    ...Fonts.bold,
  },
  skipButton: {
    marginTop: 20,
    paddingVertical: 12,
  },
  skipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    ...Fonts.regular,
  },
});
