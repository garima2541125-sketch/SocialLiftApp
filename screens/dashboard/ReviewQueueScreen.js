import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import DashboardShell from './DashboardShell';

const PURPLE = '#6C5CE7';
const DARK_TEXT = '#1A1A1A';
const GRAY_TEXT = '#6B6B6B';
const BORDER = '#E7E3D9';
const PANEL_BG = '#FBFAF6';

const RED = '#C1443A';
const RED_BG = '#FBEAE8';

const GREEN = '#3E8E5A';
const GREEN_BG = '#E9F5EC';

const AMBER = '#B4790A';
const AMBER_BG = '#FBF0DC';

const BLUE = '#2E63C7';
const BLUE_BG = '#E9F0FC';

const POSTS = [
  {
    id: 'p1',
    title: 'Warm from the kiln — autumn ceramics collection…',
    author: 'Maya Chen',
    status: 'Pending review',
    platform: 'Instagram',
    caption:
      'Warm from the kiln 🔥 Our autumn ceramics collection is here — small-batch, hand-glazed, made to be lived with.',
    icon: '🏺',
  },
  {
    id: 'p2',
    title: 'Behind the scenes: glaze mixing process',
    author: 'Jordan Lee',
    status: 'Pending review',
    platform: 'Instagram',
    caption:
      'Ever wondered how we get that exact matte sage finish? Here is two minutes of glaze mixing, no narration, just the process.',
    icon: '🎨',
  },
  {
    id: 'p3',
    title: 'Weekend studio hours + workshop signup link',
    author: 'Maya Chen',
    status: 'Scheduled',
    platform: 'LinkedIn',
    caption:
      'Studio is open Sat–Sun, 10–4. Beginner wheel-throwing workshop still has 3 spots left — link in bio.',
    icon: '🗓️',
  },
  {
    id: 'p4',
    title: 'Customer feature: The Whitfield family kitchen',
    author: 'Sam Okafor',
    status: 'Published',
    platform: 'Instagram',
    caption:
      'We love seeing our pieces find a home. The Whitfield family kitchen, styled beautifully as always.',
    icon: '🏡',
  },
  {
    id: 'p5',
    title: 'New restock: bestselling mug set is back',
    author: 'Jordan Lee',
    status: 'Failed — retrying',
    platform: 'Instagram',
    caption:
      'They’re back! The four-mug stoneware set sold out in nine hours last time — restocked as of this morning.',
    icon: '☕',
  },
];

const STATUS_STYLES = {
  'Pending review': {
    fg: AMBER,
    bg: AMBER_BG,
  },

  Scheduled: {
    fg: BLUE,
    bg: BLUE_BG,
  },

  Published: {
    fg: GREEN,
    bg: GREEN_BG,
  },

  'Failed — retrying': {
    fg: RED,
    bg: RED_BG,
  },
};

function StatusBadge({ status }) {
  const statusStyle =
    STATUS_STYLES[status] || STATUS_STYLES['Pending review'];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: statusStyle.bg,
        },
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          {
            color: statusStyle.fg,
          },
        ]}
      >
        {status}
      </Text>
    </View>
  );
}

