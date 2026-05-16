import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

export type JozuNotificationStats = {
  currentStreak: number;
  bestStreak: number;
  gamesPlayed: number;
  wins: number;
  winRate: number;
  averageGuesses: number;
  lastPlayedDate: string | null;
  completedToday: boolean;
  missedYesterday?: boolean;
};

type NotificationTimeOfDay = "morning" | "evening";

type StoredScheduleIds = {
  morning?: string;
  evening?: string;
};

const REMINDER_REQUESTED_KEY = "jozu_notifications_requested";
const REMINDER_SCHEDULE_IDS_KEY = "jozu_notifications_schedule_ids";
const EVENING_START_MINUTES = 17 * 60 + 55;
const EVENING_END_MINUTES = 21 * 60;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true
  })
});

function pickMessage(messages: string[], seed = Date.now()): string {
  return messages[Math.abs(Math.floor(seed)) % messages.length];
}

function getTodayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function getYesterdayKey(date = new Date()): string {
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  return getTodayKey(yesterday);
}

function nextEveningReminderDate(now = new Date()): Date {
  const reminderDate = new Date(now);
  const randomizedMinutes =
    EVENING_START_MINUTES +
    Math.floor(Math.random() * (EVENING_END_MINUTES - EVENING_START_MINUTES + 1));
  const hour = Math.floor(randomizedMinutes / 60);
  const minute = randomizedMinutes % 60;

  reminderDate.setHours(hour, minute, 0, 0);

  if (reminderDate <= now) {
    reminderDate.setDate(reminderDate.getDate() + 1);
  }

  return reminderDate;
}

async function loadScheduledNotificationIds(): Promise<StoredScheduleIds> {
  try {
    const rawValue = await AsyncStorage.getItem(REMINDER_SCHEDULE_IDS_KEY);
    return rawValue ? (JSON.parse(rawValue) as StoredScheduleIds) : {};
  } catch {
    return {};
  }
}

async function saveScheduledNotificationIds(ids: StoredScheduleIds): Promise<void> {
  await AsyncStorage.setItem(REMINDER_SCHEDULE_IDS_KEY, JSON.stringify(ids));
}

async function cancelStoredNotificationIds(): Promise<void> {
  const ids = await loadScheduledNotificationIds();

  await Promise.all(
    Object.values(ids)
      .filter((id): id is string => Boolean(id))
      .map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined))
  );

  await AsyncStorage.removeItem(REMINDER_SCHEDULE_IDS_KEY);
}

export async function hasRequestedJozuNotificationPermission(): Promise<boolean> {
  return AsyncStorage.getItem(REMINDER_REQUESTED_KEY).then((value) => value === "true");
}

export async function requestJozuNotificationPermission(): Promise<boolean> {
  await AsyncStorage.setItem(REMINDER_REQUESTED_KEY, "true");

  const currentPermissions = await Notifications.getPermissionsAsync();

  if (currentPermissions.granted) {
    return true;
  }

  const nextPermissions = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: false,
      allowSound: false
    }
  });

  return nextPermissions.granted;
}

export async function cancelDailyJozuNotifications(): Promise<void> {
  await cancelStoredNotificationIds();
}

export function buildJozuNotificationMessage(
  stats: JozuNotificationStats,
  timeOfDay: NotificationTimeOfDay
): string {
  const seed =
    stats.currentStreak * 17 +
    stats.bestStreak * 13 +
    stats.gamesPlayed * 7 +
    (timeOfDay === "morning" ? 3 : 11);

  if (stats.missedYesterday) {
    return pickMessage(["A fresh Jozu puzzle is ready.", "New day, new kana."], seed);
  }

  if (stats.gamesPlayed <= 1 || stats.currentStreak <= 0) {
    return pickMessage(
      [
        "Start today with one hiragana puzzle.",
        "Build your Japanese habit one word at a time.",
        "Today’s hiragana puzzle is ready."
      ],
      seed
    );
  }

  if (stats.currentStreak >= 3 && stats.currentStreak === stats.bestStreak) {
    return "You’re at your best streak. Ready to keep it going?";
  }

  if (stats.currentStreak >= 1 && stats.bestStreak > 1 && stats.currentStreak + 1 === stats.bestStreak) {
    return "One more solve could tie your best streak.";
  }

  if (stats.currentStreak >= 3) {
    return pickMessage(
      [
        `Your ${stats.currentStreak}-day Jozu streak is waiting.`,
        `Keep your ${stats.currentStreak}-day Japanese habit going.`,
        "One small word, one more step."
      ],
      seed
    );
  }

  return pickMessage(
    [
      "Today’s hiragana puzzle is ready.",
      "A little Japanese today?",
      "Ready for today’s kana?",
      "Keep your Japanese habit going.",
      "Small steps. Daily Japanese."
    ],
    seed
  );
}

export async function scheduleDailyJozuNotifications(
  stats: JozuNotificationStats
): Promise<void> {
  await cancelStoredNotificationIds();

  const morningId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Jozu",
      body: buildJozuNotificationMessage(stats, "morning")
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 11,
      minute: 11
    }
  });

  const nextIds: StoredScheduleIds = { morning: morningId };

  if (!stats.completedToday) {
    const eveningId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Jozu",
        body: buildJozuNotificationMessage(stats, "evening")
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: nextEveningReminderDate()
      }
    });

    nextIds.evening = eveningId;
  }

  await saveScheduledNotificationIds(nextIds);
}

export async function rescheduleJozuNotifications(stats: JozuNotificationStats): Promise<void> {
  await scheduleDailyJozuNotifications(stats);
}

export function buildNotificationStatsFromProgress(params: {
  currentStreak?: number;
  bestStreak?: number;
  gamesPlayed?: number;
  wins?: number;
  winRate?: number;
  averageGuesses?: number;
  lastPlayedDate?: string | null;
  completedToday?: boolean;
}): JozuNotificationStats {
  const yesterdayKey = getYesterdayKey();
  const lastPlayedDate = params.lastPlayedDate ?? null;

  return {
    currentStreak: params.currentStreak ?? 0,
    bestStreak: params.bestStreak ?? 0,
    gamesPlayed: params.gamesPlayed ?? 0,
    wins: params.wins ?? 0,
    winRate: params.winRate ?? 0,
    averageGuesses: params.averageGuesses ?? 0,
    lastPlayedDate,
    completedToday: params.completedToday ?? false,
    missedYesterday: Boolean(lastPlayedDate && lastPlayedDate !== yesterdayKey && lastPlayedDate !== getTodayKey())
  };
}
