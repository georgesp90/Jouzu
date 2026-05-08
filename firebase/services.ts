import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut
} from "@firebase/auth";
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  setDoc
} from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "@/firebase/firebaseConfig";

export type DailyPlayData = {
  date: string;
  wordId: string;
  won: boolean;
  guessesUsed: number;
  hintUsed: boolean;
};

export type DailyPlay = DailyPlayData & {
  completedAt: Date | null;
};

export type UserStats = {
  currentStreak: number;
  bestStreak: number;
  lastPlayedDate: string | null;
  todayPlay: DailyPlay | null;
  totalDailyPlays: number;
  totalWins: number;
  winRate: number;
  averageGuesses: number;
};

type UserStatsDoc = {
  currentStreak?: unknown;
  bestStreak?: unknown;
  lastPlayedDate?: unknown;
};

type DailyPlayDoc = {
  wordId?: unknown;
  won?: unknown;
  guessesUsed?: unknown;
  hintUsed?: unknown;
  completedAt?: unknown;
};

function getYesterdayKey(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  utcDate.setUTCDate(utcDate.getUTCDate() - 1);

  return utcDate.toISOString().slice(0, 10);
}

function numberOrZero(value: unknown): number {
  return typeof value === "number" ? value : 0;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function timestampToDate(value: unknown): Date | null {
  return value instanceof Timestamp ? value.toDate() : null;
}

function playFromSnapshot(date: string, data: DailyPlayDoc): DailyPlay {
  return {
    date,
    wordId: typeof data.wordId === "string" ? data.wordId : "",
    won: data.won === true,
    guessesUsed: numberOrZero(data.guessesUsed),
    hintUsed: data.hintUsed === true,
    completedAt: timestampToDate(data.completedAt)
  };
}

export function calculateWinRate(plays: DailyPlay[]): number {
  if (plays.length === 0) {
    return 0;
  }

  return Math.round((plays.filter((play) => play.won).length / plays.length) * 100);
}

export function calculateAverageGuesses(plays: DailyPlay[]): number {
  if (plays.length === 0) {
    return 0;
  }

  const totalGuesses = plays.reduce((sum, play) => sum + play.guessesUsed, 0);
  return Math.round((totalGuesses / plays.length) * 10) / 10;
}

async function getCurrentUid(): Promise<string | null> {
  if (!isFirebaseConfigured) {
    console.warn("Firebase is not configured. Skipping remote daily tracking.");
    return null;
  }

  try {
    if (auth.currentUser) {
      return auth.currentUser.uid;
    }

  } catch (error) {
    console.warn("Firebase current user lookup failed.", error);
    return null;
  }

  return null;
}

export async function getSignedInUserId(): Promise<string | null> {
  return getCurrentUid();
}

export async function signInWithEmail(email: string, password: string): Promise<string | null> {
  try {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    await initUserIfNeeded(credential.user.uid, credential.user.email ?? email.trim());
    return credential.user.uid;
  } catch (error) {
    console.warn("Firebase email sign in failed.", error);
    throw error;
  }
}

export async function signUpWithEmail(email: string, password: string): Promise<string | null> {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await initUserIfNeeded(credential.user.uid, credential.user.email ?? email.trim());
    return credential.user.uid;
  } catch (error) {
    console.warn("Firebase email sign up failed.", error);
    throw error;
  }
}

export async function sendJouzuPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (error) {
    console.warn("Firebase password reset failed.", error);
    throw error;
  }
}

export async function signOutOfJouzu(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.warn("Firebase sign out failed.", error);
  }
}

export async function initUserIfNeeded(uid: string, email?: string | null): Promise<void> {
  try {
    const userRef = doc(db, "users", uid);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      await setDoc(userRef, {
        createdAt: serverTimestamp(),
        email: email ?? null,
        lastPlayedDate: null,
        currentStreak: 0,
        bestStreak: 0
      });
    } else if (email) {
      await setDoc(userRef, { email }, { merge: true });
    }
  } catch (error) {
    console.warn("Firebase user initialization failed.", error);
  }
}

export async function hasPlayedToday(uid: string, date: string): Promise<boolean> {
  try {
    const playRef = doc(db, "users", uid, "plays", date);
    const playSnapshot = await getDoc(playRef);

    return playSnapshot.exists();
  } catch (error) {
    console.warn("Firebase daily play check failed.", error);
    return false;
  }
}

