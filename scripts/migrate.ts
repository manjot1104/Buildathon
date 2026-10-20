/**
 * Versioned migration runner for schema/data corrections.
 * Migrations are idempotent and recorded in the `migrations` collection.
 */
import mongoose from "mongoose";

const MigrationSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  appliedAt: { type: Date, default: Date.now },
});

type Migration = {
  name: string;
  up: (db: mongoose.Connection) => Promise<void>;
};

const migrations: Migration[] = [
  {
    name: "001_ensure_indexes",
    async up(db) {
      // Touch collections so mongoose indexes are ensured on next app boot.
      await db.collection("users").createIndex({ email: 1 }, { unique: true });
      await db.collection("workspaces").createIndex({ slug: 1 }, { unique: true });
      await db
        .collection("workspacememberships")
        .createIndex({ workspaceId: 1, userId: 1 }, { unique: true });
      await db
        .collection("changeproposals")
        .createIndex({ accessTokenHash: 1 }, { sparse: true });
    },
  },
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is required");
  await mongoose.connect(uri);
  const MigrationModel =
    mongoose.models.Migration ?? mongoose.model("Migration", MigrationSchema);

  for (const m of migrations) {
    const existing = await MigrationModel.findOne({ name: m.name });
    if (existing) {
      console.log(`skip ${m.name}`);
      continue;
    }
    console.log(`apply ${m.name}`);
    await m.up(mongoose.connection);
    await MigrationModel.create({ name: m.name });
  }

  await mongoose.disconnect();
  console.log("Migrations complete");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
