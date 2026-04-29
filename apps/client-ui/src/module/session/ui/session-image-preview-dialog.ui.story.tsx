import type { Meta, StoryObj } from "@storybook/react";

import { SessionImagePreviewDialog } from "@/module/session/ui/session-image-preview-dialog.ui";

const sampleImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800'%3E%3Crect width='1200' height='800' fill='%23090909'/%3E%3Cg fill='%236b7a99'%3E%3Ccircle cx='120' cy='120' r='5'/%3E%3Ccircle cx='240' cy='120' r='5'/%3E%3Ccircle cx='360' cy='120' r='5'/%3E%3Ccircle cx='480' cy='120' r='5'/%3E%3Ccircle cx='600' cy='120' r='5'/%3E%3Ccircle cx='720' cy='120' r='5'/%3E%3Ccircle cx='840' cy='120' r='5'/%3E%3Ccircle cx='960' cy='120' r='5'/%3E%3Ccircle cx='1080' cy='120' r='5'/%3E%3C/g%3E%3Crect x='345' y='285' width='510' height='170' rx='24' fill='%23f0e0bd' stroke='%23c9a96b' stroke-width='6'/%3E%3Ctext x='405' y='385' fill='%23141413' font-family='Georgia, serif' font-size='44' font-weight='700'%3EWelcome to the graph%3C/text%3E%3C/svg%3E";

const meta: Meta<typeof SessionImagePreviewDialog> = {
  title: "Session/SessionImagePreviewDialog",
  component: SessionImagePreviewDialog,
  args: {
    alt: "Workflow screenshot",
    src: sampleImage,
  },
  decorators: [
    (Story) => (
      <div className="bg-background p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof SessionImagePreviewDialog>;

export const Uploaded: Story = {};

export const Uploading: Story = {
  args: {
    isUploading: true,
  },
};

export const Removable: Story = {
  args: {
    onRemove: () => undefined,
  },
};
