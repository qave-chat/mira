import { Composition } from "remotion";
import { VideoGenerateSlideshow } from "./slideshow";

const FPS = 30;
const SECONDS_PER_PHOTO = 5;
const DEFAULT_PHOTO_COUNT = 1;

export const RemotionRoot = () => {
  return (
    <Composition
      id="VideoGenerateSlideshow"
      component={VideoGenerateSlideshow}
      width={1920}
      height={1080}
      fps={FPS}
      durationInFrames={DEFAULT_PHOTO_COUNT * SECONDS_PER_PHOTO * FPS}
      defaultProps={{ prompt: "", photoUrls: [] }}
      calculateMetadata={({ props }) => ({
        durationInFrames:
          Math.max(props.photoUrls.length, DEFAULT_PHOTO_COUNT) * SECONDS_PER_PHOTO * FPS,
      })}
    />
  );
};
