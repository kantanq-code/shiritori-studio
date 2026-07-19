import fs from "node:fs";

const SRC = "/mnt/user-uploads/21-tu-vung-N5-N3-full-alphabet.md";
const OUT = "src/data/vocab.json";

const text = fs.readFileSync(SRC, "utf8");
const lines = text.split(/\r?\n/);

let level = null;
const out = [];
// Line entry patterns:
//  - 会う（あう） — to meet
//  - あそこ — over there
//  - 足／脚（あし） — foot, leg
const entryRe = /^-\s+(.+?)\s+[—–-]\s*(.*)$/;

for (const raw of lines) {
  const line = raw.trimEnd();
  const lv = line.match(/^###\s+(N[345])\b/);
  if (lv) { level = lv[1]; continue; }
  if (line.startsWith("# ") || line.startsWith("## ")) {
    // section headers other than level — do not touch level
    continue;
  }
  if (!level) continue;
  const m = line.match(entryRe);
  if (!m) continue;
  const head = m[1].trim();
  const meaning = m[2].trim();
  // head is either "kanji（reading）" or just "reading"
  let reading, kanji = null;
  const km = head.match(/^(.+?)（(.+?)）\s*\*?†?\s*$/);
  if (km) {
    kanji = km[1].trim().replace(/[\*†]+\s*$/, "");
    reading = km[2].trim();
  } else {
    reading = head.replace(/[\*†]+\s*$/, "").trim();
  }
  // Strip markers from meaning start
  const mClean = meaning.replace(/\s*[\*†]+\s*$/, "").trim();
  out.push({ r: reading, k: kanji, l: level, m: mClean });
}

fs.mkdirSync("src/data", { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out));
console.log(`Wrote ${out.length} entries to ${OUT}`);
console.log("Sample:", out.slice(0, 3));
console.log("With meaning:", out.filter(x => x.m).length);
console.log("Empty meaning:", out.filter(x => !x.m).length);
