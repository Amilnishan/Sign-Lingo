// frontend/app/achievements.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Fonts } from '@/constants/fonts';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_lesson',
    title: 'First Steps',
    description: 'Complete your first lesson',
    icon: '🎯',
    unlocked: false,
    progress: 0,
    maxProgress: 1
  },
  {
    id: 'streak_3',
    title: 'Getting Started',
    description: 'Maintain a 3-day streak',
    icon: '🔥',
    unlocked: false,
    progress: 0,
    maxProgress: 3
  },
  {
    id: 'streak_7',
    title: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '⚡',
    unlocked: false,
    progress: 0,
    maxProgress: 7
  },
  {
    id: 'streak_30',
    title: 'Monthly Master',
    description: 'Maintain a 30-day streak',
    icon: '🌟',
    unlocked: false,
    progress: 0,
    maxProgress: 30
  },
  {
    id: 'xp_100',
    title: 'XP Hunter',
    description: 'Earn 100 XP',
    icon: '⭐',
    unlocked: false,
    progress: 0,
    maxProgress: 100
  },
  {
    id: 'xp_500',
    title: 'XP Champion',
    description: 'Earn 500 XP',
    icon: '🏅',
    unlocked: false,
    progress: 0,
    maxProgress: 500
  },
  {
    id: 'xp_1000',
    title: 'XP Legend',
    description: 'Earn 1000 XP',
    icon: '🏆',
    unlocked: false,
    progress: 0,
    maxProgress: 1000
  },
  {
    id: 'quiz_perfect',
    title: 'Perfect Score',
    description: 'Get 100% on a quiz',
    icon: '💯',
    unlocked: false,
    progress: 0,
    maxProgress: 1
  },
  {
    id: 'lessons_5',
    title: 'Eager Learner',
    description: 'Complete 5 lessons',
    icon: '📚',
    unlocked: false,
    progress: 0,
    maxProgress: 5
  },
  {
    id: 'lessons_10',
    title: 'Dedicated Student',
    description: 'Complete 10 lessons',
    icon: '🎓',
    unlocked: false,
    progress: 0,
    maxProgress: 10
  },
  {
    id: 'alphabet_master',
    title: 'Alphabet Master',
    description: 'Learn all 26 ASL letters',
    icon: '🔤',
    unlocked: false,
    progress: 0,
    maxProgress: 26
  },
  {
    id: 'feedback_given',
    title: 'Voice Heard',
    description: 'Submit your first feedback',
    icon: '💬',
    unlocked: false,
    progress: 0,
    maxProgress: 1
  }
];

export default function AchievementsScreen() {
  const router = useRouter();
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS);
  const [userXP, setUserXP] = useState(0);
  const [userStreak, setUserStreak] = useState(0);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        setUserXP(parsed.xp || 0);
        setUserStreak(parsed.streak || 0);
        
        // Update achievements based on user data
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Achievements</Text>
      </View>

      {/* Stats Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{unlockedCount}</Text>
          <Text style={styles.summaryLabel}>Unlocked</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{achievements.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{Math.round((unlockedCount / achievements.length) * 100)}%</Text>
          <Text style={styles.summaryLabel}>Complete</Text>
        </View>
      </View>

      {/* Achievements List */}
      <ScrollView style={styles.achievementsList} showsVerticalScrollIndicator={false}>
        {achievements.map((achievement) => (
          <View 
            key={achievement.id} 
            style={[
              styles.achievementCard,
              !achievement.unlocked && styles.achievementLocked
            ]}
          >
            <View style={[
              styles.achievementIcon,
              achievement.unlocked && styles.achievementIconUnlocked
            ]}>
              <Text style={styles.iconText}>{achievement.icon}</Text>
            </View>
            <View style={styles.achievementInfo}>
              <Text style={[
                styles.achievementTitle,
                !achievement.unlocked && styles.textLocked
              ]}>
                {achievement.title}
              </Text>
              <Text style={styles.achievementDescription}>
                {achievement.description}
              </Text>
              {!achievement.unlocked && achievement.maxProgress && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBarBg}>
                    <View 
                      style={[
                        styles.progressBarFill,
                        { width: `${((achievement.progress || 0) / achievement.maxProgress) * 100}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {achievement.progress}/{achievement.maxProgress}
                  </Text>
                </View>
              )}
            </View>
            {achievement.unlocked && (
              <View style={styles.unlockedBadge}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
            )}
          </View>
        ))}
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
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -10,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
  },
  summaryValue: {
    fontSize: 24,
    ...Fonts.appName,
    color: '#2ECC71',
  },
  summaryLabel: {
    fontSize: 12,
    ...Fonts.regular,
    color: '#7f8c8d',
    marginTop: 4,
  },
  achievementsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  achievementLocked: {
    opacity: 0.7,
  },
  achievementIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  achievementIconUnlocked: {
    backgroundColor: '#e8f8f0',
  },
  iconText: {
    fontSize: 28,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    ...Fonts.regular,
    color: '#1a1a2e',
    marginBottom: 4,
  },
  textLocked: {
    color: '#7f8c8d',
  },
  achievementDescription: {
    fontSize: 13,
    ...Fonts.regular,
    color: '#7f8c8d',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginRight: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2ECC71',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    ...Fonts.regular,
    color: '#7f8c8d',
    width: 45,
    textAlign: 'right',
  },
  unlockedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2ECC71',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    ...Fonts.regular,
  },
});
