import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, shadow } from "@/src/constants/tankupTheme";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topRow}>
          <View />
          <TouchableOpacity activeOpacity={0.86} style={styles.themeButton}>
            <Ionicons name="moon-outline" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <View style={styles.centerBlock}>
          <View style={styles.logoIcon}>
            <Ionicons name="water-outline" size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.logo}>TankUp</Text>
          <Text style={styles.subtitle}>Get water delivered to your tank</Text>
        </View>

        <View style={styles.roleStack}>
          <Link href="/request" asChild>
            <TouchableOpacity activeOpacity={0.88} style={styles.roleCard}>
              <View style={[styles.roleIcon, styles.clientIcon]}>
                <Ionicons name="water" size={28} color={colors.primary} />
              </View>
              <View style={styles.roleTextWrap}>
                <Text style={styles.roleTitle}>I Need Water</Text>
                <Text style={styles.roleSub}>Request water delivery to your tank</Text>
              </View>
            </TouchableOpacity>
          </Link>

          <TouchableOpacity activeOpacity={0.88} style={styles.roleCard}>
            <View style={[styles.roleIcon, styles.driverIcon]}>
              <Ionicons name="car-outline" size={28} color={colors.success} />
            </View>
            <View style={styles.roleTextWrap}>
              <Text style={styles.roleTitle}>I'm a Tanker Driver</Text>
              <Text style={styles.roleSub}>Accept jobs, deliver water, & get paid</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, paddingHorizontal: 24, justifyContent: "center" },
  topRow: { position: "absolute", top: 18, left: 24, right: 24, flexDirection: "row", justifyContent: "space-between" },
  themeButton: { width: 44, height: 44, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" },
  centerBlock: { alignItems: "center", marginBottom: 34 },
  logoIcon: { width: 80, height: 80, borderRadius: radius.xl, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginBottom: 14, ...shadow },
  logo: { fontSize: 32, fontWeight: "900", textAlign: "center", color: colors.foreground, letterSpacing: -0.8 },
  subtitle: { marginTop: 8, fontSize: 15, textAlign: "center", color: colors.mutedForeground },
  roleStack: { gap: 16 },
  roleCard: { minHeight: 106, flexDirection: "row", alignItems: "center", gap: 18, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, padding: 20, ...shadow },
  roleIcon: { width: 56, height: 56, borderRadius: radius.lg, alignItems: "center", justifyContent: "center" },
  clientIcon: { backgroundColor: colors.primarySoft },
  driverIcon: { backgroundColor: colors.successSoft },
  roleTextWrap: { flex: 1 },
  roleTitle: { fontSize: 18, fontWeight: "900", color: colors.foreground },
  roleSub: { marginTop: 5, fontSize: 13, lineHeight: 19, color: colors.mutedForeground },
});
