// frontend/app/learning-stats.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Fonts } from '@/constants/fonts';
import { AppColors } from '@/constants/colors';

const { width } = Dimensions.get('window');

interface UserStats {
  totalXP: number;
  level: number;
  streak: number;
  lessonsCompleted: number;
  quizzesTaken: number;
  averageAccuracy: number;
  timeSpent: number; // in minutes
  signsLearned: number;
}

export default function LearningStatsScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<UserStats>({
    totalXP: 0,
    level: 1,
    streak: 0,
    lessonsCompleted: 0,
    quizzesTaken: 0,
    averageAccuracy: 0,
    timeSpent: 0,
    signsLearned: 0
  });

  // Weekly activity data (mock - would come from API)
  const weeklyActivity = [
    { day: 'Mon', xp: 45, active: true },
    { day: 'Tue', xp: 30, active: true },
    { day: 'Wed', xp: 0, active: false },
    { day: 'Thu', xp: 60, active: true },
    { day: 'Fri', xp: 25, active: true },
    { day: 'Sat', xp: 50, active: true },
    { day: 'Sun', xp: 0, active: false },
  ];

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        setStats({
          totalXP: parsed.xp || 0,
          level: Math.floor((parsed.xp || 0) / 100) + 1,
          streak: parsed.streak || 0,
          lessonsCompleted: parsed.lessons_completed || 0,
          quizzesTaken: parsed.quizzes_taken || 0,
          averageAccuracy: parsed.average_accuracy || 0,
          timeSpent: parsed.time_spent || 0,
          signsLearned: parsed.signs_learned || 0
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const maxXP = Math.max(...weeklyActivity.map(d => d.xp), 1);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Learning Stats</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Stats */}
        <View style={styles.mainStatsGrid}>
          <View style={styles.mainStatCard}>
            <Image source={require('../assets/images/star.png')} style={styles.mainStatIconImage} />
            <Text style={styles.mainStatValue}>{stats.totalXP}</Text>
            <Text style={styles.mainStatLabel}>Total XP</Text>
          </View>
          <View style={styles.mainStatCard}>
            <Image source={require('../assets/images/expertise.png')} style={styles.mainStatIconImage} />
            <Text style={styles.mainStatValue}>{stats.level}</Text>
            <Text style={styles.mainStatLabel}>Level</Text>
          </View>
          <View style={styles.mainStatCard}>
            <Image source={require('../assets/images/flames.png')} style={styles.mainStatIconImage} />
            <Text style={styles.mainStatValue}>{stats.streak}</Text>
            <Text style={styles.mainStatLabel}>Day Streak</Text>
          </View>
        </View>

        {/* Weekly Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Activity</Text>
          <View style={styles.weeklyChart}>
            {weeklyActivity.map((day, index) => (
              <View key={index} style={styles.dayColumn}>
                <View style={styles.barContainer}>
                  <View 
                    style={[
                      styles.bar,
                      { height: `${(day.xp / maxXP) * 100}%` },
                      day.active && styles.barActive
                    ]} 
                  />
                </View>
                <Text style={[
                  styles.dayLabel,
                  day.active && styles.dayLabelActive
                ]}>
                  {day.day}
                </Text>
                <Text style={styles.xpLabel}>{day.xp}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Detailed Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progress Details</Text>
          
          <View style={styles.detailCard}>
            <View style={styles.detailRowSingle}>
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>📖</Text>
                <View>
                  <Text style={styles.detailValue}>{stats.lessonsCompleted}</Text>
                  <Text style={styles.detailLabel}>Lessons Completed</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.detailRowSingle}>
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>❓</Text>
                <View>
                  <Text style={styles.detailValue}>{stats.quizzesTaken}</Text>
                  <Text style={styles.detailLabel}>Quizzes Taken</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.detailRowSingle}>
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>🎯</Text>
                <View>
                  <Text style={styles.detailValue}>{stats.averageAccuracy}%</Text>
                  <Text style={styles.detailLabel}>Avg. Accuracy</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.detailRowSingle}>
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>🤟</Text>
                <View>
                  <Text style={styles.detailValue}>{stats.signsLearned}</Text>
                  <Text style={styles.detailLabel}>Signs Learned</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.detailRowSingle}>
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>⏱️</Text>
                <View>
                  <Text style={styles.detailValue}>{Math.floor(stats.timeSpent / 60)}h {stats.timeSpent % 60}m</Text>
                  <Text style={styles.detailLabel}>Time Spent Learning</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Milestones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next Milestones</Text>
          
          <View style={styles.milestoneCard}>
            <View style={styles.milestoneRow}>
              <Text style={styles.milestoneIcon}>🎯</Text>
              <View style={styles.milestoneInfo}>
                <Text style={styles.milestoneTitle}>Reach Level {stats.level + 1}</Text>
                <View style={styles.milestoneProgress}>
                  <View style={styles.milestoneProgressBg}>
                    <View 
                      style={[
                        styles.milestoneProgressFill,
                        { width: `${stats.totalXP % 100}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.milestoneProgressText}>
                    {stats.totalXP % 100}/100 XP
                  </Text>
                </View>
              </View>
            </View>
          </View>
          
          <View style={styles.milestoneCard}>
            <View style={styles.milestoneRow}>
              <Text style={styles.milestoneIcon}>🔥</Text>
              <View style={styles.milestoneInfo}>
                <Text style={styles.milestoneTitle}>7-Day Streak</Text>
                <View style={styles.milestoneProgress}>
                  <View style={styles.milestoneProgressBg}>
                    <View 
                      style={[
                        styles.milestoneProgressFill,
                        { width: `${(stats.streak / 7) * 100}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.milestoneProgressText}>
                    {stats.streak}/7 days
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: AppColors.primary,
  },
  headerTitle: {
    fontSize: 20,
    ...Fonts.appName,
    color: AppColors.textWhite,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  mainStatsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  mainStatCard: {
    flex: 1,
    backgroundColor: AppColors.cardBackground,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  mainStatIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  mainStatIconImage: {
    width: 32,
    height: 32,
    marginBottom: 8,
  },
  mainStatValue: {
    fontSize: 24,
    ...Fonts.appName,
    color: AppColors.textPrimary,
  },
  mainStatLabel: {
    fontSize: 11,
    ...Fonts.regular,
    color: AppColors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    ...Fonts.appName,
    color: AppColors.textPrimary,
    marginBottom: 16,
  },
  weeklyChart: {
    flexDirection: 'row',
    backgroundColor: AppColors.cardBackground,
    borderRadius: 20,
    padding: 20,
    justifyContent: 'space-between',
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  dayColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    height: 100,
    width: 24,
    backgroundColor: AppColors.primaryLight,
    borderRadius: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 8,
  },
  bar: {
    width: '100%',
    backgroundColor: AppColors.primaryLight,
    borderRadius: 12,
  },
  barActive: {
    backgroundColor: AppColors.primary,
  },
  dayLabel: {
    fontSize: 12,
    ...Fonts.regular,
    color: AppColors.textSecondary,
    marginBottom: 4,
  },
  dayLabelActive: {
    color: AppColors.primary,
    ...Fonts.appName,
  },
  xpLabel: {
    fontSize: 10,
    ...Fonts.regular,
    color: AppColors.textSecondary,
  },
  detailCard: {
    backgroundColor: AppColors.cardBackground,
    borderRadius: 20,
    padding: 20,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  detailRow: {
    flexDirection: 'row',
  },
  detailRowSingle: {
    flexDirection: 'row',
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailIcon: {
    fontSize: 28,
  },
  detailValue: {
    fontSize: 18,
    ...Fonts.appName,
    color: AppColors.textPrimary,
  },
  detailLabel: {
    fontSize: 12,
    ...Fonts.regular,
    color: AppColors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: AppColors.primaryLight,
    marginVertical: 16,
  },
  milestoneCard: {
    backgroundColor: AppColors.cardBackground,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  milestoneIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 16,
    ...Fonts.regular,
    color: AppColors.textPrimary,
    marginBottom: 8,
  },
  milestoneProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  milestoneProgressBg: {
    flex: 1,
    height: 8,
    backgroundColor: AppColors.primaryLight,
    borderRadius: 4,
    marginRight: 12,
  },
  milestoneProgressFill: {
    height: '100%',
    backgroundColor: AppColors.primary,
    borderRadius: 4,
  },
  milestoneProgressText: {
    fontSize: 12,
    ...Fonts.appName,
    color: AppColors.textSecondary,
    width: 70,
  },
});
