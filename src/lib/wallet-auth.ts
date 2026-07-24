import { createHmac, timingSafeEqual } from "node:crypto";
import bs58 from "bs58";
import nacl from "tweetnacl";

export type WalletChallenge = {
  address: string;
  nonce: string;
  issuedAt: string;
  expiresAt: string;
};

export function createWalletMessage(challenge: WalletChallenge) {
  return [
    "Stewardlane wallet verification",
    "",
    `Address: ${challenge.address}`,
    `Nonce: ${challenge.nonce}`,
    `Issued at: ${challenge.issuedAt}`,
    `Expires at: ${challenge.expiresAt}`,
    "Network: Solana devnet",
    "Purpose: authenticate this wallet to the Stewardlane review workspace.",
  ].join("\n");
}

export function verifyWalletSignature(message: string, address: string, signature: string) {
  return nacl.sign.detached.verify(
    new TextEncoder().encode(message),
    bs58.decode(signature),
    bs58.decode(address),
  );
}

export function encodeChallenge(challenge: WalletChallenge) {
  return Buffer.from(JSON.stringify(challenge)).toString("base64url");
}

export function decodeChallenge(value: string) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as WalletChallenge;
}

function sessionSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not configured.");
  return secret;
}

export function createWalletSession(address: string) {
  const payload = Buffer.from(JSON.stringify({ address, expiresAt: Date.now() + 8 * 60 * 60 * 1000 })).toString("base64url");
  const signature = createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function readWalletSession(token?: string) {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { address: string; expiresAt: number };
  return session.expiresAt > Date.now() ? session : null;
}
