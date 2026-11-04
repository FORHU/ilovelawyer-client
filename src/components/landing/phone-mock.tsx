import { MiniPhoneScreen } from "./mini-app";
import type { HowChat } from "./use-how";

// The phone's screen is 278 wide. The mini app is laid out at a real phone's 390 and scaled to fit,
// so its text and spacing keep the app's own proportions.
const SCREEN_W = 390;
const SCALE = 278 / SCREEN_W;

export function PhoneMock({ chat }: { chat: HowChat }) {
  return (
    <div
      data-how="phone"
      role="img"
      aria-label={chat.sent ? `The ilovelawyer app on a phone: the case interview, answering "${chat.msg}"` : "The ilovelawyer app on a phone: the new-case chat, asking what's going on"}
      className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-[620px] w-[300px]"
      style={{ transform: "translate(-50%, -50%) translateY(120vh)", transformOrigin: "50% 50%" }}
    >
      <div
        className="absolute inset-0 rounded-[54px] bg-[#1a1917] p-[11px]"
        style={{ boxShadow: "0 0 0 1.5px #3a3833, 0 0 0 3px #0d0c0b, -5px 2px 0 2px #2b2925, 0 40px 90px rgba(0,0,0,.55), inset 0 0 2px rgba(255,255,255,.25)" }}
      >
        <span aria-hidden className="absolute -left-[3px] top-[120px] h-[30px] w-[3px] rounded-l-[2px] bg-[#2a2825]" />
        <span aria-hidden className="absolute -left-[3px] top-[168px] h-[52px] w-[3px] rounded-l-[2px] bg-[#2a2825]" />
        <span aria-hidden className="absolute -right-[3px] top-[180px] h-[76px] w-[3px] rounded-r-[2px] bg-[#2a2825]" />
        <div className="relative flex size-full flex-col overflow-hidden rounded-[43px] bg-white text-ink">
          <span aria-hidden className="absolute left-1/2 top-[9px] z-3 h-[25px] w-[86px] -translate-x-1/2 rounded-full bg-black" />
          <div className="flex h-11 flex-none items-center justify-between pl-[30px] pr-[26px] text-[13px] font-semibold">
            <span>9:41</span>
          </div>
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <div className="absolute left-0 top-0 origin-top-left" style={{ width: SCREEN_W, height: `${100 / SCALE}%`, transform: `scale(${SCALE})` }}>
              <MiniPhoneScreen chat={chat} />
            </div>
          </div>
          <span aria-hidden className="absolute bottom-2 left-1/2 h-1 w-[110px] -translate-x-1/2 rounded-full bg-[#1a1a1a]" />
        </div>
      </div>
    </div>
  );
}
