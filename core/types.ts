import type { StoreValue } from 'nanostores';

export type StoreKeys<T> = T extends { setKey: (k: infer K, v: never) => unknown } ? K : never;

export interface UseStoreOptions<SomeStore, Value> {
  keys?: StoreKeys<SomeStore>[];
  selector?: (state: StoreValue<SomeStore>) => Value;
}
