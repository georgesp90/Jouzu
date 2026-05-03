import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { TileStatus } from "@/types/game";
import { getKanaRomaji } from "@/utils/kanaRomaji";

type GameGridProps = {
  answerLength: number;
  maxGuesses: number;
  guesses: string[];
  currentGuess: string;
  results: TileStatus[][];
  showRomaji: boolean;
  shakeTrigger: number;
  tileSize?: number;
};

const statusStyles: Record<TileStatus, { backgroundColor: string; borderColor: string; color: string }> = {
  correct: { backgroundColor: "#4f8f62", borderColor: "#4f8f62", color: "#ffffff" },
  present: { backgroundColor: "#d7aa42", borderColor: "#d7aa42", color: "#ffffff" },
  absent: { backgroundColor: "#6f7472", borderColor: "#6f7472", color: "#ffffff" },
  empty: { backgroundColor: "#fffdf8", borderColor: "#d8d1c6", color: "#2b2a27" }
};

export function GameGrid({
  answerLength,
  maxGuesses,
  guesses,
  currentGuess,
  results,
  showRomaji,
  shakeTrigger,
  tileSize = 56
}: GameGridProps) {
  const shakeValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (shakeTrigger === 0) {
      return;
    }

    shakeValue.setValue(0);
    Animated.sequence([
      Animated.timing(shakeValue, { toValue: 1, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeValue, { toValue: -1, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeValue, { toValue: 1, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeValue, { toValue: -1, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeValue, { toValue: 0, duration: 45, useNativeDriver: true })
    ]).start();
  }, [shakeTrigger, shakeValue]);

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
              const colors = statusStyles[status];
              const kana = rowChars[columnIndex] ?? "";
              const romaji = kana ? getKanaRomaji(kana) : "";

              return (
                <View
                  key={`${rowIndex}-${columnIndex}`}
                  style={[
                    styles.tile,
                    {
                      width: tileSize,
                      height: tileSize,
                      backgroundColor: colors.backgroundColor,
                      borderColor: colors.borderColor
                    }
                  ]}
                >
                  <Text style={[styles.tileKana, { color: colors.color }]}>{kana}</Text>
                  {showRomaji && romaji ? (
                    <Text style={[styles.tileRomaji, { color: colors.color }]}>{romaji}</Text>
                  ) : null}
                </View>
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
    justifyContent: "center"
  },
  tileKana: {
    fontSize: 27,
    fontWeight: "700",
    lineHeight: 30
  },
  tileRomaji: {
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 14,
    opacity: 0.82
  }
});
