import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { onAuthStateChanged } from "@firebase/auth";
import { GameGrid } from "@/components/GameGrid";
import { KanaKeyboard } from "@/components/KanaKeyboard";
import { ResultModal } from "@/components/ResultModal";
import { PaywallModal } from "@/components/PaywallModal";
import { FoundingUserBadge } from "@/components/FoundingUserBadge";
import { WelcomeLandingScreen } from "@/components/WelcomeLandingScreen";
import { acceptedGuesses } from "@/data/acceptedGuesses";
import { kanaRushWordSet } from "@/data/kanaRushVocabulary";
import { wordPools } from "@/data/words";
import { auth } from "@/firebase/firebaseConfig";
import {
  UserStats,
  deleteCurrentAccount,
  getOrCreateDailyPuzzle,
  getSignedInUserId,
  getUserStats,
  hasPlayedToday,
  initUserIfNeeded,
  isBeforePaywallLaunch,
  migrateLegacyPlusIfEligible,
  saveDailyPlayForCurrentUser,
  sendJouzuPasswordReset,
  signInWithEmail,
  signOutOfJouzu,
  signUpWithEmail
} from "@/firebase/services";
import {
  buildNotificationStatsFromProgress,
  cancelDailyJozuNotifications,
  requestJozuNotificationPermission,
  rescheduleJozuNotifications
} from "@/notifications/jozuNotifications";
import { DailyProgress, JLPTLevel, TileStatus, WordEntry, WordMastery } from "@/types/game";
import { evaluateGuess } from "@/utils/evaluateGuess";
import { playInteractionFeedback } from "@/utils/feedback";
import { getDailyPuzzle } from "@/utils/getDailyPuzzle";
import { formatPuzzleNumber, getPuzzleNumber, getTodayKey } from "@/utils/getWordOfTheDay";
import { MOTION, useReducedMotion } from "@/utils/motion";
import {
  PlusPlan,
  SubscriptionStatus,
  canAccessFeature,
  getCachedSubscriptionStatus,
  getSubscriptionStatus,
  purchasePlusPlan,
  restorePlusPurchases
} from "@/utils/subscriptionService";
import {
  clearLocalJouzuData,
  loadDailyRemindersEnabled,
  loadPracticeCategory,
  loadProgress,
  loadShowRomajiPreference,
  loadWordMastery,
  saveDailyRemindersEnabled,
  savePracticeCategory,
  saveProgress,
  saveShowRomajiPreference,
  saveWordMastery
} from "@/utils/storage";
import { KanaRushScreen } from "@/src/modes/kanaRush/KanaRushScreen";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const KANA_ONLY = /^[\u3040-\u309f]+$/;
type GameMode = "daily" | "unlimited" | "rush";
type AuthMode = "signIn" | "signUp";
type PendingPlusAction = "practice" | "review" | null;
type PracticeCategory = "all" | string;

const PRACTICE_CATEGORY_OPTIONS = [
  { id: "all", label: "All Categories", matches: [] },
  { id: "verbs", label: "Verbs", matches: ["verb", "action"] },
  { id: "food", label: "Food", matches: ["food", "drink"] },
  { id: "travel", label: "Travel", matches: ["travel", "transport"] },
  { id: "work", label: "Work", matches: ["work"] },
  { id: "school", label: "School", matches: ["study"] },
  { id: "places", label: "Places", matches: ["place", "home"] },
  { id: "emotions", label: "Emotions", matches: ["feeling"] },
  { id: "adjectives", label: "Adjectives", matches: ["adjective", "description", "color"] }
] as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function getEmailValidationMessage(email: string): string | null {
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedEmail) {
    return "Enter your email.";
  }

  if (trimmedEmail.endsWith(".con")) {
    return "Did you mean .com? Check the email ending.";
  }

  if (!EMAIL_PATTERN.test(trimmedEmail)) {
    return "Enter a valid email address.";
  }

  return null;
}

function getAuthErrorMessage(error: unknown): string {
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";

  switch (code) {
    case "auth/email-already-in-use":
      return "That email already has an account. Try signing in.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email or password was not recognized.";
    case "auth/weak-password":
      return "Use at least 6 characters for your password.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

function formatCompletedAt(date: Date | null): string {
  if (!date) {
    return "Not recorded";
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatStatValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function getMaxGuesses(answerLength: number): number {
  return answerLength === 2 ? 4 : 6;
}

function getMasteryLevel(masteryByWord: Record<string, WordMastery>, wordId: string): number {
  return masteryByWord[wordId]?.masteryLevel ?? 0;
}

function getReviewWords(masteryByWord: Record<string, WordMastery>): WordEntry[] {
  const wordsById = new Map<string, WordEntry>();

  Object.values(wordPools)
    .flat()
    .forEach((word) => wordsById.set(word.id, word));

  return Object.values(masteryByWord)
    .filter((mastery) => mastery.lastResult === "incorrect")
    .map((mastery) => wordsById.get(mastery.wordId))
    .filter((word): word is WordEntry => Boolean(word));
}

function getPracticeCategoryOption(categoryId: PracticeCategory) {
  return (
    PRACTICE_CATEGORY_OPTIONS.find((category) => category.id === categoryId) ??
    PRACTICE_CATEGORY_OPTIONS[0]
  );
}

function filterWordsByPracticeCategory(wordsToFilter: WordEntry[], categoryId: PracticeCategory): WordEntry[] {
  const categoryOption = getPracticeCategoryOption(categoryId);

  if (categoryOption.id === "all") {
    return wordsToFilter;
  }

  const categoryMatches = categoryOption.matches as readonly string[];
  return wordsToFilter.filter((word) => categoryMatches.includes(word.category));
}

function getNextMastery(
  currentMastery: Record<string, WordMastery>,
  practiceWord: WordEntry,
  result: "correct" | "incorrect"
): Record<string, WordMastery> {
  const previous = currentMastery[practiceWord.id];
  const previousLevel = previous?.masteryLevel ?? 0;
  const nextLevel = result === "correct" ? previousLevel + 1 : Math.max(0, previousLevel - 1);

  return {
    ...currentMastery,
    [practiceWord.id]: {
      wordId: practiceWord.id,
      masteryLevel: nextLevel,
      lastResult: result,
      lastSeen: Date.now()
    }
  };
}

function getConfusableWord(word: WordEntry, guess: string) {
  const closeAnswer = word.confusableWords?.find((confusable) => confusable.word === guess);

  if (closeAnswer) {
    return closeAnswer;
  }

  if (word.closeAnswers?.includes(guess)) {
    return {
      word: guess,
      romaji: "",
      english: "a close answer",
      note: `This word is more specifically ${word.english}.`
    };
  }

  return null;
}

function getCloseAnswerMessage(word: WordEntry, guess: string): string {
  const confusableWord = getConfusableWord(word, guess);
  const note = confusableWord?.note ? `\n\n${confusableWord.note}` : "";

  return `${guess} is related, but Jozu is looking for a different word.\n\nThis still counts as an attempt.${note}`;
}

function selectWeightedWord(
  candidates: WordEntry[],
  masteryByWord: Record<string, WordMastery>
): WordEntry {
  const weightedWords = candidates.flatMap((word) => {
    const mastery = masteryByWord[word.id];
    const masteryLevel = mastery?.masteryLevel ?? 0;
    const weight =
      mastery?.lastResult === "incorrect" ? Math.max(2, 4 - masteryLevel) : Math.max(1, 2 - masteryLevel);

    return Array.from({ length: weight }, () => word);
  });

  return weightedWords[Math.floor(Math.random() * weightedWords.length)];
}

function selectRandomWord(
  level: JLPTLevel,
  excludedWordIds: string[] = [],
  masteryByWord: Record<string, WordMastery> = {},
  reviewWeakOnly = false,
  practiceCategory: PracticeCategory = "all"
): WordEntry {
  const pool = wordPools[level].length > 0 ? wordPools[level] : wordPools.N5;
  const excludedIds = new Set(excludedWordIds);
  const levelPool = reviewWeakOnly ? getReviewWords(masteryByWord) : pool;
  const filteredPool = filterWordsByPracticeCategory(levelPool, practiceCategory);
  const fallbackPool = reviewWeakOnly
    ? filteredPool.length > 0
      ? filteredPool
      : levelPool.length > 0
        ? levelPool
        : pool
    : filteredPool.length > 0
      ? filteredPool
      : pool;
  const availableWords = fallbackPool.filter((word) => !excludedIds.has(word.id));
  const candidatePool = availableWords.length > 0 ? availableWords : fallbackPool;

  return selectWeightedWord(candidatePool, masteryByWord);
}

function HintLine({
  visible,
  children,
  style,
  pop = false,
  reduceMotion = false
}: {
  visible: boolean;
  children: ReactNode;
  style: object;
  pop?: boolean;
  reduceMotion?: boolean;
}) {
  const opacity = useMemo(() => new Animated.Value(visible ? 1 : 0), []);
  const translateY = useMemo(() => new Animated.Value(visible ? 0 : 6), []);
  const scale = useMemo(() => new Animated.Value(visible ? 1 : 0.92), []);

  useEffect(() => {
    if (visible) {
      if (reduceMotion) {
        opacity.setValue(1);
        translateY.setValue(0);
        scale.setValue(1);
        return;
      }

      opacity.setValue(0);
      translateY.setValue(6);
      scale.setValue(pop ? 0.82 : 1);

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true
        }),
        Animated.spring(scale, {
          toValue: 1,
          damping: 12,
          stiffness: 220,
          mass: 0.55,
          useNativeDriver: true
        })
      ]).start();
      return;
    }

    Animated.timing(opacity, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true
    }).start();
  }, [opacity, pop, reduceMotion, scale, translateY, visible]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.Text
      style={[
        style,
        {
          opacity,
          transform: [{ translateY }, { scale }]
        }
      ]}
    >
      {children}
    </Animated.Text>
  );
}

