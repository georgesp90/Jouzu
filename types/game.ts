export type JLPTLevel = "N5" | "N4" | "N3";

export type WordEntry = {
  id: string;
  hiragana: string;
  romaji: string;
  english: string;
  category: string;
  definition: string;
  jlpt: JLPTLevel;
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
