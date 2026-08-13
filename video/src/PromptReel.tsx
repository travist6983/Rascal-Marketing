/**
 * A set of prompts on one sheet of paper, fading one into the next.
 *
 * The paper and the wordmark never move. Only the ink changes, which is the
 * point being made: it is the same small ritual every day, and only the prompt
 * is new. A stack of cards flying past would say something else.
 *
 * The fade dips through the paper rather than dissolving one sentence into the
 * other. A true cross-fade puts two sentences on the same grid at half opacity
 * each, and at this type size that is a quarter-second of mush at exactly the
 * moment the eye is looking. So the ink lifts off, the page is empty for a beat,
 * and the next prompt arrives — which is also the truer picture of the product.
 * Widen `fadeFrames` to lengthen that beat; the cards never overlap.
 *
 * Duration is not fixed — calculateMetadata below derives it from how many
 * prompts were handed in, so a six-card reel and a thirty-card reel are the same
 * composition. scripts/social-reel.mjs feeds it from the posting queue.
 */

import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Composition,
  Easing,
  Series,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { PromptScene } from "./PromptScene";
import { Paper, Wordmark } from "./Sheet";
import { ENTER } from "./theme";
import type { Prompt } from "./prompts";

type Props = {
  readonly prompts: readonly Prompt[];
  readonly framesPerCard: number;
  readonly fadeFrames: number;
};

/**
 * Clamps the timing and reports the length that results. Returning the clamped
 * props as well as the duration keeps the component and the timeline agreeing:
 * a fade longer than half the card it belongs to would otherwise fold the
 * keyframes over themselves the moment someone dragged the value in Studio.
 */
const calculateMetadata: CalculateMetadataFunction<Props> = ({ props }) => {
  const framesPerCard = Math.max(6, Math.round(props.framesPerCard));
  const fadeFrames = Math.min(
    Math.max(2, Math.round(props.fadeFrames)),
    Math.floor((framesPerCard - 1) / 2),
  );

  return {
    durationInFrames: Math.max(1, props.prompts.length) * framesPerCard,
    props: { ...props, framesPerCard, fadeFrames },
  };
};

/**
 * One card's worth of ink, arriving and leaving. Lives inside the Series so
 * `useCurrentFrame()` is the card's own clock rather than the reel's.
 */
const Ink: React.FC<{
  readonly hold: number;
  readonly fade: number;
  readonly children: React.ReactNode;
}> = ({ hold, fade, children }) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      name="Ink"
      style={{
        opacity: interpolate(
          frame,
          [0, fade, hold - fade, hold - 1],
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

export const PromptReel: React.FC<Props> = ({
  prompts,
  framesPerCard,
  fadeFrames,
}) => {
  return (
    <AbsoluteFill name="Reel">
      <Paper />

      <Series>
        {prompts.map((prompt, index) => (
          <Series.Sequence
            key={`${index}-${prompt.verb}`}
            durationInFrames={framesPerCard}
            name={`${index + 1}. ${prompt.kind}`}
            layout="absolute-fill"
          >
            <Ink hold={framesPerCard} fade={fadeFrames}>
              <PromptScene prompt={prompt} entrance={false} />
            </Ink>
          </Series.Sequence>
        ))}
      </Series>

      {/* Signed once, and it stays signed. */}
      <Wordmark fadeInAt={4} />
    </AbsoluteFill>
  );
};

export const PromptReelComposition = () => {
  return (
    <Composition
      id="PromptReel"
      component={PromptReel}
      durationInFrames={720}
      fps={30}
      width={1080}
      height={1920}
      calculateMetadata={calculateMetadata}
      defaultProps={{
        framesPerCard: 120,
        fadeFrames: 12,
        prompts: [
          {
            kind: "QUESTION",
            pre: "What word do they ",
            verb: "mispronounce",
            post: " that you don’t want to correct?",
          },
          {
            kind: "PHOTO",
            pre: "",
            verb: "Photograph",
            post: " the mess they made. Don’t clean it up first.",
          },
          {
            kind: "VOICE",
            pre: "",
            verb: "Record",
            post: " them singing. Whatever they’re singing.",
          },
          {
            kind: "VIDEO",
            pre: "",
            verb: "Film",
            post: " them telling you about their day. Don’t prompt them.",
          },
          {
            kind: "ACTIVITY",
            pre: "Never ",
            verb: "let go",
            post: " of the hug first today. Let them be the one to pull away.",
          },
          {
            kind: "LETTER",
            pre: "",
            verb: "Write",
            post: " them a letter about exactly who they are right now. They won’t be this person next year.",
          },
        ],
      }}
    />
  );
};
