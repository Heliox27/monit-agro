import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Button } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { getFarms } from "../api/services";

export default function LoginSelect({ navigation }) {
  const [selected, setSelected] = useState(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["farms"],
    queryFn: getFarms,
  });

  if (isLoading) return <View style={{padding:16}}><Text>Cargando fincas…</Text></View>;
  if (isError)   return <View style={{padding:16}}><Text>Error al cargar fincas</Text></View>;

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "600" }}>Elegí tu finca</Text>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSelected(item.id)}
            style={{
              padding: 12,
              borderWidth: 1,
              borderColor: selected === item.id ? "#16a34a" : "#ccc",
              backgroundColor: selected === item.id ? "#dcfce7" : "white",
              borderRadius: 8,
              marginBottom: 8,
            }}
          >
            <Text>{item.name}</Text>
          </TouchableOpacity>
        )}
      />

      <Button
        title="Continuar"
        onPress={() => {
          // luego navegaremos a Dashboard y pasaremos farmId
          alert(`Finca seleccionada: ${selected || "(ninguna)"}`);
        }}
        disabled={!selected}
      />
    </View>
  );
}
