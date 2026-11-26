import {
  durationMs,
  formatClock,
  nextPhase,
  Phase,
  PHASE_LABEL,
  PHASES,
  untilLongBreak
} from "#domain/Phase"
import { Command, Component, Head, Subscription, UiSchema } from "@effect/ui"
import { Button, makeToggleGroup } from "@effect/ui-kit"
import { Html, HtmlSubscription } from "@effect/ui/html"
import { Clock, Duration, Effect, Schema, Stream } from "effect"
import { Chime } from "../services/Chime.ts"

export const TimerStatus = Schema.Literals(["Idle", "Running", "Paused"])
export type TimerStatus = typeof TimerStatus.Type

export const TimerProps = Schema.Struct({
  /** Finished focus sessions so far, which decides short or long breaks. */
  completedFocus: Schema.Number,
  taskTitle: Schema.NullOr(Schema.String)
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
  /** A phase ran to zero. Skipped phases don't report. */
  Finished: { phase: Phase, minutes: Schema.Number }
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

const ACCENT: Record<Phase, { readonly stroke: string; readonly text: string; readonly button: string }> = {
  Focus: {
    stroke: "#fb7185",
    text: "text-rose-300",
    button: "bg-rose-400 text-stone-950 enabled:hover:bg-rose-300"
  },
  ShortBreak: {
    stroke: "#34d399",
    text: "text-emerald-300",
    button: "bg-emerald-400 text-stone-950 enabled:hover:bg-emerald-300"
  },
  LongBreak: {
    stroke: "#38bdf8",
    text: "text-sky-300",
    button: "bg-sky-400 text-stone-950 enabled:hover:bg-sky-300"
  }
}

const SHORTCUTS = [" ", "r", "s"].map((key) => ({
  key,
  message: TimerMessage.PressedKey({ key })
}))

const Ring = <M>(h: Html.H<M>, model: TimerModel) => {
  const radius = 140
  const circumference = 2 * Math.PI * radius
  const elapsed = 1 - model.remainingMs / durationMs(model.phase)
  return h.svg
    .class("absolute inset-0 size-full -rotate-90")
    .attrs({ viewBox: "0 0 320 320", "aria-hidden": "true" })
    .children(
      h.circle.attrs({
        cx: "160",
        cy: "160",
        r: String(radius),
        fill: "none",
        stroke: "rgb(255 255 255 / 0.07)",
        "stroke-width": "10"
      }),
      h.circle.class("ring-arc").attrs({
        cx: "160",
        cy: "160",
        r: String(radius),
        fill: "none",
        stroke: ACCENT[model.phase].stroke,
        "stroke-width": "10",
        "stroke-linecap": "round",
        "stroke-dasharray": String(circumference),
        "stroke-dashoffset": String(circumference * (1 - elapsed))
      })
    )
}

const STATUS_TEXT: Record<TimerStatus, string> = {
  Idle: "Ready",
  Running: "Running",
  Paused: "Paused"
}

const SECONDARY_BUTTON =
  "rounded-full border border-white/10 px-4 py-2 text-sm text-stone-300 transition cursor-pointer enabled:hover:border-white/25 enabled:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"

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
        .emit(TimerEvents.Finished({ phase: finished, minutes: durationMs(finished) / 60_000 }))
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
    const accent = ACCENT[model.phase]
    const running = model.status === "Running"
    const untouched = model.status === "Idle" && model.remainingMs === durationMs(model.phase)
    const breaksLeft = untilLongBreak(props.completedFocus)

    return h.section
      .class(
        "relative flex flex-col items-center gap-8 rounded-3xl border border-white/5 bg-stone-900/60 px-6 py-8 sm:px-10 sm:py-10"
      )
      .attr("aria-label", "Timer")
      .children(
        PhaseToggleGroup(h, {
          props: { value: [model.phase], items: phaseItems },
          onEmit: ({ value }) => TimerMessage.ToggledPhase({ value }),
          view: (toggleGroup) =>
            toggleGroup
              .root(h.div.class("flex gap-1 rounded-full bg-black/30 p-1").attr("aria-label", "Phase"))
              .children(
                PHASES.map((value) =>
                  toggleGroup
                    .item({
                      element: h.button.class(
                        "rounded-full px-3.5 py-1.5 text-sm text-stone-400 transition cursor-pointer hover:text-stone-100",
                        "aria-pressed:bg-white/10 aria-pressed:text-white"
                      ),
                      value
                    })
                    .children(PHASE_LABEL[value])
                )
              )
        }),

        h.div.class("relative grid size-72 place-items-center sm:size-80").children(
          Ring(h, model),
          h.div.class("relative flex flex-col items-center gap-1").children(
            h.p
              .class("font-mono text-6xl font-semibold tabular-nums tracking-tight sm:text-7xl")
              .attr("role", "timer")
              .attr("aria-label", `${formatClock(model.remainingMs)} left`)
              .children(formatClock(model.remainingMs)),
            h.p.class("text-xs uppercase tracking-[0.2em]", accent.text).children(
              `${PHASE_LABEL[model.phase]} · ${STATUS_TEXT[model.status]}`
            )
          )
        ),

        h.p.class("min-h-6 max-w-xs truncate text-center text-stone-300").children(
          model.phase === "Focus"
            ? props.taskTitle === null
              ? h.span.class("text-stone-500").children("Pick a task to focus on")
              : h.span.children(h.span.class("text-stone-500").children("Focusing on "), props.taskTitle)
            : h.span.class("text-stone-400").children("Step away, breathe, stretch.")
        ),

        h.div.class("flex items-center gap-3").children(
          Button(h, { props: { disabled: untouched }, onPress: TimerMessage.ClickedReset() })
            .class(SECONDARY_BUTTON)
            .children("Reset"),
          Button(h, { onPress: running ? TimerMessage.ClickedPause() : TimerMessage.ClickedStart() })
            .class(
              "min-w-32 rounded-full px-8 py-3 text-base font-semibold shadow-lg shadow-black/30 transition cursor-pointer",
              accent.button
            )
            .children(running ? "Pause" : model.status === "Paused" ? "Resume" : "Start"),
          Button(h, { onPress: TimerMessage.ClickedSkip() })
            .class(SECONDARY_BUTTON)
            .children("Skip")
        ),

        h.p.class("text-xs text-stone-500").children(
          breaksLeft === 1 ? "Long break after this session" : `Long break in ${breaksLeft} sessions`,
          " · ",
          h.kbd.class("font-mono text-stone-400").children("Space"),
          " start/pause · ",
          h.kbd.class("font-mono text-stone-400").children("R"),
          " reset · ",
          h.kbd.class("font-mono text-stone-400").children("S"),
          " skip"
        )
      )
  }
})

export const Timer = TimerNoDeps.pipe(Component.provide(PlayChime.layer))
