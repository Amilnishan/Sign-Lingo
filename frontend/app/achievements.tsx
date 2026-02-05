// frontend/app/achievements.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Fonts } from '@/constants/fonts';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 12) / 2;

// Modern Glow Design System
const COLORS = {
  background: '#0F172A',
  cardBg: '#1E293B',
  cardBorder: '#334155',
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  emerald: '#2ECC71',
  emeraldDark: '#27AE60',
  teal: '#14B8A6',
  gold: '#F59E0B',
  locked: '#475569',
  lockedBg: 'rgba(71, 85, 105, 0.3)',
};

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
  color: string;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_lesson',
    title: 'First Steps',
    description: 'Complete first lesson',
    icon: '🎯',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    color: '#EF4444',
  },
  {
    id: 'streak_3',
    title: 'Getting Started',
    description: '3-day streak',
    icon: '🔥',
    unlocked: false,
    progress: 0,
    maxProgress: 3,
    color: '#F97316',
  },
  {
    id: 'streak_7',
    title: 'Week Warrior',
    description: '7-day streak',
    icon: '⚡',
    unlocked: false,
    progress: 0,
    maxProgress: 7,
    color: '#EAB308',
  },
  {
    id: 'streak_30',
    title: 'Monthly Master',
    description: '30-day streak',
    icon: '🌟',
    unlocked: false,
    progress: 0,
    maxProgress: 30,
    color: '#A855F7',
  },
  {
    id: 'xp_100',
    title: 'XP Hunter',
    description: 'Earn 100 XP',
    icon: '⭐',
    unlocked: false,
    progress: 0,
    maxProgress: 100,
    color: '#3B82F6',
  },
  {
    id: 'xp_500',
    title: 'XP Champion',
    description: 'Earn 500 XP',
    icon: '🏅',
    unlocked: false,
    progress: 0,
    maxProgress: 500,
    color: '#6366F1',
  },
  {
    id: 'xp_1000',
    title: 'XP Legend',
    description: 'Earn 1000 XP',
    icon: '🏆',
    unlocked: false,
    progress: 0,
    maxProgress: 1000,
    color: '#EC4899',
  },
  {
    id: 'quiz_perfect',
    title: 'Perfect Score',
    description: '100% on quiz',
    icon: '💯',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    color: '#14B8A6',
  },
  {
    id: 'lessons_5',
    title: 'Eager Learner',
    description: 'Complete 5 lessons',
    icon: '📚',
    unlocked: false,
    progress: 0,
    maxProgress: 5,
    color: '#8B5CF6',
  },
  {
    id: 'lessons_10',
    title: 'Dedicated Student',
    description: 'Complete 10 lessons',
    icon: '🎓',
    unlocked: false,
    progress: 0,
    maxProgress: 10,
    color: '#06B6D4',
  },
  {
    id: 'alphabet_master',
    title: 'Alphabet Master',
    description: 'Learn all 26 letters',
    icon: '🔤',
    unlocked: false,
    progress: 0,
    maxProgress: 26,
    color: '#10B981',
  },
  {
    id: 'feedback_given',
    title: 'Voice Heard',
    description: 'Submit feedback',
    icon: '💬',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    color: '#F43F5E',
  },
];

