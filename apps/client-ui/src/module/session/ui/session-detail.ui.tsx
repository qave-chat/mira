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

export function SessionDetail() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <section
      data-slot="session-detail"
      className="relative h-full min-h-0 w-full overflow-hidden bg-card text-card-foreground"
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
    </section>
  );
}
