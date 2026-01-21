// frontend/app/feedback.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Fonts } from '@/constants/fonts';
import { API_URL } from '@/constants/config';

type Category = 'general' | 'bug' | 'feature';

export default function FeedbackScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState<Category>('general');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

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
      Alert.alert('Error', 'Please enter your feedback message');
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
        Alert.alert(
          'Thank You! 🎉',
          'Your feedback has been submitted successfully. We appreciate your input!',
          [
            { text: 'OK', onPress: () => router.back() }
          ]
        );
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const categories: { key: Category; label: string; icon: string }[] = [
    { key: 'general', label: 'General', icon: '💭' },
    { key: 'bug', label: 'Bug Report', icon: '🐛' },
    { key: 'feature', label: 'Feature Request', icon: '✨' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Send Feedback</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Intro */}
        <View style={styles.introSection}>
          <Text style={styles.introIcon}>💬</Text>
          <Text style={styles.introTitle}>We'd love to hear from you!</Text>
          <Text style={styles.introText}>
            Your feedback helps us improve Sign-Lingo and make learning ASL better for everyone.
          </Text>
        </View>

        {/* Rating */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How would you rate your experience?</Text>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity 
                key={star} 
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <Text style={[
                  styles.star,
                  star <= rating && styles.starActive
                ]}>
                  ⭐
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingLabel}>
            {rating === 1 && 'Poor'}
            {rating === 2 && 'Fair'}
            {rating === 3 && 'Good'}
            {rating === 4 && 'Very Good'}
            {rating === 5 && 'Excellent!'}
          </Text>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.categoryContainer}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.categoryButton,
                  category === cat.key && styles.categoryButtonActive
                ]}
                onPress={() => setCategory(cat.key)}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text style={[
                  styles.categoryText,
                  category === cat.key && styles.categoryTextActive
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Message */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Feedback</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Tell us what you think... What did you like? What could be better?"
            placeholderTextColor="#999"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            value={message}
            onChangeText={setMessage}
          />
          <Text style={styles.charCount}>{message.length}/500</Text>
        </View>

        {/* User Info Preview */}
        <View style={styles.userInfoCard}>
          <Text style={styles.userInfoLabel}>Submitting as:</Text>
          <Text style={styles.userInfoName}>{userName || 'Guest User'}</Text>
          <Text style={styles.userInfoEmail}>{userEmail || 'Not logged in'}</Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Feedback</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#2ECC71',
  },
  headerTitle: {
    fontSize: 20,
    ...Fonts.appName,
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  introSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  introIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  introTitle: {
    fontSize: 20,
    ...Fonts.appName,
    color: '#1a1a2e',
    marginBottom: 8,
    textAlign: 'center',
  },
  introText: {
    fontSize: 14,
    ...Fonts.regular,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    ...Fonts.regular,
    color: '#1a1a2e',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  starButton: {
    padding: 4,
  },
  star: {
    fontSize: 32,
    opacity: 0.3,
  },
  starActive: {
    opacity: 1,
  },
  ratingLabel: {
    textAlign: 'center',
    fontSize: 16,
    color: '#2ECC71',
    ...Fonts.regular,
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  categoryButtonActive: {
    borderColor: '#2ECC71',
    backgroundColor: '#e8f8f0',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    ...Fonts.regular,
    color: '#7f8c8d',
  },
  categoryTextActive: {
    color: '#2ECC71',
  },
  textArea: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    ...Fonts.regular,
    minHeight: 150,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#1a1a2e',
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    ...Fonts.regular,
    color: '#7f8c8d',
    marginTop: 8,
  },
  userInfoCard: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  userInfoLabel: {
    fontSize: 12,
    ...Fonts.regular,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  userInfoName: {
    fontSize: 16,
    ...Fonts.regular,
    color: '#1a1a2e',
  },
  userInfoEmail: {
    fontSize: 14,
    ...Fonts.regular,
    color: '#7f8c8d',
  },
  submitButton: {
    backgroundColor: '#2ECC71',
    borderRadius: 28,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#2ECC71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 18,
    ...Fonts.regular,
    color: '#fff',
  },
});
