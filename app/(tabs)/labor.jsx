import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTask, getTasks, updateTask, deleteTask } from "../../src/api/services";

const schema = z.object({
  type: z.enum(["siembra", "riego", "fertilizacion", "maleza"], {
    required_error: "Seleccione un tipo",
  }),
  cost: z
    .string()
    .transform((v) => (v === "" ? "0" : v))
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, "Costo inválido")
    .transform((v) => Number(v)),
  notes: z.string().max(300, "Máx. 300 caracteres").optional().default(""),
});

const TYPES = [
  { value: "siembra", label: "Siembra" },
  { value: "riego", label: "Riego" },
  { value: "fertilizacion", label: "Fertilización" },
  { value: "maleza", label: "Control de malezas" },
];

export default function RegistrarLabor() {
  const { farmId = "farm-a", farmName = "(sin nombre)" } = useLocalSearchParams();
  const queryClient = useQueryClient();

  // --- React Hook Form
  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { type: "riego", cost: "0", notes: "" },
  });

  // --- Modo edición
  const [editingId, setEditingId] = useState(null);

  // --- Query: listar labores
  const { data: tasks = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["tasks", { farmId }],
    queryFn: getTasks,
    staleTime: 10_000,
  });

  // --- Mutations: crear / actualizar / eliminar
  const mCreate = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        farmId: String(farmId),
        ts: new Date().toISOString(),
      };
      return createTask(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", { farmId }] });
      reset({ type: "riego", cost: "0", notes: "" });
    },
  });

  const mUpdate = useMutation({
    mutationFn: async ({ id, data }) => {
      const payload = {
        ...data,
        farmId: String(farmId),
        ts: new Date().toISOString(),
      };
      return updateTask({ id, data: payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", { farmId }] });
      setEditingId(null);
      reset({ type: "riego", cost: "0", notes: "" });
    },
  });

  const mDelete = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", { farmId }] });
      if (editingId) {
        setEditingId(null);
        reset({ type: "riego", cost: "0", notes: "" });
      }
    },
  });

  // --- Submit (crear/actualizar)
  const onSubmit = (values) => {
    if (editingId) {
      mUpdate.mutate({ id: editingId, data: values });
    } else {
      mCreate.mutate(values);
    }
  };

  // --- Cargar una labor para editar
  const startEdit = (item) => {
    setEditingId(item.id);
    setValue("type", item.type);
    setValue("cost", String(item.cost ?? 0));
    setValue("notes", item.notes ?? "");
  };

  // --- Confirmar borrado
  const confirmDelete = (id) => {
    Alert.alert("Eliminar", "¿Eliminar esta labor?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: () => mDelete.mutate(id) },
    ]);
  };

  // --- UI
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Registrar labor</Text>
      <Text style={styles.muted}>Parcela: {farmName} ({farmId})</Text>

      {/* Tipo */}
      <Text style={styles.label}>Tipo</Text>
      <Controller
        control={control}
        name="type"
        render={({ field: { value, onChange } }) => (
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {TYPES.map((t) => (
              <Pressable
                key={t.value}
                onPress={() => onChange(t.value)}
                style={[
                  styles.chip,
                  value === t.value && { borderColor: "#2563eb", backgroundColor: "#eff6ff" },
                ]}
              >
                <Text style={[styles.chipText, value === t.value && { color: "#2563eb" }]}>{t.label}</Text>
              </Pressable>
            ))}
          </View>
        )}
      />
      {errors.type && <Text style={styles.error}>{errors.type.message}</Text>}

      {/* Costo */}
      <Text style={styles.label}>Costo estimado (C$)</Text>
      <Controller
        control={control}
        name="cost"
        render={({ field: { value, onChange } }) => (
          <TextInput
            inputMode="numeric"
            value={String(value)}
            onChangeText={onChange}
            placeholder="0.00"
            style={styles.input}
          />
        )}
      />
      {errors.cost && <Text style={styles.error}>{errors.cost.message}</Text>}

      {/* Notas */}
      <Text style={styles.label}>Notas</Text>
      <Controller
        control={control}
        name="notes"
        render={({ field: { value, onChange } }) => (
          <TextInput
            multiline
            numberOfLines={4}
            value={value}
            onChangeText={onChange}
            placeholder="Detalle de la labor…"
            style={[styles.input, { minHeight: 90 }]}
          />
        )}
      />
      {errors.notes && <Text style={styles.error}>{errors.notes.message}</Text>}

      {/* Botones guardar / cancelar */}
      <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
        <Pressable
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting || mCreate.isPending || mUpdate.isPending}
          style={[
            styles.btn,
            { backgroundColor: "#2563eb", opacity: (isSubmitting || mCreate.isPending || mUpdate.isPending) ? 0.6 : 1 },
          ]}
        >
          <Text style={styles.btnText}>{editingId ? "Actualizar" : "Guardar"}</Text>
        </Pressable>

        {editingId && (
          <Pressable
            onPress={() => {
              setEditingId(null);
              reset({ type: "riego", cost: "0", notes: "" });
            }}
            style={[styles.btn, { backgroundColor: "#6b7280" }]}
          >
            <Text style={styles.btnText}>Cancelar</Text>
          </Pressable>
        )}
      </View>

      {/* Lista de labores */}
      <Text style={[styles.title, { marginTop: 20 }]}>Últimas labores</Text>

      {isLoading && <Text style={styles.muted}>Cargando…</Text>}
      {isError && (
        <Text style={[styles.muted, { color: "crimson" }]}>
          Error al cargar. <Text onPress={refetch} style={{ color: "#2563eb" }}>Reintentar</Text>
        </Text>
      )}

      <FlatList
        data={tasks}
        keyExtractor={(it) => String(it.id)}
        contentContainerStyle={{ paddingVertical: 6 }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={{ fontWeight: "700" }}>
              {item.type} · {new Date(item.ts).toLocaleString()}
            </Text>
            <Text style={styles.muted}>Costo: C${item.cost ?? 0}</Text>
            {!!item.notes && <Text style={styles.muted}>Notas: {item.notes}</Text>}

            <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
              <Pressable onPress={() => startEdit(item)} style={[styles.btnSm, { backgroundColor: "#065f46" }]}>
                <Text style={styles.btnText}>Editar</Text>
              </Pressable>
              <Pressable
                onPress={() => confirmDelete(item.id)}
                style={[styles.btnSm, { backgroundColor: "#b91c1c" }]}
              >
                <Text style={styles.btnText}>Eliminar</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, gap: 6, backgroundColor: "#F6F7F5" },
  title: { fontSize: 20, fontWeight: "700", color: "#111" },
  label: { fontWeight: "600", marginTop: 8 },
  muted: { color: "#6b7280" },
  error: { color: "crimson", marginTop: 4 },
  input: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 10, backgroundColor: "#fff" },

  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fff",
    marginRight: 8, marginBottom: 8,
  },
  chipText: { color: "#374151", fontWeight: "600" },

  btn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, alignItems: "center" },
  btnSm: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, alignItems: "center" },
  btnText: { color: "white", fontWeight: "700" },

  card: {
    padding: 12, borderRadius: 12, backgroundColor: "#fff",
    borderWidth: 1, borderColor: "#e5e7eb",
  },
});
