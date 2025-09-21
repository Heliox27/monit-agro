import React from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { getFarms } from "../src/api/services";


export default function Home() {
  const router = useRouter();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["farms"],
    queryFn: getFarms,
    retry: false,
  });

  if (isLoading) return <View style={{padding:16}}><Text>Cargando fincas…</Text></View>;
  if (isError)   return <View style={{padding:16}}><Text>Error al cargar fincas</Text></View>;

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}>Fincas</Text>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/(tabs)/dashboard",
                params: { farmId: item.id, farmName: item.name },
              })
            }
            style={{ padding: 12, borderWidth: 1, borderRadius: 8, marginBottom: 8 }}
          >
            <Text>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
