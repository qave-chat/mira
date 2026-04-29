import { useEffect, useState } from "react";
import { useAtomRefresh, useAtomSet, useAtomValue } from "@effect/atom-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Cause, Exit } from "effect";
import { AsyncResult } from "effect/unstable/reactivity";
import type { Plan } from "@mira/server-core/rpc";
import { HttpClient } from "@mira/client-api/http-atom";
import { RpcClient } from "@mira/client-api/rpc-atom";
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
  const [videoExecutionId, setVideoExecutionId] = useState<string | undefined>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlanSelectorExpanded, setIsPlanSelectorExpanded] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | undefined>();
  const [videoError, setVideoError] = useState<string | null>(null);
  const startVideoGenerate = useAtomSet(RpcClient.mutation("VideoGenerateStart"), {
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
    setVideoError(null);
    const exit = await startVideoGenerate({
      payload: {
        prompt: selectedPlan.intent,
        photoKeys: selectedPlan.exploration.map((item) => item.screenshot),
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

  function shareVideo() {
    setVideoError("Sharing needs a persisted generated video id before it can be enabled.");
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
            isGenerating={isGenerating || videoStatus?.status === "running"}
            isSharing={false}
            canShare={false}
            error={videoError}
            onExpandedChange={setIsPlanSelectorExpanded}
            onPlanSelect={setSelectedPlanId}
            onGenerateVideo={generateVideo}
            onShare={shareVideo}
          />
        </ModuleLayoutActions>
      </ModuleLayoutHeader>
      <div className="min-h-0 w-full flex-1">
        <SessionDetail />
      </div>
    </ModuleLayout>
  );
}
