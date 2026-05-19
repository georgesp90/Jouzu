import * as Haptics from "expo-haptics";

export type FeedbackEvent =
  | "kana"
  | "delete"
  | "submit"
  | "reveal"
  | "success"
  | "error"
  | "win"
  | "perfect";

const feedbackConfig = {
  hapticsEnabled: true,
  soundEnabled: false
};

export function setSoundEnabled(enabled: boolean) {
  feedbackConfig.soundEnabled = enabled;
}

export function setHapticsEnabled(enabled: boolean) {
  feedbackConfig.hapticsEnabled = enabled;
}

export async function playFeedbackSound(_event: FeedbackEvent) {
  if (!feedbackConfig.soundEnabled) {
    return;
  }

  // Future hook: load short Expo-compatible UI sounds here once assets are added.
  // Suggested folder: assets/sounds/kana-tap.mp3, submit.mp3, reveal-tick.mp3, win.mp3.
}

export async function playHapticFeedback(event: FeedbackEvent) {
  if (!feedbackConfig.hapticsEnabled) {
    return;
  }

  try {
    if (event === "win") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }

    if (event === "perfect") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }

    if (event === "submit") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return;
    }

    if (event === "error") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Haptics are best-effort. Some devices/simulators simply ignore them.
  }
}

export function playInteractionFeedback(event: FeedbackEvent) {
  void playHapticFeedback(event);
  void playFeedbackSound(event);
}
