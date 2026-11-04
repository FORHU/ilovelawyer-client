"use client";

import type { RefObject } from "react";
import { heroExit, howPose, HOW_HEADINGS, type HowLayout } from "@/lib/marketing/how-timeline";
import { easeOutCubic } from "@/lib/marketing/hero-geometry";
import { gsap, useGSAP } from "./use-gsap-setup";
import type { HowModel } from "./use-how";
import type { StoryScroll } from "./story";

const SCROLL_SMOOTHING = 0.4;

/** Drives the story. One scrubbed tween carries `d` (see lib/marketing/how-timeline), which howPose
 * turns into positions: the transforms combine several values each, so separate tweens would fight
 * over them. The hero reads the same d to send its papers into the phone. */
export function useHowMotion(
  model: Pick<HowModel, "setScene" | "startChat" | "resetChat" | "setImagesWanted">,
  scroll: StoryScroll,
  mob: boolean,
  refs: { section: RefObject<HTMLElement | null>; stage: RefObject<HTMLElement | null> },
) {
  const { setScene, startChat, resetChat, setImagesWanted } = model;

  useGSAP(
    () => {
      const section = refs.section.current!;
      const stage = refs.stage.current!;
      const one = (name: string) => stage.querySelector<HTMLElement>(`[data-how="${name}"]`);
      const all = (selector: string) => [...stage.querySelectorAll<HTMLElement>(selector)];
      const left = one("l");
      const right = one("r");
      const phone = one("phone");
      const desk = one("desk");
      const photoL = one("pl");
      const photoR = one("pr");
      const terminal = one("terminal");
      const image = one("image");
      const dim = one("dim");
      const headings = all("[data-hl]");
      const captions = all("[data-tc]");
      const monitors = all("[data-mon]");
      const photos = all("[data-ps]");

      let layout: HowLayout;
      let span = 0;
      const measure = () => {
        span = section.offsetHeight / stage.clientHeight;
        layout = {
          W: stage.clientWidth,
          H: stage.clientHeight,
          mob,
          headingH: headings[1]?.offsetHeight ?? 60,
          leftW: left?.offsetWidth ?? 300,
          rightW: right?.offsetWidth ?? 300,
        };
      };
      measure();

      const proxy = { progress: 0 };
      let chatting = false;
      let wanted = false;
      let lastScene = -1;

      const draw = () => {
        const d = proxy.progress * span - 1;
        const p = howPose(d, layout);
        scroll.set(d);

        if (!wanted && d > -0.6) {
          wanted = true;
          setImagesWanted(true);
        }
        if (p.scene !== lastScene) {
          lastScene = p.scene;
          setScene(p.scene);
        }
        const { arrive } = heroExit(d);
        if (arrive > 0.88 && !chatting) {
          chatting = true;
          startChat();
        } else if (arrive < 0.3 && chatting) {
          chatting = false;
          resetChat();
        }

        if (phone) {
          phone.style.transform = `translate(-50%,-50%) translate(${p.phone.x.toFixed(1)}px,${p.phone.y.toFixed(1)}px) perspective(1100px) rotateY(${p.phone.rotateY.toFixed(2)}deg) rotateX(${p.phone.rotateX.toFixed(2)}deg) rotateZ(${p.phone.rotateZ.toFixed(2)}deg) scale(${p.phone.scale.toFixed(3)})`;
          phone.style.opacity = p.phone.opacity.toFixed(3);
        }
        if (desk) {
          desk.style.opacity = p.desk.opacity.toFixed(3);
          desk.style.transform = `translate(${p.desk.x.toFixed(1)}px,${p.desk.y.toFixed(1)}px) scale(${p.desk.scale.toFixed(3)})`;
        }

        const placePhoto = (el: HTMLElement | null, x: number, shift: number) => {
          if (!el) return;
          el.style.left = `${x.toFixed(1)}px`;
          el.style.top = `${p.photos.top.toFixed(1)}px`;
          el.style.width = `${p.photos.w.toFixed(1)}px`;
          el.style.height = `${p.photos.h.toFixed(1)}px`;
          el.style.opacity = p.photos.opacity.toFixed(3);
          el.style.transform = `translateX(${shift.toFixed(1)}px)`;
        };
        placePhoto(photoL, p.photos.leftX, -p.photos.slide);
        placePhoto(photoR, p.photos.rightX, p.photos.slide);
        for (const el of photos) el.style.opacity = p.photos.pair[Number(el.dataset.ps)].toFixed(3);

        headings.forEach((el, i) => {
          const v = p.headings[i];
          el.style.opacity = v.toFixed(3);
          el.style.translate = `0 ${((1 - easeOutCubic(v)) * 24).toFixed(1)}px`;
          if (!mob && !HOW_HEADINGS[i].over) el.style.top = `${p.headingTop.toFixed(0)}px`;
        });

        if (terminal) terminal.style.opacity = p.terminal.opacity.toFixed(3);
        if (image) image.style.transform = `translate(${p.terminal.x.toFixed(1)}px,${p.terminal.y.toFixed(1)}px) scale(${p.terminal.scale.toFixed(4)})`;
        for (const el of monitors) el.style.opacity = Number(el.dataset.mon) === p.terminal.monitor ? "1" : "0";
        if (dim) dim.style.opacity = p.terminal.monitor >= 0 ? "0" : "1";
        captions.forEach((el, i) => {
          const v = p.terminal.captions[i];
          el.style.opacity = v.toFixed(3);
          el.style.translate = `-50% ${((1 - v) * 10).toFixed(1)}px`;
        });

        if (left) {
          left.style.opacity = p.intro.opacity.toFixed(3);
          left.style.translate = `${p.intro.leftShift.x.toFixed(1)}px ${p.intro.leftShift.y.toFixed(1)}px`;
          left.style.clipPath = p.intro.leftClip;
        }
        if (right) {
          right.style.opacity = p.intro.opacity.toFixed(3);
          right.style.translate = `${p.intro.rightShift.x.toFixed(1)}px ${p.intro.rightShift.y.toFixed(1)}px`;
          right.style.clipPath = p.intro.rightClip;
          right.style.pointerEvents = p.intro.interactive ? "auto" : "none";
        }
      };

      // Tweens plain progress and works d out in draw, so the span can change without invalidateOnRefresh:
      // that rewinds the tween on every ScrollTrigger.refresh, drawing the story at its start, then
      // restores it without drawing again, which left the phone over the sections below.
      const tween = gsap.to(proxy, {
        progress: 1,
        ease: "none",
        onUpdate: draw,
        scrollTrigger: { trigger: section, start: "top bottom", end: "bottom bottom", scrub: SCROLL_SMOOTHING },
      });

      const observer = new ResizeObserver(() => {
        measure();
        draw();
      });
      observer.observe(stage);
      // Set up part-way down the page, the story starts where the page is rather than scrubbing there.
      tween.progress(tween.scrollTrigger?.progress ?? 0);
      draw();

      return () => {
        observer.disconnect();
        scroll.set(-1);
      };
    },
    { scope: refs.section, dependencies: [mob], revertOnUpdate: true },
  );
}
