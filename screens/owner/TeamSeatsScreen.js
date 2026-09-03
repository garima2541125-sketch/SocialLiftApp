import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useOwnerData } from '../../src/context/OwnerDataContext';
import OwnerDashboardShell, {
  PURPLE, BORDER, DARK_TEXT, GRAY_TEXT, GREEN, GREEN_BG, RED, RED_BG, AMBER, AMBER_BG, BLUE, BLUE_BG,
} from './OwnerDashboardShell';

const ROLE_OPTIONS = ['Owner', 'Creator', 'Viewer'];

function roleColors(role) {
  if (role === 'Owner') return { fg: PURPLE, bg: '#EDE9FB' };
  if (role === 'Viewer') return { fg: BLUE, bg: BLUE_BG };
  return { fg: AMBER, bg: AMBER_BG };
}

function RoleBadge({ role, onChange }) {
  const [open, setOpen] = useState(false);
  const colors = roleColors(role);
  return (
    <View>
      <TouchableOpacity style={[styles.badge, { backgroundColor: colors.bg }]} onPress={() => setOpen((v) => !v)}>
        <Text style={[styles.badgeText, { color: colors.fg }]}>{role} ▾</Text>
      </TouchableOpacity>
      {open && (
        <View style={styles.roleMenu}>
          {ROLE_OPTIONS.map((r) => (
            <TouchableOpacity
              key={r}
              style={styles.roleMenuItem}
              onPress={() => {
                onChange(r);
                setOpen(false);
              }}
            >
              <Text style={styles.roleMenuItemText}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function StatusBadge({ status }) {
  const active = status === 'Active';
  return (
    <View style={[styles.badge, { backgroundColor: active ? GREEN_BG : '#EFEDE6' }]}>
      <Text style={[styles.badgeText, { color: active ? GREEN : GRAY_TEXT }]}>{status}</Text>
    </View>
  );
}

export default function TeamSeatsScreen() {
  const router = useRouter();
  const { team, plan, inviteMember, changeMemberRole, removeMember } = useOwnerData();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Creator');
  const [message, setMessage] = useState(null);

  const seatsFree = Math.max(plan.seatsMax - team.length, 0);
  const atLimit = team.length >= plan.seatsMax;

  const handleInvite = () => {
    const result = inviteMember(email.trim(), role);
    setMessage(result);
    if (result.ok) {
      setEmail('');
      setRole('Creator');
      setInviteOpen(false);
    }
  };

  return (
    <OwnerDashboardShell
      active="team-seats"
      title="Team & seats"
      subtitle={`${team.length} of ${plan.seatsMax} seats used on the ${plan.name} plan.`}
      headerRight={
        <TouchableOpacity style={styles.inviteBtn} onPress={() => { setMessage(null); setInviteOpen((v) => !v); }}>
          <Text style={styles.inviteBtnText}>+ Invite member</Text>
        </TouchableOpacity>
      }
    >
      {inviteOpen && (
        <View style={styles.inviteCard}>
          <Text style={styles.inviteCardTitle}>Invite a team member</Text>
          <View style={styles.inviteRow}>
            <TextInput
              style={styles.inviteInput}
              placeholder="name@fernwoodstudio.com"
              placeholderTextColor="#B9B6AC"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <View style={styles.roleChooser}>
              {ROLE_OPTIONS.filter((r) => r !== 'Owner').map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleChip, role === r && styles.roleChipActive]}
                  onPress={() => setRole(r)}
                >
                  <Text style={[styles.roleChipText, role === r && styles.roleChipTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.sendInviteBtn} onPress={handleInvite}>
              <Text style={styles.sendInviteBtnText}>Send invite</Text>
            </TouchableOpacity>
          </View>
          {atLimit && (
            <Text style={styles.limitWarning}>
              You're at your seat limit for the {plan.name} plan.{' '}
              <Text style={styles.limitLink} onPress={() => router.push('/owner/billing')}>Upgrade to add more seats →</Text>
            </Text>
          )}
        </View>
      )}

      {message && (
        <Text style={[styles.message, { color: message.ok ? '#2FA84F' : '#C1443A' }]}>{message.message}</Text>
      )}

      <View style={styles.tableCard}>
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.th, { flex: 2 }]}>Member</Text>
          <Text style={[styles.th, { flex: 1 }]}>Role</Text>
          <Text style={[styles.th, { flex: 1 }]}>Seat status</Text>
          <Text style={[styles.th, { flex: 1 }]}>Last active</Text>
          <Text style={[styles.th, { width: 90, textAlign: 'right' }]}>&nbsp;</Text>
        </View>

        {team.map((member) => (
          <View key={member.id} style={styles.tableRow}>
            <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{member.name.charAt(0)}</Text>
              </View>
              <View>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberEmail}>{member.email}</Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <RoleBadge role={member.role} onChange={(r) => changeMemberRole(member.id, r)} />
            </View>
            <View style={{ flex: 1 }}>
              <StatusBadge status={member.status} />
            </View>
            <Text style={[styles.cellText, { flex: 1 }]}>{member.lastActive}</Text>
            <View style={{ width: 90, alignItems: 'flex-end' }}>
              {member.role !== 'Owner' && (
                <TouchableOpacity onPress={() => removeMember(member.id)}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>
    </OwnerDashboardShell>
  );
}

const styles = StyleSheet.create({
  inviteBtn: { backgroundColor: PURPLE, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9 },
  inviteBtnText: { color: '#fff', fontWeight: '700', fontSize: 12.5 },

  inviteCard: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: BORDER, padding: 18, marginBottom: 18 },
  inviteCardTitle: { fontSize: 13, fontWeight: '700', color: DARK_TEXT, marginBottom: 12 },
  inviteRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  inviteInput: {
    flex: 2, minWidth: 220, borderWidth: 1, borderColor: BORDER, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 12.5, color: DARK_TEXT, backgroundColor: '#fff',
  },
  roleChooser: { flexDirection: 'row', gap: 6 },
  roleChip: { borderWidth: 1, borderColor: BORDER, borderRadius: 7, paddingHorizontal: 10, paddingVertical: 8 },
  roleChipActive: { backgroundColor: PURPLE, borderColor: PURPLE },
  roleChipText: { fontSize: 11.5, fontWeight: '700', color: GRAY_TEXT },
  roleChipTextActive: { color: '#fff' },
  sendInviteBtn: { backgroundColor: DARK_TEXT, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 },
  sendInviteBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  limitWarning: { fontSize: 11.5, color: RED, marginTop: 10 },
  limitLink: { fontWeight: '700', textDecorationLine: 'underline' },

  message: { fontSize: 12.5, fontWeight: '600', marginBottom: 14 },

  tableCard: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: BORDER, overflow: 'hidden' },
  tableHeaderRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12,
    backgroundColor: '#FAF9F5', borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  th: { fontSize: 10.5, fontWeight: '700', color: GRAY_TEXT, letterSpacing: 0.6, textTransform: 'uppercase' },
  tableRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F1EFE9',
  },
  avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F35D42', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  memberName: { fontSize: 12.5, fontWeight: '700', color: DARK_TEXT },
  memberEmail: { fontSize: 11, color: GRAY_TEXT, marginTop: 1 },
  cellText: { fontSize: 12, color: GRAY_TEXT },
  removeText: { fontSize: 11.5, fontWeight: '700', color: RED },

  badge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 9, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  roleMenu: {
    position: 'absolute', top: 28, left: 0, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1,
    borderColor: BORDER, paddingVertical: 4, zIndex: 20, minWidth: 100,
    boxShadow: '0px 6px 16px rgba(0,0,0,0.12)',
  },
  roleMenuItem: { paddingVertical: 7, paddingHorizontal: 12 },
  roleMenuItemText: { fontSize: 12, fontWeight: '600', color: DARK_TEXT },
});