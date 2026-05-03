import { StyleSheet, Text, View } from "react-native";
import { TileStatus } from "@/types/game";
import { getKanaRomaji } from "@/utils/kanaRomaji";

type GameGridProps = {
  answerLength: number;
  maxGuesses: number;
  guesses: string[];
  currentGuess: string;
  results: TileStatus[][];
  showRomaji: boolean;
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
  tileSize = 56
}: GameGridProps) {
  return (
    <View style={styles.grid} accessibilityLabel="Guess grid">
      {Array.from({ length: maxGuesses }).map((_, rowIndex) => {
        const isCurrentRow = rowIndex === guesses.length;
        const rowChars = Array.from(isCurrentRow ? currentGuess : guesses[rowIndex] ?? "");

        return (
          <View key={rowIndex} style={styles.row}>
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
          </View>
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
