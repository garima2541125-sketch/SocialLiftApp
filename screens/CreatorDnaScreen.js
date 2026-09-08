import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  PanResponder,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { showAlert } from '../src/utils/alert';

const PURPLE = '#6C5CE7';
const DARK_TEXT = '#1A1A1A';
const GRAY_TEXT = '#6B6B6B';
const BORDER = '#E7E3D9';
const PANEL_BG = '#FBFAF6';
const PAGE_BG = '#F4F2EC';
const GREEN = '#5CA85C';
const RED = '#C1443A';

const { width: SCREEN_W } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_W * 0.28;

// ---------------------------------------------------------------------------
// FIXED CARD DECK
// A hand-curated, deterministic sequence of 12 cards — same order every time
// a person plays, so results are consistent and comparable. Each card carries
// a `topic` + `genre` (used for scoring), a hero icon + 2 floating accent
// icons (used to build the illustrated art panel), and a tint pair for the
// gradient background.
// ---------------------------------------------------------------------------
const CARDS = [
  { id: 'c1', topic: 'Fashion', genre: 'Photography', icon: '👗', tint: '#F3D9DC', headline: 'Street style, golden hour', body: 'A single outfit shot, natural light, no caption needed.', image: require('../assets/images/creator-dna/fashion-street-style.jpg') },
  { id: 'c2', topic: 'Food', genre: 'Video / Reels', icon: '🍜', tint: '#F6E3C5', headline: '15-second ramen recipe', body: 'Fast cuts, satisfying close-ups, one pot start to finish.', image: require('../assets/images/creator-dna/food-ramen.jpg') },
  { id: 'c3', topic: 'Fitness', genre: 'Educational', icon: '🏋️', tint: '#D8ECE1', headline: '3 form mistakes killing your squat', body: 'Quick breakdown with before/after form comparison.', image: require('../assets/images/creator-dna/fitness-squat-form.jpg') },
  { id: 'c4', topic: 'Tech', genre: 'Meme / Humor', icon: '💻', tint: '#DDE4F6', headline: '"Me explaining my side project"', body: 'A relatable dev-life meme format, self-deprecating humor.', image: require('../assets/images/creator-dna/tech-coding-meme.jpg') },
  { id: 'c5', topic: 'Business', genre: 'Promotional', icon: '📈', tint: '#EAD9F0', headline: 'Launch week — 20% off', body: 'Clean product shot, bold offer text, clear CTA.', image: require('../assets/images/creator-dna/business-launch-sale.jpg') },
  { id: 'c6', topic: 'Travel', genre: 'Behind-the-scenes', icon: '🧳', tint: '#F6E9D7', headline: 'What actually happened on day 3', body: 'Unfiltered, honest, messy hotel room and all.', image: require('../assets/images/creator-dna/travel-messy-hotel.jpg') },
  { id: 'c27', topic: 'Art', genre: 'Behind-the-scenes', icon: '🎨', tint: '#E4DCF3', headline: 'Sketch to final piece, timelapse', body: 'Raw process video, no narration, just the work.', image: require('../assets/images/creator-dna/art-sketch-timelapse.jpg') },
  { id: 'c28', topic: 'Music', genre: 'Video / Reels', icon: '🎧', tint: '#DCEAF3', headline: '15 seconds of the new track', body: 'Snappy teaser clip, high energy, minimal text.', image: require('../assets/images/creator-dna/music-headphones.jpg') },
  { id: 'c29', topic: 'Beauty', genre: 'Educational', icon: '💄', tint: '#F6DCE6', headline: 'The 3-step routine that actually works', body: 'Clear, no-nonsense skincare breakdown.', image: require('../assets/images/creator-dna/beauty-skincare-routine.jpg') },
  { id: 'c30', topic: 'Lifestyle', genre: 'Behind-the-scenes', icon: '☕', tint: '#EDE6DC', headline: 'An honest, slow Sunday morning', body: 'Quiet, unstaged, low-key vlog style.', image: require('../assets/images/creator-dna/lifestyle-sunday-coffee.jpg') },
  { id: 'c11', topic: 'Tech', genre: 'Educational', icon: '🤖', tint: '#DDE4F6', headline: '5 AI tools worth your time this month', body: 'Clear list format, practical, no hype.', image: require('../assets/images/creator-dna/tech-ai-tools.jpg') },
  { id: 'c16', topic: 'Fitness', genre: 'Promotional', icon: '💪', tint: '#D8ECE1', headline: 'New 6-week program is live', body: 'Bold before/after style promo, clear pricing.', image: require('../assets/images/creator-dna/fitness-program-launch.jpg') },
];

