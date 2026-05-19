import {
  KANA_RUSH_SIZE,
  createKanaRushBoard,
  createKanaRushTile,
  isAdjacent,
  positionKey
} from "./kanaRushLogic";
import { KanaRushPosition, KanaRushTile } from "./types";

export const KANA_RUSH_MIN_AVAILABLE_WORDS = 12;

type TrieNode = {
  children: Map<string, TrieNode>;
  word?: string;
};

export type KanaTrie = {
  root: TrieNode;
  maxDepth: number;
  words: string[];
};

type SolveOptions = {
  limit?: number;
};

export type KanaRushHintPath = {
  word: string;
  path: KanaRushPosition[];
};

type BoardGenerationOptions = {
  size: number;
  trie: KanaTrie;
  foundWords: Set<string>;
  threshold?: number;
  maxRetries?: number;
};

const BOARD_GENERATION_MAX_RETRIES = 14;
const BOARD_REPAIR_MAX_RETRIES = 10;
const BEGINNER_SEED_WORDS = [
  "ねこ",
  "いぬ",
  "いく",
  "くる",
  "みる",
  "よむ",
  "のむ",
  "かく",
  "きく",
  "いう",
  "かう",
  "ある",
  "いる",
  "する",
  "すし",
  "あそこ",
  "あたま",
  "あぶら",
  "いしゃ",
  "おかし",
  "おかね",
  "おなか",
  "おんな",
  "かぞく",
  "かばん",
  "かれし",
  "きいろ",
  "きって",
  "きのう",
  "きょう",
  "けむり",
  "こたえ",
  "ことば",
  "ことり",
  "こども",
  "さいふ",
  "さとう",
  "しごと",
  "たんご",
  "ちず",
  "つぎ",
  "つくえ",
  "てがみ",
  "てんき",
  "でぐち",
  "とけい",
  "となり",
  "なまえ",
  "にもつ",
  "にわ",
  "ねつ",
  "のど",
  "はじめ",
  "はれ",
  "ひとり",
  "へんじ",
  "まど",
  "まんが",
  "みぎ",
  "みせ",
  "みなみ",
  "みどり",
  "むし",
  "めがね",
  "もの",
  "もり",
  "やすい",
  "ゆめ",
  "よこ",
  "よてい",
  "りゆう",
  "れきし",
  "やま",
  "そら",
  "あめ",
  "うみ",
  "かわ",
  "はな",
  "ほし",
  "ゆき",
  "とり",
  "うし",
  "りす",
  "くつ",
  "ふく",
  "ほん",
  "いす",
  "かぎ",
  "はこ",
  "えき",
  "みせ",
  "へや",
  "まち",
  "みち",
  "うち",
  "くに",
  "あお",
  "あか",
  "しろ",
  "くろ",
  "いろ",
  "あさ",
  "よる",
  "なつ",
  "ふゆ",
  "はる",
  "いま",
  "きょう",
  "にく",
  "ごはん",
  "おちゃ",
  "りんご",
  "たまご",
  "さかな",
  "かお",
  "くち",
  "みみ",
  "あし",
  "うで",
  "ひと",
  "こども",
  "わたし",
  "すき",
  "げんき"
];

function createTrieNode(): TrieNode {
  return {
    children: new Map()
  };
}

function getKanaCharacters(word: string): string[] {
  return Array.from(word);
}

export function buildKanaTrie(words: Set<string> | string[]): KanaTrie {
  const root = createTrieNode();
  const playableWords = Array.from(words).filter((word) => getKanaCharacters(word).length >= 2);
  let maxDepth = 2;

  for (const word of playableWords) {
    let node = root;
    const characters = getKanaCharacters(word);
    maxDepth = Math.max(maxDepth, characters.length);

    for (const character of characters) {
      let child = node.children.get(character);

      if (!child) {
        child = createTrieNode();
        node.children.set(character, child);
      }

      node = child;
    }

    node.word = word;
  }

  return {
    root,
    maxDepth,
    words: playableWords
  };
}

