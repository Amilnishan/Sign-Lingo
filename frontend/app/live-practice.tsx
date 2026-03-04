// frontend/app/live-practice.tsx
// ─────────────────────────────────────────────────────────────────────────────
// OVERLAY PATTERN — zero-flicker architecture
//
// Layer 0 (bottom): CameraView — rendered ONCE, static styles, memoised.
//                   Uses takePictureAsync for native capture (no ViewShot).
// Layer 1 (top):    Animated border overlay + HUD (LIVE badge, chatbot, etc.)
//                   Layered via render order (NO z-index — reliable on Android).
//
// The interval calls through a ref so the latest handler is always used,
// eliminating stale-closure bugs that silently swallow state updates.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Animated,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '@/constants/config';
import { Fonts } from '@/constants/fonts';
import { CustomAlert } from '@/components/custom-alert';
import { playSound } from '@/utils/audio';
import { useUser } from '@/contexts/UserContext';

const { width, height } = Dimensions.get('window');

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
  errorBright: '#E74C3C',
  success: '#2ECC71',
  gradient: ['#10B981', '#059669'] as const,
};

const PREDICTION_INTERVAL = 300;
const CONFIDENCE_THRESHOLD = 0.85;
const SUCCESS_HOLD_TIME = 2000;
const WRONG_SOUND_COOLDOWN = 1500;

