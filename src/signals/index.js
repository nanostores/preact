import { useComputed, useSignal } from '@preact/signals'
import { useEffect } from 'preact/hooks'

import { defineStore } from "../core/defineStore.js";

function useSyncExternalStoreSignal(subscribe, getSnapshot) {
  let cache = useSignal(getSnapshot());

  useEffect(() => {
    return subscribe(() => (cache.value = getSnapshot()));
  }, [cache, subscribe, getSnapshot]);

  return useComputed(() => cache.value);
}

export function useStoreSignal(store, options = {},) {
  return defineStore(store, options, useSyncExternalStoreSignal)
}

