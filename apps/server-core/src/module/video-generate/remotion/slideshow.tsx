import type { CSSProperties } from "react";
import { AbsoluteFill, Img, interpolate, Sequence, useCurrentFrame } from "remotion";

export const FPS = 30;
export const INTRO_SECONDS = 2;
export const STEP_SECONDS = 6;
export const OUTRO_SECONDS = 2;
export const INTRO_FRAMES = FPS * INTRO_SECONDS;
export const STEP_FRAMES = FPS * STEP_SECONDS;
export const OUTRO_FRAMES = FPS * OUTRO_SECONDS;

type SceneType = "workflow" | "feature" | "result" | "share";
type Motion = "push-in" | "pan" | "spotlight" | "hold";
type CalloutStyle = "ring" | "arrow" | "pulse" | "magnify";

export type VideoGenerateScene = {
  readonly id: string;
  readonly imageUrl: string;
  readonly reason: string;
  readonly index: number;
  readonly direction?: {
    readonly sceneType: SceneType;
    readonly motion: Motion;
    readonly callout: CalloutStyle;
    readonly calloutLabel: string;
    readonly body?: string;
    readonly cta?: string;
    readonly headline: string;
  };
};

export type VideoGenerateSlideshowProps = {
  readonly title: string;
  readonly subtitle?: string;
  readonly backgroundImageUrls?: ReadonlyArray<string>;
  readonly scenes: ReadonlyArray<VideoGenerateScene>;
};

export const VideoGenerateSlideshow = ({
  title,
  subtitle,
  scenes,
}: VideoGenerateSlideshowProps) => {
  return (
    <AbsoluteFill style={styles.stage}>
      <Sequence durationInFrames={INTRO_FRAMES}>
        <TitleCard title={title} subtitle={subtitle} />
      </Sequence>
      {scenes.map((scene, index) => (
        <Sequence
          key={scene.id}
          from={INTRO_FRAMES + index * STEP_FRAMES}
          durationInFrames={STEP_FRAMES}
        >
          <ScreenshotScene scene={scene} />
        </Sequence>
      ))}
      <Sequence from={INTRO_FRAMES + scenes.length * STEP_FRAMES} durationInFrames={OUTRO_FRAMES}>
        <TitleCard title={title} subtitle={subtitle} />
      </Sequence>
    </AbsoluteFill>
  );
};

const ScreenshotScene = ({ scene }: { readonly scene: VideoGenerateScene }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 18], [0, 1], clamp);
  const scale = interpolate(frame, [0, STEP_FRAMES], [1.0, 1.02], clamp);

  if (!scene.imageUrl) return <AbsoluteFill style={styles.stage} />;

  return (
    <AbsoluteFill style={styles.stage}>
      <Img
        src={scene.imageUrl}
        style={{ ...styles.screenshot, opacity, transform: `scale(${scale})` }}
      />
    </AbsoluteFill>
  );
};

const TitleCard = ({
  title,
  subtitle,
}: {
  readonly title: string;
  readonly subtitle: string | undefined;
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 18], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ ...styles.stage, ...styles.titleCard, opacity }}>
      <div style={styles.titleHeadline}>{title || "Mira"}</div>
      {subtitle ? <div style={styles.titleSubtitle}>{subtitle}</div> : null}
    </AbsoluteFill>
  );
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const styles = {
  screenshot: {
    height: "100%",
    inset: 0,
    objectFit: "contain",
    position: "absolute",
    width: "100%",
  },
  stage: { background: "#000", color: "#f7f4ef", fontFamily: "Inter, Arial, sans-serif" },
  titleCard: {
    alignItems: "center",
    flexDirection: "column",
    gap: 24,
    justifyContent: "center",
    padding: "0 120px",
    textAlign: "center",
  },
  titleHeadline: {
    color: "#f7f4ef",
    fontFamily: "Inter, Arial, sans-serif",
    fontSize: 96,
    fontWeight: 500,
    letterSpacing: -3.6,
    lineHeight: 1.05,
  },
  titleSubtitle: {
    color: "#a6a19a",
    fontFamily: "Inter, Arial, sans-serif",
    fontSize: 40,
    fontWeight: 500,
    letterSpacing: -1.2,
    lineHeight: 1.25,
    maxWidth: 1400,
  },
} satisfies Record<string, CSSProperties>;
