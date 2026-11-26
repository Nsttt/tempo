import { Schema } from "effect"

export const Phase = Schema.Literals(["Focus", "ShortBreak", "LongBreak"])
export type Phase = typeof Phase.Type

export const PHASES: ReadonlyArray<Phase> = Phase.literals

export const PHASE_MINUTES: Record<Phase, number> = {
  Focus: 25,
  ShortBreak: 5,
  LongBreak: 15
}

export const PHASE_LABEL: Record<Phase, string> = {
  Focus: "Focus",
  ShortBreak: "Short break",
  LongBreak: "Long break"
}

/** Every fourth finished focus session earns a long break. */
export const LONG_BREAK_EVERY = 4

export const durationMs = (phase: Phase): number => PHASE_MINUTES[phase] * 60_000

/**
 * The phase that follows a finished one. `completedFocus` counts finished
 * focus sessions including the one that just ended.
 */
export const nextPhase = (finished: Phase, completedFocus: number): Phase =>
  finished !== "Focus"
    ? "Focus"
    : completedFocus > 0 && completedFocus % LONG_BREAK_EVERY === 0
    ? "LongBreak"
    : "ShortBreak"

/** Sessions left until the next long break, counting the current one. */
export const untilLongBreak = (completedFocus: number): number =>
  LONG_BREAK_EVERY - (completedFocus % LONG_BREAK_EVERY)

/** `mm:ss`, rounding up so the clock shows 00:00 only once time is up. */
export const formatClock = (ms: number): string => {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

export const formatMinutes = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return hours === 0 ? `${rest}m` : rest === 0 ? `${hours}h` : `${hours}h ${rest}m`
}
