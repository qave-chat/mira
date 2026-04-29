import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import type { Plan } from "@mira/server-core/rpc";
import { Button } from "@/shared/ui/button.ui";
import { cn } from "@/shared/util/cn.util";

export type PlanSelectorProps = {
  plans: ReadonlyArray<Plan>;
  selectedPlanId?: string;
  isExpanded: boolean;
  sessionName: string;
  generatedVideoUrl?: string;
  isGenerating: boolean;
  isSharing: boolean;
  canShare: boolean;
  error?: string | null;
  onExpandedChange: (isExpanded: boolean) => void;
  onPlanSelect: (planId: string) => void;
  onGenerateVideo: () => void;
  onShare: () => void;
};

export function PlanSelector({
  plans,
  selectedPlanId,
  isExpanded,
  sessionName,
  generatedVideoUrl,
  isGenerating,
  isSharing,
  canShare,
  error,
  onExpandedChange,
  onPlanSelect,
  onGenerateVideo,
  onShare,
}: PlanSelectorProps) {
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? plans[0];
  const selectedLabel = selectedPlan ? formatPlanLabel(selectedPlan) : "No plans";
  const hasGeneratedVideo = Boolean(generatedVideoUrl);

  return (
    <div data-slot="plan-selector" className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 min-w-36 justify-between border-border/70 bg-background/80 text-foreground shadow-sm"
        aria-expanded={isExpanded}
        onClick={() => onExpandedChange(!isExpanded)}
      >
        <span className="min-w-0 truncate text-left">
          <span className="text-muted-foreground">Plan</span> {selectedLabel}
        </span>
        {isExpanded ? (
          <ChevronUpIcon data-icon="inline-end" />
        ) : (
          <ChevronDownIcon data-icon="inline-end" />
        )}
      </Button>

      {isExpanded ? (
        <div
          data-slot="plan-selector-panel"
          className="absolute right-0 top-10 z-50 w-[min(32rem,calc(100vw-2rem))] overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-2xl shadow-black/30"
        >
          <div className="border-b px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Plan
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">{sessionName}</h2>
            {selectedPlan ? (
              <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">
                {selectedPlan.intent}
              </p>
            ) : (
              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                Create or select a plan to drive the render workflow.
              </p>
            )}
          </div>

          <div className="max-h-[calc(100vh-9rem)] space-y-4 overflow-auto p-4">
            {plans.length > 0 ? (
              <div data-slot="plan-selector-list" className="grid gap-2 sm:grid-cols-2">
                {plans.map((plan) => {
                  const isSelected = plan.id === selectedPlan?.id;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      data-slot="plan-selector-option"
                      data-selected={isSelected ? "true" : undefined}
                      className={cn(
                        "rounded-lg border border-transparent px-3 py-2.5 text-left transition-colors hover:bg-muted/70",
                        isSelected && "border-primary/30 bg-primary/10",
                      )}
                      onClick={() => onPlanSelect(plan.id)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-medium">{formatPlanLabel(plan)}</p>
                        <span className="shrink-0 text-[0.7rem] text-muted-foreground">
                          {plan.exploration.length} refs
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                        {plan.intent}
                      </p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed bg-muted/20 px-3 py-6 text-center text-sm text-muted-foreground">
                Plans will appear here after exploration.
              </p>
            )}

            <div data-slot="session-video-workflow" className="space-y-4 border-t pt-4">
              {error ? (
                <p
                  data-slot="session-video-error"
                  className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
                >
                  {error}
                </p>
              ) : null}

              {generatedVideoUrl ? (
                <div
                  data-slot="session-generated-video"
                  className="overflow-hidden rounded-xl border bg-black"
                >
                  <video
                    className="aspect-video w-full"
                    src={generatedVideoUrl}
                    controls
                    playsInline
                  />
                </div>
              ) : (
                <div
                  data-slot="session-generated-video-empty"
                  className="rounded-xl border border-dashed bg-muted/20 p-6 text-sm text-muted-foreground"
                >
                  {isGenerating
                    ? "Generating video..."
                    : selectedPlan
                      ? "Generate a video from this plan."
                      : "Select a plan before generating video."}
                </div>
              )}

              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant={hasGeneratedVideo ? "secondary" : "default"}
                  disabled={isGenerating || hasGeneratedVideo || !selectedPlan}
                  onClick={onGenerateVideo}
                >
                  {isGenerating
                    ? "Generating..."
                    : hasGeneratedVideo
                      ? "Generated"
                      : "Generate video"}
                </Button>
                <Button type="button" disabled={!canShare || isSharing} onClick={onShare}>
                  {isSharing ? "Sharing..." : "Share"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatPlanLabel(plan: Plan) {
  const createdAt = new Date(plan.createdAt);
  return createdAt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
