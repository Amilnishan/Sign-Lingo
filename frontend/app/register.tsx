// frontend/app/register.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { Video, ResizeMode } from 'expo-av';
import { API_URL } from '@/constants/config';
import { Fonts } from '@/constants/fonts';
import { AppColors } from '@/constants/colors';

const { width, height } = Dimensions.get('window'); 

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const validateFullName = (name: string): boolean => {
    // Minimum 3 characters, alphabets only (capital or non-capital), spaces allowed
    const namePattern = /^[A-Za-z\s]{3,}$/;
    return namePattern.test(name);
  };

  const validateEmail = (email: string): boolean => {
    // Must use @gmail.com
    const emailPattern = /^[a-zA-Z0-9._-]+@gmail\.com$/;
    return emailPattern.test(email);
  };

  const validatePassword = (password: string): boolean => {
    // 8 characters minimum, must contain: uppercase, lowercase, number, special character (@)
    if (password.length < 8) return false;
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[@#$%^&*!]/.test(password);
    
    return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
  };

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Validate full name
    if (!validateFullName(fullName)) {
      Alert.alert(
        'Invalid Name',
        'Input a Valid Name.'
      );
      return;
    }

    // Validate email
    if (!validateEmail(email)) {
      Alert.alert(
        'Invalid Email',
        'Please use a valid Gmail address.'
      );
      return;
    }

    // Validate password
    if (!validatePassword(password)) {
      Alert.alert(
        'Weak Password',
        'Password must be at least 8 characters with uppercase, lowercase, numbers, and special characters (@#$%^&*!).'
      );
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
        Alert.alert('Success', 'Account created! Please log in.');
        router.back(); // Go back to Login page
      }
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.message || 'Registration failed';
      Alert.alert('Error', message);
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
            <TextInput 
              style={styles.input} 
              placeholder="Full Name" 
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={fullName}
              onChangeText={setFullName}
            />
            <TextInput 
              style={styles.input} 
              placeholder="Email Address" 
              placeholderTextColor="rgba(255,255,255,0.6)"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput 
              style={styles.input} 
              placeholder="Password" 
              placeholderTextColor="rgba(255,255,255,0.6)"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
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