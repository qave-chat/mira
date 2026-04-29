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
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AudioLinesIcon, PaperclipIcon, SendIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/shared/provider/theme.provider";
import { Button } from "@/shared/ui/button.ui";

type WorkflowImageAttachment = {
  id: string;
  name: string;
  size: number;
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

export function SessionDetail() {
  const { resolvedTheme } = useTheme();
  const [nodes, setNodes, onNodesChange] = useNodesState<SessionNode>(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState<Edge>(initialEdges);
  const [contextMenuPosition, setContextMenuPosition] = useState<ContextMenuPosition | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance<
    SessionNode,
    Edge
  > | null>(null);
  const [workflowPrompt, setWorkflowPrompt] = useState("");
  const [realtimeDraft, setRealtimeDraft] = useState("");
  const [attachments, setAttachments] = useState<WorkflowImageAttachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isConnectingAsr, setIsConnectingAsr] = useState(false);
  const [asrError, setAsrError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const realtimeDraftRef = useRef("");
  const realtimeDraftFlushRef = useRef<number | null>(null);
  const displayedPrompt = realtimeDraft
    ? appendTranscript(workflowPrompt, realtimeDraft)
    : workflowPrompt;
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

  function openImagePicker() {
    fileInputRef.current?.click();
  }

  function attachImages(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (files.length === 0) {
      return;
    }

    setAttachments((current) => [
      ...current,
      ...files.map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
      })),
    ]);
    event.target.value = "";
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
  }

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
          color="rgba(158, 180, 216, 0.55)"
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
        onSubmit={generatePlan}
      >
        {attachments.length > 0 ? (
          <ul
            data-slot="session-workflow-composer-attachments"
            className="mb-3 flex flex-wrap gap-2"
          >
            {attachments.map((attachment) => (
              <li
                key={attachment.id}
                className="flex max-w-full items-center gap-2 rounded-full border bg-muted/40 py-1 pr-2 pl-3 text-sm text-muted-foreground shadow-sm"
              >
                <span className="truncate">{attachment.name}</span>
                <button
                  type="button"
                  aria-label={`Remove ${attachment.name}`}
                  className="flex size-5 shrink-0 items-center justify-center rounded-full hover:bg-muted hover:text-foreground"
                  onClick={() => removeAttachment(attachment.id)}
                >
                  <XIcon className="size-3.5" />
                </button>
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
        {asrError ? <p className="mt-2 text-xs text-destructive">{asrError}</p> : null}
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex shrink-0 items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={attachImages}
            />
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              aria-label="Attach images"
              onClick={openImagePicker}
            >
              <PaperclipIcon />
            </Button>
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
            disabled={!canGeneratePlan}
            className="bg-[#d97452] px-5 text-white shadow-md shadow-[#d97452]/30 hover:bg-[#c96543]"
          >
            <SendIcon />
            Send
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
