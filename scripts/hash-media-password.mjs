import { randomBytes, scryptSync } from "node:crypto";

const password = process.env.MEDIA_PASSWORD_INPUT;

if (!password) {
  console.error("Set MEDIA_PASSWORD_INPUT temporarily, then run this script again.");
  process.exit(1);
}

const salt = randomBytes(16);
const derivedKey = scryptSync(password, salt, 64);

console.log(`scrypt:${salt.toString("base64url")}:${derivedKey.toString("base64url")}`);
