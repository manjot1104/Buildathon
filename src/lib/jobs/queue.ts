import { connectDb } from "@/lib/db/connection";
import { BackgroundJob } from "@/models";
import { logger } from "@/lib/logger";
import { processJob } from "./processors";

export async function enqueueJob(input: {
  type: string;
  payload: Record<string, unknown>;
  idempotencyKey?: string;
  delayMs?: number;
  maxAttempts?: number;
}) {
  await connectDb();

  if (input.idempotencyKey) {
    const existing = await BackgroundJob.findOne({
      type: input.type,
      idempotencyKey: input.idempotencyKey,
    });
    if (existing) return existing;
  }

  const job = await BackgroundJob.create({
    type: input.type,
    payload: input.payload,
    idempotencyKey: input.idempotencyKey ?? null,
    availableAt: new Date(Date.now() + (input.delayMs ?? 0)),
    maxAttempts: input.maxAttempts ?? 5,
    status: "pending",
  });

  // Fire-and-forget processing in development / serverless-friendly kick
  void drainJobs(1).catch((err) => logger.warn({ err }, "Job drain failed"));

  return job;
}

export async function drainJobs(limit = 10): Promise<number> {
  await connectDb();
  let processed = 0;
  const workerId = `worker-${process.pid}-${Date.now()}`;

  for (let i = 0; i < limit; i++) {
    const job = await BackgroundJob.findOneAndUpdate(
      {
        status: "pending",
        availableAt: { $lte: new Date() },
      },
      {
        $set: { status: "processing", lockedAt: new Date(), lockedBy: workerId },
        $inc: { attempts: 1 },
      },
      { sort: { availableAt: 1 }, new: true }
    );

    if (!job) break;

    try {
      await processJob(job.type, job.payload as Record<string, unknown>);
      job.status = "completed";
      job.completedAt = new Date();
      job.lastError = null;
      await job.save();
      processed += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown job error";
      logger.error({ err, jobId: job._id, type: job.type }, "Job failed");
      if (job.attempts >= job.maxAttempts) {
        job.status = "dead";
        job.lastError = message;
      } else {
        job.status = "pending";
        job.lastError = message;
        job.availableAt = new Date(Date.now() + Math.min(60_000, 2 ** job.attempts * 1000));
      }
      job.lockedAt = null;
      job.lockedBy = null;
      await job.save();
    }
  }

  return processed;
}
