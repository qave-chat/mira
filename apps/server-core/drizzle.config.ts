import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: ["./src/module/**/*.table.ts", "./src/platform/**/*.table.ts"],
  out: "./drizzle",
  schemaFilter: ["public"],
  dbCredentials: { url: process.env.DB_URL ?? "postgres://postgres:postgres@localhost:5432/agent" },
});
