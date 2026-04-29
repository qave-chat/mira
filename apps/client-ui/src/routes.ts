import { rootRoute, route } from "@tanstack/virtual-file-routes";

export const routes = rootRoute("app.route.tsx", [
  route("/", "module/home/home.route.tsx"),
  route("/sessions", "module/session/session.route.tsx"),
  route("/sessions/$sessionId", "module/session/session-detail.route.tsx"),
  route("/login", "module/auth/auth.route.tsx"),
]);
