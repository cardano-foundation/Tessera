/** A made-up survey with one question of each kind, open to every role. */

import { ROLE_VALUES, SPEC_VERSION, type SurveyDefinition } from "cip-179";
import { hexToBytes } from "cip-179/domain";

export const SAMPLE: SurveyDefinition = {
  specVersion: SPEC_VERSION,
  owner: { type: "key", keyHash: hexToBytes("00".repeat(28)) },
  title: "Treasury priorities for the next cycle",
  description: "A sample survey: nothing here is on chain.",
  eligibleRoles: ROLE_VALUES,
  endEpoch: 600,
  submissionMode: { type: "public" },
  questions: [
    {
      type: "singleChoice",
      prompt: "Which upgrade should ship first?",
      required: true,
      options: {
        type: "options",
        labels: ["Scaling (Leios)", "Governance polish", "Developer tooling"],
      },
    },
    {
      type: "multiSelect",
      prompt: "Which areas need funding? Pick up to two, or none.",
      minSelections: 0,
      maxSelections: 2,
      options: {
        type: "options",
        labels: ["Core protocol", "Wallets", "Education", "Marketing"],
      },
    },
    {
      type: "ranking",
      prompt: "Rank these values by importance.",
      minRanked: 1,
      maxRanked: 3,
      options: {
        type: "options",
        labels: ["Decentralization", "Sustainability", "Usability"],
      },
    },
    {
      type: "numericRange",
      prompt: "What share of the treasury should this cycle spend (%)?",
      constraints: { min: 0n, max: 100n, step: 5n },
    },
    {
      type: "pointsAllocation",
      prompt: "Distribute 100 points across the pillars.",
      budget: 100n,
      options: {
        type: "options",
        labels: ["Research", "Community", "Infrastructure"],
      },
    },
    {
      type: "rating",
      prompt: "Rate each proposal. Leave any blank.",
      requireAll: false,
      scale: { type: "labels", labels: ["Poor", "Fair", "Good", "Great"] },
      options: { type: "options", labels: ["Proposal A", "Proposal B"] },
    },
    {
      type: "custom",
      prompt: "Anything else? An external schema reads this answer.",
      methodSchema: {
        uri: "ipfs://bafybeigdyrexamplecustomschemametadatumuri/schema.json",
        hash: hexToBytes("22".repeat(32)),
      },
    },
  ],
};
