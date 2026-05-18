import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from "react-native";
import { words } from "@/data/words";
import {
  KANA_RUSH_SIZE,
  KANA_RUSH_START_SECONDS,
  buildWordFromPath,
  evaluateKanaRushSubmission,
  getKanaRushBoardSizeForTime,
  getKanaRushMinWordsForBoardSize,
  isAdjacent,
  positionKey,
  replaceTiles,
  resizeKanaRushBoard
} from "./kanaRushLogic";
import { buildKanaTrie, generatePlayableBoard, repairBoardIfNeeded } from "./kanaRushSolver";
import { KanaRushPosition, KanaRushTile } from "./types";

type KanaRushScreenProps = {
  acceptedWords: Set<string>;
};

const TILE_GAP = 5;

type FoundRushWord = {
  word: string;
  points: number;
};

function formatTime(seconds: number): string {
  if (seconds >= 10) {
    return String(Math.ceil(seconds));
  }

  return seconds.toFixed(1);
}

function getPositionFromPoint({
  x,
  y,
  boardSize,
  gridSize,
  tileSize
}: {
  x: number;
  y: number;
  boardSize: number;
  gridSize: number;
  tileSize: number;
}): KanaRushPosition | null {
  if (x < 0 || y < 0 || x > gridSize || y > gridSize) {
    return null;
  }

  const unitSize = tileSize + TILE_GAP;
  const col = Math.floor(x / unitSize);
  const row = Math.floor(y / unitSize);
  const tileLeft = col * unitSize;
  const tileTop = row * unitSize;

  if (row < 0 || col < 0 || row >= boardSize || col >= boardSize) {
    return null;
  }

  if (x > tileLeft + tileSize || y > tileTop + tileSize) {
    return null;
  }

  return { row, col };
}

function getLongestWord(foundWords: FoundRushWord[]): FoundRushWord | null {
  return foundWords.reduce<FoundRushWord | null>(
    (longest, foundWord) => (!longest || foundWord.word.length > longest.word.length ? foundWord : longest),
    null
  );
}

function getBestScoringWord(foundWords: FoundRushWord[]): FoundRushWord | null {
  return foundWords.reduce<FoundRushWord | null>(
    (best, foundWord) => (!best || foundWord.points > best.points ? foundWord : best),
    null
  );
}

