import AsyncStorage from "@react-native-async-storage/async-storage";
import { DailyProgress, WordMastery } from "@/types/game";

const STORAGE_KEY = "jozu_daily_progress";
const ROMAJI_STORAGE_KEY = "jozu_show_romaji";
const WORD_MASTERY_STORAGE_KEY = "jozu_word_mastery";
const PRACTICE_CATEGORY_STORAGE_KEY = "jozu_practice_category";
const DAILY_REMINDERS_STORAGE_KEY = "jozu_daily_reminders_enabled";

function userScopedKey(key: string, uid?: string | null): string {
  return uid ? `${key}:${uid}` : key;
}

export async function loadProgress(uid?: string | null): Promise<DailyProgress | null> {
  const rawProgress = await AsyncStorage.getItem(userScopedKey(STORAGE_KEY, uid));
  return rawProgress ? (JSON.parse(rawProgress) as DailyProgress) : null;
}

export async function saveProgress(progress: DailyProgress, uid?: string | null): Promise<void> {
  await AsyncStorage.setItem(userScopedKey(STORAGE_KEY, uid), JSON.stringify(progress));
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

export async function loadWordMastery(uid?: string | null): Promise<Record<string, WordMastery>> {
  const rawMastery = await AsyncStorage.getItem(userScopedKey(WORD_MASTERY_STORAGE_KEY, uid));
  return rawMastery ? (JSON.parse(rawMastery) as Record<string, WordMastery>) : {};
}

export async function saveWordMastery(
  masteryByWord: Record<string, WordMastery>,
  uid?: string | null
): Promise<void> {
  await AsyncStorage.setItem(userScopedKey(WORD_MASTERY_STORAGE_KEY, uid), JSON.stringify(masteryByWord));
}

export async function loadPracticeCategory(uid?: string | null): Promise<string | null> {
  return AsyncStorage.getItem(userScopedKey(PRACTICE_CATEGORY_STORAGE_KEY, uid));
}

export async function savePracticeCategory(category: string, uid?: string | null): Promise<void> {
  await AsyncStorage.setItem(userScopedKey(PRACTICE_CATEGORY_STORAGE_KEY, uid), category);
}

export async function loadDailyRemindersEnabled(): Promise<boolean> {
  return AsyncStorage.getItem(DAILY_REMINDERS_STORAGE_KEY).then((value) => value === "true");
}

export async function saveDailyRemindersEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(DAILY_REMINDERS_STORAGE_KEY, String(enabled));
}

export async function clearLocalJouzuData(uid?: string | null): Promise<void> {
  const keys = [
    STORAGE_KEY,
    ROMAJI_STORAGE_KEY,
    WORD_MASTERY_STORAGE_KEY,
    PRACTICE_CATEGORY_STORAGE_KEY,
    DAILY_REMINDERS_STORAGE_KEY
  ];

  if (uid) {
    keys.push(
      userScopedKey(STORAGE_KEY, uid),
      userScopedKey(WORD_MASTERY_STORAGE_KEY, uid),
      userScopedKey(PRACTICE_CATEGORY_STORAGE_KEY, uid)
    );
  }

  await AsyncStorage.multiRemove(keys);
}
