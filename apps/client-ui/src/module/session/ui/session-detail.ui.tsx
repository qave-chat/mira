import {
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  type NodeProps,
  type ReactFlowInstance,
  ReactFlow,
  MarkerType,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AudioLinesIcon, PaperclipIcon, SendIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SessionImagePreviewDialog } from "@/module/session/ui/session-image-preview-dialog.ui";
import { useTheme } from "@/shared/provider/theme.provider";
import { Button } from "@/shared/ui/button.ui";

type WorkflowImageAttachment = {
  id: string;
  key: string;
  name: string;
  size: number;
  url: string;
};

type PendingImageUpload = {
  id: string;
  name: string;
  previewUrl: string;
};

type UploadedImage = {
  key: string;
  name: string;
  size: number;
  type: string;
  url: string;
};

type UploadImagesResponse = {
  files: UploadedImage[];
};

type GeneratedPlan = {
  id: string;
  intent: string;
  exploration: Array<{
    screenshot: string;
    reason: string;
  }>;
};

type GeneratePlanResponse = {
  plan?: GeneratedPlan;
  error?: string;
};

type RealtimeSessionResponse = {
  client_secret?: {
    value?: string;
  };
  error?: string;
};

type RealtimeTranscriptionEvent = {
  delta?: string;
  transcript?: string;
  type?: string;
};

const OPENAI_REALTIME_MODEL = "gpt-4o-realtime-preview";
const REALTIME_DRAFT_FLUSH_MS = 40;

type WelcomeNodeData = {
  label: string;
  screenshotUrl?: string;
  reason?: string;
};

type WelcomeNodeType = Node<WelcomeNodeData, "welcome">;
type PlaceholderNodeType = Node<WelcomeNodeData, "placeholder">;
type SessionNode = PlaceholderNodeType | WelcomeNodeType;

function WelcomeNode({ id, data }: NodeProps<SessionNode>) {
  const { deleteElements } = useReactFlow<SessionNode, Edge>();

  function deleteNode(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    void deleteElements({ nodes: [{ id }] });
  }

  return (
    <div className="relative min-w-64 rounded-xl border border-neutral-300 bg-neutral-100 p-5 pr-12 text-neutral-950 shadow-xl shadow-black/15 ring-1 ring-black/5 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50 dark:shadow-black/35 dark:ring-white/5">
      <button
        type="button"
        aria-label="Delete welcome node"
        className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-200 hover:text-neutral-950 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-50"
        onClick={deleteNode}
      >
        x
      </button>
      <div className="text-base font-semibold">{data.label}</div>
      {data.screenshotUrl ? (
        <img
          src={data.screenshotUrl}
          alt="Workflow step screenshot"
          className="mt-3 h-32 w-full rounded-lg border border-neutral-300 object-cover dark:border-neutral-700"
        />
      ) : null}
      {data.reason ? <p className="mt-3 max-w-72 text-sm leading-5">{data.reason}</p> : null}
    </div>
  );
}

const nodeTypes = {
  placeholder: WelcomeNode,
  welcome: WelcomeNode,
};

const initialNodes: SessionNode[] = [
  {
    data: {
      label: "Welcome to the graph",
    },
    id: "welcome",
    position: { x: 120, y: 120 },
    type: "welcome",
  },
];

const initialEdges: Edge[] = [];

type ContextMenuPosition = {
  flowX: number;
  flowY: number;
  x: number;
  y: number;
};

export type SessionDetailProps = {
  sessionId: string;
  onPlanCreated?: (planId: string) => void;
};

