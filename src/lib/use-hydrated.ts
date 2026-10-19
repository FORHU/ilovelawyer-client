"use client";

import { useEffect, useState } from "react";
import { useApp } from "./store";

/** Rehydrates the persisted store once on the client and reports when it is ready. */
export function useHydrated() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const done = () => setReady(true);
    const unsub = useApp.persist.onFinishHydration(done);
    void useApp.persist.rehydrate();
    if (useApp.persist.hasHydrated()) done();
    return unsub;
  }, []);
  return ready;
}
