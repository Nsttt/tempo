---
name: Tempo
description: A focus timer and task catalog set like a Factory Records sleeve.
colors:
  ground: "#0b0b0a"
  rule: "#262623"
  dim: "#3a3a36"
  mute: "#8f8f88"
  ink: "#f1f0ea"
  focus: "#e5322d"
  short: "#3f6ee6"
  short-text: "#7a9cf2"
  long: "#e8b21c"
typography:
  countdown:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "9rem"
    fontWeight: 300
    lineHeight: 0.8
    letterSpacing: "-0.03em"
    fontVariation: "'wdth' 125"
    fontFeature: "'tnum' 1"
  catalog-mark:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 300
    lineHeight: 1
    letterSpacing: "0.04em"
    fontVariation: "'wdth' 125"
  wordmark:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    letterSpacing: "0.32em"
    fontVariation: "'wdth' 125"
  title:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    letterSpacing: "0.18em"
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 400
    letterSpacing: "0.18em"
  numeric:
    fontFamily: "Martian Mono, ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 400
    fontFeature: "'tnum' 1"
rounded:
  none: "0px"
spacing:
  block-gap: "3px"
  xs: "8px"
  sm: "16px"
  md: "20px"
  lg: "24px"
  gutter-phone: "20px"
  gutter-desk: "40px"
  gutter-column: "32px"
components:
  button-primary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
    height: "48px"
  button-primary-hover:
    backgroundColor: "rgba(241, 240, 234, 0.1)"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
    padding: "0 20px"
    height: "48px"
  button-secondary-disabled:
    textColor: "{colors.mute}"
  button-add:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
    padding: "0 20px"
    height: "48px"
  button-add-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
  phase-tab:
    backgroundColor: "transparent"
    textColor: "{colors.mute}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "40px"
  phase-tab-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
  estimate-cell:
    backgroundColor: "transparent"
    textColor: "{colors.mute}"
    typography: "{typography.numeric}"
    rounded: "{rounded.none}"
    size: "32px"
  estimate-cell-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
  input-text:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "48px"
  task-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "12px"
  checkbox:
    backgroundColor: "transparent"
    rounded: "{rounded.none}"
    size: "20px"
  checkbox-checked:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
---

# Design System: Tempo

## Overview

**Creative North Star: "The Catalog Sleeve"**

Tempo is set like a Factory Records sleeve in Peter Saville's manner: your focus is the record, each task carries a catalog number (TMP 01), and finished sessions are drawn as a stacked pulse plot, one hairline per day, that owns the lower half of the screen. The ground is matte black, structure comes only from 1px graphite rules, and every corner is square. The type does the dramatic work: a wide, light grotesk countdown large enough to read from across a desk, tracked engraved capitals for every label, and a monospace voice reserved for times, counts and catalog numbers.

Colour is an industrial code, not decoration. Red, blue and yellow each belong to a timer phase and appear only where they report state: the phase swatch, the current minute block, the primary button's end block, the running indicator, the active task. Everything else is white ink and graphite. The screen is dense but quiet, a working instrument rather than a dashboard of cards.

Motion is minimal and functional: 150ms colour transitions for state, no entrance choreography. The one signature moment is the focus log, where a finished session's pulse rises on today's line.

**Key Characteristics:**
- Matte black ground, white ink, 1px graphite rules, no fills or shadows for structure.
- Square corners everywhere; outlined controls.
- Factory code colours (red, blue, yellow) carry phase and state only.
- Wide light grotesk for the countdown, catalog mark and wordmark; tracked caps for labels; Martian Mono for numbers.
- Block readouts: one square per minute, one square per session.
- The focus log ridgeline as the signature data surface.

## Colors

A near-black sleeve with a stepped graphite ramp and three factory code colours held in reserve for state.

### Primary
- **Factory Red** (focus): the Focus phase and the generic "active" signal. Used for the Focus swatch, the current minute block while in Focus, the primary button's end block, the Running indicator, the active task's outline and catalog number, the large catalog mark in the timer, the "now" tick in the focus log, sessions run past an estimate, form errors, and the text caret.

### Secondary
- **Factory Blue** (short): Short break fills (swatch, current minute block, end block).
- **Signal Blue Text** (short-text): the lighter tone of Factory Blue used whenever the Short break colour is set as text, because the fill tone is too dark to read as small type on the ground.

### Tertiary
- **Factory Yellow** (long): Long break fills and text, and the save-error alert line (yellow square plus yellow text).

