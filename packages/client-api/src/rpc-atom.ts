import { AtomRpc } from "effect/unstable/reactivity";
import { ApiGroup, rpcProtocolLayer } from "./rpc";

export class RpcClient extends AtomRpc.Service<RpcClient>()("client-api/RpcClient", {
  group: ApiGroup,
  protocol: rpcProtocolLayer("/api/rpc"),
}) {}