export function hasKanaPrefix(trie: KanaTrie, prefix: string): boolean {
  let node = trie.root;

  for (const character of getKanaCharacters(prefix)) {
    const child = node.children.get(character);

    if (!child) {
      return false;
    }

    node = child;
  }

  return true;
}

export function hasKanaWord(trie: KanaTrie, word: string): boolean {
  let node = trie.root;

  for (const character of getKanaCharacters(word)) {
    const child = node.children.get(character);

    if (!child) {
      return false;
    }

    node = child;
  }

  return node.word === word;
}

function getNeighbors(position: KanaRushPosition, boardSize: number): KanaRushPosition[] {
  const neighbors: KanaRushPosition[] = [];

  for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
    for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
      if (rowOffset === 0 && colOffset === 0) {
        continue;
      }

      const row = position.row + rowOffset;
      const col = position.col + colOffset;

      if (row >= 0 && col >= 0 && row < boardSize && col < boardSize) {
        neighbors.push({ row, col });
      }
    }
  }

  return neighbors;
}

export function solveKanaRushBoard(
  board: KanaRushTile[][],
  trie: KanaTrie,
  foundWords: Set<string>,
  options: SolveOptions = {}
): string[] {
  const boardSize = board.length;
  const foundAvailableWords = new Set<string>();
  const visited = new Set<string>();
  const limit = options.limit ?? Number.POSITIVE_INFINITY;

  // Trie traversal keeps the DFS bounded: branches stop as soon as the current kana path
  // is not a valid prefix, so this only runs after board mutations rather than per swipe.
  const search = (position: KanaRushPosition, node: TrieNode, depth: number) => {
    if (foundAvailableWords.size >= limit || depth > trie.maxDepth) {
      return;
    }

    const tile = board[position.row]?.[position.col];
    const nextNode = tile ? node.children.get(tile.kana) : undefined;

    if (!nextNode) {
      return;
    }

    const key = positionKey(position);
    visited.add(key);

    if (nextNode.word && !foundWords.has(nextNode.word)) {
      foundAvailableWords.add(nextNode.word);
    }

    if (depth < trie.maxDepth) {
      for (const neighbor of getNeighbors(position, boardSize)) {
        if (!visited.has(positionKey(neighbor))) {
          search(neighbor, nextNode, depth + 1);

          if (foundAvailableWords.size >= limit) {
            break;
          }
        }
      }
    }

    visited.delete(key);
  };

  for (let row = 0; row < boardSize; row += 1) {
    for (let col = 0; col < boardSize; col += 1) {
      search({ row, col }, trie.root, 1);

      if (foundAvailableWords.size >= limit) {
        return Array.from(foundAvailableWords);
      }
    }
  }

  return Array.from(foundAvailableWords);
}

export function findValidWordsOnBoard(
  board: KanaRushTile[][],
  trie: KanaTrie,
  foundWords: Set<string>,
  options: SolveOptions = {}
): string[] {
  return solveKanaRushBoard(board, trie, foundWords, options);
}

export function findStarterCells(
  board: KanaRushTile[][],
  trie: KanaTrie,
  foundWords: Set<string>
): KanaRushPosition[] {
  const boardSize = board.length;
  const starterKeys = new Set<string>();
  const visited = new Set<string>();

  const search = (position: KanaRushPosition, node: TrieNode, depth: number): boolean => {
    if (depth > trie.maxDepth) {
      return false;
    }

    const tile = board[position.row]?.[position.col];
    const nextNode = tile ? node.children.get(tile.kana) : undefined;

    if (!nextNode) {
      return false;
    }

    const key = positionKey(position);
    visited.add(key);

    if (nextNode.word && !foundWords.has(nextNode.word)) {
      visited.delete(key);
      return true;
    }

    if (depth < trie.maxDepth) {
      for (const neighbor of getNeighbors(position, boardSize)) {
        if (!visited.has(positionKey(neighbor)) && search(neighbor, nextNode, depth + 1)) {
          visited.delete(key);
          return true;
        }
      }
    }

    visited.delete(key);
    return false;
  };

  for (let row = 0; row < boardSize; row += 1) {
    for (let col = 0; col < boardSize; col += 1) {
      const position = { row, col };

      if (search(position, trie.root, 1)) {
        starterKeys.add(positionKey(position));
      }
    }
  }

  return Array.from(starterKeys).map((key) => {
    const [row, col] = key.split(":").map(Number);
    return { row, col };
  });
}

