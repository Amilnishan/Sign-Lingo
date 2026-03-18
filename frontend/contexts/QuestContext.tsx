// frontend/contexts/QuestContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from './UserContext';

// ─── Types ───────────────────────────────────────────────────────
export type QuestType = 'sign' | 'xp' | 'lesson' | 'quiz';

export interface Quest {
  id: string;
  type: QuestType;
  label: string;
  icon: string;               // Ionicons name
  target: number;
  current: number;
  xpReward: number;
  completed: boolean;
  claimed: boolean;
}

interface QuestContextValue {
  quests: Quest[];
  loading: boolean;
  /** Call from any screen to bump quest progress */
  updateQuestProgress: (type: QuestType, amount: number) => void;
  /** Mark a quest as claimed (prevents double-claiming) */
  claimQuest: (questId: string) => void;
}

// ─── Quest Pool (templates) ──────────────────────────────────────
interface QuestTemplate {
  type: QuestType;
  targets: number[];
  label: (t: number) => string;
  icon: string;
  xpReward: (t: number) => number;
}

const QUEST_POOL: QuestTemplate[] = [
  {
    type: 'sign',
    targets: [2, 5, 10],
    label: (t) => `Learn ${t} Signs`,
    icon: 'hand-left-outline',
    xpReward: (t) => t * 5,          // 10, 25, 50
  },
  {
    type: 'xp',
    targets: [30, 50, 100],
    label: (t) => `Collect ${t} XP`,
    icon: 'flash-outline',
    xpReward: (t) => Math.round(t * 0.5), // 15, 25, 50
  },
  {
    type: 'lesson',
    targets: [1, 2],
    label: (t) => `Finish ${t} Lesson${t > 1 ? 's' : ''}`,
    icon: 'book-outline',
    xpReward: (t) => t * 15,         // 15, 30
  },
  {
    type: 'quiz',
    targets: [1, 3],
    label: (t) => `Attend ${t} Quiz${t > 1 ? 'zes' : ''}`,
    icon: 'help-circle-outline',
    xpReward: (t) => t * 10,         // 10, 30
  },
];

// ─── Helpers ─────────────────────────────────────────────────────
const BASE_KEY_QUESTS = 'dailyQuests_v2';
const BASE_KEY_DATE = 'dailyQuests_date_v2';

/** Shuffle an array (Fisher-Yates) and take first N */
function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

function generateDailyQuests(): Quest[] {
  // Pick 3 distinct quest types from the pool
  const templates = pickRandom(QUEST_POOL, 3);

  return templates.map((tmpl, idx) => {
    const target = tmpl.targets[Math.floor(Math.random() * tmpl.targets.length)];
    return {
      id: `quest_${idx}`,
      type: tmpl.type,
      label: tmpl.label(target),
      icon: tmpl.icon,
      target,
      current: 0,
      xpReward: tmpl.xpReward(target),
      completed: false,
      claimed: false,
    };
  });
}

function todayKey(): string {
  return new Date().toDateString(); // e.g. "Mon Feb 24 2026"
}

// ─── Context ─────────────────────────────────────────────────────
const QuestContext = createContext<QuestContextValue>({
  quests: [],
  loading: true,
  updateQuestProgress: () => {},
  claimQuest: () => {},
});

export const useQuests = () => useContext(QuestContext);

// ─── Provider ────────────────────────────────────────────────────
export function QuestProvider({ children }: { children: React.ReactNode }) {
  const { userEmail } = useUser();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const questsRef = useRef<Quest[]>([]);
  const emailRef = useRef('');

  // Keep refs in sync so callbacks always see latest values
  useEffect(() => { questsRef.current = quests; }, [quests]);
  useEffect(() => { emailRef.current = userEmail; }, [userEmail]);

  // Build user-namespaced keys
  const questsKey = userEmail ? `${userEmail}_${BASE_KEY_QUESTS}` : '';
  const dateKey = userEmail ? `${userEmail}_${BASE_KEY_DATE}` : '';

  // ── Load / rotate when user changes or on mount ──
  useEffect(() => {
    if (!userEmail) {
      // No user – clear quests
      setQuests([]);
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const savedDate = await AsyncStorage.getItem(dateKey);
        const today = todayKey();

        if (savedDate === today) {
          // Same day → restore quests
          const raw = await AsyncStorage.getItem(questsKey);
          if (raw) {
            setQuests(JSON.parse(raw));
          } else {
            // Edge case: date matches but quests missing
            const fresh = generateDailyQuests();
            setQuests(fresh);
            await persist(fresh, today);
          }
        } else {
          // New day → generate fresh quests
          const fresh = generateDailyQuests();
          setQuests(fresh);
          await persist(fresh, today);
        }
      } catch (e) {
        console.error('[QuestContext] load error', e);
        setQuests(generateDailyQuests());
      } finally {
        setLoading(false);
      }
    })();
  }, [userEmail]);

  const persist = async (q: Quest[], date: string) => {
    const email = emailRef.current;
    if (!email) return;
    await AsyncStorage.setItem(`${email}_${BASE_KEY_QUESTS}`, JSON.stringify(q));
    await AsyncStorage.setItem(`${email}_${BASE_KEY_DATE}`, date);
  };

  // ── Public: bump progress ──
  const updateQuestProgress = useCallback((type: QuestType, amount: number) => {
    setQuests(prev => {
      const updated = prev.map(q => {
        if (q.type !== type || q.completed) return q;
        const newCurrent = Math.min(q.current + amount, q.target);
        return {
          ...q,
          current: newCurrent,
          completed: newCurrent >= q.target,
        };
      });
      // Persist in background
      const email = emailRef.current;
      if (email) {
        AsyncStorage.setItem(`${email}_${BASE_KEY_QUESTS}`, JSON.stringify(updated)).catch(() => {});
      }
      return updated;
    });
  }, []);

  // ── Public: claim a completed quest (prevents double-farming XP) ──
  const claimQuest = useCallback((questId: string) => {
    setQuests(prev => {
      const updated = prev.map(q =>
        q.id === questId && q.completed && !q.claimed ? { ...q, claimed: true } : q,
      );
      const email = emailRef.current;
      if (email) {
        AsyncStorage.setItem(`${email}_${BASE_KEY_QUESTS}`, JSON.stringify(updated)).catch(() => {});
      }
      return updated;
    });
  }, []);

  return (
    <QuestContext.Provider value={{ quests, loading, updateQuestProgress, claimQuest }}>
      {children}
    </QuestContext.Provider>
  );
}
