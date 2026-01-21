// frontend/app/(tabs)/daily-quest.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Fonts } from '@/constants/fonts';
import { AppColors } from '@/constants/colors';

interface Quest {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  completed: boolean;
  type: 'practice' | 'vocabulary' | 'quiz';
}

export default function DailyQuestScreen() {
  const router = useRouter();
  const [streak, setStreak] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [quests, setQuests] = useState<Quest[]>([
    {
      id: '1',
      title: 'Morning Practice',
      description: '5 min daily practice',
      icon: '🤟',
      xpReward: 10,
      completed: false,
      type: 'practice'
    },
    {
      id: '2',
      title: 'Vocabulary Builder',
      description: 'Learn 5 new signs',
      icon: '📖',
      xpReward: 20,
      completed: false,
      type: 'vocabulary'
    },
    {
      id: '3',
      title: 'Quiz Master',
      description: 'Weekly review session',
      icon: '❓',
      xpReward: 15,
      completed: false,
      type: 'quiz'
    }
  ]);

  const [chestAnimation] = useState(new Animated.Value(1));

  useEffect(() => {
    loadUserData();
    loadQuestProgress();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        setStreak(parsed.streak || 0);
        setTotalXP(parsed.xp || 0);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadQuestProgress = async () => {
    try {
      const questData = await AsyncStorage.getItem('dailyQuests');
      const lastDate = await AsyncStorage.getItem('questDate');
      const today = new Date().toDateString();
      
      if (lastDate !== today) {
        // Reset quests for new day
        await AsyncStorage.setItem('questDate', today);
        await AsyncStorage.removeItem('dailyQuests');
      } else if (questData) {
        setQuests(JSON.parse(questData));
      }
    } catch (error) {
      console.error('Error loading quest progress:', error);
    }
  };

  const completedCount = quests.filter(q => q.completed).length;
  const totalCount = quests.length;
  const progressPercent = (completedCount / totalCount) * 100;
  const allCompleted = completedCount === totalCount;

  const animateChest = () => {
    Animated.sequence([
      Animated.timing(chestAnimation, {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(chestAnimation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleStartQuest = async (questId: string) => {
    // Mark quest as completed (in real app, would navigate to actual lesson)
    const updatedQuests = quests.map(q => 
      q.id === questId ? { ...q, completed: true } : q
    );
    setQuests(updatedQuests);
    await AsyncStorage.setItem('dailyQuests', JSON.stringify(updatedQuests));
    
    // Award XP
    const quest = quests.find(q => q.id === questId);
    if (quest) {
      const newXP = totalXP + quest.xpReward;
      setTotalXP(newXP);
      
      // Update user data
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        parsed.xp = newXP;
        await AsyncStorage.setItem('userData', JSON.stringify(parsed));
      }
      
      Alert.alert(
        '🎉 Quest Complete!',
        `You earned +${quest.xpReward} XP!`,
        [{ text: 'Awesome!' }]
      );
    }

    // Check if all quests completed
    if (updatedQuests.every(q => q.completed)) {
      animateChest();
      setTimeout(() => {
        Alert.alert(
          '🎁 Daily Chest Unlocked!',
          'Congratulations! You completed all daily quests!',
          [{ text: 'Claim Reward' }]
        );
      }, 500);
    }
  };

  const getQuestIconBg = (type: string) => {
    switch (type) {
      case 'practice': return '#e8f8f0';
      case 'vocabulary': return '#e8f0f8';
      case 'quiz': return '#f0f0f0';
      default: return '#f0f0f0';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.streakContainer}>
          <Image source={require('../../assets/images/flames.png')} style={styles.streakIcon} />
          <Text style={styles.streakText}>{streak} Days</Text>
        </View>
        <Text style={styles.headerTitle}>Daily Quests</Text>
        <View style={styles.xpBadge}>
          <Text style={styles.xpText}>{totalXP} XP</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressLabel}>PROGRESS</Text>
              <Text style={styles.progressTitle}>Daily Goal</Text>
              <Text style={styles.progressCount}>{completedCount}/{totalCount} Completed</Text>
            </View>
            <Animated.View 
              style={[
                styles.chestContainer,
                { transform: [{ scale: chestAnimation }] }
              ]}
            >
              <View style={[
                styles.chest,
                allCompleted && styles.chestUnlocked
              ]}>
                <Text style={styles.chestIcon}>{allCompleted ? '🎁' : '📦'}</Text>
              </View>
              <Text style={[
                styles.chestStatus,
                allCompleted && styles.chestStatusUnlocked
              ]}>
                {allCompleted ? 'CLAIM!' : 'LOCKED'}
              </Text>
            </Animated.View>
          </View>
          
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
          </View>
          
          <Text style={styles.progressHint}>
            {allCompleted 
              ? '🎉 All quests completed! Claim your reward!'
              : 'Almost there! Unlock the chest today.'}
          </Text>
        </View>

        {/* Today's Tasks */}
        <View style={styles.tasksSection}>
          <Text style={styles.sectionTitle}>Today's Tasks</Text>
          
          {quests.map((quest) => (
            <View 
              key={quest.id} 
              style={[
                styles.questCard,
                quest.completed && styles.questCardCompleted
              ]}
            >
              <View style={[
                styles.questIcon,
                { backgroundColor: getQuestIconBg(quest.type) }
              ]}>
                <Text style={styles.questIconText}>{quest.icon}</Text>
              </View>
              
              <View style={styles.questInfo}>
                <View style={styles.questTitleRow}>
                  <Text style={[
                    styles.questTitle,
                    quest.completed && styles.questTitleCompleted
                  ]}>
                    {quest.title}
                  </Text>
                  <View style={styles.xpRewardBadge}>
                    <Text style={styles.xpRewardText}>+{quest.xpReward} XP</Text>
                  </View>
                </View>
                <Text style={styles.questDescription}>{quest.description}</Text>
              </View>
              
              {quest.completed ? (
                <View style={styles.completedBadge}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.startButton}
                  onPress={() => handleStartQuest(quest.id)}
                >
                  <Text style={styles.startButtonText}>Start</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Bonus Section */}
        <View style={styles.bonusSection}>
          <Text style={styles.sectionTitle}>Bonus Challenges</Text>
          
          <View style={styles.bonusCard}>
            <View style={styles.bonusIconContainer}>
              <Text style={styles.bonusIcon}>⚡</Text>
            </View>
            <View style={styles.bonusInfo}>
              <Text style={styles.bonusTitle}>Speed Round</Text>
              <Text style={styles.bonusDescription}>Complete 10 signs in 60 seconds</Text>
            </View>
            <View style={styles.bonusXP}>
              <Text style={styles.bonusXPText}>+50 XP</Text>
            </View>
          </View>
          
          <View style={styles.bonusCard}>
            <View style={styles.bonusIconContainer}>
              <Text style={styles.bonusIcon}>🎯</Text>
            </View>
            <View style={styles.bonusInfo}>
              <Text style={styles.bonusTitle}>Perfect Streak</Text>
              <Text style={styles.bonusDescription}>Get 5 correct answers in a row</Text>
            </View>
            <View style={styles.bonusXP}>
              <Text style={styles.bonusXPText}>+30 XP</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: AppColors.cardBackground,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakIcon: {
    width: 24,
    height: 24,
  },
  streakText: {
    fontSize: 16,
    ...Fonts.regular,
    color: AppColors.streak,
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 20,
    ...Fonts.appName,
    color: AppColors.textPrimary,
  },
  xpBadge: {
    backgroundColor: AppColors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  xpText: {
    fontSize: 14,
    ...Fonts.appName,
    color: AppColors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  progressCard: {
    backgroundColor: AppColors.cardBackground,
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 12,
    ...Fonts.regular,
    color: AppColors.primary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  progressTitle: {
    fontSize: 24,
    ...Fonts.appName,
    color: AppColors.textPrimary,
    marginBottom: 4,
  },
  progressCount: {
    fontSize: 14,
    ...Fonts.regular,
    color: AppColors.textSecondary,
  },
  chestContainer: {
    alignItems: 'center',
  },
  chest: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: AppColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chestUnlocked: {
    backgroundColor: AppColors.primary,
  },
  chestIcon: {
    fontSize: 32,
  },
  chestStatus: {
    fontSize: 10,
    ...Fonts.regular,
    color: AppColors.textSecondary,
    marginTop: 4,
    letterSpacing: 1,
  },
  chestStatusUnlocked: {
    color: AppColors.primary,
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 10,
    backgroundColor: AppColors.primaryLight,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: AppColors.primary,
    borderRadius: 5,
  },
  progressHint: {
    fontSize: 13,
    ...Fonts.regular,
    color: AppColors.textSecondary,
  },
  tasksSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    ...Fonts.appName,
    color: AppColors.textPrimary,
    marginBottom: 16,
  },
  questCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.cardBackground,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  questCardCompleted: {
    opacity: 0.6,
  },
  questIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  questIconText: {
    fontSize: 28,
  },
  questInfo: {
    flex: 1,
  },
  questTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  questTitle: {
    fontSize: 16,
    ...Fonts.regular,
    color: AppColors.textPrimary,
    marginRight: 8,
  },
  questTitleCompleted: {
    textDecorationLine: 'line-through',
    color: AppColors.textMuted,
  },
  xpRewardBadge: {
    backgroundColor: AppColors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  xpRewardText: {
    fontSize: 12,
    ...Fonts.appName,
    color: AppColors.primary,
  },
  questDescription: {
    fontSize: 13,
    ...Fonts.regular,
    color: AppColors.textSecondary,
  },
  startButton: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  startButtonText: {
    fontSize: 14,
    ...Fonts.appName,
    color: AppColors.textWhite,
  },
  completedBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 18,
    color: AppColors.textWhite,
    ...Fonts.regular,
  },
  bonusSection: {
    marginBottom: 24,
  },
  bonusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.cardBackground,
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: AppColors.primaryLight,
    borderStyle: 'dashed',
  },
  bonusIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bonusIcon: {
    fontSize: 24,
  },
  bonusInfo: {
    flex: 1,
  },
  bonusTitle: {
    fontSize: 15,
    ...Fonts.regular,
    color: AppColors.textPrimary,
    marginBottom: 2,
  },
  bonusDescription: {
    fontSize: 12,
    ...Fonts.regular,
    color: AppColors.textSecondary,
  },
  bonusXP: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bonusXPText: {
    fontSize: 12,
    ...Fonts.appName,
    color: AppColors.warning,
  },
});
