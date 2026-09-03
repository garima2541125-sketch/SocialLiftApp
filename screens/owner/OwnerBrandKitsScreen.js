import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { useOwnerData } from '../../src/context/OwnerDataContext';
import OwnerDashboardShell, { PURPLE, BORDER, DARK_TEXT, GRAY_TEXT, RED } from './OwnerDashboardShell';

function BrandKitCard({ kit, onUpdate, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(kit);

  const startEdit = () => {
    setDraft(kit);
    setEditing(true);
  };

  const save = () => {
    onUpdate(kit.id, draft);
    setEditing(false);
  };

  const updateColor = (index, value) => {
    const colors = [...draft.colors];
    colors[index] = value;
    setDraft({ ...draft, colors });
  };

  if (!editing) {
    return (
      <View style={styles.card}>
        <View style={styles.swatchRow}>
          {kit.colors.map((c, i) => (
            <View key={i} style={[styles.swatch, { backgroundColor: c }]} />
          ))}
        </View>
        <Text style={styles.kitName}>{kit.name}</Text>
        <Text style={styles.kitDetail}>Font: {kit.font}</Text>
        <Text style={styles.kitDetail}>Voice: {kit.tone}</Text>
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.editBtn} onPress={startEdit}>
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onRemove(kit.id)}>
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, styles.cardEditing]}>
      <Text style={styles.fieldLabel}>Kit name</Text>
      <TextInput style={styles.input} value={draft.name} onChangeText={(v) => setDraft({ ...draft, name: v })} />

      <Text style={styles.fieldLabel}>Colors (hex)</Text>
      <View style={styles.colorEditRow}>
        {draft.colors.map((c, i) => (
          <View key={i} style={styles.colorEditItem}>
            <View style={[styles.swatchSmall, { backgroundColor: c }]} />
            <TextInput
              style={styles.colorInput}
              value={c}
              onChangeText={(v) => updateColor(i, v)}
              autoCapitalize="none"
            />
          </View>
        ))}
      </View>

      <Text style={styles.fieldLabel}>Primary font</Text>
      <TextInput style={styles.input} value={draft.font} onChangeText={(v) => setDraft({ ...draft, font: v })} />

      <Text style={styles.fieldLabel}>Voice & tone</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={draft.tone}
        onChangeText={(v) => setDraft({ ...draft, tone: v })}
        multiline
      />

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.saveBtn} onPress={save}>
          <Text style={styles.saveBtnText}>Save kit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setEditing(false)}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function OwnerBrandKitsScreen() {
  const { brandKits, addBrandKit, updateBrandKit, removeBrandKit } = useOwnerData();

  return (
    <OwnerDashboardShell
      active="brand-kits"
      title="Brand Kits"
      subtitle="Colors, fonts, and voice guidelines your team uses when creating posts."
      headerRight={
        <TouchableOpacity style={styles.newBtn} onPress={addBrandKit}>
          <Text style={styles.newBtnText}>+ New brand kit</Text>
        </TouchableOpacity>
      }
    >
      <View style={styles.grid}>
        {brandKits.map((kit) => (
          <BrandKitCard key={kit.id} kit={kit} onUpdate={updateBrandKit} onRemove={removeBrandKit} />
        ))}
      </View>

      {brandKits.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🎨</Text>
          <Text style={styles.emptyTitle}>No brand kits yet</Text>
          <Text style={styles.emptyBody}>Create one to keep every team member's posts on-brand.</Text>
        </View>
      )}
    </OwnerDashboardShell>
  );
}

const styles = StyleSheet.create({
  newBtn: { backgroundColor: PURPLE, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9 },
  newBtnText: { color: '#fff', fontWeight: '700', fontSize: 12.5 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: { flexGrow: 1, flexBasis: 300, maxWidth: 380, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: BORDER, padding: 18 },
  cardEditing: { borderColor: PURPLE, boxShadow: '0px 0px 0px 3px rgba(108, 92, 231, 0.12)' },

  swatchRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  swatch: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: '#00000014' },
  kitName: { fontSize: 14.5, fontWeight: '700', color: DARK_TEXT, marginBottom: 6 },
  kitDetail: { fontSize: 12, color: GRAY_TEXT, marginBottom: 2 },

  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 16 },
  editBtn: { backgroundColor: '#F1EFE9', borderRadius: 7, paddingHorizontal: 12, paddingVertical: 7 },
  editBtnText: { fontSize: 11.5, fontWeight: '700', color: DARK_TEXT },
  removeText: { fontSize: 11.5, fontWeight: '700', color: RED },

  fieldLabel: { fontSize: 10.5, fontWeight: '700', color: GRAY_TEXT, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: BORDER, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9, fontSize: 12.5, color: DARK_TEXT, backgroundColor: '#FAF9F5' },
  multiline: { minHeight: 56, textAlignVertical: 'top' },
  colorEditRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  colorEditItem: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: BORDER, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, backgroundColor: '#FAF9F5' },
  swatchSmall: { width: 16, height: 16, borderRadius: 4 },
  colorInput: { fontSize: 11.5, color: DARK_TEXT, minWidth: 62 },

  saveBtn: { backgroundColor: PURPLE, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  cancelText: { fontSize: 12, fontWeight: '600', color: GRAY_TEXT },

  emptyState: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: BORDER, borderRadius: 14, paddingVertical: 64, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 36, marginBottom: 12 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: DARK_TEXT, marginBottom: 6 },
  emptyBody: { fontSize: 12.5, color: GRAY_TEXT, textAlign: 'center', maxWidth: 340, lineHeight: 19 },
});