import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { TileStatus } from "@/types/game";
import { getKanaRomaji } from "@/utils/kanaRomaji";
import { playFeedbackSound } from "@/utils/feedback";
import { MOTION } from "@/utils/motion";

type GameGridProps = {
  answerLength: number;
  maxGuesses: number;
  guesses: string[];
  currentGuess: string;
  results: TileStatus[][];
  showRomaji: boolean;
  shakeTrigger: number;
  solved?: boolean;
  reduceMotion?: boolean;
  tileSize?: number;
};

const statusStyles: Record<TileStatus, { backgroundColor: string; borderColor: string; color: string }> = {
  correct: { backgroundColor: "#4f8f62", borderColor: "#4f8f62", color: "#ffffff" },
  present: { backgroundColor: "#d7aa42", borderColor: "#d7aa42", color: "#ffffff" },
  absent: { backgroundColor: "#6f7472", borderColor: "#6f7472", color: "#ffffff" },
  close: { backgroundColor: "#6f5a8e", borderColor: "#6f5a8e", color: "#ffffff" },
  empty: { backgroundColor: "#fffdf8", borderColor: "#d8d1c6", color: "#2b2a27" }
};

const SMALL_KANA = new Set(["ぁ", "ぃ", "ぅ", "ぇ", "ぉ", "ゃ", "ゅ", "ょ", "っ", "ゎ"]);

type AnimatedTileProps = {
  kana: string;
  status: TileStatus;
  showRomaji: boolean;
  tileSize: number;
  isCurrentRow: boolean;
  columnIndex: number;
  rowResultKey: string;
  shouldPlayWinWave: boolean;
  reduceMotion: boolean;
  activePulse: Animated.Value;
};

function AnimatedTile({
  kana,
  status,
  showRomaji,
  tileSize,
  isCurrentRow,
  columnIndex,
  rowResultKey,
  shouldPlayWinWave,
  reduceMotion,
  activePulse
}: AnimatedTileProps) {
  const popValue = useRef(new Animated.Value(1)).current;
  const flipValue = useRef(new Animated.Value(0)).current;
  const waveValue = useRef(new Animated.Value(0)).current;
  const previousKanaRef = useRef(kana);
  const previousResultKeyRef = useRef("");
  const previousWinWaveRef = useRef(false);
  const [revealed, setRevealed] = useState(isCurrentRow || status === "empty");

  useEffect(() => {
    if (!isCurrentRow || !kana || previousKanaRef.current === kana) {
      previousKanaRef.current = kana;
      return;
    }

    previousKanaRef.current = kana;
    if (reduceMotion) {
      return;
    }

    popValue.setValue(1);
    Animated.sequence([
      Animated.timing(popValue, {
        toValue: MOTION.popScale,
        duration: MOTION.quick,
        easing: MOTION.easing,
        useNativeDriver: true
      }),
      Animated.spring(popValue, {
        toValue: 1,
        damping: 14,
        stiffness: 260,
        mass: 0.45,
        useNativeDriver: true
      })
    ]).start();
  }, [isCurrentRow, kana, popValue, reduceMotion]);

  useEffect(() => {
    if (isCurrentRow || status === "empty") {
      setRevealed(true);
      flipValue.setValue(1);
      previousResultKeyRef.current = rowResultKey;
      return;
    }

    if (previousResultKeyRef.current === rowResultKey && revealed) {
      return;
    }

    previousResultKeyRef.current = rowResultKey;
    if (reduceMotion) {
      setRevealed(true);
      flipValue.setValue(1);
      return;
    }

    setRevealed(false);
    flipValue.setValue(0);
    const revealDelay = columnIndex * MOTION.stagger;
    const soundTimer = setTimeout(() => {
      void playFeedbackSound("reveal");
    }, revealDelay);
    const revealTimer = setTimeout(() => setRevealed(true), revealDelay + MOTION.reveal / 2);

    Animated.timing(flipValue, {
      toValue: 1,
      duration: MOTION.reveal,
      delay: revealDelay,
      easing: MOTION.easing,
      useNativeDriver: true
    }).start();

    return () => {
      clearTimeout(soundTimer);
      clearTimeout(revealTimer);
    };
  }, [columnIndex, flipValue, isCurrentRow, reduceMotion, revealed, rowResultKey, status]);

  useEffect(() => {
    if (!shouldPlayWinWave || reduceMotion) {
      previousWinWaveRef.current = false;
      return;
    }

    if (previousWinWaveRef.current) {
      return;
    }

    previousWinWaveRef.current = true;
    waveValue.setValue(0);
    // Keep the reward motion behind the reveal so it reads as a soft finish.
    Animated.sequence([
      Animated.delay(MOTION.reveal + 90 + columnIndex * MOTION.stagger),
      Animated.timing(waveValue, {
        toValue: 1,
        duration: MOTION.base,
        easing: MOTION.easing,
        useNativeDriver: true
      }),
      Animated.spring(waveValue, {
        toValue: 0,
        damping: 13,
        stiffness: 190,
        mass: 0.45,
        useNativeDriver: true
      })
    ]).start();
  }, [columnIndex, reduceMotion, shouldPlayWinWave, waveValue]);

  const displayStatus = revealed ? status : "empty";
  const colors = statusStyles[displayStatus];
  const romaji = kana ? getKanaRomaji(kana) : "";
  const isSmallKana = SMALL_KANA.has(kana);
  const flipScaleX = flipValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.04, 1]
  });
  const waveTranslateY = waveValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, MOTION.waveLift]
  });
  const waveScale = waveValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.03]
  });
  const activeOpacity = activePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.18, 0.46]
  });

  return (
    <Animated.View
      style={[
        styles.tile,
        {
          width: tileSize,
          height: tileSize,
          backgroundColor: colors.backgroundColor,
          borderColor: colors.borderColor,
          transform: [
            { scaleX: flipScaleX },
            { scale: Animated.multiply(popValue, waveScale) },
            { translateY: waveTranslateY }
          ]
        }
      ]}
    >
      {isCurrentRow && status === "empty" ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.activeTileGlow, { opacity: reduceMotion ? 0.24 : activeOpacity }]}
        />
      ) : null}
      <Text
        style={[
          styles.tileKana,
          isSmallKana && styles.smallKana,
          { color: colors.color }
        ]}
      >
        {kana}
      </Text>
      {showRomaji && romaji ? (
        <Text style={[styles.tileRomaji, { color: colors.color }]}>{romaji}</Text>
      ) : null}
    </Animated.View>
  );
}

