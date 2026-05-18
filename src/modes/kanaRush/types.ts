export type KanaRushTile = {
  id: string;
  kana: string;
};

export type KanaRushPosition = {
  row: number;
  col: number;
};

export type KanaRushSubmission =
  | {
      status: "valid";
      word: string;
      points: number;
      timeBonus: number;
      penalty: number;
      message: string;
      nextTwoKanaStreak: number;
    }
  | {
      status: "invalid" | "duplicate" | "tooShort";
      word: string;
      message: string;
      nextTwoKanaStreak: number;
    };
