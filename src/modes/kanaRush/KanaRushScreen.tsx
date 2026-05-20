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
import { kanaRushWordMeta } from "@/data/kanaRushVocabulary";
import { playInteractionFeedback } from "@/utils/feedback";
import { getKanaRomaji } from "@/utils/kanaRomaji";
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
import { buildKanaTrie, findStarterPaths, generateBoard, repairBoardIfNeeded } from "./kanaRushSolver";
import { KanaRushPosition, KanaRushTile } from "./types";

type KanaRushScreenProps = {
  acceptedWords: Set<string>;
};

const TILE_GAP = 5;
const TILE_TOUCH_RADIUS_MULTIPLIER = 0.78;
const PATH_LINE_WIDTH = 9;
const COMBO_WINDOW_MS = 2500;
const VALID_FEEDBACK_DELAY_MS = 180;
const INVALID_FEEDBACK_DELAY_MS = 220;

function getStarterHintLimit(timeLeft: number): number {
  if (timeLeft <= 5) {
    return 0;
  }

  if (timeLeft <= 10) {
    return 1;
  }

  if (timeLeft <= 20) {
    return 3;
  }

  return 5;
}

type FoundRushWord = {
  word: string;
  points: number;
};

type RushPhase = "idle" | "playing" | "over";

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
  const col = Math.max(0, Math.min(boardSize - 1, Math.round((x - tileSize / 2) / unitSize)));
  const row = Math.max(0, Math.min(boardSize - 1, Math.round((y - tileSize / 2) / unitSize)));
  const tileCenterX = col * unitSize + tileSize / 2;
  const tileCenterY = row * unitSize + tileSize / 2;
  const distanceFromCenter = Math.sqrt((x - tileCenterX) ** 2 + (y - tileCenterY) ** 2);

  // Diagonal swipes naturally pass through tile corners and gaps. Choosing the nearest
  // tile center gives the gesture a forgiving "magnetic" feel without changing rules.
  if (distanceFromCenter > tileSize * TILE_TOUCH_RADIUS_MULTIPLIER) {
    return null;
  }

  return { row, col };
}

