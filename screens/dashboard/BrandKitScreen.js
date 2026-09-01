import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import DashboardShell from './DashboardShell';

const PURPLE = '#6C5CE7';
const DARK_TEXT = '#1A1A1A';
const GRAY_TEXT = '#6B6B6B';
const BORDER = '#E7E3D9';
const PANEL_BG = '#FBFAF6';
const TRACK_BG = '#F0EEE7';
const ACCENT_TINT = '#EFECFD';

const PALETTE = ['#6C5CE7', '#F35D42', '#3B6EA5', '#B9852F', '#1F2521', '#8A5FB0', '#4A7C59'];

const TONE_OPTIONS = [
  'Friendly & warm',
  'Bold & confident',
  'Minimal & precise',
  'Professional & polished',
  'Playful & fun',
  'Witty & clever',
];

export default function BrandKitScreen() {
  const router = useRouter();
  const [logoMode, setLogoMode] = useState('upload');
  const [brandText, setBrandText] = useState('');
  const [selectedColor, setSelectedColor] = useState(PALETTE[0]);
  const [selectedTone, setSelectedTone] = useState(TONE_OPTIONS[0]);
  const [saved, setSaved] = useState(false);

  const handleSave = () => setSaved(true);

  return (
    <DashboardShell active="brand-kit" title="Brand Kit">
      <Text style={styles.heading}>Set up your brand kit</Text>
      <Text style={styles.subheading}>Social Lift uses this to keep every AI-generated post on-brand.</Text>

      <View style={styles.grid}>
        <View style={styles.card}>
          <View style={styles.cardHeadRow}>
            <Text style={styles.cardTitle}>Logo</Text>
            <Text style={styles.optional}>Optional</Text>
          </View>

          <View style={styles.segmented}>
            {[
              { key: 'upload', label: 'Upload' },
              { key: 'text', label: 'Use text instead' },
            ].map((mode) => {
              const isActive = logoMode === mode.key;
              return (
                <TouchableOpacity
                  key={mode.key}
                  style={[styles.segment, isActive && styles.segmentActive]}
                  onPress={() => setLogoMode(mode.key)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>{mode.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {logoMode === 'upload' ? (
            <>
              <TouchableOpacity style={styles.dropZone} activeOpacity={0.8}>
                <Text style={styles.dropZoneIcon}>🖼️</Text>
                <Text style={styles.dropZoneText}>Drop file or browse</Text>
              </TouchableOpacity>
              <Text style={styles.mutedNote}>PNG, JPG or SVG · Max 5MB</Text>
            </>
          ) : (
            <>
              <TextInput
                value={brandText}
                onChangeText={setBrandText}
                style={styles.input}
                placeholder="e.g. Social Lift"
                placeholderTextColor="#B9B6AC"
              />
              <Text style={styles.mutedNote}>We'll style this as a wordmark instead of an image logo.</Text>
            </>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Colour palette</Text>
          <View style={styles.swatchRow}>
            {PALETTE.map((color) => {
              const isActive = selectedColor === color;
              return (
                <TouchableOpacity
                  key={color}
                  onPress={() => setSelectedColor(color)}
                  activeOpacity={0.85}
                  style={[styles.swatch, { backgroundColor: color }, isActive && styles.swatchActive]}
                />
              );
            })}
          </View>
          <Text style={styles.mutedNote}>
            Pulled from your uploaded logo — tap any swatch to make it your primary brand colour.
          </Text>

          <View style={styles.previewRow}>
            <View style={[styles.previewDot, { backgroundColor: selectedColor }]} />
            <Text style={styles.previewText}>{selectedColor.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tone of voice</Text>
          <View style={styles.toneList}>
            {TONE_OPTIONS.map((tone) => {
              const isActive = selectedTone === tone;
              return (
                <TouchableOpacity
                  key={tone}
                  style={[styles.toneItem, isActive && styles.toneItemActive]}
                  onPress={() => setSelectedTone(tone)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.radio, isActive && styles.radioActive]} />
                  <Text style={[styles.toneText, isActive && styles.toneTextActive]}>{tone}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleSave} activeOpacity={0.88}>
          <Text style={styles.primaryBtnText}>Save brand kit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/dashboard/create')} activeOpacity={0.7}>
          <Text style={styles.secondaryLink}>Start creating →</Text>
        </TouchableOpacity>
        {saved ? <Text style={styles.savedText}>✓ Saved</Text> : null}
      </View>
    </DashboardShell>
  );
}

const styles = StyleSheet.create({
  heading: { fontFamily: 'serif', fontSize: 22, fontWeight: '700', color: DARK_TEXT, marginBottom: 4 },
  subheading: { fontSize: 13, color: GRAY_TEXT, marginBottom: 22 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: {
    flexGrow: 1,
    flexBasis: 260,
    minWidth: 240,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 18,
  },
  cardHeadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 13, fontWeight: '700', color: DARK_TEXT, marginBottom: 12 },
  optional: { fontSize: 10.5, fontWeight: '600', color: GRAY_TEXT, marginBottom: 12 },
  mutedNote: { fontSize: 11, color: GRAY_TEXT, marginTop: 10, lineHeight: 15 },

  segmented: { flexDirection: 'row', backgroundColor: TRACK_BG, borderRadius: 9, padding: 3, gap: 3, marginBottom: 14 },
  segment: { flex: 1, paddingVertical: 6, borderRadius: 7, alignItems: 'center' },
  segmentActive: { backgroundColor: '#fff' },
  segmentText: { fontSize: 11.5, fontWeight: '600', color: GRAY_TEXT },
  segmentTextActive: { color: DARK_TEXT, fontWeight: '700' },

  dropZone: {
    height: 96,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: BORDER,
    borderRadius: 10,
    backgroundColor: PANEL_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropZoneIcon: { fontSize: 20, opacity: 0.55, marginBottom: 6 },
  dropZoneText: { fontSize: 12, color: GRAY_TEXT },

  input: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: DARK_TEXT,
    backgroundColor: '#fff',
  },

  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 3, borderColor: 'transparent' },
  swatchActive: { borderColor: DARK_TEXT },
  previewRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 8 },
  previewDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: BORDER },
  previewText: { fontSize: 11.5, fontWeight: '700', color: GRAY_TEXT },

  toneList: { gap: 8 },
  toneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 9,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  toneItemActive: { borderColor: PURPLE, backgroundColor: ACCENT_TINT },
  radio: { width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: BORDER, marginRight: 9 },
  radioActive: { borderColor: PURPLE, backgroundColor: PURPLE },
  toneText: { fontSize: 12, color: GRAY_TEXT },
  toneTextActive: { color: DARK_TEXT, fontWeight: '600' },

  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 22 },
  primaryBtn: {
    backgroundColor: PURPLE,
    borderRadius: 9,
    paddingVertical: 12,
    paddingHorizontal: 20,
    boxShadow: '0px 6px 16px rgba(108, 92, 231, 0.28)',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  secondaryLink: { fontSize: 13, fontWeight: '600', color: GRAY_TEXT },
  savedText: { fontSize: 12.5, fontWeight: '700', color: PURPLE },
});
