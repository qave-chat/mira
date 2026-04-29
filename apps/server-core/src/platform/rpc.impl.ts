import { RpcServer } from "effect/unstable/rpc";
import { ApiGroup } from "./rpc.contract";

export const RpcLive = RpcServer.layerHttp({
  group: ApiGroup,
  path: "/api/rpc",
  protocol: "http",
});
