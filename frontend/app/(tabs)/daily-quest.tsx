// frontend/app/(tabs)/daily-quest.tsx
import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuests, Quest } from '@/contexts/QuestContext';
import { useUser } from '@/contexts/UserContext';

const { width } = Dimensions.get('window');

// ─── Countdown Hook ──────────────────────────────────────────────
function useResetCountdown() {
  const getRemaining = () => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return Math.max(0, midnight.getTime() - now.getTime());
  };

  const [ms, setMs] = useState(getRemaining);

  useEffect(() => {
    const id = setInterval(() => setMs(getRemaining()), 60_000);
    return () => clearInterval(id);
  }, []);

  const totalMin = Math.floor(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

// ─── Design tokens ───────────────────────────────────────────────
const C = {
  bg: '#0F172A',
  card: '#1E293B',
  cardBorder: '#334155',
  text: '#FFFFFF',
  sub: '#94A3B8',
  emerald: '#2ECC71',
  teal: '#14B8A6',
  orange: '#F97316',
  blue: '#3B82F6',
  purple: '#8B5CF6',
  gold: '#FFD700',
};

const TYPE_META: Record<string, { color: string; iconFallback: string }> = {
  sign:   { color: C.blue,   iconFallback: 'hand-left-outline' },
  xp:     { color: C.orange, iconFallback: 'flash-outline' },
  lesson: { color: C.purple, iconFallback: 'book-outline' },
  quiz:   { color: C.teal,   iconFallback: 'help-circle-outline' },
};

// ─── Animated Quest Card ─────────────────────────────────────────
function QuestCard({ quest, onClaim }: { quest: Quest; onClaim: () => void }) {
  const fillAnim = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const meta = TYPE_META[quest.type] ?? TYPE_META.sign;

  const pct = quest.target > 0 ? Math.min(quest.current / quest.target, 1) : 0;

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: pct,
      duration: 600,
      useNativeDriver: false,
    }).start();

    if (quest.completed) {
      Animated.spring(checkScale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }).start();
    }
  }, [pct, quest.completed]);

  const barWidth = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const barColor = quest.completed ? C.emerald : meta.color;

  return (
    <View style={[styles.card, quest.completed && styles.cardDone]}>
      {/* Icon */}
      <View style={[styles.iconWrap, { backgroundColor: `${barColor}25` }]}>
        <Ionicons
          name={(quest.icon || meta.iconFallback) as any}
          size={26}
          color={barColor}
        />
      </View>

      {/* Info + bar */}
      <View style={styles.cardBody}>
        <View style={styles.topRow}>
          <Text style={[styles.questLabel, quest.completed && styles.questLabelDone]}>
            {quest.label}
          </Text>
          <Text style={[styles.counterText, { color: barColor }]}>
            {quest.current}/{quest.target}
          </Text>
        </View>

        {/* Progress bar */}
        <View style={styles.barBg}>
          <Animated.View style={[styles.barFill, { width: barWidth, backgroundColor: barColor }]} />
        </View>

        {/* XP badge */}
        <View style={styles.xpRow}>
          <Ionicons name="star" size={12} color={C.gold} />
          <Text style={styles.xpText}>+{quest.xpReward} XP</Text>
        </View>
      </View>

      {/* Claim button or completed checkmark */}
      {quest.completed && !quest.claimed && (
        <TouchableOpacity onPress={onClaim} style={styles.claimBtn}>
          <LinearGradient
            colors={[C.emerald, C.teal]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.claimGrad}
          >
            <Ionicons name="gift" size={14} color="#fff" />
            <Text style={styles.claimText}>Claim</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
      {quest.claimed && (
        <Animated.View style={[styles.checkWrap, { transform: [{ scale: checkScale }] }]}>
          <Ionicons name="checkmark-circle" size={30} color={C.emerald} />
        </Animated.View>
      )}
    </View>
  );
}

// ─── Animated Flame Glow ─────────────────────────────────────────
function MotivationCard() {
  const glow = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1800, useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0.4, duration: 1800, useNativeDriver: false }),
      ]),
    ).start();
  }, []);

  const glowOpacity = glow.interpolate({ inputRange: [0.4, 1], outputRange: [0.25, 0.6] });

  return (
    <View style={styles.motionOuter}>
      {/* Soft orange glow behind the card */}
      <Animated.View style={[styles.motionGlow, { opacity: glowOpacity }]} />

      <View style={styles.motionCard}>
        {/* Flame icon */}
        <View style={styles.motionIconWrap}>
          <Ionicons name="flame" size={38} color={C.orange} />
        </View>

        {/* Text */}
        <View style={styles.motionTextWrap}>
          <Text style={styles.motionTitle}>Build Your Habit</Text>
          <Text style={styles.motionSub}>
            Completing daily missions every day builds your streak faster. Don't break the chain!
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────
export default function DailyQuestScreen() {
  const { quests, loading, claimQuest } = useQuests();
  const { addXP } = useUser();
  const timeLeft = useResetCountdown();

  const handleClaim = (quest: Quest) => {
    claimQuest(quest.id);
    addXP(quest.xpReward);
  };

  const completedCount = quests.filter(q => q.completed).length;
  const totalCount = quests.length || 3;

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={C.emerald} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Daily Missions</Text>
          <Text style={styles.headerSubtitle}>Consistency is the key to fluency!</Text>
        </View>
        <View style={styles.headerBadge}>
          <Ionicons name="flash" size={16} color={C.gold} />
          <Text style={styles.headerBadgeText}>{completedCount}/{totalCount}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 40 }}
      >
        {/* Timer pill */}
        <View style={styles.timerRow}>
          <View style={styles.timerPill}>
            <Text style={styles.timerEmoji}>⏳</Text>
            <Text style={styles.timerText}>Resets in {timeLeft}</Text>
          </View>
        </View>

        {/* Quest list */}
        <Text style={styles.sectionTitle}>⚔️ Active Missions</Text>

        {quests.map(q => (
          <QuestCard key={q.id} quest={q} onClaim={() => handleClaim(q)} />
        ))}

        {/* Motivational card */}
        <MotivationCard />
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 28, fontFamily: 'Nunito-Bold', color: C.text, letterSpacing: 0.5 },
  headerSubtitle: { fontSize: 14, fontFamily: 'Nunito-Regular', color: C.sub, marginTop: 4 },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${C.card}E6`,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.cardBorder,
    gap: 6,
    marginTop: 4,
  },
  headerBadgeText: { fontSize: 15, fontFamily: 'Nunito-Bold', color: C.gold },
  scroll: { flex: 1, paddingHorizontal: 20 },

  // Timer pill
  timerRow: { alignItems: 'flex-start', marginBottom: 20 },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(249,115,22,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.25)',
    gap: 6,
  },
  timerEmoji: { fontSize: 14 },
  timerText: { fontSize: 13, fontFamily: 'Nunito-Bold', color: C.orange },

  sectionTitle: { fontSize: 18, fontFamily: 'Nunito-Bold', color: C.text, marginBottom: 14 },

  // Quest card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${C.card}E6`,
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  cardDone: {
    borderColor: C.emerald,
    backgroundColor: 'rgba(46,204,113,0.08)',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardBody: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  questLabel: { fontSize: 16, fontFamily: 'Nunito-Bold', color: C.text, flex: 1, marginRight: 8 },
  questLabelDone: { color: C.emerald },
  counterText: { fontSize: 14, fontFamily: 'Nunito-Bold' },

  // Progress bar
  barBg: {
    height: 8,
    backgroundColor: 'rgba(148,163,184,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  barFill: { height: '100%', borderRadius: 4 },

  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,215,0,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  xpText: { fontSize: 12, fontFamily: 'Nunito-Bold', color: C.gold },

  checkWrap: { marginLeft: 8 },

  // Claim button
  claimBtn: {
    marginLeft: 8,
    borderRadius: 14,
    overflow: 'hidden',
  },
  claimGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 5,
  },
  claimText: {
    fontSize: 13,
    fontFamily: 'Nunito-Bold',
    color: '#fff',
  },

  // Motivation card
  motionOuter: {
    marginTop: 20,
    position: 'relative',
  },
  motionGlow: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: 28,
    backgroundColor: C.orange,
  },
  motionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${C.card}F0`,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.3)',
  },
  motionIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: 'rgba(249,115,22,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  motionTextWrap: { flex: 1 },
  motionTitle: {
    fontSize: 17,
    fontFamily: 'Nunito-Bold',
    color: C.text,
    marginBottom: 4,
  },
  motionSub: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    color: C.sub,
    lineHeight: 19,
  },
});

