import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DashboardShell from './DashboardShell';
import ReferenceEditor from './ReferenceEditor';
import { useBrandKit } from '../../src/context/BrandKitContext';
import { describeReferenceStyle } from '../../src/ai/localAi';
import { downscaleImage, dominantColors } from '../../src/utils/cropImage';

const PURPLE = '#6C5CE7';
const PURPLE_LIGHT = '#EFEBFB';
const DARK_TEXT = '#1A1A1A';
const GRAY_TEXT = '#6B6B6B';
const BORDER = '#E7E3D9';
const PANEL_BG = '#FBFAF6';
const GREEN = '#3E8E5A';
const GREEN_BG = '#E9F5EC';
const RED = '#C1443A';

// Kept small because the kit is saved in the browser's storage (~5 MB total).
const MAX_LOGO_BYTES = 1024 * 1024; // 1 MB — matches "PNG, JPG or SVG · Max 1MB"
// Reference posts are shrunk to 1080 px wide before saving, so the original
// upload can be bigger.
const MAX_REFERENCE_BYTES = 5 * 1024 * 1024;
const MAX_REFERENCES = 8;

const PALETTE = ['#6C5CE7', '#F35D42', '#3E8E5A', '#3b6ea5', '#b9852f', '#1f2521', '#c94f5c'];

const TONE_OPTIONS = [
  'Friendly & warm',
  'Bold & confident',
  'Minimal & precise',
  'Professional & polished',
  'Playful & fun',
  'Witty & clever',
];

// Picks an image and returns it as a data: URI, so it can be saved and still
// work after a reload (web picker URIs are blob: links that die with the page).
async function pickImageAsDataUri(maxBytes) {
  if (ImagePicker.requestMediaLibraryPermissionsAsync) {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted' && perm.granted === false && perm.canAskAgain === false) {
      return { error: 'Photo library access is denied. Enable it in your device settings.' };
    }
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.9,
    allowsEditing: false,
    base64: true,
  });

  if (result.canceled) return null;

  const asset = result.assets[0];
  const size = asset.fileSize;

  if (typeof size === 'number' && size > maxBytes) {
    return {
      error: `That file is ${(size / (1024 * 1024)).toFixed(1)} MB — max allowed is ${maxBytes / (1024 * 1024)}MB. Please choose a smaller file.`,
    };
  }

  if (!asset.base64) {
    return { error: 'Could not read that image. Please try a different file.' };
  }

  return {
    uri: `data:${asset.mimeType || 'image/png'};base64,${asset.base64}`,
    fileSize: size,
  };
}

