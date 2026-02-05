// frontend/app/onboarding-step2.tsx
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

const reasons = [
  { key: 'communication', label: 'Communicate with Deaf Community', icon: 'chatbubbles' as const },
  { key: 'career', label: 'Career Opportunities', icon: 'briefcase' as const },
  { key: 'family', label: 'Family & Friends', icon: 'people' as const },
  { key: 'culture', label: 'Learn About Deaf Culture', icon: 'library' as const },
  { key: 'brain', label: 'Brain Training', icon: 'bulb' as const },
  { key: 'school', label: 'School/Academic', icon: 'school' as const },
  { key: 'volunteer', label: 'Volunteer Work', icon: 'heart' as const },
  { key: 'other', label: 'Other', icon: 'sparkles' as const },
];

export default function OnboardingStep2() {
  const router = useRouter();
  const [selected, setSelected] = useState<string>('');

  const handleContinue = () => {
    if (selected) {
      router.push('/onboarding-step3' as any);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <ProgressBar currentStep={2} totalSteps={4} />
      
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>🎯</Text>
        <Text style={styles.headerTitle}>Your Goal</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.question}>Why are you learning sign language?</Text>
        
        <View style={styles.optionsContainer}>
          {reasons.map((reason) => (
            <TouchableOpacity
              key={reason.key}
              style={[
                styles.option,
                selected === reason.key && styles.optionSelected
              ]}
              onPress={() => setSelected(reason.key)}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                <Ionicons 
                  name={reason.icon} 
                  size={28} 
                  color={selected === reason.key ? EMERALD_GREEN : '#64748B'} 
                  style={styles.optionIcon}
                />
                <Text style={[
                  styles.optionText,
                  selected === reason.key && styles.optionTextSelected
                ]}>
                  {reason.label}
                </Text>
              </View>
              {selected === reason.key && (
                <Ionicons name="checkmark-circle" size={24} color={EMERALD_GREEN} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
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
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 40,
    backgroundColor: DARK_BG,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    gap: 12,
  },
  backButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#334155',
    backgroundColor: '#1E293B',
  },
  backButtonText: {
    color: '#94A3B8',
    fontSize: 16,
    ...Fonts.bold,
  },
  continueButton: {
    flex: 2,
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
