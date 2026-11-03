"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
import { useSession } from "@/lib/auth/session";
import { useCasesQuery } from "@/lib/cases/queries";
import { firstName } from "@/lib/format";
import { usePricingQuery } from "@/lib/pricing";
import { firstVisible, selectedCaseTab } from "@/lib/tour/dom";
import { fetchSeen } from "@/lib/tour/api";
import { useTour } from "@/lib/tour/store";
import { guideContext, tourForContext } from "@/lib/tour/tours";
import { useTourHydrated } from "@/lib/tour/use-tour-hydrated";
import { GuideDrawer } from "./guide-drawer";
import { barBottom, TourRunner, useStickyHeight } from "./tour-runner";
import { useViewport } from "./use-viewport";
import { WelcomeCard } from "./welcome-card";

const TOAST_MS = 3500;
/** How often a case page is checked for a tour it hasn't shown yet. */
const WATCH_MS = 400;
const CASE_PATH = /^\/cases\/(?!new$)[^/]+$/;

function TourToast() {
  const viewport = useViewport();
  const sticky = useStickyHeight(viewport.phone);
  useEffect(() => {
    const id = setTimeout(() => useTour.getState().hideToast(), TOAST_MS);
    return () => clearTimeout(id);
  }, []);
  return (
    <div className="pointer-events-none fixed inset-x-3 z-[9004] flex justify-center" style={{ bottom: barBottom(sticky) }}>
      <div
        role="status"
        className="inline-flex min-h-12 items-center gap-2.5 rounded-full border border-success-line bg-success-bg px-5 text-[13px] text-success-ink shadow-[0_10px_30px_rgb(0_0_0/0.12)]"
      >
        <Check size={15} aria-hidden />
        That&apos;s the tour. Open the guide whenever you need it.
      </div>
    </div>
  );
}

/** Mounted once in the signed-in app shell. Welcomes a new account (T0), starts a tour when its
 * page is first opened (T1 from the welcome, T3 on a first case, T4 on the Lawyer tab), runs the
 * tour on screen, and shows the guide. What the account has seen is kept in this browser. */
export function TourLayer() {
  const pathname = usePathname();
  const ready = useTourHydrated();
  const user = useSession((s) => s.user);
  const ownerId = useTour((s) => s.ownerId);
  const seen = useTour((s) => s.seen);
  const tour = useTour((s) => s.tour);
  const loaded = useTour((s) => s.loaded);
  const guideOpen = useTour((s) => s.guideOpen);
  const toast = useTour((s) => s.toast);
  const cases = useCasesQuery();
  const { data: pricing } = usePricingQuery();
  const credits = pricing?.case.credits ?? null;

  useEffect(() => {
    if (ready && user) useTour.getState().claimFor(user.id);
  }, [ready, user]);
  const owned = ready && !!user && ownerId === user.id;

  // What the API says this account has seen, so a tour doesn't come back on another device. If it
  // can't be read, this browser's own record stands.
  useEffect(() => {
    if (!owned) return;
    let live = true;
    fetchSeen().then(
      (keys) => live && useTour.getState().loadSeen(keys),
      () => live && useTour.getState().loadSeen([]),
    );
    return () => {
      live = false;
    };
  }, [owned]);
  const claimed = owned && loaded;

  // An account that already has cases is not new: nothing to welcome or teach. Decided once per
  // page load, from the first list, so making a first case in this session doesn't cancel its tour.
  const decided = useRef(false);
  useEffect(() => {
    if (!claimed || decided.current || cases.data === undefined) return;
    decided.current = true;
    if (cases.data.length > 0 && Object.keys(useTour.getState().seen).length === 0) {
      useTour.getState().markSeen(["T0", "T1", "T2", "T3", "T4", "T5"], "DISMISSED");
    }
  }, [claimed, cases.data]);

  // A new account lands on New case (the chat), so the welcome shows there; Cases is the fallback
  // for one who went back before choosing.
  const welcome = claimed && (pathname === "/cases" || pathname === "/cases/new") && !seen.T0 && cases.data?.length === 0 && !tour && !guideOpen;

  // A tour belongs to the page it started on: leaving it (say, by tapping the spotlighted
  // "New case") ends it.
  const tourPath = useRef<string | null>(null);
  useEffect(() => {
    if (!tour) {
      tourPath.current = null;
    } else if (tourPath.current === null) {
      tourPath.current = pathname;
    } else if (tourPath.current !== pathname) {
      useTour.getState().finish(true);
    }
  }, [tour, pathname]);

  // A case page's tours start when the control they open on is on screen, not when the route
  // changes: the case loads first, and the Lawyer tab only exists once a request has been made.
  const onCase = CASE_PATH.test(pathname);
  const idle = claimed && !tour && !guideOpen;
  useEffect(() => {
    if (!onCase || !idle) return;
    const id = setInterval(() => {
      if (document.querySelector('[aria-modal="true"]')) return;
      const tab = selectedCaseTab();
      if (tab === "tab-chat" && !seen.T3 && firstVisible("composer")) useTour.getState().start("T3");
      else if (tab === "tab-lawyer" && !seen.T4 && firstVisible("request-status")) useTour.getState().start("T4");
    }, WATCH_MS);
    return () => clearInterval(id);
  }, [onCase, idle, seen.T3, seen.T4]);

  const tourThisPage = () => {
    const store = useTour.getState();
    const context = guideContext(pathname, selectedCaseTab());
    store.setGuideOpen(false);
    // The form has a hint card instead of a tour.
    if (context === "new-case" && !firstVisible("chatbox")) {
      store.unsee("T2");
      return;
    }
    const id = tourForContext(context);
    if (!id) return;
    // The first stop of the case tour is the Interview's composer.
    if (id === "T3" && selectedCaseTab() !== "tab-chat") firstVisible("tab-chat")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    store.start(id);
  };

  if (!claimed) return null;

  return (
    <>
      {welcome && (
        <WelcomeCard
          name={firstName(user?.name)}
          onShow={() => {
            useTour.getState().markSeen(["T0"], "COMPLETED");
            useTour.getState().start(pathname === "/cases" ? "T1" : "T5");
          }}
          onSkip={() => useTour.getState().markSeen(["T0", "T1", "T5"], "DISMISSED")}
        />
      )}
      {guideOpen && <GuideDrawer pathname={pathname} credits={credits} onTourPage={tourThisPage} />}
      {tour && <TourRunner key={tour.id === "G" ? `G:${tour.question}` : tour.id} tour={tour} credits={credits} />}
      {toast && <TourToast />}
    </>
  );
}
