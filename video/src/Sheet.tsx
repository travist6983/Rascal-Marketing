/**
 * The parts of the card that are not the prompt: the paper it is printed on and
 * the wordmark at the foot of it.
 *
 * These are split out because the reel holds them still while the prompts change
 * over them. The fade then reads as one sheet of paper being written on again,
 * which is the product in one gesture — not as a stack of cards being shuffled.
 */

import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import { CANVAS, DISPLAY, ENTER, GRAIN, INK, MUTED, PAD, TEXT } from "./theme";

export const Paper: React.FC = () => {
  return (
    <AbsoluteFill
      name="Paper"
      style={{
        backgroundColor: CANVAS,
        backgroundImage: GRAIN,
      }}
    />
  );
};

type WordmarkProps = {
  readonly fadeInAt: number;
};

export const Wordmark: React.FC<WordmarkProps> = ({ fadeInAt }) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      name="Wordmark"
      style={{
        padding: PAD,
        color: INK,
        fontFamily: TEXT,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        alignItems: "flex-start",
      }}
    >
      <Interactive.Div
        name="WordmarkInk"
        style={{
          opacity: interpolate(frame, [fadeInAt, fadeInAt + 24], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: ENTER,
          }),
          translate: interpolate(
            frame,
            [fadeInAt, fadeInAt + 30],
            ["0px 20px", "0px 0px"],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: ENTER,
            },
          ),
        }}
      >
        <div
          style={{
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: 52,
            letterSpacing: "-0.02em",
          }}
        >
          Pocket Chronicle
        </div>
        {/* The still card signs off with the wordmark alone. A video ends on
            bare paper with the wordmark held, which read thin when the name was
            one word, so this line is the site's own tagline rather than anything
            new. The name is two words as of the Aug 27 2026 rename and the hold
            is less bare than it was — the tagline stays anyway, because it says
            what the product does and the name only says what it is called. */}
        <div style={{ marginTop: 10, fontSize: 36, color: MUTED }}>
          One question a day about your kid
        </div>
      </Interactive.Div>
    </AbsoluteFill>
  );
};