### Neutral
- **Matte Black** (ground): page background, the html and body ground, the fill under each focus-log line, and the text colour on inverted (ink-filled) controls.
- **Graphite Rule** (rule): every structural 1px rule: header and section dividers, column rule, panel outlines, task row borders, data-sheet rows, idle minute blocks.
- **Dim Graphite** (dim): control outlines at rest (secondary buttons, input, estimate cells, checkboxes, kbd keys), empty session squares, idle status dot, strike-through decoration, scrollbar thumb.
- **Muted Ink** (mute): labels, secondary text, placeholders, inactive phase tabs, past days' lines in the focus log, disabled button text, finished sessions on done tasks.
- **Sleeve White** (ink): primary text, the countdown, hover borders, selected-control fills, spent minute blocks, worked session squares, today's line in the focus log, focus outline, selection background.

### Named Rules
**The Code Colour Rule.** Red, blue and yellow report state and nothing else. Each phase owns one colour, applied as a fill for blocks and a text tone for words. If an element is not telling the user about a phase, an active selection, an overrun or an error, it is ink or graphite.

**The Readable Code Rule.** A code colour set as small text must clear contrast on the ground; when the fill tone cannot (blue), add a lighter text tone rather than dimming the meaning.

## Typography

**Display Font:** Archivo at 125% width (with ui-sans-serif, system-ui)
**Body Font:** Archivo at regular width (same stack)
**Label/Mono Font:** Martian Mono (with ui-monospace), weights 400 and 500 loaded

**Character:** A wide, light grotesk set very large against tracked engraved capitals: the countdown is the sleeve's image, the caps are its printed credits. The monospace keeps every number column-true.

### Hierarchy
- **Countdown** (300, 5.5rem phone / 9rem from 640px / 10.5rem from 1280px, line-height 0.8, -0.03em, 125% width, tabular): the remaining time. One per screen.
- **Catalog Mark** (300, 1.875rem phone / 3rem desk, line-height 1, 0.04em, 125% width): the active task's catalog number under the readout, in Factory Red.
- **Wordmark** (600, 0.875rem, 0.32em, caps, 125% width): TEMPO in the header only.
- **Title** (400, 0.75rem, 0.18em, caps): section headings (Catalog, Focus log, Data sheet) and button labels.
- **Body** (400, 0.875rem, line-height 1.625): task titles, input text, empty-state copy, the alert line; figure captions drop to 0.75rem.
- **Label** (400, 0.625rem to 0.6875rem, 0.18em, caps, muted): field names, phase tabs, status, shortcut legend, estimate label.
- **Numeric** (Martian Mono 400, 0.625rem to 0.875rem, tabular): header totals, data-sheet values, catalog numbers in rows, counts, hour axis, kbd keys.

### Named Rules
**The Engraved Caps Rule.** Every label is uppercase with 0.18em tracking. Sentence case is for content the user wrote and for explanatory copy only.

**The Mono for Numbers Rule.** Times, counts and catalog numbers are Martian Mono with tabular figures; the countdown alone is Archivo wide, also tabular.

## Layout

A ruled sheet. On desktop (from 1024px) the main area is a two-column grid: a fluid left column (timer panel over focus log) and a fixed 420px right column (catalog over data sheet), divided by a single 1px graphite rule. The header is a hairline band: wordmark left, a row of field-and-value pairs right, each pair separated by a left rule.

Sections are separated by rules, never by gaps or cards. Horizontal gutters are 20px on phones, 40px from 640px, and 32px in the 420px right column; section padding is 24px vertical (28-32px for the timer and catalog on larger screens). Inside sections the rhythm is 8 / 16 / 20 / 24px; block readouts use a tight 3px gap.

Below 1024px everything stacks in one column in source order: timer, catalog, data sheet, focus log. Phase tabs shorten to one word under 640px, the keyboard legend hides, and the three timer buttons share one grid row with Start filling the remainder.

## Elevation & Depth

Flat. There are no shadows anywhere. Depth exists in exactly one place: the focus log, where fourteen day-lines stack back to front and each line's area is filled with the ground colour, so a nearer day's pulses occlude the ones behind like stacked paper. Selected states invert (ink fill, ground text) rather than lift; the active task row raises its z-index only so its red outline sits over neighbouring rules.

### Named Rules
**The Ruled Sheet Rule.** Structure is drawn with 1px graphite rules and outlines, never with shadows, tinted panels or gaps between cards.

## Shapes

Square corners throughout (0px). Controls are outlined rectangles; adjacent outlined cells (estimate cells, task rows) overlap by 1px so shared edges stay a single hairline. Small solid squares are the recurring mark: 10px phase swatches, 8px status dots, 10px session squares, the 16px coloured end block on the primary button, and flex minute blocks 12px tall. Icons are inline SVG with square line caps at 1.5px stroke, or solid 16px glyphs for play and pause.

