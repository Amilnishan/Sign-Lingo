// frontend/app/(tabs)/home.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';
import { Fonts } from '@/constants/fonts';

const { width, height } = Dimensions.get('window');

// Modern Glow Colors
const COLORS = {
  background: '#0F172A',
  cardBg: '#1E293BE6',
  cardBorder: '#334155',
  emerald: '#2ECC71',
  teal: '#14B8A6',
  gold: '#FFD700',
  purple: '#8B5CF6',
  pink: '#EC4899',
  orange: '#F97316',
  blue: '#3B82F6',
};

// Learning Units Data - 50 One-Handed ASL Words
const UNITS = [
  {
    id: 1,
    title: 'Greetings & Basics',
    description: 'Essential first signs',
    icon: 'hand-left',
    color: COLORS.emerald,
    lessons: [
      { id: 1, title: 'Hello & Welcome', words: ['HELLO', 'WELCOME'], xp: 10, completed: false },
      { id: 2, title: 'Yes & No', words: ['YES', 'NO'], xp: 10, completed: false },
      { id: 3, title: 'Please & Thank You', words: ['PLEASE', 'THANK_YOU'], xp: 10, completed: false },
      { id: 4, title: 'Sorry & Fine', words: ['SORRY', 'FINE'], xp: 10, completed: false },
      { id: 5, title: 'OK & Good Bye', words: ['OK', 'GOOD_BYE'], xp: 10, completed: false },
      { id: 6, title: 'Practice Greetings', words: ['HELLO', 'GOODBYE', 'YES', 'NO', 'PLEASE', 'THANK_YOU', 'SORRY', 'FINE', 'OK', 'WELCOME'], xp: 20, completed: false },
    ],
  },
  {
    id: 2,
    title: 'Alphabet A-M',
    description: 'First 13 letters',
    icon: 'text',
    color: COLORS.blue,
    lessons: [
      { id: 7, title: 'Letters A, B, C', words: ['A', 'B', 'C'], xp: 10, completed: false },
      { id: 8, title: 'Letters D, E, F', words: ['D', 'E', 'F'], xp: 10, completed: false },
      { id: 9, title: 'Letters G, H, I', words: ['G', 'H', 'I'], xp: 10, completed: false },
      { id: 10, title: 'Letters J, K, L, M', words: ['J', 'K', 'L', 'M'], xp: 10, completed: false },
      { id: 11, title: 'Practice A-M', words: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'], xp: 20, completed: false },
    ],
  },
  {
    id: 3,
    title: 'Alphabet N-Z',
    description: 'Last 13 letters',
    icon: 'text',
    color: COLORS.purple,
    lessons: [
      { id: 12, title: 'Letters N, O, P', words: ['N', 'O', 'P'], xp: 10, completed: false },
      { id: 13, title: 'Letters Q, R, S', words: ['Q', 'R', 'S'], xp: 10, completed: false },
      { id: 14, title: 'Letters T, U, V', words: ['T', 'U', 'V'], xp: 10, completed: false },
      { id: 15, title: 'Letters W, X, Y, Z', words: ['W', 'X', 'Y', 'Z'], xp: 10, completed: false },
      { id: 16, title: 'Practice N-Z', words: ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'], xp: 20, completed: false },
    ],
  },
  {
    id: 4,
    title: 'Numbers 0-10',
    description: 'Count with signs',
    icon: 'calculator',
    color: COLORS.gold,
    lessons: [
      { id: 17, title: 'Numbers 0-3', words: ['0', '1', '2', '3'], xp: 10, completed: false },
      { id: 18, title: 'Numbers 4-6', words: ['4', '5', '6'], xp: 10, completed: false },
      { id: 19, title: 'Numbers 7-10', words: ['7', '8', '9', '10'], xp: 10, completed: false },
      { id: 20, title: 'Practice Numbers', words: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], xp: 20, completed: false },
    ],
  },
  {
    id: 5,
    title: 'Personal & Pronouns',
    description: 'Me, You, Family',
    icon: 'people',
    color: COLORS.teal,
    lessons: [
      { id: 21, title: 'Me & You', words: ['ME', 'YOU'], xp: 10, completed: false },
      { id: 22, title: 'He/She & My/Your', words: ['HE/SHE', 'MY', 'YOUR'], xp: 10, completed: false },
      { id: 23, title: 'Mother & Father', words: ['MOTHER', 'FATHER'], xp: 10, completed: false },
      { id: 24, title: 'Child & Family', words: ['CHILD', 'UNCLE', 'AUNT'], xp: 10, completed: false },
      { id: 25, title: 'Practice Personal', words: ['ME/I', 'YOU', 'HE/SHE', 'MY', 'YOUR', 'MOTHER', 'FATHER', 'CHILD', 'UNCLE', 'AUNT'], xp: 20, completed: false },
    ],
  },
  {
    id: 6,
    title: 'Emotions & States',
    description: 'Express feelings',
    icon: 'heart',
    color: COLORS.pink,
    lessons: [
      { id: 26, title: 'Good & Bad', words: ['GOOD', 'BAD'], xp: 10, completed: false },
      { id: 27, title: 'Like & Proud', words: ['LIKE', 'PROUD'], xp: 10, completed: false },
      { id: 28, title: 'MAD & Funny', words: ['MAD', 'FUNNY'], xp: 10, completed: false },
      { id: 29, title: 'Hungry & Thirsty', words: ['HUNGRY', 'THIRSTY'], xp: 10, completed: false },
      { id: 30, title: 'Lonely & Hot', words: ['LONELY','HOT'], xp: 10, completed: false },
      { id: 31, title: 'Practice Emotions', words: ['GOOD', 'BAD', 'LIKE', 'PROUD', 'ANGRY', 'FUNNY', 'HUNGRY', 'THIRSTY', 'LONELY', 'HOT'], xp: 20, completed: false },
    ],
  },
  {
    id: 7,
    title: 'Questions & Directions',
    description: 'Ask and navigate',
    icon: 'help-circle',
    color: COLORS.orange,
    lessons: [
      { id: 32, title: 'Who & Where', words: ['WHO', 'WHERE'], xp: 10, completed: false },
      { id: 33, title: 'Why & Later', words: ['WHY', 'LATER'], xp: 10, completed: false },
      { id: 34, title: 'Soon & Same', words: ['SOON', 'SAME'], xp: 10, completed: false },
      { id: 35, title: 'Left & Right', words: ['LEFT', 'RIGHT'], xp: 10, completed: false },
      { id: 36, title: 'Yesterday & Tomorrow', words: ['YESTERDAY', 'TOMORROW'], xp: 10, completed: false },
      { id: 37, title: 'Practice Questions', words: ['WHO', 'WHERE', 'WHY', 'LATER', 'SOON', 'SAME', 'LEFT', 'RIGHT', 'YESTERDAY', 'TOMORROW'], xp: 20, completed: false },
    ],
  },
  {
    id: 8,
    title: 'Daily Essentials',
    description: 'Important everyday words',
    icon: 'home',
    color: COLORS.emerald,
    lessons: [
      { id: 38, title: 'True & False', words: ['TRUE', 'FALSE'], xp: 10, completed: false },
      { id: 39, title: 'Water & Food', words: ['WATER', 'FOOD'], xp: 10, completed: false },
      { id: 40, title: 'Home & Phone', words: ['HOME', 'PHONE'], xp: 10, completed: false },
      { id: 41, title: 'Need & Bathroom', words: ['NEED', 'BATHROOM'], xp: 10, completed: false },
      { id: 42, title: 'Finish & Understand', words: ['FINISH', 'UNDERSTAND'], xp: 10, completed: false },
      { id: 43, title: 'Practice Daily Words', words: ['TRUE', 'FALSE', 'WATER', 'FOOD', 'HOME', 'PHONE', 'NEED', 'BATHROOM', 'FINISH', 'UNDERSTAND'], xp: 20, completed: false },
    ],
  },
];

interface User {
  full_name: string;
  xp: number;
  streak: number;
}

// Lesson position types
type LessonPosition = 'left' | 'center' | 'right';

// SVG Connector Component for lesson path
interface ConnectorProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  completed: boolean;
  color: string;
}

