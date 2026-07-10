import { defineConfig } from "vite";

// Relative asset paths (base: "./") so the build is deployable under any
// subpath, e.g. apps.charliekrug.com/recon — see docs/VISION.md.
export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
  },
  test: {
    environment: "node",
    globals: true,
  },
});
