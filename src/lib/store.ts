"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuditEvent, CommentaryDraft, Household, Role } from "@/lib/types";
type State = { role: Role; actor: string; households: Household[]; drafts: CommentaryDraft[]; audit: AuditEvent[]; setIdentity: (role: Role, actor: string) => void; addHousehold: (household: Household) => void; addDraft: (draft: CommentaryDraft, event: AuditEvent) => void; reviewDraft: (draftId: string, status: "approved" | "discarded", reviewed: string, event: AuditEvent) => void; addAudit: (event: AuditEvent) => void };
export const useStewardlane = create<State>()(persist((set) => ({
  role: "advisor", actor: "Advisor", households: [], drafts: [], audit: [],
  setIdentity: (role, actor) => set({ role, actor: actor.trim() || "Team member" }),
  addHousehold: (household) => set((state) => ({ households: [...state.households, household] })),
  addDraft: (draft, event) => set((state) => ({ drafts: [draft, ...state.drafts], audit: [event, ...state.audit] })),
  reviewDraft: (draftId, status, reviewed, event) => set((state) => ({ drafts: state.drafts.map((draft) => draft.id === draftId ? { ...draft, status, reviewed, reviewedAt: event.timestamp, reviewer: event.actor } : draft), audit: [event, ...state.audit] })),
  addAudit: (event) => set((state) => ({ audit: [event, ...state.audit] })),
}), { name: "stewardlane-mvp" }));
