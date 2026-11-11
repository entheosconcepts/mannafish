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
  // really deep voices (Ken, 6 Nov: "deeper, way deeper than what we have"): the lowest built-in voice, with the recording itself lowered in
  // pitch on the server (p = how far: 0.70 is about six notes lower). Spoken briskly first so they end at a natural pace.
  titan: { v: 'onyx', p: 0.86, how: 'Voice: a colossal, very deep bass, an ancient giant of a man; slow-burning authority and calm. Speak at a brisk, steady pace with short pauses, as every word will be slowed and lowered afterwards.' },
  abyss: { v: 'onyx', p: 0.78, how: 'Voice: a cavernous, thunderous bass from the bottom of the sea, vast and solemn, like a voice in an enormous stone hall. Speak at a brisk, steady pace with short pauses, as every word will be slowed and lowered afterwards.' },
  bedrock: { v: 'onyx', p: 0.7, how: 'Voice: the lowest, heaviest bass imaginable, like the voice of the mountain itself, weighty and unshakable. Speak at a quick, steady pace with very short pauses, as every word will be slowed and lowered afterwards.' },
  canyon: { v: 'sage', p: 0.86, how: 'Voice: a very deep, dark, velvety woman\'s voice, the lowest contralto, calm and powerful. Speak at a brisk, steady pace with short pauses, as every word will be slowed and lowered afterwards.' },
  // whispery voices (Ken, 6 Nov: "speaking quietly as to not wake anyone up")
  hush: { v: 'shimmer', how: 'Voice: a true whisper, as quiet as possible so as not to wake anyone, a soft breathy woman speaking close to the ear; gentle and calm, every word clear but hushed.' },
  murmur: { v: 'echo', how: 'Voice: a gentle man whispering softly in a dark quiet room so as not to wake anyone; breathy, kind and steady, words clear but barely above a whisper.' },
  lullaby: { v: 'coral', how: 'Voice: a tender, sleepy whisper, like a mother softly reading a bedtime story to a child who is almost asleep; slow, warm and very quiet.' },
  midnight: { v: 'onyx', how: 'Voice: a deep, low whisper, a calm man speaking very quietly in the middle of the night so as not to wake anyone; breathy and warm, words clear but hushed.' },
  // more characters (Ken, 6 Nov: "give me more of your own AI generated voices"); described only by how they sound, never as a real person
  elder: { v: 'onyx', how: 'Voice: a very old, wise grandfather\'s voice, low and a little gravelly, slow and tender, with long kind pauses; every line spoken like a blessing.' },
  pastor: { v: 'echo', how: 'Voice: a warm, steady, middle-aged pastor, kind and encouraging, speaking from the heart like a friend across the table; natural and unhurried, with gentle emphasis.' },
  scholar: { v: 'ash', how: 'Voice: a refined, thoughtful professor, crisp and clear, measured and precise but warm, reading with quiet authority.', acc: ' He speaks with a polished British accent.' },
  campfire: { v: 'echo', how: 'Voice: an intimate, low, close-up storyteller speaking softly as around a campfire at night; hushed and warm, drawing the listener in.' },
  herald: { v: 'onyx', how: 'Voice: a bold, ringing herald proclaiming good news in the town square: strong, bright projection, vigorous and joyful, every line announced.' },
  prophet: { v: 'onyx', how: 'Voice: an intense, fervent voice full of holy urgency; passionate, rising and falling, with deep conviction, never shouting but burning.' },
  cowboy: { v: 'ash', how: 'Voice: a relaxed, weathered ranch hand, easygoing and sincere, slow and warm.', acc: ' He speaks with a warm Texas drawl.' },
  bard: { v: 'ballad', how: 'Voice: a gentle poet-singer, lyrical and musical, speaking each line with a lilt and heart.', acc: ' He speaks with a soft Irish accent.' },
  dove: { v: 'shimmer', how: 'Voice: a very soft, gentle, peaceful woman\'s voice, calm and tender like a lullaby, almost a whisper but always clear.' },
  rose: { v: 'coral', how: 'Voice: a warm, cultured, motherly woman, kind and gracious, like a friend pouring tea.', acc: ' She speaks with a gentle British accent.' },
  deborah: { v: 'sage', how: 'Voice: a strong, confident, commanding woman\'s voice, a rich alto with leadership and courage; clear, decisive and encouraging.' },
  lily: { v: 'nova', how: 'Voice: a bright, sweet, young woman\'s voice, cheerful and sincere, full of wonder and joy.' },
  hannah: { v: 'coral', how: 'Voice: a gentle, prayerful woman\'s voice, hushed and heartfelt, like praying quietly beside you.' },
  // expressive, enthusiastic voices (Ken, 8 Nov: "a few voice options that have inflection ... a little more enthusiasm"); described only by how they sound
  sunrise: { v: 'nova', how: 'Voice: an upbeat, enthusiastic morning host: bright and energetic with big, natural inflection. The pitch rises and falls freely and is never flat or monotone; smiling, excited to share good news, with lively emphasis on the important words.' },
  sparkle: { v: 'coral', how: 'Voice: a bright, lively woman, full of expression and warmth. Wide, musical inflection, a smile and a little laugh in the voice, enthusiastic and sincere, emphasising the words that matter.' },
  rally: { v: 'echo', how: 'Voice: an energetic, encouraging man, like a great youth leader cheering people on. Dynamic, expressive inflection, rising with excitement, warm and sincere, never flat.' },
  jubilee: { v: 'ash', how: 'Voice: a joyful, bold man full of praise and celebration. Big, expressive inflection and energy, each line lifted with gladness, strong and warm, never monotone.' },
  tale: { v: 'fable', how: 'Voice: a gifted storyteller with a wide pitch range and dramatic, natural inflection. Vivid and animated, bringing every line to life with feeling and good timing, lightly enthusiastic.' },
  awe: { v: 'verse', how: 'Voice: a warm voice full of wonder and delight, as if discovering something wonderful. Lively, varied inflection, enthusiastic but gentle, with sincere emphasis and a little awe.' },
  erin: { v: 'shimmer', how: 'Voice: a warm, musical woman, friendly and bright with a smile in her voice.', acc: ' She speaks with a soft Irish accent.' },
};
export const ALL = [...BASE, ...Object.keys(CHAR)];
// the voice the speech service is asked for, and how the character speaks (added before the usual instructions)
export function speaker(id, lang, fallback = 'sage') {
  const c = CHAR[id];
  if (c) return { voice: c.v, style: c.how + (lang === 'en' && c.acc ? c.acc : '') + ' ', pitch: c.p || 0 };
  return { voice: BASE.includes(id) ? id : fallback, style: '', pitch: 0 };
}
// what each voice is called and sounds like, for the voice lists (the site's pickers, and /api/say?list=1 for Ken's other sites)
export const LABELS = {
  thunder: ['Thunder', 'very deep, grand'], narrator: ['Narrator', 'classic Bible reader'], highland: ['Highlander', 'Scottish gentleman'],
  onyx: ['Onyx', 'deep'], ash: ['Ash', 'gentle'], fable: ['Fable', 'storyteller'], grace: ['Grace', 'deep, mature woman'], magnolia: ['Magnolia', 'sweet Southern woman'],
  heather: ['Heather', 'Scottish lady'], sage: ['Sage', 'calm'], coral: ['Coral', 'warm'], ballad: ['Ballad', 'expressive'],
  elder: ['Elder', 'wise grandfather, a little gravelly'],
  pastor: ['Pastor', 'warm, kind, middle-aged'],
  scholar: ['Scholar', 'refined British professor'],
  campfire: ['Campfire', 'close, hushed storyteller'],
  herald: ['Herald', 'bold, ringing, joyful'],
  prophet: ['Prophet', 'fervent, passionate'],
  cowboy: ['Cowboy', 'easygoing Texan'],
  bard: ['Bard', 'lyrical Irish poet'],
  dove: ['Dove', 'soft, peaceful whisper'],
  rose: ['Rose', 'gracious British lady'],
  deborah: ['Deborah', 'strong, commanding woman'],
  lily: ['Lily', 'bright, young, joyful'],
  hannah: ['Hannah', 'prayerful, hushed'],
  erin: ['Erin', 'musical Irish lady'],
  sunrise: ['Sunrise', 'upbeat, enthusiastic host'],
  sparkle: ['Sparkle', 'bright, lively, very expressive'],
  rally: ['Rally', 'energetic, encouraging man'],
  jubilee: ['Jubilee', 'joyful, bold, full of praise'],
  tale: ['Tale', 'expressive storyteller'],
  awe: ['Awe', 'full of wonder, lively'],
  titan: ['Titan', 'colossal, the deepest bass'],
  abyss: ['Abyss', 'cavernous, far deeper'],
  bedrock: ['Bedrock', 'the deepest of all'],
  canyon: ['Canyon', 'the lowest, velvety woman'],
  hush: ['Hush', 'a true whisper, soft woman'],
  murmur: ['Murmur', 'quiet, gentle whisper'],
  lullaby: ['Lullaby', 'sleepy, tender whisper'],
  midnight: ['Midnight', 'deep, hushed whisper'],
  alloy: ['Alloy', 'clear, neutral'], echo: ['Echo', 'bright'], nova: ['Nova', 'lively'], shimmer: ['Shimmer', 'soft, clear woman'], verse: ['Verse', 'friendly'],
};

// raw 16-bit mono sound (what the voice service gives as 'pcm' at 24 kHz) as a WAV file declared at a lower rate: it plays lower and slower,
// which is how the really deep voices are made. A little quiet is added after it so a phone does not clip the last sound.
export function wavAt(pcm, rate) {
  const data = Buffer.concat([Buffer.from(pcm), Buffer.alloc(Math.round(rate * 0.3) * 2)]), h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

// Ken, 12 Nov: "too many options, many sound too similar ... narrow them down to about 20 with a very clear distinction". These 20 are what the pickers and /api/say?list=1 offer; any other voice name saved earlier still plays.
export const FEATURED = ['thunder', 'titan', 'elder', 'narrator', 'pastor', 'herald', 'prophet', 'rally', 'jubilee', 'tale', 'awe', 'cowboy', 'grace', 'canyon', 'deborah', 'magnolia', 'sunrise', 'sparkle', 'shimmer', 'alloy'];
