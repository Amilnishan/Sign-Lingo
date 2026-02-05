// frontend/app/login.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Video, ResizeMode } from 'expo-av';
import { API_URL } from '@/constants/config';
import { Fonts } from '@/constants/fonts';
import { AppColors } from '@/constants/colors';
import { CustomAlert, useCustomAlert } from '@/components/custom-alert';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Inline validation error states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // Custom alert hook
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

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (value.length > 0 && value.length < 8) {
      setPasswordError('Password must be at least 8 characters');
    } else {
      setPasswordError('');
    }
  };

  const handleLogin = async () => {
    // Reset errors
    setEmailError('');
    setPasswordError('');
    
    let hasError = false;

    if (!email) {
      setEmailError('Email is required');
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError('Invalid e-mail format');
      hasError = true;
    }

    if (!password) {
      setPasswordError('Password is required');
      hasError = true;
    }

    if (hasError) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/login`, {
        email: email,
        password: password
      });

      if (response.status === 200) {
        // Save token and user data
        await AsyncStorage.setItem('userToken', response.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
        
        // Check if THIS specific user has completed onboarding (user-specific key)
        const userEmail = response.data.user.email;
        const onboardingKey = `hasCompletedOnboarding_${userEmail}`;
        const hasCompletedOnboarding = await AsyncStorage.getItem(onboardingKey);
        
        console.log('User email:', userEmail);
        console.log('Onboarding key:', onboardingKey);
        console.log('Has completed onboarding:', hasCompletedOnboarding);
        
        // Navigate to onboarding if first time, otherwise go to home
        if (!hasCompletedOnboarding) {
          console.log('Navigating to onboarding...');
          router.push('/onboarding-step1' as any);
        } else {
          console.log('Navigating to home...');
          router.replace('/(tabs)/home' as any);
        }
      }
    } catch (error) {
      console.error(error);
      showAlert('Login Failed', 'Invalid email or password', [{ text: 'OK' }], 'error');
    } finally {
      setLoading(false);
    }
  };

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
      
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.headerTitle}>Welcome Back!</Text>
          <Text style={styles.subTitle}>Ready to learn some new signs today?</Text>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput 
                style={[styles.input, emailError ? styles.inputError : null]} 
                placeholder="Email Address" 
                placeholderTextColor="rgba(255,255,255,0.6)"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={handleEmailChange}
              />
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            </View>
            <View style={styles.inputWrapper}>
              <TextInput 
                style={[styles.input, passwordError ? styles.inputError : null]} 
                placeholder="Password" 
                placeholderTextColor="rgba(255,255,255,0.6)"
                secureTextEntry
                value={password}
                onChangeText={handlePasswordChange}
              />
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            </View>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Log In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/forgot-password' as any)} style={styles.forgotContainer}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/register' as any)} style={styles.linkContainer}>
            <Text style={styles.linkText}>
              Don&apos;t have an account? <Text style={styles.linkBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerTitle: {
    fontSize: 28,
    ...Fonts.appName,
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 16,
    ...Fonts.regular,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 32,
    textAlign: 'center',
  },
  inputContainer: {
    gap: 16,
    marginBottom: 28,
  },
  inputWrapper: {
    width: '100%',
  },
  input: {
    height: 54,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 18,
    fontSize: 16,
    ...Fonts.regular,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: '#fff',
  },
  inputError: {
    borderColor: '#E74C3C',
    borderWidth: 2,
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 12,
    ...Fonts.regular,
    marginTop: 6,
    marginLeft: 4,
  },
  button: {
    backgroundColor: AppColors.primary,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    color: AppColors.textWhite,
    fontSize: 18,
    ...Fonts.appName,
  },
  forgotContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  forgotText: {
    color: AppColors.primary,
    fontSize: 14,
    ...Fonts.bold,
  },
  linkContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 15,
    ...Fonts.regular,
  },
  linkBold: {
    color: '#fff',
    ...Fonts.appName,
  },
});