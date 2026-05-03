import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from "react-native";
import { GameGrid } from "@/components/GameGrid";
import { KanaKeyboard } from "@/components/KanaKeyboard";
import { ResultModal } from "@/components/ResultModal";
import { wordPools, words } from "@/data/words";
import { DailyProgress, JLPTLevel, TileStatus, WordEntry } from "@/types/game";
import { evaluateGuess } from "@/utils/evaluateGuess";
import { getDailyPuzzle } from "@/utils/getDailyPuzzle";
import { getPuzzleNumber, getTodayKey } from "@/utils/getWordOfTheDay";
import {
  loadProgress,
  loadShowRomajiPreference,
  saveProgress,
  saveShowRomajiPreference
} from "@/utils/storage";

const KANA_ONLY = /^[\u3040-\u309f]+$/;
type GameMode = "daily" | "unlimited";

function getMaxGuesses(answerLength: number): number {
  return answerLength === 2 ? 4 : 6;
}

function selectRandomWord(level: JLPTLevel, previousWordId?: string): WordEntry {
  const pool = wordPools[level].length > 0 ? wordPools[level] : wordPools.N5;
  const availableWords =
    previousWordId && pool.length > 1 ? pool.filter((word) => word.id !== previousWordId) : pool;

  return availableWords[Math.floor(Math.random() * availableWords.length)];
}

