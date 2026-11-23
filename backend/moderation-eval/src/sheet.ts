/**
 * A review sheet: items as Markdown a person edits in any text editor. Each
 * item is a `## <id>` block holding its rendered text, quoted line by line so
 * no item text can pass for a heading or an editable line, and four editable
 * lines; only blocks marked `reviewed: yes` are read back.
 */
import { renderFields } from "./fields.js";
import {
  CATEGORIES,
  SEVERITIES,
  type Category,
  type Item,
  type Severity,
} from "./item.js";
import type { Review } from "./data.js";

export function formatSheet(items: readonly Item[]): string {
  const header = [
    "# Review sheet",
    "",
    "For each item, correct the lines below its text if needed, then set",
    "`reviewed: yes`. Blocks left at `reviewed: no` are ignored on import.",
    "",
    `- \`labels:\` \`category=severity\` pairs separated by commas, or \`none\` when acceptable.`,
    `  Categories: ${CATEGORIES.join(", ")}.`,
    `  Severities: ${SEVERITIES.join(" (illegal in most EU jurisdictions), ")} (lawful, but most platforms act on it).`,
    "- `near:` categories an acceptable item resembles, separated by commas; may be empty.",
    "- `note:` why, in a line; may be empty.",
    "",
  ];
  const blocks = items.map((item) =>
    [
      `## ${item.id}`,
      "",
      `${item.kind}, ${item.lang}${item.tags?.length ? `, ${item.tags.join(" ")}` : ""}`,
      "",
      renderFields(item.fields)
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n"),
      "",
      `labels: ${formatLabels(item.labels ?? {})}`,
      `near: ${(item.nearMiss ?? []).join(", ")}`,
      `note: ${item.note ?? ""}`,
      `reviewed: ${item.reviewedBy ? "yes" : "no"}`,
      "",
    ].join("\n"),
  );
  return [...header, ...blocks].join("\n");
}

/** The reviews of every block marked `reviewed: yes`; throws on a malformed one. */
export function parseSheet(text: string, reviewedBy: string): Review[] {
  const reviews: Review[] = [];
  for (const block of text.split(/^## /m).slice(1)) {
    const id = block.slice(0, block.indexOf("\n")).trim();
    const field = (name: string) => {
      const match = new RegExp(`^${name}:(.*)$`, "m").exec(block);
      if (!match) throw new Error(`${id}: no ${name} line`);
      return match[1]!.trim();
    };
    const reviewed = field("reviewed");
    if (reviewed === "no") continue;
    if (reviewed !== "yes")
      throw new Error(`${id}: reviewed must be yes or no, not ${reviewed}`);
    const nearMiss = list(field("near")).map((c) => category(id, c));
    const note = field("note");
    reviews.push({
      id,
      labels: parseLabels(id, field("labels")),
      ...(nearMiss.length ? { nearMiss } : {}),
      ...(note ? { note } : {}),
      reviewedBy,
    });
  }
  return reviews;
}

function formatLabels(labels: Partial<Record<Category, Severity>>): string {
  const pairs = Object.entries(labels).map(([c, s]) => `${c}=${s}`);
  return pairs.length ? pairs.join(", ") : "none";
}

function parseLabels(
  id: string,
  text: string,
): Partial<Record<Category, Severity>> {
  if (text === "none") return {};
  const labels: Partial<Record<Category, Severity>> = {};
  for (const pair of list(text)) {
    const [c = "", s = ""] = pair.split("=").map((part) => part.trim());
    if (!SEVERITIES.includes(s as Severity))
      throw new Error(`${id}: unknown severity "${s}" in labels`);
    labels[category(id, c)] = s as Severity;
  }
  return labels;
}

function category(id: string, text: string): Category {
  if (!CATEGORIES.includes(text as Category))
    throw new Error(`${id}: unknown category "${text}"`);
  return text as Category;
}

function list(text: string): string[] {
  return text
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}
