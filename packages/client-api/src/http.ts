import { FetchHttpClient } from "effect/unstable/http";

export { HttpApiDef } from "@mira/server-core/http";

export const httpClientLayer = FetchHttpClient.layer;
