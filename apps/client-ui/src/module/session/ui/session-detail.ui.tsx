import { Button } from "@/shared/ui/button.ui";
import { Input } from "@/shared/ui/input.ui";
import { ModuleLayoutTitle } from "@/shared/ui/module-layout.ui";

export type SessionDetailProps = {
  sessionId: string;
  sourceUrl: string;
  generatedVideoUrl?: string;
  isGenerating: boolean;
  isSharing: boolean;
  error?: string | null;
  onSourceUrlChange: (value: string) => void;
  onGenerateVideo: () => void;
  onShare: () => void;
};

export function SessionDetail({
  sessionId,
  sourceUrl,
  generatedVideoUrl,
  isGenerating,
  isSharing,
  error,
  onSourceUrlChange,
  onGenerateVideo,
  onShare,
}: SessionDetailProps) {
  const hasGeneratedVideo = Boolean(generatedVideoUrl);

  return (
    <section
      data-slot="session-detail"
      className="space-y-6 rounded-lg border bg-card p-6 text-card-foreground shadow-sm"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <ModuleLayoutTitle className="text-lg">Session {sessionId}</ModuleLayoutTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            Session details will appear here once sessions are backed by data.
          </p>
        </div>
        {hasGeneratedVideo ? (
          <Button type="button" onClick={onShare} disabled={isSharing}>
            {isSharing ? "Sharing..." : "Share"}
          </Button>
        ) : null}
      </div>

      <div
        data-slot="session-video-generate"
        className="space-y-3 rounded-lg border bg-background p-4"
      >
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="session-source-url">
            Video URL
          </label>
          <Input
            id="session-source-url"
            value={sourceUrl}
            placeholder="https://example.com/video.mp4"
            onChange={(event) => onSourceUrlChange(event.currentTarget.value)}
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {!hasGeneratedVideo ? (
          <Button type="button" onClick={onGenerateVideo} disabled={isGenerating}>
            {isGenerating ? "Generating..." : "Generate video"}
          </Button>
        ) : null}
      </div>

      {generatedVideoUrl ? (
        <div
          data-slot="session-generated-video"
          className="overflow-hidden rounded-lg border bg-black"
        >
          <video className="aspect-video w-full" src={generatedVideoUrl} controls playsInline />
        </div>
      ) : null}
    </section>
  );
}
