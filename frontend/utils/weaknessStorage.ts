// frontend/utils/weaknessStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Build the user-namespaced weak-signs key */
const weakKey = (userEmail: string) => `${userEmail}_weakSigns`;

export interface WeakSign {
  sign: string;
  accuracy: number;   // 0–100
  attempts: number;
  lastSeen: string;    // ISO date string
}

/**
 * Returns the full list of weak signs (accuracy < threshold).
 */
export async function getWeakSigns(userEmail: string): Promise<WeakSign[]> {
  try {
    const raw = await AsyncStorage.getItem(weakKey(userEmail));
    if (!raw) return [];
    return JSON.parse(raw) as WeakSign[];
  } catch {
    return [];
  }
}

/**
 * Save / overwrite the weak-signs list.
 */
export async function saveWeakSigns(userEmail: string, signs: WeakSign[]): Promise<void> {
  await AsyncStorage.setItem(weakKey(userEmail), JSON.stringify(signs));
}

/**
 * Record a single sign attempt. If accuracy stays below 50 % the sign is
 * kept / added to the weak list; once it exceeds 70 % the sign is removed.
 */
export async function recordSignAttempt(
  userEmail: string,
  sign: string,
  wasCorrect: boolean,
): Promise<void> {
  const list = await getWeakSigns(userEmail);
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

  await saveWeakSigns(userEmail, list);
}

/**
 * Convenience: just the count of weak signs.
 */
export async function getWeakSignCount(userEmail: string): Promise<number> {
  return (await getWeakSigns(userEmail)).length;
}
