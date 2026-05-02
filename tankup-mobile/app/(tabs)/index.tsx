import { Link } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.badge}>TankUp Mobile MVP</Text>

      <Text style={styles.title}>Water delivery, without wahala.</Text>

      <Text style={styles.subtitle}>
        Request shared batch delivery or priority tanker delivery directly from
        your phone.
      </Text>

      <Link href="/request" asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Create Water Request</Text>
        </TouchableOpacity>
      </Link>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>MVP Focus</Text>
        <Text style={styles.cardText}>• Batch delivery</Text>
        <Text style={styles.cardText}>• Priority delivery</Text>
        <Text style={styles.cardText}>• Driver assignment</Text>
        <Text style={styles.cardText}>• Delivery tracking</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#ccfbf1",
    color: "#0f766e",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontWeight: "700",
    marginBottom: 20,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: "#475569",
    marginBottom: 28,
  },
  button: {
    backgroundColor: "#0f766e",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  buttonText: {
    color: "white",
    fontWeight: "800",
    fontSize: 16,
  },
  card: {
    backgroundColor: "white",
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 10,
    color: "#0f172a",
  },
  cardText: {
    fontSize: 15,
    color: "#334155",
    marginBottom: 6,
  },
});