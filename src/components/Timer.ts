import {
  durationMs,
  formatClock,
  nextPhase,
  Phase,
  PHASE_LABEL,
  PHASE_MINUTES,
  PHASES,
  untilLongBreak
} from "#domain/Phase"
import { Command, Component, Head, Subscription, UiSchema } from "@effect/ui"
import { Button, makeToggleGroup } from "@effect/ui-kit"
import { Html, HtmlSubscription } from "@effect/ui/html"
import { Array, Clock, Duration, Effect, Schema, Stream } from "effect"
import { Chime } from "../services/Chime.ts"

export const TimerStatus = Schema.Literals(["Idle", "Running", "Paused"])
export type TimerStatus = typeof TimerStatus.Type

export const TimerProps = Schema.Struct({
  /** Finished focus sessions so far, which decides short or long breaks. */
  completedFocus: Schema.Number,
  taskTitle: Schema.NullOr(Schema.String),
  catalogNo: Schema.NullOr(Schema.String),
  /** Open tasks in the catalog, so the no-task line can say what to do. */
  openTasks: Schema.Number
})

export const TimerModel = Schema.Struct({
  phase: Phase,
  status: TimerStatus,
  remainingMs: Schema.Number,
  /**
   * Wall-clock time of the last tick. Elapsed time is measured between
   * ticks, so a throttled background tab still counts down correctly.
   */
  lastTickAt: Schema.NullOr(Schema.Number)
})
export type TimerModel = typeof TimerModel.Type

export const TimerMessage = UiSchema.TaggedEnum({
  ClickedStart: {},
  ClickedPause: {},
  ClickedReset: {},
  ClickedSkip: {},
  PressedKey: { key: Schema.String },
  ToggledPhase: { value: Schema.Array(Phase) },
  Ticked: { now: Schema.Number }
})
export type TimerMessage = typeof TimerMessage.Type

export const TimerEvents = UiSchema.TaggedEnum({
  /** A phase ran to zero at `endedAt`. Skipped phases don't report. */
  Finished: { phase: Phase, minutes: Schema.Number, endedAt: Schema.Number }
})

export class PlayChime extends Command.Service<PlayChime>()(
  "timer/PlayChime",
  { args: { tone: Schema.Literals(["focus", "break"]) }, success: Component.Noop }
) {
  static readonly layer = this.toLayer(
    Chime.useSync((chime) => ({ tone }) => chime.play(tone).pipe(Effect.as(Component.noop)))
  )
}

const TICK = Duration.millis(250)

const PhaseToggleGroup = makeToggleGroup({ value: Phase })
const phaseItems = PHASES.map((value) => ({ value }))

const fresh = (phase: Phase): TimerModel => ({
  phase,
  status: "Idle",
  remainingMs: durationMs(phase),
  lastTickAt: null
})

const start = (model: TimerModel): TimerModel =>
  model.status === "Running" ? model : { ...model, status: "Running", lastTickAt: null }

const pause = (model: TimerModel): TimerModel =>
  model.status === "Running" ? { ...model, status: "Paused", lastTickAt: null } : model

const toggle = (model: TimerModel): TimerModel =>
  model.status === "Running" ? pause(model) : start(model)

/** Skipping moves on without credit: focus goes to a short break, a break back to focus. */
const skip = (model: TimerModel): TimerModel =>
  fresh(model.phase === "Focus" ? "ShortBreak" : "Focus")

/** Each phase owns one Factory code colour: a fill for blocks, a text tone for words. */
const CODE: Record<Phase, { readonly fill: string; readonly text: string }> = {
  Focus: { fill: "bg-focus", text: "text-focus" },
  ShortBreak: { fill: "bg-short", text: "text-short-text" },
  LongBreak: { fill: "bg-long", text: "text-long" }
}

const SHORTCUTS = [" ", "r", "s"].map((key) => ({
  key,
  message: TimerMessage.PressedKey({ key })
}))

const SHORT_LABEL: Record<Phase, string> = { Focus: "Focus", ShortBreak: "Short", LongBreak: "Long" }

const STATUS_TEXT: Record<TimerStatus, string> = {
  Idle: "Ready",
  Running: "Running",
  Paused: "Paused"
}

const Icon = <M>(h: Html.H<M>, d: string) =>
  h.svg
    .class("size-4 shrink-0")
    .attrs({ viewBox: "0 0 16 16", fill: "currentColor", "aria-hidden": "true" })
    .children(h.path.attr("d", d))

