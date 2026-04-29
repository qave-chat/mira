import type { FormEvent } from "react";
import type { Share, ShareComment } from "@mira/server-core/rpc";
import { Button } from "@/shared/ui/button.ui";
import { Input } from "@/shared/ui/input.ui";

export type ShareDetailProps = {
  share: Share;
  sessionName?: string;
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
  sessionName = "Mira",
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
    <main
      data-slot="share-detail"
      className="min-h-svh bg-[radial-gradient(circle_at_top_left,rgba(148,163,184,0.18),transparent_30rem),#070707] text-foreground"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-5 sm:px-6 lg:px-8">
        <header data-slot="share-public-header" className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl border bg-background/80 text-lg font-semibold shadow-sm">
              *
            </div>
            <div>
              <p className="font-semibold leading-none">{sessionName}</p>
              <p className="mt-1 text-xs text-muted-foreground">Public share</p>
            </div>
          </div>
          <p className="hidden rounded-full border bg-background/60 px-3 py-1 text-xs text-muted-foreground sm:block">
            Shared video
          </p>
        </header>

        <section
          data-slot="share-video-panel"
          className="overflow-hidden rounded-[2rem] border border-white/10 bg-card/90 shadow-2xl shadow-black/30"
        >
          <div className="bg-black">
            <video
              data-slot="share-video"
              className="aspect-video w-full max-h-[72svh]"
              src={share.videoUrl}
              controls
              playsInline
            />
          </div>
          <div className="border-t border-white/10 p-5 sm:p-6">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{sessionName}</h1>
          </div>
        </section>

        <section data-slot="share-comments" className="grid gap-4 lg:grid-cols-[1fr_24rem]">
          <div className="rounded-[1.5rem] border border-white/10 bg-card/90 p-5 shadow-xl shadow-black/20 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">Comments</h2>
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                {comments.length}
              </span>
            </div>
            {comments.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                No comments yet. Be the first to respond.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {comments.map((comment) => (
                  <article
                    key={comment.id}
                    data-slot="share-comment"
                    className="rounded-2xl border bg-background/70 p-4"
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
            className="rounded-[1.5rem] border border-white/10 bg-card/90 p-5 shadow-xl shadow-black/20 sm:p-6"
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
