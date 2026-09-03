import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
} from "react-native";
import DashboardShell from "./DashboardShell";

const DARK_TEXT = "#1A1A1A";
const GRAY_TEXT = "#6B6B6B";
const LIGHT_GRAY = "#9A9A9A";
const BORDER = "#E7E3D9";
const PURPLE = "#24242d";
const PURPLE_LIGHT = "#e8e8e8";
const ORANGE = "#F4664A";
const GREEN = "#1DB954";
const RED = "#E1544C";
const BG = "#ebeaf3";
const RANGE_OPTIONS = [
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "year", label: "Year" },
];

const RANGE_DATA = {
  day: {
    rangeLabel: "today",
    stats: {
      reach: {
        value: "9.8K",
        delta: "+3.1%",
        deltaUp: true,
        breakdown: [
          { label: "Instagram", value: "6.4K" },
          { label: "LinkedIn", value: "3.4K" },
        ],
        detail:
          "Reach today is tracking slightly ahead of your hourly average, with most activity happening during your morning post window.",
      },
      engagement: {
        value: "5.9%",
        delta: "+0.4pt",
        deltaUp: true,
        breakdown: [
          { label: "Likes", value: "412" },
          { label: "Comments", value: "58" },
          { label: "Shares", value: "21" },
        ],
        detail:
          "Engagement rate is calculated from interactions divided by reach for posts published today.",
      },
      posts: {
        value: "2",
        delta: "+1 vs yesterday",
        deltaUp: true,
        breakdown: [
          { label: "Reels", value: "1" },
          { label: "Carousel", value: "1" },
        ],
        detail: "You've published 2 posts today across Instagram and LinkedIn.",
      },
      followers: {
        value: "+34",
        delta: "+0.5% vs yesterday",
        deltaUp: true,
        breakdown: [
          { label: "Instagram", value: "+26" },
          { label: "LinkedIn", value: "+8" },
        ],
        detail: "Follower growth today is modest but positive across both platforms.",
      },
    },
    chart: {
      labels: ["9a", "10a", "11a", "12p", "1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p"],
      values: [12, 18, 15, 22, 28, 24, 31, 42, 38, 55, 30, 20],
      highlightIndex: 9,
      unit: "engagements",
    },
  },
  week: {
    rangeLabel: "last 7 days",
    stats: {
      reach: {
        value: "48.6K",
        delta: "+6.7%",
        deltaUp: true,
        breakdown: [
          { label: "Instagram", value: "31.2K" },
          { label: "LinkedIn", value: "17.4K" },
        ],
        detail:
          "Weekly reach grew steadily, with a mid-week peak driven by a well-performing carousel post.",
      },
      engagement: {
        value: "6.2%",
        delta: "+0.6pt",
        deltaUp: true,
        breakdown: [
          { label: "Likes", value: "2.1K" },
          { label: "Comments", value: "340" },
          { label: "Shares", value: "128" },
        ],
        detail: "Engagement rate this week is above your 30-day average.",
      },
      posts: {
        value: "8",
        delta: "+2 vs last week",
        deltaUp: true,
        breakdown: [
          { label: "Reels", value: "3" },
          { label: "Carousel", value: "3" },
          { label: "Static", value: "2" },
        ],
        detail: "8 posts went out this week, more than the previous week.",
      },
      followers: {
        value: "+201",
        delta: "+1.1% vs last week",
        deltaUp: true,
        breakdown: [
          { label: "Instagram", value: "+164" },
          { label: "LinkedIn", value: "+37" },
        ],
        detail: "Follower growth accelerated this week compared to last.",
      },
    },
    chart: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      values: [38, 45, 62, 58, 71, 49, 33],
      highlightIndex: 4,
      unit: "engagements",
    },
  },
  month: {
    rangeLabel: "last 30 days",
    stats: {
      reach: {
        value: "184.2K",
        delta: "+12.4%",
        deltaUp: true,
        breakdown: [
          { label: "Instagram", value: "121.6K" },
          { label: "LinkedIn", value: "62.6K" },
        ],
        detail:
          "Total reach is up sharply this month, largely driven by two viral Reels mid-month.",
      },
      engagement: {
        value: "6.8%",
        delta: "+1.1pt",
        deltaUp: true,
        breakdown: [
          { label: "Likes", value: "8.9K" },
          { label: "Comments", value: "1.2K" },
          { label: "Shares", value: "540" },
        ],
        detail: "Engagement rate is the highest it's been in the last 3 months.",
      },
      posts: {
        value: "24",
        delta: "+4 vs last period",
        deltaUp: true,
        breakdown: [
          { label: "Reels", value: "9" },
          { label: "Carousel", value: "8" },
          { label: "Static", value: "7" },
        ],
        detail: "24 posts were published across both platforms this month.",
      },
      followers: {
        value: "+912",
        delta: "-3.2% vs last period",
        deltaUp: false,
        breakdown: [
          { label: "Instagram", value: "+743" },
          { label: "LinkedIn", value: "+169" },
        ],
        detail:
          "Follower growth slowed slightly compared to last month, mostly on LinkedIn.",
      },
    },
    chart: {
      labels: Array.from({ length: 14 }, (_, i) => String(i + 1)),
      values: [22, 26, 24, 21, 30, 27, 34, 42, 32, 48, 40, 60, 44, 36],
      highlightIndex: 11,
      unit: "engagements",
    },
  },
  year: {
    rangeLabel: "last 12 months",
    stats: {
      reach: {
        value: "1.9M",
        delta: "+34.8%",
        deltaUp: true,
        breakdown: [
          { label: "Instagram", value: "1.2M" },
          { label: "LinkedIn", value: "700K" },
        ],
        detail: "Yearly reach nearly doubled compared to the previous 12 months.",
      },
      engagement: {
        value: "5.4%",
        delta: "+0.3pt",
        deltaUp: true,
        breakdown: [
          { label: "Likes", value: "94K" },
          { label: "Comments", value: "12K" },
          { label: "Shares", value: "5.1K" },
        ],
        detail: "Average engagement rate across the year, smoothed across seasonal dips.",
      },
      posts: {
        value: "268",
        delta: "+41 vs last year",
        deltaUp: true,
        breakdown: [
          { label: "Reels", value: "104" },
          { label: "Carousel", value: "92" },
          { label: "Static", value: "72" },
        ],
        detail: "268 posts published this year, up from last year's total.",
      },
      followers: {
        value: "+8.4K",
        delta: "+18.9% vs last year",
        deltaUp: true,
        breakdown: [
          { label: "Instagram", value: "+6.7K" },
          { label: "LinkedIn", value: "+1.7K" },
        ],
        detail: "Strong, consistent follower growth throughout the year.",
      },
    },
    chart: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      values: [30, 34, 40, 38, 45, 52, 48, 61, 58, 70, 64, 50],
      highlightIndex: 9,
      unit: "engagements",
    },
  },
};

