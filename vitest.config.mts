import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    projects: [
      {
        extends: true,
        test: { name: "node", include: ["**/*.test.ts"], environment: "node" },
      },
      {
        extends: true,
        test: { name: "dom", include: ["**/*.test.tsx"], environment: "jsdom" },
      },
    ],
  },
})
