import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import DashboardShell from './DashboardShell';
import { useTheme } from '../../src/context/ThemeContext';
import { showAlert } from '../../src/utils/alert';

const ACCOUNTS = [
  {
    id: 'personal',
    name: 'Personal Workspace',
    email: 'personal@example.com',
    role: 'Creator',
    initials: 'P',
  },
  {
    id: 'brand',
    name: 'Brand Workspace',
    email: 'brand@example.com',
    role: 'Owner',
    initials: 'B',
  },
];

export default function SwitchAccountScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const [selectedAccount, setSelectedAccount] = useState('personal');

  const handleSelect = (id) => {
    setSelectedAccount(id);
  };

  const handleAddAccount = () => {
    showAlert(
      'Add another account',
      'Account connection will be available here.'
    );
  };

  return (
    <DashboardShell
      active="settings"
      title="Switch Account"
      scroll={true}
    >
      <View style={styles.container}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={[styles.backText, { color: theme.purple }]}>
            ← Back to Settings
          </Text>
        </TouchableOpacity>

        <Text style={[styles.heading, { color: theme.text }]}>
          Switch Account
        </Text>

        <Text style={[styles.subheading, { color: theme.secondaryText }]}>
          Choose the workspace you want to continue with.
        </Text>

        <View style={styles.accounts}>
          {ACCOUNTS.map((account) => {
            const selected = selectedAccount === account.id;

            return (
              <TouchableOpacity
                key={account.id}
                onPress={() => handleSelect(account.id)}
                style={[
                  styles.accountCard,
                  {
                    backgroundColor: theme.card,
                    borderColor: selected
                      ? theme.purple
                      : theme.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: theme.purple },
                  ]}
                >
                  <Text style={styles.avatarText}>
                    {account.initials}
                  </Text>
                </View>

                <View style={styles.accountInfo}>
                  <Text
                    style={[
                      styles.accountName,
                      { color: theme.text },
                    ]}
                  >
                    {account.name}
                  </Text>

                  <Text
                    style={[
                      styles.email,
                      { color: theme.secondaryText },
                    ]}
                  >
                    {account.email}
                  </Text>

                  <Text
                    style={[
                      styles.role,
                      { color: theme.secondaryText },
                    ]}
                  >
                    {account.role}
                  </Text>
                </View>

                <View
                  style={[
                    styles.radio,
                    {
                      borderColor: selected
                        ? theme.purple
                        : theme.border,
                    },
                  ]}
                >
                  {selected && (
                    <View
                      style={[
                        styles.radioInner,
                        { backgroundColor: theme.purple },
                      ]}
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          onPress={handleAddAccount}
          style={[
            styles.addButton,
            {
              borderColor: theme.border,
              backgroundColor: theme.card,
            },
          ]}
        >
          <Text
            style={[
              styles.addButtonText,
              { color: theme.purple },
            ]}
          >
            + Add another account
          </Text>
        </TouchableOpacity>
      </View>
    </DashboardShell>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },

  backButton: {
    marginBottom: 20,
  },

  backText: {
    fontSize: 14,
    fontWeight: '600',
  },

  heading: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },

  subheading: {
    fontSize: 15,
    marginBottom: 24,
  },

  accounts: {
    gap: 14,
  },

  accountCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  accountInfo: {
    flex: 1,
    marginLeft: 14,
  },

  accountName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },

  email: {
    fontSize: 13,
    marginBottom: 3,
  },

  role: {
    fontSize: 12,
  },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  addButton: {
    marginTop: 20,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },

  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});