export function findStarterPaths(
  board: KanaRushTile[][],
  trie: KanaTrie,
  foundWords: Set<string>,
  limit = 8
): KanaRushHintPath[] {
  const boardSize = board.length;
  const foundHintWords = new Set<string>();
  const hintPaths: KanaRushHintPath[] = [];
  const visited = new Set<string>();

  const search = (position: KanaRushPosition, node: TrieNode, path: KanaRushPosition[], depth: number) => {
    if (hintPaths.length >= limit * 3 || depth > trie.maxDepth) {
      return;
    }

    const tile = board[position.row]?.[position.col];
    const nextNode = tile ? node.children.get(tile.kana) : undefined;

    if (!nextNode) {
      return;
    }

    const key = positionKey(position);
    visited.add(key);
    const nextPath = [...path, position];

    if (nextNode.word && !foundWords.has(nextNode.word) && !foundHintWords.has(nextNode.word)) {
      foundHintWords.add(nextNode.word);
      hintPaths.push({ word: nextNode.word, path: nextPath });
    }

    if (depth < trie.maxDepth) {
      for (const neighbor of getNeighbors(position, boardSize)) {
        if (!visited.has(positionKey(neighbor))) {
          search(neighbor, nextNode, nextPath, depth + 1);
        }
      }
    }

    visited.delete(key);
  };

  for (let row = 0; row < boardSize; row += 1) {
    for (let col = 0; col < boardSize; col += 1) {
      search({ row, col }, trie.root, [], 1);
    }
  }

  return hintPaths
    .sort((a, b) => {
      const lengthDifference = a.path.length - b.path.length;

      if (lengthDifference !== 0) {
        return lengthDifference;
      }

      return positionKey(a.path[0]).localeCompare(positionKey(b.path[0]));
    })
    .slice(0, limit);
}

function cloneBoard(board: KanaRushTile[][]): KanaRushTile[][] {
  return board.map((row) => [...row]);
}

function replaceRandomTiles(board: KanaRushTile[][], replacementCount: number): KanaRushTile[][] {
  const boardSize = board.length;
  const repairedBoard = cloneBoard(board);
  const replacedPositions = new Set<string>();

  while (replacedPositions.size < replacementCount && replacedPositions.size < boardSize * boardSize) {
    const row = Math.floor(Math.random() * boardSize);
    const col = Math.floor(Math.random() * boardSize);
    const key = positionKey({ row, col });

    if (!replacedPositions.has(key)) {
      repairedBoard[row][col] = createKanaRushTile(row, col);
      replacedPositions.add(key);
    }
  }

  return repairedBoard;
}

function getPlayableWordCandidates(
  trie: KanaTrie,
  maxLength: number,
  excludedWords: Set<string> = new Set()
): string[] {
  return trie.words.filter((word) => getKanaCharacters(word).length <= maxLength && !excludedWords.has(word));
}

function getBeginnerSeedCandidates(
  trie: KanaTrie,
  boardSize: number,
  excludedWords: Set<string> = new Set()
): string[] {
  const maxSeedLength = Math.min(4, boardSize);
  const beginnerWords = BEGINNER_SEED_WORDS.filter(
    (word) => getKanaCharacters(word).length <= maxSeedLength && !excludedWords.has(word) && hasKanaWord(trie, word)
  );

  if (beginnerWords.length > 0) {
    return beginnerWords;
  }

  // Fallback keeps boards playable even if the accepted dictionary changes later.
  return getPlayableWordCandidates(trie, maxSeedLength, excludedWords).filter((word) => {
    const characters = getKanaCharacters(word);
    return characters.length <= 4 && !characters.some((character) => ["ゃ", "ゅ", "ょ", "っ", "ー"].includes(character));
  });
}

