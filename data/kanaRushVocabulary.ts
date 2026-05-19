import { acceptedGuesses } from "@/data/acceptedGuesses";
import { words } from "@/data/words";
import { type JLPTLevel } from "@/types/game";
import { getKanaRomaji } from "@/utils/kanaRomaji";

export type KanaRushWordMeta = {
  hiragana: string;
  romaji: string;
  english?: string;
  jlpt?: JLPTLevel;
  category?: string;
};

const KANA_RUSH_TARGET_WORD_COUNT = 1200;

const curatedKanaRushWords: KanaRushWordMeta[] = [
  { hiragana: "あお", romaji: "ao", english: "blue", jlpt: "N5", category: "color" },
  { hiragana: "あか", romaji: "aka", english: "red", jlpt: "N5", category: "color" },
  { hiragana: "あき", romaji: "aki", english: "autumn", jlpt: "N5", category: "time" },
  { hiragana: "あさ", romaji: "asa", english: "morning", jlpt: "N5", category: "time" },
  { hiragana: "あし", romaji: "ashi", english: "foot; leg", jlpt: "N5", category: "body" },
  { hiragana: "あせ", romaji: "ase", english: "sweat", jlpt: "N4", category: "body" },
  { hiragana: "あたま", romaji: "atama", english: "head", jlpt: "N5", category: "body" },
  { hiragana: "あつい", romaji: "atsui", english: "hot", jlpt: "N5", category: "adjective" },
  { hiragana: "あに", romaji: "ani", english: "older brother", jlpt: "N5", category: "person" },
  { hiragana: "あね", romaji: "ane", english: "older sister", jlpt: "N5", category: "person" },
  { hiragana: "あめ", romaji: "ame", english: "rain", jlpt: "N5", category: "nature" },
  { hiragana: "いけ", romaji: "ike", english: "pond", jlpt: "N4", category: "nature" },
  { hiragana: "いす", romaji: "isu", english: "chair", jlpt: "N5", category: "object" },
  { hiragana: "いち", romaji: "ichi", english: "one", jlpt: "N5", category: "number" },
  { hiragana: "いま", romaji: "ima", english: "now", jlpt: "N5", category: "time" },
  { hiragana: "いみ", romaji: "imi", english: "meaning", jlpt: "N4", category: "study" },
  { hiragana: "いろ", romaji: "iro", english: "color", jlpt: "N5", category: "color" },
  { hiragana: "うえ", romaji: "ue", english: "above", jlpt: "N5", category: "place" },
  { hiragana: "うし", romaji: "ushi", english: "cow", jlpt: "N5", category: "animal" },
  { hiragana: "うた", romaji: "uta", english: "song", jlpt: "N5", category: "culture" },
  { hiragana: "うち", romaji: "uchi", english: "home", jlpt: "N5", category: "home" },
  { hiragana: "うで", romaji: "ude", english: "arm", jlpt: "N4", category: "body" },
  { hiragana: "うみ", romaji: "umi", english: "sea", jlpt: "N5", category: "nature" },
  { hiragana: "えき", romaji: "eki", english: "station", jlpt: "N5", category: "place" },
  { hiragana: "えん", romaji: "en", english: "yen", jlpt: "N5", category: "money" },
  { hiragana: "おかね", romaji: "okane", english: "money", jlpt: "N5", category: "money" },
  { hiragana: "おかし", romaji: "okashi", english: "snack; sweets", jlpt: "N5", category: "food" },
  { hiragana: "おちゃ", romaji: "ocha", english: "tea", jlpt: "N5", category: "food" },
  { hiragana: "おと", romaji: "oto", english: "sound", jlpt: "N4", category: "object" },
  { hiragana: "おに", romaji: "oni", english: "demon", jlpt: "N4", category: "culture" },
  { hiragana: "かお", romaji: "kao", english: "face", jlpt: "N5", category: "body" },
  { hiragana: "かぎ", romaji: "kagi", english: "key", jlpt: "N5", category: "object" },
  { hiragana: "かぜ", romaji: "kaze", english: "wind; cold", jlpt: "N5", category: "nature" },
  { hiragana: "かぞく", romaji: "kazoku", english: "family", jlpt: "N5", category: "person" },
  { hiragana: "かた", romaji: "kata", english: "shoulder", jlpt: "N4", category: "body" },
  { hiragana: "かばん", romaji: "kaban", english: "bag", jlpt: "N5", category: "object" },
  { hiragana: "かみ", romaji: "kami", english: "paper; hair", jlpt: "N5", category: "object" },
  { hiragana: "からい", romaji: "karai", english: "spicy", jlpt: "N5", category: "adjective" },
  { hiragana: "かわ", romaji: "kawa", english: "river", jlpt: "N5", category: "nature" },
  { hiragana: "きた", romaji: "kita", english: "north", jlpt: "N5", category: "place" },
  { hiragana: "きって", romaji: "kitte", english: "stamp", jlpt: "N5", category: "object" },
  { hiragana: "きのう", romaji: "kinou", english: "yesterday", jlpt: "N5", category: "time" },
  { hiragana: "きょう", romaji: "kyou", english: "today", jlpt: "N5", category: "time" },
  { hiragana: "くち", romaji: "kuchi", english: "mouth", jlpt: "N5", category: "body" },
  { hiragana: "くつ", romaji: "kutsu", english: "shoes", jlpt: "N5", category: "clothing" },
  { hiragana: "くに", romaji: "kuni", english: "country", jlpt: "N5", category: "place" },
  { hiragana: "くも", romaji: "kumo", english: "cloud; spider", jlpt: "N5", category: "nature" },
  { hiragana: "くるま", romaji: "kuruma", english: "car", jlpt: "N5", category: "transport" },
  { hiragana: "くろ", romaji: "kuro", english: "black", jlpt: "N5", category: "color" },
  { hiragana: "けさ", romaji: "kesa", english: "this morning", jlpt: "N5", category: "time" },
  { hiragana: "こえ", romaji: "koe", english: "voice", jlpt: "N4", category: "communication" },
  { hiragana: "ここ", romaji: "koko", english: "here", jlpt: "N5", category: "place" },
  { hiragana: "こたえ", romaji: "kotae", english: "answer", jlpt: "N5", category: "study" },
  { hiragana: "ことば", romaji: "kotoba", english: "word; language", jlpt: "N5", category: "study" },
  { hiragana: "こども", romaji: "kodomo", english: "child", jlpt: "N5", category: "person" },
  { hiragana: "ごはん", romaji: "gohan", english: "rice; meal", jlpt: "N5", category: "food" },
  { hiragana: "さかな", romaji: "sakana", english: "fish", jlpt: "N5", category: "food" },
  { hiragana: "さとう", romaji: "satou", english: "sugar", jlpt: "N5", category: "food" },
  { hiragana: "さむい", romaji: "samui", english: "cold", jlpt: "N5", category: "adjective" },
  { hiragana: "しお", romaji: "shio", english: "salt", jlpt: "N5", category: "food" },
  { hiragana: "した", romaji: "shita", english: "below", jlpt: "N5", category: "place" },
  { hiragana: "しごと", romaji: "shigoto", english: "work; job", jlpt: "N5", category: "work" },
  { hiragana: "しろ", romaji: "shiro", english: "white", jlpt: "N5", category: "color" },
  { hiragana: "すし", romaji: "sushi", english: "sushi", jlpt: "N5", category: "food" },
  { hiragana: "すき", romaji: "suki", english: "like; favorite", jlpt: "N5", category: "emotion" },
  { hiragana: "すな", romaji: "suna", english: "sand", jlpt: "N4", category: "nature" },
  { hiragana: "そと", romaji: "soto", english: "outside", jlpt: "N5", category: "place" },
  { hiragana: "そら", romaji: "sora", english: "sky", jlpt: "N5", category: "nature" },
  { hiragana: "たまご", romaji: "tamago", english: "egg", jlpt: "N5", category: "food" },
  { hiragana: "ちかい", romaji: "chikai", english: "near", jlpt: "N5", category: "adjective" },
  { hiragana: "ちず", romaji: "chizu", english: "map", jlpt: "N5", category: "travel" },
  { hiragana: "つき", romaji: "tsuki", english: "moon; month", jlpt: "N5", category: "nature" },
  { hiragana: "つくえ", romaji: "tsukue", english: "desk", jlpt: "N5", category: "object" },
  { hiragana: "てがみ", romaji: "tegami", english: "letter", jlpt: "N5", category: "communication" },
  { hiragana: "とけい", romaji: "tokei", english: "clock; watch", jlpt: "N5", category: "time" },
  { hiragana: "ところ", romaji: "tokoro", english: "place", jlpt: "N5", category: "place" },
  { hiragana: "とり", romaji: "tori", english: "bird", jlpt: "N5", category: "animal" },
  { hiragana: "なか", romaji: "naka", english: "inside", jlpt: "N5", category: "place" },
  { hiragana: "なつ", romaji: "natsu", english: "summer", jlpt: "N5", category: "time" },
  { hiragana: "なまえ", romaji: "namae", english: "name", jlpt: "N5", category: "person" },
  { hiragana: "にく", romaji: "niku", english: "meat", jlpt: "N5", category: "food" },
  { hiragana: "にし", romaji: "nishi", english: "west", jlpt: "N5", category: "place" },
  { hiragana: "ねこ", romaji: "neko", english: "cat", jlpt: "N5", category: "animal" },
  { hiragana: "のり", romaji: "nori", english: "seaweed", jlpt: "N4", category: "food" },
  { hiragana: "はこ", romaji: "hako", english: "box", jlpt: "N4", category: "object" },
  { hiragana: "はし", romaji: "hashi", english: "chopsticks; bridge", jlpt: "N5", category: "object" },
  { hiragana: "はな", romaji: "hana", english: "flower; nose", jlpt: "N5", category: "nature" },
  { hiragana: "はる", romaji: "haru", english: "spring", jlpt: "N5", category: "time" },
  { hiragana: "ひがし", romaji: "higashi", english: "east", jlpt: "N5", category: "place" },
  { hiragana: "ひと", romaji: "hito", english: "person", jlpt: "N5", category: "person" },
  { hiragana: "ひま", romaji: "hima", english: "free time", jlpt: "N4", category: "time" },
  { hiragana: "ひる", romaji: "hiru", english: "noon", jlpt: "N5", category: "time" },
  { hiragana: "ふく", romaji: "fuku", english: "clothes", jlpt: "N5", category: "clothing" },
  { hiragana: "ふゆ", romaji: "fuyu", english: "winter", jlpt: "N5", category: "time" },
  { hiragana: "へや", romaji: "heya", english: "room", jlpt: "N5", category: "place" },
  { hiragana: "へん", romaji: "hen", english: "strange", jlpt: "N4", category: "adjective" },
  { hiragana: "ほし", romaji: "hoshi", english: "star", jlpt: "N5", category: "nature" },
  { hiragana: "ほん", romaji: "hon", english: "book", jlpt: "N5", category: "study" },
  { hiragana: "まち", romaji: "machi", english: "town", jlpt: "N5", category: "place" },
  { hiragana: "みぎ", romaji: "migi", english: "right", jlpt: "N5", category: "place" },
  { hiragana: "みせ", romaji: "mise", english: "shop", jlpt: "N5", category: "place" },
  { hiragana: "みち", romaji: "michi", english: "road", jlpt: "N5", category: "place" },
  { hiragana: "みみ", romaji: "mimi", english: "ear", jlpt: "N5", category: "body" },
  { hiragana: "むずかしい", romaji: "muzukashii", english: "difficult", jlpt: "N5", category: "adjective" },
  { hiragana: "むら", romaji: "mura", english: "village", jlpt: "N4", category: "place" },
  { hiragana: "めがね", romaji: "megane", english: "glasses", jlpt: "N5", category: "clothing" },
  { hiragana: "やま", romaji: "yama", english: "mountain", jlpt: "N5", category: "nature" },
  { hiragana: "ゆき", romaji: "yuki", english: "snow", jlpt: "N5", category: "nature" },
  { hiragana: "よる", romaji: "yoru", english: "night", jlpt: "N5", category: "time" },
  { hiragana: "りんご", romaji: "ringo", english: "apple", jlpt: "N5", category: "food" },
  { hiragana: "れんしゅう", romaji: "renshuu", english: "practice", jlpt: "N4", category: "study" },
  { hiragana: "わたし", romaji: "watashi", english: "I; me", jlpt: "N5", category: "person" }
];

