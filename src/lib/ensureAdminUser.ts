import bcrypt from "bcryptjs";
import User from "@/models/User";

const DEFAULT_ADMIN_EMAIL = "admin@local.dev";
const DEFAULT_ADMIN_PASSWORD = "Admin@123";
let ensureAdminPromise: Promise<void> | null = null;
let hasEnsuredAdmin = false;

async function ensureAdminUserInternal() {
  const email = (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).toLowerCase();
  const existing = await User.findOne({ email }).select("_id").lean();
  if (existing) return;

  const password = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
  const passwordHash = await bcrypt.hash(password, 10);

  await User.create({
    name: "System Admin",
    email,
    passwordHash,
    role: "Admin",
  });
}

export async function ensureAdminUser() {
  if (hasEnsuredAdmin) return;
  if (!ensureAdminPromise) {
    ensureAdminPromise = ensureAdminUserInternal()
      .then(() => {
        hasEnsuredAdmin = true;
      })
      .finally(() => {
        ensureAdminPromise = null;
      });
  }
  await ensureAdminPromise;
}
