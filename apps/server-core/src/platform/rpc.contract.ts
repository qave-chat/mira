import { HealthRpcs } from "../module/health/health.rpc.contract";
import { VideoGenerateRpcs } from "../module/video-generate/video-generate.rpc.contract";

export const ApiGroup = HealthRpcs.merge(VideoGenerateRpcs);

export * from "../module/health/health.rpc.contract";
export * from "../module/share/share.schema";
export * from "../module/video-generate/video-generate.rpc.contract";
