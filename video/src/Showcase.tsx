/**
 * An Instagram reel built from the app captures — 1080 × 1920.
 *
 * Same grammar as PromptReel: one sheet of paper that never moves, ink that
 * dips through it between scenes rather than cross-dissolving. The reasoning is
 * in PromptReel.tsx and applies doubly here, because a screenshot fading through
 * another screenshot is unreadable in a way two sentences never quite are.
 *
 * Three scene kinds, chosen per entry in social/showcase.js:
 *   card    a line on bare paper — the beat before and after the product
 *   screen  a caption over a still in the phone frame
 *   clip    the same with a recording playing
 *
 * Duration comes from the scenes, so a four-beat reel and a ten-beat one are the
 * same composition. scripts/social-showcase.mjs renders them.
 */

import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Composition,
  Easing,
  Img,
  Series,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Video } from "@remotion/media";
import { Device } from "./Device";
import { Paper } from "./Sheet";
import { CANVAS, DISPLAY, ENTER, INK, TEXT } from "./theme";

const FPS = 30;
const FADE = 12;
const PAD = 96;

/* The phone is big and runs off the bottom edge; the brand mark sits at the top
   where it cannot collide with it. Same arrangement as the feed post, so a reel
   frame and a post read as one set. */
const DEVICE_W = 820;
const DEVICE_BLEED = -260;
const BRAND_BLOCK = 180;

type Scene = {
  readonly kind: "card" | "screen" | "clip";
  readonly text?: string;
  readonly caption?: string;
  readonly screen?: string;
  readonly clip?: string;
  readonly seconds: number;
};

type Props = {
  readonly scenes: readonly Scene[];
  readonly tint: string;
};

const framesFor = (seconds: number) => Math.max(2 * FADE + 2, Math.round(seconds * FPS));

const calculateMetadata: CalculateMetadataFunction<Props> = ({ props }) => ({
  durationInFrames: props.scenes.reduce(
    (total, scene) => total + framesFor(scene.seconds),
    0,
  ),
});

/** One scene's ink, arriving and leaving. Inside the Series, so the clock is local. */
const Ink: React.FC<{ readonly hold: number; readonly children: React.ReactNode }> = ({
  hold,
  children,
}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        opacity: interpolate(
          frame,
          [0, FADE, hold - FADE, hold - 1],
          [0, 1, 1, 0],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: [ENTER, Easing.linear, Easing.bezier(0.4, 0, 1, 1)],
          },
        ),
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const BrandMark: React.FC = () => (
  <div
    style={{
      position: "absolute",
      top: PAD,
      left: PAD,
      fontFamily: DISPLAY,
      fontWeight: 800,
      fontSize: 40,
      letterSpacing: "-0.02em",
      color: INK,
    }}
  >
    Vellum
  </div>
);

const Card: React.FC<{ readonly text: string }> = ({ text }) => (
  <AbsoluteFill
    style={{
      padding: PAD,
      paddingBottom: PAD + 160,
      display: "flex",
      justifyContent: "center",
      color: INK,
      fontFamily: DISPLAY,
      fontWeight: 700,
      fontSize: 92,
      lineHeight: 1.16,
      letterSpacing: "-0.02em",
    }}
  >
    {text}
  </AbsoluteFill>
);

/**
 * A caption, then the phone under it running off the bottom edge — the same
 * arrangement as the feed post, so a reel frame and a post read as one set.
 */
const Screened: React.FC<{
  readonly caption: string;
  readonly ink: string;
  readonly children: React.ReactNode;
}> = ({ caption, ink, children }) => (
  <AbsoluteFill>
    <div
      style={{
        padding: PAD,
        paddingTop: BRAND_BLOCK,
        fontFamily: DISPLAY,
        fontWeight: 700,
        fontSize: 58,
        lineHeight: 1.2,
        letterSpacing: "-0.02em",
        color: ink,
      }}
    >
      {caption}
    </div>
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: DEVICE_BLEED,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Device width={DEVICE_W}>{children}</Device>
    </div>
  </AbsoluteFill>
);

export const Showcase: React.FC<Props> = ({ scenes, tint }) => {
  const ink = tint === "peri" ? "var(--peri)" : "var(--terracotta)";

  return (
    <AbsoluteFill style={{ backgroundColor: CANVAS, fontFamily: TEXT }}>
      <Paper />

      <Series>
        {scenes.map((scene, index) => {
          const hold = framesFor(scene.seconds);
          return (
            <Series.Sequence
              key={`${index}-${scene.kind}`}
              durationInFrames={hold}
              name={`${index + 1}. ${scene.kind}`}
              layout="absolute-fill"
            >
              <Ink hold={hold}>
                {scene.kind === "card" ? (
                  <Card text={scene.text ?? ""} />
                ) : (
                  <Screened caption={scene.caption ?? ""} ink={ink}>
                    {scene.kind === "clip" ? (
                      <Video src={staticFile(`recordings/${scene.clip}.mp4`)} />
                    ) : (
                      <Img src={staticFile(`screens/${scene.screen}.png`)} />
                    )}
                  </Screened>
                )}
              </Ink>
            </Series.Sequence>
          );
        })}
      </Series>

      {/* Held above the scenes so it never fades with them, and at the top where
          the phone running off the bottom edge cannot reach it. */}
      <BrandMark />
    </AbsoluteFill>
  );
};

export const ShowcaseComposition = () => {
  return (
    <Composition
      id="Showcase"
      component={Showcase}
      durationInFrames={366}
      fps={30}
      width={1080}
      height={1920}
      calculateMetadata={calculateMetadata}
      defaultProps={{
        tint: "terracotta",
        scenes: [
          { kind: "card" as const, text: "One question a day about your kid.", seconds: 2.6 },
          {
            kind: "screen" as const,
            screen: "today-two-missions",
            caption: "It arrives in the morning.",
            seconds: 3.4,
          },
          {
            kind: "screen" as const,
            screen: "entry-question-answered",
            caption: "Answering takes a sentence.",
            seconds: 3.4,
          },
          {
            kind: "card" as const,
            text: "The part you would have forgotten by Friday.",
            seconds: 2.8,
          },
        ],
      }}
    />
  );
};
