// frontend/app/feedback.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '@/constants/config';
import { CustomAlert, useCustomAlert } from '@/components/custom-alert';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Modern Glow Design System
const COLORS = {
  background: '#0F172A',
  cardBg: '#1E293B',
  cardBorder: '#334155',
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  emerald: '#2ECC71',
  teal: '#14B8A6',
  gold: '#FFD700',
  goldLight: 'rgba(255, 215, 0, 0.2)',
  goldGlow: 'rgba(255, 215, 0, 0.6)',
};

type Category = 'general' | 'bug' | 'feature';

interface StarRatingProps {
  rating: number;
  onRate: (rating: number) => void;
}

const StarRating = ({ rating, onRate }: StarRatingProps) => {
  const labels = ['😞 Oh no', '😐 It\'s okay', '😊 Good', '🤩 Great!', '🚀 Loved it!'];
  
  return (
    <View style={styles.starSection}>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = star <= rating;
          return (
            <TouchableOpacity 
              key={star} 
              onPress={() => onRate(star)}
              style={styles.starTouchable}
              activeOpacity={0.7}
            >
              <View style={[
                styles.starContainer,
                isActive && styles.starContainerActive
              ]}>
                <Text style={[
                  styles.starEmoji,
                  isActive && styles.starEmojiActive
                ]}>
                  ⭐
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.ratingLabel}>{labels[rating - 1]}</Text>
    </View>
  );
};

export default function FeedbackScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [rating, setRating] = useState(3);
  const [category, setCategory] = useState<Category>('general');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        setUserName(parsed.full_name || '');
        setUserEmail(parsed.email || '');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      showAlert('Error', 'Please enter your feedback message', [{ text: 'OK' }], 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/feedback`, {
        user_name: userName,
        user_email: userEmail,
        rating: rating,
        category: category,
        message: message.trim()
      });

      if (response.status === 201) {
        showAlert(
          'Thank You! 🎉',
          'Your feedback has been submitted successfully. We appreciate your input!',
          [{ text: 'OK', onPress: () => router.back() }],
          'success'
        );
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      showAlert('Error', 'Failed to submit feedback. Please try again.', [{ text: 'OK' }], 'error');
    } finally {
      setLoading(false);
    }
  };

  const categories: { key: Category; label: string; icon: string }[] = [
    { key: 'general', label: 'General', icon: '💭' },
    { key: 'bug', label: 'Bug', icon: '🐛' },
    { key: 'feature', label: 'Feature', icon: '✨' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Feedback</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Chat-like Intro Message */}
        <View style={styles.chatBubbleLeft}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarEmoji}>🤖</Text>
          </View>
          <View style={styles.bubbleContent}>
            <Text style={styles.bubbleText}>
              Hey {userName || 'there'}! 👋 We&apos;d love to hear your thoughts on Sign-Lingo. Your feedback helps us improve!
            </Text>
          </View>
        </View>

        {/* Rating Section */}
        <View style={styles.chatBubbleLeft}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarEmoji}>⭐</Text>
          </View>
          <View style={styles.bubbleContentWide}>
            <Text style={styles.questionText}>How would you rate your experience?</Text>
            <StarRating rating={rating} onRate={setRating} />
          </View>
        </View>

        {/* Category Section */}
        <View style={styles.chatBubbleLeft}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarEmoji}>📝</Text>
          </View>
          <View style={styles.bubbleContentWide}>
            <Text style={styles.questionText}>What&apos;s this about?</Text>
            <View style={styles.chipsContainer}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.chip,
                    category === cat.key && styles.chipActive
                  ]}
                  onPress={() => setCategory(cat.key)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.chipIcon}>{cat.icon}</Text>
                  <Text style={[
                    styles.chipText,
                    category === cat.key && styles.chipTextActive
                  ]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Message Input Section */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>💬 Your message</Text>
          <View style={styles.textAreaContainer}>
            <TextInput
              style={styles.textArea}
              placeholder="Tell us what you think..."
              placeholderTextColor={COLORS.textSecondary}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              value={message}
              onChangeText={setMessage}
              maxLength={500}
            />
            <Text style={styles.charCount}>{message.length}/500</Text>
          </View>
        </View>

        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.userIconContainer}>
            <Ionicons name="person" size={20} color={COLORS.emerald} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userName || 'Guest User'}</Text>
            <Text style={styles.userEmail}>{userEmail || 'Not logged in'}</Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.9}
          style={styles.submitTouchable}
        >
          <LinearGradient
            colors={loading ? ['#64748B', '#475569'] : [COLORS.emerald, COLORS.teal]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitButton}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="#FFF" />
                <Text style={styles.submitText}>Send Feedback</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
      
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        type={alertConfig.type}
        onClose={hideAlert}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${COLORS.cardBg}E6`,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Nunito-Bold',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  headerRight: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  // Chat bubbles
  chatBubbleLeft: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.cardBg}E6`,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarEmoji: {
    fontSize: 18,
  },
  bubbleContent: {
    flex: 1,
    backgroundColor: `${COLORS.cardBg}E6`,
    borderRadius: 20,
    borderTopLeftRadius: 4,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  bubbleContentWide: {
    flex: 1,
    backgroundColor: `${COLORS.cardBg}E6`,
    borderRadius: 20,
    borderTopLeftRadius: 4,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  bubbleText: {
    fontSize: 15,
    fontFamily: 'Nunito-Regular',
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  questionText: {
    fontSize: 15,
    fontFamily: 'Nunito-Bold',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  // Star rating
  starSection: {
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  starTouchable: {
    padding: 2,
  },
  starContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  starContainerActive: {
    backgroundColor: COLORS.goldLight,
    borderColor: COLORS.gold,
    borderWidth: 3,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
    elevation: 10,
  },
  starEmoji: {
    fontSize: 16,
    opacity: 0.3,
  },
  starEmojiActive: {
    opacity: 1,
    textShadowColor: COLORS.goldGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  ratingLabel: {
    fontSize: 13,
    fontFamily: 'Nunito-Bold',
    fontWeight: '700',
    color: COLORS.gold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  // Category chips
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 50,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    gap: 6,
  },
  chipActive: {
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
    borderColor: COLORS.emerald,
  },
  chipIcon: {
    fontSize: 16,
  },
  chipText: {
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.emerald,
  },
  // Input section
  inputSection: {
    marginTop: 8,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontFamily: 'Nunito-Bold',
    fontWeight: '700',
    marginBottom: 12,
    marginLeft: 4,
  },
  textAreaContainer: {
    backgroundColor: `${COLORS.cardBg}E6`,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
  },
  textArea: {
    padding: 16,
    paddingTop: 16,
    fontSize: 15,
    fontFamily: 'Nunito-Regular',
    fontWeight: '400',
    color: COLORS.textPrimary,
    minHeight: 120,
    lineHeight: 22,
  },
  charCount: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: COLORS.textSecondary,
    textAlign: 'right',
    paddingRight: 16,
    paddingBottom: 12,
  },
  // User card
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.cardBg}E6`,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 12,
  },
  userIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: COLORS.textPrimary,
  },
  userEmail: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  // Submit button
  submitTouchable: {
    borderRadius: 50,
    overflow: 'hidden',
    shadowColor: COLORS.emerald,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  submitText: {
    fontSize: 17,
    fontFamily: 'Nunito-Bold',
    color: '#FFF',
    letterSpacing: 0.5,
  },
});