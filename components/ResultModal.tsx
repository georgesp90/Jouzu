import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Modal, Pressable, Share, StyleSheet, Text, View } from "react-native";
import { TileStatus, WordEntry } from "@/types/game";
import { MOTION, useReducedMotion } from "@/utils/motion";
import { speakJapanese, stopSpeech } from "@/utils/speech";

type ResultModalProps = {
  visible: boolean;
  word: WordEntry;
  puzzleNumber: number;
  guessCount: number;
  maxGuesses: number;
  solved: boolean;
  results: TileStatus[][];
  isPerfectSolve?: boolean;
  onClose: () => void;
  reviewMode?: boolean;
  onReviewCorrect?: () => void;
  onReviewIncorrect?: () => void;
};

const resultEmoji: Record<TileStatus, string> = {
  correct: "🟩",
  present: "🟨",
  absent: "⬜",
  close: "🟪",
  empty: "⬜"
};

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildShareText(
  word: WordEntry,
  puzzleNumber: number,
  guessCount: number,
  maxGuesses: number,
  solved: boolean,
  results: TileStatus[][]
) {
  const score = solved ? `${guessCount}/${maxGuesses}` : `X/${maxGuesses}`;
  const rows = results.map((row) => row.map((status) => resultEmoji[status]).join("")).join("\n");

  return `Jozu Hiragana #${puzzleNumber} ${score}
🌸 ${titleCase(word.category)}

${rows}

2 minutes of Japanese a day`;
}

function SubtleConfetti({ onDone }: { onDone: () => void }) {
  const progress = useRef(new Animated.Value(0)).current;
  const particles = useMemo(
    () =>
      Array.from({ length: 32 }, (_, index) => ({
        id: index,
        x: (index % 8) * 32 - 112,
        y: 74 + (index % 4) * 18,
        rotate: index % 2 === 0 ? "42deg" : "-38deg",
        color: ["#2f4f4a", "#d7aa42", "#f7f2ea", "#6f5a8e"][index % 4]
      })),
    []
  );

  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 850,
      useNativeDriver: true
    }).start(({ finished }) => {
      if (finished) {
        onDone();
      }
    });
  }, [onDone, progress]);

  return (
    <View pointerEvents="none" style={styles.confettiLayer}>
      {particles.map((particle) => {
        const translateX = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, particle.x]
        });
        const translateY = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, particle.y]
        });
        const opacity = progress.interpolate({
          inputRange: [0, 0.75, 1],
          outputRange: [1, 1, 0]
        });
        const scale = progress.interpolate({
          inputRange: [0, 0.3, 1],
          outputRange: [0.7, 1, 0.85]
        });

        return (
          <Animated.View
            key={particle.id}
            style={[
              styles.confettiPiece,
              {
                backgroundColor: particle.color,
                opacity,
                transform: [
                  { translateX },
                  { translateY },
                  { rotate: particle.rotate },
                  { scale }
                ]
              }
            ]}
          />
        );
      })}
    </View>
  );
}

