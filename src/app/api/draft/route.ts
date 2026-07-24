import Groq from "groq-sdk";
import { cookies } from "next/headers";
import { z } from "zod";
import { readWalletSession } from "@/lib/wallet-auth";

const holding = z.object({ symbol:z.string(), name:z.string(), category:z.string(), quantity:z.number(), marketValue:z.number().nonnegative() });
const requestSchema = z.object({ household:z.object({ name:z.string(), members:z.array(z.string()), riskProfile:z.string(), policyNotes:z.string(), holdings:z.array(holding).min(1), recentActivity:z.string(), priorMeetingNotes:z.string() }) });
const reviewSchema = z.object({
  verdict: z.enum(["pass", "review"]),
  summary: z.string().min(10).max(500),
  flags: z.array(z.string()).max(8),
  checks: z.array(z.object({ label: z.string(), status: z.enum(["pass", "flag"]), evidence: z.string() })).min(3).max(8),
});

export async function POST(request:Request){
  try{
    const cookieStore = await cookies();
    const walletSession = readWalletSession(cookieStore.get("sl_wallet_session")?.value);
    if (!walletSession) return Response.json({ error: "A verified wallet session is required to run advisor agents." }, { status: 401 });
    const input=requestSchema.parse(await request.json());
    if(!process.env.GROQ_API_KEY)return Response.json({error:"GROQ_API_KEY is not configured. Stewardlane will not substitute canned commentary."},{status:503});
    const groq=new Groq({apiKey:process.env.GROQ_API_KEY});
    const completion=await groq.chat.completions.create({model:process.env.GROQ_MODEL??"openai/gpt-oss-20b",temperature:.2,max_completion_tokens:1200,messages:[
      {role:"system",content:"You draft factual meeting preparation for a licensed financial advisor. Use only supplied household data. Summarize recorded allocation, activity, policy context, prior unresolved items, and neutral questions for the advisor. Never recommend buying, selling, reallocating, increasing, decreasing, or timing an investment. Never predict performance. If data is absent, say it is not recorded. Write concise professional prose with headings: Household snapshot, Recorded portfolio context, Recent relationship context, Questions for advisor review. Do not include a client-facing disclaimer because the product UI supplies the mandatory review state."},
      {role:"user",content:JSON.stringify(input.household)}
    ]});
    const draft=completion.choices[0]?.message?.content?.trim();
    if(!draft)throw new Error("The model returned an empty draft.");
    const complianceCompletion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL ?? "openai/gpt-oss-20b",
      temperature: 0,
      max_completion_tokens: 700,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are a compliance review agent for a financial-advisor drafting system. Compare the draft strictly against the supplied source record. Flag any buy/sell/reallocation recommendation, performance prediction, unsupported numeric claim, invented fact, or forward-looking market opinion. Return JSON only with: verdict (pass or review), summary, flags (string array), checks (array of label, status pass or flag, evidence). A pass means no detected issue, not approval for client use. Advisor review remains mandatory." },
        { role: "user", content: JSON.stringify({ source: input.household, draft }) },
      ],
    });
    const reviewContent = complianceCompletion.choices[0]?.message?.content;
    if (!reviewContent) throw new Error("The compliance agent returned an empty review.");
    const agentReview = reviewSchema.parse(JSON.parse(reviewContent));
    return Response.json({
      draft,
      agentReview,
      pipeline: [
        { stage: "wallet_auth", status: "complete", address: walletSession.address },
        { stage: "grounding", status: "complete", sourceHoldings: input.household.holdings.length },
        { stage: "drafting_agent", status: "complete", model: completion.model },
        { stage: "compliance_agent", status: "complete", model: complianceCompletion.model },
      ],
    });
  }catch(error){if(error instanceof z.ZodError)return Response.json({error:"Household data did not match the drafting contract.",issues:error.issues},{status:400});return Response.json({error:error instanceof Error?error.message:"Drafting failed"},{status:500})}
}
