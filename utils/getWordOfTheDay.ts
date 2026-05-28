import { WordEntry } from "@/types/game";

const WORD_SELECTION_START_DATE = "2026-01-01";
const PUZZLE_NUMBER_START_DATE = "2026-05-14";
const MS_PER_DAY = 86400000;
const DAILY_TIME_ZONE = "America/New_York";

function getDatePartsInDailyTimeZone(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: DAILY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day)
  };
}

function getDayIndex(dateKey: string, startDate = WORD_SELECTION_START_DATE): number {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
  const startUtc = Date.UTC(startYear, startMonth - 1, startDay);
  const dateUtc = Date.UTC(year, month - 1, day);

  return Math.floor((dateUtc - startUtc) / MS_PER_DAY);
}

export function getTodayKey(date = new Date()): string {
  const { year, month, day } = getDatePartsInDailyTimeZone(date);

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getPreviousDateKey(date: Date | string = new Date()): string {
  const todayKey = typeof date === "string" ? date : getTodayKey(date);
  const [year, month, day] = todayKey.split("-").map(Number);
  const previousDay = new Date(Date.UTC(year, month - 1, day) - MS_PER_DAY);

  return getTodayKey(previousDay);
}

export function getPuzzleNumber(date = new Date()): number {
  return Math.max(0, getDayIndex(getTodayKey(date), PUZZLE_NUMBER_START_DATE)) + 1;
}

export function formatPuzzleNumber(puzzleNumber: number): string {
  return String(puzzleNumber).padStart(3, "0");
}

export function getWordOfTheDay(words: WordEntry[], date = new Date()): WordEntry {
  if (words.length === 0) {
    throw new Error("Cannot choose a daily word from an empty word list.");
  }

  const diffDays = getDayIndex(getTodayKey(date));

  return words[Math.abs(diffDays) % words.length];
}
