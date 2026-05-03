import AsyncStorage from "@react-native-async-storage/async-storage";
import { DailyProgress } from "@/types/game";

const STORAGE_KEY = "jozu_daily_progress";

export async function loadProgress(): Promise<DailyProgress | null> {
  const rawProgress = await AsyncStorage.getItem(STORAGE_KEY);
  return rawProgress ? (JSON.parse(rawProgress) as DailyProgress) : null;
}

export async function saveProgress(progress: DailyProgress): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}
