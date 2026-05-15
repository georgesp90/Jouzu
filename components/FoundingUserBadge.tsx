import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

type FoundingUserBadgeProps = {
  visible: boolean;
  modalVisible: boolean;
  onPress: () => void;
  onClose: () => void;
};

export function FoundingUserBadge({
  visible,
  modalVisible,
  onPress,
  onClose
}: FoundingUserBadgeProps) {
  if (!visible) {
    return null;
  }

  return (
    <>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.badge, pressed && styles.pressedBadge]}
        accessibilityRole="button"
        accessibilityLabel="Open founding user note"
      >
        <Text style={styles.badgeText}>🌱</Text>
      </Pressable>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={onClose}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable style={styles.card} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.eyebrow}>Jozu</Text>
            <Text style={styles.title}>Founding User</Text>
            <Text style={styles.body}>
              You were one of the first people here. Thank you for supporting Jouzu early.
            </Text>
            <Text style={styles.bodySecondary}>
              Your support helped shape the app from the beginning.
            </Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 30,
    minHeight: 30,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d7aa42",
    backgroundColor: "#fff8e8",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 0
  },
  pressedBadge: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }]
  },
  badgeText: {
    color: "#5d5448",
    fontSize: 15,
    fontWeight: "900"
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(28, 27, 24, 0.38)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ded6ca",
    backgroundColor: "#fffdf8",
    padding: 22,
    gap: 10
  },
  eyebrow: {
    color: "#d7aa42",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  title: {
    color: "#25231f",
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 32
  },
  body: {
    color: "#4d4840",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22
  },
  bodySecondary: {
    color: "#817565",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19
  },
  closeButton: {
    height: 42,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2f4f4a",
    marginTop: 6
  },
  closeText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900"
  }
});
