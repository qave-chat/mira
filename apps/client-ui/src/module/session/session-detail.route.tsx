import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { GeneratedVideo } from "@mira/server-core/rpc";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/ui/breadcrumb.ui";
import { SessionDetail } from "@/module/session/ui/session-detail.ui";
import { createGeneratedVideo, createShare } from "@/module/share/share.api";
import { ModuleLayout, ModuleLayoutBody, ModuleLayoutHeader } from "@/shared/ui/module-layout.ui";

export const Route = createFileRoute("/sessions/$sessionId")({
  component: SessionDetailRoute,
});

function SessionDetailRoute() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const [sourceUrl, setSourceUrl] = useState("");
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateVideo() {
    setIsGenerating(true);
    setError(null);
    try {
      const nextGeneratedVideo = await createGeneratedVideo(sourceUrl);
      setGeneratedVideo(nextGeneratedVideo);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Video could not be generated.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function shareSession() {
    if (!generatedVideo) return;
    setIsSharing(true);
    setError(null);
    try {
      const share = await createShare(generatedVideo.id);
      void navigate({ to: "/share/$shareId", params: { shareId: share.id } });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Share could not be created.");
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
              <BreadcrumbPage>{sessionId}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </ModuleLayoutHeader>
      <ModuleLayoutBody>
        <SessionDetail
          sessionId={sessionId}
          sourceUrl={sourceUrl}
          generatedVideoUrl={generatedVideo?.videoUrl}
          isGenerating={isGenerating}
          isSharing={isSharing}
          error={error}
          onSourceUrlChange={setSourceUrl}
          onGenerateVideo={generateVideo}
          onShare={shareSession}
        />
      </ModuleLayoutBody>
    </ModuleLayout>
  );
}
