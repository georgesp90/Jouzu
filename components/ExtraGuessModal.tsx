import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

type ExtraGuessModalProps = {
  visible: boolean;
  priceLabel: string;
  productAvailable: boolean;
  productLoading: boolean;
  purchasing: boolean;
  error: string | null;
  onPurchase: () => void;
  onShowAnswer: () => void;
};

export function ExtraGuessModal({
  visible,
  priceLabel,
  productAvailable,
  productLoading,
  purchasing,
  error,
  onPurchase,
  onShowAnswer
}: ExtraGuessModalProps) {
  const purchaseDisabled = productLoading || purchasing || !productAvailable;
  const purchaseLabel = productLoading
    ? "Checking..."
    : purchasing
      ? "Working..."
      : productAvailable
        ? `Get 1 Extra Guess - ${priceLabel}`
        : "Extra guess unavailable";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onShowAnswer}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>Last Chance</Text>
          <Text style={styles.title}>One more try?</Text>
          <Text style={styles.body}>
            You used your last guess. Want one extra guess before revealing today's word?
          </Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            onPress={onPurchase}
            disabled={purchaseDisabled}
            style={[styles.primaryButton, purchaseDisabled && styles.disabledButton]}
          >
            <Text style={styles.primaryText}>{purchaseLabel}</Text>
          </Pressable>

          <Pressable onPress={onShowAnswer} disabled={purchasing} style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>Show Answer</Text>
          </Pressable>

          <Text style={styles.footerText}>Optional. Daily puzzle remains free.</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(28, 27, 24, 0.44)",
    alignItems: "center",
    justifyContent: "center",
    padding: 22
  },
  card: {
    width: "100%",
    maxWidth: 430,
    borderRadius: 10,
    backgroundColor: "#fffdf8",
    borderWidth: 1,
    borderColor: "#ded6ca",
    padding: 22,
    gap: 14
  },
  eyebrow: {
    color: "#d7aa42",
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  title: {
    color: "#25231f",
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 34
  },
  body: {
    color: "#817565",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21
  },
  errorText: {
    color: "#9b3d35",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2f4f4a",
    paddingHorizontal: 16
  },
  disabledButton: {
    opacity: 0.58
  },
  primaryText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center"
  },
  secondaryButton: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ded6ca",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fffdf8",
    paddingHorizontal: 16
  },
  secondaryText: {
    color: "#2f4f4a",
    fontSize: 15,
    fontWeight: "900"
  },
  footerText: {
    color: "#817565",
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 15,
    textAlign: "center"
  }
});
