export function FitScoreBadge({
  size = "M",
  match = 94,
  className = "",
  decorative = false
}) {
  const label = `Your size: ${size} · ${match}% match`;

  return (
    <span
      className={`fit-score-badge ${className}`.trim()}
      aria-hidden={decorative ? "true" : undefined}
      role={decorative ? undefined : "status"}
    >
      {label}
    </span>
  );
}
