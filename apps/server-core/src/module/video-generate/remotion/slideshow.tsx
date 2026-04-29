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
  backgroundImageUrls,
  scenes,
}: VideoGenerateSlideshowProps) => {
  const usableScenes = scenes.length > 0 ? scenes : [fallbackScene(title, subtitle)];

  return (
    <AbsoluteFill style={styles.stage}>
      <Sequence durationInFrames={INTRO_FRAMES}>
        <HeroScene
          backgroundImageUrl={selectBackground(backgroundImageUrls, 0)}
          scene={introScene(title, subtitle)}
          total={usableScenes.length}
        />
      </Sequence>
      {usableScenes.map((scene, index) => (
        <Sequence
          key={scene.id}
          from={INTRO_FRAMES + index * STEP_FRAMES}
          durationInFrames={STEP_FRAMES}
        >
          <HeroScene
            backgroundImageUrl={selectBackground(backgroundImageUrls, index)}
            scene={scene}
            total={usableScenes.length}
          />
        </Sequence>
      ))}
      <Sequence
        from={INTRO_FRAMES + usableScenes.length * STEP_FRAMES}
        durationInFrames={OUTRO_FRAMES}
      >
        <HeroScene
          backgroundImageUrl={selectBackground(backgroundImageUrls, usableScenes.length)}
          scene={outroScene(title, subtitle, usableScenes.length)}
          total={usableScenes.length}
        />
      </Sequence>
    </AbsoluteFill>
  );
};

const HeroScene = ({
  backgroundImageUrl,
  scene,
  total,
}: {
  readonly backgroundImageUrl?: string | undefined;
  readonly scene: VideoGenerateScene;
  readonly total: number;
}) => {
  const frame = useCurrentFrame();
  const direction = scene.direction ?? inferFallbackDirection(scene.reason, scene.index, total);
  const copy = copyFor(scene, direction, total);
  const enter = interpolate(frame, [0, 28], [0, 1], clamp);
  const editorY = interpolate(frame, [0, 34], [42, 0], clamp);
  const editorScale = interpolate(frame, [0, STEP_FRAMES], [0.982, 1.018], clamp);
  const paintX = interpolate(frame, [0, STEP_FRAMES], [-16, 10], clamp);
  const copyX = interpolate(frame, [24, 54], [42, 0], clamp);
  const imageScale = interpolate(frame, [0, STEP_FRAMES], [1.01, 1.06], clamp);

  return (
    <AbsoluteFill style={styles.scene}>
      <div style={styles.paintingPanel}>
        <Painting imageUrl={backgroundImageUrl} x={paintX} />
      </div>
      <div
        style={{
          ...styles.editorWindow,
          opacity: enter,
          transform: `translateY(${editorY}px) scale(${editorScale})`,
        }}
      >
        <EditorChrome title={copy.windowTitle} />
        <div style={styles.editorTabs}>
          <div style={styles.inactiveTab}>{copy.previousTab}</div>
          <div style={styles.activeTab}>
            {copy.activeTab}
            <span style={styles.close}>×</span>
          </div>
        </div>
        <div style={styles.editorBody}>
          {scene.imageUrl ? (
            <Img
              src={scene.imageUrl}
              style={{ ...styles.screenshot, transform: `scale(${imageScale})` }}
            />
          ) : (
            <div style={styles.emptyEditor} />
          )}
          <FocusSweep />
        </div>
      </div>
      <div style={{ ...styles.copyBlock, opacity: enter, transform: `translateX(${copyX}px)` }}>
        <div style={styles.copyKicker}>{copy.kicker}</div>
        <div style={styles.copyHeadline}>{copy.headline}</div>
        <div style={styles.copyBody}>{copy.body}</div>
        <div style={styles.copyCta}>{copy.cta} -&gt;</div>
      </div>
    </AbsoluteFill>
  );
};

const Painting = ({
  imageUrl,
  x,
}: {
  readonly imageUrl?: string | undefined;
  readonly x: number;
}) => {
  if (!imageUrl) return <div style={styles.paintFallback} />;
  return (
    <Img
      src={imageUrl}
      style={{ ...styles.paintImage, transform: `translateX(${x}px) scale(1.04)` }}
    />
  );
};

const EditorChrome = ({ title }: { readonly title: string }) => (
  <div style={styles.editorChrome}>
    <div style={styles.dots}>
      <div style={styles.dot} />
      <div style={styles.dot} />
      <div style={styles.dot} />
    </div>
    <div style={styles.windowTitle}>{title}</div>
  </div>
);

