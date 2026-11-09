import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  createHash,
  createCipheriv,
  createDecipheriv,
  createHmac,
} from "node:crypto";
export const token = () => randomBytes(32).toString("base64url");
export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scryptCallback(
      password,
      salt,
      64,
      { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 },
      (error, key) => (error ? reject(error) : resolve(key)),
    ),
  );
}
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt:${salt}:${(await derive(password, salt)).toString("hex")}`;
}
export async function verifyPassword(password: string, encoded: string) {
  const [, salt, hash] = encoded.split(":");
  if (!salt || !hash || hash.length !== 128) return false;
  return timingSafeEqual(
    await derive(password, salt),
    Buffer.from(hash, "hex"),
  );
}
function key() {
  const value = process.env.AUTH_ENCRYPTION_KEY;
  if (!value || !/^[a-f0-9]{64}$/i.test(value))
    throw new Error("ENCRYPTION_NOT_CONFIGURED");
  return Buffer.from(value, "hex");
}
export function encrypt(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  return [
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}
export function decrypt(value: string) {
  const [iv, tag, data] = value.split(".");
  const cipher = createDecipheriv(
    "aes-256-gcm",
    key(),
    Buffer.from(iv, "base64url"),
  );
  cipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    cipher.update(Buffer.from(data, "base64url")),
    cipher.final(),
  ]).toString("utf8");
}
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export function totpSecret() {
  return Array.from(randomBytes(32), (b) => alphabet[b & 31]).join("");
}
export function totp(secret: string, step = Math.floor(Date.now() / 30000)) {
  let bits = "";
  for (const char of secret)
    bits += alphabet.indexOf(char).toString(2).padStart(5, "0");
  const bytes = Buffer.from(
    (bits.match(/.{8}/g) ?? []).map((byte) => parseInt(byte, 2)),
  );
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const hash = createHmac("sha1", bytes).update(counter).digest();
  const offset = hash[19] & 15;
  return ((hash.readUInt32BE(offset) & 0x7fffffff) % 1000000)
    .toString()
    .padStart(6, "0");
}
export function validTotpStep(secret: string, code: string) {
  if (!/^\d{6}$/.test(code)) return null;
  const step = Math.floor(Date.now() / 30000);
  return (
    [step - 1, step, step + 1].find((s) =>
      timingSafeEqual(Buffer.from(totp(secret, s)), Buffer.from(code)),
    ) ?? null
  );
}
export function validTotp(secret: string, code: string) {
  return validTotpStep(secret, code) !== null;
}
