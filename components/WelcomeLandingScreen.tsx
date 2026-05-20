import { useEffect, useMemo } from "react";
import { Animated, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type WelcomeLandingScreenProps = {
  currentStreak?: number;
  onStartDaily: () => void;
  onStartPractice: () => void;
  onStartRush: () => void;
};

const previewTiles = [
  { kana: "じ", status: "correct" },
  { kana: "ょ", status: "correct" },
  { kana: "う", status: "accent" },
  { kana: "ず", status: "correct" }
] as const;

const tileStyles = {
  correct: {
    borderColor: "#4f8f62",
    backgroundColor: "#4f8f62"
  },
  present: {
    borderColor: "#d7aa42",
    backgroundColor: "#d7aa42"
  },
  accent: {
    borderColor: "#d7aa42",
    backgroundColor: "#d7aa42"
  },
  absent: {
    borderColor: "#6f7472",
    backgroundColor: "#6f7472"
  },
  empty: {
    borderColor: "#ded6ca",
    backgroundColor: "#fffdf8"
  }
} as const;

function formatToday(): string {
  return new Date().toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric"
  });
}

export function WelcomeLandingScreen({
  currentStreak,
  onStartDaily,
  onStartPractice,
  onStartRush
}: WelcomeLandingScreenProps) {
  const tileReveals = useMemo(
    () => previewTiles.map(() => new Animated.Value(0)),
    []
  );

  useEffect(() => {
    const animations = tileReveals.map((value, index) =>
      Animated.timing(value, {
        toValue: 1,
        duration: 260,
        delay: index * 145,
        useNativeDriver: true
      })
    );

    Animated.stagger(0, animations).start();
  }, [tileReveals]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <View style={styles.logoFrame}>
            <Image source={require("../assets/icon.png")} style={styles.logo} />
          </View>
          <Text style={styles.title}>Jozu</Text>
          <Text style={styles.subtitle}>Daily Japanese Practice</Text>
          <Text style={styles.ritualText}>A small Japanese habit for today.</Text>
        </View>

        <View style={styles.copyBlock}>
          <Text style={styles.bodyText}>Guess the Japanese word in hiragana.</Text>
          <Text style={styles.bodyText}>One small puzzle. One daily habit.</Text>
        </View>

        <View style={styles.previewCard} accessible accessibilityLabel="Decorative kana puzzle preview">
          <View style={styles.previewGrid}>
            {previewTiles.map((tile, index) => (
              <Animated.View
                key={`${tile.kana}-${index}`}
                style={[
                  styles.previewTile,
                  tileStyles[tile.status],
                  {
                    opacity: tileReveals[index],
                    transform: [
                      {
                        rotateX: tileReveals[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: ["72deg", "0deg"]
                        })
                      },
                      {
                        scale: tileReveals[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.94, 1]
                        })
                      }
                    ]
                  }
                ]}
              >
                <Text
                  style={[
                    styles.previewKana,
                    styles.previewKanaFilled,
                    tile.kana === "ょ" && styles.previewSmallKana
                  ]}
                >
                  {tile.kana}
                </Text>
              </Animated.View>
            ))}
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={onStartDaily}
            style={styles.primaryButton}
            accessibilityRole="button"
            accessibilityLabel="Start today's puzzle"
          >
            <Text style={styles.primaryButtonText}>{"Start Today's Puzzle"}</Text>
          </Pressable>
          <Pressable
            onPress={onStartPractice}
            style={styles.secondaryButton}
            accessibilityRole="button"
            accessibilityLabel="Open Practice Mode"
          >
            <Text style={styles.secondaryButtonText}>Practice Mode</Text>
          </Pressable>
          <Pressable
            onPress={onStartRush}
            style={styles.tertiaryButton}
            accessibilityRole="button"
            accessibilityLabel="Open Kana Rush"
          >
            <Text style={styles.tertiaryButtonText}>Kana Rush</Text>
          </Pressable>
        </View>

        <View style={styles.metaBlock}>
          <Text style={styles.dateText}>{formatToday()}</Text>
          <Text style={styles.metaText}>Daily Puzzle · N5-N3 Hiragana Practice</Text>
          {typeof currentStreak === "number" && currentStreak > 0 ? (
            <Text style={styles.streakText}>Current streak: {currentStreak} days 🌱</Text>
          ) : null}
        </View>
      </View>
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
    paddingHorizontal: 28,
    paddingTop: 30,
    paddingBottom: 38
  },
  hero: {
    alignItems: "center",
    gap: 7
  },
  logoFrame: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff8e8",
    borderWidth: 1,
    borderColor: "#ead8ae",
    shadowColor: "#d7aa42",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3
  },
  logo: {
    width: 84,
    height: 84,
    borderRadius: 20
  },
  title: {
    color: "#25231f",
    fontSize: 54,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 60
  },
  subtitle: {
    color: "#2f4f4a",
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 23
  },
  ritualText: {
    color: "#817565",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    textAlign: "center"
  },
  copyBlock: {
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8
  },
  bodyText: {
    color: "#5d5448",
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
    textAlign: "center"
  },
  previewCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ded6ca",
    backgroundColor: "#fffdf8",
    padding: 18,
    shadowColor: "#5d5448",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2
  },
  previewGrid: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center"
  },
  previewTile: {
    width: 58,
    height: 58,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: "#ded6ca",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fffdf8"
  },
  previewKana: {
    color: "#25231f",
    fontSize: 31,
    fontWeight: "900",
    lineHeight: 38,
    textAlign: "center"
  },
  previewSmallKana: {
    fontSize: 27,
    lineHeight: 34
  },
  previewKanaFilled: {
    color: "#ffffff"
  },
  actions: {
    width: "100%",
    maxWidth: 360,
    gap: 10
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2f4f4a",
    paddingHorizontal: 18,
    shadowColor: "#2f4f4a",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center"
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#cbbfad",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fffdf8",
    paddingHorizontal: 18
  },
  secondaryButtonText: {
    color: "#2f4f4a",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center"
  },
  tertiaryButton: {
    minHeight: 48,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#d7aa42",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fffdf8",
    paddingHorizontal: 18
  },
  tertiaryButtonText: {
    color: "#2f4f4a",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center"
  },
  metaBlock: {
    alignItems: "center",
    gap: 5,
    paddingBottom: 6
  },
  dateText: {
    color: "#5d5448",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center"
  },
  metaText: {
    color: "#817565",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center"
  },
  streakText: {
    color: "#2f4f4a",
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center"
  }
});