const FocusSweep = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [26, 54, 128, 160], [0, 0.78, 0.78, 0], clamp);
  const y = interpolate(frame, [26, 160], [510, 330], clamp);

  return (
    <div style={{ ...styles.focusWrap, opacity, transform: `translateY(${y}px)` }}>
      <div style={styles.focusLine} />
      <div style={styles.focusGlow} />
    </div>
  );
};

function copyFor(
  scene: VideoGenerateScene,
  direction: NonNullable<VideoGenerateScene["direction"]>,
  total: number,
) {
  const headline = shortHeadline(direction.headline, direction.sceneType, scene.index);
  return {
    activeTab: direction.sceneType === "result" ? "Result" : "Current Step",
    body: shortBody(direction.body ?? scene.reason),
    cta: shortCta(
      direction.cta ??
        (direction.sceneType === "share"
          ? "Share The Story"
          : direction.sceneType === "result"
            ? "Review The Result"
            : "Explore The Flow"),
    ),
    headline,
    kicker: `${scene.index + 1} / ${Math.max(total, 1)}`,
    previousTab: "Overview",
    windowTitle: "Mira",
  };
}

function introScene(title: string, subtitle?: string): VideoGenerateScene {
  return {
    id: "intro",
    imageUrl: "",
    index: 0,
    reason:
      subtitle || "A focused walkthrough that turns product moments into a clear reviewable story.",
    direction: {
      callout: "pulse",
      calloutLabel: "Start here",
      headline: title || "Magically clear product walkthroughs",
      motion: "push-in",
      sceneType: "feature",
    },
  };
}

function outroScene(
  title: string,
  subtitle: string | undefined,
  count: number,
): VideoGenerateScene {
  return {
    id: "outro",
    imageUrl: "",
    index: Math.max(count - 1, 0),
    reason: subtitle || "Ready to share as a polished product walkthrough.",
    direction: {
      callout: "pulse",
      calloutLabel: "Ready to share",
      headline: title || "Share the finished experience",
      motion: "hold",
      sceneType: "share",
    },
  };
}

function fallbackScene(title: string, subtitle?: string): VideoGenerateScene {
  return { ...introScene(title, subtitle), id: "fallback" };
}

function inferFallbackDirection(reason: string, index: number, total: number) {
  const text = reason.toLowerCase();
  const sceneType: SceneType = text.includes("share")
    ? "share"
    : text.includes("completed") || text.includes("ready") || index === total - 1
      ? "result"
      : text.includes("generate") || text.includes("option") || text.includes("button")
        ? "feature"
        : "workflow";

  return {
    callout: "pulse" as const,
    calloutLabel: sceneType === "share" ? "Shared" : sceneType === "result" ? "Result" : "Selected",
    headline: headlineFor(sceneType, index),
    motion: "push-in" as const,
    sceneType,
  };
}

function headlineFor(sceneType: SceneType, index: number) {
  if (sceneType === "share") return "Share the finished story";
  if (sceneType === "result") return "Show the finished experience";
  if (sceneType === "feature") return "Turn actions into momentum";
  return index === 0 ? "Open on the product moment" : "Guide the next step";
}

function shortHeadline(value: string, sceneType: SceneType, index: number) {
  const fallback = headlineFor(sceneType, index);
  const clean = value.trim().replace(/[.!?]+$/u, "");
  if (!clean) return fallback;
  return clean.split(/\s+/u).slice(0, 7).join(" ");
}

function shortBody(value: string) {
  const clean = value.trim().replace(/\s+/gu, " ");
  if (!clean) return "Mira turns the selected product moment into a clear, reviewable walkthrough.";
  const words = clean.split(" ").slice(0, 18).join(" ");
  return words.endsWith(".") ? words : `${words}.`;
}

function shortCta(value: string) {
  const clean = value
    .trim()
    .replace(/[-→>]+$/u, "")
    .replace(/\s+/gu, " ");
  if (!clean) return "Explore The Flow";
  return clean.split(" ").slice(0, 4).join(" ");
}

