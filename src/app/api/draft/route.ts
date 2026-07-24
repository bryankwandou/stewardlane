import Groq from "groq-sdk";
import { z } from "zod";

const holding = z.object({ symbol:z.string(), name:z.string(), category:z.string(), quantity:z.number(), marketValue:z.number().nonnegative() });
const requestSchema = z.object({ household:z.object({ name:z.string(), members:z.array(z.string()), riskProfile:z.string(), policyNotes:z.string(), holdings:z.array(holding).min(1), recentActivity:z.string(), priorMeetingNotes:z.string() }) });

export async function POST(request:Request){
  try{
    const input=requestSchema.parse(await request.json());
    if(!process.env.GROQ_API_KEY)return Response.json({error:"GROQ_API_KEY is not configured. Stewardlane will not substitute canned commentary."},{status:503});
    const groq=new Groq({apiKey:process.env.GROQ_API_KEY});
    const completion=await groq.chat.completions.create({model:process.env.GROQ_MODEL??"openai/gpt-oss-20b",temperature:.2,max_completion_tokens:1200,messages:[
      {role:"system",content:"You draft factual meeting preparation for a licensed financial advisor. Use only supplied household data. Summarize recorded allocation, activity, policy context, prior unresolved items, and neutral questions for the advisor. Never recommend buying, selling, reallocating, increasing, decreasing, or timing an investment. Never predict performance. If data is absent, say it is not recorded. Write concise professional prose with headings: Household snapshot, Recorded portfolio context, Recent relationship context, Questions for advisor review. Do not include a client-facing disclaimer because the product UI supplies the mandatory review state."},
      {role:"user",content:JSON.stringify(input.household)}
    ]});
    const draft=completion.choices[0]?.message?.content?.trim();
    if(!draft)throw new Error("The model returned an empty draft.");
    return Response.json({draft,model:completion.model});
  }catch(error){if(error instanceof z.ZodError)return Response.json({error:"Household data did not match the drafting contract.",issues:error.issues},{status:400});return Response.json({error:error instanceof Error?error.message:"Drafting failed"},{status:500})}
}
