import { NextResponse } from "next/server";

import { createSession } from "@/lib/auth/session";
import { connectDb } from "@/lib/db/connection";
import { getEnv } from "@/lib/config/env";
import { User } from "@/models";

export const dynamic = "force-dynamic";

const DEMO_EMAIL = "demo@scopepilot.local";

function requestOrigin(request: Request): string {
  // Prefer Host header so cookie host matches what the browser is on
  // (localhost vs 127.0.0.1 must not mix).
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "http";
  if (host) return `${proto}://${host}`;
  return new URL(request.url).origin;
}

/** Open-access local demo: set session cookie on the redirect response. */
export async function GET(request: Request) {
  const env = getEnv();
  const origin = requestOrigin(request);

  if (!env.DEMO_OPEN_ACCESS) {
    return NextResponse.redirect(`${origin}/`);
  }

  await connectDb();
  const user = await User.findOne({ email: DEMO_EMAIL, isActive: true });
  if (!user) {
    return NextResponse.redirect(`${origin}/?demo=need-seed`);
  }

  const { rawToken } = await createSession(String(user._id), {
    userAgent: "demo-open-access",
    ip: null,
  });

  const res = NextResponse.redirect(`${origin}/app`);
  const maxAge = env.SESSION_MAX_AGE_DAYS * 24 * 60 * 60;
  res.cookies.set(env.SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge,
  });
  return res;
}
