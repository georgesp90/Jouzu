# Jozu Progress Log

## May 5-19, 2026

Jozu moved from a promising daily hiragana puzzle prototype into a much more complete Japanese-learning app: authenticated progress, shared daily puzzles, richer learning feedback, premium practice infrastructure, reminders, a polished welcome experience, and a new arcade practice mode called Kana Rush.

This document records the work completed during the approximately two-week build sprint leading into the current version.

## Starting Point

At the beginning of this sprint, Jozu already had the core puzzle idea in place:

- A daily hiragana guessing game built with Expo and React Native.
- A custom paged kana keyboard with kana/romaji display support.
- Daily and unlimited practice play.
- Basic hints, word feedback, and result presentation.
- Initial Firebase integration work underway.

The focus of this period was making the app reliable, learnable, personal, and ready to grow beyond a single puzzle screen.

## Foundation: Accounts, Firebase, and Daily Progress

### Firebase daily tracking

Jozu was connected to Firebase Authentication and Firestore so daily play can persist beyond a device session.

Implemented:

- Firebase configuration using the Expo-compatible Firebase JavaScript SDK.
- Firestore storage for user records and daily plays.
- Daily result data including win/loss, guesses used, hint usage, completion time, and word reference.
- Streak data including current streak, best streak, and last played date.
- Fail-safe behavior so gameplay continues locally if a Firebase request fails.

Firestore structure:

```txt
users/{uid}
  email
  createdAt
  lastPlayedDate
  currentStreak
  bestStreak
  entitlements

users/{uid}/plays/{yyyy-mm-dd}
  wordId
  won
  guessesUsed
  hintUsed
  completedAt
```

### Email authentication

The anonymous-user direction was replaced with a cleaner account flow for longer-term progress tracking.

Implemented:

- Create account with email and password.
- Sign in with email and password.
- Forgot password email flow.
- Persistent authenticated sessions.
- User-specific local state isolation so switching accounts does not incorrectly show another user's data.

### Daily results and stats

A lightweight stats/results modal was added to make daily participation feel cumulative.

Users can view:

- Today's completed result.
- Whether the word was won or lost.
- Guesses used and whether a hint was used.
- The solved word and meaning.
- Current streak and best streak.
- Total daily plays and total wins.
- Win rate and average guesses.

The word's internal ID was later removed from the user-facing results view to keep it clean.

## Daily Puzzle Fairness and Learning Feedback

### Shared daily puzzle consistency

Daily puzzle selection was updated so players receive the same daily puzzle rather than having different device-local selections.

Implemented:

- Shared daily puzzle sync through Firebase with local fallback behavior.
- Stable daily puzzle handling across app versions where possible.
- Daily puzzle numbering reset to begin at `#001` from the selected launch baseline.

### Word pool expansion

Jozu's vocabulary grew substantially over the sprint.

Implemented:

- Expanded playable word pools across JLPT levels.
- Expanded accepted-guess vocabulary so valid common hiragana words count as real attempts.
- Added more common N5 and N4 vocabulary drawn from learner-oriented lists.
- Added words surfaced during testing, including everyday terms that should reasonably validate.

The intent was to reduce moments where a learner entered a legitimate Japanese word and the app rejected it simply because it was not yet known to the app.

### Close answers and confusable words

Some category/definition combinations naturally invite reasonable synonyms. Jozu now handles that pedagogically.

Implemented optional word metadata:

```ts
closeAnswers?: string[];
confusableWords?: {
  word: string;
  romaji: string;
  english: string;
  note?: string;
}[];
refinedDefinition?: string;
```

Behavior:

- A close/confusable answer is recognized as a valid submitted attempt.
- It does not solve the puzzle.
- It displays a helpful explanation rather than feeling like an arbitrary rejection.
- The submitted tile row uses a distinct muted-purple close-answer state.
- Solved/result feedback can show an "Often confused with" learning section.
- Definitions were refined where a vague clue made synonyms feel equally correct.

### Progressive hints

Hints evolved from a single category label into a gentle learning ladder:

- Category is always visible.
- Emoji hint appears as the player struggles.
- A definition or simple example becomes available later or through the hint action, depending on settings.
- Hint presentation uses subtle reveal animation.

## Result Modal and Gameplay Polish

### Result modal improvements

The end-of-puzzle experience was refined to center learning rather than just completion.

Implemented:

- Stronger visual hierarchy: large kana, supporting English meaning, muted romaji.
- Cleaner category and JLPT presentation.
- "Often confused with" comparisons when metadata is available.
- More polished review flashcard modal layout.
- Review card progress adjusted so category-filtered sessions do not display misleading totals.

