// frontend/utils/weaknessStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const WEAK_SIGNS_KEY = 'weakSigns';

export interface WeakSign {
  sign: string;
  accuracy: number;   // 0–100
  attempts: number;
  lastSeen: string;    // ISO date string
}

/**
 * Returns the full list of weak signs (accuracy < threshold).
 */
export async function getWeakSigns(): Promise<WeakSign[]> {
  try {
    const raw = await AsyncStorage.getItem(WEAK_SIGNS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as WeakSign[];
  } catch {
    return [];
  }
}

/**
 * Save / overwrite the weak-signs list.
 */
export async function saveWeakSigns(signs: WeakSign[]): Promise<void> {
  await AsyncStorage.setItem(WEAK_SIGNS_KEY, JSON.stringify(signs));
}

/**
 * Record a single sign attempt. If accuracy stays below 50 % the sign is
 * kept / added to the weak list; once it exceeds 70 % the sign is removed.
 */
export async function recordSignAttempt(
  sign: string,
  wasCorrect: boolean,
): Promise<void> {
  const list = await getWeakSigns();
  const idx = list.findIndex(s => s.sign === sign);

  if (idx >= 0) {
    // Update existing entry
    const entry = list[idx];
    entry.attempts += 1;
    // Exponential moving average (α = 0.3)
    const result = wasCorrect ? 100 : 0;
    entry.accuracy = Math.round(entry.accuracy * 0.7 + result * 0.3);
    entry.lastSeen = new Date().toISOString();

    if (entry.accuracy >= 70) {
      list.splice(idx, 1); // Graduated — no longer weak
    }
  } else if (!wasCorrect) {
    // New weak sign
    list.push({
      sign,
      accuracy: 0,
      attempts: 1,
      lastSeen: new Date().toISOString(),
    });
  }

  await saveWeakSigns(list);
}

/**
 * Convenience: just the count of weak signs.
 */
export async function getWeakSignCount(): Promise<number> {
  return (await getWeakSigns()).length;
}
