import { WordEntry } from "@/types/game";

export const words: WordEntry[] = [
  {
    id: "neko-001",
    hiragana: "ねこ",
    romaji: "neko",
    english: "cat",
    category: "animal",
    definition: "a small domesticated animal",
    jlpt: "N5"
  },
  {
    id: "inu-001",
    hiragana: "いぬ",
    romaji: "inu",
    english: "dog",
    category: "animal",
    definition: "a common household pet",
    jlpt: "N5"
  },
  {
    id: "mizu-001",
    hiragana: "みず",
    romaji: "mizu",
    english: "water",
    category: "nature",
    definition: "a clear liquid essential for life",
    jlpt: "N5"
  },
  {
    id: "sakura-001",
    hiragana: "さくら",
    romaji: "sakura",
    english: "cherry blossom",
    category: "nature",
    definition: "a pink spring flower in Japan",
    jlpt: "N5"
  },
  {
    id: "ringo-001",
    hiragana: "りんご",
    romaji: "ringo",
    english: "apple",
    category: "food",
    definition: "a red or green fruit",
    jlpt: "N5"
  },
  {
    id: "taberu-001",
    hiragana: "たべる",
    romaji: "taberu",
    english: "to eat",
    category: "verb",
    definition: "to consume food",
    jlpt: "N5"
  },
  {
    id: "nomu-001",
    hiragana: "のむ",
    romaji: "nomu",
    english: "to drink",
    category: "verb",
    definition: "to consume liquid",
    jlpt: "N5"
  },
  {
    id: "denwa-001",
    hiragana: "でんわ",
    romaji: "denwa",
    english: "phone",
    category: "object",
    definition: "a device for communication",
    jlpt: "N5"
  },
  {
    id: "densha-001",
    hiragana: "でんしゃ",
    romaji: "densha",
    english: "train",
    category: "transport",
    definition: "rail transport",
    jlpt: "N5"
  },
  {
    id: "tomodachi-001",
    hiragana: "ともだち",
    romaji: "tomodachi",
    english: "friend",
    category: "person",
    definition: "a close companion",
    jlpt: "N5"
  },
  {
    id: "kaigi-001",
    hiragana: "かいぎ",
    romaji: "kaigi",
    english: "meeting",
    category: "work",
    definition: "a gathering to discuss plans or decisions",
    jlpt: "N4"
  },
  {
    id: "setsumei-001",
    hiragana: "せつめい",
    romaji: "setsumei",
    english: "explanation",
    category: "communication",
    definition: "a statement that makes something clear",
    jlpt: "N4"
  },
  {
    id: "tokubetsu-001",
    hiragana: "とくべつ",
    romaji: "tokubetsu",
    english: "special",
    category: "adjective",
    definition: "different from what is usual or ordinary",
    jlpt: "N4"
  },
  {
    id: "junbi-001",
    hiragana: "じゅんび",
    romaji: "junbi",
    english: "preparation",
    category: "action",
    definition: "getting ready for something",
    jlpt: "N4"
  },
  {
    id: "keiken-001",
    hiragana: "けいけん",
    romaji: "keiken",
    english: "experience",
    category: "life",
    definition: "knowledge gained by doing or seeing something",
    jlpt: "N4"
  },
  {
    id: "kankei-001",
    hiragana: "かんけい",
    romaji: "kankei",
    english: "relationship",
    category: "concept",
    definition: "a connection between people or things",
    jlpt: "N3"
  },
  {
    id: "jissai-001",
    hiragana: "じっさい",
    romaji: "jissai",
    english: "actually",
    category: "adverb",
    definition: "in fact or in reality",
    jlpt: "N3"
  },
  {
    id: "gijutsu-001",
    hiragana: "ぎじゅつ",
    romaji: "gijutsu",
    english: "technology",
    category: "work",
    definition: "practical knowledge or skill used to make things",
    jlpt: "N3"
  },
  {
    id: "kakunin-001",
    hiragana: "かくにん",
    romaji: "kakunin",
    english: "confirmation",
    category: "communication",
    definition: "checking that something is correct",
    jlpt: "N3"
  },
  {
    id: "seikou-001",
    hiragana: "せいこう",
    romaji: "seikou",
    english: "success",
    category: "concept",
    definition: "achieving a goal or desired result",
    jlpt: "N3"
  }
];

export const wordPools = {
  N5: words.filter((word) => word.jlpt === "N5"),
  N4: words.filter((word) => word.jlpt === "N4"),
  N3: words.filter((word) => word.jlpt === "N3")
};