### Pronunciation audio

Japanese pronunciation playback was added with Expo Speech.

Implemented:

- A reusable speech helper for Japanese kana.
- A minimal `Listen` action in solved and review experiences.
- Playback stopping/restarting behavior to prevent overlapping speech.
- Slower, learner-friendly pronunciation pacing.

### Celebrations and motion

Jozu gained tactile feedback without becoming noisy or arcade-heavy.

Implemented:

- Tile pop animation on kana input.
- Keyboard press feedback for kana, Enter, and Delete.
- Staggered tile reveal/flip feedback when guesses are submitted.
- Solved-row wave feedback.
- Subtle perfect-solve celebration.
- Lightweight JavaScript-only confetti after removing a native confetti dependency that caused runtime issues.
- Consistent animation timing helpers.
- Haptic feedback tuned to be gentler.
- Reduced-motion support for accessibility.

## Account Compliance and App Store Readiness

### Account deletion

To satisfy App Store account-deletion requirements, a full in-app deletion path was added.

Implemented:

- Delete Account action in settings.
- Native-style confirmation dialog.
- Firestore user-linked data deletion.
- Firebase Authentication user deletion.
- Recent-login error handling.
- Sign-out and return to authentication after deletion.

### App identity and shipping

During this period Jozu progressed through TestFlight and App Store distribution work.

Completed or configured:

- App name presentation updated to `Jozu`.
- Bundle identifier migrated to `com.georgesp9.jozuapp`.
- New branded app icon added.
- Expo/EAS production build and submission flow exercised.
- The app was approved and became available in the iOS App Store.

## Premium Infrastructure: Jozu Plus

Jozu Plus infrastructure was introduced while keeping Daily Mode free.

### Subscription foundation

Implemented:

- Centralized subscription/access service.
- RevenueCat-based product and entitlement integration.
- Monthly and yearly product support.
- Restore Purchases flow.
- A calm, app-consistent Jozu Plus paywall.
- Feature-level access checks intended to scale to future premium tools.

Planned premium access:

- Unlimited Practice.
- Review Practice.
- Future JLPT packs.
- Future audio tools.

### Founding users / early adopters

A legacy entitlement system was added to preserve access for early users.

Implemented:

- `entitlements.legacyPlus` user field support.
- Founding User badge using a subtle sprout icon.
- Appreciation modal for founding users.
- Temporary early-access/grace window extended through the June 1 launch cutoff while App Store subscription setup is finalized.

This allows existing and qualifying early users to access premium practice features without being interrupted by the paywall.

### Practice filtering

Premium Practice became a more deliberate study tool.

Implemented:

- JLPT filtering.
- Category-based filtering.
- Cleaner premium Practice presentation.
- Review Practice access and filtered review behavior.
- New Word action repositioned near Hint to reduce board-area clutter.

## Daily Reminders

Local notifications were added as a gentle habit-support feature.

Implemented with Expo Notifications:

- Opt-in reminder setting.
- Morning notification scheduling around 11:11 AM local time.
- Evening reminder scheduling in a softer later-day window.
- Messaging that can reflect streak/progress context without guilt-oriented wording.
- Notification cancellation when disabled.
- Rescheduling after a daily completion so unnecessary reminders do not continue.

## Welcome and Brand Experience

A new welcome landing screen was added after authentication so players enter the app through a calmer daily ritual rather than being dropped directly into gameplay.

Implemented:

- Branded Jozu icon/logo presentation.
- `Daily Japanese Practice` positioning.
- Calm ritual-oriented supporting copy.
- Decorative animated kana preview row spelling `じょうず`.
- Primary `Start Today's Puzzle` CTA.
- Secondary `Practice Mode` CTA.
- `Kana Rush` entry point with a gold-accent outlined button.
- Date and streak/context metadata at the bottom.

The preview is decorative only and does not modify game state or daily selection.

## New Mode: Kana Rush

Kana Rush was added as Jozu's first arcade-style vocabulary mode.

### Core playable loop

Implemented:

- Separate Kana Rush screen and game logic modules.
- Swipe-to-connect kana grid gameplay.
- Horizontal, vertical, and diagonal connections.
- No tile reuse within a selected path.
- Timer, score, combo, current path, latest found word, and results states.
- Idle, playing, and game-over phases.
- Tile replacement after valid submissions.
- Valid/invalid and duplicate submission handling.
- Haptic and visual response where appropriate.

### Board intelligence

