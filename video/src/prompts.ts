/**
 * The prompt library, borrowed rather than copied.
 *
 * `social/prompts.js` is the single source for both the copy and the badge
 * palette; the still cards read it through scripts/social-cards.mjs and the
 * video reads it through here. That is deliberate — a prompt rewritten once is
 * rewritten everywhere, and a kind that gains a colour gains it in both places.
 *
 * The import reaches outside video/ on purpose. It is the only such import, and
 * `allowJs` in tsconfig.json exists for it.
 */

import { KIND } from "../../social/prompts.js";

export type Prompt = {
  readonly kind: string;
  readonly pre: string;
  readonly verb: string;
  readonly post: string;
};

export type Tint = {
  readonly bg: string;
  readonly ink: string;
};

const KINDS: Record<string, Tint> = KIND;

/**
 * Terracotta is the library's majority colour, so an unknown kind — a prompt
 * typed straight into Studio, say — gets it rather than an error. The still
 * pipeline throws here instead; a preview that renders is worth more than a
 * preview that is right about a kind nobody has defined yet.
 */
export const tintFor = (kind: string): Tint =>
  KINDS[kind] ?? { bg: "var(--peach)", ink: "var(--terracotta)" };

/** The prompt as one line, for measuring length. */
export const plain = (p: Prompt): string => `${p.pre}${p.verb}${p.post}`;
