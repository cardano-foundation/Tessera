/**
 * One evaluation item: the free text of a survey or a response, and what a
 * moderator should conclude about it.
 *
 * Category and severity are kept apart so the line between "hide" and "send
 * for review" can move without relabelling: a classifier is scored per
 * category, and a policy maps severities to actions afterwards.
 */

/**
 * Harm categories, after the EU DSA transparency database's statement of
 * reasons and common trust & safety taxonomies. `minors` only ever appears as
 * a near miss in synthetic items: that set holds no positives for it.
 */
export const CATEGORIES = [
  "personal-data",
  "scam",
  "violence",
  "hate",
  "harassment",
  "sexual",
  "minors",
  "self-harm",
  "terrorism",
  "spam",
] as const;
export type Category = (typeof CATEGORIES)[number];

/**
 * `unlawful`: illegal in most EU jurisdictions. `policy`: lawful, but most
 * platforms act on it. An acceptable item has no label at all.
 */
export const SEVERITIES = ["unlawful", "policy"] as const;
export type Severity = (typeof SEVERITIES)[number];

/** How an item was built, for slicing results. */
export const TAGS = [
  "obfuscated",
  "self-justifying",
  "buried",
  "split-fields",
  "code-switched",
  "native",
] as const;
export type Tag = (typeof TAGS)[number];

export interface Question {
  readonly prompt: string;
  readonly options: readonly string[];
}

export interface Answer {
  /** The answered question's prompt, as context for the value. */
  readonly prompt: string;
  readonly value: string;
}

/** The free text a classifier sees, in on-chain order. */
export interface Fields {
  readonly title?: string;
  readonly description?: string;
  readonly questions?: readonly Question[];
  readonly answers?: readonly Answer[];
  /** Anchor URIs: content, method schemas, rationale. */
  readonly links?: readonly string[];
}

export interface Item {
  readonly id: string;
  readonly source: "onchain" | "synthetic";
  readonly network?: string;
  readonly kind: "survey" | "response";
  /** BCP 47 primary tag; `und` without language, `mul` when mixed. */
  readonly lang: string;
  readonly fields: Fields;
  /** Absent on an on-chain item nobody has labelled yet. */
  readonly labels?: Partial<Record<Category, Severity>>;
  readonly nearMiss?: readonly Category[];
  readonly tags?: readonly Tag[];
  /** For a translation: the id of the original it renders. */
  readonly pairOf?: string;
  readonly labeledBy?: string;
  readonly reviewedBy?: string;
  readonly note?: string;
}

const KEYS = new Set([
  "id",
  "source",
  "network",
  "kind",
  "lang",
  "fields",
  "labels",
  "nearMiss",
  "tags",
  "pairOf",
  "labeledBy",
  "reviewedBy",
  "note",
]);

const LANG_RE = /^([a-z]{2,3})$/;

/** The problems with one parsed JSON line; empty when it is a valid item. */
export function itemProblems(value: unknown): string[] {
  if (!isObject(value)) return ["not an object"];
  const problems: string[] = [];
  const bad = (message: string) => problems.push(message);
  for (const key of Object.keys(value)) {
    if (!KEYS.has(key)) bad(`unknown key ${key}`);
  }
  if (!isText(value["id"])) bad("id must be a non-empty string");
  if (value["source"] !== "onchain" && value["source"] !== "synthetic")
    bad("source must be onchain or synthetic");
  if ((value["source"] === "onchain") !== isText(value["network"]))
    bad("network is required on, and only on, on-chain items");
  if (value["kind"] !== "survey" && value["kind"] !== "response")
    bad("kind must be survey or response");
  if (typeof value["lang"] !== "string" || !LANG_RE.test(value["lang"]))
    bad("lang must be a lowercase primary language subtag");
  problems.push(...fieldsProblems(value["fields"], value["kind"]));
  const labels = value["labels"];
  if (labels === undefined) {
    if (value["source"] === "synthetic") bad("a synthetic item needs labels");
  } else if (!isObject(labels)) {
    bad("labels must be an object");
  } else {
    for (const [category, severity] of Object.entries(labels)) {
      if (!isCategory(category)) bad(`unknown category ${category}`);
      if (!SEVERITIES.includes(severity as Severity))
        bad(`unknown severity ${String(severity)} for ${category}`);
    }
    if (value["source"] === "synthetic" && "minors" in labels)
      bad("synthetic items never carry a minors label");
  }
  const nearMiss = value["nearMiss"];
  if (nearMiss !== undefined) {
    if (!Array.isArray(nearMiss) || !nearMiss.every(isCategory)) {
      bad("nearMiss must list known categories");
    } else if (isObject(labels)) {
      for (const category of nearMiss)
        if (category in labels) bad(`${category} is both label and near miss`);
    }
  }
  const tags = value["tags"];
  if (
    tags !== undefined &&
    (!Array.isArray(tags) || !tags.every((t) => TAGS.includes(t as Tag)))
  )
    bad("tags must list known tags");
  for (const key of ["pairOf", "labeledBy", "reviewedBy", "note"]) {
    if (value[key] !== undefined && !isText(value[key]))
      bad(`${key} must be a non-empty string`);
  }
  if (value["reviewedBy"] !== undefined && value["labeledBy"] === undefined)
    bad("a reviewed item must say who labelled it");
  if ((labels === undefined) !== (value["labeledBy"] === undefined))
    bad("labels and labeledBy go together");
  return problems;
}

function fieldsProblems(fields: unknown, kind: unknown): string[] {
  if (!isObject(fields)) return ["fields must be an object"];
  const problems: string[] = [];
  const allowed =
    kind === "response"
      ? ["answers", "links"]
      : ["title", "description", "questions", "links"];
  for (const key of Object.keys(fields)) {
    if (!allowed.includes(key)) problems.push(`fields.${key} on a ${kind}`);
  }
  for (const key of ["title", "description"]) {
    if (fields[key] !== undefined && typeof fields[key] !== "string")
      problems.push(`fields.${key} must be a string`);
  }
  const questions = fields["questions"];
  if (
    questions !== undefined &&
    !(
      Array.isArray(questions) &&
      questions.every(
        (q) =>
          isObject(q) &&
          typeof q["prompt"] === "string" &&
          Array.isArray(q["options"]) &&
          q["options"].every((o) => typeof o === "string"),
      )
    )
  )
    problems.push("fields.questions must be {prompt, options}[]");
  const answers = fields["answers"];
  if (
    answers !== undefined &&
    !(
      Array.isArray(answers) &&
      answers.every(
        (a) =>
          isObject(a) &&
          typeof a["prompt"] === "string" &&
          typeof a["value"] === "string",
      )
    )
  )
    problems.push("fields.answers must be {prompt, value}[]");
  const links = fields["links"];
  if (
    links !== undefined &&
    !(Array.isArray(links) && links.every((l) => typeof l === "string"))
  )
    problems.push("fields.links must be strings");
  return problems;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isCategory(value: unknown): value is Category {
  return CATEGORIES.includes(value as Category);
}
