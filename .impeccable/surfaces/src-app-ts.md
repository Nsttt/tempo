---
version: 1
slug: "src-app-ts"
primary_target: "src/App.ts"
related_targets: ["src/components/Timer.ts","src/components/NewTaskForm.ts","src/styles.css"]
---

# Tempo main screen

Scope: the single Tempo app screen (timer, focus log, task catalog). Visitor mode: Operate, raised for a public showcase.
Audience: developers visiting tempo.nstlopez.com to see Effect UI; they use it as a real timer for a few minutes. Task: pick a task, start, read time left at a glance.
Constraints: keyboard shortcuts, 25/5/15 rhythm, tasks beside the timer, local-only storage all preserved.

## Direction contract

THESIS: Tempo is a catalog sleeve and your focus is the record: finished sessions are drawn as a stacked pulse plot that owns the field. It refuses the category default of a dark card with a progress ring and a to-do list.

OWN-WORLD: Matte black ground (#0b0b0a), white hairline plot ink, 1px graphite panel rules, square corners, outlined controls. Factory code colours carry state only: red focus and active, blue short break, yellow long break, industrial grey idle. Wide grotesk numerals and tracked engraved caps (Archivo, wide and regular widths); Martian Mono only for times, counts and catalog numbers. Primary button carries a coloured end block.

STORY: The visitor sees a working timer beside their catalog of tasks and a record of past focus. They add a task (catalogued TMP 01), press Start, and read minutes left from across the desk. When a focus session ends, a new pulse rises on today's line of the log.

FIRST VIEWPORT: 1440x900. Hairline header: TEMPO wordmark left; SESSIONS / FOCUSED / OPEN as field-and-value pairs right. Left area (1020px) stacks the timer panel over the focus log. Timer panel: phase tabs with colour blocks, 200px wide-grotesk countdown, a full-width readout with one block per minute, the active task in tracked caps with its catalog number, Start button with phase-coloured end block plus Reset and Skip. Focus log: fourteen stacked day lines across a 00 to 24 hour axis, today in front with a red now tick. Right column (420px): task catalog with add field, estimate blocks, rows of catalog number, title and session strip; active row outlined red.

FORM: Catalog Sleeve challenger (brand-identity-canon-saville-catalog-sleeve), chosen by the user over assigned candidate 3 (Time Card). seed:adac8d0efda5ccbc. Signature interaction: the focus log ridgeline, a new pulse rising on today's line when a session finishes (d transition, 600ms exponential ease-out). Motion grammar: 150 to 200ms ease-out for state changes; no entrance choreography.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
