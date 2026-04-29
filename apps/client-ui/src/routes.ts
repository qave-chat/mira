import { rootRoute, route } from "@tanstack/virtual-file-routes";

export const routes = rootRoute("app.route.tsx", [
  route("/", "module/home/home.route.tsx"),
  route("/company", "module/company/company.route.tsx"),
  route("/company/$companyId", "module/company/company-detail.route.tsx"),
  route("/login", "module/auth/auth.route.tsx"),
]);
