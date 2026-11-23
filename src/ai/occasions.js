// Fixed-date days a university page usually marks on Instagram, used to
// suggest the next greeting post. (Festivals whose date moves each year, like
// Diwali and Holi, are listed per year.)

const FIXED = [
  { m: 1, d: 1, name: 'New Year', prompt: 'Happy New Year greeting post for JUET Guna' },
  { m: 1, d: 12, name: 'National Youth Day', prompt: 'National Youth Day greeting post for JUET Guna, remembering Swami Vivekananda' },
  { m: 1, d: 26, name: 'Republic Day', prompt: 'Happy Republic Day greeting post for JUET Guna' },
  { m: 2, d: 28, name: 'National Science Day', prompt: 'National Science Day greeting post for JUET Guna' },
  { m: 6, d: 21, name: 'International Yoga Day', prompt: 'International Yoga Day greeting post for JUET Guna' },
  { m: 8, d: 15, name: 'Independence Day', prompt: 'Happy Independence Day greeting post for JUET Guna' },
  { m: 9, d: 5, name: "Teachers' Day", prompt: "Happy Teachers' Day greeting post for JUET Guna, thanking our faculty" },
  { m: 9, d: 15, name: "Engineers' Day", prompt: "Happy Engineers' Day greeting post for JUET Guna" },
  { m: 10, d: 2, name: 'Gandhi Jayanti', prompt: 'Gandhi Jayanti greeting post for JUET Guna' },
  { m: 11, d: 14, name: "Children's Day", prompt: "Happy Children's Day greeting post for JUET Guna" },
  { m: 11, d: 26, name: 'Constitution Day', prompt: 'Constitution Day greeting post for JUET Guna' },
  { m: 12, d: 25, name: 'Christmas', prompt: 'Merry Christmas greeting post for JUET Guna' },
];

const MOVING = [
  { date: '2026-11-08', name: 'Diwali', prompt: 'Happy Diwali greeting post for JUET Guna' },
  { date: '2027-03-22', name: 'Holi', prompt: 'Happy Holi greeting post for JUET Guna' },
  { date: '2027-10-29', name: 'Diwali', prompt: 'Happy Diwali greeting post for JUET Guna' },
];

// The next occasion from today (today included), with how many days away it is.
export function nextOccasion(now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dates = [];
  for (const y of [today.getFullYear(), today.getFullYear() + 1]) {
    FIXED.forEach((o) => dates.push({ ...o, at: new Date(y, o.m - 1, o.d) }));
  }
  MOVING.forEach((o) => {
    const [y, m, d] = o.date.split('-').map(Number);
    dates.push({ ...o, at: new Date(y, m - 1, d) });
  });
  const next = dates.filter((o) => o.at >= today).sort((a, b) => a.at - b.at)[0];
  const days = Math.round((next.at - today) / 86400000);
  const when = days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`;
  const date = next.at.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return { name: next.name, prompt: next.prompt, days, when, date };
}
