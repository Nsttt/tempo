import { Component } from "@effect/ui"
import { Story } from "@effect/ui/testing"
import { assert, describe, it } from "@effect/vitest"
import { Effect } from "effect"
import { PlayChime, Timer, TimerEvents, TimerMessage } from "./Timer.ts"

const MINUTE = 60_000
const props = { completedFocus: 0, taskTitle: "Write the launch post", catalogNo: "TMP 01", openTasks: 1 }
const hasClock = (keys: ReadonlyArray<string>) => keys.some((key) => key.startsWith("clock"))

describe("Timer", () => {
  it.effect("counts down by wall-clock time between ticks", () =>
    Effect.gen(function*() {
      const s = yield* Story.make(Timer, props)
      assert.deepStrictEqual(s.model, { phase: "Focus", status: "Idle", remainingMs: 25 * MINUTE, lastTickAt: null })
      assert.isFalse(hasClock(s.subscriptions))

      s.send(TimerMessage.ClickedStart())
      assert.strictEqual(s.model.status, "Running")
      assert.isTrue(hasClock(s.subscriptions))

      // The first tick only sets the baseline.
      s.send(TimerMessage.Ticked({ now: 1_000 }))
      assert.strictEqual(s.model.remainingMs, 25 * MINUTE)

      // A throttled tab may tick late; the full gap still counts.
      s.send(TimerMessage.Ticked({ now: 1_000 + 3 * MINUTE }))
      assert.strictEqual(s.model.remainingMs, 22 * MINUTE)
    }))

  it.effect("doesn't count time spent paused", () =>
    Effect.gen(function*() {
      const s = yield* Story.make(Timer, props)
      s.send(TimerMessage.ClickedStart())
        .send(TimerMessage.Ticked({ now: 0 }))
        .send(TimerMessage.Ticked({ now: MINUTE }))
        .send(TimerMessage.ClickedPause())
      assert.strictEqual(s.model.status, "Paused")
      assert.isFalse(hasClock(s.subscriptions))

      // Ten minutes later the user resumes.
      s.send(TimerMessage.ClickedStart())
        .send(TimerMessage.Ticked({ now: 11 * MINUTE }))
        .send(TimerMessage.Ticked({ now: 12 * MINUTE }))
      assert.strictEqual(s.model.remainingMs, 23 * MINUTE)
    }))

  it.effect("finishing focus reports it, chimes and moves to a short break", () =>
    Effect.gen(function*() {
      const s = yield* Story.make(Timer, props)
      s.send(TimerMessage.ClickedStart())
        .send(TimerMessage.Ticked({ now: 0 }))
        .send(TimerMessage.Ticked({ now: 25 * MINUTE }))
        .expectExact(PlayChime)
      assert.deepStrictEqual(s.pending[0]?.command.args, { tone: "focus" })
      s.emitted(TimerEvents.Finished({ phase: "Focus", minutes: 25, endedAt: 25 * MINUTE }))
        .resolve(PlayChime, Component.noop)
      assert.deepStrictEqual(s.model, { phase: "ShortBreak", status: "Idle", remainingMs: 5 * MINUTE, lastTickAt: null })
    }))

  it.effect("every fourth session earns a long break", () =>
    Effect.gen(function*() {
      const s = yield* Story.make(Timer, { ...props, completedFocus: 3 })
      s.send(TimerMessage.ClickedStart())
        .send(TimerMessage.Ticked({ now: 0 }))
        .send(TimerMessage.Ticked({ now: 30 * MINUTE }))
        .emitted(TimerEvents.Finished({ phase: "Focus", minutes: 25, endedAt: 30 * MINUTE }))
        .resolve(PlayChime, Component.noop)
      assert.strictEqual(s.model.phase, "LongBreak")
      assert.strictEqual(s.model.remainingMs, 15 * MINUTE)
    }))

  it.effect("keyboard: space toggles, s skips without credit, r resets", () =>
    Effect.gen(function*() {
      const s = yield* Story.make(Timer, props)
      s.send(TimerMessage.PressedKey({ key: " " }))
      assert.strictEqual(s.model.status, "Running")
      s.send(TimerMessage.PressedKey({ key: " " }))
      assert.strictEqual(s.model.status, "Paused")

      // Skipping emits nothing, so the parent gives no credit.
      s.send(TimerMessage.PressedKey({ key: "s" }))
      assert.strictEqual(s.model.phase, "ShortBreak")

      s.send(TimerMessage.ClickedStart())
        .send(TimerMessage.Ticked({ now: 0 }))
        .send(TimerMessage.Ticked({ now: MINUTE }))
        .send(TimerMessage.PressedKey({ key: "r" }))
      assert.deepStrictEqual(s.model, { phase: "ShortBreak", status: "Idle", remainingMs: 5 * MINUTE, lastTickAt: null })
    }))

  it.effect("picking a phase starts it fresh, and re-pressing the current one keeps it", () =>
    Effect.gen(function*() {
      const s = yield* Story.make(Timer, props)
      s.send(TimerMessage.ToggledPhase({ value: ["LongBreak"] }))
      assert.strictEqual(s.model.phase, "LongBreak")
      s.send(TimerMessage.ToggledPhase({ value: [] }))
      assert.strictEqual(s.model.phase, "LongBreak")
    }))
})
