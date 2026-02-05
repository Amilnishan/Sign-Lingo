// frontend/app/settings.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '@/constants/fonts';
import { CustomAlert, useCustomAlert } from '@/components/custom-alert';
import { API_URL } from '@/constants/config';
import CustomSwitch from '@/components/custom-switch';

const { width } = Dimensions.get('window');

// Modern Glow Design System
const COLORS = {
  background: '#0F172A',
  cardBackground: '#1E293B',
  border: '#334155',
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  emerald: '#2ECC71',
  emeraldLight: 'rgba(46, 204, 113, 0.15)',
  gold: '#FFD700',
  goldLight: 'rgba(255, 215, 0, 0.15)',
  blue: '#3B82F6',
  blueLight: 'rgba(59, 130, 246, 0.15)',
  purple: '#8B5CF6',
  purpleLight: 'rgba(139, 92, 246, 0.15)',
  red: '#EF4444',
  redLight: 'rgba(239, 68, 68, 0.15)',
  orange: '#F97316',
  orangeLight: 'rgba(249, 115, 22, 0.15)',
};

// Reusable SettingItem Component
interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBgColor: string;
  title: string;
  subtitle?: string;
  isToggle?: boolean;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  onPress?: () => void;
  showArrow?: boolean;
  rightText?: string;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  iconColor,
  iconBgColor,
  title,
  subtitle,
  isToggle = false,
  value = false,
  onValueChange,
  onPress,
  showArrow = false,
  rightText,
}) => {
  const content = (
    <View style={styles.settingItem}>
      <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.settingTextContainer}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {isToggle ? (
        <CustomSwitch
          value={value}
          onValueChange={onValueChange}
          activeColor={COLORS.emerald}
          inactiveColor="#3A3A3A"
        />
      ) : showArrow ? (
        <View style={styles.arrowContainer}>
          {rightText && <Text style={styles.rightText}>{rightText}</Text>}
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </View>
      ) : null}
    </View>
  );

  if (onPress && !isToggle) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

// Section Header Component
const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

// Card Component
const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={styles.card}>{children}</View>
);

// Divider Component
const Divider: React.FC = () => <View style={styles.divider} />;

