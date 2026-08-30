import "./index.css";
import { Folder } from "remotion";
import { PromptCardComposition } from "./PromptCard";
import { PromptReelComposition } from "./PromptReel";
import { PostComposition } from "./Post";
import { ShowcaseComposition } from "./Showcase";
import { AdVideoComposition } from "./AdVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Ads">
        <AdVideoComposition />
      </Folder>
      <Folder name="Instagram">
        <ShowcaseComposition />
        <PostComposition />
      </Folder>
      <Folder name="Prompts">
        <PromptReelComposition />
        <PromptCardComposition />
      </Folder>
    </>
  );
};
