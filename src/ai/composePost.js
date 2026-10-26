import { analyzeImage, planPost, generateImage, platformAspect } from './localAi';
import { POST_TYPES } from './postTypes';
import { cropFace, cropToAspect } from '../utils/cropImage';
import { composeDesigned } from './designedPost';

// Turns a prompt + uploaded images into a finished post:
//   1. Qwen3-VL works out what each image is   (step 'analyzing')
//   2. Qwen3 picks the post type and plans it  (step 'planning')
//   3. images are cropped for the slot they were given
//   4. a post in one of the account's designs is drawn from scratch in its
//      style (designedPost.js); a standard post with no usable photo gets one
//      from Qwen-Image (step 'image')
//
// images: [{ id, uri }] — uri must be a data: URI on web.
// analysisCache: a Map kept by the caller, so regenerating doesn't
// re-analyse the same images.
// postTypes: buildPostTypes(brandKit.references), so the account's own
// reference designs can be picked. brandKit: its name, logo and contact
// details go on designed posts.

async function cropForSlot(uri, slotDef, analysis, platform) {
  switch (slotDef.crop) {
    case 'face':
      return cropFace(uri, analysis.faceBox);
    case 'platform':
      return cropToAspect(uri, platformAspect(platform), analysis.faceBox);
    default:
      return uri;
  }
}

export async function composePost({
  prompt,
  tone,
  platform,
  images = [],
  analysisCache,
  postTypes = POST_TYPES,
  brandKit = {},
  onStep,
}) {
  if (images.some((img) => !analysisCache.has(img.id))) {
    onStep?.('analyzing');
    for (const img of images) {
      if (!analysisCache.has(img.id)) {
        analysisCache.set(img.id, await analyzeImage(img.uri));
      }
    }
  }
  const analyses = images.map((img) => analysisCache.get(img.id));

  onStep?.('planning');
  const plan = await planPost({ prompt, tone, platform, analyses, postTypes });
  const type = postTypes[plan.postType];

  const slotImages = {};
  for (const [slot, index] of Object.entries(plan.slots)) {
    slotImages[slot] =
      index === null
        ? null
        : await cropForSlot(images[index].uri, type.imageSlots[slot], analyses[index], platform);
  }

  // One of the account's designs: drawn from scratch in its style.
  if (type.designReference) {
    const slot = slotImages.personPhoto ? 'personPhoto' : slotImages.photo ? 'photo' : null;
    const photo = slot
      ? { uri: slotImages[slot], isPerson: slot === 'personPhoto', faceBox: analyses[plan.slots[slot]]?.faceBox }
      : null;
    const designed = await composeDesigned({
      reference: type.designReference,
      fields: plan.fields,
      imagePrompt: plan.imagePrompt,
      photo,
      brandKit,
      onStep,
    });
    return {
      ...plan,
      slotImages: { ...slotImages, postImage: designed.uri },
      analyses,
      imageAspect: designed.aspect,
      misspelt: designed.missing,
    };
  }

  if (plan.postType === 'general' && !slotImages.postImage) {
    onStep?.('image');
    const generated = await generateImage({ imagePrompt: plan.imagePrompt, platform });
    slotImages.postImage = generated.uri;
  }

  return { ...plan, slotImages, analyses };
}
