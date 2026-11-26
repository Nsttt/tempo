import { formatMinutes, Phase } from "#domain/Phase"
import { SavedState } from "#domain/Saved"
import * as Saved from "#domain/Saved"
import * as Task from "#domain/Task"
import { Command, Component, UiSchema } from "@effect/ui"
import { Button, Checkbox } from "@effect/ui-kit"
import { Html } from "@effect/ui/html"
import { Array, Effect, Option, Schema } from "effect"
import { NewTaskForm } from "./components/NewTaskForm.ts"
import { Timer } from "./components/Timer.ts"
import { TempoStore } from "./services/TempoStore.ts"

export const AppProps = Schema.Struct({ initialState: SavedState })

/** The Model is exactly what's saved; the Timer keeps the clock to itself. */
export const AppModel = Schema.Struct({
  ...SavedState.fields,
  saveError: Schema.NullOr(Schema.String)
})
export type AppModel = typeof AppModel.Type

export const AppMessage = UiSchema.TaggedEnum({
  SubmittedNewTask: { title: Schema.String, estimate: Schema.Number },
  ClickedTask: { id: Schema.String },
  ToggledTaskDone: { id: Schema.String, checked: Schema.Boolean },
  ClickedDeleteTask: { id: Schema.String },
  ClickedClearCompleted: {},
  FinishedTimer: { phase: Phase, minutes: Schema.Number },
  FailedSaveState: { error: Schema.String }
})
export type AppMessage = typeof AppMessage.Type

/** Reads saved state once at startup. Bad or missing data starts fresh. */
export const appProps = Effect.gen(function*() {
  const store = yield* TempoStore
  const saved = yield* store.load.pipe(Effect.orElseSucceed(() => Option.none()))
  return { initialState: Option.getOrElse(saved, () => Saved.empty) }
})

export class SaveState extends Command.Service<SaveState>()(
  "tempo/SaveState",
  {
    args: { state: SavedState },
    success: Schema.Union([AppMessage, Component.Noop]),
    // Each save writes the whole state, so only the newest one matters.
    mode: "switch"
  }
) {
  static readonly layer = this.toLayer(
    TempoStore.useSync((store) => ({ state }) =>
      store.save(state).pipe(
        Effect.match({
          onSuccess: () => Component.noop,
          onFailure: (error) => AppMessage.FailedSaveState({ error: error.message })
        })
      )
    )
  )
}

const toSaved = ({ saveError: _, ...state }: AppModel): SavedState => state

/** Saves the whole state after a change to a saved field. */
const save = (next: AppModel) => SaveState.make({ state: toSaved(next) })

const mapTask = (tasks: ReadonlyArray<Task.Task>, id: string, f: (task: Task.Task) => Task.Task) =>
  tasks.map((task) => (task.id === id ? f(task) : task))

const activeTask = (model: AppModel): Task.Task | undefined =>
  model.activeTaskId === null ? undefined : model.tasks.find((task) => task.id === model.activeTaskId)

const PomodoroDots = <M>(h: Html.H<M>, task: Task.Task) => {
  const slots = Math.max(task.estimate, task.pomodoros)
  return h.span
    .class("flex items-center gap-1")
    .attr("aria-label", `${task.pomodoros} of ${task.estimate} sessions`)
    .children(
      Array.makeBy(slots, (i) =>
        h.span.class(
          "size-2 rounded-full",
          i < task.pomodoros
            ? i < task.estimate ? "bg-rose-400" : "bg-amber-400"
            : "border border-white/20"
        ))
    )
}

const TaskRow = (h: Html.H<AppMessage>, task: Task.Task, active: boolean) =>
  h.li
    .key(task.id)
    .class(
      "group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition",
      active ? "border-rose-300/40 bg-rose-400/10" : "border-transparent hover:bg-white/5"
    )
    .children(
      Checkbox(h, {
        key: task.id,
        props: { checked: task.done },
        onEmit: { Toggled: ({ checked }) => AppMessage.ToggledTaskDone({ id: task.id, checked }) },
        view: (checkbox) =>
          checkbox
            .root(
              h.button
                .class(
                  "grid size-5 shrink-0 place-items-center rounded-md border border-white/25 transition cursor-pointer",
                  "data-checked:border-emerald-400 data-checked:bg-emerald-400 hover:border-white/50"
                )
                .attr("aria-label", `Mark “${task.title}” ${task.done ? "not done" : "done"}`)
            )
            .children(
              checkbox
                .indicator(h.span.class("text-stone-950 data-unchecked:hidden"))
                .children(
                  h.svg
                    .class("size-3.5")
                    .attrs({
                      viewBox: "0 0 24 24",
                      fill: "none",
                      stroke: "currentColor",
                      "stroke-width": "3",
                      "stroke-linecap": "round",
                      "aria-hidden": "true"
                    })
                    .children(h.path.attr("d", "M5 12l5 5L20 7"))
                )
            )
      }),
      Button(h, { props: { disabled: task.done }, onPress: AppMessage.ClickedTask({ id: task.id }) })
        .class("flex min-w-0 flex-1 items-center justify-between gap-3 text-left cursor-pointer disabled:cursor-default")
        .attr("aria-current", active ? "true" : "false")
        .children(
          h.span
            .class("truncate", task.done ? "text-stone-500 line-through" : "text-stone-100")
            .children(task.title),
          PomodoroDots(h, task)
        ),
      Button(h, { onPress: AppMessage.ClickedDeleteTask({ id: task.id }) })
        .class(
          // Always visible: touch screens have no hover to reveal it.
          "rounded-md p-1 text-stone-600 transition cursor-pointer hover:text-rose-300 group-hover:text-stone-400"
        )
        .attr("aria-label", `Delete “${task.title}”`)
        .children(
          h.svg
            .class("size-4")
            .attrs({
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              "stroke-width": "2",
              "stroke-linecap": "round",
              "aria-hidden": "true"
            })
            .children(h.path.attr("d", "M6 6l12 12M18 6L6 18"))
        )
    )

