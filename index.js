import { useSyncExternalStore } from 'preact/compat'

import { defineStore } from './core/defineStore.js'

export function useStore(store, options = {}) {
  return defineStore(store, options, useSyncExternalStore)
}