export default function BrandKitScreen() {
  const { brandKit, loaded, saveBrandKit } = useBrandKit();

  const [logoMode, setLogoMode] = useState('upload'); // upload | text
  const [brandText, setBrandText] = useState('');
  const [logoImage, setLogoImage] = useState(null); // { uri, fileSize }
  const [logoError, setLogoError] = useState('');
  const [selectedColor, setSelectedColor] = useState(0);
  const [customHex, setCustomHex] = useState('');
  const [selectedTone, setSelectedTone] = useState(0);
  const [isCustomTone, setIsCustomTone] = useState(false);
  const [customTone, setCustomTone] = useState('');

  // Organisation & contact details — used by poster templates in Create.
  const [orgName, setOrgName] = useState('');
  const [orgLocation, setOrgLocation] = useState('');
  const [badgesImage, setBadgesImage] = useState(null); // { uri, fileSize }
  const [badgesError, setBadgesError] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [department, setDepartment] = useState('');

  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Fill the form with what was saved last time, once storage has loaded.
  useEffect(() => {
    if (!loaded) return;
    setLogoMode(brandKit.logoMode);
    setBrandText(brandKit.brandText);
    setLogoImage(brandKit.logoUri ? { uri: brandKit.logoUri, fileSize: brandKit.logoSize } : null);
    setSelectedColor(brandKit.colorIndex);
    setCustomHex(brandKit.customHex);
    setSelectedTone(brandKit.toneIndex);
    setIsCustomTone(brandKit.isCustomTone);
    setCustomTone(brandKit.customTone);
    setOrgName(brandKit.orgName);
    setOrgLocation(brandKit.orgLocation);
    setBadgesImage(brandKit.badgesUri ? { uri: brandKit.badgesUri, fileSize: brandKit.badgesSize } : null);
    setContactPhone(brandKit.contactPhone);
    setWebsite(brandKit.website);
    setDepartment(brandKit.department);
  }, [loaded]);

  const handleSave = async () => {
    if (isCustomTone && !customTone.trim()) return;
    setSaveError('');

    try {
      await saveBrandKit({
        logoMode,
        logoUri: logoImage?.uri || null,
        logoSize: logoImage?.fileSize ?? null,
        brandText: brandText.trim(),
        orgName: orgName.trim(),
        orgLocation: orgLocation.trim(),
        badgesUri: badgesImage?.uri || null,
        badgesSize: badgesImage?.fileSize ?? null,
        colorIndex: selectedColor,
        customHex: customHex.trim(),
        toneIndex: selectedTone,
        isCustomTone,
        customTone: customTone.trim(),
        contactPhone: contactPhone.trim(),
        website: website.trim(),
        department: department.trim(),
        references: brandKit.references,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch (error) {
      setSaveError('Could not save — your images may be too large for this browser. Try smaller files.');
    }
  };

  const pickLogo = async () => {
    setLogoError('');
    const picked = await pickImageAsDataUri(MAX_LOGO_BYTES);
    if (!picked) return;
    if (picked.error) {
      setLogoError(picked.error);
      return;
    }
    setLogoImage(picked);
  };

  const removeLogo = () => {
    setLogoImage(null);
    setLogoError('');
  };

  const pickBadges = async () => {
    setBadgesError('');
    const picked = await pickImageAsDataUri(MAX_LOGO_BYTES);
    if (!picked) return;
    if (picked.error) {
      setBadgesError(picked.error);
      return;
    }
    setBadgesImage(picked);
  };

  // ---- Reference posts ----
  // draft = the reference being added / edited in ReferenceEditor.
  const [refDraft, setRefDraft] = useState(null);
  const [refError, setRefError] = useState('');
  const [refSaving, setRefSaving] = useState(false);

  const addReference = async () => {
    setRefError('');
    if (brandKit.references.length >= MAX_REFERENCES) {
      setRefError(`You can save up to ${MAX_REFERENCES} reference posts. Delete one to add another.`);
      return;
    }

    const picked = await pickImageAsDataUri(MAX_REFERENCE_BYTES);
    if (!picked) return;
    if (picked.error) {
      setRefError(picked.error);
      return;
    }

    const small = await downscaleImage(picked.uri, 1080);
    const draft = {
      id: `${Date.now()}`,
      label: '',
      imageUri: small.uri,
      width: small.width,
      height: small.height,
      styleInfo: null,
      detecting: true,
    };
    setRefDraft(draft);

    try {
      // Design notes new posts are drawn from (Qwen3-VL), with the colours
      // measured from the image itself (the model's guesses are unreliable).
      const styleInfo = { ...(await describeReferenceStyle(small.uri)), palette: await dominantColors(small.uri) };
      setRefDraft((d) =>
        d && d.id === draft.id ? { ...d, label: styleInfo.category, styleInfo, detecting: false } : d
      );
    } catch (error) {
      setRefDraft((d) =>
        d && d.id === draft.id
          ? {
              ...d,
              styleInfo: { style: '', headingStyle: '', palette: [], photoStyle: 'circle', photoSide: 'right' },
              detecting: false,
            }
          : d
      );
      setRefError(`${error?.message || 'Could not analyse the image.'} You can still write the design notes yourself.`);
    }
  };

  const saveReference = async () => {
    if (!refDraft) return;
    setRefSaving(true);
    setRefError('');

    try {
      const { detecting, ...rest } = refDraft;
      const reference = { ...rest, label: refDraft.label.trim() };
      const others = brandKit.references.filter((r) => r.id !== reference.id);
      await saveBrandKit({ ...brandKit, references: [...others, reference] });
      setRefDraft(null);
    } catch (error) {
      setRefError('Could not save — this browser\'s storage may be full. Delete an older reference and try again.');
    } finally {
      setRefSaving(false);
    }
  };

  // References saved before design notes existed get them written now.
  const editReference = async (ref) => {
    setRefError('');
    if (ref.styleInfo?.style) {
      setRefDraft({ ...ref });
      return;
    }
    setRefDraft({ ...ref, detecting: true });
    try {
      const styleInfo = { ...(await describeReferenceStyle(ref.imageUri)), palette: await dominantColors(ref.imageUri) };
      setRefDraft((d) => (d && d.id === ref.id ? { ...d, styleInfo, detecting: false } : d));
    } catch (error) {
      setRefDraft((d) => (d && d.id === ref.id ? { ...d, styleInfo: { style: '' }, detecting: false } : d));
      setRefError(`${error?.message || 'Could not analyse the image.'} You can still write the design notes yourself.`);
    }
  };

  const deleteReference = async (id) => {
    setRefError('');
    try {
      await saveBrandKit({ ...brandKit, references: brandKit.references.filter((r) => r.id !== id) });
    } catch (error) {
      setRefError('Could not delete that reference. Please try again.');
    }
  };

  const removeBadges = () => {
    setBadgesImage(null);
    setBadgesError('');
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
              <Text style={styles.hintText}>PNG, JPG or SVG · Max 1MB</Text>
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

      {/* Organisation & contact — fills the header and footer of poster templates */}
      <View style={[styles.card, styles.wideCard]}>
        <View style={styles.cardHeadRow}>
          <Text style={styles.cardTitle}>Organisation &amp; contact</Text>
          <Text style={styles.optionalTag}>Used on poster templates</Text>
        </View>

        <View style={styles.formGrid}>
          <View style={styles.formCol}>
            <Text style={styles.smallLabel}>Organisation name</Text>
            <TextInput
              value={orgName}
              onChangeText={setOrgName}
              placeholder={'e.g. Jaypee University\nof Engineering\nand Technology'}
              placeholderTextColor={GRAY_TEXT}
              style={[styles.textInput, styles.multiInput]}
              multiline
            />
            <Text style={styles.hintText}>Press Enter where you want the line to break on the poster.</Text>

            <Text style={[styles.smallLabel, styles.fieldGap]}>Location line</Text>
            <TextInput
              value={orgLocation}
              onChangeText={setOrgLocation}
              placeholder="e.g. Guna (M.P.)"
              placeholderTextColor={GRAY_TEXT}
              style={styles.textInput}
            />

            <Text style={[styles.smallLabel, styles.fieldGap]}>Badges / accreditations image</Text>
            {badgesImage ? (
              <View style={styles.logoPreviewRow}>
                <Image source={{ uri: badgesImage.uri }} style={styles.badgesThumb} resizeMode="contain" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.logoPreviewName} numberOfLines={1}>
                    Badges attached
                    {typeof badgesImage.fileSize === 'number'
                      ? ` · ${(badgesImage.fileSize / 1024).toFixed(0)} KB`
                      : ''}
                  </Text>
                  <TouchableOpacity onPress={removeBadges}>
                    <Text style={styles.logoPreviewRemove}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.dropZone} activeOpacity={0.8} onPress={pickBadges}>
                <Text style={styles.dropZoneIcon}>🏅</Text>
                <Text style={styles.dropZoneText}>Drop file or browse</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.hintText}>
              Optional. One image with your partner / ranking / accreditation logos, shown top-right · Max 1MB
            </Text>
            {badgesError ? <Text style={styles.logoErrorText}>{badgesError}</Text> : null}
          </View>

          <View style={styles.formCol}>
            <Text style={styles.smallLabel}>Contact phone</Text>
            <TextInput
              value={contactPhone}
              onChangeText={setContactPhone}
              placeholder="e.g. 8982129100"
              placeholderTextColor={GRAY_TEXT}
              style={styles.textInput}
              keyboardType="phone-pad"
            />

            <Text style={[styles.smallLabel, styles.fieldGap]}>Website</Text>
            <TextInput
              value={website}
              onChangeText={setWebsite}
              placeholder="e.g. www.juet.ac.in"
              placeholderTextColor={GRAY_TEXT}
              style={styles.textInput}
              autoCapitalize="none"
            />

            <Text style={[styles.smallLabel, styles.fieldGap]}>Department / signature</Text>
            <TextInput
              value={department}
              onChangeText={setDepartment}
              placeholder="e.g. T&P Cell"
              placeholderTextColor={GRAY_TEXT}
              style={styles.textInput}
            />
          </View>
        </View>
      </View>

      {/* Reference posts — this account's own designs, reused as templates */}
      <View style={[styles.card, styles.wideCard]}>
        <View style={styles.cardHeadRow}>
          <Text style={styles.cardTitle}>Reference posts</Text>
          <Text style={styles.optionalTag}>Saved instantly</Text>
        </View>
        <Text style={styles.refIntro}>
          Upload posts you've published before. Social Lift writes design notes for each one, and
          every new post — of that kind or any other — is drawn from scratch in that style, with
          your real header and footer.
        </Text>

        {brandKit.references.map((ref) => (
          <View key={ref.id} style={styles.refRow}>
            <Image source={{ uri: ref.imageUri }} style={styles.refThumb} resizeMode="cover" />
            <View style={{ flex: 1 }}>
              <Text style={styles.logoPreviewName}>{ref.label}</Text>
              <Text style={styles.hintText} numberOfLines={2}>
                {ref.styleInfo?.style || 'No design notes yet — click Edit to write them.'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => editReference(ref)} disabled={!!refDraft}>
              <Text style={styles.refAction}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteReference(ref.id)} disabled={!!refDraft}>
              <Text style={styles.logoPreviewRemove}>Delete</Text>
            </TouchableOpacity>
          </View>
        ))}

        {refDraft ? (
          <ReferenceEditor
            draft={refDraft}
            onChange={setRefDraft}
            onSave={saveReference}
            onCancel={() => {
              setRefDraft(null);
              setRefError('');
            }}
            saving={refSaving}
            detectError={refError}
          />
        ) : (
          <>
            <TouchableOpacity style={[styles.dropZone, styles.refDropZone]} activeOpacity={0.8} onPress={addReference}>
              <Text style={styles.dropZoneIcon}>🖼️</Text>
              <Text style={styles.dropZoneText}>Add a reference post</Text>
            </TouchableOpacity>
            {refError ? <Text style={styles.logoErrorText}>{refError}</Text> : null}
          </>
        )}
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
        {saveError ? <Text style={styles.logoErrorText}>{saveError}</Text> : null}
      </View>
    </DashboardShell>
  );
}

const styles = StyleSheet.create({
  heading: { fontFamily: 'serif', fontSize: 22, fontWeight: '700', color: DARK_TEXT, marginBottom: 6 },
  subheading: { fontSize: 13, color: GRAY_TEXT, marginBottom: 24 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 24 },
  card: { flex: 1, minWidth: 260, backgroundColor: '#fff', borderWidth: 1, borderColor: BORDER, borderRadius: 14, padding: 18 },
  // `card` stretches to share a row; this one sits alone in the scroll column,
  // so it must size to its content instead of collapsing.
  wideCard: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto', marginBottom: 24 },
  formGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  formCol: { flex: 1, minWidth: 240 },
  fieldGap: { marginTop: 14 },
  multiInput: { minHeight: 76, textAlignVertical: 'top' },
  badgesThumb: { width: 96, height: 56, borderRadius: 8, backgroundColor: '#fff' },
  refIntro: { fontSize: 12, color: GRAY_TEXT, lineHeight: 17, marginBottom: 14 },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  refThumb: { width: 54, height: 68, borderRadius: 6, backgroundColor: BORDER },
  refAction: { fontSize: 11.5, color: PURPLE, fontWeight: '700' },
  refDropZone: { height: 80 },
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