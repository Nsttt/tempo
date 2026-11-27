import * as FocusLog from "#domain/FocusLog"
import { formatMinutes, LONG_BREAK_EVERY, Phase } from "#domain/Phase"
import { MAX_SESSIONS, SavedState } from "#domain/Saved"
import * as Saved from "#domain/Saved"
import * as Task from "#domain/Task"
import { Command, Component, Subscription, UiSchema } from "@effect/ui"
import { Button, Checkbox } from "@effect/ui-kit"
import { Html } from "@effect/ui/html"
import { Array, Clock, Duration, Effect, Option, Schema, Stream } from "effect"
import { FocusLogPlot } from "./components/FocusLogPlot.ts"
import { NewTaskForm } from "./components/NewTaskForm.ts"
import { Timer } from "./components/Timer.ts"
import { TempoStore } from "./services/TempoStore.ts"

export const AppProps = Schema.Struct({ initialState: SavedState, initialNow: Schema.Number })

/**
 * The saved state plus two things that aren't saved: the last save error,
 * and a coarse clock that keeps the focus log's "now" mark moving.
 */
export const AppModel = Schema.Struct({
  ...SavedState.fields,
  saveError: Schema.NullOr(Schema.String),
  now: Schema.Number
})
export type AppModel = typeof AppModel.Type

export const AppMessage = UiSchema.TaggedEnum({
  SubmittedNewTask: { title: Schema.String, estimate: Schema.Number },
  ClickedTask: { id: Schema.String },
  ToggledTaskDone: { id: Schema.String, checked: Schema.Boolean },
  ClickedDeleteTask: { id: Schema.String },
  ClickedClearCompleted: {},
  FinishedTimer: { phase: Phase, minutes: Schema.Number, endedAt: Schema.Number },
  TickedMinute: { now: Schema.Number },
  FailedSaveState: { error: Schema.String }
})
export type AppMessage = typeof AppMessage.Type

/** Reads saved state once at startup. Bad or missing data starts fresh. */
export const appProps = Effect.gen(function*() {
  const store = yield* TempoStore
  const saved = yield* store.load.pipe(Effect.orElseSucceed(() => Option.none()))
  return {
    initialState: Option.getOrElse(saved, () => Saved.empty),
    initialNow: yield* Clock.currentTimeMillis
  }
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

const toSaved = ({ saveError: _, now: __, ...state }: AppModel): SavedState => state

/** Saves the whole state after a change to a saved field. */
const save = (next: AppModel) => SaveState.make({ state: toSaved(next) })

const mapTask = (tasks: ReadonlyArray<Task.Task>, id: string, f: (task: Task.Task) => Task.Task) =>
  tasks.map((task) => (task.id === id ? f(task) : task))

const activeTask = (model: AppModel): Task.Task | undefined =>
  model.activeTaskId === null ? undefined : model.tasks.find((task) => task.id === model.activeTaskId)

/** Task ids are `t<n>`; the catalog shows them the way a label would. */
export const catalogNo = (id: string): string => `TMP ${id.replace(/^t/, "").padStart(2, "0")}`

const MINUTE_TICK = Duration.seconds(30)

const SvgIcon = <M>(h: Html.H<M>, d: string, className: string) =>
  h.svg
    .class(className)
    .attrs({
      viewBox: "0 0 16 16",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "1.5",
      "stroke-linecap": "square",
      "aria-hidden": "true"
    })
    .children(h.path.attr("d", d))

/** One square per expected session: filled once worked, coded red past the estimate. */
const SessionStrip = <M>(h: Html.H<M>, task: Task.Task) => {
  const slots = Math.max(task.estimate, task.pomodoros)
  return h.span
    .class("flex items-center gap-[3px]")
    .attr("aria-label", `${task.pomodoros} of ${task.estimate} sessions`)
    .children(
      Array.makeBy(slots, (i) =>
        h.span.class(
          "size-2.5",
          i < task.pomodoros
            ? i < task.estimate ? (task.done ? "bg-mute" : "bg-ink") : "bg-focus"
            : "border border-dim"
        ))
    )
}

const TaskRow = (h: Html.H<AppMessage>, task: Task.Task, active: boolean) =>
  h.li
    .key(task.id)
    .class(
      "group -mt-px grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border px-3 py-3 first:mt-0",
      active ? "relative z-10 border-focus" : "border-rule"
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
                  "grid size-5 shrink-0 place-items-center border border-dim transition-colors duration-150 cursor-pointer",
                  "hover:border-ink data-checked:border-ink data-checked:bg-ink"
                )
                .attr("aria-label", `Mark “${task.title}” ${task.done ? "not done" : "done"}`)
            )
            .children(
              checkbox
                .indicator(h.span.class("text-ground data-unchecked:hidden"))
                .children(SvgIcon(h, "M3.5 8.5l3 3 6-7", "size-3.5"))
            )
      }),
      Button(h, { props: { disabled: task.done }, onPress: AppMessage.ClickedTask({ id: task.id }) })
        .class(
          "grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-3 gap-y-2 text-left cursor-pointer disabled:cursor-default"
        )
        .attr("aria-current", active ? "true" : "false")
        .children(
          h.span
            .class("num text-[11px]", active ? "text-focus" : "text-mute")
            .children(catalogNo(task.id)),
          h.span
            .class(
              "truncate text-sm",
              task.done ? "text-mute line-through decoration-dim" : "text-ink group-hover:underline underline-offset-4 decoration-dim"
            )
            .children(task.title),
          h.span.class("col-start-2").children(SessionStrip(h, task))
        ),
      Button(h, { onPress: AppMessage.ClickedDeleteTask({ id: task.id }) })
        .class(
          // Always visible: touch screens have no hover to reveal it.
          "grid size-8 place-items-center text-mute transition-colors duration-150 cursor-pointer hover:text-focus"
        )
        .attr("aria-label", `Delete “${task.title}”`)
        .children(SvgIcon(h, "M4 4l8 8M12 4l-8 8", "size-3.5"))
    )

