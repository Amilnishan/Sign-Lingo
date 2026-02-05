// frontend/app/forgot-password.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '@/constants/config';
import { Fonts } from '@/constants/fonts';
import { AppColors } from '@/constants/colors';
import { CustomAlert, useCustomAlert } from '@/components/custom-alert';

const { width, height } = Dimensions.get('window');

// Theme colors
const DARK_BG = '#0F172A';
const EMERALD_GREEN = '#2ECC71';

type ScreenState = 'email' | 'reset';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  
  // Screen state
  const [screenState, setScreenState] = useState<ScreenState>('email');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Loading states
  const [loading, setLoading] = useState(false);
  
  // Validation errors
  const [emailError, setEmailError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Custom alert
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();

  const validateEmail = (emailValue: string): boolean => {
    const emailPattern = /^[a-zA-Z0-9._-]+@gmail\.com$/;
    return emailPattern.test(emailValue);
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (value.length > 0 && !validateEmail(value)) {
      setEmailError('Invalid e-mail format');
    } else {
      setEmailError('');
    }
  };

  const handleOtpChange = (value: string) => {
    // Only allow numbers and limit to 6 digits
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 6);
    setOtpCode(numericValue);
    if (numericValue.length > 0 && numericValue.length < 6) {
      setOtpError('OTP must be 6 digits');
    } else {
      setOtpError('');
    }
  };

  const handlePasswordChange = (value: string) => {
    setNewPassword(value);
    if (value.length > 0 && value.length < 8) {
      setPasswordError('Password must be at least 8 characters');
    } else {
      setPasswordError('');
    }
    // Also validate confirm password if it has value
    if (confirmPassword.length > 0 && value !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (value.length > 0 && value !== newPassword) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleSendCode = async () => {
    setEmailError('');
    
    if (!email) {
      setEmailError('Email is required');
      return;
    }
    
    if (!validateEmail(email)) {
      setEmailError('Invalid e-mail format');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/forgot-password`, {
        email: email,
      });

      if (response.status === 200) {
        showAlert(
          'Code Sent! 📧',
          'A verification code has been sent to your email address.',
          [{ text: 'OK', onPress: () => setScreenState('reset') }],
          'success'
        );
      }
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.error || 'Failed to send verification code. Please try again.';
      showAlert('Error', errorMessage, [{ text: 'OK' }], 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    // Reset errors
    setOtpError('');
    setPasswordError('');
    setConfirmPasswordError('');
    
    let hasError = false;

    if (!otpCode) {
      setOtpError('OTP code is required');
      hasError = true;
    } else if (otpCode.length !== 6) {
      setOtpError('OTP must be 6 digits');
      hasError = true;
    }

    if (!newPassword) {
      setPasswordError('New password is required');
      hasError = true;
    } else if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
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

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/reset-password`, {
        email: email,
        otp: otpCode,
        new_password: newPassword,
      });

      if (response.status === 200) {
        showAlert(
          'Success! 🎉',
          'Your password has been reset successfully. Please login with your new password.',
          [{ text: 'Login', onPress: () => router.replace('/login' as any) }],
          'success'
        );
      }
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.error || 'Failed to reset password. Please try again.';
      showAlert('Error', errorMessage, [{ text: 'OK' }], 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderEmailState = () => (
    <>
      <View style={styles.iconContainer}>
        <Ionicons name="mail-outline" size={60} color={EMERALD_GREEN} />
      </View>
      
      <Text style={styles.headerTitle}>Forgot Password?</Text>
      <Text style={styles.subTitle}>
        No worries! Enter your email and we&apos;ll send you a verification code.
      </Text>

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <View style={styles.inputIconWrapper}>
            <Ionicons name="mail" size={20} color="rgba(255,255,255,0.5)" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.inputWithIcon, emailError ? styles.inputError : null]}
              placeholder="Email Address"
              placeholderTextColor="rgba(255,255,255,0.5)"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={handleEmailChange}
            />
          </View>
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSendCode}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="send" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Send Code</Text>
          </>
        )}
      </TouchableOpacity>
    </>
  );

  const renderResetState = () => (
    <>
      <View style={styles.iconContainer}>
        <Ionicons name="key-outline" size={60} color={EMERALD_GREEN} />
      </View>
      
      <Text style={styles.headerTitle}>Reset Password</Text>
      <Text style={styles.subTitle}>
        Enter the 6-digit code sent to {email} and create your new password.
      </Text>

      <View style={styles.inputContainer}>
        {/* OTP Input */}
        <View style={styles.inputWrapper}>
          <View style={styles.inputIconWrapper}>
            <Ionicons name="keypad" size={20} color="rgba(255,255,255,0.5)" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.inputWithIcon, styles.otpInput, otpError ? styles.inputError : null]}
              placeholder="6-Digit OTP Code"
              placeholderTextColor="rgba(255,255,255,0.5)"
              keyboardType="number-pad"
              maxLength={6}
              value={otpCode}
              onChangeText={handleOtpChange}
            />
          </View>
          {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}
        </View>

        {/* New Password Input */}
        <View style={styles.inputWrapper}>
          <View style={styles.inputIconWrapper}>
            <Ionicons name="lock-closed" size={20} color="rgba(255,255,255,0.5)" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.inputWithIcon, passwordError ? styles.inputError : null]}
              placeholder="New Password"
              placeholderTextColor="rgba(255,255,255,0.5)"
              secureTextEntry={!showPassword}
              value={newPassword}
              onChangeText={handlePasswordChange}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color="rgba(255,255,255,0.5)"
              />
            </TouchableOpacity>
          </View>
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
        </View>

        {/* Confirm Password Input */}
        <View style={styles.inputWrapper}>
          <View style={styles.inputIconWrapper}>
            <Ionicons name="lock-closed" size={20} color="rgba(255,255,255,0.5)" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.inputWithIcon, confirmPasswordError ? styles.inputError : null]}
              placeholder="Confirm New Password"
              placeholderTextColor="rgba(255,255,255,0.5)"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={handleConfirmPasswordChange}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-off' : 'eye'}
                size={20}
                color="rgba(255,255,255,0.5)"
              />
            </TouchableOpacity>
          </View>
          {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleResetPassword}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Reset Password</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Resend Code Link */}
      <TouchableOpacity
        style={styles.resendContainer}
        onPress={() => {
          setOtpCode('');
          setOtpError('');
          handleSendCode();
        }}
      >
        <Text style={styles.resendText}>
          Didn&apos;t receive the code? <Text style={styles.resendBold}>Resend</Text>
        </Text>
      </TouchableOpacity>
    </>
  );

  return (
    <View style={styles.container}>
      {/* Video Background */}
      <Video
        source={require('../assets/videos/theme.mp4')}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted
      />

      {/* Overlay */}
      <View style={styles.overlay} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (screenState === 'reset') {
                setScreenState('email');
                setOtpCode('');
                setNewPassword('');
                setConfirmPassword('');
                setOtpError('');
                setPasswordError('');
                setConfirmPasswordError('');
              } else {
                router.back();
              }
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.card}>
            {screenState === 'email' ? renderEmailState() : renderResetState()}

            {/* Back to Login Link */}
            <TouchableOpacity
              style={styles.linkContainer}
              onPress={() => router.replace('/login' as any)}
            >
              <Text style={styles.linkText}>
                Remember your password? <Text style={styles.linkBold}>Login</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Custom Alert Modal */}
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
    backgroundColor: DARK_BG,
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    ...Fonts.bold,
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 15,
    ...Fonts.regular,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 28,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    gap: 16,
    marginBottom: 24,
  },
  inputWrapper: {
    width: '100%',
  },
  inputIconWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  inputIcon: {
    paddingLeft: 16,
  },
  input: {
    flex: 1,
    height: 54,
    paddingHorizontal: 12,
    fontSize: 16,
    ...Fonts.regular,
    color: '#fff',
  },
  inputWithIcon: {
    paddingLeft: 8,
  },
  otpInput: {
    letterSpacing: 8,
    fontSize: 20,
    ...Fonts.bold,
    textAlign: 'center',
  },
  inputError: {
    borderColor: '#E74C3C',
    borderWidth: 2,
  },
  eyeIcon: {
    padding: 16,
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 12,
    ...Fonts.regular,
    marginTop: 6,
    marginLeft: 4,
  },
  button: {
    backgroundColor: EMERALD_GREEN,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: EMERALD_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    ...Fonts.bold,
  },
  resendContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  resendText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    ...Fonts.regular,
  },
  resendBold: {
    color: EMERALD_GREEN,
    ...Fonts.bold,
  },
  linkContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 15,
    ...Fonts.regular,
  },
  linkBold: {
    color: '#fff',
    ...Fonts.bold,
  },
});