const officialWordMeta = words.map((word) => ({
  hiragana: word.hiragana,
  romaji: word.romaji,
  english: word.english,
  jlpt: word.jlpt,
  category: word.category
}));

export const kanaRushWordMeta = new Map<string, KanaRushWordMeta>();

[...officialWordMeta, ...curatedKanaRushWords].forEach((word) => {
  if (isKanaRushWord(word.hiragana) && !kanaRushWordMeta.has(word.hiragana)) {
    kanaRushWordMeta.set(word.hiragana, word);
  }
});

acceptedGuesses.forEach((hiragana) => {
  if (
    kanaRushWordMeta.size < KANA_RUSH_TARGET_WORD_COUNT &&
    isKanaRushWord(hiragana) &&
    !kanaRushWordMeta.has(hiragana)
  ) {
    kanaRushWordMeta.set(hiragana, {
      hiragana,
      romaji: romajiForWord(hiragana)
    });
  }
});

export const kanaRushWordSet = new Set(kanaRushWordMeta.keys());

function isKanaRushWord(word: string) {
  const kanaLength = Array.from(word).length;
  return kanaLength >= 2 && kanaLength <= 7 && /^[ぁ-ん]+$/.test(word);
}

function romajiForWord(word: string) {
  return Array.from(word).map((kana) => getKanaRomaji(kana)).join("");
}
