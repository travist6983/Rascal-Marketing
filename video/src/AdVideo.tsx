/**
 * A paid-ad video — 1080 × 1920, for Instagram/Facebook Reels and Stories.
 *
 * The motion sibling of social/ads.js's 'quiet' template: a kicker, a headline
 * with one phrase in the tint, a subhead, up to three ticked lines, the app
 * rising into frame, and a CTA band that holds at the end. One layout for all
 * five launch creatives rather than one motion template per static template —
 * a fast vertical video reads better simplified than it does trying to
 * reproduce every static layout's exact geometry in six seconds.
 *
 * Copy comes straight from social/ads.js (see video/ad-props/*.json, hand-kept
 * in sync with the entries their filenames name). Design constants are kept
 * here rather than shared with social/ad.css because nothing else in this
 * project reads that file — Tailwind and CSS-in-JS are how this one draws.
 */

import {
  AbsoluteFill,
  Composition,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Device } from "./Device";
import { CANVAS, DISPLAY, ENTER, GRAIN, INK, MUTED, PAD, TEXT } from "./theme";

const TINTS = {
  terracotta: { ink: "#C05A2B", soft: "#FBEDE2", band: "#F5E9DC" },
  peri: { ink: "#5566D6", soft: "#E9EBFB", band: "#E4E7FA" },
} as const;

type Tint = keyof typeof TINTS;

type Props = {
  readonly kicker: string;
  readonly headline: string;
  readonly accent: string;
  readonly subhead: string;
  readonly ticks: readonly string[];
  readonly screen: string;
  readonly tint: Tint;
  readonly cta: string;
  readonly reassurance: string;
};

/** opacity+rise, the same shape every entrance in this project uses. */
function rise(frame: number, from: number, dur = 22, y = 26) {
  return {
    opacity: interpolate(frame, [from, from + dur], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: ENTER,
    }),
    translate: `0px ${interpolate(frame, [from, from + dur], [y, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: ENTER,
    })}px`,
  } as const;
}

const TickIcon: React.FC<{ ink: string }> = ({ ink }) => (
  <svg
    viewBox="0 0 24 24"
    width={30}
    height={30}
    fill="none"
    stroke={ink}
    strokeWidth={2.1}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12.6l4.6 4.6L19 7.4" />
  </svg>
);

export const AdVideo: React.FC<Props> = ({
  kicker,
  headline,
  accent,
  subhead,
  ticks,
  screen,
  tint,
  cta,
  reassurance,
}) => {
  const frame = useCurrentFrame();
  const t = TINTS[tint];

  const at = headline.indexOf(accent);
  const before = at === -1 ? headline : headline.slice(0, at);
  const after = at === -1 ? "" : headline.slice(at + accent.length);

  const phoneY = interpolate(frame, [66, 100], [420, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ENTER,
  });

  const bandY = interpolate(frame, [128, 156], [260, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ENTER,
  });

  return (
    <AbsoluteFill
      style={{ backgroundColor: CANVAS, backgroundImage: GRAIN, fontFamily: TEXT }}
    >
      <div style={{ padding: PAD, paddingBottom: 0 }}>
        <div
          style={{
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: 40,
            letterSpacing: "-0.02em",
            color: INK,
            ...rise(frame, 0, 18, 16),
          }}
        >
          Pocket Chronicle
        </div>

        <div
          style={{
            marginTop: 40,
            display: "inline-block",
            padding: "12px 22px",
            borderRadius: 999,
            backgroundColor: t.soft,
            color: t.ink,
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: 24,
            lineHeight: 1,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            ...rise(frame, 10),
          }}
        >
          {kicker}
        </div>

        <div
          style={{
            marginTop: 30,
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: 76,
            lineHeight: 1.14,
            letterSpacing: "-0.02em",
            color: INK,
            maxWidth: 900,
            ...rise(frame, 22),
          }}
        >
          {before}
          <span style={{ position: "relative", display: "inline", color: t.ink }}>
            {accent}
            <span
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: -6,
                height: 6,
                borderRadius: 3,
                backgroundColor: t.ink,
                opacity: 0.35,
                transformOrigin: "left center",
                scale: interpolate(frame, [46, 66], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: ENTER,
                }),
              }}
            />
          </span>
          {after}
        </div>

        <div
          style={{
            marginTop: 26,
            fontSize: 34,
            lineHeight: 1.42,
            color: MUTED,
            maxWidth: 860,
            ...rise(frame, 36),
          }}
        >
          {subhead}
        </div>

        <div style={{ marginTop: 34, display: "flex", flexDirection: "column", gap: 16 }}>
          {ticks.map((label, i) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                ...rise(frame, 52 + i * 12, 18, 18),
              }}
            >
              <TickIcon ink={t.ink} />
              <span style={{ fontSize: 30, color: INK, fontWeight: 600 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* The app, rising from the bottom edge and settling — Post.tsx's own
          bleed trick, animated instead of static. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: -560,
          display: "flex",
          justifyContent: "center",
          translate: `0px ${phoneY}px`,
        }}
      >
        <Device width={620}>
          <Img src={staticFile(`screens/${screen}.png`)} />
        </Device>
      </div>

      {/* CTA band, pinned to the bottom edge and held once it arrives. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: `28px ${PAD}px`,
          backgroundColor: t.band,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          translate: `0px ${bandY}px`,
        }}
      >
        <div
          style={{
            padding: "22px 40px",
            borderRadius: 999,
            backgroundColor: t.ink,
            color: "#FFFDF9",
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: 32,
          }}
        >
          {cta}
        </div>
        {reassurance ? (
          <div style={{ fontSize: 22, color: MUTED }}>{reassurance}</div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

export const AdVideoComposition = () => {
  return (
    <Composition
      id="AdVideo"
      component={AdVideo}
      durationInFrames={195}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{
        kicker: "No streaks",
        headline: "Miss a day and nothing happens.",
        accent: "nothing happens.",
        subhead:
          "No streak to keep, no badge to clear, nothing to catch up on. The archive does not keep score of you.",
        ticks: ["No streaks", "No badges", "No red"],
        screen: "onboarding-notifications",
        tint: "peri",
        cta: "Download on the App Store",
        reassurance: "The daily question is always free",
      }}
    />
  );
};
