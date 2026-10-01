import { createHmac, timingSafeEqual, createHash } from "node:crypto";
import { WEBCLIENT_MOCK } from "./config";
import type { WebClientSession } from "./session";
export type SizeTicket = {
  accountId: string;
  personId: string;
  taskId: string;
  kind: "validate" | "validated" | "generate";
  issuedAt: string;
  pose?: "front" | "side";
  profile?: Record<string, string>;
};
function secret() {
  const key =
    process.env.SIZE_JOB_SIGNING_KEY ||
    (WEBCLIENT_MOCK ? "development-only-mock-size-job-key" : "");
  if (key.length < 32)
    throw new Error("Sizing job signing is not configured.");
  return key;
}
export function signSizeTicket(ticket: SizeTicket) {
  const data = Buffer.from(JSON.stringify(ticket)).toString("base64url");
  return `${data}.${createHmac("sha256", secret()).update(data).digest("base64url")}`;
}
export function verifySizeTicket(
  raw: string,
  session: WebClientSession,
  taskId: string,
  kind: SizeTicket["kind"],
) {
  const [data, signature, extra] = raw.split(".");
  if (!data || !signature || extra || raw.length > 8000)
    throw new Error("Invalid sizing session. Return to photo capture.");
  const expected = createHmac("sha256", secret()).update(data).digest();
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    throw new Error("Invalid sizing session.");
  const ticket = JSON.parse(
    Buffer.from(data, "base64url").toString(),
  ) as SizeTicket;
  if (
    ticket.accountId !== session.accountId ||
    ticket.personId !== session.personId ||
    ticket.taskId !== taskId ||
    ticket.kind !== kind ||
    !Number.isFinite(Date.parse(ticket.issuedAt)) ||
    Date.now() - Date.parse(ticket.issuedAt) > 24 * 60 * 60_000
  )
    throw new Error(
      "This sizing job belongs to a different or expired session.",
    );
  return ticket;
}
export function operationId(ticket: SizeTicket) {
  const hex = createHash("sha256")
    .update(`${ticket.accountId}:${ticket.personId}:${ticket.taskId}`)
    .digest("hex")
    .slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20)}`;
}
