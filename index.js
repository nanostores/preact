import { listenKeys } from 'nanostores'
import { useEffect, useState } from 'preact/hooks'

export function useStore(store, opts = {}) {
  let [returnInitial, setReturnInitial] = useState(
    // Return initial value on mount for SSR support
    opts.ssr === true
  )
  let [, forceRender] = useState({})
  let [valueBeforeEffect] = useState(store.get())

  useEffect(() => {
    setReturnInitial(false)
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

  return returnInitial ? store.init : store.get()
}
