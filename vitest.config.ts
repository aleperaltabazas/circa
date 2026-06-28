import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { json5Plugin } from "./plugins/json5";

export default defineConfig({
  plugins: [react(), json5Plugin()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    passWithNoTests: true,
  },
});
