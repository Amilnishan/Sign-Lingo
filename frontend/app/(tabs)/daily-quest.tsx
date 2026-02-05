// frontend/app/(tabs)/daily-quest.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  orange: '#F97316',
  blue: '#3B82F6',
  purple: '#8B5CF6',
  gold: '#FFD700',
};

interface Quest {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
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
      title: 'Speed Round',
      description: 'Complete in 60 seconds',
      icon: 'flash',
      xpReward: 20,
      completed: false,
      type: 'practice'
    },
    {
      id: '2',
      title: 'Master Vocabulary',
      description: 'Learn 5 new signs',
      icon: 'book',
      xpReward: 30,
      completed: false,
      type: 'vocabulary'
    },
    {
      id: '3',
      title: 'Quiz Champion',
      description: 'Complete weekly review',
      icon: 'help-circle',
      xpReward: 25,
      completed: false,
      type: 'quiz'
    }
  ]);

  const [chestAnimation] = useState(new Animated.Value(1));
  
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();

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
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(chestAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleStartQuest = async (questId: string) => {
    const updatedQuests = quests.map(q => 
      q.id === questId ? { ...q, completed: true } : q
    );
    setQuests(updatedQuests);
    await AsyncStorage.setItem('dailyQuests', JSON.stringify(updatedQuests));
    
    const quest = quests.find(q => q.id === questId);
    if (quest) {
      const newXP = totalXP + quest.xpReward;
      setTotalXP(newXP);
      
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        parsed.xp = newXP;
        await AsyncStorage.setItem('userData', JSON.stringify(parsed));
      }
      
      showAlert(
        '🎉 Quest Complete!',
        `You earned +${quest.xpReward} XP!`,
        [{ text: 'Awesome!' }],
        'success'
      );
    }

    if (updatedQuests.every(q => q.completed)) {
      animateChest();
      setTimeout(() => {
        showAlert(
          '🎁 Daily Chest Unlocked!',
          'Congratulations! You completed all daily missions!',
          [{ text: 'Claim Reward' }],
          'success'
        );
      }, 500);
    }
  };

  const getQuestColor = (type: string) => {
    switch (type) {
      case 'practice': return COLORS.orange;
      case 'vocabulary': return COLORS.blue;
      case 'quiz': return COLORS.purple;
      default: return COLORS.emerald;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Daily Missions</Text>
        <View style={styles.xpBadge}>
          <Ionicons name="flash" size={16} color={COLORS.gold} />
          <Text style={styles.xpText}>{totalXP} XP</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Progress Card - Treasure Chest */}
        <LinearGradient
          colors={allCompleted ? [COLORS.emerald, COLORS.teal] : [`${COLORS.cardBg}E6`, COLORS.cardBg]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.treasureCard}
        >
          <View style={styles.treasureHeader}>
            <View>
              <Text style={[styles.treasureLabel, allCompleted && styles.treasureLabelComplete]}>
                {allCompleted ? 'COMPLETED!' : 'DAILY GOAL'}
              </Text>
              <Text style={[styles.treasureTitle, allCompleted && styles.treasureTitleComplete]}>
                {allCompleted ? 'Claim Your Reward!' : 'Unlock the Chest'}
              </Text>
            </View>
            <Animated.View style={{ transform: [{ scale: chestAnimation }] }}>
              <View style={[styles.chestContainer, allCompleted && styles.chestUnlocked]}>
                <Text style={styles.chestIcon}>{allCompleted ? '🎁' : '📦'}</Text>
              </View>
            </Animated.View>
          </View>
          
          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBg}>
              <LinearGradient
                colors={[COLORS.emerald, COLORS.teal]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
              />
            </View>
            <Text style={[styles.progressText, allCompleted && styles.progressTextComplete]}>
              {completedCount}/{totalCount} completed
            </Text>
          </View>
          
          <Text style={[styles.treasureHint, allCompleted && styles.treasureHintComplete]}>
            {allCompleted 
              ? '✨ Amazing work! All missions completed!'
              : `Complete ${totalCount - completedCount} more quest${totalCount - completedCount > 1 ? 's' : ''} to unlock!`}
          </Text>
        </LinearGradient>

        {/* Quest List - Mission Cards */}
        <View style={styles.questsSection}>
          <Text style={styles.sectionTitle}>⚔️ Active Missions</Text>
          
          {quests.map((quest) => {
            const questColor = getQuestColor(quest.type);
            return (
              <View 
                key={quest.id} 
                style={[
                  styles.questCard,
                  quest.completed && styles.questCardCompleted
                ]}
              >
                {/* Left: Icon Container */}
                <View style={[styles.questIconContainer, { backgroundColor: `${questColor}33` }]}>
                  <Ionicons name={quest.icon} size={28} color={questColor} />
                </View>
                
                {/* Middle: Quest Info */}
                <View style={styles.questInfo}>
                  <View style={styles.questTitleRow}>
                    <Text style={[
                      styles.questTitle,
                      quest.completed && styles.questTitleCompleted
                    ]}>
                      {quest.title}
                    </Text>
                  </View>
                  <Text style={styles.questDescription}>{quest.description}</Text>
                  <View style={styles.xpBadgeSmall}>
                    <Ionicons name="star" size={12} color={COLORS.gold} />
                    <Text style={styles.xpBadgeText}>+{quest.xpReward} XP</Text>
                  </View>
                </View>
                
                {/* Right: Action Button */}
                {quest.completed ? (
                  <View style={styles.claimedBadge}>
                    <Ionicons name="checkmark-circle" size={32} color={COLORS.emerald} />
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.startButton}
                    onPress={() => handleStartQuest(quest.id)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[questColor, questColor]}
                      style={styles.startButtonGradient}
                    >
                      <Text style={styles.startButtonText}>Start</Text>
                      <Ionicons name="arrow-forward" size={16} color="#FFF" />
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

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
    </View>
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
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Nunito-Bold',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.cardBg}E6`,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 6,
  },
  xpText: {
    fontSize: 15,
    fontFamily: 'Nunito-Bold',
    color: COLORS.gold,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  // Treasure Card
  treasureCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: COLORS.emerald,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  treasureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  treasureLabel: {
    fontSize: 12,
    fontFamily: 'Nunito-Bold',
    color: COLORS.emerald,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  treasureLabelComplete: {
    color: '#FFF',
  },
  treasureTitle: {
    fontSize: 22,
    fontFamily: 'Nunito-Bold',
    color: COLORS.textPrimary,
  },
  treasureTitleComplete: {
    color: '#FFF',
  },
  chestContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(148, 163, 184, 0.3)',
  },
  chestUnlocked: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  chestIcon: {
    fontSize: 48,
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressBarBg: {
    height: 14,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    borderRadius: 7,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 7,
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
    color: COLORS.emerald,
  },
  progressTextComplete: {
    color: '#FFF',
  },
  treasureHint: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  treasureHintComplete: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  // Quests Section
  questsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  questCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.cardBg}E6`,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  questCardCompleted: {
    opacity: 0.6,
  },
  questIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  questInfo: {
    flex: 1,
  },
  questTitleRow: {
    marginBottom: 4,
  },
  questTitle: {
    fontSize: 17,
    fontFamily: 'Nunito-Bold',
    color: COLORS.textPrimary,
  },
  questTitleCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
  },
  questDescription: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  xpBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  xpBadgeText: {
    fontSize: 12,
    fontFamily: 'Nunito-Bold',
    color: COLORS.gold,
  },
  startButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: COLORS.emerald,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 6,
  },
  startButtonText: {
    fontSize: 15,
    fontFamily: 'Nunito-Bold',
    color: '#FFF',
  },
  claimedBadge: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
