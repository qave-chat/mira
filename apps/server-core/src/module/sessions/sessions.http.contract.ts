import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";
import { Schema } from "effect";
import { Session, SessionCreatePayload } from "./sessions.schema";

export class SessionsHttpGroup extends HttpApiGroup.make("sessions")
  .add(HttpApiEndpoint.get("list", "/sessions", { success: Schema.Array(Session) }))
  .add(
    HttpApiEndpoint.get("get", "/sessions/:id", {
      params: { id: Schema.String },
      success: Session,
    }),
  )
  .add(
    HttpApiEndpoint.post("create", "/sessions", {
      payload: SessionCreatePayload,
      success: Session,
    }),
  )
  .add(
    HttpApiEndpoint.delete("delete", "/sessions/:id", {
      params: { id: Schema.String },
      success: Schema.Void,
    }),
  ) {}
