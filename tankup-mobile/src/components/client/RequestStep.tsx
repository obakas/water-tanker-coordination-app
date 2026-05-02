import { Ionicons } from "@expo/vector-icons";
import { TextInput, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  BATCH_PRICE_PER_LITER,
  colors,
  PLATFORM_BATCH_COMMISSION_RATE,
  PLATFORM_PRIORITY_COMMISSION_RATE,
  PRIORITY_FULL_TANKER_PRICE,
  radius,
  shadow,
  TANK_SIZES,
} from "@/src/constants/tankupTheme";
import type { PriorityMode, RequestMode } from "@/types/client";

function naira(value: number) {
  return `₦${Math.round(value).toLocaleString()}`;
}

export default function RequestStep({
  requestMode,
  selectedSize,
  priorityMode,
  scheduledFor,
  address,
  price,
  canContinueToPayment,
  onSelectMode,
  onSelectSize,
  onSelectPriorityMode,
  onSetScheduledFor,
  onSetAddress,
  onContinue,
  onCancel,
}: {
  requestMode: RequestMode;
  selectedSize: number | null;
  priorityMode: PriorityMode;
  scheduledFor: string;
  address: string;
  price: number;
  canContinueToPayment: boolean;
  onSelectMode: (mode: RequestMode) => void;
  onSelectSize: (size: number) => void;
  onSelectPriorityMode: (mode: PriorityMode) => void;
  onSetScheduledFor: (value: string) => void;
  onSetAddress: (value: string) => void;
  onContinue: () => void;
  onCancel: () => void;
}) {
  return (
    <View style={styles.stack}>
      <View style={styles.centerBlock}>
        <View style={styles.heroIcon}>
          <Ionicons name="water-outline" size={30} color={colors.primary} />
        </View>
        <Text style={styles.title}>Choose your delivery option</Text>
        <Text style={styles.subtitle}>Pick the plan that works best for you</Text>
      </View>

      <View style={styles.modeStack}>
        <TouchableOpacity
          activeOpacity={0.88}
          style={[styles.modeCard, requestMode === "batch" && styles.batchModeActive]}
          onPress={() => onSelectMode("batch")}
        >
          <View style={styles.modeContent}>
            <View style={[styles.modeIcon, styles.batchIcon]}>
              <Ionicons name="people-outline" size={23} color={colors.primary} />
            </View>
            <View style={styles.modeTextWrap}>
              <View style={styles.modeTitleRow}>
                <Text style={styles.modeTitle}>Batch Saver</Text>
                <Text style={[styles.pill, styles.primaryPill]}>Lower Cost</Text>
              </View>
              <Text style={styles.modeSub}>Join nearby customers in your area and pay less. Delivery starts when the batch is filled.</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.88}
          style={[styles.modeCard, requestMode === "priority" && styles.priorityModeActive]}
          onPress={() => onSelectMode("priority")}
        >
          <View style={styles.modeContent}>
            <View style={[styles.modeIcon, styles.priorityIcon]}>
              <Ionicons name="flash-outline" size={23} color={colors.warning} />
            </View>
            <View style={styles.modeTextWrap}>
              <View style={styles.modeTitleRow}>
                <Text style={styles.modeTitle}>Priority Delivery</Text>
                <Text style={[styles.pill, styles.warningPill]}>Premium</Text>
              </View>
              <Text style={styles.modeSub}>Get faster delivery with ASAP dispatch or choose an exact delivery time. Full tanker payment required.</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {requestMode === "priority" && (
        <View style={styles.panelCard}>
          <Text style={styles.sectionTitle}>Choose delivery timing</Text>
          <Text style={styles.sectionSub}>Priority delivery requires either ASAP dispatch or an exact delivery time.</Text>

          <View style={styles.timingGrid}>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => {
                onSelectPriorityMode("asap");
                onSetScheduledFor("");
              }}
              style={[styles.timingCard, priorityMode === "asap" && styles.timingActive]}
            >
              <Text style={styles.timingTitle}>ASAP</Text>
              <Text style={styles.timingSub}>Earliest realistic delivery after loading.</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => onSelectPriorityMode("scheduled")}
              style={[styles.timingCard, priorityMode === "scheduled" && styles.timingActive]}
            >
              <Text style={styles.timingTitle}>Schedule Time</Text>
              <Text style={styles.timingSub}>Choose an exact date and time.</Text>
            </TouchableOpacity>
          </View>

          {priorityMode === "asap" ? (
            <View style={styles.warningNote}>
              <Text style={styles.warningTitle}>ASAP includes loading and dispatch buffer</Text>
              <Text style={styles.warningText}>Tankers usually load after a request is placed, so the earliest time must be realistic.</Text>
            </View>
          ) : (
            <View>
              <Text style={styles.label}>Scheduled time</Text>
              <TextInput
                value={scheduledFor}
                onChangeText={onSetScheduledFor}
                placeholder="2026-05-02T15:30:00"
                placeholderTextColor={colors.mutedForeground}
                style={styles.input}
              />
              <Text style={styles.helperText}>Use ISO style for now. Later we can add a proper date/time picker.</Text>
            </View>
          )}
        </View>
      )}

      <View>
        <Text style={styles.sectionTitle}>How much water do you need?</Text>
        <Text style={styles.sectionSub}>Select your tank size</Text>
      </View>

      <View style={styles.sizeGrid}>
        {TANK_SIZES.map((size) => {
          const isActive = selectedSize === size;
          return (
            <TouchableOpacity key={size} activeOpacity={0.88} style={[styles.sizeCard, isActive && styles.sizeCardActive]} onPress={() => onSelectSize(size)}>
              <Text style={styles.sizeMain}>{Number(size / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k</Text>
              <Text style={styles.sizeSub}>{size.toLocaleString()} Liters</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View>
        <Text style={styles.label}>Delivery address</Text>
        <TextInput
          value={address}
          onChangeText={onSetAddress}
          placeholder="e.g. Asokoro, Abuja"
          placeholderTextColor={colors.mutedForeground}
          style={styles.textArea}
          multiline
        />
      </View>

      {selectedSize && (
        <View style={styles.summaryCard}>
          <SummaryRow label="Delivery type" value={requestMode === "batch" ? "Batch Saver" : "Priority Delivery"} />
          {requestMode === "priority" && <SummaryRow label="Priority timing" value={priorityMode === "asap" ? "ASAP" : scheduledFor || "Not selected"} />}
          <SummaryRow label="Water quantity" value={`${selectedSize.toLocaleString()}L`} />
          <SummaryRow label="Platform commission" value={`${requestMode === "batch" ? PLATFORM_BATCH_COMMISSION_RATE : PLATFORM_PRIORITY_COMMISSION_RATE}%`} />
          <SummaryRow label="Rate" value={requestMode === "batch" ? `${naira(BATCH_PRICE_PER_LITER)}/liter` : `Full tanker ${naira(PRIORITY_FULL_TANKER_PRICE)}`} />
          {requestMode === "priority" && (
            <View style={styles.warningNote}>
              <Text style={styles.warningTitle}>Priority reserves the whole tanker</Text>
              <Text style={styles.warningText}>You pay the full tanker fee even if your tank size is smaller.</Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{naira(price)}</Text>
          </View>
        </View>
      )}

      <TouchableOpacity activeOpacity={0.9} style={[styles.button, !canContinueToPayment && styles.buttonDisabled]} onPress={onContinue} disabled={!canContinueToPayment}>
        <Text style={styles.buttonText}>Continue to Payment</Text>
      </TouchableOpacity>

      <TouchableOpacity activeOpacity={0.88} style={styles.cancelButton} onPress={onCancel}>
        <Ionicons name="close-circle-outline" size={18} color={colors.foreground} />
        <Text style={styles.cancelText}>Cancel Request</Text>
      </TouchableOpacity>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 18 },
  centerBlock: { alignItems: "center", paddingVertical: 12 },
  heroIcon: { width: 64, height: 64, borderRadius: radius.xl, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  title: { fontSize: 22, lineHeight: 29, fontWeight: "900", color: colors.foreground, textAlign: "center" },
  subtitle: { marginTop: 6, fontSize: 14, color: colors.mutedForeground, textAlign: "center" },
  modeStack: { gap: 12 },
  modeCard: { backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border, borderRadius: radius.lg, padding: 16 },
  batchModeActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft, ...shadow },
  priorityModeActive: { borderColor: colors.warning, backgroundColor: colors.warningSoft, ...shadow },
  modeContent: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  modeIcon: { width: 46, height: 46, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  batchIcon: { backgroundColor: colors.primarySoft },
  priorityIcon: { backgroundColor: colors.warningSoft },
  modeTextWrap: { flex: 1 },
  modeTitleRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  modeTitle: { fontSize: 16, fontWeight: "900", color: colors.foreground },
  pill: { fontSize: 11, fontWeight: "800", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, overflow: "hidden" },
  primaryPill: { color: colors.primary, backgroundColor: "#FFFFFF" },
  warningPill: { color: colors.warning, backgroundColor: "#FFFFFF" },
  modeSub: { marginTop: 7, fontSize: 13, lineHeight: 20, color: colors.mutedForeground },
  panelCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "900", color: colors.foreground },
  sectionSub: { marginTop: 4, fontSize: 13, lineHeight: 19, color: colors.mutedForeground },
  timingGrid: { flexDirection: "row", gap: 10 },
  timingCard: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, backgroundColor: colors.background },
  timingActive: { borderColor: colors.warning, backgroundColor: colors.warningSoft },
  timingTitle: { fontSize: 14, fontWeight: "900", color: colors.foreground },
  timingSub: { marginTop: 5, fontSize: 11, lineHeight: 16, color: colors.mutedForeground },
  warningNote: { borderWidth: 1, borderColor: "#FAD693", borderRadius: radius.md, backgroundColor: colors.warningSoft, padding: 12 },
  warningTitle: { fontSize: 13, fontWeight: "900", color: colors.foreground },
  warningText: { marginTop: 4, fontSize: 12, lineHeight: 17, color: colors.mutedForeground },
  sizeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  sizeCard: { width: "31.7%", minHeight: 82, borderRadius: radius.lg, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.card, alignItems: "center", justifyContent: "center", padding: 10 },
  sizeCardActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft, ...shadow },
  sizeMain: { fontSize: 23, fontWeight: "900", color: colors.foreground },
  sizeSub: { marginTop: 4, fontSize: 11, color: colors.mutedForeground, textAlign: "center" },
  label: { fontSize: 14, fontWeight: "900", color: colors.foreground, marginBottom: 8 },
  input: { minHeight: 50, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.input, backgroundColor: colors.card, padding: 14, fontSize: 15, color: colors.foreground },
  helperText: { marginTop: 7, fontSize: 12, lineHeight: 17, color: colors.mutedForeground },
  textArea: { minHeight: 96, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.input, backgroundColor: colors.card, padding: 14, fontSize: 15, color: colors.foreground, textAlignVertical: "top" },
  summaryCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 16, gap: 11 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  summaryLabel: { flex: 1, fontSize: 13, color: colors.mutedForeground },
  summaryValue: { flex: 1, fontSize: 13, fontWeight: "800", color: colors.foreground, textAlign: "right" },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 2 },
  totalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  totalLabel: { fontSize: 15, fontWeight: "900", color: colors.foreground },
  totalValue: { fontSize: 22, fontWeight: "900", color: colors.foreground },
  button: { minHeight: 56, borderRadius: radius.lg, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", ...shadow },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  cancelButton: { minHeight: 50, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  cancelText: { fontSize: 15, fontWeight: "800", color: colors.foreground },
});
