import { z } from "zod";
import { jsonCreated, jsonError } from "@/lib/api/response";
import { requireAuthWorkspace } from "@/lib/api/workspace";
import { assertObjectId } from "@/lib/auth/authorization";
import {
  createManualAnalysis,
  requestAiAnalysis,
} from "@/lib/services/analysis-service";
import { isAiConfigured } from "@/lib/config/env";
import { AppError } from "@/lib/errors";
import { ANALYSIS_CLASSIFICATIONS } from "@/models/enums";

type Ctx = { params: { requestId: string } };

const manualSchema = z.object({
  mode: z.literal("manual"),
  classification: z.enum(ANALYSIS_CLASSIFICATIONS),
  explanation: z.string().min(1).max(10000),
  relevantScopeItems: z.array(z.string()).optional(),
  followUpQuestions: z.array(z.string()).optional(),
  effortLowHours: z.number().nonnegative().nullable().optional(),
  effortHighHours: z.number().nonnegative().nullable().optional(),
  deadlineImpactDays: z.number().nullable().optional(),
  suggestedClientResponse: z.string().optional(),
});

const aiSchema = z.object({ mode: z.literal("ai") });

export async function POST(req: Request, { params }: Ctx) {
  try {
    const { session, workspace } = await requireAuthWorkspace();
    assertObjectId(params.requestId, "Request");
    const raw = await req.json();

    if (raw.mode === "ai") {
      aiSchema.parse(raw);
      if (!isAiConfigured()) {
        throw new AppError(
          "AI_UNAVAILABLE",
          "AI analysis is not configured. Complete a manual analysis instead."
        );
      }
      const analysis = await requestAiAnalysis({
        workspaceId: workspace.workspaceId,
        requestId: params.requestId,
        userId: session.user.id,
      });
      return jsonCreated({
        id: String(analysis._id),
        mode: "ai",
        status: "queued",
        message: "AI analysis started. Refresh shortly to see results.",
      });
    }

    const body = manualSchema.parse(raw);
    const analysis = await createManualAnalysis({
      workspaceId: workspace.workspaceId,
      requestId: params.requestId,
      userId: session.user.id,
      classification: body.classification,
      explanation: body.explanation,
      relevantScopeItems: body.relevantScopeItems,
      followUpQuestions: body.followUpQuestions,
      effortLowHours: body.effortLowHours,
      effortHighHours: body.effortHighHours,
      deadlineImpactDays: body.deadlineImpactDays,
      suggestedClientResponse: body.suggestedClientResponse,
    });
    return jsonCreated({
      id: String(analysis._id),
      mode: "manual",
      classification: analysis.classification,
    });
  } catch (err) {
    return jsonError(err);
  }
}
