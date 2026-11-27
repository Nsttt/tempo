import type { FocusSession } from "./Saved.ts"

/** Days drawn in the log, today included. */
export const DAYS = 14

/** Points sampled across one day's line. */
export const SAMPLES = 288

const DAY_MS = 86_400_000

/** Local midnight of the day containing `ms`. */
export const startOfDay = (ms: number): number => {
  const date = new Date(ms)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

/** Deterministic noise in [0, 1) so a session's pulse looks the same on every render. */
const noise = (seed: number): number => {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

/**
 * One day's line as heights in [0, 1] across 24 hours. Each session is a
 * jagged pulse centred on its midpoint, scaled by its length, so the
 * shape is the actual record rather than decoration.
 */
const midpointOf = (session: FocusSession): number => session.endedAt - (session.minutes * 60_000) / 2

const dayLine = (dayStart: number, sessions: ReadonlyArray<FocusSession>): ReadonlyArray<number> => {
  const heights = new Array<number>(SAMPLES).fill(0)
  for (const session of sessions) {
    const midpoint = midpointOf(session)
    if (midpoint < dayStart || midpoint >= dayStart + DAY_MS) continue
    const centre = ((midpoint - dayStart) / DAY_MS) * SAMPLES
    const width = Math.max(3, (session.minutes / 25) * 5)
    const amplitude = Math.min(1, 0.55 + session.minutes / 60)
    for (let i = Math.max(0, Math.floor(centre - width * 3)); i < Math.min(SAMPLES, centre + width * 3); i++) {
      const distance = (i - centre) / width
      const envelope = Math.exp(-distance * distance)
      const jitter = 0.55 + 0.45 * noise(session.endedAt / 1000 + i)
      heights[i] = Math.min(1, (heights[i] ?? 0) + amplitude * envelope * jitter)
    }
  }
  return heights
}

export interface LogDay {
  readonly dayStart: number
  readonly heights: ReadonlyArray<number>
  readonly sessions: number
}

/** The last `DAYS` days ending today, oldest first, so today draws in front. */
export const build = (sessions: ReadonlyArray<FocusSession>, now: number): ReadonlyArray<LogDay> => {
  const today = startOfDay(now)
  return Array.from({ length: DAYS }, (_, index) => {
    // Step back by calendar day so daylight-saving shifts don't misalign lines.
    const date = new Date(today)
    date.setDate(date.getDate() - (DAYS - 1 - index))
    const dayStart = date.getTime()
    // Bucket by midpoint, the same point the pulse is drawn at, so a session
    // spanning midnight lands on the day that draws it.
    const own = sessions.filter((session) => startOfDay(midpointOf(session)) === dayStart)
    return { dayStart, heights: dayLine(dayStart, own), sessions: own.length }
  })
}

/** Where `now` falls across today's line, in [0, 1]. */
export const dayFraction = (now: number): number => (now - startOfDay(now)) / DAY_MS

export interface Summary {
  readonly todaySessions: number
  readonly todayMinutes: number
  /** Days in the log window with at least one finished session. */
  readonly activeDays: number
}

/** Totals for the data sheet, bucketed the same way the log draws them. */
export const summarize = (sessions: ReadonlyArray<FocusSession>, now: number): Summary => {
  const today = startOfDay(now)
  const windowStart = new Date(today)
  windowStart.setDate(windowStart.getDate() - (DAYS - 1))
  const days = new Set<number>()
  let todaySessions = 0
  let todayMinutes = 0
  for (const session of sessions) {
    const day = startOfDay(midpointOf(session))
    if (day < windowStart.getTime() || day > today) continue
    days.add(day)
    if (day === today) {
      todaySessions += 1
      todayMinutes += session.minutes
    }
  }
  return { todaySessions, todayMinutes, activeDays: days.size }
}
