// frontend/contexts/UserContext.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Global state for XP, lesson progress, streak, and weak signs.
// Wraps the entire app so every screen shares live, reactive data.
// ─────────────────────────────────────────────────────────────────────────────
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '@/constants/config';

// ─── Types ───────────────────────────────────────────────────────
export interface WeakSign {
  sign: string;
  accuracy: number;   // 0–100
  attempts: number;
  lastSeen: string;   // ISO date string
}

export type League = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

/** Determine league from total XP */
function getLeague(xp: number): League {
  if (xp >= 1000) return 'Platinum';
  if (xp >= 500) return 'Gold';
  if (xp >= 200) return 'Silver';
  return 'Bronze';
}

/** League badge colours */
export const LEAGUE_COLORS: Record<League, string> = {
  Bronze: '#CD7F32',
  Silver: '#C0C0C0',
  Gold: '#FFD700',
  Platinum: '#E5E4E2',
};

interface UserContextValue {
  /** Total experience points */
  userXP: number;
  /** User level (1-based, every 100 XP = 1 level) */
  userLevel: number;
  /** XP progress towards the next level (0–99) */
  xpToNextLevel: number;
  /** Current league based on total XP */
  userLeague: League;
  /** IDs of all completed lessons */
  completedLessonIds: number[];
  /** Current day-streak count */
  streak: number;
  /** Signs the user struggles with */
  weakSigns: WeakSign[];
  /** Number of unique signs learned */
  signsLearned: number;
  /** Total quizzes completed */
  quizzesTaken: number;
  /** Total time spent learning (minutes) */
  timeSpent: number;
  /** User's display name (loaded from AsyncStorage) */
  userName: string;
  /** Current user's email (used for namespacing storage) */
  userEmail: string;
  /** true until the initial load from AsyncStorage finishes */
  loading: boolean;

  /** Mark a lesson as completed + add XP. Persists to AsyncStorage. */
  completeLesson: (lessonId: number, xp: number) => Promise<void>;
  /** Add XP (e.g. quest rewards). Persists to AsyncStorage. */
  addXP: (amount: number) => Promise<void>;
  /** Overwrite local XP with the server-authoritative total. */
  syncXPFromServer: (totalXP: number) => Promise<void>;
  /** Update the streak counter (e.g. after quiz calculates it). */
  updateStreak: (newStreak: number) => void;
  /** Remove a specific sign from the weak-signs list. */
  resolveWeakSign: (sign: string) => Promise<void>;
  /** Append a sign to weak-signs (no-op if already present). */
  addWeakSign: (sign: string) => Promise<void>;
  /** Push local progress (streak, weak-sign count) to the backend. */
  syncProgressToBackend: () => Promise<void>;
  /** Send a heartbeat ping so the backend knows the user is online.
   *  Returns true if server responded 200, false otherwise. */
  sendHeartbeat: () => Promise<boolean>;
  /** Force-reload everything from AsyncStorage. */
  refresh: () => Promise<void>;
  /** Log out: wipe in-memory state back to defaults & remove session keys. */
  logout: () => Promise<void>;
}

// ─── Helpers ─────────────────────────────────────────────────────
/** Build a user-namespaced AsyncStorage key */
const userKey = (email: string, key: string) => `${email}_${key}`;

// ─── Context ─────────────────────────────────────────────────────
const UserContext = createContext<UserContextValue>({
  userXP: 0,
  userLevel: 1,
  xpToNextLevel: 0,
  userLeague: 'Bronze',
  completedLessonIds: [],
  streak: 0,
  weakSigns: [],
  signsLearned: 0,
  quizzesTaken: 0,
  timeSpent: 0,
  userName: '',
  userEmail: '',
  loading: true,
  completeLesson: async () => {},
  addXP: async () => {},
  syncXPFromServer: async () => {},
  updateStreak: () => {},
  resolveWeakSign: async () => {},
  addWeakSign: async () => {},
  syncProgressToBackend: async () => {},
  sendHeartbeat: async () => false,
  refresh: async () => {},
  logout: async () => {},
});

export const useUser = () => useContext(UserContext);

