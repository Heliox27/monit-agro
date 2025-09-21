// app/app/_layout.jsx
import React from "react";
import { View, ActivityIndicator, Platform } from "react-native";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { SelectionProvider } from "../src/state/selection";
import { colors } from "../src/theme";

import {
  useFonts,
  Poppins_800ExtraBold,
  Poppins_300Light,
} from "@expo-google-fonts/poppins";

const queryClient = new QueryClient();

export default function RootLayout() {
  // 1) Cargar fuentes
  const [fontsLoaded] = useFonts({
    Poppins_800ExtraBold,
    Poppins_300Light,
  });

  // 2) Loader mientras cargan
  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors?.bg ?? "#fff",
        }}
      >
        <ActivityIndicator color={colors?.green ?? "#568203"} />
      </View>
    );
  }

  // 3) Proveedores + contenedor de navegación
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <SelectionProvider>
          {/* StatusBar acorde al tema */}
          <StatusBar style={Platform.OS === "android" ? "light" : "auto"} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors?.bg ?? "#fff" },
            }}
          />
        </SelectionProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
