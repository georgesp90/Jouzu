import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
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
import { acceptedGuesses } from "@/data/acceptedGuesses";
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
  saveDailyPlayForCurrentUser,
  sendJouzuPasswordReset,
  signInWithEmail,
  signOutOfJouzu,
  signUpWithEmail
} from "@/firebase/services";
import { DailyProgress, JLPTLevel, TileStatus, WordEntry, WordMastery } from "@/types/game";
import { evaluateGuess } from "@/utils/evaluateGuess";
import { getDailyPuzzle } from "@/utils/getDailyPuzzle";
import { getPuzzleNumber, getTodayKey } from "@/utils/getWordOfTheDay";
import {
  clearLocalJouzuData,
  loadProgress,
  loadShowRomajiPreference,
  loadWordMastery,
  saveProgress,
  saveShowRomajiPreference,
  saveWordMastery
} from "@/utils/storage";

const KANA_ONLY = /^[\u3040-\u309f]+$/;
type GameMode = "daily" | "unlimited";
type AuthMode = "signIn" | "signUp";

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
  reviewWeakOnly = false
): WordEntry {
  const pool = wordPools[level].length > 0 ? wordPools[level] : wordPools.N5;
  const excludedIds = new Set(excludedWordIds);
  const levelPool = reviewWeakOnly ? getReviewWords(masteryByWord) : pool;
  const fallbackPool = levelPool.length > 0 ? levelPool : pool;
  const availableWords = fallbackPool.filter((word) => !excludedIds.has(word.id));
  const candidatePool = availableWords.length > 0 ? availableWords : fallbackPool;

  return selectWeightedWord(candidatePool, masteryByWord);
}

function HintLine({
  visible,
  children,
  style
}: {
  visible: boolean;
  children: ReactNode;
  style: object;
}) {
  const opacity = useMemo(() => new Animated.Value(visible ? 1 : 0), []);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 180,
      useNativeDriver: true
    }).start();
  }, [opacity, visible]);

  if (!visible) {
    return null;
  }

  return <Animated.Text style={[style, { opacity }]}>{children}</Animated.Text>;
}