To prevent unplayable rounds, Kana Rush includes reusable board-solving infrastructure.

Implemented:

- Trie-based word prefix lookup.
- DFS board solver.
- Weighted kana generation.
- Board playability thresholds.
- Repair/regeneration after weak board generation or tile replacement.
- Starter-path hint detection.

### Learner-friendly tuning

Kana Rush was then tuned to make it less random and more readable for beginners.

Implemented:

- Expanded Kana Rush vocabulary from shared Jozu word sources.
- Word metadata mapping for meanings and future learning feedback.
- More common beginner-friendly seed words.
- More accessible time bonuses for found words.
- Improved swipe targeting on phones.
- Stronger/clearer selected path feedback.
- Starter hints that point to actual available paths.
- Preference for non-diagonal hint paths.
- More seeded three-kana words.
- Three-kana seeds placed in L-shaped paths where possible, making short discoverable words easier to swipe.

### Verification

Kana Rush now has a smoke-test command for its core helper logic:

```bash
npm run test:kana-rush
```

TypeScript verification remains available with:

```bash
npm run typecheck
```

## Current User-Facing Feature Set

As of this progress log, Jozu includes:

- Email account creation, sign-in, password reset, and account deletion.
- Shared Daily Puzzle mode.
- Daily stats, streaks, and results history.
- Unlimited Practice mode.
- Review Practice flashcards.
- JLPT and category-focused practice filters.
- Kana/Romaji display settings.
- Progressive category, emoji, and definition hints.
- Accepted-guess expansion and close-answer teaching feedback.
- Japanese word pronunciation playback.
- Polished motion, haptics, and accessibility-aware reduced motion.
- Gentle opt-in daily reminder notifications.
- Jozu Plus subscription/paywall infrastructure.
- Founding User legacy-access support.
- Welcome landing screen and branded app identity.
- Kana Rush arcade vocabulary mode.

## Technical Structure Added or Expanded

Important modules added or substantially developed during this period:

```txt
app/index.tsx
components/FoundingUserBadge.tsx
components/PaywallModal.tsx
components/ResultModal.tsx
components/WelcomeLandingScreen.tsx
data/acceptedGuesses.ts
data/kanaRushVocabulary.ts
data/words.ts
firebase/firebaseConfig.ts
firebase/services.ts
notifications/jozuNotifications.ts
src/modes/kanaRush/KanaRushScreen.tsx
src/modes/kanaRush/kanaRushLogic.ts
src/modes/kanaRush/kanaRushSolver.ts
src/modes/kanaRush/kanaWeights.ts
src/modes/kanaRush/types.ts
utils/feedback.ts
utils/motion.ts
utils/speech.ts
utils/subscriptionService.ts
```

## Recent Git Timeline

| Date | Commit | Focus |
| --- | --- | --- |
| May 10 | `4349d43` | Shared daily puzzle sync and close-answer attempts |
| May 11 | `8c52289` | Result modal audio, close-answer learning, and perfect solves |
| May 12 | `568073e` | Account deletion and user-state isolation |
| May 13 | `e3bd360` | Tactile gameplay polish and reduced-motion support |
| May 15 | `f032488` | Jozu Plus subscriptions and premium practice filters |
| May 15 | `42a12fc` | Daily reminder notifications and accepted-guess expansion |
| May 17 | `2714bb0` | Welcome landing page and review flashcard polish |
| May 18 | `71f344c` | Kana Rush foundation, stability, and balance |
| May 19 | `dcfa43e` | Beginner Kana Rush seeding and starter hints |
| May 19 | `beaf5cd` | Kana Rush board tuning and welcome CTA polish |

## Practical Next Steps

The most useful near-term follow-ups are:

1. Test Kana Rush repeatedly on physical iPhones to tune board readability, L-shaped seeding, timer balance, and hint usefulness.
2. Finalize App Store/RevenueCat subscription approval and validate purchase/restore flows in TestFlight.
3. Refresh `README.md`, which still describes the early MVP and no longer reflects the app's current capabilities.
4. Continue curating accepted guesses, close answers, and learner-friendly word metadata based on tester reports.
5. Consider shipping Kana Rush first as a clearly labeled practice/experimental mode and tune it from real play sessions.

## Summary

Over this sprint, Jozu became far more than a daily word prototype. It now has a real learning loop: daily consistency, persistent progress, pronunciation, fairer word handling, review, premium practice infrastructure, reminders, a branded welcome experience, and an entirely new fast-play Kana Rush mode. The app has both a solid daily ritual at its center and promising room to grow as a Japanese vocabulary companion.
