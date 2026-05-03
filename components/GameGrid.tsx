import { StyleSheet, Text, View } from "react-native";
import { TileStatus } from "@/types/game";

const MAX_GUESSES = 6;

type GameGridProps = {
  answerLength: number;
  guesses: string[];
  currentGuess: string;
  results: TileStatus[][];
  tileSize?: number;
};

const statusStyles: Record<TileStatus, { backgroundColor: string; borderColor: string; color: string }> = {
  correct: { backgroundColor: "#4f8f62", borderColor: "#4f8f62", color: "#ffffff" },
  present: { backgroundColor: "#d7aa42", borderColor: "#d7aa42", color: "#ffffff" },
  absent: { backgroundColor: "#6f7472", borderColor: "#6f7472", color: "#ffffff" },
  empty: { backgroundColor: "#fffdf8", borderColor: "#d8d1c6", color: "#2b2a27" }
};

export function GameGrid({ answerLength, guesses, currentGuess, results, tileSize = 56 }: GameGridProps) {
  return (
    <View style={styles.grid} accessibilityLabel="Guess grid">
      {Array.from({ length: MAX_GUESSES }).map((_, rowIndex) => {
        const isCurrentRow = rowIndex === guesses.length;
        const rowChars = Array.from(isCurrentRow ? currentGuess : guesses[rowIndex] ?? "");

        return (
          <View key={rowIndex} style={styles.row}>
            {Array.from({ length: answerLength }).map((__, columnIndex) => {
              const status = results[rowIndex]?.[columnIndex] ?? "empty";
              const colors = statusStyles[status];

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
                  <Text style={[styles.tileText, { color: colors.color }]}>
                    {rowChars[columnIndex] ?? ""}
                  </Text>
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 9,
    width: "100%",
    alignItems: "center"
  },
  row: {
    flexDirection: "row",
    gap: 9,
    justifyContent: "center"
  },
  tile: {
    borderWidth: 2,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center"
  },
  tileText: {
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 34
  }
});
