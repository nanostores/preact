import type { ReadonlySignal } from '@preact/signals'
import type { Store, StoreValue } from 'nanostores'

export type StoreKeys<T> = T extends {
  setKey: (k: infer K, v: never) => unknown
}
  ? K
  : never

export interface UseStoreOptions<SomeStore, Value> {
  keys?: StoreKeys<SomeStore>[]
  selector?: (state: StoreValue<SomeStore>) => Value
}

export function useStore<
  SomeStore extends Store,
  Value = StoreValue<SomeStore>
>(
  store: SomeStore,
  options: UseStoreOptions<SomeStore, Value> = {}
): ReadonlySignal<Value>

export function useLegacyStore<
  SomeStore extends Store,
  Value = StoreValue<SomeStore>
>(store: SomeStore, options: UseStoreOptions<SomeStore, Value> = {}): Value
