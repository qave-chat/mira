import {
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  type NodeProps,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/shared/ui/button.ui";
import { Input } from "@/shared/ui/input.ui";

type WelcomeNodeData = {
  label: string;
};

type WelcomeNodeType = Node<WelcomeNodeData, "welcome">;

function WelcomeNode({ id, data }: NodeProps<WelcomeNodeType>) {
  const { deleteElements } = useReactFlow();

  function deleteNode(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    void deleteElements({ nodes: [{ id }] });
  }

  return (
    <div className="relative min-w-64 rounded-xl border border-[#c9a96b] bg-[#f0e0bd] p-5 pr-12 text-[#141413] shadow-xl shadow-black/30 ring-2 ring-[#c9a96b]/40">
      <button
        type="button"
        aria-label="Delete welcome node"
        className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-md text-[#141413]/70 hover:bg-[#141413]/10 hover:text-[#141413]"
        onClick={deleteNode}
      >
        x
      </button>
      <div className="text-base font-semibold">{data.label}</div>
    </div>
  );
}

const nodeTypes = {
  welcome: WelcomeNode,
};

const initialNodes = [
  {
    data: {
      label: "Welcome to the graph",
    },
    id: "welcome",
    position: { x: 120, y: 120 },
    type: "welcome",
  },
] satisfies WelcomeNodeType[];

const initialEdges = [] satisfies Edge[];

export type SessionDetailProps = {
  sessionName: string;
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
  sessionName,
  sourceUrl,
  generatedVideoUrl,
  isGenerating,
  isSharing,
  error,
  onSourceUrlChange,
  onGenerateVideo,
  onShare,
}: SessionDetailProps) {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);
  const hasGeneratedVideo = Boolean(generatedVideoUrl);

  return (
    <section
      data-slot="session-detail"
      className="relative h-full min-h-0 w-full overflow-hidden bg-[#090909] text-card-foreground"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        defaultViewport={{ x: 48, y: 48, zoom: 1 }}
        minZoom={0.2}
        maxZoom={2.5}
        panOnDrag
        zoomOnDoubleClick
        zoomOnPinch
        zoomOnScroll
        className="[&_.react-flow__controls-button]:border-border [&_.react-flow__controls-button]:bg-card [&_.react-flow__controls-button]:fill-foreground [&_.react-flow__controls-button]:text-foreground [&_.react-flow__controls-button:hover]:bg-muted [&_.react-flow__minimap]:border [&_.react-flow__minimap]:border-border [&_.react-flow__minimap]:bg-card"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={3}
          color="rgba(158, 180, 216, 0.55)"
        />
        <Controls showInteractive position="bottom-left" />
        <MiniMap pannable zoomable />
      </ReactFlow>
      <aside
        data-slot="session-video-panel"
        className="pointer-events-auto absolute right-4 top-4 z-10 flex max-h-[calc(100%-2rem)] w-[min(24rem,calc(100%-2rem))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-background/90 shadow-2xl shadow-black/40 backdrop-blur-xl"
      >
        <div className="border-b border-border/70 p-5">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Video workflow
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">{sessionName}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Generate a video first. Sharing unlocks once there is a ready render.
          </p>
        </div>

        <div className="space-y-4 overflow-auto p-5">
          <div data-slot="session-video-state" className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="font-medium text-foreground">1. Source</p>
              <p className="mt-1 text-muted-foreground">Paste URL</p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="font-medium text-foreground">2. Render</p>
              <p className="mt-1 text-muted-foreground">Generate</p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="font-medium text-foreground">3. Share</p>
              <p className="mt-1 text-muted-foreground">Publish</p>
            </div>
          </div>

          <div data-slot="session-video-source" className="space-y-2">
            <label className="text-sm font-medium" htmlFor="session-source-url">
              Video URL
            </label>
            <Input
              id="session-source-url"
              value={sourceUrl}
              placeholder="https://example.com/video.mp4"
              disabled={isGenerating || hasGeneratedVideo}
              onChange={(event) => onSourceUrlChange(event.currentTarget.value)}
            />
          </div>

          {error ? (
            <p
              data-slot="session-video-error"
              className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}

          {generatedVideoUrl ? (
            <div
              data-slot="session-generated-video"
              className="overflow-hidden rounded-xl border bg-black"
            >
              <video className="aspect-video w-full" src={generatedVideoUrl} controls playsInline />
            </div>
          ) : (
            <div
              data-slot="session-generated-video-empty"
              className="rounded-xl border border-dashed bg-muted/20 p-6 text-sm text-muted-foreground"
            >
              No generated video yet. Generate a render to enable sharing.
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant={hasGeneratedVideo ? "secondary" : "default"}
              disabled={isGenerating || hasGeneratedVideo}
              onClick={onGenerateVideo}
            >
              {isGenerating ? "Generating..." : hasGeneratedVideo ? "Generated" : "Generate video"}
            </Button>
            <Button type="button" disabled={!hasGeneratedVideo || isSharing} onClick={onShare}>
              {isSharing ? "Sharing..." : "Share"}
            </Button>
          </div>
        </div>
      </aside>
    </section>
  );
}
