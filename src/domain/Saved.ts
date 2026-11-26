import { Schema } from "effect"
import { Task } from "./Task.ts"

/** What Tempo keeps between visits. The running clock is deliberately not saved. */
export const SavedState = Schema.Struct({
  tasks: Schema.Array(Task),
  activeTaskId: Schema.NullOr(Schema.String),
  nextTaskId: Schema.Number,
  completedFocus: Schema.Number,
  focusMinutes: Schema.Number
})
export type SavedState = typeof SavedState.Type

export const empty: SavedState = {
  tasks: [],
  activeTaskId: null,
  nextTaskId: 1,
  completedFocus: 0,
  focusMinutes: 0
}
