import { useState } from "react";
import { useAtomValue } from "@effect/atom-react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AsyncResult } from "effect/unstable/reactivity";
import { HttpClient } from "@mira/client-api/http-atom";
import type { GeneratedVideo } from "@mira/server-core/rpc";
import { SessionDetail } from "@/module/session/ui/session-detail.ui";
import { createGeneratedVideo, createShare } from "@/module/share/share.api";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/ui/breadcrumb.ui";
import { ModuleLayout, ModuleLayoutHeader } from "@/shared/ui/module-layout.ui";

export const Route = createFileRoute("/sessions/$sessionId")({
  validateSearch: (search): { name?: string } => ({
    name: typeof search.name === "string" && search.name.length > 0 ? search.name : undefined,
  }),
  component: SessionDetailRoute,
});

function SessionDetailRoute() {
  const { sessionId } = Route.useParams();
  const { name } = Route.useSearch();
  const navigate = useNavigate();
  const [sourceUrl, setSourceUrl] = useState("");
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const sessionResult = useAtomValue(
    HttpClient.query("sessions", "get", {
      params: { id: sessionId },
      reactivityKeys: ["sessions", sessionId],
    }),
  );
  const sessionName = AsyncResult.match(sessionResult, {
    onInitial: () => name,
    onSuccess: (result) => result.value.name,
    onFailure: () => name,
  });

  async function generateVideo() {
    setIsGenerating(true);
    setVideoError(null);
    try {
      const nextGeneratedVideo = await createGeneratedVideo(sourceUrl);
      setGeneratedVideo(nextGeneratedVideo);
    } catch (cause) {
      setVideoError(cause instanceof Error ? cause.message : "Video could not be generated.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function shareVideo() {
    if (!generatedVideo) return;
    setIsSharing(true);
    setVideoError(null);
    try {
      const share = await createShare(generatedVideo.id);
      void navigate({ to: "/share/$shareId", params: { shareId: share.id } });
    } catch (cause) {
      setVideoError(cause instanceof Error ? cause.message : "Share could not be created.");
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <ModuleLayout>
      <ModuleLayoutHeader>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/sessions" />}>Sessions</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{sessionName ?? sessionId}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </ModuleLayoutHeader>
      <div className="min-h-0 w-full flex-1">
        <SessionDetail
          sessionName={sessionName ?? sessionId}
          sourceUrl={sourceUrl}
          generatedVideoUrl={generatedVideo?.videoUrl}
          isGenerating={isGenerating}
          isSharing={isSharing}
          error={videoError}
          onSourceUrlChange={setSourceUrl}
          onGenerateVideo={generateVideo}
          onShare={shareVideo}
        />
      </div>
    </ModuleLayout>
  );
}
