"use client";

import { useEffect, useState } from "react";
import bs58 from "bs58";
import { Buffer } from "buffer";
import { Connection, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { CheckCircle2, ExternalLink, Wallet } from "lucide-react";
import { useStewardlane } from "@/lib/store";

type SolanaProvider = {
  publicKey?: PublicKey;
  connect: () => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  signMessage: (message: Uint8Array, display?: "utf8") => Promise<{ signature: Uint8Array }>;
  signAndSendTransaction: (transaction: Transaction) => Promise<{ signature: string }>;
};

declare global {
  interface Window {
    solana?: SolanaProvider;
    phantom?: { solana?: SolanaProvider };
  }
}

function getProvider() {
  return window.phantom?.solana ?? window.solana;
}

export async function anchorHashWithWallet(hash: string) {
  const provider = getProvider();
  if (!provider?.publicKey) throw new Error("Connect and verify a Solana wallet first.");
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  const transaction = new Transaction({ feePayer: provider.publicKey, blockhash, lastValidBlockHeight }).add(
    new TransactionInstruction({
      programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
      keys: [],
      data: Buffer.from(`stewardlane:${hash}`),
    }),
  );
  const { signature } = await provider.signAndSendTransaction(transaction);
  await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
  const verificationResponse = await fetch("/api/anchor", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ signature, hash }),
  });
  const verification = await verificationResponse.json();
  if (!verificationResponse.ok || !verification.verified) throw new Error(verification.error ?? "The devnet proof could not be verified.");
  return signature;
}

export function WalletControl() {
  const { walletAddress, setWallet } = useStewardlane();
  const [status, setStatus] = useState("Connect a Solana wallet");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/wallet/session").then((response) => response.json()).then((session) => {
      if (session.authenticated) {
        setWallet(session.address);
        setStatus("Signature verified on devnet");
      }
    }).catch(() => undefined);
  }, [setWallet]);

  async function connect() {
    setBusy(true);
    try {
      const provider = getProvider();
      if (!provider) throw new Error("Install Phantom or another injected Solana wallet.");
      const { publicKey } = await provider.connect();
      const address = publicKey.toBase58();
      setStatus("Approve the verification signature in your wallet");
      const challengeResponse = await fetch(`/api/wallet/challenge?address=${address}`);
      const challenge = await challengeResponse.json();
      if (!challengeResponse.ok) throw new Error(challenge.error);
      const signed = await provider.signMessage(new TextEncoder().encode(challenge.message), "utf8");
      const verifyResponse = await fetch("/api/wallet/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address, signature: bs58.encode(signed.signature) }),
      });
      const verification = await verifyResponse.json();
      if (!verifyResponse.ok) throw new Error(verification.error);
      setWallet(address);
      setStatus("Signature verified on devnet");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Wallet connection failed");
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    await fetch("/api/wallet/session", { method: "DELETE" });
    await getProvider()?.disconnect().catch(() => undefined);
    setWallet(undefined);
    setStatus("Connect a Solana wallet");
  }

  return <div className="wallet-control">
    <div className="wallet-status"><span>{walletAddress ? <CheckCircle2 /> : <Wallet />}</span><div><b>{walletAddress ? `${walletAddress.slice(0, 5)}…${walletAddress.slice(-5)}` : "Wallet verification"}</b><small>{status}</small></div></div>
    {walletAddress ? <div className="wallet-actions"><a href="https://faucet.solana.com" target="_blank" rel="noreferrer">Devnet SOL <ExternalLink /></a><button onClick={disconnect}>Disconnect</button></div> : <button className="wallet-connect" onClick={connect} disabled={busy}>{busy ? "Waiting for wallet…" : "Connect and verify"}</button>}
  </div>;
}
