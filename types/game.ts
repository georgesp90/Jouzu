export type JLPTLevel = "N5" | "N4" | "N3";

export type WordEntry = {
  id: string;
  hiragana: string;
  romaji: string;
  english: string;
  category: string;
  definition: string;
  jlpt: JLPTLevel;
  hintEmoji?: string;
};

export type TileStatus = "correct" | "present" | "absent" | "empty";

export type DailyProgress = {
  date: string;
  wordId: string;
  guesses: string[];
  results: TileStatus[][];
  solved: boolean;
  completed: boolean;
};

export type DailyPuzzle = {
  date: string;
  word: WordEntry;
  jlptLevel: JLPTLevel;
};

export type WordMastery = {
  wordId: string;
  masteryLevel: number;
  lastResult: "correct" | "incorrect";
  lastSeen: number;
};
