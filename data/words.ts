import { WordEntry } from "@/types/game";

export const words: WordEntry[] = [
  {
    id: "neko-001",
    hiragana: "ねこ",
    romaji: "neko",
    english: "cat",
    category: "animal",
    definition: "a small domesticated animal",
    jlpt: "N5",
    hintEmoji: "🐱"
  },
  {
    id: "inu-001",
    hiragana: "いぬ",
    romaji: "inu",
    english: "dog",
    category: "animal",
    definition: "a common household pet",
    jlpt: "N5",
    hintEmoji: "🐶"
  },
  {
    id: "risu-001",
    hiragana: "りす",
    romaji: "risu",
    english: "squirrel",
    category: "animal",
    definition: "a small tree-climbing animal with a bushy tail",
    jlpt: "N5",
    hintEmoji: "🐿️"
  },
  {
    id: "mizu-001",
    hiragana: "みず",
    romaji: "mizu",
    english: "water",
    category: "nature",
    definition: "a clear liquid essential for life",
    jlpt: "N5",
    hintEmoji: "💧"
  },
  {
    id: "sakura-001",
    hiragana: "さくら",
    romaji: "sakura",
    english: "cherry blossom",
    category: "nature",
    definition: "a pink spring flower in Japan",
    jlpt: "N5",
    hintEmoji: "🌸"
  },
  {
    id: "ringo-001",
    hiragana: "りんご",
    romaji: "ringo",
    english: "apple",
    category: "food",
    definition: "a red or green fruit",
    jlpt: "N5",
    hintEmoji: "🍎"
  },
  {
    id: "taberu-001",
    hiragana: "たべる",
    romaji: "taberu",
    english: "to eat",
    category: "verb",
    definition: "to consume food",
    jlpt: "N5",
    hintEmoji: "🍽️"
  },
  {
    id: "nomu-001",
    hiragana: "のむ",
    romaji: "nomu",
    english: "to drink",
    category: "verb",
    definition: "to consume liquid",
    jlpt: "N5",
    hintEmoji: "🥤"
  },
  {
    id: "denwa-001",
    hiragana: "でんわ",
    romaji: "denwa",
    english: "phone",
    category: "object",
    definition: "a device for communication",
    jlpt: "N5",
    hintEmoji: "📱"
  },
  {
    id: "densha-001",
    hiragana: "でんしゃ",
    romaji: "densha",
    english: "train",
    category: "transport",
    definition: "rail transport",
    refinedDefinition: "train; rail transport that runs on tracks",
    jlpt: "N5",
    hintEmoji: "🚆",
    closeAnswers: ["くるま", "ばす", "じてんしゃ", "じどうしゃ"],
    confusableWords: [
      {
        word: "くるま",
        romaji: "kuruma",
        english: "car",
        note: "A car drives on roads; でんしゃ is a train on rails."
      },
      {
        word: "ばす",
        romaji: "basu",
        english: "bus",
        note: "A bus runs on roads; でんしゃ runs on tracks."
      }
    ]
  },
  {
    id: "tomodachi-001",
    hiragana: "ともだち",
    romaji: "tomodachi",
    english: "friend",
    category: "person",
    definition: "a close companion",
    jlpt: "N5",
    hintEmoji: "🤝"
  },
  {
    id: "kaigi-001",
    hiragana: "かいぎ",
    romaji: "kaigi",
    english: "meeting",
    category: "work",
    definition: "a gathering to discuss plans or decisions",
    refinedDefinition: "meeting; a gathering to discuss plans or decisions",
    jlpt: "N4",
    hintEmoji: "🗓️",
    closeAnswers: ["せつめいかい", "れんらく", "ほうこく"],
    confusableWords: [
      {
        word: "せつめいかい",
        romaji: "setsumeikai",
        english: "briefing",
        note: "A briefing explains information; かいぎ is a meeting for discussion."
      },
      {
        word: "れんらく",
        romaji: "renraku",
        english: "contact",
        note: "Contact is communication; かいぎ is a meeting."
      },
      {
        word: "ほうこく",
        romaji: "houkoku",
        english: "report",
        note: "A report may happen in a meeting; かいぎ is the meeting itself."
      }
    ]
  },
  {
    id: "setsumei-001",
    hiragana: "せつめい",
    romaji: "setsumei",
    english: "explanation",
    category: "communication",
    definition: "a statement that makes something clear",
    refinedDefinition: "explanation; words that make something clear",
    jlpt: "N4",
    hintEmoji: "💬",
    closeAnswers: ["せつめいかい", "あんない", "ほうこく", "じょうほう"],
    confusableWords: [
      {
        word: "せつめいかい",
        romaji: "setsumeikai",
        english: "briefing",
        note: "A briefing is an event; せつめい is the explanation itself."
      },
      {
        word: "あんない",
        romaji: "annai",
        english: "guidance",
        note: "Guidance directs someone; せつめい explains something."
      },
      {
        word: "ほうこく",
        romaji: "houkoku",
        english: "report",
        note: "A report tells what happened; せつめい explains how or why."
      }
    ]
  },
  {
    id: "tokubetsu-001",
    hiragana: "とくべつ",
    romaji: "tokubetsu",
    english: "special",
    category: "adjective",
    definition: "different from what is usual or ordinary",
    jlpt: "N4",
    hintEmoji: "✨"
  },
  {
    id: "junbi-001",
    hiragana: "じゅんび",
    romaji: "junbi",
    english: "preparation",
    category: "action",
    definition: "getting ready for something",
    jlpt: "N4",
    hintEmoji: "🎒"
  },
  {
    id: "keiken-001",
    hiragana: "けいけん",
    romaji: "keiken",
    english: "experience",
    category: "life",
    definition: "knowledge gained by doing or seeing something",
    jlpt: "N4",
    hintEmoji: "🧭"
  },
  {
    id: "kankei-001",
    hiragana: "かんけい",
    romaji: "kankei",
    english: "relationship",
    category: "concept",
    definition: "a connection between people or things",
    refinedDefinition: "relationship; connection between people or things",
    jlpt: "N3",
    hintEmoji: "🔗",
    closeAnswers: ["せつぞく", "れんらく"],
    confusableWords: [
      {
        word: "せつぞく",
        romaji: "setsuzoku",
        english: "connection",
        note: "Connection often means a physical/system link; かんけい is relationship/association."
      },
      {
        word: "れんらく",
        romaji: "renraku",
        english: "contact",
        note: "Contact is communication; かんけい is a relationship."
      }
    ]
  },
  {
    id: "jissai-001",
    hiragana: "じっさい",
    romaji: "jissai",
    english: "actually",
    category: "adverb",
    definition: "in fact or in reality",
    jlpt: "N3",
    hintEmoji: "✅"
  },
  {
    id: "gijutsu-001",
    hiragana: "ぎじゅつ",
    romaji: "gijutsu",
    english: "technology",
    category: "work",
    definition: "practical knowledge or skill used to make things",
    jlpt: "N3",
    hintEmoji: "💻"
  },
  {
    id: "kakunin-001",
    hiragana: "かくにん",
    romaji: "kakunin",
    english: "confirmation",
    category: "communication",
    definition: "checking that something is correct",
    jlpt: "N3",
    hintEmoji: "☑️"
  },
  {
    id: "seikou-001",
    hiragana: "せいこう",
    romaji: "seikou",
    english: "success",
    category: "concept",
    definition: "achieving a goal or desired result",
    jlpt: "N3",
    hintEmoji: "🏆"
  },
  {
    id: "yama-001",
    hiragana: "やま",
    romaji: "yama",
    english: "mountain",
    category: "nature",
    definition: "a large natural rise of land",
    jlpt: "N5",
    hintEmoji: "⛰️"
  },
  {
    id: "kawa-001",
    hiragana: "かわ",
    romaji: "kawa",
    english: "river",
    category: "nature",
    definition: "a natural stream of water",
    jlpt: "N5",
    hintEmoji: "🏞️"
  },
  {
    id: "sora-001",
    hiragana: "そら",
    romaji: "sora",
    english: "sky",
    category: "nature",
    definition: "the space above the earth",
    jlpt: "N5",
    hintEmoji: "☁️"
  },
  {
    id: "ame-001",
    hiragana: "あめ",
    romaji: "ame",
    english: "rain",
    category: "weather",
    definition: "water that falls from clouds",
    jlpt: "N5",
    hintEmoji: "🌧️"
  },
  {
    id: "yuki-001",
    hiragana: "ゆき",
    romaji: "yuki",
    english: "snow",
    category: "weather",
    definition: "soft frozen water falling from clouds",
    jlpt: "N5",
    hintEmoji: "❄️"
  },
  {
    id: "hana-001",
    hiragana: "はな",
    romaji: "hana",
    english: "flower",
    category: "nature",
    definition: "the colorful part of a plant",
    jlpt: "N5",
    hintEmoji: "🌼"
  },
  {
    id: "ki-001",
    hiragana: "き",
    romaji: "ki",
    english: "tree",
    category: "nature",
    definition: "a tall plant with a trunk",
    jlpt: "N5",
    hintEmoji: "🌳"
  },
  {
    id: "hon-001",
    hiragana: "ほん",
    romaji: "hon",
    english: "book",
    category: "object",
    definition: "printed or written pages bound together",
    jlpt: "N5",
    hintEmoji: "📘"
  },
  {
    id: "isu-001",
    hiragana: "いす",
    romaji: "isu",
    english: "chair",
    category: "object",
    definition: "a seat for one person",
    jlpt: "N5",
    hintEmoji: "🪑"
  },
  {
    id: "tsukue-001",
    hiragana: "つくえ",
    romaji: "tsukue",
    english: "desk",
    category: "object",
    definition: "a table used for work or study",
    jlpt: "N5",
    hintEmoji: "🧑‍💻"
  },
  {
    id: "ie-001",
    hiragana: "いえ",
    romaji: "ie",
    english: "house",
    category: "place",
    definition: "a building where people live",
    refinedDefinition: "house; a home/building where people live",
    jlpt: "N5",
    hintEmoji: "🏠",
    closeAnswers: ["へや", "まち"],
    confusableWords: [
      {
        word: "へや",
        romaji: "heya",
        english: "room",
        note: "A room is inside a house; いえ is the house/home."
      },
      {
        word: "まち",
        romaji: "machi",
        english: "town",
        note: "A town contains houses; いえ is one house/home."
      }
    ]
  },
  {
    id: "heya-001",
    hiragana: "へや",
    romaji: "heya",
    english: "room",
    category: "place",
    definition: "a part of a building enclosed by walls",
    refinedDefinition: "room; one space inside a building or house",
    jlpt: "N5",
    hintEmoji: "🚪",
    closeAnswers: ["いえ", "みせ"],
    confusableWords: [
      {
        word: "いえ",
        romaji: "ie",
        english: "house",
        note: "A house contains rooms; へや is a room."
      },
      {
        word: "みせ",
        romaji: "mise",
        english: "shop",
        note: "A shop is a place; へや is a room."
      }
    ]
  },
  {
    id: "eki-001",
    hiragana: "えき",
    romaji: "eki",
    english: "station",
    category: "transport",
    definition: "a place where trains stop",
    jlpt: "N5",
    hintEmoji: "🚉"
  },
  {
    id: "kuruma-001",
    hiragana: "くるま",
    romaji: "kuruma",
    english: "car",
    category: "transport",
    definition: "a road vehicle with wheels",
    refinedDefinition: "car; a road vehicle for people",
    jlpt: "N5",
    hintEmoji: "🚗",
    closeAnswers: ["じどうしゃ", "ばす", "でんしゃ", "じてんしゃ"],
    confusableWords: [
      {
        word: "じどうしゃ",
        romaji: "jidousha",
        english: "automobile",
        note: "Automobile is more formal; くるま is the common word for car."
      },
      {
        word: "ばす",
        romaji: "basu",
        english: "bus",
        note: "A bus carries many people; くるま is a car."
      }
    ]
  },
  {
    id: "basu-001",
    hiragana: "ばす",
    romaji: "basu",
    english: "bus",
    category: "transport",
    definition: "a large road vehicle for passengers",
    refinedDefinition: "bus; a large road vehicle carrying passengers",
    jlpt: "N5",
    hintEmoji: "🚌",
    closeAnswers: ["くるま", "じどうしゃ", "でんしゃ"],
    confusableWords: [
      {
        word: "くるま",
        romaji: "kuruma",
        english: "car",
        note: "A car is smaller; ばす is a bus."
      },
      {
        word: "でんしゃ",
        romaji: "densha",
        english: "train",
        note: "A train runs on tracks; ばす runs on roads."
      }
    ]
  },
  {
    id: "jitensha-001",
    hiragana: "じてんしゃ",
    romaji: "jitensha",
    english: "bicycle",
    category: "transport",
    definition: "a two-wheeled vehicle powered by pedaling",
    refinedDefinition: "bicycle; a two-wheeled vehicle powered by pedaling",
    jlpt: "N5",
    hintEmoji: "🚲",
    closeAnswers: ["くるま", "ばす", "じどうしゃ"],
    confusableWords: [
      {
        word: "くるま",
        romaji: "kuruma",
        english: "car",
        note: "A car has a motor; じてんしゃ is a bicycle."
      },
      {
        word: "ばす",
        romaji: "basu",
        english: "bus",
        note: "A bus carries passengers; じてんしゃ is a bicycle."
      }
    ]
  },
  {
    id: "gakkou-001",
    hiragana: "がっこう",
    romaji: "gakkou",
    english: "school",
    category: "place",
    definition: "a place where people study",
    jlpt: "N5",
    hintEmoji: "🏫"
  },
  {
    id: "sensei-001",
    hiragana: "せんせい",
    romaji: "sensei",
    english: "teacher",
    category: "person",
    definition: "a person who teaches",
    jlpt: "N5",
    hintEmoji: "🧑‍🏫"
  },
  {
    id: "gakusei-001",
    hiragana: "がくせい",
    romaji: "gakusei",
    english: "student",
    category: "person",
    definition: "a person who studies at school",
    jlpt: "N5",
    hintEmoji: "🎓"
  },
  {
    id: "kodomo-001",
    hiragana: "こども",
    romaji: "kodomo",
    english: "child",
    category: "person",
    definition: "a young person",
    jlpt: "N5",
    hintEmoji: "🧒"
  },
  {
    id: "haha-001",
    hiragana: "はは",
    romaji: "haha",
    english: "mother",
    category: "family",
    definition: "one's mother",
    jlpt: "N5",
    hintEmoji: "👩"
  },
  {
    id: "chichi-001",
    hiragana: "ちち",
    romaji: "chichi",
    english: "father",
    category: "family",
    definition: "one's father",
    jlpt: "N5",
    hintEmoji: "👨"
  },
  {
    id: "ani-001",
    hiragana: "あに",
    romaji: "ani",
    english: "older brother",
    category: "family",
    definition: "one's older brother",
    jlpt: "N5",
    hintEmoji: "👦"
  },
  {
    id: "ane-001",
    hiragana: "あね",
    romaji: "ane",
    english: "older sister",
    category: "family",
    definition: "one's older sister",
    jlpt: "N5",
    hintEmoji: "👧"
  },
  {
    id: "asa-001",
    hiragana: "あさ",
    romaji: "asa",
    english: "morning",
    category: "time",
    definition: "the early part of the day",
    refinedDefinition: "morning; early part of the day",
    jlpt: "N5",
    hintEmoji: "🌅",
    closeAnswers: ["ひる", "よる", "きょう"],
    confusableWords: [
      {
        word: "ひる",
        romaji: "hiru",
        english: "noon",
        note: "Noon is midday; あさ is morning."
      },
      {
        word: "よる",
        romaji: "yoru",
        english: "night",
        note: "Night is late/dark; あさ is morning."
      }
    ]
  },
  {
    id: "hiru-001",
    hiragana: "ひる",
    romaji: "hiru",
    english: "noon",
    category: "time",
    definition: "the middle of the day",
    refinedDefinition: "noon/daytime; the middle part of the day",
    jlpt: "N5",
    hintEmoji: "☀️",
    closeAnswers: ["あさ", "よる", "きょう"],
    confusableWords: [
      {
        word: "あさ",
        romaji: "asa",
        english: "morning",
        note: "Morning is early; ひる is noon/daytime."
      },
      {
        word: "よる",
        romaji: "yoru",
        english: "night",
        note: "Night is dark; ひる is daytime/noon."
      }
    ]
  },
  {
    id: "yoru-001",
    hiragana: "よる",
    romaji: "yoru",
    english: "night",
    category: "time",
    definition: "the dark part of the day",
    refinedDefinition: "night; the dark part of the day",
    jlpt: "N5",
    hintEmoji: "🌙",
    closeAnswers: ["あさ", "ひる", "きょう"],
    confusableWords: [
      {
        word: "あさ",
        romaji: "asa",
        english: "morning",
        note: "Morning is early; よる is night."
      },
      {
        word: "ひる",
        romaji: "hiru",
        english: "noon",
        note: "Noon/daytime is bright; よる is night."
      }
    ]
  },
  {
    id: "kasa-001",
    hiragana: "かさ",
    romaji: "kasa",
    english: "umbrella",
    category: "object",
    definition: "a cover used in rain",
    jlpt: "N5",
    hintEmoji: "☂️"
  },
  {
    id: "kutsu-001",
    hiragana: "くつ",
    romaji: "kutsu",
    english: "shoes",
    category: "clothing",
    definition: "footwear",
    refinedDefinition: "shoes; footwear worn on the feet",
    jlpt: "N5",
    hintEmoji: "👟",
    closeAnswers: ["ふく", "ぼうし"],
    confusableWords: [
      {
        word: "ふく",
        romaji: "fuku",
        english: "clothes",
        note: "Clothes is broader; くつ is specifically shoes."
      },
      {
        word: "ぼうし",
        romaji: "boushi",
        english: "hat",
        note: "A hat is worn on the head; くつ are worn on the feet."
      }
    ]
  },
  {
    id: "fuku-001",
    hiragana: "ふく",
    romaji: "fuku",
    english: "clothes",
    category: "clothing",
    definition: "things worn on the body",
    refinedDefinition: "clothes; garments worn on the body",
    jlpt: "N5",
    hintEmoji: "👕",
    closeAnswers: ["くつ", "ぼうし", "めがね"],
    confusableWords: [
      {
        word: "くつ",
        romaji: "kutsu",
        english: "shoes",
        note: "Shoes are footwear; ふく means clothes in general."
      },
      {
        word: "ぼうし",
        romaji: "boushi",
        english: "hat",
        note: "A hat is one clothing item; ふく means clothes."
      },
      {
        word: "めがね",
        romaji: "megane",
        english: "glasses",
        note: "Glasses are worn, but ふく means clothes/garments."
      }
    ]
  },
  {
    id: "okane-001",
    hiragana: "おかね",
    romaji: "okane",
    english: "money",
    category: "object",
    definition: "currency used to buy things",
    jlpt: "N5",
    hintEmoji: "💴"
  },
  {
    id: "niku-001",
    hiragana: "にく",
    romaji: "niku",
    english: "meat",
    category: "food",
    definition: "animal flesh eaten as food",
    jlpt: "N5",
    hintEmoji: "🍖"
  },
  {
    id: "sakana-001",
    hiragana: "さかな",
    romaji: "sakana",
    english: "fish",
    category: "food",
    definition: "an animal that lives in water",
    jlpt: "N5",
    hintEmoji: "🐟"
  },
  {
    id: "yasai-001",
    hiragana: "やさい",
    romaji: "yasai",
    english: "vegetables",
    category: "food",
    definition: "plants eaten as food",
    jlpt: "N5",
    hintEmoji: "🥦"
  },
  {
    id: "tamago-001",
    hiragana: "たまご",
    romaji: "tamago",
    english: "egg",
    category: "food",
    definition: "an egg used as food",
    jlpt: "N5",
    hintEmoji: "🥚"
  },
  {
    id: "pan-001",
    hiragana: "ぱん",
    romaji: "pan",
    english: "bread",
    category: "food",
    definition: "food made from baked dough",
    jlpt: "N5",
    hintEmoji: "🍞"
  },
  {
    id: "miru-001",
    hiragana: "みる",
    romaji: "miru",
    english: "to see",
    category: "verb",
    definition: "to look at or watch",
    jlpt: "N5",
    hintEmoji: "👀"
  },
  {
    id: "kiku-001",
    hiragana: "きく",
    romaji: "kiku",
    english: "to listen",
    category: "verb",
    definition: "to hear or listen",
    jlpt: "N5",
    hintEmoji: "👂"
  },
  {
    id: "iku-001",
    hiragana: "いく",
    romaji: "iku",
    english: "to go",
    category: "verb",
    definition: "to move toward a place",
    jlpt: "N5",
    hintEmoji: "➡️"
  },
  {
    id: "kuru-001",
    hiragana: "くる",
    romaji: "kuru",
    english: "to come",
    category: "verb",
    definition: "to move toward the speaker",
    jlpt: "N5",
    hintEmoji: "⬅️"
  },
  {
    id: "kaeru-001",
    hiragana: "かえる",
    romaji: "kaeru",
    english: "to return",
    category: "verb",
    definition: "to go back",
    jlpt: "N4",
    hintEmoji: "↩️"
  },
  {
    id: "hajimeru-001",
    hiragana: "はじめる",
    romaji: "hajimeru",
    english: "to begin",
    category: "verb",
    definition: "to start something",
    jlpt: "N4",
    hintEmoji: "▶️"
  },
  {
    id: "owaru-001",
    hiragana: "おわる",
    romaji: "owaru",
    english: "to end",
    category: "verb",
    definition: "to finish",
    jlpt: "N4",
    hintEmoji: "🏁"
  },
  {
    id: "tsukau-001",
    hiragana: "つかう",
    romaji: "tsukau",
    english: "to use",
    category: "verb",
    definition: "to make use of something",
    jlpt: "N4",
    hintEmoji: "🛠️"
  },
  {
    id: "kau-001",
    hiragana: "かう",
    romaji: "kau",
    english: "to buy",
    category: "verb",
    definition: "to purchase something",
    jlpt: "N4",
    hintEmoji: "🛒"
  },
  {
    id: "uru-001",
    hiragana: "うる",
    romaji: "uru",
    english: "to sell",
    category: "verb",
    definition: "to exchange goods for money",
    jlpt: "N4",
    hintEmoji: "🏷️"
  },
  {
    id: "omou-001",
    hiragana: "おもう",
    romaji: "omou",
    english: "to think",
    category: "verb",
    definition: "to have an idea or opinion",
    jlpt: "N4",
    hintEmoji: "💭"
  },
  {
    id: "shiru-001",
    hiragana: "しる",
    romaji: "shiru",
    english: "to know",
    category: "verb",
    definition: "to have knowledge of something",
    jlpt: "N4",
    hintEmoji: "🧠"
  },
  {
    id: "machigai-001",
    hiragana: "まちがい",
    romaji: "machigai",
    english: "mistake",
    category: "concept",
    definition: "something incorrect",
    jlpt: "N4",
    hintEmoji: "❌"
  },
  {
    id: "mondai-001",
    hiragana: "もんだい",
    romaji: "mondai",
    english: "problem",
    category: "concept",
    definition: "a question or difficult matter",
    jlpt: "N4",
    hintEmoji: "❓"
  },
  {
    id: "shigoto-001",
    hiragana: "しごと",
    romaji: "shigoto",
    english: "work",
    category: "work",
    definition: "a job or task",
    refinedDefinition: "work; a job or task someone does",
    jlpt: "N4",
    hintEmoji: "💼",
    closeAnswers: ["かいしゃ", "かいぎ", "しりょう", "せきにん"],
    confusableWords: [
      {
        word: "かいしゃ",
        romaji: "kaisha",
        english: "company",
        note: "A company is a workplace; しごと is work/job."
      },
      {
        word: "しりょう",
        romaji: "shiryou",
        english: "materials",
        note: "Materials are used for work; しごと is the work itself."
      },
      {
        word: "せきにん",
        romaji: "sekinin",
        english: "responsibility",
        note: "Responsibility is duty; しごと is work/task."
      }
    ]
  },
  {
    id: "byouin-001",
    hiragana: "びょういん",
    romaji: "byouin",
    english: "hospital",
    category: "place",
    definition: "a place where sick people receive care",
    refinedDefinition: "hospital; a medical place where sick or injured people receive care",
    jlpt: "N4",
    hintEmoji: "🏥",
    closeAnswers: ["くすり", "ねつ", "けが", "ちゅうしゃ"],
    confusableWords: [
      {
        word: "くすり",
        romaji: "kusuri",
        english: "medicine",
        note: "Medicine is used for treatment; びょういん is the hospital."
      },
      {
        word: "ねつ",
        romaji: "netsu",
        english: "fever",
        note: "Fever is a symptom; びょういん is the place for care."
      },
      {
        word: "けが",
        romaji: "kega",
        english: "injury",
        note: "Injury is a condition; びょういん is the hospital."
      }
    ]
  },
  {
    id: "kusuri-001",
    hiragana: "くすり",
    romaji: "kusuri",
    english: "medicine",
    category: "health",
    definition: "something used to treat illness",
    refinedDefinition: "medicine; something taken to treat illness",
    jlpt: "N4",
    hintEmoji: "💊",
    closeAnswers: ["びょういん", "ねつ", "ちゅうしゃ"],
    confusableWords: [
      {
        word: "びょういん",
        romaji: "byouin",
        english: "hospital",
        note: "Hospital is the place; くすり is medicine."
      },
      {
        word: "ちゅうしゃ",
        romaji: "chuusha",
        english: "injection",
        note: "An injection can deliver medicine; くすり is medicine generally."
      }
    ]
  },
  {
    id: "karada-001",
    hiragana: "からだ",
    romaji: "karada",
    english: "body",
    category: "health",
    definition: "the physical form of a person",
    jlpt: "N4",
    hintEmoji: "🧍"
  },
  {
    id: "atama-001",
    hiragana: "あたま",
    romaji: "atama",
    english: "head",
    category: "body",
    definition: "the upper part of the body",
    jlpt: "N4",
    hintEmoji: "🙂"
  },
  {
    id: "kokoro-001",
    hiragana: "こころ",
    romaji: "kokoro",
    english: "heart",
    category: "feeling",
    definition: "mind, spirit, or heart",
    jlpt: "N4",
    hintEmoji: "❤️"
  },
  {
    id: "genki-001",
    hiragana: "げんき",
    romaji: "genki",
    english: "healthy",
    category: "feeling",
    definition: "healthy, energetic, or doing well",
    jlpt: "N5",
    hintEmoji: "💪"
  },
  {
    id: "kimochi-001",
    hiragana: "きもち",
    romaji: "kimochi",
    english: "feeling",
    category: "feeling",
    definition: "an emotion or physical sensation",
    jlpt: "N4",
    hintEmoji: "😊"
  },
  {
    id: "ryokou-001",
    hiragana: "りょこう",
    romaji: "ryokou",
    english: "travel",
    category: "travel",
    definition: "going to another place",
    jlpt: "N4",
    hintEmoji: "✈️"
  },
  {
    id: "shashin-001",
    hiragana: "しゃしん",
    romaji: "shashin",
    english: "photo",
    category: "object",
    definition: "a picture taken with a camera",
    jlpt: "N4",
    hintEmoji: "📷"
  },
  {
    id: "ongaku-001",
    hiragana: "おんがく",
    romaji: "ongaku",
    english: "music",
    category: "art",
    definition: "organized sound with rhythm or melody",
    jlpt: "N4",
    hintEmoji: "🎵"
  },
  {
    id: "eiga-001",
    hiragana: "えいが",
    romaji: "eiga",
    english: "movie",
    category: "art",
    definition: "a story shown with moving pictures",
    jlpt: "N4",
    hintEmoji: "🎬"
  },
  {
    id: "anzen-001",
    hiragana: "あんぜん",
    romaji: "anzen",
    english: "safety",
    category: "concept",
    definition: "being free from danger",
    jlpt: "N4",
    hintEmoji: "🛡️"
  },
  {
    id: "benri-001",
    hiragana: "べんり",
    romaji: "benri",
    english: "convenient",
    category: "adjective",
    definition: "easy and useful",
    jlpt: "N4",
    hintEmoji: "👌"
  },
  {
    id: "fuben-001",
    hiragana: "ふべん",
    romaji: "fuben",
    english: "inconvenient",
    category: "adjective",
    definition: "not easy or useful",
    jlpt: "N4",
    hintEmoji: "😕"
  },
  {
    id: "hayaku-001",
    hiragana: "はやく",
    romaji: "hayaku",
    english: "quickly",
    category: "adverb",
    definition: "with speed or without delay",
    jlpt: "N4",
    hintEmoji: "⚡"
  },
  {
    id: "taisetsu-001",
    hiragana: "たいせつ",
    romaji: "taisetsu",
    english: "important",
    category: "adjective",
    definition: "having great value",
    jlpt: "N3",
    hintEmoji: "⭐"
  },
  {
    id: "hitsuyou-001",
    hiragana: "ひつよう",
    romaji: "hitsuyou",
    english: "necessary",
    category: "adjective",
    definition: "needed or required",
    jlpt: "N3",
    hintEmoji: "🔑"
  },
  {
    id: "kanousei-001",
    hiragana: "かのうせい",
    romaji: "kanousei",
    english: "possibility",
    category: "concept",
    definition: "a chance that something may happen",
    jlpt: "N3",
    hintEmoji: "💡"
  },
  {
    id: "shourai-001",
    hiragana: "しょうらい",
    romaji: "shourai",
    english: "future",
    category: "time",
    definition: "the time that has not happened yet",
    jlpt: "N3",
    hintEmoji: "🔮"
  },
  {
    id: "genzai-001",
    hiragana: "げんざい",
    romaji: "genzai",
    english: "present",
    category: "time",
    definition: "the current time",
    jlpt: "N3",
    hintEmoji: "📍"
  },
  {
    id: "jiyuu-001",
    hiragana: "じゆう",
    romaji: "jiyuu",
    english: "freedom",
    category: "concept",
    definition: "the state of being free",
    jlpt: "N3",
    hintEmoji: "🕊️"
  },
  {
    id: "bunka-001",
    hiragana: "ぶんか",
    romaji: "bunka",
    english: "culture",
    category: "society",
    definition: "customs, arts, and ways of life",
    jlpt: "N3",
    hintEmoji: "🏮"
  },
  {
    id: "shakai-001",
    hiragana: "しゃかい",
    romaji: "shakai",
    english: "society",
    category: "society",
    definition: "people living together in a community",
    jlpt: "N3",
    hintEmoji: "🏙️"
  },
  {
    id: "seiji-001",
    hiragana: "せいじ",
    romaji: "seiji",
    english: "politics",
    category: "society",
    definition: "activities related to governing",
    jlpt: "N3",
    hintEmoji: "🏛️"
  },
  {
    id: "keizai-001",
    hiragana: "けいざい",
    romaji: "keizai",
    english: "economy",
    category: "society",
    definition: "the system of money, trade, and work",
    jlpt: "N3",
    hintEmoji: "📈"
  },
  {
    id: "kankyou-001",
    hiragana: "かんきょう",
    romaji: "kankyou",
    english: "environment",
    category: "nature",
    definition: "the natural world around us",
    jlpt: "N3",
    hintEmoji: "🌍"
  },
  {
    id: "jinkou-001",
    hiragana: "じんこう",
    romaji: "jinkou",
    english: "population",
    category: "society",
    definition: "the number of people in a place",
    jlpt: "N3",
    hintEmoji: "👥"
  },
  {
    id: "kenkyuu-001",
    hiragana: "けんきゅう",
    romaji: "kenkyuu",
    english: "research",
    category: "study",
    definition: "careful study to discover new information",
    refinedDefinition: "research; careful study to discover new information",
    jlpt: "N3",
    hintEmoji: "🔬",
    closeAnswers: ["ちょうさ", "べんきょう", "じょうほう"],
    confusableWords: [
      {
        word: "ちょうさ",
        romaji: "chousa",
        english: "survey",
        note: "A survey can be part of research; けんきゅう is broader investigation."
      },
      {
        word: "べんきょう",
        romaji: "benkyou",
        english: "study",
        note: "Study is learning; けんきゅう is research to find new information."
      }
    ]
  },
  {
    id: "chousa-001",
    hiragana: "ちょうさ",
    romaji: "chousa",
    english: "survey",
    category: "study",
    definition: "an investigation or examination",
    refinedDefinition: "survey; an investigation or examination to gather information",
    jlpt: "N3",
    hintEmoji: "📋",
    closeAnswers: ["けんきゅう", "じょうほう"],
    confusableWords: [
      {
        word: "けんきゅう",
        romaji: "kenkyuu",
        english: "research",
        note: "Research is broader; ちょうさ is a survey/investigation."
      },
      {
        word: "じょうほう",
        romaji: "jouhou",
        english: "information",
        note: "Information is what you collect; ちょうさ is the act of investigating."
      }
    ]
  },
  {
    id: "jouhou-001",
    hiragana: "じょうほう",
    romaji: "jouhou",
    english: "information",
    category: "communication",
    definition: "facts or knowledge about something",
    jlpt: "N3",
    hintEmoji: "ℹ️"
  },
  {
    id: "machi-001",
    hiragana: "まち",
    romaji: "machi",
    english: "town",
    category: "place",
    definition: "a place where many people live and work",
    refinedDefinition: "town; an area where people live and work",
    jlpt: "N5",
    hintEmoji: "🏘️",
    closeAnswers: ["いえ", "みせ", "こうえん"],
    confusableWords: [
      {
        word: "いえ",
        romaji: "ie",
        english: "house",
        note: "A house is one building; まち is a town."
      },
      {
        word: "みせ",
        romaji: "mise",
        english: "shop",
        note: "A shop is in a town; まち is the town."
      }
    ]
  },
  {
    id: "mise-001",
    hiragana: "みせ",
    romaji: "mise",
    english: "shop",
    category: "place",
    definition: "a place where things are sold",
    refinedDefinition: "shop; a place where things are sold",
    jlpt: "N5",
    hintEmoji: "🏬",
    closeAnswers: ["まち", "かいしゃ", "かいもの"],
    confusableWords: [
      {
        word: "まち",
        romaji: "machi",
        english: "town",
        note: "A shop can be in a town; みせ is the shop."
      },
      {
        word: "かいもの",
        romaji: "kaimono",
        english: "shopping",
        note: "Shopping is the activity; みせ is the shop."
      }
    ]
  },
  {
    id: "kaisha-001",
    hiragana: "かいしゃ",
    romaji: "kaisha",
    english: "company",
    category: "work",
    definition: "a business organization",
    jlpt: "N5",
    hintEmoji: "🏢"
  },
  {
    id: "kouen-001",
    hiragana: "こうえん",
    romaji: "kouen",
    english: "park",
    category: "place",
    definition: "an outdoor public space",
    refinedDefinition: "park; a public outdoor space with grass or trees",
    jlpt: "N5",
    hintEmoji: "🌳",
    closeAnswers: ["まち", "にわ"],
    confusableWords: [
      {
        word: "まち",
        romaji: "machi",
        english: "town",
        note: "A park can be in a town; こうえん is the park."
      },
      {
        word: "にわ",
        romaji: "niwa",
        english: "garden",
        note: "A garden is often private; こうえん is a public park."
      }
    ]
  },
  {
    id: "toire-001",
    hiragana: "といれ",
    romaji: "toire",
    english: "toilet",
    category: "place",
    definition: "a bathroom or restroom",
    jlpt: "N5",
    hintEmoji: "🚻"
  },
  {
    id: "kyou-001",
    hiragana: "きょう",
    romaji: "kyou",
    english: "today",
    category: "time",
    definition: "this day",
    refinedDefinition: "today; this present day",
    jlpt: "N5",
    hintEmoji: "📅",
    closeAnswers: ["あした", "きのう", "じこく", "よてい"],
    confusableWords: [
      {
        word: "あした",
        romaji: "ashita",
        english: "tomorrow",
        note: "Tomorrow is the next day; きょう is today."
      },
      {
        word: "きのう",
        romaji: "kinou",
        english: "yesterday",
        note: "Yesterday is the previous day; きょう is today."
      }
    ]
  },
  {
    id: "ashita-001",
    hiragana: "あした",
    romaji: "ashita",
    english: "tomorrow",
    category: "time",
    definition: "the day after today",
    refinedDefinition: "tomorrow; the day after today",
    jlpt: "N5",
    hintEmoji: "➡️",
    closeAnswers: ["きょう", "きのう", "よてい"],
    confusableWords: [
      {
        word: "きょう",
        romaji: "kyou",
        english: "today",
        note: "Today is the present day; あした is tomorrow."
      },
      {
        word: "きのう",
        romaji: "kinou",
        english: "yesterday",
        note: "Yesterday is before today; あした is after today."
      }
    ]
  },
  {
    id: "kinou-001",
    hiragana: "きのう",
    romaji: "kinou",
    english: "yesterday",
    category: "time",
    definition: "the day before today",
    refinedDefinition: "yesterday; the day before today",
    jlpt: "N5",
    hintEmoji: "⬅️",
    closeAnswers: ["きょう", "あした"],
    confusableWords: [
      {
        word: "きょう",
        romaji: "kyou",
        english: "today",
        note: "Today is the present day; きのう is yesterday."
      },
      {
        word: "あした",
        romaji: "ashita",
        english: "tomorrow",
        note: "Tomorrow is after today; きのう is before today."
      }
    ]
  },
  {
    id: "tokei-001",
    hiragana: "とけい",
    romaji: "tokei",
    english: "clock",
    category: "object",
    definition: "an object that shows time",
    jlpt: "N5",
    hintEmoji: "⏰"
  },
  {
    id: "kaban-001",
    hiragana: "かばん",
    romaji: "kaban",
    english: "bag",
    category: "object",
    definition: "something used to carry items",
    jlpt: "N5",
    hintEmoji: "🎒"
  },
  {
    id: "enpitsu-001",
    hiragana: "えんぴつ",
    romaji: "enpitsu",
    english: "pencil",
    category: "object",
    definition: "a tool for writing or drawing",
    jlpt: "N5",
    hintEmoji: "✏️"
  },
  {
    id: "kagi-001",
    hiragana: "かぎ",
    romaji: "kagi",
    english: "key",
    category: "object",
    definition: "an object used to open a lock",
    jlpt: "N5",
    hintEmoji: "🔑"
  },
  {
    id: "saifu-001",
    hiragana: "さいふ",
    romaji: "saifu",
    english: "wallet",
    category: "object",
    definition: "a small case for money",
    jlpt: "N5",
    hintEmoji: "👛"
  },
  {
    id: "megane-001",
    hiragana: "めがね",
    romaji: "megane",
    english: "glasses",
    category: "object",
    definition: "lenses worn to help vision",
    jlpt: "N5",
    hintEmoji: "👓"
  },
  {
    id: "kao-001",
    hiragana: "かお",
    romaji: "kao",
    english: "face",
    category: "body",
    definition: "the front part of the head",
    jlpt: "N5",
    hintEmoji: "🙂"
  },
  {
    id: "te-001",
    hiragana: "て",
    romaji: "te",
    english: "hand",
    category: "body",
    definition: "the body part used to hold things",
    jlpt: "N5",
    hintEmoji: "✋"
  },
  {
    id: "ashi-001",
    hiragana: "あし",
    romaji: "ashi",
    english: "leg",
    category: "body",
    definition: "a body part used for standing or walking",
    jlpt: "N5",
    hintEmoji: "🦵"
  },
  {
    id: "me-001",
    hiragana: "め",
    romaji: "me",
    english: "eye",
    category: "body",
    definition: "the body part used for seeing",
    jlpt: "N5",
    hintEmoji: "👁️"
  },
  {
    id: "mimi-001",
    hiragana: "みみ",
    romaji: "mimi",
    english: "ear",
    category: "body",
    definition: "the body part used for hearing",
    jlpt: "N5",
    hintEmoji: "👂"
  },
  {
    id: "kuchi-001",
    hiragana: "くち",
    romaji: "kuchi",
    english: "mouth",
    category: "body",
    definition: "the body part used for eating and speaking",
    jlpt: "N5",
    hintEmoji: "👄"
  },
  {
    id: "ushi-001",
    hiragana: "うし",
    romaji: "ushi",
    english: "cow",
    category: "animal",
    definition: "a large farm animal",
    jlpt: "N5",
    hintEmoji: "🐄"
  },
  {
    id: "uma-001",
    hiragana: "うま",
    romaji: "uma",
    english: "horse",
    category: "animal",
    definition: "a large animal people can ride",
    jlpt: "N5",
    hintEmoji: "🐴"
  },
  {
    id: "tori-001",
    hiragana: "とり",
    romaji: "tori",
    english: "bird",
    category: "animal",
    definition: "an animal with wings and feathers",
    jlpt: "N5",
    hintEmoji: "🐦"
  },
  {
    id: "mushi-001",
    hiragana: "むし",
    romaji: "mushi",
    english: "insect",
    category: "animal",
    definition: "a small animal with many legs",
    jlpt: "N5",
    hintEmoji: "🐛"
  },
  {
    id: "gohan-001",
    hiragana: "ごはん",
    romaji: "gohan",
    english: "rice",
    category: "food",
    definition: "cooked rice or a meal",
    jlpt: "N5",
    hintEmoji: "🍚"
  },
  {
    id: "ocha-001",
    hiragana: "おちゃ",
    romaji: "ocha",
    english: "tea",
    category: "drink",
    definition: "a warm drink made from leaves",
    jlpt: "N5",
    hintEmoji: "🍵"
  },
  {
    id: "kaku-001",
    hiragana: "かく",
    romaji: "kaku",
    english: "to write",
    category: "verb",
    definition: "to make letters or words",
    jlpt: "N5",
    hintEmoji: "✍️"
  },
  {
    id: "hanasu-001",
    hiragana: "はなす",
    romaji: "hanasu",
    english: "to speak",
    category: "verb",
    definition: "to say words",
    jlpt: "N5",
    hintEmoji: "🗣️"
  },
  {
    id: "kanashii-001",
    hiragana: "かなしい",
    romaji: "kanashii",
    english: "sad",
    category: "feeling",
    definition: "feeling unhappy",
    jlpt: "N4",
    hintEmoji: "😢"
  },
  {
    id: "ureshii-001",
    hiragana: "うれしい",
    romaji: "ureshii",
    english: "happy",
    category: "feeling",
    definition: "feeling glad",
    jlpt: "N4",
    hintEmoji: "😊"
  },
  {
    id: "hazukashii-001",
    hiragana: "はずかしい",
    romaji: "hazukashii",
    english: "embarrassed",
    category: "feeling",
    definition: "feeling shy or ashamed",
    jlpt: "N4",
    hintEmoji: "🫣"
  },
  {
    id: "nemui-001",
    hiragana: "ねむい",
    romaji: "nemui",
    english: "sleepy",
    category: "feeling",
    definition: "wanting to sleep",
    jlpt: "N4",
    hintEmoji: "😴"
  },
  {
    id: "kowai-001",
    hiragana: "こわい",
    romaji: "kowai",
    english: "scary",
    category: "feeling",
    definition: "causing fear",
    jlpt: "N4",
    hintEmoji: "😨"
  },
  {
    id: "kibun-001",
    hiragana: "きぶん",
    romaji: "kibun",
    english: "mood",
    category: "feeling",
    definition: "how someone feels",
    jlpt: "N4",
    hintEmoji: "🙂"
  },
  {
    id: "renshuu-001",
    hiragana: "れんしゅう",
    romaji: "renshuu",
    english: "practice",
    category: "study",
    definition: "practice; training repeatedly to improve a skill",
    refinedDefinition: "practice; repeated training to improve a skill",
    jlpt: "N4",
    hintEmoji: "🏋️",
    closeAnswers: ["べんきょう", "しゅくだい", "じゅぎょう", "どりょく"],
    confusableWords: [
      {
        word: "べんきょう",
        romaji: "benkyou",
        english: "study",
        note: "Broader learning or studying; れんしゅう is repeated practice/training."
      },
      {
        word: "しゅくだい",
        romaji: "shukudai",
        english: "homework",
        note: "Homework is assigned work; れんしゅう is repeated practice."
      },
      {
        word: "じゅぎょう",
        romaji: "jugyou",
        english: "class",
        note: "Class is a lesson; れんしゅう is practice/training."
      },
      {
        word: "どりょく",
        romaji: "doryoku",
        english: "effort",
        note: "Effort is the energy you put in; practice is the repeated action."
      }
    ],
  },
  {
    id: "shiken-001",
    hiragana: "しけん",
    romaji: "shiken",
    english: "exam",
    category: "study",
    definition: "a test of knowledge or skill",
    refinedDefinition: "exam; a test of knowledge or skill",
    jlpt: "N4",
    hintEmoji: "📝",
    closeAnswers: ["べんきょう", "しゅくだい", "ごうかく", "ふごうかく"],
    confusableWords: [
      {
        word: "べんきょう",
        romaji: "benkyou",
        english: "study",
        note: "Study prepares you for an exam; しけん is the exam itself."
      },
      {
        word: "しゅくだい",
        romaji: "shukudai",
        english: "homework",
        note: "Homework is assigned work; しけん is a test."
      },
      {
        word: "ごうかく",
        romaji: "goukaku",
        english: "passing",
        note: "Passing is an exam result; しけん is the exam."
      }
    ]
  },
  {
    id: "shukudai-001",
    hiragana: "しゅくだい",
    romaji: "shukudai",
    english: "homework",
    category: "study",
    definition: "homework; schoolwork assigned to do outside class",
    refinedDefinition: "homework; assigned schoolwork done outside class",
    jlpt: "N4",
    hintEmoji: "📚",
    closeAnswers: ["べんきょう", "れんしゅう", "じゅぎょう"],
    confusableWords: [
      {
        word: "べんきょう",
        romaji: "benkyou",
        english: "study",
        note: "Study is broader; しゅくだい is assigned homework."
      },
      {
        word: "れんしゅう",
        romaji: "renshuu",
        english: "practice",
        note: "Practice is training; しゅくだい is homework assigned by a teacher."
      },
      {
        word: "じゅぎょう",
        romaji: "jugyou",
        english: "class",
        note: "Class is lesson time; しゅくだい is work done outside class."
      }
    ],
  },
  {
    id: "jugyou-001",
    hiragana: "じゅぎょう",
    romaji: "jugyou",
    english: "class",
    category: "study",
    definition: "class; a lesson at school",
    refinedDefinition: "class; a lesson taught at school",
    jlpt: "N4",
    hintEmoji: "🏫",
    closeAnswers: ["べんきょう", "しゅくだい", "れんしゅう"],
    confusableWords: [
      {
        word: "べんきょう",
        romaji: "benkyou",
        english: "study",
        note: "Study is broader; じゅぎょう is a class or lesson."
      },
      {
        word: "しゅくだい",
        romaji: "shukudai",
        english: "homework",
        note: "Homework is done outside class; じゅぎょう is the class itself."
      },
      {
        word: "れんしゅう",
        romaji: "renshuu",
        english: "practice",
        note: "Practice is repeated training; じゅぎょう is a lesson/class."
      }
    ],
  },
  {
    id: "seito-001",
    hiragana: "せいと",
    romaji: "seito",
    english: "student",
    category: "person",
    definition: "a person who studies at school",
    jlpt: "N4",
    hintEmoji: "🧑‍🎓"
  },
  {
    id: "senpai-001",
    hiragana: "せんぱい",
    romaji: "senpai",
    english: "senior",
    category: "person",
    definition: "someone with more experience in a group",
    jlpt: "N4",
    hintEmoji: "🧑‍🏫"
  },
  {
    id: "tenin-001",
    hiragana: "てんいん",
    romaji: "tenin",
    english: "clerk",
    category: "person",
    definition: "a person who works in a store",
    jlpt: "N4",
    hintEmoji: "🧑‍💼"
  },
  {
    id: "shachou-001",
    hiragana: "しゃちょう",
    romaji: "shachou",
    english: "company president",
    category: "person",
    definition: "the head of a company",
    jlpt: "N4",
    hintEmoji: "👔"
  },
  {
    id: "koutsuu-001",
    hiragana: "こうつう",
    romaji: "koutsuu",
    english: "traffic",
    category: "transport",
    definition: "movement of vehicles and people",
    jlpt: "N4",
    hintEmoji: "🚦"
  },
  {
    id: "jidousha-001",
    hiragana: "じどうしゃ",
    romaji: "jidousha",
    english: "automobile",
    category: "transport",
    definition: "a car or motor vehicle",
    refinedDefinition: "automobile; a motor vehicle such as a car",
    jlpt: "N4",
    hintEmoji: "🚗",
    closeAnswers: ["くるま", "ばす"],
    confusableWords: [
      {
        word: "くるま",
        romaji: "kuruma",
        english: "car",
        note: "Car is the common word; じどうしゃ is the formal word for automobile."
      },
      {
        word: "ばす",
        romaji: "basu",
        english: "bus",
        note: "A bus is a vehicle, but じどうしゃ is automobile/motor vehicle."
      }
    ]
  },
  {
    id: "jikoku-001",
    hiragana: "じこく",
    romaji: "jikoku",
    english: "time",
    category: "time",
    definition: "a specific point on a clock",
    refinedDefinition: "time; a specific point on a clock or schedule",
    jlpt: "N4",
    hintEmoji: "🕒",
    closeAnswers: ["とけい", "よてい", "きょう"],
    confusableWords: [
      {
        word: "とけい",
        romaji: "tokei",
        english: "clock",
        note: "A clock shows time; じこく is the time itself."
      },
      {
        word: "よてい",
        romaji: "yotei",
        english: "plan",
        note: "Plans happen at times; じこく is a specific time."
      }
    ]
  },
  {
    id: "yotei-001",
    hiragana: "よてい",
    romaji: "yotei",
    english: "plan",
    category: "time",
    definition: "something arranged for the future",
    refinedDefinition: "plan; something arranged for the future",
    jlpt: "N4",
    hintEmoji: "📆",
    closeAnswers: ["じこく", "きょう", "あした", "もくひょう"],
    confusableWords: [
      {
        word: "じこく",
        romaji: "jikoku",
        english: "time",
        note: "Time is when something happens; よてい is the plan/schedule."
      },
      {
        word: "もくひょう",
        romaji: "mokuhyou",
        english: "goal",
        note: "A goal is a target; よてい is an arranged plan."
      }
    ]
  },
  {
    id: "sanpo-001",
    hiragana: "さんぽ",
    romaji: "sanpo",
    english: "walk",
    category: "activity",
    definition: "a short walk for pleasure",
    jlpt: "N4",
    hintEmoji: "🚶"
  },
  {
    id: "undou-001",
    hiragana: "うんどう",
    romaji: "undou",
    english: "exercise",
    category: "activity",
    definition: "physical activity for health",
    jlpt: "N4",
    hintEmoji: "🏃"
  },
  {
    id: "sentaku-001",
    hiragana: "せんたく",
    romaji: "sentaku",
    english: "laundry",
    category: "home",
    definition: "washing clothes",
    jlpt: "N4",
    hintEmoji: "🧺"
  },
  {
    id: "souji-001",
    hiragana: "そうじ",
    romaji: "souji",
    english: "cleaning",
    category: "home",
    definition: "making a place clean",
    jlpt: "N4",
    hintEmoji: "🧹"
  },
  {
    id: "kaimono-001",
    hiragana: "かいもの",
    romaji: "kaimono",
    english: "shopping",
    category: "activity",
    definition: "buying things at a store",
    jlpt: "N4",
    hintEmoji: "🛍️"
  },
  {
    id: "yakusoku-001",
    hiragana: "やくそく",
    romaji: "yakusoku",
    english: "promise",
    category: "communication",
    definition: "an agreement to do something",
    jlpt: "N4",
    hintEmoji: "🤝"
  },
  {
    id: "shitsumon-001",
    hiragana: "しつもん",
    romaji: "shitsumon",
    english: "question",
    category: "communication",
    definition: "something asked to get information",
    refinedDefinition: "question; something asked to get information",
    jlpt: "N4",
    hintEmoji: "❓",
    closeAnswers: ["へんじ", "れんらく", "じょうほう"],
    confusableWords: [
      {
        word: "へんじ",
        romaji: "henji",
        english: "reply",
        note: "A reply answers a question; しつもん is the question."
      },
      {
        word: "じょうほう",
        romaji: "jouhou",
        english: "information",
        note: "Information is what a question asks for."
      }
    ]
  },
  {
    id: "henji-001",
    hiragana: "へんじ",
    romaji: "henji",
    english: "reply",
    category: "communication",
    definition: "an answer to someone",
    refinedDefinition: "reply; an answer given back to someone",
    jlpt: "N4",
    hintEmoji: "💬",
    closeAnswers: ["しつもん", "れんらく", "ほうこく"],
    confusableWords: [
      {
        word: "しつもん",
        romaji: "shitsumon",
        english: "question",
        note: "A question asks; へんじ answers."
      },
      {
        word: "れんらく",
        romaji: "renraku",
        english: "contact",
        note: "Contact is communication; へんじ is a reply."
      }
    ]
  },
  {
    id: "shirase-001",
    hiragana: "しらせ",
    romaji: "shirase",
    english: "notice",
    category: "communication",
    definition: "news or information given to someone",
    jlpt: "N4",
    hintEmoji: "📣"
  },
  {
    id: "seikatsu-001",
    hiragana: "せいかつ",
    romaji: "seikatsu",
    english: "daily life",
    category: "life",
    definition: "the way someone lives day to day",
    jlpt: "N4",
    hintEmoji: "🏡"
  },
  {
    id: "shumi-001",
    hiragana: "しゅみ",
    romaji: "shumi",
    english: "hobby",
    category: "life",
    definition: "an activity someone enjoys",
    jlpt: "N4",
    hintEmoji: "🎨"
  },
  {
    id: "riyu-001",
    hiragana: "りゆう",
    romaji: "riyu",
    english: "reason",
    category: "concept",
    definition: "why something happens",
    refinedDefinition: "reason; why something happens or is done",
    jlpt: "N4",
    hintEmoji: "💭",
    closeAnswers: ["もくてき", "もくひょう", "げんいん"],
    confusableWords: [
      {
        word: "もくてき",
        romaji: "mokuteki",
        english: "purpose",
        note: "Purpose is intended aim; りゆう is a reason why."
      },
      {
        word: "げんいん",
        romaji: "genin",
        english: "cause",
        note: "Cause produces a result; りゆう is a reason/explanation."
      }
    ]
  },
  {
    id: "goukaku-001",
    hiragana: "ごうかく",
    romaji: "goukaku",
    english: "passing",
    category: "study",
    definition: "success on a test or exam",
    jlpt: "N3",
    hintEmoji: "✅"
  },
  {
    id: "fugoukaku-001",
    hiragana: "ふごうかく",
    romaji: "fugoukaku",
    english: "failing",
    category: "study",
    definition: "not passing a test or exam",
    jlpt: "N3",
    hintEmoji: "❌"
  },
  {
    id: "mokuteki-001",
    hiragana: "もくてき",
    romaji: "mokuteki",
    english: "purpose",
    category: "concept",
    definition: "the reason for doing something",
    refinedDefinition: "purpose; why something is done",
    jlpt: "N3",
    hintEmoji: "🎯",
    closeAnswers: ["もくひょう", "りゆう"],
    confusableWords: [
      {
        word: "もくひょう",
        romaji: "mokuhyou",
        english: "goal",
        note: "A goal is a target; もくてき is the purpose or reason for doing something."
      },
      {
        word: "りゆう",
        romaji: "riyu",
        english: "reason",
        note: "Reason explains why; もくてき is the intended purpose."
      }
    ]
  },
  {
    id: "mokuhyou-001",
    hiragana: "もくひょう",
    romaji: "mokuhyou",
    english: "goal",
    category: "concept",
    definition: "something someone wants to achieve",
    refinedDefinition: "goal; a target someone wants to reach",
    jlpt: "N3",
    hintEmoji: "🏁",
    closeAnswers: ["もくてき", "りゆう"],
    confusableWords: [
      {
        word: "もくてき",
        romaji: "mokuteki",
        english: "purpose",
        note: "Purpose is why; もくひょう is the target to reach."
      },
      {
        word: "りゆう",
        romaji: "riyu",
        english: "reason",
        note: "Reason explains why; もくひょう is a goal/target."
      }
    ]
  },
  {
    id: "kikai-001",
    hiragana: "きかい",
    romaji: "kikai",
    english: "opportunity",
    category: "concept",
    definition: "a good chance to do something",
    jlpt: "N3",
    hintEmoji: "🚪"
  },
  {
    id: "houhou-001",
    hiragana: "ほうほう",
    romaji: "houhou",
    english: "method",
    category: "concept",
    definition: "a way of doing something",
    jlpt: "N3",
    hintEmoji: "🛠️"
  },
  {
    id: "joutai-001",
    hiragana: "じょうたい",
    romaji: "joutai",
    english: "condition",
    category: "concept",
    definition: "the state something is in",
    refinedDefinition: "condition; the state something is in",
    jlpt: "N3",
    hintEmoji: "📊",
    closeAnswers: ["ばあい"],
    confusableWords: [
      {
        word: "ばあい",
        romaji: "baai",
        english: "case",
        note: "Case is a situation; じょうたい is a condition/state."
      }
    ]
  },
  {
    id: "baai-001",
    hiragana: "ばあい",
    romaji: "baai",
    english: "case",
    category: "concept",
    definition: "a situation or circumstance",
    refinedDefinition: "case; a situation or circumstance",
    jlpt: "N3",
    hintEmoji: "📌",
    closeAnswers: ["じょうたい"],
    confusableWords: [
      {
        word: "じょうたい",
        romaji: "joutai",
        english: "condition",
        note: "Condition is a state; ばあい is a case/situation."
      }
    ]
  },
  {
    id: "kekka-001",
    hiragana: "けっか",
    romaji: "kekka",
    english: "result",
    category: "concept",
    definition: "what happens because of something",
    refinedDefinition: "result; outcome after something happens",
    jlpt: "N3",
    hintEmoji: "📈",
    closeAnswers: ["こうか", "えいきょう", "げんいん"],
    confusableWords: [
      {
        word: "こうか",
        romaji: "kouka",
        english: "effect",
        note: "Effect is impact; けっか is the final result/outcome."
      },
      {
        word: "げんいん",
        romaji: "genin",
        english: "cause",
        note: "Cause comes before; けっか is what happens after."
      }
    ]
  },
  {
    id: "genin-001",
    hiragana: "げんいん",
    romaji: "genin",
    english: "cause",
    category: "concept",
    definition: "the reason something happens",
    refinedDefinition: "cause; what makes something happen",
    jlpt: "N3",
    hintEmoji: "🔎",
    closeAnswers: ["りゆう", "けっか"],
    confusableWords: [
      {
        word: "りゆう",
        romaji: "riyu",
        english: "reason",
        note: "Reason explains why; げんいん is the cause."
      },
      {
        word: "けっか",
        romaji: "kekka",
        english: "result",
        note: "Result comes after; げんいん is what causes it."
      }
    ]
  },
  {
    id: "henka-001",
    hiragana: "へんか",
    romaji: "henka",
    english: "change",
    category: "concept",
    definition: "a difference from before",
    refinedDefinition: "change; a difference from before",
    jlpt: "N3",
    hintEmoji: "🔄",
    closeAnswers: ["せいちょう"],
    confusableWords: [
      {
        word: "せいちょう",
        romaji: "seichou",
        english: "growth",
        note: "Growth is a type of positive change; へんか is change in general."
      }
    ]
  },
  {
    id: "seichou-001",
    hiragana: "せいちょう",
    romaji: "seichou",
    english: "growth",
    category: "life",
    definition: "the process of becoming bigger or better",
    refinedDefinition: "growth; becoming bigger, better, or more developed",
    jlpt: "N3",
    hintEmoji: "🌱",
    closeAnswers: ["へんか", "どりょく"],
    confusableWords: [
      {
        word: "へんか",
        romaji: "henka",
        english: "change",
        note: "Change is general; せいちょう is growth/development."
      },
      {
        word: "どりょく",
        romaji: "doryoku",
        english: "effort",
        note: "Effort can lead to growth; せいちょう is the growth."
      }
    ]
  },
  {
    id: "doryoku-001",
    hiragana: "どりょく",
    romaji: "doryoku",
    english: "effort",
    category: "life",
    definition: "hard work toward a goal",
    refinedDefinition: "effort; hard work put toward a goal",
    jlpt: "N3",
    hintEmoji: "💪",
    closeAnswers: ["れんしゅう", "せいちょう"],
    confusableWords: [
      {
        word: "れんしゅう",
        romaji: "renshuu",
        english: "practice",
        note: "Practice is repeated action; どりょく is the effort you put in."
      },
      {
        word: "せいちょう",
        romaji: "seichou",
        english: "growth",
        note: "Growth may result from effort; どりょく is effort."
      }
    ]
  },
  {
    id: "sekinin-001",
    hiragana: "せきにん",
    romaji: "sekinin",
    english: "responsibility",
    category: "work",
    definition: "a duty someone should handle",
    jlpt: "N3",
    hintEmoji: "📋"
  },
  {
    id: "renraku-001",
    hiragana: "れんらく",
    romaji: "renraku",
    english: "contact",
    category: "communication",
    definition: "communication with someone",
    refinedDefinition: "contact; communication with someone",
    jlpt: "N3",
    hintEmoji: "📞",
    closeAnswers: ["へんじ", "ほうこく", "しつもん", "でんわ"],
    confusableWords: [
      {
        word: "へんじ",
        romaji: "henji",
        english: "reply",
        note: "A reply is one response; れんらく is contact/communication."
      },
      {
        word: "ほうこく",
        romaji: "houkoku",
        english: "report",
        note: "A report gives information; れんらく is contacting someone."
      },
      {
        word: "でんわ",
        romaji: "denwa",
        english: "phone",
        note: "A phone can be used for contact; れんらく is the contact itself."
      }
    ]
  },
  {
    id: "houkoku-001",
    hiragana: "ほうこく",
    romaji: "houkoku",
    english: "report",
    category: "communication",
    definition: "giving information about what happened",
    refinedDefinition: "report; giving information about what happened",
    jlpt: "N3",
    hintEmoji: "🧾",
    closeAnswers: ["れんらく", "へんじ", "じょうほう", "せつめい"],
    confusableWords: [
      {
        word: "れんらく",
        romaji: "renraku",
        english: "contact",
        note: "Contact reaches someone; ほうこく reports information."
      },
      {
        word: "じょうほう",
        romaji: "jouhou",
        english: "information",
        note: "Information is the content; ほうこく is reporting it."
      }
    ]
  },
  {
    id: "setsuzoku-001",
    hiragana: "せつぞく",
    romaji: "setsuzoku",
    english: "connection",
    category: "technology",
    definition: "a link between things or systems",
    refinedDefinition: "connection; a link between things or systems",
    jlpt: "N3",
    hintEmoji: "🔌",
    closeAnswers: ["かんけい", "れんらく"],
    confusableWords: [
      {
        word: "かんけい",
        romaji: "kankei",
        english: "relationship",
        note: "Relationship is broader; せつぞく is a connection/link."
      },
      {
        word: "れんらく",
        romaji: "renraku",
        english: "contact",
        note: "Contact is communication; せつぞく is a connection."
      }
    ]
  },
  {
    id: "ao-001",
    hiragana: "あお",
    romaji: "ao",
    english: "blue",
    category: "color",
    definition: "the color of a clear sky",
    jlpt: "N5",
    hintEmoji: "🔵"
  },
  {
    id: "aka-001",
    hiragana: "あか",
    romaji: "aka",
    english: "red",
    category: "color",
    definition: "the color of fire or blood",
    jlpt: "N5",
    hintEmoji: "🔴"
  },
  {
    id: "shiro-001",
    hiragana: "しろ",
    romaji: "shiro",
    english: "white",
    category: "color",
    definition: "the color of snow",
    jlpt: "N5",
    hintEmoji: "⚪"
  },
  {
    id: "kuro-001",
    hiragana: "くろ",
    romaji: "kuro",
    english: "black",
    category: "color",
    definition: "the darkest color",
    jlpt: "N5",
    hintEmoji: "⚫"
  },
  {
    id: "kiiro-001",
    hiragana: "きいろ",
    romaji: "kiiro",
    english: "yellow",
    category: "color",
    definition: "the color of lemons or sunlight",
    jlpt: "N5",
    hintEmoji: "🟡"
  },
  {
    id: "midori-001",
    hiragana: "みどり",
    romaji: "midori",
    english: "green",
    category: "color",
    definition: "the color of leaves",
    jlpt: "N5",
    hintEmoji: "🟢"
  },
  {
    id: "kita-001",
    hiragana: "きた",
    romaji: "kita",
    english: "north",
    category: "place",
    definition: "one of the four main directions",
    jlpt: "N5",
    hintEmoji: "🧭"
  },
  {
    id: "minami-001",
    hiragana: "みなみ",
    romaji: "minami",
    english: "south",
    category: "place",
    definition: "one of the four main directions",
    jlpt: "N5",
    hintEmoji: "🧭"
  },
  {
    id: "higashi-001",
    hiragana: "ひがし",
    romaji: "higashi",
    english: "east",
    category: "place",
    definition: "the direction where the sun rises",
    jlpt: "N5",
    hintEmoji: "🌅"
  },
  {
    id: "nishi-001",
    hiragana: "にし",
    romaji: "nishi",
    english: "west",
    category: "place",
    definition: "the direction where the sun sets",
    jlpt: "N5",
    hintEmoji: "🌇"
  },
  {
    id: "michi-001",
    hiragana: "みち",
    romaji: "michi",
    english: "road",
    category: "place",
    definition: "a path for travel",
    jlpt: "N5",
    hintEmoji: "🛣️"
  },
  {
    id: "niwa-001",
    hiragana: "にわ",
    romaji: "niwa",
    english: "garden",
    category: "place",
    definition: "an outdoor space with plants",
    jlpt: "N5",
    hintEmoji: "🌷"
  },
  {
    id: "keshigomu-001",
    hiragana: "けしごむ",
    romaji: "keshigomu",
    english: "eraser",
    category: "object",
    definition: "an object used to remove pencil marks",
    jlpt: "N5",
    hintEmoji: "🧽"
  },
  {
    id: "tegami-001",
    hiragana: "てがみ",
    romaji: "tegami",
    english: "letter",
    category: "object",
    definition: "a written message sent to someone",
    jlpt: "N5",
    hintEmoji: "✉️"
  },
  {
    id: "setsumei-kai-001",
    hiragana: "せつめいかい",
    romaji: "setsumeikai",
    english: "briefing",
    category: "communication",
    definition: "a meeting where something is explained",
    refinedDefinition: "briefing; a meeting where something is explained",
    jlpt: "N4",
    hintEmoji: "🗣️",
    closeAnswers: ["せつめい", "かいぎ", "あんない"],
    confusableWords: [
      {
        word: "せつめい",
        romaji: "setsumei",
        english: "explanation",
        note: "Explanation is the content; せつめいかい is the briefing event."
      },
      {
        word: "かいぎ",
        romaji: "kaigi",
        english: "meeting",
        note: "Meeting is general; せつめいかい is specifically for explanation."
      }
    ]
  },
  {
    id: "annai-001",
    hiragana: "あんない",
    romaji: "annai",
    english: "guidance",
    category: "communication",
    definition: "help showing someone where to go or what to do",
    refinedDefinition: "guidance; help showing where to go or what to do",
    jlpt: "N4",
    hintEmoji: "🪧",
    closeAnswers: ["せつめい", "せつめいかい", "じょうほう"],
    confusableWords: [
      {
        word: "せつめい",
        romaji: "setsumei",
        english: "explanation",
        note: "Explanation clarifies; あんない guides or directs."
      },
      {
        word: "じょうほう",
        romaji: "jouhou",
        english: "information",
        note: "Information is facts; あんない is guidance using those facts."
      }
    ]
  },
  {
    id: "uketsuke-001",
    hiragana: "うけつけ",
    romaji: "uketsuke",
    english: "reception",
    category: "place",
    definition: "a desk where visitors are received",
    jlpt: "N4",
    hintEmoji: "🛎️"
  },
  {
    id: "kaijou-001",
    hiragana: "かいじょう",
    romaji: "kaijou",
    english: "venue",
    category: "place",
    definition: "a place where an event is held",
    jlpt: "N4",
    hintEmoji: "🏟️"
  },
  {
    id: "shiryou-001",
    hiragana: "しりょう",
    romaji: "shiryou",
    english: "materials",
    category: "work",
    definition: "documents or resources used for reference",
    refinedDefinition: "materials; documents or resources used for reference",
    jlpt: "N4",
    hintEmoji: "📄",
    closeAnswers: ["しごと", "ほうこく", "じょうほう"],
    confusableWords: [
      {
        word: "じょうほう",
        romaji: "jouhou",
        english: "information",
        note: "Information is content; しりょう are materials/documents."
      },
      {
        word: "ほうこく",
        romaji: "houkoku",
        english: "report",
        note: "A report can be a material, but しりょう means reference materials."
      }
    ]
  },
  {
    id: "chuusha-001",
    hiragana: "ちゅうしゃ",
    romaji: "chuusha",
    english: "injection",
    category: "health",
    definition: "medicine given with a needle",
    refinedDefinition: "injection; medicine given with a needle",
    jlpt: "N4",
    hintEmoji: "💉",
    closeAnswers: ["くすり", "びょういん", "けが"],
    confusableWords: [
      {
        word: "くすり",
        romaji: "kusuri",
        english: "medicine",
        note: "Medicine is broader; ちゅうしゃ is an injection."
      },
      {
        word: "びょういん",
        romaji: "byouin",
        english: "hospital",
        note: "Hospital is the place; ちゅうしゃ is the injection."
      }
    ]
  },
  {
    id: "netsu-001",
    hiragana: "ねつ",
    romaji: "netsu",
    english: "fever",
    category: "health",
    definition: "a high body temperature",
    refinedDefinition: "fever; a high body temperature from illness",
    jlpt: "N4",
    hintEmoji: "🤒",
    closeAnswers: ["びょういん", "くすり", "けが"],
    confusableWords: [
      {
        word: "くすり",
        romaji: "kusuri",
        english: "medicine",
        note: "Medicine treats illness; ねつ is fever."
      },
      {
        word: "けが",
        romaji: "kega",
        english: "injury",
        note: "Injury is physical damage; ねつ is fever."
      }
    ]
  },
  {
    id: "kega-001",
    hiragana: "けが",
    romaji: "kega",
    english: "injury",
    category: "health",
    definition: "damage to the body",
    refinedDefinition: "injury; damage to the body",
    jlpt: "N4",
    hintEmoji: "🩹",
    closeAnswers: ["びょういん", "くすり", "ねつ", "ちゅうしゃ"],
    confusableWords: [
      {
        word: "ねつ",
        romaji: "netsu",
        english: "fever",
        note: "Fever is sickness/temperature; けが is an injury."
      },
      {
        word: "びょういん",
        romaji: "byouin",
        english: "hospital",
        note: "Hospital is where you may go for an injury; けが is the injury."
      }
    ]
  },
  {
    id: "kouka-001",
    hiragana: "こうか",
    romaji: "kouka",
    english: "effect",
    category: "concept",
    definition: "a result or influence caused by something",
    refinedDefinition: "effect; impact caused by something",
    jlpt: "N3",
    hintEmoji: "✨",
    closeAnswers: ["けっか", "えいきょう"],
    confusableWords: [
      {
        word: "けっか",
        romaji: "kekka",
        english: "result",
        note: "A result is an outcome; こうか is an effect/impact."
      },
      {
        word: "えいきょう",
        romaji: "eikyou",
        english: "influence",
        note: "Influence is broader; こうか is a specific effect."
      }
    ]
  },
  {
    id: "eikyou-001",
    hiragana: "えいきょう",
    romaji: "eikyou",
    english: "influence",
    category: "concept",
    definition: "the power to affect something",
    refinedDefinition: "influence; power to affect something",
    jlpt: "N3",
    hintEmoji: "🌊",
    closeAnswers: ["こうか", "けっか"],
    confusableWords: [
      {
        word: "こうか",
        romaji: "kouka",
        english: "effect",
        note: "Effect is a result/impact; えいきょう is influence."
      },
      {
        word: "けっか",
        romaji: "kekka",
        english: "result",
        note: "A result is what happened; えいきょう is influence on something."
      }
    ]
  },
  {
    id: "kanri-001",
    hiragana: "かんり",
    romaji: "kanri",
    english: "management",
    category: "work",
    definition: "controlling or organizing something",
    jlpt: "N3",
    hintEmoji: "📊"
  },
  {
    id: "taido-001",
    hiragana: "たいど",
    romaji: "taido",
    english: "attitude",
    category: "person",
    definition: "the way someone thinks or behaves",
    jlpt: "N3",
    hintEmoji: "🧍"
  },
  {
    id: "koudou-001",
    hiragana: "こうどう",
    romaji: "koudou",
    english: "action",
    category: "action",
    definition: "something someone does",
    jlpt: "N3",
    hintEmoji: "🏃"
  }
];

export const wordPools = {
  N5: words.filter((word) => word.jlpt === "N5"),
  N4: words.filter((word) => word.jlpt === "N4"),
  N3: words.filter((word) => word.jlpt === "N3")
};
