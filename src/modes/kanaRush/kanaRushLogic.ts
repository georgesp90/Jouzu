import { KanaRushPosition, KanaRushSubmission, KanaRushTile } from "./types";
import { getWeightedRandomKana } from "./kanaWeights";

export const KANA_RUSH_SIZE = 8;
export const KANA_RUSH_START_SECONDS = 30;
export const KANA_RUSH_BOARD_THRESHOLDS: Record<number, number> = {
  8: 12,
  7: 8,
  6: 5,
  5: 3
};

export function getKanaRushBoardSizeForTime(seconds: number): number {
  if (seconds <= 5) {
    return 5;
  }

  if (seconds <= 12) {
    return 6;
  }

  if (seconds <= 20) {
    return 7;
  }

  return KANA_RUSH_SIZE;
}

export function getKanaRushMinWordsForBoardSize(size: number): number {
  return KANA_RUSH_BOARD_THRESHOLDS[size] ?? 3;
}

export function createKanaRushTile(row: number, col: number): KanaRushTile {
  return {
    id: `${Date.now()}-${row}-${col}-${Math.random().toString(36).slice(2)}`,
    kana: getWeightedRandomKana()
  };
}

export function createKanaRushBoard(size = KANA_RUSH_SIZE): KanaRushTile[][] {
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => createKanaRushTile(row, col))
  );
}

export function resizeKanaRushBoard(board: KanaRushTile[][], nextSize: number): KanaRushTile[][] {
  return Array.from({ length: nextSize }, (_, row) =>
    Array.from({ length: nextSize }, (_, col) => board[row]?.[col] ?? createKanaRushTile(row, col))
  );
}

export function positionKey(position: KanaRushPosition): string {
  return `${position.row}:${position.col}`;
}

export function replaceTiles(
  board: KanaRushTile[][],
  path: KanaRushPosition[]
): KanaRushTile[][] {
  const pathKeys = new Set(path.map((position) => positionKey(position)));

  return board.map((rowTiles, row) =>
    rowTiles.map((tile, col) => (pathKeys.has(positionKey({ row, col })) ? createKanaRushTile(row, col) : tile))
  );
}

export function isAdjacent(a: KanaRushPosition, b: KanaRushPosition): boolean {
  const rowDistance = Math.abs(a.row - b.row);
  const colDistance = Math.abs(a.col - b.col);

  return rowDistance <= 1 && colDistance <= 1 && rowDistance + colDistance > 0;
}

export function buildWordFromPath(board: KanaRushTile[][], path: KanaRushPosition[]): string {
  return path.map((position) => board[position.row]?.[position.col]?.kana ?? "").join("");
}

export function getScoreForLength(length: number): number {
  if (length === 2) {
    return 8;
  }

  if (length === 3) {
    return 32;
  }

  if (length === 4) {
    return 78;
  }

  return 130 + Math.max(0, length - 5) * 30;
}

export function getTimeBonusForLength(length: number): number {
  if (length === 2) {
    return 0.3;
  }

  if (length === 3) {
    return 1.6;
  }

  if (length === 4) {
    return 3.2;
  }

  return 5.5;
}

export function evaluateKanaRushSubmission({
  word,
  acceptedWords,
  foundWords,
  twoKanaStreak
}: {
  word: string;
  acceptedWords: Set<string>;
  foundWords: Set<string>;
  twoKanaStreak: number;
}): KanaRushSubmission {
  if (word.length < 2) {
    return {
      status: "tooShort",
      word,
      message: "Keep swiping",
      nextTwoKanaStreak: twoKanaStreak
    };
  }

  if (foundWords.has(word)) {
    return {
      status: "duplicate",
      word,
      message: "Already found",
      nextTwoKanaStreak: twoKanaStreak
    };
  }

  if (!acceptedWords.has(word)) {
    return {
      status: "invalid",
      word,
      message: "Not a word",
      nextTwoKanaStreak: twoKanaStreak
    };
  }

  const nextTwoKanaStreak = word.length === 2 ? twoKanaStreak + 1 : 0;
  const penalty = nextTwoKanaStreak >= 3 ? 4 : 0;
  const points = getScoreForLength(word.length);

  return {
    status: "valid",
    word,
    points,
    timeBonus: getTimeBonusForLength(word.length),
    penalty,
    message: penalty > 0 ? "Think bigger" : `+${points}`,
    nextTwoKanaStreak: penalty > 0 ? 0 : nextTwoKanaStreak
  };
}
