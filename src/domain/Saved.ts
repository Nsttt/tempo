import { Effect, Schema } from "effect"
import { Task } from "./Task.ts"

/** One finished focus session, as the focus log draws it. */
export const FocusSession = Schema.Struct({
  endedAt: Schema.Number,
  minutes: Schema.Number,
  taskId: Schema.NullOr(Schema.String)
})
export type FocusSession = typeof FocusSession.Type

/** Sessions older than this many are dropped; the log only draws two weeks. */
export const MAX_SESSIONS = 600

/** What Tempo keeps between visits. The running clock is deliberately not saved. */
export const SavedState = Schema.Struct({
  tasks: Schema.Array(Task),
  activeTaskId: Schema.NullOr(Schema.String),
  nextTaskId: Schema.Number,
  completedFocus: Schema.Number,
  focusMinutes: Schema.Number,
  // Added after the first release: state saved before then decodes with an empty log.
  sessions: Schema.Array(FocusSession).pipe(Schema.withDecodingDefaultKey(Effect.succeed([])))
})
export type SavedState = typeof SavedState.Type

export const empty: SavedState = {
  tasks: [],
  activeTaskId: null,
  nextTaskId: 1,
  completedFocus: 0,
  focusMinutes: 0,
  sessions: []
}
