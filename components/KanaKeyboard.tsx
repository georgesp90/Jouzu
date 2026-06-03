import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, PanResponder, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { TileStatus } from "@/types/game";
import { getKanaRomaji } from "@/utils/kanaRomaji";
import { MOTION } from "@/utils/motion";

type KanaKeyboardProps = {
  onKanaPress: (kana: string) => void;
  onEnter: () => void;
  onDelete: () => void;
  keyStatuses?: Record<string, TileStatus>;
  showRomaji: boolean;
  compact?: boolean;
  disabled?: boolean;
};

const kanaRows = [
  ["あ", "い", "う", "え", "お"],
  ["か", "き", "く", "け", "こ"],
  ["さ", "し", "す", "せ", "そ"],
  ["た", "ち", "つ", "て", "と"],
  ["な", "に", "ぬ", "ね", "の"],
  ["は", "ひ", "ふ", "へ", "ほ"],
  ["ま", "み", "む", "め", "も"],
  ["や", "ゆ", "よ"],
  ["ら", "り", "る", "れ", "ろ"],
  ["わ", "を", "ん"],
  ["が", "ぎ", "ぐ", "げ", "ご"],
  ["ざ", "じ", "ず", "ぜ", "ぞ"],
  ["だ", "ぢ", "づ", "で", "ど"],
  ["ば", "び", "ぶ", "べ", "ぼ"],
  ["ぱ", "ぴ", "ぷ", "ぺ", "ぽ"],
  ["ゃ", "ゅ", "ょ", "っ"]
];

const keyStatusStyles: Partial<
  Record<
    TileStatus,
    {
      backgroundColor: string;
      borderColor: string;
      borderBottomColor: string;
      shadowColor: string;
      color: string;
    }
  >
> = {
  correct: {
    backgroundColor: "#3f7f58",
    borderColor: "#357149",
    borderBottomColor: "#326c46",
    shadowColor: "#285a3a",
    color: "#ffffff"
  },
  present: {
    backgroundColor: "#d8b85a",
    borderColor: "#c8a745",
    borderBottomColor: "#b5963a",
    shadowColor: "#9f812d",
    color: "#ffffff"
  },
  absent: {
    backgroundColor: "#8e8e88",
    borderColor: "#7d7d78",
    borderBottomColor: "#74746f",
    shadowColor: "#5f5f5a",
    color: "#ffffff"
  }
};

type PressScaleProps = {
  onPress: () => void;
  disabled?: boolean;
  pressableStyle?: StyleProp<ViewStyle>;
  style: StyleProp<ViewStyle>;
  children: ReactNode;
};

