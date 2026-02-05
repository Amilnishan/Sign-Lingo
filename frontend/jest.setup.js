// jest.setup.js

// Mock Expo modules that cause issues in test environment
global.__DEV__ = true;

// Mock import.meta for Expo's winter runtime
global.__ExpoImportMetaRegistry = new Map();

// Polyfill structuredClone if it doesn't exist
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

// 1. Mock Expo AV (Video Player)
jest.mock('expo-av', () => ({
  Video: jest.fn(() => null),
  ResizeMode: {
    CONTAIN: 'contain',
    COVER: 'cover',
    STRETCH: 'stretch',
  },
  Audio: {
    Sound: jest.fn(),
    setAudioModeAsync: jest.fn(),
  },
}));

// 2. Mock Expo Router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  }),
  Stack: {
    Screen: 'Screen',
  },
  Tabs: {
    Screen: 'Screen',
  },
  Link: 'Link',
}));

// 3. Mock Font Loading (Common source of crashes)
jest.mock('expo-font', () => ({
  isLoaded: jest.fn(() => true),
  loadAsync: jest.fn(() => Promise.resolve()),
}));

// 4. Mock Custom Alert component
jest.mock('@/components/custom-alert', () => ({
  CustomAlert: jest.fn(() => null),
  useCustomAlert: () => ({
    alertConfig: {
      visible: false,
      title: '',
      message: '',
      buttons: [],
    },
    showAlert: jest.fn(),
    hideAlert: jest.fn(),
  }),
}));

// 5. Suppress console warnings during tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};