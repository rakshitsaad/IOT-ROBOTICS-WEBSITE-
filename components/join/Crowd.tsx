import { buildCrowd, type CrowdPerson, type CrowdVariant } from "@/lib/crowd";
import { CROWD_PALETTE } from "@/lib/crowd";

/**
 * The /join hero's crowd (DESIGN.md §21): one SVG of small flat figures, front view, chest up, from `buildCrowd()` (seeded,
 * so it is the same on every visit). Server-rendered; no JS. Decorative.
 *
 * Each figure is drawn from a few symbols, coloured per person through `fill` (the shirt, the head, the hair) and
 * `color` (the skin on the neck and neckline): body (neck, shoulders, a crew or V neckline), optional long hair behind the
 * head, the head (ears, two dots for eyes, a small smile in the front rows), the hair (8 styles, one a headscarf) and,
 * on some, glasses. Local units: head radius 10, centred on (0, 0); shoulders ±26.
 *
 * `preserveAspectRatio="xMidYMax slice"`: it fills its box from the bottom up, cropping the sides on narrow boxes.
 */
export function Crowd({ variant, className }: { variant: CrowdVariant; className?: string }) {
  const { width, height, rows } = buildCrowd(variant);
  const id = (name: string) => `crowd-${variant}-${name}`;
  const ref = (name: string) => `#${id(name)}`;
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMax slice"
      className={className}
    >
      <defs>
        {/* The body: neck (skin, `color`), shoulders (shirt, `fill`), then the neckline (skin). */}
        <symbol id={id("body-crew")} overflow="visible">
          <path fill="currentColor" d="M-4 4h8v14h-8z" />
          <path d="M-27 150V35c0-9.4 5.8-15 15.4-17.6L-4.6 16h9.2l7 1.4C21.2 20 27 25.6 27 35v115z" />
          <path fill="currentColor" d="M-7 16.4Q0 23.4 7 16.4z" />
        </symbol>
        <symbol id={id("body-v")} overflow="visible">
          <path fill="currentColor" d="M-4 4h8v14h-8z" />
          <path d="M-27 150V35c0-9.4 5.8-15 15.4-17.6L-4.6 16h9.2l7 1.4C21.2 20 27 25.6 27 35v115z" />
          <path fill="currentColor" d="M-6.4 16.4 0 25.6l6.4-9.2z" />
        </symbol>
        {/* The arms' edges: two soft lines a shade darker than the shirt (`stroke`). */}
        <symbol id={id("arms")} overflow="visible">
          <path d="M-18.6 31c-.8 12-.6 26 .2 44M18.6 31c.8 12 .6 26-.2 44" fill="none" strokeWidth="1.3" strokeLinecap="round" />
        </symbol>
        {/* A lanyard: the strap (`stroke`) and the badge (`fill`). */}
        <symbol id={id("lanyard")} overflow="visible">
          <path d="M-5.4 17.6 0 39l5.4-21.4" fill="none" strokeWidth="1.3" />
          <rect x="-3.6" y="38.6" width="7.2" height="9.2" rx="1.1" />
        </symbol>
        <symbol id={id("collar")} overflow="visible">
          <path d="M-6.8 16.2-1 24.2l-3.4-8zM6.8 16.2 1 24.2l3.4-8z" />
        </symbol>
        {/* The head: ears and face in `fill`, eyes in ink. */}
        <symbol id={id("head")} overflow="visible">
          <circle cx="-9.7" cy="1.6" r="2.5" />
          <circle cx="9.7" cy="1.6" r="2.5" />
          <circle r="10" />
          <circle cx="-3.6" cy="1.3" r="1.05" fill={CROWD_PALETTE.ink} />
          <circle cx="3.6" cy="1.3" r="1.05" fill={CROWD_PALETTE.ink} />
        </symbol>
        <symbol id={id("smile")} overflow="visible">
          <path d="M-2.8 5.4Q0 7.4 2.8 5.4" fill="none" stroke={CROWD_PALETTE.ink} strokeWidth="0.8" strokeLinecap="round" opacity="0.55" />
        </symbol>
        <symbol id={id("glasses")} overflow="visible">
          <g fill="none" stroke={CROWD_PALETTE.ink} strokeWidth="0.9">
            <circle cx="-3.7" cy="1.2" r="2.8" />
            <circle cx="3.7" cy="1.2" r="2.8" />
            <path d="M-0.9 0.9Q0 0.2 0.9 0.9" />
          </g>
        </symbol>
        {/* Hair behind the head (drawn before it). */}
        <symbol id={id("long-back")} overflow="visible">
          <path d="M-12.2-1c0-9.6 5.4-13.2 12.2-13.2S12.2-10.6 12.2-1L13 20c-2.6 2.6-6 2.6-7.8.6H-5.2c-1.8 2-5.2 2-7.8-.6z" />
        </symbol>
        <symbol id={id("curly-back")} overflow="visible">
          <circle cy="-1.5" r="13.6" />
        </symbol>
        <symbol id={id("bob-back")} overflow="visible">
          <path d="M-12.4-1c0-9.8 5.4-13.4 12.4-13.4S12.4-10.8 12.4-1l.2 11c-1.6 2.2-4 2.2-5.2.6H-7.4c-1.2 1.6-3.6 1.6-5.2-.6z" />
        </symbol>
        <symbol id={id("scarf-back")} overflow="visible">
          <path d="M-14 2c0-11.6 6.4-17.2 14-17.2S14-9.6 14 2c0 8-2 14 3 18h-34c5-4 3-10 3-18z" />
        </symbol>
        {/* Hair on top (drawn after the head). */}
        <symbol id={id("crop")} overflow="visible">
          <path d="M-10.4.5c-1-9 4.4-13.7 10.8-13.7S11.6-8.6 10.4.5C9.6-3.6 7.6-6.4 3.4-6.6c-3.8-.2-5.2 1.4-8 1C-7.4-6-9.4-3.4-10.4.5z" />
        </symbol>
        <symbol id={id("side")} overflow="visible">
          <path d="M-10.6 1c-1-9 4-14.4 11.2-14.4S11.8-8.6 10.6.6C10-2.4 8.6-4.6 6.4-5.4 2.6-6.6-3.4-7.4-7.8-4.2-9-3.2-10-1.4-10.6 1z" />
        </symbol>
        <symbol id={id("buzz")} overflow="visible">
          <path d="M-10.1-1.5c0-7.1 4.7-10.1 10.1-10.1s10.1 3 10.1 10.1C8.4-5.6 4.6-7.4 0-7.4s-8.4 1.8-10.1 5.9z" />
        </symbol>
        <symbol id={id("long")} overflow="visible">
          <path d="M-10.4 2.5C-11.6-8-6-13.4 0-13.4S11.6-8 10.4 2.5C9.8-2.8 6.6-6.8 1.2-7.6L0-5.8l-1.2-1.8c-5.4.8-8.6 4.8-9.2 10.1z" />
        </symbol>
        <symbol id={id("bun")} overflow="visible">
          <path d="M-10.2 0c-.8-8.4 4.2-12.8 10.2-12.8S11-8.4 10.2 0C9-4.4 5.6-6.8 0-6.8S-9-4.4-10.2 0z" />
          <circle cy="-16.4" r="4.8" />
        </symbol>
        <symbol id={id("curly")} overflow="visible">
          <path d="M-11 1c-1.2-4 0-8.6 3.4-11.2 3-3.8 7-4.2 10.4-2.8 4.2.4 8.6 4 8.4 10-.6 3.6-1.6 4.2-2.2 3.4-.4-3-1.6-4.6-3.8-5-1.4-1.6-3.4-1.8-5-1-1.8-1-4.2-.8-5.6.8-2.2.4-3.4 2.2-3.6 5.2-.4 1-1.6 1.4-2 .6z" />
        </symbol>
        <symbol id={id("bob")} overflow="visible">
          <path d="M-10.6-1.5c-.2-7.9 4.6-12.1 10.6-12.1s10.8 4.2 10.6 12.1c-.4-1.1-1-1.7-2-1.9H-8.6c-1 .2-1.6.8-2 1.9z" />
        </symbol>
        <symbol id={id("scarf")} overflow="visible">
          <path
            fillRule="evenodd"
            d="M-14 2c0-11.6 6.4-17.2 14-17.2S14-9.6 14 2c0 9-5.4 15.4-14 16.6C-8.6 17.4-14 11-14 2zm5.8-.5a8.2 9.6 0 1 0 16.4 0a8.2 9.6 0 1 0-16.4 0z"
          />
        </symbol>
      </defs>
      {rows.map((row, i) => (
        <g key={i}>
          {row.map((p, j) => (
            <Person key={j} p={p} at={ref} />
          ))}
        </g>
      ))}
    </svg>
  );
}

const BACK: Partial<Record<CrowdPerson["style"], string>> = { long: "long-back", curly: "curly-back", bob: "bob-back", scarf: "scarf-back" };

function Person({ p, at }: { p: CrowdPerson; at: (name: string) => string }) {
  const r = (v: number) => Math.round(v * 10) / 10;
  return (
    <g transform={`translate(${r(p.x)} ${r(p.y)}) scale(${Math.round(p.k * 1000) / 1000})`}>
      <use href={at(p.neckline === "v" ? "body-v" : "body-crew")} fill={p.shirt} color={p.skin} />
      <use href={at("arms")} stroke={p.fold} />
      {p.neckline === "collar" && <use href={at("collar")} fill={p.collar} />}
      {p.lanyard && <use href={at("lanyard")} stroke={p.lanyard} fill={p.badge} />}
      {BACK[p.style] && <use href={at(BACK[p.style]!)} fill={p.hair} />}
      <use href={at("head")} fill={p.skin} />
      {p.smile && p.style !== "scarf" && <use href={at("smile")} />}
      <use href={at(p.style)} fill={p.hair} />
      {p.glasses && <use href={at("glasses")} />}
    </g>
  );
}
