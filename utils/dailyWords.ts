import { WordEntry } from "@/types/game";

const CATEGORY_LABELS: Record<string, string> = {
  action: "Action",
  activity: "Activity",
  adjective: "Description",
  adverb: "Description",
  animal: "Animals",
  animals: "Animals",
  art: "Art",
  body: "Body",
  clothing: "Clothing",
  color: "Colors",
  colors: "Colors",
  communication: "Communication",
  concept: "Idea",
  daily_life: "Daily Life",
  description: "Description",
  drink: "Drinks",
  drinks: "Drinks",
  family: "Family",
  feeling: "Emotions",
  feelings: "Emotions",
  food: "Food",
  greetings: "Greetings",
  health: "Health",
  home: "Home",
  language: "Language",
  life: "Daily Life",
  nature: "Nature",
  numbers: "Numbers",
  object: "Objects",
  people: "People",
  person: "People",
  place: "Places",
  places: "Places",
  school: "School",
  shape: "Shapes",
  society: "Society",
  study: "Study",
  technology: "Technology",
  time: "Time",
  transport: "Transportation",
  transportation: "Transportation",
  travel: "Travel",
  verb: "Verbs",
  verbs: "Verbs",
  weather: "Weather",
  work: "Work"
};

function titleCaseCategory(category: string): string {
  return category
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export function getCategoryLabel(category?: string | null): string {
  if (!category) {
    return "Daily Life";
  }

  const normalized = category.toLowerCase();
  return CATEGORY_LABELS[normalized] ?? titleCaseCategory(category);
}

export function getDailySecondaryHint(word: WordEntry): string | null {
  if (word.subcategory) {
    return getCategoryLabel(word.subcategory);
  }

  const definition = word.refinedDefinition ?? word.definition;
  if (!definition) {
    return null;
  }

  return definition.length > 54 ? `${definition.slice(0, 51).trim()}...` : definition;
}
