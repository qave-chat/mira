import { useEffect, useState } from "react";
import { useAtomRefresh, useAtomSet, useAtomValue } from "@effect/atom-react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Cause, Exit } from "effect";
import { AsyncResult } from "effect/unstable/reactivity";
import type { Plan } from "@mira/server-core/rpc";
import { HttpClient } from "@mira/client-api/http-atom";
import { RpcClient } from "@mira/client-api/rpc-atom";
import { createGeneratedVideo, createShare } from "@/module/share/share.api";
import { PlanSelector } from "@/module/session/ui/plan-selector.ui";
import { SessionDetail } from "@/module/session/ui/session-detail.ui";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/ui/breadcrumb.ui";
import {
  ModuleLayout,
  ModuleLayoutActions,
  ModuleLayoutHeader,
} from "@/shared/ui/module-layout.ui";

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
  const [videoExecutionId, setVideoExecutionId] = useState<string | undefined>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [generatedVideoId, setGeneratedVideoId] = useState<string | undefined>();
  const [shareId, setShareId] = useState<string | undefined>();
  const [isPlanSelectorExpanded, setIsPlanSelectorExpanded] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | undefined>();
  const [videoError, setVideoError] = useState<string | null>(null);
  const startVideoGenerate = useAtomSet(RpcClient.mutation("VideoGenerateStart"), {
    mode: "promiseExit",
  });
  const updatePlan = useAtomSet(RpcClient.mutation("PlanUpdate"), {
    mode: "promiseExit",
  });
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
  const plansResult = useAtomValue(
    RpcClient.query("PlanList", { sessionId }, { reactivityKeys: ["plans", sessionId] }),
  );
  const refreshPlans = useAtomRefresh(
    RpcClient.query("PlanList", { sessionId }, { reactivityKeys: ["plans", sessionId] }),
  );
  const plans = AsyncResult.match(plansResult, {
    onInitial: () => [] satisfies ReadonlyArray<Plan>,
    onSuccess: (result) => result.value,
    onFailure: () => [] satisfies ReadonlyArray<Plan>,
  });
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? plans[0];
  const videoStatusAtom = RpcClient.query("VideoGenerateGet", {
    executionId: videoExecutionId ?? "idle",
  });
  const videoStatusResult = useAtomValue(videoStatusAtom);
  const refreshVideoStatus = useAtomRefresh(videoStatusAtom);
  const videoStatus = videoExecutionId
    ? AsyncResult.match(videoStatusResult, {
        onInitial: () => undefined,
        onSuccess: (result) => result.value,
        onFailure: () => undefined,
      })
    : undefined;
  const generatedVideoUrl =
    videoStatus?.status === "succeeded" ? videoStatus.result.videoUrl : undefined;

  useEffect(() => {
    if (!selectedPlanId && plans[0]) {
      setSelectedPlanId(plans[0].id);
    }
  }, [plans, selectedPlanId]);

  useEffect(() => {
    if (!videoExecutionId || videoStatus?.status !== "running") {
      return;
    }

    const interval = window.setInterval(refreshVideoStatus, 2_000);
    return () => window.clearInterval(interval);
  }, [refreshVideoStatus, videoExecutionId, videoStatus?.status]);

  useEffect(() => {
    if (videoStatus?.status === "failed") {
      setVideoError(videoStatus.error);
      setIsGenerating(false);
    }
    if (videoStatus?.status === "succeeded") {
      setIsGenerating(false);
    }
  }, [videoStatus]);

  async function generateVideo() {
    if (!selectedPlan) {
      setVideoError("Select a plan before generating video.");
      return;
    }

    setIsGenerating(true);
    setGeneratedVideoId(undefined);
    setShareId(undefined);
    setVideoError(null);
    const exit = await startVideoGenerate({
      payload: {
        prompt: selectedPlan.intent,
        scenes: createVideoScenes(selectedPlan),
      },
    });
    if (Exit.isFailure(exit)) {
      setVideoError(Cause.pretty(exit.cause));
      setIsGenerating(false);
      return;
    }
    setVideoExecutionId(exit.value.executionId);
    refreshVideoStatus();
  }

  async function shareVideo() {
    if (!generatedVideoUrl) {
      setVideoError("Generate a video before sharing.");
      return;
    }

    setIsSharing(true);
    setVideoError(null);
    try {
      const generatedVideo = generatedVideoId
        ? { id: generatedVideoId }
        : await createGeneratedVideo(generatedVideoUrl);
      setGeneratedVideoId(generatedVideo.id);
      const share = shareId ? { id: shareId } : await createShare(generatedVideo.id);
      setShareId(share.id);
      await navigate({ to: "/share/$shareId", params: { shareId: share.id } });
    } catch (error) {
      setVideoError(error instanceof Error ? error.message : "Share could not be created.");
    } finally {
      setIsSharing(false);
    }
  }

  function handlePlanCreated(planId: string) {
    setSelectedPlanId(planId);
    refreshPlans();
  }

  async function handlePlanUpdated(input: Pick<Plan, "id" | "exploration" | "links">) {
    const exit = await updatePlan({ payload: input });
    if (Exit.isFailure(exit)) {
      throw new Error(Cause.pretty(exit.cause));
    }
    refreshPlans();
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
        <ModuleLayoutActions>
          <PlanSelector
            plans={plans}
            selectedPlanId={selectedPlanId}
            isExpanded={isPlanSelectorExpanded}
            sessionName={sessionName ?? sessionId}
            generatedVideoUrl={generatedVideoUrl}
            videoProgress={videoStatus?.progress}
            videoMessage={videoStatus?.message}
            isGenerating={isGenerating || videoStatus?.status === "running"}
            isSharing={isSharing}
            canShare={Boolean(generatedVideoUrl)}
            error={videoError}
            onExpandedChange={setIsPlanSelectorExpanded}
            onPlanSelect={setSelectedPlanId}
            onGenerateVideo={generateVideo}
            onShare={shareVideo}
          />
        </ModuleLayoutActions>
      </ModuleLayoutHeader>
      <div className="min-h-0 w-full flex-1">
        <SessionDetail
          plan={selectedPlan}
          plans={plans}
          sessionId={sessionId}
          onPlanCreated={handlePlanCreated}
          onPlanUpdated={handlePlanUpdated}
        />
      </div>
    </ModuleLayout>
  );
}

function createVideoScenes(plan: Plan) {
  type VideoScene = { readonly id: string; readonly screenshot: string; readonly reason: string };
  const scenes: VideoScene[] = plan.exploration.map((item, index) => ({
    id: `step-${index + 1}`,
    screenshot: item.screenshot,
    reason: item.reason,
  }));
  if (plan.links.length === 0) {
    return scenes;
  }

  const sceneById = new Map(scenes.map((scene) => [scene.id, scene]));
  const targets = new Set(plan.links.map((link) => link.to));
  const start = scenes.find((scene) => !targets.has(scene.id)) ?? scenes[0];
  if (!start) {
    return scenes;
  }

  const ordered: VideoScene[] = [];
  const visited = new Set<string>();
  let current: VideoScene | undefined = start;
  while (current && !visited.has(current.id)) {
    const currentScene: VideoScene = current;
    ordered.push(currentScene);
    visited.add(currentScene.id);
    const nextId: string | undefined = plan.links.find((link) => link.from === currentScene.id)?.to;
    current = nextId ? sceneById.get(nextId) : undefined;
  }

  return ordered.length === scenes.length ? ordered : scenes;
}