const PLAY = "M4 2.5v11l9-5.5z"
const PAUSE = "M4 2.5h3v11H4zM9 2.5h3v11H9z"

/** One block per minute of the phase: spent minutes white, the current one coded. */
const MinuteReadout = <M>(h: Html.H<M>, model: TimerModel) => {
  const total = PHASE_MINUTES[model.phase]
  const elapsedMs = durationMs(model.phase) - model.remainingMs
  const spent = Math.floor(elapsedMs / 60_000)
  const started = model.status !== "Idle" || elapsedMs > 0
  return h.div
    .class("flex h-3 gap-[3px]")
    .attr("aria-hidden", "true")
    .children(
      Array.makeBy(total, (i) =>
        h.span.class(
          "flex-1 transition-colors duration-150",
          i < spent ? "bg-ink" : i === spent && started ? CODE[model.phase].fill : "bg-rule"
        ))
    )
}

const SECONDARY =
  "caps flex h-12 items-center gap-2 border border-dim px-5 text-xs text-ink transition-colors duration-150 cursor-pointer enabled:hover:border-ink disabled:cursor-not-allowed disabled:text-mute disabled:border-rule"

export const TimerNoDeps = Html.component({
  name: "Timer",
  props: TimerProps,
  model: TimerModel,
  message: TimerMessage,
  events: TimerEvents,
  // After Back or a reload the clock should not claim to be running.
  restore: (model) => (model.status === "Running" ? pause(model) : model)
}).make({
  init: () => fresh("Focus"),

  update: {
    ClickedStart: ($) => start($.model),
    ClickedPause: ($) => pause($.model),
    ClickedReset: ($) => fresh($.model.phase),
    ClickedSkip: ($) => skip($.model),

    PressedKey: ($, { key }) =>
      key === " " ? toggle($.model) : key === "r" ? fresh($.model.phase) : key === "s" ? skip($.model) : $.model,

    ToggledPhase: ($, { value }) => {
      // Pressing the current phase again releases it; keep it selected.
      const [phase] = value
      return phase === undefined || phase === $.model.phase ? $.model : fresh(phase)
    },

    Ticked: ($, { now }) => {
      const model = $.model
      if (model.status !== "Running") return model
      if (model.lastTickAt === null) return { ...model, lastTickAt: now }

      const remainingMs = model.remainingMs - Math.max(0, now - model.lastTickAt)
      if (remainingMs > 0) return { ...model, remainingMs, lastTickAt: now }

      const finished = model.phase
      const completedFocus = $.props.completedFocus + (finished === "Focus" ? 1 : 0)
      return $.set(fresh(nextPhase(finished, completedFocus)))
        .emit(TimerEvents.Finished({ phase: finished, minutes: PHASE_MINUTES[finished], endedAt: now }))
        .run(PlayChime.make({ tone: finished === "Focus" ? "focus" : "break" }))
    }
  },

  subscriptions: ({ model }) => [
    model.status === "Running" &&
    Subscription.make(
      "clock",
      Stream.tick(TICK).pipe(
        Stream.mapEffect(() => Clock.currentTimeMillis),
        Stream.map((now) => TimerMessage.Ticked({ now }))
      )
    ),
    HtmlSubscription.shortcuts(SHORTCUTS)
  ],

  head: ({ model }) =>
    model.status === "Idle"
      ? [Head.title("Tempo")]
      : [Head.title(`${formatClock(model.remainingMs)} · ${PHASE_LABEL[model.phase]} — Tempo`)],

  view: (h, model) => {
    const props = h.props
    const code = CODE[model.phase]
    const running = model.status === "Running"
    const untouched = model.status === "Idle" && model.remainingMs === durationMs(model.phase)
    const breaksLeft = untilLongBreak(props.completedFocus)

    return h.section
      .class("flex flex-col gap-5 border-b border-rule px-5 py-6 sm:px-10 sm:py-7")
      .attr("aria-label", "Timer")
      .children(
        h.div.class("flex flex-wrap items-center justify-between gap-4").children(
          PhaseToggleGroup(h, {
            props: { value: [model.phase], items: phaseItems },
            onEmit: ({ value }) => TimerMessage.ToggledPhase({ value }),
            view: (toggleGroup) =>
              toggleGroup
                .root(h.div.class("flex border border-rule").attr("aria-label", "Phase"))
                .children(
                  PHASES.map((value) =>
                    toggleGroup
                      .item({
                        element: h.button.class(
                          "caps flex h-10 items-center gap-2.5 whitespace-nowrap px-3 text-[11px] text-mute transition-colors duration-150 cursor-pointer sm:px-4",
                          "hover:text-ink aria-pressed:bg-ink aria-pressed:text-ground"
                        ),
                        value
                      })
                      .children(
                        h.span.class("size-2.5 shrink-0", CODE[value].fill).attr("aria-hidden", "true"),
                        // Phones get the one-word name so the toggle stays on one row.
                        h.span.class("sm:hidden").attr("aria-hidden", "true").children(SHORT_LABEL[value]),
                        h.span.class("max-sm:sr-only").children(PHASE_LABEL[value])
                      )
                  )
                )
          }),
          h.p.class("caps flex items-center gap-2.5 text-[11px]", running ? code.text : "text-mute").children(
            h.span.class("size-2", running ? code.fill : "bg-dim").attr("aria-hidden", "true"),
            STATUS_TEXT[model.status]
          )
        ),

        h.p
          .class(
            "wide font-light leading-[0.8] tracking-[-0.03em] tabular-nums text-[5.5rem] sm:text-[9rem] xl:text-[10.5rem]"
          )
          .attr("role", "timer")
          .attr("aria-label", `${formatClock(model.remainingMs)} left in ${PHASE_LABEL[model.phase]}`)
          .children(formatClock(model.remainingMs)),

        MinuteReadout(h, model),

        h.div.class("flex flex-wrap items-end justify-between gap-6").children(
          h.div.class("min-w-0 max-w-xl").children(
            model.phase !== "Focus"
              ? h.p.class("caps text-sm text-mute").children("Break. Step away from the screen.")
              : props.taskTitle === null
              ? h.p.class("caps text-sm text-mute").children(
                props.openTasks === 0 ? "No task. Add one to the catalog." : "No task. Pick one from the catalog."
              )
              : h.p.class("flex min-w-0 flex-col gap-2").children(
                // The catalog mark, set like the number on a sleeve.
                h.span.class("wide font-light leading-none tracking-[0.04em] text-3xl text-focus sm:text-5xl")
                  .children(props.catalogNo ?? ""),
                h.span.class("caps truncate text-sm text-ink").children(props.taskTitle)
              )
          ),
          h.div.class("grid w-full grid-cols-[auto_auto_minmax(0,1fr)] gap-2 sm:flex sm:w-auto sm:items-center").children(
            Button(h, { props: { disabled: untouched }, onPress: TimerMessage.ClickedReset() })
              .class(SECONDARY)
              .children("Reset"),
            Button(h, { onPress: TimerMessage.ClickedSkip() })
              .class(SECONDARY)
              .children("Skip"),
            Button(h, { onPress: running ? TimerMessage.ClickedPause() : TimerMessage.ClickedStart() })
              .class(
                "caps flex h-12 items-stretch border border-ink sm:min-w-44 text-xs text-ink transition-colors duration-150 cursor-pointer hover:bg-ink/10"
              )
              .children(
                h.span.class("flex flex-1 items-center gap-3 px-5").children(
                  Icon(h, running ? PAUSE : PLAY),
                  running ? "Pause" : model.status === "Paused" ? "Resume" : "Start"
                ),
                h.span.class("w-4", code.fill).attr("aria-hidden", "true")
              )
          )
        ),

        h.p.class("caps flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] text-mute").children(
          h.span.children(
            breaksLeft === 1 ? "Long break after this session" : `Long break in ${breaksLeft} sessions`
          ),
          h.span.class("hidden items-center gap-2 sm:flex").children(
            h.kbd.class("num border border-dim px-1.5 py-0.5 text-[10px] normal-case tracking-normal text-ink")
              .children("Space"),
            "Start / pause"
          ),
          h.span.class("hidden items-center gap-2 sm:flex").children(
            h.kbd.class("num border border-dim px-1.5 py-0.5 text-[10px] tracking-normal text-ink").children("R"),
            "Reset"
          ),
          h.span.class("hidden items-center gap-2 sm:flex").children(
            h.kbd.class("num border border-dim px-1.5 py-0.5 text-[10px] tracking-normal text-ink").children("S"),
            "Skip"
          )
        )
      )
  }
})

export const Timer = TimerNoDeps.pipe(Component.provide(PlayChime.layer))
