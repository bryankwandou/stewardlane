import { cookies } from "next/headers";
import { z } from "zod";
import { createWalletMessage, createWalletSession, decodeChallenge, verifyWalletSignature } from "@/lib/wallet-auth";

const schema = z.object({ address: z.string().min(32).max(44), signature: z.string().min(80).max(100) });

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const cookieStore = await cookies();
    const encoded = cookieStore.get("sl_wallet_challenge")?.value;
    if (!encoded) return Response.json({ error: "Wallet challenge is missing or expired." }, { status: 401 });
    const challenge = decodeChallenge(encoded);
    if (challenge.address !== input.address || Date.parse(challenge.expiresAt) <= Date.now()) {
      return Response.json({ error: "Wallet challenge is invalid or expired." }, { status: 401 });
    }
    const verified = verifyWalletSignature(createWalletMessage(challenge), input.address, input.signature);
    if (!verified) return Response.json({ error: "Wallet signature could not be verified." }, { status: 401 });
    cookieStore.set("sl_wallet_session", createWalletSession(input.address), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 8 * 60 * 60,
      path: "/",
    });
    cookieStore.delete("sl_wallet_challenge");
    return Response.json({ verified: true, address: input.address, network: "devnet" });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: "Invalid wallet verification payload." }, { status: 400 });
    return Response.json({ error: error instanceof Error ? error.message : "Wallet verification failed." }, { status: 500 });
  }
}
