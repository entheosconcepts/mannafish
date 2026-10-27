// MannaFish's voices. The eleven built-in natural voices, and voice characters made from them with a way of speaking
// (Ken, 27 Oct: "more voice options ... some of them are just too close to each other ... deeper more mature voices", a Scottish
// accent, a classic Bible reader, and women's voices like them, one Southern). They are described only by how they sound:
// no character copies a real person's voice. An accent is asked for only in English; in other languages the character keeps
// its depth, age and pace.
export const BASE = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'nova', 'onyx', 'sage', 'shimmer', 'verse'];
const CHAR = {
  thunder: { v: 'onyx', how: 'Voice: a very deep, resonant bass, an older man with great gravity and authority. Slow, deliberate and grand; every word weighty, with full pauses at commas and full stops.' },
  narrator: { v: 'ash', how: 'Voice: a mature, rich baritone with crisp diction, reading Scripture like a seasoned stage actor: measured and dramatic, full of conviction, giving each phrase its weight.' },
  highland: { v: 'ballad', how: 'Voice: a distinguished older gentleman, warm, assured and unhurried, with a twinkle in it.', acc: ' He speaks with a rich, rolling Scottish accent.' },
  grace: { v: 'sage', how: 'Voice: a deep, low, mature woman\'s voice, a rich alto; calm, grounded and unhurried, like a wise grandmother reading by the fire.' },
  magnolia: { v: 'coral', how: 'Voice: a bright, warm, sweet woman\'s voice with a smile in it, friendly and full of heart.', acc: ' She speaks with a gentle Southern accent from the Tennessee mountains.' },
  heather: { v: 'shimmer', how: 'Voice: a warm, mature woman, gentle and steady.', acc: ' She speaks with a soft Scottish Highland accent.' },
};
export const ALL = [...BASE, ...Object.keys(CHAR)];
// the voice the speech service is asked for, and how the character speaks (added before the usual instructions)
export function speaker(id, lang, fallback = 'sage') {
  const c = CHAR[id];
  if (c) return { voice: c.v, style: c.how + (lang === 'en' && c.acc ? c.acc : '') + ' ' };
  return { voice: BASE.includes(id) ? id : fallback, style: '' };
}
