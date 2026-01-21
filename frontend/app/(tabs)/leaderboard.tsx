// frontend/app/(tabs)/leaderboard.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '@/constants/config';
import { Fonts } from '@/constants/fonts';
import { AppColors } from '@/constants/colors';

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
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      // Use mock data if API fails
      setPlayers([
        { _id: '1', full_name: 'Player1', email: 'player1@test.com', xp: 0 },
        { _id: '2', full_name: 'Player2', email: 'player2@test.com', xp: 0 },
        { _id: '3', full_name: 'Player3', email: 'player3@test.com', xp: 0 },
        { _id: '4', full_name: 'Player4', email: 'player4@test.com', xp: 0 },
        { _id: '5', full_name: 'Player5', email: 'player5@test.com', xp: 0 },
        { _id: '6', full_name: 'Player6', email: 'player6@test.com', xp: 0 },
        { _id: '7', full_name: 'Player7', email: 'player7@test.com', xp: 0 },
        { _id: '8', full_name: 'Player8', email: 'player8@test.com', xp: 0 },
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

  // Avatar colors based on rank
  const avatarColors = ['#2ECC71', '#CD7F32', '#E8A87C'];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Text style={styles.shareIcon}>⤴</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'week' && styles.tabActive]}
          onPress={() => setActiveTab('week')}
        >
          <Text style={[styles.tabText, activeTab === 'week' && styles.tabTextActive]}>
            This Week
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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2ECC71" />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Podium Section */}
          <View style={styles.podiumSection}>
            {/* Second Place */}
            <View style={styles.podiumPlace}>
              <Text style={styles.xpText}>{topThree[1]?.xp || 0} XP</Text>
              <View style={[styles.avatarContainer, styles.avatar2nd]}>
                <View style={[styles.avatarCircle, { borderColor: '#CD7F32' }]}>
                  <Text style={styles.avatarEmoji}>👤</Text>
                </View>
                <View style={[styles.rankBadge, styles.rank2nd]}>
                  <Text style={styles.rankNumber}>2</Text>
                </View>
              </View>
              <Text style={styles.playerName}>{topThree[1]?.full_name || 'Player2'}</Text>
              <Text style={styles.playerUsername}>{getUsername(topThree[1] || { full_name: 'Player2' } as Player)}</Text>
            </View>

            {/* First Place */}
            <View style={[styles.podiumPlace, styles.firstPlace]}>
              <Text style={[styles.xpText, styles.xpFirst]}>{topThree[0]?.xp || 0} XP</Text>
              <View style={[styles.avatarContainer, styles.avatar1st]}>
                <View style={[styles.avatarCircle, styles.avatarFirst, { borderColor: '#2ECC71' }]}>
                  <Text style={[styles.avatarEmoji, styles.avatarEmojiFirst]}>👤</Text>
                </View>
                <View style={[styles.rankBadge, styles.rank1st]}>
                  <Text style={styles.rankNumber}>1</Text>
                </View>
              </View>
              <View style={styles.pedestal}>
                <Image source={require('../../assets/images/medal.png')} style={styles.trophyIconImage} />
              </View>
              <Text style={[styles.playerName, styles.nameFirst]}>{topThree[0]?.full_name || 'Player1'}</Text>
              <Text style={styles.topLearnerBadge}>Top Learner</Text>
            </View>

            {/* Third Place */}
            <View style={styles.podiumPlace}>
              <Text style={styles.xpText}>{topThree[2]?.xp || 0} XP</Text>
              <View style={[styles.avatarContainer, styles.avatar3rd]}>
                <View style={[styles.avatarCircle, { borderColor: '#E8A87C' }]}>
                  <Text style={styles.avatarEmoji}>👤</Text>
                </View>
                <View style={[styles.rankBadge, styles.rank3rd]}>
                  <Text style={styles.rankNumber}>3</Text>
                </View>
              </View>
              <Text style={styles.playerName}>{topThree[2]?.full_name || 'Player3'}</Text>
              <Text style={styles.playerUsername}>{getUsername(topThree[2] || { full_name: 'Player3' } as Player)}</Text>
            </View>
          </View>

          {/* Player List */}
          <View style={styles.playerList}>
            {restPlayers.map((player, index) => (
              <View 
                key={player._id} 
                style={[
                  styles.playerCard,
                  currentUserId === player._id && styles.playerCardHighlight
                ]}
              >
                <Text style={styles.playerRank}>{index + 4}</Text>
                <View style={styles.playerAvatarSmall}>
                  <Text style={styles.avatarEmojiSmall}>👤</Text>
                </View>
                <View style={styles.playerInfo}>
                  <Text style={styles.playerNameSmall}>{player.full_name}</Text>
                  <Text style={styles.playerUsernameSmall}>{getUsername(player)}</Text>
                </View>
                <Text style={styles.playerXP}>{player.xp} XP</Text>
              </View>
            ))}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      )}
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: AppColors.cardBackground,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: AppColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: AppColors.textPrimary,
  },
  headerTitle: {
    fontSize: 20,
    ...Fonts.appName,
    color: AppColors.textPrimary,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: AppColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareIcon: {
    fontSize: 18,
    color: AppColors.textPrimary,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginVertical: 16,
    backgroundColor: AppColors.primaryLight,
    borderRadius: 25,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 22,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: AppColors.primary,
  },
  tabText: {
    fontSize: 14,
    ...Fonts.regular,
    color: AppColors.textSecondary,
  },
  tabTextActive: {
    color: AppColors.textWhite,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  podiumSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  podiumPlace: {
    alignItems: 'center',
    width: 100,
  },
  firstPlace: {
    marginBottom: 20,
  },
  xpText: {
    fontSize: 14,
    ...Fonts.appName,
    color: AppColors.primary,
    marginBottom: 8,
  },
  xpFirst: {
    fontSize: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar1st: {},
  avatar2nd: {},
  avatar3rd: {},
  avatarCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: AppColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  avatarFirst: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
  },
  avatarEmoji: {
    fontSize: 30,
  },
  avatarEmojiFirst: {
    fontSize: 40,
  },
  rankBadge: {
    position: 'absolute',
    bottom: -5,
    left: '50%',
    marginLeft: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: AppColors.cardBackground,
  },
  rank1st: {
    backgroundColor: AppColors.primary,
  },
  rank2nd: {
    backgroundColor: '#CD7F32',
  },
  rank3rd: {
    backgroundColor: '#E8A87C',
  },
  rankNumber: {
    color: AppColors.textWhite,
    ...Fonts.appName,
    fontSize: 14,
  },
  pedestal: {
    backgroundColor: AppColors.primaryLight,
    width: 80,
    height: 60,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
  },
  trophyIcon: {
    fontSize: 28,
  },
  trophyIconImage: {
    width: 32,
    height: 32,
  },
  playerName: {
    fontSize: 14,
    ...Fonts.regular,
    color: AppColors.textPrimary,
    marginTop: 4,
  },
  nameFirst: {
    fontSize: 16,
  },
  playerUsername: {
    fontSize: 12,
    color: AppColors.textMuted,
  },
  topLearnerBadge: {
    fontSize: 12,
    color: AppColors.primary,
    ...Fonts.appName,
    marginTop: 2,
  },
  playerList: {
    paddingHorizontal: 20,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.cardBackground,
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  playerCardHighlight: {
    backgroundColor: AppColors.primaryLight,
    borderWidth: 2,
    borderColor: AppColors.primary,
  },
  playerRank: {
    fontSize: 16,
    ...Fonts.appName,
    color: AppColors.textMuted,
    width: 30,
  },
  playerAvatarSmall: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: AppColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarEmojiSmall: {
    fontSize: 24,
  },
  playerInfo: {
    flex: 1,
  },
  playerNameSmall: {
    fontSize: 16,
    ...Fonts.regular,
    color: AppColors.textPrimary,
  },
  playerUsernameSmall: {
    fontSize: 13,
    color: AppColors.textMuted,
  },
  playerXP: {
    fontSize: 16,
    ...Fonts.appName,
    color: AppColors.primary,
  },
});
