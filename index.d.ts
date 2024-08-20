import type { Store, StoreValue } from "nanostores";

import type { UseStoreOptions } from "./core/types";

export function useStore<SomeStore extends Store, Value = StoreValue<SomeStore>>(
  store: SomeStore,
  options: UseStoreOptions<SomeStore, Value> = {},
): Value;
