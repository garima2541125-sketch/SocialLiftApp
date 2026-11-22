import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Modal,
  Pressable,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DashboardShell from './DashboardShell';
import { ScaledTemplate, getTemplate } from './templates';
import { composePost } from '../../src/ai/composePost';
import { aiServer } from '../../src/ai/aiServer';
import { buildPostTypes, isReferenceType } from '../../src/ai/postTypes';
import { useBrandKit } from '../../src/context/BrandKitContext';
import { showAlert } from '../../src/utils/alert';

const PURPLE = '#6C5CE7';
const DARK_TEXT = '#1A1A1A';
const GRAY_TEXT = '#6B6B6B';
const BORDER = '#E7E3D9';
const PANEL_BG = '#FBFAF6';
const ORANGE = '#F35D42';
const GREEN = '#3E8E5A';
const GREEN_BG = '#E9F5EC';
const RED = '#C1443A';

const DARK_BG = '#141318';
const DARK_PANEL = '#1E1D24';
const DARK_BORDER = '#2E2C36';
const DARK_TEXT_PRIMARY = '#F4F2EC';
const DARK_TEXT_MUTED = '#9A98A5';

const PLATFORMS = ['Instagram', 'LinkedIn'];

const TONE_OPTIONS = [
  'Friendly & warm',
  'Bold & confident',
  'Minimal & precise',
  'Professional & polished',
  'Playful & fun',
  'Witty & clever',
];

const CUSTOM_TONE = 'Custom';

// Uploaded images never leave this computer (only the local Qwen3-VL sees
// them), so they can be reasonably large.
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_IMAGES = 4;

// What Qwen3-VL decided each uploaded image is, as shown next to it.
const IMAGE_KIND_LABELS = {
  person: 'Person photo',
  group: 'Group photo',
  logo: 'Logo',
  event: 'Event photo',
  product: 'Product photo',
  poster: 'Poster / graphic',
  document: 'Document',
  other: 'Image',
};

// Labels for template fields in the Details panel (keys from postTypes.js).
const FIELD_INPUTS = {
  studentName: { label: 'Student name', placeholder: 'e.g. Pragya Shrivastav' },
  company: { label: 'Company', placeholder: 'e.g. AAJ Supply Chain' },
  packageText: { label: 'Package (optional)', placeholder: 'e.g. 40 LPA' },
  branch: { label: 'Branch', placeholder: 'e.g. CSE' },
  batch: { label: 'Batch year', placeholder: 'e.g. 2027' },
};

const ASPECT_OPTIONS = [
  { key: 'original', label: 'Original', ratio: 1.8 },
  { key: 'square', label: 'Square', ratio: 1 },
  { key: 'portrait', label: 'Portrait', ratio: 0.8 },
  { key: 'wide', label: 'Wide', ratio: 1.9 },
];

const SUGGESTIONS = [
  {
    id: 's1',
    text: 'Behind-the-scenes glaze-mixing reel — your reels get 3.2x more reach.',
  },
  {
    id: 's2',
    text: 'Customer testimonial carousel — carousels outperform single images by 40%.',
  },
  {
    id: 's3',
    text: 'Restock announcement for the bestselling mug set.',
  },
];

/* -------------------------------------------------------
   HEADER TOGGLE
------------------------------------------------------- */

function HeaderToggle({ value, onChange }) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [value]);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onChange(!value)}
      style={styles.toggleTrack}
    >
      <Animated.View
        style={[
          styles.toggleThumb,
          {
            backgroundColor: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [BORDER, ORANGE],
            }),
            transform: [
              {
                translateX: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [2, 20],
                }),
              },
            ],
          },
        ]}
      />
    </TouchableOpacity>
  );
}

/* -------------------------------------------------------
   SPINNER
------------------------------------------------------- */

function SpinnerDot({ color = '#fff' }) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();
  }, []);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.Text
      style={[
        styles.spinner,
        {
          color,
          transform: [{ rotate }],
        },
      ]}
    >
      ⏳
    </Animated.Text>
  );
}

/* -------------------------------------------------------
   IMAGE ADJUSTMENT STEPPER
------------------------------------------------------- */

