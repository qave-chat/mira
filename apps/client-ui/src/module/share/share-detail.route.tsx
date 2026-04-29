import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import type { ShareWithComments } from "@mira/server-core/rpc";
import { getShare, createShareComment } from "@/module/share/share.api";
import { ShareDetail } from "@/module/share/ui/share-detail.ui";

export const Route = createFileRoute("/share/$shareId")({
  component: ShareDetailRoute,
});

function ShareDetailRoute() {
  const { shareId } = Route.useParams();
  const [result, setResult] = useState<ShareWithComments | null>(null);
  const [authorName, setAuthorName] = useState("");
  const [body, setBody] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    getShare(shareId)
      .then((nextResult) => {
        if (!cancelled) {
          setResult(nextResult);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError("This share could not be loaded.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [shareId]);

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const comment = await createShareComment({ shareId, authorName, body });
      setResult((current) => current && { ...current, comments: [comment, ...current.comments] });
      setAuthorName("");
      setBody("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Comment could not be posted.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="grid min-h-svh place-items-center bg-background text-muted-foreground">
        Loading share...
      </main>
    );
  }

  if (!result) {
    return (
      <main className="grid min-h-svh place-items-center bg-background text-muted-foreground">
        {error ?? "Share not found."}
      </main>
    );
  }

  return (
    <ShareDetail
      share={result.share}
      comments={result.comments}
      authorName={authorName}
      body={body}
      isSubmitting={isSubmitting}
      error={error}
      onAuthorNameChange={setAuthorName}
      onBodyChange={setBody}
      onCommentSubmit={submitComment}
    />
  );
}
