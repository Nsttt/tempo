# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primarily visitors to tempo.nstlopez.com who come to see what Effect UI (the Effect team's Elm-architecture frontend framework, in public preview) can build. They try the app as a working focus timer for a few minutes, often developers evaluating the framework. A secondary user is anyone who keeps it open as a real pomodoro timer.

## Product Purpose

Tempo is a focus timer paired with a task list: pick one task, focus for 25 minutes, take a break, and every finished session is credited to that task and to lifetime totals. It exists as a public, working example of an Effect UI app. Success is a visitor who uses it for real and leaves thinking the framework produces a finished, distinctive product rather than a demo.

## Positioning

A complete, honest pomodoro tool whose every behavior is a typed Elm-architecture program (pure update functions, Commands, Subscriptions, Story tests). Wall-clock countdown that stays correct in throttled background tabs.

## Operating Context

Used in a browser tab beside other work, often glanced at from a distance. Keyboard-first: Space start/pause, R reset, S skip, ignored while typing. Desktop and phone widths.

## Capabilities and Constraints

- Fixed rhythm: Focus 25 min, Short break 5 min, Long break 15 min; long break after every fourth finished focus session. Skipping gives no credit.
- Tasks: add with a title (required, under 80 characters) and an estimate of 1 to 5 sessions; select one active task; mark done; delete; clear done. The task list stays visible beside the timer, not hidden in a drawer or second screen.
- Stats: lifetime finished sessions, minutes focused, open tasks.
- A chime plays when a phase ends; the tab title shows the running clock.
- No accounts and no sync: everything lives in the browser's localStorage.
- Built with @effect/ui and @effect/ui-kit (headless components) and Tailwind v4; deployed as an assets-only Cloudflare Worker.

## Brand Commitments

Name: Tempo. No other identity assets exist.

## Evidence on Hand

No testimonials, users, or metrics exist; none may be invented. Source is public at github.com/Nsttt/tempo.

## Product Principles

1. The clock and the current task are legible at a glance, from across a desk.
2. It must not look like a template or a generic pomodoro app; it should read as a finished product.
3. Keyboard-first and fast: no decoration that slows a basic action.
4. Honest and local: no accounts, no fabricated social proof.

## Accessibility & Inclusion

Full keyboard operation, visible focus, and readable contrast for the clock and task text.
