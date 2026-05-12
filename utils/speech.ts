import * as Speech from "expo-speech";

const JAPANESE_TEXT_PATTERN = /[\u3040-\u30ff\u3400-\u9fff]/;

export async function stopSpeech(): Promise<void> {
  try {
    await Speech.stop();
  } catch (error) {
    console.warn("Speech stop failed.", error);
  }
}

export async function speakJapanese(text: string): Promise<void> {
  const trimmedText = text.trim();

  if (!trimmedText || !JAPANESE_TEXT_PATTERN.test(trimmedText)) {
    return;
  }

  try {
    await Speech.stop();
    Speech.speak(trimmedText, {
      language: "ja-JP",
      rate: 0.72,
      pitch: 1
    });
  } catch (error) {
    console.warn("Japanese speech playback failed.", error);
  }
}
