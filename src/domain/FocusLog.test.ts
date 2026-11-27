import { assert, describe, it } from "@effect/vitest"
import { Effect, Schema } from "effect"
import * as FocusLog from "./FocusLog.ts"
import { SavedState } from "./Saved.ts"

const at = (day: number, hour: number, minute = 0) => new Date(2026, 10, day, hour, minute).getTime()

describe("FocusLog", () => {
  it("draws fourteen days, oldest first, with today last", () => {
    const now = at(27, 15)
    const days = FocusLog.build([], now)
    assert.strictEqual(days.length, FocusLog.DAYS)
    assert.strictEqual(days.at(-1)?.dayStart, FocusLog.startOfDay(now))
    assert.strictEqual(days[0]?.dayStart, new Date(2026, 10, 14).getTime())
    assert.isTrue(days.every((day) => day.heights.length === FocusLog.SAMPLES && day.heights.every((h) => h === 0)))
  })

  it("raises a pulse at the hour the session ran, on its own day", () => {
    const now = at(27, 15)
    const days = FocusLog.build([{ endedAt: at(27, 10, 25), minutes: 25, taskId: null }], now)
    const today = days.at(-1)!
    assert.strictEqual(today.sessions, 1)
    const peak = today.heights.indexOf(Math.max(...today.heights))
    // Midpoint 10:12:30 sits at sample ~122 of 288.
    assert.isTrue(Math.abs(peak - 122) <= 6)
    assert.isTrue(days.slice(0, -1).every((day) => day.sessions === 0))
  })

  it("files a session that spans midnight under the day its midpoint falls on", () => {
    const now = at(27, 9)
    // 23:50 to 00:15: the midpoint is 00:02:30 on the 27th.
    const days = FocusLog.build([{ endedAt: at(27, 0, 15), minutes: 25, taskId: null }], now)
    assert.strictEqual(days.at(-1)?.sessions, 1)
    assert.strictEqual(days.at(-2)?.sessions, 0)
  })

  it.effect("older saved state without sessions still decodes", () =>
    Effect.gen(function*() {
      const decoded = yield* Schema.decodeUnknownEffect(SavedState)({
        tasks: [],
        activeTaskId: null,
        nextTaskId: 1,
        completedFocus: 3,
        focusMinutes: 75
      })
      assert.deepStrictEqual(decoded.sessions, [])
    }))

  it("summarizes today and the active days in the window", () => {
    const now = at(27, 18)
    const summary = FocusLog.summarize([
      { endedAt: at(27, 10), minutes: 25, taskId: null },
      { endedAt: at(27, 11), minutes: 25, taskId: null },
      { endedAt: at(20, 9), minutes: 25, taskId: null },
      // Outside the fourteen-day window.
      { endedAt: at(1, 9), minutes: 25, taskId: null }
    ], now)
    assert.deepStrictEqual(summary, { todaySessions: 2, todayMinutes: 50, activeDays: 2 })
  })
})
