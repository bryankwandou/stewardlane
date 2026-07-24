import assert from "node:assert/strict";
import test from "node:test";
import bs58 from "bs58";
import nacl from "tweetnacl";
import { createWalletMessage, createWalletSession, readWalletSession, verifyWalletSignature, type WalletChallenge } from "../src/lib/wallet-auth.ts";

test("verifies a real Ed25519 wallet signature", () => {
  const keypair = nacl.sign.keyPair();
  const challenge: WalletChallenge = { address: bs58.encode(keypair.publicKey), nonce: "test-nonce", issuedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 60_000).toISOString() };
  const message = createWalletMessage(challenge);
  const signature = nacl.sign.detached(new TextEncoder().encode(message), keypair.secretKey);
  assert.equal(verifyWalletSignature(message, challenge.address, bs58.encode(signature)), true);
  assert.equal(verifyWalletSignature(`${message} altered`, challenge.address, bs58.encode(signature)), false);
});

test("creates a tamper-evident wallet session", () => {
  process.env.AUTH_SECRET = "test-secret-with-sufficient-entropy";
  const token = createWalletSession("wallet-address");
  assert.equal(readWalletSession(token)?.address, "wallet-address");
  assert.equal(readWalletSession(`${token}tampered`), null);
});