const TOTAL_CARDS = CARDS.length;

function computeArchetype(genreScores) {
  const sorted = Object.entries(genreScores).sort((a, b) => b[1] - a[1]);
  const top = sorted[0];
  if (!top || top[1] <= 0) return 'The Explorer';
  switch (top[0]) {
    case 'Photography':
    case 'Video / Reels':
      return 'The Visual Creator';
    case 'Meme / Humor':
      return 'The Entertainer';
    case 'Educational':
      return 'The Educator';
    case 'Promotional':
      return 'The Brand Builder';
    case 'Behind-the-scenes':
      return 'The Storyteller';
    default:
      return 'The Explorer';
  }
}

const ARCHETYPE_META = {
  'The Visual Creator': { icon: '📸', colors: ['#7C6FF0', '#A78BFA'] },
  'The Entertainer': { icon: '🎭', colors: ['#F0916F', '#F7B267'] },
  'The Educator': { icon: '🧠', colors: ['#6C5CE7', '#9B8CF2'] },
  'The Brand Builder': { icon: '🚀', colors: ['#5B4FD6', '#8E7CF0'] },
  'The Storyteller': { icon: '📖', colors: ['#5CA8A0', '#82C6BE'] },
  'The Explorer': { icon: '🧭', colors: ['#6C5CE7', '#A78BFA'] },
};

// Real photo art panel — the photo fills the top of the card, with a soft
// bottom gradient fade (so it blends into the text panel below) and a small
// floating icon badge in the corner to reinforce the topic at a glance.
function CardArt({ card }) {
  return (
    <View style={styles.artPanel}>
      <Image source={card.image} style={styles.artImage} resizeMode="cover" />
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.02)', PANEL_BG]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        locations={[0, 0.7, 1]}
        style={styles.artFade}
      />
      <View style={[styles.iconBadge, { backgroundColor: card.tint }]}>
        <Text style={styles.iconBadgeText}>{card.icon}</Text>
      </View>
    </View>
  );
}

function CardContent({ card }) {
  return (
    <View style={styles.cardInner}>
      <Text style={styles.cardHeadline}>{card.headline}</Text>
      <Text style={styles.cardBody}>{card.body}</Text>
      <View style={styles.cardTagRow}>
        <View style={styles.cardTag}>
          <Text style={styles.cardTagText}>{card.topic}</Text>
        </View>
        <View style={styles.cardTag}>
          <Text style={styles.cardTagText}>{card.genre}</Text>
        </View>
      </View>
    </View>
  );
}

function SwipeCard({ card, onDecide, isTop }) {
  const pan = useRef(new Animated.ValueXY()).current;
  const mountScale = useRef(new Animated.Value(0.86)).current;
  const rotate = pan.x.interpolate({ inputRange: [-SCREEN_W, 0, SCREEN_W], outputRange: ['-14deg', '0deg', '14deg'] });

  useEffect(() => {
    if (isTop) {
      Animated.spring(mountScale, { toValue: 1, useNativeDriver: false, speed: 16, bounciness: 10 }).start();
    }
  }, [card.id, isTop]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => {
        if (g.dx > SWIPE_THRESHOLD) {
          fly(1, 'like');
        } else if (g.dx < -SWIPE_THRESHOLD) {
          fly(-1, 'dislike');
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  const fly = (direction, result) => {
    Animated.timing(pan, {
      toValue: { x: direction * SCREEN_W * 1.3, y: 40 },
      duration: 220,
      useNativeDriver: false,
    }).start(() => onDecide(result));
  };

  if (!isTop) {
    return (
      <View style={[styles.card, { transform: [{ scale: 0.9 }], top: 22, opacity: 0.35, zIndex: 1 }]}>
        <CardArt card={card} />
        <CardContent card={card} />
      </View>
    );
  }

  const likeOpacity = pan.x.interpolate({ inputRange: [0, SWIPE_THRESHOLD], outputRange: [0, 1], extrapolate: 'clamp' });
  const nopeOpacity = pan.x.interpolate({ inputRange: [-SWIPE_THRESHOLD, 0], outputRange: [1, 0], extrapolate: 'clamp' });

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.card,
        styles.cardTop,
        { transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }, { scale: mountScale }], zIndex: 2, opacity: 1 },
      ]}
    >
      <Animated.View style={[styles.stamp, styles.likeStamp, { opacity: likeOpacity }]}>
        <Text style={styles.stampText}>LIKE</Text>
      </Animated.View>
      <Animated.View style={[styles.stamp, styles.nopeStamp, { opacity: nopeOpacity }]}>
        <Text style={styles.stampText}>NOPE</Text>
      </Animated.View>
      <CardArt card={card} />
      <CardContent card={card} />
    </Animated.View>
  );
}