const LessonConnector: React.FC<ConnectorProps> = ({ startX, startY, endX, endY, completed, color }) => {
  // Calculate control points for smooth curve
  const midY = (startY + endY) / 2;
  const controlPoint1X = startX;
  const controlPoint1Y = midY;
  const controlPoint2X = endX;
  const controlPoint2Y = midY;

  return (
    <Svg 
      height={endY - startY + 20} 
      width={width} 
      style={styles.connectorSvg}
    >
      <Path
        d={`M ${startX} ${startY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${endX} ${endY}`}
        stroke={completed ? color : COLORS.cardBorder}
        strokeWidth="4"
        strokeDasharray="8, 8"
        fill="none"
        opacity={0.6}
      />
    </Svg>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [user, setUser] = useState<User | null>(null);
  const [currentLesson, setCurrentLesson] = useState(1); // First lesson to start
  
  // Pulsing animation for current lesson
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadUserData();
    startPulseAnimation();
  }, []);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const getUnitProgress = (unit: typeof UNITS[0]) => {
    const completed = unit.lessons.filter(l => l.completed).length;
    return (completed / unit.lessons.length) * 100;
  };

  const isUnitLocked = (unitIndex: number) => {
    if (unitIndex === 0) return false;
    const prevUnit = UNITS[unitIndex - 1];
    return prevUnit.lessons.some(l => !l.completed);
  };

  const isLessonLocked = (lesson: typeof UNITS[0]['lessons'][0], lessonIndex: number, unitIndex: number) => {
    if (lesson.completed) return false;
    if (unitIndex === 0 && lessonIndex === 0) return false;
    
    // Check if previous lesson in same unit is completed
    if (lessonIndex > 0) {
      return !UNITS[unitIndex].lessons[lessonIndex - 1].completed;
    }
    
    // First lesson of unit - check if previous unit is complete
    if (unitIndex > 0) {
      const prevUnit = UNITS[unitIndex - 1];
      return !prevUnit.lessons[prevUnit.lessons.length - 1].completed;
    }
    
    return false;
  };

  const handleLessonPress = (lesson: typeof UNITS[0]['lessons'][0], locked: boolean) => {
    if (locked) return;
    // Navigate to flashcard screen with lesson details
    router.push({
      pathname: '/flashcard',
      params: {
        lessonId: lesson.id,
        title: lesson.title,
        xp: lesson.xp,
      },
    });
  };

  // Calculate lesson positions (zig-zag pattern) - All units start from center
  const getLessonPosition = (lessonIndex: number, unitIndex: number): LessonPosition => {
    // Pattern for each unit: always start from center, then zig-zag
    const pattern: LessonPosition[] = ['center', 'left', 'center', 'right', 'center', 'left'];
    const localIndex = lessonIndex % pattern.length;
    return pattern[localIndex];
  };

  // Get X coordinate for lesson position (center of node)
  const getNodeCenterX = (position: LessonPosition, nodeSize: number = 65): number => {
    switch (position) {
      case 'left':
        return width * 0.15 + nodeSize / 2;
      case 'right':
        return width * 0.65 + nodeSize / 2;
      case 'center':
      default:
        return width / 2;
    }
  };

  const getPositionStyle = (position: LessonPosition) => {
    switch (position) {
      case 'left':
        return { left: width * 0.15 };
      case 'right':
        return { left: width * 0.65 };
      case 'center':
      default:
        return { left: width / 2 - 40 };
    }
  };

  return (
    <View style={styles.container}>
      {/* Sticky Glassmorphic Header */}
      <BlurView intensity={80} tint="dark" style={styles.stickyHeader}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>
              {user ? `Hi, ${user.full_name.split(' ')[0]}!` : 'Welcome!'}
            </Text>
            <Text style={styles.subGreeting}>Continue your journey</Text>
          </View>
          <View style={styles.headerStats}>
            <View style={styles.statPill}>
              <Ionicons name="flash" size={16} color={COLORS.gold} />
              <Text style={styles.statText}>{user?.xp || 0}</Text>
            </View>
            <View style={styles.statPill}>
              <Ionicons name="flame" size={16} color={COLORS.orange} />
              <Text style={styles.statText}>{user?.streak || 0}</Text>
            </View>
          </View>
        </View>
      </BlurView>

      {/* Current Progress Card with Progress Bar */}
      <View style={styles.progressCardWrapper}>
        <LinearGradient
          colors={[COLORS.emerald, COLORS.teal]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.progressCard}
        >
          <View style={styles.progressContent}>
            <View style={styles.progressLeft}>
              <Text style={styles.progressLabel}>CURRENT UNIT</Text>
              <Text style={styles.progressTitle}>{UNITS[0].title}</Text>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${getUnitProgress(UNITS[0])}%` }]} />
              </View>
              <Text style={styles.progressSubtext}>
                {UNITS[0].lessons.filter(l => l.completed).length}/{UNITS[0].lessons.length} lessons • {Math.round(getUnitProgress(UNITS[0]))}%
              </Text>
            </View>
            <TouchableOpacity style={styles.continueButton}>
              <Ionicons name="play" size={28} color={COLORS.emerald} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {/* Gamified Learning Map with Zig-Zag Path */}
      <ScrollView 
        style={styles.pathContainer}
        contentContainerStyle={styles.pathContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mapContainer}>
          {UNITS.map((unit, unitIndex) => {
            const locked = isUnitLocked(unitIndex);
            const baseIndex = UNITS.slice(0, unitIndex).reduce((sum, u) => sum + u.lessons.length, 0);
            
            // 1. REDUCED DISTANCE: Changed from 130 to 100
            const ROW_HEIGHT = 100; 

            return (
              <View key={unit.id}>
                {/* Unit Banner */}
                <View style={[styles.unitBanner, locked && styles.unitBannerLocked]}>
                  <View style={[styles.unitBannerIcon, { backgroundColor: locked ? COLORS.cardBorder : unit.color }]}>
                    {locked ? (
                      <Ionicons name="lock-closed" size={20} color="#64748B" />
                    ) : (
                      <Ionicons name={unit.icon as any} size={20} color="#FFF" />
                    )}
                  </View>
                  <Text style={[styles.unitBannerText, locked && styles.textLocked]}>
                    {unit.title}
                  </Text>
                </View>

                {/* Lessons */}
                {unit.lessons.map((lesson, lessonIndex) => {
                  const globalIndex = baseIndex + lessonIndex;
                  const position = getLessonPosition(lessonIndex, unitIndex); // Use lessonIndex for each unit
                  const nextPosition = getLessonPosition(lessonIndex + 1, unitIndex);
                  const lessonLocked = isLessonLocked(lesson, lessonIndex, unitIndex);
                  const isNext = lesson.id === currentLesson;
                  
                  // Node sizing
                  const nodeSize = lessonLocked ? 55 : isNext ? 85 : 65;
                  const centerOffset = (ROW_HEIGHT - nodeSize) / 2; // Vertically center the node in the row

                  // Calculate X positions
                  const getXPos = (pos: LessonPosition) => {
                    switch (pos) {
                      case 'left': return width * 0.20; // Adjusted for better centering
                      case 'right': return width * 0.80;
                      default: return width / 2;
                    }
                  };

                  const currentX = getXPos(position);
                  const nextX = getXPos(nextPosition);

                  // 2. LINE FIX: Calculate exact centers for connection
                  const startY = ROW_HEIGHT / 2; // Center of current row
                  const endY = ROW_HEIGHT + (ROW_HEIGHT / 2); // Center of next row

                  return (
                    <View key={lesson.id} style={[styles.lessonMapRow, { height: ROW_HEIGHT }]}>
                      
                      {/* Connector Line (SVG) */}
                      {/* Render line ONLY if not the last lesson of the entire list */}
                      {lessonIndex < unit.lessons.length - 1 && (
                        <Svg 
                          height={ROW_HEIGHT * 2} // Make SVG tall enough to reach next row
                          width={width} 
                          style={{ position: 'absolute', top: 0, left: 0, zIndex: -1 }} // Send to back
                        >
                          {/* Cubic Bezier Curve for smooth S-shape */}
                          <Path
                            d={`M ${currentX} ${startY} C ${currentX} ${startY + 50}, ${nextX} ${endY - 50}, ${nextX} ${endY}`}
                            stroke={lesson.completed ? unit.color : '#334155'} // Darker grey for locked path
                            strokeWidth={lesson.completed ? "4" : "3"}
                            strokeDasharray={lesson.completed ? "" : "8, 6"} // Solid if done, dashed if locked
                            fill="none"
                          />
                        </Svg>
                      )}

                      {/* Lesson Node */}
                      <Animated.View
                        style={[
                          styles.lessonNodeContainer,
                          { left: currentX - (nodeSize / 2), top: centerOffset }, // Perfectly centered
                          isNext && { transform: [{ scale: pulseAnim }] },
                        ]}
                      >
                        <TouchableOpacity
                          style={[
                            styles.lessonMapNode,
                            { 
                              width: nodeSize, 
                              height: nodeSize, 
                              borderRadius: nodeSize / 2,
                              backgroundColor: COLORS.cardBg, // Ensure solid background to hide line start
                            },
                            lesson.completed && {
                              backgroundColor: unit.color,
                              borderColor: unit.color,
                            },
                            lessonLocked && styles.lessonNodeLocked,
                            isNext && {
                              backgroundColor: COLORS.gold,
                              borderColor: COLORS.gold,
                              shadowColor: COLORS.gold,
                              elevation: 20,
                            },
                          ]}
                          onPress={() => handleLessonPress(lesson, lessonLocked)}
                          disabled={lessonLocked}
                          activeOpacity={0.8}
                        >
                          {lesson.completed ? (
                            <Ionicons name="checkmark" size={30} color="#FFF" />
                          ) : lessonLocked ? (
                            <Ionicons name="lock-closed" size={24} color="#64748B" />
                          ) : isNext ? (
                            <Ionicons name="play" size={32} color="#FFF" />
                          ) : (
                            <Ionicons name="star" size={24} color={unit.color} />
                          )}
                        </TouchableOpacity>

                        {/* XP Badge */}
                        {!lessonLocked && (
                          <View style={[
                            styles.xpBadge,
                            lesson.completed && { backgroundColor: unit.color, borderColor: unit.color },
                            isNext && { backgroundColor: COLORS.gold, borderColor: COLORS.gold }
                          ]}>
                            <Ionicons name="flash" size={10} color="#FFF" />
                            <Text style={styles.xpBadgeText}>{lesson.xp}</Text>
                          </View>
                        )}

                        {/* Lesson Title */}
                        <Text style={[
                          styles.lessonMapTitle,
                          { width: 120, textAlign: 'center', left: -60 + (nodeSize/2) }, // Center text relative to node
                          lessonLocked && styles.textLocked,
                        ]}>
                          {lesson.title}
                        </Text>
                      </Animated.View>
                    </View>
                  );
                })}
              </View>
            );
          })}

          <View style={{ height: 150 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {},
  greeting: {
    fontSize: 26,
    ...Fonts.appName,
    color: '#FFF',
  },
  subGreeting: {
    fontSize: 14,
    ...Fonts.regular,
    color: '#94A3B8',
    marginTop: 4,
  },
  headerStats: {
    flexDirection: 'row',
    gap: 10,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  statText: {
    color: '#FFF',
    fontSize: 14,
    ...Fonts.appName,
  },
  progressCardWrapper: {
    marginTop: 120,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  progressCard: {
    borderRadius: 20,
    padding: 20,
  },
  progressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLeft: {
    flex: 1,
  },
  progressLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
    ...Fonts.regular,
  },
  progressTitle: {
    fontSize: 22,
    ...Fonts.appName,
    color: '#FFF',
    marginTop: 4,
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 5,
    marginTop: 12,
    marginRight: 20,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 5,
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  progressSubtext: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 10,
    ...Fonts.regular,
  },
  continueButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  pathContainer: {
    flex: 1,
  },
  pathContent: {
    paddingTop: 8,
  },
  mapContainer: {
    position: 'relative',
    minHeight: height,
  },
  unitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardBg,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 30,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden', // Prevent icon overflow
  },
  unitBannerLocked: {
    opacity: 0.6,
  },
  unitBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 2,
  },
  unitBannerText: {
    fontSize: 18,
    ...Fonts.appName,
    color: '#FFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  lessonMapRow: {
    position: 'relative',
    width: width,
    alignItems: 'center',
  },
  connectorSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  lessonNodeContainer: {
    position: 'absolute',
    top: 20,
    alignItems: 'center',
    zIndex: 10,
    overflow: 'visible', // Allow badges and icons to show
  },
  lessonMapNode: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 4,
    borderColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden', // Prevent lock icon from going outside node
  },
  lessonNodeLocked: {
    opacity: 0.6,
    backgroundColor: '#1E293B',
  },
  startTooltip: {
    position: 'absolute',
    top: -40,
    zIndex: 10,
  },
  tooltipGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#5277b1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  tooltipText: {
    color: '#5277b1',
    fontSize: 12,
    ...Fonts.appName,
    letterSpacing: 1,
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -6,
    left: '50%',
    marginLeft: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#5277b1',
  },
  xpBadge: {
    position: 'absolute',
    bottom: -12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  xpBadgeText: {
    color: '#FFF',
    marginTop: -4,
    fontSize: 10,
    ...Fonts.appName,
  },
  lessonMapTitle: {
    marginTop: 8,
    fontSize: 12,
    ...Fonts.regular,
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  textLocked: {
    color: '#64748B',
  },
});
