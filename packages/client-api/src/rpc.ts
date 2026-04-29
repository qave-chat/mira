import { Layer } from "effect";
import { FetchHttpClient } from "effect/unstable/http";
import { RpcClient, RpcSerialization } from "effect/unstable/rpc";

export { ApiGroup } from "@mira/server-core/rpc";

export const rpcProtocolLayer = (url: string = "/api/rpc") =>
  RpcClient.layerProtocolHttp({ url }).pipe(
    Layer.provide(RpcSerialization.layerNdjson),
    Layer.provide(FetchHttpClient.layer),
  );
