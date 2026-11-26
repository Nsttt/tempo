import { Story } from "@effect/ui/testing"
import { assert, describe, it } from "@effect/vitest"
import { Effect } from "effect"
import { NewTaskForm, NewTaskFormEvents, NewTaskFormMessage, NewTaskValidation } from "./NewTaskForm.ts"

const titleField = (s: { readonly model: { readonly form: typeof NewTaskValidation.State.Type } }) =>
  NewTaskValidation.validate(s.model.form).fields.title

describe("NewTaskForm", () => {
  it.effect("refuses an empty title and says why", () =>
    Effect.gen(function*() {
      const s = yield* Story.make(NewTaskForm, {})
      s.send(NewTaskFormMessage.SubmittedForm())
      const title = titleField(s)
      assert.strictEqual(title._tag, "Invalid")
      assert.deepStrictEqual(title._tag === "Invalid" ? title.errors : [], ["Give the task a name"])
    }))

  it.effect("emits the trimmed title with the estimate, then clears", () =>
    Effect.gen(function*() {
      const s = yield* Story.make(NewTaskForm, {})
      s.send(NewTaskFormMessage.UpdatedTitle({ value: "  Write docs  " }))
        .send(NewTaskFormMessage.ToggledEstimate({ value: ["3"] }))
        .send(NewTaskFormMessage.SubmittedForm())
        .emitted(NewTaskFormEvents.Submitted({ title: "Write docs", estimate: 3 }))
      assert.strictEqual(titleField(s).value, "")
      assert.strictEqual(s.model.estimate, "1")
    }))
})
