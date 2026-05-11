import { TileStatus } from "@/types/game";

type EvaluatedTileStatus = Exclude<TileStatus, "empty" | "close">;

export function evaluateGuess(guess: string, answer: string): EvaluatedTileStatus[] {
  const guessChars = Array.from(guess);
  const answerChars = Array.from(answer);
  const result: EvaluatedTileStatus[] = Array(guessChars.length).fill("absent");
  const used = Array(answerChars.length).fill(false);

  for (let i = 0; i < guessChars.length; i += 1) {
    if (guessChars[i] === answerChars[i]) {
      result[i] = "correct";
      used[i] = true;
    }
  }

  for (let i = 0; i < guessChars.length; i += 1) {
    if (result[i] === "correct") {
      continue;
    }

    const foundIndex = answerChars.findIndex(
      (char, index) => char === guessChars[i] && !used[index]
    );

    if (foundIndex !== -1) {
      result[i] = "present";
      used[foundIndex] = true;
    }
  }

  return result;
}
