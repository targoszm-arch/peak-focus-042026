export default function Badge({ value, backgroundColor }: { value: React.ReactNode; backgroundColor?: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        fontWeight: 600,
        fontSize: 12.5,
        color: "var(--text-primary)",
        borderRadius: "var(--radius-sm)",
        background: backgroundColor,
        padding: "2px 8px",
      }}
    >
      {value}
    </span>
  );
}
