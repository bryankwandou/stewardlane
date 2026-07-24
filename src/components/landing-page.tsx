"use client";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Check, FileCheck2, Fingerprint, House, ShieldCheck } from "lucide-react";

const flow = [
  [House, "Grounded in the household", "Holdings, account activity, policy notes, and unresolved meeting items form the only drafting context."],
  [FileCheck2, "Held behind review", "Every output stays visibly marked as an AI draft until a named advisor edits and approves it."],
  [Fingerprint, "Evidence that persists", "Original text, reviewed text, actor, time, and content hash remain reconstructable for compliance review."],
] as const;

export function LandingPage() {
  return <main className="site-shell">
    <header className="nav"><Link href="/" className="wordmark">Stewardlane</Link><nav><a href="#system">System</a><a href="#control">Controls</a></nav><Link className="button dark" href="/app">Open workspace <ArrowRight size={16}/></Link></header>
    <section className="hero">
      <div className="hero-copy"><motion.p initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="eyebrow">Advisor-owned intelligence</motion.p><motion.h1 initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{delay:.05}}>AI may prepare the language.<br/><em>The advisor owns every word.</em></motion.h1><motion.p initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.12}} className="lede">Stewardlane brings household records, meeting preparation, portfolio commentary, and review evidence into one disciplined workflow for independent advisory firms.</motion.p><div className="hero-actions"><Link className="button gold" href="/app">Start with a household <ArrowRight size={17}/></Link><a className="text-link" href="#system">See the review architecture</a></div></div>
      <motion.div initial={{opacity:0,x:30}} animate={{opacity:1,x:0}} transition={{duration:.6}} className="review-card"><div className="review-head"><span>AI draft</span><b>Advisor review required</b></div><div className="review-body"><p className="mini">Quarterly commentary / draft 08</p><h2>Portfolio context, without a recommendation engine.</h2><p>Allocation movement and recent account activity are summarized from recorded holdings. Forward-looking language remains outside the modelâ€™s permitted scope.</p><div className="review-lines"><span/><span/><span/></div></div><div className="review-foot"><ShieldCheck size={18}/><span>Cannot become client-facing until approval</span></div></motion.div>
    </section>
    <section id="system" className="section"><p className="eyebrow">The operating model</p><div className="section-title"><h2>Useful enough for the meeting.<br/>Constrained enough for the firm.</h2><p>Most AI tools treat review as a suggestion. Stewardlane treats it as state: draft, reviewed, approved, and evidenced.</p></div><div className="feature-grid">{flow.map(([Icon,title,copy],index)=><article key={title}><span>0{index+1}</span><Icon size={22}/><h3>{title}</h3><p>{copy}</p></article>)}</div></section>
    <section id="control" className="control-section"><div><p className="eyebrow light">A narrower promise</p><h2>Not an automated advisor.<br/>An accountable drafting lane.</h2></div><ul><li><Check/>No buy, sell, or allocation recommendations</li><li><Check/>No invented portfolio values or placeholder market claims</li><li><Check/>No silent overwrite of original AI output</li><li><Check/>Optional Solana devnet anchoring for audit hashes</li></ul></section>
    <footer><span className="wordmark">Stewardlane</span><p>Household intelligence with a human signature.</p><Link href="/app">Enter workspace <ArrowRight size={15}/></Link></footer>
  </main>
}
