import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
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
import { loadProgress, saveProgress } from "@/utils/storage";

const MAX_GUESSES = 6;
const KANA_ONLY = /^[\u3040-\u309f]+$/;

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
  const isShortScreen = height < 720;
  const maxTileSize = isShortScreen ? 54 : 62;
  const tileSize = Math.max(44, Math.min(maxTileSize, Math.floor((width - 72) / answerChars.length)));

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
        const saved = await loadProgress();
        if (!mounted) {
          return;
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
    const nextCompleted = nextSolved || nextGuesses.length === MAX_GUESSES;

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
        <View style={styles.header}>
          <Text style={[styles.title, isShortScreen && styles.shortTitle]}>Jozu</Text>
          <Text style={styles.subtitle}>2 minutes of Japanese a day</Text>
          <Text style={styles.kicker}>Daily Hiragana Puzzle #{puzzleNumber}</Text>
        </View>

        <GameGrid
          answerLength={answerChars.length}
          guesses={guesses}
          currentGuess={currentGuess}
          results={results}
          tileSize={tileSize}
        />

        <View style={styles.hintBox}>
          <Text style={styles.hintText}>
            {showHint ? `Hint: ${word.category}` : completed ? "Come back tomorrow." : " "}
          </Text>
        </View>

        <KanaKeyboard
          onKanaPress={handleKanaPress}
          onEnter={handleEnter}
          onDelete={handleDelete}
          keyStatuses={keyStatuses}
          disabled={loading}
        />
      </View>

      <ResultModal
        visible={showResult}
        word={word}
        puzzleNumber={puzzleNumber}
        guessCount={guesses.length}
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
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14
  },
  shortContainer: {
    gap: 8,
    paddingVertical: 8
  },
  header: {
    alignItems: "center",
    gap: 4
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
    minHeight: 22,
    alignItems: "center",
    justifyContent: "center"
  },
  hintText: {
    color: "#5d5448",
    fontSize: 15,
    fontWeight: "800"
  }
});
