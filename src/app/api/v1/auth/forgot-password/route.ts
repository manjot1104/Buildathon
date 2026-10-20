import { z } from "zod";
import { jsonOk, jsonError } from "@/lib/api/response";
import { requestPasswordReset } from "@/lib/services/auth-service";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    await requestPasswordReset(
      body.email,
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null
    );
    return jsonOk({
      ok: true,
      message: "If an account exists for that email, a reset link has been sent.",
    });
  } catch (err) {
    return jsonError(err);
  }
}
