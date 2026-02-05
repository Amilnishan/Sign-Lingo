// frontend/app/learning-stats.tsx
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
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

const { width } = Dimensions.get('window');

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
  orange: '#F97316',
  blue: '#3B82F6',
  purple: '#8B5CF6',
};

interface UserStats {
  totalXP: number;
  level: number;
  streak: number;
  lessonsCompleted: number;
  quizzesTaken: number;
  averageAccuracy: number;
  timeSpent: number;
  signsLearned: number;
}

// Simple Line Chart Component
const SimpleLineChart = ({ data, width: chartWidth, height }: { data: number[], width: number, height: number }) => {
  const maxValue = Math.max(...data, 1);
  const padding = 20;
  const graphWidth = chartWidth - padding * 2;
  const graphHeight = height - padding * 2;
  
  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * graphWidth;
    const y = padding + graphHeight - (value / maxValue) * graphHeight;
    return { x, y };
  });

  const pathD = points.reduce((acc, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const prev = points[index - 1];
    const cpx1 = prev.x + (point.x - prev.x) / 3;
    const cpx2 = prev.x + (2 * (point.x - prev.x)) / 3;
    return `${acc} C ${cpx1} ${prev.y}, ${cpx2} ${point.y}, ${point.x} ${point.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`;

  return (
    <Svg width={chartWidth} height={height}>
      <Defs>
        <SvgGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={COLORS.emerald} stopOpacity="0.4" />
          <Stop offset="100%" stopColor={COLORS.emerald} stopOpacity="0" />
        </SvgGradient>
      </Defs>
      <Path d={areaD} fill="url(#areaGradient)" />
      <Path d={pathD} stroke={COLORS.emerald} strokeWidth="3" fill="none" strokeLinecap="round" />
      {points.map((point, index) => (
        <View key={index}>
          <Path
            d={`M ${point.x - 4} ${point.y} a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0`}
            fill={COLORS.emerald}
          />
        </View>
      ))}
    </Svg>
  );
};

// Circular Progress Component
const CircularProgress = ({ percentage, size, color }: { percentage: number, size: number, color: string }) => {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Path
          d={`M ${size / 2} ${strokeWidth / 2} a ${radius} ${radius} 0 1 1 0 ${radius * 2} a ${radius} ${radius} 0 1 1 0 -${radius * 2}`}
          stroke="rgba(148, 163, 184, 0.2)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Path
          d={`M ${size / 2} ${strokeWidth / 2} a ${radius} ${radius} 0 1 1 0 ${radius * 2} a ${radius} ${radius} 0 1 1 0 -${radius * 2}`}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <Text style={{ fontSize: 14, fontFamily: 'Nunito-Bold', color: COLORS.textPrimary }}>{percentage}%</Text>
    </View>
  );
};

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

  const weeklyXP = [45, 30, 0, 60, 25, 50, 35];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
          averageAccuracy: parsed.average_accuracy || 85,
          timeSpent: parsed.time_spent || 0,
          signsLearned: parsed.signs_learned || 0
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Weekly Activity Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>📈 Weekly Progress</Text>
          <View style={styles.chartContainer}>
            <SimpleLineChart data={weeklyXP} width={width - 64} height={160} />
          </View>
          <View style={styles.chartLabels}>
            {days.map((day, index) => (
              <Text key={day} style={[
                styles.chartLabel,
                weeklyXP[index] > 0 && styles.chartLabelActive
              ]}>{day}</Text>
            ))}
          </View>
        </View>

        {/* Bento Grid Stats */}
        <Text style={styles.sectionTitle}>📊 Your Stats</Text>
        <View style={styles.bentoGrid}>
          {/* Streak Card */}
          <View style={[styles.bentoCard, styles.bentoCardLarge]}>
            <LinearGradient
              colors={['#F97316', '#EA580C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bentoGradient}
            >
              <Text style={styles.bentoIcon}>🔥</Text>
              <Text style={styles.bentoValue}>{stats.streak}</Text>
              <Text style={styles.bentoLabel}>Day Streak</Text>
            </LinearGradient>
          </View>

          {/* Average XP Card */}
          <View style={[styles.bentoCard, styles.bentoCardLarge]}>
            <LinearGradient
              colors={[COLORS.emerald, COLORS.teal]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bentoGradient}
            >
              <Text style={styles.bentoIcon}>⚡</Text>
              <Text style={styles.bentoValue}>{stats.totalXP}</Text>
              <Text style={styles.bentoLabel}>Total XP</Text>
            </LinearGradient>
          </View>

          {/* Accuracy Card */}
          <View style={[styles.bentoCard, styles.bentoCardSmall]}>
            <View style={styles.bentoInner}>
              <CircularProgress percentage={stats.averageAccuracy || 85} size={56} color={COLORS.blue} />
              <Text style={styles.bentoLabelDark}>Accuracy</Text>
            </View>
          </View>

          {/* Lessons Card */}
          <View style={[styles.bentoCard, styles.bentoCardSmall]}>
            <View style={styles.bentoInner}>
              <View style={styles.bentoIconContainer}>
                <Ionicons name="book" size={28} color={COLORS.purple} />
              </View>
              <Text style={styles.bentoValueDark}>{stats.lessonsCompleted}</Text>
              <Text style={styles.bentoLabelDark}>Lessons</Text>
            </View>
          </View>
        </View>

        {/* Next Milestone Card */}
        <Text style={styles.sectionTitle}>🎯 Next Milestone</Text>
        <LinearGradient
          colors={[COLORS.cardBg, '#1E293B']}
          style={styles.milestoneCard}
        >
          <View style={styles.milestoneHeader}>
            <Text style={styles.milestoneIcon}>🏆</Text>
            <View style={styles.milestoneInfo}>
              <Text style={styles.milestoneTitle}>Reach Level {stats.level + 1}</Text>
              <Text style={styles.milestoneSubtitle}>Keep going, you&apos;re almost there!</Text>
            </View>
          </View>
          <View style={styles.milestoneProgressContainer}>
            <View style={styles.milestoneProgressBg}>
              <LinearGradient
                colors={[COLORS.emerald, COLORS.teal]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.milestoneProgressFill, { width: `${stats.totalXP % 100}%` }]}
              />
            </View>
            <Text style={styles.milestoneProgressText}>{stats.totalXP % 100}/100 XP</Text>
          </View>
        </LinearGradient>

        {/* Quick Stats */}
        <View style={styles.quickStatsRow}>
          <View style={styles.quickStatCard}>
            <Ionicons name="time-outline" size={24} color={COLORS.emerald} />
            <Text style={styles.quickStatValue}>
              {Math.floor(stats.timeSpent / 60)}h {stats.timeSpent % 60}m
            </Text>
            <Text style={styles.quickStatLabel}>Time Spent</Text>
          </View>
          <View style={styles.quickStatCard}>
            <Ionicons name="hand-right-outline" size={24} color={COLORS.emerald} />
            <Text style={styles.quickStatValue}>{stats.signsLearned}</Text>
            <Text style={styles.quickStatLabel}>Signs Learned</Text>
          </View>
          <View style={styles.quickStatCard}>
            <Ionicons name="help-circle-outline" size={24} color={COLORS.emerald} />
            <Text style={styles.quickStatValue}>{stats.quizzesTaken}</Text>
            <Text style={styles.quickStatLabel}>Quizzes</Text>
          </View>
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
  // Chart Card
  chartCard: {
    backgroundColor: `${COLORS.cardBg}E6`,
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  chartTitle: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 8,
  },
  chartLabel: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: COLORS.textSecondary,
    flex: 1,
    textAlign: 'center',
  },
  chartLabelActive: {
    color: COLORS.emerald,
    fontFamily: 'Nunito-Bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  // Bento Grid
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  bentoCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  bentoCardLarge: {
    width: (width - 44) / 2,
    height: 140,
  },
  bentoCardSmall: {
    width: (width - 44) / 2,
    height: 120,
    backgroundColor: `${COLORS.cardBg}E6`,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  bentoGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bentoInner: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bentoIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  bentoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  bentoValue: {
    fontSize: 32,
    fontFamily: 'Nunito-Bold',
    color: '#FFF',
  },
  bentoValueDark: {
    fontSize: 24,
    fontFamily: 'Nunito-Bold',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  bentoLabel: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: 'rgba(255,255,255,0.8)',
  },
  bentoLabelDark: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  // Milestone Card
  milestoneCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  milestoneIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  milestoneSubtitle: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: COLORS.textSecondary,
  },
  milestoneProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  milestoneProgressBg: {
    flex: 1,
    height: 12,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  milestoneProgressFill: {
    height: '100%',
    borderRadius: 6,
  },
  milestoneProgressText: {
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
    color: COLORS.emerald,
    minWidth: 80,
  },
  // Quick Stats
  quickStatsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: `${COLORS.cardBg}E6`,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  quickStatValue: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    color: COLORS.textPrimary,
    marginTop: 8,
  },
  quickStatLabel: {
    fontSize: 11,
    fontFamily: 'Nunito-Regular',
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});