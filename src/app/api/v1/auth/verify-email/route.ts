import { z } from "zod";
import { jsonOk, jsonError } from "@/lib/api/response";
import { verifyEmail } from "@/lib/services/auth-service";

export const dynamic = "force-dynamic";

const schema = z.object({ token: z.string().min(10) });

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    await verifyEmail(body.token);
    return jsonOk({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
