// frontend/utils/audio.ts
import { Audio } from 'expo-av';

let isAudioConfigured = false;

/**
 * Configure audio mode for the app (only needs to be done once)
 */
async function configureAudio() {
  if (isAudioConfigured) return;
  
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    isAudioConfigured = true;
  } catch (error) {
    console.error('Error configuring audio:', error);
  }
}

/**
 * Plays a sound effect based on the specified type
 * @param type - The type of sound to play: 'login', 'correct', or 'wrong'
 */
export async function playSound(type: 'login' | 'correct' | 'wrong'): Promise<void> {
  let soundSource;

  // Select the appropriate sound file based on type
  switch (type) {
    case 'login':
      soundSource = require('../assets/sounds/login.wav');
      break;
    case 'correct':
      soundSource = require('../assets/sounds/correct.wav');
      break;
    case 'wrong':
      soundSource = require('../assets/sounds/wrong.wav');
      break;
    default:
      return;
  }

  try {
    // Configure audio mode if not already done
    await configureAudio();
    
    // Create and load the sound
    const { sound } = await Audio.Sound.createAsync(soundSource);

    // Set up a listener to automatically unload the sound from memory when playback finishes
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
      }
    });

    // Play the sound
    await sound.playAsync();
  } catch (error) {
    console.error(`Error playing ${type} sound:`, error);
  }
}

/**
 * Plays background music that loops
 * @returns Sound object that can be used to stop the music
 */
export async function playBackgroundMusic(): Promise<Audio.Sound | null> {
  try {
    // Configure audio mode if not already done
    await configureAudio();
    
    // Create and load the sound
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sounds/login.wav'),
      { isLooping: true, volume: 0.5 }
    );

    // Play the sound
    await sound.playAsync();
    
    return sound;
  } catch (error) {
    console.error('Error playing background music:', error);
    return null;
  }
}

/**
 * Stops and unloads a sound
 */
export async function stopSound(sound: Audio.Sound | null): Promise<void> {
  if (sound) {
    try {
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }
    } catch (error) {
      console.error('Error stopping sound:', error);
    }
  }
}