export function ResultModal({
  visible,
  word,
  puzzleNumber,
  guessCount,
  maxGuesses,
  solved,
  results,
  isPerfectSolve = false,
  onClose,
  reviewMode = false,
  onReviewCorrect,
  onReviewIncorrect
}: ResultModalProps) {
  const reduceMotion = useReducedMotion();
  const canPlayPronunciation = Boolean(word.hiragana.trim());
  const confettiKeyRef = useRef("");
  const [confettiBurstKey, setConfettiBurstKey] = useState<string | null>(null);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.97)).current;
  const perfectSolveKey = `${word.id}:${guessCount}:${results.length}`;
  const shouldShowPerfectSolve = !reviewMode && solved && isPerfectSolve;

  useEffect(() => {
    if (
      visible &&
      shouldShowPerfectSolve &&
      !reduceMotion &&
      confettiKeyRef.current !== perfectSolveKey
    ) {
      confettiKeyRef.current = perfectSolveKey;
      setConfettiBurstKey(perfectSolveKey);
    }
  }, [perfectSolveKey, reduceMotion, shouldShowPerfectSolve, visible]);

  useEffect(() => {
    if (!visible) {
      backdropOpacity.setValue(0);
      modalScale.setValue(0.97);
      return;
    }

    if (reduceMotion) {
      backdropOpacity.setValue(1);
      modalScale.setValue(1);
      return;
    }

    backdropOpacity.setValue(0);
    modalScale.setValue(0.97);
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: MOTION.modal,
        easing: MOTION.easing,
        useNativeDriver: true
      }),
      Animated.spring(modalScale, {
        toValue: 1,
        damping: 16,
        stiffness: 220,
        mass: 0.55,
        useNativeDriver: true
      })
    ]).start();
  }, [backdropOpacity, modalScale, reduceMotion, visible]);

  useEffect(() => {
    if (!visible) {
      void stopSpeech();
    }

    return () => {
      void stopSpeech();
    };
  }, [visible]);

  const handleClose = () => {
    void stopSpeech();
    onClose();
  };

  const handleSpeak = () => {
    void speakJapanese(word.hiragana);
  };

  const shareResult = async () => {
    await Share.share({
      message: buildShareText(word, puzzleNumber, guessCount, maxGuesses, solved, results)
    });
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Animated.View style={[styles.modal, { transform: [{ scale: modalScale }] }]}>
          <Text style={styles.eyebrow}>
            {reviewMode ? "Review card" : solved ? "Solved" : "Today's word"}
          </Text>
          <View style={styles.wordHeader}>
            <Text style={styles.hiragana}>{word.hiragana}</Text>
            <Text style={styles.romaji}>{word.romaji}</Text>
            <Text style={styles.meaning}>{word.english}</Text>
            {shouldShowPerfectSolve ? (
              <View style={styles.perfectBlock}>
                <Text style={styles.perfectTitle}>Perfect solve ⚡</Text>
                <Text style={styles.perfectText}>You got it on the first try.</Text>
              </View>
            ) : null}
            {canPlayPronunciation ? (
              <Pressable
                onPress={handleSpeak}
                style={styles.speechButton}
                accessibilityRole="button"
                accessibilityLabel={`Hear ${word.hiragana}`}
              >
                <Text style={styles.speechButtonText}>🔊 Listen</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.infoText}>Category: {titleCase(word.category)}</Text>
            <Text style={styles.infoText}>JLPT: {word.jlpt}</Text>
            <Text style={styles.infoText}>
              Definition: {word.refinedDefinition ?? word.definition}
            </Text>
            {word.confusableWords?.length ? (
              <View style={styles.confusableBlock}>
                <Text style={styles.confusableTitle}>Often confused with</Text>
                {word.confusableWords.map((confusable) => (
                  <Text key={confusable.word} style={styles.confusableText}>
                    {confusable.word} ({confusable.romaji}) - {confusable.english}
                    {confusable.note ? ` · ${confusable.note}` : ""}
                  </Text>
                ))}
              </View>
            ) : null}
            {reviewMode ? (
              <Text style={styles.infoText}>Mark whether you knew this word.</Text>
            ) : (
              <Text style={styles.infoText}>
                Guesses: {solved ? guessCount : "X"}/{maxGuesses}
              </Text>
            )}
          </View>

          <View style={styles.actions}>
            {reviewMode ? (
              <>
                <Pressable onPress={onReviewCorrect} style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>Got it</Text>
                </Pressable>
                <Pressable onPress={onReviewIncorrect} style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>Missed</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable onPress={shareResult} style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>Share</Text>
                </Pressable>
                <Pressable onPress={handleClose} style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>Close</Text>
                </Pressable>
              </>
            )}
          </View>
          {confettiBurstKey ? (
            <SubtleConfetti
              key={confettiBurstKey}
              onDone={() => setConfettiBurstKey(null)}
            />
          ) : null}
        </Animated.View>
      </Animated.View>
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
    gap: 14,
    overflow: "hidden"
  },
  eyebrow: {
    color: "#7b6f60",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  wordHeader: {
    gap: 3,
    paddingTop: 2,
    paddingBottom: 2
  },
  hiragana: {
    color: "#25231f",
    fontSize: 52,
    fontWeight: "900",
    lineHeight: 60
  },
  romaji: {
    color: "#4d4840",
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 23
  },
  meaning: {
    color: "#817565",
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 21
  },
  perfectBlock: {
    alignSelf: "flex-start",
    borderLeftWidth: 3,
    borderLeftColor: "#d7aa42",
    paddingLeft: 10,
    marginTop: 8,
    gap: 2
  },
  perfectTitle: {
    color: "#2f4f4a",
    fontSize: 14,
    fontWeight: "900"
  },
  perfectText: {
    color: "#817565",
    fontSize: 13,
    fontWeight: "600"
  },
  speechButton: {
    alignSelf: "flex-start",
    minHeight: 30,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ded6ca",
    backgroundColor: "#fffdf8",
    paddingHorizontal: 10,
    marginTop: 7,
    alignItems: "center",
    justifyContent: "center"
  },
  speechButtonText: {
    color: "#2f4f4a",
    fontSize: 13,
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
  confusableBlock: {
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: "#ded6ca",
    paddingTop: 8,
    marginTop: 4
  },
  confusableTitle: {
    color: "#7b6f60",
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  confusableText: {
    color: "#4d4840",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20
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
  },
  confettiLayer: {
    position: "absolute",
    top: 48,
    left: "50%",
    width: 1,
    height: 1,
    zIndex: 4
  },
  confettiPiece: {
    position: "absolute",
    width: 7,
    height: 10,
    borderRadius: 2
  }
});
