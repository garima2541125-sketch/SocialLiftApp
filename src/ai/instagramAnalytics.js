// Turns the Instagram account's real posts (getInstagramAnalytics in
// instagram.js) into what the Analytics page shows for one range: the stat
// cards, the engagement chart and data-driven recommendations.
//
// The token can read followers and each post's likes, comments, type and
// time, but not reach or impressions (that needs Meta's
// instagram_manage_insights permission), so engagement is likes + comments.

import { nextOccasion } from './occasions';

const DAY = 24 * 60 * 60 * 1000;
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const TYPE_NAMES = { IMAGE: 'Single image', CAROUSEL_ALBUM: 'Carousel', VIDEO: 'Reel / video' };

export const LIVE_STAT_META = [
  { key: 'interactions', label: 'Likes + comments' },
  { key: 'perPost', label: 'Avg. per post' },
  { key: 'posts', label: 'Posts published' },
  { key: 'followers', label: 'Followers' },
];

const engagement = (p) => p.likes + p.comments;
const sum = (posts, f) => posts.reduce((n, p) => n + f(p), 0);
const fmt = (n) =>
  n >= 1e6
    ? `${(n / 1e6).toFixed(1)}M`
    : n >= 1e4
      ? `${(n / 1e3).toFixed(1)}K`
      : n < 10 && !Number.isInteger(n)
        ? n.toFixed(1)
        : `${Math.round(n)}`;
const hourLabel = (h) => `${h % 12 || 12}${h < 12 ? 'a' : 'p'}`;

function delta(now, before, unit = '') {
  if (!before && !now) return { delta: 'no change', deltaUp: true };
  if (!before) return { delta: `+${fmt(now)}${unit}`, deltaUp: true };
  const pct = ((now - before) / before) * 100;
  return { delta: `${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%`, deltaUp: pct >= 0 };
}

// Range: its length, how its chart is split, and how a bar is labelled.
function rangeSpec(range, now) {
  const d = new Date(now);
  switch (range) {
    case 'day':
      return { label: 'last 24 hours', length: DAY, bars: 12, barLabel: (start) => hourLabel(new Date(start).getHours()) };
    case 'week':
      return { label: 'last 7 days', length: 7 * DAY, bars: 7, barLabel: (start) => WEEKDAYS[new Date(start).getDay()].slice(0, 3) };
    case 'year':
      return {
        label: 'last 12 months',
        length: now - new Date(d.getFullYear() - 1, d.getMonth() + 1, 1).getTime(),
        bars: 12,
        months: true,
      };
    default:
      return {
        label: 'last 30 days',
        length: 30 * DAY,
        bars: 10,
        barLabel: (start) => `${new Date(start).getDate()} ${MONTHS[new Date(start).getMonth()]}`,
      };
  }
}

function chartFor(posts, spec, now) {
  const labels = [];
  const values = [];
  if (spec.months) {
    const d = new Date(now);
    for (let i = 11; i >= 0; i -= 1) {
      const start = new Date(d.getFullYear(), d.getMonth() - i, 1).getTime();
      const end = new Date(d.getFullYear(), d.getMonth() - i + 1, 1).getTime();
      labels.push(MONTHS[new Date(start).getMonth()]);
      values.push(sum(posts.filter((p) => p.t >= start && p.t < end), engagement));
    }
  } else {
    const size = spec.length / spec.bars;
    for (let i = 0; i < spec.bars; i += 1) {
      const start = now - spec.length + i * size;
      labels.push(spec.barLabel(start));
      values.push(sum(posts.filter((p) => p.t >= start && p.t < start + size), engagement));
    }
  }
  const max = Math.max(...values);
  return { labels, values, highlightIndex: max > 0 ? values.indexOf(max) : -1, unit: 'likes + comments' };
}

