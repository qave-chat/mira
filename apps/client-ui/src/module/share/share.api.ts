import type { GeneratedVideo, ShareComment, ShareWithComments } from "@mira/server-core/rpc";

const jsonHeaders = { "content-type": "application/json" } as const;

async function readJson<A>(response: Response): Promise<A> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Request failed");
  }
  return (await response.json()) as A;
}

export async function createGeneratedVideo(sourceUrl: string) {
  const response = await fetch("/api/http/generated-videos", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ sourceUrl }),
  });
  return readJson<GeneratedVideo>(response);
}

export async function createShare(generatedVideoId: string) {
  const response = await fetch("/api/http/shares", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ generatedVideoId }),
  });
  return readJson<ShareWithComments["share"]>(response);
}

export async function getShare(shareId: string) {
  const response = await fetch(`/api/http/shares/${encodeURIComponent(shareId)}`);
  return readJson<ShareWithComments>(response);
}

export async function createShareComment(input: {
  shareId: string;
  authorName: string;
  body: string;
}) {
  const response = await fetch(`/api/http/shares/${encodeURIComponent(input.shareId)}/comments`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ authorName: input.authorName, body: input.body }),
  });
  return readJson<ShareComment>(response);
}
