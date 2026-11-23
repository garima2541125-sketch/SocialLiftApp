import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import DashboardShell from './DashboardShell';
import { useAuth } from '../../src/context/AuthContext';

// Next Friday, e.g. "Fri, Nov 27 2026", as the default schedule date.
function nextFriday() {
  const d = new Date();
  d.setDate(d.getDate() + ((12 - d.getDay()) % 7 || 7));
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' ' + d.getFullYear();
}

export default function ReviewQueueDetailScreen({ postId }) {
  const { user } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState('schedule');
  const [date, setDate] = useState(nextFriday);
  const [time, setTime] = useState('9:30 AM');

  return (
    <DashboardShell
      active="review-queue"
      title="Schedule & Publish"
      scroll={false}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.card}>

          {/* TITLE */}
          <Text style={styles.title}>
            Ready to go live
          </Text>

          <Text style={styles.subtitle}>
            Approved by {user?.name || 'the page owner'} · Instagram
          </Text>

          {/* TOGGLE */}
          <View style={styles.toggleContainer}>

            <Pressable
              onPress={() => setMode('now')}
              style={[
                styles.toggleButton,
                mode === 'now' && styles.toggleActive,
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  mode === 'now' && styles.toggleTextActive,
                ]}
              >
                Publish now
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setMode('schedule')}
              style={[
                styles.toggleButton,
                mode === 'schedule' && styles.toggleActive,
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  mode === 'schedule' && styles.toggleTextActive,
                ]}
              >
                Schedule
              </Text>
            </Pressable>

          </View>

          {/* DATE + TIME */}
          {mode === 'schedule' && (
            <View style={styles.formRow}>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Date
                </Text>

                <TextInput
                  value={date}
                  onChangeText={setDate}
                  style={styles.input}
                  placeholder="Date"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Time
                </Text>

                <TextInput
                  value={time}
                  onChangeText={setTime}
                  style={styles.input}
                  placeholder="Time"
                  placeholderTextColor="#999"
                />
              </View>

            </View>
          )}

          {/* MAIN BUTTON */}
          <Pressable
            style={styles.scheduleButton}
            onPress={() => {
              if (mode === 'now') {
                alert('Post published successfully!');
              } else {
                alert(
                  `Post scheduled for ${date} at ${time}`
                );
              }
            }}
          >
            <Text style={styles.scheduleButtonText}>
              {mode === 'now'
                ? 'Publish now'
                : 'Schedule post'}
            </Text>
          </Pressable>

        </View>

        {/* STATUS CHIPS */}
        <View style={styles.statusRow}>

          <View
            style={[
              styles.statusChip,
              styles.successChip,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                styles.successText,
              ]}
            >
              ● Published successfully
            </Text>
          </View>

          <View
            style={[
              styles.statusChip,
              styles.retryChip,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                styles.retryText,
              ]}
            >
              ● Retrying with backoff (2/3)
            </Text>
          </View>

          <View
            style={[
              styles.statusChip,
              styles.failedChip,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                styles.failedText,
              ]}
            >
              ● Failed — needs attention
            </Text>
          </View>

        </View>

      </ScrollView>
    </DashboardShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },

  container: {
    padding: 0,
    paddingBottom: 60,
    alignItems: 'flex-start',
  },

  card: {
    width: 760,
    maxWidth: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E3D9',
    borderRadius: 12,
    padding: 22,
  },

  title: {
    fontFamily: 'serif',
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 12,
    color: '#6B6B6B',
    marginBottom: 16,
  },

  toggleContainer: {
    width: '100%',
    height: 32,
    backgroundColor: '#F1EEE8',
    borderRadius: 9,
    padding: 3,
    flexDirection: 'row',
    marginBottom: 16,
  },

  toggleButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
  },

  toggleActive: {
    backgroundColor: '#FFFFFF',
  },

  toggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B8790',
  },

  toggleTextActive: {
    color: '#1A1A1A',
  },

  formRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 16,
  },

  inputGroup: {
    flex: 1,
  },

  label: {
    fontSize: 10,
    color: '#6B6B6B',
    marginBottom: 5,
  },

  input: {
    height: 36,
    borderWidth: 1,
    borderColor: '#DDD8CF',
    borderRadius: 7,
    paddingHorizontal: 9,
    fontSize: 11,
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
  },

  scheduleButton: {
    width: '100%',
    height: 34,
    borderRadius: 7,
    backgroundColor: '#6C5CE7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scheduleButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginTop: 8,
  },

  statusChip: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 7,
  },

  successChip: {
    backgroundColor: '#E9F5EC',
  },

  retryChip: {
    backgroundColor: '#FBF0DC',
  },

  failedChip: {
    backgroundColor: '#FBEAE8',
  },

  statusText: {
    fontSize: 9,
    fontWeight: '600',
  },

  successText: {
    color: '#3E8E5A',
  },

  retryText: {
    color: '#B4790A',
  },

  failedText: {
    color: '#C1443A',
  },
});