## Components

### Buttons
Outlined, square, labelled in tracked caps.
- **Shape:** square (0px), 48px tall.
- **Primary (Start / Pause / Resume):** ink outline, transparent fill, play or pause glyph plus label, minimum 176px wide on desktop, and a 16px end block filled with the current phase's code colour on the right edge. Hover lays a 10% ink wash.
- **Secondary (Reset, Skip):** dim outline, ink label, 20px side padding. Hover turns the outline ink. Disabled drops to a graphite outline and muted label.
- **Add:** ink outline butted against the input (-1px overlap); hover inverts to an ink fill with ground text.
- **Text action (Clear done):** caps label in muted ink; hover turns it ink and underlines.
- **Focus:** every control shows a 1px ink outline at 3px offset on keyboard focus.

### Phase Tabs
A segmented strip inside one graphite outline. Each 40px tab carries a 10px code-colour swatch and a caps label in muted ink; hover lifts the label to ink; the selected tab inverts to an ink fill with ground text, swatch kept.

### Inputs / Fields
- **Style:** 48px, dim 1px outline, transparent fill, 16px side padding, body type, muted placeholder.
- **Focus:** outline turns ink; the browser ring is suppressed in favour of that border shift. The caret is Factory Red.
- **Error:** outline turns Factory Red, with a 0.75rem red message below.

### Estimate Cells
A row of five 32px square cells in Martian Mono, sharing hairline edges. Unselected cells are dim-outlined with muted numerals; the selected cell inverts to ink fill and ground text.

### Task Rows (Catalog)
A ruled list of rows with 12px padding and shared 1px edges: checkbox, then catalog number (mono, muted) and title (body, ink) with a session strip beneath, then an always-visible delete cross. The active row's outline and catalog number turn Factory Red. Done rows mute the title with a dim strike-through. Hovering an open row underlines its title. Checkboxes are 20px squares, dim outline, inverting to ink with a ground check when done.

### Session Strip and Minute Readout
Block readouts are the system's progress language instead of rings or bars. The session strip is one 10px square per estimated session: empty squares are dim outlines, worked ones ink (muted once the task is done), sessions past the estimate red. The minute readout spans the timer panel's width with one 12px-tall block per minute of the phase: spent minutes ink, the current minute in the phase's code colour, the rest graphite; blocks change colour over 150ms.

### Data Sheet and Header Totals
Field-and-value pairs: caps label in muted ink, value in Martian Mono ink. In the data sheet each pair is a row between graphite rules with the value right-aligned; in the header each pair stacks inside a left-ruled cell.

### Focus Log
The signature surface. Fourteen day-lines plotted across a 00-24 hour axis, oldest at the back, each 1px muted stroke over a ground-coloured fill; today's line is in front at 1.75px ink. Each finished session draws as a jagged pulse at the hour it ran. A 1px Factory Red tick marks "now" on today's baseline. The hour axis and caption sit below in mono and 0.75rem muted body. When a session finishes, today's line reshapes and the pulse rises with a 600ms transition on the path's `d` property (cubic-bezier(0.16, 1, 0.3, 1)); reduced-motion users get no transition. Safari does not support transitioning CSS `d`, so there the pulse appears in place without the rise.

### Keyboard Legend
Below the timer: muted caps hints with Martian Mono key caps in a dim 1px outline (Space, R, S). Hidden on phones.

## Do's and Don'ts

### Do:
- **Do** draw structure with 1px graphite (rule) lines and outlines, and keep every corner square (0px).
- **Do** reserve Factory Red, Blue and Yellow for phase and state; use the short-text tone whenever the Short break colour is set as text.
- **Do** set labels in uppercase Archivo with 0.18em tracking, and every time, count or catalog number in Martian Mono with tabular figures.
- **Do** show progress as rows of small solid squares with a 3px gap: spent in ink, current in the phase colour, remaining in graphite.
- **Do** invert selected controls to an ink fill with ground text instead of tinting them.
- **Do** keep state transitions to 150ms colour changes, and honour reduced motion.
- **Do** give every catalogued item a number in the TMP 01 form.

### Don't:
- **Don't** add shadows, glows or tinted card panels; the only depth is the focus log's stacked lines.
- **Don't** round corners or use pill shapes.
- **Don't** use a code colour as decoration, background tint or brand accent where no state is being reported.
- **Don't** replace the block readouts with a progress ring or a smooth progress bar.
- **Don't** add entrance choreography; the pulse rising in the focus log is the one motion moment.