function getRandomPlayableWord(trie: KanaTrie, boardSize: number): string | null {
  const candidates = getBeginnerSeedCandidates(trie, boardSize);

  if (candidates.length === 0) {
    return null;
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

function getRandomAdjacentPath(
  boardSize: number,
  length: number,
  blockedPositions: Set<string> = new Set()
): KanaRushPosition[] | null {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const start = {
      row: Math.floor(Math.random() * boardSize),
      col: Math.floor(Math.random() * boardSize)
    };

    if (blockedPositions.has(positionKey(start))) {
      continue;
    }

    const path: KanaRushPosition[] = [start];

    while (path.length < length) {
      const lastPosition = path[path.length - 1];
      const unusedNeighbors = getNeighbors(lastPosition, boardSize).filter(
        (neighbor) =>
          isAdjacent(lastPosition, neighbor) &&
          !blockedPositions.has(positionKey(neighbor)) &&
          !path.some((position) => positionKey(position) === positionKey(neighbor))
      );

      if (unusedNeighbors.length === 0) {
        break;
      }

      path.push(unusedNeighbors[Math.floor(Math.random() * unusedNeighbors.length)]);
    }

    if (path.length === length) {
      return path;
    }
  }

  return null;
}

function getStraightAdjacentPath(
  boardSize: number,
  length: number,
  blockedPositions: Set<string> = new Set()
): KanaRushPosition[] | null {
  const directions = shufflePositions([
    { row: 0, col: 1 },
    { row: 1, col: 0 },
    { row: 1, col: 1 },
    { row: 1, col: -1 },
    { row: 0, col: -1 },
    { row: -1, col: 0 },
    { row: -1, col: -1 },
    { row: -1, col: 1 }
  ]);

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const start = {
      row: Math.floor(Math.random() * boardSize),
      col: Math.floor(Math.random() * boardSize)
    };

    for (const direction of directions) {
      const path = Array.from({ length }, (_, index) => ({
        row: start.row + direction.row * index,
        col: start.col + direction.col * index
      }));

      const isUsablePath = path.every(
        (position) =>
          position.row >= 0 &&
          position.col >= 0 &&
          position.row < boardSize &&
          position.col < boardSize &&
          !blockedPositions.has(positionKey(position))
      );

      if (isUsablePath) {
        return path;
      }
    }
  }

  return null;
}

