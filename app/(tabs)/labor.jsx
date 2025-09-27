import React from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { createTask } from "../../src/api/services";
import { colors } from "../../src/theme";

// === Esquema de validación (tipos que ya usabas) ===
const LaborSchema = z.object({
  type: z.enum(["siembra", "riego", "fertilizacion", "maleza"], {
    required_error: "Selecciona un tipo de labor.",
    invalid_type_error: "Tipo no válido.",
  }),
  cost: z
    .string()
    .transform((v) => v.trim().replace(",", "."))
    .refine((v) => v !== "", "El costo es obligatorio.")
    .refine((v) => !isNaN(Number(v)), "Debe ser un número.")
    .refine((v) => Number(v) >= 0, "Debe ser mayor o igual a 0."),
  notes: z
    .string()
    .max(300, "Máximo 300 caracteres.")
    .optional()
    .or(z.literal("")),
});

export default function RegistrarLabor() {
  // Igual que tu versión actual: la parcela viene por query params
  const { farmId = "farm-a", farmName = "(sin nombre)" } = useLocalSearchParams();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = useForm({
    resolver: zodResolver(LaborSchema),
    mode: "onChange",
    defaultValues: {
      type: "riego", // tu valor por defecto
      cost: "",
      notes: "",
    },
  });

  // Leemos el valor de "type" para pintar el chip activo
  const selectedType = useWatch({ control, name: "type" });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: createTask,
  });

  const onSubmit = async (values) => {
    try {
      await mutateAsync({
        farmId: String(farmId),
        type: values.type,
        cost: Number(values.cost),
        notes: values.notes?.trim() || "",
        ts: new Date().toISOString(),
      });

      Alert.alert("Éxito", "✅ Labor guardada.");
      // reseteamos costo y notas, dejamos el tipo seleccionado
      setValue("cost", "");
      setValue("notes", "");
    } catch (e) {
      Alert.alert("Error", "❌ Error al guardar: " + (e?.message || ""));
    }
  };

  // Chip tipo
  const Option = ({ value, label }) => {
    const active = selectedType === value;
    return (
      <Pressable
        onPress={() => setValue("type", value, { shouldValidate: true })}
        style={[
          styles.chip,
          { borderColor: active ? "#2563EB" : "#ccc" },
        ]}
      >
        <Text style={{ color: active ? "#2563EB" : "#333" }}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors?.bg ?? "#F7F8F7" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Registrar labor</Text>
        <Text style={styles.subtle}>
          Finca: {farmName} ({farmId})
        </Text>

        {/* Tipo */}
        <Text style={styles.label}>Tipo *</Text>
        <View style={styles.rowWrap}>
          <Option value="siembra" label="Siembra" />
          <Option value="riego" label="Riego" />
          <Option value="fertilizacion" label="Fertilización" />
          <Option value="maleza" label="Control de malezas" />
        </View>
        {errors.type && <Text style={styles.error}>{errors.type.message}</Text>}

        {/* Costo */}
        <Text style={[styles.label, { marginTop: 8 }]}>Costo estimado (C$) *</Text>
        <Controller
          control={control}
          name="cost"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              inputMode="decimal"
              keyboardType="decimal-pad"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="0.00"
              style={[styles.input, errors.cost && styles.inputError]}
              placeholderTextColor="#9CA3AF"
            />
          )}
        />
        {errors.cost && <Text style={styles.error}>{errors.cost.message}</Text>}

        {/* Notas */}
        <Text style={[styles.label, { marginTop: 8 }]}>Notas</Text>
        <Controller
          control={control}
          name="notes"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              multiline
              numberOfLines={4}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Detalle de la labor…"
              style={[
                styles.input,
                styles.textarea,
                errors.notes && styles.inputError,
              ]}
              placeholderTextColor="#9CA3AF"
            />
          )}
        />
        {errors.notes && <Text style={styles.error}>{errors.notes.message}</Text>}

        {/* Guardar */}
        <Pressable
          onPress={handleSubmit(onSubmit)}
          disabled={!isValid || isSubmitting || isPending}
          style={[
            styles.button,
            (!isValid || isSubmitting || isPending) && styles.buttonDisabled,
          ]}
        >
          <Text style={styles.buttonText}>
            {isSubmitting || isPending ? "Guardando…" : "Guardar"}
          </Text>
        </Pressable>

        <Text style={styles.hint}>
          * Campos obligatorios. Los datos se guardan en tu mock API.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "800", marginBottom: 4, color: colors?.text ?? "#111" },
  subtle: { color: colors?.muted ?? "#6B7280", marginBottom: 12 },
  label: { fontWeight: "700", color: colors?.text ?? "#111", marginBottom: 6 },

  rowWrap: { flexDirection: "row", flexWrap: "wrap", marginBottom: 4 },
  chip: {
    padding: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: colors?.card ?? "#fff",
  },

  input: {
    borderWidth: 1,
    borderColor: colors?.border ?? "#ccc",
    borderRadius: 10,
    padding: 12,
    backgroundColor: colors?.card ?? "#fff",
    color: colors?.text ?? "#111",
  },
  textarea: { minHeight: 90, textAlignVertical: "top" },
  inputError: { borderColor: "#DC2626" },
  error: { color: "#DC2626", marginTop: 4, fontWeight: "600" },

  button: {
    marginTop: 12,
    backgroundColor: "#2563EB",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "white", fontWeight: "700" },

  hint: { marginTop: 10, color: colors?.muted ?? "#6B7280", fontSize: 12 },
});
