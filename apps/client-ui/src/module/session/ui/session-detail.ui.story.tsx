import type { Meta, StoryObj } from "@storybook/react";

import { SessionDetail } from "@/module/session/ui/session-detail.ui";

const meta: Meta<typeof SessionDetail> = {
  title: "Module/Session/SessionDetail",
  component: SessionDetail,
  args: {
    sessionId: "session-1042",
    sourceUrl: "https://example.com/video.mp4",
    generatedVideoUrl: undefined,
    isGenerating: false,
    isSharing: false,
    error: null,
    onSourceUrlChange: () => {},
    onGenerateVideo: () => {},
    onShare: () => {},
  },
  decorators: [
    (Story) => (
      <div className="min-h-svh bg-background p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof SessionDetail>;

export const Default: Story = {};

export const ReadyToShare: Story = {
  args: {
    generatedVideoUrl: "https://example.com/video.mp4",
  },
};
