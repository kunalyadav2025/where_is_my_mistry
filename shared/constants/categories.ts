export const CATEGORIES = [
  { id: 'plumber', name: 'Plumber', nameHindi: 'प्लंबर', icon: 'pipe', order: 1 },
  { id: 'electrician', name: 'Electrician', nameHindi: 'इलेक्ट्रीशियन', icon: 'bolt', order: 2 },
  { id: 'painter', name: 'Painter', nameHindi: 'पेंटर', icon: 'paint-brush', order: 3 },
  { id: 'carpenter', name: 'Carpenter', nameHindi: 'बढ़ई', icon: 'hammer', order: 4 },
  { id: 'welder', name: 'Welder', nameHindi: 'वेल्डर', icon: 'fire', order: 5 },
  { id: 'ac-repair', name: 'AC Repair', nameHindi: 'AC मरम्मत', icon: 'snowflake', order: 6 },
  { id: 'tv-repair', name: 'TV Repair', nameHindi: 'TV मरम्मत', icon: 'tv', order: 7 },
  { id: 'washing-machine', name: 'Washing Machine', nameHindi: 'वाशिंग मशीन', icon: 'washing', order: 8 },
] as const;

export type CategoryId = typeof CATEGORIES[number]['id'];
