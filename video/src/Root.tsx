import "./index.css";
import { Folder } from "remotion";
import { PromptCardComposition } from "./PromptCard";
import { PromptReelComposition } from "./PromptReel";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <PromptReelComposition />
      <Folder name="Single">
        <PromptCardComposition />
      </Folder>
    </>
  );
};