export default function SettingsScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  // Settings state
  const [pushNotifications, setPushNotifications] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [haptics, setHaptics] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  // Edit Profile Modal state
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editNameError, setEditNameError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Change Password Modal state
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Custom alert hook
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();

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
        setPushNotifications(parsed.pushNotifications ?? true);
        setDailyReminder(parsed.dailyReminder ?? true);
        setSoundEffects(parsed.soundEffects ?? true);
        setHaptics(parsed.haptics ?? true);
        setDarkMode(parsed.darkMode ?? true);
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

  const handleToggle = (key: string, value: boolean, setter: (val: boolean) => void) => {
    setter(value);
    saveSettings(key, value);
  };

  const handleEditProfile = () => {
    setEditName(userName);
    setEditNameError('');
    setEditProfileVisible(true);
  };

  const handleSaveProfile = async () => {
    const namePattern = /^[A-Za-z\s]{3,}$/;
    if (!editName.trim()) {
      setEditNameError('Name is required');
      return;
    }
    if (!namePattern.test(editName)) {
      setEditNameError('Name must be at least 3 letters (alphabets only)');
      return;
    }

    setEditLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.put(
        `${API_URL}/user/profile`,
        { full_name: editName.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const parsed = JSON.parse(userData);
          parsed.full_name = editName.trim();
          await AsyncStorage.setItem('userData', JSON.stringify(parsed));
        }
        setUserName(editName.trim());
        setEditProfileVisible(false);
        showAlert('Success', 'Profile updated successfully!', [{ text: 'OK' }], 'success');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showAlert('Error', 'Failed to update profile. Please try again.', [{ text: 'OK' }], 'error');
    } finally {
      setEditLoading(false);
    }
  };

  const handleChangePassword = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setCurrentPasswordError('');
    setNewPasswordError('');
    setConfirmPasswordError('');
    setChangePasswordVisible(true);
  };

  const validatePassword = (password: string): boolean => {
    if (password.length < 8) return false;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[@#$%^&*!]/.test(password);
    return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
  };

  const handleSavePassword = async () => {
    setCurrentPasswordError('');
    setNewPasswordError('');
    setConfirmPasswordError('');

    let hasError = false;

    if (!currentPassword) {
      setCurrentPasswordError('Current password is required');
      hasError = true;
    }

    if (!newPassword) {
      setNewPasswordError('New password is required');
      hasError = true;
    } else if (!validatePassword(newPassword)) {
      setNewPasswordError('Min 8 chars with uppercase, lowercase, number & special char');
      hasError = true;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      hasError = true;
    } else if (newPassword !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      hasError = true;
    }

    if (hasError) return;

    setPasswordLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.put(
        `${API_URL}/user/change-password`,
        {
          current_password: currentPassword,
          new_password: newPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        setChangePasswordVisible(false);
        showAlert('Success', 'Password changed successfully!', [{ text: 'OK' }], 'success');
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      const message = error.response?.data?.message || 'Failed to change password';
      if (message.includes('incorrect') || message.includes('wrong')) {
        setCurrentPasswordError('Current password is incorrect');
      } else {
        showAlert('Error', message, [{ text: 'OK' }], 'error');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = () => {
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
          },
        },
      ],
      'warning'
    );
  };

  const handleDeleteAccount = () => {
    showAlert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            showAlert('Account Deletion', 'Please contact support to delete your account.', [{ text: 'OK' }], 'info');
          },
        },
      ],
      'warning'
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Section */}
        <SectionHeader title="ACCOUNT" />
        <Card>
          {/* Profile Row */}
          <TouchableOpacity style={styles.profileRow} onPress={handleEditProfile} activeOpacity={0.7}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase() || '?'}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{userName || 'User'}</Text>
              <Text style={styles.profileEmail}>{userEmail || 'email@example.com'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <Divider />

          <SettingItem
            icon="key-outline"
            iconColor={COLORS.gold}
            iconBgColor={COLORS.goldLight}
            title="Change Password"
            subtitle="Update your password"
            onPress={handleChangePassword}
            showArrow
          />
        </Card>

        {/* Notifications Section */}
        <SectionHeader title="NOTIFICATIONS" />
        <Card>
          <SettingItem
            icon="notifications-outline"
            iconColor={COLORS.emerald}
            iconBgColor={COLORS.emeraldLight}
            title="Push Notifications"
            subtitle="Receive push notifications"
            isToggle
            value={pushNotifications}
            onValueChange={(val) => handleToggle('pushNotifications', val, setPushNotifications)}
          />

          <Divider />

          <SettingItem
            icon="alarm-outline"
            iconColor={COLORS.blue}
            iconBgColor={COLORS.blueLight}
            title="Daily Reminder"
            subtitle="Get reminded to practice"
            isToggle
            value={dailyReminder}
            onValueChange={(val) => handleToggle('dailyReminder', val, setDailyReminder)}
          />
        </Card>

        {/* Preferences Section */}
        <SectionHeader title="PREFERENCES" />
        <Card>
          <SettingItem
            icon="volume-high-outline"
            iconColor={COLORS.purple}
            iconBgColor={COLORS.purpleLight}
            title="Sound Effects"
            subtitle="Play sounds for interactions"
            isToggle
            value={soundEffects}
            onValueChange={(val) => handleToggle('soundEffects', val, setSoundEffects)}
          />

          <Divider />

          <SettingItem
            icon="phone-portrait-outline"
            iconColor={COLORS.orange}
            iconBgColor={COLORS.orangeLight}
            title="Haptics"
            subtitle="Vibration feedback"
            isToggle
            value={haptics}
            onValueChange={(val) => handleToggle('haptics', val, setHaptics)}
          />

          <Divider />

          <SettingItem
            icon="moon-outline"
            iconColor={COLORS.blue}
            iconBgColor={COLORS.blueLight}
            title="Dark Mode"
            subtitle="Use dark theme"
            isToggle
            value={darkMode}
            onValueChange={(val) => handleToggle('darkMode', val, setDarkMode)}
          />
        </Card>

        {/* Support Section */}
        <SectionHeader title="SUPPORT" />
        <Card>
          <SettingItem
            icon="help-circle-outline"
            iconColor={COLORS.emerald}
            iconBgColor={COLORS.emeraldLight}
            title="Help Center"
            subtitle="Get help and support"
            onPress={() => router.push('/feedback' as any)}
            showArrow
          />

          <Divider />

          <SettingItem
            icon="document-text-outline"
            iconColor={COLORS.textSecondary}
            iconBgColor="rgba(139, 148, 158, 0.15)"
            title="Privacy Policy"
            onPress={() => {}}
            showArrow
          />

          <Divider />

          <SettingItem
            icon="shield-checkmark-outline"
            iconColor={COLORS.textSecondary}
            iconBgColor="rgba(139, 148, 158, 0.15)"
            title="Terms of Service"
            onPress={() => {}}
            showArrow
          />
        </Card>

        {/* Danger Zone */}
        <SectionHeader title="DANGER ZONE" />
        <Card>
          <SettingItem
            icon="trash-outline"
            iconColor={COLORS.red}
            iconBgColor={COLORS.redLight}
            title="Delete Account"
            subtitle="Permanently delete your account"
            onPress={handleDeleteAccount}
            showArrow
          />
        </Card>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.red} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>Sign-Lingo</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editProfileVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditProfileVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setEditProfileVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Edit Profile</Text>
                  <TouchableOpacity onPress={() => setEditProfileVisible(false)}>
                    <Ionicons name="close" size={24} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalInputWrapper}>
                  <Text style={styles.modalLabel}>Full Name</Text>
                  <TextInput
                    style={[styles.modalInput, editNameError ? styles.modalInputError : null]}
                    placeholder="Enter your full name"
                    placeholderTextColor={COLORS.textSecondary}
                    value={editName}
                    onChangeText={(text) => {
                      setEditName(text);
                      setEditNameError('');
                    }}
                  />
                  {editNameError ? <Text style={styles.modalErrorText}>{editNameError}</Text> : null}
                </View>

                <TouchableOpacity
                  style={styles.modalSaveButton}
                  onPress={handleSaveProfile}
                  disabled={editLoading}
                >
                  {editLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.modalSaveText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={changePasswordVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setChangePasswordVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setChangePasswordVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Change Password</Text>
                  <TouchableOpacity onPress={() => setChangePasswordVisible(false)}>
                    <Ionicons name="close" size={24} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalInputWrapper}>
                  <Text style={styles.modalLabel}>Current Password</Text>
                  <TextInput
                    style={[styles.modalInput, currentPasswordError ? styles.modalInputError : null]}
                    placeholder="Enter current password"
                    placeholderTextColor={COLORS.textSecondary}
                    secureTextEntry
                    value={currentPassword}
                    onChangeText={(text) => {
                      setCurrentPassword(text);
                      setCurrentPasswordError('');
                    }}
                  />
                  {currentPasswordError ? <Text style={styles.modalErrorText}>{currentPasswordError}</Text> : null}
                </View>

                <View style={styles.modalInputWrapper}>
                  <Text style={styles.modalLabel}>New Password</Text>
                  <TextInput
                    style={[styles.modalInput, newPasswordError ? styles.modalInputError : null]}
                    placeholder="Enter new password"
                    placeholderTextColor={COLORS.textSecondary}
                    secureTextEntry
                    value={newPassword}
                    onChangeText={(text) => {
                      setNewPassword(text);
                      setNewPasswordError('');
                    }}
                  />
                  {newPasswordError ? <Text style={styles.modalErrorText}>{newPasswordError}</Text> : null}
                </View>

                <View style={styles.modalInputWrapper}>
                  <Text style={styles.modalLabel}>Confirm Password</Text>
                  <TextInput
                    style={[styles.modalInput, confirmPasswordError ? styles.modalInputError : null]}
                    placeholder="Confirm new password"
                    placeholderTextColor={COLORS.textSecondary}
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      setConfirmPasswordError('');
                    }}
                  />
                  {confirmPasswordError ? <Text style={styles.modalErrorText}>{confirmPasswordError}</Text> : null}
                </View>

                <TouchableOpacity
                  style={styles.modalSaveButton}
                  onPress={handleSavePassword}
                  disabled={passwordLoading}
                >
                  {passwordLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.modalSaveText}>Update Password</Text>
                  )}
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Custom Alert Modal */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        type={alertConfig.type}
        onClose={hideAlert}
      />
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
    backgroundColor: `${COLORS.cardBackground}E6`,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionHeader: {
    fontSize: 13,
    fontFamily: 'Nunito-Bold',
    color: COLORS.textSecondary,
    letterSpacing: 1.5,
    marginTop: 24,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: `${COLORS.cardBackground}E6`,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 60,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: COLORS.textPrimary,
  },
  settingSubtitle: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  arrowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightText: {
    fontSize: 14,
    ...Fonts.regular,
    color: COLORS.textSecondary,
    marginRight: 4,
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
    backgroundColor: COLORS.emerald,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
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
    fontSize: 17,
    fontFamily: 'Nunito-Bold',
    color: COLORS.textPrimary,
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.redLight,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutText: {
    fontSize: 16,
    ...Fonts.appName,
    color: COLORS.red,
    marginLeft: 8,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 32,
  },
  appName: {
    fontSize: 16,
    ...Fonts.appName,
    color: COLORS.emerald,
  },
  appVersion: {
    fontSize: 13,
    ...Fonts.regular,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: width - 48,
    maxWidth: 400,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    ...Fonts.appName,
    color: COLORS.textPrimary,
  },
  modalInputWrapper: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    ...Fonts.regular,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  modalInput: {
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    ...Fonts.regular,
    backgroundColor: COLORS.background,
    color: COLORS.textPrimary,
  },
  modalInputError: {
    borderColor: COLORS.red,
    borderWidth: 2,
  },
  modalErrorText: {
    color: COLORS.red,
    fontSize: 12,
    ...Fonts.regular,
    marginTop: 6,
    marginLeft: 4,
  },
  modalSaveButton: {
    height: 50,
    borderRadius: 12,
    backgroundColor: COLORS.emerald,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  modalSaveText: {
    fontSize: 16,
    ...Fonts.appName,
    color: '#fff',
  },
});
