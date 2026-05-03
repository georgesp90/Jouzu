import { wordPools } from "@/data/words";
import { DailyPuzzle, JLPTLevel, WordEntry } from "@/types/game";
import { getTodayKey } from "@/utils/getWordOfTheDay";

const LEVEL_WEIGHTS: Array<{ level: JLPTLevel; threshold: number }> = [
  { level: "N5", threshold: 0.7 },
  { level: "N4", threshold: 0.9 },
  { level: "N3", threshold: 1 }
];

function hashString(value: string): number {
  let hash = 2166136261;

  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function seededRandom(seed: string): number {
  return hashString(seed) / 0xffffffff;
}

export function selectWeightedJLPTLevel(randomValue: number): JLPTLevel {
  return LEVEL_WEIGHTS.find(({ threshold }) => randomValue < threshold)?.level ?? "N5";
}

function selectWordFromPool(pool: WordEntry[], seed: string): WordEntry {
  if (pool.length === 0) {
    throw new Error("Cannot select a daily puzzle from an empty word pool.");
  }

  const randomValue = seededRandom(seed);
  const wordIndex = Math.floor(randomValue * pool.length) % pool.length;
  return pool[wordIndex];
}

export function getDailyPuzzle(date = new Date()): DailyPuzzle {
  const dateKey = getTodayKey(date);
  const levelRandom = seededRandom(`${dateKey}:jlpt-level`);
  const selectedLevel = selectWeightedJLPTLevel(levelRandom);
  const selectedPool = wordPools[selectedLevel].length > 0 ? wordPools[selectedLevel] : wordPools.N5;
  const fallbackLevel = wordPools[selectedLevel].length > 0 ? selectedLevel : "N5";

  return {
    date: dateKey,
    word: selectWordFromPool(selectedPool, `${dateKey}:${fallbackLevel}:word`),
    jlptLevel: fallbackLevel
  };
}
