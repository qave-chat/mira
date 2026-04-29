import { type ComponentProps, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import type { Plan } from "@mira/server-core/rpc";
import { PlanSelector } from "./plan-selector.ui";

const plans: ReadonlyArray<Plan> = [
  {
    id: "pla_381nfd6tRUkJ61kxHLfCsp4YjX8",
    sessionId: "ses_381nfd6tRUkJ61kxHLfCsp4YjX8",
    userId: "usr_test",
    exploration: [
      { screenshot: "s3://mira/source.png", reason: "Hero frame has the clearest product moment" },
      { screenshot: "s3://mira/detail.png", reason: "Close-up supports a benefits callout" },
    ],
    intent:
      "Create a concise launch walkthrough that highlights the source, render, and share flow.",
    createdAt: Date.UTC(2026, 3, 29, 12, 0, 0),
    updatedAt: Date.UTC(2026, 3, 29, 12, 0, 0),
  },
  {
    id: "pla_381nfd6tRUkJ61kxHLfCsp4YjX9",
    sessionId: "ses_381nfd6tRUkJ61kxHLfCsp4YjX8",
    userId: "usr_test",
    exploration: [{ screenshot: "s3://mira/alt.png", reason: "Better pacing for social edits" }],
    intent: "Make a short social teaser focused on speed and final output quality.",
    createdAt: Date.UTC(2026, 3, 28, 17, 30, 0),
    updatedAt: Date.UTC(2026, 3, 28, 17, 30, 0),
  },
];

const meta: Meta<typeof PlanSelector> = {
  title: "Module/Session/PlanSelector",
  component: PlanSelector,
  args: {
    plans,
    selectedPlanId: plans[0]?.id,
    sessionName: "Launch walkthrough",
    generatedVideoUrl: undefined,
    videoProgress: undefined,
    videoMessage: undefined,
    isGenerating: false,
    isSharing: false,
    canShare: false,
    error: null,
    onGenerateVideo: () => {},
    onShare: () => {},
  },
  decorators: [
    (Story) => (
      <div className="flex min-h-80 justify-end bg-background p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof PlanSelector>;

export const Collapsed: Story = {
  render: (args) => <ControlledPlanSelector {...args} defaultExpanded={false} />,
};

export const Expanded: Story = {
  render: (args) => <ControlledPlanSelector {...args} defaultExpanded />,
};

export const Empty: Story = {
  args: { plans: [], selectedPlanId: undefined },
  render: (args) => <ControlledPlanSelector {...args} defaultExpanded />,
};

export const ReadyToShare: Story = {
  args: { generatedVideoUrl: "https://example.com/video.mp4", canShare: true },
  render: (args) => <ControlledPlanSelector {...args} defaultExpanded />,
};

export const Generating: Story = {
  args: { isGenerating: true, videoProgress: 35, videoMessage: "Rendering video" },
  render: (args) => <ControlledPlanSelector {...args} defaultExpanded />,
};

export const WithError: Story = {
  args: { error: "A valid http(s) URL is required" },
  render: (args) => <ControlledPlanSelector {...args} defaultExpanded />,
};

function ControlledPlanSelector({
  defaultExpanded = false,
  ...props
}: Omit<ComponentProps<typeof PlanSelector>, "isExpanded" | "onExpandedChange" | "onPlanSelect"> & {
  defaultExpanded?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [selectedPlanId, setSelectedPlanId] = useState(props.selectedPlanId);

  return (
    <PlanSelector
      {...props}
      selectedPlanId={selectedPlanId}
      isExpanded={isExpanded}
      onExpandedChange={setIsExpanded}
      onPlanSelect={setSelectedPlanId}
    />
  );
}
