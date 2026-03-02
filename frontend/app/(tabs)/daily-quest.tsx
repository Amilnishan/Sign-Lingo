// frontend/app/(tabs)/daily-quest.tsx
import React, { useEffect, useRef } from 'react';
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

// ─── Screen ──────────────────────────────────────────────────────
export default function DailyQuestScreen() {
  const { quests, loading, claimQuest } = useQuests();
  const { addXP } = useUser();

  const handleClaim = (quest: Quest) => {
    claimQuest(quest.id);
    addXP(quest.xpReward);
  };

  const completedCount = quests.filter(q => q.completed).length;
  const claimedCount = quests.filter(q => q.claimed).length;
  const totalCount = quests.length || 3;
  const pct = Math.round((completedCount / totalCount) * 100);
  const allDone = claimedCount === totalCount && totalCount > 0;

  const chestAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (allDone) {
      Animated.sequence([
        Animated.timing(chestAnim, { toValue: 1.15, duration: 250, useNativeDriver: true }),
        Animated.timing(chestAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [allDone]);

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
        <Text style={styles.headerTitle}>Daily Missions</Text>
        <View style={styles.headerBadge}>
          <Ionicons name="flash" size={16} color={C.gold} />
          <Text style={styles.headerBadgeText}>{completedCount}/{totalCount}</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Treasure Card */}
        <LinearGradient
          colors={allDone ? [C.emerald, C.teal] : [`${C.card}E6`, C.card]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.treasure}
        >
          <View style={styles.treasureTop}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.treasureTag, allDone && { color: '#FFF' }]}>
                {allDone ? 'ALL COMPLETE!' : 'DAILY GOAL'}
              </Text>
              <Text style={[styles.treasureTitle, allDone && { color: '#FFF' }]}>
                {allDone ? 'Claim Your Reward!' : 'Unlock the Chest'}
              </Text>
            </View>
            <Animated.View style={{ transform: [{ scale: chestAnim }] }}>
              <View style={[styles.chestBox, allDone && styles.chestBoxDone]}>
                <Text style={{ fontSize: 44 }}>{allDone ? '🎁' : '📦'}</Text>
              </View>
            </Animated.View>
          </View>

          {/* Master progress bar */}
          <View style={styles.masterBarBg}>
            <LinearGradient
              colors={[C.emerald, C.teal]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.masterBarFill, { width: `${pct}%` }]}
            />
          </View>
          <Text style={[styles.treasureSub, allDone && { color: 'rgba(255,255,255,0.9)' }]}>
            {allDone
              ? '✨ Amazing work! All missions completed!'
              : completedCount === totalCount
                ? `Claim your rewards to unlock the chest!`
                : `Complete ${totalCount - completedCount} more quest${totalCount - completedCount > 1 ? 's' : ''} to unlock!`}
          </Text>
        </LinearGradient>

        {/* Quest list */}
        <Text style={styles.sectionTitle}>⚔️ Active Missions</Text>

        {quests.map(q => (
          <QuestCard key={q.id} quest={q} onClaim={() => handleClaim(q)} />
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 28, fontFamily: 'Nunito-Bold', color: C.text, letterSpacing: 0.5 },
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
  },
  headerBadgeText: { fontSize: 15, fontFamily: 'Nunito-Bold', color: C.gold },
  scroll: { flex: 1, paddingHorizontal: 20 },

  // Treasure card
  treasure: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  treasureTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  treasureTag: { fontSize: 12, fontFamily: 'Nunito-Bold', color: C.emerald, letterSpacing: 1.5, marginBottom: 4 },
  treasureTitle: { fontSize: 22, fontFamily: 'Nunito-Bold', color: C.text },
  chestBox: {
    width: 76,
    height: 76,
    borderRadius: 20,
    backgroundColor: 'rgba(148,163,184,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(148,163,184,0.3)',
  },
  chestBoxDone: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderColor: 'rgba(255,255,255,0.5)',
  },
  masterBarBg: {
    height: 14,
    backgroundColor: 'rgba(148,163,184,0.2)',
    borderRadius: 7,
    overflow: 'hidden',
    marginBottom: 10,
  },
  masterBarFill: { height: '100%', borderRadius: 7 },
  treasureSub: { fontSize: 14, fontFamily: 'Nunito-Regular', color: C.sub, lineHeight: 20 },

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
});