export function buildLiveRange(data, range, now = Date.now()) {
  const all = data.posts.map((p) => ({ ...p, t: new Date(p.time).getTime() }));
  const spec = rangeSpec(range, now);
  const inRange = all.filter((p) => p.t > now - spec.length);
  const before = all.filter((p) => p.t > now - 2 * spec.length && p.t <= now - spec.length);

  const likes = sum(inRange, (p) => p.likes);
  const comments = sum(inRange, (p) => p.comments);
  const interactions = likes + comments;
  const perPost = inRange.length ? interactions / inRange.length : 0;
  const perPostBefore = before.length ? sum(before, engagement) / before.length : 0;
  const top = [...inRange].sort((a, b) => engagement(b) - engagement(a))[0];
  const byType = {};
  inRange.forEach((p) => {
    byType[TYPE_NAMES[p.type] || p.type] = (byType[TYPE_NAMES[p.type] || p.type] || 0) + 1;
  });

  return {
    rangeLabel: spec.label,
    stats: {
      interactions: {
        value: fmt(interactions),
        ...delta(interactions, sum(before, engagement)),
        breakdown: [
          { label: 'Likes', value: fmt(likes) },
          { label: 'Comments', value: fmt(comments) },
          ...(top ? [{ label: 'Top post', value: `${fmt(engagement(top))} · ${top.caption.slice(0, 32) || top.type}` }] : []),
        ],
        detail: `Likes and comments on the ${inRange.length} post${inRange.length === 1 ? '' : 's'} published in the ${spec.label}, compared with the ${spec.label.replace('last', 'previous')}.`,
      },
      perPost: {
        value: perPost ? perPost.toFixed(1) : '0',
        ...delta(perPost, perPostBefore),
        breakdown: [
          { label: 'Posts in range', value: `${inRange.length}` },
          {
            label: 'As % of followers',
            value: data.followers ? `${((perPost / data.followers) * 100).toFixed(1)}%` : '—',
          },
        ],
        detail:
          'Average likes + comments per post: the fairest way to compare periods when the number of posts changes. Reach and saves need an extra Instagram permission, so they are not included.',
      },
      posts: {
        value: `${inRange.length}`,
        ...(() => {
          const diff = inRange.length - before.length;
          return { delta: `${diff >= 0 ? '+' : ''}${diff}`, deltaUp: diff >= 0 };
        })(),
        breakdown: Object.keys(byType).length
          ? Object.entries(byType).map(([label, n]) => ({ label, value: `${n}` }))
          : [{ label: 'No posts in this period', value: '0' }],
        detail: `Posts published on Instagram as @${data.username} in the ${spec.label}.`,
      },
      followers: {
        value: fmt(data.followers),
        delta: '',
        deltaUp: true,
        deltaNote: 'as of now',
        breakdown: [
          { label: 'Followers', value: fmt(data.followers) },
          { label: 'Following', value: fmt(data.following) },
          { label: 'Posts in total', value: fmt(data.postCount) },
        ],
        detail:
          'Follower count as of now. Instagram only shares follower history with the insights permission, so growth over time is not shown.',
      },
    },
    chart: chartFor(all, spec, now),
  };
}

// ---- Recommendations from the account's own history ----

// JUET ideas used when there isn't enough history to learn from.
const JUET_IDEAS = [
  {
    tag: 'Carousel',
    title: 'Placement congratulations round-up',
    summary: 'Placement posts are what students, parents and alumni share most',
    detail:
      "Put this season's selections in one carousel: a cover slide with the total offers and top package, then one slide per company with each student's photo, name, branch and role. Make each slide in Create with the Placement congratulations design.",
    suggestedTime: 'Thursday, 11:00 AM',
    expectedLift: 'More shares than single posts',
  },
  {
    tag: 'Reel',
    title: 'A day on the Guna campus',
    summary: 'Reels reach people who do not follow you yet, like prospective students',
    detail:
      'Film a 30–45 second Reel following a student through the day: the main gate, a lab session, the library, the canteen and the hostels in the evening. Add on-screen captions, since most people watch with the sound off.',
    suggestedTime: 'Saturday, 6:00 PM',
    expectedLift: 'Reach beyond current followers',
  },
];

