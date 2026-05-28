import { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TileStatus } from "@/types/game";
import { useReducedMotion } from "@/utils/motion";
import { GameGrid } from "./GameGrid";

type HowToPlayModalProps = {
  visible: boolean;
  onClose: () => void;
};

type Example = {
  label: string;
  kana: string[];
  romaji: string;
  results: TileStatus[];
  caption: string;
};

const examples: Example[] = [
  {
    label: "Not In Word",
    kana: ["う", "さ", "ぎ"],
    romaji: "usagi",
    results: ["absent", "absent", "absent"],
    caption: "These kana are not in the word."
  },
  {
    label: "Wrong Position",
    kana: ["た", "ぬ", "き"],
    romaji: "tanuki",
    results: ["empty", "empty", "present"],
    caption: "き is in the word, but in the wrong spot."
  },
  {
    label: "Correct Position",
    kana: ["き", "り", "ん"],
    romaji: "kirin",
    results: ["correct", "empty", "empty"],
    caption: "き is in the correct spot."
  }
];

function Rule({ children }: { children: string }) {
  return (
    <View style={styles.rule}>
      <Text style={styles.bullet}>{"\u2022"}</Text>
      <Text style={styles.ruleText}>{children}</Text>
    </View>
  );
}

function ExampleRow({ example, index, reduceMotion }: { example: Example; index: number; reduceMotion: boolean }) {
  const reveal = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      reveal.setValue(1);
      return;
    }

    reveal.setValue(0);
    Animated.timing(reveal, {
      toValue: 1,
      duration: 230,
      delay: index * 90,
      useNativeDriver: true
    }).start();
  }, [index, reduceMotion, reveal]);

  return (
    <Animated.View
      style={[
        styles.example,
        {
          opacity: reveal,
          transform: [
            {
              translateY: reveal.interpolate({
                inputRange: [0, 1],
                outputRange: [8, 0]
              })
            }
          ]
        }
      ]}
    >
      <Text style={styles.exampleLabel}>{example.label}</Text>
      <GameGrid
        answerLength={example.kana.length}
        maxGuesses={1}
        guesses={[example.kana.join("")]}
        currentGuess=""
        results={[example.results]}
        showRomaji={false}
        shakeTrigger={0}
        reduceMotion={reduceMotion}
        tileSize={48}
        animateSubmittedEmptyTiles
        revealStartDelay={index * 220}
        muteRevealSound
      />
      <Text style={styles.romaji}>({example.romaji})</Text>
      <Text style={styles.caption}>{example.caption}</Text>
    </Animated.View>
  );
}

