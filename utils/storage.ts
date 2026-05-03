import AsyncStorage from "@react-native-async-storage/async-storage";
import { DailyProgress } from "@/types/game";

const STORAGE_KEY = "jozu_daily_progress";
const ROMAJI_STORAGE_KEY = "jozu_show_romaji";

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