const STAT_META = [
  { key: "reach", label: "Total reach" },
  { key: "engagement", label: "Engagement rate" },
  { key: "posts", label: "Posts published" },
  { key: "followers", label: "Follower growth" },
];

const RECOMMENDATIONS = [
  {
    tag: "Reel",
    title: "Glaze-mixing behind-the-scenes",
    summary: "Reels are outperforming static posts 3.2x this month",
    detail:
      "Behind-the-scenes process content consistently drives higher watch-through than finished-product shots. Consider filming the glaze-mixing step in short, close-up clips with on-screen captions, posted between 5–7pm when your audience is most active.",
    suggestedTime: "Today, 6:00 PM",
    expectedLift: "+18% engagement vs your Reel average",
  },
  {
    tag: "Carousel",
    title: "Customer kitchen features",
    summary: "Carousels have the highest save rate on Instagram",
    detail:
      "Posts featuring real customers using your product in their kitchens are saved 2.1x more than product-only shots. A 5–7 slide carousel mixing customer photos with a short quote performs best.",
    suggestedTime: "Tomorrow, 11:00 AM",
    expectedLift: "+2.1x save rate vs average carousel",
  },
  {
    tag: "Post",
    title: "Weekend workshop signup reminder",
    summary: "Fridays at 9:30am get your highest CTR",
    detail:
      "Reminder posts sent Friday mornings see the strongest click-through to your signup page, likely because your audience is planning their weekend. A single clear CTA image outperforms multi-slide reminders.",
    suggestedTime: "Friday, 9:30 AM",
    expectedLift: "+27% CTR vs other weekdays",
  },
];

/* ------------------------------------------------------------------ */