export function buildRecommendations(data, now = Date.now()) {
  const posts = data.posts.map((p) => ({ ...p, t: new Date(p.time).getTime() }));
  const recs = [];
  const avg = posts.length ? sum(posts, engagement) / posts.length : 0;

  if (posts.length) {
    const days = Math.floor((now - Math.max(...posts.map((p) => p.t))) / DAY);
    if (days >= 5) {
      recs.push({
        tag: 'Consistency',
        title: `Post again — it's been ${days} days`,
        summary: `The last post on @${data.username} was ${days} days ago`,
        detail:
          'Accounts that post regularly keep showing up in followers\' feeds. Aim for 3 posts a week: placements, events and campus life. Create can make one in about 3 minutes.',
        suggestedTime: 'Today',
        expectedLift: 'Back in followers\' feeds',
      });
    }
  }

  // Best weekday and time, by average likes + comments (needs some history).
  if (posts.length >= 8 && avg > 0) {
    const groups = {};
    posts.forEach((p) => {
      const d = new Date(p.t);
      const key = `${d.getDay()}|${Math.floor(d.getHours() / 3) * 3}`;
      (groups[key] = groups[key] || []).push(p);
    });
    const best = Object.entries(groups)
      .filter(([, g]) => g.length >= 2)
      .map(([key, g]) => ({ key, avg: sum(g, engagement) / g.length, n: g.length }))
      .sort((a, b) => b.avg - a.avg)[0];
    if (best && best.avg > avg * 1.2) {
      const [day, hour] = best.key.split('|').map(Number);
      recs.push({
        tag: 'Timing',
        title: `Post on ${WEEKDAYS[day]}s around ${hourLabel(hour)}m`,
        summary: `Posts then get ${(best.avg / avg).toFixed(1)}x your average likes + comments`,
        detail: `Across your last ${posts.length} posts, the ${best.n} published on ${WEEKDAYS[day]}s between ${hourLabel(hour)}m and ${hourLabel(hour + 3)}m averaged ${best.avg.toFixed(1)} likes + comments, against ${avg.toFixed(1)} overall. Schedule important posts, like placement announcements, for then.`,
        suggestedTime: `${WEEKDAYS[day]}, ${hourLabel(hour)}m`,
        expectedLift: `${(best.avg / avg).toFixed(1)}x likes + comments`,
      });
    }

    const types = {};
    posts.forEach((p) => {
      (types[p.type] = types[p.type] || []).push(p);
    });
    const bestType = Object.entries(types)
      .filter(([, g]) => g.length >= 2)
      .map(([type, g]) => ({ type, avg: sum(g, engagement) / g.length, n: g.length }))
      .sort((a, b) => b.avg - a.avg)[0];
    if (bestType && Object.keys(types).length > 1 && bestType.avg > avg * 1.2) {
      const name = TYPE_NAMES[bestType.type] || bestType.type;
      recs.push({
        tag: name,
        title: `Make more ${name.toLowerCase()} posts`,
        summary: `${name} posts get ${(bestType.avg / avg).toFixed(1)}x your average likes + comments`,
        detail: `Your ${bestType.n} ${name.toLowerCase()} posts averaged ${bestType.avg.toFixed(1)} likes + comments, against ${avg.toFixed(1)} across all posts.`,
        suggestedTime: 'Your next post',
        expectedLift: `${(bestType.avg / avg).toFixed(1)}x likes + comments`,
      });
    }
  }

  return [...recs, occasionIdea(new Date(now)), ...JUET_IDEAS].slice(0, 3);
}

// A greeting for the next day the university usually marks.
export function occasionIdea(now = new Date()) {
  const o = nextOccasion(now);
  return {
    tag: 'Greeting',
    title: `${o.name} greeting from JUET`,
    summary: `${o.name} is ${o.when} (${o.date}). Greetings keep the page active between announcements`,
    detail: `Post a simple ${o.name} greeting in JUET's colours with the logo, one short wish and no event details, so it reads as a greeting rather than a notice. In Create, type: "${o.prompt}".`,
    suggestedTime: o.days <= 1 ? 'Today, 9:00 AM' : `${o.date}, 9:00 AM`,
    expectedLift: 'Steady likes from students and alumni',
  };
}
