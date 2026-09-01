import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import DashboardShell from './DashboardShell';

const PURPLE = '#6C5CE7';
const DARK_TEXT = '#1A1A1A';
const GRAY_TEXT = '#6B6B6B';
const BORDER = '#E7E3D9';
const PANEL_BG = '#FBFAF6';
const ORANGE = '#F35D42';

const PLATFORMS = ['Instagram', 'LinkedIn'];

const SUGGESTIONS = [
  { id: 's1', text: 'Behind-the-scenes glaze-mixing reel — your reels get 3.2x more reach.' },
  { id: 's2', text: 'Customer testimonial carousel — carousels outperform single images by 40%.' },
  { id: 's3', text: 'Restock announcement for the bestselling mug set.' },
];

export default function CreatePostScreen() {
  const [platform, setPlatform] = useState('Instagram');
  const [prompt, setPrompt] = useState(
    'Announce our new autumn ceramics collection — warm, handmade, small-batch. Highlight the earthy glaze finishes.'
  );
  const [tone, setTone] = useState('Friendly & warm');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setTimeout(() => setGenerating(false), 1200);
  };

  const applySuggestion = (text) => setPrompt(text);

  return (
    <DashboardShell active="create" title="Create a post">
      <View style={styles.row}>
        <View style={styles.mainPane}>
          <Text style={styles.heading}>What are we posting today?</Text>

          <Text style={styles.fieldLabel}>Platform</Text>
          <View style={styles.platformRow}>
            {PLATFORMS.map((p) => {
              const isActive = p === platform;
              return (
                <TouchableOpacity
                  key={p}
                  style={[styles.platformPill, isActive && styles.platformPillActive]}
                  onPress={() => setPlatform(p)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.platformPillText, isActive && styles.platformPillTextActive]}>{p}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>Prompt</Text>
          <TextInput
            value={prompt}
            onChangeText={setPrompt}
            multiline
            style={styles.promptInput}
            placeholder="Tell us what you want to post about…"
            placeholderTextColor={GRAY_TEXT}
          />

          <View style={styles.twoColRow}>
            <View style={styles.toneCol}>
              <Text style={styles.fieldLabel}>Tone</Text>
              <TextInput
                value={tone}
                onChangeText={setTone}
                style={styles.toneInput}
                placeholder="e.g. Friendly & warm"
                placeholderTextColor={GRAY_TEXT}
              />
            </View>
            <View style={styles.photoCol}>
              <Text style={styles.fieldLabel}>Reference photo (optional)</Text>
              <TouchableOpacity style={styles.dropZone} activeOpacity={0.8}>
                <Text style={styles.dropZoneIcon}>🖼️</Text>
                <Text style={styles.dropZoneText}>Drop image or browse</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate} activeOpacity={0.88} disabled={generating}>
            <View style={styles.generateIconWrap}>
              <Text style={styles.generateIcon}>⚡</Text>
            </View>
            <Text style={styles.generateBtnText}>{generating ? 'Generating…' : 'Generate post'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sidePane}>
          <Text style={styles.sideHeading}>Suggested from your analytics</Text>
          {SUGGESTIONS.map((s) => (
            <TouchableOpacity key={s.id} style={styles.suggestionCard} activeOpacity={0.8} onPress={() => applySuggestion(s.text)}>
              <Text style={styles.suggestionText}>{s.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </DashboardShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 32, alignItems: 'flex-start' },
  mainPane: { flex: 1.6, minWidth: 320 },
  sidePane: { flex: 1, minWidth: 260 },

  heading: { fontFamily: 'serif', fontSize: 20, fontWeight: '700', color: DARK_TEXT, marginBottom: 22 },
  fieldLabel: { fontSize: 11.5, fontWeight: '700', color: GRAY_TEXT, marginBottom: 8, textTransform: 'capitalize' },

  platformRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  platformPill: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 8, borderWidth: 1, borderColor: BORDER, backgroundColor: '#fff' },
  platformPillActive: { backgroundColor: PURPLE, borderColor: PURPLE },
  platformPillText: { fontSize: 12.5, fontWeight: '700', color: DARK_TEXT },
  platformPillTextActive: { color: '#fff' },

  promptInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    padding: 14,
    fontSize: 13,
    color: DARK_TEXT,
    minHeight: 84,
    textAlignVertical: 'top',
    marginBottom: 22,
  },

  twoColRow: { flexDirection: 'row', gap: 20, marginBottom: 24 },
  toneCol: { flex: 1 },
  photoCol: { flex: 1 },
  toneInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13,
    color: DARK_TEXT,
  },
  dropZone: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: BORDER,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0EEE7',
  },
  dropZoneIcon: { fontSize: 13, marginRight: 8, opacity: 0.6 },
  dropZoneText: { fontSize: 12, color: GRAY_TEXT },

  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: ORANGE,
    borderRadius: 9,
    paddingVertical: 11,
    paddingHorizontal: 18,
    boxShadow: '0px 8px 18px rgba(243,93,66,0.3)',
  },
  generateIconWrap: { width: 18, height: 18, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  generateIcon: { fontSize: 10 },
  generateBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  sideHeading: { fontSize: 11.5, fontWeight: '700', color: GRAY_TEXT, marginBottom: 14 },
  suggestionCard: {
    backgroundColor: PANEL_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  suggestionText: { fontSize: 12, color: DARK_TEXT, lineHeight: 17 },
});
