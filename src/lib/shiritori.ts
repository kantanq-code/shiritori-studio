import vocabRaw from "../data/vocab.json";

export type Level = "N5" | "N4" | "N3";
export type Word = { reading: string; kanji: string | null; level: Level };

const vocab: Word[] = (vocabRaw as { r: string; k: string | null; l: Level }[]).map(
  (v) => ({ reading: v.r, kanji: v.k, level: v.l }),
);

// Katakana → Hiragana
function kataToHira(s: string): string {
  let out = "";
  for (const ch of s) {
    const code = ch.charCodeAt(0);
    if (code >= 0x30a1 && code <= 0x30f6) out += String.fromCharCode(code - 0x60);
    else out += ch;
  }
  return out;
}

// Small kana → large
const SMALL_MAP: Record<string, string> = {
  ゃ: "や", ゅ: "ゆ", ょ: "よ", っ: "つ",
  ぁ: "あ", ぃ: "い", ぅ: "う", ぇ: "え", ぉ: "お",
  ゎ: "わ",
};

// vowel of a hiragana char (rough)
function vowelOf(ch: string): string | null {
  const table: Record<string, string> = {
    あ: "あ", い: "い", う: "う", え: "え", お: "お",
  };
  if (table[ch]) return table[ch];
  // map by column
  const groups: Record<string, string> = {
    "かがさざただなはばぱまやらわ": "あ",
    "きぎしじちぢにひびぴみり": "い",
    "くぐすずつづぬふぶぷむゆる": "う",
    "けげせぜてでねへべぺめれ": "え",
    "こごそぞとどのほぼぽもよろを": "お",
  };
  for (const [k, v] of Object.entries(groups)) if (k.includes(ch)) return v;
  return null;
}

function normalizeReading(raw: string): string {
  const h = kataToHira(raw);
  const chars = [...h];
  const out: string[] = [];
  for (let i = 0; i < chars.length; i++) {
    let c = chars[i];
    if (c === "ー") {
      const prev = out[out.length - 1];
      const v = prev ? vowelOf(prev) : null;
      if (v) out.push(v);
      continue;
    }
    if (SMALL_MAP[c]) c = SMALL_MAP[c];
    out.push(c);
  }
  return out.join("");
}

function firstChar(w: Word): string {
  return normalizeReading(w.reading).charAt(0);
}
function lastChar(w: Word): string {
  const n = normalizeReading(w.reading);
  return n.charAt(n.length - 1);
}

// Build index: char → words starting with that char
const startIndex = new Map<string, Word[]>();
const usableWords: Word[] = [];
for (const w of vocab) {
  const norm = normalizeReading(w.reading);
  if (!norm) continue;
  if (norm.endsWith("ん")) {
    // still add to index as starter, but exclude from chain because ends with ん
    // We include it as starter only if it doesn't end with ん — skip entirely.
    continue;
  }
  const first = norm.charAt(0);
  if (!startIndex.has(first)) startIndex.set(first, []);
  startIndex.get(first)!.push(w);
  usableWords.push(w);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Generate one chain of `length` words
function generateChain(length: number, maxAttempts = 200): Word[] | null {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const chain: Word[] = [pickRandom(usableWords)];
    const usedKeys = new Set<string>([keyOf(chain[0])]);
    let ok = true;
    for (let i = 1; i < length; i++) {
      const need = lastChar(chain[i - 1]);
      const candidates = startIndex.get(need);
      if (!candidates || candidates.length === 0) { ok = false; break; }
      const shuffled = shuffleInPlace(candidates.slice());
      let picked: Word | null = null;
      for (const c of shuffled) {
        if (!usedKeys.has(keyOf(c))) { picked = c; break; }
      }
      if (!picked) { ok = false; break; }
      chain.push(picked);
      usedKeys.add(keyOf(picked));
    }
    if (ok) return chain;
  }
  return null;
}

function keyOf(w: Word): string {
  return `${w.reading}|${w.kanji ?? ""}`;
}

export function generateChains(count: number, chainLength = 6): Word[][] {
  const chains: Word[][] = [];
  const seenChains = new Set<string>();
  let safety = 0;
  while (chains.length < count && safety < count * 50) {
    safety++;
    const c = generateChain(chainLength);
    if (!c) continue;
    const sig = c.map(keyOf).join("→");
    if (seenChains.has(sig)) continue;
    seenChains.add(sig);
    chains.push(c);
  }
  return chains;
}
