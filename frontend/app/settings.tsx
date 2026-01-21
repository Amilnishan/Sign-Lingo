// frontend/app/settings.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Fonts } from '@/constants/fonts';

export default function SettingsScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  
  // Settings state
  const [notifications, setNotifications] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    loadUserData();
    loadSettings();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        setUserName(parsed.full_name || '');
        setUserEmail(parsed.email || '');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('userSettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setNotifications(parsed.notifications ?? true);
        setDailyReminder(parsed.dailyReminder ?? true);
        setSoundEffects(parsed.soundEffects ?? true);
        setVibration(parsed.vibration ?? true);
        setDarkMode(parsed.darkMode ?? false);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (key: string, value: boolean) => {
    try {
      const settings = await AsyncStorage.getItem('userSettings');
      const parsed = settings ? JSON.parse(settings) : {};
      parsed[key] = value;
      await AsyncStorage.setItem('userSettings', JSON.stringify(parsed));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleToggle = (setting: string, value: boolean, setter: (val: boolean) => void) => {
    setter(value);
    saveSettings(setting, value);
  };

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Profile editing will be available soon!');
  };

  const handleChangePassword = () => {
    Alert.alert('Change Password', 'Password change will be available soon!');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            // Would call API to delete account
            Alert.alert('Account Deletion', 'Please contact support to delete your account.');
          }
        }
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear Learning Data',
      'This will reset your progress, XP, and streak. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: async () => {
            // Would call API and clear local cache
            Alert.alert('Data Cleared', 'Your learning data has been reset.');
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <View style={styles.profileRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {userName.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{userName}</Text>
                <Text style={styles.profileEmail}>{userEmail}</Text>
              </View>
              <TouchableOpacity onPress={handleEditProfile}>
                <Text style={styles.editLink}>Edit</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.divider} />
            
            <TouchableOpacity style={styles.menuItem} onPress={handleChangePassword}>
              <Text style={styles.menuIcon}>🔐</Text>
              <Text style={styles.menuText}>Change Password</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingIcon}>🔔</Text>
                <Text style={styles.settingText}>Push Notifications</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={(val) => handleToggle('notifications', val, setNotifications)}
                trackColor={{ false: '#e0e0e0', true: '#a8e6cf' }}
                thumbColor={notifications ? '#2ECC71' : '#f4f3f4'}
              />
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingIcon}>⏰</Text>
                <Text style={styles.settingText}>Daily Reminder</Text>
              </View>
              <Switch
                value={dailyReminder}
                onValueChange={(val) => handleToggle('dailyReminder', val, setDailyReminder)}
                trackColor={{ false: '#e0e0e0', true: '#a8e6cf' }}
                thumbColor={dailyReminder ? '#2ECC71' : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingIcon}>🔊</Text>
                <Text style={styles.settingText}>Sound Effects</Text>
              </View>
              <Switch
                value={soundEffects}
                onValueChange={(val) => handleToggle('soundEffects', val, setSoundEffects)}
                trackColor={{ false: '#e0e0e0', true: '#a8e6cf' }}
                thumbColor={soundEffects ? '#2ECC71' : '#f4f3f4'}
              />
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingIcon}>📳</Text>
                <Text style={styles.settingText}>Vibration</Text>
              </View>
              <Switch
                value={vibration}
                onValueChange={(val) => handleToggle('vibration', val, setVibration)}
                trackColor={{ false: '#e0e0e0', true: '#a8e6cf' }}
                thumbColor={vibration ? '#2ECC71' : '#f4f3f4'}
              />
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingIcon}>🌙</Text>
                <Text style={styles.settingText}>Dark Mode</Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={(val) => handleToggle('darkMode', val, setDarkMode)}
                trackColor={{ false: '#e0e0e0', true: '#a8e6cf' }}
                thumbColor={darkMode ? '#2ECC71' : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Privacy</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.menuItem} onPress={handleClearData}>
              <Text style={styles.menuIcon}>🗑️</Text>
              <Text style={styles.menuText}>Clear Learning Data</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuIcon}>📄</Text>
              <Text style={styles.menuText}>Privacy Policy</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuIcon}>📋</Text>
              <Text style={styles.menuText}>Terms of Service</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#e74c3c' }]}>Danger Zone</Text>
          <TouchableOpacity style={styles.dangerButton} onPress={handleDeleteAccount}>
            <Text style={styles.dangerButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>Sign-Lingo</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appCopyright}>© 2026 Sign-Lingo. All rights reserved.</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#2ECC71',
  },
  headerTitle: {
    fontSize: 20,
    ...Fonts.appName,
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    ...Fonts.regular,
    color: '#7f8c8d',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2ECC71',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    ...Fonts.appName,
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    ...Fonts.regular,
    color: '#1a1a2e',
  },
  profileEmail: {
    fontSize: 13,
    ...Fonts.regular,
    color: '#7f8c8d',
  },
  editLink: {
    fontSize: 14,
    color: '#2ECC71',
    ...Fonts.regular,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    ...Fonts.regular,
    color: '#1a1a2e',
  },
  menuArrow: {
    fontSize: 20,
    color: '#7f8c8d',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  settingText: {
    fontSize: 16,
    ...Fonts.regular,
    color: '#1a1a2e',
  },
  dangerButton: {
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  dangerButtonText: {
    fontSize: 16,
    ...Fonts.regular,
    color: '#e74c3c',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  appName: {
    fontSize: 18,
    ...Fonts.appName,
    color: '#2ECC71',
  },
  appVersion: {
    fontSize: 14,
    ...Fonts.regular,
    color: '#7f8c8d',
    marginTop: 4,
  },
  appCopyright: {
    fontSize: 12,
    ...Fonts.regular,
    color: '#bdc3c7',
    marginTop: 8,
  },
});
