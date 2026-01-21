// frontend/app/(tabs)/profile.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '@/constants/config';
import { Fonts } from '@/constants/fonts';
import { AppColors } from '@/constants/colors';

interface UserData {
  full_name: string;
  email: string;
  xp: number;
  streak: number;
  level: number;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // Get stored user data from login
      const userData = await AsyncStorage.getItem('userData');
      const token = await AsyncStorage.getItem('userToken');
      
      if (userData) {
        const parsed = JSON.parse(userData);
        // Calculate level from XP (every 100 XP = 1 level)
        const level = Math.floor((parsed.xp || 0) / 100) + 1;
        setUser({ ...parsed, level, streak: parsed.streak || 0 });
      }
      
      // Optionally fetch fresh data from server
      if (token) {
        try {
          const response = await axios.get(`${API_URL}/user/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.data) {
            const level = Math.floor((response.data.xp || 0) / 100) + 1;
            setUser({ ...response.data, level });
            await AsyncStorage.setItem('userData', JSON.stringify(response.data));
          }
        } catch (err) {
          // Use cached data if server request fails
          console.log('Using cached user data');
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userData');
            router.replace('/login');
          }
        }
      ]
    );
  };

  const getXPProgress = () => {
    if (!user) return 0;
    return (user.xp % 100); // XP towards next level
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}></Text>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.full_name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Lv.{user?.level || 1}</Text>
          </View>
        </View>
        <Text style={styles.userName}>{user?.full_name || 'Guest User'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'Not logged in'}</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Image source={require('../../assets/images/star.png')} style={styles.statIconImage} />
          <Text style={styles.statValue}>{user?.xp || 0}</Text>
          <Text style={styles.statLabel}>Total XP</Text>
        </View>
        <View style={styles.statCard}>
          <Image source={require('../../assets/images/flames.png')} style={styles.statIconImage} />
          <Text style={styles.statValue}>{user?.streak || 0}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Image source={require('../../assets/images/expertise.png')} style={styles.statIconImage} />
          <Text style={styles.statValue}>{user?.level || 1}</Text>
          <Text style={styles.statLabel}>Level</Text>
        </View>
      </View>

      {/* XP Progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Level Progress</Text>
          <Text style={styles.progressText}>{getXPProgress()}/100 XP</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${getXPProgress()}%` }]} />
        </View>
        <Text style={styles.progressHint}>
          {100 - getXPProgress()} XP to Level {(user?.level || 1) + 1}
        </Text>
      </View>

      {/* Menu Items */}
      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/achievements' as any)}>
          <Text style={styles.menuIcon}>🏆</Text>
          <Text style={styles.menuText}>Achievements</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/learning-stats' as any)}>
          <Text style={styles.menuIcon}>📊</Text>
          <Text style={styles.menuText}>Learning Stats</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/settings' as any)}>
          <Text style={styles.menuIcon}>⚙️</Text>
          <Text style={styles.menuText}>Settings</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/feedback' as any)}>
          <Text style={styles.menuIcon}>💬</Text>
          <Text style={styles.menuText}>Send Feedback</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>

      {/* App Version */}
      <Text style={styles.versionText}>Sign-Lingo v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.background,
  },
  loadingText: {
    fontSize: 16,
    ...Fonts.regular,
    color: AppColors.textSecondary,
  },
  header: {
    backgroundColor: AppColors.primary,
    paddingTop: 60,
    paddingBottom: 80,
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 28,
    ...Fonts.appName,
    color: AppColors.textWhite,
  },
  profileCard: {
    backgroundColor: AppColors.cardBackground,
    marginHorizontal: 20,
    marginTop: -50,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    ...Fonts.appName,
    color: AppColors.textWhite,
  },
  levelBadge: {
    position: 'absolute',
    bottom: 0,
    right: -5,
    backgroundColor: AppColors.level,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: AppColors.cardBackground,
  },
  levelText: {
    color: AppColors.textWhite,
    ...Fonts.regular,
    fontSize: 12,
  },
  userName: {
    fontSize: 24,
    ...Fonts.appName,
    color: AppColors.textPrimary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    ...Fonts.regular,
    color: AppColors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  statCard: {
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
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statIconImage: {
    width: 32,
    height: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    ...Fonts.appName,
    color: AppColors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    ...Fonts.regular,
    color: AppColors.textSecondary,
    marginTop: 4,
  },
  progressSection: {
    backgroundColor: AppColors.cardBackground,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    ...Fonts.regular,
    color: AppColors.textPrimary,
  },
  progressText: {
    fontSize: 14,
    color: AppColors.primary,
    ...Fonts.appName,
  },
  progressBar: {
    height: 12,
    backgroundColor: AppColors.primaryLight,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: AppColors.primary,
    borderRadius: 6,
  },
  progressHint: {
    fontSize: 12,
    ...Fonts.regular,
    color: AppColors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  menuSection: {
    backgroundColor: AppColors.cardBackground,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.primaryLight,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 16,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    ...Fonts.regular,
    color: AppColors.textPrimary,
  },
  menuArrow: {
    fontSize: 20,
    color: AppColors.textMuted,
  },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: '#FEE2E2',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    ...Fonts.appName,
    color: AppColors.error,
  },
  versionText: {
    textAlign: 'center',
    color: AppColors.textMuted,
    fontSize: 12,
    ...Fonts.regular,
    marginTop: 20,
  },
});
