import { ESTIMATES } from "#domain/Task"
import { UiSchema, Validation } from "@effect/ui"
import { Button, Field, fieldValidationProps, Input, makeToggleGroup } from "@effect/ui-kit"
import { Html } from "@effect/ui/html"
import { Option, Schema } from "effect"

const Rule = Validation.Rule

export const NewTaskValidation = Validation.make({
  title: {
    required: "Give the task a name",
    rules: [Rule.maxLength(80, "Keep it under 80 characters")]
  }
})

const Estimate = Schema.Literals(ESTIMATES)
type Estimate = typeof Estimate.Type

export const NewTaskFormModel = Schema.Struct({
  form: NewTaskValidation.State,
  estimate: Estimate
})
export type NewTaskFormModel = typeof NewTaskFormModel.Type

export const NewTaskFormMessage = UiSchema.TaggedEnum({
  UpdatedTitle: { value: Schema.String },
  ToggledEstimate: { value: Schema.Array(Estimate) },
  SubmittedForm: {}
})
export type NewTaskFormMessage = typeof NewTaskFormMessage.Type

export const NewTaskFormEvents = UiSchema.TaggedEnum({
  Submitted: { title: Schema.String, estimate: Schema.Number }
})

const EstimateToggleGroup = makeToggleGroup({ value: Estimate })
const estimateItems = ESTIMATES.map((value) => ({ value }))

const initial = (): NewTaskFormModel => ({
  form: NewTaskValidation.init({ title: "" }),
  estimate: "1"
})

export const NewTaskForm = Html.component({
  name: "NewTaskForm",
  model: NewTaskFormModel,
  message: NewTaskFormMessage,
  events: NewTaskFormEvents
}).make({
  init: initial,

  update: {
    UpdatedTitle: ($, { value }) =>
      $.evolve({ form: (form) => NewTaskValidation.change(form, "title", value) }),

    ToggledEstimate: ($, { value }) => {
      const [estimate] = value
      return estimate === undefined ? $.model : $.evolve({ estimate })
    },

    SubmittedForm: ($) => {
      const form = NewTaskValidation.submit($.model.form)
      return Option.match(NewTaskValidation.validate(form).value, {
        onNone: () => $.evolve({ form }),
        onSome: ({ title }) =>
          $.set(initial()).emit(
            NewTaskFormEvents.Submitted({ title: title.trim(), estimate: Number($.model.estimate) })
          )
      })
    }
  },

  view: (h, model) => {
    const title = NewTaskValidation.validate(model.form).fields.title
    return h.form
      .attr("aria-label", "Add a task")
      .attr("novalidate", "")
      .class("flex flex-col gap-3")
      .on("submit", NewTaskFormMessage.SubmittedForm())
      .children(
        Field(h, {
          key: "title",
          props: fieldValidationProps(title),
          view: (field) =>
            field.root(h.div.class("flex flex-col gap-1.5")).children(
              field.label(h.label).class("sr-only").children("Task"),
              h.div.class("flex gap-2").children(
                Input(h, {
                  element: field.control(h.input),
                  props: { value: title.value },
                  onUpdate: ({ value }) => NewTaskFormMessage.UpdatedTitle({ value })
                })
                  .attr("placeholder", "What are you working on?")
                  .attr("autocomplete", "off")
                  .class(
                    "min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-stone-100 placeholder:text-stone-500",
                    "focus:border-white/30 focus:outline-none data-invalid:border-rose-400/70"
                  ),
                Button(h, { props: { type: "submit" } })
                  .class(
                    "rounded-xl bg-stone-100 px-4 py-2.5 text-sm font-semibold text-stone-950 transition cursor-pointer hover:bg-white"
                  )
                  .children("Add")
              ),
              title._tag === "Invalid" &&
                field.error(h.p)?.class("text-sm text-rose-300").children(title.errors[0])
            )
        }),
        h.div.class("flex items-center gap-3 text-sm text-stone-400").children(
          h.span.id(h.id("estimate-label")).children("Estimate"),
          EstimateToggleGroup(h, {
            props: { value: [model.estimate], items: estimateItems },
            onEmit: ({ value }) => NewTaskFormMessage.ToggledEstimate({ value }),
            view: (toggleGroup) =>
              toggleGroup
                .root(h.div.class("flex gap-1").attr("aria-labelledby", h.id("estimate-label")))
                .children(
                  ESTIMATES.map((value) =>
                    toggleGroup
                      .item({
                        element: h.button
                          .class(
                            "size-8 rounded-lg border border-white/10 font-mono text-xs text-stone-400 transition cursor-pointer hover:text-stone-100",
                            "aria-pressed:border-rose-300/60 aria-pressed:bg-rose-400/15 aria-pressed:text-rose-200"
                          )
                          .attr("aria-label", `${value} session${value === "1" ? "" : "s"}`),
                        value
                      })
                      .children(value)
                  )
                )
          }),
          h.span.class("text-xs text-stone-500").children("× 25 min")
        )
      )
  }
})
