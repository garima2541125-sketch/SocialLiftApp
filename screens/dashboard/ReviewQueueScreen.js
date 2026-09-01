import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import DashboardShell from './DashboardShell';

const PURPLE = '#6C5CE7';
const ORANGE = '#F35D42';
const RED = '#C1443A';
const DARK_TEXT = '#1A1A1A';
const GRAY_TEXT = '#6B6B6B';
const BORDER = '#E7E3D9';
const PANEL_BG = '#FBFAF6';
const ACCENT_TINT = '#EFECFD';
const GREEN_TINT = '#E4F3E8';
const GREEN_TEXT = '#3D6849';
const AMBER_TINT = '#FBF0DD';
const AMBER_TEXT = '#B9791E';

const INITIAL_POSTS = [
  {
    id: 'p1',
    platform: 'Instagram',
    thumb: '🍂',
    caption:
      'Autumn ceramics just landed. Earthy glazes, small-batch, and every piece thrown by hand this month.',
    hashtags: '#handmadeceramics #autumncollection #smallbatch',
    scheduled: 'Fri 9:30am',
    status: 'pending',
  },
  {
    id: 'p2',
    platform: 'Instagram',
    thumb: '🎥',
    caption:
      'Behind the scenes: mixing the speckled oat glaze that went on our bestselling mug set.',
    hashtags: '#pottery #behindthescenes #reels',
    scheduled: 'Sat 6:00pm',
    status: 'pending',
  },
  {
    id: 'p3',
    platform: 'LinkedIn',
    thumb: '🏺',
    caption:
      'We grew our studio from a single kiln to a six-person team in two years. Here is what we learned about scaling a craft business.',
    hashtags: '#smallbusiness #craft #founderstory',
    scheduled: 'Mon 8:00am',
    status: 'approved',
  },
  {
    id: 'p4',
    platform: 'Instagram',
    thumb: '☕',
    caption: 'Restock alert — the oat mug set is back, and it never lasts long.',
    hashtags: '#restock #ceramics #mugs',
    scheduled: 'Wed 12:00pm',
    status: 'rejected',
  },
];

const FILTERS = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All' },
];

const STATUS_STYLE = {
  pending: { pill: { backgroundColor: AMBER_TINT }, text: { color: AMBER_TEXT }, label: 'Pending review' },
  approved: { pill: { backgroundColor: GREEN_TINT }, text: { color: GREEN_TEXT }, label: 'Approved' },
  rejected: { pill: { backgroundColor: '#FBE4E1' }, text: { color: RED }, label: 'Rejected' },
};

