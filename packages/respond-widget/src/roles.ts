/**
 * Which key proves a role. Labels, descriptions, colors and
 * browser-claimability are respond-core's — the app states them the same way,
 * so they have one definition.
 */

import { Role } from "cip-179";

import type { ProofKeyKind } from "./types";

/** Which key must sign to prove a role's credential (for `required_signers`). */
const ROLE_KEY_KIND: Record<number, ProofKeyKind> = {
  [Role.DRep]: "drep",
  [Role.SPO]: "pool",
  [Role.CC]: "cc",
  [Role.Stakeholder]: "stake",
  [Role.Keyholder]: "payment",
};

export function keyKindForRole(role: Role): ProofKeyKind {
  return ROLE_KEY_KIND[role] ?? "payment";
}
