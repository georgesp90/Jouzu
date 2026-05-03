import { WordEntry } from "@/types/game";

const START_DATE = "2026-01-01";
const MS_PER_DAY = 86400000;

export function getTodayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function getPuzzleNumber(date = new Date()): number {
  const start = new Date(`${START_DATE}T00:00:00`);
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const todayUtc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((todayUtc - startUtc) / MS_PER_DAY) + 1;
}

export function getWordOfTheDay(words: WordEntry[], date = new Date()): WordEntry {
  if (words.length === 0) {
    throw new Error("Cannot choose a daily word from an empty word list.");
  }

  const start = new Date(`${START_DATE}T00:00:00`);
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const todayUtc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((todayUtc - startUtc) / MS_PER_DAY);

  return words[Math.abs(diffDays) % words.length];
}
