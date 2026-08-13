/**
 * One prompt, five seconds — the still card from social/card.css with a clock
 * attached. This is the single-post shape: one prompt, one video.
 *
 * For a set of prompts that fade into one another, see PromptReel.tsx.
 */

import { AbsoluteFill, Composition } from "remotion";
import { PromptScene } from "./PromptScene";
import { Paper, Wordmark } from "./Sheet";
import type { Prompt } from "./prompts";

type Props = {
  readonly prompt: Prompt;
};

export const PromptCard: React.FC<Props> = ({ prompt }) => {
  return (
    <AbsoluteFill name="Card">
      <Paper />
      <PromptScene prompt={prompt} entrance />
      <Wordmark fadeInAt={60} />
    </AbsoluteFill>
  );
};

export const PromptCardComposition = () => {
  return (
    <Composition
      id="PromptCard"
      component={PromptCard}
      durationInFrames={150}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{
        prompt: {
          kind: "QUESTION",
          pre: "What word do they ",
          verb: "mispronounce",
          post: " that you don’t want to correct?",
        },
      }}
    />
  );
};
