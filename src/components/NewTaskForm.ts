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
      .class("flex flex-col gap-4")
      .on("submit", NewTaskFormMessage.SubmittedForm())
      .children(
        Field(h, {
          key: "title",
          props: fieldValidationProps(title),
          view: (field) =>
            field.root(h.div.class("flex flex-col gap-2")).children(
              field.label(h.label).class("sr-only").children("Task"),
              h.div.class("flex").children(
                Input(h, {
                  element: field.control(h.input),
                  props: { value: title.value },
                  onUpdate: ({ value }) => NewTaskFormMessage.UpdatedTitle({ value })
                })
                  .attr("placeholder", "New task title")
                  .attr("autocomplete", "off")
                  .class(
                    "h-12 min-w-0 flex-1 border border-dim bg-transparent px-4 text-sm text-ink placeholder:text-mute",
                    "transition-colors duration-150 focus:border-ink focus:outline-none data-invalid:border-focus"
                  ),
                Button(h, { props: { type: "submit" } })
                  .class(
                    "caps -ml-px h-12 border border-ink px-5 text-xs text-ink transition-colors duration-150 cursor-pointer hover:bg-ink hover:text-ground"
                  )
                  .children("Add")
              ),
              title._tag === "Invalid" &&
                field.error(h.p)?.class("text-xs text-focus").children(title.errors[0])
            )
        }),
        h.div.class("flex items-center gap-4").children(
          h.span.id(h.id("estimate-label")).class("caps text-[10px] text-mute").children("Est. sessions"),
          EstimateToggleGroup(h, {
            props: { value: [model.estimate], items: estimateItems },
            onEmit: ({ value }) => NewTaskFormMessage.ToggledEstimate({ value }),
            view: (toggleGroup) =>
              toggleGroup
                .root(h.div.class("flex").attr("aria-labelledby", h.id("estimate-label")))
                .children(
                  ESTIMATES.map((value) =>
                    toggleGroup
                      .item({
                        element: h.button
                          .class(
                            "num -ml-px grid size-8 place-items-center border border-dim text-[11px] text-mute transition-colors duration-150 cursor-pointer first:ml-0 hover:text-ink",
                            "aria-pressed:z-10 aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-ground"
                          )
                          .attr("aria-label", `${value} session${value === "1" ? "" : "s"}`),
                        value
                      })
                      .children(value)
                  )
                )
          })
        )
      )
  }
})
