import { AbsoluteFill, Img, interpolate, Sequence, useCurrentFrame } from "remotion";

const FPS = 30;
const SECONDS_PER_PHOTO = 5;
const FRAMES_PER_PHOTO = FPS * SECONDS_PER_PHOTO;

export type VideoGenerateSlideshowProps = {
  readonly prompt: string;
  readonly photoUrls: ReadonlyArray<string>;
};

export const VideoGenerateSlideshow = ({ prompt, photoUrls }: VideoGenerateSlideshowProps) => {
  const photos = photoUrls.length > 0 ? photoUrls : [""];

  return (
    <AbsoluteFill
      style={{ backgroundColor: "#07070a", color: "white", fontFamily: "Inter, Arial, sans-serif" }}
    >
      {photos.map((src, index) => (
        <Sequence
          key={`${src}-${index}`}
          from={index * FRAMES_PER_PHOTO}
          durationInFrames={FRAMES_PER_PHOTO}
        >
          <PhotoFrame src={src} />
        </Sequence>
      ))}
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          background: "linear-gradient(180deg, rgba(7,7,10,0) 45%, rgba(7,7,10,0.86) 100%)",
          padding: 80,
        }}
      >
        <div
          style={{
            fontSize: 58,
            lineHeight: 1.08,
            fontWeight: 700,
            maxWidth: 1320,
            textShadow: "0 8px 38px rgba(0,0,0,0.55)",
          }}
        >
          {prompt}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const PhotoFrame = ({ src }: { readonly src: string }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, 18, FRAMES_PER_PHOTO - 18, FRAMES_PER_PHOTO],
    [0, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const scale = interpolate(frame, [0, FRAMES_PER_PHOTO], [1, 1.06], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity, overflow: "hidden" }}>
      {src.length > 0 ? (
        <Img
          src={src}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${scale})`,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
