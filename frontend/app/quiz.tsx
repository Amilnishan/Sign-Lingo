// frontend/app/quiz.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  ActivityIndicator,
  Animated,
  Modal,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/constants/config';
import { Fonts } from '@/constants/fonts';

const { width, height } = Dimensions.get('window');

// Dark Theme Colors
const DarkTheme = {
  background: '#0F172A',
  cardBg: '#1E293B',
  cardBorder: 'rgba(255,255,255,0.1)',
  primary: '#10B981',
  primaryGlow: 'rgba(16, 185, 129, 0.3)',
  text: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.6)',
  textDim: 'rgba(255,255,255,0.4)',
  error: '#EF4444',
  success: '#2ECC71',
  successDark: '#27AE60',
  errorBright: '#E74C3C',
  gradient: ['#10B981', '#059669'] as const,
  gradientSuccess: ['#2ECC71', '#27AE60'] as const,
  gradientError: ['#E74C3C', '#C0392B'] as const,
};

interface QuizOption {
  word: string;
  display?: string;
  media_url?: string;
}

interface Question {
  id: number;
  type: 'pick_sign' | 'pick_word';
  question: string;
  correct_answer: string;
  options: QuizOption[];
  media_type: 'image' | 'video';
  sign_media_url?: string;
}

interface QuizData {
  lesson_id: number;
  total_questions: number;
  questions: Question[];
}

