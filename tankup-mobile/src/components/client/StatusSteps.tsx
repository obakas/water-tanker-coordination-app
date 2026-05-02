import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, radius, shadow } from "@/src/constants/tankupTheme";

export function BatchStep({ otp, batchId, onViewTanker, onLeaveBatch }: { otp: string; batchId?: number | null; onViewTanker: () => void; onLeaveBatch: () => void }) {
  return (
    <View style={styles.stack}>
      <StatusHero icon="people-outline" title="You joined a batch" subtitle="Your request is paid and waiting for the batch to fill." />
      <View style={styles.card}>
        <Text style={styles.kicker}>Batch ID</Text>
        <Text style={styles.big}>{batchId ?? "Pending"}</Text>
        <Text style={styles.body}>Keep this OTP. Driver must verify it after measurement before delivery is completed.</Text>
        <View style={styles.otpBox}><Text style={styles.otp}>{otp}</Text></View>
      </View>
      <PrimaryButton label="View Tanker Progress" onPress={onViewTanker} />
      <OutlineButton label="Leave Batch" icon="exit-outline" onPress={onLeaveBatch} />
    </View>
  );
}

export function TankerStep({ requestId, onArrived }: { requestId?: number | null; onArrived: () => void }) {
  return (
    <View style={styles.stack}>
      <StatusHero icon="car-outline" title="Tanker assigned" subtitle="This mirrors the web tanker step. Live map/polling can plug in next." />
      <View style={styles.card}>
        <Text style={styles.kicker}>Request ID</Text>
        <Text style={styles.big}>{requestId ?? "Pending"}</Text>
        <Text style={styles.body}>Status timeline: assigned → loading → delivering → arrived → measurement → OTP.</Text>
      </View>
      <PrimaryButton label="Simulate Arrived" onPress={onArrived} />
    </View>
  );
}

export function DeliveryStep({ onConfirm }: { onConfirm: () => void }) {
  return (
    <View style={styles.stack}>
      <StatusHero icon="speedometer-outline" title="Confirm delivery" subtitle="Measurement and OTP verification belong here, same discipline as the web app." />
      <View style={styles.card}>
        <Text style={styles.body}>Next patch can connect this to backend DeliveryRecord: arrive → start measurement → finish measurement → OTP → complete.</Text>
      </View>
      <PrimaryButton label="Confirm Delivered" onPress={onConfirm} />
    </View>
  );
}

export function CompletedStep({ onDone }: { onDone: () => void }) {
  return (
    <View style={styles.stack}>
      <StatusHero icon="checkmark-circle-outline" title="Delivery completed" subtitle="Clean ending state. No zombie request, no limbo screen. Lovely." />
      <PrimaryButton label="Start New Request" onPress={onDone} />
    </View>
  );
}

function StatusHero({ icon, title, subtitle }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string }) {
  return (
    <View style={styles.centerBlock}>
      <View style={styles.heroIcon}><Ionicons name={icon} size={30} color={colors.primary} /></View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <TouchableOpacity activeOpacity={0.9} style={styles.button} onPress={onPress}><Text style={styles.buttonText}>{label}</Text></TouchableOpacity>;
}

function OutlineButton({ label, icon, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return <TouchableOpacity activeOpacity={0.88} style={styles.outlineButton} onPress={onPress}><Ionicons name={icon} size={18} color={colors.foreground} /><Text style={styles.outlineText}>{label}</Text></TouchableOpacity>;
}

const styles = StyleSheet.create({
  stack: { gap: 18 },
  centerBlock: { alignItems: "center", paddingVertical: 12 },
  heroIcon: { width: 64, height: 64, borderRadius: radius.xl, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  title: { fontSize: 22, lineHeight: 29, fontWeight: "900", color: colors.foreground, textAlign: "center" },
  subtitle: { marginTop: 6, fontSize: 14, lineHeight: 20, color: colors.mutedForeground, textAlign: "center" },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 18, gap: 10, ...shadow },
  kicker: { fontSize: 12, fontWeight: "900", textTransform: "uppercase", color: colors.mutedForeground },
  big: { fontSize: 28, fontWeight: "900", color: colors.foreground },
  body: { fontSize: 14, lineHeight: 21, color: colors.mutedForeground },
  otpBox: { marginTop: 6, borderRadius: radius.lg, backgroundColor: colors.primarySoft, padding: 18, alignItems: "center" },
  otp: { fontSize: 30, letterSpacing: 5, fontWeight: "900", color: colors.primary },
  button: { minHeight: 56, borderRadius: radius.lg, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", ...shadow },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  outlineButton: { minHeight: 50, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  outlineText: { fontSize: 15, fontWeight: "800", color: colors.foreground },
});
