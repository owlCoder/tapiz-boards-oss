// Kanonski ActionResult živi u @tapizlabs/app-kit (deljen među proizvodima).
// Lokalni re-export da postojeći `@/lib/action-result` importi rade bez izmena.
export { ok, fail, isOk, type ActionResult } from "@tapizlabs/app-kit";
