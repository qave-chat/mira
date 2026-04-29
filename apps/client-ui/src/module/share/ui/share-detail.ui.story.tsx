import { type ComponentProps, type FormEvent, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import type { Share, ShareComment } from "@mira/server-core/rpc";
import { ShareDetail } from "./share-detail.ui";

const baseShare: Share = {
  id: "shr_381nfd6tRUkJ61kxHLfCsp4YjX8",
  generatedVideoId: "vid_381nfd6tRUkJ61kxHLfCsp4YjX8",
  sourceUrl: "https://example.com/product-launch.mp4",
  videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  status: "ready",
  createdAt: Date.UTC(2026, 3, 29, 12, 0, 0),
};

const baseComments: ReadonlyArray<ShareComment> = [
  {
    id: "com_381nfd6tRUkJ61kxHLfCsp4YjX8",
    shareId: baseShare.id,
    authorName: "Riley",
    body: "This is crisp. The opening shot works especially well.",
    createdAt: Date.UTC(2026, 3, 29, 13, 12, 0),
  },
];

const manyComments: ReadonlyArray<ShareComment> = [
  ...baseComments,
  {
    id: "com_381nfg8RNlsgzmVzPvEe1CQ1oFy",
    shareId: baseShare.id,
    authorName: "Morgan",
    body: "The middle section could use one more beat on the pricing screen before the transition.",
    createdAt: Date.UTC(2026, 3, 29, 14, 4, 0),
  },
  {
    id: "com_381nfjY0Hu96QGYzU9UhB9Yu7DP",
    shareId: baseShare.id,
    authorName: "Sam",
    body: "Love the pacing. This feels ready for the landing page hero.",
    createdAt: Date.UTC(2026, 3, 29, 14, 18, 0),
  },
  {
    id: "com_381nflVSeNXQwrx2dS1R7qaVw2B",
    shareId: baseShare.id,
    authorName: "Taylor",
    body: "Can we end on the dashboard instead of the upload screen? It would make the payoff clearer.",
    createdAt: Date.UTC(2026, 3, 29, 15, 42, 0),
  },
];

const longComment: ShareComment = {
  id: "com_381nfmf2LUZTWVdxRudLfbCZbqo",
  shareId: baseShare.id,
  authorName: "Alexandra Montgomery-Wells",
  body: "The story is landing, especially when the camera settles on the finished output.\n\nOne thing I would test: cut the intro by about two seconds and use that time to linger on the final CTA. The value prop is clearest when viewers see the before and after in one continuous motion.",
  createdAt: Date.UTC(2026, 3, 29, 16, 30, 0),
};

const defaultArgs = {
  share: baseShare,
  sessionName: "Create a short product walkthrough video",
  comments: baseComments,
  authorName: "",
  body: "",
  isSubmitting: false,
  error: null,
  onAuthorNameChange: () => {},
  onBodyChange: () => {},
  onCommentSubmit: (event: FormEvent<HTMLFormElement>) => event.preventDefault(),
} satisfies ComponentProps<typeof ShareDetail>;

const meta: Meta<typeof ShareDetail> = {
  title: "Module/Share/ShareDetail",
  component: ShareDetail,
  args: defaultArgs,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

type Story = StoryObj<typeof ShareDetail>;

export const Default: Story = {};

export const Empty: Story = { args: { comments: [] } };

export const ManyComments: Story = { args: { comments: manyComments } };

export const LongComment: Story = { args: { comments: [longComment, ...baseComments] } };

export const LongTitle: Story = {
  args: {
    sessionName:
      "Create a short product walkthrough video for the redesigned onboarding and billing handoff",
  },
};

export const FilledForm: Story = {
  args: {
    authorName: "Jordan",
    body: "Could we add one caption callout near the final screen?",
  },
};

export const Submitting: Story = {
  args: {
    authorName: "Jordan",
    body: "Could we add one caption callout near the final screen?",
    isSubmitting: true,
  },
};

export const WithError: Story = {
  args: {
    authorName: "Jordan",
    body: "",
    error: "Comment is required",
  },
};

export const Mobile: Story = {
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-sm overflow-hidden border-x">
        <Story />
      </div>
    ),
  ],
};

export const Interactive: Story = {
  render: (args) => <ControlledShareDetail {...args} />,
};

function ControlledShareDetail(props: ComponentProps<typeof ShareDetail>) {
  const [comments, setComments] = useState(props.comments);
  const [authorName, setAuthorName] = useState(props.authorName);
  const [body, setBody] = useState(props.body);

  function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextAuthorName = authorName.trim();
    const nextBody = body.trim();
    if (nextAuthorName.length === 0 || nextBody.length === 0) {
      return;
    }
    setComments((current) => [
      {
        id: `com_story_${current.length + 1}`,
        shareId: props.share.id,
        authorName: nextAuthorName,
        body: nextBody,
        createdAt: Date.now(),
      },
      ...current,
    ]);
    setAuthorName("");
    setBody("");
  }

  return (
    <ShareDetail
      {...props}
      comments={comments}
      authorName={authorName}
      body={body}
      onAuthorNameChange={setAuthorName}
      onBodyChange={setBody}
      onCommentSubmit={submitComment}
    />
  );
}
