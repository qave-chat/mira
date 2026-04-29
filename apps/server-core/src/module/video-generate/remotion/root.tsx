import { Composition } from "remotion";
import { FPS, INTRO_FRAMES, OUTRO_FRAMES, STEP_FRAMES, VideoGenerateSlideshow } from "./slideshow";

export const RemotionRoot = () => {
  return (
    <Composition
      id="VideoGenerateSlideshow"
      component={VideoGenerateSlideshow}
      width={1920}
      height={1080}
      fps={FPS}
      durationInFrames={INTRO_FRAMES + STEP_FRAMES + OUTRO_FRAMES}
      defaultProps={{ title: "", subtitle: "", backgroundImageUrls: [], scenes: [] }}
      calculateMetadata={({ props }) => ({
        durationInFrames:
          INTRO_FRAMES + Math.max(props.scenes.length, 1) * STEP_FRAMES + OUTRO_FRAMES,
      })}
    />
  );
};
