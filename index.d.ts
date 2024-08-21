import type { ReadonlySignal } from '@preact/signals'
import type { Store, StoreValue } from 'nanostores'

export type StoreKeys<T> = T extends {
  setKey: (k: infer K, v: never) => unknown
}
  ? K
  : never

export interface UseStoreOptions<SomeStore, Value> {
  /**
   * Will re-render components only on specific key changes.
   */
  keys?: StoreKeys<SomeStore>[]
  /**
   * Allows you to extract value from complex/deep objects
   */
  selector?: (state: StoreValue<SomeStore>) => Value
}

/**
 * Subscribe to store changes and get store’s value.
 *
 * Can be user with store builder too.
 *
 * ```js
 * import { useStore } from 'nanostores/preact'
 *
 * import { router } from '../store/router'
 *
 * export const Layout = () => {
 *   let page = useStore(router)
 *   if (page.value.router === 'home') {
 *     return <HomePage />
 *   } else {
 *     return <Error404 />
 *   }
 * }
 * ```
 *
 * @param store Store instance.
 * @param options
 * @returns Store value.
 */
export function useStore<
  SomeStore extends Store,
  Value = StoreValue<SomeStore>
>(
  store: SomeStore,
  options: UseStoreOptions<SomeStore, Value> = {}
): ReadonlySignal<Value>

/**
 * Subscribe to store changes and get store’s value.
 *
 * Can be user with store builder too.
 *
 * ```js
 * import { useLegacyStore } from 'nanostores/preact'
 *
 * import { router } from '../store/router'
 *
 * export const Layout = () => {
 *   let page = useLegacyStore(router)
 *   if (page.router === 'home') {
 *     return <HomePage />
 *   } else {
 *     return <Error404 />
 *   }
 * }
 * ```
 *
 * @param store Store instance.
 * @param options
 * @returns Store value.
 */
export function useLegacyStore<
  SomeStore extends Store,
  Value = StoreValue<SomeStore>
>(store: SomeStore, options: UseStoreOptions<SomeStore, Value> = {}): Value