export default function GameScreen() {
  const { height, width } = useWindowDimensions();
  const todayKey = useMemo(() => getTodayKey(), []);
  const puzzleNumber = useMemo(() => getPuzzleNumber(), []);
  const localDailyPuzzle = useMemo(() => getDailyPuzzle(), []);
  const [dailyPuzzle, setDailyPuzzle] = useState(localDailyPuzzle);
  const [gameMode, setGameMode] = useState<GameMode>("daily");
  const [selectedJLPTLevel, setSelectedJLPTLevel] = useState<JLPTLevel>("N5");
  const [unlimitedWord, setUnlimitedWord] = useState(() => selectRandomWord("N5"));
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
  const [showHelp, setShowHelp] = useState(false);
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
  const [authMode, setAuthMode] = useState<AuthMode>("signIn");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [accountDeleting, setAccountDeleting] = useState(false);
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
    nextMasteryByWord = masteryByWord
  ) => {
    setSeenPracticeWordIds((seenIdsByLevel) => {
      const pool = wordPools[level].length > 0 ? wordPools[level] : wordPools.N5;
      const eligiblePool = nextReviewWeakOnly ? getReviewWords(nextMasteryByWord) : pool;
      const candidateCyclePool = eligiblePool.length > 0 ? eligiblePool : pool;
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
        nextReviewWeakOnly
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
        const [saved, savedShowRomaji, savedMastery] = await Promise.all([
          loadProgress(uid),
          loadShowRomajiPreference(),
          loadWordMastery(uid)
        ]);
        if (!mounted) {
          return;
        }

        if (savedShowRomaji !== null) {
          setShowRomaji(savedShowRomaji);
        }
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
        } else if (uid && (await hasPlayedToday(uid, todayKey))) {
          setCompleted(true);
          setShowResult(true);
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

  const startUnlimitedWord = (level = selectedJLPTLevel, preserveMasteryFeedback = false) => {
    resetBoard(preserveMasteryFeedback);
    advancePracticeWord(level, unlimitedWord.id);
  };

  const skipUnlimitedWord = () => {
    if (!completed) {
      setWordsAttempted((value) => value + 1);
      recordPracticeResult(unlimitedWord, "incorrect");
    }

    startUnlimitedWord();
  };

  const handleGameModeChange = (nextGameMode: GameMode) => {
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
    } else {
      advancePracticeWord(selectedJLPTLevel, unlimitedWord.id);
    }
  };

  const handleJLPTLevelChange = (nextLevel: JLPTLevel) => {
    setSelectedJLPTLevel(nextLevel);
    resetBoard();
    advancePracticeWord(nextLevel, unlimitedWord.id);
  };

  const handleReviewWeakWordsToggle = () => {
    const nextReviewWeakOnly = !reviewWeakOnly;
    setReviewWeakOnly(nextReviewWeakOnly);
    resetBoard();
    advancePracticeWord(selectedJLPTLevel, unlimitedWord.id, nextReviewWeakOnly);
  };

  const revealReviewCard = () => {
    if (isReviewFlashcardMode && hasReviewWords) {
      setShowResult(true);
    }
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
    advancePracticeWord(selectedJLPTLevel, word.id, true, nextMastery);
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
  const categoryLabel = `Category: ${word.category}`;
  const definitionText = word.refinedDefinition ?? word.definition;
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

  const loadStats = useCallback(async () => {
    if (!firebaseUid) {
      return;
    }

    setStatsLoading(true);
    setStatsError("");

    try {
      const nextStats = await getUserStats(firebaseUid, todayKey);
      setUserStats(nextStats);
    } catch {
      setStatsError("Could not load your Jouzu history right now.");
    } finally {
      setStatsLoading(false);
    }
  }, [firebaseUid, todayKey]);

  const openStats = () => {
    setShowStats(true);
    void loadStats();
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

    setCurrentGuess((value) => `${value}${kana}`);
  };

  const handleDelete = () => {
    if (completed) {
      return;
    }

    setCurrentGuess((value) => Array.from(value).slice(0, -1).join(""));
  };

  const handleEnter = async () => {
    if (completed) {
      setShowResult(true);
      return;
    }

    const currentChars = Array.from(currentGuess);

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

    if (gameMode === "daily") {
      await persistProgress({
        guesses: nextGuesses,
        results: nextResults,
        solved: nextSolved,
        completed: nextCompleted
      });

      if (nextCompleted) {
        recordPracticeResult(word, nextSolved ? "correct" : "incorrect");
        void saveDailyPlayForCurrentUser({
          date: todayKey,
          wordId: word.id,
          won: nextSolved,
          guessesUsed: nextGuesses.length,
          hintUsed: showDefinitionHint || incorrectGuessCount >= 2
        }).then(() => {
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, isShortScreen && styles.shortContainer]}>
        <View style={styles.topBar}>
          <View style={styles.modeControl} accessibilityLabel="Game mode">
            <Pressable
              onPress={() => handleGameModeChange("daily")}
              style={[styles.modeSegment, gameMode === "daily" && styles.activeSegment]}
            >
              <Text style={[styles.modeSegmentText, gameMode === "daily" && styles.activeSegmentText]}>
                Daily
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleGameModeChange("unlimited")}
              style={[styles.modeSegment, gameMode === "unlimited" && styles.activeSegment]}
            >
              <Text
                style={[styles.modeSegmentText, gameMode === "unlimited" && styles.activeSegmentText]}
              >
                Practice
              </Text>
            </Pressable>
          </View>
          <View style={styles.iconCluster}>
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
            <Pressable
              onPress={() => setShowHelp(true)}
              style={styles.helpButton}
              accessibilityRole="button"
              accessibilityLabel="Open help"
            >
              <Text style={styles.helpIcon}>💡</Text>
            </Pressable>
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
              ? `Daily Hiragana Puzzle #${puzzleNumber} · ${dailyPuzzle.jlptLevel}`
              : reviewWeakOnly
                ? hasReviewWords
                  ? `Missed words · ${reviewWords.length}`
                  : "No missed words yet"
                : `Current word · ${word.jlpt}`}
          </Text>
        </View>

        {gameMode === "unlimited" ? (
          <View style={styles.practicePanel}>
            {!isReviewFlashcardMode ? (
              <View style={styles.practiceActions}>
                {completed ? (
                  <Pressable onPress={() => startUnlimitedWord()} style={styles.newWordButton}>
                    <Text style={styles.newWordButtonText}>New Word</Text>
                  </Pressable>
                ) : null}
                <Pressable onPress={skipUnlimitedWord} style={styles.skipButton}>
                  <Text style={styles.skipButtonText}>Skip</Text>
                </Pressable>
              </View>
            ) : null}
            <Text style={styles.practiceStats}>
              Solved {wordsSolved} · Accuracy{" "}
              {wordsAttempted > 0
                ? `${Math.round((wordsSolved / wordsAttempted) * 100)}%`
                : "0%"}
            </Text>
            {masteryFeedback ? <Text style={styles.masteryFeedback}>{masteryFeedback}</Text> : null}
          </View>
        ) : null}

        {isReviewFlashcardMode && !hasReviewWords ? (
          <View style={styles.flashcard}>
            <Text style={styles.flashcardIcon}>📝</Text>
            <Text style={styles.flashcardTitle}>All Clear</Text>
            <Text style={styles.flashcardCategory}>Missed words will appear here.</Text>
            <Text style={styles.flashcardMeta}>
              Fail, skip, or miss a Daily or Practice word to add it to review.
            </Text>
          </View>
        ) : isReviewFlashcardMode ? (
          <Pressable
            onPress={revealReviewCard}
            style={styles.flashcard}
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
          </Pressable>
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
              tileSize={tileSize}
            />

            <View style={[styles.hintBox, isShortScreen && styles.shortHintBox]}>
              <Text style={styles.categoryText}>{categoryLabel}</Text>
              <HintLine visible={showEmojiHint} style={styles.emojiHintText}>
                {word.hintEmoji}
              </HintLine>
              <HintLine visible={showDefinitionTextHint} style={styles.definitionHintText}>
                {definitionText}
              </HintLine>
              {!completed && !showDefinitionTextHint && canTapDefinitionHint ? (
                <Pressable onPress={() => setShowDefinitionHint(true)} style={styles.hintButton}>
                  <Text style={styles.hintButtonText}>Hint</Text>
                </Pressable>
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
            {gameMode === "unlimited" ? (
              <>
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

      <Modal visible={showHelp} transparent animationType="fade" onRequestClose={() => setShowHelp(false)}>
        <Pressable style={styles.helpBackdrop} onPress={() => setShowHelp(false)}>
          <View style={styles.helpMenu}>
            <Text style={styles.helpText}>Guess the Japanese word from the category.</Text>
          </View>
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
  helpButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e9e0d2"
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
  helpIcon: {
    fontSize: 20,
    lineHeight: 22
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
    backgroundColor: "#fffdf8"
  },
  modeSegment: {
    minWidth: 64,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 9
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
  practiceActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8
  },
  newWordButton: {
    minWidth: 112,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#cbbfad",
    backgroundColor: "#fffdf8"
  },
  newWordButtonText: {
    color: "#2f4f4a",
    fontSize: 14,
    fontWeight: "900"
  },
  skipButton: {
    minWidth: 76,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#cbbfad",
    backgroundColor: "#fffdf8"
  },
  skipButtonText: {
    color: "#2f4f4a",
    fontSize: 14,
    fontWeight: "900"
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
  hintButton: {
    minWidth: 62,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#cbbfad",
    backgroundColor: "#fffdf8"
  },
  hintButtonText: {
    color: "#2f4f4a",
    fontSize: 12,
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
  helpBackdrop: {
    flex: 1,
    backgroundColor: "rgba(28, 27, 24, 0.2)",
    alignItems: "flex-end",
    justifyContent: "flex-start",
    paddingHorizontal: 18,
    paddingTop: 64
  },
  helpMenu: {
    maxWidth: 280,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ded6ca",
    backgroundColor: "#fffdf8",
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  helpText: {
    color: "#2b2a27",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 21
  }
});
