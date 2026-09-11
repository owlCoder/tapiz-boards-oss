import { DomainError } from "@/application/errors";
import { UnauthorizedError } from "@/lib/guards";
import { fail, type ActionResult } from "@/lib/action-result";

/** Izvršava akciju i mapira poznate greške u srpsku poruku umesto bacanja. */
export async function runAction<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof DomainError || err instanceof UnauthorizedError) {
      return fail(err.message);
    }
    console.error(err);
    return fail("Došlo je do neočekivane greške");
  }
}
