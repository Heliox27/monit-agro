import React, { useMemo, useState } from "react";
import { View, Text, FlatList, StyleSheet, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { getReports } from "../../src/api/services";
import { colors } from "../../src/theme";

const METRICS = [
  { key: "soil_moisture", label: "Humedad suelo", unit: "%"},
  { key: "soil_temp",    label: "Temp. suelo",     unit: "°C"},
  { key: "soil_ph",      label: "pH suelo",        unit: ""},
  { key: "light",        label: "Luz",             unit: " lx"},
  { key: "air_humidity", label: "Humedad aire",    unit: "%"},
  { key: "air_temp",     label: "Temp. aire",      unit: "°C"},
];

function formatValue(key, raw) {
  if (raw === null || raw === undefined) return "—";
  switch (key) {
    case "soil_moisture":
    case "air_humidity":
      return `${raw}%`;
    case "soil_temp":
    case "air_temp":
      return `${raw} °C`;
    case "light":
      return `${raw} lx`;
    case "soil_ph":
      return String(raw);
    default:
      return String(raw);
  }
}

export default function Historicos() {
  const { farmId } = useLocalSearchParams();
  const [metric, setMetric] = useState("soil_moisture");

  const {
    data = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["reports", { farmId: farmId || "farm-a" }],
    queryFn: getReports,
    staleTime: 30_000,
  });

  const selected = useMemo(
    () => METRICS.find((m) => m.key === metric) ?? METRICS[0],
    [metric]
  );

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <Text style={styles.muted}>Cargando históricos…</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.screen}>
        <Text style={styles.error}>Error al cargar históricos</Text>
        <Text style={styles.errorSmall}>{String(error?.message || "Network Error")}</Text>
        <Text onPress={() => refetch()} style={styles.retry}>
          Reintentar
        </Text>
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View style={styles.screen}>
        <Text style={styles.muted}>No hay lecturas para esta parcela.</Text>
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.ts}>{new Date(item.ts).toLocaleString()}</Text>

      {/* Resaltado de la métrica elegida */}
      <View style={styles.highlightRow}>
        <Text style={styles.highlightLabel}>{selected.label}</Text>
        <Text style={styles.highlightValue}>
          {formatValue(selected.key, item[selected.key])}
        </Text>
      </View>

      {/* Resto de variables en una lista corta y limpia */}
      <View style={styles.grid}>
        {METRICS.filter(m => m.key !== selected.key).map((m) => (
          <View key={m.key} style={styles.gridItem}>
            <Text style={styles.gridLabel}>{m.label}</Text>
            <Text style={styles.gridValue}>{formatValue(m.key, item[m.key])}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.muted2}>
        Bomba: {item.pump_status ? "ON" : "OFF"} · Aspersores: {item.sprinkler_status ? "ON" : "OFF"}
      </Text>
    </View>
  );

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Históricos ({data.length})</Text>

      {/* CHIPS para elegir variable */}
      {/* CHIPS para elegir variable */}
<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={styles.chipsRow}   // 👈 padding a los lados y gap
>
  {METRICS.map((m) => {
    const active = m.key === metric;
    return (
      <Pressable
        key={m.key}
        onPress={() => setMetric(m.key)}
        style={[styles.chip, active && styles.chipActive]}
      >
        <Text
          numberOfLines={1}                  // 👈 evita salto/corte raro
          ellipsizeMode="tail"
          style={[styles.chipText, active && styles.chipTextActive]}
        >
          {m.label}
        </Text>
      </Pressable>
    );
  })}
</ScrollView>


      <FlatList
        data={data}
        keyExtractor={(it) => String(it.id)}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1, padding: 16,
    backgroundColor: colors?.bg ?? "#f7f8f7",
  },
  title: {
    fontSize: 18, fontWeight: "700",
    marginBottom: 8, color: colors?.text ?? "#111",
  },
  muted: { color: "#6b7280" },
  muted2: { color: "#6b7280", marginTop: 10 },
  error: { color: "crimson", fontWeight: "600" },
  errorSmall: { color: "crimson", marginTop: 4 },
  retry: { color: "#2F80ED", marginTop: 12, fontWeight: "600" },

  chip: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 999, borderWidth: 1, borderColor: "#e5e7eb",
    backgroundColor: "#fff", marginRight: 8,
  },
  chipText: { color: "#374151", fontWeight: "600" },

  card: {
    padding: 14, borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1, borderColor: "#e5e7eb",
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  ts: { fontWeight: "700", marginBottom: 8, color: colors?.text ?? "#111" },

  highlightRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 10,
    paddingVertical: 6, paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#F4FAEF", // muy suave
    borderWidth: 1, borderColor: "#E5F2D9",
  },
  highlightLabel: { color: "#4b5563", fontWeight: "600" },
  highlightValue: { color: colors?.green ?? "#568203", fontWeight: "800", fontSize: 16 },

  grid: { flexDirection: "row", flexWrap: "wrap", columnGap: 16, rowGap: 6 },
  gridItem: { width: "48%" },
  gridLabel: { color: "#6b7280" },
  gridValue: { fontWeight: "600", color: colors?.text ?? "#111" },
});