function shuffleWords(words: string[]): string[] {
  const shuffled = [...words];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function shufflePositions<T>(positions: T[]): T[] {
  const shuffled = [...positions];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function createSeededTile(position: KanaRushPosition, kana: string): KanaRushTile {
  return {
    id: `${Date.now()}-${position.row}-${position.col}-${kana}-${Math.random().toString(36).slice(2)}`,
    kana
  };
}

function seedBoardWithKnownWord(board: KanaRushTile[][], trie: KanaTrie): KanaRushTile[][] {
  const word = getRandomPlayableWord(trie, board.length);

  if (!word) {
    return board;
  }

  const characters = getKanaCharacters(word);
  const path = getStraightAdjacentPath(board.length, characters.length) ?? getRandomAdjacentPath(board.length, characters.length);

  if (!path) {
    return board;
  }

  const seededBoard = cloneBoard(board);

  path.forEach((position, index) => {
    seededBoard[position.row][position.col] = createSeededTile(position, characters[index]);
  });

  return seededBoard;
}

function seedBoardWithKnownWords(
  board: KanaRushTile[][],
  trie: KanaTrie,
  targetWords: number,
  excludedWords: Set<string>
): KanaRushTile[][] {
  const seededBoard = cloneBoard(board);
  const occupiedPositions = new Set<string>();
  const candidates = shuffleWords(getBeginnerSeedCandidates(trie, board.length, excludedWords));
  let seededWordCount = 0;

  for (const word of candidates) {
    if (seededWordCount >= targetWords) {
      break;
    }

    const characters = getKanaCharacters(word);
    const path =
      getStraightAdjacentPath(board.length, characters.length, occupiedPositions) ??
      getRandomAdjacentPath(board.length, characters.length, occupiedPositions);

    if (!path) {
      continue;
    }

    path.forEach((position, index) => {
      occupiedPositions.add(positionKey(position));
      seededBoard[position.row][position.col] = createSeededTile(position, characters[index]);
    });
    seededWordCount += 1;
  }

  return seededWordCount > 0 ? seededBoard : seedBoardWithKnownWord(board, trie);
}

function getBeginnerSeedTarget(boardSize: number): number {
  if (boardSize >= 8) {
    return 5;
  }

  if (boardSize >= 7) {
    return 4;
  }

  if (boardSize >= 6) {
    return 3;
  }

  return 2;
}

export function boardHasEnoughWords(
  board: KanaRushTile[][],
  trie: KanaTrie,
  foundWords: Set<string>,
  threshold: number
): boolean {
  return (
    solveKanaRushBoard(board, trie, foundWords, {
      limit: threshold
    }).length >= threshold
  );
}

export function generateBoard({
  size,
  trie,
  foundWords,
  threshold = KANA_RUSH_MIN_AVAILABLE_WORDS,
  maxRetries = BOARD_GENERATION_MAX_RETRIES
}: BoardGenerationOptions): KanaRushTile[][] {
  let bestBoard = createKanaRushBoard(size);
  let bestCount = 0;

  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    const candidateBoard = seedBoardWithKnownWords(
      createKanaRushBoard(size),
      trie,
      getBeginnerSeedTarget(size),
      foundWords
    );
    const availableCount = solveKanaRushBoard(candidateBoard, trie, foundWords, { limit: threshold }).length;

    if (availableCount >= threshold) {
      return candidateBoard;
    }

    if (availableCount > bestCount) {
      bestBoard = candidateBoard;
      bestCount = availableCount;
    }
  }

  return bestCount > 0 ? bestBoard : seedBoardWithKnownWords(bestBoard, trie, getBeginnerSeedTarget(size), foundWords);
}

export function getKanaRushStarterPositions(
  board: KanaRushTile[][],
  trie: KanaTrie,
  foundWords: Set<string>
): KanaRushPosition[] {
  return findStarterCells(board, trie, foundWords);
}

export function generatePlayableBoard(
  size: number,
  trie: KanaTrie,
  foundWords: Set<string>,
  threshold = KANA_RUSH_MIN_AVAILABLE_WORDS
): KanaRushTile[][] {
  return generateBoard({ size, trie, foundWords, threshold });
}

export function repairBoardIfNeeded(
  board: KanaRushTile[][],
  trie: KanaTrie,
  foundWords: Set<string>,
  threshold = KANA_RUSH_MIN_AVAILABLE_WORDS
): KanaRushTile[][] {
  if (boardHasEnoughWords(board, trie, foundWords, threshold)) {
    return board;
  }

  // Repair small weak patches first. Full regeneration is the fallback, which avoids
  // presenting a dead board without paying that cost after every successful word.
  let repairedBoard = seedBoardWithKnownWords(board, trie, 3, foundWords);

  for (let attempt = 0; attempt < BOARD_REPAIR_MAX_RETRIES; attempt += 1) {
    if (boardHasEnoughWords(repairedBoard, trie, foundWords, threshold)) {
      return repairedBoard;
    }

    repairedBoard = seedBoardWithKnownWords(
      replaceRandomTiles(repairedBoard, 4 + Math.min(attempt, 6)),
      trie,
      3,
      foundWords
    );
  }

  return generateBoard({
    size: board.length || KANA_RUSH_SIZE,
    trie,
    foundWords,
    threshold
  });
}
