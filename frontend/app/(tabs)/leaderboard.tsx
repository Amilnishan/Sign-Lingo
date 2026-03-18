// frontend/app/(tabs)/leaderboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '@/constants/config';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// ── Design tokens ──────────────────────────────────────────────
const COLORS = {
  background: '#0F172A',
  cardBg: '#1E293B',
  cardBorder: '#334155',
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  emerald: '#2ECC71',
  emeraldDark: '#1FA855',
  teal: '#14B8A6',
  gold: '#FFD700',
  goldDark: '#F59E0B',
  silver: '#E2E8F0',
  silverDark: '#94A3B8',
  bronze: '#D97706',
  bronzeDark: '#B45309',
};

interface Player {
  _id: string;
  full_name: string;
  email: string;
  xp: number;
  avatar?: string;
}

// ── Podium column component ────────────────────────────────────
function PodiumColumn({
  player,
  rank,
  avatarSize,
  pedestalHeight,
  gradientColors,
  accentColor,
}: {
  player: Player | undefined;
  rank: 1 | 2 | 3;
  avatarSize: number;
  pedestalHeight: number;
  gradientColors: readonly [string, string, ...string[]];
  accentColor: string;
}) {
  const badgeSize = rank === 1 ? 28 : 24;
  const initial = player?.full_name?.charAt(0)?.toUpperCase() || '?';

  return (
    <View style={styles.podiumColumn}>
      {/* Trophy for 1st */}
      {rank === 1 && (
        <Ionicons
          name="trophy"
          size={30}
          color={COLORS.gold}
          style={{ marginBottom: 6 }}
        />
      )}

      {/* Avatar — sits directly above the pedestal */}
      <View
        style={[
          styles.podiumAvatar,
          {
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
            borderColor: accentColor,
            shadowColor: accentColor,
          },
        ]}
      >
        <Text
          style={[
            styles.podiumAvatarText,
            { fontSize: rank === 1 ? 34 : 24 },
          ]}
        >
          {initial}
        </Text>
      </View>

      {/* Rank badge — overlaps bottom-center of avatar */}
      <View
        style={[
          styles.rankBadge,
          {
            width: badgeSize,
            height: badgeSize,
            borderRadius: badgeSize / 2,
            backgroundColor: accentColor,
            marginTop: -(badgeSize / 2),
            zIndex: 5,
          },
        ]}
      >
        <Text style={styles.rankBadgeText}>{rank}</Text>
      </View>

      {/* Solid gradient pedestal */}
      <LinearGradient
        colors={gradientColors}
        style={[
          styles.pedestal,
          {
            height: pedestalHeight,
            width: rank === 1 ? 100 : 86,
          },
        ]}
      >
        <Text
          style={[
            styles.pedestalName,
            rank === 1 && { fontSize: 15 },
          ]}
          numberOfLines={1}
        >
          {player?.full_name || `Player ${rank}`}
        </Text>
        <View style={styles.pedestalXpRow}>
          <Ionicons name="flash" size={rank === 1 ? 14 : 12} color="#FFF" />
          <Text
            style={[
              styles.pedestalXpText,
              rank === 1 && { fontSize: 16 },
            ]}
          >
            {player?.xp ?? 0}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────
export default function LeaderboardScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'week' | 'allTime'>('week');
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [myRank, setMyRank] = useState<number | null>(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  // Recalculate rank whenever players list OR currentUserId changes.
  // This fixes the first-load race condition where fetchLeaderboard runs
  // before loadCurrentUser has finished setting currentUserId.
  useEffect(() => {
    if (!currentUserId || players.length === 0) return;
    const rank = players.findIndex(
      (p) => p._id === currentUserId || p.email === currentUserId,
    );
    setMyRank(rank >= 0 ? rank + 1 : null);
  }, [players, currentUserId]);

  useFocusEffect(
    useCallback(() => {
      fetchLeaderboard();
    }, [activeTab])
  );

  const loadCurrentUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        setCurrentUserId(parsed._id || parsed.email);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(
        `${API_URL}/leaderboard?period=${activeTab}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );

      if (response.data && response.data.players) {
        setPlayers(response.data.players);
        // myRank is derived reactively by the useEffect above.
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setPlayers([
        { _id: '1', full_name: 'Alex Champion', email: 'player1@test.com', xp: 2500 },
        { _id: '2', full_name: 'Sam Runner', email: 'player2@test.com', xp: 2200 },
        { _id: '3', full_name: 'Jordan Star', email: 'player3@test.com', xp: 1900 },
        { _id: '4', full_name: 'Taylor Swift', email: 'player4@test.com', xp: 1650 },
        { _id: '5', full_name: 'Morgan Ace', email: 'player5@test.com', xp: 1400 },
        { _id: '6', full_name: 'Riley Pro', email: 'player6@test.com', xp: 1200 },
        { _id: '7', full_name: 'Casey Elite', email: 'player7@test.com', xp: 980 },
        { _id: '8', full_name: 'Drew Master', email: 'player8@test.com', xp: 750 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getUsername = (player: Player) =>
    '@' + (player.full_name?.toLowerCase().replace(/\s+/g, '') || 'player');

  const topThree = players.slice(0, 3);
  const restPlayers = players.slice(3);

  // ── Render ───────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header + Toggle */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leaderboard</Text>

        <View style={styles.toggleBar}>
          {(['week', 'allTime'] as const).map((tab) => {
            const active = activeTab === tab;
            const label = tab === 'week' ? 'This Week' : 'All Time';
            return active ? (
              <LinearGradient
                key={tab}
                colors={[COLORS.emerald, COLORS.emeraldDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.togglePillActive}
              >
                <TouchableOpacity
                  style={styles.togglePillInner}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.toggleTextActive}>{label}</Text>
                </TouchableOpacity>
              </LinearGradient>
            ) : (
              <TouchableOpacity
                key={tab}
                style={styles.togglePillInactive}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.7}
              >
                <Text style={styles.toggleTextInactive}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.emerald} />
        </View>
      ) : (
        <>
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* ── Podium ─────────────────────────────────── */}
            <View style={styles.podiumSection}>
              <View style={styles.podiumRow}>
                {/* 2nd place — left */}
                <PodiumColumn
                  player={topThree[1]}
                  rank={2}
                  avatarSize={60}
                  pedestalHeight={90}
                  gradientColors={[COLORS.silver, COLORS.silverDark]}
                  accentColor={COLORS.silver}
                />

                {/* 1st place — center, taller */}
                <PodiumColumn
                  player={topThree[0]}
                  rank={1}
                  avatarSize={80}
                  pedestalHeight={120}
                  gradientColors={[COLORS.gold, COLORS.goldDark]}
                  accentColor={COLORS.gold}
                />

                {/* 3rd place — right */}
                <PodiumColumn
                  player={topThree[2]}
                  rank={3}
                  avatarSize={60}
                  pedestalHeight={70}
                  gradientColors={[COLORS.bronze, COLORS.bronzeDark]}
                  accentColor={COLORS.bronze}
                />
              </View>
            </View>

            {/* ── Rankings list (4 +) ────────────────────── */}
            <View style={styles.listSection}>
              <View style={styles.listHeader}>
                <Ionicons name="list" size={18} color={COLORS.textSecondary} />
                <Text style={styles.listTitle}>Rankings</Text>
              </View>

              {restPlayers.map((player, index) => {
                const rank = index + 4;
                const isMe =
                  player._id === currentUserId ||
                  player.email === currentUserId;
                return (
                  <View
                    key={player._id}
                    style={[styles.playerCard, isMe && styles.playerCardMe]}
                  >
                    <Text style={styles.cardRank}>{rank}</Text>

                    <View style={styles.cardAvatar}>
                      <Text style={styles.cardAvatarText}>
                        {player.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </Text>
                    </View>

                    <View style={styles.cardInfo}>
                      <Text style={styles.cardName}>{player.full_name}</Text>
                      <Text style={styles.cardUsername}>
                        {getUsername(player)}
                      </Text>
                    </View>

                    <Text style={styles.cardXp}>
                      <Ionicons name="flash" size={14} color={COLORS.emerald} />{' '}
                      {player.xp}
                    </Text>
                  </View>
                );
              })}
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>

          {/* ── Fixed "My Ranking" bar ───────────────────── */}
          {myRank && (
            <View style={styles.myRankBar}>
              <LinearGradient
                colors={[COLORS.emerald, COLORS.teal]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.myRankGradient}
              >
                <View style={styles.myRankContent}>
                  <View style={styles.myRankLeft}>
                    <View style={styles.myRankBadge}>
                      <Text style={styles.myRankNumber}>#{myRank}</Text>
                    </View>
                    <Text style={styles.myRankLabel}>Your Rank</Text>
                  </View>
                  <View style={styles.myRankRight}>
                    <Ionicons name="flash" size={18} color="#FFF" />
                    <Text style={styles.myRankXP}>
                      {players[myRank - 1]?.xp || 0} XP
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          )}
        </>
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  /* ── Shell ─────────────────────── */
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: 'Nunito-Bold',
    color: '#FFF',
    marginBottom: 16,
  },

  /* ── Toggle pill ───────────────── */
  toggleBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30,41,59,0.85)',
    borderRadius: 14,
    padding: 3,
  },
  togglePillActive: {
    flex: 1,
    borderRadius: 11,
  },
  togglePillInner: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  togglePillInactive: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 11,
  },
  toggleTextActive: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
  },
  toggleTextInactive: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
    opacity: 0.6,
  },

  /* ── Loading ───────────────────── */
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { flex: 1 },

  /* ── Podium section ────────────── */
  podiumSection: {
    paddingTop: 20,
    paddingBottom: 4,
    marginHorizontal: 12,
    marginBottom: 24,
  },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  podiumColumn: {
    flex: 1,
    alignItems: 'center',
  },

  /* ── Avatar ────────────────────── */
  podiumAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    backgroundColor: COLORS.cardBg,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 14,
    elevation: 14,
  },
  podiumAvatarText: {
    fontFamily: 'Nunito-Bold',
    color: '#FFF',
  },

  /* ── Rank badge ────────────────── */
  rankBadge: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  rankBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: 'Nunito-Bold',
  },

  /* ── Pedestal (solid gradient) ── */
  pedestal: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  pedestalName: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: 'Nunito-Bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  pedestalXpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  pedestalXpText: {
    color: '#FFF',
    fontSize: 13,
    fontFamily: 'Nunito-Bold',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  /* ── Rankings list ─────────────── */
  listSection: {
    paddingHorizontal: 20,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  listTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    color: '#FFF',
  },

  /* ── Player card (glassmorphism) ─ */
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  playerCardMe: {
    backgroundColor: 'rgba(46,204,113,0.12)',
    borderWidth: 1.5,
    borderColor: COLORS.emerald,
  },
  cardRank: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    width: 32,
    textAlign: 'center',
  },
  cardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardAvatarText: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    color: '#FFF',
  },
  cardInfo: { flex: 1 },
  cardName: {
    color: '#FFF',
    fontSize: 15,
    fontFamily: 'Nunito-Bold',
  },
  cardUsername: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    marginTop: 2,
  },
  cardXp: {
    color: COLORS.emerald,
    fontSize: 15,
    fontFamily: 'Nunito-Bold',
  },

  /* ── My-rank bar ───────────────── */
  myRankBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(46,204,113,0.3)',
  },
  myRankGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  myRankContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  myRankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  myRankBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  myRankNumber: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
  },
  myRankLabel: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
  },
  myRankRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  myRankXP: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
  },
});
