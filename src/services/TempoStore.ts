import { SavedState } from "#domain/Saved"
import { Context, Effect, Layer, type Option, type Schema } from "effect"
import { KeyValueStore } from "effect/persistence"

const STORAGE_KEY = "tempo/state/v1"

type StoreError = KeyValueStore.KeyValueStoreError | Schema.SchemaError

export class TempoStore extends Context.Service<TempoStore, {
  readonly load: Effect.Effect<Option.Option<SavedState>, StoreError>
  readonly save: (state: SavedState) => Effect.Effect<void, StoreError>
}>()("tempo/TempoStore") {
  static readonly layer = Layer.effect(
    TempoStore,
    Effect.gen(function*() {
      const store = KeyValueStore.toSchemaStore(
        yield* KeyValueStore.KeyValueStore,
        SavedState
      )
      return TempoStore.of({
        load: store.get(STORAGE_KEY),
        save: (state) => store.set(STORAGE_KEY, state)
      })
    })
  )
}