/** What's left on the active task's estimate, or how far past it the task ran. */
const estimateLeft = (task: Task.Task | undefined): string => {
  if (task === undefined) return "No active task"
  const left = task.estimate - task.pomodoros
  return left > 0 ? `${left} of ${task.estimate} left` : left === 0 ? "On estimate" : `${-left} over estimate`
}

/** The sleeve's data sheet: field and value pairs, every value read from real records. */
const DataSheet = <M>(h: Html.H<M>, model: AppModel, active: Task.Task | undefined) => {
  const summary = FocusLog.summarize(model.sessions, model.now)
  const row = (label: string, value: string) =>
    h.div.class("grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4 border-t border-rule py-3").children(
      h.dt.class("caps text-[10px] text-mute").children(label),
      h.dd.class("num text-right text-xs text-ink").children(value)
    )
  return h.section
    .class("flex flex-col gap-3 border-b border-rule px-5 py-6 sm:px-10 lg:border-b-0 lg:px-8")
    .attr("aria-labelledby", h.id("sheet-heading"))
    .children(
      h.h2.id(h.id("sheet-heading")).class("caps text-xs text-ink").children("Data sheet"),
      h.dl.class("flex flex-col border-b border-rule").children(
        row("Cycle", `${(model.completedFocus % LONG_BREAK_EVERY) + 1} / ${LONG_BREAK_EVERY}`),
        row(
          "Today",
          `${summary.todaySessions} session${summary.todaySessions === 1 ? "" : "s"} · ${
            formatMinutes(summary.todayMinutes)
          }`
        ),
        row("Active days", `${summary.activeDays} / ${FocusLog.DAYS}`),
        row(active === undefined ? "Active task" : catalogNo(active.id), estimateLeft(active))
      )
    )
}

const StatField = <M>(h: Html.H<M>, label: string, value: string) =>
  h.div.class("flex flex-col gap-1 border-l border-rule px-3 py-3 sm:px-6").children(
    h.dt.class("caps text-[10px] text-mute").children(label),
    h.dd.class("num text-sm text-ink").children(value)
  )