export default function LivePracticeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const targetSign = (params.targetSign as string) || 'HELLO';
  const lessonId = Number(params.lessonId) || 1;
  const lessonTitle = (params.title as string) || 'Live Practice';
  const lessonXp = Number(params.xp) || 10;
  const mode = (params.mode as string) || 'normal';

  // ── Global state ──
  const {
    completeLesson: ctxCompleteLesson,
    addXP,
    resolveWeakSign,
    addWeakSign,
    weakSigns,
  } = useUser();

  // In weakness mode, override targetSign with the first weak sign if available
  const effectiveTarget =
    mode === 'weakness' && weakSigns.length > 0
      ? weakSigns[0].sign
      : targetSign;

  // ── Camera ──
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const isCameraReady = useRef(false);
  const isProcessing = useRef(false);

  // ── Prediction state ──
  const [predictedSign, setPredictedSign] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isSkipped, setIsSkipped] = useState(false);
  const [isError, setIsError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState('Position your hand in frame');
  const [showQuitAlert, setShowQuitAlert] = useState(false);

  // ── Animations ──
  // -1 = red (error)  |  0 = neutral (grey)  |  1 = green (success)
  const borderStateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const successScale = useRef(new Animated.Value(0)).current;

  // ── Refs for interval / cooldown ──
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrongSoundCooldownRef = useRef(false);
  const isCorrectRef = useRef(false); // mirror of isCorrect for the capture loop

  // ── LIVE dot pulse (fire-and-forget, stable) ──
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // ────────────────────────────────────────────────────────────────────────
  // REF-BASED INTERVAL — always calls the LATEST version of the handler.
  // This eliminates stale-closure bugs completely.
  // ────────────────────────────────────────────────────────────────────────
  const takePictureAndSendRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    if (permission?.granted) {
      intervalRef.current = setInterval(() => {
        takePictureAndSendRef.current?.();
      }, PREDICTION_INTERVAL);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, [permission?.granted]);

  // ────────────────────────────────────────────────────────────────────────
  // OPTIMIZED CORE LOOP (native takePictureAsync — no ViewShot)
  // ────────────────────────────────────────────────────────────────────────
  const takePictureAndSend = useCallback(async () => {
    if (!isCameraReady.current || isProcessing.current || !cameraRef.current) return;
    // Don't capture once success is locked in
    if (isCorrectRef.current) return;

    isProcessing.current = true;

    try {
      // Native camera capture — faster and smoother than ViewShot
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.3,
        skipProcessing: true,
        shutterSound: false,
      });

      if (!photo?.base64) { isProcessing.current = false; return; }

      const response = await axios.post(
        `${API_URL}/predict`,
        { image: photo.base64 },
        { timeout: 5000 },
      );

      const { sign, confidence: conf, hand_detected } = response.data;

      // ── No hand detected ──
      if (!hand_detected) {
        setPredictedSign(null);
        setConfidence(0);
        setIsError(false);
        setFeedbackMessage('Show your hand in the frame');
        borderStateAnim.setValue(0);
        return;
      }

      setPredictedSign(sign);
      setConfidence(conf);
      setAttempts((prev) => prev + 1);

      // ── Scenario A — SUCCESS ──
      if (sign === effectiveTarget && conf >= CONFIDENCE_THRESHOLD) {
        handleCorrectPrediction();
        return;
      }

      // ── Scenario B — HARD ERROR (confident wrong sign → RED) ──
      if (sign !== effectiveTarget && conf >= CONFIDENCE_THRESHOLD) {
        handleWrongPrediction(sign);
        return;
      }

      // ── Scenario C — NEUTRAL / LOW CONFIDENCE ──
      setIsError(false);
      setFeedbackMessage('Hold your sign steady...');
      borderStateAnim.setValue(0);

    } catch (error: any) {
      // Silent — don't crash on network issues
    } finally {
      isProcessing.current = false;
    }
  }, [effectiveTarget]);

  // Keep the ref always pointing to the latest version
  useEffect(() => {
    takePictureAndSendRef.current = takePictureAndSend;
  }, [takePictureAndSend]);

  // ────────────────────────────────────────────────────────────────────────
  // Scenario B — Wrong answer handler
  // ────────────────────────────────────────────────────────────────────────
  const handleWrongPrediction = useCallback((detectedSign: string) => {
    // ALWAYS update visuals (every frame that's wrong stays red)
    setIsError(true);
    setFeedbackMessage(`Incorrect: That looks like ${detectedSign.replace('_', ' ')}`);
    borderStateAnim.setValue(-1); // snap to red

    // Append the target sign to weak-signs (no duplicates)
    addWeakSign(effectiveTarget);

    // Throttle sound + haptic so they don't spam every 300ms
    if (!wrongSoundCooldownRef.current) {
      wrongSoundCooldownRef.current = true;
      playSound('wrong');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      setTimeout(() => {
        wrongSoundCooldownRef.current = false;
      }, WRONG_SOUND_COOLDOWN);
    }
  }, [borderStateAnim, addWeakSign, effectiveTarget]);

  // ────────────────────────────────────────────────────────────────────────
  // Scenario A — Correct answer handler
  // ────────────────────────────────────────────────────────────────────────
  const handleCorrectPrediction = useCallback(() => {
    isCorrectRef.current = true;
    setIsCorrect(true);
    setIsError(false);
    setFeedbackMessage(`${effectiveTarget.replace('_', ' ')} - Correct!`);
    playSound('correct');

    // Stop the capture loop
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }

    // ── Context updates ──
    if (mode === 'weakness') {
      resolveWeakSign(effectiveTarget);
    } else {
      // Register lesson locally (0 XP) and let addXP $inc on server
      ctxCompleteLesson(lessonId, 0);
      addXP(lessonXp); // sends to /api/add-xp with $inc
    }

    // Animate border → green
    Animated.timing(borderStateAnim, { toValue: 1, duration: 300, useNativeDriver: false }).start();

    // Success checkmark pop
    Animated.spring(successScale, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }).start();

    // Auto-navigate after hold
    successTimeoutRef.current = setTimeout(() => handleContinue(), SUCCESS_HOLD_TIME);
  }, [effectiveTarget, borderStateAnim, successScale, mode, resolveWeakSign, ctxCompleteLesson, addXP, lessonId, lessonXp]);

  const handleContinue = async () => {
    await AsyncStorage.setItem('livePracticeSuccess', 'true');
    router.back();
  };

  // ────────────────────────────────────────────────────────────────────────
  // Skip — NO XP, NO progress, neutral feedback only
  // ────────────────────────────────────────────────────────────────────────
  const handleSkip = useCallback(() => {
    // Stop the capture loop
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    isCorrectRef.current = true; // prevent further captures

    setIsSkipped(true);
    setIsError(false);
    setIsCorrect(false);
    setFeedbackMessage("No worries! We'll finish this later.");

    // Neutral blue border
    Animated.timing(borderStateAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  }, [borderStateAnim]);

  const handleCameraReady = useCallback(() => { isCameraReady.current = true; }, []);

  // ────────────────────────────────────────────────────────────────────────
  // MEMOISED CAMERA — static style, static props, never re-renders
  // ────────────────────────────────────────────────────────────────────────
  const cameraStyle = useMemo(() => styles.cameraAbsolute, []);

  const stableCamera = useMemo(
    () => (
      <CameraView
        ref={cameraRef}
        style={cameraStyle}
        facing="front"
        onCameraReady={handleCameraReady}
      />
    ),
    [handleCameraReady, cameraStyle],
  );

  // ────────────────────────────────────────────────────────────────────────
  // Animated border colour (single Animated.Value drives everything)
  // ────────────────────────────────────────────────────────────────────────
  const borderColor = borderStateAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['#EF4444', 'rgba(255,255,255,0.15)', '#2ECC71'],
  });

  // ── PERMISSION STATES ──

  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={DarkTheme.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar barStyle="light-content" />
        <Ionicons name="camera-outline" size={80} color={DarkTheme.textMuted} />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          We need camera access to detect your hand signs in real-time.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <LinearGradient colors={DarkTheme.gradient} style={styles.permissionButtonGradient}>
            <Ionicons name="camera" size={20} color="#fff" />
            <Text style={styles.permissionButtonText}>Enable Camera</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  // ── MAIN RENDER ──

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => setShowQuitAlert(true)}>
          <Ionicons name="close" size={24} color={DarkTheme.text} />
        </TouchableOpacity>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBg}>
            <LinearGradient
              colors={isCorrect ? ['#2ECC71', '#27AE60'] : DarkTheme.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.progressBarFill,
                { width: isCorrect ? '100%' : `${Math.min(confidence * 100, 100)}%` },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Target Sign */}
      <View style={styles.targetContainer}>
        <Text style={styles.targetLabel}>Show the sign for:</Text>
        <Text style={styles.targetSign}>{effectiveTarget.replace('_', ' ')}</Text>
      </View>

      {/* ═══════════════════════════════════════════════════════════════════
          CAMERA AREA — Overlay Pattern (render-order layering, no z-index)
          Child 1 = background camera  |  Child 2 = animated border on top
          ═══════════════════════════════════════════════════════════════════ */}
      <View style={styles.cameraWrapper}>
        {/* ── Background: static camera (rendered first = bottom) ── */}
        {stableCamera}

        {/* ── Foreground: animated border + HUD (rendered second = top) ── */}
        <Animated.View
          style={[styles.borderOverlay, { borderColor }]}
          pointerEvents="box-none"
        >
          {/* LIVE indicator */}
          <View style={styles.liveContainer}>
            <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>

          {/* Chatbot FAB — hidden in weakness mode */}
          {mode !== 'weakness' && (
          <TouchableOpacity style={styles.chatbotFab} activeOpacity={0.8}>
            <LinearGradient colors={['#2ECC71', '#27AE60']} style={styles.chatbotGradient}>
              <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
          )}

          {/* Success checkmark overlay — only on real success, never on skip */}
          {isCorrect && !isSkipped && (
            <Animated.View style={[styles.successOverlay, { transform: [{ scale: successScale }] }]}>
              <View style={styles.successCircle}>
                <Ionicons name="checkmark" size={64} color="#2ECC71" />
              </View>
            </Animated.View>
          )}

          {/* Skipped overlay — neutral */}
          {isSkipped && (
            <View style={styles.skippedOverlay}>
              <View style={styles.skippedCircle}>
                <Ionicons name="arrow-forward-circle" size={64} color="#64748B" />
              </View>
            </View>
          )}
        </Animated.View>
      </View>

      {/* ── Feedback Bar (fixed height — never jumps) ── */}
      <View
        style={[
          styles.feedbackBar,
          {
            backgroundColor: isSkipped
              ? 'rgba(100, 116, 139, 0.2)'
              : isCorrect
                ? 'rgba(46, 204, 113, 0.15)'
                : isError
                  ? 'rgba(239, 68, 68, 0.2)'
                  : 'rgba(16, 185, 129, 0.1)',
          },
        ]}
      >
        <Ionicons
          name={isSkipped ? 'time-outline' : isCorrect ? 'checkmark-circle' : isError ? 'close-circle' : 'hand-left'}
          size={20}
          color={isSkipped ? '#94A3B8' : isCorrect ? '#2ECC71' : isError ? '#EF4444' : DarkTheme.primary}
        />
        <Text
          style={[
            styles.feedbackText,
            { color: isSkipped ? '#94A3B8' : isCorrect ? '#2ECC71' : isError ? '#EF4444' : DarkTheme.text },
          ]}
        >
          {feedbackMessage}
        </Text>
      </View>

      {/* Skip / Continue */}
      <View style={styles.bottomActions}>
        {isCorrect ? (
          <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
            <LinearGradient colors={['#2ECC71', '#27AE60']} style={styles.continueBtnGradient}>
              <Text style={styles.continueBtnText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        ) : isSkipped ? (
          <TouchableOpacity style={styles.skipContinueBtn} onPress={() => router.back()}>
            <View style={styles.skipContinueBtnInner}>
              <Text style={styles.skipContinueBtnText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
            <Text style={styles.skipBtnText}>Skip for now</Text>
          </TouchableOpacity>
        )}
      </View>

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

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkTheme.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: DarkTheme.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 14,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarContainer: {
    flex: 1,
  },
  progressBarBg: {
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },

  // ── Target Sign ──
  targetContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  targetLabel: {
    fontSize: 14,
    color: DarkTheme.textMuted,
    ...Fonts.regular,
  },
  targetSign: {
    fontSize: 28,
    color: DarkTheme.text,
    ...Fonts.bold,
    marginTop: 4,
  },

  // ── Camera — Overlay Pattern ──
  cameraWrapper: {
    flex: 1,
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 24,
    overflow: 'hidden',
  },
  // Camera fills the wrapper, absolutely positioned
  cameraAbsolute: {
    ...StyleSheet.absoluteFillObject,
  },
  // Border + HUD overlay — also absoluteFill, rendered AFTER camera = on top
  borderOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.15)',
  },

  // ── LIVE indicator ──
  liveContainer: {
    position: 'absolute',
    top: 16,
    right: 56,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  liveText: {
    color: '#fff',
    fontSize: 12,
    ...Fonts.bold,
    letterSpacing: 1,
  },

  // ── Chatbot FAB ──
  chatbotFab: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    shadowColor: '#2ECC71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  chatbotGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Success Overlay ──
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#2ECC71',
  },

  // ── Feedback Bar (fixed height — never jumps) ──
  feedbackBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    height: 52,
    minHeight: 52,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 10,
    marginTop: 8,
  },
  feedbackText: {
    fontSize: 15,
    ...Fonts.bold,
  },

  // ── Bottom Actions ──
  bottomActions: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 12,
  },
  continueBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#2ECC71',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  continueBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  continueBtnText: {
    fontSize: 18,
    ...Fonts.bold,
    color: '#fff',
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  skipBtnText: {
    fontSize: 16,
    color: DarkTheme.textMuted,
    ...Fonts.regular,
    textDecorationLine: 'underline',
  },
  // ── Skipped state button ──
  skipContinueBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  skipContinueBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
    backgroundColor: '#475569',
    borderRadius: 16,
  },
  skipContinueBtnText: {
    fontSize: 18,
    ...Fonts.bold,
    color: '#fff',
  },
  // ── Skipped camera overlay ──
  skippedOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  skippedCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(100, 116, 139, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#64748B',
  },

  // ── Permission Screen ──
  permissionTitle: {
    fontSize: 24,
    ...Fonts.bold,
    color: DarkTheme.text,
    marginTop: 24,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 16,
    color: DarkTheme.textMuted,
    ...Fonts.regular,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  permissionButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  permissionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    gap: 10,
  },
  permissionButtonText: {
    fontSize: 18,
    ...Fonts.bold,
    color: '#fff',
  },
});
