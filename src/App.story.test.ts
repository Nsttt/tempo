import * as Saved from "#domain/Saved"
import { Component } from "@effect/ui"
import { Story } from "@effect/ui/testing"
import { assert, describe, it } from "@effect/vitest"
import { Effect } from "effect"
import { App, AppMessage, catalogNo, SaveState } from "./App.ts"

const NOW = Date.UTC(2026, 10, 27, 12)
const fresh = { initialState: Saved.empty, initialNow: NOW }

describe("App", () => {
  it.effect("adds a task, makes it active and saves", () =>
    Effect.gen(function*() {
      const s = yield* Story.make(App, fresh)
      s.send(AppMessage.SubmittedNewTask({ title: "Write the launch post", estimate: 2 }))
        .expectExact(SaveState)
      assert.deepStrictEqual(s.pending[0]?.command.args, {
        state: {
          tasks: [{ id: "t1", title: "Write the launch post", estimate: 2, pomodoros: 0, done: false }],
          activeTaskId: "t1",
          nextTaskId: 2,
          completedFocus: 0,
          focusMinutes: 0,
          sessions: []
        }
      })
      s.resolve(SaveState, Component.noop)

      // A second task doesn't steal focus from the first.
      s.send(AppMessage.SubmittedNewTask({ title: "Review PRs", estimate: 1 }))
        .resolve(SaveState, Component.noop)
      assert.strictEqual(s.model.activeTaskId, "t1")
      assert.deepStrictEqual(s.model.tasks.map((task) => task.id), ["t1", "t2"])
    }))

  it.effect("a finished focus session credits the active task and the totals", () =>
    Effect.gen(function*() {
      const s = yield* Story.make(App, fresh)
      s.send(AppMessage.SubmittedNewTask({ title: "Deep work", estimate: 1 }))
        .resolve(SaveState, Component.noop)
        .send(AppMessage.FinishedTimer({ phase: "Focus", minutes: 25, endedAt: NOW + 60_000 }))
        .resolve(SaveState, Component.noop)
      assert.strictEqual(s.model.completedFocus, 1)
      assert.strictEqual(s.model.focusMinutes, 25)
      assert.strictEqual(s.model.tasks[0]?.pomodoros, 1)
      // The session is logged for the focus log, and the log's clock catches up.
      assert.deepStrictEqual(s.model.sessions, [{ endedAt: NOW + 60_000, minutes: 25, taskId: "t1" }])
      assert.strictEqual(s.model.now, NOW + 60_000)

      // Breaks aren't work: nothing changes and nothing is saved.
      s.send(AppMessage.FinishedTimer({ phase: "ShortBreak", minutes: 5, endedAt: NOW + 6 * 60_000 })).expectNone()
      assert.strictEqual(s.model.completedFocus, 1)
      assert.strictEqual(s.model.sessions.length, 1)
    }))

  it.effect("completing or deleting the active task frees the timer", () =>
    Effect.gen(function*() {
      const s = yield* Story.make(App, fresh)
      s.send(AppMessage.SubmittedNewTask({ title: "A", estimate: 1 }))
        .resolve(SaveState, Component.noop)
        .send(AppMessage.SubmittedNewTask({ title: "B", estimate: 1 }))
        .resolve(SaveState, Component.noop)
        .send(AppMessage.ToggledTaskDone({ id: "t1", checked: true }))
        .resolve(SaveState, Component.noop)
      assert.isNull(s.model.activeTaskId)
      assert.isTrue(s.model.tasks[0]?.done)

      s.send(AppMessage.ClickedTask({ id: "t2" }))
        .resolve(SaveState, Component.noop)
        .send(AppMessage.ClickedDeleteTask({ id: "t2" }))
        .resolve(SaveState, Component.noop)
      assert.isNull(s.model.activeTaskId)

      s.send(AppMessage.ClickedClearCompleted()).resolve(SaveState, Component.noop)
      assert.deepStrictEqual(s.model.tasks, [])
    }))

  it.effect("starts from saved state and reports a failed save", () =>
    Effect.gen(function*() {
      const initialState = {
        ...Saved.empty,
        tasks: [{ id: "t7", title: "Saved earlier", estimate: 3, pomodoros: 2, done: false }],
        activeTaskId: "t7",
        nextTaskId: 8,
        completedFocus: 6,
        focusMinutes: 150
      }
      const s = yield* Story.make(App, { initialState, initialNow: NOW })
      assert.deepStrictEqual(s.model, { ...initialState, saveError: null, now: NOW })

      s.send(AppMessage.SubmittedNewTask({ title: "New", estimate: 1 }))
        .resolve(SaveState, AppMessage.FailedSaveState({ error: "Quota exceeded" }))
      assert.strictEqual(s.model.tasks[1]?.id, "t8")
      assert.strictEqual(s.model.saveError, "Quota exceeded")
    }))

  it.effect("a focus session with no active task is still logged, unattributed", () =>
    Effect.gen(function*() {
      const s = yield* Story.make(App, fresh)
      s.send(AppMessage.FinishedTimer({ phase: "Focus", minutes: 25, endedAt: NOW }))
        .resolve(SaveState, Component.noop)
      assert.deepStrictEqual(s.model.sessions, [{ endedAt: NOW, minutes: 25, taskId: null }])
    }))

  it("numbers tasks like catalog entries", () => {
    assert.strictEqual(catalogNo("t7"), "TMP 07")
    assert.strictEqual(catalogNo("t123"), "TMP 123")
  })
})
