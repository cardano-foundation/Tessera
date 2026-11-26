import { CATEGORIES, type Category } from "../item.js";
import type { Provider } from "../provider.js";

/** Pinned: thresholds tuned on one release do not carry over to the next. */
const MODEL = "jev-1.14.0";
const URL = "https://api.typesafe.ai/v1/systemone";
const USD_PER_INPUT_TOKEN = 0.042 / 1e6;

const CONTEXT =
  "A survey or a survey response published on a public survey platform for Cardano governance.";

/**
 * One judgment per question: Jev answers a compound question less reliably,
 * so a category with several kinds of harm asks one question per kind and
 * scores the highest. `no` states the plain negative first, then the
 * look-alikes that stay allowed, so the two sides are complements.
 */
interface Rule {
  readonly ask: string;
  readonly yes: string;
  readonly no: string;
}

const PROTECTED =
  "race, ethnicity, nationality, religion, sex, gender identity, sexual orientation, disability or age";

const POLICY: Record<Category, Record<string, Rule>> = {
  "personal-data": {
    disclose: {
      ask: "Does `text` disclose private personal information about an identifiable person?",
      yes: "It gives private details tied to a person who can be identified: a home address, a private phone number or email, identity, bank or account numbers, health records, or similar.",
      no: "It discloses no private details about an identifiable person. This includes public contact details of organisations or public roles, a respondent's own details where the survey asks for them, names alone, wallet addresses and other on-chain identifiers, and discussion of privacy.",
    },
  },
  scam: {
    fraud: {
      ask: "Does `text` try to defraud its readers?",
      yes: "Phishing, fake giveaways or airdrops, requests for recovery phrases, private keys or payments under false pretences, impersonation of a project or official, or promises of guaranteed returns.",
      no: "It does not try to defraud anyone. This includes accusing a project of being a scam, warning about scams, discussing security practice, and ordinary links to real projects.",
    },
  },
  violence: {
    threat: {
      ask: "Does any part of `text` threaten or call for physical harm to people?",
      yes: "A threat or a call to hurt or kill people, explicit or veiled: an implied threat that never names the harm, slang for killing or beating someone, or a threat placed among unrelated text or written with altered spelling.",
      no: "Nothing in it threatens or calls for harm to people. This includes figurative idioms about attacking or tearing apart an idea or proposal, harsh criticism, news or history, clearly framed fiction, and discussion of safety.",
    },
    graphic: {
      ask: "Does `text` glorify violence against people or describe it in graphic detail?",
      yes: "Praise of violence done to people, or a graphic, gory description of it.",
      no: "It neither glorifies violence nor describes it graphically. This includes factual mentions of violence in news, history or safety discussion.",
    },
  },
  hate: {
    attack: {
      ask: `Does \`text\` attack, dehumanise or call for excluding people because of their ${PROTECTED}?`,
      yes: "Dehumanising language, incitement to hatred, discrimination or violence, or calls to exclude or expel people for a protected characteristic, including in a question's options.",
      no: "It attacks no one for a protected characteristic. This includes criticism of ideas, institutions, governments or organisations, discussion of discrimination, and quoting hate speech to condemn it.",
    },
    generalise: {
      ask: `Does \`text\` make a demeaning generalisation about people because of their ${PROTECTED}?`,
      yes: "A claim that a group defined by a protected characteristic is inferior, stupid, dishonest, dangerous or otherwise lesser.",
      no: "It makes no demeaning claim about such a group. This includes neutral or positive mentions of identity, inclusive or anti-discrimination statements, and friendly regional teasing.",
    },
    slur: {
      ask: `Does \`text\` use a slur for people of a given ${PROTECTED}?`,
      yes: "A slur for a group defined by a protected characteristic, aimed at anyone, including slang, abbreviated or casual insults built on such a slur, such as ableist slurs used as everyday insults.",
      no: "It uses no such slur. This includes ordinary insults that refer to no protected characteristic, and a slur quoted to condemn it.",
    },
  },
  harassment: {
    insult: {
      ask: "Does `text` insult, demean, intimidate or bully a specific person or specific people?",
      yes: "Insults, name-calling, demeaning remarks or intimidation aimed at an identifiable person or people, including the reader or another participant.",
      no: "It attacks no one personally. This includes criticism of a public role's decisions or votes, however harsh; criticism of organisations, communities or leadership in general; disagreement; idioms; and friendly teasing among people evidently on good terms.",
    },
  },
  sexual: {
    intimate: {
      ask: "Does `text` share, threaten to share, or offer intimate images or videos of a person without their consent?",
      yes: "Intimate or sexual images of someone published, offered or threatened to be published without their consent, including to extort them.",
      no: "It involves no intimate images of anyone without consent. This includes discussion of image-based abuse and how to report it.",
    },
    explicit: {
      ask: "Does `text` contain sexually explicit content, sexual solicitation, or promotion of pornography?",
      yes: "Explicit sexual descriptions, offers or requests of sex, or promotion of or links to adult content.",
      no: "It has no explicit sexual content or solicitation. This includes sex education, health, relationships and gender discussed without explicit content.",
    },
  },
  minors: {
    endanger: {
      ask: "Does `text` sexualise minors, seek contact with minors for sexual purposes, or otherwise endanger children?",
      yes: "Any sexualisation of minors, grooming, or content that puts children at risk.",
      no: "It does not endanger children. This includes child protection, parenting, education and questions about age.",
    },
  },
  "self-harm": {
    encourage: {
      ask: "Does `text` encourage or tell anyone to kill or harm themselves, or present suicide as a solution?",
      yes: "Urging, daring or telling someone to kill or hurt themselves, as advice, as an insult or as a joke, or presenting suicide or self-harm as a good way out.",
      no: "It encourages no one to harm themselves. This includes prevention messages, support and figures of speech.",
    },
    instruct: {
      ask: "Does `text` give instructions or methods for suicide or self-harm?",
      yes: "Methods, means or instructions for killing or harming oneself.",
      no: "It gives no such instructions. This includes general discussion of mental health and prevention.",
    },
    disclose: {
      ask: "Does the writer of `text` say they think about suicide, wish they were dead, or harm themselves?",
      yes: "The writer expresses suicidal thoughts, a wish to die or not to go on living, or says they hurt themselves, even in passing.",
      no: "The writer expresses no such thoughts. This includes sadness, stress or losses without them, figures of speech about dying of laughter or working oneself to death, and talking about mental health or prevention.",
    },
    graphic: {
      ask: "Does `text` describe suicide or self-harm in graphic detail?",
      yes: "A graphic description of injuries, methods or acts of suicide or self-harm.",
      no: "It has no graphic description of suicide or self-harm.",
    },
  },
  terrorism: {
    glorify: {
      ask: "Does any part of `text` praise, justify or celebrate a terrorist attack or its perpetrators?",
      yes: "Calling an attack or its perpetrators deserved, heroic or admirable, openly, in passing among unrelated text, or through coded references.",
      no: "It praises no attack. This includes news, historical, academic or policy discussion of terrorism, and mentions of attacks to discuss security.",
    },
    support: {
      ask: "Does `text` recruit for, raise funds for, or support a terrorist or violent extremist group?",
      yes: "Recruitment, fundraising or other support for a group that uses violence for political, religious or ideological ends, openly or in disguised wording.",
      no: "It supports no such group. This includes counter-extremism, compliance and anti-terrorism-financing topics, and historical armed resistance discussed without praise of terrorism.",
    },
    incite: {
      ask: "Does `text` call for or hint at violent action for political or ideological ends?",
      yes: "A call or a veiled suggestion that attacks or violence are needed against a system, an institution or a group, even hedged or tossed off.",
      no: "It suggests no political violence. This includes peaceful protest, strikes, voting, calls for reform, and hyperbole such as a vote being a bombshell or an attack in the technical sense.",
    },
  },
  spam: {
    promote: {
      ask: "Is `text` advertising or promotion that the survey did not ask for?",
      yes: "Unsolicited advertising of products, services, tokens, channels or adult content, repeated promotion, keyword stuffing, or link dumps.",
      no: "It promotes nothing unasked. This includes links to or descriptions of one's own project in answer to a question that asks for them, a survey's own questions and options even when they list products, tools or projects, relevant links and announcements, test entries, jokes, enthusiasm, and short or low-effort genuine answers.",
    },
  },
};

