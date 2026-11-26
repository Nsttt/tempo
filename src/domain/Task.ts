import { Schema } from "effect"

export const Task = Schema.Struct({
  id: Schema.String,
  title: Schema.String,
  /** How many focus sessions the user expects the task to take. */
  estimate: Schema.Number,
  /** Focus sessions finished while this task was active. */
  pomodoros: Schema.Number,
  done: Schema.Boolean
})
export type Task = typeof Task.Type

export const ESTIMATES = ["1", "2", "3", "4", "5"] as const

export const make = (id: string, title: string, estimate: number): Task => ({
  id,
  title: title.trim(),
  estimate,
  pomodoros: 0,
  done: false
})

export const isOverEstimate = (task: Task): boolean => task.pomodoros > task.estimate

/** Open tasks first, keeping each group's insertion order. */
export const sorted = (tasks: ReadonlyArray<Task>): ReadonlyArray<Task> => [
  ...tasks.filter((task) => !task.done),
  ...tasks.filter((task) => task.done)
]
