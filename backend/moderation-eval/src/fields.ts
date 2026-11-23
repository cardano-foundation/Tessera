import type {
  Metadatum,
  OptionsOrCount,
  Question as Cip179Question,
  SurveyDefinition,
  SurveyResponse,
} from "cip-179";
import type { Fields, Question } from "./item.js";

/** Every piece of free text a survey definition publishes. */
export function surveyFields(definition: SurveyDefinition): Fields {
  const links = [
    ...(definition.contentAnchor ? [definition.contentAnchor.uri] : []),
    ...definition.questions.flatMap((q) =>
      q.type === "custom" ? [q.methodSchema.uri] : [],
    ),
  ];
  return compact({
    title: definition.title,
    description: definition.description,
    questions: definition.questions
      .map(question)
      .filter((q) => q.prompt !== "" || q.options.length > 0),
    links,
  });
}

/**
 * Every piece of free text a response publishes: its custom answers, each
 * with its question's prompt, and its rationale anchor. A sealed response has
 * none until it is revealed.
 */
export function responseFields(
  response: SurveyResponse,
  definition: SurveyDefinition,
): Fields {
  const answers =
    response.answers.type === "public"
      ? response.answers.answers.flatMap((a) => {
          if (a.type !== "custom") return [];
          const value = strings(a.value).join("\n");
          const prompt = definition.questions[a.questionIndex]?.prompt ?? "";
          return value ? [{ prompt, value }] : [];
        })
      : [];
  return compact({
    answers,
    links: response.rationale ? [response.rationale.uri] : [],
  });
}

function question(q: Cip179Question): Question {
  const labels = (options: OptionsOrCount) =>
    options.type === "options" ? options.labels : [];
  switch (q.type) {
    case "custom":
    case "numericRange":
      return { prompt: q.prompt, options: [] };
    case "rating":
      return {
        prompt: q.prompt,
        options: [
          ...labels(q.options),
          ...(q.scale.type === "labels" ? q.scale.labels : []),
        ],
      };
    default:
      return { prompt: q.prompt, options: labels(q.options) };
  }
}

/** The text strings inside a metadatum, depth first; bytes and integers are not text. */
function strings(value: Metadatum): string[] {
  if (typeof value === "string") return value ? [value] : [];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value instanceof Map)
    return [...value].flatMap(([k, v]) => [...strings(k), ...strings(v)]);
  return [];
}

/** Drops empty strings and empty lists, so an item holds only what was said. */
function compact(fields: Fields): Fields {
  return Object.fromEntries(
    Object.entries(fields).filter(([, v]) =>
      Array.isArray(v) ? v.length > 0 : v !== "",
    ),
  ) as Fields;
}
