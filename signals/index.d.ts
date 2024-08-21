import type { ReadonlySignal } from '@preact/signals'
import type { Store, StoreValue } from 'nanostores'

import type { UseStoreOptions } from '../core/types'

export function useStoreSignal<
  SomeStore extends Store,
  Value = StoreValue<SomeStore>
>(
  store: SomeStore,
  options: UseStoreOptions<SomeStore, Value> = {}
): ReadonlySignal<Value>
