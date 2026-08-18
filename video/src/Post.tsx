/**
 * One Instagram feed post — 1080 × 1350, the size that takes the most vertical
 * room a feed will give you.
 *
 * Copy on paper at the top, the phone below it running off the bottom edge. The
 * bleed is the reason the copy has room to be a real sentence rather than a
 * caption: a phone shown whole in this canvas has to be small enough to look
 * like a thumbnail, and a thumbnail of a screenshot persuades nobody.
 *
 * It also means only the top ~57% of a capture is in frame, which is why the
 * ten screens chosen in social/showcase.js are all top-anchored ones.
 *
 * This is a <Still>: no clock, no animation. Rendered by
 * scripts/social-showcase.mjs, one PNG per entry in POSTS.
 */

import { AbsoluteFill, Img, Still, staticFile } from "remotion";
import { Device } from "./Device";
import { CANVAS, DISPLAY, GRAIN, INK, MUTED, TEXT } from "./theme";

const PAD = 72;
const DEVICE_W = 640;

type Props = {
  readonly screen: string;
  readonly kicker: string;
  readonly headline: string;
  readonly body: string;
  readonly tint: string;
};

export const Post: React.FC<Props> = ({
  screen,
  kicker,
  headline,
  body,
  tint,
}) => {
  /* showcase.js names a palette token, resolved against the same custom
     properties in index.css that the prompt cards' kind table uses. */
  const ink = tint === "peri" ? "var(--peri)" : "var(--terracotta)";
  const soft = tint === "peri" ? "var(--lav)" : "var(--peach)";

  return (
    <AbsoluteFill
      style={{
        backgroundColor: CANVAS,
        backgroundImage: GRAIN,
        color: INK,
        fontFamily: TEXT,
      }}
    >
      <div style={{ padding: PAD }}>
        <div
          style={{
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: 34,
            letterSpacing: "-0.02em",
          }}
        >
          Vellum
        </div>

        <div
          style={{
            marginTop: 44,
            display: "inline-block",
            padding: "14px 24px",
            borderRadius: 999,
            backgroundColor: soft,
            color: ink,
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: 22,
            lineHeight: 1,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          {kicker}
        </div>

        <div
          style={{
            marginTop: 26,
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: 64,
            lineHeight: 1.12,
            letterSpacing: "-0.02em",
          }}
        >
          {headline}
        </div>

        <div
          style={{
            marginTop: 22,
            fontSize: 30,
            lineHeight: 1.45,
            color: MUTED,
            maxWidth: 840,
          }}
        >
          {body}
        </div>
      </div>

      {/* Pinned to the bottom and allowed to run past it. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: -520,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Device width={DEVICE_W}>
          <Img src={staticFile(`screens/${screen}.png`)} />
        </Device>
      </div>
    </AbsoluteFill>
  );
};

export const PostComposition = () => {
  return (
    <Still
      id="Post"
      component={Post}
      width={1080}
      height={1350}
      defaultProps={{
        screen: "today-two-missions",
        kicker: "The daily",
        headline: "One question a day about your kid.",
        body: "It waits on the home screen instead of in an inbox you already have four hundred things in.",
        tint: "terracotta",
      }}
    />
  );
};
