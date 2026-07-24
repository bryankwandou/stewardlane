import { cookies } from "next/headers";
import { Connection, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { z } from "zod";
import { readWalletSession } from "@/lib/wallet-auth";

const schema = z.object({ signature: z.string().min(80).max(100), hash: z.string().regex(/^[a-f0-9]{64}$/) });
const memoProgram = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const walletSession = readWalletSession(cookieStore.get("sl_wallet_session")?.value);
    if (!walletSession) return Response.json({ error: "A verified wallet session is required." }, { status: 401 });
    const { signature, hash } = schema.parse(await request.json());
    const connection = new Connection(process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com", "confirmed");
    const transaction = await connection.getParsedTransaction(signature, { commitment: "confirmed", maxSupportedTransactionVersion: 0 });
    if (!transaction || transaction.meta?.err) return Response.json({ error: "The devnet transaction is missing or failed." }, { status: 404 });
    const signerMatches = transaction.transaction.message.accountKeys.some((account) => account.signer && account.pubkey.toBase58() === walletSession.address);
    const expectedMemo = `stewardlane:${hash}`;
    const memoMatches = transaction.transaction.message.instructions.some((instruction) => {
      if ("parsed" in instruction) return instruction.program === "spl-memo" && String(instruction.parsed) === expectedMemo;
      return instruction.programId.equals(memoProgram) && Buffer.from(bs58.decode(instruction.data)).toString("utf8") === expectedMemo;
    });
    if (!signerMatches) return Response.json({ error: "The verified wallet did not sign this transaction." }, { status: 403 });
    if (!memoMatches) return Response.json({ error: "The transaction memo does not match the approved audit hash." }, { status: 422 });
    return Response.json({ verified: true, signature, hash, signer: walletSession.address, slot: transaction.slot, cluster: "devnet" });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: "Invalid devnet verification payload." }, { status: 400 });
    return Response.json({ error: error instanceof Error ? error.message : "Devnet verification failed." }, { status: 500 });
  }
}
