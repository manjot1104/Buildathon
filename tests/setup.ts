import { beforeAll, afterAll, afterEach } from "vitest";
import mongoose from "mongoose";
import { resetEnvCache } from "@/lib/config/env";
import { resetRateLimits } from "@/lib/security/rate-limit";

/**
 * DB test setup. Requires MONGODB_URI pointing at a reachable MongoDB.
 * Example: mongodb://127.0.0.1:27017/scopepilot-test
 * Or MongoDB Atlas connection string.
 */
export async function connectTestDb() {
  process.env.SESSION_SECRET =
    process.env.SESSION_SECRET ?? "test-session-secret-at-least-32-characters-long";
  process.env.APP_URL = process.env.APP_URL ?? "http://localhost:3000";
  process.env.AI_PROVIDER = "none";

  if (!process.env.MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is required for integration tests. Set it to a local or Atlas MongoDB URI."
    );
  }

  resetEnvCache();
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
}

export async function clearTestDb() {
  resetRateLimits();
  if (mongoose.connection.readyState !== 1) return;
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key]?.deleteMany({});
  }
}

export async function disconnectTestDb() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  resetEnvCache();
}

// Shared hooks when this file is loaded as setupFiles
beforeAll(async () => {
  if (!process.env.MONGODB_URI) {
    console.warn("Skipping DB connection — MONGODB_URI not set");
    return;
  }
  await connectTestDb();
}, 60_000);

afterEach(async () => {
  if (process.env.MONGODB_URI) await clearTestDb();
});

afterAll(async () => {
  await disconnectTestDb();
});
