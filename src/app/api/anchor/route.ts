import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction, sendAndConfirmTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import { cookies } from "next/headers";
import { z } from "zod";
import { readWalletSession } from "@/lib/wallet-auth";

const schema=z.object({hash:z.string().regex(/^[a-f0-9]{64}$/)});
const memoProgram=new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

function signer(){const raw=process.env.SOLANA_PRIVATE_KEY;if(!raw)throw new Error("SOLANA_PRIVATE_KEY is not configured.");const value=raw.trim();const parsed=value.startsWith("[")?Uint8Array.from(JSON.parse(value)):value.includes(",")?Uint8Array.from(value.split(",").map(Number)):bs58.decode(value);return Keypair.fromSecretKey(parsed)}

export async function POST(request:Request){try{const cookieStore=await cookies();const walletSession=readWalletSession(cookieStore.get("sl_wallet_session")?.value);if(!walletSession)return Response.json({error:"A verified wallet session is required."},{status:401});const {hash}=schema.parse(await request.json());const connection=new Connection(process.env.SOLANA_RPC_URL??"https://api.devnet.solana.com","confirmed");const payer=signer();const transaction=new Transaction().add(new TransactionInstruction({programId:memoProgram,keys:[],data:Buffer.from(`stewardlane:${hash}`)}));const signature=await sendAndConfirmTransaction(connection,transaction,[payer]);return Response.json({signature,cluster:"devnet",payer:payer.publicKey.toBase58(),requestedBy:walletSession.address})}catch(error){if(error instanceof z.ZodError)return Response.json({error:"Invalid audit hash."},{status:400});return Response.json({error:error instanceof Error?error.message:"Anchoring failed"},{status:500})}}