function PressScale({ onPress, disabled, pressableStyle, style, children }: PressScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressDepth = useRef(new Animated.Value(0)).current;
  const [pressed, setPressed] = useState(false);

  const animateTo = (toValue: number, isPressed: boolean) => {
    setPressed(isPressed);
    Animated.parallel([
      Animated.spring(scale, {
        toValue,
        damping: 16,
        stiffness: 340,
        mass: 0.45,
        useNativeDriver: true
      }),
      Animated.timing(pressDepth, {
        toValue: isPressed ? 1 : 0,
        duration: MOTION.quick,
        easing: MOTION.easing,
        useNativeDriver: true
      })
    ]).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => !disabled && animateTo(0.97, true)}
      onPressOut={() => animateTo(1, false)}
      disabled={disabled}
      style={pressableStyle}
    >
      <Animated.View
        style={[
          style,
          pressed && styles.pressedDepth,
          {
            transform: [
              { translateY: pressDepth.interpolate({ inputRange: [0, 1], outputRange: [0, 3] }) },
              { scale }
            ]
          }
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

type KanaKeyState = "default" | "correct" | "present" | "absent" | "disabled";

type KanaKeyProps = {
  kana: string;
  romaji: string;
  state: KanaKeyState;
  onPress: () => void;
  showRomaji: boolean;
  disabled?: boolean;
  compact?: boolean;
  size: number;
};

function KanaKey({
  kana,
  romaji,
  state,
  onPress,
  showRomaji,
  disabled,
  compact,
  size
}: KanaKeyProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressDepth = useRef(new Animated.Value(0)).current;
  const [pressed, setPressed] = useState(false);
  const isFeedbackState = state === "correct" || state === "present" || state === "absent";
  const statusStyle = isFeedbackState ? keyStatusStyles[state] : undefined;
  const keyTextColor = statusStyle?.color ?? "#25231f";
  const kanaFontSize = Math.round(size * (compact ? 0.4 : 0.42));
  const romajiFontSize = Math.max(9, Math.round(size * 0.16));
  const keyRadius = Math.round(size * 0.18);

  const animatePress = (isPressed: boolean) => {
    setPressed(isPressed);
    Animated.parallel([
      Animated.spring(scale, {
        toValue: isPressed ? 0.97 : 1,
        damping: 16,
        stiffness: 340,
        mass: 0.45,
        useNativeDriver: true
      }),
      Animated.timing(pressDepth, {
        toValue: isPressed ? 1 : 0,
        duration: MOTION.quick,
        easing: MOTION.easing,
        useNativeDriver: true
      })
    ]).start();
  };

  useEffect(() => {
    if (!isFeedbackState) {
      return;
    }

    scale.setValue(0.96);
    Animated.spring(scale, {
      toValue: 1,
      damping: 13,
      stiffness: 260,
      mass: 0.45,
      useNativeDriver: true
    }).start();
  }, [isFeedbackState, scale, state]);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => !disabled && animatePress(true)}
      onPressOut={() => animatePress(false)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${romaji}, ${kana}`}
    >
      <Animated.View
        style={[
          styles.key,
          {
            width: size,
            height: size,
            borderRadius: keyRadius,
            backgroundColor: statusStyle?.backgroundColor ?? "#efe7da",
            borderColor: statusStyle?.borderColor ?? "#d6ccbd",
            borderBottomColor: statusStyle?.borderBottomColor ?? "#c1b5a4",
            shadowColor: statusStyle?.shadowColor ?? "#b8ac9b"
          },
          pressed && styles.pressedDepth,
          disabled && styles.disabledKey,
          {
            transform: [
              { translateY: pressDepth.interpolate({ inputRange: [0, 1], outputRange: [0, 3] }) },
              { scale }
            ]
          }
        ]}
      >
        <Text
          style={[
            styles.keyKana,
            {
              color: keyTextColor,
              fontSize: kanaFontSize,
              lineHeight: Math.round(kanaFontSize * 1.08)
            }
          ]}
        >
          {kana}
        </Text>
        {showRomaji ? (
          <Text
            style={[
              styles.keyRomaji,
              {
                color: keyTextColor,
                fontSize: romajiFontSize,
                lineHeight: Math.round(romajiFontSize * 1.08),
                opacity: statusStyle ? 0.72 : 0.62,
                paddingRight: Math.round(size * 0.08)
              }
            ]}
          >
            {romaji}
          </Text>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

export function KanaKeyboard({
  onKanaPress,
  onEnter,
  onDelete,
  keyStatuses = {},
  showRomaji,
  compact,
  disabled
}: KanaKeyboardProps) {
  const { width } = useWindowDimensions();
  const pages = useMemo(() => {
    const rowsPerPage = 4;
    return Array.from({ length: Math.ceil(kanaRows.length / rowsPerPage) }, (_, pageIndex) =>
      kanaRows.slice(pageIndex * rowsPerPage, pageIndex * rowsPerPage + rowsPerPage)
    );
  }, []);
  const [pageIndex, setPageIndex] = useState(0);
  const slideX = useRef(new Animated.Value(0)).current;
  const pageOpacity = useRef(new Animated.Value(1)).current;
  const currentPage = pages[pageIndex] ?? pages[pages.length - 1] ?? [];
  const keyGap = compact ? 5 : 6;
  const availableWidth = Math.min(width - 48, 330);
  const calculatedKeySize = Math.floor((availableWidth - keyGap * 4) / 5);
  const keySize = Math.max(compact ? 42 : 46, Math.min(compact ? 47 : 52, calculatedKeySize));

  const animateToPage = (nextPageIndex: number, direction: -1 | 1) => {
    if (nextPageIndex === pageIndex || nextPageIndex < 0 || nextPageIndex > pages.length - 1) {
      return;
    }

    slideX.setValue(direction * 44);
    pageOpacity.setValue(0.45);
    setPageIndex(nextPageIndex);

    Animated.parallel([
      Animated.spring(slideX, {
        toValue: 0,
        damping: 18,
        stiffness: 220,
        mass: 0.55,
        useNativeDriver: true
      }),
      Animated.timing(pageOpacity, {
        toValue: 1,
        duration: MOTION.base,
        easing: MOTION.easing,
        useNativeDriver: true
      })
    ]).start();
  };

  const goToPreviousPage = () => {
    animateToPage(Math.max(pageIndex - 1, 0), -1);
  };

  const goToNextPage = () => {
    animateToPage(Math.min(pageIndex + 1, pages.length - 1), 1);
  };

  const handleKanaPress = (kana: string) => {
    onKanaPress(kana);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 18 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx <= -36) {
          goToNextPage();
        }

        if (gestureState.dx >= 36) {
          goToPreviousPage();
        }
      }
      }),
    [pageIndex, pages.length]
  );

  return (
    <View style={[styles.keyboard, compact && styles.compactKeyboard]} accessibilityLabel="Kana keyboard">
      <View style={styles.kanaControls}>
        <View style={[styles.pager, compact && styles.compactPager]}>
          <Pressable
            onPress={goToPreviousPage}
            disabled={pageIndex === 0}
            style={[styles.pageButton, pageIndex === 0 && styles.inactivePageButton]}
          >
            <Text style={styles.pageButtonText}>‹</Text>
          </Pressable>
          <View style={styles.dots} accessibilityLabel={`Kana page ${pageIndex + 1} of ${pages.length}`}>
            {pages.map((_, index) => (
              <View key={index} style={[styles.dot, index === pageIndex && styles.activeDot]} />
            ))}
          </View>
          <Pressable
            onPress={goToNextPage}
            disabled={pageIndex === pages.length - 1}
            style={[styles.pageButton, pageIndex === pages.length - 1 && styles.inactivePageButton]}
          >
            <Text style={styles.pageButtonText}>›</Text>
          </Pressable>
        </View>

        <Animated.View
          style={[
            styles.kanaPage,
            compact && styles.compactKanaPage,
            {
              opacity: pageOpacity,
              transform: [{ translateX: slideX }]
            }
          ]}
          {...panResponder.panHandlers}
        >
          {currentPage.map((row, rowIndex) => (
            <View key={`${pageIndex}-${rowIndex}`} style={[styles.row, { gap: keyGap }]}>
              {row.map((kana) => {
                const romaji = getKanaRomaji(kana);
                const keyState = (keyStatuses[kana] ?? "default") as KanaKeyState;

                return (
                  <KanaKey
                    key={kana}
                    kana={kana}
                    romaji={romaji}
                    state={disabled ? "disabled" : keyState}
                    onPress={() => handleKanaPress(kana)}
                    showRomaji={showRomaji}
                    disabled={disabled}
                    compact={compact}
                    size={keySize}
                  />
                );
              })}
            </View>
          ))}
        </Animated.View>
      </View>

      <View style={[styles.actionRow, compact && styles.compactActionRow]}>
        <PressScale
          onPress={onEnter}
          disabled={disabled}
          pressableStyle={styles.actionPressable}
          style={[
            styles.enterKey,
            compact && styles.compactActionKey,
            disabled && styles.disabledKey
          ]}
        >
          <Text style={styles.actionText}>Enter</Text>
        </PressScale>
        <PressScale
          onPress={onDelete}
          disabled={disabled}
          pressableStyle={styles.actionPressable}
          style={[
            styles.backspaceKey,
            compact && styles.compactActionKey,
            disabled && styles.disabledKey
          ]}
        >
          <Text style={styles.backspaceText}>⌫</Text>
        </PressScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    width: "100%",
    gap: 6,
    paddingHorizontal: 0
  },
  compactKeyboard: {
    gap: 5
  },
  kanaControls: {
    gap: 5
  },
  pager: {
    minHeight: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12
  },
  compactPager: {
    minHeight: 18
  },
  pageButton: {
    width: 32,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#efe7da",
    borderWidth: 1,
    borderColor: "#d6ccbd"
  },
  inactivePageButton: {
    opacity: 0.28
  },
  pageButtonText: {
    color: "#2b2a27",
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 22
  },
  dots: {
    minWidth: 68,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#c9bcaa"
  },
  activeDot: {
    backgroundColor: "#2f4f4a"
  },
  kanaPage: {
    minHeight: 198,
    justifyContent: "center",
    gap: 6
  },
  compactKanaPage: {
    minHeight: 178,
    gap: 5
  },
  row: {
    flexDirection: "row",
    justifyContent: "center"
  },
  key: {
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#d6ccbd",
    borderBottomWidth: 2,
    borderBottomColor: "#c1b5a4",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#efe7da",
    shadowColor: "#b8ac9b",
    shadowOpacity: 0.28,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3
  },
  keyKana: {
    color: "#25231f",
    fontWeight: "800",
    letterSpacing: 0
  },
  keyRomaji: {
    color: "#25231f",
    fontWeight: "700",
    alignSelf: "stretch",
    textAlign: "right"
  },
  pressedDepth: {
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1
  },
  disabledKey: {
    opacity: 0.45
  },
  actionRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    paddingTop: 2,
    paddingHorizontal: 46,
    paddingBottom: 0
  },
  compactActionRow: {
    paddingTop: 2,
    paddingBottom: 0
  },
  actionPressable: {
    flex: 1,
    maxWidth: 148
  },
  enterKey: {
    width: "100%",
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#21413b",
    borderBottomWidth: 4,
    borderBottomColor: "#1c3833",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2f554d",
    shadowColor: "#1f3934",
    shadowOpacity: 0.22,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3
  },
  backspaceKey: {
    width: "100%",
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cfc4b6",
    borderBottomWidth: 4,
    borderBottomColor: "#b9ad9d",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e7ded2",
    shadowColor: "#c7bdae",
    shadowOpacity: 0.15,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3
  },
  compactActionKey: {
    height: 48
  },
  actionText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800"
  },
  backspaceText: {
    color: "#3a3731",
    fontSize: 25,
    fontWeight: "900",
    lineHeight: 29
  }
});
