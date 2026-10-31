export function withoutHowToApply(source) {
  if (typeof source !== "string") return source;
  const marker = "\n## How to Apply\n";
  const index = source.indexOf(marker);
  return index < 0 ? source : `${source.slice(0, index).trimEnd()}\n`;
}
