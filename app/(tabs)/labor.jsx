import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { createTask } from '../../src/api/services';

export default function RegistrarLabor() {
  // Leemos la finca seleccionada desde la URL (?farmId=..., ?farmName=...)
  const { farmId = 'farm-a', farmName = '(sin nombre)' } = useLocalSearchParams();

  // Estado del formulario
  const [type, setType]   = useState('riego');
  const [cost, setCost]   = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const submit = async () => {
    setMsg('');
    if (!type) { setMsg('Seleccione un tipo.'); return; }

    const payload = {
      farmId: String(farmId),
      type,                                    // 'siembra' | 'riego' | 'fertilizacion' | 'maleza'
      cost: Number(cost) || 0,
      notes: notes.trim(),
      ts: new Date().toISOString()             // fecha de la labor
    };

    try {
      setSaving(true);
      await createTask(payload);
      setMsg('✅ Labor guardada.');
      setCost(''); setNotes('');
    } catch (e) {
      setMsg('❌ Error al guardar: ' + (e.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const Option = ({ value, label }) => (
    <Pressable
      onPress={() => setType(value)}
      style={{
        padding: 8,
        marginRight: 8,
        borderWidth: 1,
        borderColor: type === value ? '#2563eb' : '#ccc',
        borderRadius: 6
      }}
    >
      <Text style={{ color: type === value ? '#2563eb' : '#333' }}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: '600' }}>Registrar labor</Text>
      <Text>Finca: {farmName} ({farmId})</Text>

      <Text style={{ marginTop: 8, fontWeight: '600' }}>Tipo</Text>
      <View style={{ flexDirection: 'row', marginBottom: 4, flexWrap: 'wrap' }}>
        <Option value="siembra" label="Siembra" />
        <Option value="riego" label="Riego" />
        <Option value="fertilizacion" label="Fertilización" />
        <Option value="maleza" label="Control de malezas" />
      </View>

      <Text style={{ marginTop: 8, fontWeight: '600' }}>Costo estimado (C$)</Text>
      <TextInput
        inputMode="numeric"
        value={cost}
        onChangeText={setCost}
        placeholder="0.00"
        style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 }}
      />

      <Text style={{ marginTop: 8, fontWeight: '600' }}>Notas</Text>
      <TextInput
        multiline
        numberOfLines={4}
        value={notes}
        onChangeText={setNotes}
        placeholder="Detalle de la labor…"
        style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, minHeight: 90 }}
      />

      <Pressable
        onPress={submit}
        disabled={saving}
        style={{
          backgroundColor: '#2563eb',
          opacity: saving ? 0.6 : 1,
          padding: 12,
          borderRadius: 10,
          alignItems: 'center',
          marginTop: 8
        }}
      >
        <Text style={{ color: 'white', fontWeight: '600' }}>
          {saving ? 'Guardando…' : 'Guardar'}
        </Text>
      </Pressable>

      {!!msg && <Text style={{ marginTop: 8 }}>{msg}</Text>}
    </View>
  );
}
