// frontend/app/onboarding-step1.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '@/constants/fonts';
import { AppColors } from '@/constants/colors';

const { width, height } = Dimensions.get('window');

const EMERALD_GREEN = '#2ECC71';
const DARK_BG = '#0F172A';

// Progress Bar Component
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

const sources = [
  { key: 'friends', label: 'Friends/Family', icon: 'people' as const },
  { key: 'social', label: 'Social Media', icon: 'logo-instagram' as const },
  { key: 'school', label: 'School/University', icon: 'school' as const },
  { key: 'work', label: 'Work/Job', icon: 'briefcase' as const },
  { key: 'search', label: 'Google Search', icon: 'search' as const },
  { key: 'youtube', label: 'YouTube', icon: 'logo-youtube' as const },
  { key: 'ad', label: 'Advertisement', icon: 'megaphone' as const },
  { key: 'other', label: 'Other', icon: 'ellipsis-horizontal' as const },
];

export default function OnboardingStep1() {
  const router = useRouter();
  const [selected, setSelected] = useState<string>('');

  const handleContinue = () => {
    if (selected) {
      router.push('/onboarding-step2' as any);
    }
  };

  return (
    <View style={styles.container}>
      <ProgressBar currentStep={1} totalSteps={4} />
      
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>👋</Text>
        <Text style={styles.headerTitle}>Hi there!</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.question}>How did you hear about Sign-Lingo?</Text>
        
        <View style={styles.optionsContainer}>
          {sources.map((source) => (
            <TouchableOpacity
              key={source.key}
              style={[
                styles.option,
                selected === source.key && styles.optionSelected
              ]}
              onPress={() => setSelected(source.key)}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                <Ionicons 
                  name={source.icon} 
                  size={28} 
                  color={selected === source.key ? EMERALD_GREEN : '#64748B'} 
                  style={styles.optionIcon}
                />
                <Text style={[
                  styles.optionText,
                  selected === source.key && styles.optionTextSelected
                ]}>
                  {source.label}
                </Text>
              </View>
              {selected === source.key && (
                <Ionicons name="checkmark-circle" size={24} color={EMERALD_GREEN} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, !selected && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!selected}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>CONTINUE</Text>
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
    paddingHorizontal: 20,
  },
  question: {
    fontSize: 26,
    ...Fonts.bold,
    color: '#fff',
    marginTop: 10,
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 34,
  },
  optionsContainer: {
    paddingBottom: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#334155',
  },
  optionSelected: {
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    borderColor: EMERALD_GREEN,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    marginRight: 15,
  },
  optionText: {
    fontSize: 16,
    ...Fonts.regular,
    color: '#94A3B8',
  },
  optionTextSelected: {
    ...Fonts.bold,
    color: '#fff',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: DARK_BG,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  continueButton: {
    backgroundColor: EMERALD_GREEN,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: EMERALD_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  continueButtonDisabled: {
    backgroundColor: '#334155',
    shadowOpacity: 0,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    ...Fonts.bold,
    letterSpacing: 1,
  },
});
