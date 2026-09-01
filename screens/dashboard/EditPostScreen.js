import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DashboardShell from './DashboardShell';

const PURPLE = '#6C5CE7';
const ORANGE = '#F35D42';
const DARK_TEXT = '#1A1A1A';
const GRAY_TEXT = '#6B6B6B';
const BORDER = '#E7E3D9';
const PANEL_BG = '#FBFAF6';
const TRACK_BG = '#F0EEE7';
const ACCENT_TINT = '#EFECFD';

const DEMO_PROMPT =
  'Announce our new autumn ceramics collection — warm, handmade, small-batch. Highlight the earthy glaze finishes.';

const DEMO_CAPTION =
  'Autumn ceramics just landed. Earthy glazes, small-batch, and every piece thrown by hand this month. Pieces this warm do not stay on the shelf long.';

const DEMO_HASHTAGS = '#handmadeceramics #autumncollection #smallbatch #pottery';

const TONE_OPTIONS = ['Friendly & warm', 'Bold & confident', 'Minimal & precise'];

// Each tone previews its own voice in the hint styling.
const TONE_HINTS = {
  'Friendly & warm': {
    text: 'Warm and chatty, emoji welcome — like texting a regular.',
    style: { fontSize: 12.5, color: ORANGE },
  },
  'Bold & confident': {
    text: 'SHORT SENTENCES. STRONG CLAIMS. NO HEDGING.',
    style: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, color: PURPLE },
  },
  'Minimal & precise': {
    text: 'spare. lowercase. nothing that is not needed.',
    style: { fontSize: 12, color: GRAY_TEXT },
  },
};

