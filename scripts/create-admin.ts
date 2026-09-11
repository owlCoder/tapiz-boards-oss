/**
 * Bootstraps the first admin account for a self-hosted Tapiz Boards instance.
 *
 * Usage:
 *   npm run create-admin -- --email admin@example.com --password "..." --first-name Ana --last-name Petrović
 *
 * Refuses to run if an active admin already exists, unless --force is passed
 * (force = "add another admin anyway", not a destructive/overwrite flag).
 */
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../src/infrastructure/db/client";
import { users } from "../src/infrastructure/db/schema";
import { emailSchema, nameSchema, passwordSchema } from "../src/domain/validation/user.schema";

const BCRYPT_ROUNDS = 10;

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const args: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith("--")) {
      args[key] = next;
      i++;
    } else {
      args[key] = true;
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const force = args.force === true;

  const email = emailSchema.safeParse(args.email);
  const password = passwordSchema.safeParse(args.password);
  const firstName = nameSchema.safeParse(args["first-name"]);
  const lastName = nameSchema.safeParse(args["last-name"]);

  if (!email.success || !password.success || !firstName.success || !lastName.success) {
    console.error(
      "Usage: npm run create-admin -- --email you@example.com --password \"...\" --first-name Ana --last-name Petrović [--force]",
    );
    process.exit(1);
  }

  const existingAdmins = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "admin"));

  if (existingAdmins.length > 0 && !force) {
    console.error(
      `An admin account already exists (${existingAdmins.length}). Pass --force to create another one anyway.`,
    );
    process.exit(1);
  }

  const byEmail = await db.select({ id: users.id }).from(users).where(eq(users.email, email.data)).limit(1);
  if (byEmail.length > 0) {
    console.error(`A user with email ${email.data} already exists.`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password.data, BCRYPT_ROUNDS);
  const id = crypto.randomUUID();
  await db.insert(users).values({
    id,
    firstName: firstName.data,
    lastName: lastName.data,
    email: email.data,
    passwordHash,
    role: "admin",
    isActive: true,
  });

  console.log(`Admin account created: ${email.data} (id: ${id})`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to create admin:", err);
  process.exit(1);
});