const Stat = <M>(h: Html.H<M>, label: string, value: string) =>
  h.div.class("flex flex-col").children(
    h.span.class("font-mono text-lg font-semibold tabular-nums text-stone-100").children(value),
    h.span.class("text-xs text-stone-500").children(label)
  )

export const AppNoDeps = Html.component({
  name: "App",
  props: AppProps,
  model: AppModel,
  message: AppMessage
}).make({
  // `initialState` is a seed: later changes to the prop don't reach the Model.
  init: ($) => ({ ...$.props.initialState, saveError: null }),

  update: {
    SubmittedNewTask: ($, { title, estimate }) => {
      const task = Task.make(`t${$.model.nextTaskId}`, title, estimate)
      const next: AppModel = {
        ...$.model,
        tasks: [...$.model.tasks, task],
        nextTaskId: $.model.nextTaskId + 1,
        activeTaskId: $.model.activeTaskId ?? task.id
      }
      return $.set(next).run(save(next))
    },

    ClickedTask: ($, { id }) => {
      if ($.model.activeTaskId === id) return $.model
      const next: AppModel = { ...$.model, activeTaskId: id }
      return $.set(next).run(save(next))
    },

    ToggledTaskDone: ($, { id, checked }) => {
      const next: AppModel = {
        ...$.model,
        tasks: mapTask($.model.tasks, id, (task) => ({ ...task, done: checked })),
        // Finishing the active task frees the timer for the next one.
        activeTaskId: checked && $.model.activeTaskId === id ? null : $.model.activeTaskId
      }
      return $.set(next).run(save(next))
    },

    ClickedDeleteTask: ($, { id }) => {
      const next: AppModel = {
        ...$.model,
        tasks: $.model.tasks.filter((task) => task.id !== id),
        activeTaskId: $.model.activeTaskId === id ? null : $.model.activeTaskId
      }
      return $.set(next).run(save(next))
    },

    ClickedClearCompleted: ($) => {
      const next: AppModel = { ...$.model, tasks: $.model.tasks.filter((task) => !task.done) }
      return $.set(next).run(save(next))
    },

    FinishedTimer: ($, { phase, minutes }) => {
      if (phase !== "Focus") return $.model
      const active = activeTask($.model)
      const next: AppModel = {
        ...$.model,
        completedFocus: $.model.completedFocus + 1,
        focusMinutes: $.model.focusMinutes + minutes,
        tasks: active === undefined || active.done
          ? $.model.tasks
          : mapTask($.model.tasks, active.id, (task) => ({ ...task, pomodoros: task.pomodoros + 1 }))
      }
      return $.set(next).run(save(next))
    },

    FailedSaveState: ($, { error }) => $.evolve({ saveError: error })
  },

  view: (h, model) => {
    const active = activeTask(model)
    const tasks = Task.sorted(model.tasks)
    const openCount = model.tasks.filter((task) => !task.done).length
    const doneCount = model.tasks.length - openCount

    return h.div.class("mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:py-12").children(
      h.header.class("flex flex-wrap items-end justify-between gap-6").children(
        h.div.children(
          h.h1.class("flex items-center gap-2.5 text-xl font-semibold tracking-tight").children(
            h.span.class("size-3 rounded-full bg-rose-400 shadow-[0_0_16px] shadow-rose-400/60").attr(
              "aria-hidden",
              "true"
            ),
            "Tempo"
          ),
          h.p.class("mt-1 text-sm text-stone-500").children("One task, twenty-five minutes, then a break.")
        ),
        h.div.class("flex gap-8").attr("aria-label", "Statistics").children(
          Stat(h, "sessions", String(model.completedFocus)),
          Stat(h, "focused", formatMinutes(model.focusMinutes)),
          Stat(h, "open tasks", String(openCount))
        )
      ),

      model.saveError !== null &&
        h.p
          .class("rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-sm text-amber-200")
          .attr("role", "alert")
          .children(`Couldn't save your changes: ${model.saveError}`),

      h.main.class("grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]").children(
        Timer(h, {
          props: { completedFocus: model.completedFocus, taskTitle: active?.title ?? null },
          onEmit: {
            Finished: ({ phase, minutes }) => AppMessage.FinishedTimer({ phase, minutes })
          }
        }),

        h.section
          .class("flex flex-col gap-5 rounded-3xl border border-white/5 bg-stone-900/60 p-5 sm:p-6")
          .attr("aria-labelledby", h.id("tasks-heading"))
          .children(
            h.div.class("flex items-baseline justify-between").children(
              h.h2.id(h.id("tasks-heading")).class("text-sm font-semibold uppercase tracking-[0.15em] text-stone-400")
                .children("Tasks"),
              doneCount > 0 &&
                Button(h, { onPress: AppMessage.ClickedClearCompleted() })
                  .class("text-xs text-stone-500 transition cursor-pointer hover:text-stone-200")
                  .children(`Clear ${doneCount} done`)
            ),
            NewTaskForm(h, {
              onEmit: {
                Submitted: ({ title, estimate }) => AppMessage.SubmittedNewTask({ title, estimate })
              }
            }),
            tasks.length === 0
              ? h.p.class("rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-stone-500")
                .children("No tasks yet. Add one above, then press Start.")
              : h.ul.class("-mx-1 flex flex-col gap-1").attr("aria-label", "Task list").children(
                tasks.map((task) => TaskRow(h, task, task.id === model.activeTaskId))
              )
          )
      )
    )
  }
})

export const App = AppNoDeps.pipe(Component.provide(SaveState.layer))