export default function EditPostScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [prompt, setPrompt] = useState(params.prompt ? String(params.prompt) : DEMO_PROMPT);
  const [caption, setCaption] = useState(DEMO_CAPTION);
  const [hashtags, setHashtags] = useState(DEMO_HASHTAGS);
  const [tone, setTone] = useState(params.tone ? String(params.tone) : TONE_OPTIONS[0]);
  const [promptOpen, setPromptOpen] = useState(true);
  const [regenCaption, setRegenCaption] = useState(false);
  const [regenImage, setRegenImage] = useState(false);
  const [saveState, setSaveState] = useState('idle');

  const platform = params.platform ? String(params.platform) : 'Instagram';
  const toneHint = TONE_HINTS[tone] || TONE_HINTS[TONE_OPTIONS[0]];

  // Stands in for the generate endpoint until the backend lands.
  const handleRegenerateCaption = () => {
    setRegenCaption(true);
    setTimeout(() => setRegenCaption(false), 1100);
  };

  const handleRegenerateImage = () => {
    setRegenImage(true);
    setTimeout(() => setRegenImage(false), 1100);
  };

  const handleSave = () => {
    setSaveState('saving');
    setTimeout(() => {
      setSaveState('saved');
      router.push('/dashboard/review-queue');
    }, 700);
  };

  return (
    <DashboardShell active="create" title="Edit your post">
      <View style={styles.row}>
        <View style={styles.previewPane}>
          <View style={styles.previewCard}>
            <View style={styles.previewImage}>
              {regenImage ? (
                <ActivityIndicator color={PURPLE} />
              ) : (
                <Text style={styles.previewImageIcon}>🏺</Text>
              )}
            </View>

            <View style={styles.previewBody}>
              <View style={styles.platformPill}>
                <Text style={styles.platformPillText}>{platform}</Text>
              </View>
              <Text style={styles.previewCaption}>{caption}</Text>
              <Text style={styles.previewHashtags}>{hashtags}</Text>
            </View>

            <View style={styles.previewActions}>
              <TouchableOpacity
                style={styles.ghostBtn}
                onPress={handleRegenerateImage}
                activeOpacity={0.85}
                disabled={regenImage}
              >
                <Text style={styles.ghostBtnText}>{regenImage ? 'Regenerating…' : '↻ New image'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ghostBtn} activeOpacity={0.85}>
                <Text style={styles.ghostBtnText}>Replace</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.formPane}>
          <Text style={styles.eyebrow}>EDIT YOUR POST</Text>
          <Text style={styles.heading}>Fine-tune before you continue</Text>

          <TouchableOpacity
            style={styles.collapseRow}
            onPress={() => setPromptOpen((open) => !open)}
            activeOpacity={0.7}
          >
            <Text style={styles.fieldLabel}>Original prompt</Text>
            <Text style={styles.chevron}>{promptOpen ? '⌃' : '⌄'}</Text>
          </TouchableOpacity>

          {promptOpen ? (
            <>
              <TextInput
                value={prompt}
                onChangeText={setPrompt}
                multiline
                style={styles.textarea}
                placeholder="Tell us what you want to post about…"
                placeholderTextColor="#B9B6AC"
              />
              <TouchableOpacity
                style={styles.outlineBtn}
                onPress={handleRegenerateCaption}
                activeOpacity={0.85}
                disabled={regenCaption}
              >
                <Text style={styles.outlineBtnText}>
                  {regenCaption ? 'Regenerating…' : '↻ Regenerate from this prompt'}
                </Text>
              </TouchableOpacity>
            </>
          ) : null}

          <Text style={[styles.fieldLabel, styles.fieldSpacing]}>Tone</Text>
          <View style={styles.toneRow}>
            {TONE_OPTIONS.map((option) => {
              const isActive = tone === option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.tonePill, isActive && styles.tonePillActive]}
                  onPress={() => setTone(option)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.tonePillText, isActive && styles.tonePillTextActive]}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={[styles.toneHint, toneHint.style]}>{toneHint.text}</Text>
          <Text style={styles.mutedNote}>Tone changes apply on the next regenerate.</Text>

          <Text style={[styles.fieldLabel, styles.fieldSpacing]}>Caption</Text>
          <TextInput
            value={caption}
            onChangeText={setCaption}
            multiline
            style={[styles.textarea, styles.captionInput]}
          />
          <Text style={styles.counter}>{caption.length} characters</Text>

          <Text style={[styles.fieldLabel, styles.fieldSpacing]}>Hashtags</Text>
          <TextInput value={hashtags} onChangeText={setHashtags} style={styles.input} />

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleSave}
              activeOpacity={0.88}
              disabled={saveState === 'saving'}
            >
              <Text style={styles.primaryBtnText}>
                {saveState === 'saving' ? 'Saving…' : 'Save & send to review'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/dashboard/create')} activeOpacity={0.7}>
              <Text style={styles.backLink}>← Back to create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </DashboardShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 32, alignItems: 'flex-start' },
  previewPane: { flexGrow: 1, flexBasis: 340, minWidth: 300, maxWidth: 400 },
  formPane: { flexGrow: 2, flexBasis: 420, minWidth: 320 },

  previewCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: BORDER, borderRadius: 14, overflow: 'hidden' },
  previewImage: { height: 240, backgroundColor: TRACK_BG, alignItems: 'center', justifyContent: 'center' },
  previewImageIcon: { fontSize: 56, opacity: 0.5 },
  previewBody: { padding: 16 },
  platformPill: { alignSelf: 'flex-start', backgroundColor: ACCENT_TINT, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 10 },
  platformPillText: { fontSize: 10.5, fontWeight: '700', color: PURPLE },
  previewCaption: { fontSize: 13, color: DARK_TEXT, lineHeight: 19 },
  previewHashtags: { fontSize: 12, color: PURPLE, marginTop: 8 },
  previewActions: { flexDirection: 'row', gap: 10, padding: 16, paddingTop: 0 },

  eyebrow: { fontSize: 10.5, fontWeight: '700', letterSpacing: 1.2, color: GRAY_TEXT, marginBottom: 6 },
  heading: { fontFamily: 'serif', fontSize: 21, fontWeight: '700', color: DARK_TEXT, marginBottom: 20 },

  collapseRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  chevron: { fontSize: 14, color: GRAY_TEXT },
  fieldLabel: { fontSize: 11.5, fontWeight: '700', color: GRAY_TEXT, marginBottom: 8 },
  fieldSpacing: { marginTop: 22 },

  textarea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    padding: 14,
    fontSize: 13,
    color: DARK_TEXT,
    minHeight: 84,
    textAlignVertical: 'top',
  },
  captionInput: { minHeight: 110 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13,
    color: DARK_TEXT,
  },
  counter: { fontSize: 11, color: GRAY_TEXT, marginTop: 6, textAlign: 'right' },

  toneRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tonePill: { borderWidth: 1, borderColor: BORDER, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  tonePillActive: { backgroundColor: PURPLE, borderColor: PURPLE },
  tonePillText: { fontSize: 12, fontWeight: '600', color: GRAY_TEXT },
  tonePillTextActive: { color: '#fff', fontWeight: '700' },
  toneHint: { marginTop: 10 },
  mutedNote: { fontSize: 11.5, color: GRAY_TEXT, marginTop: 4 },

  outlineBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginTop: 10,
  },
  outlineBtnText: { fontSize: 12, fontWeight: '700', color: DARK_TEXT },
  ghostBtn: {
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  ghostBtnText: { fontSize: 12, fontWeight: '700', color: DARK_TEXT },

  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 26 },
  primaryBtn: {
    backgroundColor: PURPLE,
    borderRadius: 9,
    paddingVertical: 12,
    paddingHorizontal: 20,
    boxShadow: '0px 6px 16px rgba(108, 92, 231, 0.28)',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  backLink: { fontSize: 12.5, fontWeight: '600', color: GRAY_TEXT },
});
