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
    let unlisten
    // Preact already batches state updates in a microtask. A timer here
    // would delay the render until after the next frame in browsers.
    let rerender = () => forceRender({})
    if (keys) {
      unlisten = listenKeys(store, keys, rerender)
    } else {
      unlisten = store.listen(rerender)
    }
    return unlisten
  }, [store, '' + keys])

  // For SSR return initial value or result of function until hydrated: always
  // on server, until post-hydration on client
  if (ssr && !isHydrated) {
    return ssr === 'initial' ? store.init : ssr()
  }

  return store.get()
}
