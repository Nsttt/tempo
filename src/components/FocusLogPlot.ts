import * as FocusLog from "#domain/FocusLog"
import type { FocusSession } from "#domain/Saved"
import { Html } from "@effect/ui/html"

const WIDTH = 1000
const HEIGHT = 400
/** Baseline of the oldest (top) and newest (front) lines. */
const TOP = 96
const BOTTOM = 384
/** Tallest a pulse can rise above its baseline. */
const RISE = 92

const baseline = (index: number) => TOP + (index * (BOTTOM - TOP)) / (FocusLog.DAYS - 1)

const points = (heights: ReadonlyArray<number>, base: number): string => {
  const step = WIDTH / (heights.length - 1)
  return heights
    .map((height, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)} ${(base - height * RISE).toFixed(1)}`)
    .join("")
}

const HOURS = ["00", "06", "12", "18", "24"]

/**
 * Fourteen days of finished focus sessions, one line per day, oldest at the
 * back. Each line's fill is the ground colour, so a nearer day's pulses hide
 * the days behind it the way a stack of paper would.
 */
export const FocusLogPlot = <M>(
  h: Html.H<M>,
  { now, sessions }: { readonly now: number; readonly sessions: ReadonlyArray<FocusSession> }
) => {
  const days = FocusLog.build(sessions, now)
  const recent = days.reduce((total, day) => total + day.sessions, 0)
  const nowX = FocusLog.dayFraction(now) * 100

  return h.section
    .class("flex flex-col gap-4 border-b border-rule px-5 py-6 sm:px-10 lg:border-b-0")
    .attr("aria-labelledby", h.id("log-heading"))
    .children(
      h.div.class("flex flex-wrap items-baseline justify-between gap-3").children(
        h.h2.id(h.id("log-heading")).class("caps text-xs text-ink").children("Focus log"),
        h.p.class("num text-[11px] text-mute").children(
          `${recent} session${recent === 1 ? "" : "s"} · last ${FocusLog.DAYS} days`
        )
      ),
      h.figure.class("flex flex-col gap-3").children(
        h.div.class("relative").children(
          h.svg
            .class("block h-56 w-full sm:h-72 lg:h-80")
            .attrs({
              viewBox: `0 0 ${WIDTH} ${HEIGHT}`,
              preserveAspectRatio: "none",
              role: "img",
              "aria-label": recent === 0
                ? `No focus sessions in the last ${FocusLog.DAYS} days`
                : `${recent} focus sessions across the last ${FocusLog.DAYS} days, today in front`
            })
            .children(
              days.map((day, index) => {
                const base = baseline(index)
                const line = points(day.heights, base)
                const today = index === days.length - 1
                return h.g.key(String(day.dayStart)).children(
                  h.path
                    .class("log-line")
                    .attrs({ d: `${line}L${WIDTH} ${HEIGHT}L0 ${HEIGHT}Z`, fill: "var(--color-ground)" }),
                  h.path
                    .class("log-line")
                    .attrs({
                      d: line,
                      fill: "none",
                      stroke: today ? "var(--color-ink)" : "var(--color-mute)",
                      "stroke-width": today ? "1.75" : "1",
                      "stroke-linejoin": "round",
                      "vector-effect": "non-scaling-stroke"
                    })
                )
              })
            ),
          // The current moment on today's line, in the focus code colour.
          h.span
            .class("pointer-events-none absolute bottom-0 h-5 w-px bg-focus")
            .style({ left: `${nowX.toFixed(2)}%` })
            .attr("aria-hidden", "true")
        ),
        h.div.class("num flex justify-between text-[10px] text-mute").attr("aria-hidden", "true").children(
          HOURS.map((hour) => h.span.children(hour))
        ),
        h.figcaption.class("text-xs leading-relaxed text-mute").children(
          recent === 0
            ? "Finished focus sessions rise here as pulses, one line per day. Today is the bright line in front."
            : "One line per day, oldest at the back. Each pulse is a finished focus session at the hour it ran."
        )
      )
    )
}
