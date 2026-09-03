import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useOwnerData } from '../../src/context/OwnerDataContext';
import OwnerDashboardShell, { PURPLE, BORDER, DARK_TEXT, GRAY_TEXT, GREEN, GREEN_BG } from './OwnerDashboardShell';

function Meter({ label, used, max }) {
  const pct = Math.min((used / max) * 100, 100);
  return (
    <View style={styles.meter}>
      <Text style={styles.meterLabel}>{label}</Text>
      <Text style={styles.meterValue}>{used} / {max}</Text>
      <View style={styles.meterTrack}>
        <View style={[styles.meterFill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

function PlanOption({ p, current, onSelect }) {
  return (
    <TouchableOpacity
      style={[styles.planOption, current && styles.planOptionCurrent]}
      onPress={() => onSelect(p.id)}
      disabled={current}
      activeOpacity={0.85}
    >
      <View style={styles.planOptionHeader}>
        <Text style={styles.planOptionName}>{p.name}</Text>
        {current && (
          <View style={styles.currentBadge}>
            <Text style={styles.currentBadgeText}>Current</Text>
          </View>
        )}
      </View>
      <Text style={styles.planOptionPrice}>${p.price}<Text style={styles.planOptionPriceUnit}>/mo</Text></Text>
      <Text style={styles.planOptionDetail}>{p.seatsMax} seats · {p.aiGenMax} AI generations · {p.connectedMax} connected accounts</Text>
      {!current && (
        <View style={styles.chooseBtn}>
          <Text style={styles.chooseBtnText}>Switch to {p.name}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function OwnerBillingScreen() {
  const { plan, plans, team, aiGenerationsUsed, connectedAccounts, renewsOn, invoices, upgradePlan } = useOwnerData();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [downloadedId, setDownloadedId] = useState(null);

  const handleSelectPlan = (planId) => {
    upgradePlan(planId);
    setUpgradeOpen(false);
  };

  const handleDownload = (invoice) => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const text = `Fernwood Studio — Social Lift invoice\nDate: ${invoice.date}\nAmount: $${invoice.amount.toFixed(2)}\nStatus: ${invoice.status}\n`;
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.date.replace(/[, ]+/g, '-')}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setDownloadedId(invoice.id);
    setTimeout(() => setDownloadedId(null), 1800);
  };

  return (
    <OwnerDashboardShell active="billing" title="Billing & subscription" subtitle="Manage your plan, payment method, and invoices.">
      <View style={styles.topRow}>
        <View style={styles.planCard}>
          <Text style={styles.eyebrow}>CURRENT PLAN</Text>
          <Text style={styles.planName}>{plan.name}</Text>
          <Text style={styles.planPrice}>${plan.price} / month · renews {renewsOn}</Text>

          <View style={styles.metersRow}>
            <Meter label="Seats" used={team.length} max={plan.seatsMax} />
            <Meter label="AI generations" used={aiGenerationsUsed} max={plan.aiGenMax} />
            <Meter label="Connected accounts" used={connectedAccounts} max={plan.connectedMax} />
          </View>

          <TouchableOpacity style={styles.upgradeBtn} onPress={() => setUpgradeOpen((v) => !v)}>
            <Text style={styles.upgradeBtnText}>{upgradeOpen ? 'Hide plans' : 'Upgrade plan'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.invoiceCard}>
          <Text style={styles.invoiceTitle}>Invoice history</Text>
          {invoices.map((inv) => (
            <View key={inv.id} style={styles.invoiceRow}>
              <Text style={styles.invoiceDate}>{inv.date}</Text>
              <Text style={styles.invoiceAmount}>${inv.amount.toFixed(2)}</Text>
              <View style={styles.paidBadge}>
                <Text style={styles.paidBadgeText}>{inv.status}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDownload(inv)}>
                <Text style={styles.downloadText}>{downloadedId === inv.id ? 'Downloaded ✓' : 'Download'}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      {upgradeOpen && (
        <View style={styles.plansSection}>
          <Text style={styles.plansTitle}>Choose a plan</Text>
          <View style={styles.plansGrid}>
            {Object.values(plans).map((p) => (
              <PlanOption key={p.id} p={p} current={p.id === plan.id} onSelect={handleSelectPlan} />
            ))}
          </View>
        </View>
      )}
    </OwnerDashboardShell>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', gap: 20, flexWrap: 'wrap' },

  planCard: {
    flex: 1, minWidth: 320, backgroundColor: DARK_TEXT, borderRadius: 16, padding: 24,
  },
  eyebrow: { color: '#A79FF0', fontSize: 10.5, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
  planName: { color: '#fff', fontFamily: 'serif', fontSize: 28, fontWeight: '700', marginBottom: 6 },
  planPrice: { color: '#C9C6D6', fontSize: 12.5, marginBottom: 22 },

  metersRow: { gap: 14, marginBottom: 22 },
  meter: {},
  meterLabel: { color: '#9A98A5', fontSize: 10.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  meterValue: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 6 },
  meterTrack: { height: 6, borderRadius: 3, backgroundColor: '#2D2C36', overflow: 'hidden' },
  meterFill: { height: 6, borderRadius: 3, backgroundColor: PURPLE },

  upgradeBtn: { backgroundColor: PURPLE, borderRadius: 9, paddingVertical: 13, alignItems: 'center' },
  upgradeBtnText: { color: '#fff', fontWeight: '700', fontSize: 13.5 },

  invoiceCard: { flex: 1, minWidth: 320, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 20 },
  invoiceTitle: { fontSize: 14, fontWeight: '700', color: DARK_TEXT, marginBottom: 14 },
  invoiceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F1EFE9', gap: 12 },
  invoiceDate: { flex: 1.3, fontSize: 12.5, color: GRAY_TEXT },
  invoiceAmount: { flex: 1, fontSize: 12.5, fontWeight: '700', color: DARK_TEXT },
  paidBadge: { backgroundColor: GREEN_BG, borderRadius: 6, paddingHorizontal: 9, paddingVertical: 3 },
  paidBadgeText: { color: GREEN, fontSize: 10.5, fontWeight: '700' },
  downloadText: { fontSize: 11.5, fontWeight: '700', color: PURPLE, marginLeft: 8 },

  plansSection: { marginTop: 22 },
  plansTitle: { fontSize: 14, fontWeight: '700', color: DARK_TEXT, marginBottom: 14 },
  plansGrid: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  planOption: {
    flexGrow: 1, flexBasis: 220, maxWidth: 280, backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 1.5, borderColor: BORDER, padding: 18,
  },
  planOptionCurrent: { borderColor: PURPLE, backgroundColor: '#FAF9FF' },
  planOptionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  planOptionName: { fontSize: 15, fontWeight: '700', color: DARK_TEXT },
  currentBadge: { backgroundColor: '#EDE9FB', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  currentBadgeText: { color: PURPLE, fontSize: 10, fontWeight: '700' },
  planOptionPrice: { fontSize: 22, fontWeight: '800', color: DARK_TEXT, marginBottom: 8 },
  planOptionPriceUnit: { fontSize: 12, fontWeight: '600', color: GRAY_TEXT },
  planOptionDetail: { fontSize: 11.5, color: GRAY_TEXT, lineHeight: 17, marginBottom: 14 },
  chooseBtn: { backgroundColor: DARK_TEXT, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  chooseBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});