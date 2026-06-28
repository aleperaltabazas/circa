import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { json5Plugin } from "./plugins/json5";

export default defineConfig({
  plugins: [react(), json5Plugin()],
  base: "/circa/",
});
