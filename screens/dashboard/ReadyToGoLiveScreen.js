import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import DashboardShell from "./DashboardShell";
import { useAuth } from "../../src/context/AuthContext";
import { getPostById } from "./reviewQueueData";

const DARK_TEXT = "#1A1A1A";
const GRAY_TEXT = "#6B6B6B";
const BORDER = "#E7E3D9";
const PURPLE = "#5B4FE0";

// Next Friday, e.g. "Fri, Nov 27 2026", as the default schedule date.
function nextFriday() {
  const d = new Date();
  d.setDate(d.getDate() + ((12 - d.getDay()) % 7 || 7));
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' ' + d.getFullYear();
}

export default function ReadyToGoLiveScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const post = getPostById(id);

  const [mode, setMode] = useState("schedule"); // "now" | "schedule"
  const [date, setDate] = useState(nextFriday);
  const [time, setTime] = useState("9:30 AM");

  const handleSchedulePost = () => {
    // Hook up your real publish/schedule API call here.
    router.push("/dashboard/review-queue");
  };

  return (
    <DashboardShell active="review-queue" title="Review Queue">
      <View style={styles.card}>
        <Text style={styles.title}>Ready to go live</Text>
        <Text style={styles.subtitle}>
          Approved by {user?.name || 'the page owner'} · {post?.platform ?? "Instagram"}
        </Text>

        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleButton, mode === "now" && styles.toggleButtonActive]}
            onPress={() => setMode("now")}
          >
            <Text style={[styles.toggleText, mode === "now" && styles.toggleTextActive]}>
              Publish now
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, mode === "schedule" && styles.toggleButtonActive]}
            onPress={() => setMode("schedule")}
          >
            <Text style={[styles.toggleText, mode === "schedule" && styles.toggleTextActive]}>
              Schedule
            </Text>
          </TouchableOpacity>
        </View>

        {mode === "schedule" && (
          <View style={styles.fieldRow}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Date</Text>
              <TextInput style={styles.fieldInput} value={date} onChangeText={setDate} />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Time</Text>
              <TextInput style={styles.fieldInput} value={time} onChangeText={setTime} />
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.submitButton} activeOpacity={0.85} onPress={handleSchedulePost}>
          <Text style={styles.submitButtonText}>
            {mode === "now" ? "Publish now" : "Schedule post"}
          </Text>
        </TouchableOpacity>

        <View style={styles.statusLegend}>
          <View style={[styles.statusChip, { backgroundColor: "#DFF3E3" }]}>
            <View style={[styles.dot, { backgroundColor: "#2F9E44" }]} />
            <Text style={[styles.statusChipText, { color: "#2F9E44" }]}>Published successfully</Text>
          </View>
          <View style={[styles.statusChip, { backgroundColor: "#FCEAC5" }]}>
            <View style={[styles.dot, { backgroundColor: "#9A6B00" }]} />
            <Text style={[styles.statusChipText, { color: "#9A6B00" }]}>Retrying with backoff (2/3)</Text>
          </View>
          <View style={[styles.statusChip, { backgroundColor: "#FBE0E0" }]}>
            <View style={[styles.dot, { backgroundColor: "#C23B3B" }]} />
            <Text style={[styles.statusChipText, { color: "#C23B3B" }]}>Failed — needs attention</Text>
          </View>
        </View>
      </View>
    </DashboardShell>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 24,
    maxWidth: 340,
  },
  title: { fontSize: 16, fontWeight: "700", color: DARK_TEXT, marginBottom: 4 },
  subtitle: { fontSize: 12, color: GRAY_TEXT, marginBottom: 20 },
  toggleRow: {
    flexDirection: "row",
    backgroundColor: "#F1EEE6",
    borderRadius: 8,
    padding: 3,
    marginBottom: 18,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  toggleButtonActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  toggleText: { fontSize: 12, fontWeight: "600", color: GRAY_TEXT },
  toggleTextActive: { color: DARK_TEXT },
  fieldRow: { flexDirection: "row", marginBottom: 20 },
  field: { flex: 1, marginRight: 10 },
  fieldLabel: { fontSize: 11, color: GRAY_TEXT, marginBottom: 6 },
  fieldInput: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: DARK_TEXT,
  },
  submitButton: {
    backgroundColor: PURPLE,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  submitButtonText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  statusLegend: { flexDirection: "row", flexWrap: "wrap" },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
    marginRight: 6,
    marginBottom: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  statusChipText: { fontSize: 10, fontWeight: "600" },
});