// ─── Provider ────────────────────────────────────────────────────
export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userXP, setUserXP] = useState(0);
  const [completedLessonIds, setCompletedLessonIds] = useState<number[]>([]);
  const [streak, setStreak] = useState(0);
  const [weakSigns, setWeakSigns] = useState<WeakSign[]>([]);
  const [signsLearned, setSignsLearned] = useState(0);
  const [quizzesTaken, setQuizzesTaken] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);

  // Stable ref so fire-and-forget persist calls always use the latest email
  const emailRef = useRef('');
  useEffect(() => { emailRef.current = userEmail; }, [userEmail]);

  // Derived gamification values
  const userLevel = Math.floor(userXP / 100) + 1;
  const xpToNextLevel = userXP % 100;
  const userLeague = getLeague(userXP);

  // ── Load everything from AsyncStorage, then reconcile with backend ──
  const loadAll = useCallback(async () => {
    try {
      const userRaw = await AsyncStorage.getItem('userData');

      if (!userRaw) {
        // No user logged in – reset to defaults
        setUserXP(0);
        setUserName('');
        setUserEmail('');
        emailRef.current = '';
        setCompletedLessonIds([]);
        setStreak(0);
        setWeakSigns([]);
        setSignsLearned(0);
        setQuizzesTaken(0);
        setTimeSpent(0);
        return;
      }

      const parsed = JSON.parse(userRaw);
      const email = parsed.email || '';
      setUserEmail(email);
      emailRef.current = email;
      setUserName(parsed.full_name || '');

      if (!email) {
        // No email available – use server XP, empty progress
        setUserXP(parsed.xp || 0);
        setCompletedLessonIds([]);
        setStreak(0);
        setWeakSigns([]);
        setSignsLearned(0);
        setQuizzesTaken(0);
        setTimeSpent(0);
        return;
      }

      // ── Step 1: Load local cache so the UI is populated instantly ──
      const [xpRaw, progressRaw, streakRaw, weakRaw, signsRaw, quizzesRaw, timeRaw] = await Promise.all([
        AsyncStorage.getItem(userKey(email, 'userXP')),
        AsyncStorage.getItem(userKey(email, 'lessonProgress')),
        AsyncStorage.getItem(userKey(email, 'dayStreak')),
        AsyncStorage.getItem(userKey(email, 'weakSigns')),
        AsyncStorage.getItem(userKey(email, 'signsLearned')),
        AsyncStorage.getItem(userKey(email, 'quizzesAttempted')),
        AsyncStorage.getItem(userKey(email, 'timeSpentMinutes')),
      ]);

      // Resolve local values
      const localXP = xpRaw != null ? Number(xpRaw) : (parsed.xp || 0);
      const localLessons: number[] = progressRaw ? JSON.parse(progressRaw) : (parsed.completed_lessons || []);
      const localStreak = Number(streakRaw || '0') || (parsed.streak || 0);
      const localWeakSigns: WeakSign[] = weakRaw ? JSON.parse(weakRaw) : [];

      let localSignsLearned = parsed.signs_learned || 0;
      if (signsRaw != null) {
        try {
          const arr = JSON.parse(signsRaw);
          localSignsLearned = Array.isArray(arr) ? arr.length : localSignsLearned;
        } catch { /* keep fallback */ }
      }

      const localQuizzes = quizzesRaw != null ? Number(quizzesRaw) : (parsed.quizzes_taken || 0);
      const localTime = timeRaw != null ? Number(timeRaw) : (parsed.time_spent || 0);

      // Paint the UI with cached data immediately
      setUserXP(localXP);
      setCompletedLessonIds(localLessons);
      setStreak(localStreak);
      setWeakSigns(localWeakSigns);
      setSignsLearned(localSignsLearned);
      setQuizzesTaken(localQuizzes);
      setTimeSpent(localTime);

      // ── Step 2: Pull server-authoritative data and overwrite cache ──
      // This ensures that any admin edits (or progress recorded on another
      // device) win over the stale local copy.
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          const { data: remote } = await axios.get(
            `${API_URL}/api/user-progress`,
            { headers: { Authorization: `Bearer ${token}` } },
          );

          const remoteXP: number = remote.xp ?? localXP;
          const remoteLessons: number[] = remote.completed_lessons ?? localLessons;
          const remoteStreak: number = remote.streak ?? localStreak;
          const remoteSignsLearned: number = remote.signs_learned ?? localSignsLearned;
          const remoteQuizzes: number = remote.quizzes_taken ?? localQuizzes;
          const remoteTime: number = remote.time_spent ?? localTime;

          // Overwrite React state with the server truth
          setUserXP(remoteXP);
          setCompletedLessonIds(remoteLessons);
          setStreak(remoteStreak);
          setSignsLearned(remoteSignsLearned);
          setQuizzesTaken(remoteQuizzes);
          setTimeSpent(remoteTime);
          // weakSigns: the backend stores only a count, not the rich WeakSign
          // objects, so we intentionally keep the local value here.

          // Update AsyncStorage so the next cold-start reflects server data
          await Promise.all([
            AsyncStorage.setItem(userKey(email, 'userXP'), String(remoteXP)),
            AsyncStorage.setItem(userKey(email, 'lessonProgress'), JSON.stringify(remoteLessons)),
            AsyncStorage.setItem(userKey(email, 'dayStreak'), String(remoteStreak)),
            AsyncStorage.setItem(userKey(email, 'quizzesAttempted'), String(remoteQuizzes)),
            AsyncStorage.setItem(userKey(email, 'timeSpentMinutes'), String(remoteTime)),
          ]);

          console.log(
            `[UserContext] synced from backend – xp=${remoteXP}  streak=${remoteStreak}  lessons=${remoteLessons.length}`,
          );
        }
      } catch (fetchErr) {
        // Network offline or token invalid – silently keep the local cache.
        console.warn('[UserContext] backend pull failed, using local cache', fetchErr);
      }
    } catch (e) {
      console.error('[UserContext] load error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ── Helper: persist XP to the user-namespaced key ──
  const persistXP = useCallback(async (newXP: number) => {
    try {
      const email = emailRef.current;
      if (!email) return;
      await AsyncStorage.setItem(userKey(email, 'userXP'), String(newXP));
    } catch (e) {
      console.error('[UserContext] persistXP error', e);
    }
  }, []);

  // ── Value refs – always hold the LATEST state so the debounced
  //    sync timer never sends stale (old) values to the server. ──
  const xpRef = useRef(userXP);
  const streakRef = useRef(streak);
  const weakSignsRef = useRef(weakSigns);
  const completedRef = useRef(completedLessonIds);
  const signsLearnedRef = useRef(signsLearned);
  const quizzesTakenRef = useRef(quizzesTaken);
  const timeSpentRef = useRef(timeSpent);
  useEffect(() => { xpRef.current = userXP; }, [userXP]);
  useEffect(() => { streakRef.current = streak; }, [streak]);
  useEffect(() => { weakSignsRef.current = weakSigns; }, [weakSigns]);
  useEffect(() => { completedRef.current = completedLessonIds; }, [completedLessonIds]);
  useEffect(() => { signsLearnedRef.current = signsLearned; }, [signsLearned]);
  useEffect(() => { quizzesTakenRef.current = quizzesTaken; }, [quizzesTaken]);
  useEffect(() => { timeSpentRef.current = timeSpent; }, [timeSpent]);

  // ── syncProgressToBackend ──
  // Reads from refs (not closure state) so the debounced timer
  // always sends the LATEST values, even if state changed after
  // the timer was scheduled.
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncProgressToBackend = useCallback(async () => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) return;
        // NOTE: XP is intentionally NOT sent here.
        // XP is only modified on the server via $inc (/api/lesson/complete
        // and /api/add-xp) so no client-side $set can ever overwrite it.
        await axios.post(
          `${API_URL}/api/sync-progress`,
          {
            streak: streakRef.current,
            weak_signs_count: weakSignsRef.current.length,
            completed_lessons: completedRef.current,
            signs_learned: signsLearnedRef.current,
            quizzes_taken: quizzesTakenRef.current,
            time_spent: timeSpentRef.current,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        );
      } catch (e) {
        console.warn('[UserContext] syncProgress error', e);
      }
    }, 1500); // 1.5 s debounce
  }, []);  // no deps – reads from stable refs

  // Keep a stable ref so completeLesson / addXP can fire-and-forget
  const syncRef = useRef(syncProgressToBackend);
  useEffect(() => { syncRef.current = syncProgressToBackend; }, [syncProgressToBackend]);

  // ── sendHeartbeat ──
  const sendHeartbeat = useCallback(async (): Promise<boolean> => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return false;
      await axios.post(
        `${API_URL}/api/heartbeat`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return true;
    } catch (e: any) {
      console.warn('[UserContext] heartbeat failed', e?.response?.status || e?.message);
      return false;
    }
  }, []);

  // ── completeLesson ──
  const completeLesson = useCallback(
    async (lessonId: number, xp: number) => {
      // 1. Add lesson ID (no duplicates)
      setCompletedLessonIds((prev) => {
        if (prev.includes(lessonId)) return prev;
        const updated = [...prev, lessonId];
        const email = emailRef.current;
        if (email) {
          AsyncStorage.setItem(userKey(email, 'lessonProgress'), JSON.stringify(updated)).catch(() => {});
        }
        return updated;
      });

      // 2. Add XP
      setUserXP((prev) => {
        const newXP = prev + xp;
        persistXP(newXP); // fire-and-forget
        return newXP;
      });

      // 3. Push to backend (debounced via stable ref)
      setTimeout(() => syncRef.current(), 200);
    },
    [persistXP],
  );

  // ── addXP ──
  // Uses $inc on the server so XP is never overwritten by stale local values.
  const addXP = useCallback(
    async (amount: number) => {
      setUserXP((prev) => {
        const newXP = prev + amount;
        persistXP(newXP);
        return newXP;
      });
      // Push to server via dedicated $inc endpoint
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          const res = await axios.post(
            `${API_URL}/api/add-xp`,
            { amount },
            { headers: { Authorization: `Bearer ${token}` } },
          );
          // Reconcile with server truth
          if (res.data?.new_total_xp != null) {
            setUserXP(res.data.new_total_xp);
            persistXP(res.data.new_total_xp);
          }
        }
      } catch (e) {
        console.warn('[UserContext] addXP server error', e);
      }
    },
    [persistXP],
  );

  // ── syncXPFromServer ──
  const syncXPFromServer = useCallback(
    async (totalXP: number) => {
      setUserXP(totalXP);
      await persistXP(totalXP);
    },
    [persistXP],
  );

  // ── updateStreak ──
  const updateStreak = useCallback((newStreak: number) => {
    setStreak(newStreak);
    // Note: AsyncStorage is already written to by the caller (quiz.tsx).
  }, []);

  // ── resolveWeakSign ──
  const resolveWeakSign = useCallback(async (sign: string) => {
    setWeakSigns((prev) => {
      const updated = prev.filter((s) => s.sign !== sign);
      const email = emailRef.current;
      if (email) {
        AsyncStorage.setItem(userKey(email, 'weakSigns'), JSON.stringify(updated)).catch(() => {});
      }
      return updated;
    });
  }, []);

  // ── addWeakSign (append, no duplicates) ──
  const addWeakSign = useCallback(async (sign: string) => {
    setWeakSigns((prev) => {
      if (prev.some((s) => s.sign === sign)) return prev; // already tracked
      const entry: WeakSign = {
        sign,
        accuracy: 0,
        attempts: 1,
        lastSeen: new Date().toISOString(),
      };
      const updated = [...prev, entry];
      const email = emailRef.current;
      if (email) {
        AsyncStorage.setItem(userKey(email, 'weakSigns'), JSON.stringify(updated)).catch(() => {});
      }
      return updated;
    });
  }, []);

  // ── refresh ──
  const refresh = useCallback(async () => {
    await loadAll();
  }, [loadAll]);

  // ── logout: wipe in-memory state, remove session keys ──
  const logout = useCallback(async () => {
    setUserXP(0);
    setUserName('');
    setUserEmail('');
    emailRef.current = '';
    setCompletedLessonIds([]);
    setStreak(0);
    setWeakSigns([]);
    setSignsLearned(0);
    setQuizzesTaken(0);
    setTimeSpent(0);
    await AsyncStorage.multiRemove(['userToken', 'userData']);
  }, []);

  return (
    <UserContext.Provider
      value={{
        userXP,
        userLevel,
        xpToNextLevel,
        userLeague,
        completedLessonIds,
        streak,
        weakSigns,
        signsLearned,
        quizzesTaken,
        timeSpent,
        userName,
        userEmail,
        loading,
        completeLesson,
        addXP,
        syncXPFromServer,
        updateStreak,
        resolveWeakSign,
        addWeakSign,
        syncProgressToBackend,
        sendHeartbeat,
        refresh,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
