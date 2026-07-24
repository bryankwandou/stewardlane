import { cookies } from "next/headers";
import { readWalletSession } from "@/lib/wallet-auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = readWalletSession(cookieStore.get("sl_wallet_session")?.value);
    return Response.json(session ? { authenticated: true, ...session, network: "devnet" } : { authenticated: false });
  } catch {
    return Response.json({ authenticated: false });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("sl_wallet_session");
  return Response.json({ authenticated: false });
}