const RULES = CATEGORIES.flatMap((category) =>
  Object.entries(POLICY[category]).map(([kind, rule]) => ({
    name: `${category}_${kind}`,
    category,
    rule,
  })),
);

const QUESTIONS = Object.fromEntries(
  RULES.map(({ name, rule }) => [
    name,
    {
      type: "noul",
      instructions: rule.ask,
      criteria: { true: rule.yes, false: rule.no },
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
    name: "jev-v3",
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
          state: { context: CONTEXT, text },
          questions: QUESTIONS,
        }),
        signal: AbortSignal.timeout(60_000),
      });
      if (!response.ok)
        throw new Error(`${response.status} ${await response.text()}`);
      const body = (await response.json()) as Response;
      if (body.model !== MODEL) throw new Error(`answered by ${body.model}`);
      const missing = RULES.filter(
        ({ name }) => typeof body.answers[name]?.noul !== "number",
      );
      if (missing.length > 0)
        throw new Error(`no answer for ${missing.map((r) => r.name)}`);
      const scores: Partial<Record<Category, number>> = {};
      for (const { name, category } of RULES)
        scores[category] = Math.max(
          scores[category] ?? 0,
          body.answers[name]!.noul,
        );
      return {
        scores,
        raw: body,
        cost: body.usage.input_tokens * USD_PER_INPUT_TOKEN,
      };
    },
  };
}
