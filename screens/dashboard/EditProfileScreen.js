import React, { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';

import { useRouter } from 'expo-router';

import DashboardShell from './DashboardShell';

import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';

export default function EditProfileScreen() {
  const router = useRouter();

  const { user } = useAuth();
  const { theme } = useTheme();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  const handleSave = () => {
    Alert.alert(
      'Information saved',
      'Your profile information has been updated.'
    );

    router.back();
  };

  return (
    <DashboardShell
      active="settings"
      title="Edit Information"
    >
      <View style={styles.container}>

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <Text
            style={[
              styles.title,
              { color: theme.text },
            ]}
          >
            Personal information
          </Text>

          <Text
            style={[
              styles.subtitle,
              { color: theme.secondaryText },
            ]}
          >
            Update the information associated with your
            Social Lift account.
          </Text>

          <Text
            style={[
              styles.label,
              { color: theme.text },
            ]}
          >
            Full name
          </Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor={theme.secondaryText}
            style={[
              styles.input,
              {
                color: theme.text,
                backgroundColor: theme.input,
                borderColor: theme.border,
              },
            ]}
          />

          <Text
            style={[
              styles.label,
              { color: theme.text },
            ]}
          >
            Email address
          </Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor={theme.secondaryText}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[
              styles.input,
              {
                color: theme.text,
                backgroundColor: theme.input,
                borderColor: theme.border,
              },
            ]}
          />

          <Text
            style={[
              styles.label,
              { color: theme.text },
            ]}
          >
            Account role
          </Text>

          <View
            style={[
              styles.readOnlyField,
              {
                backgroundColor: theme.panel,
                borderColor: theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.readOnlyText,
                { color: theme.secondaryText },
              ]}
            >
              {user?.role === 'admin'
                ? 'Owner'
                : 'Creator'}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: theme.purple },
            ]}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            <Text style={styles.saveButtonText}>
              Save changes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text
              style={[
                styles.cancelText,
                { color: theme.secondaryText },
              ]}
            >
              Cancel
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </DashboardShell>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: 700,
    width: '100%',
  },

  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 22,
  },

  title: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 24,
  },

  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 7,
    marginTop: 14,
  },

  input: {
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 13,
  },

  readOnlyField: {
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },

  readOnlyText: {
    fontSize: 13,
  },

  saveButton: {
    marginTop: 24,
    borderRadius: 9,
    paddingVertical: 12,
    alignItems: 'center',
  },

  saveButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  cancelButton: {
    alignItems: 'center',
    paddingVertical: 13,
  },

  cancelText: {
    fontSize: 12,
    fontWeight: '600',
  },
});