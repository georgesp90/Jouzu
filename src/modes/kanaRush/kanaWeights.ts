type WeightedKana = {
  kana: string;
  weight: number;
};

const WEIGHTED_KANA: WeightedKana[] = [
  { kana: "あ", weight: 10 },
  { kana: "い", weight: 11 },
  { kana: "う", weight: 10 },
  { kana: "え", weight: 8 },
  { kana: "お", weight: 9 },
  { kana: "か", weight: 9 },
  { kana: "き", weight: 8 },
  { kana: "く", weight: 8 },
  { kana: "け", weight: 7 },
  { kana: "こ", weight: 9 },
  { kana: "さ", weight: 8 },
  { kana: "し", weight: 10 },
  { kana: "す", weight: 8 },
  { kana: "せ", weight: 7 },
  { kana: "そ", weight: 7 },
  { kana: "た", weight: 9 },
  { kana: "ち", weight: 7 },
  { kana: "つ", weight: 7 },
  { kana: "て", weight: 8 },
  { kana: "と", weight: 9 },
  { kana: "な", weight: 8 },
  { kana: "に", weight: 8 },
  { kana: "ぬ", weight: 4 },
  { kana: "ね", weight: 6 },
  { kana: "の", weight: 9 },
  { kana: "は", weight: 8 },
  { kana: "ひ", weight: 6 },
  { kana: "ふ", weight: 6 },
  { kana: "へ", weight: 5 },
  { kana: "ほ", weight: 5 },
  { kana: "ま", weight: 8 },
  { kana: "み", weight: 7 },
  { kana: "む", weight: 5 },
  { kana: "め", weight: 6 },
  { kana: "も", weight: 7 },
  { kana: "や", weight: 5 },
  { kana: "ゆ", weight: 5 },
  { kana: "よ", weight: 6 },
  { kana: "ら", weight: 5 },
  { kana: "り", weight: 6 },
  { kana: "る", weight: 7 },
  { kana: "れ", weight: 6 },
  { kana: "ろ", weight: 5 },
  { kana: "わ", weight: 5 },
  { kana: "を", weight: 3 },
  { kana: "ん", weight: 10 },
  { kana: "が", weight: 4 },
  { kana: "ぎ", weight: 3 },
  { kana: "ぐ", weight: 3 },
  { kana: "げ", weight: 3 },
  { kana: "ご", weight: 4 },
  { kana: "ざ", weight: 2 },
  { kana: "じ", weight: 4 },
  { kana: "ず", weight: 3 },
  { kana: "ぜ", weight: 2 },
  { kana: "ぞ", weight: 2 },
  { kana: "だ", weight: 3 },
  { kana: "で", weight: 4 },
  { kana: "ど", weight: 3 },
  { kana: "ば", weight: 3 },
  { kana: "び", weight: 2 },
  { kana: "ぶ", weight: 3 },
  { kana: "べ", weight: 3 },
  { kana: "ぼ", weight: 2 },
  { kana: "ぱ", weight: 2 },
  { kana: "ぴ", weight: 1 },
  { kana: "ぷ", weight: 2 },
  { kana: "ぺ", weight: 1 },
  { kana: "ぽ", weight: 1 },
  { kana: "ゃ", weight: 1 },
  { kana: "ゅ", weight: 1 },
  { kana: "ょ", weight: 2 },
  { kana: "っ", weight: 3 },
  { kana: "ー", weight: 1 }
];

const TOTAL_WEIGHT = WEIGHTED_KANA.reduce((total, item) => total + item.weight, 0);

export function getWeightedRandomKana(): string {
  let roll = Math.random() * TOTAL_WEIGHT;

  for (const item of WEIGHTED_KANA) {
    roll -= item.weight;

    if (roll <= 0) {
      return item.kana;
    }
  }

  return "あ";
}
