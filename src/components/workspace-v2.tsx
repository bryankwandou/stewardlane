"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { Anchor, Check, CheckCircle2, ClipboardCheck, FileWarning, Landmark, Plus, ShieldCheck, Users, X } from "lucide-react";
import { findRecommendationRisk, sha256 } from "@/lib/compliance";
import { useStewardlane } from "@/lib/store";
import type { AuditEvent, CommentaryDraft, Household, HouseholdTask, Role } from "@/lib/types";
import { anchorHashWithWallet, WalletControl } from "@/components/wallet-control";

const uid = () => crypto.randomUUID();
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
type View = "households" | "operations" | "drafts" | "audit";

export function WorkspaceV2() {
  const store = useStewardlane();
  const [view, setView] = useState<View>("households");
  const [selectedId, setSelectedId] = useState<string>();
  const selected = store.households.find((household) => household.id === selectedId) ?? store.households[0];

  return <main className="workspace">
    <aside className="sidebar">
      <Link href="/" className="wordmark lightmark">Stewardlane</Link>
      <WalletControl />
      <div className="identity">
        <label>MVP role simulation</label>
        <select value={store.role} onChange={(event) => store.setIdentity(event.target.value as Role, store.actor)}>
          <option value="advisor">Advisor</option><option value="associate">Associate</option><option value="compliance">Compliance officer</option>
        </select>
        <input value={store.actor} onChange={(event) => store.setIdentity(store.role, event.target.value)} aria-label="Team member name" />
      </div>
      <nav>{([
        ["households", Users, "Households"],
        ["operations", ClipboardCheck, "Meetings & tasks"],
        ["drafts", FileWarning, "AI review queue"],
        ["audit", ShieldCheck, "Audit ledger"],
      ] as const).map(([key, Icon, label]) => <button key={key} className={view === key ? "active" : ""} onClick={() => setView(key)}><Icon />{label}</button>)}</nav>
      <div className="sidebar-note"><span>Enforced boundary</span><p>Approval requires an Advisor role and a wallet session proven by an Ed25519 signature.</p></div>
    </aside>
    <section className="workarea">
      <header className="worktop"><div><p className="eyebrow">{view.replaceAll("_", " ")}</p><h1>{view === "households" ? "Household intelligence" : view === "operations" ? "Relationship operations" : view === "drafts" ? "AI review queue" : "Compliance evidence"}</h1></div><div className="role-pill">{store.walletAddress ? "wallet verified" : store.role}</div></header>
      <AnimatePresence mode="wait">
        <motion.div key={view} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.24 }}>
          {view === "households" && <HouseholdView selected={selected} onSelect={setSelectedId} />}
          {view === "operations" && <OperationsView selected={selected} />}
          {view === "drafts" && <DraftQueue />}
          {view === "audit" && <AuditLedger />}
        </motion.div>
      </AnimatePresence>
    </section>
  </main>;
}

function HouseholdView({ selected, onSelect }: { selected?: Household; onSelect: (id: string) => void }) {
  const { households, role } = useStewardlane();
  const total = selected?.holdings.reduce((sum, holding) => sum + holding.marketValue, 0) ?? 0;
  const allocations = useMemo(() => selected ? Object.entries(selected.holdings.reduce<Record<string, number>>((map, holding) => ({ ...map, [holding.category]: (map[holding.category] ?? 0) + holding.marketValue }), {})) : [], [selected]);
  return <div className="dashboard-grid"><section className="panel households-panel"><div className="panel-head"><h2>Households</h2>{role !== "compliance" && <AddHousehold />}</div>{households.length === 0 ? <Empty title="No household records" copy="Enter real household and holdings data. Stewardlane ships with no fabricated portfolio values." /> : <div className="household-list">{households.map((household) => <motion.button whileHover={{ x: 3 }} key={household.id} className={selected?.id === household.id ? "selected" : ""} onClick={() => onSelect(household.id)}><span>{household.name}</span><small>{household.members.join(" · ")}</small></motion.button>)}</div>}</section>
    <section className="panel detail-panel">{selected ? <><div className="panel-head"><div><p className="eyebrow">Household record</p><h2>{selected.name}</h2></div>{role === "advisor" && <DraftButton household={selected} />}</div>{role === "associate" ? <Restricted /> : <><div className="metric-row"><div><span>Recorded assets</span><b>{money.format(total)}</b></div><div><span>Holdings</span><b>{selected.holdings.length}</b></div><div><span>Risk profile</span><b>{selected.riskProfile || "Not recorded"}</b></div></div><h3>Allocation from recorded holdings</h3>{allocations.length ? <div className="allocation">{allocations.map(([category, value]) => <div key={category}><span>{category}</span><div><motion.i initial={{ width: 0 }} animate={{ width: `${total ? value / total * 100 : 0}%` }} transition={{ duration: 0.55 }} /></div><b>{total ? Math.round(value / total * 100) : 0}%</b></div>)}</div> : <p className="muted">No holdings entered. Stewardlane does not invent portfolio values.</p>}<div className="notes-grid"><div><span>Investment policy notes</span><p>{selected.policyNotes || "No notes recorded."}</p></div><div><span>Prior meeting notes</span><p>{selected.priorMeetingNotes || "No notes recorded."}</p></div></div></>}</> : <Empty title="Select a household" copy="Portfolio context appears after a real record exists." />}</section></div>;
}

