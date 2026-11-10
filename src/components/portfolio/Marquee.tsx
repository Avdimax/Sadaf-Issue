/**
 * Marquee — brand names drifting on a hairline pearl band.
 * Pure CSS animation: rendered on the server, zero client JS.
 */
const items = ["کافه هور", "عطر اکسین", "آکادمی نورث‌پیک", "چای سُها", "آتلیه صدف"];

export default function Marquee() {
  return (
    <section aria-label="فهرست برندها" className="relative z-10 border-y border-ink/10 bg-pearl-2 py-6 md:py-7">
      <div className="flex overflow-hidden" dir="ltr">
        {[0, 1].map((rowIdx) => (
          <div
            key={rowIdx}
            className="marquee-track flex shrink-0 items-center"
            style={{ "--marquee-dur": "34s" } as React.CSSProperties}
            aria-hidden={rowIdx === 1}
          >
            {[...items, ...items].map((item, i) => (
              <span key={i} className="flex shrink-0 items-center">
                <span className="display-fa px-8 text-2xl font-semibold text-ink/85 md:px-12 md:text-3xl">
                  {item}
                </span>
                <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true" className="shrink-0">
                  <circle cx="5" cy="5" r="3" fill="#2E5C8F" opacity="0.75" />
                </svg>
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