export default function QuizScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const lessonId = Number(params.lessonId) || 1;
  const lessonTitle = params.title as string || 'Quiz';
  const lessonXp = Number(params.xp) || 10;

  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Animation
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const feedbackSlideAnim = useRef(new Animated.Value(height)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchQuiz();
  }, [lessonId]);

  useEffect(() => {
    if (showFeedbackModal) {
      // Bounce animation for feedback modal
      feedbackSlideAnim.setValue(height);
      Animated.spring(feedbackSlideAnim, {
        toValue: 0,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }).start();

      // Checkmark bounce
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: 1.2, duration: 150, useNativeDriver: true }),
        Animated.spring(bounceAnim, { toValue: 1, friction: 3, useNativeDriver: true }),
      ]).start();
    } else {
      feedbackSlideAnim.setValue(height);
      bounceAnim.setValue(0);
    }
  }, [showFeedbackModal]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/quiz/${lessonId}`);
      const data = await response.json();

      if (response.ok) {
        setQuizData(data);
      } else {
        setError(data.error || 'Failed to load quiz');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const shakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleSelectAnswer = (answer: string) => {
    if (isAnswered) return;

    // Button press animation
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 50, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 50, useNativeDriver: true }),
    ]).start();

    setSelectedAnswer(answer);
    const currentQuestion = quizData!.questions[currentQuestionIndex];
    const correct = answer === currentQuestion.correct_answer;

    setIsCorrect(correct);
    setIsAnswered(true);

    if (correct) {
      setScore(score + 1);
    } else {
      setHearts(hearts - 1);
      shakeAnimation();
    }

    setTimeout(() => setShowFeedbackModal(true), 300);
  };

  const handleContinue = async () => {
    setShowFeedbackModal(false);
    setSelectedAnswer(null);
    setIsAnswered(false);

    if (hearts <= 0 && !isCorrect) {
      setShowResults(true);
      return;
    }

    if (currentQuestionIndex < quizData!.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      await completeLesson();
      setShowResults(true);
    }
  };

  const completeLesson = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      // Score is already updated by handleSelectAnswer
      const quizScore = Math.round((score / quizData!.questions.length) * 100);

      const response = await fetch(`${API_URL}/api/lesson/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          lesson_id: lessonId,
          quiz_score: quizScore,
          xp_earned: lessonXp,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const user = JSON.parse(userData);
          user.xp = data.new_total_xp;
          await AsyncStorage.setItem('userData', JSON.stringify(user));
        }
      }
    } catch (err) {
      console.error('Error completing lesson:', err);
    }
  };

  const handleFinish = () => {
    router.replace('/(tabs)/home');
  };

  const handleRetry = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setScore(0);
    setHearts(3);
    setShowResults(false);
    fetchQuiz();
  };

  const progress = quizData
    ? ((currentQuestionIndex + 1) / quizData.questions.length) * 100
    : 0;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={DarkTheme.primary} />
        <Text style={styles.loadingText}>Loading quiz...</Text>
      </View>
    );
  }

  if (error || !quizData) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="light-content" />
        <Ionicons name="alert-circle" size={64} color={DarkTheme.error} />
        <Text style={styles.errorText}>{error || 'Something went wrong'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchQuiz}>
          <LinearGradient colors={DarkTheme.gradient} style={styles.retryGradient}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  if (showResults) {
    // Score is already updated by handleSelectAnswer
    const percentage = Math.round((score / quizData.questions.length) * 100);
    const passed = percentage >= 60;

    return (
      <View style={styles.resultsContainer}>
        <StatusBar barStyle="light-content" />
        <View style={styles.resultsContent}>
          <View style={[styles.resultIconContainer, { backgroundColor: passed ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)' }]}>
            <Ionicons
              name={passed ? 'checkmark-circle' : 'close-circle'}
              size={80}
              color={passed ? DarkTheme.success : DarkTheme.errorBright}
            />
          </View>

          <Text style={styles.resultsTitle}>
            {passed ? 'Awesome!' : 'Keep Practicing!'}
          </Text>

          <Text style={styles.resultsSubtitle}>
            {passed
              ? "You've mastered this lesson!"
              : "Don't give up, you're learning!"}
          </Text>

          <View style={styles.scoreCard}>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>Score</Text>
              <Text style={styles.scoreValue}>
                {score}/{quizData.questions.length}
              </Text>
            </View>
            <View style={styles.scoreDivider} />
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>Accuracy</Text>
              <Text style={[styles.scoreValue, { color: passed ? DarkTheme.success : DarkTheme.errorBright }]}>
                {percentage}%
              </Text>
            </View>
            {passed && (
              <>
                <View style={styles.scoreDivider} />
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreLabel}>XP Earned</Text>
                  <Text style={[styles.scoreValue, { color: '#FFD700' }]}>
                    +{lessonXp}
                  </Text>
                </View>
              </>
            )}
          </View>

          <View style={styles.resultsButtons}>
            {!passed && (
              <TouchableOpacity style={styles.resultButtonSecondary} onPress={handleRetry}>
                <Ionicons name="refresh" size={20} color={DarkTheme.text} />
                <Text style={styles.resultButtonSecondaryText}>Try Again</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.resultButtonPrimary} onPress={handleFinish}>
              <LinearGradient colors={DarkTheme.gradient} style={styles.resultButtonGradient}>
                <Text style={styles.resultButtonPrimaryText}>
                  {passed ? 'Continue' : 'Back to Home'}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const currentQuestion = quizData.questions[currentQuestionIndex];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={DarkTheme.text} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>{lessonTitle}</Text>
        
        <View style={styles.heartsContainer}>
          {[...Array(3)].map((_, i) => (
            <Ionicons
              key={i}
              name={i < hearts ? 'heart' : 'heart-outline'}
              size={20}
              color={i < hearts ? DarkTheme.errorBright : DarkTheme.textDim}
              style={{ marginLeft: i > 0 ? 4 : 0 }}
            />
          ))}
        </View>
      </View>

      {/* Progress Bar - Below header */}
      <View style={styles.progressWrapper}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBar, { width: `${progress}%` }]}>
            <LinearGradient
              colors={DarkTheme.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.progressGradient}
            />
          </View>
          <View style={[styles.progressGlow, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {currentQuestionIndex + 1}/{quizData.questions.length}
        </Text>
      </View>

      {/* Question */}
      <Animated.View
        style={[styles.questionContainer, { transform: [{ translateX: shakeAnim }] }]}
      >
        {/* Question Text - Large, Centered, Heavy */}
        <Text style={styles.questionText}>{currentQuestion.question}</Text>

        {/* For pick_word type, show the sign */}
        {currentQuestion.type === 'pick_word' && currentQuestion.sign_media_url && (
          <View style={styles.signDisplay}>
            {currentQuestion.media_type === 'image' ? (
              <Image
                source={{ uri: `${API_URL}${currentQuestion.sign_media_url}` }}
                style={styles.signImage}
                resizeMode="cover"
              />
            ) : (
              <Video
                source={{ uri: `${API_URL}${currentQuestion.sign_media_url}` }}
                style={styles.signVideo}
                resizeMode={ResizeMode.COVER}
                shouldPlay
                isLooping
                isMuted={false}
              />
            )}
          </View>
        )}

        {/* Options Grid - 2x2 with Landscape Cards */}
        <View style={styles.optionsGrid}>
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === option.word;
            const showCorrect = isAnswered && option.word === currentQuestion.correct_answer;
            const showIncorrect = isAnswered && isSelected && !isCorrect;

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionCard,
                  isSelected && !isAnswered && styles.optionCardSelected,
                  showCorrect && styles.optionCardCorrect,
                  showIncorrect && styles.optionCardIncorrect,
                ]}
                onPress={() => handleSelectAnswer(option.word)}
                disabled={isAnswered}
                activeOpacity={0.8}
              >
                {/* Glow effect for selected */}
                {isSelected && !isAnswered && <View style={styles.selectedGlow} />}
                
                {currentQuestion.type === 'pick_sign' && option.media_url ? (
                  <View style={styles.optionMediaContainer}>
                    {currentQuestion.media_type === 'image' ? (
                      <Image
                        source={{ uri: `${API_URL}${option.media_url}` }}
                        style={styles.optionImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Video
                        source={{ uri: `${API_URL}${option.media_url}` }}
                        style={styles.optionVideo}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay
                        isLooping
                        isMuted
                      />
                    )}
                  </View>
                ) : (
                  <Text
                    style={[
                      styles.optionText,
                      showCorrect && styles.optionTextCorrect,
                      showIncorrect && styles.optionTextIncorrect,
                    ]}
                  >
                    {option.display || option.word.replace('_', ' ')}
                  </Text>
                )}

                {showCorrect && (
                  <View style={styles.checkmarkBadge}>
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>

      {/* Feedback Modal - Slides up with bounce */}
      <Modal visible={showFeedbackModal} transparent animationType="none">
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.feedbackSheet,
              { 
                backgroundColor: isCorrect ? DarkTheme.success : DarkTheme.errorBright,
                transform: [{ translateY: feedbackSlideAnim }] 
              },
            ]}
          >
            <View style={styles.feedbackHandle} />

            <View style={styles.feedbackContent}>
              {/* Large animated checkmark/x */}
              <Animated.View style={[styles.feedbackIconCircle, { transform: [{ scale: bounceAnim }] }]}>
                <Ionicons
                  name={isCorrect ? 'checkmark' : 'close'}
                  size={48}
                  color={isCorrect ? DarkTheme.success : DarkTheme.errorBright}
                />
              </Animated.View>

              <Text style={styles.feedbackTitle}>
                {isCorrect ? 'Correct!' : 'Incorrect'}
              </Text>

              {!isCorrect && (
                <Text style={styles.feedbackAnswer}>
                  The correct answer is: {currentQuestion.correct_answer.replace('_', ' ')}
                </Text>
              )}

              {/* 3D Continue Button */}
              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleContinue}
                activeOpacity={0.9}
              >
                <View style={styles.continueButtonInner}>
                  <Text style={styles.continueButtonText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={20} color={isCorrect ? DarkTheme.success : DarkTheme.errorBright} />
                </View>
                <View style={styles.continueButtonShadow} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkTheme.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DarkTheme.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: DarkTheme.textMuted,
    ...Fonts.regular,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DarkTheme.background,
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: DarkTheme.text,
    textAlign: 'center',
    ...Fonts.regular,
  },
  retryButton: {
    marginTop: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  retryGradient: {
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    ...Fonts.bold,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 18,
    ...Fonts.bold,
    color: DarkTheme.text,
    zIndex: -1,
  },
  heartsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Progress Bar
  progressWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'visible',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressGradient: {
    flex: 1,
  },
  progressGlow: {
    position: 'absolute',
    top: -2,
    left: 0,
    height: 12,
    borderRadius: 6,
    backgroundColor: DarkTheme.primary,
    opacity: 0.4,
    shadowColor: DarkTheme.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  progressText: {
    fontSize: 14,
    color: DarkTheme.textMuted,
    ...Fonts.regular,
    minWidth: 40,
    textAlign: 'right',
  },
  // Question
  questionContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  questionText: {
    fontSize: 28,
    ...Fonts.bold,
    color: DarkTheme.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  // Sign Display
  signDisplay: {
    width: width * 0.6,
    aspectRatio: 16 / 9,
    alignSelf: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0D1520',
    marginBottom: 24,
  },
  signImage: {
    width: '100%',
    height: '100%',
  },
  signVideo: {
    width: '100%',
    height: '100%',
  },
  // Options Grid
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    paddingBottom: 20,
  },
  optionCard: {
    width: (width - 52) / 2,
    aspectRatio: 16 / 10, // Landscape rectangular cards
    backgroundColor: DarkTheme.cardBg,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: DarkTheme.cardBorder,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  optionCardSelected: {
    borderColor: DarkTheme.primary,
    borderWidth: 3,
  },
  selectedGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: DarkTheme.primaryGlow,
    opacity: 0.3,
  },
  optionCardCorrect: {
    borderColor: DarkTheme.success,
    borderWidth: 3,
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
  },
  optionCardIncorrect: {
    borderColor: DarkTheme.errorBright,
    borderWidth: 3,
    backgroundColor: 'rgba(231, 76, 60, 0.15)',
  },
  optionMediaContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0D1520',
  },
  optionImage: {
    width: '100%',
    height: '100%',
  },
  optionVideo: {
    width: '100%',
    height: '100%',
  },
  optionText: {
    fontSize: 18,
    ...Fonts.bold,
    color: DarkTheme.text,
    textAlign: 'center',
    textAlignVertical: 'center',
    paddingHorizontal: 12,
    marginTop: -19,
    marginBottom: 15,
  },
  optionTextCorrect: {
    color: DarkTheme.success,
  },
  optionTextIncorrect: {
    color: DarkTheme.errorBright,
  },
  checkmarkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: DarkTheme.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  // Feedback Sheet
  feedbackSheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  feedbackHandle: {
    width: 48,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 24,
  },
  feedbackContent: {
    alignItems: 'center',
  },
  feedbackIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  feedbackTitle: {
    fontSize: 28,
    ...Fonts.bold,
    color: '#fff',
    marginBottom: 8,
  },
  feedbackAnswer: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 24,
    ...Fonts.regular,
  },
  // 3D Continue Button
  continueButton: {
    width: '100%',
    position: 'relative',
    marginTop: 8,
  },
  continueButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
    zIndex: 2,
  },
  continueButtonShadow: {
    position: 'absolute',
    bottom: -4,
    left: 0,
    right: 0,
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 16,
    zIndex: 1,
  },
  continueButtonText: {
    fontSize: 18,
    ...Fonts.bold,
    color: DarkTheme.cardBg,
  },
  // Results Screen
  resultsContainer: {
    flex: 1,
    backgroundColor: DarkTheme.background,
    justifyContent: 'center',
    padding: 24,
  },
  resultsContent: {
    alignItems: 'center',
  },
  resultIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  resultsTitle: {
    fontSize: 32,
    ...Fonts.bold,
    color: DarkTheme.text,
    marginBottom: 8,
  },
  resultsSubtitle: {
    fontSize: 16,
    ...Fonts.regular,
    color: DarkTheme.textMuted,
    textAlign: 'center',
    marginBottom: 32,
  },
  scoreCard: {
    backgroundColor: DarkTheme.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: DarkTheme.cardBorder,
    padding: 24,
    width: '100%',
    marginBottom: 32,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  scoreLabel: {
    fontSize: 16,
    ...Fonts.regular,
    color: DarkTheme.textMuted,
  },
  scoreValue: {
    fontSize: 20,
    ...Fonts.bold,
    color: DarkTheme.text,
  },
  scoreDivider: {
    height: 1,
    backgroundColor: DarkTheme.cardBorder,
    marginVertical: 12,
  },
  resultsButtons: {
    width: '100%',
    gap: 12,
  },
  resultButtonPrimary: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: DarkTheme.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  resultButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  resultButtonPrimaryText: {
    fontSize: 18,
    ...Fonts.bold,
    color: '#fff',
  },
  resultButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
  },
  resultButtonSecondaryText: {
    fontSize: 18,
    ...Fonts.bold,
    color: DarkTheme.text,
  },
});
