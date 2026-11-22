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
  callToAction:
    'a short call to action, only when the request is something people can act on, e.g. "Apply now" or ' +
    '"Register today", else ""',
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
      `${ref.label} — and other announcements (admissions, events, achievements…) when none of this account's ` +
      'other designs fits better; NOT festival or occasion greetings and wishes; drawn fresh in this account\'s own style',
    fields: heading
      ? {
          ...DESIGN_FIELDS,
          headline:
            `the main heading. For ${ref.label} posts use exactly "${heading}" (unless the request asks for other ` +
            'wording); for any other kind of post, a short heading that fits what the post is about',
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

// Festival and occasion wishes (Diwali, New Year…): a simple greeting card in
// the account's colours and heading lettering, with its logo, name and
// contact details added as usual, but none of a reference's layout, photo
// frame or "Congratulations".
function greetingType(ref) {
  const info = ref.styleInfo || {};
  return {
    label: 'Festival / occasion greeting',
    classify:
      'festival and occasion greetings and wishes (Diwali, Holi, Eid, Christmas, New Year, Independence Day, ' +
      "Republic Day, Teachers' Day, birthdays, condolences…), where nobody is being congratulated for an achievement",
    fields: {
      headline: 'the greeting itself, short, e.g. "Happy Diwali" or "Happy New Year 2027"',
      subheadline: 'one short, warm wish for the occasion, at most 15 words',
      signOff: 'who the wish is from, only if the request says, else ""',
    },
    creativeFields: ['headline', 'subheadline'],
    requiredFields: ['headline'],
    requiredImages: [],
    imageSlots: {},
    greeting: true,
    designReference: {
      ...ref,
      id: `${ref.id}-greeting`,
      label: 'Festival / occasion greeting',
      styleInfo: {
        category: 'Festival / occasion greeting',
        style:
          'A simple, elegant festive design. A soft gradient background in the brand colours, with ' +
          'decorations for the occasion around the edges. The main heading large and centred with one ' +
          'smaller line under it, and plenty of empty space. Calm, warm and uncluttered.',
        headingText: '',
        headingStyle: info.headingStyle || 'large elegant script',
        palette: info.palette || [],
        photoStyle: 'none',
        photoSide: 'center',
      },
    },
  };
}

export function buildPostTypes(references = []) {
  const types = { ...POST_TYPES };
  references.forEach((ref) => {
    types[`ref:${ref.id}`] = designType(ref);
  });

  // With the account's own designs, never fall back to a plain AI photo or
  // the built-in poster; greetings get a simple card in the same colours.
  if (references.length) {
    delete types.general;
    delete types.placement;
    types.greeting = greetingType(references[0]);
  }
  return types;
}
