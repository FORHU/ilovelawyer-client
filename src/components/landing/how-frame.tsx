"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { HOW_HEADINGS, HOW_OPENING_D, TERMINAL_CAPTIONS, TERMINAL_IMAGE } from "@/lib/marketing/how-timeline";
import { LaptopMock } from "./laptop-mock";
import { PhoneMock } from "./phone-mock";
import type { StoryScroll } from "./story";
import type { HowModel } from "./use-how";
import { useHowMotion } from "./use-how-motion";

const MONITOR_GLOW = "0 0 0 5px rgba(224,189,109,.95), 0 0 80px 16px rgba(224,189,109,.35), 0 0 0 9999px rgba(0,0,0,.55)";

// Where each of the four monitors sits in the terminal photo: left, top, width, height in %.
const MONITORS = {
  desktop: [[50.3, 10, 33.2, 33.8], [17.9, 44.5, 32.1, 32.7], [50.3, 44.9, 33, 32.3], [17.9, 9.7, 32.1, 34.1]],
  mobile: [[51.8, 21.5, 35.8, 22.9], [12.1, 46.5, 39.5, 27.5], [51.7, 45.5, 35, 20.8], [12, 18.5, 39.6, 28]],
};

const CLIENT_PHOTOS: { src: string; alt: string; style?: CSSProperties }[] = [
  { src: "/landing/people/quotes-client.webp", alt: "Client on the sofa reading her case brief on a tablet" },
  { src: "/landing/people/pick-client.webp", alt: "Client on a bus checking quotes on his phone" },
  { src: "/landing/people/msg-split.webp", alt: "Client typing a message at her kitchen table", style: { backgroundSize: "200% 100%", backgroundPosition: "0% 50%" } },
  { src: "/landing/people/docs-client.webp", alt: "Client at her kitchen table holding a letter and her phone" },
];
const SOLICITOR_PHOTOS: { src: string; alt: string; position: string }[] = [
  { src: "/landing/terminal/sol-james.webp", alt: "Solicitor at a four-screen desk thinking through a case", position: "55% 50%" },
  { src: "/landing/terminal/sol-sarah.webp", alt: "Solicitor smiling at her four-screen desk", position: "50% 50%" },
  { src: "/landing/terminal/sol-sarah.webp", alt: "Solicitor replying from her four-screen desk", position: "50% 50%" },
  { src: "/landing/terminal/sol-letter.webp", alt: "Solicitor at her four-screen desk reading the client's letter", position: "50% 50%" },
];

function PhotoStack({ name, label, photos, show }: { name: string; label: string; photos: { src: string; alt: string; style?: CSSProperties; position?: string }[]; show: boolean }) {
  return (
    <div data-how={name} className="pointer-events-none absolute left-0 top-0 z-9 size-0 opacity-0">
      {photos.map((p, i) => (
        <div
          key={p.alt}
          data-ps={i}
          role="img"
          aria-label={p.alt}
          className="absolute inset-0 overflow-hidden rounded-[18px] bg-cover opacity-0"
          style={{ backgroundImage: show ? `url("${p.src}")` : undefined, backgroundPosition: p.position ?? "50% 40%", ...p.style }}
        />
      ))}
      <span className="pointer-events-none absolute bottom-2.5 left-2.5 rounded-full bg-black/60 px-2.5 py-1 text-[12px] text-white">{label}</span>
    </div>
  );
}

/** What both views of the story share: the tall section, its stuck frame and everything in it. A
 * view supplies its own opening ("Stop guessing what it means.") and heading styles. */
export function HowFrame({
  model,
  scroll,
  mob,
  intro,
  headingClass,
  overHeadingClass,
}: {
  model: HowModel;
  scroll: StoryScroll;
  mob: boolean;
  intro: ReactNode;
  headingClass: string;
  overHeadingClass: string;
}) {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  useHowMotion(model, scroll, mob, { section, stage });

  const image = mob ? TERMINAL_IMAGE.mobile : TERMINAL_IMAGE.desktop;
  const monitors = mob ? MONITORS.mobile : MONITORS.desktop;
  const terminalSrc = mob ? "/landing/terminal/reveal-m.webp" : "/landing/terminal/reveal.webp";

  return (
    <section ref={section} aria-label="Stop guessing what it means" className="relative min-h-[6400px] text-white" style={{ height: "900svh" }}>
      {/* The #how target, not the section: at the section's top the opening line hasn't appeared yet. */}
      <div id="how" aria-hidden className="absolute inset-x-0" style={{ top: `calc(max(100svh, 680px) * ${HOW_OPENING_D})` }} />
      <div aria-hidden className="absolute inset-0 z-1 bg-black" />
      {/* Clipped so nothing in the story can ever draw over the sections after it. */}
      <div ref={stage} className="sticky top-0 z-4 h-svh min-h-[680px] overflow-clip">
        {intro}
        {HOW_HEADINGS.map((h, i) => (
          <h2
            key={h.text}
            data-hl={i}
            className={`font-archivo pointer-events-none absolute inset-x-6 z-11 m-0 text-balance text-center font-[250] leading-[1.05] tracking-[-0.04em] text-white opacity-0 ${h.over ? overHeadingClass : headingClass}`}
          >
            {h.text}
          </h2>
        ))}

        <div data-how="terminal" aria-hidden className="pointer-events-none absolute inset-0 z-8 overflow-hidden bg-black opacity-0">
          <div data-how="image" className="absolute left-0 top-0 origin-top-left bg-size-[100%_100%]" style={{ width: image.width, height: image.height, backgroundImage: model.imagesWanted ? `url("${terminalSrc}")` : undefined }}>
            <div data-how="dim" className="absolute inset-0 bg-black/30" />
            {monitors.map(([l, t, w, h], i) => (
              <div
                key={i}
                data-mon={i}
                className="absolute rounded-[10px] opacity-0 transition-opacity duration-280"
                style={{ left: `${l}%`, top: `${t}%`, width: `${w}%`, height: `${h}%`, boxShadow: MONITOR_GLOW }}
              />
            ))}
          </div>
          <div className="absolute inset-x-0 bottom-0 h-[46%]" style={{ background: "linear-gradient(0deg, #000 0%, rgba(0,0,0,.97) 8%, rgba(0,0,0,.9) 18%, rgba(0,0,0,.72) 34%, rgba(0,0,0,.5) 50%, rgba(0,0,0,.28) 66%, rgba(0,0,0,.1) 84%, rgba(0,0,0,0) 100%)" }} />
        </div>

        {TERMINAL_CAPTIONS.map((c, i) => (
          <p
            key={c.label}
            data-tc={i}
            className="pointer-events-none absolute bottom-[52px] left-1/2 z-11 m-0 flex w-[min(640px,calc(100%-48px))] flex-col items-center gap-1.5 text-center text-white opacity-0"
            style={{ translate: "-50% 0" }}
          >
            <span className="font-landing-mono text-[11px] uppercase tracking-[.12em] text-[#e0bd6d]">{c.label}</span>
            <span className="text-balance text-[17px] leading-[1.45]">{c.text}</span>
          </p>
        ))}

        <PhotoStack name="pl" label="Client" photos={CLIENT_PHOTOS} show={model.imagesWanted} />
        <PhotoStack name="pr" label="Solicitor" photos={SOLICITOR_PHOTOS} show={model.imagesWanted} />
        <LaptopMock scene={model.scene} chat={model.chat} />
        <PhoneMock chat={model.chat} />
      </div>
    </section>
  );
}
