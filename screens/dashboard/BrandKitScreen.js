import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DashboardShell from './DashboardShell';

const PURPLE = '#6C5CE7';
const PURPLE_LIGHT = '#EFEBFB';
const DARK_TEXT = '#1A1A1A';
const GRAY_TEXT = '#6B6B6B';
const BORDER = '#E7E3D9';
const PANEL_BG = '#FBFAF6';
const GREEN = '#3E8E5A';
const GREEN_BG = '#E9F5EC';
const RED = '#C1443A';

const MAX_LOGO_BYTES = 5 * 1024 * 1024; // 5 MB — matches "PNG, JPG or SVG · Max 5MB"

const PALETTE = ['#6C5CE7', '#F35D42', '#3E8E5A', '#3b6ea5', '#b9852f', '#1f2521', '#c94f5c'];

const TONE_OPTIONS = [
  'Friendly & warm',
  'Bold & confident',
  'Minimal & precise',
  'Professional & polished',
  'Playful & fun',
  'Witty & clever',
];

export default function BrandKitScreen() {
  const [logoMode, setLogoMode] = useState('upload'); // upload | text
  const [brandText, setBrandText] = useState('');
  const [logoImage, setLogoImage] = useState(null); // { uri, fileSize }
  const [logoError, setLogoError] = useState('');
  const [selectedColor, setSelectedColor] = useState(0);
  const [customHex, setCustomHex] = useState('');
  const [selectedTone, setSelectedTone] = useState(0);
  const [isCustomTone, setIsCustomTone] = useState(false);
  const [customTone, setCustomTone] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (isCustomTone && !customTone.trim()) return;
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const pickLogo = async () => {
    setLogoError('');

    if (ImagePicker.requestMediaLibraryPermissionsAsync) {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted' && perm.granted === false && perm.canAskAgain === false) {
        setLogoError('Photo library access is denied. Enable it in your device settings.');
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsEditing: false,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    const size = asset.fileSize;

    if (typeof size === 'number' && size > MAX_LOGO_BYTES) {
      setLogoError(`That file is ${(size / (1024 * 1024)).toFixed(1)} MB — max allowed is 5MB. Please choose a smaller file.`);
      return;
    }

    setLogoImage({ uri: asset.uri, fileSize: size });
  };

  const removeLogo = () => {
    setLogoImage(null);
    setLogoError('');
  };

  return (
    <DashboardShell active="brand-kit" title="Brand Kit">
      <Text style={styles.heading}>Set up your brand kit</Text>
      <Text style={styles.subheading}>
        Social Lift uses this to keep every AI-generated post on-brand.
      </Text>

      <View style={styles.grid}>
        {/* Logo */}
        <View style={styles.card}>
          <View style={styles.cardHeadRow}>
            <Text style={styles.cardTitle}>Logo</Text>
            <Text style={styles.optionalTag}>Optional</Text>
          </View>

          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, logoMode === 'upload' && styles.toggleBtnActive]}
              onPress={() => setLogoMode('upload')}
              activeOpacity={0.85}
            >
              <Text style={[styles.toggleBtnText, logoMode === 'upload' && styles.toggleBtnTextActive]}>
                Upload
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, logoMode === 'text' && styles.toggleBtnActive]}
              onPress={() => setLogoMode('text')}
              activeOpacity={0.85}
            >
              <Text style={[styles.toggleBtnText, logoMode === 'text' && styles.toggleBtnTextActive]}>
                Use text instead
              </Text>
            </TouchableOpacity>
          </View>

          {logoMode === 'upload' ? (
            <>
              {logoImage ? (
                <View style={styles.logoPreviewRow}>
                  <Image source={{ uri: logoImage.uri }} style={styles.logoPreviewThumb} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.logoPreviewName} numberOfLines={1}>
                      Logo attached
                      {typeof logoImage.fileSize === 'number'
                        ? ` · ${(logoImage.fileSize / 1024).toFixed(0)} KB`
                        : ''}
                    </Text>
                    <TouchableOpacity onPress={removeLogo}>
                      <Text style={styles.logoPreviewRemove}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={styles.dropZone} activeOpacity={0.8} onPress={pickLogo}>
                  <Text style={styles.dropZoneIcon}>🖼️</Text>
                  <Text style={styles.dropZoneText}>Drop file or browse</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.hintText}>PNG, JPG or SVG · Max 5MB</Text>
              {logoError ? <Text style={styles.logoErrorText}>{logoError}</Text> : null}
            </>
          ) : (
            <>
              <TextInput
                value={brandText}
                onChangeText={setBrandText}
                placeholder="e.g. Social Lift"
                placeholderTextColor={GRAY_TEXT}
                style={styles.textInput}
              />
              <Text style={styles.hintText}>We'll style this as a wordmark instead of an image logo.</Text>
            </>
          )}
        </View>

        {/* Colour palette */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Colour palette</Text>
          <View style={styles.swatchRow}>
            {PALETTE.map((color, i) => (
              <TouchableOpacity
                key={color}
                onPress={() => setSelectedColor(i)}
                activeOpacity={0.8}
                style={[
                  styles.swatch,
                  { backgroundColor: color },
                  selectedColor === i && styles.swatchSelected,
                ]}
              />
            ))}
          </View>
          <Text style={styles.smallLabel}>Custom hex</Text>
          <TextInput
            value={customHex}
            onChangeText={(v) => {
              setCustomHex(v);
              setSelectedColor(-1);
            }}
            placeholder="#4a7c59"
            placeholderTextColor={GRAY_TEXT}
            style={styles.hexInput}
            autoCapitalize="none"
          />
          <Text style={styles.hintText}>
            Pulled from your uploaded logo — adjust anytime, or enter a custom hex code.
          </Text>
        </View>

        {/* Tone of voice */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tone of voice</Text>
          <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
            {TONE_OPTIONS.map((tone, i) => {
              const isActive = !isCustomTone && selectedTone === i;
              return (
                <TouchableOpacity
                  key={tone}
                  style={[styles.tonePill, isActive && styles.tonePillActive]}
                  onPress={() => {
                    setSelectedTone(i);
                    setIsCustomTone(false);
                  }}
                  activeOpacity={0.85}
                >
                  <View style={[styles.toneDot, isActive && styles.toneDotActive]} />
                  <Text style={[styles.toneText, isActive && styles.toneTextActive]}>{tone}</Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={[styles.tonePill, isCustomTone && styles.tonePillActive]}
              onPress={() => setIsCustomTone(true)}
              activeOpacity={0.85}
            >
              <View style={[styles.toneDot, isCustomTone && styles.toneDotActive]} />
              <Text style={[styles.toneText, isCustomTone && styles.toneTextActive]}>Custom…</Text>
            </TouchableOpacity>
          </ScrollView>

          {isCustomTone && (
            <>
              <TextInput
                value={customTone}
                onChangeText={setCustomTone}
                placeholder="e.g. Cheeky & irreverent, like talking to a friend"
                placeholderTextColor={GRAY_TEXT}
                style={styles.customToneInput}
                multiline
              />
              <Text style={styles.hintText}>
                Describe the voice in your own words — we'll use this instead of a preset tone.
              </Text>
            </>
          )}
        </View>
      </View>

      <View style={styles.footerRow}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.88}>
          <Text style={styles.saveBtnText}>Save brand kit</Text>
        </TouchableOpacity>
        {saved && (
          <View style={styles.savedBanner}>
            <Text style={styles.savedBannerText}>✓ Brand kit saved</Text>
          </View>
        )}
      </View>
    </DashboardShell>
  );
}

const styles = StyleSheet.create({
  heading: { fontFamily: 'serif', fontSize: 22, fontWeight: '700', color: DARK_TEXT, marginBottom: 6 },
  subheading: { fontSize: 13, color: GRAY_TEXT, marginBottom: 24 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 24 },
  card: { flex: 1, minWidth: 260, backgroundColor: '#fff', borderWidth: 1, borderColor: BORDER, borderRadius: 14, padding: 18 },
  cardHeadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 13.5, fontWeight: '700', color: DARK_TEXT, marginBottom: 12 },
  optionalTag: { fontSize: 10.5, fontWeight: '700', color: GRAY_TEXT },

  toggleRow: { flexDirection: 'row', backgroundColor: PANEL_BG, borderRadius: 9, padding: 3, marginBottom: 14 },
  toggleBtn: { flex: 1, paddingVertical: 7, borderRadius: 7, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: '#fff', borderWidth: 1, borderColor: BORDER },
  toggleBtnText: { fontSize: 11.5, fontWeight: '600', color: GRAY_TEXT },
  toggleBtnTextActive: { color: DARK_TEXT, fontWeight: '700' },

  dropZone: {
    height: 96,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: BORDER,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PANEL_BG,
  },
  dropZoneIcon: { fontSize: 20, marginBottom: 6, opacity: 0.6 },
  dropZoneText: { fontSize: 12, color: GRAY_TEXT },
  hintText: { fontSize: 11, color: GRAY_TEXT, marginTop: 8, lineHeight: 15 },
  logoErrorText: { fontSize: 11, color: RED, marginTop: 6, lineHeight: 15 },

  logoPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: PANEL_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    padding: 10,
    height: 96,
  },
  logoPreviewThumb: { width: 56, height: 56, borderRadius: 8, backgroundColor: BORDER },
  logoPreviewName: { fontSize: 12, fontWeight: '600', color: DARK_TEXT, marginBottom: 4 },
  logoPreviewRemove: { fontSize: 11.5, color: RED, fontWeight: '700' },

  textInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13,
    color: DARK_TEXT,
  },

  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  swatch: { width: 32, height: 32, borderRadius: 16 },
  swatchSelected: { borderWidth: 3, borderColor: DARK_TEXT },
  smallLabel: { fontSize: 11, fontWeight: '700', color: GRAY_TEXT, marginBottom: 6 },
  hexInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12.5,
    color: DARK_TEXT,
  },

  tonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 8,
  },
  tonePillActive: { borderColor: PURPLE, backgroundColor: PURPLE_LIGHT },
  toneDot: { width: 11, height: 11, borderRadius: 6, borderWidth: 1.5, borderColor: BORDER, marginRight: 9 },
  toneDotActive: { borderColor: PURPLE, backgroundColor: PURPLE },
  toneText: { fontSize: 12, color: GRAY_TEXT, fontWeight: '600' },
  toneTextActive: { color: DARK_TEXT, fontWeight: '700' },
  customToneInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: PURPLE,
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12.5,
    color: DARK_TEXT,
    minHeight: 64,
    textAlignVertical: 'top',
    marginTop: 4,
  },

  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  saveBtn: {
    backgroundColor: PURPLE,
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 22,
    alignSelf: 'flex-start',
    boxShadow: '0px 8px 18px rgba(108,92,231,0.3)',
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  savedBanner: { backgroundColor: GREEN_BG, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
  savedBannerText: { color: GREEN, fontWeight: '700', fontSize: 12 },
});