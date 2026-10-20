import { z } from "zod";
import { jsonCreated, jsonError } from "@/lib/api/response";
import { requireSession } from "@/lib/auth/session";
import { completeOnboardingWorkspace } from "@/lib/services/auth-service";
import { setWorkspaceCookieValue } from "@/lib/api/workspace";
import { connectDb } from "@/lib/db/connection";
import { User } from "@/models";
import { toMinor } from "@/lib/money";

export const dynamic = "force-dynamic";

const schema = z.object({
  workspaceName: z.string().min(1).max(120),
  type: z.enum(["freelancer", "agency"]),
  currency: z.string().length(3),
  timezone: z.string().min(1),
  defaultPricingModel: z.enum(["fixed", "hourly", "milestone"]),
  defaultHourlyRate: z.number().nonnegative().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = schema.parse(await req.json());
    const result = await completeOnboardingWorkspace({
      userId: session.user.id,
      workspaceName: body.workspaceName,
      type: body.type,
      currency: body.currency,
      timezone: body.timezone,
      defaultPricingModel: body.defaultPricingModel,
      defaultHourlyRateMinor:
        body.defaultHourlyRate !== undefined ? toMinor(body.defaultHourlyRate) : 0,
    });
    setWorkspaceCookieValue(result.workspaceId);
    return jsonCreated(result);
  } catch (err) {
    return jsonError(err);
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireSession();
    const body = z
      .object({
        step: z.number().int().min(0).max(10).optional(),
        completed: z.boolean().optional(),
      })
      .parse(await req.json());
    await connectDb();
    const user = await User.findById(session.user.id);
    if (!user) throw new Error("User not found");
    if (body.step !== undefined) user.onboardingStep = body.step;
    if (body.completed) {
      user.onboardingCompletedAt = new Date();
      user.onboardingStep = 8;
    }
    await user.save();
    return jsonCreated({
      onboardingStep: user.onboardingStep,
      onboardingCompletedAt: user.onboardingCompletedAt,
    });
  } catch (err) {
    return jsonError(err);
  }
}
