import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { PlusPlan } from "@/utils/subscriptionService";

type PaywallModalProps = {
  visible: boolean;
  monthlyPlan: PlusPlan;
  yearlyPlan: PlusPlan;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onPurchase: (plan: PlusPlan) => void;
  onRestore: () => void;
};

function PlanButton({
  plan,
  loading,
  onPress
}: {
  plan: PlusPlan;
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={[
        styles.planButton,
        plan.isBestValue && styles.bestValuePlanButton,
        loading && styles.disabledButton
      ]}
    >
      <View style={styles.planCopy}>
        <View style={styles.planTitleRow}>
          <Text style={[styles.planTitle, plan.isBestValue && styles.bestValueText]}>
            {plan.title}
          </Text>
          {plan.isBestValue ? <Text style={styles.bestValueBadge}>Best Value</Text> : null}
        </View>
        <Text style={styles.planSubtitle}>{plan.periodLabel}</Text>
      </View>
      <Text style={[styles.planPrice, plan.isBestValue && styles.bestValueText]}>
        {plan.priceLabel}
      </Text>
    </Pressable>
  );
}

export function PaywallModal({
  visible,
  monthlyPlan,
  yearlyPlan,
  loading,
  error,
  onClose,
  onPurchase,
  onRestore
}: PaywallModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Jozu Plus</Text>
            <Text style={styles.title}>Practice without limits</Text>
            <Text style={styles.subtitle}>
              Keep Daily free. Upgrade when you want deeper review and extra practice.
            </Text>
          </View>

          <View style={styles.features}>
            <Text style={styles.feature}>✓ Unlimited Practice</Text>
            <Text style={styles.feature}>✓ Review Practice</Text>
            <Text style={styles.feature}>✓ Future JLPT packs</Text>
            <Text style={styles.feature}>✓ Future audio tools</Text>
          </View>

          <View style={styles.plans}>
            <PlanButton
              plan={yearlyPlan}
              loading={loading}
              onPress={() => onPurchase(yearlyPlan)}
            />
            <PlanButton
              plan={monthlyPlan}
              loading={loading}
              onPress={() => onPurchase(monthlyPlan)}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable onPress={onRestore} disabled={loading} style={styles.restoreButton}>
            <Text style={styles.restoreText}>
              {loading ? "Working..." : "Restore Purchases"}
            </Text>
          </Pressable>

          <Text style={styles.legalText}>
            Subscription renews automatically unless canceled in App Store settings. Terms and
            Privacy links will be added before the public Plus launch.
          </Text>

          <Pressable onPress={onClose} disabled={loading} style={styles.closeButton}>
            <Text style={styles.closeText}>Not now</Text>
          </Pressable>
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
    gap: 16
  },
  header: {
    gap: 5
  },
  eyebrow: {
    color: "#2f4f4a",
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  title: {
    color: "#25231f",
    fontSize: 32,
    fontWeight: "900",
    lineHeight: 36
  },
  subtitle: {
    color: "#817565",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21
  },
  features: {
    gap: 7,
    paddingVertical: 2
  },
  feature: {
    color: "#4d4840",
    fontSize: 15,
    fontWeight: "800"
  },
  plans: {
    gap: 10
  },
  planButton: {
    minHeight: 68,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#ded6ca",
    backgroundColor: "#fffdf8",
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  bestValuePlanButton: {
    borderColor: "#2f4f4a",
    backgroundColor: "#eef2eb"
  },
  disabledButton: {
    opacity: 0.62
  },
  planCopy: {
    flex: 1,
    gap: 3
  },
  planTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap"
  },
  planTitle: {
    color: "#25231f",
    fontSize: 18,
    fontWeight: "900"
  },
  bestValueText: {
    color: "#2f4f4a"
  },
  bestValueBadge: {
    color: "#ffffff",
    backgroundColor: "#2f4f4a",
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 11,
    fontWeight: "900"
  },
  planSubtitle: {
    color: "#817565",
    fontSize: 13,
    fontWeight: "700"
  },
  planPrice: {
    color: "#25231f",
    fontSize: 20,
    fontWeight: "900"
  },
  errorText: {
    color: "#9b3d35",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18
  },
  restoreButton: {
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center"
  },
  restoreText: {
    color: "#2f4f4a",
    fontSize: 15,
    fontWeight: "900"
  },
  legalText: {
    color: "#817565",
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 16,
    textAlign: "center"
  },
  closeButton: {
    height: 46,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2f4f4a"
  },
  closeText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900"
  }
});
