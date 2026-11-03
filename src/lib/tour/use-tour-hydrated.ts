"use client";

import { useEffect, useState } from "react";
import { useTour } from "./store";

/** Rehydrates the tour's saved progress once on the client and reports when it is ready, so a
 * tour card never flashes for something the user has already seen. */
export function useTourHydrated() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const done = () => setReady(true);
    const unsub = useTour.persist.onFinishHydration(done);
    if (useTour.persist.hasHydrated()) done();
    else void useTour.persist.rehydrate();
    return unsub;
  }, []);
  return ready;
}
