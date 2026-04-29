import { HealthRpcs } from "../module/health/health.rpc.contract";
import { PlanRpcs } from "../module/plans/plans.rpc.contract";
import { VideoGenerateRpcs } from "../module/video-generate/video-generate.rpc.contract";

export const ApiGroup = HealthRpcs.merge(VideoGenerateRpcs).merge(PlanRpcs);

export * from "../module/health/health.rpc.contract";
export * from "../module/plans/plans.rpc.contract";
export * from "../module/plans/plans.schema";
export * from "../module/share/share.schema";
export * from "../module/video-generate/video-generate.rpc.contract";
