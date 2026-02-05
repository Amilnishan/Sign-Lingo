// frontend/app/(tabs)/leaderboard.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '@/constants/config';
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
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
};

interface Player {
  _id: string;
  full_name: string;
  email: string;
  xp: number;
  avatar?: string;
}

export default function LeaderboardScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'week' | 'allTime'>('week');
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [myRank, setMyRank] = useState<number | null>(null);

  useEffect(() => {
    loadCurrentUser();
    fetchLeaderboard();
  }, [activeTab]);

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
      const response = await axios.get(`${API_URL}/leaderboard?period=${activeTab}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      if (response.data && response.data.players) {
        setPlayers(response.data.players);
        const rank = response.data.players.findIndex((p: Player) => p._id === currentUserId || p.email === currentUserId);
        setMyRank(rank >= 0 ? rank + 1 : null);
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

  const getUsername = (player: Player) => {
    return '@' + (player.full_name?.toLowerCase().replace(/\s+/g, '') || 'player');
  };

  const topThree = players.slice(0, 3);
  const restPlayers = players.slice(3);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <View style={styles.tabSwitcher}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'week' && styles.tabActive]}
            onPress={() => setActiveTab('week')}
          >
            <Text style={[styles.tabText, activeTab === 'week' && styles.tabTextActive]}>
              Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'allTime' && styles.tabActive]}
            onPress={() => setActiveTab('allTime')}
          >
            <Text style={[styles.tabText, activeTab === 'allTime' && styles.tabTextActive]}>
              All Time
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.emerald} />
        </View>
      ) : (
        <>
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Podium Section with Stage */}
            <LinearGradient
              colors={['rgba(46, 204, 113, 0.1)', 'transparent']}
              style={styles.podiumStage}
            >
              <View style={styles.podiumContainer}>
                {/* Second Place */}
                <View style={styles.podiumPlayer}>
                  <View style={[styles.podiumAvatar, styles.avatar2nd]}>
                    <Text style={styles.podiumAvatarText}>
                      {topThree[1]?.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View style={styles.rankBadge2nd}>
                    <Text style={styles.rankNumber}>2</Text>
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>
                    {topThree[1]?.full_name || 'Player 2'}
                  </Text>
                  <View style={styles.xpPill}>
                    <Ionicons name="flash" size={12} color={COLORS.silver} />
                    <Text style={[styles.xpPillText, { color: COLORS.silver }]}>
                      {topThree[1]?.xp || 0}
                    </Text>
                  </View>
                  <View style={[styles.pedestal, styles.pedestal2nd]} />
                </View>

                {/* First Place - Winner */}
                <View style={[styles.podiumPlayer, styles.podiumWinner]}>
                  <View style={styles.crownContainer}>
                      <Ionicons name="trophy" size={32} color={COLORS.gold} />
                    </View>
                  <View style={[styles.podiumAvatar, styles.avatar1st]}>
                    <Text style={[styles.podiumAvatarText, styles.winnerAvatarText]}>
                      {topThree[0]?.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View style={styles.rankBadge1st}>
                    <Text style={styles.rankNumber}>1</Text>
                  </View>
                  <Text style={[styles.podiumName, styles.winnerName]} numberOfLines={1}>
                    {topThree[0]?.full_name || 'Player 1'}
                  </Text>
                  <View style={[styles.xpPill, styles.winnerXPPill]}>
                    <Ionicons name="flash" size={14} color={COLORS.gold} />
                    <Text style={[styles.xpPillText, { color: COLORS.gold, fontSize: 16 }]}>
                      {topThree[0]?.xp || 0}
                    </Text>
                  </View>
                  <View style={[styles.pedestal, styles.pedestal1st]} />
                </View>

                {/* Third Place */}
                <View style={styles.podiumPlayer}>
                  <View style={[styles.podiumAvatar, styles.avatar3rd]}>
                    <Text style={styles.podiumAvatarText}>
                      {topThree[2]?.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View style={styles.rankBadge3rd}>
                    <Text style={styles.rankNumber}>3</Text>
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>
                    {topThree[2]?.full_name || 'Player 3'}
                  </Text>
                  <View style={styles.xpPill}>
                    <Ionicons name="flash" size={12} color={COLORS.bronze} />
                    <Text style={[styles.xpPillText, { color: COLORS.bronze }]}>
                      {topThree[2]?.xp || 0}
                    </Text>
                  </View>
                  <View style={[styles.pedestal, styles.pedestal3rd]} />
                </View>
              </View>
            </LinearGradient>

            {/* Scrollable List (Ranks 4+) */}
            <View style={styles.listSection}>
              <Text style={styles.listTitle}>Rankings</Text>
              {restPlayers.map((player, index) => {
                const rank = index + 4;
                const isMe = player._id === currentUserId || player.email === currentUserId;
                return (
                  <View 
                    key={player._id} 
                    style={[
                      styles.playerRow,
                      isMe && styles.playerRowHighlight
                    ]}
                  >
                    <Text style={styles.rankText}>{rank}</Text>
                    <View style={styles.playerAvatar}>
                      <Text style={styles.playerAvatarText}>
                        {player.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </Text>
                    </View>
                    <View style={styles.playerDetails}>
                      <Text style={styles.playerName}>{player.full_name}</Text>
                      <Text style={styles.playerUsername}>{getUsername(player)}</Text>
                    </View>
                    <Text style={styles.playerXP}>{player.xp}</Text>
                  </View>
                );
              })}
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Fixed "My Ranking" Bar at Bottom */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: 'Nunito-Bold',
    color: '#FFF',
    marginBottom: 16,
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: COLORS.emerald,
  },
  tabText: {
    color: '#94A3B8',
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
  },
  tabTextActive: {
    color: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  podiumStage: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(46, 204, 113, 0.2)',
  },
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  podiumPlayer: {
    flex: 1,
    alignItems: 'center',
  },
  podiumWinner: {
    marginHorizontal: 8,
  },
  crownContainer: {
    position: 'absolute',
    top: -10,
    zIndex: 10,
  },
  podiumAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    backgroundColor: COLORS.cardBg,
  },
  avatar1st: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderColor: COLORS.gold,
    borderWidth: 4,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 12,
  },
  avatar2nd: {
    borderColor: COLORS.silver,
  },
  avatar3rd: {
    borderColor: COLORS.bronze,
  },
  podiumAvatarText: {
    fontSize: 28,
    fontFamily: 'Nunito-Bold',
    color: '#FFF',
  },
  winnerAvatarText: {
    fontSize: 40,
  },
  rankBadge1st: {
    position: 'absolute',
    bottom: 48,
    right: 0,
    backgroundColor: COLORS.gold,
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  rankBadge2nd: {
    position: 'absolute',
    bottom: 48,
    right: 4,
    backgroundColor: COLORS.silver,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  rankBadge3rd: {
    position: 'absolute',
    bottom: 48,
    right: 4,
    backgroundColor: COLORS.bronze,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  rankNumber: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: 'Nunito-Bold',
  },
  pedestal: {
    marginTop: 12,
    borderRadius: 8,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  pedestal1st: {
    width: 70,
    height: 70,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  pedestal2nd: {
    width: 60,
    height: 50,
    backgroundColor: 'rgba(192, 192, 192, 0.15)',
    borderWidth: 2,
    borderColor: COLORS.silver,
  },
  pedestal3rd: {
    width: 60,
    height: 40,
    backgroundColor: 'rgba(205, 127, 50, 0.15)',
    borderWidth: 2,
    borderColor: COLORS.bronze,
  },
  podiumName: {
    color: '#FFF',
    fontSize: 13,
    fontFamily: 'Nunito-Bold',
    marginTop: 10,
    textAlign: 'center',
  },
  winnerName: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
  },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  winnerXPPill: {
    marginTop: 8,
  },
  xpPillText: {
    fontSize: 13,
    fontFamily: 'Nunito-Bold',
  },
  listSection: {
    paddingHorizontal: 20,
  },
  listTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    color: '#FFF',
    marginBottom: 12,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  playerRowHighlight: {
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    borderColor: COLORS.emerald,
    borderWidth: 2,
  },
  rankText: {
    color: '#94A3B8',
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    width: 32,
  },
  playerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.cardBg,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playerAvatarText: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    color: '#FFF',
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    color: '#FFF',
    fontSize: 15,
    fontFamily: 'Nunito-Bold',
  },
  playerUsername: {
    color: '#94A3B8',
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    marginTop: 2,
  },
  playerXP: {
    color: COLORS.emerald,
    fontSize: 15,
    fontFamily: 'Nunito-Bold',
  },
  myRankBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(46, 204, 113, 0.3)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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