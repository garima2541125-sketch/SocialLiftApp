import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { useOwnerData } from '../../src/context/OwnerDataContext';
import OwnerDashboardShell, {
  PURPLE, BORDER, DARK_TEXT, GRAY_TEXT, GREEN, GREEN_BG, RED, RED_BG, AMBER_BG,
} from './OwnerDashboardShell';

function ApprovalCard({ item, expanded, onToggle, onApprove, onReject }) {
  const [note, setNote] = useState('');

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardHeader} activeOpacity={0.85} onPress={onToggle}>
        <View style={styles.thumb}>
          <Text style={styles.thumbEmoji}>{item.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.meta}>By {item.author} · {item.platform} · Submitted {item.submitted}</Text>
        </View>
        <Text style={styles.chevron}>{expanded ? '▾' : '▸'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expanded}>
          <Text style={styles.captionLabel}>Caption</Text>
          <Text style={styles.captionText}>{item.caption}</Text>

          <Text style={styles.captionLabel}>Feedback (optional, sent to {item.author.split(' ')[0]})</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="e.g. Can we swap the last photo for the wider shot?"
            placeholderTextColor="#B9B6AC"
            value={note}
            onChangeText={setNote}
            multiline
          />

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.rejectBtn} onPress={() => onReject(item.id, note)}>
              <Text style={styles.rejectBtnText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.changesBtn} onPress={() => onReject(item.id, note || 'Requested changes')}>
              <Text style={styles.changesBtnText}>Request changes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.approveBtn} onPress={() => onApprove(item.id, note)}>
              <Text style={styles.approveBtnText}>Approve & publish</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

export default function ApprovalsScreen() {
  const { approvals, decisionLog, decideApproval } = useOwnerData();
  const [expandedId, setExpandedId] = useState(approvals[0]?.id || null);

  const handleApprove = (id) => decideApproval(id, 'approved');
  const handleReject = (id, note) => decideApproval(id, 'rejected', note);

  return (
    <OwnerDashboardShell
      active="approvals"
      title="Approvals"
      subtitle={`${approvals.length} post${approvals.length === 1 ? '' : 's'} waiting on your review.`}
    >
      {approvals.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyTitle}>You're all caught up</Text>
          <Text style={styles.emptyBody}>New posts from your team will show up here for review before they go live.</Text>
        </View>
      ) : (
        approvals.map((item) => (
          <ApprovalCard
            key={item.id}
            item={item}
            expanded={expandedId === item.id}
            onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        ))
      )}

      {decisionLog.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Recently decided</Text>
          {decisionLog.slice(0, 6).map((item) => (
            <View key={item.id} style={styles.historyRow}>
              <Text style={styles.historyEmoji}>{item.emoji}</Text>
              <Text style={styles.historyItemTitle} numberOfLines={1}>{item.title}</Text>
              <View
                style={[
                  styles.historyBadge,
                  { backgroundColor: item.decision === 'approved' ? GREEN_BG : RED_BG },
                ]}
              >
                <Text style={[styles.historyBadgeText, { color: item.decision === 'approved' ? GREEN : RED }]}>
                  {item.decision === 'approved' ? 'Approved' : 'Sent back'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </OwnerDashboardShell>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: BORDER, marginBottom: 14, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  thumb: { width: 44, height: 44, borderRadius: 10, backgroundColor: AMBER_BG, alignItems: 'center', justifyContent: 'center' },
  thumbEmoji: { fontSize: 20 },
  title: { fontSize: 13.5, fontWeight: '700', color: DARK_TEXT },
  meta: { fontSize: 11.5, color: GRAY_TEXT, marginTop: 3 },
  chevron: { fontSize: 14, color: GRAY_TEXT },

  expanded: { paddingHorizontal: 16, paddingBottom: 18, borderTopWidth: 1, borderTopColor: '#F1EFE9', paddingTop: 14 },
  captionLabel: { fontSize: 10.5, fontWeight: '700', color: GRAY_TEXT, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6 },
  captionText: { fontSize: 13, color: DARK_TEXT, lineHeight: 19, marginBottom: 14 },
  noteInput: {
    borderWidth: 1, borderColor: BORDER, borderRadius: 8, padding: 10, fontSize: 12.5,
    color: DARK_TEXT, backgroundColor: '#FAF9F5', minHeight: 56, textAlignVertical: 'top', marginBottom: 14,
  },
  actionsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  approveBtn: { backgroundColor: GREEN, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  approveBtnText: { color: '#fff', fontWeight: '700', fontSize: 12.5 },
  changesBtn: { borderWidth: 1, borderColor: BORDER, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  changesBtnText: { color: DARK_TEXT, fontWeight: '700', fontSize: 12.5 },
  rejectBtn: { borderWidth: 1, borderColor: RED, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  rejectBtnText: { color: RED, fontWeight: '700', fontSize: 12.5 },

  emptyState: {
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderWidth: 1,
    borderColor: BORDER, borderRadius: 14, paddingVertical: 64, paddingHorizontal: 32,
  },
  emptyIcon: { fontSize: 36, marginBottom: 12 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: DARK_TEXT, marginBottom: 6 },
  emptyBody: { fontSize: 12.5, color: GRAY_TEXT, textAlign: 'center', maxWidth: 340, lineHeight: 19 },

  historySection: { marginTop: 24 },
  historyTitle: { fontSize: 12, fontWeight: '700', color: GRAY_TEXT, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 10 },
  historyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderWidth: 1,
    borderColor: BORDER, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8,
  },
  historyEmoji: { fontSize: 14 },
  historyItemTitle: { flex: 1, fontSize: 12, color: DARK_TEXT, fontWeight: '600' },
  historyBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  historyBadgeText: { fontSize: 10.5, fontWeight: '700' },
});