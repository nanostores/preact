import { listenKeys } from 'nanostores'
import { useEffect, useState } from 'preact/hooks'

export function useStore(store, opts = {}) {
  let [returnCurrent, setReturnCurrent] = useState(
    // Always return current value unless SSR mode
    opts.ssr !== true
  )
  let [, forceRender] = useState({})
  let [valueBeforeEffect] = useState(store.get())

  useEffect(() => {
    setReturnCurrent(true)
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

  return returnCurrent ? store.get() : store.init
}
