import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  generateChains,
  hasWordsStartingWith,
  normalizeStartInput,
  type Word,
} from "@/lib/shiritori";

type Level = Word["level"];
const ALL_LEVELS: Level[] = ["N5", "N4", "N3"];

export const Route = createFileRoute("/")({
  component: Index,
});

const LEVEL_STYLES: Record<Word["level"], string> = {
  N5: "bg-[#e6efe3] text-[#4a6a3f] border-[#c9d8c1]",
  N4: "bg-[#f3ead1] text-[#7a5f1f] border-[#e2d5a8]",
  N3: "bg-[#f1dcd6] text-[#8a3f2f] border-[#e0bfb5]",
};

function WordBlock({ word }: { word: Word }) {
  return (
    <div className="flex flex-col items-center gap-1.5 min-w-0">
      <span
        className={`px-2 py-0.5 text-[10px] font-semibold tracking-wider rounded-sm border ${LEVEL_STYLES[word.level]}`}
      >
        {word.level}
      </span>
      <span
        className="text-2xl md:text-3xl leading-tight text-[#2a2622] whitespace-nowrap"
        style={{ fontFamily: "'Shippori Mincho', serif" }}
      >
        {word.reading}
      </span>
      <span className="text-xs md:text-sm text-[#8a8378] min-h-[1.1em] whitespace-nowrap">
        {word.kanji ?? "\u00A0"}
      </span>
    </div>
  );
}

function ChainRow({ chain }: { chain: Word[] }) {
  return (
    <div className="rounded-md border border-[#e6dfd2] bg-[#fdfaf2] px-4 py-5 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-2 md:gap-3 overflow-x-auto">
        {chain.map((w, i) => (
          <div key={i} className="flex items-center gap-2 md:gap-3">
            <WordBlock word={w} />
            {i < chain.length - 1 && (
              <span className="text-[#c7bda9] text-xl select-none">→</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Index() {
  const [chains, setChains] = useState<Word[][]>([]);
  const [startInput, setStartInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedLevels, setSelectedLevels] = useState<Level[]>(ALL_LEVELS);

  const toggleLevel = (lv: Level) => {
    setSelectedLevels((prev) => {
      const has = prev.includes(lv);
      if (has) {
        if (prev.length === 1) return prev; // keep at least one
        return prev.filter((l) => l !== lv);
      }
      return [...prev, lv];
    });
  };

  const shuffle = useCallback(() => {
    setError(null);
    setChains(generateChains(10, 6, undefined, selectedLevels));
  }, [selectedLevels]);

  const generateWithStart = useCallback(() => {
    const ch = normalizeStartInput(startInput);
    if (!ch) {
      setError("開始文字を入力してください。");
      return;
    }
    if (!hasWordsStartingWith(ch, selectedLevels)) {
      setError(`「${ch}」で始まる語彙が選択レベルに見つかりません。`);
      return;
    }
    setError(null);
    setChains(generateChains(10, 6, ch, selectedLevels));
  }, [startInput, selectedLevels]);

  useEffect(() => {
    shuffle();
  }, [shuffle]);

  const hasStart = !!normalizeStartInput(startInput);

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "#faf6ec",
        fontFamily: "'Zen Kaku Gothic New', sans-serif",
      }}
    >
      <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
        <header className="flex flex-col gap-4 mb-6 md:mb-10 border-b border-[#e6dfd2] pb-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1
                className="text-3xl md:text-4xl text-[#2a2622] tracking-wide"
                style={{ fontFamily: "'Shippori Mincho', serif" }}
              >
                しりとり
              </h1>
              <p className="text-xs md:text-sm text-[#8a8378] mt-1">
                N5〜N3 語彙 · 10 本 × 6 語
              </p>
            </div>
            <button
              onClick={shuffle}
              className="px-4 py-2 md:px-5 md:py-2.5 text-sm md:text-base rounded-sm border border-[#2a2622] bg-[#2a2622] text-[#faf6ec] hover:bg-[#3d3830] transition-colors"
              style={{ fontFamily: "'Shippori Mincho', serif" }}
            >
              シャッフル
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <span
              className="text-xs md:text-sm text-[#6b6459]"
              style={{ fontFamily: "'Shippori Mincho', serif" }}
            >
              レベル：
            </span>
            {ALL_LEVELS.map((lv) => {
              const active = selectedLevels.includes(lv);
              return (
                <button
                  key={lv}
                  type="button"
                  onClick={() => toggleLevel(lv)}
                  className={`px-3 py-1.5 text-xs md:text-sm rounded-sm border transition-colors ${
                    active
                      ? "border-[#2a2622] bg-[#2a2622] text-[#faf6ec]"
                      : "border-[#c7bda9] bg-transparent text-[#6b6459] hover:bg-[#f0e9d8]"
                  }`}
                  style={{ fontFamily: "'Shippori Mincho', serif" }}
                >
                  {lv}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <label
              htmlFor="start-char"
              className="text-xs md:text-sm text-[#6b6459]"
              style={{ fontFamily: "'Shippori Mincho', serif" }}
            >
              開始文字：
            </label>
            <input
              id="start-char"
              value={startInput}
              onChange={(e) => setStartInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") generateWithStart();
              }}
              placeholder="例: か"
              maxLength={4}
              className="w-24 px-3 py-2 text-base rounded-sm border border-[#c7bda9] bg-[#fdfaf2] text-[#2a2622] focus:outline-none focus:border-[#2a2622]"
              style={{ fontFamily: "'Shippori Mincho', serif" }}
            />
            <button
              onClick={generateWithStart}
              disabled={!hasStart}
              className="px-4 py-2 text-sm md:text-base rounded-sm border border-[#2a2622] bg-[#fdfaf2] text-[#2a2622] hover:bg-[#f0e9d8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              style={{ fontFamily: "'Shippori Mincho', serif" }}
            >
              この文字で生成
            </button>
            <button
              onClick={generateWithStart}
              disabled={!hasStart}
              className="px-4 py-2 text-sm md:text-base rounded-sm border border-[#c7bda9] bg-transparent text-[#2a2622] hover:bg-[#f0e9d8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              style={{ fontFamily: "'Shippori Mincho', serif" }}
            >
              別の10本に変える
            </button>
            {error && (
              <span className="text-xs md:text-sm text-[#8a3f2f]">{error}</span>
            )}
          </div>
        </header>

        <main className="grid grid-cols-1 gap-3 md:gap-4">
          {chains.length === 0 ? (
            <p className="text-center text-[#8a8378] py-12">
              {error ? "　" : "生成中…"}
            </p>
          ) : (
            chains.map((c, i) => <ChainRow key={i} chain={c} />)
          )}
        </main>

        <footer className="mt-10 text-center text-xs text-[#a89f8f]">
          しりとりの規則：末尾の音＝先頭の音、「ん」で終わる語は除外。
        </footer>
      </div>
    </div>
  );
}
