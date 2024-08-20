import { listenKeys } from "nanostores";
import { useCallback } from "preact/hooks";

export function defineStore(store, options = {}, useSyncExternalStoreFn) {
  let subscribe = useCallback(
    (onChange) => {
      return options.keys
        ? listenKeys(store, options.keys, onChange)
        : store.listen(onChange);
    },
    [options.keys, store],
  );

  let get = useCallback(() => {
    return (options.selector ?? ((s) => s))(store.get());
  }, [options.selector, store]);

  return useSyncExternalStoreFn(subscribe, get);
}
