import { z } from "zod";
import { jsonOk, jsonError } from "@/lib/api/response";
import { loginUser } from "@/lib/services/auth-service";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const result = await loginUser({
      ...body,
      userAgent: req.headers.get("user-agent"),
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    });
    return jsonOk(result);
  } catch (err) {
    return jsonError(err);
  }
}