export async function getTodayPlay(uid: string, date: string): Promise<DailyPlay | null> {
  try {
    const playRef = doc(db, "users", uid, "plays", date);
    const playSnapshot = await getDoc(playRef);

    if (!playSnapshot.exists()) {
      return null;
    }

    return playFromSnapshot(playSnapshot.id, playSnapshot.data() as DailyPlayDoc);
  } catch (error) {
    console.warn("Firebase today play load failed.", error);
    throw error;
  }
}

export async function getUserStats(uid: string, date: string): Promise<UserStats> {
  try {
    const userRef = doc(db, "users", uid);
    const playsRef = collection(db, "users", uid, "plays");
    const [userSnapshot, playsSnapshot] = await Promise.all([getDoc(userRef), getDocs(playsRef)]);
    const userData = (userSnapshot.data() ?? {}) as UserStatsDoc;
    const plays = playsSnapshot.docs.map((playSnapshot) =>
      playFromSnapshot(playSnapshot.id, playSnapshot.data() as DailyPlayDoc)
    );
    const todayPlay = plays.find((play) => play.date === date) ?? null;
    const totalWins = plays.filter((play) => play.won).length;

    return {
      currentStreak: numberOrZero(userData.currentStreak),
      bestStreak: numberOrZero(userData.bestStreak),
      lastPlayedDate: stringOrNull(userData.lastPlayedDate),
      todayPlay,
      totalDailyPlays: plays.length,
      totalWins,
      winRate: calculateWinRate(plays),
      averageGuesses: calculateAverageGuesses(plays)
    };
  } catch (error) {
    console.warn("Firebase user stats load failed.", error);
    throw error;
  }
}

export async function updateStreak(uid: string, won: boolean, date: string): Promise<void> {
  try {
    const userRef = doc(db, "users", uid);

    await runTransaction(db, async (transaction) => {
      const userSnapshot = await transaction.get(userRef);
      const userData = userSnapshot.data();
      const lastPlayedDate = userData?.lastPlayedDate as string | null | undefined;
      const currentStreak = typeof userData?.currentStreak === "number" ? userData.currentStreak : 0;
      const bestStreak = typeof userData?.bestStreak === "number" ? userData.bestStreak : 0;

      if (lastPlayedDate === date) {
        return;
      }

      const nextStreak = won
        ? lastPlayedDate === getYesterdayKey(date)
          ? currentStreak + 1
          : 1
        : 0;

      transaction.set(
        userRef,
        {
          lastPlayedDate: date,
          currentStreak: nextStreak,
          bestStreak: Math.max(bestStreak, nextStreak)
        },
        { merge: true }
      );
    });
  } catch (error) {
    console.warn("Firebase streak update failed.", error);
  }
}

export async function saveDailyPlay(uid: string, data: DailyPlayData): Promise<boolean> {
  try {
    const userRef = doc(db, "users", uid);
    const playRef = doc(db, "users", uid, "plays", data.date);
    let saved = false;

    await runTransaction(db, async (transaction) => {
      const playSnapshot = await transaction.get(playRef);

      if (playSnapshot.exists()) {
        return;
      }

      const userSnapshot = await transaction.get(userRef);
      const userData = userSnapshot.data();
      const lastPlayedDate = userData?.lastPlayedDate as string | null | undefined;
      const currentStreak = typeof userData?.currentStreak === "number" ? userData.currentStreak : 0;
      const bestStreak = typeof userData?.bestStreak === "number" ? userData.bestStreak : 0;
      const nextStreak = data.won
        ? lastPlayedDate === getYesterdayKey(data.date)
          ? currentStreak + 1
          : 1
        : 0;

      transaction.set(
        userRef,
        {
          createdAt: userSnapshot.exists() ? userData?.createdAt ?? serverTimestamp() : serverTimestamp(),
          lastPlayedDate: data.date,
          currentStreak: nextStreak,
          bestStreak: Math.max(bestStreak, nextStreak)
        },
        { merge: true }
      );
      transaction.set(playRef, {
        wordId: data.wordId,
        won: data.won,
        guessesUsed: data.guessesUsed,
        hintUsed: data.hintUsed,
        completedAt: Timestamp.now()
      });
      saved = true;
    });

    return saved;
  } catch (error) {
    console.warn("Firebase daily play save failed.", error);
    return false;
  }
}

export async function saveDailyPlayForCurrentUser(data: DailyPlayData): Promise<boolean> {
  const uid = await getCurrentUid();

  if (!uid) {
    return false;
  }

  await initUserIfNeeded(uid);
  return saveDailyPlay(uid, data);
}
