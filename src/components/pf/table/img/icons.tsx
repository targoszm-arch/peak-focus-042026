// Ported from editable-react-table's src/img/*.jsx — stroke switched from a
// hardcoded hex to currentColor so these pick up the app's light/dark theme.

const base = {
  viewBox: "0 0 24 24",
  strokeWidth: 1.5,
  stroke: "currentColor",
  fill: "none",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function ArrowUpIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} {...base}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="18" y1="11" x2="12" y2="5" />
      <line x1="6" y1="11" x2="12" y2="5" />
    </svg>
  );
}

export function ArrowDownIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} {...base}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="18" y1="13" x2="12" y2="19" />
      <line x1="6" y1="13" x2="12" y2="19" />
    </svg>
  );
}

export function ArrowLeftIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} {...base}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <line x1="5" y1="12" x2="11" y2="18" />
      <line x1="5" y1="12" x2="11" y2="6" />
    </svg>
  );
}

export function ArrowRightIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} {...base}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <line x1="13" y1="18" x2="19" y2="12" />
      <line x1="13" y1="6" x2="19" y2="12" />
    </svg>
  );
}

export function HashIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} {...base}>
      <line x1="5" y1="9" x2="19" y2="9" />
      <line x1="5" y1="15" x2="19" y2="15" />
      <line x1="11" y1="4" x2="7" y2="20" />
      <line x1="17" y1="4" x2="13" y2="20" />
    </svg>
  );
}

export function MultiIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} {...base}>
      <rect x="7" y="3" width="14" height="14" rx="2" />
      <path d="M17 17v2a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2h2" />
    </svg>
  );
}

export function TextIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} {...base}>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="14" y2="12" />
      <line x1="4" y1="18" x2="18" y2="18" />
    </svg>
  );
}

export function PlusIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} {...base}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function TrashIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} {...base}>
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
      <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
      <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
    </svg>
  );
}
