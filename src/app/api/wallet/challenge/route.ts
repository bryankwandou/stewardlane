import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { PublicKey } from "@solana/web3.js";
import { createWalletMessage, encodeChallenge, type WalletChallenge } from "@/lib/wallet-auth";

export async function GET(request: Request) {
  try {
    const address = new URL(request.url).searchParams.get("address") ?? "";
    new PublicKey(address);
    const now = new Date();
    const challenge: WalletChallenge = {
      address,
      nonce: randomUUID(),
      issuedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 5 * 60 * 1000).toISOString(),
    };
    const cookieStore = await cookies();
    cookieStore.set("sl_wallet_challenge", encodeChallenge(challenge), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 300,
      path: "/",
    });
    return Response.json({ message: createWalletMessage(challenge), expiresAt: challenge.expiresAt });
  } catch {
    return Response.json({ error: "A valid Solana wallet address is required." }, { status: 400 });
  }
}
