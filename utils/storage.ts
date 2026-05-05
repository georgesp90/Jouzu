import AsyncStorage from "@react-native-async-storage/async-storage";
import { DailyProgress, WordMastery } from "@/types/game";

const STORAGE_KEY = "jozu_daily_progress";
const ROMAJI_STORAGE_KEY = "jozu_show_romaji";
const WORD_MASTERY_STORAGE_KEY = "jozu_word_mastery";

export async function loadProgress(): Promise<DailyProgress | null> {
  const rawProgress = await AsyncStorage.getItem(STORAGE_KEY);
  return rawProgress ? (JSON.parse(rawProgress) as DailyProgress) : null;
}

export async function saveProgress(progress: DailyProgress): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export async function loadShowRomajiPreference(): Promise<boolean | null> {
  const rawPreference = await AsyncStorage.getItem(ROMAJI_STORAGE_KEY);

  if (rawPreference === null) {
    return null;
  }

  return rawPreference === "true";
}

export async function saveShowRomajiPreference(showRomaji: boolean): Promise<void> {
  await AsyncStorage.setItem(ROMAJI_STORAGE_KEY, String(showRomaji));
}

export async function loadWordMastery(): Promise<Record<string, WordMastery>> {
  const rawMastery = await AsyncStorage.getItem(WORD_MASTERY_STORAGE_KEY);
  return rawMastery ? (JSON.parse(rawMastery) as Record<string, WordMastery>) : {};
}

export async function saveWordMastery(masteryByWord: Record<string, WordMastery>): Promise<void> {
  await AsyncStorage.setItem(WORD_MASTERY_STORAGE_KEY, JSON.stringify(masteryByWord));
}
