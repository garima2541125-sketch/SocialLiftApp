# Social Lift

An AI social-media content studio, built as a minor project at Jaypee University of
Engineering & Technology, Guna, under the supervision of Dr. Amit Kumar Shrivastava.

Team: Garima Chaudhary, Divyanshi Dixit, Maitreyi Gaur.

Type one prompt, for example *"Congratulate Priya Meena, CSE 2027, on her placement at
AAJ Supply Chain"*, optionally attach photos, and Social Lift produces a ready-to-post
Instagram or LinkedIn post, with an image and a caption, designed in your organisation's own style.

## Features

- **Accounts:** email and Google sign-in (Firebase Auth and Firestore), onboarding, and the
  Creator DNA interest quiz.
- **Creator dashboard:** Overview, Create, Review Queue, Analytics, Brand Kit, Settings.
- **Owner console:** team and seats, approvals, brand kits, billing.
- **Brand Kit:** logo, organisation name, badges and contact details, saved per account.
- **Reference posts:** upload your past posts. A vision model writes *design notes* for
  each one (colours, decorations, heading lettering, photo style), and you can edit them.
- **Automatic post type:** the post type is worked out from the prompt, so there is no category to pick.
- **Image understanding:** each upload is classed as a person photo, a logo or an event
  photo, and person photos are cropped around the face.
- **Posts drawn from scratch** in the style of your references. A reference is only
  studied, never reused. The real logo, organisation name and contact details are added
  exactly by the app, not drawn by the AI.
- **Fact and spelling checks:** names, numbers and dates must come from your prompt, and
  invented ones are removed. The generated image is read back, and it is redrawn once if
  the heading or a name is misspelt.
- **Free and offline:** all AI runs locally on a laptop, with no paid API.

## Tech stack

| Part | Used |
| --- | --- |
| App | Expo SDK 57, React Native, Expo Router; web export deployed on Vercel |
| Auth and data | Firebase Authentication, Cloud Firestore |
| Planning and captions | Qwen3 8B in [Ollama](https://ollama.com) |
| Image analysis, design notes, spell check | Qwen3-VL 4B in Ollama |
| Poster generation | Qwen-Image 2512 (GGUF) with the 4-step Lightning LoRA, in [ComfyUI](https://github.com/comfyanonymous/ComfyUI) |
| Person cut-outs | SAM 3 in ComfyUI |

## How a post is made

```
prompt + photos
  → Qwen3-VL analyses the photos (person / logo / event, face position)
  → Qwen3 plans the post: type, text fields, caption
  → fact check: names and numbers must appear in the prompt
  → Qwen-Image draws the poster from the reference's design notes
  → the person photo is placed (SAM 3 cut-out, circle or frame)
  → the real logo is stamped, and the organisation name and contacts are written
  → Qwen3-VL spell check (one redraw if needed)
  → preview, download
```

A post takes about 3–5 minutes on an RTX 5050 (8 GB) laptop when it is plugged in.

## Getting started

1. Install the dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in the Firebase keys. The local AI URLs can
   stay at their defaults.
3. Set up the local AI (Ollama, ComfyUI, the models and SAM 3) by following
   [docs/LOCAL_AI_SETUP.md](docs/LOCAL_AI_SETUP.md).
4. Start the app and open http://localhost:8081:

   ```bash
   npx expo start --web
   ```

AI generation currently runs on the **web** build, because it uses the browser canvas.

## Project layout

```
src/app/                 routes (Expo Router)
src/ai/                  local AI pipeline
  localAi.js             Ollama + ComfyUI calls (plan, analyse, generate, segment, read text)
  postTypes.js           post types, including one per Brand Kit reference
  composePost.js         prompt → finished post
  designedPost.js        from-scratch posts in a reference's style
src/context/             Auth, BrandKit, OwnerData, Theme
src/utils/               canvas compositing, cropping, colour palette
screens/                 app screens (dashboard/, owner/, legal/)
docs/LOCAL_AI_SETUP.md   local AI setup and troubleshooting
```

## Still to do

- Publish to Instagram and LinkedIn through their APIs.
- Store posts, the review queue and approvals in Firestore (some screens still use mock data).
- Real analytics.
- Faster generation, for example with an optional cloud GPU.
