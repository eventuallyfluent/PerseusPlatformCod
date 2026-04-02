import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ENCRYPTED_PREFIX = "enc:";

function getCredentialSecret() {
  const secret = process.env.CREDENTIAL_ENCRYPTION_KEY || process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error("Missing credential encryption secret");
  }

  return createHash("sha256").update(secret).digest();
}

export function encryptGatewayCredentialValue(value: string) {
  if (!value) {
    return value;
  }

  const iv = randomBytes(12);
  const key = getCredentialSecret();
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${ENCRYPTED_PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptGatewayCredentialValue(value?: string | null) {
  if (!value) {
    return undefined;
  }

  if (!value.startsWith(ENCRYPTED_PREFIX)) {
    return value;
  }

  const [ivText, tagText, encryptedText] = value.slice(ENCRYPTED_PREFIX.length).split(":");

  if (!ivText || !tagText || !encryptedText) {
    throw new Error("Malformed encrypted gateway credential");
  }

  const key = getCredentialSecret();
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivText, "base64"));
  decipher.setAuthTag(Buffer.from(tagText, "base64"));

  return Buffer.concat([decipher.update(Buffer.from(encryptedText, "base64")), decipher.final()]).toString("utf8");
}

export function isEncryptedGatewayCredentialValue(value?: string | null) {
  return Boolean(value?.startsWith(ENCRYPTED_PREFIX));
}
