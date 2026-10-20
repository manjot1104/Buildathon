import { z } from "zod";
import { jsonCreated, jsonError } from "@/lib/api/response";
import { registerUser } from "@/lib/services/auth-service";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(120),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const result = await registerUser({
      ...body,
      userAgent: req.headers.get("user-agent"),
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    });
    return jsonCreated(result);
  } catch (err) {
    return jsonError(err);
  }
}