function getTileCenter(position: KanaRushPosition, tileSize: number) {
  return {
    x: position.col * (tileSize + TILE_GAP) + tileSize / 2,
    y: position.row * (tileSize + TILE_GAP) + tileSize / 2
  };
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

function getVisibleStarterHintKeys(
  paths: { path: KanaRushPosition[] }[],
  limit: number
): { startKeys: Set<string>; nextKeys: Set<string> } {
  const startKeys = new Set<string>();
  const nextKeys = new Set<string>();

  if (limit <= 0 || paths.length === 0) {
    return { startKeys, nextKeys };
  }

  for (const hintPath of paths.slice(0, limit)) {
    const [start, next] = hintPath.path;

    if (start) {
      startKeys.add(positionKey(start));
    }

    if (next) {
      nextKeys.add(positionKey(next));
    }
  }

  return { startKeys, nextKeys };
}

export function KanaRushScreen({ acceptedWords }: KanaRushScreenProps) {
  const { width } = useWindowDimensions();
  const gridSize = Math.min(width - 36, 356);
  const trie = useMemo(() => buildKanaTrie(acceptedWords), [acceptedWords]);
  const [phase, setPhase] = useState<RushPhase>("idle");
  const [boardSize, setBoardSize] = useState(KANA_RUSH_SIZE);
  const boardSizeRef = useRef(KANA_RUSH_SIZE);
  const tileSize = (gridSize - TILE_GAP * (boardSize - 1)) / boardSize;
  const [board, setBoard] = useState<KanaRushTile[][]>(() =>
    generateBoard({
      size: KANA_RUSH_SIZE,
      trie,
      foundWords: new Set(),
      threshold: getKanaRushMinWordsForBoardSize(KANA_RUSH_SIZE)
    })
  );
  const [path, setPath] = useState<KanaRushPosition[]>([]);
  const pathRef = useRef<KanaRushPosition[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const comboRef = useRef(1);
  const lastValidWordAtRef = useRef(0);
  const comboResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submissionFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submissionLockedRef = useRef(false);
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
  const scoreBump = useRef(new Animated.Value(0)).current;
  const submitPulse = useRef(new Animated.Value(0)).current;
  const timerWarning = useRef(new Animated.Value(0)).current;
  const gridScale = useRef(new Animated.Value(1)).current;

  const selectedKeys = useMemo(() => new Set(path.map((position) => positionKey(position))), [path]);
  const starterPaths = useMemo(
    () => findStarterPaths(board, trie, new Set(foundWords.map((foundWord) => foundWord.word)), 8),
    [board, foundWords, trie]
  );
  const starterHintKeys = useMemo(
    () =>
      phase === "playing"
        ? getVisibleStarterHintKeys(starterPaths, getStarterHintLimit(timeLeft))
        : { startKeys: new Set<string>(), nextKeys: new Set<string>() },
    [phase, starterPaths, timeLeft]
  );
  const currentWord = buildWordFromPath(board, path);
  const longestWord = getLongestWord(foundWords);
  const bestScoringWord = getBestScoringWord(foundWords);
  const latestWordMeaning = latestWord ? kanaRushWordMeta.get(latestWord)?.english : undefined;
  const timeProgress = Math.max(0, Math.min(1, timeLeft / KANA_RUSH_START_SECONDS));
  const comboText = `×${combo}`;
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
  const scoreBumpStyle = {
    transform: [
      {
        scale: scoreBump.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.12]
        })
      }
    ]
  };
  const selectedSubmitScale = submitPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06]
  });
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

  const clearComboResetTimer = () => {
    if (comboResetTimeoutRef.current) {
      clearTimeout(comboResetTimeoutRef.current);
      comboResetTimeoutRef.current = null;
    }
  };

  const clearSubmissionFeedbackTimer = () => {
    if (submissionFeedbackTimeoutRef.current) {
      clearTimeout(submissionFeedbackTimeoutRef.current);
      submissionFeedbackTimeoutRef.current = null;
    }
  };

  const resetCombo = () => {
    clearComboResetTimer();
    comboRef.current = 1;
    lastValidWordAtRef.current = 0;
    setCombo(1);
  };

  const scheduleComboReset = () => {
    clearComboResetTimer();
    comboResetTimeoutRef.current = setTimeout(() => {
      comboRef.current = 1;
      lastValidWordAtRef.current = 0;
      setCombo(1);
    }, COMBO_WINDOW_MS);
  };

  const resetRound = () => {
    clearSubmissionFeedbackTimer();
    submissionLockedRef.current = false;
    const freshBoard = generateBoard({
      size: KANA_RUSH_SIZE,
      trie,
      foundWords: new Set(),
      threshold: getKanaRushMinWordsForBoardSize(KANA_RUSH_SIZE)
    });

    setBoardSize(KANA_RUSH_SIZE);
    boardSizeRef.current = KANA_RUSH_SIZE;
    setBoard(freshBoard);
    syncPath([]);
    setScore(0);
    resetCombo();
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
    setPhase("playing");
    lastTimerWarningSecondRef.current = null;
  };

  useEffect(
    () => () => {
      clearComboResetTimer();
      clearSubmissionFeedbackTimer();
    },
    []
  );

  useEffect(() => {
    if (phase !== "playing" || roundEnded) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((currentTime) => {
        const nextTime = Math.max(0, currentTime - 0.1);
        timeLeftRef.current = nextTime;

        if (nextTime <= 0) {
          setRoundEnded(true);
          roundEndedRef.current = true;
          setPhase("over");
          resetCombo();
          clearSubmissionFeedbackTimer();
          submissionLockedRef.current = false;
          syncPath([]);
        }

        return nextTime;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [phase, roundEnded]);

  useEffect(() => {
    const nextBoardSize = getKanaRushBoardSizeForTime(timeLeft);

    if (phase !== "playing" || nextBoardSize >= boardSize || roundEnded) {
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
  }, [boardSize, gridScale, phase, roundEnded, timeLeft, trie]);

  useEffect(() => {
    const timerSecond = Math.ceil(timeLeft);

    if (phase !== "playing" || timeLeft > 5 || roundEnded || lastTimerWarningSecondRef.current === timerSecond) {
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
  }, [phase, roundEnded, timeLeft, timerWarning]);

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
    submitPulse.setValue(0);
    Animated.sequence([
      Animated.parallel([
        Animated.timing(validFlash, {
          toValue: 1,
          duration: 85,
          useNativeDriver: true
        }),
        Animated.timing(submitPulse, {
          toValue: 1,
          duration: 90,
          useNativeDriver: true
        })
      ]),
      Animated.parallel([
        Animated.timing(validFlash, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true
        }),
        Animated.timing(submitPulse, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true
        })
      ])
    ]).start();
  };

  const animateScoreBump = () => {
    scoreBump.setValue(0);
    Animated.sequence([
      Animated.timing(scoreBump, {
        toValue: 1,
        duration: 85,
        useNativeDriver: true
      }),
      Animated.spring(scoreBump, {
        toValue: 0,
        friction: 7,
        tension: 120,
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
    if (
      !position ||
      submissionLockedRef.current ||
      phase !== "playing" ||
      roundEndedRef.current ||
      timeLeftRef.current <= 0
    ) {
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
    if (submissionLockedRef.current) {
      return;
    }

    if (phase !== "playing" || roundEndedRef.current || timeLeftRef.current <= 0) {
      syncPath([]);
      return;
    }

    const submittedPath = [...pathRef.current];

    if (submittedPath.length === 0) {
      return;
    }

    submissionLockedRef.current = true;
    const submittedWord = buildWordFromPath(board, submittedPath);
    const submission = evaluateKanaRushSubmission({
      word: submittedWord,
      acceptedWords,
      foundWords: foundWordsRef.current,
      twoKanaStreak: twoKanaStreakRef.current
    });

    if (submission.status === "valid") {
      playInteractionFeedback("success");
      const now = Date.now();
      const nextCombo =
        lastValidWordAtRef.current && now - lastValidWordAtRef.current <= COMBO_WINDOW_MS
          ? comboRef.current + 1
          : 1;
      const awardedPoints = submission.points * nextCombo;

      comboRef.current = nextCombo;
      lastValidWordAtRef.current = now;
      setCombo(nextCombo);
      scheduleComboReset();
      foundWordsRef.current.add(submission.word);
      setFoundWords((found) => [{ word: submission.word, points: awardedPoints }, ...found]);
      setLatestWord(submission.word);
      setScore((value) => value + awardedPoints);
      animateScoreBump();
      setTimeLeft((value) => {
        const nextTime = Math.max(0, value + submission.timeBonus - submission.penalty);
        timeLeftRef.current = nextTime;

        if (nextTime <= 0) {
          roundEndedRef.current = true;
          setRoundEnded(true);
          setPhase("over");
          resetCombo();
          clearSubmissionFeedbackTimer();
          submissionLockedRef.current = false;
          syncPath([]);
        }

        return nextTime;
      });
      setTwoKanaStreak(submission.nextTwoKanaStreak);
      twoKanaStreakRef.current = submission.nextTwoKanaStreak;
      setFeedback(
        submission.penalty > 0
          ? "Think bigger -4s"
          : `${submission.word} +${awardedPoints} ${nextCombo > 1 ? `×${nextCombo} ` : ""}+${submission.timeBonus}s`
      );
      setFeedbackState(submission.penalty > 0 ? "penalty" : "valid");
      animateValid();

      if (submission.penalty > 0) {
        animateInvalid();
        animateTimerWarning();
      }

      submissionFeedbackTimeoutRef.current = setTimeout(() => {
        if (!roundEndedRef.current) {
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
        }

        syncPath([]);
        submissionLockedRef.current = false;
        submissionFeedbackTimeoutRef.current = null;
      }, VALID_FEEDBACK_DELAY_MS);
    } else if (submittedPath.length > 0) {
      playInteractionFeedback("error");
      resetCombo();
      setFeedback(submission.message);
      setFeedbackState("invalid");
      animateInvalid();

      submissionFeedbackTimeoutRef.current = setTimeout(() => {
        syncPath([]);
        submissionLockedRef.current = false;
        submissionFeedbackTimeoutRef.current = null;
      }, INVALID_FEEDBACK_DELAY_MS);
    }
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => phase === "playing" && !roundEnded,
        onMoveShouldSetPanResponder: () => phase === "playing" && !roundEnded,
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
    [acceptedWords, board, boardSize, gridSize, phase, roundEnded, tileSize, trie]
  );

  if (phase === "over") {
    const recentWords = foundWords.slice(0, 5);

    return (
      <View style={styles.screen}>
        <View style={styles.hero}>
          <Text style={styles.title}>Kana Rush</Text>
          <Text style={styles.subtitle}>Swipe kana. Find words. Beat the clock.</Text>
        </View>
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
        <View style={styles.recentWords}>
          <Text style={styles.recentWordsTitle}>Recent words</Text>
          {recentWords.length > 0 ? (
            recentWords.map((foundWord) => (
              <Text key={`${foundWord.word}-${foundWord.points}`} style={styles.recentWordText}>
                {foundWord.word} · +{foundWord.points}
              </Text>
            ))
          ) : (
            <Text style={styles.recentWordText}>None yet</Text>
          )}
        </View>
        <Pressable onPress={resetRound} style={styles.playAgainButton}>
          <Text style={styles.playAgainText}>Play Again</Text>
        </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.title}>Kana Rush</Text>
        <Text style={styles.subtitle}>Swipe kana. Find words. Beat the clock.</Text>
      </View>

      <View style={styles.rushTopBar}>
        <Animated.View style={[styles.statCard, timeLeft <= 5 && styles.warningStatPill, timerWarningStyle]}>
          <Text style={styles.statLabel}>TIME</Text>
          <Text style={[styles.statValue, timeLeft <= 5 && styles.warningStatValue]}>{formatTime(timeLeft)}</Text>
        </Animated.View>
        <Animated.View style={[styles.statCard, scoreBumpStyle]}>
          <Text style={styles.statLabel}>SCORE</Text>
          <Text style={styles.statValue}>{score}</Text>
        </Animated.View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>COMBO</Text>
          <Text style={styles.statValue}>{comboText}</Text>
        </View>
      </View>

      <View style={styles.timerTrack}>
        <View style={[styles.timerFill, { width: `${timeProgress * 100}%` }]} />
      </View>

      <Animated.View
        style={[styles.grid, { width: gridSize, height: gridSize, transform: [{ scale: gridScale }] }]}
        {...panResponder.panHandlers}
      >
        <Animated.View pointerEvents="none" style={[styles.validFlash, { opacity: validFlash }]} />
        {path.slice(1).map((position, index) => {
          const previousPosition = path[index];
          const start = getTileCenter(previousPosition, tileSize);
          const end = getTileCenter(position, tileSize);
          const deltaX = end.x - start.x;
          const deltaY = end.y - start.y;
          const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          const angle = Math.atan2(deltaY, deltaX);

          return (
            <View
              key={`${positionKey(previousPosition)}-${positionKey(position)}`}
              pointerEvents="none"
              style={[
                styles.pathLine,
                {
                  width: length,
                  left: start.x,
                  top: start.y - PATH_LINE_WIDTH / 2,
                  transform: [{ translateX: length / 2 }, { rotate: `${angle}rad` }]
                }
              ]}
            />
          );
        })}
        {board.map((rowTiles, row) =>
          rowTiles.map((tile, col) => {
            const tilePosition = { row, col };
            const tilePositionKey = positionKey(tilePosition);
            const selected = selectedKeys.has(tilePositionKey);
            const starterHint = starterHintKeys.startKeys.has(tilePositionKey) && !selected;
            const nextStarterHint = starterHintKeys.nextKeys.has(tilePositionKey) && !starterHint && !selected;
            const firstSelected = path.length > 0 && positionKey(path[0]) === tilePositionKey;
            const replaced = replacedKeys.has(positionKey({ row, col }));
            const validRelease = selected && feedbackState === "valid";
            const invalidRelease = selected && feedbackState === "invalid";
            const tileScale = selected
              ? Animated.multiply(selectedSubmitScale, firstSelected ? 1.12 : 1.08)
              : replaced
                ? 1.04
                : 1;

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
                    top: row * (tileSize + TILE_GAP),
                    transform: [{ scale: tileScale }]
                  },
                  replaced && styles.replacedTile,
                  nextStarterHint && styles.nextStarterHintTile,
                  starterHint && styles.starterHintTile,
                  selected && styles.selectedTile,
                  validRelease && styles.validReleaseTile,
                  invalidRelease && styles.invalidReleaseTile,
                  firstSelected && styles.firstSelectedTile
                ]}
              >
                <Text style={[styles.tileText, selected && styles.selectedTileText]}>{tile.kana}</Text>
                <Text style={[styles.tileRomaji, selected && styles.selectedTileText]}>{getKanaRomaji(tile.kana)}</Text>
              </Animated.View>
            );
          })
        )}
      </Animated.View>

      {phase === "idle" ? (
        <Pressable onPress={resetRound} style={styles.startButton}>
          <Text style={styles.startButtonText}>Start Rush</Text>
        </Pressable>
      ) : (
        <Animated.View
          style={[
            styles.bottomPanel,
            (feedbackState === "invalid" || feedbackState === "penalty") && invalidShakeStyle
          ]}
        >
          <Text style={styles.currentLabel}>Current path</Text>
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    width: "100%",
    alignItems: "center",
    gap: 12,
    paddingTop: 2,
    paddingHorizontal: 2
  },
  hero: {
    width: "100%",
    alignItems: "center",
    gap: 4,
    paddingTop: 2,
    paddingBottom: 2
  },
  title: {
    color: "#25231f",
    fontSize: 42,
    fontWeight: "900",
    lineHeight: 48,
    textAlign: "center"
  },
  subtitle: {
    color: "#817565",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
    textAlign: "center"
  },
  rushTopBar: {
    width: "100%",
    maxWidth: 356,
    flexDirection: "row",
    gap: 8
  },
  statCard: {
    flex: 1,
    minHeight: 66,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ded6ca",
    backgroundColor: "#fbf6ec",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2b2a27",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1
  },
  warningStatPill: {
    borderColor: "#9b3d35",
    backgroundColor: "#fff4ef"
  },
  statLabel: {
    color: "#817565",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8
  },
  statValue: {
    color: "#2f4f4a",
    fontSize: 25,
    fontWeight: "900",
    lineHeight: 30
  },
  warningStatValue: {
    color: "#9b3d35"
  },
  timerTrack: {
    width: "100%",
    maxWidth: 356,
    height: 9,
    borderRadius: 999,
    backgroundColor: "#e9e0d2",
    overflow: "hidden"
  },
  timerFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#2f4f4a"
  },
  grid: {
    position: "relative",
    borderRadius: 18,
    backgroundColor: "#fbf6ec",
    borderWidth: 1,
    borderColor: "#ded6ca",
    overflow: "hidden",
    shadowColor: "#2b2a27",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 2
  },
  validFlash: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    borderRadius: 18,
    backgroundColor: "rgba(79, 143, 98, 0.16)"
  },
  pathLine: {
    position: "absolute",
    height: PATH_LINE_WIDTH,
    borderRadius: 999,
    backgroundColor: "rgba(47, 79, 74, 0.7)",
    shadowColor: "#2f4f4a",
    shadowOpacity: 0.34,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 4
  },
  tile: {
    position: "absolute",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ded6ca",
    backgroundColor: "#efe6d7",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3
  },
  replacedTile: {
    borderColor: "#4f8f62",
    backgroundColor: "#f2ead9"
  },
  starterHintTile: {
    borderColor: "#4f8f62",
    borderWidth: 2,
    shadowColor: "#4f8f62",
    shadowOpacity: 0.24,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  nextStarterHintTile: {
    borderColor: "rgba(79, 143, 98, 0.5)",
    backgroundColor: "#f1eadc",
    shadowColor: "#4f8f62",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1
  },
  selectedTile: {
    borderColor: "#2f4f4a",
    backgroundColor: "#2f4f4a",
    shadowColor: "#2f4f4a",
    shadowOpacity: 0.38,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    zIndex: 5
  },
  validReleaseTile: {
    borderColor: "#4f8f62",
    backgroundColor: "#4f8f62",
    shadowColor: "#4f8f62",
    shadowOpacity: 0.34,
    shadowRadius: 13
  },
  invalidReleaseTile: {
    borderColor: "#9b6f64",
    backgroundColor: "#7b817d",
    shadowColor: "#9b6f64",
    shadowOpacity: 0.16,
    shadowRadius: 9
  },
  firstSelectedTile: {
    borderColor: "#d7aa42",
    borderWidth: 2,
    shadowColor: "#d7aa42",
    shadowOpacity: 0.34,
    shadowRadius: 12,
    zIndex: 6
  },
  tileText: {
    color: "#25231f",
    fontSize: 21,
    fontWeight: "900",
    lineHeight: 24
  },
  tileRomaji: {
    color: "#817565",
    fontSize: 10,
    fontWeight: "900",
    lineHeight: 12,
    marginTop: -1
  },
  selectedTileText: {
    color: "#ffffff"
  },
  startButton: {
    width: "100%",
    maxWidth: 356,
    height: 58,
    borderRadius: 12,
    backgroundColor: "#2f4f4a",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2f4f4a",
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2
  },
  startButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900"
  },
  bottomPanel: {
    width: "100%",
    maxWidth: 356,
    minHeight: 110,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ded6ca",
    backgroundColor: "#fffdf8",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
    shadowColor: "#2b2a27",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 1
  },
  currentLabel: {
    color: "#817565",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase"
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
    maxWidth: 356,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ded6ca",
    backgroundColor: "#fffdf8",
    alignItems: "center",
    gap: 14,
    padding: 22,
    marginTop: 2,
    shadowColor: "#2b2a27",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 2
  },
  endEyebrow: {
    color: "#2f4f4a",
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  endTitle: {
    color: "#25231f",
    fontSize: 42,
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
    borderRadius: 12,
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
  recentWords: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ded6ca",
    backgroundColor: "#fbf6ec",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  recentWordsTitle: {
    color: "#817565",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    textAlign: "center"
  },
  recentWordText: {
    color: "#25231f",
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center"
  },
  playAgainButton: {
    width: "100%",
    height: 54,
    borderRadius: 12,
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
