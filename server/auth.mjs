import { createClerkClient, verifyToken } from "@clerk/backend";

function adminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function getAdminFromAuthorization(authorization = "") {
  const allowedEmails = adminEmails();

  if (!process.env.CLERK_SECRET_KEY) {
    const error = new Error("Set CLERK_SECRET_KEY and ADMIN_EMAILS to enable admin access.");
    error.status = 503;
    error.code = "Clerk not configured";
    throw error;
  }

  if (!allowedEmails.length) {
    const error = new Error("Set ADMIN_EMAILS to the comma-separated admin email list.");
    error.status = 503;
    error.code = "Admin allowlist not configured";
    throw error;
  }

  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";

  if (!token) {
    const error = new Error("Missing Clerk token");
    error.status = 401;
    error.code = "Missing Clerk token";
    throw error;
  }

  const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  const user = await clerk.users.getUser(payload.sub);
  const primaryEmail = user.emailAddresses.find((item) => item.id === user.primaryEmailAddressId);
  const email = String(primaryEmail?.emailAddress || user.emailAddresses[0]?.emailAddress || "").toLowerCase();

  if (!email || !allowedEmails.includes(email)) {
    const error = new Error("Not allowed");
    error.status = 403;
    error.code = "Not allowed";
    throw error;
  }

  return {
    userId: payload.sub,
    email
  };
}

export async function requireAdmin(req, res, next) {
  try {
    req.admin = await getAdminFromAuthorization(req.headers.authorization || "");
    return next();
  } catch (error) {
    return res.status(error.status || 401).json({ error: error.code || "Invalid Clerk token", message: error.message });
  }
}
