// frontend/app/flashcard.tsx
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
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
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
  gradient: ['#10B981', '#059669'] as const,
};

interface Sign {
  word: string;
  display_name: string;
  media_type: 'image' | 'video';
  media_url: string;
}

interface LessonContent {
  lesson_id: number;
  title: string;
  content_type: 'image' | 'video';
  signs: Sign[];
}

export default function FlashcardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const lessonId = Number(params.lessonId) || 1;
  const lessonTitle = params.title as string || 'Flashcards';
  const lessonXp = Number(params.xp) || 10;

  const [lessonContent, setLessonContent] = useState<LessonContent | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Animation values
  const flipAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressGlow = useRef(new Animated.Value(0)).current;
  const [isFlipped, setIsFlipped] = useState(false);

  // Video ref
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    fetchLessonContent();
    // Animate progress bar glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(progressGlow, { toValue: 1, duration: 1500, useNativeDriver: false }),
        Animated.timing(progressGlow, { toValue: 0, duration: 1500, useNativeDriver: false }),
      ])
    ).start();
  }, [lessonId]);

  const fetchLessonContent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/lesson/${lessonId}`);
      const data = await response.json();
      
      if (response.ok) {
        setLessonContent(data);
      } else {
        setError(data.error || 'Failed to load lesson');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!lessonContent) return;
    
    if (currentIndex < lessonContent.signs.length - 1) {
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
        flipAnim.setValue(0);
        slideAnim.setValue(width);
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    } else {
      router.push({
        pathname: '/quiz',
        params: {
          lessonId: lessonId,
          title: lessonTitle,
          xp: lessonXp,
        },
      });
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentIndex(currentIndex - 1);
        setIsFlipped(false);
        flipAnim.setValue(0);
        slideAnim.setValue(-width);
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const handleFlip = () => {
    const toValue = isFlipped ? 0 : 1;
    Animated.spring(flipAnim, {
      toValue,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  };

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const progress = lessonContent 
    ? ((currentIndex + 1) / lessonContent.signs.length) * 100 
    : 0;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={DarkTheme.primary} />
        <Text style={styles.loadingText}>Loading lesson...</Text>
      </View>
    );
  }

  if (error || !lessonContent) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="light-content" />
        <Ionicons name="alert-circle" size={64} color={DarkTheme.error} />
        <Text style={styles.errorText}>{error || 'Something went wrong'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchLessonContent}>
          <LinearGradient colors={DarkTheme.gradient} style={styles.retryGradient}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  const currentSign = lessonContent.signs[currentIndex];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />
      
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={24} color={DarkTheme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{lessonTitle}</Text>
        <View style={styles.stepCounter}>
          <Text style={styles.stepCounterText}>{currentIndex + 1}/{lessonContent.signs.length}</Text>
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
          {/* Glow effect */}
          <View style={[styles.progressGlow, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{Math.round(progress)}%</Text>
      </View>

      {/* Flashcard */}
      <Animated.View 
        style={[
          styles.cardContainer,
          { transform: [{ translateX: slideAnim }] }
        ]}
      >
        <TouchableOpacity 
          activeOpacity={0.95}
          onPress={handleFlip}
          style={styles.cardTouchable}
        >
          {/* Front of card - Sign */}
          <Animated.View 
            style={[
              styles.card,
              styles.cardFront,
              { transform: [{ rotateY: frontInterpolate }] }
            ]}
          >
            {/* Glassmorphism Card */}
            <View style={styles.glassCard}>
              {/* 16:9 Video/Image Container */}
              <View style={styles.mediaWrapper}>
                <View style={styles.mediaContainer}>
                  {currentSign.media_type === 'image' ? (
                    <Image
                      source={{ uri: `${API_URL}${currentSign.media_url}` }}
                      style={styles.signImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Video
                      ref={videoRef}
                      source={{ uri: `${API_URL}${currentSign.media_url}` }}
                      style={styles.signVideo}
                      resizeMode={ResizeMode.COVER}
                      shouldPlay
                      isLooping
                      isMuted={true}
                    />
                  )}
                </View>
              </View>
              
              {/* Sign Name - Large Bold White */}
              <Text style={styles.signName}>{currentSign.display_name}</Text>
              
              {/* Tap to flip hint */}
              <View style={styles.flipHintContainer}>
                <Ionicons name="refresh" size={16} color={DarkTheme.textDim} />
                <Text style={styles.flipHint}>Tap to flip</Text>
              </View>
            </View>
          </Animated.View>

          {/* Back of card - Word */}
          <Animated.View 
            style={[
              styles.card,
              styles.cardBack,
              { transform: [{ rotateY: backInterpolate }] }
            ]}
          >
            <View style={styles.glassCard}>
              <View style={styles.backContent}>
                <View style={styles.signIconContainer}>
                  <Ionicons name="hand-left" size={48} color={DarkTheme.primary} />
                </View>
                <Text style={styles.wordLarge}>{currentSign.display_name}</Text>
                <View style={styles.divider} />
                <Text style={styles.wordDescription}>
                  {currentSign.media_type === 'image' 
                    ? `Letter "${currentSign.word}" in ASL` 
                    : `Sign for "${currentSign.display_name}"`}
                </Text>
                <View style={styles.tipContainer}>
                  <Ionicons name="bulb" size={20} color={DarkTheme.primary} />
                  <Text style={styles.tipText}>
                    Practice this sign until you feel comfortable
                  </Text>
                </View>
              </View>
              
              <View style={styles.flipHintContainer}>
                <Ionicons name="refresh" size={16} color={DarkTheme.textDim} />
                <Text style={styles.flipHint}>Tap to flip back</Text>
              </View>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>

      {/* Navigation - Bottom */}
      <View style={styles.navigation}>
        {/* Previous - Icon only button */}
        <TouchableOpacity
          style={[
            styles.prevButton,
            currentIndex === 0 && styles.prevButtonDisabled
          ]}
          onPress={handlePrevious}
          disabled={currentIndex === 0}
        >
          <Ionicons 
            name="chevron-back" 
            size={28} 
            color={currentIndex === 0 ? DarkTheme.textDim : DarkTheme.text} 
          />
        </TouchableOpacity>

        {/* Next - Large Green Gradient Button */}
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={DarkTheme.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextGradient}
          >
            <Text style={styles.nextButtonText}>
              {currentIndex === lessonContent.signs.length - 1 ? 'Start Quiz' : 'Next'}
            </Text>
            <Ionicons name="arrow-forward" size={22} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'visible',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressGradient: {
    flex: 1,
    borderRadius: 3,
  },
  progressGlow: {
    position: 'absolute',
    top: -2,
    left: 0,
    height: 10,
    borderRadius: 5,
    backgroundColor: DarkTheme.primary,
    opacity: 0.4,
    shadowColor: DarkTheme.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  progressText: {
    fontSize: 14,
    color: DarkTheme.primary,
    ...Fonts.bold,
    minWidth: 40,
    textAlign: 'right',
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
  stepCounter: {
    minWidth: 44,
    alignItems: 'flex-end',
  },
  stepCounterText: {
    fontSize: 14,
    color: DarkTheme.textMuted,
    ...Fonts.regular,
  },
  // Card Container
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cardTouchable: {
    width: width - 40,
    height: height * 0.58,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
  },
  cardFront: {},
  cardBack: {},
  // Glassmorphism Card
  glassCard: {
    flex: 1,
    backgroundColor: DarkTheme.cardBg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: DarkTheme.cardBorder,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 15,
  },
  // Media Container - 16:9 Aspect Ratio
  mediaWrapper: {
    flex: 1,
    marginBottom: 16,
    justifyContent: 'center',
  },
  mediaContainer: {
    aspectRatio: 16 / 9,
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0D1520',
  },
  signImage: {
    width: '100%',
    height: '100%',
  },
  signVideo: {
    width: '100%',
    height: '100%',
  },
  // Sign Name
  signName: {
    fontSize: 36,
    ...Fonts.bold,
    color: DarkTheme.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  // Flip Hint
  flipHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 8,
  },
  flipHint: {
    fontSize: 14,
    color: DarkTheme.textDim,
    ...Fonts.regular,
  },
  // Back Content
  backContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  signIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  wordLarge: {
    fontSize: 42,
    ...Fonts.bold,
    color: DarkTheme.text,
    textAlign: 'center',
  },
  divider: {
    width: 60,
    height: 4,
    backgroundColor: DarkTheme.primary,
    borderRadius: 2,
    marginVertical: 20,
  },
  wordDescription: {
    fontSize: 16,
    color: DarkTheme.textMuted,
    textAlign: 'center',
    ...Fonts.regular,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
    gap: 10,
  },
  tipText: {
    fontSize: 14,
    color: DarkTheme.textMuted,
    ...Fonts.regular,
    flex: 1,
  },
  // Navigation
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  prevButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  prevButtonDisabled: {
    opacity: 0.3,
  },
  nextButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: DarkTheme.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  nextGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  nextButtonText: {
    fontSize: 18,
    ...Fonts.bold,
    color: '#fff',
  },
});
