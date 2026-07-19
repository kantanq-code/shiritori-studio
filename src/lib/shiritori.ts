import vocabRaw from "../data/vocab.json";

export type Level = "N5" | "N4" | "N3";
export type Word = { reading: string; kanji: string | null; level: Level; meaning: string };

const vocab: Word[] = (
  vocabRaw as { r: string; k: string | null; l: Level; m?: string }[]
).map((v) => ({ reading: v.r, kanji: v.k, level: v.l, meaning: v.m ?? "" }));

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

// Build index per level set. Key = sorted levels joined.
type LevelKey = string;
const startIndexByLevels = new Map<LevelKey, Map<string, Word[]>>();
const usableWordsByLevels = new Map<LevelKey, Word[]>();

const ALL_LEVELS: Level[] = ["N5", "N4", "N3"];

function levelsKey(levels: Level[]): LevelKey {
  return [...levels].sort().join(",");
}

function buildIndexFor(levels: Level[]) {
  const key = levelsKey(levels);
  if (startIndexByLevels.has(key)) return key;
  const set = new Set(levels);
  const idx = new Map<string, Word[]>();
  const usable: Word[] = [];
  for (const w of vocab) {
    if (!set.has(w.level)) continue;
    const norm = normalizeReading(w.reading);
    if (!norm) continue;
    if (norm.endsWith("ん")) continue;
    const first = norm.charAt(0);
    if (!idx.has(first)) idx.set(first, []);
    idx.get(first)!.push(w);
    usable.push(w);
  }
  startIndexByLevels.set(key, idx);
  usableWordsByLevels.set(key, usable);
  return key;
}

buildIndexFor(ALL_LEVELS);

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

function generateChain(
  length: number,
  maxAttempts: number,
  startChar: string | undefined,
  levels: Level[],
): Word[] | null {
  const key = buildIndexFor(levels);
  const startIndex = startIndexByLevels.get(key)!;
  const usableWords = usableWordsByLevels.get(key)!;
  if (usableWords.length === 0) return null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let firstWord: Word;
    if (startChar) {
      const pool = startIndex.get(startChar);
      if (!pool || pool.length === 0) return null;
      firstWord = pickRandom(pool);
    } else {
      firstWord = pickRandom(usableWords);
    }
    const chain: Word[] = [firstWord];
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

export function normalizeStartInput(raw: string): string | null {
  if (!raw) return null;
  const n = normalizeReading(raw.trim());
  if (!n) return null;
  return n.charAt(0);
}

export function hasWordsStartingWith(ch: string, levels: Level[] = ALL_LEVELS): boolean {
  const key = buildIndexFor(levels);
  const idx = startIndexByLevels.get(key)!;
  const p = idx.get(ch);
  return !!p && p.length > 0;
}

export function generateChains(
  count: number,
  chainLength = 6,
  startChar?: string,
  levels: Level[] = ALL_LEVELS,
): Word[][] {
  const effectiveLevels = levels.length > 0 ? levels : ALL_LEVELS;
  const chains: Word[][] = [];
  const seenChains = new Set<string>();
  let safety = 0;
  while (chains.length < count && safety < count * 50) {
    safety++;
    const c = generateChain(chainLength, 200, startChar, effectiveLevels);
    if (!c) {
      if (startChar) break;
      continue;
    }
    const sig = c.map(keyOf).join("→");
    if (seenChains.has(sig)) continue;
    seenChains.add(sig);
    chains.push(c);
  }
  return chains;
}
