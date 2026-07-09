/**
 * Minimal concurrency limiter (zero-dependency). Returns a function that wraps
 * an async task and ensures at most `concurrency` run at once.
 */
export default function pLimit(concurrency: number) {
  const queue: Array<() => void> = []
  let active = 0

  const next = () => {
    active--
    if (queue.length > 0) queue.shift()!()
  }

  return function <T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const run = () => {
        active++
        fn().then(resolve, reject).finally(next)
      }
      if (active < concurrency) run()
      else queue.push(run)
    })
  }
}