function AdjustStepper({
  label,
  value,
  onChange,
  min = 40,
  max = 160,
  step = 10,
}) {
  return (
    <View style={styles.adjustRow}>
      <Text style={styles.adjustLabel}>{label}</Text>

      <View style={styles.adjustControls}>
        <TouchableOpacity
          style={styles.adjustBtn}
          activeOpacity={0.8}
          disabled={value <= min}
          onPress={() => onChange(Math.max(min, value - step))}
        >
          <Text
            style={[
              styles.adjustBtnText,
              value <= min && styles.adjustBtnTextDisabled,
            ]}
          >
            −
          </Text>
        </TouchableOpacity>

        <Text style={styles.adjustValue}>{value}%</Text>

        <TouchableOpacity
          style={styles.adjustBtn}
          activeOpacity={0.8}
          disabled={value >= max}
          onPress={() => onChange(Math.min(max, value + step))}
        >
          <Text
            style={[
              styles.adjustBtnText,
              value >= max && styles.adjustBtnTextDisabled,
            ]}
          >
            +
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* =======================================================
   CREATE POST SCREEN
======================================================= */

export default function CreatePostScreen() {
  const { brandKit } = useBrandKit();

  // Built-in post types plus this account's reference designs.
  const postTypes = useMemo(
    () => buildPostTypes(brandKit.references),
    [brandKit.references]
  );

  const [platform, setPlatform] = useState('Instagram');

  const [prompt, setPrompt] = useState(
    'Announce our new autumn ceramics collection — warm, handmade, small-batch. Highlight the earthy glaze finishes.'
  );

  const [tone, setTone] = useState(TONE_OPTIONS[0]);
  const [customTone, setCustomTone] = useState('');

  const [toneOpen, setToneOpen] = useState(false);

  const [dropdownPos, setDropdownPos] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const toneFieldRef = useRef(null);

  // Uploaded photos / logos: [{ id, uri, fileSize }]. Qwen3-VL decides what
  // each one is and where it goes; results are cached per image so
  // regenerating doesn't re-analyse them.
  const [images, setImages] = useState([]);
  const [imageKinds, setImageKinds] = useState({});
  const analysisCache = useRef(new Map());
  const [imageError, setImageError] = useState('');

  const [autoApprove, setAutoApprove] = useState(false);
  const [recent, setRecent] = useState([]);

  /*
   * Existing generation modal.
   * null = hidden
   * generating = loading
   * preview = generated preview
   */
  const [modalStage, setModalStage] = useState(null);

  /*
   * NEW:
   * Controls the second page opened using Next.
   */
  const [showReviewPage, setShowReviewPage] = useState(false);

  const [moderating, setModerating] = useState(false);
  const [moderateTab, setModerateTab] = useState('caption');

  const [captionOverride, setCaptionOverride] = useState(null);

  /*
   * Result of composePost(): { postType, caption, imagePrompt, fields,
   * slots, slotImages }. generationRun lets a closed modal ignore a run
   * that finishes later.
   */
  const [aiResult, setAiResult] = useState(null);

  // The post type Qwen3 picked, and whether it has a designed template
  // (otherwise it's shown as a normal image post).
  const postType = aiResult?.postType || null;
  const template = postType ? getTemplate(postType, postTypes) : null;
  const templateType = template ? postType : null;
  const isPoster = !!template;

  // The facts a template prints (from Qwen3, editable in Details), and a
  // ref to the template canvas for PNG export.
  const [templateFields, setTemplateFields] = useState({});
  const [downloading, setDownloading] = useState(false);
  const templateRef = useRef(null);

  const [generationStep, setGenerationStep] = useState('planning');
  // True when this computer runs the AI itself and is on battery (web only):
  // that's the usual reason an image is slow.
  const [onBattery, setOnBattery] = useState(false);
  useEffect(() => {
    if (generationStep !== 'slow' || aiServer().shared) return;
    if (typeof navigator === 'undefined' || !navigator.getBattery) return;
    navigator
      .getBattery()
      .then((battery) => setOnBattery(!battery.charging))
      .catch(() => {});
  }, [generationStep]);
  const generationRun = useRef(0);

  const [imgBrightness, setImgBrightness] = useState(100);
  const [imgContrast, setImgContrast] = useState(100);
  const [imgSaturation, setImgSaturation] = useState(100);
  const [imgRotation, setImgRotation] = useState(0);
  const [cropAspect, setCropAspect] = useState('original');

  /* -----------------------------------------------------
     IMAGE RESET
  ----------------------------------------------------- */

  const resetImageAdjustments = () => {
    setImgBrightness(100);
    setImgContrast(100);
    setImgSaturation(100);
    setImgRotation(0);
    setCropAspect('original');
  };

  const activeAspect =
    ASPECT_OPTIONS.find((a) => a.key === cropAspect) ||
    ASPECT_OPTIONS[0];

  // A post drawn in one of the account's designs has that design's poster
  // shape; keep it unless the user picks another crop.
  const previewAspect =
    cropAspect === 'original' && aiResult?.imageAspect
      ? aiResult.imageAspect
      : activeAspect.ratio;
  const isDesigned = !!aiResult?.imageAspect;

  const imageFilterStyle = {
    filter: `brightness(${imgBrightness}%) contrast(${imgContrast}%) saturate(${imgSaturation}%)`,
    transform: [{ rotate: `${imgRotation}deg` }],
  };

  /* -----------------------------------------------------
     TONE
  ----------------------------------------------------- */

  const isCustomTone = tone === CUSTOM_TONE;

  const effectiveTone = isCustomTone
    ? customTone.trim() || 'Custom'
    : tone;

  const toneFieldLabel = isCustomTone
    ? customTone.trim() || 'Custom tone…'
    : tone;

  /* -----------------------------------------------------
     CAPTION
  ----------------------------------------------------- */

  const baseCaption = `${prompt.trim()}${
    prompt.trim().endsWith('.') ? '' : '.'
  } ✨ Shot and written in a ${effectiveTone.toLowerCase()} voice, ready for ${platform}.`;

  const generatedCaption =
    captionOverride ?? aiResult?.caption ?? baseCaption;

  // A standard post's picture: the uploaded photo Qwen3 chose, cropped, or
  // one painted by Qwen-Image.
  const postImageUri = aiResult?.slotImages?.postImage || null;
  const postImageIsUpload = aiResult?.slots?.postImage != null;

  /* -----------------------------------------------------
     SUGGESTIONS
  ----------------------------------------------------- */

  const applySuggestion = (text) => {
    setPrompt(text);
  };

  /* -----------------------------------------------------
     TONE DROPDOWN
  ----------------------------------------------------- */

  const openToneDropdown = () => {
    if (
      toneFieldRef.current &&
      toneFieldRef.current.measureInWindow
    ) {
      toneFieldRef.current.measureInWindow(
        (x, y, width, height) => {
          setDropdownPos({
            top: y + height + 6,
            left: x,
            width,
          });

          setToneOpen(true);
        }
      );
    } else {
      setToneOpen(true);
    }
  };

  const toggleToneDropdown = () => {
    if (toneOpen) {
      setToneOpen(false);
    } else {
      openToneDropdown();
    }
  };

  const selectTone = (selectedTone) => {
    setTone(selectedTone);
    setToneOpen(false);
  };

  /* -----------------------------------------------------
     IMAGE PICKER
  ----------------------------------------------------- */

  const pickImage = ({ replace = false } = {}) => {
    if (!replace && images.length >= MAX_IMAGES) {
      setImageError(`You can attach up to ${MAX_IMAGES} images.`);
      return Promise.resolve();
    }
    const addPicked = (picked) =>
      setImages((prev) => [
        ...(replace ? [] : prev),
        { id: `${Date.now()}`, ...picked },
      ]);

    return pickPhoto(MAX_IMAGE_BYTES, addPicked, setImageError);
  };

  const pickPhoto = async (maxBytes, setPicked, setError) => {
    setError('');

    if (ImagePicker.requestMediaLibraryPermissionsAsync) {
      const perm =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (
        perm.status !== 'granted' &&
        perm.granted === false &&
        perm.canAskAgain === false
      ) {
        setError(
          'Photo library access is denied. Enable it in your device settings.'
        );
        return;
      }
    }

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
        // Qwen3-VL needs the image data, and on web the picker's blob: URI
        // is revoked soon after picking (which breaks PNG export) — so
        // always keep a data: URI.
        base64: true,
      });

    if (result.canceled) return;

    const asset = result.assets[0];
    const size = asset.fileSize;

    if (
      typeof size === 'number' &&
      size > maxBytes
    ) {
      setError(
        `That image is ${(size / 1024).toFixed(
          0
        )} KB — max allowed is ${
          maxBytes >= 1024 * 1024
            ? `${maxBytes / (1024 * 1024)} MB`
            : `${maxBytes / 1024} KB`
        }. Please choose a smaller file.`
      );
      return;
    }

    setPicked({
      uri: asset.base64
        ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`
        : asset.uri,
      fileSize: size,
    });
  };

  const removeImage = (id) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    setImageError('');
  };

  /* =====================================================
     NEW NEXT PAGE FUNCTIONS
  ===================================================== */

  const handleNext = () => {
    if (!prompt.trim()) return;

    /*
     * Close anything else before entering review.
     */
    setToneOpen(false);
    setModalStage(null);
    setModerating(false);

    setShowReviewPage(true);
  };

  const handleBackToCreate = () => {
    setShowReviewPage(false);
  };

  /* -----------------------------------------------------
     GENERATE
  ----------------------------------------------------- */

  const runGeneration = async () => {
    const run = ++generationRun.current;

    setModerating(false);
    setGenerationStep('planning');
    setModalStage('generating');

    try {
      const result = await composePost({
        prompt: prompt.trim(),
        tone: effectiveTone,
        platform,
        images,
        analysisCache: analysisCache.current,
        postTypes,
        brandKit,
        onStep: (step) => {
          if (run === generationRun.current) setGenerationStep(step);
        },
      });

      setImageKinds((prev) => {
        const next = { ...prev };
        images.forEach((img) => {
          next[img.id] = analysisCache.current.get(img.id)?.kind;
        });
        return next;
      });

      if (run !== generationRun.current) return;

      setAiResult(result);
      setTemplateFields(result.fields);
      setCaptionOverride(null);
      resetImageAdjustments();
      setModalStage('preview');

      // Anything a template needs that wasn't in the prompt has to be typed in.
      const missing = postTypes[result.postType].requiredFields.filter(
        (f) => !result.fields[f]
      );
      if (getTemplate(result.postType, postTypes) && missing.length) {
        setModerating(true);
        setModerateTab('details');
      }
    } catch (error) {
      if (run !== generationRun.current) return;

      setModalStage(null);
      showAlert(
        'Generation failed',
        error?.message || 'Something went wrong while generating your post.'
      );
    }
  };

  const handleGenerate = () => {
    if (!prompt.trim()) return;

    setModerateTab('caption');
    runGeneration();
  };

  /* -----------------------------------------------------
     REGENERATE
  ----------------------------------------------------- */

  const handleRegenerate = () => {
    runGeneration();
  };

  /* -----------------------------------------------------
     CHANGE PROMPT
  ----------------------------------------------------- */

  const handleChangePrompt = () => {
    setShowReviewPage(false);
    setModalStage(null);
    setModerating(false);
  };

  /* -----------------------------------------------------
     DIFFERENT PHOTO
  ----------------------------------------------------- */

  const handleUploadDifferentPhoto = async () => {
    await pickImage({ replace: true });
    resetImageAdjustments();
  };

  /* -----------------------------------------------------
     PUBLISH
  ----------------------------------------------------- */

  const handlePublish = () => {
    setRecent((prev) =>
      [
        {
          id: `${Date.now()}`,
          platform,
          caption: generatedCaption,
        },
        ...prev,
      ].slice(0, 3)
    );

    setShowReviewPage(false);
    setModalStage(null);
    setModerating(false);
  };

  /* -----------------------------------------------------
     POSTER DOWNLOAD (web)
  ----------------------------------------------------- */

  const handleDownloadPoster = async () => {
    if (!templateRef.current || downloading) return;

    // Never export a template that still shows a placeholder like "Student name".
    const missingPhotos = postTypes[templateType].requiredImages.filter(
      (slot) => !aiResult.slotImages[slot]
    );
    if (missingPhotos.length) {
      showAlert(
        'Add a photo',
        'This design needs a photo of the person. Attach one under "Photos & logos" and generate again.'
      );
      return;
    }

    const missing = postTypes[templateType].requiredFields.filter(
      (f) => !(templateFields[f] || '').trim()
    );
    if (missing.length) {
      setModerating(true);
      setModerateTab('details');
      showAlert(
        'Add the missing details',
        `Fill in ${missing
          .map((f) => fieldLabel(f).toLowerCase())
          .join(' and ')} in the Details panel before downloading.`
      );
      return;
    }

    try {
      setDownloading(true);

      const { toPng } = await import('html-to-image');
      // Export at 1080 px wide — Instagram's recommended size.
      const dataUrl = await toPng(templateRef.current, {
        pixelRatio: 1080 / template.width,
      });

      // Name the file after the person if the design has a name field
      // (studentName, studentsFullName1…), else its first filled-in detail.
      const nameKey = Object.keys(templateFields).find(
        (k) => /name/i.test(k) && !/company|organi[sz]ation|event/i.test(k) && templateFields[k]
      );
      const slug = (templateFields[nameKey] || Object.values(templateFields).find(Boolean) || 'post')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${slug || 'post'}-poster.png`;
      link.click();
    } catch (error) {
      showAlert(
        'Download failed',
        error?.message || 'Could not save the poster as an image.'
      );
    } finally {
      setDownloading(false);
    }
  };

  // A post drawn in one of the account's designs is a finished image.
  const handleDownloadImage = () => {
    if (!postImageUri) return;
    const name = (aiResult?.fields?.personName || aiResult?.fields?.headline || 'post')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const link = document.createElement('a');
    link.href = postImageUri;
    link.download = `${name || 'post'}.png`;
    link.click();
  };

  const renderPoster = (style) => (
    <ScaledTemplate
      template={template}
      templateRef={templateRef}
      style={style}
      fields={templateFields}
      images={aiResult.slotImages}
      brandKit={brandKit}
    />
  );

  // Built-in fields have friendly labels; reference fields use what
  // Qwen3-VL / the user called that part of the design.
  const fieldLabel = (key) =>
    FIELD_INPUTS[key]?.label ||
    postTypes[templateType]?.fieldLabels?.[key] ||
    key;

  const updateTemplateField = (key, value) => {
    setTemplateFields((prev) => ({ ...prev, [key]: value }));
  };

  const closeModal = () => {
    // Drop any run still in flight so it can't reopen the modal.
    generationRun.current += 1;
    setModalStage(null);
    setModerating(false);
  };

  /* =====================================================
     REVIEW PAGE
  ===================================================== */

  if (showReviewPage) {
    return (
      <DashboardShell
        active="create"
        title="Review your post"
        headerRight={
          <HeaderToggle
            value={autoApprove}
            onChange={setAutoApprove}
          />
        }
      >
        <ScrollView
          contentContainerStyle={styles.reviewPage}
          showsVerticalScrollIndicator={false}
        >
          {/* ------------------------------------------------
              REVIEW TOP BAR
          ------------------------------------------------ */}

          <View style={styles.reviewTopBar}>
            <TouchableOpacity
              style={styles.backToCreateBtn}
              onPress={handleBackToCreate}
              activeOpacity={0.85}
            >
              <Text style={styles.backToCreateIcon}>
                ←
              </Text>

              <Text style={styles.backToCreateText}>
                Back to create
              </Text>
            </TouchableOpacity>

            <View style={styles.stepIndicator}>
              <View style={styles.stepDone}>
                <Text style={styles.stepDoneText}>
                  ✓
                </Text>
              </View>

              <View style={styles.stepLine} />

              <View style={styles.stepActive}>
                <Text style={styles.stepActiveText}>
                  2
                </Text>
              </View>

              <Text style={styles.stepLabel}>
                Review & publish
              </Text>
            </View>
          </View>

          {/* ------------------------------------------------
              HERO
          ------------------------------------------------ */}

          <View style={styles.reviewHero}>
            <View style={styles.previewReadyBadge}>
              <View style={styles.previewReadyDot} />

              <Text style={styles.previewReadyText}>
                PREVIEW READY
              </Text>
            </View>

            <Text style={styles.reviewHeading}>
              Looking good?
            </Text>

            <Text style={styles.reviewSubheading}>
              Your post has passed moderation and is ready
              for one final review before publishing.
            </Text>
          </View>

          {/* ------------------------------------------------
              MAIN REVIEW CONTENT
          ------------------------------------------------ */}

          <View style={styles.reviewContent}>
            {/* ================= POST PREVIEW ================= */}

            <View style={styles.postCard}>
              {/* Post header */}

              <View style={styles.postHeader}>
                <View style={styles.postAvatar}>
                  <Text style={styles.postAvatarText}>
                    F
                  </Text>
                </View>

                <View style={styles.postAccount}>
                  <Text style={styles.postAccountName}>
                    fernwood.studio
                  </Text>

                  <Text style={styles.postAccountMeta}>
                    {platform} • Just now
                  </Text>
                </View>

                <Text style={styles.postMore}>
                  •••
                </Text>
              </View>

              {/* Image */}

              {isPoster ? (
                renderPoster()
              ) : (
                <View
                  style={[
                    styles.reviewImage,
                    {
                      aspectRatio: previewAspect,
                    },
                  ]}
                >
                  {postImageUri ? (
                    <Image
                      source={{ uri: postImageUri }}
                      style={[
                        styles.reviewImageFull,
                        imageFilterStyle,
                      ]}
                    />
                  ) : (
                    <View style={styles.placeholderArtwork}>
                      <Text style={styles.placeholderEmoji}>
                        🏺
                      </Text>

                      <Text style={styles.placeholderTitle}>
                        Autumn Ceramics
                      </Text>

                      <Text
                        style={styles.placeholderSubtitle}
                      >
                        Handmade • Small batch
                      </Text>
                    </View>
                )}
              </View>
              )}

              {/* Post body */}

              <View style={styles.postBody}>
                <View style={styles.postIconRow}>
                  <Text style={styles.postIcon}>
                    ♡
                  </Text>

                  <Text style={styles.postIcon}>
                    ○
                  </Text>

                  <Text style={styles.postIcon}>
                    ⤴
                  </Text>

                  <Text style={styles.postSave}>
                    ♡
                  </Text>
                </View>

                <Text style={styles.postLikes}>
                  248 likes
                </Text>

                <Text style={styles.postCaption}>
                  <Text style={styles.postCaptionBold}>
                    fernwood.studio
                  </Text>{' '}
                  {generatedCaption}
                </Text>

                <Text style={styles.postComments}>
                  View all 18 comments
                </Text>
              </View>
            </View>

            {/* ================= RIGHT PANEL ================= */}

            <View style={styles.reviewSide}>
              {/* Score */}

              <View style={styles.scoreCard}>
                <View style={styles.scoreCircle}>
                  <Text style={styles.scoreNumber}>
                    98
                  </Text>

                  <Text style={styles.scorePercent}>
                    %
                  </Text>
                </View>

                <View style={styles.scoreTextBox}>
                  <Text style={styles.scoreTitle}>
                    Ready to publish
                  </Text>

                  <Text style={styles.scoreDescription}>
                    Your content looks polished and matches
                    your brand style.
                  </Text>
                </View>
              </View>

              {/* Moderation status */}

              <View style={styles.statusCard}>
                <View style={styles.statusIcon}>
                  <Text style={styles.statusIconText}>
                    ✓
                  </Text>
                </View>

                <View style={styles.statusContent}>
                  <Text style={styles.statusTitle}>
                    Passed moderation
                  </Text>

                  <Text style={styles.statusText}>
                    No content issues detected. Your post
                    is safe to publish.
                  </Text>
                </View>
              </View>

              {/* Details */}

              <View style={styles.detailsCard}>
                <Text style={styles.detailsHeading}>
                  POST DETAILS
                </Text>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    Platform
                  </Text>

                  <View style={styles.detailPill}>
                    <Text style={styles.detailPillText}>
                      {platform}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailDivider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    Tone
                  </Text>

                  <Text style={styles.detailValue}>
                    {effectiveTone}
                  </Text>
                </View>

                <View style={styles.detailDivider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    Image
                  </Text>

                  <Text style={styles.detailValue}>
                    {isPoster
                      ? postTypes[templateType].label
                      : postImageIsUpload
                        ? 'Your photo'
                        : postImageUri
                          ? 'Generated'
                          : 'None yet'}
                  </Text>
                </View>

                <View style={styles.detailDivider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    Status
                  </Text>

                  <Text style={styles.readyValue}>
                    Ready
                  </Text>
                </View>
              </View>

              {/* Approve */}

              <TouchableOpacity
                style={styles.approveBtn}
                onPress={handlePublish}
                activeOpacity={0.88}
              >
                <Text style={styles.approveBtnText}>
                  ✓ &nbsp; Approve & publish
                </Text>
              </TouchableOpacity>

              {/* Secondary buttons */}

              <View style={styles.secondaryActions}>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={handleChangePrompt}
                  activeOpacity={0.85}
                >
                  <Text style={styles.secondaryBtnIcon}>
                    ✎
                  </Text>

                  <Text style={styles.secondaryBtnText}>
                    Edit prompt
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={handleRegenerate}
                  activeOpacity={0.85}
                >
                  <Text style={styles.secondaryBtnIcon}>
                    ↻
                  </Text>

                  <Text style={styles.secondaryBtnText}>
                    Regenerate
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Tip */}

              <View style={styles.tipCard}>
                <View style={styles.tipIconCircle}>
                  <Text style={styles.tipIcon}>
                    ✨
                  </Text>
                </View>

                <View style={styles.tipContent}>
                  <Text style={styles.tipTitle}>
                    Pro tip
                  </Text>

                  <Text style={styles.tipText}>
                    Posts with warm, behind-the-scenes
                    storytelling tend to feel more authentic
                    to your audience.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </DashboardShell>
    );
  }

  /* =====================================================
     CREATE PAGE
  ===================================================== */

  return (
    <DashboardShell
      active="create"
      title="Create a post"
      headerRight={
        <HeaderToggle
          value={autoApprove}
          onChange={setAutoApprove}
        />
      }
    >
      <View style={styles.row}>
        {/* =================================================
            MAIN PANE
        ================================================= */}

        <View style={styles.mainPane}>
          <Text style={styles.heading}>
            What are we posting today?
          </Text>

          {/* Platform */}

          <Text style={styles.fieldLabel}>
            Platform
          </Text>

          <View style={styles.platformRow}>
            {PLATFORMS.map((p) => {
              const isActive = p === platform;

              return (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.platformPill,
                    isActive &&
                      styles.platformPillActive,
                  ]}
                  onPress={() => setPlatform(p)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.platformPillText,
                      isActive &&
                        styles.platformPillTextActive,
                    ]}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Prompt */}

          <Text style={styles.fieldLabel}>
            Prompt
          </Text>

          <TextInput
            value={prompt}
            onChangeText={setPrompt}
            multiline
            style={styles.promptInput}
            placeholder={
              'Tell us what you want to post about — e.g. "Congratulate Pragya Shrivastav (CSE, 2027 batch) on her placement at AAJ Supply Chain, 40 LPA"'
            }
            placeholderTextColor={GRAY_TEXT}
          />

          {/* Tone + Photo */}

          <View style={styles.twoColRow}>
            {/* Tone */}

            <View style={styles.toneCol}>
              <Text style={styles.fieldLabel}>
                Tone
              </Text>

              <TouchableOpacity
                ref={toneFieldRef}
                style={styles.toneDropdownField}
                activeOpacity={0.85}
                onPress={toggleToneDropdown}
              >
                <Text
                  style={styles.toneDropdownText}
                  numberOfLines={1}
                >
                  {toneFieldLabel}
                </Text>

                <Text style={styles.toneDropdownChevron}>
                  {toneOpen ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>

              {isCustomTone && (
                <TextInput
                  value={customTone}
                  onChangeText={setCustomTone}
                  style={styles.customToneInput}
                  placeholder="e.g. Nostalgic & cozy"
                  placeholderTextColor={GRAY_TEXT}
                />
              )}
            </View>

            {/* Photos & logos */}

            <View style={styles.photoCol}>
              <Text style={styles.fieldLabel}>
                Photos &amp; logos (optional, up to {MAX_IMAGES})
              </Text>

              {images.map((img) => (
                <View key={img.id} style={[styles.imagePreviewRow, styles.imageListRow]}>
                  <Image
                    source={{ uri: img.uri }}
                    style={styles.imagePreviewThumb}
                    resizeMode="cover"
                  />

                  <View style={{ flex: 1 }}>
                    <Text
                      style={styles.imagePreviewName}
                      numberOfLines={1}
                    >
                      {imageKinds[img.id]
                        ? IMAGE_KIND_LABELS[imageKinds[img.id]]
                        : 'Image attached'}
                      {typeof img.fileSize === 'number'
                        ? ` · ${(img.fileSize / 1024).toFixed(0)} KB`
                        : ''}
                    </Text>

                    <TouchableOpacity
                      onPress={() => removeImage(img.id)}
                    >
                      <Text
                        style={
                          styles.imagePreviewRemove
                        }
                      >
                        Remove
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {images.length < MAX_IMAGES && (
                <TouchableOpacity
                  style={[styles.dropZone, images.length > 0 && styles.dropZoneCompact]}
                  activeOpacity={0.8}
                  onPress={() => pickImage()}
                >
                  <Text style={styles.dropZoneIcon}>
                    🖼️
                  </Text>

                  <Text style={styles.dropZoneText}>
                    {images.length ? 'Add another image' : 'Drop image or browse'}
                  </Text>
                </TouchableOpacity>
              )}

              {imageError ? (
                <Text style={styles.imageErrorText}>
                  {imageError}
                </Text>
              ) : null}

              <Text style={styles.posterHint}>
                Social Lift works out what each image is (a student photo, a
                company logo…) and places and crops it to fit the post.
                Posters use your Brand Kit for the header and footer.
              </Text>
            </View>
          </View>

          {/* =================================================
              GENERATE + NEXT BUTTON
          ================================================= */}

          <View style={styles.primaryActionsRow}>
            <TouchableOpacity
              style={styles.generateBtn}
              onPress={handleGenerate}
              activeOpacity={0.88}
            >
              <View style={styles.generateIconWrap}>
                <Text style={styles.generateIcon}>
                  ⚡
                </Text>
              </View>

              <Text style={styles.generateBtnText}>
                Generate post
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.nextBtn}
              onPress={handleNext}
              activeOpacity={0.88}
            >
              <Text style={styles.nextBtnText}>
                Next
              </Text>

              <Text style={styles.nextBtnArrow}>
                →
              </Text>
            </TouchableOpacity>
          </View>

          {/* Recently published */}

          {recent.length > 0 && (
            <View style={styles.recentBlock}>
              <Text style={styles.recentHeading}>
                Recently published
              </Text>

              {recent.map((r) => (
                <View
                  key={r.id}
                  style={styles.recentItem}
                >
                  <Text style={styles.recentPlatform}>
                    {r.platform}
                  </Text>

                  <Text
                    style={styles.recentCaption}
                    numberOfLines={1}
                  >
                    {r.caption}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* =================================================
            SUGGESTIONS
        ================================================= */}

        <View style={styles.sidePane}>
          <Text style={styles.sideHeading}>
            Suggested from your analytics
          </Text>

          {SUGGESTIONS.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={styles.suggestionCard}
              activeOpacity={0.8}
              onPress={() =>
                applySuggestion(s.text)
              }
            >
              <Text style={styles.suggestionText}>
                {s.text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ===================================================
          TONE DROPDOWN
      =================================================== */}

      <Modal
        visible={toneOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setToneOpen(false)}
      >
        <Pressable
          style={styles.toneOverlay}
          onPress={() => setToneOpen(false)}
        >
          <View
            style={[
              styles.toneDropdownPanel,
              {
                top: dropdownPos.top,
                left: dropdownPos.left,
                width: dropdownPos.width,
              },
            ]}
          >
            {TONE_OPTIONS.map((t) => (
              <TouchableOpacity
                key={t}
                style={styles.toneDropdownItem}
                activeOpacity={0.8}
                onPress={() => selectTone(t)}
              >
                <Text
                  style={[
                    styles.toneDropdownItemText,
                    t === tone &&
                      styles.toneDropdownItemTextActive,
                  ]}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}

            <View style={styles.toneDropdownDivider} />

            <TouchableOpacity
              style={styles.toneDropdownItem}
              activeOpacity={0.8}
              onPress={() =>
                selectTone(CUSTOM_TONE)
              }
            >
              <Text
                style={[
                  styles.toneDropdownItemText,
                  isCustomTone &&
                    styles.toneDropdownItemTextActive,
                ]}
              >
                ✏️ Custom…
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* ===================================================
          GENERATE / PREVIEW MODAL
      =================================================== */}

      <Modal
        visible={modalStage !== null}
        animationType="fade"
        transparent={false}
        onRequestClose={closeModal}
        presentationStyle="overFullScreen"
      >
        <View style={styles.modalRoot}>
          <TouchableOpacity
            style={styles.modalCloseBtn}
            onPress={closeModal}
            activeOpacity={0.8}
          >
            <Text style={styles.modalCloseText}>
              ✕
            </Text>
          </TouchableOpacity>

          {/* Generating */}

          {modalStage === 'generating' && (
            <View style={styles.modalCenter}>
              <SpinnerDot />

              <Text
                style={styles.modalGeneratingTitle}
              >
                Generating your post…
              </Text>

              <Text
                style={styles.modalGeneratingBody}
              >
                {generationStep === 'analyzing' ? (
                  'Looking at your images…'
                ) : generationStep === 'style' ? (
                  "Reading your reference's design notes…"
                ) : generationStep === 'checking' ? (
                  'Checking the heading and name are spelt right…'
                ) : generationStep === 'photo' ? (
                  'Placing the photo…'
                ) : generationStep === 'slow' ? (
                  onBattery
                    ? 'Still drawing, slowly: this laptop is running on battery, which makes the GPU up to 8× slower. Plug it in and the rest goes much faster. Keep this page open.'
                    : 'Still drawing — this is taking longer than usual. If the laptop running the AI is on battery, plug it in (the GPU runs up to 8× slower on battery). Keep this page open.'
                ) : generationStep === 'image' ? (
                  Object.keys(postTypes).some(isReferenceType)
                    ? 'Drawing your post from scratch in your design style — a minute or two.'
                    : 'Painting a picture for your post — this can take a minute or two.'
                ) : (
                  <>
                    Working out what kind of post this is and writing
                    the caption in your{' '}
                    {effectiveTone.toLowerCase()} voice for{' '}
                    {platform}.
                  </>
                )}
              </Text>
            </View>
          )}

          {/* Preview */}

          {modalStage === 'preview' && (
            <ScrollView
              contentContainerStyle={
                styles.modalPreviewScroll
              }
              showsVerticalScrollIndicator={false}
            >
              <Text
                style={styles.modalPreviewHeading}
              >
                Post preview
              </Text>

              {isPoster ? (
                renderPoster(styles.modalPoster)
              ) : (
                <View
                  style={[
                    styles.modalPreviewImage,
                    {
                      aspectRatio:
                        previewAspect,
                    },
                  ]}
                >
                  {postImageUri ? (
                    <Image
                      source={{ uri: postImageUri }}
                      style={[
                        styles.modalPreviewImageFull,
                        imageFilterStyle,
                      ]}
                    />
                  ) : (
                    <Text
                      style={[
                        styles.modalPreviewImageIcon,
                        imageFilterStyle,
                      ]}
                    >
                      🏺
                    </Text>
                  )}
                </View>
              )}

              {/* Moderation */}

              {moderating ? (
                <View style={styles.moderatePanel}>
                  <View
                    style={styles.moderateTabRow}
                  >
                    <TouchableOpacity
                      style={[
                        styles.moderateTabPill,
                        moderateTab ===
                          'caption' &&
                          styles.moderateTabPillActive,
                      ]}
                      activeOpacity={0.85}
                      onPress={() =>
                        setModerateTab('caption')
                      }
                    >
                      <Text
                        style={[
                          styles.moderateTabText,
                          moderateTab ===
                            'caption' &&
                            styles.moderateTabTextActive,
                        ]}
                      >
                        Caption
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.moderateTabPill,
                        moderateTab !== 'caption' &&
                          styles.moderateTabPillActive,
                      ]}
                      activeOpacity={0.85}
                      onPress={() =>
                        setModerateTab(
                          isPoster ? 'details' : 'image'
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.moderateTabText,
                          moderateTab !== 'caption' &&
                            styles.moderateTabTextActive,
                        ]}
                      >
                        {isPoster ? 'Details' : 'Image'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {moderateTab === 'caption' ? (
                    <>
                      <TextInput
                        value={generatedCaption}
                        onChangeText={
                          setCaptionOverride
                        }
                        multiline
                        style={
                          styles.modalModerateInput
                        }
                        placeholderTextColor={
                          DARK_TEXT_MUTED
                        }
                      />

                      <TouchableOpacity
                        style={
                          styles.modalModerateSaveBtn
                        }
                        activeOpacity={0.88}
                        onPress={() =>
                          setModerating(false)
                        }
                      >
                        <Text
                          style={
                            styles.modalModerateSaveText
                          }
                        >
                          Save changes
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : isPoster ? (
                    <View style={styles.posterDetailsPanel}>
                      {Object.keys(postTypes[templateType].fields).map((key) => (
                        <View key={key}>
                          <Text style={styles.posterDetailLabel}>
                            {fieldLabel(key)}
                          </Text>

                          <TextInput
                            value={templateFields[key] || ''}
                            onChangeText={(v) =>
                              updateTemplateField(key, v)
                            }
                            placeholder={FIELD_INPUTS[key]?.placeholder}
                            placeholderTextColor={
                              DARK_TEXT_MUTED
                            }
                            style={styles.posterDetailInput}
                          />
                        </View>
                      ))}

                      <TouchableOpacity
                        style={
                          styles.modalModerateSaveBtn
                        }
                        activeOpacity={0.88}
                        onPress={() =>
                          setModerating(false)
                        }
                      >
                        <Text
                          style={
                            styles.modalModerateSaveText
                          }
                        >
                          Done
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View
                      style={styles.imageAdjustPanel}
                    >
                      <AdjustStepper
                        label="Brightness"
                        value={imgBrightness}
                        onChange={
                          setImgBrightness
                        }
                      />

                      <AdjustStepper
                        label="Contrast"
                        value={imgContrast}
                        onChange={
                          setImgContrast
                        }
                      />

                      <AdjustStepper
                        label="Saturation"
                        value={imgSaturation}
                        onChange={
                          setImgSaturation
                        }
                      />

                      <Text
                        style={
                          styles.adjustSectionLabel
                        }
                      >
                        Rotate & crop
                      </Text>

                      <View
                        style={styles.cropRow}
                      >
                        <TouchableOpacity
                          style={
                            styles.rotateBtn
                          }
                          activeOpacity={0.85}
                          onPress={() =>
                            setImgRotation(
                              (r) =>
                                (r + 90) % 360
                            )
                          }
                        >
                          <Text
                            style={
                              styles.rotateBtnIcon
                            }
                          >
                            ⟳
                          </Text>

                          <Text
                            style={
                              styles.rotateBtnText
                            }
                          >
                            Rotate 90°
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <View
                        style={styles.aspectRow}
                      >
                        {ASPECT_OPTIONS.map(
                          (a) => {
                            const isActive =
                              a.key ===
                              cropAspect;

                            return (
                              <TouchableOpacity
                                key={a.key}
                                style={[
                                  styles.aspectPill,
                                  isActive &&
                                    styles.aspectPillActive,
                                ]}
                                activeOpacity={
                                  0.85
                                }
                                onPress={() =>
                                  setCropAspect(
                                    a.key
                                  )
                                }
                              >
                                <Text
                                  style={[
                                    styles.aspectPillText,
                                    isActive &&
                                      styles.aspectPillTextActive,
                                  ]}
                                >
                                  {a.label}
                                </Text>
                              </TouchableOpacity>
                            );
                          }
                        )}
                      </View>

                      <TouchableOpacity
                        style={styles.resetBtn}
                        activeOpacity={0.8}
                        onPress={
                          resetImageAdjustments
                        }
                      >
                        <Text
                          style={
                            styles.resetBtnText
                          }
                        >
                          Reset adjustments
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={
                          styles.modalModerateSaveBtn
                        }
                        activeOpacity={0.88}
                        onPress={() =>
                          setModerating(false)
                        }
                      >
                        <Text
                          style={
                            styles.modalModerateSaveText
                          }
                        >
                          Done
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ) : (
                <Text
                  style={styles.modalPreviewCaption}
                >
                  {generatedCaption}
                </Text>
              )}

              <View style={styles.modalTagRow}>
                <View style={styles.modalTag}>
                  <Text style={styles.modalTagText}>
                    {platform}
                  </Text>
                </View>

                <View style={styles.modalTag}>
                  <Text style={styles.modalTagText}>
                    {effectiveTone}
                  </Text>
                </View>
              </View>

              {isDesigned && aiResult.misspelt?.length > 0 && (
                <Text style={styles.spellingNote}>
                  Check the spelling of {aiResult.misspelt.map((t) => `"${t}"`).join(' and ')} in the
                  design — it couldn't be confirmed. Press Regenerate if it's wrong.
                </Text>
              )}

              {isDesigned && aiResult.photoCrowded && (
                <Text style={styles.spellingNote}>
                  The design left little room for the photo, so it may sit close to some text. Press Regenerate
                  for a new layout.
                </Text>
              )}

              {(isPoster || isDesigned) && Platform.OS === 'web' && (
                <TouchableOpacity
                  style={styles.modalDownloadBtn}
                  onPress={isPoster ? handleDownloadPoster : handleDownloadImage}
                  activeOpacity={0.88}
                  disabled={downloading}
                >
                  <Text style={styles.modalDownloadBtnText}>
                    {downloading
                      ? 'Preparing PNG…'
                      : '⬇  Download poster (PNG)'}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.modalPublishBtn}
                onPress={handlePublish}
                activeOpacity={0.88}
              >
                <Text
                  style={styles.modalPublishBtnText}
                >
                  Publish
                </Text>
              </TouchableOpacity>

              <View style={styles.modalActionBar}>
                <TouchableOpacity
                  style={styles.modalActionBtn}
                  activeOpacity={0.8}
                  onPress={() => {
                    setModerating((v) => !v);
                    setModerateTab('caption');
                  }}
                >
                  <Text
                    style={styles.modalActionIcon}
                  >
                    ✏️
                  </Text>

                  <Text
                    style={styles.modalActionLabel}
                  >
                    Moderate
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalActionBtn}
                  activeOpacity={0.8}
                  onPress={handleChangePrompt}
                >
                  <Text
                    style={styles.modalActionIcon}
                  >
                    💬
                  </Text>

                  <Text
                    style={styles.modalActionLabel}
                  >
                    Change prompt
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalActionBtn}
                  activeOpacity={0.8}
                  onPress={handleRegenerate}
                >
                  <Text
                    style={styles.modalActionIcon}
                  >
                    🔄
                  </Text>

                  <Text
                    style={styles.modalActionLabel}
                  >
                    Regenerate
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalActionBtn}
                  activeOpacity={0.8}
                  onPress={
                    handleUploadDifferentPhoto
                  }
                >
                  <Text
                    style={styles.modalActionIcon}
                  >
                    🖼️
                  </Text>

                  <Text
                    style={styles.modalActionLabel}
                  >
                    Upload different photo
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </DashboardShell>
  );
}

/* =======================================================
   STYLES
======================================================= */

const styles = StyleSheet.create({
  /* -----------------------------------------------------
     CREATE PAGE
  ----------------------------------------------------- */

  row: {
    flexDirection: 'row',
    gap: 32,
    alignItems: 'flex-start',
  },

  mainPane: {
    flex: 1.6,
    minWidth: 320,
  },

  sidePane: {
    flex: 1,
    minWidth: 260,
  },

  heading: {
    fontFamily: 'serif',
    fontSize: 20,
    fontWeight: '700',
    color: DARK_TEXT,
    marginBottom: 22,
  },

  fieldLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: GRAY_TEXT,
    marginBottom: 8,
    textTransform: 'capitalize',
  },

  platformRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 22,
  },

  platformPill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#fff',
  },

  platformPillActive: {
    backgroundColor: PURPLE,
    borderColor: PURPLE,
  },

  platformPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: DARK_TEXT,
  },

  platformPillTextActive: {
    color: '#fff',
  },

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

  twoColRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 24,
  },

  toneCol: {
    flex: 1,
  },

  photoCol: {
    flex: 1,
  },

  toneDropdownField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },

  toneDropdownText: {
    fontSize: 13,
    color: DARK_TEXT,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },

  toneDropdownChevron: {
    fontSize: 10,
    color: GRAY_TEXT,
  },

  customToneInput: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: PURPLE,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13,
    color: DARK_TEXT,
  },

  toneOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  toneDropdownPanel: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingVertical: 4,
    boxShadow: '0px 8px 20px rgba(0,0,0,0.16)',
  },

  toneDropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  toneDropdownItemText: {
    fontSize: 12.5,
    color: DARK_TEXT,
  },

  toneDropdownItemTextActive: {
    color: PURPLE,
    fontWeight: '700',
  },

  toneDropdownDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 4,
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

  dropZoneIcon: {
    fontSize: 13,
    marginRight: 8,
    opacity: 0.6,
  },

  dropZoneText: {
    fontSize: 12,
    color: GRAY_TEXT,
  },

  imageErrorText: {
    fontSize: 11,
    color: RED,
    marginTop: 6,
    lineHeight: 15,
  },

  imagePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0EEE7',
    borderRadius: 10,
    padding: 8,
  },

  imagePreviewThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: BORDER,
  },

  imagePreviewName: {
    fontSize: 11.5,
    color: DARK_TEXT,
    fontWeight: '600',
    marginBottom: 2,
  },

  imagePreviewRemove: {
    fontSize: 11,
    color: RED,
    fontWeight: '700',
  },

  /* -----------------------------------------------------
     BUTTONS
  ----------------------------------------------------- */

  primaryActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: ORANGE,
    borderRadius: 9,
    paddingVertical: 11,
    paddingHorizontal: 18,
    boxShadow:
      '0px 8px 18px rgba(243,93,66,0.3)',
  },

  generateIconWrap: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor:
      'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  generateIcon: {
    fontSize: 10,
  },

  generateBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },

  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: PURPLE,
    paddingVertical: 10,
    paddingHorizontal: 20,
    minWidth: 105,
  },

  nextBtnText: {
    color: PURPLE,
    fontWeight: '800',
    fontSize: 13,
  },

  nextBtnArrow: {
    color: PURPLE,
    fontSize: 17,
    fontWeight: '800',
    marginLeft: 8,
  },

  recentBlock: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },

  recentHeading: {
    fontSize: 11.5,
    fontWeight: '700',
    color: GRAY_TEXT,
    marginBottom: 10,
  },

  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GREEN_BG,
    borderRadius: 9,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginBottom: 8,
    gap: 10,
  },

  recentPlatform: {
    fontSize: 10.5,
    fontWeight: '800',
    color: GREEN,
  },

  recentCaption: {
    fontSize: 11.5,
    color: DARK_TEXT,
    flex: 1,
  },

  /* -----------------------------------------------------
     HEADER TOGGLE
  ----------------------------------------------------- */

  toggleTrack: {
    width: 42,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EEEBE3',
    padding: 2,
    justifyContent: 'center',
  },

  toggleThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },

  /* -----------------------------------------------------
     SIDE SUGGESTIONS
  ----------------------------------------------------- */

  sideHeading: {
    fontSize: 11.5,
    fontWeight: '700',
    color: GRAY_TEXT,
    marginBottom: 14,
  },

  suggestionCard: {
    backgroundColor: PANEL_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },

  suggestionText: {
    fontSize: 12,
    color: DARK_TEXT,
    lineHeight: 17,
  },

  /* =====================================================
     REVIEW PAGE
  ===================================================== */

  reviewPage: {
    paddingHorizontal: 34,
    paddingTop: 26,
    paddingBottom: 50,
    backgroundColor: '#F7F5EF',
    minHeight: '100%',
  },

  reviewTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25,
  },

  backToCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },

  backToCreateIcon: {
    fontSize: 17,
    color: DARK_TEXT,
    marginRight: 7,
  },

  backToCreateText: {
    fontSize: 12,
    fontWeight: '700',
    color: DARK_TEXT,
  },

  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  stepDone: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: '#DDF2E3',
    alignItems: 'center',
    justifyContent: 'center',
  },

  stepDoneText: {
    color: GREEN,
    fontWeight: '900',
    fontSize: 12,
  },

  stepLine: {
    width: 35,
    height: 2,
    backgroundColor: '#D7D2C9',
    marginHorizontal: 8,
  },

  stepActive: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  stepActiveText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
  },

  stepLabel: {
    marginLeft: 9,
    fontSize: 11,
    fontWeight: '700',
    color: GRAY_TEXT,
  },

  /* -----------------------------------------------------
     REVIEW HERO
  ----------------------------------------------------- */

  reviewHero: {
    backgroundColor: '#19171F',
    borderRadius: 22,
    paddingHorizontal: 30,
    paddingVertical: 28,
    marginBottom: 25,
    overflow: 'hidden',
    boxShadow:
      '0px 14px 30px rgba(30,25,40,0.18)',
  },

  previewReadyBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      'rgba(108,92,231,0.17)',
    borderWidth: 1,
    borderColor:
      'rgba(108,92,231,0.4)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 14,
  },

  previewReadyDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#74DD91',
    marginRight: 7,
  },

  previewReadyText: {
    color: '#C8C2FF',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 1,
  },

  reviewHeading: {
    color: '#FFFFFF',
    fontFamily: 'serif',
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 7,
  },

  reviewSubheading: {
    color: '#AAA6B4',
    fontSize: 12.5,
    lineHeight: 19,
    maxWidth: 650,
  },

  /* -----------------------------------------------------
     REVIEW CONTENT
  ----------------------------------------------------- */

  reviewContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 26,
  },

  /* -----------------------------------------------------
     SOCIAL POST
  ----------------------------------------------------- */

  postCard: {
    flex: 1,
    maxWidth: 570,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E1D8',
    boxShadow:
      '0px 10px 28px rgba(40,35,30,0.10)',
  },

  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },

  postAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  postAvatarText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },

  postAccount: {
    marginLeft: 10,
    flex: 1,
  },

  postAccountName: {
    fontSize: 12,
    fontWeight: '800',
    color: DARK_TEXT,
  },

  postAccountMeta: {
    fontSize: 9.5,
    color: GRAY_TEXT,
    marginTop: 2,
  },

  postMore: {
    fontSize: 15,
    color: GRAY_TEXT,
  },

  reviewImage: {
    width: '100%',
    backgroundColor: '#EAE5DA',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  reviewImageFull: {
    width: '100%',
    height: '100%',
  },

  placeholderArtwork: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8E0D0',
  },

  placeholderEmoji: {
    fontSize: 58,
    marginBottom: 10,
  },

  placeholderTitle: {
    fontFamily: 'serif',
    fontSize: 22,
    fontWeight: '800',
    color: '#3C352C',
  },

  placeholderSubtitle: {
    fontSize: 10,
    color: '#756E61',
    marginTop: 5,
  },

  postBody: {
    padding: 15,
  },

  postIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  postIcon: {
    fontSize: 22,
    marginRight: 15,
    color: '#242128',
  },

  postSave: {
    marginLeft: 'auto',
    fontSize: 21,
    color: '#242128',
  },

  postLikes: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '800',
    color: DARK_TEXT,
  },

  postCaption: {
    marginTop: 7,
    fontSize: 11.5,
    lineHeight: 17,
    color: '#444148',
  },

  postCaptionBold: {
    fontWeight: '800',
    color: DARK_TEXT,
  },

  postComments: {
    marginTop: 8,
    color: '#96919A',
    fontSize: 10,
  },

  /* -----------------------------------------------------
     REVIEW SIDE
  ----------------------------------------------------- */

  reviewSide: {
    flex: 0.9,
    minWidth: 300,
    maxWidth: 390,
  },

  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 17,
    marginBottom: 12,
    boxShadow:
      '0px 6px 18px rgba(30,25,30,0.06)',
  },

  scoreCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F0ECFF',
    borderWidth: 6,
    borderColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scoreNumber: {
    color: PURPLE,
    fontSize: 21,
    fontWeight: '900',
  },

  scorePercent: {
    color: PURPLE,
    fontSize: 8,
    fontWeight: '800',
  },

  scoreTextBox: {
    flex: 1,
    marginLeft: 14,
  },

  scoreTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: DARK_TEXT,
    marginBottom: 5,
  },

  scoreDescription: {
    color: GRAY_TEXT,
    fontSize: 10.5,
    lineHeight: 15,
  },

  /* -----------------------------------------------------
     MODERATION STATUS
  ----------------------------------------------------- */

  statusCard: {
    flexDirection: 'row',
    backgroundColor: '#EDF8F0',
    borderWidth: 1,
    borderColor: '#D4EBD9',
    borderRadius: 14,
    padding: 15,
    marginBottom: 12,
  },

  statusIcon: {
    width: 31,
    height: 31,
    borderRadius: 16,
    backgroundColor: '#CFEBD6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusIconText: {
    color: GREEN,
    fontWeight: '900',
  },

  statusContent: {
    flex: 1,
    marginLeft: 10,
  },

  statusTitle: {
    color: '#2E7045',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },

  statusText: {
    color: '#66806D',
    fontSize: 10,
    lineHeight: 15,
  },

  /* -----------------------------------------------------
     DETAILS
  ----------------------------------------------------- */

  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 17,
    marginBottom: 13,
  },

  detailsHeading: {
    color: '#98939A',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 13,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 28,
  },

  detailLabel: {
    color: GRAY_TEXT,
    fontSize: 11,
    fontWeight: '600',
  },

  detailValue: {
    color: DARK_TEXT,
    fontSize: 11,
    fontWeight: '700',
  },

  readyValue: {
    color: GREEN,
    fontSize: 11,
    fontWeight: '800',
  },

  detailPill: {
    backgroundColor: '#F0ECFF',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  detailPillText: {
    color: PURPLE,
    fontSize: 10,
    fontWeight: '800',
  },

  detailDivider: {
    height: 1,
    backgroundColor: '#EEEAE2',
    marginVertical: 5,
  },

  /* -----------------------------------------------------
     APPROVE
  ----------------------------------------------------- */

  approveBtn: {
    backgroundColor: PURPLE,
    borderRadius: 11,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    boxShadow:
      '0px 9px 20px rgba(108,92,231,0.28)',
  },

  approveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  /* -----------------------------------------------------
     SECONDARY BUTTONS
  ----------------------------------------------------- */

  secondaryActions: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 13,
  },

  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingVertical: 10,
  },

  secondaryBtnIcon: {
    color: PURPLE,
    fontSize: 14,
    marginRight: 6,
  },

  secondaryBtnText: {
    color: DARK_TEXT,
    fontSize: 10.5,
    fontWeight: '700',
  },

  /* -----------------------------------------------------
     PRO TIP
  ----------------------------------------------------- */

  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF8E8',
    borderWidth: 1,
    borderColor: '#F1E4C2',
    borderRadius: 13,
    padding: 13,
  },

  tipIconCircle: {
    width: 31,
    height: 31,
    borderRadius: 16,
    backgroundColor: '#F8EBC9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tipIcon: {
    fontSize: 16,
  },

  tipContent: {
    flex: 1,
    marginLeft: 9,
  },

  tipTitle: {
    color: '#705B28',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 3,
  },

  tipText: {
    color: '#8A794F',
    fontSize: 9.5,
    lineHeight: 14,
  },

  /* =====================================================
     DARK GENERATION MODAL
  ===================================================== */

  spinner: {
    fontSize: 32,
  },

  modalRoot: {
    flex: 1,
    backgroundColor: DARK_BG,
    paddingTop: 24,
  },

  modalCloseBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: DARK_PANEL,
    borderWidth: 1,
    borderColor: DARK_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  modalCloseText: {
    color: DARK_TEXT_PRIMARY,
    fontSize: 15,
    fontWeight: '700',
  },

  modalCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },

  modalGeneratingTitle: {
    color: DARK_TEXT_PRIMARY,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 18,
    marginBottom: 8,
  },

  modalGeneratingBody: {
    color: DARK_TEXT_MUTED,
    fontSize: 13,
    textAlign: 'center',
  },

  modalPoster: {
    borderRadius: 14,
    marginBottom: 18,
    overflow: 'hidden',
  },







  spellingNote: {
    color: DARK_TEXT_MUTED,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
  },


  modalDownloadBtn: {
    borderWidth: 1,
    borderColor: PURPLE,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },

  modalDownloadBtnText: {
    color: DARK_TEXT_PRIMARY,
    fontSize: 15,
    fontWeight: '700',
  },

  posterDetailsPanel: {
    gap: 10,
  },

  posterDetailLabel: {
    color: DARK_TEXT_MUTED,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },

  posterDetailInput: {
    color: DARK_TEXT_PRIMARY,
    fontSize: 14,
    backgroundColor: DARK_PANEL,
    borderWidth: 1,
    borderColor: DARK_BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  posterHint: {
    fontSize: 12,
    lineHeight: 17,
    color: GRAY_TEXT,
    marginTop: 8,
  },

  imageListRow: {
    marginBottom: 8,
  },

  dropZoneCompact: {
    height: 64,
  },

  modalPreviewScroll: {
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 40,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },

  modalPreviewHeading: {
    color: DARK_TEXT_PRIMARY,
    fontFamily: 'serif',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 18,
  },

  modalPreviewImage: {
    width: '100%',
    aspectRatio: 1.8,
    borderRadius: 14,
    backgroundColor: DARK_PANEL,
    borderWidth: 1,
    borderColor: DARK_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    overflow: 'hidden',
  },

  modalPreviewImageFull: {
    width: '100%',
    height: '100%',
  },

  modalPreviewImageIcon: {
    fontSize: 44,
  },

  modalPreviewCaption: {
    color: DARK_TEXT_PRIMARY,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16,
  },

  /* -----------------------------------------------------
     MODERATION
  ----------------------------------------------------- */

  modalModerateInput: {
    color: DARK_TEXT_PRIMARY,
    fontSize: 14,
    lineHeight: 21,
    backgroundColor: DARK_PANEL,
    borderWidth: 1,
    borderColor: PURPLE,
    borderRadius: 10,
    padding: 14,
    minHeight: 90,
    textAlignVertical: 'top',
    marginBottom: 10,
  },

  modalModerateSaveBtn: {
    alignSelf: 'flex-start',
    backgroundColor: PURPLE,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginBottom: 16,
  },

  modalModerateSaveText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },

  moderatePanel: {
    marginBottom: 6,
  },

  moderateTabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },

  moderateTabPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: DARK_BORDER,
    backgroundColor: DARK_PANEL,
  },

  moderateTabPillActive: {
    backgroundColor: PURPLE,
    borderColor: PURPLE,
  },

  moderateTabText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: DARK_TEXT_MUTED,
  },

  moderateTabTextActive: {
    color: '#fff',
  },

  imageAdjustPanel: {
    backgroundColor: DARK_PANEL,
    borderWidth: 1,
    borderColor: DARK_BORDER,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },

  adjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  adjustLabel: {
    fontSize: 12.5,
    color: DARK_TEXT_PRIMARY,
    fontWeight: '600',
  },

  adjustControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  adjustBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: DARK_BORDER,
    backgroundColor: DARK_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },

  adjustBtnText: {
    color: DARK_TEXT_PRIMARY,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 16,
  },

  adjustBtnTextDisabled: {
    color: DARK_TEXT_MUTED,
  },

  adjustValue: {
    color: DARK_TEXT_PRIMARY,
    fontSize: 12,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'center',
  },

  adjustSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: DARK_TEXT_MUTED,
    textTransform: 'uppercase',
    marginTop: 4,
    marginBottom: 10,
  },

  cropRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },

  rotateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DARK_BG,
    borderWidth: 1,
    borderColor: DARK_BORDER,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  rotateBtnIcon: {
    color: DARK_TEXT_PRIMARY,
    fontSize: 14,
    marginRight: 7,
  },

  rotateBtnText: {
    color: DARK_TEXT_PRIMARY,
    fontSize: 12,
    fontWeight: '600',
  },

  aspectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },

  aspectPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DARK_BORDER,
    backgroundColor: DARK_BG,
  },

  aspectPillActive: {
    backgroundColor: PURPLE,
    borderColor: PURPLE,
  },

  aspectPillText: {
    fontSize: 11.5,
    color: DARK_TEXT_MUTED,
    fontWeight: '600',
  },

  aspectPillTextActive: {
    color: '#fff',
  },

  resetBtn: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },

  resetBtnText: {
    color: ORANGE,
    fontSize: 11.5,
    fontWeight: '700',
  },

  /* -----------------------------------------------------
     MODAL TAGS
  ----------------------------------------------------- */

  modalTagRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 26,
  },

  modalTag: {
    backgroundColor: DARK_PANEL,
    borderWidth: 1,
    borderColor: DARK_BORDER,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  modalTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: DARK_TEXT_PRIMARY,
  },

  modalPublishBtn: {
    backgroundColor: PURPLE,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 22,
    boxShadow:
      '0px 8px 20px rgba(108,92,231,0.35)',
  },

  modalPublishBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  /* -----------------------------------------------------
     MODAL ACTION BAR
  ----------------------------------------------------- */

  modalActionBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: DARK_BORDER,
    paddingTop: 20,
    gap: 12,
  },

  modalActionBtn: {
    alignItems: 'center',
    minWidth: 90,
    flex: 1,
  },

  modalActionIcon: {
    fontSize: 18,
    marginBottom: 6,
  },

  modalActionLabel: {
    color: DARK_TEXT_MUTED,
    fontSize: 10.5,
    fontWeight: '600',
    textAlign: 'center',
  },
});