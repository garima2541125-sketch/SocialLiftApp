import React, { createContext, useContext, useMemo, useState } from 'react';

const OwnerDataContext = createContext(null);

const STUDIO_NAME = 'JUET Guna';

const PLANS = {
  studio: { id: 'studio', name: 'Studio', price: 89, seatsMax: 10, aiGenMax: 500, connectedMax: 5 },
  growth: { id: 'growth', name: 'Growth', price: 149, seatsMax: 25, aiGenMax: 1500, connectedMax: 15 },
  scale: { id: 'scale', name: 'Scale', price: 249, seatsMax: 100, aiGenMax: 5000, connectedMax: 50 },
};

const INITIAL_TEAM = [
  { id: 't1', name: 'JUET Social Media Cell', email: 'socialmedia@juet.ac.in', role: 'Owner', status: 'Active', lastActive: 'Now' },
  { id: 't2', name: 'Training & Placement Cell', email: 'placements@juet.ac.in', role: 'Creator', status: 'Active', lastActive: '2 hours ago' },
  { id: 't3', name: 'Computer Science Department', email: 'cse@juet.ac.in', role: 'Creator', status: 'Active', lastActive: 'Yesterday' },
  { id: 't4', name: 'Cultural Committee', email: 'cultural@juet.ac.in', role: 'Creator', status: 'Active', lastActive: '3 days ago' },
  { id: 't5', name: 'Admissions Office', email: 'admissions@juet.ac.in', role: 'Viewer', status: 'Invited', lastActive: '—' },
];

const INITIAL_APPROVALS = [
  {
    id: 'a1',
    title: 'Placement season 2026: congratulations to our selected students',
    author: 'Training & Placement Cell',
    platform: 'Instagram',
    submitted: '2 hours ago',
    emoji: '🎓',
    caption:
      'A proud moment for JUET Guna! 🎓 Congratulations to all our students selected in this season’s campus placement drives. Your hard work has paid off, and we wish you the very best for the journey ahead. #JUETGuna #Placements2026',
    status: 'pending',
  },
  {
    id: 'a2',
    title: 'Constitution Day greeting',
    author: 'Cultural Committee',
    platform: 'Instagram',
    submitted: 'Yesterday',
    emoji: '📜',
    caption:
      'On Constitution Day, JUET Guna honours the values that guide our nation: justice, liberty, equality and fraternity. #ConstitutionDay #JUETGuna',
    status: 'pending',
  },
];

const INITIAL_BRAND_KITS = [
  {
    id: 'b1',
    name: 'JUET Guna — Official',
    font: 'Montserrat',
    tone: 'Formal, proud and welcoming',
    colors: ['#1F3C88', '#F2B705', '#FFFFFF'],
  },
  {
    id: 'b2',
    name: 'JUET Guna — Festive greetings',
    font: 'Playfair Display',
    tone: 'Warm, celebratory and simple',
    colors: ['#8B1E3F', '#F2B705', '#FFF8E7'],
  },
];

const INITIAL_INVOICES = [
  { id: 'i1', date: 'Nov 12, 2026', amount: 89, status: 'Paid' },
  { id: 'i2', date: 'Oct 12, 2026', amount: 89, status: 'Paid' },
  { id: 'i3', date: 'Sep 12, 2026', amount: 89, status: 'Paid' },
  { id: 'i4', date: 'Aug 12, 2026', amount: 79, status: 'Paid' },
];

export function OwnerDataProvider({ children }) {
  const [studioName] = useState(STUDIO_NAME);
  const [team, setTeam] = useState(INITIAL_TEAM);
  const [approvals, setApprovals] = useState(INITIAL_APPROVALS);
  const [decisionLog, setDecisionLog] = useState([]);
  const [brandKits, setBrandKits] = useState(INITIAL_BRAND_KITS);
  const [planId, setPlanId] = useState('studio');
  const [invoices, setInvoices] = useState(INITIAL_INVOICES);
  const [postsThisMonth, setPostsThisMonth] = useState(24);
  const [aiGenerationsUsed] = useState(312);
  const [connectedAccounts] = useState(2);
  const [renewsOn] = useState('Dec 12, 2026');

  const plan = PLANS[planId];

  const inviteMember = (email, role) => {
    if (!email) return { ok: false, message: 'Enter an email address.' };
    if (team.length >= plan.seatsMax) {
      return { ok: false, message: `You're at ${plan.seatsMax}/${plan.seatsMax} seats on the ${plan.name} plan. Upgrade to invite more people.` };
    }
    if (team.some((m) => m.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, message: 'That email is already on the team.' };
    }
    const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const newMember = {
      id: `t${Date.now()}`,
      name,
      email,
      role: role || 'Creator',
      status: 'Invited',
      lastActive: '—',
    };
    setTeam((prev) => [...prev, newMember]);
    return { ok: true, message: `Invite sent to ${email}.` };
  };

  const changeMemberRole = (id, role) => {
    setTeam((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)));
  };

  const removeMember = (id) => {
    setTeam((prev) => prev.filter((m) => m.id !== id));
  };

  const decideApproval = (id, decision, note) => {
    const item = approvals.find((a) => a.id === id);
    if (!item) return;
    setApprovals((prev) => prev.filter((a) => a.id !== id));
    setDecisionLog((prev) => [
      { ...item, decision, note: note || '', decidedAt: 'Just now' },
      ...prev,
    ]);
    if (decision === 'approved') {
      setPostsThisMonth((prev) => prev + 1);
    }
  };

  const addBrandKit = () => {
    const newKit = {
      id: `b${Date.now()}`,
      name: 'New brand kit',
      font: 'Freight Text',
      tone: 'Describe the voice for this kit',
      colors: ['#6C5CE7', '#EDE8E0', '#15141A'],
    };
    setBrandKits((prev) => [...prev, newKit]);
    return newKit.id;
  };

  const updateBrandKit = (id, updates) => {
    setBrandKits((prev) => prev.map((k) => (k.id === id ? { ...k, ...updates } : k)));
  };

  const removeBrandKit = (id) => {
    setBrandKits((prev) => prev.filter((k) => k.id !== id));
  };

  const upgradePlan = (newPlanId) => {
    if (!PLANS[newPlanId]) return;
    setPlanId(newPlanId);
    const newPlan = PLANS[newPlanId];
    setInvoices((prev) => [
      { id: `i${Date.now()}`, date: 'Today', amount: newPlan.price, status: 'Paid' },
      ...prev,
    ]);
  };

  const value = useMemo(
    () => ({
      studioName,
      team,
      approvals,
      decisionLog,
      brandKits,
      plan,
      plans: PLANS,
      invoices,
      postsThisMonth,
      aiGenerationsUsed,
      connectedAccounts,
      renewsOn,
      inviteMember,
      changeMemberRole,
      removeMember,
      decideApproval,
      addBrandKit,
      updateBrandKit,
      removeBrandKit,
      upgradePlan,
    }),
    [studioName, team, approvals, decisionLog, brandKits, plan, invoices, postsThisMonth, aiGenerationsUsed, connectedAccounts, renewsOn]
  );

  return <OwnerDataContext.Provider value={value}>{children}</OwnerDataContext.Provider>;
}

export function useOwnerData() {
  const ctx = useContext(OwnerDataContext);
  if (!ctx) {
    throw new Error('useOwnerData must be used inside an OwnerDataProvider');
  }
  return ctx;
}
