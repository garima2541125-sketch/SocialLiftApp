import React, { useState } from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from 'react-native';

import { useRouter } from 'expo-router';

import DashboardShell from './DashboardShell';

import { useTheme } from '../../src/context/ThemeContext';
import { showAlert } from '../../src/utils/alert';

export default function SecurityScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const [twoFactor, setTwoFactor] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);

  return (
    <DashboardShell
      active="settings"
      title="Security"
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
            Login & security
          </Text>

          <Text
            style={[
              styles.subtitle,
              { color: theme.secondaryText },
            ]}
          >
            Manage how your Social Lift account is protected.
          </Text>

          <View
            style={[
              styles.row,
              { borderBottomColor: theme.border },
            ]}
          >
            <View style={styles.content}>
              <Text
                style={[
                  styles.rowTitle,
                  { color: theme.text },
                ]}
              >
                Two-factor authentication
              </Text>

              <Text
                style={[
                  styles.rowSubtitle,
                  { color: theme.secondaryText },
                ]}
              >
                Add another layer of protection to your account.
              </Text>
            </View>

            <Switch
              value={twoFactor}
              onValueChange={setTwoFactor}
              trackColor={{
                false: theme.border,
                true: theme.purple,
              }}
            />
          </View>

          <View
            style={[
              styles.row,
              { borderBottomColor: theme.border },
            ]}
          >
            <View style={styles.content}>
              <Text
                style={[
                  styles.rowTitle,
                  { color: theme.text },
                ]}
              >
                Login alerts
              </Text>

              <Text
                style={[
                  styles.rowSubtitle,
                  { color: theme.secondaryText },
                ]}
              >
                Get notified about new account logins.
              </Text>
            </View>

            <Switch
              value={loginAlerts}
              onValueChange={setLoginAlerts}
              trackColor={{
                false: theme.border,
                true: theme.purple,
              }}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { borderColor: theme.border },
            ]}
            onPress={() =>
              showAlert(
                'Change password',
                'Connect this button to your authentication provider.'
              )
            }
          >
            <Text
              style={[
                styles.actionText,
                { color: theme.text },
              ]}
            >
              Change password
            </Text>

            <Text
              style={[
                styles.arrow,
                { color: theme.secondaryText },
              ]}
            >
              ›
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { borderColor: theme.border },
            ]}
            onPress={() =>
              showAlert(
                'Active sessions',
                'You currently have one active session.'
              )
            }
          >
            <Text
              style={[
                styles.actionText,
                { color: theme.text },
              ]}
            >
              Active sessions
            </Text>

            <Text
              style={[
                styles.arrow,
                { color: theme.secondaryText },
              ]}
            >
              ›
            </Text>
          </TouchableOpacity>

        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text
            style={[
              styles.backText,
              { color: theme.secondaryText },
            ]}
          >
            Back to settings
          </Text>
        </TouchableOpacity>

      </View>
    </DashboardShell>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: 750,
    width: '100%',
  },

  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 20,
  },

  title: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 5,
  },

  subtitle: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 18,
  },

  row: {
    minHeight: 75,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingVertical: 12,
  },

  content: {
    flex: 1,
    paddingRight: 15,
  },

  rowTitle: {
    fontSize: 13,
    fontWeight: '700',
  },

  rowSubtitle: {
    fontSize: 10.5,
    lineHeight: 15,
    marginTop: 3,
  },

  actionButton: {
    minHeight: 55,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  actionText: {
    fontSize: 12.5,
    fontWeight: '600',
  },

  arrow: {
    fontSize: 24,
  },

  backButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },

  backText: {
    fontSize: 12,
  },
});