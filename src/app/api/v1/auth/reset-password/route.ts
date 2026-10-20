import { z } from "zod";
import { jsonOk, jsonError } from "@/lib/api/response";
import { resetPassword } from "@/lib/services/auth-service";

const schema = z.object({
  token: z.string().min(10),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    await resetPassword(body.token, body.password);
    return jsonOk({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
