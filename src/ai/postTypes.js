// Every kind of post Social Lift can make. Qwen3 reads the prompt (plus a
// description of any uploaded images) and picks one of these by its
// `classify` text, fills in its `fields`, and assigns uploaded images to its
// `imageSlots`. To add a new post type: add an entry here and a template
// component in screens/dashboard/templates/.
//
// Image kinds come from Qwen3-VL (see analyzeImage in localAi.js):
//   person · group · logo · event · product · poster · document · other

export const POST_TYPES = {
  placement: {
    label: 'Placement congratulations',
    classify:
      'congratulating a student on a job offer or campus placement (selected / placed / hired at a company, salary package)',
    fields: {
      studentName: "the student's full name",
      company: 'the employer the student was placed at (never a college, campus or placement drive)',
      packageText: 'the salary package with its unit, e.g. as written in the request',
      branch: 'the short course / branch code, e.g. CSE',
      batch: 'the graduating batch year',
    },
    requiredFields: ['studentName', 'company'],
    // Image slots that must be filled before the post can be downloaded.
    requiredImages: ['studentPhoto'],
    imageSlots: {
      studentPhoto: { kinds: ['person'], crop: 'face', label: 'Student photo' },
      companyLogo: { kinds: ['logo'], crop: 'none', label: 'Company logo' },
    },
  },

  general: {
    label: 'Standard post',
    classify: 'any other post: announcements, promotions, events, tips, behind-the-scenes, etc.',
    fields: {},
    requiredFields: [],
    requiredImages: [],
    imageSlots: {
      // Left empty → Qwen-Image paints a picture for the post instead.
      postImage: {
        kinds: ['person', 'group', 'event', 'product', 'other'],
        crop: 'platform',
        label: 'Post image',
      },
    },
  },
};

export const DEFAULT_POST_TYPE = 'general';

// Reference posts saved in Brand Kit become post types of their own, keyed
// "ref:<id>". A post of that type is drawn entirely FROM SCRATCH by
// Qwen-Image in the reference's style (its design notes), with content Qwen3
// writes for the post — the reference image is only studied, never reused.
// See designedPost.js. Each reference is:
//   { id, label, imageUri, width, height,
//     styleInfo: { category, style, headingText, headingStyle, palette, photoStyle, photoSide } }

export const isReferenceType = (key) => typeof key === 'string' && key.startsWith('ref:');

// What any designed post can say. Wording of the creative fields can be
// new, but numbers in them must be in the request; the person's name and
// role must be in the request word for word.
// Each field must add something new: the same fact never appears on two
// lines of the design.
const DESIGN_FIELDS = {
  headline: 'the main heading, short and eye-catching, e.g. "Admissions Open" or "Welcome Freshers"',
  subheadline: 'one supporting line under the heading, at most 12 words, never repeating the name or any fact below',
  personName: 'the full name of the person the post is about, only if the request names one, else ""',
  personRole:
    'that person\'s achievement, new role, company or course, only as stated in the request, else ""',
  details:
    'up to 3 short key facts from the request (dates, eligibility, venue, batch…) that are NOT already in the ' +
    'name or role, separated by " · ", or ""',
  callToAction: 'a short call to action or closing line, e.g. "Apply now" or "Your achievements inspire us all", or ""',
};

// The heading printed on the reference: saved with its design notes, or for
// references saved before that, the first quoted words of a sentence about
// the heading ("…script heading 'Congratulations' dominates the top").
export function headingOf(ref) {
  const info = ref?.styleInfo || {};
  if (info.headingText) return info.headingText.trim();
  const sentence = (info.style || '').split(/(?<=[.!?])\s+/).find((s) => /heading/i.test(s)) || '';
  const quoted = sentence.match(/["“'‘]([^"“”'’]{2,60})["”'’]/);
  return quoted ? quoted[1].trim() : '';
}

function designType(ref) {
  const heading = headingOf(ref);
  return {
    label: ref.label,
    classify:
      `${ref.label} — and any other kind of post (admissions, events, greetings, achievements…) when none of ` +
      "this account's other designs fits better; drawn fresh in this account's own style",
    fields: heading
      ? {
          ...DESIGN_FIELDS,
          headline: `the main heading. This design's own heading is "${heading}": use exactly that, unless the request asks for different wording`,
        }
      : DESIGN_FIELDS,
    creativeFields: ['headline', 'subheadline', 'details', 'callToAction'],
    requiredFields: ['headline'],
    requiredImages: [],
    imageSlots: {
      personPhoto: { kinds: ['person'], crop: 'none', label: "The person's photo" },
      photo: { kinds: ['group', 'event', 'product', 'other'], crop: 'none', label: 'Photo' },
    },
    designReference: ref,
  };
}

export function buildPostTypes(references = []) {
  const types = { ...POST_TYPES };
  references.forEach((ref) => {
    types[`ref:${ref.id}`] = designType(ref);
  });

  // With the account's own designs, never fall back to a plain AI photo or
  // the built-in poster.
  if (references.length) {
    delete types.general;
    delete types.placement;
  }
  return types;
}