export default function ReviewQueueScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [filter, setFilter] = useState('pending');

  const setStatus = (id, status) =>
    setPosts((prev) => prev.map((post) => (post.id === id ? { ...post, status } : post)));

  const visible = useMemo(
    () => (filter === 'all' ? posts : posts.filter((post) => post.status === filter)),
    [posts, filter],
  );

  const pendingCount = posts.filter((post) => post.status === 'pending').length;

  return (
    <DashboardShell active="review-queue" title="Review Queue">
      <Text style={styles.heading}>Review queue</Text>
      <Text style={styles.subheading}>
        {pendingCount === 0
          ? 'Nothing left to review — every post has been actioned.'
          : `${pendingCount} post${pendingCount === 1 ? '' : 's'} waiting on your approval before publishing.`}
      </Text>

      <View style={styles.filterRow}>
        {FILTERS.map((item) => {
          const isActive = filter === item.key;
          const count = item.key === 'all' ? posts.length : posts.filter((p) => p.status === item.key).length;
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.filterPill, isActive && styles.filterPillActive]}
              onPress={() => setFilter(item.key)}
              activeOpacity={0.85}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {item.label} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {visible.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🗂️</Text>
          <Text style={styles.emptyTitle}>Nothing here</Text>
          <Text style={styles.emptyBody}>No posts match this filter right now.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {visible.map((post) => {
            const status = STATUS_STYLE[post.status];
            return (
              <View key={post.id} style={styles.postCard}>
                <View style={styles.thumb}>
                  <Text style={styles.thumbText}>{post.thumb}</Text>
                </View>

                <View style={styles.postBody}>
                  <View style={styles.postHead}>
                    <View style={styles.platformPill}>
                      <Text style={styles.platformPillText}>{post.platform}</Text>
                    </View>
                    <View style={[styles.statusPill, status.pill]}>
                      <Text style={[styles.statusPillText, status.text]}>{status.label}</Text>
                    </View>
                    <View style={styles.spacer} />
                    <Text style={styles.scheduled}>🕑 {post.scheduled}</Text>
                  </View>

                  <Text style={styles.caption}>{post.caption}</Text>
                  <Text style={styles.hashtags}>{post.hashtags}</Text>

                  <View style={styles.actionRow}>
                    {post.status === 'pending' ? (
                      <>
                        <TouchableOpacity
                          style={styles.approveBtn}
                          activeOpacity={0.88}
                          onPress={() => setStatus(post.id, 'approved')}
                        >
                          <Text style={styles.approveBtnText}>Approve &amp; schedule</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.ghostBtn}
                          activeOpacity={0.85}
                          onPress={() => router.push('/dashboard/create')}
                        >
                          <Text style={styles.ghostBtnText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity activeOpacity={0.7} onPress={() => setStatus(post.id, 'rejected')}>
                          <Text style={styles.rejectText}>Reject</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <TouchableOpacity activeOpacity={0.7} onPress={() => setStatus(post.id, 'pending')}>
                        <Text style={styles.undoText}>↩ Move back to pending</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </DashboardShell>
  );
}

const styles = StyleSheet.create({
  heading: { fontFamily: 'serif', fontSize: 22, fontWeight: '700', color: DARK_TEXT, marginBottom: 4 },
  subheading: { fontSize: 13, color: GRAY_TEXT, marginBottom: 20 },

  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  filterPill: {
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  filterPillActive: { backgroundColor: PURPLE, borderColor: PURPLE },
  filterText: { fontSize: 12, fontWeight: '600', color: GRAY_TEXT },
  filterTextActive: { color: '#fff', fontWeight: '700' },

  list: { gap: 14 },
  postCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 16,
    gap: 16,
    maxWidth: 860,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: PANEL_BG,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbText: { fontSize: 28 },

  postBody: { flex: 1, minWidth: 0 },
  postHead: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  platformPill: { backgroundColor: ACCENT_TINT, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  platformPillText: { fontSize: 10.5, fontWeight: '700', color: PURPLE },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  statusPillText: { fontSize: 10.5, fontWeight: '700' },
  spacer: { flex: 1 },
  scheduled: { fontSize: 11, color: GRAY_TEXT },

  caption: { fontSize: 13, color: DARK_TEXT, lineHeight: 19 },
  hashtags: { fontSize: 11.5, color: PURPLE, marginTop: 6 },

  actionRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginTop: 14 },
  approveBtn: { backgroundColor: PURPLE, borderRadius: 8, paddingVertical: 9, paddingHorizontal: 16 },
  approveBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  ghostBtn: {
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  ghostBtnText: { fontSize: 12, fontWeight: '700', color: DARK_TEXT },
  rejectText: { fontSize: 12, fontWeight: '700', color: RED },
  undoText: { fontSize: 12, fontWeight: '600', color: GRAY_TEXT },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    paddingVertical: 64,
    paddingHorizontal: 32,
    maxWidth: 860,
  },
  emptyIcon: { fontSize: 40, marginBottom: 14 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: DARK_TEXT, marginBottom: 8 },
  emptyBody: { fontSize: 13, color: GRAY_TEXT, textAlign: 'center', maxWidth: 340, lineHeight: 19 },
});