export default function GameScreen() {
  const { height, width } = useWindowDimensions();
  const todayKey = useMemo(() => getTodayKey(), []);
  const puzzleNumber = useMemo(() => getPuzzleNumber(), []);
  const dailyPuzzle = useMemo(() => getDailyPuzzle(), []);
  const [gameMode, setGameMode] = useState<GameMode>("daily");
  const [selectedJLPTLevel, setSelectedJLPTLevel] = useState<JLPTLevel>("N5");
  const [unlimitedWord, setUnlimitedWord] = useState(() => selectRandomWord("N5"));
  const word = gameMode === "daily" ? dailyPuzzle.word : unlimitedWord;
  const answerChars = useMemo(() => Array.from(word.hiragana), [word.hiragana]);

  const [guesses, setGuesses] = useState<string[]>([]);
  const [results, setResults] = useState<TileStatus[][]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [solved, setSolved] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [showRomaji, setShowRomaji] = useState(true);
  const [wordsSolved, setWordsSolved] = useState(0);
  const [wordsAttempted, setWordsAttempted] = useState(0);
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const validWords = useMemo(() => new Set(words.map((entry) => entry.hiragana)), []);
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

  const persistProgress = useCallback(
    async (nextProgress: Omit<DailyProgress, "date" | "wordId">) => {
      await saveProgress({
        date: todayKey,
        wordId: word.id,
        ...nextProgress
      });
    },
    [todayKey, word.id]
  );

  const resetBoard = () => {
    setGuesses([]);
    setResults([]);
    setCurrentGuess("");
    setSolved(false);
    setCompleted(false);
    setShowResult(false);
  };

  useEffect(() => {
    let mounted = true;

    async function restoreProgress() {
      try {
        const [saved, savedShowRomaji] = await Promise.all([
          loadProgress(),
          loadShowRomajiPreference()
        ]);
        if (!mounted) {
          return;
        }

        if (savedShowRomaji !== null) {
          setShowRomaji(savedShowRomaji);
        }

        if (saved?.date === todayKey && saved.wordId === dailyPuzzle.word.id) {
          setGuesses(saved.guesses);
          setResults(saved.results);
          setSolved(saved.solved);
          setCompleted(saved.completed);
          setShowResult(saved.completed);
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
  }, [dailyPuzzle.word.id, todayKey]);

  const startUnlimitedWord = (level = selectedJLPTLevel) => {
    resetBoard();
    setUnlimitedWord((currentWord) => selectRandomWord(level, currentWord.id));
  };

  const skipUnlimitedWord = () => {
    if (!completed) {
      setWordsAttempted((value) => value + 1);
    }

    startUnlimitedWord();
  };

  const handleGameModeChange = (nextGameMode: GameMode) => {
    setGameMode(nextGameMode);
    resetBoard();

    if (nextGameMode === "daily") {
      void loadProgress().then((saved) => {
        if (saved?.date === todayKey && saved.wordId === dailyPuzzle.word.id) {
          setGuesses(saved.guesses);
          setResults(saved.results);
          setSolved(saved.solved);
          setCompleted(saved.completed);
          setShowResult(saved.completed);
        }
      });
    } else {
      setUnlimitedWord((currentWord) => selectRandomWord(selectedJLPTLevel, currentWord.id));
    }
  };

  const handleJLPTLevelChange = (nextLevel: JLPTLevel) => {
    setSelectedJLPTLevel(nextLevel);
    resetBoard();
    setUnlimitedWord((currentWord) => selectRandomWord(nextLevel, currentWord.id));
  };

  const showHint = guesses.length >= 2 && !solved;
  const categoryLabel = `Category: ${word.category}`;
  const hintLabel = showHint && word.hintEmoji ? `Hint: ${word.hintEmoji}` : " ";
  const keyStatuses = useMemo(() => {
    const priority: Record<TileStatus, number> = {
      empty: 0,
      absent: 1,
      present: 2,
      correct: 3
    };
    const statuses: Record<string, TileStatus> = {};

    guesses.forEach((guess, rowIndex) => {
      Array.from(guess).forEach((kana, columnIndex) => {
        const nextStatus = results[rowIndex]?.[columnIndex];
        const currentStatus = statuses[kana] ?? "empty";

        if (nextStatus && priority[nextStatus] > priority[currentStatus]) {
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

    if (currentChars.length !== answerChars.length) {
      Alert.alert("Keep going", `Today's word is ${answerChars.length} kana.`);
      return;
    }

    if (!KANA_ONLY.test(currentGuess)) {
      Alert.alert("Kana only", "Use hiragana for this puzzle.");
      return;
    }

    if (!validWords.has(currentGuess)) {
      setShakeTrigger((value) => value + 1);
      return;
    }

    const evaluated = evaluateGuess(currentGuess, word.hiragana);
    const nextGuesses = [...guesses, currentGuess];
    const nextResults = [...results, evaluated];
    const nextSolved = currentGuess === word.hiragana;
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
    } else {
      if (nextCompleted) {
        setWordsAttempted((value) => value + 1);

        if (nextSolved) {
          setWordsSolved((value) => value + 1);
        }
      }
    }

    if (nextCompleted) {
      setShowResult(true);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, isShortScreen && styles.shortContainer]}>
        <View style={styles.topBar}>
          <View style={styles.segmentedControl} accessibilityLabel="Display mode">
            <Pressable
              onPress={() => handleModeChange(false)}
              style={[styles.segment, !showRomaji && styles.activeSegment]}
            >
              <Text style={[styles.segmentText, !showRomaji && styles.activeSegmentText]}>
                Kana
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleModeChange(true)}
              style={[styles.segment, showRomaji && styles.activeSegment]}
            >
              <Text style={[styles.segmentText, showRomaji && styles.activeSegmentText]}>
                Romaji
              </Text>
            </Pressable>
          </View>
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
        </View>

        <View style={[styles.header, isShortScreen && styles.shortHeader]}>
          <Text
            style={[
              styles.title,
              gameMode === "unlimited" && styles.practiceTitle,
              isShortScreen && styles.shortTitle
            ]}
          >
            {gameMode === "daily" ? "Jozu" : "Unlimited Practice"}
          </Text>
          <Text style={styles.subtitle}>
            {gameMode === "daily" ? "2 minutes of Japanese a day" : "Train at your level"}
          </Text>
          <Text style={styles.kicker}>
            {gameMode === "daily"
              ? `Daily Hiragana Puzzle #${puzzleNumber} · ${dailyPuzzle.jlptLevel}`
              : `Current word · ${word.jlpt}`}
          </Text>
        </View>

        {gameMode === "unlimited" ? (
          <View style={styles.practicePanel}>
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
            <View style={styles.practiceActions}>
              <Pressable onPress={() => startUnlimitedWord()} style={styles.practiceButton}>
                <Text style={styles.practiceButtonText}>Next Word</Text>
              </Pressable>
              <Pressable onPress={skipUnlimitedWord} style={styles.skipButton}>
                <Text style={styles.skipButtonText}>Skip</Text>
              </Pressable>
            </View>
            <Text style={styles.practiceStats}>
              Solved {wordsSolved} · Accuracy{" "}
              {wordsAttempted > 0
                ? `${Math.round((wordsSolved / wordsAttempted) * 100)}%`
                : "0%"}
            </Text>
          </View>
        ) : null}

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
          <Text style={styles.hintText}>
            {completed
              ? gameMode === "daily"
                ? "Come back tomorrow."
                : "Tap Next Word to keep practicing."
              : hintLabel}
          </Text>
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
      </View>

      <ResultModal
        visible={showResult}
        word={word}
        puzzleNumber={puzzleNumber}
        guessCount={guesses.length}
        maxGuesses={maxGuesses}
        solved={solved}
        results={results}
        onClose={() => setShowResult(false)}
      />
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
  topBar: {
    width: "100%",
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8
  },
  segmentedControl: {
    flexDirection: "row",
    borderWidth: 2,
    borderColor: "#ded6ca",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#fffdf8"
  },
  segment: {
    minWidth: 72,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12
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
  subtitle: {
    color: "#4d4840",
    fontSize: 15,
    fontWeight: "700"
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
  practiceButton: {
    minWidth: 118,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2f4f4a"
  },
  practiceButtonText: {
    color: "#ffffff",
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
  hintBox: {
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -2
  },
  shortHintBox: {
    minHeight: 30,
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
  }
});
