/**
 * The phone the screenshots sit in.
 *
 * Proportions are the landing page's `.device` rule scaled up: a hairline ink
 * border, a 10/260 padding ratio, a 50/260 outer corner and a 40/260 inner one.
 * No chunky bezel, no glare, no hand holding it — the site draws a phone as a
 * thin outline and so does this.
 *
 * The captures are 1206 × 2622. That ratio is fixed here rather than measured,
 * because a screenshot that arrives at some other size should letterbox
 * visibly rather than silently stretch the frame it is sitting in.
 */

import { AbsoluteFill } from "remotion";
import { INK, SURFACE } from "./theme";

export const SHOT_W = 1206;
export const SHOT_H = 2622;
export const SHOT_RATIO = SHOT_W / SHOT_H;

type Props = {
  readonly width: number;
  readonly children: React.ReactNode;
};

export const Device: React.FC<Props> = ({ width, children }) => {
  const pad = width * (10 / 260);
  const screenW = width - pad * 2;

  return (
    <div
      style={{
        width,
        padding: pad,
        borderRadius: width * (50 / 260),
        border: `${Math.max(1, width * 0.0035)}px solid ${INK}`,
        backgroundColor: SURFACE,
        boxShadow: "0 24px 64px rgba(0, 0, 0, 0.10), 0 4px 16px rgba(0, 0, 0, 0.05)",
      }}
    >
      <div
        style={{
          position: "relative",
          width: screenW,
          height: screenW / SHOT_RATIO,
          borderRadius: width * (40 / 260),
          overflow: "hidden",
          backgroundColor: SURFACE,
        }}
      >
        <AbsoluteFill>{children}</AbsoluteFill>
      </div>
    </div>
  );
};
