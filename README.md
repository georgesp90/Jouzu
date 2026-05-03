# Jouzu

A simple Expo React Native MVP for a daily hiragana Wordle-style game.

Jouzu is meant to feel like a quiet daily Japanese ritual: open the app, guess one hiragana word, get Wordle-style feedback, learn the answer, and come back tomorrow.

## Run Locally

Install dependencies:

```bash
npm install
```

Start Expo:

```bash
npx expo start -c
```

Then open the project in Expo Go, an iOS simulator, Android emulator, or web.

## Expo SDK

This project is set up for Expo SDK 54 so it works with the current Expo Go app on iOS.

If Expo reports a package mismatch, run:

```bash
npx expo install --fix
```

## Current Features

- One shared daily puzzle using date-based word selection
- Local-only progress with AsyncStorage
- Dynamic grid length based on the hiragana answer
- Custom paged kana keyboard
- Keyboard colors for guessed kana
- Hint after 2 incorrect guesses
- Result modal with hiragana, romaji, English, definition, category, and JLPT
- Native share text

## Project Structure

```txt
app/index.tsx                 Main game screen
components/GameGrid.tsx       Wordle-style puzzle grid
components/KanaKeyboard.tsx   Paged kana keyboard
components/ResultModal.tsx    End-state learning and share modal
data/words.ts                 Starter word list
types/game.ts                 Shared game types
utils/evaluateGuess.ts        Wordle feedback logic
utils/getWordOfTheDay.ts      Daily puzzle selection
utils/storage.ts              Local progress persistence
```

## Notes

The MVP intentionally has no accounts, backend, Firebase, leaderboards, streak sync, audio, or extra game modes.