export default function AchievementsScreen() {
  const router = useRouter();
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS);
  const [userXP, setUserXP] = useState(0);
  const [globalRank] = useState(1234);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        setUserXP(parsed.xp || 0);
        
        const updatedAchievements = ACHIEVEMENTS.map(achievement => {
          let progress = 0;
          let unlocked = false;
          
          switch (achievement.id) {
            case 'xp_100':
              progress = Math.min(parsed.xp || 0, 100);
              unlocked = progress >= 100;
              break;
            case 'xp_500':
              progress = Math.min(parsed.xp || 0, 500);
              unlocked = progress >= 500;
              break;
            case 'xp_1000':
              progress = Math.min(parsed.xp || 0, 1000);
              unlocked = progress >= 1000;
              break;
            case 'streak_3':
              progress = Math.min(parsed.streak || 0, 3);
              unlocked = progress >= 3;
              break;
            case 'streak_7':
              progress = Math.min(parsed.streak || 0, 7);
              unlocked = progress >= 7;
              break;
            case 'streak_30':
              progress = Math.min(parsed.streak || 0, 30);
              unlocked = progress >= 30;
              break;
            default:
              progress = achievement.progress || 0;
              break;
          }
          
          return { ...achievement, progress, unlocked };
        });
        
        setAchievements(updatedAchievements);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  const renderAchievementCard = (achievement: Achievement) => {
    const progressPercent = achievement.maxProgress 
      ? (achievement.progress || 0) / achievement.maxProgress * 100 
      : 0;

    return (
      <View 
        key={achievement.id} 
        style={[
          styles.achievementCard,
          achievement.unlocked && { borderColor: achievement.color, borderWidth: 2 }
        ]}
      >
        {/* Glow effect for unlocked */}
        {achievement.unlocked && (
          <View style={[styles.glowEffect, { backgroundColor: achievement.color }]} />
        )}
        
        {/* Lock overlay */}
        {!achievement.unlocked && (
          <View style={styles.lockOverlay}>
            <Ionicons name="lock-closed" size={18} color={COLORS.locked} />
          </View>
        )}

        {/* Icon */}
        <View style={[
          styles.iconContainer,
          { 
            backgroundColor: achievement.unlocked 
              ? `${achievement.color}25` 
              : COLORS.lockedBg,
            opacity: achievement.unlocked ? 1 : 0.5,
          }
        ]}>
          <Text style={styles.iconText}>{achievement.icon}</Text>
        </View>

        {/* Title */}
        <Text style={[
          styles.achievementTitle,
          !achievement.unlocked && styles.lockedText
        ]} numberOfLines={1}>
          {achievement.title}
        </Text>

        {/* Description */}
        <Text style={styles.achievementDesc} numberOfLines={1}>
          {achievement.description}
        </Text>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBg}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${progressPercent}%`,
                  backgroundColor: achievement.unlocked ? achievement.color : COLORS.locked
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {achievement.progress}/{achievement.maxProgress}
          </Text>
        </View>

        {/* Completed badge */}
        {achievement.unlocked && (
          <View style={[styles.completedBadge, { backgroundColor: achievement.color }]}>
            <Ionicons name="checkmark" size={12} color="#FFF" />
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Trophies</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Stats Card */}
        <LinearGradient
          colors={[COLORS.emerald, COLORS.teal]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroStat}>
              <Text style={styles.heroLabel}>Total XP</Text>
              <View style={styles.heroValueRow}>
                <Ionicons name="star" size={24} color="#FFF" />
                <Text style={styles.heroValue}>{userXP.toLocaleString()}</Text>
              </View>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroLabel}>Global Rank</Text>
              <View style={styles.heroValueRow}>
                <Ionicons name="trophy" size={24} color="#FFD700" />
                <Text style={styles.heroValue}>#{globalRank}</Text>
              </View>
            </View>
          </View>
          
          {/* Progress summary */}
          <View style={styles.heroProgress}>
            <Text style={styles.heroProgressText}>
              {unlockedCount} / {achievements.length} Achievements Unlocked
            </Text>
            <View style={styles.heroProgressBar}>
              <View 
                style={[
                  styles.heroProgressFill, 
                  { width: `${(unlockedCount / achievements.length) * 100}%` }
                ]} 
              />
            </View>
          </View>
        </LinearGradient>

        {/* Achievements Grid */}
        <Text style={styles.sectionTitle}>🎮 Achievement Collection</Text>
        <View style={styles.achievementsGrid}>
          {achievements.map((achievement) => renderAchievementCard(achievement))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  },
  heroCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: COLORS.emerald,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroStat: {
    alignItems: 'center',
  },
  heroLabel: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  heroValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroValue: {
    fontSize: 28,
    fontFamily: 'Nunito-Bold',
    color: '#FFF',
  },
  heroDivider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  heroProgress: {
    marginTop: 8,
  },
  heroProgressText: {
    fontSize: 13,
    fontFamily: 'Nunito-Bold',
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  heroProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  heroProgressFill: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    fontWeight: '700',
    marginBottom: 16,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementCard: {
    width: CARD_WIDTH,
    backgroundColor: `${COLORS.cardBg}E6`,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    position: 'relative',
    overflow: 'hidden',
  },
  glowEffect: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 100,
    height: 100,
    borderRadius: 50,
    opacity: 0.15,
  },
  lockOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconText: {
    fontSize: 28,
  },
  achievementTitle: {
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  lockedText: {
    color: COLORS.textSecondary,
  },
  achievementDesc: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBg: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 10,
    fontFamily: 'Nunito-Bold',
    fontWeight: '700',
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  completedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