export function SessionDetail({ sessionId, onPlanCreated }: SessionDetailProps) {
  const { resolvedTheme } = useTheme();
  const [nodes, setNodes, onNodesChange] = useNodesState<SessionNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);
  const [contextMenuPosition, setContextMenuPosition] = useState<ContextMenuPosition | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance<
    SessionNode,
    Edge
  > | null>(null);
  const [workflowPrompt, setWorkflowPrompt] = useState("");
  const [realtimeDraft, setRealtimeDraft] = useState("");
  const [attachments, setAttachments] = useState<WorkflowImageAttachment[]>([]);
  const [pendingUploads, setPendingUploads] = useState<PendingImageUpload[]>([]);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isConnectingAsr, setIsConnectingAsr] = useState(false);
  const [asrError, setAsrError] = useState<string | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const realtimeDraftRef = useRef("");
  const realtimeDraftFlushRef = useRef<number | null>(null);
  const displayedPrompt = realtimeDraft
    ? appendTranscript(workflowPrompt, realtimeDraft)
    : workflowPrompt;
  const isUploadingImages = pendingUploads.length > 0;
  const canGeneratePlan = displayedPrompt.trim().length > 0 || attachments.length > 0;

  useEffect(() => {
    return () => {
      stopRecording();
      if (realtimeDraftFlushRef.current !== null) {
        window.clearTimeout(realtimeDraftFlushRef.current);
      }
    };
  }, []);

  function openContextMenu(event: MouseEvent | React.MouseEvent) {
    event.preventDefault();
    const flowPosition = reactFlowInstance?.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    }) ?? { x: event.clientX, y: event.clientY };
    setContextMenuPosition({
      flowX: flowPosition.x,
      flowY: flowPosition.y,
      x: event.clientX,
      y: event.clientY,
    });
  }

  function closeContextMenu() {
    setContextMenuPosition(null);
  }

  function addPlaceholderNode() {
    if (!contextMenuPosition) {
      return;
    }

    const newNode = {
      data: { label: "New plan node" },
      id: `placeholder-${crypto.randomUUID()}`,
      position: { x: contextMenuPosition.flowX, y: contextMenuPosition.flowY },
      type: "placeholder",
    } satisfies PlaceholderNodeType;

    setNodes((currentNodes) => [...currentNodes, newNode]);
    closeContextMenu();
  }

  async function uploadImages(files: File[]) {
    if (files.length === 0) {
      return;
    }

    const pendingImages = files.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      previewUrl: URL.createObjectURL(file),
    }));

    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file);
    }

    setPendingUploads((current) => [...current, ...pendingImages]);
    setUploadError(null);
    try {
      const response = await fetch("/api/uploads/images", {
        body: formData,
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(await readUploadError(response));
      }
      const result = (await response.json()) as UploadImagesResponse;
      setAttachments((current) => [
        ...current,
        ...result.files.map((file) => ({
          id: crypto.randomUUID(),
          key: file.key,
          name: file.name,
          size: file.size,
          url: file.url,
        })),
      ]);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Image upload failed");
    } finally {
      setPendingUploads((current) =>
        current.filter((upload) => !pendingImages.some((pending) => pending.id === upload.id)),
      );
      for (const image of pendingImages) {
        URL.revokeObjectURL(image.previewUrl);
      }
    }
  }

  async function attachImages(event: React.ChangeEvent<HTMLInputElement>) {
    const files = getImageFiles(event.target.files ?? []);
    await uploadImages(files);
    event.target.value = "";
  }

  function pasteImages(event: React.ClipboardEvent<HTMLFormElement>) {
    const files = getImageFiles(event.clipboardData.files);
    if (files.length === 0) {
      return;
    }

    event.preventDefault();
    void uploadImages(files);
  }

  function removeAttachment(id: string) {
    setAttachments((current) => current.filter((attachment) => attachment.id !== id));
  }

  async function toggleRecording() {
    if (isRecording) {
      stopRecording();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof RTCPeerConnection === "undefined") {
      setAsrError("Voice input is not supported in this browser.");
      return;
    }

    setIsConnectingAsr(true);
    try {
      const ephemeralKey = await createRealtimeSession();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const peerConnection = new RTCPeerConnection();
      const dataChannel = peerConnection.createDataChannel("oai-events");

      stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));
      mediaStreamRef.current = stream;
      peerConnectionRef.current = peerConnection;
      dataChannelRef.current = dataChannel;

      dataChannel.onmessage = (event) => {
        void handleRealtimeEvent(event.data);
      };

      peerConnection.onconnectionstatechange = () => {
        if (peerConnection.connectionState === "failed") {
          setAsrError("Realtime voice connection failed. Try recording again.");
          stopRecording();
        }
      };

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      const answer = await fetch(
        `https://api.openai.com/v1/realtime?model=${encodeURIComponent(OPENAI_REALTIME_MODEL)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ephemeralKey}`,
            "Content-Type": "application/sdp",
          },
          body: offer.sdp,
        },
      );

      if (!answer.ok) {
        stopRecording();
        setAsrError("Could not connect to OpenAI Realtime ASR.");
        return;
      }

      await peerConnection.setRemoteDescription({ type: "answer", sdp: await answer.text() });
      setAsrError(null);
      setIsRecording(true);
    } catch {
      stopRecording();
      setAsrError("Could not start realtime voice input.");
    } finally {
      setIsConnectingAsr(false);
    }
  }

  function stopRecording() {
    flushRealtimeDraft();
    const draft = realtimeDraftRef.current.trim();
    if (draft.length > 0) {
      setWorkflowPrompt((current) => appendTranscript(current, draft));
      realtimeDraftRef.current = "";
      setRealtimeDraft("");
    }
    dataChannelRef.current?.close();
    peerConnectionRef.current?.close();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    dataChannelRef.current = null;
    peerConnectionRef.current = null;
    mediaStreamRef.current = null;
    setIsRecording(false);
  }

  async function handleRealtimeEvent(data: unknown) {
    const event = await parseRealtimeEvent(data);
    if (event.type === "conversation.item.input_audio_transcription.delta") {
      const delta = event.delta ?? "";
      if (delta.length > 0) {
        realtimeDraftRef.current = `${realtimeDraftRef.current}${delta}`;
        scheduleRealtimeDraftFlush();
      }
      return;
    }

    if (event.type !== "conversation.item.input_audio_transcription.completed") {
      return;
    }

    flushRealtimeDraft();
    const transcript = (event.transcript ?? realtimeDraftRef.current).trim();
    if (transcript.length > 0) {
      setWorkflowPrompt((current) => appendTranscript(current, transcript));
      realtimeDraftRef.current = "";
      setRealtimeDraft("");
    }
  }

  function scheduleRealtimeDraftFlush() {
    if (realtimeDraftFlushRef.current !== null) {
      return;
    }

    realtimeDraftFlushRef.current = window.setTimeout(() => {
      realtimeDraftFlushRef.current = null;
      setRealtimeDraft(realtimeDraftRef.current);
    }, REALTIME_DRAFT_FLUSH_MS);
  }

  function flushRealtimeDraft() {
    if (realtimeDraftFlushRef.current !== null) {
      window.clearTimeout(realtimeDraftFlushRef.current);
      realtimeDraftFlushRef.current = null;
    }
    setRealtimeDraft(realtimeDraftRef.current);
  }

  function generatePlan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void createPlan();
  }

  async function createPlan() {
    if (isUploadingImages) {
      setPlanError("Wait for image uploads to finish before creating a plan.");
      return;
    }

    const intent = displayedPrompt.trim();
    if (intent.length === 0 || attachments.length === 0) {
      setPlanError("Describe the workflow and attach at least one screenshot.");
      return;
    }

    const formData = new FormData();
    formData.append("sessionId", sessionId);
    formData.append("intent", intent);
    for (const attachment of attachments) {
      formData.append("screenshots", `${attachment.key}\t${attachment.url}`);
    }

    setIsCreatingPlan(true);
    setPlanError(null);
    try {
      const response = await fetch("/api/plans/generate", { method: "POST", body: formData });
      const result = (await response.json()) as GeneratePlanResponse;
      if (!response.ok || !result.plan) {
        throw new Error(result.error ?? "Plan generation failed");
      }
      renderPlan(result.plan, attachments);
      setWorkflowPrompt("");
      setRealtimeDraft("");
      realtimeDraftRef.current = "";
      onPlanCreated?.(result.plan.id);
    } catch (error) {
      setPlanError(error instanceof Error ? error.message : "Plan generation failed");
    } finally {
      setIsCreatingPlan(false);
    }
  }

  function renderPlan(
    plan: GeneratedPlan,
    currentAttachments: ReadonlyArray<WorkflowImageAttachment>,
  ) {
    const attachmentByKey = new Map(
      currentAttachments.map((attachment) => [attachment.key, attachment]),
    );
    const planNodes: SessionNode[] = plan.exploration.map((item, index) => ({
      id: `plan-${plan.id}-${index}`,
      type: "placeholder",
      position: { x: 120 + index * 360, y: 120 },
      data: {
        label: `Step ${index + 1}`,
        reason: item.reason,
        screenshotUrl: attachmentByKey.get(item.screenshot)?.url,
      },
    }));
    const planEdges: Edge[] = planNodes.slice(1).map((node, index) => ({
      id: `plan-${plan.id}-edge-${index}`,
      source: planNodes[index]?.id ?? "",
      target: node.id,
      markerEnd: { type: MarkerType.ArrowClosed },
    }));
    setNodes(planNodes);
    setEdges(planEdges);
  }

  return (
    <section
      data-slot="session-detail"
      className="relative h-full min-h-0 w-full overflow-hidden bg-background text-card-foreground"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        defaultViewport={{ x: 48, y: 48, zoom: 1 }}
        minZoom={0.2}
        maxZoom={2.5}
        panOnDrag
        onPaneClick={closeContextMenu}
        onPaneContextMenu={openContextMenu}
        zoomOnDoubleClick
        zoomOnPinch
        zoomOnScroll
        colorMode={resolvedTheme}
        className="[&_.react-flow__controls-button]:border-border [&_.react-flow__controls-button]:bg-card [&_.react-flow__controls-button]:fill-foreground [&_.react-flow__controls-button]:text-foreground [&_.react-flow__controls-button:hover]:bg-muted [&_.react-flow__controls-button_svg]:fill-current [&_.react-flow__controls-button_svg]:text-foreground [&_.react-flow__minimap]:border [&_.react-flow__minimap]:border-border/50 [&_.react-flow__minimap]:bg-card [&_.react-flow__minimap]:shadow-sm"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={3}
          color={resolvedTheme === "dark" ? "rgba(158, 180, 216, 0.55)" : "rgba(82, 82, 91, 0.28)"}
        />
        <Controls showInteractive position="bottom-left" />
        <MiniMap
          pannable
          zoomable
          maskColor="rgba(255, 255, 255, 0.04)"
          maskStrokeColor="var(--border)"
          maskStrokeWidth={1}
        />
      </ReactFlow>

      <form
        data-slot="session-workflow-composer"
        className="absolute inset-x-3 bottom-3 z-10 mx-auto max-w-3xl rounded-2xl border border-border bg-background/95 p-3 shadow-xl shadow-black/15 ring-1 ring-foreground/10 backdrop-blur sm:inset-x-6 sm:bottom-6"
        onPaste={pasteImages}
        onSubmit={generatePlan}
      >
        {attachments.length > 0 || pendingUploads.length > 0 ? (
          <ul
            data-slot="session-workflow-composer-attachments"
            className="mb-3 flex flex-wrap gap-2"
          >
            {pendingUploads.map((upload) => (
              <li key={upload.id}>
                <SessionImagePreviewDialog
                  src={upload.previewUrl}
                  alt="Uploading attachment preview"
                  isUploading
                />
              </li>
            ))}
            {attachments.map((attachment) => (
              <li key={attachment.id}>
                <SessionImagePreviewDialog
                  src={attachment.url}
                  alt={`${attachment.name} preview`}
                  onRemove={() => removeAttachment(attachment.id)}
                />
              </li>
            ))}
          </ul>
        ) : null}
        <label htmlFor="workflow-prompt" className="sr-only">
          Describe the workflow for the agent to plan
        </label>
        <textarea
          id="workflow-prompt"
          data-slot="session-workflow-composer-textarea"
          value={displayedPrompt}
          placeholder={
            isConnectingAsr
              ? "Connecting voice input..."
              : isRecording
                ? "Listening..."
                : "Describe what you want to create..."
          }
          className="min-h-14 w-full resize-none bg-transparent text-base leading-6 outline-none placeholder:text-muted-foreground"
          onChange={(event) => {
            setWorkflowPrompt(event.target.value);
            setRealtimeDraft("");
          }}
        />
        {isConnectingAsr ? (
          <p className="mt-2 text-xs text-muted-foreground">Connecting realtime ASR...</p>
        ) : null}
        {isUploadingImages ? (
          <p className="mt-2 text-xs text-muted-foreground">Uploading images...</p>
        ) : null}
        {uploadError ? <p className="mt-2 text-xs text-destructive">{uploadError}</p> : null}
        {isCreatingPlan ? (
          <p className="mt-2 text-xs text-muted-foreground">Creating plan...</p>
        ) : null}
        {planError ? <p className="mt-2 text-xs text-destructive">{planError}</p> : null}
        {asrError ? <p className="mt-2 text-xs text-destructive">{asrError}</p> : null}
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex shrink-0 items-center gap-2">
            <input
              id="workflow-image-upload"
              type="file"
              accept="image/*"
              multiple
              disabled={isUploadingImages}
              className="sr-only"
              onChange={attachImages}
            />
            <label
              htmlFor="workflow-image-upload"
              aria-label="Attach images"
              aria-disabled={isUploadingImages}
              className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-background text-sm font-medium transition-all outline-none select-none hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:pointer-events-none aria-disabled:opacity-50 dark:border-input dark:bg-input/30 dark:hover:bg-input/50 [&_svg]:size-4"
            >
              <PaperclipIcon />
            </label>
            <Button
              type="button"
              variant={isRecording ? "default" : "outline"}
              size="icon-lg"
              aria-label={isRecording ? "Stop voice input" : "Start voice input"}
              aria-pressed={isRecording}
              disabled={isConnectingAsr}
              className={
                isRecording ? "animate-pulse bg-[#d97452] text-white hover:bg-[#c96543]" : undefined
              }
              onClick={toggleRecording}
            >
              <AudioLinesIcon />
            </Button>
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={!canGeneratePlan || isCreatingPlan || isUploadingImages}
            className="bg-neutral-900 px-5 text-neutral-50 shadow-md shadow-black/20 hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-neutral-300"
          >
            <SendIcon />
            {isCreatingPlan ? "Creating..." : "Create plan"}
          </Button>
        </div>
      </form>

      {contextMenuPosition ? (
        <div
          className="fixed z-50 min-w-44 overflow-hidden rounded-lg border border-border bg-popover p-1 text-sm text-popover-foreground shadow-lg"
          style={{ left: contextMenuPosition.x, top: contextMenuPosition.y }}
          onContextMenu={(event) => event.preventDefault()}
        >
          <button
            type="button"
            className="w-full rounded-md px-3 py-2 text-left hover:bg-muted"
            onClick={addPlaceholderNode}
          >
            Add node
          </button>
          <button
            type="button"
            className="w-full rounded-md px-3 py-2 text-left text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={closeContextMenu}
          >
            Close menu
          </button>
        </div>
      ) : null}
    </section>
  );
}

