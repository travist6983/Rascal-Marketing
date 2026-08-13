/**
 * One prompt on the page — the badge and the sentence, nothing under them.
 *
 * The paper and the wordmark are somebody else's job (Sheet.tsx), which is what
 * lets the reel cross-fade this layer alone.
 *
 * `entrance` is off in the reel: there the cross-fade is the entrance, and a
 * card that also rises into place while it fades reads as two moves for one
 * event. The verb's block wipes in either way — it is the card's one signature,
 * and it lands after the sentence has settled, not during its arrival.
 */

import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import { tintFor, type Prompt } from "./prompts";
import { DISPLAY, ENTER, INK, PAD, TEXT } from "./theme";

/* The wordmark owns the foot of the card; the sentence stops short of it. */
const FOOT = 150;

/* The block sweeps after the sentence is still, whether it arrived or faded in. */
const MARK_IN = 30;
const MARK_OUT = 54;

type Props = {
  readonly prompt: Prompt;
  readonly entrance: boolean;
};

export const PromptScene: React.FC<Props> = ({ prompt, entrance }) => {
  const frame = useCurrentFrame();
  const tint = tintFor(prompt.kind);

  return (
    <AbsoluteFill
      name="Prompt"
      style={{
        padding: PAD,
        paddingBottom: PAD + FOOT,
        color: INK,
        fontFamily: TEXT,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
      }}
    >
      <Interactive.Div
        name="Badge"
        style={{
          padding: "20px 34px",
          borderRadius: 999,
          backgroundColor: tint.bg,
          color: tint.ink,
          fontFamily: DISPLAY,
          fontWeight: 700,
          fontSize: 32,
          lineHeight: 1,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          opacity: entrance
            ? interpolate(frame, [0, 18], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: ENTER,
              })
            : 1,
          translate: entrance
            ? interpolate(frame, [0, 24], ["0px 24px", "0px 0px"], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: ENTER,
              })
            : "0px 0px",
        }}
      >
        {prompt.kind}
      </Interactive.Div>

      <Interactive.Div
        name="Sentence"
        style={{
          marginTop: 72,
          fontSize: 88,
          lineHeight: 1.28,
          fontWeight: 400,
          letterSpacing: "-0.01em",
          opacity: entrance
            ? interpolate(frame, [9, 33], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: ENTER,
              })
            : 1,
          translate: entrance
            ? interpolate(frame, [9, 39], ["0px 32px", "0px 0px"], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: ENTER,
              })
            : "0px 0px",
        }}
      >
        {prompt.pre}
        <span style={{ position: "relative", display: "inline-block" }}>
          {/* The block, not coloured ink — a card scrolling past gets about a
              third of a second. It wipes from the left as the eye lands. */}
          <span
            style={{
              position: "absolute",
              inset: "0.06em -0.12em 0.04em",
              backgroundColor: tint.bg,
              borderRadius: 12,
              transformOrigin: "left center",
              scale: interpolate(
                frame,
                [MARK_IN, MARK_OUT],
                ["0 1", "1 1"],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: ENTER,
                },
              ),
            }}
          />
          <span
            style={{
              position: "relative",
              color: tint.ink,
              fontWeight: 600,
            }}
          >
            {prompt.verb}
          </span>
        </span>
        {prompt.post}
      </Interactive.Div>
    </AbsoluteFill>
  );
};