// Reaction button with a satisfying press-in shrink + release bounce.
function ReactionButton({ emoji, style, onPress, size = 30 }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.78, useNativeDriver: false, speed: 30, bounciness: 6 }).start();
  };
  const handlePressOut = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.28, useNativeDriver: false, speed: 18, bounciness: 14 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: false, speed: 14, bounciness: 8 }),
    ]).start();
  };

  return (
    <TouchableOpacity activeOpacity={0.9} onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress} style={style}>
      <Animated.Text style={{ fontSize: size, transform: [{ scale }] }}>{emoji}</Animated.Text>
    </TouchableOpacity>
  );
}

export default function CreatorDnaScreen() {
  const router = useRouter();
  const { user, updateProfileDetails } = useAuth();

  const [topicScores, setTopicScores] = useState({});
  const [genreScores, setGenreScores] = useState({});
  const [responses, setResponses] = useState([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);

  const currentCard = CARDS[cardIndex];
  const progress = Math.min(cardIndex / TOTAL_CARDS, 1);

  const applyScore = (result) => {
    const delta = result === 'like' ? 1 : result === 'dislike' ? -0.5 : 0.2;
    setTopicScores((prev) => ({ ...prev, [currentCard.topic]: (prev[currentCard.topic] || 0) + delta }));
    setGenreScores((prev) => ({ ...prev, [currentCard.genre]: (prev[currentCard.genre] || 0) + delta }));
    setResponses((prev) => [
      ...prev,
      { cardId: currentCard.id, topic: currentCard.topic, genre: currentCard.genre, result },
    ]);
  };

  const handleDecide = (result) => {
    applyScore(result);
    const nextIndex = cardIndex + 1;
    if (nextIndex >= TOTAL_CARDS) {
      setFinished(true);
      return;
    }
    setCardIndex(nextIndex);
  };

  const topInterests = useMemo(
    () => Object.entries(topicScores).sort((a, b) => b[1] - a[1]).filter(([, v]) => v > 0).slice(0, 3).map(([k]) => k),
    [topicScores, finished]
  );
  const topGenres = useMemo(
    () => Object.entries(genreScores).sort((a, b) => b[1] - a[1]).filter(([, v]) => v > 0).slice(0, 2).map(([k]) => k),
    [genreScores, finished]
  );
  const archetype = useMemo(() => computeArchetype(genreScores), [genreScores, finished]);

  const traitBars = useMemo(() => {
    const maxScore = Math.max(1, ...Object.values(topicScores));
    return Object.entries(topicScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic, score]) => ({ topic, pct: Math.max(6, Math.round((Math.max(score, 0) / maxScore) * 100)) }));
  }, [topicScores, finished]);

  const handleContinue = async () => {
    if (saving) return;
    try {
      setSaving(true);
      const interests = topInterests.length > 0 ? topInterests : ['Lifestyle'];
      const genre = topGenres.length > 0 ? topGenres : ['Educational'];
      const updated = await updateProfileDetails({
        interests,
        genre,
        creatorDNA: { archetype, topicScores, genreScores, responses, completedAt: Date.now() },
      });
      router.replace(updated.role === 'admin' ? '/admin-dashboard' : '/dashboard/create');
    } catch (error) {
      showAlert('Could not save', error?.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    if (saving) return;
    try {
      setSaving(true);
      const updated = await updateProfileDetails({ interests: [], genre: [] });
      router.replace(updated.role === 'admin' ? '/admin-dashboard' : '/dashboard/create');
    } catch (error) {
      showAlert('Could not save', error?.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (finished) {
    const meta = ARCHETYPE_META[archetype] || ARCHETYPE_META['The Explorer'];
    return (
      <LinearGradient
        colors={['#EFEBFB', '#F4F2EC', '#FBF3EA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.resultRoot}
      >
        <SafeAreaView style={styles.resultSafe}>
          <Text style={[styles.floatDecor, styles.floatA]}>✨</Text>
          <Text style={[styles.floatDecor, styles.floatB]}>🎉</Text>
          <Text style={[styles.floatDecor, styles.floatC]}>💫</Text>
          <Text style={[styles.floatDecor, styles.floatD]}>⭐</Text>
          <View style={[styles.glowBlob, styles.glowBlobA, { backgroundColor: meta.colors[1] }]} />
          <View style={[styles.glowBlob, styles.glowBlobB, { backgroundColor: meta.colors[0] }]} />

          <View style={styles.resultPanel}>
            <View style={[styles.topAccent, { backgroundColor: meta.colors[0] }]} />

            <LinearGradient colors={meta.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroBadge}>
              <Text style={styles.heroBadgeIcon}>{meta.icon}</Text>
            </LinearGradient>

            <Text style={styles.eyebrow}>✨ CREATOR DNA</Text>
            <Text style={styles.resultHeading}>We found your content personality</Text>
            <Text style={[styles.archetype, { color: meta.colors[0] }]}>{archetype}</Text>

            <View style={styles.barList}>
              {traitBars.map(({ topic, pct }) => (
                <View key={topic} style={styles.barRow}>
                  <Text style={styles.barLabel}>{topic}</Text>
                  <View style={styles.barTrack}>
                    <LinearGradient
                      colors={meta.colors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.barFill, { width: `${pct}%` }]}
                    />
                  </View>
                  <Text style={styles.barPct}>{pct}%</Text>
                </View>
              ))}
            </View>

            <Text style={styles.resultNote}>
              This reflects your content taste, not a personality test — and it'll keep evolving
              the more you use Social Lift.
            </Text>

            <TouchableOpacity onPress={handleContinue} disabled={saving} activeOpacity={0.88}>
              <LinearGradient colors={meta.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.finishButton}>
                <Text style={styles.finishButtonText}>{saving ? 'Saving…' : '✨ See my personalized feed'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>CREATOR DNA</Text>
        <TouchableOpacity onPress={handleSkip} disabled={saving}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.heading}>Swipe to discover your content vibe</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.counter}>{cardIndex + 1} / {TOTAL_CARDS}</Text>

      <View style={styles.centerBlock}>
        <View style={styles.deckArea}>
          {CARDS.slice(cardIndex, cardIndex + 2).map((card, i) => (
            <SwipeCard key={card.id} card={card} isTop={i === 0} onDecide={handleDecide} />
          ))}
        </View>

        <View style={styles.actionRow}>
          <ReactionButton emoji="👎" size={26} style={[styles.actionBtn, styles.dislikeBtn]} onPress={() => handleDecide('dislike')} />
          <ReactionButton emoji="😐" size={22} style={[styles.actionBtn, styles.neutralBtn]} onPress={() => handleDecide('neutral')} />
          <ReactionButton emoji="❤️" size={26} style={[styles.actionBtn, styles.likeBtn]} onPress={() => handleDecide('like')} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PAGE_BG, alignItems: 'center', paddingTop: 24, paddingHorizontal: 20 },
  centerBlock: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' },
  header: { width: '100%', maxWidth: 460, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { color: PURPLE, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  skipText: { fontSize: 12.5, color: GRAY_TEXT, textDecorationLine: 'underline' },
  heading: { fontFamily: 'serif', fontSize: 22, fontWeight: '700', color: DARK_TEXT, marginTop: 10, marginBottom: 16, textAlign: 'center' },
  progressTrack: { width: '100%', maxWidth: 460, height: 4, backgroundColor: BORDER, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: PURPLE },
  counter: { fontSize: 11, color: GRAY_TEXT, marginTop: 6, marginBottom: 18, fontWeight: '600' },

  deckArea: { width: '100%', maxWidth: 460, height: 580, alignItems: 'center', justifyContent: 'center' },
  card: {
    position: 'absolute',
    width: '100%',
    maxWidth: 460,
    height: 580,
    borderRadius: 30,
    backgroundColor: PANEL_BG,
    overflow: 'hidden',
    boxShadow: '0px 24px 48px rgba(0,0,0,0.2)',
  },
  cardTop: {
    opacity: 1,
    boxShadow: '0px 28px 56px rgba(0,0,0,0.28)',
  },
  artPanel: {
    height: '58%',
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#EEE',
  },
  artImage: { width: '100%', height: '100%' },
  artFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '45%' },
  iconBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 6px 14px rgba(0,0,0,0.22)',
  },
  iconBadgeText: { fontSize: 26 },
  cardInner: { flex: 1, padding: 22, justifyContent: 'flex-start' },
  cardHeadline: { fontSize: 21, fontWeight: '800', color: DARK_TEXT, marginBottom: 8, lineHeight: 26 },
  cardBody: { fontSize: 13.5, color: '#3A3A3A', marginBottom: 16, lineHeight: 19 },
  cardTagRow: { flexDirection: 'row', gap: 8, marginTop: 'auto' },
  cardTag: { backgroundColor: '#F0EEE7', borderWidth: 1, borderColor: BORDER, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  cardTagText: { fontSize: 11, fontWeight: '700', color: DARK_TEXT },

  stamp: { position: 'absolute', top: 24, borderWidth: 3, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, zIndex: 10 },
  likeStamp: { left: 20, borderColor: GREEN, transform: [{ rotate: '-18deg' }] },
  nopeStamp: { right: 20, borderColor: RED, transform: [{ rotate: '18deg' }] },
  stampText: { fontWeight: '900', fontSize: 22, color: DARK_TEXT },

  actionRow: { flexDirection: 'row', gap: 24, marginTop: 22, marginBottom: 16, alignItems: 'center' },
  actionBtn: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    boxShadow: '0px 8px 16px rgba(0,0,0,0.12)',
  },
  dislikeBtn: { borderWidth: 2, borderColor: RED },
  neutralBtn: { borderWidth: 2, borderColor: BORDER, width: 50, height: 50, borderRadius: 25 },
  likeBtn: { borderWidth: 2, borderColor: GREEN },

  resultRoot: { flex: 1 },
  resultSafe: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 32 },

  floatDecor: { position: 'absolute', fontSize: 34, opacity: 0.55 },
  floatA: { top: '10%', left: '12%' },
  floatB: { top: '16%', right: '10%', fontSize: 40 },
  floatC: { bottom: '14%', left: '9%', fontSize: 30 },
  floatD: { bottom: '10%', right: '13%', fontSize: 26 },

  glowBlob: { position: 'absolute', borderRadius: 999, opacity: 0.28 },
  glowBlobA: { width: 420, height: 420, top: -140, left: -160 },
  glowBlobB: { width: 380, height: 380, bottom: -160, right: -140 },

  resultPanel: {
    width: '100%',
    maxWidth: 620,
    backgroundColor: PANEL_BG,
    borderRadius: 28,
    padding: 44,
    alignItems: 'center',
    overflow: 'hidden',
    boxShadow: '0px 30px 70px rgba(76,60,150,0.22)',
  },
  topAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 8, backgroundColor: PURPLE },
  heroBadge: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    marginTop: 6,
    boxShadow: '0px 12px 26px rgba(108,92,231,0.35)',
  },
  heroBadgeIcon: { fontSize: 46 },
  resultHeading: { fontFamily: 'serif', fontSize: 24, fontWeight: '700', color: DARK_TEXT, marginTop: 6, textAlign: 'center' },
  archetype: { fontSize: 36, fontWeight: '900', marginTop: 8, marginBottom: 30 },
  barList: { width: '100%', maxWidth: 420, marginBottom: 22 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  barLabel: { width: 84, fontSize: 13, fontWeight: '700', color: DARK_TEXT },
  barTrack: { flex: 1, height: 12, backgroundColor: BORDER, borderRadius: 6, marginHorizontal: 12, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 6 },
  barPct: { width: 40, fontSize: 12.5, color: GRAY_TEXT, textAlign: 'right', fontWeight: '600' },
  resultNote: { fontSize: 12.5, color: GRAY_TEXT, textAlign: 'center', marginBottom: 26, lineHeight: 18, maxWidth: 420 },
  finishButton: { width: 340, maxWidth: '100%', borderRadius: 12, paddingVertical: 17, alignItems: 'center', boxShadow: '0px 12px 26px rgba(108,92,231,0.35)' },
  finishButtonText: { color: '#fff', fontWeight: '800', fontSize: 15.5, letterSpacing: 0.3 },
});
