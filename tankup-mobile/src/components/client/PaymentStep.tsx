import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, radius, shadow } from "@/src/constants/tankupTheme";
import type { PriorityMode, RequestMode } from "@/types/client";

function naira(value: number) {
  return `₦${Math.round(value).toLocaleString()}`;
}

export default function PaymentStep({
  price,
  selectedSize,
  requestMode,
  priorityMode,
  scheduledFor,
  onPay,
  onCancel,
  isLoading,
}: {
  price: number;
  selectedSize: number | null;
  requestMode: RequestMode;
  priorityMode: PriorityMode;
  scheduledFor: string;
  onPay: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  return (
    <View style={styles.stack}>
      <View style={styles.centerBlock}>
        <View style={styles.heroIcon}>
          <Ionicons name="card-outline" size={30} color={colors.primary} />
        </View>
        <Text style={styles.title}>Review and Pay</Text>
        <Text style={styles.subtitle}>Same flow as web: confirm details before joining the queue.</Text>
      </View>

      <View style={styles.card}>
        <Row label="Delivery type" value={requestMode === "batch" ? "Batch Saver" : "Priority Delivery"} />
        {requestMode === "priority" && <Row label="Timing" value={priorityMode === "asap" ? "ASAP" : scheduledFor || "Scheduled"} />}
        <Row label="Water quantity" value={selectedSize ? `${selectedSize.toLocaleString()}L` : "Not selected"} />
        <View style={styles.divider} />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Amount to pay</Text>
          <Text style={styles.totalValue}>{naira(price)}</Text>
        </View>
      </View>

      <View style={styles.noticeCard}>
        <Ionicons name="shield-checkmark-outline" size={20} color={colors.success} />
        <Text style={styles.noticeText}>MVP payment simulation for now. Backend request is created after this step.</Text>
      </View>

      <TouchableOpacity activeOpacity={0.9} style={styles.button} onPress={onPay} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Pay & Continue</Text>}
      </TouchableOpacity>

      <TouchableOpacity activeOpacity={0.88} style={styles.cancelButton} onPress={onCancel}>
        <Ionicons name="arrow-back-circle-outline" size={18} color={colors.foreground} />
        <Text style={styles.cancelText}>Back to Request</Text>
      </TouchableOpacity>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 18 },
  centerBlock: { alignItems: "center", paddingVertical: 12 },
  heroIcon: { width: 64, height: 64, borderRadius: radius.xl, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  title: { fontSize: 22, fontWeight: "900", color: colors.foreground },
  subtitle: { marginTop: 6, fontSize: 14, lineHeight: 20, color: colors.mutedForeground, textAlign: "center" },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 16, gap: 12, ...shadow },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  rowLabel: { flex: 1, fontSize: 13, color: colors.mutedForeground },
  rowValue: { flex: 1, fontSize: 13, fontWeight: "900", color: colors.foreground, textAlign: "right" },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 15, fontWeight: "900", color: colors.foreground },
  totalValue: { fontSize: 24, fontWeight: "900", color: colors.foreground },
  noticeCard: { flexDirection: "row", gap: 10, backgroundColor: colors.successSoft, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: "#CFEFDD" },
  noticeText: { flex: 1, fontSize: 13, lineHeight: 19, color: colors.foreground },
  button: { minHeight: 56, borderRadius: radius.lg, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", ...shadow },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  cancelButton: { minHeight: 50, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  cancelText: { fontSize: 15, fontWeight: "800", color: colors.foreground },
});