export default function GameScreen() {
  const { height, width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const todayKey = useMemo(() => getTodayKey(), []);
  const puzzleNumber = useMemo(() => getPuzzleNumber(), []);
  const formattedPuzzleNumber = useMemo(() => formatPuzzleNumber(puzzleNumber), [puzzleNumber]);
  const localDailyPuzzle = useMemo(() => getDailyPuzzle(), []);
  const [dailyPuzzle, setDailyPuzzle] = useState(localDailyPuzzle);
  const [gameMode, setGameMode] = useState<GameMode>("daily");
  const [selectedJLPTLevel, setSelectedJLPTLevel] = useState<JLPTLevel>("N5");
  const [unlimitedWord, setUnlimitedWord] = useState(() => selectRandomWord("N5"));
  const [selectedPracticeCategory, setSelectedPracticeCategory] = useState<PracticeCategory>("all");
  const [masteryByWord, setMasteryByWord] = useState<Record<string, WordMastery>>({});
  const [reviewWeakOnly, setReviewWeakOnly] = useState(false);
  const [seenPracticeWordIds, setSeenPracticeWordIds] = useState<Record<JLPTLevel, string[]>>({
    N5: [],
    N4: [],
    N3: []
  });
  const word = gameMode === "daily" ? dailyPuzzle.word : unlimitedWord;
  const answerChars = useMemo(() => Array.from(word.hiragana), [word.hiragana]);

  const [guesses, setGuesses] = useState<string[]>([]);
  const [results, setResults] = useState<TileStatus[][]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [solved, setSolved] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState("");
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [showRomaji, setShowRomaji] = useState(true);
  const [showDefinitionHint, setShowDefinitionHint] = useState(false);
  const [hintModeEnabled, setHintModeEnabled] = useState(false);
  const [wordsSolved, setWordsSolved] = useState(0);
  const [wordsAttempted, setWordsAttempted] = useState(0);
  const [masteryFeedback, setMasteryFeedback] = useState("");
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const [firebaseUid, setFirebaseUid] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showWelcomeLanding, setShowWelcomeLanding] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>("signIn");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [accountDeleting, setAccountDeleting] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [subscriptionBusy, setSubscriptionBusy] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallError, setPaywallError] = useState<string | null>(null);
  const [pendingPlusAction, setPendingPlusAction] = useState<PendingPlusAction>(null);
  const [showFoundingUserModal, setShowFoundingUserModal] = useState(false);
  const [dailyRemindersEnabled, setDailyRemindersEnabled] = useState(false);
  const [notificationBusy, setNotificationBusy] = useState(false);
  const [notificationPromptEligible, setNotificationPromptEligible] = useState(false);
  const modeSlide = useRef(new Animated.Value(gameMode === "daily" ? 0 : 1)).current;
  const reviewCardFlip = useRef(new Animated.Value(0)).current;
  const reviewCardRevealingRef = useRef(false);
  const previousUidRef = useRef<string | null>(null);
  const isShortScreen = height < 720;
  const maxGuesses = getMaxGuesses(answerChars.length);
  const maxTileSize = maxGuesses === 4 ? (isShortScreen ? 54 : 62) : isShortScreen ? 42 : 48;
  const baseFixedHeight = showRomaji ? (isShortScreen ? 470 : 500) : isShortScreen ? 430 : 460;
  const estimatedFixedHeight = baseFixedHeight + (gameMode === "unlimited" ? 112 : 0);
  const verticalTileLimit = Math.floor(
    (height - estimatedFixedHeight - (maxGuesses - 1) * 8) / maxGuesses
  );
  const horizontalTileLimit = Math.floor((width - 72) / answerChars.length);
  const tileSize = Math.max(
    isShortScreen ? 38 : 42,
    Math.min(maxTileSize, horizontalTileLimit, verticalTileLimit)
  );
  const isReviewFlashcardMode = gameMode === "unlimited" && reviewWeakOnly;
  const reviewWords = useMemo(() => getReviewWords(masteryByWord), [masteryByWord]);
  const wordsById = useMemo(() => {
    const entries = Object.values(wordPools).flat();
    return new Map(entries.map((entry) => [entry.id, entry]));
  }, []);
  const hasReviewWords = reviewWords.length > 0;
  const currentMastery = masteryByWord[word.id];
  const reviewResultLabel =
    currentMastery?.lastResult === "correct"
      ? "Last time: got it right"
      : currentMastery?.lastResult === "incorrect"
        ? "Last time: missed it"
        : "New review card";

  const persistProgress = useCallback(
    async (nextProgress: Omit<DailyProgress, "date" | "wordId">) => {
      await saveProgress(
        {
          date: todayKey,
          wordId: word.id,
          ...nextProgress
        },
        firebaseUid
      );
    },
    [firebaseUid, todayKey, word.id]
  );

  const resetBoard = (preserveMasteryFeedback = false) => {
    setGuesses([]);
    setResults([]);
    setCurrentGuess("");
    setSolved(false);
    setCompleted(false);
    setShowResult(false);
    setShowDefinitionHint(false);
    if (!preserveMasteryFeedback) {
      setMasteryFeedback("");
    }
  };

  const advancePracticeWord = (
    level: JLPTLevel,
    currentWordId?: string,
    nextReviewWeakOnly = reviewWeakOnly,
    nextMasteryByWord = masteryByWord,
    nextPracticeCategory: PracticeCategory = activePracticeCategory
  ) => {
    setSeenPracticeWordIds((seenIdsByLevel) => {
      const pool = wordPools[level].length > 0 ? wordPools[level] : wordPools.N5;
      const eligiblePool = nextReviewWeakOnly ? getReviewWords(nextMasteryByWord) : pool;
      const filteredEligiblePool = filterWordsByPracticeCategory(eligiblePool, nextPracticeCategory);
      if (nextReviewWeakOnly && filteredEligiblePool.length === 0) {
        return seenIdsByLevel;
      }

      const candidateCyclePool = nextReviewWeakOnly
        ? filteredEligiblePool
        : filteredEligiblePool.length > 0
          ? filteredEligiblePool
          : eligiblePool.length > 0
            ? eligiblePool
            : pool;
      const poolIds = new Set(candidateCyclePool.map((entry) => entry.id));
      const seenIds = seenIdsByLevel[level].filter((id) => poolIds.has(id));
      const cycleIsComplete = seenIds.length >= candidateCyclePool.length;
      const excludedWordIds = cycleIsComplete
        ? currentWordId
          ? [currentWordId]
          : []
        : seenIds;
      const nextWord = selectRandomWord(
        level,
        excludedWordIds,
        nextMasteryByWord,
        nextReviewWeakOnly,
        nextPracticeCategory
      );

      setUnlimitedWord(nextWord);

      return {
        ...seenIdsByLevel,
        [level]: cycleIsComplete ? [nextWord.id] : [...seenIds, nextWord.id]
      };
    });
  };

  const recordPracticeResult = (practiceWord: WordEntry, result: "correct" | "incorrect") => {
    setMasteryByWord((currentMastery) => {
      const nextMastery = getNextMastery(currentMastery, practiceWord, result);

      void saveWordMastery(nextMastery, firebaseUid);
      return nextMastery;
    });

    setMasteryFeedback(result === "correct" ? "Mastery +1" : "Added to Review");
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setLoading(true);
      setFirebaseUid(user?.uid ?? null);
      setUserStats(null);
      setStatsError("");
      setGuesses([]);
      setResults([]);
      setCurrentGuess("");
      setSolved(false);
      setCompleted(false);
      setShowResult(false);
      setMasteryByWord({});
      setMasteryFeedback("");
      setWordsSolved(0);
      setWordsAttempted(0);
      setAuthLoading(false);

      if (user) {
        void initUserIfNeeded(user.uid, user.email);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!firebaseUid) {
      previousUidRef.current = null;
      setShowWelcomeLanding(true);
      return;
    }

    if (previousUidRef.current !== firebaseUid) {
      previousUidRef.current = firebaseUid;
      setShowWelcomeLanding(true);
    }
  }, [firebaseUid]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!firebaseUid) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function restoreProgress() {
      try {
        const uid = firebaseUid ?? (await getSignedInUserId());
        const [
          saved,
          savedShowRomaji,
          savedMastery,
          savedPracticeCategory,
          savedDailyRemindersEnabled
        ] = await Promise.all([
          loadProgress(uid),
          loadShowRomajiPreference(),
          loadWordMastery(uid),
          loadPracticeCategory(uid),
          loadDailyRemindersEnabled()
        ]);
        if (!mounted) {
          return;
        }

        if (savedShowRomaji !== null) {
          setShowRomaji(savedShowRomaji);
        }
        if (savedPracticeCategory) {
          setSelectedPracticeCategory(savedPracticeCategory);
        }
        setDailyRemindersEnabled(savedDailyRemindersEnabled);
        setMasteryByWord(savedMastery);

        const syncedDailyPuzzle = uid
          ? await getOrCreateDailyPuzzle(localDailyPuzzle)
          : localDailyPuzzle;

        if (uid) {
          setFirebaseUid(uid);
          await initUserIfNeeded(uid, auth.currentUser?.email);
        }

        setDailyPuzzle(syncedDailyPuzzle);

        if (saved?.date === todayKey && saved.wordId === syncedDailyPuzzle.word.id) {
          setGuesses(saved.guesses);
          setResults(saved.results);
          setSolved(saved.solved);
          setCompleted(saved.completed);
          setShowResult(saved.completed);
          setNotificationPromptEligible(saved.completed);
          if (savedDailyRemindersEnabled) {
            void rescheduleJozuNotifications(
              buildNotificationStatsFromProgress({ completedToday: saved.completed })
            );
          }
        } else if (uid && (await hasPlayedToday(uid, todayKey))) {
          setCompleted(true);
          setShowResult(true);
          setNotificationPromptEligible(true);
          if (savedDailyRemindersEnabled) {
            void rescheduleJozuNotifications(buildNotificationStatsFromProgress({ completedToday: true }));
          }
        } else if (savedDailyRemindersEnabled) {
          void rescheduleJozuNotifications(buildNotificationStatsFromProgress({ completedToday: false }));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    restoreProgress();

    return () => {
      mounted = false;
    };
  }, [authLoading, firebaseUid, localDailyPuzzle, todayKey]);

  useEffect(() => {
    if (!firebaseUid) {
      setSubscriptionStatus(null);
      return;
    }

    let mounted = true;

    async function loadSubscriptionAccess(uid: string) {
      const cachedStatus = await getCachedSubscriptionStatus();

      if (mounted && cachedStatus) {
        setSubscriptionStatus(cachedStatus);
      }

      const entitlements = await migrateLegacyPlusIfEligible(uid);
      const status = await getSubscriptionStatus(uid, entitlements.legacyPlus === true);

      if (mounted) {
        setSubscriptionStatus(status);
        setPaywallError(status.error);
      }
    }

    void loadSubscriptionAccess(firebaseUid);

    return () => {
      mounted = false;
    };
  }, [firebaseUid]);

  const startUnlimitedWord = (level = selectedJLPTLevel, preserveMasteryFeedback = false) => {
    resetBoard(preserveMasteryFeedback);
    advancePracticeWord(level, unlimitedWord.id);
  };

  const openPlusPaywall = (action: PendingPlusAction, message?: string | null) => {
    setPendingPlusAction(action);
    setPaywallError(message ?? subscriptionStatus?.error ?? null);
    setShowPaywall(true);
  };

  const completePendingPlusAction = (action: PendingPlusAction) => {
    if (action === "practice") {
      setGameMode("unlimited");
      setReviewWeakOnly(false);
      resetBoard();
      advancePracticeWord(selectedJLPTLevel, unlimitedWord.id);
      return;
    }

    if (action === "review") {
      setGameMode("unlimited");
      setReviewWeakOnly(true);
      resetBoard();
      advancePracticeWord(selectedJLPTLevel, unlimitedWord.id, true);
    }
  };

  const handlePlusPurchase = async (plan: PlusPlan) => {
    setSubscriptionBusy(true);
    setPaywallError(null);

    const result = await purchasePlusPlan(plan, firebaseUid, legacyPlus);

    setSubscriptionBusy(false);

    if (result.status === "success") {
      setSubscriptionStatus(result.subscriptionStatus);
      setShowPaywall(false);
      completePendingPlusAction(pendingPlusAction);
      setPendingPlusAction(null);
      return;
    }

    if (result.status !== "cancelled") {
      setPaywallError(result.message);
    }
  };

  const handleRestorePurchases = async () => {
    setSubscriptionBusy(true);
    setPaywallError(null);

    const result = await restorePlusPurchases(firebaseUid, legacyPlus);

    setSubscriptionBusy(false);

    if (result.status === "success") {
      setSubscriptionStatus(result.subscriptionStatus);
      setPaywallError("Jozu Plus restored.");
      return;
    }

    setPaywallError(result.message);
  };

  const skipUnlimitedWord = () => {
    if (!completed) {
      setWordsAttempted((value) => value + 1);
      recordPracticeResult(unlimitedWord, "incorrect");
    }

    startUnlimitedWord();
  };

  const handleGameModeChange = (nextGameMode: GameMode) => {
    if (nextGameMode === "unlimited" && !canAccessPlus) {
      openPlusPaywall("practice");
      return;
    }

    setGameMode(nextGameMode);
    resetBoard();

    if (nextGameMode === "daily") {
      void loadProgress(firebaseUid).then((saved) => {
        if (saved?.date === todayKey && saved.wordId === dailyPuzzle.word.id) {
          setGuesses(saved.guesses);
          setResults(saved.results);
          setSolved(saved.solved);
          setCompleted(saved.completed);
          setShowResult(saved.completed);
        } else if (firebaseUid) {
          void hasPlayedToday(firebaseUid, todayKey).then((playedToday) => {
            if (playedToday) {
              setCompleted(true);
              setShowResult(true);
            }
          });
        }
      });
    } else if (nextGameMode === "unlimited") {
      advancePracticeWord(selectedJLPTLevel, unlimitedWord.id);
    }
  };

  const handleJLPTLevelChange = (nextLevel: JLPTLevel) => {
    setSelectedJLPTLevel(nextLevel);
    resetBoard();
    advancePracticeWord(nextLevel, unlimitedWord.id);
  };

  const handlePracticeCategoryChange = (nextCategory: PracticeCategory) => {
    setSelectedPracticeCategory(nextCategory);
    void savePracticeCategory(nextCategory, firebaseUid);
    resetBoard();
    advancePracticeWord(selectedJLPTLevel, unlimitedWord.id, reviewWeakOnly, masteryByWord, nextCategory);
  };

  const handleReviewWeakWordsToggle = () => {
    if (!canAccessPlus) {
      openPlusPaywall("review");
      return;
    }

    const nextReviewWeakOnly = !reviewWeakOnly;
    setReviewWeakOnly(nextReviewWeakOnly);
    resetBoard();
    advancePracticeWord(selectedJLPTLevel, unlimitedWord.id, nextReviewWeakOnly, masteryByWord, activePracticeCategory);
  };

  const revealReviewCard = () => {
    if (!isReviewFlashcardMode || !hasReviewWords || reviewCardRevealingRef.current) {
      return;
    }

    if (reduceMotion) {
      setShowResult(true);
      return;
    }

    reviewCardRevealingRef.current = true;
    reviewCardFlip.setValue(0);
    Animated.timing(reviewCardFlip, {
      toValue: 1,
      duration: 200,
      easing: MOTION.easing,
      useNativeDriver: true
    }).start(({ finished }) => {
      reviewCardRevealingRef.current = false;
      reviewCardFlip.setValue(0);
      if (finished) {
        setShowResult(true);
      }
    });
  };

  const completeReviewCard = (result: "correct" | "incorrect") => {
    setWordsAttempted((value) => value + 1);

    if (result === "correct") {
      setWordsSolved((value) => value + 1);
    }

    const nextMastery = getNextMastery(masteryByWord, word, result);

    setMasteryByWord(nextMastery);
    void saveWordMastery(nextMastery, firebaseUid);
    setMasteryFeedback(result === "correct" ? "Mastery +1" : "Added to Review");
    setShowResult(false);
    resetBoard(true);
    advancePracticeWord(selectedJLPTLevel, word.id, true, nextMastery, activePracticeCategory);
  };

  const reviewCardPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          isReviewFlashcardMode && Math.abs(gestureState.dx) > 18,
        onPanResponderRelease: (_, gestureState) => {
          if (Math.abs(gestureState.dx) > 44) {
            revealReviewCard();
          }
        }
      }),
    [isReviewFlashcardMode, word.id]
  );

  const incorrectGuessCount = guesses.filter((guess) => guess !== word.hiragana).length;
  const showEmojiHint = Boolean(word.hintEmoji) && incorrectGuessCount >= 2 && !solved;
  const showDefinitionTextHint =
    !solved && (showDefinitionHint || incorrectGuessCount >= (word.hintEmoji ? 3 : 2));
  const canTapDefinitionHint = hintModeEnabled || incorrectGuessCount >= 2;
  const showHintButton = !completed && !showDefinitionTextHint && canTapDefinitionHint;
  const categoryLabel = `Category: ${word.category}`;
  const reviewFlashcardAnimatedStyle = {
    opacity: reviewCardFlip.interpolate({
      inputRange: [0, 0.82, 1],
      outputRange: [1, 1, 0.86]
    }),
    transform: [
      { perspective: 900 },
      {
        rotateY: reviewCardFlip.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "88deg"]
        })
      },
      {
        scale: reviewCardFlip.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.96]
        })
      }
    ]
  };
  const definitionText = word.refinedDefinition ?? word.definition;
  const isPoliteVerbForm = word.hiragana.endsWith("ます") || word.hiragana.endsWith("ません");
  const preLaunchLegacyWindow = isBeforePaywallLaunch();
  const canAccessPlus = subscriptionStatus?.canAccessPlus === true || preLaunchLegacyWindow;
  const legacyPlus = subscriptionStatus?.legacyPlus === true || preLaunchLegacyWindow;
  const canUsePracticeCategories = canAccessFeature(subscriptionStatus, "practiceCategories");
  const activePracticeCategory = canUsePracticeCategories ? selectedPracticeCategory : "all";
  const activePracticeCategoryLabel = getPracticeCategoryOption(activePracticeCategory).label;
  const filteredReviewWords = filterWordsByPracticeCategory(reviewWords, activePracticeCategory);
  const hasReviewWordsForActiveCategory = filteredReviewWords.length > 0;
  const reviewProgressIndex = filteredReviewWords.findIndex((entry) => entry.id === word.id);
  const reviewProgress =
    isReviewFlashcardMode && hasReviewWordsForActiveCategory && reviewProgressIndex >= 0
      ? { current: reviewProgressIndex + 1, total: filteredReviewWords.length }
      : undefined;
  const monthlyPlan = subscriptionStatus?.monthlyPlan ?? {
    id: "monthly" as const,
    title: "Monthly",
    productIdentifier: "com.georgesp9.jozu.monthly",
    priceLabel: "$2.99",
    periodLabel: "per month"
  };
  const yearlyPlan = subscriptionStatus?.yearlyPlan ?? {
    id: "yearly" as const,
    title: "Yearly",
    productIdentifier: "com.georgesp9.jozu.yearly",
    priceLabel: "$9.99",
    periodLabel: "per year",
    isBestValue: true
  };

  useEffect(() => {
    const nextModeIndex = gameMode === "daily" ? 0 : gameMode === "unlimited" ? 1 : 2;

    if (reduceMotion) {
      modeSlide.setValue(nextModeIndex);
      return;
    }

    Animated.timing(modeSlide, {
      toValue: nextModeIndex,
      duration: MOTION.base,
      easing: MOTION.easing,
      useNativeDriver: true
    }).start();
  }, [gameMode, modeSlide, reduceMotion]);

  const keyStatuses = useMemo(() => {
    const priority: Record<TileStatus, number> = {
      empty: 0,
      close: 0,
      absent: 1,
      present: 2,
      correct: 3
    };
    const statuses: Record<string, TileStatus> = {};

    guesses.forEach((guess, rowIndex) => {
      Array.from(guess).forEach((kana, columnIndex) => {
        const nextStatus = results[rowIndex]?.[columnIndex];
        const currentStatus = statuses[kana] ?? "empty";

        if (
          nextStatus &&
          nextStatus !== "close" &&
          priority[nextStatus] > priority[currentStatus]
        ) {
          statuses[kana] = nextStatus;
        }
      });
    });

    return statuses;
  }, [guesses, results]);

  const handleModeChange = (nextShowRomaji: boolean) => {
    setShowRomaji(nextShowRomaji);
    void saveShowRomajiPreference(nextShowRomaji);
  };

  const getNotificationStats = useCallback(
    (nextStats = userStats, completedOverride = completed) =>
      buildNotificationStatsFromProgress({
        currentStreak: nextStats?.currentStreak ?? 0,
        bestStreak: nextStats?.bestStreak ?? 0,
        gamesPlayed: nextStats?.totalDailyPlays ?? 0,
        wins: nextStats?.totalWins ?? 0,
        winRate: nextStats?.winRate ?? 0,
        averageGuesses: nextStats?.averageGuesses ?? 0,
        lastPlayedDate: nextStats?.lastPlayedDate ?? null,
        completedToday: completedOverride || Boolean(nextStats?.todayPlay)
      }),
    [completed, userStats]
  );

  const loadStats = useCallback(async () => {
    if (!firebaseUid) {
      return;
    }

    setStatsLoading(true);
    setStatsError("");

    try {
      const nextStats = await getUserStats(firebaseUid, todayKey);
      setUserStats(nextStats);
      if (dailyRemindersEnabled) {
        void rescheduleJozuNotifications(getNotificationStats(nextStats));
      }
    } catch {
      setStatsError("Could not load your Jouzu history right now.");
    } finally {
      setStatsLoading(false);
    }
  }, [dailyRemindersEnabled, firebaseUid, getNotificationStats, todayKey]);

  const openStats = () => {
    setNotificationPromptEligible(true);
    setShowStats(true);
    void loadStats();
  };

  const handleDailyReminderToggle = async (nextEnabled: boolean) => {
    setNotificationBusy(true);

    try {
      if (!nextEnabled) {
        setDailyRemindersEnabled(false);
        await saveDailyRemindersEnabled(false);
        await cancelDailyJozuNotifications();
        return;
      }

      if (!notificationPromptEligible) {
        Alert.alert(
          "Daily reminders",
          "Open your Daily results or complete a Daily puzzle first, then turn reminders on."
        );
        return;
      }

      const granted = await requestJozuNotificationPermission();

      if (!granted) {
        setDailyRemindersEnabled(false);
        await saveDailyRemindersEnabled(false);
        Alert.alert(
          "Notifications are off",
          "You can enable Jozu reminders later from iOS Settings."
        );
        return;
      }

      setDailyRemindersEnabled(true);
      await saveDailyRemindersEnabled(true);
      await rescheduleJozuNotifications(getNotificationStats());
    } catch (error) {
      console.warn("Daily reminder preference update failed.", error);
      Alert.alert("Could not update reminders", "Please try again in a moment.");
    } finally {
      setNotificationBusy(false);
    }
  };

  const handleAuthSubmit = async () => {
    const trimmedEmail = authEmail.trim();
    const emailValidationMessage = getEmailValidationMessage(trimmedEmail);

    if (emailValidationMessage) {
      setAuthError(emailValidationMessage);
      return;
    }

    if (!authPassword) {
      setAuthError("Enter your password.");
      return;
    }

    setAuthSubmitting(true);
    setAuthError("");

    try {
      const uid =
        authMode === "signIn"
          ? await signInWithEmail(trimmedEmail, authPassword)
          : await signUpWithEmail(trimmedEmail, authPassword);

      if (uid) {
        setFirebaseUid(uid);
      }
      setAuthPassword("");
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    const trimmedEmail = authEmail.trim();
    const emailValidationMessage = getEmailValidationMessage(trimmedEmail);

    if (emailValidationMessage) {
      setAuthError(emailValidationMessage);
      return;
    }

    setAuthSubmitting(true);
    setAuthError("");

    try {
      await sendJouzuPasswordReset(trimmedEmail);
      Alert.alert("Check your email", "Password reset instructions are on the way.");
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleSignOut = () => {
    void signOutOfJouzu();
    setShowSettings(false);
    setGuesses([]);
    setResults([]);
    setCurrentGuess("");
    setCompleted(false);
    setSolved(false);
    setShowResult(false);
  };

  const resetToAuthScreen = () => {
    setShowSettings(false);
    setShowStats(false);
    setShowResult(false);
    setGuesses([]);
    setResults([]);
    setCurrentGuess("");
    setCompleted(false);
    setSolved(false);
    setFirebaseUid(null);
    setAuthPassword("");
    setAuthError("");
  };

  const confirmDeleteAccount = async () => {
    setAccountDeleting(true);

    try {
      await deleteCurrentAccount();
      await signOutOfJouzu();
      await clearLocalJouzuData(firebaseUid);
      setMasteryByWord({});
      setShowRomaji(true);
      resetToAuthScreen();
      Alert.alert("Account deleted", "Your account has been permanently deleted.");
    } catch (error) {
      const code =
        typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";

      if (code === "auth/requires-recent-login") {
        await signOutOfJouzu();
        await clearLocalJouzuData(firebaseUid);
        resetToAuthScreen();
        Alert.alert(
          "Log in again",
          "For security reasons, please log in again before deleting your account."
        );
      } else {
        console.warn("Account deletion failed.", error);
        Alert.alert("Could not delete account", "Please try again in a moment.");
      }
    } finally {
      setAccountDeleting(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account?",
      "This will permanently delete your account, streaks, progress, and saved data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Permanently",
          style: "destructive",
          onPress: () => {
            void confirmDeleteAccount();
          }
        }
      ]
    );
  };

  const handleKanaPress = (kana: string) => {
    if (completed || Array.from(currentGuess).length >= answerChars.length) {
      return;
    }

    playInteractionFeedback("kana");
    setCurrentGuess((value) => `${value}${kana}`);
  };

  const handleDelete = () => {
    if (completed) {
      return;
    }

    if (currentGuess) {
      playInteractionFeedback("delete");
    }
    setCurrentGuess((value) => Array.from(value).slice(0, -1).join(""));
  };

  const handleEnter = async () => {
    if (completed) {
      setShowResult(true);
      return;
    }

    const currentChars = Array.from(currentGuess);
    playInteractionFeedback("submit");

    if (currentGuess && !KANA_ONLY.test(currentGuess)) {
      Alert.alert("Kana only", "Use hiragana for this puzzle.");
      return;
    }

    const isCloseAnswer = Boolean(getConfusableWord(word, currentGuess));

    if (currentChars.length !== answerChars.length) {
      Alert.alert("Keep going", `Today's word is ${answerChars.length} kana.`);
      return;
    }

    if (!isCloseAnswer && !acceptedGuesses.has(currentGuess)) {
      setShakeTrigger((value) => value + 1);
      return;
    }

    const evaluated: TileStatus[] = isCloseAnswer
      ? Array.from({ length: currentChars.length }, () => "close")
      : evaluateGuess(currentGuess, word.hiragana);
    const nextGuesses = [...guesses, currentGuess];
    const nextResults = [...results, evaluated];
    const nextSolved = !isCloseAnswer && currentGuess === word.hiragana;
    const nextCompleted = nextSolved || nextGuesses.length === maxGuesses;

    setGuesses(nextGuesses);
    setResults(nextResults);
    setSolved(nextSolved);
    setCompleted(nextCompleted);
    setCurrentGuess("");

    if (nextSolved) {
      playInteractionFeedback(nextGuesses.length === 1 ? "perfect" : "win");
    }

    if (gameMode === "daily") {
      await persistProgress({
        guesses: nextGuesses,
        results: nextResults,
        solved: nextSolved,
        completed: nextCompleted
      });

      if (nextCompleted) {
        setNotificationPromptEligible(true);
        recordPracticeResult(word, nextSolved ? "correct" : "incorrect");
        void saveDailyPlayForCurrentUser({
          date: todayKey,
          wordId: word.id,
          won: nextSolved,
          guessesUsed: nextGuesses.length,
          hintUsed: showDefinitionHint || incorrectGuessCount >= 2
        }).then(() => {
          if (dailyRemindersEnabled) {
            void rescheduleJozuNotifications(getNotificationStats(userStats, true));
          }
          if (showStats) {
            void loadStats();
          }
        });
      }
    } else {
      if (nextCompleted) {
        setWordsAttempted((value) => value + 1);

        if (nextSolved) {
          setWordsSolved((value) => value + 1);
        }

        recordPracticeResult(word, nextSolved ? "correct" : "incorrect");
      }
    }

    if (isCloseAnswer) {
      Alert.alert("Close answer", getCloseAnswerMessage(word, currentGuess), [
        {
          text: "OK",
          onPress: () => {
            if (nextCompleted) {
              setShowResult(true);
            }
          }
        }
      ]);
    } else if (nextCompleted) {
      setShowResult(true);
    }
  };

  const todayStatsWord = userStats?.todayPlay
    ? wordsById.get(userStats.todayPlay.wordId)
    : null;
  const modeIndicatorTranslateX = modeSlide.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, 78, 156]
  });
  const enterDailyFromWelcome = () => {
    setShowWelcomeLanding(false);
    handleGameModeChange("daily");
  };
  const enterPracticeFromWelcome = () => {
    setShowWelcomeLanding(false);
    handleGameModeChange("unlimited");
  };
  const enterRushFromWelcome = () => {
    setShowWelcomeLanding(false);
    handleGameModeChange("rush");
  };

  if (authLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.authContainer}>
          <Text style={styles.authTitle}>Jozu</Text>
          <Text style={styles.authSubtitle}>Loading your account...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!firebaseUid) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.authContainer}>
          <View style={styles.authCard}>
            <Text style={styles.authTitle}>Jozu</Text>
            <Text style={styles.authSubtitle}>Sign in to save your progress.</Text>
            <View style={styles.authToggle} accessibilityLabel="Authentication mode">
              <Pressable
                onPress={() => {
                  setAuthMode("signIn");
                  setAuthError("");
                }}
                style={[styles.authToggleSegment, authMode === "signIn" && styles.activeSegment]}
              >
                <Text style={[styles.authToggleText, authMode === "signIn" && styles.activeSegmentText]}>
                  Sign In
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setAuthMode("signUp");
                  setAuthError("");
                }}
                style={[styles.authToggleSegment, authMode === "signUp" && styles.activeSegment]}
              >
                <Text style={[styles.authToggleText, authMode === "signUp" && styles.activeSegmentText]}>
                  Create
                </Text>
              </Pressable>
            </View>
            <TextInput
              value={authEmail}
              onChangeText={setAuthEmail}
              placeholder="Email"
              placeholderTextColor="#9b9082"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              style={styles.authInput}
            />
            <TextInput
              value={authPassword}
              onChangeText={setAuthPassword}
              placeholder="Password"
              placeholderTextColor="#9b9082"
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              textContentType={authMode === "signIn" ? "password" : "newPassword"}
              style={styles.authInput}
            />
            {authError ? <Text style={styles.authError}>{authError}</Text> : null}
            <Pressable
              onPress={handleAuthSubmit}
              disabled={authSubmitting}
              style={[styles.authSubmitButton, authSubmitting && styles.disabledAuthButton]}
            >
              <Text style={styles.authSubmitText}>
                {authSubmitting ? "Working..." : authMode === "signIn" ? "Sign In" : "Create Account"}
              </Text>
            </Pressable>
            {authMode === "signIn" ? (
              <Pressable onPress={handlePasswordReset} disabled={authSubmitting}>
                <Text style={styles.authLinkText}>Forgot password?</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (showWelcomeLanding) {
    return (
      <WelcomeLandingScreen
        currentStreak={userStats?.currentStreak}
        onStartDaily={enterDailyFromWelcome}
        onStartPractice={enterPracticeFromWelcome}
        onStartRush={enterRushFromWelcome}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, isShortScreen && styles.shortContainer]}>
        <View style={styles.topBar}>
          <View style={styles.modeControl} accessibilityLabel="Game mode">
            <Animated.View
              pointerEvents="none"
              style={[
                styles.modeActiveIndicator,
                { transform: [{ translateX: modeIndicatorTranslateX }] }
              ]}
            />
            <Pressable
              onPress={() => handleGameModeChange("daily")}
              style={styles.modeSegment}
            >
              <Text style={[styles.modeSegmentText, gameMode === "daily" && styles.activeSegmentText]}>
                Daily
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleGameModeChange("unlimited")}
              style={styles.modeSegment}
            >
              <Text
                style={[styles.modeSegmentText, gameMode === "unlimited" && styles.activeSegmentText]}
              >
                Practice
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleGameModeChange("rush")}
              style={styles.modeSegment}
            >
              <Text
                style={[styles.modeSegmentText, gameMode === "rush" && styles.activeSegmentText]}
              >
                Rush
              </Text>
            </Pressable>
          </View>
          <View style={styles.iconCluster}>
            <FoundingUserBadge
              visible={legacyPlus}
              modalVisible={showFoundingUserModal}
              onPress={() => setShowFoundingUserModal(true)}
              onClose={() => setShowFoundingUserModal(false)}
            />
            {gameMode === "daily" ? (
              <Pressable
                onPress={openStats}
                style={styles.statsButton}
                accessibilityRole="button"
                accessibilityLabel="Open daily stats"
              >
                <Text style={styles.statsIcon}>📊</Text>
              </Pressable>
            ) : null}
            {gameMode === "unlimited" ? (
              <Pressable
                onPress={handleReviewWeakWordsToggle}
                style={[styles.reviewIconButton, reviewWeakOnly && styles.activeReviewIconButton]}
                accessibilityRole="button"
                accessibilityLabel={reviewWeakOnly ? "Show all practice words" : "Review weak words"}
              >
                <Text
                  style={[
                    styles.reviewIcon,
                    reviewWeakOnly && styles.activeReviewIcon
                  ]}
                >
                  📝
                </Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => setShowSettings(true)}
              style={styles.settingsButton}
              accessibilityRole="button"
              accessibilityLabel="Open settings"
            >
              <Text style={styles.settingsIcon}>⚙</Text>
            </Pressable>
          </View>
        </View>

        {gameMode !== "rush" ? (
          <View style={[styles.header, isShortScreen && styles.shortHeader]}>
            <Text
              style={[
                styles.title,
                gameMode === "unlimited" && styles.practiceTitle,
                isShortScreen && styles.shortTitle
              ]}
            >
              {gameMode === "daily" ? "Jozu" : reviewWeakOnly ? "Review Practice" : "Unlimited Practice"}
            </Text>
            <Text style={styles.kicker}>
              {gameMode === "daily"
                ? `Daily Hiragana Puzzle #${formattedPuzzleNumber} · ${dailyPuzzle.jlptLevel}`
                : reviewWeakOnly
                  ? hasReviewWords
                    ? `${activePracticeCategoryLabel} · ${filteredReviewWords.length}`
                    : "No missed words yet"
                  : `${activePracticeCategoryLabel} · ${word.jlpt}`}
            </Text>
          </View>
        ) : null}

        {gameMode === "unlimited" ? (
          <View style={styles.practicePanel}>
            <Text style={styles.practiceStats}>
              Solved {wordsSolved} · Accuracy{" "}
              {wordsAttempted > 0
                ? `${Math.round((wordsSolved / wordsAttempted) * 100)}%`
                : "0%"}
            </Text>
            {masteryFeedback ? <Text style={styles.masteryFeedback}>{masteryFeedback}</Text> : null}
          </View>
        ) : null}

        {gameMode === "rush" ? (
          <KanaRushScreen acceptedWords={kanaRushWordSet} />
        ) : isReviewFlashcardMode && !hasReviewWordsForActiveCategory ? (
          <View style={styles.flashcard}>
            <Text style={styles.flashcardIcon}>📝</Text>
            <Text style={styles.flashcardTitle}>{hasReviewWords ? "No Cards Here" : "All Clear"}</Text>
            <Text style={styles.flashcardCategory}>
              {hasReviewWords
                ? `${activePracticeCategoryLabel} has no review words yet.`
                : "Missed words will appear here."}
            </Text>
            <Text style={styles.flashcardMeta}>
              {hasReviewWords
                ? "Choose another category or miss a word in this category."
                : "Fail, skip, or miss a Daily or Practice word to add it to review."}
            </Text>
          </View>
        ) : isReviewFlashcardMode ? (
          <AnimatedPressable
            onPress={revealReviewCard}
            style={[styles.flashcard, reviewFlashcardAnimatedStyle]}
            accessibilityRole="button"
            accessibilityLabel="Reveal review card"
            {...reviewCardPanResponder.panHandlers}
          >
            <Text style={styles.flashcardIcon}>{word.hintEmoji ?? "📝"}</Text>
            <Text style={styles.flashcardTitle}>Review Card</Text>
            <Text style={styles.flashcardCategory}>{categoryLabel}</Text>
            <Text style={styles.flashcardMeta}>
              Mastery {getMasteryLevel(masteryByWord, word.id)} · {reviewResultLabel}
            </Text>
            <Text style={styles.flashcardInstruction}>Tap or swipe to reveal</Text>
          </AnimatedPressable>
        ) : (
          <>
            <GameGrid
              answerLength={answerChars.length}
              maxGuesses={maxGuesses}
              guesses={guesses}
              currentGuess={currentGuess}
              results={results}
              showRomaji={showRomaji}
              shakeTrigger={shakeTrigger}
              solved={solved}
              reduceMotion={reduceMotion}
              tileSize={tileSize}
            />

            <View style={[styles.hintBox, isShortScreen && styles.shortHintBox]}>
              <Text style={styles.categoryText}>{categoryLabel}</Text>
              {isPoliteVerbForm && !completed ? (
                <Text style={styles.formHintText}>Polite form</Text>
              ) : null}
              <HintLine
                visible={showEmojiHint}
                style={styles.emojiHintText}
                pop
                reduceMotion={reduceMotion}
              >
                {word.hintEmoji}
              </HintLine>
              <HintLine
                visible={showDefinitionTextHint}
                style={styles.definitionHintText}
                reduceMotion={reduceMotion}
              >
                {definitionText}
              </HintLine>
              {showHintButton || gameMode === "unlimited" ? (
                <View style={styles.hintActions}>
                  {showHintButton ? (
                    <Pressable onPress={() => setShowDefinitionHint(true)} style={styles.hintButton}>
                      <Text style={styles.hintButtonText}>Hint</Text>
                    </Pressable>
                  ) : null}
                  {gameMode === "unlimited" ? (
                    <Pressable onPress={skipUnlimitedWord} style={styles.hintButton}>
                      <Text style={styles.hintButtonText}>New Word</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
              {completed ? (
                <Text style={styles.hintText}>
                  {gameMode === "daily" ? "Come back tomorrow." : "Tap New Word to keep practicing."}
                </Text>
              ) : null}
            </View>

            <KanaKeyboard
              onKanaPress={handleKanaPress}
              onEnter={handleEnter}
              onDelete={handleDelete}
              keyStatuses={keyStatuses}
              showRomaji={showRomaji}
              disabled={loading}
              compact={isShortScreen || maxGuesses === 6}
            />
          </>
        )}
      </View>

      <ResultModal
        visible={showResult}
        word={word}
        puzzleNumber={puzzleNumber}
        guessCount={guesses.length}
        maxGuesses={maxGuesses}
        solved={solved}
        results={results}
        isPerfectSolve={solved && guesses.length === 1}
        onClose={() => setShowResult(false)}
        reviewMode={isReviewFlashcardMode}
        onReviewCorrect={() => completeReviewCard("correct")}
        onReviewIncorrect={() => completeReviewCard("incorrect")}
        reviewProgress={reviewProgress}
      />

      <PaywallModal
        visible={showPaywall}
        monthlyPlan={monthlyPlan}
        yearlyPlan={yearlyPlan}
        loading={subscriptionBusy}
        error={paywallError}
        onClose={() => {
          setShowPaywall(false);
          setPendingPlusAction(null);
        }}
        onPurchase={handlePlusPurchase}
        onRestore={handleRestorePurchases}
      />

      <Modal
        visible={showStats}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStats(false)}
      >
        <Pressable style={styles.statsBackdrop} onPress={() => setShowStats(false)}>
          <Pressable style={styles.statsMenu} onPress={(event) => event.stopPropagation()}>
            <View style={styles.statsHeader}>
              <View>
                <Text style={styles.statsTitle}>Daily Results</Text>
                <Text style={styles.statsSubtitle}>Your Jozu history</Text>
              </View>
              <Pressable
                onPress={loadStats}
                style={styles.statsRefreshButton}
                accessibilityRole="button"
                accessibilityLabel="Refresh stats"
              >
                <Text style={styles.statsRefreshText}>↻</Text>
              </Pressable>
            </View>

            {statsLoading ? (
              <Text style={styles.statsMessage}>Loading your progress...</Text>
            ) : statsError ? (
              <Text style={styles.statsMessage}>{statsError}</Text>
            ) : userStats ? (
              <>
                <View style={styles.statsSection}>
                  <Text style={styles.statsSectionTitle}>Today</Text>
                  {userStats.todayPlay ? (
                    <View style={styles.todayResultBox}>
                      <View style={styles.todayResultHeader}>
                        <Text style={styles.todayResultStatus}>
                          {userStats.todayPlay.won ? "Completed · Won" : "Completed · Lost"}
                        </Text>
                        <Text style={styles.todayResultDate}>
                          {formatCompletedAt(userStats.todayPlay.completedAt)}
                        </Text>
                      </View>
                      <View style={styles.statsLine}>
                        <Text style={styles.statsLineLabel}>Guesses</Text>
                        <Text style={styles.statsLineValue}>{userStats.todayPlay.guessesUsed}</Text>
                      </View>
                      <View style={styles.statsLine}>
                        <Text style={styles.statsLineLabel}>Hint used</Text>
                        <Text style={styles.statsLineValue}>
                          {userStats.todayPlay.hintUsed ? "Yes" : "No"}
                        </Text>
                      </View>
                      <View style={styles.statsLine}>
                        <Text style={styles.statsLineLabel}>Word</Text>
                        <Text style={styles.statsLineValue}>
                          {todayStatsWord
                            ? `${todayStatsWord.hiragana} · ${todayStatsWord.english}`
                            : userStats.todayPlay.wordId}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.statsEmptyText}>
                      Play today's word to start building your Jozu history.
                    </Text>
                  )}
                </View>

                <View style={styles.statsSection}>
                  <Text style={styles.statsSectionTitle}>Progress</Text>
                  <View style={styles.statsGrid}>
                    <View style={styles.statCell}>
                      <Text style={styles.statValue}>{userStats.currentStreak}</Text>
                      <Text style={styles.statLabel}>Current</Text>
                    </View>
                    <View style={styles.statCell}>
                      <Text style={styles.statValue}>{userStats.bestStreak}</Text>
                      <Text style={styles.statLabel}>Best</Text>
                    </View>
                    <View style={styles.statCell}>
                      <Text style={styles.statValue}>{userStats.totalDailyPlays}</Text>
                      <Text style={styles.statLabel}>Plays</Text>
                    </View>
                    <View style={styles.statCell}>
                      <Text style={styles.statValue}>{userStats.totalWins}</Text>
                      <Text style={styles.statLabel}>Wins</Text>
                    </View>
                    <View style={styles.statCell}>
                      <Text style={styles.statValue}>{userStats.winRate}%</Text>
                      <Text style={styles.statLabel}>Win rate</Text>
                    </View>
                    <View style={styles.statCell}>
                      <Text style={styles.statValue}>
                        {formatStatValue(userStats.averageGuesses)}
                      </Text>
                      <Text style={styles.statLabel}>Avg guesses</Text>
                    </View>
                  </View>
                </View>
              </>
            ) : (
              <Text style={styles.statsMessage}>Open your Daily results after signing in.</Text>
            )}

            <Pressable onPress={() => setShowStats(false)} style={styles.statsCloseButton}>
              <Text style={styles.statsCloseText}>Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showSettings}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSettings(false)}
      >
        <Pressable style={styles.settingsBackdrop} onPress={() => setShowSettings(false)}>
          <Pressable style={styles.settingsMenu} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.settingsTitle}>Settings</Text>
            <Text style={styles.settingsLabel}>Display</Text>
            <View
              style={[styles.segmentedControl, styles.settingsSegmentedControl]}
              accessibilityLabel="Display mode"
            >
              <Pressable
                onPress={() => handleModeChange(false)}
                style={[styles.segment, styles.settingsSegment, !showRomaji && styles.activeSegment]}
              >
                <Text style={[styles.segmentText, !showRomaji && styles.activeSegmentText]}>
                  Kana
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleModeChange(true)}
                style={[styles.segment, styles.settingsSegment, showRomaji && styles.activeSegment]}
              >
                <Text style={[styles.segmentText, showRomaji && styles.activeSegmentText]}>
                  Romaji
                </Text>
              </Pressable>
            </View>
            <Text style={styles.settingsLabel}>Difficulty</Text>
            <View
              style={[styles.segmentedControl, styles.settingsSegmentedControl]}
              accessibilityLabel="Hint mode"
            >
              <Pressable
                onPress={() => setHintModeEnabled(false)}
                style={[styles.segment, styles.settingsSegment, !hintModeEnabled && styles.activeSegment]}
              >
                <Text style={[styles.segmentText, !hintModeEnabled && styles.activeSegmentText]}>
                  Earned
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setHintModeEnabled(true)}
                style={[styles.segment, styles.settingsSegment, hintModeEnabled && styles.activeSegment]}
              >
                <Text style={[styles.segmentText, hintModeEnabled && styles.activeSegmentText]}>
                  Hints
                </Text>
              </Pressable>
            </View>
            <Text style={styles.settingsLabel}>Daily Reminders</Text>
            <View
              style={[styles.segmentedControl, styles.settingsSegmentedControl]}
              accessibilityLabel="Daily reminders"
            >
              <Pressable
                onPress={() => void handleDailyReminderToggle(false)}
                disabled={notificationBusy}
                style={[
                  styles.segment,
                  styles.settingsSegment,
                  !dailyRemindersEnabled && styles.activeSegment,
                  notificationBusy && styles.disabledSegment
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    !dailyRemindersEnabled && styles.activeSegmentText
                  ]}
                >
                  Off
                </Text>
              </Pressable>
              <Pressable
                onPress={() => void handleDailyReminderToggle(true)}
                disabled={notificationBusy}
                style={[
                  styles.segment,
                  styles.settingsSegment,
                  dailyRemindersEnabled && styles.activeSegment,
                  notificationBusy && styles.disabledSegment
                ]}
              >
                <Text
                  style={[styles.segmentText, dailyRemindersEnabled && styles.activeSegmentText]}
                >
                  On
                </Text>
              </Pressable>
            </View>
            {gameMode === "unlimited" ? (
              <>
                <Text style={styles.settingsLabel}>Category</Text>
                <View style={styles.categorySelector} accessibilityLabel="Practice category">
                  {PRACTICE_CATEGORY_OPTIONS.map((category) => (
                    <Pressable
                      key={category.id}
                      onPress={() => handlePracticeCategoryChange(category.id)}
                      style={[
                        styles.categoryButton,
                        activePracticeCategory === category.id && styles.activeCategoryButton
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryButtonText,
                          activePracticeCategory === category.id && styles.activeCategoryButtonText
                        ]}
                      >
                        {category.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.settingsLabel}>Practice Level</Text>
                <View style={styles.levelSelector} accessibilityLabel="JLPT level">
                  {(["N5", "N4", "N3"] as JLPTLevel[]).map((level) => (
                    <Pressable
                      key={level}
                      onPress={() => handleJLPTLevelChange(level)}
                      style={[styles.levelButton, selectedJLPTLevel === level && styles.activeLevelButton]}
                    >
                      <Text
                        style={[
                          styles.levelButtonText,
                          selectedJLPTLevel === level && styles.activeLevelButtonText
                        ]}
                      >
                        {level}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}
            <Text style={styles.settingsLabel}>Account</Text>
            <Text style={styles.accountText}>{auth.currentUser?.email ?? "Signed in"}</Text>
            <Pressable onPress={handleSignOut} style={styles.signOutButton}>
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </Pressable>
            <Pressable
              onPress={handleDeleteAccount}
              disabled={accountDeleting}
              style={[styles.deleteAccountButton, accountDeleting && styles.disabledDeleteAccountButton]}
            >
              <Text style={styles.deleteAccountButtonText}>
                {accountDeleting ? "Deleting..." : "Delete Account"}
              </Text>
            </Pressable>
            <Pressable onPress={() => setShowSettings(false)} style={styles.settingsCloseButton}>
              <Text style={styles.settingsCloseText}>Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f2ea"
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 7,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 4
  },
  shortContainer: {
    gap: 4,
    paddingTop: 4,
    paddingBottom: 2
  },
  authContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24
  },
  authCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ded6ca",
    backgroundColor: "#fffdf8",
    padding: 18,
    gap: 12
  },
  authTitle: {
    color: "#25231f",
    fontSize: 38,
    fontWeight: "900",
    textAlign: "center"
  },
  authSubtitle: {
    color: "#817565",
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center"
  },
  authToggle: {
    flexDirection: "row",
    borderWidth: 2,
    borderColor: "#ded6ca",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#fffdf8"
  },
  authToggleSegment: {
    flex: 1,
    height: 38,
    alignItems: "center",
    justifyContent: "center"
  },
  authToggleText: {
    color: "#7b6f60",
    fontSize: 14,
    fontWeight: "900"
  },
  authInput: {
    height: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ded6ca",
    backgroundColor: "#f7f2ea",
    color: "#25231f",
    fontSize: 16,
    fontWeight: "700",
    paddingHorizontal: 12
  },
  authError: {
    color: "#9b3d35",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
    textAlign: "center"
  },
  authSubmitButton: {
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2f4f4a"
  },
  disabledAuthButton: {
    opacity: 0.65
  },
  authSubmitText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900"
  },
  authLinkText: {
    color: "#2f4f4a",
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center"
  },
  topBar: {
    width: "100%",
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8
  },
  settingsButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e9e0d2"
  },
  iconCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  statsButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e9e0d2"
  },
  settingsIcon: {
    color: "#2b2a27",
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 24
  },
  statsIcon: {
    color: "#2b2a27",
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 24
  },
  reviewIconButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e9e0d2"
  },
  activeReviewIconButton: {
    backgroundColor: "#2f4f4a"
  },
  reviewIcon: {
    color: "#2b2a27",
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 26
  },
  activeReviewIcon: {
    color: "#ffffff"
  },
  segmentedControl: {
    flexDirection: "row",
    borderWidth: 2,
    borderColor: "#ded6ca",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#fffdf8"
  },
  settingsSegmentedControl: {
    width: "100%"
  },
  segment: {
    minWidth: 72,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12
  },
  settingsSegment: {
    flex: 1,
    minWidth: 0
  },
  activeSegment: {
    backgroundColor: "#2f4f4a"
  },
  disabledSegment: {
    opacity: 0.55
  },
  segmentText: {
    color: "#7b6f60",
    fontSize: 14,
    fontWeight: "800"
  },
  activeSegmentText: {
    color: "#ffffff"
  },
  modeControl: {
    flexDirection: "row",
    borderWidth: 2,
    borderColor: "#ded6ca",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#fffdf8",
    position: "relative"
  },
  modeActiveIndicator: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 78,
    backgroundColor: "#2f4f4a"
  },
  modeSegment: {
    width: 78,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 9,
    zIndex: 1
  },
  modeSegmentText: {
    color: "#7b6f60",
    fontSize: 13,
    fontWeight: "800"
  },
  header: {
    alignItems: "center",
    gap: 3,
    marginTop: 2
  },
  shortHeader: {
    gap: 2,
    marginTop: 0
  },
  title: {
    color: "#25231f",
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 38
  },
  practiceTitle: {
    fontSize: 30,
    lineHeight: 34
  },
  shortTitle: {
    fontSize: 30,
    lineHeight: 34
  },
  kicker: {
    color: "#817565",
    fontSize: 12,
    fontWeight: "700",
    paddingTop: 2
  },
  practicePanel: {
    width: "100%",
    alignItems: "center",
    gap: 5
  },
  levelSelector: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8
  },
  categorySelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7
  },
  categoryButton: {
    minHeight: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ded6ca",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    backgroundColor: "#fffdf8"
  },
  activeCategoryButton: {
    borderColor: "#2f4f4a",
    backgroundColor: "#e9f0eb"
  },
  categoryButtonText: {
    color: "#5d5448",
    fontSize: 12,
    fontWeight: "900"
  },
  activeCategoryButtonText: {
    color: "#2f4f4a"
  },
  levelButton: {
    minWidth: 56,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e9e0d2"
  },
  activeLevelButton: {
    backgroundColor: "#2f4f4a"
  },
  levelButtonText: {
    color: "#5d5448",
    fontSize: 14,
    fontWeight: "900"
  },
  activeLevelButtonText: {
    color: "#ffffff"
  },
  practiceStats: {
    color: "#817565",
    fontSize: 12,
    fontWeight: "800"
  },
  masteryFeedback: {
    color: "#2f4f4a",
    fontSize: 13,
    fontWeight: "900"
  },
  flashcard: {
    width: "86%",
    maxWidth: 360,
    minHeight: 310,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#ded6ca",
    backgroundColor: "#fffdf8",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 22,
    marginTop: 12
  },
  flashcardIcon: {
    fontSize: 54,
    lineHeight: 62
  },
  flashcardTitle: {
    color: "#25231f",
    fontSize: 26,
    fontWeight: "900"
  },
  flashcardCategory: {
    color: "#5d5448",
    fontSize: 16,
    fontWeight: "900"
  },
  flashcardMeta: {
    color: "#817565",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center"
  },
  flashcardInstruction: {
    color: "#2f4f4a",
    fontSize: 14,
    fontWeight: "900",
    paddingTop: 8
  },
  hintBox: {
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    marginTop: -2
  },
  shortHintBox: {
    minHeight: 50,
    marginTop: -3
  },
  categoryText: {
    color: "#817565",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 15
  },
  formHintText: {
    color: "#2f4f4a",
    fontSize: 11,
    fontWeight: "900",
    lineHeight: 14,
    textTransform: "uppercase"
  },
  hintText: {
    color: "#5d5448",
    fontSize: 14,
    fontWeight: "800"
  },
  emojiHintText: {
    fontSize: 22,
    lineHeight: 26
  },
  definitionHintText: {
    maxWidth: 300,
    color: "#5d5448",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
    textAlign: "center"
  },
  hintActions: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginTop: 2
  },
  hintButton: {
    minWidth: 108,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#cbbfad",
    backgroundColor: "#fffdf8",
    paddingHorizontal: 14
  },
  hintButtonText: {
    color: "#2f4f4a",
    fontSize: 13,
    fontWeight: "900"
  },
  statsBackdrop: {
    flex: 1,
    backgroundColor: "rgba(28, 27, 24, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18
  },
  statsMenu: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ded6ca",
    backgroundColor: "#fffdf8",
    padding: 16,
    gap: 14
  },
  statsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  statsTitle: {
    color: "#25231f",
    fontSize: 22,
    fontWeight: "900"
  },
  statsSubtitle: {
    color: "#817565",
    fontSize: 12,
    fontWeight: "800"
  },
  statsRefreshButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e9e0d2"
  },
  statsRefreshText: {
    color: "#2f4f4a",
    fontSize: 18,
    fontWeight: "900"
  },
  statsSection: {
    gap: 8
  },
  statsSectionTitle: {
    color: "#817565",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  todayResultBox: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ded6ca",
    backgroundColor: "#f7f2ea",
    padding: 12,
    gap: 7
  },
  todayResultHeader: {
    gap: 2
  },
  todayResultStatus: {
    color: "#25231f",
    fontSize: 16,
    fontWeight: "900"
  },
  todayResultDate: {
    color: "#817565",
    fontSize: 12,
    fontWeight: "800"
  },
  statsLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  statsLineLabel: {
    color: "#817565",
    fontSize: 13,
    fontWeight: "800"
  },
  statsLineValue: {
    flex: 1,
    color: "#2b2a27",
    fontSize: 13,
    fontWeight: "900",
    textAlign: "right"
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  statCell: {
    width: "31%",
    minWidth: 94,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ded6ca",
    backgroundColor: "#f7f2ea",
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 2
  },
  statValue: {
    color: "#2f4f4a",
    fontSize: 21,
    fontWeight: "900"
  },
  statLabel: {
    color: "#817565",
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center"
  },
  statsMessage: {
    color: "#5d5448",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
    textAlign: "center",
    paddingVertical: 18
  },
  statsEmptyText: {
    color: "#5d5448",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20
  },
  statsCloseButton: {
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2f4f4a"
  },
  statsCloseText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900"
  },
  settingsBackdrop: {
    flex: 1,
    backgroundColor: "rgba(28, 27, 24, 0.25)",
    alignItems: "flex-end",
    justifyContent: "flex-start",
    paddingHorizontal: 18,
    paddingTop: 64
  },
  settingsMenu: {
    width: 236,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ded6ca",
    backgroundColor: "#fffdf8",
    padding: 14,
    gap: 10
  },
  settingsTitle: {
    color: "#25231f",
    fontSize: 18,
    fontWeight: "900"
  },
  settingsLabel: {
    color: "#817565",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  settingsCloseButton: {
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2f4f4a"
  },
  settingsCloseText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900"
  },
  accountText: {
    color: "#5d5448",
    fontSize: 13,
    fontWeight: "800"
  },
  signOutButton: {
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#cbbfad",
    backgroundColor: "#fffdf8"
  },
  signOutButtonText: {
    color: "#2f4f4a",
    fontSize: 13,
    fontWeight: "900"
  },
  deleteAccountButton: {
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#b94a48",
    backgroundColor: "#fff6f4"
  },
  disabledDeleteAccountButton: {
    opacity: 0.58
  },
  deleteAccountButtonText: {
    color: "#9b3d35",
    fontSize: 13,
    fontWeight: "900"
  },
});
