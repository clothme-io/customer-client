const FACTS = [
  { icon: "👖", text: "Levi’s added rivets to jeans in 1873" },
  { icon: "👔", text: "Neckties began as soldiers’ scarves" },
  { icon: "🧵", text: "A T-shirt can take 2,700 liters of water to make" },
  { icon: "👟", text: "Sneakers outsell dress shoes" },
  { icon: "🧶", text: "Merino wool naturally resists moisture" },
  { icon: "👗", text: "Fashion Week began in New York in 1943" },
];

export function SizeProcessingFeedback({ status, seconds, factIndex }) {
  const stage = status.stage === "front" ? "Checking front photo" : status.stage === "side" ? "Checking side photo" : status.stage === "generation" ? "Calculating your size" : status.stage === "manual" ? "Estimating your measurements" : "Preparing your profile";
  const percent = Number.isFinite(status.percent) ? Math.max(0, Math.min(100, Math.round(status.percent))) : null;
  const stageSeconds = status.beganAt ? Math.max(1, (Date.now() - status.beganAt) / 1000) : 0;
  const estimate = status.stage === "generation" && percent >= 15 && percent < 100
    ? Math.min(300, Math.round(stageSeconds * (100 - percent) / percent / 5) * 5)
    : null;
  const fact = FACTS[factIndex % FACTS.length];
  return <div className="size-tool-progress" role="status" aria-live="polite">
    <div className="size-tool-progress-heading"><strong>{stage}</strong>{percent !== null ? <span>{percent}%</span> : null}</div>
    <div className="size-tool-progress-track" role="progressbar" aria-label={stage} aria-valuemin={0} aria-valuemax={100} {...(percent !== null ? { "aria-valuenow": percent } : {})}><span className={percent === null ? "is-indeterminate" : ""} style={percent !== null ? { width: `${percent}%` } : undefined} /></div>
    <p className="size-tool-progress-time">{estimate !== null ? `About ${estimate < 60 ? `${Math.max(5, estimate)} seconds` : `${Math.ceil(estimate / 60)} minutes`} remaining (estimate)` : `${seconds}s elapsed · Time remaining varies`}</p>
    <div className="size-tool-progress-fact" key={factIndex}><span className="size-tool-progress-icon" aria-hidden="true">{fact.icon}</span><span>{fact.text}</span></div>
    {status.message?.includes("Reconnecting") ? <p className="size-tool-progress-connection">{status.message}</p> : null}
  </div>;
}
