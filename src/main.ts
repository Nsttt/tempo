import { BrowserHost } from "@effect/ui/html"
import { Effect, Layer } from "effect"
import { KeyValueStore } from "effect/persistence"
import { App, appProps } from "./App.ts"
import { Chime } from "./services/Chime.ts"
import { TempoStore } from "./services/TempoStore.ts"

const Main = BrowserHost.mount(App, appProps, document.getElementById("root")!).pipe(
  Layer.provide([
    TempoStore.layer.pipe(Layer.provide(KeyValueStore.layerStorage(() => localStorage))),
    Chime.layerWebAudio
  ])
)

Layer.launch(Main).pipe(Effect.runFork)