async function createRealtimeSession() {
  const response = await fetch("/api/asr/realtime-session", { method: "POST" });
  const result = (await response.json()) as RealtimeSessionResponse;
  const key = result.client_secret?.value;
  if (!response.ok || !key) {
    throw new Error(result.error ?? "Realtime session failed");
  }

  return key;
}

async function parseRealtimeEvent(data: unknown): Promise<RealtimeTranscriptionEvent> {
  if (typeof data !== "string") {
    return {};
  }

  const parsed = (await new Response(data).json()) as unknown;
  if (typeof parsed !== "object" || parsed === null) {
    return {};
  }

  const record = parsed as Record<string, unknown>;
  return {
    type: typeof record.type === "string" ? record.type : undefined,
    delta: typeof record.delta === "string" ? record.delta : undefined,
    transcript: typeof record.transcript === "string" ? record.transcript : undefined,
  };
}

function appendTranscript(current: string, transcript: string) {
  const trimmed = current.trimEnd();
  if (trimmed.length === 0) {
    return transcript;
  }

  return `${trimmed} ${transcript}`;
}

function getImageFiles(files: Iterable<File>) {
  return Array.from(files).filter((file) => file.type.startsWith("image/"));
}

async function readUploadError(response: Response) {
  try {
    const body = (await response.json()) as { error?: unknown };
    return typeof body.error === "string" ? body.error : "Image upload failed";
  } catch {
    return "Image upload failed";
  }
}
