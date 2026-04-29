import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    TanStackRouterVite({
      virtualRouteConfig: "./src/routes.ts",
      routesDirectory: "./src",
      generatedRouteTree: "./src/routeTree.gen.ts",
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 47823,
    allowedHosts: [".localhost"],
    proxy: {
      "/api": "http://localhost:38412",
    },
  },
});
