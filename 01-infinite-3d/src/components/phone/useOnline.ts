import { useSyncExternalStore } from "react";

function subscribe(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

/** navigator.onLine, live (the Menu button's offline dot and the sheet's '// offline'); online on the server. */
export const useOnline = (): boolean => useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
