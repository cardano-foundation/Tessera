import { CATEGORIES, type Category } from "../item.js";
import type { Provider } from "../provider.js";

/** Pinned: thresholds tuned on one release do not carry over to the next. */
const MODEL = "jev-1.14.0";
const URL = "https://api.typesafe.ai/v1/systemone";
const USD_PER_INPUT_TOKEN = 0.042 / 1e6;

const CONTEXT =
  "The text is a survey or a survey response published on a public survey platform for Cardano governance.";

/**
 * The policy, one yes/no question per category, so each category gets an
 * independent probability and an item can score high on several. Written as
 * an operator would write it, from general trust & safety practice.
 */
const POLICY: Record<Category, { yes: string; no: string }> = {
  "personal-data": {
    yes: "It discloses private personal information about an identifiable individual without their evident consent: a home address, a private phone number or email, identity or account numbers, health records, or similar.",
    no: "Public contact details of organisations or public roles, a respondent's own details where the survey asks for them, names alone, wallet addresses and other on-chain identifiers, or discussion of privacy.",
  },
  scam: {
    yes: "It tries to defraud readers: phishing, fake giveaways or airdrops, requests for recovery phrases, private keys or payments under false pretences, impersonation of a project or official, or investment fraud.",
    no: "Accusing a project of being a scam, warning about scams, discussing security practice, or ordinary links to real projects.",
  },
  violence: {
    yes: "It threatens, incites or glorifies violence against people, or depicts violence graphically.",
    no: "Figurative speech, news or historical discussion, clearly framed fiction, or discussion of safety and security.",
  },
  hate: {
    yes: "It attacks, dehumanises or incites hatred against people for a protected characteristic: race, ethnicity, nationality, religion, sex, gender identity, sexual orientation, disability or age.",
    no: "Criticism of ideas, institutions, governments or organisations, discussion of discrimination, or quoting hate speech to condemn it.",
  },
  harassment: {
    yes: "It insults, demeans, intimidates or bullies a specific person or a group of individuals.",
    no: "Criticism or satire of public figures' public conduct, criticism of organisations, disagreement, or sarcasm about ideas.",
  },
  sexual: {
    yes: "It contains sexually explicit content, sexual solicitation, or links to pornography.",
    no: "Sex education, health, relationships or gender discussed without explicit content.",
  },
  minors: {
    yes: "It sexualises minors, seeks contact with minors for sexual purposes, or otherwise endangers children.",
    no: "Child protection, parenting, education, or questions about age.",
  },
  "self-harm": {
    yes: "It encourages, instructs in or graphically depicts suicide, self-harm or disordered eating.",
    no: "Mental health support, seeking help, prevention resources, or a non-graphic account of one's own experience.",
  },
  terrorism: {
    yes: "It supports, glorifies, recruits for or incites terrorism or violent extremism, including through coded references to extremist groups or attacks.",
    no: "News, historical, academic or policy discussion of terrorism, or counter-extremism.",
  },
  spam: {
    yes: "It is spam: unsolicited advertising, repetitive or off-topic promotion, link farming, or meaningless filler unrelated to the survey.",
    no: "Self-promotion the survey asks for, relevant links, or short or low-effort but genuine answers.",
  },
};

const QUESTIONS = Object.fromEntries(
  CATEGORIES.map((c) => [
    c,
    {
      type: "noul",
      instructions: `${CONTEXT} Does it break this rule? ${POLICY[c].yes}`,
      criteria: { true: POLICY[c].yes, false: POLICY[c].no },
    },
  ]),
);

interface Response {
  readonly model: string;
  readonly answers: Record<string, { readonly noul: number }>;
  readonly usage: { readonly input_tokens: number };
}

/** TypeSafe's Jev, with the key from `TYPESAFE_API_KEY`. */
export function jev(): Provider {
  const key = process.env["TYPESAFE_API_KEY"];
  if (!key) throw new Error("TYPESAFE_API_KEY is not set");
  return {
    name: "jev",
    model: MODEL,
    covers: CATEGORIES,
    async classify(text) {
      const response = await fetch(URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          state: text,
          questions: QUESTIONS,
        }),
        signal: AbortSignal.timeout(60_000),
      });
      if (!response.ok)
        throw new Error(`${response.status} ${await response.text()}`);
      const body = (await response.json()) as Response;
      if (body.model !== MODEL) throw new Error(`answered by ${body.model}`);
      const missing = CATEGORIES.filter(
        (c) => typeof body.answers[c]?.noul !== "number",
      );
      if (missing.length > 0) throw new Error(`no answer for ${missing}`);
      return {
        scores: Object.fromEntries(
          CATEGORIES.map((c) => [c, body.answers[c]!.noul]),
        ),
        raw: body,
        cost: body.usage.input_tokens * USD_PER_INPUT_TOKEN,
      };
    },
  };
}
