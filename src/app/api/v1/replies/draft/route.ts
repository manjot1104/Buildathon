import { z } from "zod";
import { jsonOk, jsonError } from "@/lib/api/response";
import { requireAuthWorkspace } from "@/lib/api/workspace";
import { getAiProvider } from "@/lib/providers/ai";

export const dynamic = "force-dynamic";

const schema = z.object({
  tone: z.enum(["friendly", "neutral", "firm", "concise", "clarification_first"]),
  projectName: z.string().min(1),
  requestSummary: z.string().min(1),
  classification: z.string().optional(),
  proposalUrl: z.string().url().optional(),
});

export async function POST(req: Request) {
  try {
    await requireAuthWorkspace();
    const body = schema.parse(await req.json());
    const provider = getAiProvider();
    const draft = await provider.draftReply({
      ...body,
      mustNotInvent: true,
    });
    return jsonOk({
      draft,
      notice:
        "This is a draft only. Edit before sending. It will not be sent automatically.",
    });
  } catch (err) {
    return jsonError(err);
  }
}