export function GameGrid({
  answerLength,
  maxGuesses,
  guesses,
  currentGuess,
  results,
  showRomaji,
  shakeTrigger,
  solved = false,
  reduceMotion = false,
  tileSize = 56
}: GameGridProps) {
  const shakeValue = useRef(new Animated.Value(0)).current;
  const activePulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (shakeTrigger === 0 || reduceMotion) {
      return;
    }

    shakeValue.setValue(0);
    Animated.sequence([
      Animated.timing(shakeValue, { toValue: 1, duration: 44, useNativeDriver: true }),
      Animated.timing(shakeValue, { toValue: -1, duration: 44, useNativeDriver: true }),
      Animated.timing(shakeValue, { toValue: 1, duration: 44, useNativeDriver: true }),
      Animated.timing(shakeValue, { toValue: -1, duration: 44, useNativeDriver: true }),
      Animated.timing(shakeValue, { toValue: 0, duration: 44, useNativeDriver: true })
    ]).start();
  }, [reduceMotion, shakeTrigger, shakeValue]);

  useEffect(() => {
    if (reduceMotion) {
      activePulse.setValue(0);
      return;
    }

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(activePulse, {
          toValue: 1,
          duration: 720,
          easing: MOTION.easing,
          useNativeDriver: true
        }),
        Animated.timing(activePulse, {
          toValue: 0,
          duration: 720,
          easing: MOTION.easing,
          useNativeDriver: true
        })
      ])
    );

    pulse.start();
    return () => pulse.stop();
  }, [activePulse, reduceMotion]);

  const shakeStyle = {
    transform: [
      {
        translateX: shakeValue.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: [-9, 0, 9]
        })
      }
    ]
  };

  return (
    <View style={styles.grid} accessibilityLabel="Guess grid">
      {Array.from({ length: maxGuesses }).map((_, rowIndex) => {
        const isCurrentRow = rowIndex === guesses.length;
        const rowChars = Array.from(isCurrentRow ? currentGuess : guesses[rowIndex] ?? "");
        const RowContainer = isCurrentRow ? Animated.View : View;

        return (
          <RowContainer key={rowIndex} style={[styles.row, isCurrentRow && shakeStyle]}>
            {Array.from({ length: answerLength }).map((__, columnIndex) => {
              const status = results[rowIndex]?.[columnIndex] ?? "empty";
              const kana = rowChars[columnIndex] ?? "";
              const rowResultKey = `${rowIndex}:${results[rowIndex]?.join("") ?? "empty"}`;
              const shouldPlayWinWave =
                solved && rowIndex === guesses.length - 1 && status === "correct";

              return (
                <AnimatedTile
                  key={`${rowIndex}-${columnIndex}`}
                  kana={kana}
                  status={status}
                  showRomaji={showRomaji}
                  tileSize={tileSize}
                  isCurrentRow={isCurrentRow}
                  columnIndex={columnIndex}
                  rowResultKey={rowResultKey}
                  shouldPlayWinWave={shouldPlayWinWave}
                  reduceMotion={reduceMotion}
                  activePulse={activePulse}
                />
              );
            })}
          </RowContainer>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 8,
    width: "100%",
    alignItems: "center"
  },
  row: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center"
  },
  tile: {
    borderWidth: 2,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  activeTileGlow: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: "#2f4f4a",
    borderRadius: 7
  },
  tileKana: {
    fontSize: 27,
    fontWeight: "700",
    lineHeight: 30
  },
  smallKana: {
    fontSize: 20,
    lineHeight: 24,
    transform: [{ translateY: 2 }]
  },
  tileRomaji: {
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 14,
    opacity: 0.82
  }
});
