import { signInAnonymously } from "firebase/auth";
import {
  Timestamp,
  doc,
  getDoc,
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

function getYesterdayKey(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  utcDate.setUTCDate(utcDate.getUTCDate() - 1);

  return utcDate.toISOString().slice(0, 10);
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

    const credential = await signInAnonymously(auth);
    return credential.user.uid;
  } catch (error) {
    console.warn("Firebase anonymous auth failed.", error);
    return null;
  }
}

export async function ensureAnonymousUser(): Promise<string | null> {
  return getCurrentUid();
}

export async function initUserIfNeeded(uid: string): Promise<void> {
  try {
    const userRef = doc(db, "users", uid);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      await setDoc(userRef, {
        createdAt: serverTimestamp(),
        lastPlayedDate: null,
        currentStreak: 0,
        bestStreak: 0
      });
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
