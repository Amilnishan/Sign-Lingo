// frontend/app/register.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { Video, ResizeMode } from 'expo-av';
import { API_URL } from '@/constants/config';
import { Fonts } from '@/constants/fonts';
import { AppColors } from '@/constants/colors';
import { CustomAlert, useCustomAlert } from '@/components/custom-alert';

const { width, height } = Dimensions.get('window'); 

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Inline validation error states
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // Custom alert hook
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();

  const validateFullName = (name: string): boolean => {
    // Minimum 3 characters, alphabets only (capital or non-capital), spaces allowed
    const namePattern = /^[A-Za-z\s]{3,}$/;
    return namePattern.test(name);
  };

  const validateEmail = (emailValue: string): boolean => {
    // Must use @gmail.com
    const emailPattern = /^[a-zA-Z0-9._-]+@gmail\.com$/;
    return emailPattern.test(emailValue);
  };

  const validatePassword = (pass: string): boolean => {
    // 8 characters minimum, must contain: uppercase, lowercase, number, special character (@)
    if (pass.length < 8) return false;
    
    const hasUpperCase = /[A-Z]/.test(pass);
    const hasLowerCase = /[a-z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecialChar = /[@#$%^&*!]/.test(pass);
    
    return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
  };

  // Real-time validation handlers
  const handleNameChange = (value: string) => {
    setFullName(value);
    if (value.length > 0 && !validateFullName(value)) {
      setNameError('Name must be at least 3 letters (alphabets only)');
    } else {
      setNameError('');
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (value.length > 0 && !validateEmail(value)) {
      setEmailError('Invalid e-mail. Use a valid Gmail address');
    } else {
      setEmailError('');
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (value.length > 0 && !validatePassword(value)) {
      setPasswordError('Min 8 chars with uppercase, lowercase, number & special char');
    } else {
      setPasswordError('');
    }
  };

  const handleRegister = async () => {
    // Reset errors
    setNameError('');
    setEmailError('');
    setPasswordError('');
    
    let hasError = false;

    if (!fullName) {
      setNameError('Full name is required');
      hasError = true;
    } else if (!validateFullName(fullName)) {
      setNameError('Name must be at least 3 letters (alphabets only)');
      hasError = true;
    }

    if (!email) {
      setEmailError('Email is required');
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError('Invalid e-mail. Use a valid Gmail address');
      hasError = true;
    }

    if (!password) {
      setPasswordError('Password is required');
      hasError = true;
    } else if (!validatePassword(password)) {
      setPasswordError('Min 8 chars with uppercase, lowercase, number & special char');
      hasError = true;
    }

    if (hasError) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/register`, {
        full_name: fullName,
        email: email,
        password: password
      });

      if (response.status === 201) {
        showAlert('Success', 'Account created successfully! Please log in.', [
          { text: 'OK', onPress: () => router.back() }
        ], 'success');
      }
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.message || 'Registration failed';
      showAlert('Error', message, [{ text: 'OK' }], 'error');
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
          <Text style={styles.headerTitle}>Create Account</Text>
          <Text style={styles.subTitle}>Start your learning journey today</Text>

          {/* Input Fields */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput 
                style={[styles.input, nameError ? styles.inputError : null]} 
                placeholder="Full Name" 
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={fullName}
                onChangeText={handleNameChange}
              />
              {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
            </View>
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

          {/* Register Button */}
          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Profile</Text>
            )}
          </TouchableOpacity>

          {/* Link to Login */}
          <TouchableOpacity onPress={() => router.back()} style={styles.linkContainer}>
            <Text style={styles.linkText}>
              Already have an account? <Text style={styles.linkBold}>Log In</Text>
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
  linkContainer: {
    marginTop: 24,
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