export function HowToPlayModal({ visible, onClose }: HowToPlayModalProps) {
  const reduceMotion = useReducedMotion();
  const { height } = useWindowDimensions();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.985)).current;
  const panelHeight = Math.max(360, Math.min(height - 104, 760));

  useEffect(() => {
    if (!visible) {
      opacity.setValue(0);
      scale.setValue(0.985);
      return;
    }

    if (reduceMotion) {
      opacity.setValue(1);
      scale.setValue(1);
      return;
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 190,
        useNativeDriver: true
      }),
      Animated.spring(scale, {
        toValue: 1,
        damping: 20,
        stiffness: 220,
        mass: 0.7,
        useNativeDriver: true
      })
    ]).start();
  }, [opacity, reduceMotion, scale, visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {visible ? (
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.backdrop}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close how to play backdrop"
            />
            <Animated.View
              style={[styles.panel, { height: panelHeight, opacity, transform: [{ scale }] }]}
            >
              <ScrollView
                style={styles.scrollView}
                bounces
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                  <Pressable
                    onPress={onClose}
                    style={styles.closeButton}
                    accessibilityRole="button"
                    accessibilityLabel="Close how to play"
                  >
                    <Text style={styles.closeText}>{"\u00d7"}</Text>
                  </Pressable>

                  <Text style={styles.title}>How to Play</Text>
                  <Text style={styles.subtitle}>Guess the Japanese word before you run out of tries.</Text>
                  <Text style={styles.supportText}>Kana length changes depending on the word.</Text>

                  <Text style={styles.sectionTitle}>Examples</Text>
                  <Text style={styles.hiddenAnswerText}>All guesses below are for the same hidden word.</Text>
                  {examples.map((example, index) => (
                    <ExampleRow
                      key={example.kana.join("")}
                      example={example}
                      index={index}
                      reduceMotion={reduceMotion}
                    />
                  ))}

                  <View style={styles.answerReveal}>
                    <Text style={styles.answerRevealLabel}>Answer</Text>
                    <GameGrid
                      answerLength={3}
                      maxGuesses={1}
                      guesses={["きつね"]}
                      currentGuess=""
                      results={[["correct", "correct", "correct"]]}
                      showRomaji={false}
                      shakeTrigger={0}
                      reduceMotion={reduceMotion}
                      tileSize={48}
                      animateSubmittedEmptyTiles
                      revealStartDelay={760}
                      muteRevealSound
                    />
                    <Text style={styles.answerRomaji}>(kitsune) - fox</Text>
                  </View>

                  <View style={styles.categoryChip}>
                    <Text style={styles.categoryChipText}>Category: Animals</Text>
                  </View>

                  <View style={styles.rules}>
                    <Rule>Valid Japanese words only</Rule>
                    <Rule>Colors reveal clues</Rule>
                    <Rule>Short words = fewer tries</Rule>
                    <Rule>Long words = more tries</Rule>
                  </View>
                  <Text style={styles.guidanceText}>Categories and hints help guide you.</Text>

                  <View style={styles.divider} />
                  <Text style={styles.bottomText}>New puzzle daily.</Text>
                  <Text style={styles.bottomSecondaryText}>
                    Practice mode lets you play unlimited puzzles.
                  </Text>

                  <Pressable onPress={onClose} style={styles.doneButton} accessibilityRole="button">
                    <Text style={styles.doneText}>Got it</Text>
                  </Pressable>
              </ScrollView>
            </Animated.View>
          </View>
        </SafeAreaView>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(28, 27, 24, 0.38)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 14
  },
  panel: {
    width: "100%",
    maxWidth: 388,
    flexShrink: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ded6ca",
    backgroundColor: "#fffdf8",
    overflow: "hidden",
    shadowColor: "#25231f",
    shadowOpacity: 0.13,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4
  },
  scrollView: {
    flex: 1
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 20
  },
  closeButton: {
    alignSelf: "flex-end",
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginRight: -8,
    marginTop: -8,
    marginBottom: 2
  },
  closeText: {
    color: "#5d5448",
    fontSize: 27,
    fontWeight: "400",
    lineHeight: 29
  },
  title: {
    color: "#25231f",
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 36,
    marginBottom: 5
  },
  subtitle: {
    color: "#25231f",
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
    marginBottom: 5
  },
  supportText: {
    color: "#817565",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
    marginBottom: 15
  },
  rules: {
    gap: 4,
    marginTop: 16
  },
  rule: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7
  },
  bullet: {
    color: "#a69a89",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18
  },
  ruleText: {
    flex: 1,
    color: "#817565",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18
  },
  sectionTitle: {
    color: "#25231f",
    fontSize: 19,
    fontWeight: "900",
    lineHeight: 24,
    marginBottom: 4
  },
  hiddenAnswerText: {
    color: "#817565",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
    marginBottom: 13
  },
  example: {
    alignItems: "flex-start",
    marginBottom: 23
  },
  exampleLabel: {
    color: "#2f4f4a",
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 16,
    textTransform: "uppercase",
    marginBottom: 7
  },
  romaji: {
    color: "#817565",
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 15,
    opacity: 0.72,
    marginTop: 4,
    marginBottom: 3
  },
  caption: {
    color: "#5d5448",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18
  },
  answerReveal: {
    alignItems: "flex-start",
    borderRadius: 12,
    backgroundColor: "#f6f0e6",
    borderWidth: 1,
    borderColor: "#ded6ca",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 1,
    marginBottom: 13
  },
  answerRevealLabel: {
    color: "#2f4f4a",
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 16,
    textTransform: "uppercase",
    marginBottom: 7
  },
  answerRomaji: {
    color: "#817565",
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 15,
    opacity: 0.72,
    marginTop: 4
  },
  categoryChip: {
    alignSelf: "flex-start",
    borderRadius: 16,
    backgroundColor: "#f1e9dd",
    borderWidth: 1,
    borderColor: "#ded6ca",
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: -2
  },
  categoryChipText: {
    color: "#5d5448",
    fontSize: 12,
    fontWeight: "800"
  },
  guidanceText: {
    color: "#817565",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 8
  },
  divider: {
    height: 1,
    backgroundColor: "#ded6ca",
    marginTop: 15,
    marginBottom: 13
  },
  bottomText: {
    color: "#25231f",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21
  },
  bottomSecondaryText: {
    color: "#817565",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 20,
    marginTop: 3
  },
  doneButton: {
    height: 44,
    borderRadius: 8,
    backgroundColor: "#2f4f4a",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20
  },
  doneText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900"
  }
});
