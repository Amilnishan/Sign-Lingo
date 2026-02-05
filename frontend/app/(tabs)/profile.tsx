// frontend/app/(tabs)/profile.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '@/constants/config';
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
  emeraldDark: '#27AE60',
  teal: '#14B8A6',
  orange: '#F97316',
  blue: '#3B82F6',
  purple: '#8B5CF6',
  red: '#EF4444',
  gold: '#FFD700',
};

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
  
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const token = await AsyncStorage.getItem('userToken');
      
      if (userData) {
        const parsed = JSON.parse(userData);
        const level = Math.floor((parsed.xp || 0) / 100) + 1;
        setUser({ ...parsed, level, streak: parsed.streak || 0 });
      }
      
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
    showAlert(
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
      ],
      'warning'
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section with Gradient */}
        <LinearGradient
          colors={[COLORS.emerald, COLORS.teal]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroSection}
        >
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarGlow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.full_name?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
            </View>
          </View>
          <Text style={styles.userName}>{user?.full_name || 'Guest User'}</Text>
          <View style={styles.levelBadge}>
            <Ionicons name="trophy" size={14} color={COLORS.gold} />
            <Text style={styles.levelText}>Level {user?.level || 1}</Text>
          </View>
        </LinearGradient>

        {/* Stats HUD - Floating Glass Container */}
        <View style={styles.statsHUD}>
          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(46, 204, 113, 0.2)' }]}>
              <Ionicons name="flash" size={24} color={COLORS.emerald} />
            </View>
            <Text style={styles.statValue}>{user?.xp || 0}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(249, 115, 22, 0.2)' }]}>
              <Ionicons name="flame" size={24} color={COLORS.orange} />
            </View>
            <Text style={styles.statValue}>{user?.streak || 0}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 215, 0, 0.2)' }]}>
              <Ionicons name="medal" size={24} color={COLORS.gold} />
            </View>
            <Text style={styles.statValue}>Gold</Text>
            <Text style={styles.statLabel}>League</Text>
          </View>
        </View>

        {/* Group 1: Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <View style={styles.glassCard}>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/settings' as any)}>
              <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                <Ionicons name="person-outline" size={20} color={COLORS.blue} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Edit Profile</Text>
                <Text style={styles.menuSubtitle}>Update your information</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
            
            <View style={styles.menuDivider} />
            
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/settings' as any)}>
              <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
                <Ionicons name="lock-closed-outline" size={20} color={COLORS.purple} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Change Password</Text>
                <Text style={styles.menuSubtitle}>Update your password</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Group 2: App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>APP SETTINGS</Text>
          <View style={styles.glassCard}>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/settings' as any)}>
              <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(46, 204, 113, 0.2)' }]}>
                <Ionicons name="notifications-outline" size={20} color={COLORS.emerald} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Notifications</Text>
                <Text style={styles.menuSubtitle}>Manage alerts</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
            
            <View style={styles.menuDivider} />
            
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/settings' as any)}>
              <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(249, 115, 22, 0.2)' }]}>
                <Ionicons name="volume-high-outline" size={20} color={COLORS.orange} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Sound & Haptics</Text>
                <Text style={styles.menuSubtitle}>Audio preferences</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Group 3: Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUPPORT</Text>
          <View style={styles.glassCard}>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/achievements' as any)}>
              <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(255, 215, 0, 0.2)' }]}>
                <Ionicons name="trophy-outline" size={20} color={COLORS.gold} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Achievements</Text>
                <Text style={styles.menuSubtitle}>View your badges</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
            
            <View style={styles.menuDivider} />
            
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/learning-stats' as any)}>
              <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                <Ionicons name="bar-chart-outline" size={20} color={COLORS.blue} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Learning Stats</Text>
                <Text style={styles.menuSubtitle}>Track your progress</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
            
            <View style={styles.menuDivider} />
            
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/feedback' as any)}>
              <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
                <Ionicons name="chatbubble-outline" size={20} color={COLORS.purple} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Send Feedback</Text>
                <Text style={styles.menuSubtitle}>Help us improve</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button - Sleek Outline */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.red} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.versionText}>Sign-Lingo v1.0.0</Text>
        
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
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  // Hero Section
  heroSection: {
    paddingTop: 60,
    paddingBottom: 80,
    alignItems: 'center',
  },
  avatarWrapper: {
    marginBottom: 16,
  },
  avatarGlow: {
    padding: 6,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontFamily: 'Nunito-Bold',
    color: COLORS.emerald,
  },
  userName: {
    fontSize: 28,
    fontFamily: 'Nunito-Bold',
    color: '#FFF',
    marginBottom: 8,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  levelText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
  },
  // Stats HUD
  statsHUD: {
    flexDirection: 'row',
    backgroundColor: `${COLORS.cardBg}E6`,
    marginHorizontal: 20,
    marginTop: -50,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: COLORS.emerald,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Nunito-Bold',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Nunito-Bold',
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.cardBorder,
    marginHorizontal: 8,
  },
  // Sections
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Nunito-Bold',
    color: COLORS.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  glassCard: {
    backgroundColor: `${COLORS.cardBg}E6`,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: COLORS.textPrimary,
  },
  menuSubtitle: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginLeft: 68,
  },
  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 32,
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.red,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: COLORS.red,
  },
  versionText: {
    textAlign: 'center',
    fontFamily: 'Nunito-Regular',
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 24,
  },
});