function PostRow({ post, index, onPress }) {
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animation, {
      toValue: 1,
      duration: 300,
      delay: index * 60,
      useNativeDriver: false,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: animation,
        transform: [
          {
            translateY: animation.interpolate({
              inputRange: [0, 1],
              outputRange: [10, 0],
            }),
          },
        ],
      }}
    >
      <TouchableOpacity
        style={styles.postRow}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.thumb}>
          <Text style={styles.thumbIcon}>{post.icon}</Text>
        </View>

        <View style={styles.postRowText}>
          <Text style={styles.postTitle} numberOfLines={1}>
            {post.title}
          </Text>

          <Text style={styles.postAuthor}>
            by {post.author}
          </Text>
        </View>

        <StatusBadge status={post.status} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ReviewQueueScreen() {
  const router = useRouter();

  const openPost = (post) => {
    router.push({
      pathname: '/dashboard/review-queue/[id]',
      params: {
        id: post.id,
      },
    });
  };

  return (
    <DashboardShell
      active="review-queue"
      title="Review Queue"
      scroll={false}
    >
      <View style={styles.wrap}>

        {/* LEFT SIDE */}
        <View style={styles.leftCol}>
          <Text style={styles.heading}>
            Review queue
          </Text>

          <Text style={styles.subheading}>
            Posts awaiting your approval before they publish.
          </Text>

          <ScrollView
            style={styles.list}
            showsVerticalScrollIndicator={false}
          >
            {POSTS.map((post, index) => (
              <PostRow
                key={post.id}
                post={post}
                index={index}
                onPress={() => openPost(post)}
              />
            ))}
          </ScrollView>
        </View>

        {/* RIGHT SIDE */}
        <View style={styles.rightCol}>

          <View style={styles.previewImage}>
            <Text style={styles.previewImageIcon}>
              {POSTS[0].icon}
            </Text>
          </View>

          <Text style={styles.previewCaption}>
            {POSTS[0].caption}
          </Text>

          <View style={styles.tagRow}>
            <View
              style={[
                styles.tag,
                {
                  backgroundColor: BLUE_BG,
                },
              ]}
            >
              <Text
                style={[
                  styles.tagText,
                  {
                    color: BLUE,
                  },
                ]}
              >
                Instagram
              </Text>
            </View>

            <View
              style={[
                styles.tag,
                {
                  backgroundColor: AMBER_BG,
                },
              ]}
            >
              <Text
                style={[
                  styles.tagText,
                  {
                    color: AMBER,
                  },
                ]}
              >
                Requires owner approval
              </Text>
            </View>
          </View>

          <View style={styles.actionCol}>

            <TouchableOpacity
              style={styles.approveBtn}
              activeOpacity={0.88}
              onPress={() =>
                router.push({
                  pathname: '/dashboard/review-queue/[id]',
                  params: {
                    id: POSTS[0].id,
                  },
                })
              }
            >
              <Text style={styles.approveBtnText}>
                Approve & publish
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.rejectBtn}
              activeOpacity={0.85}
            >
              <Text style={styles.rejectBtnText}>
                Reject — notify creator
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </View>
    </DashboardShell>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    flexDirection: 'row',
    gap: 28,
  },

  leftCol: {
    flex: 1.3,
    minWidth: 320,
    maxWidth: 460,
  },

  rightCol: {
    flex: 1,
    minWidth: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 22,
    height: 'fit-content',
  },

  heading: {
    fontFamily: 'serif',
    fontSize: 22,
    fontWeight: '700',
    color: DARK_TEXT,
  },

  subheading: {
    fontSize: 13,
    color: GRAY_TEXT,
    marginTop: 4,
  },

  list: {
    marginTop: 18,
  },

  postRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },

  thumb: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: PANEL_BG,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  thumbIcon: {
    fontSize: 20,
  },

  postRowText: {
    flex: 1,
    marginRight: 8,
  },

  postTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: DARK_TEXT,
  },

  postAuthor: {
    fontSize: 11,
    color: GRAY_TEXT,
    marginTop: 2,
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  previewImage: {
    width: '100%',
    aspectRatio: 1.5,
    borderRadius: 12,
    backgroundColor: PANEL_BG,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  previewImageIcon: {
    fontSize: 48,
  },

  previewCaption: {
    fontSize: 13,
    color: DARK_TEXT,
    lineHeight: 19,
    marginBottom: 14,
  },

  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },

  tag: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
  },

  tagText: {
    fontSize: 11,
    fontWeight: '700',
  },

  actionCol: {
    marginTop: 8,
    gap: 10,
  },

  approveBtn: {
    backgroundColor: PURPLE,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },

  approveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  rejectBtn: {
    backgroundColor: RED_BG,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },

  rejectBtnText: {
    color: RED,
    fontWeight: '700',
    fontSize: 13,
  },
});