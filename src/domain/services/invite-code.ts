/** Alfabet bez 0/O/1/I — kodovi se diktiraju i kucaju ručno. */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateInviteCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  let code = "";
  for (const b of bytes) code += ALPHABET[b % ALPHABET.length];
  return `TB-${code}`;
}