function AddHousehold() {
  const addHousehold = useStewardlane((state) => state.addHousehold);
  const [open, setOpen] = useState(false);
  return <><button className="small-button" onClick={() => setOpen(true)}><Plus />Add household</button><AnimatePresence>{open && <motion.div className="modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.form initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} className="dialog" onSubmit={(event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const holdings = String(data.get("holdings") ?? "").split("\n").map((line) => line.trim()).filter(Boolean).map((line) => { const [symbol, name, category, value, quantity] = line.split(",").map((item) => item.trim()); return { id: uid(), symbol, name: name || symbol, category: (category || "Equity") as Household["holdings"][number]["category"], marketValue: Number(value) || 0, quantity: Number(quantity) || 0 }; });
    addHousehold({ id: uid(), name: String(data.get("name")), members: String(data.get("members")).split(",").map((value) => value.trim()).filter(Boolean), riskProfile: String(data.get("risk")), policyNotes: String(data.get("policy")), recentActivity: String(data.get("activity")), priorMeetingNotes: String(data.get("notes")), holdings, createdAt: new Date().toISOString() });
    setOpen(false);
  }}><div className="dialog-head"><div><p className="eyebrow">Real source record</p><h2>Add household</h2></div><button type="button" onClick={() => setOpen(false)} aria-label="Close"><X /></button></div><label>Household name<input name="name" required /></label><label>Members, comma separated<input name="members" required /></label><div className="two"><label>Risk profile<input name="risk" /></label><label>Recent activity<input name="activity" /></label></div><label>Investment policy notes<textarea name="policy" /></label><label>Prior meeting notes<textarea name="notes" /></label><label>Holdings, one per line<textarea name="holdings" placeholder="VTI, Vanguard Total Stock Market, Equity, 125000, 480" /></label><p className="form-note">Format: symbol, name, category, market value, quantity. No seeded or simulated records.</p><button className="button gold" type="submit">Create household</button></motion.form></motion.div>}</AnimatePresence></>;
}

function DraftButton({ household }: { household: Household }) {
  const { addDraft, actor, walletAddress } = useStewardlane();
  const [loading, setLoading] = useState(false);
  async function generate() {
    if (!walletAddress) return alert("Connect and verify a wallet before running the advisor agent pipeline.");
    setLoading(true);
    try {
      const response = await fetch("/api/draft", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ household }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      const id = uid(); const createdAt = new Date().toISOString(); const hash = await sha256(data.draft);
      addDraft({ id, householdId: household.id, kind: "meeting_prep", original: data.draft, reviewed: data.draft, status: "review_required", createdAt, agentReview: data.agentReview }, { id: uid(), draftId: id, householdId: household.id, action: "created", actor: `${actor} · ${walletAddress}`, timestamp: createdAt, contentHash: hash });
    } catch (error) { alert(error instanceof Error ? error.message : "Drafting failed"); } finally { setLoading(false); }
  }
  return <button className="small-button" onClick={generate} disabled={loading || household.holdings.length === 0}>{loading ? "Running two agents…" : "Run AI prep pipeline"}</button>;
}

function OperationsView({ selected }: { selected?: Household }) {
  const { tasks, households, addTask, toggleTask } = useStewardlane();
  const [title, setTitle] = useState(""); const [dueAt, setDueAt] = useState(""); const [kind, setKind] = useState<HouseholdTask["kind"]>("follow_up");
  if (!selected) return <Empty title="No household selected" copy="Create a household before scheduling meetings or follow-up work." />;
  const householdTasks = tasks.filter((task) => task.householdId === selected.id);
  return <div className="operations-grid"><section className="panel operations-form"><div className="panel-head"><div><p className="eyebrow">Household</p><h2>{selected.name}</h2></div></div><form onSubmit={(event) => { event.preventDefault(); if (!title || !dueAt) return; addTask({ id: uid(), householdId: selected.id, title, dueAt: new Date(dueAt).toISOString(), status: "open", kind, createdAt: new Date().toISOString() }); setTitle(""); setDueAt(""); }}><label>Task or meeting<input value={title} onChange={(event) => setTitle(event.target.value)} required /></label><label>Workflow type<select value={kind} onChange={(event) => setKind(event.target.value as HouseholdTask["kind"])}><option value="meeting">Client meeting</option><option value="follow_up">Follow-up</option><option value="suitability_review">Annual suitability review</option></select></label><label>Due date<input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} required /></label><button className="button dark" type="submit">Add to relationship timeline</button></form></section><section className="panel"><div className="panel-head"><h2>Open and completed work</h2></div>{householdTasks.length ? <div className="task-list">{householdTasks.map((task) => <motion.button layout key={task.id} className={task.status} onClick={() => toggleTask(task.id)}><span>{task.status === "complete" ? <CheckCircle2 /> : <span className="task-dot" />}</span><div><b>{task.title}</b><small>{task.kind.replaceAll("_", " ")} · {new Date(task.dueAt).toLocaleString()}</small></div></motion.button>)}</div> : <Empty title="No scheduled work" copy="Add a meeting, follow-up, or recurring suitability review." />}</section></div>;
}

