# Social Lift

An AI-assisted social media publishing app. You describe the post you want, Social Lift drafts the
caption, hashtags and image, and everything routes through a review queue before it goes live.

Built with [Expo](https://expo.dev) (SDK 57) and [Expo Router](https://docs.expo.dev/router/introduction).
The same codebase runs in the browser, on iOS and on Android.

## Running it

```bash
npm install
npx expo start --web     # browser
npx expo start           # then press i / a for iOS / Android
```

The web build is the quickest way to click through everything.

## What's in it

### Onboarding and accounts

| Screen | Route | What it does |
| --- | --- | --- |
| Login | `/login` | Email login plus Google OAuth via `expo-auth-session` |
| Register | `/next` | Account creation and role selection |
| Profile details | `/profile-details` | Name, date of birth, location, interests |
| Creator DNA | `/creator-dna` | Captures the creator's niche and voice |
| Admin dashboard | `/admin-dashboard` | Owner-level view |
| User dashboard | `/user-dashboard` | Creator-level view |

Auth state lives in `src/context/AuthContext.js` and persists through `AsyncStorage`. There is no
backend yet — sign-in resolves against locally registered users, so the whole app is clickable
without a server.

### The dashboard

Every dashboard screen shares `screens/dashboard/DashboardShell.js`, which provides the sidebar
navigation, the header bar and the signed-in user footer.

| Screen | Route | What it does |
| --- | --- | --- |
| Create | `/dashboard/create` | Pick a platform, write a prompt, set tone, attach a reference image |
| Edit post | `/dashboard/edit` | Refine the generated caption, hashtags, tone and image |
| Review queue | `/dashboard/review-queue` | Approve, reject or edit pending posts; filter by status |
| Analytics | `/dashboard/analytics` | Reach goal, stat cards, conversion funnel, engagement over time, best-time heatmap |
| Brand kit | `/dashboard/brand-kit` | Logo, colour palette and tone of voice |
| Settings | `/dashboard/settings` | Profile, connected accounts, notifications, publishing defaults |

### The main flow

```
Create  ->  Generate  ->  Edit post  ->  Save & send to review  ->  Review queue  ->  Approve
```

This path is fully clickable today. Generation and publishing are stubbed with timeouts where the
backend will eventually sit — each one is marked with a comment.

## Design

| Token | Value |
| --- | --- |
| Accent | `#6C5CE7` |
| Sidebar | `#15141A` |
| Page background | `#F4F2EC` |
| Panel | `#FBFAF6` |
| Border | `#E7E3D9` |
| Highlight | `#F35D42` |

Charts are drawn with plain `View`s rather than `react-native-svg`, which keeps the dependency list
short and renders identically on web and native.

## Project layout

```
src/app/              Expo Router routes (thin files that re-export a screen)
src/context/          AuthContext
src/components/       Shared components
screens/              Top-level screens (auth, onboarding, dashboards)
screens/dashboard/    Dashboard screens + DashboardShell
```

Routes stay deliberately thin — `src/app/dashboard/analytics.tsx` just renders
`screens/dashboard/AnalyticsScreen.js` — so screens can be moved without touching routing.

## Status

The frontend is complete and navigable. Still to come:

- A real backend for generation, scheduling and publishing
- Live Instagram and LinkedIn OAuth (the flows are mocked today)
- Replacing the placeholder analytics data with real metrics