export const AppNoDeps = Html.component({
  name: "App",
  props: AppProps,
  model: AppModel,
  message: AppMessage
}).make({
  // `initialState` is a seed: later changes to the prop don't reach the Model.
  init: ($) => ({ ...$.props.initialState, saveError: null, now: $.props.initialNow }),

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

    FinishedTimer: ($, { phase, minutes, endedAt }) => {
      if (phase !== "Focus") return $.model
      const active = activeTask($.model)
      const credited = active === undefined || active.done ? undefined : active
      const next: AppModel = {
        ...$.model,
        completedFocus: $.model.completedFocus + 1,
        focusMinutes: $.model.focusMinutes + minutes,
        tasks: credited === undefined
          ? $.model.tasks
          : mapTask($.model.tasks, credited.id, (task) => ({ ...task, pomodoros: task.pomodoros + 1 })),
        // Keep the newest sessions; the log only ever draws two weeks.
        sessions: [...$.model.sessions, { endedAt, minutes, taskId: credited?.id ?? null }].slice(-MAX_SESSIONS),
        now: Math.max($.model.now, endedAt)
      }
      return $.set(next).run(save(next))
    },

    TickedMinute: ($, { now }) => $.evolve({ now }),

    FailedSaveState: ($, { error }) => $.evolve({ saveError: error })
  },

  subscriptions: () => [
    Subscription.make(
      "minute",
      Stream.tick(MINUTE_TICK).pipe(
        Stream.mapEffect(() => Clock.currentTimeMillis),
        Stream.map((now) => AppMessage.TickedMinute({ now }))
      )
    )
  ],

  view: (h, model) => {
    const active = activeTask(model)
    const tasks = Task.sorted(model.tasks)
    const openCount = model.tasks.filter((task) => !task.done).length
    const doneCount = model.tasks.length - openCount

    return h.div.class("flex min-h-screen flex-col").children(
      h.header.class("flex flex-wrap items-stretch justify-between border-b border-rule").children(
        h.h1.class("wide caps flex items-center py-3 pl-5 pr-3 text-sm font-semibold tracking-[0.32em] sm:px-10").children(
          "Tempo"
        ),
        h.dl.class("flex").attr("aria-label", "Totals").children(
          StatField(h, "Sessions", String(model.completedFocus)),
          StatField(h, "Focused", formatMinutes(model.focusMinutes)),
          StatField(h, "Open", String(openCount))
        )
      ),

      model.saveError !== null &&
        h.p
          .class("flex items-center gap-3 border-b border-rule px-5 py-3 text-sm text-long sm:px-10")
          .attr("role", "alert")
          .children(
            h.span.class("size-2 shrink-0 bg-long").attr("aria-hidden", "true"),
            `Couldn't save your changes: ${model.saveError}`
          ),

      h.main.class("grid flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] lg:grid-rows-[auto_1fr]").children(
        h.div.class("lg:col-start-1 lg:row-start-1 lg:border-r lg:border-rule").children(
          Timer(h, {
            props: {
              completedFocus: model.completedFocus,
              taskTitle: active?.title ?? null,
              catalogNo: active === undefined ? null : catalogNo(active.id),
              openTasks: openCount
            },
            onEmit: {
              Finished: ({ phase, minutes, endedAt }) => AppMessage.FinishedTimer({ phase, minutes, endedAt })
            }
          })
        ),

        h.div.class("flex flex-col lg:col-start-2 lg:row-span-2 lg:row-start-1").children(
          h.section
            .class("flex flex-col gap-6 border-b border-rule px-5 py-6 sm:px-10 sm:py-8 lg:border-b-0 lg:px-8")
            .attr("aria-labelledby", h.id("catalog-heading"))
            .children(
              h.div.class("flex items-baseline justify-between gap-3").children(
                h.h2.id(h.id("catalog-heading")).class("caps text-xs text-ink").children("Catalog"),
                h.p.class("num text-[11px] text-mute").children(`${String(openCount).padStart(2, "0")} open`)
              ),
              NewTaskForm(h, {
                onEmit: {
                  Submitted: ({ title, estimate }) => AppMessage.SubmittedNewTask({ title, estimate })
                }
              }),
              tasks.length === 0
                ? h.p.class("border border-rule px-4 py-8 text-sm leading-relaxed text-mute").children(
                  "Nothing catalogued yet. Add a task, then press Start. Each one gets a number, and the timer credits whichever is active."
                )
                : h.ul.class("flex flex-col").attr("aria-label", "Tasks").children(
                  tasks.map((task) => TaskRow(h, task, task.id === model.activeTaskId))
                ),
              doneCount > 0 &&
                Button(h, { onPress: AppMessage.ClickedClearCompleted() })
                  .class(
                    "caps self-start text-[11px] text-mute underline-offset-4 transition-colors duration-150 cursor-pointer hover:text-ink hover:underline"
                  )
                  .children(`Clear ${doneCount} done`)
            ),
          DataSheet(h, model, active)
        ),

        h.div.class("lg:col-start-1 lg:row-start-2 lg:border-r lg:border-rule").children(
          FocusLogPlot(h, { now: model.now, sessions: model.sessions })
        )
      )
    )
  }
})

export const App = AppNoDeps.pipe(Component.provide(SaveState.layer))
