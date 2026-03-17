import { listenKeys } from 'nanostores'
import { useEffect, useState } from 'preact/hooks'

export function useStore(store, { keys, ssr } = {}) {
  let [isHydrated, setIsHydrated] = useState(false)
  let [, forceRender] = useState({})
  let [valueBeforeEffect] = useState(store.get())

  useEffect(() => {
    // Skip re-render afer hydration when not needed for SSR support
    if (ssr) setIsHydrated(true)
    if (valueBeforeEffect !== store.get()) forceRender({})
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
    if (keys) {
      unlisten = listenKeys(store, keys, rerender)
    } else {
      unlisten = store.listen(rerender)
    }
    return () => {
      unlisten()
      clearTimeout(timer)
    }
  }, [store, '' + keys])

  // For SSR return initial value or result of function until hydrated: always
  // on server, until post-hydration on client
  if (ssr && !isHydrated) {
    return ssr === 'initial' ? store.init : ssr()
  }

  return store.get()
}
