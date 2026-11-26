import { describe, expect, test } from "vitest";
import type { SurveyDefinition, SurveyResponse } from "cip-179";
import { responseFields, surveyFields } from "./fields.js";

const hash = new Uint8Array(32);
const definition = {
  specVersion: 5,
  owner: { type: "key", keyHash: new Uint8Array(28) },
  title: "Treasury",
  description: "",
  eligibleRoles: [3],
  endEpoch: 600,
  submissionMode: { type: "public" },
  questions: [
    {
      type: "singleChoice",
      prompt: "Fund it?",
      options: { type: "options", labels: ["Yes", "No"] },
    },
    {
      type: "custom",
      prompt: "Why?",
      methodSchema: { uri: "ipfs://schema", hash },
    },
    {
      type: "rating",
      prompt: "Rate",
      options: { type: "count", count: 2 },
      scale: { type: "labels", labels: ["bad", "good"] },
      requireAll: false,
    },
    {
      type: "numericRange",
      prompt: "How much?",
      constraints: { min: 0n, max: 10n },
    },
    {
      type: "singleChoice",
      prompt: "",
      options: { type: "count", count: 2 },
    },
  ],
  contentAnchor: { uri: "https://example.com/doc", hash },
} as unknown as SurveyDefinition;

describe("surveyFields", () => {
  test("collects every free text, drops empty ones and textless questions", () => {
    expect(surveyFields(definition)).toEqual({
      title: "Treasury",
      questions: [
        { prompt: "Fund it?", options: ["Yes", "No"] },
        { prompt: "Why?", options: [] },
        { prompt: "Rate", options: ["bad", "good"] },
        { prompt: "How much?", options: [] },
      ],
      links: ["https://example.com/doc", "ipfs://schema"],
    });
  });
});

describe("responseFields", () => {
  const response = (answers: SurveyResponse["answers"], rationale?: string) =>
    ({
      answers,
      ...(rationale ? { rationale: { uri: rationale, hash } } : {}),
    }) as unknown as SurveyResponse;

  test("custom answers carry their prompt; nested text is flattened", () => {
    const value = new Map<unknown, unknown>([
      [0n, "first"],
      [1n, ["second", new Uint8Array([1]), 3n]],
    ]);
    expect(
      responseFields(
        response(
          {
            type: "public",
            answers: [
              { type: "singleChoice", questionIndex: 0, optionIndex: 1 },
              { type: "custom", questionIndex: 1, value },
            ],
          } as unknown as SurveyResponse["answers"],
          "https://example.com/why",
        ),
        definition,
      ),
    ).toEqual({
      answers: [{ prompt: "Why?", value: "first\nsecond" }],
      links: ["https://example.com/why"],
    });
  });

  test("chunked text is joined as written, keeping its own newlines", () => {
    const answer = (value: unknown) =>
      responseFields(
        response({
          type: "public",
          answers: [{ type: "custom", questionIndex: 1, value }],
        } as unknown as SurveyResponse["answers"]),
        definition,
      ).answers;
    expect(answer(["a long ans", "wer\nnext line"])).toEqual([
      { prompt: "Why?", value: "a long answer\nnext line" },
    ]);
    expect(answer(new Map([[0n, ["one ", "text"]]]))).toEqual([
      { prompt: "Why?", value: "one text" },
    ]);
  });

  test("a sealed response has no text", () => {
    expect(
      responseFields(
        response({ type: "sealed", ciphertext: new Uint8Array(1) }),
        definition,
      ),
    ).toEqual({});
  });
});
