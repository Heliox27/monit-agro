import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Image } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getFarms, getLatestReport } from "../../src/api/services";
import { useSelection } from "../../src/state/selection";
import { colors } from "../../src/theme";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { farm, setFarm } = useSelection();
  const [pickerVisible, setPickerVisible] = useState(false);

  // 1) Traer fincas para el picker
  const farmsQ = useQuery({
    queryKey: ["farms"],
    queryFn: getFarms,
  });

  // 2) Traer última lectura para KPIs
  const lastQ = useQuery({
    queryKey: ["lastReport", farm?.id || "none"],
    queryFn: () => getLatestReport(farm?.id),
    enabled: !!farm?.id,
    staleTime: 30_000,
  });

  const kpis = useMemo(() => {
    const r = lastQ.data;
    if (!r) return [];
    return [
      {
        key: "soil_moisture",
        label: "Humedad suelo",
        value: r.soil_moisture != null ? `${r.soil_moisture}%` : "—",
        icon: "water-outline",
        tint: "#8DB600",
      },
      {
        key: "soil_temp",
        label: "Temp. suelo",
        value: r.soil_temp != null ? `${r.soil_temp} °C` : "—",
        icon: "thermometer-outline",
        tint: "#7B3F00",
      },
      {
        key: "air_humidity",
        label: "Humedad aire",
        value: r.air_humidity != null ? `${r.air_humidity}%` : "—",
        icon: "cloud-outline",
        tint: colors.green,
      },
    ];
  }, [lastQ.data]);

  // 3) Acciones del picker
  const onSelectFarm = (item) => {
    setFarm({ id: String(item.id), name: String(item.name) });
    setPickerVisible(false);
    // refrescar lecturas dependientes
    queryClient.invalidateQueries({ queryKey: ["lastReport"] });
    queryClient.invalidateQueries({ queryKey: ["reports"] });
  };

  return (
    <View style={styles.screen}>
      {/* HERO */}
      <LinearGradient
        colors={[colors.green, colors.lime]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={{ gap: 6 }}>
          <Text style={styles.kicker}>Parcela seleccionada</Text>
          <Text style={styles.title}>{farm?.name || "—"}</Text>
          <Text style={styles.subId}>ID: {farm?.id || "—"}</Text>
        </View>

        <Image
          source={require("../assets/logo-borderles.png")}
          style={styles.heroLogo}
        />

        <Pressable style={styles.cta} onPress={() => setPickerVisible(true)}>
          <Text style={styles.ctaText}>Cambiar parcela</Text>
        </Pressable>
      </LinearGradient>

      {/* CARD “estado” básico (placeholder) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Finca seleccionada</Text>
        <Text style={styles.row}>
          <Text style={styles.muted}>ID: </Text>
          <Text style={styles.strong}>{farm?.id || "—"}</Text>
        </Text>
        <Text style={styles.row}>
          <Text style={styles.muted}>Nombre: </Text>
          <Text style={styles.strong}>{farm?.name || "—"}</Text>
        </Text>

        {!lastQ.isLoading && !lastQ.data && (
          <Text style={[styles.muted, { marginTop: 12 }]}>
            Próximamente: últimos datos, estado del sistema, etc.
          </Text>
        )}
      </View>

      {/* KPIs */}
      <View style={styles.kpisRow}>
        {lastQ.isLoading ? (
          <View style={styles.kpiLoading}>
            <ActivityIndicator color={colors.green} />
            <Text style={styles.muted}>Cargando KPIs…</Text>
          </View>
        ) : (
          kpis.map((k) => (
            <View key={k.key} style={styles.kpi}>
              <View style={[styles.kpiIconWrap, { backgroundColor: k.tint + "1A" }]}>
                <Ionicons name={k.icon} size={18} color={k.tint} />
              </View>
              <Text style={styles.kpiLabel}>{k.label}</Text>
              <Text style={[styles.kpiValue, { color: k.tint }]}>{k.value}</Text>
            </View>
          ))
        )}
      </View>

      {/* PICKER de parcelas */}
      <Modal
        visible={pickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Selecciona una parcela</Text>

            {farmsQ.isLoading ? (
              <View style={{ paddingVertical: 20, alignItems: "center" }}>
                <ActivityIndicator color={colors.green} />
                <Text style={styles.muted}>Cargando…</Text>
              </View>
            ) : (
              <FlatList
                data={farmsQ.data || []}
                keyExtractor={(it) => String(it.id)}
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                renderItem={({ item }) => {
                  const active = item.id === farm?.id;
                  return (
                    <Pressable
                      onPress={() => onSelectFarm(item)}
                      style={[styles.farmItem, active && styles.farmItemActive]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.farmName}>{item.name}</Text>
                        <Text style={styles.farmId}>ID: {item.id}</Text>
                      </View>
                      {active && (
                        <Ionicons name="checkmark-circle" size={20} color={colors.green} />
                      )}
                    </Pressable>
                  );
                }}
              />
            )}

            <Pressable style={styles.modalClose} onPress={() => setPickerVisible(false)}>
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 16,
  },

  // HERO
  hero: {
    padding: 20,
    borderRadius: 22,
    minHeight: 165,
    overflow: "hidden",
    marginBottom: 16,
    justifyContent: "center",
  },
  kicker: { color: "rgba(255,255,255,0.9)", fontWeight: "600" },
  title: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 30,
    letterSpacing: 0.2,
  },
  subId: { color: "rgba(255,255,255,0.9)", marginTop: 2 },

  cta: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.40)",
    marginTop: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  ctaText: { color: "#fff", fontWeight: "700" },
  heroLogo: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 120,
    height: 22,
    resizeMode: "contain",
    opacity: 0.85,
  },

  // CARD
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EEF1F3",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
    marginBottom: 14,
  },
  cardTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8, color: colors.text },
  muted: { color: colors.muted },
  strong: { fontWeight: "700", color: colors.text },
  row: { marginTop: 2 },

  // KPIs
  kpisRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    columnGap: 12,
  },
  kpi: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  kpiIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  kpiLabel: { color: colors.muted, fontSize: 12, marginBottom: 4 },
  kpiValue: { fontWeight: "800", fontSize: 18 },
  kpiLoading: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    columnGap: 8,
  },

  // MODAL picker
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
    maxHeight: "70%",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12, color: colors.text },
  farmItem: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
  },
  farmItemActive: {
    borderColor: colors.green,
    backgroundColor: "#F0F7EA",
  },
  farmName: { fontWeight: "700", color: colors.text },
  farmId: { color: colors.muted },
  modalClose: {
    alignSelf: "center",
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCloseText: { fontWeight: "700", color: colors.text },
});
