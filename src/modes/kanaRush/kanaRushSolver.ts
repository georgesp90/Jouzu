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

function getRandomPlayableWord(trie: KanaTrie, boardSize: number): string | null {
  const candidates = getPlayableWordCandidates(trie, boardSize);

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

function shuffleWords(words: string[]): string[] {
  const shuffled = [...words];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function seedBoardWithKnownWord(board: KanaRushTile[][], trie: KanaTrie): KanaRushTile[][] {
  const word = getRandomPlayableWord(trie, board.length);

  if (!word) {
    return board;
  }

  const characters = getKanaCharacters(word);
  const path = getRandomAdjacentPath(board.length, characters.length);

  if (!path) {
    return board;
  }

  const seededBoard = cloneBoard(board);

  path.forEach((position, index) => {
    seededBoard[position.row][position.col] = {
      id: `${Date.now()}-${position.row}-${position.col}-${characters[index]}-${Math.random()
        .toString(36)
        .slice(2)}`,
      kana: characters[index]
    };
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
  const candidates = shuffleWords(getPlayableWordCandidates(trie, Math.min(5, board.length), excludedWords));
  let seededWordCount = 0;

  for (const word of candidates) {
    if (seededWordCount >= targetWords) {
      break;
    }

    const characters = getKanaCharacters(word);
    const path = getRandomAdjacentPath(board.length, characters.length, occupiedPositions);

    if (!path) {
      continue;
    }

    path.forEach((position, index) => {
      occupiedPositions.add(positionKey(position));
      seededBoard[position.row][position.col] = {
        id: `${Date.now()}-${position.row}-${position.col}-${characters[index]}-${Math.random()
          .toString(36)
          .slice(2)}`,
        kana: characters[index]
      };
    });
    seededWordCount += 1;
  }

  return seededWordCount > 0 ? seededBoard : seedBoardWithKnownWord(board, trie);
}

function hasEnoughAvailableWords(
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

export function generatePlayableBoard(
  size: number,
  trie: KanaTrie,
  foundWords: Set<string>,
  threshold = KANA_RUSH_MIN_AVAILABLE_WORDS
): KanaRushTile[][] {
  let bestBoard = createKanaRushBoard(size);
  let bestCount = 0;

  for (let attempt = 0; attempt < 14; attempt += 1) {
    const candidateBoard = seedBoardWithKnownWords(createKanaRushBoard(size), trie, threshold, foundWords);
    const availableCount = solveKanaRushBoard(candidateBoard, trie, foundWords, { limit: threshold }).length;

    if (availableCount >= threshold) {
      return candidateBoard;
    }

    if (availableCount > bestCount) {
      bestBoard = candidateBoard;
      bestCount = availableCount;
    }
  }

  return bestCount > 0 ? bestBoard : seedBoardWithKnownWords(bestBoard, trie, threshold, foundWords);
}

export function repairBoardIfNeeded(
  board: KanaRushTile[][],
  trie: KanaTrie,
  foundWords: Set<string>,
  threshold = KANA_RUSH_MIN_AVAILABLE_WORDS
): KanaRushTile[][] {
  if (hasEnoughAvailableWords(board, trie, foundWords, threshold)) {
    return board;
  }

  // Repair small weak patches first. Full regeneration is the fallback, which avoids
  // presenting a dead board without paying that cost after every successful word.
  let repairedBoard = seedBoardWithKnownWords(board, trie, 3, foundWords);

  for (let attempt = 0; attempt < 10; attempt += 1) {
    if (hasEnoughAvailableWords(repairedBoard, trie, foundWords, threshold)) {
      return repairedBoard;
    }

    repairedBoard = seedBoardWithKnownWords(
      replaceRandomTiles(repairedBoard, 4 + Math.min(attempt, 6)),
      trie,
      3,
      foundWords
    );
  }

  return generatePlayableBoard(board.length || KANA_RUSH_SIZE, trie, foundWords, threshold);
}
