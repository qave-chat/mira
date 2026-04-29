import {
  Background,
  BackgroundVariant,
  type Edge,
  Handle,
  MiniMap,
  type Node,
  type NodeProps,
  Panel,
  type ReactFlowInstance,
  ReactFlow,
  MarkerType,
  Position,
  SelectionMode,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  AudioLinesIcon,
  HandIcon,
  MaximizeIcon,
  MinusIcon,
  MousePointer2Icon,
  PaperclipIcon,
  PlusIcon,
  SendIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SessionImagePreviewDialog } from "@/module/session/ui/session-image-preview-dialog.ui";
import { useTheme } from "@/shared/provider/theme.provider";
import { Button } from "@/shared/ui/button.ui";
import { cn } from "@/shared/util/cn.util";

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
  title: string;
  exploration: ReadonlyArray<{
    screenshot: string;
    screenshotUrl?: string;
    reason: string;
    position?: {
      x: number;
      y: number;
    };
  }>;
  links: ReadonlyArray<{
    from: string;
    to: string;
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
const PLAN_NODE_START_X = 120;
const PLAN_NODE_START_Y = 120;
const PLAN_NODE_GAP_X = 460;
const PLAN_NODE_STAGGER_Y = 48;
const PLAN_ROW_GAP_Y = 360;

type WelcomeNodeData = {
  label: string;
  description?: string;
  items?: ReadonlyArray<string>;
  screenshotUrl?: string;
  reason?: string;
  isEditing?: boolean;
  editOriginalText?: string;
  onEditChange?: (nodeId: string, text: string) => void;
  onEditCommit?: (nodeId: string, text: string) => void;
  onEditCancel?: (nodeId: string) => void;
};

type WelcomeNodeType = Node<WelcomeNodeData, "welcome">;
type PlaceholderNodeType = Node<WelcomeNodeData, "placeholder">;
type SessionNode = PlaceholderNodeType | WelcomeNodeType;
type CanvasMode = "navigate" | "select";

function WelcomeNode({ id, data, selected }: NodeProps<SessionNode>) {
  const { deleteElements } = useReactFlow<SessionNode, Edge>();
  const editableText = data.reason ?? data.description ?? data.label;

  function dismissCard(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    void deleteElements({ nodes: [{ id }] });
  }

  return (
    <div
      className={cn(
        "relative min-w-64 rounded-xl border border-neutral-300 bg-neutral-100 p-5 text-neutral-950 shadow-xl shadow-black/15 ring-1 ring-black/5 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50 dark:shadow-black/35 dark:ring-white/5",
        selected &&
          "border-primary ring-2 ring-primary/70 ring-offset-2 ring-offset-background dark:border-primary dark:ring-primary/80",
      )}
    >
      <Handle type="target" position={Position.Left} className="opacity-0" />
      <Handle type="source" position={Position.Right} className="opacity-0" />
      <div className="text-base font-semibold">{data.label}</div>
      {!data.isEditing && data.description ? (
        <p className="mt-2 max-w-72 text-sm leading-5 text-neutral-600 dark:text-neutral-300">
          {data.description}
        </p>
      ) : null}
      {!data.isEditing && data.items ? (
        <ul className="mt-3 max-w-72 space-y-1.5 text-sm leading-5 text-neutral-700 dark:text-neutral-200">
          {data.items.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-2 size-1 shrink-0 rounded-full bg-neutral-400 dark:bg-neutral-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {data.screenshotUrl ? (
        <img
          src={data.screenshotUrl}
          alt="Workflow step screenshot"
          className="mt-3 h-32 w-full rounded-lg border border-neutral-300 object-cover dark:border-neutral-700"
        />
      ) : null}
      {data.isEditing ? (
        <textarea
          autoFocus
          value={editableText}
          className="nodrag nowheel mt-3 min-h-24 w-72 resize-none rounded-lg border border-primary/40 bg-background p-3 text-sm leading-5 text-foreground outline-none ring-2 ring-primary/20"
          onChange={(event) => data.onEditChange?.(id, event.target.value)}
          onBlur={(event) => data.onEditCommit?.(id, event.currentTarget.value)}
          onPointerDown={(event) => event.stopPropagation()}
          onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.blur();
            }
            if (event.key === "Escape") {
              event.preventDefault();
              data.onEditCancel?.(id);
              event.currentTarget.blur();
            }
          }}
          onWheel={(event) => event.stopPropagation()}
        />
      ) : null}
      {!data.isEditing && data.reason ? (
        <p className="mt-3 max-w-72 text-sm leading-5">{data.reason}</p>
      ) : null}
      {!data.isEditing && data.items ? (
        <div className="mt-4 flex justify-end">
          <Button type="button" size="sm" onClick={dismissCard}>
            Okay
          </Button>
        </div>
      ) : null}
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
      description: "Turn a product workflow into a step-by-step demo plan.",
      items: [
        "Describe the workflow in the prompt.",
        "Attach screenshots for key UI states when helpful.",
        "Create a plan to generate linked steps on the canvas.",
        "Use the finished plan for demo video generation.",
      ],
      label: "Getting started",
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

type NodeContextMenuPosition = {
  nodeId: string;
  x: number;
  y: number;
};

type PlanHistorySnapshot = ReadonlyArray<Pick<GeneratedPlan, "id" | "exploration" | "links">>;

type PlanHistoryEntry = {
  before: PlanHistorySnapshot;
  after: PlanHistorySnapshot;
};

export type SessionDetailProps = {
  plan?: GeneratedPlan;
  plans?: ReadonlyArray<GeneratedPlan>;
  sessionId: string;
  onPlanCreated?: (planId: string) => void;
  onPlanUpdated?: (plan: Pick<GeneratedPlan, "id" | "exploration" | "links">) => Promise<void>;
};

export function SessionDetail({
  plan,
  plans = [],
  sessionId,
  onPlanCreated,
  onPlanUpdated,
}: SessionDetailProps) {
  const { resolvedTheme } = useTheme();
  const [nodes, setNodes, onNodesChange] = useNodesState<SessionNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);
  const [contextMenuPosition, setContextMenuPosition] = useState<ContextMenuPosition | null>(null);
  const [nodeContextMenuPosition, setNodeContextMenuPosition] =
    useState<NodeContextMenuPosition | null>(null);
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
  const [planPersistError, setPlanPersistError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isConnectingAsr, setIsConnectingAsr] = useState(false);
  const [asrError, setAsrError] = useState<string | null>(null);
  const [canvasMode, setCanvasMode] = useState<CanvasMode>("navigate");
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const realtimeDraftRef = useRef("");
  const realtimeDraftFlushRef = useRef<number | null>(null);
  const cancelledEditNodeIdsRef = useRef(new Set<string>());
  const plansRef = useRef(plans);
  const attachmentsRef = useRef(attachments);
  const optimisticPlansRef = useRef<ReadonlyArray<GeneratedPlan> | null>(null);
  const isNodeEditingRef = useRef(false);
  const undoHistoryRef = useRef<PlanHistoryEntry[]>([]);
  const redoHistoryRef = useRef<PlanHistoryEntry[]>([]);
  const displayedPrompt = realtimeDraft
    ? appendTranscript(workflowPrompt, realtimeDraft)
    : workflowPrompt;
  const isUploadingImages = pendingUploads.length > 0;
  const canGeneratePlan = displayedPrompt.trim().length > 0 || attachments.length > 0;

  useEffect(() => {
    if (optimisticPlansRef.current) {
      if (planSnapshotsMatch(plans, createPlanSnapshot(optimisticPlansRef.current))) {
        optimisticPlansRef.current = null;
        plansRef.current = plans;
        renderPlans(plans, attachments);
        return;
      }

      plansRef.current = mergePlansById(plans, optimisticPlansRef.current);
      renderPlans(plansRef.current, attachments);
      return;
    }

    plansRef.current = plans;
    if (plans.length > 0) {
      renderPlans(plans, attachments);
      return;
    }

    if (plan) {
      renderPlans([plan], attachments);
    }
  }, [plan?.id, plans]);

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  useEffect(() => {
    function handleUndoRedo(event: KeyboardEvent) {
      const target = event.target;
      if (isNodeEditingRef.current && isEditableTarget(target)) {
        return;
      }

      const usesModifier = event.metaKey || event.ctrlKey;
      if (!usesModifier || event.altKey) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === "z" && !event.shiftKey) {
        event.preventDefault();
        undoPlanHistory();
        return;
      }

      if ((key === "z" && event.shiftKey) || key === "y") {
        event.preventDefault();
        redoPlanHistory();
      }
    }

    document.addEventListener("keydown", handleUndoRedo, { capture: true });
    return () => document.removeEventListener("keydown", handleUndoRedo, { capture: true });
  }, []);

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
    setNodeContextMenuPosition(null);
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
    setNodeContextMenuPosition(null);
  }

  function openNodeContextMenu(event: React.MouseEvent, node: SessionNode) {
    event.preventDefault();
    event.stopPropagation();
    setContextMenuPosition(null);
    setNodeContextMenuPosition({ nodeId: node.id, x: event.clientX, y: event.clientY });
  }

  function deleteContextMenuNode() {
    if (!nodeContextMenuPosition) {
      return;
    }

    void reactFlowInstance?.deleteElements({ nodes: [{ id: nodeContextMenuPosition.nodeId }] });
    closeContextMenu();
  }

  function editContextMenuNode() {
    if (!nodeContextMenuPosition) {
      return;
    }

    editNode(nodeContextMenuPosition.nodeId);
    closeContextMenu();
  }

  function editNode(nodeId: string) {
    setNodes((currentNodes) =>
      currentNodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                editOriginalText: getEditableNodeText(node),
                isEditing: true,
              },
            }
          : node,
      ),
    );
    isNodeEditingRef.current = true;
  }

  function editDoubleClickedNode(event: React.MouseEvent, node: SessionNode) {
    event.preventDefault();
    event.stopPropagation();
    editNode(node.id);
    closeContextMenu();
  }

  function updateNodeText(nodeId: string, text: string) {
    setNodes((currentNodes) =>
      currentNodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                ...(node.data.reason !== undefined
                  ? { reason: text }
                  : node.data.description !== undefined
                    ? { description: text }
                    : { label: text }),
              },
            }
          : node,
      ),
    );
  }

  function commitNodeText(nodeId: string, text: string) {
    if (cancelledEditNodeIdsRef.current.has(nodeId)) {
      cancelledEditNodeIdsRef.current.delete(nodeId);
      return;
    }

    setNodes((currentNodes) =>
      currentNodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                editOriginalText: undefined,
                isEditing: false,
                ...(node.data.reason !== undefined
                  ? { reason: text }
                  : node.data.description !== undefined
                    ? { description: text }
                    : { label: text }),
              },
            }
          : node,
      ),
    );
    isNodeEditingRef.current = false;
    persistEditedNodeText(nodeId, text);
  }

  function cancelNodeTextEdit(nodeId: string) {
    cancelledEditNodeIdsRef.current.add(nodeId);
    isNodeEditingRef.current = false;
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        if (node.id !== nodeId) {
          return node;
        }

        const originalText = node.data.editOriginalText ?? getEditableNodeText(node);
        return {
          ...node,
          data: {
            ...node.data,
            editOriginalText: undefined,
            isEditing: false,
            ...(node.data.reason !== undefined
              ? { reason: originalText }
              : node.data.description !== undefined
                ? { description: originalText }
                : { label: originalText }),
          },
        };
      }),
    );
  }

  function addPlaceholderNode() {
    if (!contextMenuPosition) {
      return;
    }

    const newNode = {
      data: {
        label: "New plan node",
        onEditCancel: cancelNodeTextEdit,
        onEditChange: updateNodeText,
        onEditCommit: commitNodeText,
      },
      id: `placeholder-${crypto.randomUUID()}`,
      position: { x: contextMenuPosition.flowX, y: contextMenuPosition.flowY },
      type: "placeholder",
    } satisfies PlaceholderNodeType;

    setNodes((currentNodes) => [...currentNodes, newNode]);
    closeContextMenu();
  }

  function pushPlanHistory(before: PlanHistorySnapshot, after: PlanHistorySnapshot) {
    undoHistoryRef.current = [...undoHistoryRef.current, { before, after }];
    redoHistoryRef.current = [];
  }

  function undoPlanHistory() {
    const entry = undoHistoryRef.current.at(-1);
    if (!entry) {
      return;
    }

    undoHistoryRef.current = undoHistoryRef.current.slice(0, -1);
    redoHistoryRef.current = [...redoHistoryRef.current, entry];
    applyPlanSnapshot(entry.before, "Could not persist undo.");
  }

  function redoPlanHistory() {
    const entry = redoHistoryRef.current.at(-1);
    if (!entry) {
      return;
    }

    redoHistoryRef.current = redoHistoryRef.current.slice(0, -1);
    undoHistoryRef.current = [...undoHistoryRef.current, entry];
    applyPlanSnapshot(entry.after, "Could not persist redo.");
  }

  function applyPlanSnapshot(snapshot: PlanHistorySnapshot, errorMessage: string) {
    if (!onPlanUpdated) {
      return;
    }

    const nextPlans = mergePlanSnapshot(plansRef.current, snapshot);
    plansRef.current = nextPlans;
    optimisticPlansRef.current = nextPlans;
    renderPlans(nextPlans, attachmentsRef.current);
    setPlanPersistError(null);
    void persistPlanSnapshot(snapshot).catch((error: unknown) => {
      setPlanPersistError(error instanceof Error ? error.message : errorMessage);
      renderPlans(plansRef.current, attachmentsRef.current);
    });
  }

  async function persistPlanSnapshot(snapshot: PlanHistorySnapshot) {
    if (!onPlanUpdated) {
      return;
    }

    await Promise.all(snapshot.map((plan) => onPlanUpdated(plan)));
  }

  function persistDeletedNodes(deletedNodes: SessionNode[]) {
    if (!onPlanUpdated) {
      return;
    }

    const deletedStepIndexesByPlanId = new Map<string, Set<number>>();
    for (const node of deletedNodes) {
      const parsed = parsePlanStepNodeId(node.id);
      if (!parsed) {
        continue;
      }

      const deletedStepIndexes = deletedStepIndexesByPlanId.get(parsed.planId) ?? new Set<number>();
      deletedStepIndexes.add(parsed.stepIndex);
      deletedStepIndexesByPlanId.set(parsed.planId, deletedStepIndexes);
    }

    if (deletedStepIndexesByPlanId.size === 0) {
      return;
    }

    const before = createPlanSnapshot(plans);
    const updatedPlans = plans.map((currentPlan) => {
      const deletedStepIndexes = deletedStepIndexesByPlanId.get(currentPlan.id);
      if (!deletedStepIndexes) {
        return currentPlan;
      }

      const exploration = currentPlan.exploration.filter(
        (_, index) => !deletedStepIndexes.has(index),
      );
      return { ...currentPlan, exploration, links: createSequentialLinks(exploration.length) };
    });
    const after = createPlanSnapshot(updatedPlans);
    pushPlanHistory(before, after);
    plansRef.current = updatedPlans;
    optimisticPlansRef.current = updatedPlans;
    setPlanPersistError(null);
    for (const [planId, deletedStepIndexes] of deletedStepIndexesByPlanId) {
      const deletedPlan = plans.find((item) => item.id === planId);
      if (!deletedPlan) {
        continue;
      }

      const exploration = deletedPlan.exploration.filter(
        (_, index) => !deletedStepIndexes.has(index),
      );
      void onPlanUpdated({
        id: deletedPlan.id,
        exploration,
        links: createSequentialLinks(exploration.length),
      }).catch((error: unknown) => {
        setPlanPersistError(
          error instanceof Error ? error.message : "Could not persist deleted nodes.",
        );
        renderPlans(plans, attachments);
      });
    }
  }

  function persistEditedNodeText(nodeId: string, editedText: string) {
    if (!onPlanUpdated) {
      return;
    }

    const parsed = parsePlanStepNodeId(nodeId);
    if (!parsed) {
      return;
    }

    const currentPlans = plansRef.current;
    const editedPlan = currentPlans.find((item) => item.id === parsed.planId);
    const reason = editedText.trim();
    if (!editedPlan || !editedPlan.exploration[parsed.stepIndex]) {
      return;
    }

    const exploration = editedPlan.exploration.map((item, index) =>
      index === parsed.stepIndex ? { ...item, reason } : item,
    );
    const updatedPlan = { ...editedPlan, exploration, links: editedPlan.links };
    const updatedPlans = currentPlans.map((item) =>
      item.id === editedPlan.id ? updatedPlan : item,
    );

    pushPlanHistory(createPlanSnapshot(currentPlans), createPlanSnapshot(updatedPlans));
    plansRef.current = updatedPlans;
    optimisticPlansRef.current = updatedPlans;
    renderPlans(updatedPlans, attachmentsRef.current);
    setPlanPersistError(null);
    void onPlanUpdated({
      id: editedPlan.id,
      exploration,
      links: editedPlan.links,
    }).catch((error: unknown) => {
      setPlanPersistError(
        error instanceof Error ? error.message : "Could not persist edited node.",
      );
      renderPlans(plansRef.current, attachmentsRef.current);
    });
  }

  function persistNodePositions(_event: React.MouseEvent, draggedNode: SessionNode) {
    if (!onPlanUpdated) {
      return;
    }

    const parsed = parsePlanStepNodeId(draggedNode.id);
    if (!parsed) {
      return;
    }

    const currentPlans = plansRef.current;
    const movedPlan = currentPlans.find((item) => item.id === parsed.planId);
    if (!movedPlan || !movedPlan.exploration[parsed.stepIndex]) {
      return;
    }

    const planIndex = currentPlans.findIndex((item) => item.id === movedPlan.id);
    const nodePositionById = new Map(
      reactFlowInstance?.getNodes().map((node) => [node.id, node.position]) ?? [],
    );
    const exploration = movedPlan.exploration.map((item, index) => ({
      ...item,
      position:
        nodePositionById.get(getPlanStepNodeId(movedPlan.id, index)) ??
        item.position ??
        getDefaultPlanStepPosition(planIndex, index),
    }));
    const updatedPlan = { ...movedPlan, exploration, links: movedPlan.links };
    const updatedPlans = currentPlans.map((item) =>
      item.id === movedPlan.id ? updatedPlan : item,
    );

    pushPlanHistory(createPlanSnapshot(currentPlans), createPlanSnapshot(updatedPlans));
    plansRef.current = updatedPlans;
    optimisticPlansRef.current = updatedPlans;
    setPlanPersistError(null);
    void onPlanUpdated({
      id: updatedPlan.id,
      exploration: updatedPlan.exploration,
      links: updatedPlan.links,
    }).catch((error: unknown) => {
      setPlanPersistError(error instanceof Error ? error.message : "Could not persist moved node.");
      renderPlans(plansRef.current, attachmentsRef.current);
    });
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
      renderPlans(
        [result.plan, ...plans.filter((existingPlan) => existingPlan.id !== result.plan?.id)],
        attachments,
      );
      setWorkflowPrompt("");
      setRealtimeDraft("");
      setAttachments([]);
      realtimeDraftRef.current = "";
      onPlanCreated?.(result.plan.id);
    } catch (error) {
      setPlanError(error instanceof Error ? error.message : "Plan generation failed");
    } finally {
      setIsCreatingPlan(false);
    }
  }

  function renderPlans(
    renderedPlans: ReadonlyArray<GeneratedPlan>,
    currentAttachments: ReadonlyArray<WorkflowImageAttachment>,
  ) {
    const attachmentByKey = new Map(
      currentAttachments.map((attachment) => [attachment.key, attachment]),
    );
    const planNodes: SessionNode[] = renderedPlans.flatMap((renderedPlan, planIndex) =>
      renderedPlan.exploration.map((item, stepIndex) => ({
        id: getPlanStepNodeId(renderedPlan.id, stepIndex),
        type: "placeholder" as const,
        position: item.position ?? getDefaultPlanStepPosition(planIndex, stepIndex),
        data: {
          label: `Plan ${planIndex + 1} · Step ${stepIndex + 1}`,
          onEditCancel: cancelNodeTextEdit,
          onEditChange: updateNodeText,
          onEditCommit: commitNodeText,
          reason: item.reason,
          screenshotUrl: item.screenshotUrl ?? attachmentByKey.get(item.screenshot)?.url,
        },
      })),
    );
    const planNodeIds = new Set(planNodes.map((node) => node.id));
    const planEdges: Edge[] = renderedPlans.flatMap((renderedPlan) =>
      (renderedPlan.links.length > 0
        ? renderedPlan.links
        : createSequentialLinks(renderedPlan.exploration.length)
      ).flatMap((link, index) => {
        const source = getPersistedStepNodeId(renderedPlan.id, link.from);
        const target = getPersistedStepNodeId(renderedPlan.id, link.to);
        return planNodeIds.has(source) && planNodeIds.has(target)
          ? [
              {
                id: `plan-${renderedPlan.id}-edge-${index}`,
                source,
                target,
                markerEnd: { type: MarkerType.ArrowClosed },
                style: { stroke: "var(--foreground)", strokeWidth: 2 },
              },
            ]
          : [];
      }),
    );
    setNodes(planNodes);
    setEdges(planEdges);
  }

  return (
    <section
      data-slot="session-detail"
      data-canvas-mode={canvasMode}
      className="relative h-full min-h-0 w-full overflow-hidden bg-background text-card-foreground"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodesDelete={persistDeletedNodes}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        defaultViewport={{ x: 48, y: 48, zoom: 1 }}
        minZoom={0.2}
        maxZoom={2.5}
        panOnDrag={canvasMode === "navigate"}
        selectionOnDrag={canvasMode === "select"}
        selectionMode={SelectionMode.Partial}
        multiSelectionKeyCode={["Meta", "Shift"]}
        deleteKeyCode={["Backspace", "Delete"]}
        onPaneClick={closeContextMenu}
        onPaneContextMenu={openContextMenu}
        onNodeContextMenu={openNodeContextMenu}
        onNodeDoubleClick={editDoubleClickedNode}
        onNodeDragStop={persistNodePositions}
        zoomOnDoubleClick={false}
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
        <MiniMap
          pannable
          zoomable
          maskColor="rgba(255, 255, 255, 0.04)"
          maskStrokeColor="var(--border)"
          maskStrokeWidth={1}
        />
        <Panel position="top-left">
          <div className="flex overflow-hidden rounded-xl border border-border bg-background/95 p-1 shadow-lg shadow-black/10 ring-1 ring-foreground/10 backdrop-blur">
            <Button
              type="button"
              variant={canvasMode === "navigate" ? "secondary" : "ghost"}
              size="icon"
              aria-label="Navigate canvas"
              aria-pressed={canvasMode === "navigate"}
              onClick={() => setCanvasMode("navigate")}
            >
              <HandIcon />
            </Button>
            <Button
              type="button"
              variant={canvasMode === "select" ? "secondary" : "ghost"}
              size="icon"
              aria-label="Select nodes"
              aria-pressed={canvasMode === "select"}
              onClick={() => setCanvasMode("select")}
            >
              <MousePointer2Icon />
            </Button>
            <div className="mx-1 w-px bg-border" />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Zoom in"
              onClick={() => void reactFlowInstance?.zoomIn()}
            >
              <PlusIcon />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Zoom out"
              onClick={() => void reactFlowInstance?.zoomOut()}
            >
              <MinusIcon />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Fit view"
              onClick={() => reactFlowInstance?.fitView({ padding: 0.2 })}
            >
              <MaximizeIcon />
            </Button>
          </div>
        </Panel>
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
                : "Describe the product workflow you want to capture..."
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
        {planPersistError ? (
          <p className="mt-2 text-xs text-destructive">{planPersistError}</p>
        ) : null}
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
        </div>
      ) : null}

      {nodeContextMenuPosition ? (
        <div
          className="fixed z-50 min-w-44 overflow-hidden rounded-lg border border-border bg-popover p-1 text-sm text-popover-foreground shadow-lg"
          style={{ left: nodeContextMenuPosition.x, top: nodeContextMenuPosition.y }}
          onContextMenu={(event) => event.preventDefault()}
        >
          <button
            type="button"
            className="w-full rounded-md px-3 py-2 text-left hover:bg-muted"
            onClick={editContextMenuNode}
          >
            Edit
          </button>
          <button
            type="button"
            className="w-full rounded-md px-3 py-2 text-left text-destructive hover:bg-destructive/10"
            onClick={deleteContextMenuNode}
          >
            Delete
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

function createSequentialLinks(count: number) {
  return Array.from({ length: Math.max(0, count - 1) }, (_, index) => ({
    from: `step-${index + 1}`,
    to: `step-${index + 2}`,
  }));
}

function getPlanStepNodeId(planId: string, stepIndex: number) {
  return `${planId}-step-${stepIndex + 1}`;
}

function getPersistedStepNodeId(planId: string, stepId: string) {
  return `${planId}-${stepId}`;
}

function getDefaultPlanStepPosition(planIndex: number, stepIndex: number) {
  return {
    x: PLAN_NODE_START_X + stepIndex * PLAN_NODE_GAP_X,
    y: PLAN_NODE_START_Y + planIndex * PLAN_ROW_GAP_Y + (stepIndex % 2) * PLAN_NODE_STAGGER_Y,
  };
}

function parsePlanStepNodeId(nodeId: string) {
  const match = /^(.*)-step-(\d+)$/.exec(nodeId);
  if (!match) {
    return null;
  }

  return {
    planId: match[1],
    stepIndex: Number(match[2]) - 1,
  };
}

function getEditableNodeText(node: SessionNode) {
  return node.data.reason ?? node.data.description ?? node.data.label;
}

function createPlanSnapshot(plans: ReadonlyArray<GeneratedPlan>): PlanHistorySnapshot {
  return plans.map((plan) => ({
    id: plan.id,
    exploration: plan.exploration.map((item) => ({ ...item })),
    links: plan.links.map((link) => ({ ...link })),
  }));
}

function mergePlanSnapshot(
  plans: ReadonlyArray<GeneratedPlan>,
  snapshot: PlanHistorySnapshot,
): ReadonlyArray<GeneratedPlan> {
  const snapshotById = new Map(snapshot.map((plan) => [plan.id, plan]));
  return plans.map((plan) => {
    const snapshotPlan = snapshotById.get(plan.id);
    return snapshotPlan ? { ...plan, ...snapshotPlan } : plan;
  });
}

function mergePlansById(
  plans: ReadonlyArray<GeneratedPlan>,
  overrides: ReadonlyArray<GeneratedPlan>,
): ReadonlyArray<GeneratedPlan> {
  const overrideById = new Map(overrides.map((plan) => [plan.id, plan]));
  return plans.map((plan) => overrideById.get(plan.id) ?? plan);
}

function planSnapshotsMatch(plans: ReadonlyArray<GeneratedPlan>, snapshot: PlanHistorySnapshot) {
  const plansById = new Map(plans.map((plan) => [plan.id, plan]));
  return snapshot.every((snapshotPlan) => {
    const plan = plansById.get(snapshotPlan.id);
    return Boolean(
      plan &&
      plan.exploration.length === snapshotPlan.exploration.length &&
      plan.links.length === snapshotPlan.links.length &&
      plan.exploration.every((item, index) => {
        const snapshotItem = snapshotPlan.exploration[index];
        return (
          snapshotItem &&
          item.reason === snapshotItem.reason &&
          item.screenshot === snapshotItem.screenshot &&
          item.position?.x === snapshotItem.position?.x &&
          item.position?.y === snapshotItem.position?.y
        );
      }) &&
      plan.links.every((link, index) => {
        const snapshotLink = snapshotPlan.links[index];
        return snapshotLink && link.from === snapshotLink.from && link.to === snapshotLink.to;
      }),
    );
  });
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}

async function readUploadError(response: Response) {
  try {
    const body = (await response.json()) as { error?: unknown };
    return typeof body.error === "string" ? body.error : "Image upload failed";
  } catch {
    return "Image upload failed";
  }
}
