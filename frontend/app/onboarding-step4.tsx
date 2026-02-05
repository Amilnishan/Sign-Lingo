// frontend/app/onboarding-step4.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '@/constants/fonts';
import { AppColors } from '@/constants/colors';

const { width, height } = Dimensions.get('window');

const EMERALD_GREEN = '#2ECC71';
const DARK_BG = '#0F172A';

const ProgressBar = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => (
  <View style={styles.progressContainer}>
    {Array.from({ length: totalSteps }).map((_, index) => (
      <View
        key={index}
        style={[
          styles.progressSegment,
          index < currentStep && styles.progressSegmentActive,
        ]}
      />
    ))}
  </View>
);

export default function OnboardingStep4() {
  const router = useRouter();
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handleFinish = async () => {
    try {
      // Get current user data
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        const userEmail = userData.email;
        
        // Mark onboarding as completed for this specific user
        const onboardingKey = `hasCompletedOnboarding_${userEmail}`;
        await AsyncStorage.setItem(onboardingKey, 'true');
        
        console.log('Onboarding completed for:', userEmail);
      }
      
      // Navigate to home
      router.replace('/(tabs)/home' as any);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      router.replace('/(tabs)/home' as any);
    }
  };

  const handleSkip = async () => {
    await handleFinish();
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <ProgressBar currentStep={4} totalSteps={4} />
      
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>🔔</Text>
        <Text style={styles.headerTitle}>Stay on Track</Text>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.question}>Want us to help you keep your daily goal?</Text>
        <Text style={styles.subtitle}>Get a daily reminder to meet your goal</Text>
        
        <View style={styles.reminderSection}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="calendar" size={24} color={EMERALD_GREEN} />
            <Text style={styles.sectionTitle}>Daily Reminder</Text>
          </View>
          <Text style={styles.sectionDescription}>
            We&apos;ll send you a friendly reminder each day to practice your signs
          </Text>
        </View>

        <View style={styles.benefitsContainer}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="trophy" size={24} color="#F59E0B" />
            <Text style={styles.benefitsTitle}>What you&apos;ll get:</Text>
          </View>
          <View style={styles.benefit}>
            <Ionicons name="checkmark-circle" size={20} color={EMERALD_GREEN} style={styles.benefitIcon} />
            <Text style={styles.benefitText}>Real-time AI feedback on your gestures</Text>
          </View>
          <View style={styles.benefit}>
            <Ionicons name="checkmark-circle" size={20} color={EMERALD_GREEN} style={styles.benefitIcon} />
            <Text style={styles.benefitText}>Daily streaks and XP rewards</Text>
          </View>
          <View style={styles.benefit}>
            <Ionicons name="checkmark-circle" size={20} color={EMERALD_GREEN} style={styles.benefitIcon} />
            <Text style={styles.benefitText}>Track your progress and compete on leaderboards</Text>
          </View>
          <View style={styles.benefit}>
            <Ionicons name="checkmark-circle" size={20} color={EMERALD_GREEN} style={styles.benefitIcon} />
            <Text style={styles.benefitText}>Personalized learning based on your weaknesses</Text>
          </View>
        </View>

        <View style={styles.readyContainer}>
          <Ionicons name="rocket" size={28} color={EMERALD_GREEN} />
          <Text style={styles.readyText}>Ready to start learning?</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Animated.View style={[styles.allowButtonContainer, { transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity
            style={styles.allowButton}
            onPress={handleFinish}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[EMERALD_GREEN, '#27AE60']}
              style={styles.allowButtonGradient}
            >
              <Ionicons name="notifications" size={24} color="#fff" style={{ marginRight: 10 }} />
              <Text style={styles.allowButtonText}>ALLOW REMINDERS</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
        
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleFinish}
          activeOpacity={0.7}
        >
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    gap: 8,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    backgroundColor: '#1E293B',
    borderRadius: 2,
  },
  progressSegmentActive: {
    backgroundColor: EMERALD_GREEN,
  },
  header: {
    paddingHorizontal: 30,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: 80,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 32,
    ...Fonts.bold,
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  question: {
    fontSize: 26,
    ...Fonts.bold,
    color: '#fff',
    marginTop: 10,
    marginBottom: 10,
    textAlign: 'center',
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 14,
    ...Fonts.regular,
    color: '#64748B',
    marginBottom: 30,
    textAlign: 'center',
  },
  reminderSection: {
    backgroundColor: '#1E293B',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#334155',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    ...Fonts.bold,
    color: '#fff',
  },
  sectionDescription: {
    fontSize: 14,
    ...Fonts.regular,
    color: '#94A3B8',
    lineHeight: 20,
  },
  benefitsContainer: {
    backgroundColor: '#1E293B',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#334155',
  },
  benefitsTitle: {
    fontSize: 18,
    ...Fonts.bold,
    color: '#fff',
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
  },
  benefitIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    ...Fonts.regular,
    color: '#94A3B8',
    lineHeight: 20,
  },
  readyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
  },
  readyText: {
    fontSize: 20,
    ...Fonts.bold,
    color: '#fff',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: DARK_BG,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    alignItems: 'center',
  },
  allowButtonContainer: {
    width: '100%',
    marginBottom: 16,
  },
  allowButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: EMERALD_GREEN,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  allowButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allowButtonText: {
    color: '#fff',
    fontSize: 18,
    ...Fonts.bold,
    letterSpacing: 1,
  },
  skipButton: {
    paddingVertical: 12,
  },
  skipButtonText: {
    color: '#64748B',
    fontSize: 14,
    ...Fonts.regular,
    textDecorationLine: 'underline',
  },
});
