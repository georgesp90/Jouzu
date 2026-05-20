import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function loadTsModule(relativePath, requireMocks = {}) {
  const source = readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020
    }
  }).outputText;
  const module = { exports: {} };
  const sandbox = {
    exports: module.exports,
    module,
    require: (id) => {
      if (id in requireMocks) {
        return requireMocks[id];
      }

      throw new Error(`Unexpected require in Kana Rush smoke test: ${id}`);
    }
  };

  vm.runInNewContext(compiled, sandbox, { filename: relativePath });
  return module.exports;
}

const kanaWeights = {
  getWeightedRandomKana: () => "あ"
};
const logic = loadTsModule("../src/modes/kanaRush/kanaRushLogic.ts", {
  "./kanaWeights": kanaWeights
});
const solver = loadTsModule("../src/modes/kanaRush/kanaRushSolver.ts", {
  "./kanaRushLogic": logic,
  "./types": {}
});

assert.equal(logic.isAdjacent({ row: 0, col: 0 }, { row: 1, col: 1 }), true);
assert.equal(logic.isAdjacent({ row: 0, col: 0 }, { row: 2, col: 0 }), false);
assert.equal(logic.getScoreForLength(2), 1);
assert.equal(logic.getScoreForLength(3), 2);
assert.equal(logic.getScoreForLength(4), 4);
assert.equal(logic.getScoreForLength(5), 6);
assert.equal(logic.getScoreForLength(6), 8);
assert.equal(logic.getTimeBonusForLength(2), 1);
assert.equal(logic.getTimeBonusForLength(5), 6);
assert.equal(logic.getKanaRushBoardSizeForTime(30), 8);
assert.equal(logic.getKanaRushBoardSizeForTime(20), 7);
assert.equal(logic.getKanaRushBoardSizeForTime(12), 6);
assert.equal(logic.getKanaRushBoardSizeForTime(5), 5);
assert.equal(logic.getKanaRushMinWordsForBoardSize(8), 12);
assert.equal(logic.getKanaRushMinWordsForBoardSize(5), 3);
assert.equal(
  logic.evaluateKanaRushSubmission({
    word: "ねこ",
    acceptedWords: new Set(["ねこ"]),
    foundWords: new Set(),
    twoKanaStreak: 0
  }).status,
  "valid"
);
assert.equal(
  logic.evaluateKanaRushSubmission({
    word: "ねこ",
    acceptedWords: new Set(["ねこ"]),
    foundWords: new Set(["ねこ"]),
    twoKanaStreak: 0
  }).status,
  "duplicate"
);
assert.equal(
  logic.evaluateKanaRushSubmission({
    word: "ねこ",
    acceptedWords: new Set(["ねこ"]),
    foundWords: new Set(),
    twoKanaStreak: 2
  }).penalty,
  4
);

const trie = solver.buildKanaTrie(["ねこ", "いぬ", "ねずみ"]);
assert.equal(solver.hasKanaPrefix(trie, "ね"), true);
assert.equal(solver.hasKanaWord(trie, "ねこ"), true);
assert.equal(solver.hasKanaWord(trie, "ね"), false);

const board = [
  [
    { id: "0", kana: "ね" },
    { id: "1", kana: "こ" }
  ],
  [
    { id: "2", kana: "い" },
    { id: "3", kana: "ぬ" }
  ]
];
assert.equal(JSON.stringify(solver.solveKanaRushBoard(board, trie, new Set()).sort()), JSON.stringify(["いぬ", "ねこ"]));
assert.equal(JSON.stringify(solver.solveKanaRushBoard(board, trie, new Set(["ねこ"]))), JSON.stringify(["いぬ"]));
assert.equal(JSON.stringify(solver.findValidWordsOnBoard(board, trie, new Set()).sort()), JSON.stringify(["いぬ", "ねこ"]));
assert.equal(solver.boardHasEnoughWords(board, trie, new Set(), 2), true);
assert.equal(solver.boardHasEnoughWords(board, trie, new Set(["ねこ"]), 2), false);
assert.equal(
  JSON.stringify(solver.findStarterCells(board, trie, new Set()).map(logic.positionKey).sort()),
  JSON.stringify(["0:0", "1:0"])
);
assert.equal(
  JSON.stringify(solver.findStarterCells(board, trie, new Set(["ねこ"])).map(logic.positionKey)),
  JSON.stringify(["1:0"])
);

const generatedBoard = solver.generateBoard({ size: 5, trie, foundWords: new Set(), threshold: 1, maxRetries: 3 });
assert.equal(solver.findValidWordsOnBoard(generatedBoard, trie, new Set(), { limit: 1 }).length >= 1, true);

const repairedBoard = solver.repairBoardIfNeeded(logic.createKanaRushBoard(5), trie, new Set(), 1);
assert.equal(solver.solveKanaRushBoard(repairedBoard, trie, new Set(), { limit: 1 }).length >= 1, true);

console.log("Kana Rush smoke checks passed");
