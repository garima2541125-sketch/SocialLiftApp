import React from "react";
import { View, Text, StyleSheet } from "react-native";
import DashboardShell from "./DashboardShell";

const DARK_TEXT = "#1A1A1A";
const GRAY_TEXT = "#6B6B6B";
const BORDER = "#E7E3D9";

export default function ReviewQueueScreen() {
  return (
    <DashboardShell active="review-queue" title="Review Queue">
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>🗂️</Text>
        <Text style={styles.emptyTitle}>Review Queue is coming together</Text>
        <Text style={styles.emptyBody}>Posts waiting on your approval will show up here.</Text>
      </View>
    </DashboardShell>
  );
}

const styles = StyleSheet.create({
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
});
