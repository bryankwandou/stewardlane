export type Role = "advisor" | "associate" | "compliance";
export type Holding = { id: string; symbol: string; name: string; category: "Equity" | "Fixed income" | "Cash" | "Alternative"; quantity: number; marketValue: number };
export type Household = { id: string; name: string; members: string[]; riskProfile: string; policyNotes: string; holdings: Holding[]; recentActivity: string; priorMeetingNotes: string; createdAt: string };
export type DraftStatus = "review_required" | "approved" | "discarded";
export type AgentReview = { verdict: "pass" | "review"; summary: string; flags: string[]; checks: { label: string; status: "pass" | "flag"; evidence: string }[] };
export type CommentaryDraft = { id: string; householdId: string; kind: "meeting_prep" | "portfolio_commentary"; original: string; reviewed: string; status: DraftStatus; createdAt: string; reviewedAt?: string; reviewer?: string; agentReview?: AgentReview };
export type AuditEvent = { id: string; draftId: string; householdId: string; action: "created" | "approved" | "discarded" | "anchored"; actor: string; timestamp: string; contentHash: string; transactionSignature?: string };
export type HouseholdTask = { id: string; householdId: string; title: string; dueAt: string; status: "open" | "complete"; kind: "meeting" | "follow_up" | "suitability_review"; createdAt: string; completedAt?: string };
