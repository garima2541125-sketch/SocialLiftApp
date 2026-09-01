import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DashboardShell from './DashboardShell';

const PURPLE = '#6C5CE7';
const ORANGE = '#F35D42';
const RED = '#C1443A';
const DARK_TEXT = '#1A1A1A';
const GRAY_TEXT = '#6B6B6B';
const BORDER = '#E7E3D9';
const PANEL_BG = '#FBFAF6';
const TRACK_BG = '#F0EEE7';
const ACCENT_TINT = '#EFECFD';

const TIMEFRAMES = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
];

const PLATFORMS = [
  { key: 'all', label: 'All platforms' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'linkedin', label: 'LinkedIn' },
];

const STATS_BY_TIMEFRAME = {
  day: {
    label: 'Today',
    stats: [
      { label: 'Total reach', value: '6.4K', change: '+8.1% vs yesterday', trend: [3, 5, 4, 6, 7, 6, 8] },
      { label: 'Engagement rate', value: '7.2%', change: '+0.4pt vs yesterday', trend: [4, 5, 5, 6, 6, 7, 7] },
      { label: 'Posts published', value: '2', change: '+1 vs yesterday', trend: [0, 1, 0, 1, 1, 2, 2] },
      { label: 'Follower growth', value: '+34', change: '+2.1% vs yesterday', trend: [2, 3, 3, 4, 4, 5, 6] },
    ],
    bars: [4, 6, 5, 8, 7, 9, 6, 8, 10, 7, 9, 11, 8, 10],
  },
  week: {
    label: 'This week',
    stats: [
      { label: 'Total reach', value: '42.8K', change: '+10.6% vs last week', trend: [20, 25, 24, 30, 32, 35, 40] },
      { label: 'Engagement rate', value: '6.9%', change: '+0.8pt vs last week', trend: [15, 18, 17, 22, 24, 26, 28] },
      { label: 'Posts published', value: '8', change: '+2 vs last week', trend: [3, 4, 4, 5, 6, 7, 8] },
      { label: 'Follower growth', value: '+228', change: '-1.4% vs last week', trend: [30, 28, 27, 25, 24, 22, 20], negative: true },
    ],
    bars: [18, 24, 20, 28, 32, 30, 36, 26, 22, 38, 40, 34, 24, 36],
  },
  month: {
    label: 'Last 30 days',
    stats: [
      { label: 'Total reach', value: '184.2K', change: '+12.4% vs last period', trend: [40, 55, 48, 62, 70, 65, 80] },
      { label: 'Engagement rate', value: '6.8%', change: '+1.1pt vs last period', trend: [20, 25, 22, 30, 28, 35, 38] },
      { label: 'Posts published', value: '24', change: '+4 vs last period', trend: [10, 12, 14, 13, 16, 18, 20] },
      { label: 'Follower growth', value: '+912', change: '-3.2% vs last period', trend: [60, 58, 55, 50, 48, 45, 42], negative: true },
    ],
    bars: [30, 38, 34, 46, 52, 48, 58, 44, 40, 62, 68, 55, 41, 60],
  },
};

const FUNNEL_BY_TIMEFRAME = {
  day: [
    { label: 'Impressions', value: 9200 },
    { label: 'Reach', value: 6400 },
    { label: 'Engagement', value: 1180 },
    { label: 'Clicks', value: 410 },
    { label: 'Conversions', value: 62 },
  ],
  week: [
    { label: 'Impressions', value: 61000 },
    { label: 'Reach', value: 42800 },
    { label: 'Engagement', value: 7900 },
    { label: 'Clicks', value: 2600 },
    { label: 'Conversions', value: 340 },
  ],
  month: [
    { label: 'Impressions', value: 265000 },
    { label: 'Reach', value: 184200 },
    { label: 'Engagement', value: 34500 },
    { label: 'Clicks', value: 11200 },
    { label: 'Conversions', value: 1480 },
  ],
};

const HEATMAP_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HEATMAP_SLOTS = ['6am', '12pm', '6pm', '10pm'];
const HEATMAP_DATA = [
  [1, 2, 3, 1],
  [2, 3, 4, 2],
  [1, 2, 3, 2],
  [2, 4, 4, 3],
  [3, 4, 4, 4],
  [4, 3, 2, 2],
  [2, 2, 3, 3],
];
const HEATMAP_TINTS = ['#E4E0F8', '#C6BDF1', '#9B8CE6', '#6C5CE7'];

