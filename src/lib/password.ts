import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const HASH_PREFIX = "scrypt";
const KEY_LENGTH = 64;

function toBuffer(value: string) {
  return Buffer.from(value, "hex");
}

export function isPasswordHashed(password: string) {
  return password.startsWith(`${HASH_PREFIX}$`);
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${HASH_PREFIX}$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedPassword: string) {
  if (!isPasswordHashed(storedPassword)) {
    return password === storedPassword;
  }

  const [, salt, hash] = storedPassword.split("$");

  if (!salt || !hash) {
    return false;
  }

  const derivedHash = scryptSync(password, salt, KEY_LENGTH);
  const storedHashBuffer = toBuffer(hash);

  if (derivedHash.length !== storedHashBuffer.length) {
    return false;
  }

  return timingSafeEqual(derivedHash, storedHashBuffer);
}