export function KanaRushScreen({ acceptedWords }: KanaRushScreenProps) {
  const { width } = useWindowDimensions();
  const gridSize = Math.min(width - 36, 360);
  const trie = useMemo(() => buildKanaTrie(acceptedWords), [acceptedWords]);
  const wordInfoByKana = useMemo(() => {
    const map = new Map<string, string>();

    words.forEach((word) => {
      map.set(word.hiragana, word.english);
    });

    return map;
  }, []);
  const [boardSize, setBoardSize] = useState(KANA_RUSH_SIZE);
  const boardSizeRef = useRef(KANA_RUSH_SIZE);
  const tileSize = (gridSize - TILE_GAP * (boardSize - 1)) / boardSize;
  const [board, setBoard] = useState<KanaRushTile[][]>(() =>
    generatePlayableBoard(KANA_RUSH_SIZE, trie, new Set(), getKanaRushMinWordsForBoardSize(KANA_RUSH_SIZE))
  );
  const [path, setPath] = useState<KanaRushPosition[]>([]);
  const pathRef = useRef<KanaRushPosition[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(KANA_RUSH_START_SECONDS);
  const [foundWords, setFoundWords] = useState<FoundRushWord[]>([]);
  const foundWordsRef = useRef<Set<string>>(new Set());
  const [latestWord, setLatestWord] = useState("");
  const [feedback, setFeedback] = useState("Swipe kana to make words");
  const [feedbackState, setFeedbackState] = useState<"idle" | "valid" | "invalid" | "penalty">("idle");
  const [replacedKeys, setReplacedKeys] = useState<Set<string>>(new Set());
  const [twoKanaStreak, setTwoKanaStreak] = useState(0);
  const twoKanaStreakRef = useRef(0);
  const [roundEnded, setRoundEnded] = useState(false);
  const roundEndedRef = useRef(false);
  const timeLeftRef = useRef(KANA_RUSH_START_SECONDS);
  const lastTimerWarningSecondRef = useRef<number | null>(null);
  const invalidShake = useRef(new Animated.Value(0)).current;
  const validFlash = useRef(new Animated.Value(0)).current;
  const timerWarning = useRef(new Animated.Value(0)).current;
  const gridScale = useRef(new Animated.Value(1)).current;

  const selectedKeys = useMemo(() => new Set(path.map((position) => positionKey(position))), [path]);
  const currentWord = buildWordFromPath(board, path);
  const longestWord = getLongestWord(foundWords);
  const bestScoringWord = getBestScoringWord(foundWords);
  const latestWordMeaning = latestWord ? wordInfoByKana.get(latestWord) : undefined;
  const timerWarningStyle = {
    transform: [
      {
        scale: timerWarning.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.08]
        })
      }
    ]
  };
  const invalidShakeStyle = {
    transform: [
      {
        translateX: invalidShake.interpolate({
          inputRange: [-1, 1],
          outputRange: [-7, 7]
        })
      }
    ]
  };

  const syncPath = (nextPath: KanaRushPosition[]) => {
    pathRef.current = nextPath;
    setPath(nextPath);
  };

  const resetRound = () => {
    const freshBoard = generatePlayableBoard(
      KANA_RUSH_SIZE,
      trie,
      new Set(),
      getKanaRushMinWordsForBoardSize(KANA_RUSH_SIZE)
    );

    setBoardSize(KANA_RUSH_SIZE);
    boardSizeRef.current = KANA_RUSH_SIZE;
    setBoard(freshBoard);
    syncPath([]);
    setScore(0);
    setTimeLeft(KANA_RUSH_START_SECONDS);
    timeLeftRef.current = KANA_RUSH_START_SECONDS;
    setFoundWords([]);
    foundWordsRef.current = new Set();
    setLatestWord("");
    setFeedback("Swipe kana to make words");
    setFeedbackState("idle");
    setReplacedKeys(new Set());
    setTwoKanaStreak(0);
    twoKanaStreakRef.current = 0;
    setRoundEnded(false);
    roundEndedRef.current = false;
    lastTimerWarningSecondRef.current = null;
  };

  useEffect(() => {
    if (roundEnded) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((currentTime) => {
        const nextTime = Math.max(0, currentTime - 0.1);
        timeLeftRef.current = nextTime;

        if (nextTime <= 0) {
          setRoundEnded(true);
          roundEndedRef.current = true;
          syncPath([]);
        }

        return nextTime;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [roundEnded]);

  useEffect(() => {
    const nextBoardSize = getKanaRushBoardSizeForTime(timeLeft);

    if (nextBoardSize >= boardSize || roundEnded) {
      return;
    }

    syncPath([]);
    setBoardSize(nextBoardSize);
    boardSizeRef.current = nextBoardSize;
    Animated.sequence([
      Animated.timing(gridScale, {
        toValue: 0.95,
        duration: 90,
        useNativeDriver: true
      }),
      Animated.spring(gridScale, {
        toValue: 1,
        friction: 7,
        tension: 90,
        useNativeDriver: true
      })
    ]).start();
    setBoard((currentBoard) =>
      repairBoardIfNeeded(
        resizeKanaRushBoard(currentBoard, nextBoardSize),
        trie,
        foundWordsRef.current,
        getKanaRushMinWordsForBoardSize(nextBoardSize)
      )
    );
    setFeedback(`${nextBoardSize}x${nextBoardSize} grid`);
    setFeedbackState("valid");
  }, [boardSize, gridScale, roundEnded, timeLeft, trie]);

  useEffect(() => {
    const timerSecond = Math.ceil(timeLeft);

    if (timeLeft > 5 || roundEnded || lastTimerWarningSecondRef.current === timerSecond) {
      return;
    }

    lastTimerWarningSecondRef.current = timerSecond;
    Animated.sequence([
      Animated.timing(timerWarning, {
        toValue: 1,
        duration: 90,
        useNativeDriver: true
      }),
      Animated.timing(timerWarning, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true
      })
    ]).start();
  }, [roundEnded, timeLeft, timerWarning]);

  useEffect(() => {
    if (!feedback || feedback === "Swipe kana to make words") {
      return;
    }

    const timeout = setTimeout(() => {
      setFeedback("Swipe kana to make words");
      setFeedbackState("idle");
    }, 900);
    return () => clearTimeout(timeout);
  }, [feedback]);

  useEffect(() => {
    if (replacedKeys.size === 0) {
      return;
    }

    const timeout = setTimeout(() => setReplacedKeys(new Set()), 260);
    return () => clearTimeout(timeout);
  }, [replacedKeys]);

  const animateInvalid = () => {
    invalidShake.setValue(0);
    Animated.sequence([
      Animated.timing(invalidShake, {
        toValue: 1,
        duration: 45,
        useNativeDriver: true
      }),
      Animated.timing(invalidShake, {
        toValue: -1,
        duration: 65,
        useNativeDriver: true
      }),
      Animated.timing(invalidShake, {
        toValue: 1,
        duration: 65,
        useNativeDriver: true
      }),
      Animated.timing(invalidShake, {
        toValue: 0,
        duration: 45,
        useNativeDriver: true
      })
    ]).start();
  };

  const animateValid = () => {
    validFlash.setValue(0);
    Animated.sequence([
      Animated.timing(validFlash, {
        toValue: 1,
        duration: 95,
        useNativeDriver: true
      }),
      Animated.timing(validFlash, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true
      })
    ]).start();
  };

  const animateTimerWarning = () => {
    timerWarning.setValue(0);
    Animated.sequence([
      Animated.timing(timerWarning, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true
      }),
      Animated.timing(timerWarning, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true
      })
    ]).start();
  };

  const addPositionToPath = (position: KanaRushPosition | null) => {
    if (!position || roundEndedRef.current || timeLeftRef.current <= 0) {
      return;
    }

    const currentPath = pathRef.current;
    const nextKey = positionKey(position);
    const lastPosition = currentPath[currentPath.length - 1];
    const previousPosition = currentPath[currentPath.length - 2];

    if (lastPosition && positionKey(lastPosition) === nextKey) {
      return;
    }

    if (previousPosition && positionKey(previousPosition) === nextKey) {
      syncPath(currentPath.slice(0, -1));
      return;
    }

    if (currentPath.some((pathPosition) => positionKey(pathPosition) === nextKey)) {
      return;
    }

    if (lastPosition && !isAdjacent(lastPosition, position)) {
      return;
    }

    syncPath([...currentPath, position]);
  };

  const submitPath = () => {
    if (roundEndedRef.current || timeLeftRef.current <= 0) {
      syncPath([]);
      return;
    }

    const submittedPath = pathRef.current;
    const submittedWord = buildWordFromPath(board, submittedPath);
    const submission = evaluateKanaRushSubmission({
      word: submittedWord,
      acceptedWords,
      foundWords: foundWordsRef.current,
      twoKanaStreak: twoKanaStreakRef.current
    });

    if (submission.status === "valid") {
      foundWordsRef.current.add(submission.word);
      setFoundWords((found) => [{ word: submission.word, points: submission.points }, ...found]);
      setLatestWord(submission.word);
      setScore((value) => value + submission.points);
      setTimeLeft((value) => {
        const nextTime = Math.max(0, value + submission.timeBonus - submission.penalty);
        timeLeftRef.current = nextTime;

        if (nextTime <= 0) {
          roundEndedRef.current = true;
          setRoundEnded(true);
          syncPath([]);
        }

        return nextTime;
      });
      setTwoKanaStreak(submission.nextTwoKanaStreak);
      twoKanaStreakRef.current = submission.nextTwoKanaStreak;
      setReplacedKeys(new Set(submittedPath.map((position) => positionKey(position))));
      setBoard((currentBoard) => {
        const refilledBoard = replaceTiles(currentBoard, submittedPath);

        return repairBoardIfNeeded(
          refilledBoard,
          trie,
          foundWordsRef.current,
          getKanaRushMinWordsForBoardSize(boardSizeRef.current)
        );
      });
      setFeedback(
        submission.penalty > 0
          ? "Think bigger -4s"
          : `${submission.word} +${submission.points} +${submission.timeBonus}s`
      );
      setFeedbackState(submission.penalty > 0 ? "penalty" : "valid");
      animateValid();

      if (submission.penalty > 0) {
        animateInvalid();
        animateTimerWarning();
      }
    } else if (submittedPath.length > 0) {
      setFeedback(submission.message);
      setFeedbackState("invalid");
      animateInvalid();
    }

    syncPath([]);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !roundEnded,
        onMoveShouldSetPanResponder: () => !roundEnded,
        onPanResponderGrant: (event) => {
          const position = getPositionFromPoint({
            x: event.nativeEvent.locationX,
            y: event.nativeEvent.locationY,
            gridSize,
            boardSize,
            tileSize
          });

          syncPath(position ? [position] : []);
        },
        onPanResponderMove: (event) => {
          addPositionToPath(
            getPositionFromPoint({
              x: event.nativeEvent.locationX,
              y: event.nativeEvent.locationY,
              gridSize,
              boardSize,
              tileSize
            })
          );
        },
        onPanResponderRelease: submitPath,
        onPanResponderTerminate: submitPath
      }),
    [acceptedWords, board, boardSize, gridSize, roundEnded, tileSize, trie]
  );

  if (roundEnded) {
    return (
      <View style={styles.endCard}>
        <Text style={styles.endEyebrow}>Kana Rush</Text>
        <Text style={styles.endTitle}>Time</Text>
        <View style={styles.endStats}>
          <View style={styles.endStat}>
            <Text style={styles.endStatValue}>{score}</Text>
            <Text style={styles.endStatLabel}>Score</Text>
          </View>
          <View style={styles.endStat}>
            <Text style={styles.endStatValue}>{foundWords.length}</Text>
            <Text style={styles.endStatLabel}>Words</Text>
          </View>
        </View>
        <Text style={styles.endMeta}>
          Longest word: {longestWord ? `${longestWord.word} (${longestWord.word.length})` : "None yet"}
        </Text>
        <Text style={styles.endMeta}>
          Best word: {bestScoringWord ? `${bestScoringWord.word} (${bestScoringWord.points})` : "None yet"}
        </Text>
        <Pressable onPress={resetRound} style={styles.playAgainButton}>
          <Text style={styles.playAgainText}>Play Again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.rushTopBar}>
        <Animated.View style={[styles.statPill, timeLeft <= 5 && styles.warningStatPill, timerWarningStyle]}>
          <Text style={styles.statLabel}>Time</Text>
          <Text style={[styles.statValue, timeLeft <= 5 && styles.warningStatValue]}>{formatTime(timeLeft)}</Text>
        </Animated.View>
        <View style={styles.statPill}>
          <Text style={styles.statLabel}>Score</Text>
          <Text style={styles.statValue}>{score}</Text>
        </View>
      </View>

      <Animated.View
        style={[styles.grid, { width: gridSize, height: gridSize, transform: [{ scale: gridScale }] }]}
        {...panResponder.panHandlers}
      >
        <Animated.View pointerEvents="none" style={[styles.validFlash, { opacity: validFlash }]} />
        {board.map((rowTiles, row) =>
          rowTiles.map((tile, col) => {
            const selected = selectedKeys.has(positionKey({ row, col }));
            const replaced = replacedKeys.has(positionKey({ row, col }));

            return (
              <Animated.View
                key={tile.id}
                pointerEvents="none"
                style={[
                  styles.tile,
                  {
                    width: tileSize,
                    height: tileSize,
                    left: col * (tileSize + TILE_GAP),
                    top: row * (tileSize + TILE_GAP)
                  },
                  replaced && styles.replacedTile,
                  selected && styles.selectedTile
                ]}
              >
                <Text style={[styles.tileText, selected && styles.selectedTileText]}>{tile.kana}</Text>
              </Animated.View>
            );
          })
        )}
      </Animated.View>

      <Animated.View
        style={[
          styles.bottomPanel,
          (feedbackState === "invalid" || feedbackState === "penalty") && invalidShakeStyle
        ]}
      >
        <Text style={styles.currentWord}>{currentWord || " "}</Text>
        <Text
          style={[
            styles.feedbackText,
            feedbackState === "valid" && styles.validFeedback,
            feedbackState === "invalid" && styles.invalidFeedback,
            feedbackState === "penalty" && styles.penaltyFeedback
          ]}
        >
          {feedback}
        </Text>
        <View style={styles.bottomMetaRow}>
          <Text style={styles.bottomMeta}>Found {foundWords.length}</Text>
          <Text style={styles.bottomMeta}>
            Latest {latestWord ? `${latestWord}${latestWordMeaning ? ` · ${latestWordMeaning}` : ""}` : "-"}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    width: "100%",
    alignItems: "center",
    gap: 12,
    paddingTop: 2
  },
  rushTopBar: {
    width: "100%",
    maxWidth: 360,
    flexDirection: "row",
    gap: 10
  },
  statPill: {
    flex: 1,
    minHeight: 54,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ded6ca",
    backgroundColor: "#fffdf8",
    alignItems: "center",
    justifyContent: "center"
  },
  warningStatPill: {
    borderColor: "#9b3d35",
    backgroundColor: "#fff4ef"
  },
  statLabel: {
    color: "#817565",
    fontSize: 12,
    fontWeight: "800"
  },
  statValue: {
    color: "#2f4f4a",
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 30
  },
  warningStatValue: {
    color: "#9b3d35"
  },
  grid: {
    position: "relative",
    borderRadius: 10,
    backgroundColor: "#fffdf8",
    overflow: "hidden"
  },
  validFlash: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    borderRadius: 10,
    backgroundColor: "rgba(79, 143, 98, 0.16)"
  },
  tile: {
    position: "absolute",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ded6ca",
    backgroundColor: "#e9e0d2",
    alignItems: "center",
    justifyContent: "center"
  },
  replacedTile: {
    borderColor: "#4f8f62",
    backgroundColor: "#f2ead9",
    transform: [{ scale: 1.04 }]
  },
  selectedTile: {
    borderColor: "#2f4f4a",
    backgroundColor: "#2f4f4a",
    transform: [{ scale: 1.08 }]
  },
  tileText: {
    color: "#25231f",
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 30
  },
  selectedTileText: {
    color: "#ffffff"
  },
  bottomPanel: {
    width: "100%",
    maxWidth: 360,
    minHeight: 94,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ded6ca",
    backgroundColor: "#fffdf8",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  currentWord: {
    color: "#25231f",
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 32
  },
  feedbackText: {
    color: "#2f4f4a",
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 20,
    textAlign: "center"
  },
  validFeedback: {
    color: "#4f8f62"
  },
  invalidFeedback: {
    color: "#9b3d35"
  },
  penaltyFeedback: {
    color: "#d7aa42"
  },
  bottomMetaRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    paddingTop: 2
  },
  bottomMeta: {
    flex: 1,
    color: "#817565",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center"
  },
  endCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ded6ca",
    backgroundColor: "#fffdf8",
    alignItems: "center",
    gap: 14,
    padding: 22,
    marginTop: 12
  },
  endEyebrow: {
    color: "#2f4f4a",
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  endTitle: {
    color: "#25231f",
    fontSize: 44,
    fontWeight: "900",
    lineHeight: 50
  },
  endStats: {
    width: "100%",
    flexDirection: "row",
    gap: 10
  },
  endStat: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ded6ca",
    backgroundColor: "#f7f2ea",
    alignItems: "center",
    paddingVertical: 12
  },
  endStatValue: {
    color: "#2f4f4a",
    fontSize: 30,
    fontWeight: "900"
  },
  endStatLabel: {
    color: "#817565",
    fontSize: 13,
    fontWeight: "800"
  },
  endMeta: {
    color: "#5d5448",
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center"
  },
  playAgainButton: {
    width: "100%",
    height: 48,
    borderRadius: 8,
    backgroundColor: "#2f4f4a",
    alignItems: "center",
    justifyContent: "center"
  },
  playAgainText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900"
  }
});