const RECOMMENDATIONS = [
  { tag: 'Reel', title: 'Glaze-mixing behind-the-scenes', note: 'Reels are outperforming static posts 3.2x this month' },
  { tag: 'Carousel', title: 'Customer kitchen features', note: 'Carousels have the highest save rate on Instagram' },
  { tag: 'Post', title: 'Weekend workshop signup reminder', note: 'Fridays at 9:30am get your highest CTR' },
];

const formatNumber = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// A sparkline drawn as a strip of thin bars — react-native-svg is not a
// dependency of this project, and bars read just as well at this size.
function Sparkline({ data, negative }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;

  return (
    <View style={styles.sparkRow}>
      {data.map((value, i) => (
        <View
          key={i}
          style={[
            styles.sparkBar,
            {
              height: 4 + ((value - min) / span) * 18,
              backgroundColor: negative ? RED : PURPLE,
            },
          ]}
        />
      ))}
    </View>
  );
}

function SegmentedControl({ options, value, onChange }) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const isActive = option.key === value;
        return (
          <TouchableOpacity
            key={option.key}
            style={[styles.segment, isActive && styles.segmentActive]}
            onPress={() => onChange(option.key)}
            activeOpacity={0.85}
          >
            <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>{option.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function FunnelChart({ stages }) {
  const max = stages[0].value;

  return (
    <View style={styles.funnel}>
      {stages.map((stage, i) => (
        <View
          key={stage.label}
          style={[
            styles.funnelStage,
            {
              width: `${Math.max((stage.value / max) * 100, 32)}%`,
              backgroundColor: PURPLE,
              opacity: 1 - i * 0.14,
            },
          ]}
        >
          <Text style={styles.funnelLabel}>{stage.label}</Text>
          <Text style={styles.funnelValue}>{formatNumber(stage.value)}</Text>
        </View>
      ))}
    </View>
  );
}

export default function AnalyticsScreen() {
  const [timeframe, setTimeframe] = useState('month');
  const [platform, setPlatform] = useState('all');

  const current = STATS_BY_TIMEFRAME[timeframe];
  const maxBar = Math.max(...current.bars);
  const platformLabel =
    platform === 'all' ? 'Instagram & LinkedIn' : platform === 'instagram' ? 'Instagram' : 'LinkedIn';

  return (
    <DashboardShell
      active="analytics"
      title="Analytics"
      headerRight={<SegmentedControl options={TIMEFRAMES} value={timeframe} onChange={setTimeframe} />}
    >
      <Text style={styles.heading}>Analytics</Text>
      <Text style={styles.subheading}>
        Performance across {platformLabel} — {current.label.toLowerCase()}.
      </Text>

      <View style={styles.platformWrap}>
        <SegmentedControl options={PLATFORMS} value={platform} onChange={setPlatform} />
      </View>

      <View style={styles.card}>
        <View style={styles.goalRow}>
          <Text style={styles.cardTitle}>Monthly reach goal</Text>
          <Text style={styles.goalValue}>184.2K / 220K</Text>
        </View>
        <View style={styles.goalTrack}>
          <View style={styles.goalFill} />
        </View>
        <Text style={styles.mutedNote}>84% of the way there — 5 days left this cycle.</Text>
      </View>

      <View style={styles.statGrid}>
        {current.stats.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={[styles.statChange, stat.negative && styles.statChangeNegative]}>{stat.change}</Text>
            <Sparkline data={stat.trend} negative={stat.negative} />
          </View>
        ))}
      </View>

      <View style={styles.twoCol}>
        <View style={[styles.card, styles.funnelCard]}>
          <Text style={styles.cardTitle}>Reach to conversion funnel</Text>
          <FunnelChart stages={FUNNEL_BY_TIMEFRAME[timeframe]} />
        </View>

        <View style={[styles.card, styles.recCard]}>
          <Text style={styles.cardTitle}>Recommended next</Text>
          <Text style={styles.mutedNote}>Based on your preferences + performance history.</Text>
          <View style={styles.recList}>
            {RECOMMENDATIONS.map((rec) => (
              <View key={rec.title} style={styles.recItem}>
                <View style={styles.recTag}>
                  <Text style={styles.recTagText}>{rec.tag}</Text>
                </View>
                <Text style={styles.recTitle}>{rec.title}</Text>
                <Text style={styles.recNote}>{rec.note}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Engagement over time</Text>
        <View style={styles.barChart}>
          {current.bars.map((value, i) => (
            <View key={i} style={styles.barSlot}>
              <View
                style={[
                  styles.bar,
                  {
                    height: `${(value / maxBar) * 100}%`,
                    backgroundColor: i === current.bars.length - 4 ? ORANGE : PURPLE,
                  },
                ]}
              />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Best time to post</Text>
        <View style={styles.heatRow}>
          <View style={styles.heatSlotCol}>
            <View style={styles.heatDaySpacer} />
            {HEATMAP_SLOTS.map((slot) => (
              <View key={slot} style={styles.heatSlotLabelWrap}>
                <Text style={styles.heatAxisText}>{slot}</Text>
              </View>
            ))}
          </View>

          {HEATMAP_DAYS.map((day, dayIndex) => (
            <View key={day} style={styles.heatDayCol}>
              <Text style={styles.heatAxisText}>{day}</Text>
              {HEATMAP_SLOTS.map((slot, slotIndex) => (
                <View
                  key={slot}
                  style={[
                    styles.heatCell,
                    { backgroundColor: HEATMAP_TINTS[HEATMAP_DATA[dayIndex][slotIndex] - 1] },
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
      </View>
    </DashboardShell>
  );
}

const styles = StyleSheet.create({
  heading: { fontFamily: 'serif', fontSize: 22, fontWeight: '700', color: DARK_TEXT, marginBottom: 4 },
  subheading: { fontSize: 13, color: GRAY_TEXT, marginBottom: 20 },
  platformWrap: { flexDirection: 'row', marginBottom: 20 },

  segmented: { flexDirection: 'row', backgroundColor: TRACK_BG, borderRadius: 9, padding: 3, gap: 3 },
  segment: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 7 },
  segmentActive: { backgroundColor: '#fff' },
  segmentText: { fontSize: 12, fontWeight: '600', color: GRAY_TEXT },
  segmentTextActive: { color: DARK_TEXT, fontWeight: '700' },

  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 13, fontWeight: '700', color: DARK_TEXT, marginBottom: 6 },
  mutedNote: { fontSize: 11.5, color: GRAY_TEXT, marginTop: 8 },

  goalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  goalValue: { fontSize: 12.5, color: GRAY_TEXT },
  goalTrack: { height: 8, borderRadius: 4, backgroundColor: TRACK_BG, overflow: 'hidden' },
  goalFill: { height: 8, width: '84%', borderRadius: 4, backgroundColor: PURPLE },

  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 16 },
  statCard: {
    flexGrow: 1,
    flexBasis: 180,
    minWidth: 160,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 16,
  },
  statLabel: { fontSize: 11.5, color: GRAY_TEXT },
  statValue: { fontFamily: 'serif', fontSize: 20, fontWeight: '700', color: DARK_TEXT, marginTop: 4 },
  statChange: { fontSize: 11.5, color: PURPLE, marginTop: 2 },
  statChangeNegative: { color: RED },

  sparkRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 24, marginTop: 10 },
  sparkBar: { flex: 1, borderRadius: 2, opacity: 0.85 },

  twoCol: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  funnelCard: { flexGrow: 2, flexBasis: 380, minWidth: 300 },
  recCard: { flexGrow: 1, flexBasis: 260, minWidth: 240, backgroundColor: ACCENT_TINT, borderColor: ACCENT_TINT },

  funnel: { alignItems: 'center', marginTop: 14, gap: 4 },
  funnelStage: { alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8 },
  funnelLabel: { color: '#fff', fontSize: 12, fontWeight: '700' },
  funnelValue: { color: '#fff', fontSize: 11, marginTop: 2 },

  recList: { marginTop: 12, gap: 10 },
  recItem: { backgroundColor: '#fff', borderRadius: 10, padding: 12 },
  recTag: { alignSelf: 'flex-start', backgroundColor: '#FDE8E3', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 6 },
  recTagText: { fontSize: 10, fontWeight: '700', color: ORANGE },
  recTitle: { fontSize: 12, fontWeight: '700', color: DARK_TEXT },
  recNote: { fontSize: 11, color: GRAY_TEXT, marginTop: 2, lineHeight: 15 },

  barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 150, gap: 6, marginTop: 14 },
  barSlot: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderTopLeftRadius: 3, borderTopRightRadius: 3, opacity: 0.85 },

  heatRow: { flexDirection: 'row', gap: 6, marginTop: 14 },
  heatSlotCol: { width: 40 },
  heatDaySpacer: { height: 18 },
  heatSlotLabelWrap: { height: 30, justifyContent: 'center', marginBottom: 5 },
  heatDayCol: { flex: 1 },
  heatAxisText: { fontSize: 10, color: GRAY_TEXT, textAlign: 'center', height: 18 },
  heatCell: { height: 30, borderRadius: 5, marginBottom: 5 },
});
