import { AtomHttpApi } from "effect/unstable/reactivity";
import { HttpApiDef, httpClientLayer } from "./http";

export class HttpClient extends AtomHttpApi.Service<HttpClient>()("client-api/HttpClient", {
  api: HttpApiDef,
  httpClient: httpClientLayer,
}) {}
