// frontend/app/login.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Video, ResizeMode } from 'expo-av';
import { API_URL } from '@/constants/config';
import { Fonts } from '@/constants/fonts';
import { AppColors } from '@/constants/colors';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
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
        
        // Navigate to the main app
        router.replace('/(tabs)/profile' as any);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Login Failed', 'Invalid email or password');
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

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Log In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/register' as any)} style={styles.linkContainer}>
            <Text style={styles.linkText}>
              Don't have an account? <Text style={styles.linkBold}>Sign Up</Text>
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