function selectBackground(urls: ReadonlyArray<string> | undefined, index: number) {
  if (!urls || urls.length === 0) return undefined;
  return urls[index % urls.length];
}

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const styles = {
  activeTab: {
    alignItems: "center",
    borderLeft: "1px solid rgba(255,255,255,0.1)",
    borderRight: "1px solid rgba(255,255,255,0.1)",
    color: "#f1eee8",
    display: "flex",
    fontSize: 24,
    gap: 34,
    height: "100%",
    padding: "0 30px",
  },
  close: { color: "#9b9790", fontSize: 32, lineHeight: 1 },
  copyBlock: {
    color: "#f4f1eb",
    left: 1325,
    position: "absolute",
    top: 442,
    width: 470,
  },
  copyBody: {
    color: "#a6a19a",
    fontFamily: "Inter, Arial, sans-serif",
    fontSize: 36,
    fontWeight: 500,
    letterSpacing: -1.2,
    lineHeight: 1.22,
    marginTop: 14,
  },
  copyCta: {
    color: "#5ea8ff",
    fontFamily: "Inter, Arial, sans-serif",
    fontSize: 26,
    fontWeight: 600,
    marginTop: 42,
  },
  copyHeadline: {
    color: "#f7f4ef",
    fontFamily: "Inter, Arial, sans-serif",
    fontSize: 48,
    fontWeight: 500,
    letterSpacing: -2.2,
    lineHeight: 1.08,
  },
  copyKicker: {
    color: "#5ea8ff",
    fontFamily: "Inter, Arial, sans-serif",
    fontSize: 17,
    fontWeight: 800,
    letterSpacing: 3,
    marginBottom: 18,
    textTransform: "uppercase",
  },
  dot: { background: "#54514b", borderRadius: 999, height: 14, width: 14 },
  dots: { display: "flex", gap: 13, left: 24, position: "absolute", top: 22 },
  editorBody: {
    background: "#12120f",
    bottom: 0,
    left: 0,
    overflow: "hidden",
    position: "absolute",
    right: 0,
    top: 110,
  },
  editorChrome: {
    background: "#11110e",
    borderBottom: "1px solid rgba(255,255,255,0.09)",
    height: 54,
    position: "relative",
  },
  editorTabs: {
    background: "#13130f",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    display: "flex",
    height: 56,
  },
  editorWindow: {
    background: "#11110e",
    borderRadius: 18,
    boxShadow: "0 40px 110px rgba(0,0,0,0.58)",
    height: 825,
    left: 150,
    overflow: "hidden",
    position: "absolute",
    top: 155,
    transformOrigin: "45% 52%",
    width: 1000,
  },
  emptyEditor: {
    background:
      "radial-gradient(circle at 50% 38%, rgba(94,168,255,0.12), transparent 32%), #090a0b",
    inset: 0,
    position: "absolute",
  },
  focusGlow: {
    background: "rgba(94,168,255,0.2)",
    borderRadius: 999,
    filter: "blur(28px)",
    height: 42,
    left: 90,
    position: "absolute",
    top: -18,
    width: 760,
  },
  focusLine: {
    background:
      "linear-gradient(90deg, transparent 0%, rgba(94,168,255,0.0) 10%, rgba(94,168,255,0.75) 50%, rgba(94,168,255,0.0) 90%, transparent 100%)",
    height: 3,
    left: 70,
    position: "absolute",
    top: 0,
    width: 800,
  },
  focusWrap: { height: 48, left: 0, position: "absolute", width: "100%" },
  inactiveTab: {
    alignItems: "center",
    borderRight: "1px solid rgba(255,255,255,0.1)",
    color: "#9c9890",
    display: "flex",
    fontSize: 24,
    height: "100%",
    padding: "0 28px",
  },
  paintFallback: {
    background:
      "linear-gradient(135deg, #d9c9aa 0%, #f0e6d0 45%, #b9c1b9 100%), radial-gradient(circle at 28% 22%, rgba(255,255,255,0.58), transparent 32%)",
    inset: 0,
    position: "absolute",
  },
  paintImage: {
    filter: "saturate(0.86) contrast(0.94) brightness(1.03)",
    height: "100%",
    objectFit: "cover",
    position: "absolute",
    width: "100%",
  },
  paintingPanel: {
    borderRadius: 4,
    height: 1000,
    left: 36,
    overflow: "hidden",
    position: "absolute",
    top: 36,
    width: 1240,
  },
  scene: { background: "#1b1814" },
  screenshot: {
    filter: "brightness(0.8) contrast(1.08) saturate(0.96)",
    height: "100%",
    inset: 0,
    objectFit: "cover",
    position: "absolute",
    width: "100%",
  },
  stage: { background: "#1b1814", color: "#f7f4ef", fontFamily: "Inter, Arial, sans-serif" },
  windowTitle: {
    color: "#a6a19a",
    fontFamily: "Inter, Arial, sans-serif",
    fontSize: 22,
    left: 0,
    lineHeight: "54px",
    position: "absolute",
    right: 0,
    textAlign: "center",
  },
} satisfies Record<string, CSSProperties>;
