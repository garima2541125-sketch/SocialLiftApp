import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { PHOTO_STYLES } from '../../src/ai/localAi';

// Lets the user check the design notes Qwen3-VL wrote about a reference
// post. New posts are drawn from scratch from these notes, so what's
// written here is exactly what Qwen-Image is told.

const PURPLE = '#6C5CE7';
const PURPLE_LIGHT = '#EFEBFB';
const DARK_TEXT = '#1A1A1A';
const GRAY_TEXT = '#6B6B6B';
const BORDER = '#E7E3D9';
const PANEL_BG = '#FBFAF6';
const RED = '#C1443A';

const PHOTO_STYLE_LABELS = { circle: 'In a circle', cutout: 'Cut out', rect: 'In a frame', none: 'No photo' };
const PHOTO_SIDES = ['left', 'right', 'center'];

function Pill({ label, active, onPress }) {
  return (
    <TouchableOpacity style={[styles.pill, active && styles.pillActive]} onPress={onPress} activeOpacity={0.85}>
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function ReferenceEditor({ draft, onChange, onSave, onCancel, saving, detectError }) {
  const info = draft.styleInfo || {};
  const setInfo = (changes) => onChange({ ...draft, styleInfo: { ...info, ...changes } });
  const ready = draft.label.trim() && (info.style || '').trim() && !draft.detecting;

  return (
    <View style={styles.editor}>
      <Text style={styles.title}>Check the design notes</Text>
      <Text style={styles.subtitle}>
        {draft.detecting
          ? 'Studying your reference post…'
          : 'New posts are drawn entirely from scratch from these notes — the reference image is only studied, never ' +
            'reused or written on. The header and footer use your Brand Kit name, logo and contact details.'}
      </Text>
      {detectError ? <Text style={styles.error}>{detectError}</Text> : null}

      <View style={styles.row}>
        <View style={[styles.imageFrame, { aspectRatio: draft.width / draft.height }]}>
          <Image source={{ uri: draft.imageUri }} style={styles.image} resizeMode="stretch" />
        </View>

        <View style={styles.side}>
          <Text style={styles.label}>Post category</Text>
          <TextInput
            value={draft.label}
            onChangeText={(label) => onChange({ ...draft, label })}
            placeholder="e.g. Placement congratulations"
            placeholderTextColor={GRAY_TEXT}
            style={styles.input}
          />

          <Text style={[styles.label, styles.gap]}>Design notes</Text>
          <TextInput
            value={info.style || ''}
            onChangeText={(style) => setInfo({ style })}
            placeholder="Background, colours, decorations, how text is laid out…"
            placeholderTextColor={GRAY_TEXT}
            style={[styles.input, styles.notes]}
            multiline
          />

          <Text style={[styles.label, styles.gap]}>Main heading lettering</Text>
          <TextInput
            value={info.headingStyle || ''}
            onChangeText={(headingStyle) => setInfo({ headingStyle })}
            placeholder="e.g. large purple brush-script"
            placeholderTextColor={GRAY_TEXT}
            style={styles.input}
          />

          <Text style={[styles.label, styles.gap]}>Colours</Text>
          <View style={styles.pillRow}>
            {(info.palette || []).map((c) => (
              <View key={c} style={[styles.swatch, { backgroundColor: c }]} />
            ))}
            <TextInput
              value={(info.palette || []).join(' ')}
              onChangeText={(v) => setInfo({ palette: v.split(/[\s,]+/).filter((c) => /^#[0-9a-f]{6}$/i.test(c)) })}
              placeholder="#5A2A82 #1C5DB5 …"
              placeholderTextColor={GRAY_TEXT}
              style={[styles.input, styles.paletteInput]}
            />
          </View>

          <Text style={[styles.label, styles.gap]}>How a person's photo is shown</Text>
          <View style={styles.pillRow}>
            {PHOTO_STYLES.map((s) => (
              <Pill key={s} label={PHOTO_STYLE_LABELS[s]} active={info.photoStyle === s} onPress={() => setInfo({ photoStyle: s })} />
            ))}
          </View>
          {info.photoStyle !== 'none' && (
            <View style={[styles.pillRow, styles.smallGap]}>
              {PHOTO_SIDES.map((s) => (
                <Pill
                  key={s}
                  label={s === 'center' ? 'Centre' : s.charAt(0).toUpperCase() + s.slice(1)}
                  active={info.photoSide === s}
                  onPress={() => setInfo({ photoSide: s })}
                />
              ))}
            </View>
          )}

          <View style={[styles.pillRow, styles.gap]}>
            <TouchableOpacity
              style={[styles.saveBtn, (!ready || saving) && styles.disabled]}
              onPress={onSave}
              disabled={!ready || saving}
              activeOpacity={0.88}
            >
              <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save reference'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.85}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  editor: { backgroundColor: PANEL_BG, borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 16, marginTop: 14 },
  title: { fontSize: 14, fontWeight: '700', color: DARK_TEXT, marginBottom: 4 },
  subtitle: { fontSize: 12, color: GRAY_TEXT, lineHeight: 17, marginBottom: 12 },
  error: { fontSize: 12, color: RED, lineHeight: 17, marginBottom: 12 },

  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
  imageFrame: { width: 300, maxWidth: '100%', alignSelf: 'flex-start', borderRadius: 8, overflow: 'hidden', backgroundColor: '#fff' },
  image: { width: '100%', height: '100%' },
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(47,143,91,0.22)',
    borderColor: '#2F8F5B',
    borderWidth: 1.5,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    padding: 3,
  },
  bandText: { fontSize: 10, fontWeight: '700', color: '#fff', backgroundColor: '#2F8F5B', paddingHorizontal: 5, borderRadius: 4 },
  side: { flex: 1, minWidth: 280 },

  label: { fontSize: 11, fontWeight: '700', color: GRAY_TEXT, marginBottom: 6 },
  gap: { marginTop: 14 },
  smallGap: { marginTop: 8 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12.5,
    color: DARK_TEXT,
  },
  notes: { minHeight: 120, textAlignVertical: 'top', lineHeight: 18 },
  paletteInput: { flex: 1, minWidth: 160 },
  swatch: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: BORDER },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  pill: { borderWidth: 1, borderColor: BORDER, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pillActive: { borderColor: PURPLE, backgroundColor: PURPLE_LIGHT },
  pillText: { fontSize: 11, color: GRAY_TEXT, fontWeight: '600' },
  pillTextActive: { color: DARK_TEXT, fontWeight: '700' },

  saveBtn: { backgroundColor: PURPLE, borderRadius: 9, paddingHorizontal: 18, paddingVertical: 10 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 12.5 },
  cancelBtn: { borderWidth: 1, borderColor: BORDER, borderRadius: 9, paddingHorizontal: 16, paddingVertical: 10 },
  cancelBtnText: { color: DARK_TEXT, fontWeight: '600', fontSize: 12.5 },
  disabled: { opacity: 0.45 },
});
