import { useMemo, useRef, useState } from "react";
import { PanResponder, Pressable, StyleSheet, Text, View } from "react-native";
import { TileStatus } from "@/types/game";
import { getKanaRomaji } from "@/utils/kanaRomaji";

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
  const currentPage = pages[pageIndex];

  const goToPreviousPage = () => {
    setPageIndex((value) => Math.max(value - 1, 0));
  };

  const goToNextPage = () => {
    setPageIndex((value) => Math.min(value + 1, pages.length - 1));
  };

  const panResponder = useRef(
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
    })
  ).current;

  return (
    <View style={[styles.keyboard, compact && styles.compactKeyboard]} accessibilityLabel="Kana keyboard">
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

      <View style={[styles.kanaPage, compact && styles.compactKanaPage]} {...panResponder.panHandlers}>
        {currentPage.map((row, rowIndex) => (
          <View key={`${pageIndex}-${rowIndex}`} style={[styles.row, compact && styles.compactRow]}>
            {row.map((kana) => {
              const statusStyle = keyStatusStyles[keyStatuses[kana]];
              const romaji = getKanaRomaji(kana);

              return (
                <Pressable
                  key={kana}
                  onPress={() => onKanaPress(kana)}
                  disabled={disabled}
                  style={({ pressed }) => [
                    styles.key,
                    compact && styles.compactKey,
                    statusStyle && { backgroundColor: statusStyle.backgroundColor },
                    disabled && styles.disabledKey,
                    pressed && !disabled && styles.pressedKey
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
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <View style={[styles.actionRow, compact && styles.compactActionRow]}>
        <Pressable
          onPress={onEnter}
          disabled={disabled}
          style={({ pressed }) => [
            styles.actionKey,
            compact && styles.compactActionKey,
            disabled && styles.disabledKey,
            pressed && !disabled && styles.pressedKey
          ]}
        >
          <Text style={styles.actionText}>Enter</Text>
        </Pressable>
        <Pressable
          onPress={onDelete}
          disabled={disabled}
          style={({ pressed }) => [
            styles.actionKey,
            compact && styles.compactActionKey,
            disabled && styles.disabledKey,
            pressed && !disabled && styles.pressedKey
          ]}
        >
          <Text style={styles.actionText}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    width: "100%",
    gap: 7
  },
  compactKeyboard: {
    gap: 5
  },
  pager: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16
  },
  compactPager: {
    minHeight: 24
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
    minHeight: 145,
    justifyContent: "center",
    gap: 7
  },
  compactKanaPage: {
    minHeight: 130,
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
    gap: 10,
    paddingTop: 4
  },
  compactActionRow: {
    paddingTop: 2
  },
  actionKey: {
    minWidth: 104,
    height: 38,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2f4f4a"
  },
  compactActionKey: {
    height: 36,
    minWidth: 104
  },
  actionText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800"
  }
});
