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
import { words } from "@/data/words";
import { DailyProgress, TileStatus } from "@/types/game";
import { evaluateGuess } from "@/utils/evaluateGuess";
import { getPuzzleNumber, getTodayKey, getWordOfTheDay } from "@/utils/getWordOfTheDay";
import {
  loadProgress,
  loadShowRomajiPreference,
  saveProgress,
  saveShowRomajiPreference
} from "@/utils/storage";

const KANA_ONLY = /^[\u3040-\u309f]+$/;

function getMaxGuesses(answerLength: number): number {
  return answerLength === 2 ? 4 : 6;
}

export default function GameScreen() {
  const { height, width } = useWindowDimensions();
  const todayKey = useMemo(() => getTodayKey(), []);
  const puzzleNumber = useMemo(() => getPuzzleNumber(), []);
  const word = useMemo(() => getWordOfTheDay(words), []);
  const answerChars = useMemo(() => Array.from(word.hiragana), [word.hiragana]);

  const [guesses, setGuesses] = useState<string[]>([]);
  const [results, setResults] = useState<TileStatus[][]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [solved, setSolved] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [showRomaji, setShowRomaji] = useState(true);
  const isShortScreen = height < 720;
  const maxGuesses = getMaxGuesses(answerChars.length);
  const maxTileSize = maxGuesses === 4 ? (isShortScreen ? 54 : 62) : isShortScreen ? 42 : 48;
  const estimatedFixedHeight = showRomaji ? (isShortScreen ? 420 : 450) : isShortScreen ? 380 : 410;
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

        if (saved?.date === todayKey && saved.wordId === word.id) {
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
  }, [todayKey, word.id]);

  const showHint = guesses.length >= 2 && !solved;
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

    await persistProgress({
      guesses: nextGuesses,
      results: nextResults,
      solved: nextSolved,
      completed: nextCompleted
    });

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
        </View>

        <View style={[styles.header, isShortScreen && styles.shortHeader]}>
          <Text style={[styles.title, isShortScreen && styles.shortTitle]}>Jozu</Text>
          <Text style={styles.subtitle}>2 minutes of Japanese a day</Text>
          <Text style={styles.kicker}>Daily Hiragana Puzzle #{puzzleNumber}</Text>
        </View>

        <GameGrid
          answerLength={answerChars.length}
          maxGuesses={maxGuesses}
          guesses={guesses}
          currentGuess={currentGuess}
          results={results}
          showRomaji={showRomaji}
          tileSize={tileSize}
        />

        <View style={[styles.hintBox, isShortScreen && styles.shortHintBox]}>
          <Text style={styles.hintText}>
            {showHint ? `Hint: ${word.category}` : completed ? "Come back tomorrow." : " "}
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
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 10
  },
  shortContainer: {
    gap: 6,
    paddingTop: 4,
    paddingBottom: 6
  },
  topBar: {
    width: "100%",
    minHeight: 38,
    alignItems: "flex-start",
    justifyContent: "center"
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
  hintBox: {
    minHeight: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2
  },
  shortHintBox: {
    minHeight: 18,
    marginTop: 0
  },
  hintText: {
    color: "#5d5448",
    fontSize: 15,
    fontWeight: "800"
  }
});
