import { useMemo, useRef, useState } from "react";
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from "react-native";
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

const keyStatusStyles: Partial<Record<TileStatus, { backgroundColor: string; color: string }>> = {
  correct: { backgroundColor: "#4f8f62", color: "#ffffff" },
  present: { backgroundColor: "#d7aa42", color: "#ffffff" },
  absent: { backgroundColor: "#9b9a94", color: "#ffffff" }
};

type PressScaleProps = {
  onPress: () => void;
  disabled?: boolean;
  style: StyleProp<ViewStyle>;
  children: ReactNode;
};

function PressScale({ onPress, disabled, style, children }: PressScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      damping: 16,
      stiffness: 340,
      mass: 0.45,
      useNativeDriver: true
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => !disabled && animateTo(MOTION.pressScale)}
      onPressOut={() => animateTo(1)}
      disabled={disabled}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
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
  const pages = useMemo(() => {
    const rowsPerPage = 4;
    return Array.from({ length: Math.ceil(kanaRows.length / rowsPerPage) }, (_, pageIndex) =>
      kanaRows.slice(pageIndex * rowsPerPage, pageIndex * rowsPerPage + rowsPerPage)
    );
  }, []);
  const [pageIndex, setPageIndex] = useState(0);
  const slideX = useRef(new Animated.Value(0)).current;
  const pageOpacity = useRef(new Animated.Value(1)).current;
  const currentPage = pages[pageIndex];

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
            <View key={`${pageIndex}-${rowIndex}`} style={[styles.row, compact && styles.compactRow]}>
              {row.map((kana) => {
                const statusStyle = keyStatusStyles[keyStatuses[kana]];
                const romaji = getKanaRomaji(kana);

                return (
                  <PressScale
                    key={kana}
                    onPress={() => handleKanaPress(kana)}
                    disabled={disabled}
                    style={[
                      styles.key,
                      compact && styles.compactKey,
                      statusStyle && { backgroundColor: statusStyle.backgroundColor },
                      disabled && styles.disabledKey
                    ]}
                  >
                    <Text
                      style={[
                        styles.keyKana,
                        compact && styles.compactKeyKana,
                        statusStyle && { color: statusStyle.color }
                      ]}
                    >
                      {kana}
                    </Text>
                    {showRomaji ? (
                      <Text
                        style={[
                          styles.keyRomaji,
                          compact && styles.compactKeyRomaji,
                          statusStyle && { color: statusStyle.color }
                        ]}
                      >
                        {romaji}
                      </Text>
                    ) : null}
                  </PressScale>
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
          style={[
            styles.actionKey,
            compact && styles.compactActionKey,
            disabled && styles.disabledKey
          ]}
        >
          <Text style={styles.actionText}>Enter</Text>
        </PressScale>
        <PressScale
          onPress={onDelete}
          disabled={disabled}
          style={[
            styles.actionKey,
            compact && styles.compactActionKey,
            disabled && styles.disabledKey
          ]}
        >
          <Text style={styles.actionText}>Delete</Text>
        </PressScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    width: "100%",
    gap: 4
  },
  compactKeyboard: {
    gap: 3
  },
  kanaControls: {
    gap: 4
  },
  pager: {
    minHeight: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16
  },
  compactPager: {
    minHeight: 22
  },
  pageButton: {
    width: 32,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e9e0d2"
  },
  inactivePageButton: {
    opacity: 0.28
  },
  pageButtonText: {
    color: "#2b2a27",
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 24
  },
  dots: {
    minWidth: 74,
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
    minHeight: 136,
    justifyContent: "center",
    gap: 7
  },
  compactKanaPage: {
    minHeight: 124,
    gap: 5
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 7
  },
  compactRow: {
    gap: 6
  },
  key: {
    width: 43,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e9e0d2"
  },
  compactKey: {
    width: 41,
    height: 42
  },
  keyKana: {
    color: "#2b2a27",
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 23
  },
  compactKeyKana: {
    fontSize: 19,
    lineHeight: 21
  },
  keyRomaji: {
    color: "#2b2a27",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 13,
    opacity: 0.68
  },
  compactKeyRomaji: {
    fontSize: 11,
    lineHeight: 12
  },
  pressedKey: {
    transform: [{ scale: 0.96 }],
    backgroundColor: "#ded1bf"
  },
  disabledKey: {
    opacity: 0.45
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    paddingTop: 2,
    paddingBottom: 0
  },
  compactActionRow: {
    paddingTop: 2,
    paddingBottom: 0
  },
  actionKey: {
    minWidth: 116,
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2f4f4a"
  },
  compactActionKey: {
    height: 46,
    minWidth: 112
  },
  actionText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800"
  }
});
