// app/app/(tabs)/_layout.jsx
import React, { useEffect } from "react";
import { Image, Platform } from "react-native";
import { Tabs, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSelection } from "../../src/state/selection";
import { colors } from "../../src/theme";

export default function TabsLayout() {
  // Mantén el contexto de finca desde el query param (como lo tenías)
  const { farmId, farmName } = useLocalSearchParams();
  const { setFarm } = useSelection();

  useEffect(() => {
    if (farmId) setFarm({ id: String(farmId), name: String(farmName || "") });
  }, [farmId, farmName, setFarm]);

  // Insets para que la barra inferior NO tape nada en teléfonos
  const insets = useSafeAreaInsets();

  // Tamaño de logo un poco mayor en web
  const LOGO_WIDTH = Platform.select({ web: 200, default: 160 });
  const LOGO_HEIGHT = Platform.select({ web: 40, default: 34 });

  return (
    <Tabs
      screenOptions={({ route }) => ({
        // Header con el logo
        headerTitle: () => (
          <Image
            source={require("../assets/logo-light.png")}
            style={{
              width: LOGO_WIDTH,
              height: LOGO_HEIGHT,
              resizeMode: "contain",
            }}
          />
        ),
        headerTitleAlign: "center",
        headerStyle: { backgroundColor: colors.card },
        headerShadowVisible: false,

        // Tab bar con padding dinámico para respetar la "gesture bar"
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 58 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
        },
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: "#777",
        tabBarLabelStyle: { fontSize: 12, marginBottom: 4 },

        // Iconos por pestaña
        tabBarIcon: ({ color }) => {
          const map = {
            dashboard: "home-outline",
            historicos: "analytics-outline",
            labor: "construct-outline",
            cosecha: "leaf-outline",
            planes: "pricetags-outline",
          };
          return <Ionicons name={map[route.name]} size={20} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="dashboard" options={{ title: "Inicio" }} />
      <Tabs.Screen name="historicos" options={{ title: "Históricos" }} />
      <Tabs.Screen name="labor" options={{ title: "Registrar Labor" }} />
      <Tabs.Screen name="cosecha" options={{ title: "Registrar Cosecha" }} />
      <Tabs.Screen name="planes" options={{ title: "Planes" }} />
    </Tabs>
  );
}
