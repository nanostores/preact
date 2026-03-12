import { listenKeys } from 'nanostores'
import { useEffect, useState } from 'preact/hooks'

export function useStore(store, opts = {}) {
  let [hydrated, setHydrated] = useState(false)
  let [, forceRender] = useState({})
  let [valueBeforeEffect] = useState(store.get())

  useEffect(() => {
    setHydrated(true)
    valueBeforeEffect !== store.get() && forceRender({})
  }, [])

  useEffect(() => {
    let batching, timer, unlisten
    let rerender = () => {
      if (!batching) {
        batching = 1
        timer = setTimeout(() => {
          batching = undefined
          forceRender({})
        })
      }
    }
    if (opts.keys) {
      unlisten = listenKeys(store, opts.keys, rerender)
    } else {
      unlisten = store.listen(rerender)
    }
    return () => {
      unlisten()
      clearTimeout(timer)
    }
  }, [store, '' + opts.keys])

  // `'init' in store` check for compatibility with nanostores <= 1.1.1
  return !hydrated && 'init' in store ? store.init : store.get()
}
