import { createClerkClient, verifyToken } from "@clerk/backend";

function adminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireAdmin(req, res, next) {
  const allowedEmails = adminEmails();

  if (!process.env.CLERK_SECRET_KEY) {
    return res.status(503).json({
      error: "Clerk not configured",
      message: "Set CLERK_SECRET_KEY and ADMIN_EMAILS to enable admin access."
    });
  }

  if (!allowedEmails.length) {
    return res.status(503).json({
      error: "Admin allowlist not configured",
      message: "Set ADMIN_EMAILS to the comma-separated admin email list."
    });
  }

  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    return res.status(401).json({ error: "Missing Clerk token" });
  }

  try {
    const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
    const user = await clerk.users.getUser(payload.sub);
    const primaryEmail = user.emailAddresses.find((item) => item.id === user.primaryEmailAddressId);
    const email = String(primaryEmail?.emailAddress || user.emailAddresses[0]?.emailAddress || "").toLowerCase();

    if (!email || !allowedEmails.includes(email)) {
      return res.status(403).json({ error: "Not allowed" });
    }

    req.admin = {
      userId: payload.sub,
      email
    };

    return next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid Clerk token" });
  }
}
