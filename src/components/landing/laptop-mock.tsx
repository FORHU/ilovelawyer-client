import { MiniDesktopScreen } from "./mini-app";
import type { HowChat } from "./use-how";

// The laptop's screen is 852 wide. The mini app is laid out at the width the real case pages get on
// a desktop (without the sidebar, which the landing page leaves out) and scaled to fit, so its text
// and spacing keep the app's own proportions.
const SCREEN_W = 1040;
const SCALE = 852 / SCREEN_W;

const LABELS = [
  "The new-case chat, asking what's going on",
  "A case's overview: what a lawyer needs, an AI summary and a timeline with its sources",
  "Three quotes received, with the lawyer's fee, the platform fee and the total",
  "Comparing a second lawyer's quote, with the option to accept or decline it",
  "Messages with the chosen lawyer, with a shared letter",
  "The case interview, where the AI has read a letter",
];
const PATHS = ["cases/new", "cases", "cases", "cases", "cases", "cases"];

const Key = () => <span className="block rounded-[3px] bg-[#121110] shadow-[inset_0_-1px_0_rgba(255,255,255,.05)]" />;
const KeyRow = ({ count }: { count: number }) => (
  <span className="grid h-3.5 gap-[5px]" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
    {Array.from({ length: count }, (_, i) => <Key key={i} />)}
  </span>
);

export function LaptopMock({ scene, chat }: { scene: number; chat: HowChat }) {
  return (
    <div
      data-how="desk"
      role="img"
      aria-label={`The ilovelawyer app on a laptop, showing a sample case. ${LABELS[scene]}.`}
      className="pointer-events-none absolute left-0 top-0 z-9 flex h-[620px] w-[940px] flex-col items-center opacity-0"
      style={{ transformOrigin: "50% 50%", transform: "translate(-200vw, 0)" }}
    >
      <div
        className="relative h-[592px] w-[880px] flex-none rounded-[20px_20px_4px_4px] bg-[#1a1917] px-3.5 pb-[22px] pt-3.5"
        style={{ boxShadow: "0 0 0 1.5px #3a3833, 0 30px 80px rgba(0,0,0,.6), inset 0 0 2px rgba(255,255,255,.2)" }}
      >
        <span aria-hidden className="absolute left-1/2 top-[5px] size-1.5 -translate-x-1/2 rounded-full bg-[#2e2c29]" />
        <div className="flex size-full flex-col overflow-hidden rounded-[4px] bg-white text-ink">
          <div className="flex h-[30px] flex-none items-center gap-1.5 border-b border-[#e3dfd8] bg-[#f1efeb] px-3">
            {[0, 1, 2].map((i) => <span key={i} className="size-[9px] rounded-full bg-[#d6d2cb]" />)}
            <span className="flex flex-1 justify-center">
              <span className="w-[330px] rounded-md bg-white py-[3px] text-center text-[10px] text-[#6b6760]">ilovelawyer.com/{PATHS[scene]}</span>
            </span>
            <span className="rounded-full bg-[#fbf3e0] px-2 py-0.5 text-[9px] font-semibold text-[#8a6200]">Sample case</span>
          </div>
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <div className="absolute left-0 top-0 origin-top-left" style={{ width: SCREEN_W, height: `${100 / SCALE}%`, transform: `scale(${SCALE})` }}>
              <MiniDesktopScreen scene={scene} chat={chat} />
            </div>
          </div>
        </div>
      </div>
      <div aria-hidden className="absolute left-1/2 top-[590px] -ml-[500px] flex w-[1000px] flex-col items-center">
        <div
          className="relative flex h-[130px] w-[1000px] flex-col items-center gap-2.5 pt-3"
          style={{ clipPath: "polygon(4% 0, 96% 0, 100% 100%, 0 100%)", background: "linear-gradient(180deg, #3b3936 0%, #302e2b 55%, #262422 100%)" }}
        >
          <span className="flex w-[78%] flex-col gap-[5px] rounded-[5px] bg-[#1d1c1a] px-[9px] py-[7px]">
            <KeyRow count={14} />
            <KeyRow count={14} />
            <KeyRow count={13} />
            <span className="grid h-3.5 grid-cols-[1fr_1fr_1.2fr_6fr_1.2fr_1fr_1fr] gap-[5px]">
              {Array.from({ length: 7 }, (_, i) => <Key key={i} />)}
            </span>
          </span>
          <span className="block h-[34px] w-60 rounded-md bg-[#3f3d39] shadow-[inset_0_1px_0_rgba(255,255,255,.08)]" />
        </div>
        <div className="h-[9px] w-[1000px] rounded-b-xl shadow-[0_20px_40px_rgba(0,0,0,.6)]" style={{ background: "linear-gradient(180deg, #1e1d1b, #0d0c0b)" }}>
          <span className="mx-auto block h-1 w-[130px] rounded-b-md bg-[#2c2a27]" />
        </div>
      </div>
    </div>
  );
}
