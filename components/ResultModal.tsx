import { Modal, Pressable, Share, StyleSheet, Text, View } from "react-native";
import { TileStatus, WordEntry } from "@/types/game";

type ResultModalProps = {
  visible: boolean;
  word: WordEntry;
  puzzleNumber: number;
  guessCount: number;
  solved: boolean;
  results: TileStatus[][];
  onClose: () => void;
};

const resultEmoji: Record<TileStatus, string> = {
  correct: "🟩",
  present: "🟨",
  absent: "⬜",
  empty: "⬜"
};

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildShareText(
  word: WordEntry,
  puzzleNumber: number,
  guessCount: number,
  solved: boolean,
  results: TileStatus[][]
) {
  const score = solved ? `${guessCount}/6` : "X/6";
  const rows = results.map((row) => row.map((status) => resultEmoji[status]).join("")).join("\n");

  return `Jozu Hiragana #${puzzleNumber} ${score}
🌸 ${titleCase(word.category)}

${rows}

2 minutes of Japanese a day`;
}

export function ResultModal({
  visible,
  word,
  puzzleNumber,
  guessCount,
  solved,
  results,
  onClose
}: ResultModalProps) {
  const shareResult = async () => {
    await Share.share({
      message: buildShareText(word, puzzleNumber, guessCount, solved, results)
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <Text style={styles.eyebrow}>{solved ? "Solved" : "Today's word"}</Text>
          <Text style={styles.hiragana}>{word.hiragana}</Text>
          <Text style={styles.translation}>
            {word.romaji} - {word.english}
          </Text>

          <View style={styles.infoBlock}>
            <Text style={styles.infoText}>Category: {titleCase(word.category)}</Text>
            <Text style={styles.infoText}>JLPT: {word.jlpt}</Text>
            <Text style={styles.infoText}>Definition: {word.definition}</Text>
            <Text style={styles.infoText}>
              Guesses: {solved ? guessCount : "X"}/6
            </Text>
          </View>

          <View style={styles.actions}>
            <Pressable onPress={shareResult} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Share</Text>
            </Pressable>
            <Pressable onPress={onClose} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(28, 27, 24, 0.42)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24
  },
  modal: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 8,
    backgroundColor: "#fffdf8",
    padding: 24,
    gap: 12
  },
  eyebrow: {
    color: "#7b6f60",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  hiragana: {
    color: "#25231f",
    fontSize: 46,
    fontWeight: "900",
    lineHeight: 56
  },
  translation: {
    color: "#3a3832",
    fontSize: 20,
    fontWeight: "700"
  },
  infoBlock: {
    gap: 6,
    paddingTop: 6
  },
  infoText: {
    color: "#4d4840",
    fontSize: 15,
    lineHeight: 22
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 10
  },
  primaryButton: {
    flex: 1,
    height: 46,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2f4f4a"
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800"
  },
  secondaryButton: {
    flex: 1,
    height: 46,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#cbbfad"
  },
  secondaryButtonText: {
    color: "#2f4f4a",
    fontSize: 16,
    fontWeight: "800"
  }
});