function DraftQueue() {
  const { drafts, households, role, actor, walletAddress, reviewDraft } = useStewardlane();
  if (!drafts.length) return <Empty title="No drafts waiting" copy="Run the two-agent pipeline from a household with recorded holdings." />;
  return <div className="draft-stack">{drafts.map((draft) => <motion.article layout className="draft-card" key={draft.id}><div className="draft-banner"><span>AI draft · advisor review required</span><b>{draft.status.replaceAll("_", " ")}</b></div><div className="draft-meta"><span>{households.find((household) => household.id === draft.householdId)?.name}</span><time>{new Date(draft.createdAt).toLocaleString()}</time></div>{draft.agentReview && <div className={`agent-review ${draft.agentReview.verdict}`}><div><ShieldCheck /><b>Compliance agent: {draft.agentReview.verdict}</b></div><p>{draft.agentReview.summary}</p><ul>{draft.agentReview.checks.map((check) => <li key={check.label}><span>{check.status === "pass" ? <Check /> : <FileWarning />}{check.label}</span><small>{check.evidence}</small></li>)}</ul></div>}<ReviewEditor draft={draft} canReview={role === "advisor" && Boolean(walletAddress)} actor={`${actor}${walletAddress ? ` · ${walletAddress}` : ""}`} reviewDraft={reviewDraft} /></motion.article>)}</div>;
}

function ReviewEditor({ draft, canReview, actor, reviewDraft }: { draft: CommentaryDraft; canReview: boolean; actor: string; reviewDraft: ReturnType<typeof useStewardlane.getState>["reviewDraft"] }) {
  const [text, setText] = useState(draft.reviewed); const risks = findRecommendationRisk(text);
  async function decide(status: "approved" | "discarded") { if (!canReview) return alert("Advisor approval requires a verified wallet session."); if (status === "approved" && risks.length) return alert("Recommendation-like language must be removed before approval."); const timestamp = new Date().toISOString(); reviewDraft(draft.id, status, text, { id: uid(), draftId: draft.id, householdId: draft.householdId, action: status, actor, timestamp, contentHash: await sha256(text) }); }
  return <><textarea className="draft-editor" value={text} onChange={(event) => setText(event.target.value)} disabled={!canReview || draft.status !== "review_required"} />{risks.length > 0 && <p className="risk"><FileWarning />Deterministic recommendation guard detected restricted phrasing.</p>}<div className="draft-actions"><span>Original model output remains preserved. Approval is signed to the verified wallet identity.</span>{draft.status === "review_required" && <div><button onClick={() => decide("discarded")}>Discard</button><button className="approve" onClick={() => decide("approved")} disabled={!canReview}>Approve as advisor</button></div>}</div></>;
}

function AuditLedger() {
  const { audit, households, addAudit, actor, walletAddress } = useStewardlane();
  async function anchor(event: AuditEvent) { try { if (!walletAddress) throw new Error("Connect and verify a wallet before anchoring."); const signature = await anchorHashWithWallet(event.contentHash); addAudit({ id: uid(), draftId: event.draftId, householdId: event.householdId, action: "anchored", actor: `${actor} · ${walletAddress}`, timestamp: new Date().toISOString(), contentHash: event.contentHash, transactionSignature: signature }); } catch (error) { alert(error instanceof Error ? error.message : "Anchoring failed"); } }
  return audit.length ? <div className="audit-list">{audit.map((event) => <article key={event.id}><div className="audit-icon">{event.action === "anchored" ? <Landmark /> : <CheckCircle2 />}</div><div><b>{event.action}</b><span>{households.find((household) => household.id === event.householdId)?.name} · {event.actor}</span><code>{event.contentHash.slice(0, 22)}…</code>{event.transactionSignature && <a target="_blank" rel="noreferrer" href={`https://explorer.solana.com/tx/${event.transactionSignature}?cluster=devnet`}>View confirmed devnet transaction</a>}</div><time>{new Date(event.timestamp).toLocaleString()}</time>{event.action === "approved" && !audit.some((item) => item.action === "anchored" && item.contentHash === event.contentHash) && <button onClick={() => anchor(event)}><Anchor />Sign & anchor</button>}</article>)}</div> : <Empty title="No audit events" copy="Draft creation, wallet-bound approval, discard, and devnet anchoring appear automatically." />;
}

function Restricted() { return <div className="restricted"><ShieldCheck /><h3>Holdings access restricted</h3><p>Associate mode can manage relationship operations but does not reveal full portfolio detail.</p></div>; }
function Empty({ title, copy }: { title: string; copy: string }) { return <div className="empty"><div /><h2>{title}</h2><p>{copy}</p></div>; }
