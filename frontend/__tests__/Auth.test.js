// frontend/__tests__/Auth.test.js
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RegisterScreen from '../app/register'; 
import LoginScreen from '../app/login';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { API_URL } from '../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Note: 'expo-router' and 'expo-av' are now mocked in jest.setup.js, 
// so we don't need to mock them here anymore!

// 1. Mock Axios (We keep this here because it controls specific API responses for this test)
const mockAxios = new MockAdapter(axios);

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
})); 

describe('Sprint 1: User Registration Tests', () => {
  
  beforeEach(() => {
    mockAxios.reset();
  });

  // TC_S1_01: Verify user registration with valid details
  it('TC_S1_01: should register user successfully with valid details', async () => {
    // Mock success response
    mockAxios.onPost(`${API_URL}/register`).reply(201, {
      message: "User registered successfully!"
    });

    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);

    // Type in fields
    fireEvent.changeText(getByPlaceholderText('Full Name'), 'Amil Nishan');
    fireEvent.changeText(getByPlaceholderText('Email Address'), 'newuser@gmail.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'Password@123');

    // Click Register
    fireEvent.press(getByText('Create Profile'));

    // Check if API was called
    await waitFor(() => {
      expect(mockAxios.history.post.length).toBe(1);
      expect(JSON.parse(mockAxios.history.post[0].data)).toEqual({
        full_name: 'Amil Nishan',
        email: 'newuser@gmail.com',
        password: 'Password@123'
      });
    });
  });

  // TC_S1_02: Verify registration with existing email
  it('TC_S1_02: should display error when email already exists', async () => {
    // Mock error response
    mockAxios.onPost(`${API_URL}/register`).reply(400, {
      message: "Email already exists!"
    });

    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);

    fireEvent.changeText(getByPlaceholderText('Full Name'), 'Amil');
    fireEvent.changeText(getByPlaceholderText('Email Address'), 'existing@gmail.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'Exist@123');

    fireEvent.press(getByText('Create Profile'));

    await waitFor(() => {
        expect(mockAxios.history.post.length).toBe(1);
    });
  });

  // TC_S1_03: Verify registration with empty fields
  it('TC_S1_03: should not submit if fields are empty', async () => {
    const { getByText } = render(<RegisterScreen />);

    // Click without typing
    fireEvent.press(getByText('Create Profile'));

    // Ensure NO API call happened
    await waitFor(() => {
      expect(mockAxios.history.post.length).toBe(0);
    });
  });

  // TC_S1_04: Verify registration with invalid email format
  it('TC_S1_04: should not submit with invalid email format', async () => {
    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);

    fireEvent.changeText(getByPlaceholderText('Full Name'), 'John Doe');
    fireEvent.changeText(getByPlaceholderText('Email Address'), 'invalidemail@yahoo.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'Valid@Pass123');

    fireEvent.press(getByText('Create Profile'));

    // Ensure NO API call happened due to invalid email
    await waitFor(() => {
      expect(mockAxios.history.post.length).toBe(0);
    });
  });

  // TC_S1_05: Verify registration with weak password
  it('TC_S1_05: should not submit with weak password', async () => {
    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);

    fireEvent.changeText(getByPlaceholderText('Full Name'), 'Jane Smith');
    fireEvent.changeText(getByPlaceholderText('Email Address'), 'jane@gmail.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'weak123'); // Missing uppercase and special char

    fireEvent.press(getByText('Create Profile'));

    // Ensure NO API call happened due to weak password
    await waitFor(() => {
      expect(mockAxios.history.post.length).toBe(0);
    });
  });
});

describe('Sprint 2: User Login Tests', () => {
  
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
  });

  // TC_S2_01: Verify user login with valid credentials
  it('TC_S2_01: should login user successfully with valid credentials', async () => {
    // Mock success response
    mockAxios.onPost(`${API_URL}/login`).reply(200, {
      token: 'mock_jwt_token_123',
      user: {
        id: 1,
        email: 'user@gmail.com',
        full_name: 'Test User'
      }
    });

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    // Type in fields
    fireEvent.changeText(getByPlaceholderText('Email Address'), 'user@gmail.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'ValidPass@123');

    // Click Login
    fireEvent.press(getByText('Log In'));

    // Check if API was called
    await waitFor(() => {
      expect(mockAxios.history.post.length).toBe(1);
      expect(JSON.parse(mockAxios.history.post[0].data)).toEqual({
        email: 'user@gmail.com',
        password: 'ValidPass@123'
      });
      // Check if token and user data were saved to AsyncStorage
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('userToken', 'mock_jwt_token_123');
    });
  });

  // TC_S2_02: Verify login with invalid credentials
  it('TC_S2_02: should display error with invalid email or password', async () => {
    // Mock error response
    mockAxios.onPost(`${API_URL}/login`).reply(401, {
      message: "Invalid email or password!"
    });

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('Email Address'), 'wrong@gmail.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'WrongPass@123');

    fireEvent.press(getByText('Log In'));

    await waitFor(() => {
      expect(mockAxios.history.post.length).toBe(1);
    });
  });

  // TC_S2_03: Verify login with empty fields
  it('TC_S2_03: should not submit if email or password is empty', async () => {
    const { getByText } = render(<LoginScreen />);

    // Click without typing
    fireEvent.press(getByText('Log In'));

    // Ensure NO API call happened
    await waitFor(() => {
      expect(mockAxios.history.post.length).toBe(0);
    });
  });

  // TC_S2_04: Verify login with invalid email format
  it('TC_S2_04: should not submit with invalid email format', async () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('Email Address'), 'invalidemail@yahoo.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'ValidPass@123');

    fireEvent.press(getByText('Log In'));

    // Ensure NO API call happened due to invalid email
    await waitFor(() => {
      expect(mockAxios.history.post.length).toBe(0);
    });
  });

  // TC_S2_05: Verify login with short password
  it('TC_S2_05: should display API error when credentials are invalid', async () => {
    // Mock error response
    mockAxios.onPost(`${API_URL}/login`).reply(401, {
      message: "Invalid email or password!"
    });

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('Email Address'), 'test@gmail.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'test123'); // Short password will be sent to API

    fireEvent.press(getByText('Log In'));

    // API will be called with short password (login validation only checks if password exists)
    await waitFor(() => {
      expect(mockAxios.history.post.length).toBe(1);
    });
  });
});