export default function AnalyticsScreen() {
  const [range, setRange] = useState("month");
  const [selectedStatKey, setSelectedStatKey] = useState(null);
  const [selectedBarIndex, setSelectedBarIndex] = useState(null);
  const [selectedRec, setSelectedRec] = useState(null);

  const data = RANGE_DATA[range];
  const maxValue = useMemo(
    () => Math.max(...data.chart.values),
    [data]
  );

  const selectedStat = selectedStatKey ? data.stats[selectedStatKey] : null;
  const selectedStatLabel = selectedStatKey
    ? STAT_META.find((s) => s.key === selectedStatKey).label
    : "";

  return (
    <DashboardShell active="analytics" title="Analytics">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header row: subtitle + range selector */}
        <View style={styles.headerRow}>
          <Text style={styles.subtitle}>
            Performance across Instagram &amp; LinkedIn, {data.rangeLabel}.
          </Text>
          <View style={styles.rangeSelector}>
            {RANGE_OPTIONS.map((opt) => {
              const isActive = opt.key === range;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => {
                    setRange(opt.key);
                    setSelectedBarIndex(null);
                  }}
                  style={[styles.rangePill, isActive && styles.rangePillActive]}
                >
                  <Text
                    style={[
                      styles.rangePillText,
                      isActive && styles.rangePillTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Stat cards */}
        <View style={styles.statsRow}>
          {STAT_META.map((meta) => {
            const stat = data.stats[meta.key];
            return (
              <TouchableOpacity
                key={meta.key}
                style={styles.statCard}
                activeOpacity={0.7}
                onPress={() => setSelectedStatKey(meta.key)}
              >
                <Text style={styles.statLabel}>{meta.label}</Text>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text
                  style={[
                    styles.statDelta,
                    { color: stat.deltaUp ? GREEN : RED },
                  ]}
                >
                  {stat.delta} vs last period
                </Text>
                <Text style={styles.tapHint}>Tap for details ›</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Chart + Recommendations */}
        <View style={styles.mainRow}>
          <View style={styles.chartCard}>
            <View style={styles.chartHeaderRow}>
              <Text style={styles.chartTitle}>Engagement over time</Text>
              {selectedBarIndex !== null && (
                <View style={styles.tooltip}>
                  <Text style={styles.tooltipLabel}>
                    {data.chart.labels[selectedBarIndex]}
                  </Text>
                  <Text style={styles.tooltipValue}>
                    {data.chart.values[selectedBarIndex]} {data.chart.unit}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.chartArea}>
              {data.chart.values.map((v, i) => {
                const heightPct = Math.max((v / maxValue) * 100, 4);
                const isHighlighted =
                  i === data.chart.highlightIndex || i === selectedBarIndex;
                return (
                  <TouchableOpacity
                    key={i}
                    style={styles.barColumn}
                    activeOpacity={0.75}
                    onPress={() =>
                      setSelectedBarIndex(selectedBarIndex === i ? null : i)
                    }
                  >
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: `${heightPct}%`,
                            backgroundColor: isHighlighted ? ORANGE : PURPLE,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.barLabel}>{data.chart.labels[i]}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.recPanel}>
            <Text style={styles.recTitle}>Recommended next</Text>
            <Text style={styles.recSubtitle}>
              Based on your preferences + performance history.
            </Text>

            {RECOMMENDATIONS.map((rec, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.recCard}
                activeOpacity={0.75}
                onPress={() => setSelectedRec(rec)}
              >
                <Text style={styles.recTag}>{rec.tag}</Text>
                <Text style={styles.recCardTitle}>{rec.title}</Text>
                <Text style={styles.recCardBody}>{rec.summary}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Stat detail modal */}
      <Modal
        visible={!!selectedStat}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedStatKey(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedStatKey(null)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            {selectedStat && (
              <>
                <Text style={styles.modalEyebrow}>{selectedStatLabel}</Text>
                <Text style={styles.modalBigValue}>{selectedStat.value}</Text>
                <Text
                  style={[
                    styles.statDelta,
                    { color: selectedStat.deltaUp ? GREEN : RED, marginBottom: 14 },
                  ]}
                >
                  {selectedStat.delta} vs last period
                </Text>
                <Text style={styles.modalDetailText}>{selectedStat.detail}</Text>

                <Text style={styles.modalSectionLabel}>Breakdown</Text>
                {selectedStat.breakdown.map((b, i) => (
                  <View key={i} style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>{b.label}</Text>
                    <Text style={styles.breakdownValue}>{b.value}</Text>
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setSelectedStatKey(null)}
                >
                  <Text style={styles.modalCloseBtnText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Recommendation detail modal */}
      <Modal
        visible={!!selectedRec}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedRec(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedRec(null)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            {selectedRec && (
              <>
                <Text style={styles.recTag}>{selectedRec.tag}</Text>
                <Text style={styles.modalTitle}>{selectedRec.title}</Text>
                <Text style={styles.modalDetailText}>{selectedRec.detail}</Text>

                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Suggested time</Text>
                  <Text style={styles.breakdownValue}>
                    {selectedRec.suggestedTime}
                  </Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Expected lift</Text>
                  <Text style={styles.breakdownValue}>
                    {selectedRec.expectedLift}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setSelectedRec(null)}
                >
                  <Text style={styles.modalCloseBtnText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </DashboardShell>
  );
}

/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    flexWrap: "wrap",
    rowGap: 12,
  },
  subtitle: { fontSize: 13, color: GRAY_TEXT, maxWidth: 320 },

  rangeSelector: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    padding: 3,
  },
  rangePill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  rangePillActive: { backgroundColor: PURPLE },
  rangePillText: { fontSize: 12, fontWeight: "600", color: GRAY_TEXT },
  rangePillTextActive: { color: "#fff" },

  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 20,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: 200,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 18,
  },
  statLabel: { fontSize: 12, color: GRAY_TEXT, marginBottom: 8 },
  statValue: { fontSize: 26, fontWeight: "700", color: DARK_TEXT, marginBottom: 8 },
  statDelta: { fontSize: 12, fontWeight: "600" },
  tapHint: { fontSize: 11, color: LIGHT_GRAY, marginTop: 10 },

  mainRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  chartCard: {
    flexGrow: 3,
    flexBasis: 420,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 20,
    minHeight: 360,
  },
  chartHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  chartTitle: { fontSize: 14, fontWeight: "700", color: DARK_TEXT },
  tooltip: {
    backgroundColor: DARK_TEXT,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  tooltipLabel: { color: "#fff", fontSize: 10, opacity: 0.7 },
  tooltipValue: { color: "#fff", fontSize: 12, fontWeight: "700" },

  chartArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 260,
  },
  barColumn: { flex: 1, alignItems: "center", height: "100%" },
  barTrack: {
    flex: 1,
    width: "60%",
    justifyContent: "flex-end",
  },
  bar: { width: "100%", borderRadius: 6, minHeight: 6 },
  barLabel: { fontSize: 10, color: LIGHT_GRAY, marginTop: 8 },

  recPanel: {
    flexGrow: 2,
    flexBasis: 260,
    backgroundColor: PURPLE_LIGHT,
    borderRadius: 14,
    padding: 18,
  },
  recTitle: { fontSize: 14, fontWeight: "700", color: DARK_TEXT, marginBottom: 4 },
  recSubtitle: { fontSize: 11, color: GRAY_TEXT, marginBottom: 14 },
  recCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  recTag: {
    fontSize: 10,
    fontWeight: "700",
    color: ORANGE,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  recCardTitle: { fontSize: 13, fontWeight: "700", color: DARK_TEXT, marginBottom: 4 },
  recCardBody: { fontSize: 11, color: GRAY_TEXT, lineHeight: 16 },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyIcon: { fontSize: 40, marginBottom: 14 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: DARK_TEXT, marginBottom: 8 },
  emptyBody: { fontSize: 13, color: GRAY_TEXT, textAlign: "center", maxWidth: 340, lineHeight: 19 },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(26,26,26,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: BG,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 420,
  },
  modalEyebrow: { fontSize: 12, color: GRAY_TEXT, marginBottom: 4 },
  modalBigValue: { fontSize: 30, fontWeight: "700", color: DARK_TEXT },
  modalTitle: { fontSize: 18, fontWeight: "700", color: DARK_TEXT, marginBottom: 10 },
  modalDetailText: {
    fontSize: 13,
    color: GRAY_TEXT,
    lineHeight: 19,
    marginBottom: 16,
  },
  modalSectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: LIGHT_GRAY,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  breakdownLabel: { fontSize: 13, color: GRAY_TEXT },
  breakdownValue: { fontSize: 13, fontWeight: "700", color: DARK_TEXT },
  modalCloseBtn: {
    marginTop: 20,
    backgroundColor: PURPLE,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalCloseBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});