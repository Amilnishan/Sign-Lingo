// frontend/app/quiz.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '@/constants/config';
import { Fonts } from '@/constants/fonts';
import { CustomAlert } from '@/components/custom-alert';
import { playSound } from '@/utils/audio';
import { useQuests } from '@/contexts/QuestContext';
import { recordSignAttempt } from '@/utils/weaknessStorage';
import { useUser } from '@/contexts/UserContext';

const PREDICTION_INTERVAL = 150; // ms between frame captures
const CONFIDENCE_THRESHOLD = 0.75;
const WRONG_SOUND_COOLDOWN = 1500; // throttle between wrong-answer sounds
const XP_PER_QUESTION = 5; // 5 XP per correct answer, 6 questions = 30 XP max

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
  type: 'pick_sign' | 'pick_word' | 'show_sign';
  question: string;
  correct_answer: string;
  options: QuizOption[];
  media_type: 'image' | 'video';
  sign_media_url?: string;
  target_sign?: string;
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
  const { updateQuestProgress } = useQuests();
  const {
    completeLesson: ctxCompleteLesson,
    syncXPFromServer,
    updateStreak: ctxUpdateStreak,
    syncProgressToBackend,
  } = useUser();

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
  const [isSkipped, setIsSkipped] = useState(false);
  const [showQuitAlert, setShowQuitAlert] = useState(false);

  // Camera state for show_sign questions
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const isCameraReady = useRef(false);
  const isProcessingFrame = useRef(false);
  const cameraIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [cameraFeedback, setCameraFeedback] = useState('Position your hand in frame');
  const [cameraError, setCameraError] = useState(false); // RED state for wrong sign detection
  const [framesCollected, setFramesCollected] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const wrongSoundCooldownRef = useRef(false);

  // Animation
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const feedbackSlideAnim = useRef(new Animated.Value(height)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const lessonStartTime = useRef(Date.now());

  useEffect(() => {
    lessonStartTime.current = Date.now();
    fetchQuiz();
  }, [lessonId]);

  // Start/stop camera capture when on a show_sign question
  useEffect(() => {
    if (!quizData) return;
    const currentQ = quizData.questions[currentQuestionIndex];

    if (currentQ?.type === 'show_sign' && cameraPermission?.granted && !isAnswered) {
      // Reset prediction buffer on backend
      axios.post(`${API_URL}/predict/reset`).catch(() => {});
      setCameraFeedback('Position your hand in frame');
      setCameraError(false);
      setFramesCollected(0);
      isCameraReady.current = false;
      wrongSoundCooldownRef.current = false;

      // Start pulse animation
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      pulse.start();

      // Start capture interval
      cameraIntervalRef.current = setInterval(() => {
        captureAndPredict(currentQ.target_sign || currentQ.correct_answer);
      }, PREDICTION_INTERVAL);

      return () => {
        pulse.stop();
        if (cameraIntervalRef.current) {
          clearInterval(cameraIntervalRef.current);
          cameraIntervalRef.current = null;
        }
      };
    } else {
      // Cleanup if not a camera question
      if (cameraIntervalRef.current) {
        clearInterval(cameraIntervalRef.current);
        cameraIntervalRef.current = null;
      }
    }
  }, [currentQuestionIndex, quizData, cameraPermission?.granted, isAnswered]);

  const captureAndPredict = useCallback(async (targetSign: string) => {
    if (!isCameraReady.current || isProcessingFrame.current || !cameraRef.current) return;
    isProcessingFrame.current = true;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.5,
        shutterSound: false,
      });

      if (!photo?.base64) {
        isProcessingFrame.current = false;
        return;
      }

      const response = await axios.post(
        `${API_URL}/predict`,
        { image: photo.base64 },
        { timeout: 3000 }
      );

      const { sign, confidence, frames_collected, frames_needed } = response.data;

      // Still collecting frames
      if (frames_needed && frames_collected < frames_needed) {
        setFramesCollected(frames_collected);
        setCameraFeedback(`Analyzing... (${frames_collected}/${frames_needed} frames)`);
        isProcessingFrame.current = false;
        return;
      }

      // ── Scenario A — SUCCESS ──
      if (sign && confidence >= CONFIDENCE_THRESHOLD && sign === targetSign) {
        if (cameraIntervalRef.current) {
          clearInterval(cameraIntervalRef.current);
          cameraIntervalRef.current = null;
        }
        setCameraError(false);
        setCameraFeedback(`${sign.replace('_', ' ')} - Correct!`);
        // Record correct attempt (may graduate a weak sign)
        recordSignAttempt(targetSign, true).catch(() => {});
        handleCameraCorrect(targetSign);
      }
      // ── Scenario B — HARD ERROR (confident wrong sign → RED) ──
      else if (sign && confidence >= CONFIDENCE_THRESHOLD && sign !== targetSign) {
        setCameraError(true);
        setCameraFeedback(`Incorrect: That looks like ${sign.replace('_', ' ')}`);
        // Record wrong attempt → adds to weak signs
        recordSignAttempt(targetSign, false).catch(() => {});
        // Throttle sound + haptic so they don't spam
        if (!wrongSoundCooldownRef.current) {
          wrongSoundCooldownRef.current = true;
          playSound('wrong');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setTimeout(() => { wrongSoundCooldownRef.current = false; }, WRONG_SOUND_COOLDOWN);
        }
      }
      // ── Scenario C — LOW CONFIDENCE (keep trying) ──
      else if (sign && confidence >= 0.4) {
        setCameraError(false);
        setCameraFeedback(`Detected: ${sign?.replace('_', ' ')} (${Math.round(confidence * 100)}%)`);
      } else if (sign) {
        setCameraError(false);
        setCameraFeedback('Keep holding the sign...');
      } else {
        setCameraError(false);
        setCameraFeedback('Position your hand in frame');
      }
    } catch (error: any) {
      // Silently ignore errors - don't show distracting messages
    } finally {
      isProcessingFrame.current = false;
    }
  }, []);

  const handleCameraCorrect = (answer: string) => {
    // Use the same flow as handleSelectAnswer
    setSelectedAnswer(answer);
    setIsCorrect(true);
    setIsAnswered(true);
    setScore((prev) => prev + 1);
    playSound('correct');
    setTimeout(() => setShowFeedbackModal(true), 300);
  };

  const handleCameraSkip = () => {
    // Skip — NO score, NO XP. Just advance to the next question.
    setSelectedAnswer(null);
    setIsCorrect(false);
    setIsSkipped(true);
    setIsAnswered(true);
    // Stop capturing
    if (cameraIntervalRef.current) {
      clearInterval(cameraIntervalRef.current);
      cameraIntervalRef.current = null;
    }
    setCameraFeedback("No worries! We'll come back to this.");
    setTimeout(() => setShowFeedbackModal(true), 200);
  };

  const handleCameraReady = () => {
    isCameraReady.current = true;
  };

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
      playSound('correct');
    } else {
      setHearts(hearts - 1);
      shakeAnimation();
      playSound('wrong');
    }

    setTimeout(() => setShowFeedbackModal(true), 300);
  };

  const handleContinue = async () => {
    setShowFeedbackModal(false);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setIsSkipped(false);

    // Reset camera state for next question
    setCameraFeedback('Position your hand in frame');
    setFramesCollected(0);
    isCameraReady.current = false;
    isProcessingFrame.current = false;

    if (hearts <= 0 && !isCorrect && !isSkipped) {
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

      // Calculate XP based on correct answers (5 XP per correct answer)
      const earnedXp = score * XP_PER_QUESTION;
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
          xp_earned: earnedXp,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Server confirmed: use server-authoritative XP total
        await ctxCompleteLesson(lessonId, 0);   // register lesson, but 0 XP (server already $inc'd)
        await syncXPFromServer(data.new_total_xp);
        console.log('[Quiz] Server confirmed XP:', data.new_total_xp);
      } else {
        // Server failed – fall back to optimistic local update
        console.warn('[Quiz] Server returned', response.status, '– using local XP');
        await ctxCompleteLesson(lessonId, earnedXp);
      }

      // --- Track all stats locally ---

      // 1. Quizzes attempted
      const quizCount = Number(await AsyncStorage.getItem('quizzesAttempted') || '0') + 1;
      await AsyncStorage.setItem('quizzesAttempted', String(quizCount));

      // 2. Accuracy: store total correct & total questions, compute average
      const prevCorrect = Number(await AsyncStorage.getItem('totalCorrectAnswers') || '0');
      const prevTotal = Number(await AsyncStorage.getItem('totalQuestionsAnswered') || '0');
      await AsyncStorage.setItem('totalCorrectAnswers', String(prevCorrect + score));
      await AsyncStorage.setItem('totalQuestionsAnswered', String(prevTotal + quizData!.questions.length));

      // 3. Signs learned: count unique words from completed lessons
      const signsData = await AsyncStorage.getItem('signsLearned');
      const signsSet: string[] = signsData ? JSON.parse(signsData) : [];
      const params_words = (params.words as string) || '[]';
      try {
        const lessonWords: string[] = JSON.parse(params_words);
        lessonWords.forEach(w => { if (!signsSet.includes(w)) signsSet.push(w); });
      } catch { /* ignore parse error */ }
      await AsyncStorage.setItem('signsLearned', JSON.stringify(signsSet));

      // 4. Weekly XP: store XP earned per day-of-week (Mon=0..Sun=6)
      const weeklyData = await AsyncStorage.getItem('weeklyXP');
      const weekly: number[] = weeklyData ? JSON.parse(weeklyData) : [0, 0, 0, 0, 0, 0, 0];
      const weeklyDate = await AsyncStorage.getItem('weeklyXPDate');
      const today = new Date();
      const todayStr = today.toDateString();
      // Reset weekly data if it's a new week (Monday reset)
      if (weeklyDate) {
        const lastDate = new Date(weeklyDate);
        const daysSince = Math.floor((today.getTime() - lastDate.getTime()) / 86400000);
        if (daysSince >= 7) {
          weekly.fill(0);
        }
      }
      const dayIndex = (today.getDay() + 6) % 7; // Mon=0, Sun=6
      weekly[dayIndex] += score * XP_PER_QUESTION;
      await AsyncStorage.setItem('weeklyXP', JSON.stringify(weekly));
      await AsyncStorage.setItem('weeklyXPDate', todayStr);

      // 5. Day streak
      const lastActiveDate = await AsyncStorage.getItem('lastActiveDate');
      let streak = Number(await AsyncStorage.getItem('dayStreak') || '0');
      if (lastActiveDate) {
        const last = new Date(lastActiveDate);
        const diffDays = Math.floor((today.getTime() - last.getTime()) / 86400000);
        if (last.toDateString() === todayStr) {
          // Same day, streak unchanged
        } else if (diffDays === 1) {
          streak += 1;
        } else {
          streak = 1; // Reset streak
        }
      } else {
        streak = 1; // First time
      }
      await AsyncStorage.setItem('dayStreak', String(streak));
      await AsyncStorage.setItem('lastActiveDate', todayStr);
      ctxUpdateStreak(streak);

      // Trigger another sync so the updated streak reaches the server
      // (the earlier sync from ctxCompleteLesson may have fired before streak was calculated)
      setTimeout(() => syncProgressToBackend(), 500);

      // 6. Lessons completed count
      const lessonsCount = Number(await AsyncStorage.getItem('lessonsCompletedCount') || '0') + 1;
      await AsyncStorage.setItem('lessonsCompletedCount', String(lessonsCount));

      // 7. Time spent (in minutes)
      const timeElapsed = Math.round((Date.now() - lessonStartTime.current) / 60000);
      const prevTime = Number(await AsyncStorage.getItem('timeSpentMinutes') || '0');
      await AsyncStorage.setItem('timeSpentMinutes', String(prevTime + Math.max(timeElapsed, 1)));

      // ── 8. Update Daily Quest progress ──
      const earnedXpForQuest = score * XP_PER_QUESTION;
      updateQuestProgress('quiz', 1);                        // "Attend X Quizzes"
      updateQuestProgress('lesson', 1);                      // "Finish X Lessons"
      updateQuestProgress('xp', earnedXpForQuest);           // "Collect X XP"
      // Count new signs learned this lesson
      try {
        const pw = (params.words as string) || '[]';
        const words: string[] = JSON.parse(pw);
        if (words.length > 0) updateQuestProgress('sign', words.length);
      } catch { /* ignore */ }

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
    // Calculate XP earned based on correct answers
    const percentage = Math.round((score / quizData.questions.length) * 100);
    const earnedXp = score * XP_PER_QUESTION;
    const maxXp = quizData.questions.length * XP_PER_QUESTION;
    const passed = percentage >= 60;
    const perfect = score === quizData.questions.length;

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
            {perfect ? 'Awesome!' : passed ? 'Good Job!' : 'Keep Practicing!'}
          </Text>

          <Text style={styles.resultsSubtitle}>
            {perfect
              ? "You've mastered this lesson!"
              : passed
                ? `You got ${score} out of ${quizData.questions.length} correct!`
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
            <View style={styles.scoreDivider} />
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>XP Earned</Text>
              <Text style={[styles.scoreValue, { color: '#FFD700' }]}>
                +{earnedXp}/{maxXp}
              </Text>
            </View>
          </View>

          <View style={styles.resultsButtons}>
            {!perfect && (
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
        <TouchableOpacity style={styles.closeButton} onPress={() => setShowQuitAlert(true)}>
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

        {/* For show_sign type, show inline camera */}
        {currentQuestion.type === 'show_sign' && (
          <View style={{ flex: 1, alignItems: 'center', gap: 12 }}>
            {!cameraPermission?.granted ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
                <Ionicons name="camera-outline" size={64} color={DarkTheme.textMuted} />
                <Text style={{ color: DarkTheme.textMuted, fontSize: 16, textAlign: 'center', ...Fonts.regular }}>
                  Camera access is needed to detect your signs
                </Text>
                <TouchableOpacity onPress={requestCameraPermission} style={{ borderRadius: 16, overflow: 'hidden' }}>
                  <LinearGradient colors={DarkTheme.gradient} style={{ paddingHorizontal: 28, paddingVertical: 14 }}>
                    <Text style={{ color: '#fff', fontSize: 16, ...Fonts.bold }}>Enable Camera</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Camera Feed */}
                <View style={{
                  width: width - 40,
                  height: (width - 40) * 1.1,
                  borderRadius: 20,
                  overflow: 'hidden',
                  borderWidth: 3,
                  borderColor: isAnswered && isCorrect
                    ? DarkTheme.success
                    : cameraError
                      ? DarkTheme.errorBright
                      : DarkTheme.primary,
                  position: 'relative',
                }}>
                  <CameraView
                    ref={cameraRef}
                    style={{ flex: 1 }}
                    facing="front"
                    onCameraReady={handleCameraReady}
                  >
                    {/* LIVE indicator */}
                    <View style={{ position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, gap: 6 }}>
                      <Animated.View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', transform: [{ scale: pulseAnim }] }} />
                      <Text style={{ color: '#fff', fontSize: 12, ...Fonts.bold }}>LIVE</Text>
                    </View>

                    {/* Success Overlay */}
                    {isAnswered && isCorrect && (
                      <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(46, 204, 113, 0.25)', justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(46, 204, 113, 0.9)', justifyContent: 'center', alignItems: 'center' }}>
                          <Ionicons name="checkmark" size={48} color="#fff" />
                        </View>
                      </View>
                    )}
                  </CameraView>
                </View>

                {/* Detection Feedback */}
                <View style={{
                  backgroundColor: cameraError
                    ? 'rgba(239, 68, 68, 0.2)'
                    : isAnswered && isCorrect
                      ? 'rgba(46, 204, 113, 0.15)'
                      : DarkTheme.cardBg,
                  borderRadius: 14,
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: cameraError
                    ? DarkTheme.errorBright
                    : isAnswered && isCorrect
                      ? DarkTheme.success
                      : isSkipped
                        ? '#475569'
                        : DarkTheme.cardBorder,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  width: width - 40,
                }}>
                  <Ionicons
                    name={isSkipped ? 'time-outline' : isAnswered && isCorrect ? 'checkmark-circle' : cameraError ? 'close-circle' : 'scan-outline'}
                    size={22}
                    color={isSkipped ? '#94A3B8' : isAnswered && isCorrect ? DarkTheme.success : cameraError ? DarkTheme.errorBright : DarkTheme.primary}
                  />
                  <Text style={{ color: isSkipped ? '#94A3B8' : cameraError ? DarkTheme.errorBright : DarkTheme.text, fontSize: 15, ...Fonts.regular, flex: 1 }}>
                    {cameraFeedback}
                  </Text>
                </View>

                {/* Skip Button */}
                {!isAnswered && (
                  <TouchableOpacity
                    onPress={handleCameraSkip}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingVertical: 10,
                      paddingHorizontal: 20,
                    }}
                  >
                    <Ionicons name="play-skip-forward" size={18} color={DarkTheme.textMuted} />
                    <Text style={{ color: DarkTheme.textMuted, fontSize: 15, ...Fonts.regular }}>Skip this question</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}

        {/* For pick_word type, show the sign (only render when this question is active) */}
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
                key={`sign-${currentQuestionIndex}`}
                source={{ uri: `${API_URL}${currentQuestion.sign_media_url}` }}
                style={styles.signVideo}
                resizeMode={ResizeMode.COVER}
                shouldPlay={currentQuestion.type === 'pick_word'}
                isLooping
                isMuted={false}
              />
            )}
          </View>
        )}

        {/* Options Grid - 2x2 with Landscape Cards (only for non-camera questions) */}
        {currentQuestion.type !== 'show_sign' && (
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
                        key={`opt-${currentQuestionIndex}-${index}`}
                        source={{ uri: `${API_URL}${option.media_url}` }}
                        style={styles.optionVideo}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay={currentQuestion.type === 'pick_sign'}
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
        )}
      </Animated.View>

      {/* Feedback Modal - Slides up with bounce */}
      <Modal visible={showFeedbackModal} transparent animationType="none">
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.feedbackSheet,
              { 
                backgroundColor: isSkipped ? '#475569' : isCorrect ? DarkTheme.success : DarkTheme.errorBright,
                transform: [{ translateY: feedbackSlideAnim }] 
              },
            ]}
          >
            <View style={styles.feedbackHandle} />

            <View style={styles.feedbackContent}>
              {/* Large animated checkmark/x/skip icon */}
              <Animated.View style={[styles.feedbackIconCircle, { transform: [{ scale: bounceAnim }] }]}>
                <Ionicons
                  name={isSkipped ? 'arrow-forward-circle' : isCorrect ? 'checkmark' : 'close'}
                  size={48}
                  color={isSkipped ? '#94A3B8' : isCorrect ? DarkTheme.success : DarkTheme.errorBright}
                />
              </Animated.View>

              <Text style={styles.feedbackTitle}>
                {isSkipped ? 'Skipped' : isCorrect ? 'Correct!' : 'Incorrect'}
              </Text>

              {isSkipped && (
                <Text style={styles.feedbackAnswer}>
                  No worries! We'll come back to this.
                </Text>
              )}

              {!isCorrect && !isSkipped && (
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
                  <Ionicons name="arrow-forward" size={20} color={isSkipped ? '#475569' : isCorrect ? DarkTheme.success : DarkTheme.errorBright} />
                </View>
                <View style={styles.continueButtonShadow} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Quit Confirmation Alert */}
      <CustomAlert
        visible={showQuitAlert}
        title="Quit Lesson?"
        message="Are you sure you want to quit? Your progress in this lesson will be lost."
        type="warning"
        onClose={() => setShowQuitAlert(false)}
        buttons={[
          { text: 'Cancel', style: 'cancel' },
          { text: 'Quit', style: 'destructive', onPress: () => router.back() },
        ]}
      />
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
