import type { FormEvent } from "react";
import type { Share, ShareComment } from "@mira/server-core/rpc";
import { Button } from "@/shared/ui/button.ui";
import { Input } from "@/shared/ui/input.ui";

export type ShareDetailProps = {
  share: Share;
  comments: ReadonlyArray<ShareComment>;
  authorName: string;
  body: string;
  isSubmitting: boolean;
  error?: string | null;
  onAuthorNameChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onCommentSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function ShareDetail({
  share,
  comments,
  authorName,
  body,
  isSubmitting,
  error,
  onAuthorNameChange,
  onBodyChange,
  onCommentSubmit,
}: ShareDetailProps) {
  return (
    <main data-slot="share-detail" className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <section
          data-slot="share-video-panel"
          className="overflow-hidden rounded-2xl border bg-card shadow-sm"
        >
          <div className="bg-black">
            <video
              data-slot="share-video"
              className="aspect-video w-full"
              src={share.videoUrl}
              controls
              playsInline
            />
          </div>
          <div className="space-y-2 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Shared video
            </p>
            <h1 className="break-words text-2xl font-semibold tracking-tight">{share.sourceUrl}</h1>
          </div>
        </section>

        <section data-slot="share-comments" className="grid gap-4 lg:grid-cols-[1fr_22rem]">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Comments</h2>
            {comments.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                No comments yet. Be the first to respond.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {comments.map((comment) => (
                  <article
                    key={comment.id}
                    data-slot="share-comment"
                    className="rounded-xl border bg-background p-4"
                  >
                    <p className="font-medium">{comment.authorName}</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                      {comment.body}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>

          <form
            data-slot="share-comment-form"
            className="rounded-2xl border bg-card p-5 shadow-sm"
            onSubmit={onCommentSubmit}
          >
            <h2 className="text-lg font-semibold">Leave a comment</h2>
            <label className="mt-4 block text-sm font-medium" htmlFor="share-comment-name">
              Name
            </label>
            <Input
              id="share-comment-name"
              className="mt-2"
              value={authorName}
              maxLength={80}
              onChange={(event) => onAuthorNameChange(event.currentTarget.value)}
            />
            <label className="mt-4 block text-sm font-medium" htmlFor="share-comment-body">
              Comment
            </label>
            <textarea
              id="share-comment-body"
              data-slot="share-comment-textarea"
              className="mt-2 min-h-32 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              value={body}
              maxLength={2000}
              onChange={(event) => onBodyChange(event.currentTarget.value)}
            />
            {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
            <Button className="mt-4 w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Posting..." : "Post comment"}
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}
