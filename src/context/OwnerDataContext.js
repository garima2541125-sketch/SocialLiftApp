import React, { createContext, useContext, useMemo, useState } from 'react';

const OwnerDataContext = createContext(null);

const STUDIO_NAME = 'Fernwood Studio';

const PLANS = {
  studio: { id: 'studio', name: 'Studio', price: 89, seatsMax: 10, aiGenMax: 500, connectedMax: 5 },
  growth: { id: 'growth', name: 'Growth', price: 149, seatsMax: 25, aiGenMax: 1500, connectedMax: 15 },
  scale: { id: 'scale', name: 'Scale', price: 249, seatsMax: 100, aiGenMax: 5000, connectedMax: 50 },
};

const INITIAL_TEAM = [
  { id: 't1', name: 'Priya Raman', email: 'priya@fernwoodstudio.com', role: 'Owner', status: 'Active', lastActive: 'None' },
  { id: 't2', name: 'Maya Chen', email: 'maya@fernwoodstudio.com', role: 'Creator', status: 'Active', lastActive: '2 hours ago' },
  { id: 't3', name: 'Jordan Lee', email: 'jordan@fernwoodstudio.com', role: 'Creator', status: 'Active', lastActive: 'Yesterday' },
  { id: 't4', name: 'Sam Okafor', email: 'sam@fernwoodstudio.com', role: 'Creator', status: 'Active', lastActive: '4 days ago' },
  { id: 't5', name: 'Riley Park', email: 'riley@fernwoodstudio.com', role: 'Viewer', status: 'Invited', lastActive: '—' },
];

const INITIAL_APPROVALS = [
  {
    id: 'a1',
    title: 'Waste from the kiln — autumn ceramics collection',
    author: 'Maya Chen',
    platform: 'Instagram',
    submitted: '3 hours ago',
    emoji: '🏺',
    caption:
      "Nothing goes to waste in the studio — even our test glazes find a home. Here's a peek at how the autumn collection comes together, from raw clay to the kiln. Swipe to see the finished mugs going out this week.",
    status: 'pending',
  },
  {
    id: 'a2',
    title: 'Behind the scenes: glaze mixing process',
    author: 'Jordan Lee',
    platform: 'TikTok',
    submitted: '5 hours ago',
    emoji: '🎨',
    caption:
      "Ever wondered how we get that signature blue-green glaze? Here's a 30-second look at mixing, testing, and dipping — plus the one ingredient we never skip.",
    status: 'pending',
  },
  {
    id: 'a3',
    title: 'Weekend studio hours + workshop signup link',
    author: 'Priya Raman',
    platform: 'Instagram',
    submitted: 'Yesterday',
    emoji: '📅',
    caption:
      "We're open extra hours this Saturday and Sunday, 10am–5pm. Beginner wheel-throwing workshop still has 3 spots left — link in bio to save yours.",
    status: 'pending',
  },
  {
    id: 'a4',
    title: 'New restock: bestselling mug set is back',
    author: 'Sam Okafor',
    platform: 'Instagram',
    submitted: 'Yesterday',
    emoji: '☕',
    caption:
      "It's back! Our best-selling speckled mug set just came out of the kiln and is restocked in the shop. Limited run — once they're gone, they're gone until next season.",
    status: 'pending',
  },
];

const INITIAL_BRAND_KITS = [
  {
    id: 'b1',
    name: 'Fernwood Studio — Core',
    font: 'Freight Text',
    tone: 'Warm, handcrafted, unhurried',
    colors: ['#6C5CE7', '#EDE8E0', '#15141A'],
  },
  {
    id: 'b2',
    name: 'Fernwood Studio — Autumn Collection',
    font: 'Freight Text',
    tone: 'Cozy, earthy, seasonal',
    colors: ['#B5651D', '#EFC88B', '#3F2E22'],
  },
];

const INITIAL_INVOICES = [
  { id: 'i1', date: 'Jul 12, 2026', amount: 89, status: 'Paid' },
  { id: 'i2', date: 'Jun 12, 2026', amount: 89, status: 'Paid' },
  { id: 'i3', date: 'May 12, 2026', amount: 89, status: 'Paid' },
  { id: 'i4', date: 'Apr 12, 2026', amount: 79, status: 'Paid' },
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
  const [renewsOn] = useState('Aug 12, 2026');

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
