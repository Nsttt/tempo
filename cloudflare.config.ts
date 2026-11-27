import { defineConfig } from "cf/config"

// An assets-only Worker: Vite's client build is the whole app.
export default defineConfig({
  worker: {
    name: "tempo",
    compatibilityDate: "2026-11-17",
    assets: { notFoundHandling: "single-page-application" },
    domains: ["tempo.nstlopez.com"],
    workersDev: false,
    observability: { enabled: true }
  }
})
