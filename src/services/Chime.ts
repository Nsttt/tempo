import { Context, Effect, Layer } from "effect"

/** Plays a short sound when a phase ends. */
export class Chime extends Context.Service<Chime, {
  readonly play: (tone: "focus" | "break") => Effect.Effect<void>
}>()("tempo/Chime") {
  /**
   * A soft two-note bell drawn with WebAudio, so the app ships no audio
   * files. A browser that blocks audio before a gesture just stays quiet.
   */
  static readonly layerWebAudio = Layer.sync(Chime, () => {
    let context: AudioContext | undefined
    const note = (ctx: AudioContext, frequency: number, start: number) => {
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.type = "sine"
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.2)
      oscillator.connect(gain).connect(ctx.destination)
      oscillator.start(start)
      oscillator.stop(start + 1.25)
    }
    return Chime.of({
      play: (tone) =>
        Effect.try({
          try: () => {
            context ??= new AudioContext()
            const now = context.currentTime
            const [first, second] = tone === "focus" ? [660, 880] : [523.25, 392]
            note(context, first, now)
            note(context, second, now + 0.22)
          },
          catch: (cause) => cause
        }).pipe(Effect.ignore)
    })
  })

  static readonly layerSilent = Layer.succeed(Chime, Chime.of({ play: () => Effect.void }))
}
