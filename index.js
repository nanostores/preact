import { useComputed, useSignal } from '@preact/signals'
import { listenKeys } from 'nanostores'
import { useSyncExternalStore } from 'preact/compat'
import { useCallback, useEffect } from 'preact/hooks'

function defineStore(store, options = {}, syncExternalStoreFn) {
  let subscribe = useCallback(
    onChange => {
      return options.keys
        ? listenKeys(store, options.keys, onChange)
        : store.listen(onChange)
    },
    [options.keys, store]
  )

  let get = useCallback(() => {
    return (options.selector ?? (s => s))(store.get())
  }, [options.selector, store])

  return syncExternalStoreFn(subscribe, get)
}

function useSignalLikeSyncExternalStore(subscribe, getSnapshot) {
  let cache = useSignal(getSnapshot())

  useEffect(() => {
    return subscribe(() => (cache.value = getSnapshot()))
  }, [cache, subscribe, getSnapshot])

  return useComputed(() => cache.value)
}

export function useStore(store, options = {}) {
  return defineStore(store, options, useSignalLikeSyncExternalStore)
}

export function useLegacyStore(store, options = {}) {
  return defineStore(store, options, useSyncExternalStore)
}
