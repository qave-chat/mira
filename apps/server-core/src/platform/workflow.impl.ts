import { Layer } from "effect";
import { ClusterWorkflowEngine } from "effect/unstable/cluster";
import { SingleRunnerLive } from "./cluster.impl";

// provideMerge (not provide) so the cluster's Sharding service leaks out
// alongside WorkflowEngine. ClusterCron / Singleton layers built elsewhere
// need Sharding to enrol their jobs in the cluster.
export const WorkflowEngineLive = ClusterWorkflowEngine.layer.pipe(
  Layer.provideMerge(SingleRunnerLive),
);
