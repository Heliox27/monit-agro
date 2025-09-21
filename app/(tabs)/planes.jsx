import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors } from "../../src/theme";
import { useSelection } from "../../src/state/selection";

export default function PlanesScreen() {
  const { farm } = useSelection();
  const [billing, setBilling] = useState("monthly"); // "monthly" | "yearly"

  // Si en el futuro manejas estado real de suscripción:
  const currentPlan = null; // "basic" | "premium" | null

  const BASIC_PRICE = 9.99;
  const PREMIUM_PRICE = 19.99;
  const YEARLY_DISCOUNT = 0.85; // -15%

  const price = (base) =>
    billing === "monthly" ? base : +(base * 12 * YEARLY_DISCOUNT).toFixed(2);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Text style={styles.title}>Planes</Text>
      <Text style={styles.subtle}>
        Parcela: <Text style={styles.bold}>{farm?.name || "—"}</Text>
      </Text>

      {/* Toggle de facturación */}
      <View style={styles.toggleRow}>
        <Pressable
          onPress={() => setBilling("monthly")}
          style={[styles.toggle, billing === "monthly" && styles.toggleActive]}
        >
          <Text
            style={[
              styles.toggleText,
              billing === "monthly" && styles.toggleTextActive,
            ]}
          >
            Mensual
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setBilling("yearly")}
          style={[styles.toggle, billing === "yearly" && styles.toggleActive]}
        >
          <Text
            style={[
              styles.toggleText,
              billing === "yearly" && styles.toggleTextActive,
            ]}
          >
            Anual <Text style={{ fontWeight: "800" }}>(-15%)</Text>
          </Text>
        </Pressable>
      </View>

      {/* CARD: Básico */}
      <PlanCard
        planKey="basic"
        title="Básico"
        price={price(BASIC_PRICE)}
        billing={billing}
        features={[
          "1 parcela / 3 dispositivos",
          "Históricos 30 días",
          "Exportar CSV",
        ]}
        ctaLabel={currentPlan === "basic" ? "Plan actual" : "Probar"}
        disabled={currentPlan === "basic"}
        onPress={() => {
          if (currentPlan !== "basic") {
            // TODO: acción para contratar/probar
          }
        }}
      />

      {/* CARD: Premium */}
      <PlanCard
        planKey="premium"
        title="Premium"
        price={price(PREMIUM_PRICE)}
        billing={billing}
        isPopular
        features={[
          "Hasta 5 parcelas, 20 dispositivos",
          "Históricos 12 meses",
          "Gráficas avanzadas + alertas",
          "Soporte prioritario",
        ]}
        primary
        ctaLabel={currentPlan === "premium" ? "Plan actual" : "Elegir Premium"}
        disabled={currentPlan === "premium"}
        onPress={() => {
          if (currentPlan !== "premium") {
            // TODO: acción para contratar premium
          }
        }}
      />

      <Text style={styles.legal}>
        * Precios en USD. Los planes aplican al productor (tenant). Podrás
        cambiar la parcela activa desde el selector.
      </Text>
    </ScrollView>
  );
}

/* ---------- Card de plan (JS puro, sin tipos) ---------- */
function PlanCard({
  planKey,
  title,
  price,
  billing,
  features,
  ctaLabel,
  onPress,
  primary = false,
  isPopular = false,
  disabled = false,
}) {
  return (
    <View style={[styles.card, primary && styles.cardPrimary]}>
      <View style={styles.cardHeader}>
        <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardPrice}>
            {" "}
            • ${price.toFixed(2)}
            <Text style={styles.cardPer}>
              {billing === "monthly" ? "/mes" : "/año"}
            </Text>
          </Text>
        </View>

        {isPopular && (
          <View style={styles.ribbon}>
            <Ionicons name="star" size={14} color="#fff" />
            <Text style={styles.ribbonText}>Más elegido</Text>
          </View>
        )}
      </View>

      <View style={{ height: 12 }} />

      {features.map((f, i) => (
        <View key={`${planKey}-f-${i}`} style={styles.featureRow}>
          <Ionicons name="checkmark-circle" size={18} color={colors.green} />
          <Text style={styles.featureText}>{f}</Text>
        </View>
      ))}

      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={[
          styles.cta,
          primary ? styles.ctaPrimary : styles.ctaSecondary,
          disabled && styles.ctaDisabled,
        ]}
      >
        <Text
          style={[
            styles.ctaText,
            primary ? styles.ctaTextPrimary : styles.ctaTextSecondary,
            disabled && styles.ctaTextDisabled,
          ]}
        >
          {ctaLabel}
        </Text>
      </Pressable>
    </View>
  );
}

/* ---------- Estilos ---------- */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.text,
    marginBottom: 4,
  },
  subtle: { color: colors.muted, marginBottom: 12, fontSize: 16 },
  bold: { fontWeight: "800", color: colors.text },

  toggleRow: {
    flexDirection: "row",
    backgroundColor: "#EEF5E8",
    borderRadius: 999,
    padding: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  toggle: {
    flex: 1,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleActive: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.lime,
  },
  toggleText: { color: colors.muted, fontWeight: "700" },
  toggleTextActive: { color: colors.text },

  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardPrimary: {
    borderColor: "#DDEAC9",
    backgroundColor: "#FAFDF6",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: { fontSize: 24, fontWeight: "900", color: colors.text },
  cardPrice: { fontSize: 22, fontWeight: "900", color: colors.text },
  cardPer: { fontSize: 14, fontWeight: "700", color: colors.muted },

  ribbon: {
    backgroundColor: colors.green,
    paddingHorizontal: 10,
    height: 26,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  ribbonText: { color: "#fff", fontWeight: "800", fontSize: 12 },

  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 7,
  },
  featureText: { color: colors.text, fontSize: 16 },

  cta: {
    marginTop: 12,
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaPrimary: { backgroundColor: colors.green },
  ctaSecondary: {
    backgroundColor: "#F6FBF1",
    borderWidth: 1,
    borderColor: colors.green,
  },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { fontWeight: "900", fontSize: 16, letterSpacing: 0.2 },
  ctaTextPrimary: { color: "#fff" },
  ctaTextSecondary: { color: colors.green },
  ctaTextDisabled: { color: "#ddd" },

  legal: {
    marginTop: 16,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
  },
});
