import type { Meta, StoryObj } from "@storybook/react";
import { ShareDetail } from "./share-detail.ui";

const meta: Meta<typeof ShareDetail> = {
  title: "Share/ShareDetail",
  component: ShareDetail,
  args: {
    share: {
      id: "share-1042",
      generatedVideoId: "generated-video-1042",
      sourceUrl: "https://example.com/product-launch.mp4",
      videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
      status: "ready",
      createdAt: 1_777_000_000_000,
    },
    sessionName: "Create a short product walkthrough video",
    comments: [
      {
        id: "comment-1",
        shareId: "share-1042",
        authorName: "Riley",
        body: "This is crisp. The opening shot works especially well.",
        createdAt: 1_777_000_000_000,
      },
    ],
    authorName: "",
    body: "",
    isSubmitting: false,
    onAuthorNameChange: () => {},
    onBodyChange: () => {},
    onCommentSubmit: (event) => event.preventDefault(),
  },
};

export default meta;

type Story = StoryObj<typeof ShareDetail>;

export const Default: Story = {};

export const Empty: Story = { args: { comments: [] } };
