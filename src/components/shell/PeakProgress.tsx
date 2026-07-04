import { Icon } from "@/ds";
import { useTasks } from "@/hooks/use-tasks";
import { bucket } from "@/lib/pfdate";

// Peak Progress — the brand's growing mountain. Sits globally on top of every
// screen; the front peaks fill with brand colour from base toward the summit as
// today's tasks are closed off. At 100% snow caps + a summit flag appear.
export default function PeakProgress() {
  const { tasks } = useTasks();

  const todays = tasks.filter((t) => ["overdue", "today"].includes(bucket(t.endsAt)));
  const total = todays.length;
  const done = todays.filter((t) => t.completed).length;
  const pct = total ? Math.round((done / total) * 100) : 100;
  const allClear = total === 0;

  const backRidge = "M0,100 L150,72 L300,82 L470,66 L640,78 L810,68 L1000,80 L1000,100 Z";
  const frontPeaks = "M90,100 L250,58 L410,100 Z M330,100 L540,40 L750,100 Z M650,100 L810,62 L960,100 Z";
  const revealH = (pct / 100) * 100;
  const snow = Math.max(0, Math.min(1, (pct - 60) / 40));
  const summited = pct >= 100;
  const sunCy = 34 - (pct / 100) * 14;

  const label = allClear
    ? "All clear"
    : summited
    ? "Summit reached"
    : pct >= 50
    ? "Climbing strong"
    : "Base camp";

  return (
    <div
      className="pf-peak"
      style={{
        position: "relative",
        height: 122,
        flexShrink: 0,
        overflow: "hidden",
        borderBottom: "1px solid var(--border-soft)",
        background: "#eef5ff",
      }}
    >
      <svg
        viewBox="0 0 1000 100"
        preserveAspectRatio="xMidYMax slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
      >
        <defs>
          <linearGradient id="pf-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#cfe4ff" />
            <stop offset="0.5" stopColor="#e4eeff" />
            <stop offset="1" stopColor="#f4f8ff" />
          </linearGradient>
          <radialGradient id="pf-sun" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#fef3c7" />
            <stop offset="0.6" stopColor="#fcd34d" />
            <stop offset="1" stopColor="#fbbf24" />
          </radialGradient>
          <linearGradient id="pf-back" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#cbd8ea" />
            <stop offset="1" stopColor="#dde7f5" />
          </linearGradient>
          <linearGradient id="pf-front" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#aebccf" />
            <stop offset="1" stopColor="#c2cddd" />
          </linearGradient>
          <linearGradient id="pf-climb" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2f6bff" />
            <stop offset="1" stopColor="#22a79e" />
          </linearGradient>
          <clipPath id="pf-front-clip">
            <path d={frontPeaks} />
          </clipPath>
          <clipPath id="pf-reveal">
            <rect
              x="0"
              y={100 - revealH}
              width="1000"
              height={revealH}
              style={{ transition: "y 0.7s var(--ease-standard), height 0.7s var(--ease-standard)" }}
            />
          </clipPath>
        </defs>

        <rect x="0" y="0" width="1000" height="100" fill="url(#pf-sky)" />
        <circle cx="852" cy={sunCy} r="14" fill="url(#pf-sun)" opacity="0.95" style={{ transition: "cy 0.7s var(--ease-standard)" }} />
        <circle cx="852" cy={sunCy} r="22" fill="#fcd34d" opacity="0.15" style={{ transition: "cy 0.7s var(--ease-standard)" }} />
        <g fill="#ffffff" opacity="0.82">
          <ellipse cx="185" cy="26" rx="44" ry="9" />
          <ellipse cx="230" cy="20" rx="26" ry="7" />
          <ellipse cx="650" cy="22" rx="36" ry="8" />
        </g>

        <path d={backRidge} fill="url(#pf-back)" />

        <path d={frontPeaks} fill="url(#pf-front)" />
        <g clipPath="url(#pf-front-clip)">
          <g clipPath="url(#pf-reveal)">
            <path d={frontPeaks} fill="url(#pf-climb)" />
          </g>
        </g>
        <path d={frontPeaks} fill="none" stroke="#9fb0c6" strokeWidth="0.8" />

        {snow > 0 && (
          <g fill="#ffffff" opacity={snow}>
            <path d="M540,40 L556,62 L524,62 Z" />
            <path d="M250,58 L262,76 L238,76 Z" />
            <path d="M810,62 L821,78 L799,78 Z" />
          </g>
        )}
        {summited && (
          <g>
            <rect x="539" y="24" width="1.6" height="16" fill="var(--text-primary)" />
            <path d="M540.6,25 L555,29 L540.6,33 Z" fill="var(--secondary-500)" />
          </g>
        )}

        <g>
          {(
            [
              [300, 100, 1],
              [345, 100, 0.82],
              [408, 100, 1.12],
              [470, 100, 0.9],
              [560, 100, 1.15],
              [628, 100, 0.85],
              [690, 100, 1.05],
              [742, 100, 0.9],
            ] as [number, number, number][]
          ).map(([x, y, s], i) => (
            <g key={i} transform={`translate(${x},${y}) scale(${s})`}>
              <rect x="-1.1" y="-2.5" width="2.2" height="4" fill="#5b4636" />
              <path d="M0,-19 L5,-8 L-5,-8 Z" fill="#1f7a52" />
              <path d="M0,-14 L6,-1.5 L-6,-1.5 Z" fill="#256b4b" />
            </g>
          ))}
        </g>
      </svg>

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "16px 32px",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(255,255,255,0.82)",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(255,255,255,0.9)",
            borderRadius: "var(--radius-full)",
            padding: "7px 15px 7px 11px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: summited ? "var(--green-600)" : "var(--primary-500)",
              color: "#fff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon name={summited ? "TickCircleProperty1Bold" : "ChartProperty1Bold"} size={16} />
          </span>
          <div style={{ lineHeight: 1.15 }}>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: "-0.01em",
                color: "var(--text-primary)",
              }}
            >
              {pct}%
            </div>
            <div
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 11,
                fontWeight: 600,
                color: "var(--text-secondary)",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </div>
          </div>
        </div>

        <div
          style={{
            textAlign: "right",
            background: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(6px)",
            borderRadius: "var(--radius-md)",
            padding: "6px 12px",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 13,
              fontWeight: 700,
              color: "var(--text-primary)",
              whiteSpace: "nowrap",
            }}
          >
            {allClear ? "Nothing due today" : `${done} of ${total} done today`}
          </div>
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 11,
              color: "var(--text-tertiary)",
              whiteSpace: "nowrap",
            }}
          >
            Your daily summit
          </div>
        </div>
      </div>
    </div>
  );
}
